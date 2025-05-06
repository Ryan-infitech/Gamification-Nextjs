/**
 * Chat Handler
 * Manages real-time chat messaging between players
 */
const { executeDbOperation } = require("../../config/database");

/**
 * Handle chat message events
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Client socket connection
 * @param {Map} connectedUsers - Map of connected users
 * @param {Map} areaUsers - Map of users in each area
 */
function chatHandler(io, socket, connectedUsers, areaUsers) {
  const userData = connectedUsers.get(socket.id);
  if (!userData) return;

  /**
   * Handle global chat messages
   */
  socket.on("chat:global", async (data) => {
    try {
      const { message } = data;
      const userData = connectedUsers.get(socket.id);

      if (!userData) return;

      // Rate limiting: 1 message per second
      const now = Date.now();
      if (
        userData.lastGlobalMessage &&
        now - userData.lastGlobalMessage < 1000
      ) {
        socket.emit("chat:error", {
          message: "Please wait before sending another message",
        });
        return;
      }
      userData.lastGlobalMessage = now;

      // Basic content moderation
      const cleanMessage = message.trim().substring(0, 500); // Limit message length
      if (!cleanMessage) return;

      // Store in database
      const result = await executeDbOperation(async (client) => {
        return await client
          .from("chat_messages")
          .insert({
            sender_id: userData.userId,
            message: cleanMessage,
            is_global: true,
          })
          .select("*")
          .single();
      });

      if (result.error) {
        socket.emit("chat:error", { message: "Failed to send message" });
        return;
      }

      // Broadcast to all connected users
      io.emit("chat:message", {
        id: result.data.id,
        senderId: userData.userId,
        senderName: userData.username,
        message: cleanMessage,
        isGlobal: true,
        timestamp: result.data.sent_at,
      });
    } catch (error) {
      console.error("Error handling global chat:", error);
      socket.emit("chat:error", { message: "Error sending message" });
    }
  });

  /**
   * Handle area chat messages
   */
  socket.on("chat:area", async (data) => {
    try {
      const { message } = data;
      const userData = connectedUsers.get(socket.id);

      if (!userData || !userData.areaId) {
        socket.emit("chat:error", {
          message: "You must be in an area to send area messages",
        });
        return;
      }

      // Rate limiting: 1 message per second
      const now = Date.now();
      if (userData.lastAreaMessage && now - userData.lastAreaMessage < 1000) {
        socket.emit("chat:error", {
          message: "Please wait before sending another message",
        });
        return;
      }
      userData.lastAreaMessage = now;

      // Basic content moderation
      const cleanMessage = message.trim().substring(0, 500);
      if (!cleanMessage) return;

      // Store in database
      const result = await executeDbOperation(async (client) => {
        return await client
          .from("chat_messages")
          .insert({
            sender_id: userData.userId,
            message: cleanMessage,
            is_global: false,
            area_id: userData.areaId,
          })
          .select("*")
          .single();
      });

      if (result.error) {
        socket.emit("chat:error", { message: "Failed to send message" });
        return;
      }

      // Broadcast to all users in the same area
      io.to(`area:${userData.areaId}`).emit("chat:message", {
        id: result.data.id,
        senderId: userData.userId,
        senderName: userData.username,
        message: cleanMessage,
        isGlobal: false,
        areaId: userData.areaId,
        timestamp: result.data.sent_at,
      });
    } catch (error) {
      console.error("Error handling area chat:", error);
      socket.emit("chat:error", { message: "Error sending message" });
    }
  });

  /**
   * Handle private messages
   */
  socket.on("chat:private", async (data) => {
    try {
      const { receiverId, message } = data;
      const userData = connectedUsers.get(socket.id);

      if (!userData) return;
      if (userData.userId === receiverId) {
        socket.emit("chat:error", {
          message: "You cannot send messages to yourself",
        });
        return;
      }

      // Rate limiting: 1 message per second per recipient
      const now = Date.now();
      const pmKey = `pm:${receiverId}`;
      if (userData[pmKey] && now - userData[pmKey] < 1000) {
        socket.emit("chat:error", {
          message: "Please wait before sending another message",
        });
        return;
      }
      userData[pmKey] = now;

      // Basic content moderation
      const cleanMessage = message.trim().substring(0, 500);
      if (!cleanMessage) return;

      // Check if receiver exists
      const userResult = await executeDbOperation(async (client) => {
        return await client
          .from("users")
          .select("username")
          .eq("id", receiverId)
          .single();
      });

      if (!userResult.data) {
        socket.emit("chat:error", { message: "Recipient not found" });
        return;
      }

      // Store in database
      const result = await executeDbOperation(async (client) => {
        return await client
          .from("chat_messages")
          .insert({
            sender_id: userData.userId,
            receiver_id: receiverId,
            message: cleanMessage,
            is_global: false,
          })
          .select("*")
          .single();
      });

      if (result.error) {
        socket.emit("chat:error", { message: "Failed to send message" });
        return;
      }

      // Create chat message object
      const chatMessage = {
        id: result.data.id,
        senderId: userData.userId,
        senderName: userData.username,
        receiverId,
        receiverName: userResult.data.username,
        message: cleanMessage,
        isPrivate: true,
        timestamp: result.data.sent_at,
      };

      // Send to sender
      socket.emit("chat:message", chatMessage);

      // Send to receiver if online
      const receiverSocketEntries = Array.from(connectedUsers.entries()).filter(
        ([_, data]) => data.userId === receiverId
      );

      for (const [receiverSocketId] of receiverSocketEntries) {
        io.to(receiverSocketId).emit("chat:message", chatMessage);
      }
    } catch (error) {
      console.error("Error handling private chat:", error);
      socket.emit("chat:error", { message: "Error sending message" });
    }
  });

  /**
   * Handle typing indicators
   */
  socket.on("chat:typing", (data) => {
    try {
      const { isTyping, to, isAreaChat } = data;
      const userData = connectedUsers.get(socket.id);

      if (!userData) return;

      if (isAreaChat && userData.areaId) {
        // Area typing indicator
        socket.to(`area:${userData.areaId}`).emit("chat:typing", {
          userId: userData.userId,
          username: userData.username,
          isTyping,
          isAreaChat: true,
        });
      } else if (to) {
        // Private typing indicator
        const receiverSocketEntries = Array.from(
          connectedUsers.entries()
        ).filter(([_, data]) => data.userId === to);

        for (const [receiverSocketId] of receiverSocketEntries) {
          io.to(receiverSocketId).emit("chat:typing", {
            userId: userData.userId,
            username: userData.username,
            isTyping,
            isPrivate: true,
          });
        }
      }
    } catch (error) {
      console.error("Error handling typing indicator:", error);
    }
  });
}

module.exports = chatHandler;
