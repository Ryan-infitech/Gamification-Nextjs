import {
  AuthenticatedSocket,
  GameNamespace,
  ConnectionManager,
  SocketEventHandlers,
  ClientEvents,
  ServerEvents,
} from "../../types/socket";
import logger from "../../config/logger";
import { supabase } from "../../config/database";
import { v4 as uuidv4 } from "uuid";

/**
 * Setup handlers untuk chat
 * @param io - Socket.io server instance
 * @param connectionManager - Connection manager
 * @returns Socket event handlers
 */
export function setupChatHandlers(
  io: GameNamespace,
  connectionManager: ConnectionManager
): SocketEventHandlers {
  // Track users typing in each room
  const usersTyping: Map<string, Set<string>> = new Map();

  // Handler ketika user connect
  const onConnection = (socket: AuthenticatedSocket) => {
    if (!socket.user) return;

    logger.debug(`Chat handler: User ${socket.user.username} connected`);

    // Join global chat automatically
    socket.join("chat:global");
    socket.joinedRooms.add("chat:global");

    // Notify others in global chat
    socket.to("chat:global").emit("userJoinedRoom", {
      userId: socket.user.id,
      username: socket.user.username,
      roomId: "global",
      timestamp: new Date().toISOString(),
    } as ServerEvents.UserJoinedRoom);
  };

  // Handler ketika user disconnect
  const onDisconnect = (socket: AuthenticatedSocket) => {
    if (!socket.user) return;

    // Remove user from typing tracking in all rooms
    usersTyping.forEach((users, roomId) => {
      if (users.has(socket.user!.id)) {
        users.delete(socket.user!.id);

        // Broadcast stopped typing
        socket.to(`chat:${roomId}`).emit("userStoppedTyping", {
          userId: socket.user!.id,
          roomId,
        } as ServerEvents.UserStoppedTyping);
      }
    });

    // Notify users in joined rooms that this user left
    socket.joinedRooms.forEach((room) => {
      if (room.startsWith("chat:")) {
        const roomId = room.replace("chat:", "");

        socket.to(room).emit("userLeftRoom", {
          userId: socket.user!.id,
          username: socket.user!.username,
          roomId,
          timestamp: new Date().toISOString(),
        } as ServerEvents.UserLeftRoom);
      }
    });
  };

  // Register all event handlers
  const registerHandlers = (socket: AuthenticatedSocket) => {
    if (!socket.user) return;

    // Handler for joining a chat room
    socket.on("joinChatRoom", async (data: ClientEvents.JoinChatRoom) => {
      socket.lastActivity = new Date();

      const roomId = data.roomId;
      const roomSocketId = `chat:${roomId}`;

      // Join the socket.io room
      socket.join(roomSocketId);
      socket.joinedRooms.add(roomSocketId);

      // Notify others in the room
      socket.to(roomSocketId).emit("userJoinedRoom", {
        userId: socket.user.id,
        username: socket.user.username,
        roomId,
        timestamp: new Date().toISOString(),
      } as ServerEvents.UserJoinedRoom);

      // Fetch recent messages
      try {
        const { data: messages, error } = await supabase
          .from("chat_messages")
          .select("*, users(id, username, avatar_url)")
          .eq("room_id", roomId)
          .order("sent_at", { ascending: false })
          .limit(50);

        if (error) {
          throw error;
        }

        // Send recent messages to the user
        socket.emit("recentMessages", {
          roomId,
          messages: messages.map((msg) => ({
            id: msg.id,
            content: msg.message,
            sender: {
              id: msg.user_id,
              username: msg.users.username,
              avatar: msg.users.avatar_url,
            },
            roomId: msg.room_id,
            isPrivate: msg.is_system_message
              ? false
              : !!msg.metadata?.isPrivate,
            timestamp: msg.sent_at,
            metadata: msg.metadata,
          })),
        });
      } catch (error) {
        logger.error("Error fetching chat messages", {
          error,
          roomId,
          userId: socket.user.id,
        });

        socket.emit("systemMessage", {
          message: "Failed to load chat history. Please try again.",
          type: "error",
          timestamp: new Date().toISOString(),
        } as ServerEvents.SystemMessage);
      }

      logger.debug(`User ${socket.user.username} joined chat room ${roomId}`);
    });

    // Handler for leaving a chat room
    socket.on("leaveChatRoom", (data: ClientEvents.LeaveChatRoom) => {
      socket.lastActivity = new Date();

      const roomId = data.roomId;
      const roomSocketId = `chat:${roomId}`;

      // Leave the socket.io room
      socket.leave(roomSocketId);
      socket.joinedRooms.delete(roomSocketId);

      // Notify others in the room
      socket.to(roomSocketId).emit("userLeftRoom", {
        userId: socket.user.id,
        username: socket.user.username,
        roomId,
        timestamp: new Date().toISOString(),
      } as ServerEvents.UserLeftRoom);

      // Remove from typing tracking
      const typingUsers = usersTyping.get(roomId);
      if (typingUsers?.has(socket.user.id)) {
        typingUsers.delete(socket.user.id);

        socket.to(roomSocketId).emit("userStoppedTyping", {
          userId: socket.user.id,
          roomId,
        } as ServerEvents.UserStoppedTyping);
      }

      logger.debug(`User ${socket.user.username} left chat room ${roomId}`);
    });

    // Handler for sending a message
    socket.on("sendMessage", async (data: ClientEvents.SendMessage) => {
      socket.lastActivity = new Date();

      if (!socket.user) return;

      const { content, roomId, isPrivate, recipientId } = data;

      // Validate message content
      if (!content.trim()) {
        return;
      }

      // Create message record
      const messageId = uuidv4();
      const timestamp = new Date().toISOString();

      try {
        // Save to database
        const { error } = await supabase.from("chat_messages").insert({
          id: messageId,
          user_id: socket.user.id,
          room_id: roomId,
          message: content,
          sent_at: timestamp,
          is_system_message: false,
          metadata: {
            isPrivate,
            recipientId,
          },
        });

        if (error) {
          throw error;
        }

        // Create message object
        const message: ServerEvents.ReceiveMessage = {
          id: messageId,
          content,
          sender: {
            id: socket.user.id,
            username: socket.user.username,
          },
          roomId,
          isPrivate: !!isPrivate,
          timestamp,
        };

        // Handle private message
        if (isPrivate && recipientId) {
          // Send to recipient only
          const recipientSockets =
            connectionManager.getUserSockets(recipientId);

          if (recipientSockets.length > 0) {
            recipientSockets.forEach((socketId) => {
              io.to(socketId).emit("receiveMessage", message);
            });
          }

          // Send back to sender
          socket.emit("receiveMessage", message);
        } else {
          // Send to the chat room
          io.to(`chat:${roomId}`).emit("receiveMessage", message);
        }

        // Remove from typing list
        const typingUsers = usersTyping.get(roomId);
        if (typingUsers?.has(socket.user.id)) {
          typingUsers.delete(socket.user.id);

          socket.to(`chat:${roomId}`).emit("userStoppedTyping", {
            userId: socket.user.id,
            roomId,
          } as ServerEvents.UserStoppedTyping);
        }
      } catch (error) {
        logger.error("Error sending chat message", {
          error,
          userId: socket.user.id,
          roomId,
        });

        socket.emit("systemMessage", {
          message: "Failed to send message. Please try again.",
          type: "error",
          timestamp: new Date().toISOString(),
        } as ServerEvents.SystemMessage);
      }
    });

    // Handler for typing indicator
    socket.on("startTyping", (data: ClientEvents.StartTyping) => {
      if (!socket.user) return;

      const roomId = data.roomId;

      // Initialize typing users set for this room if needed
      if (!usersTyping.has(roomId)) {
        usersTyping.set(roomId, new Set());
      }

      // Add user to typing set
      usersTyping.get(roomId)!.add(socket.user.id);

      // Broadcast typing indicator to others in the room
      socket.to(`chat:${roomId}`).emit("userTyping", {
        userId: socket.user.id,
        username: socket.user.username,
        roomId,
      } as ServerEvents.UserTyping);
    });

    // Handler for stopping typing
    socket.on("stopTyping", (data: ClientEvents.StopTyping) => {
      if (!socket.user) return;

      const roomId = data.roomId;

      // Remove user from typing set
      const typingUsers = usersTyping.get(roomId);
      if (typingUsers?.has(socket.user.id)) {
        typingUsers.delete(socket.user.id);

        // Broadcast stopped typing to others in the room
        socket.to(`chat:${roomId}`).emit("userStoppedTyping", {
          userId: socket.user.id,
          roomId,
        } as ServerEvents.UserStoppedTyping);
      }
    });
  };

  return {
    onConnection,
    onDisconnect,
    registerHandlers,
  };
}
