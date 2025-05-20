import {
  AuthenticatedSocket,
  GameNamespace,
  ConnectionManager,
  SocketEventHandlers,
  ClientEvents,
  ServerEvents,
  UserStatus,
} from "../../types/socket";
import logger from "../../config/logger";
import { notificationService } from "../../services/notificationService";
import { v4 as uuidv4 } from "uuid";
import { executeCode } from "../../utils/codeRunner";
import { supabase } from "../../config/database";

/**
 * Setup handlers untuk challenges
 * @param io - Socket.io server instance
 * @param connectionManager - Connection manager
 * @returns Socket event handlers
 */
export function setupChallengeHandlers(
  io: GameNamespace,
  connectionManager: ConnectionManager
): SocketEventHandlers {
  // Track active challenges per user
  const userActiveChallenges: Map<string, Set<string>> = new Map();

  // Track challenge groups
  const challengeGroups: Map<string, Set<string>> = new Map();

  // Save pending invitations (userId -> Map of invitationId -> invitation data)
  const pendingInvitations: Map<string, Map<string, any>> = new Map();

  // Handler ketika user connect
  const onConnection = (socket: AuthenticatedSocket) => {
    if (!socket.user) return;

    logger.debug(`Challenge handler: User ${socket.user.username} connected`);
  };

  // Handler ketika user disconnect
  const onDisconnect = (socket: AuthenticatedSocket) => {
    if (!socket.user) return;

    // Clean up challenge groups
    challengeGroups.forEach((users, groupId) => {
      if (users.has(socket.user!.id)) {
        users.delete(socket.user!.id);

        // If group is empty, remove it
        if (users.size === 0) {
          challengeGroups.delete(groupId);
        } else {
          // Notify other members that user left
          socket.to(`challenge:${groupId}`).emit("userLeftChallengeGroup", {
            userId: socket.user!.id,
            username: socket.user!.username,
            groupId,
          });
        }
      }
    });

    // Clean up active challenges
    const activeChallenges = userActiveChallenges.get(socket.user.id);
    if (activeChallenges) {
      userActiveChallenges.delete(socket.user.id);
    }
  };

  // Register all event handlers
  const registerHandlers = (socket: AuthenticatedSocket) => {
    if (!socket.user) return;

    // Handler for starting a challenge
    socket.on("startChallenge", async (data: ClientEvents.StartChallenge) => {
      socket.lastActivity = new Date();

      const { challengeId } = data;

      // Initialize active challenges for this user if needed
      if (!userActiveChallenges.has(socket.user.id)) {
        userActiveChallenges.set(socket.user.id, new Set());
      }

      // Add challenge to active challenges
      userActiveChallenges.get(socket.user.id)!.add(challengeId);

      // Update user status
      socket.status = UserStatus.IN_CHALLENGE;

      // Broadcast to friends or team members if needed
      io.to(`user:${socket.user.id}:friends`).emit("challengeStarted", {
        userId: socket.user.id,
        username: socket.user.username,
        challengeId,
        timestamp: new Date().toISOString(),
      } as ServerEvents.ChallengeStarted);

      logger.debug(
        `User ${socket.user.username} started challenge ${challengeId}`
      );

      // Get challenge details from database
      try {
        const { data: challenge, error } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single();

        if (error) {
          throw error;
        }

        // Emit challenge details to user
        socket.emit("challengeDetails", {
          challengeId,
          ...challenge,
        });
      } catch (error) {
        logger.error("Error fetching challenge details", {
          error,
          challengeId,
        });

        socket.emit("systemMessage", {
          message: "Failed to load challenge details. Please try again.",
          type: "error",
          timestamp: new Date().toISOString(),
        } as ServerEvents.SystemMessage);
      }
    });

    // Handler for submitting challenge
    socket.on("submitChallenge", async (data: ClientEvents.SubmitChallenge) => {
      socket.lastActivity = new Date();
      const startTime = Date.now();

      const { challengeId, solution, language } = data;

      // Validate if user is working on this challenge
      const activeChallenges = userActiveChallenges.get(socket.user.id);
      if (!activeChallenges?.has(challengeId)) {
        socket.emit("systemMessage", {
          message:
            "You must start this challenge before submitting a solution.",
          type: "warning",
          timestamp: new Date().toISOString(),
        } as ServerEvents.SystemMessage);
        return;
      }

      logger.debug(
        `User ${socket.user.username} submitted solution for challenge ${challengeId}`
      );

      // This would typically make a call to the code evaluation service
      // For simplicity, we'll use the executeCode utility directly
      // In a real implementation, this would go through a more complete evaluation pipeline
      try {
        // In a real implementation, we would fetch test cases from the database
        // and run them against the user's solution
        const executionResult = await executeCode({
          code: solution,
          language,
          input: "",
          timeLimit: 5000,
          memoryLimit: 50,
        });

        const executionTime = Date.now() - startTime;

        // For demo purposes, we'll simulate a success evaluation
        const success = !executionResult.error;

        // If successful, remove from active challenges
        if (success) {
          activeChallenges.delete(challengeId);

          // If no more active challenges, update status
          if (activeChallenges.size === 0) {
            socket.status = UserStatus.ONLINE;
          }

          // Broadcast completion to friends or team
          io.to(`user:${socket.user.id}:friends`).emit("challengeCompleted", {
            userId: socket.user.id,
            username: socket.user.username,
            challengeId,
            score: 100, // Fixed score for demo
            timeTaken: Math.floor(executionTime / 1000),
            timestamp: new Date().toISOString(),
          } as ServerEvents.ChallengeCompleted);

          // Send notification
          await notificationService.sendNotification({
            user_id: socket.user.id,
            type: "challenge_complete",
            title: "Challenge Completed",
            message: `You've successfully completed challenge: ${challengeId}`,
            data: {
              challengeId,
              score: 100,
            },
          });
        }

        // Send result to user
        socket.emit("challengeResult", {
          challengeId,
          success,
          executionResult,
          executionTime,
          feedback: success
            ? "Great job! Your solution passed all tests."
            : "Your solution encountered errors. Please try again.",
        });
      } catch (error) {
        logger.error("Error evaluating challenge solution", {
          error,
          challengeId,
        });

        socket.emit("systemMessage", {
          message: "Failed to evaluate solution. Please try again.",
          type: "error",
          timestamp: new Date().toISOString(),
        } as ServerEvents.SystemMessage);
      }
    });

    // Handler for joining a challenge group
    socket.on("joinChallengeGroup", (data: ClientEvents.JoinChallengeGroup) => {
      socket.lastActivity = new Date();

      const { groupId } = data;
      const roomId = `challenge:${groupId}`;

      // Join the group room
      socket.join(roomId);

      // Initialize group if it doesn't exist
      if (!challengeGroups.has(groupId)) {
        challengeGroups.set(groupId, new Set());
      }

      // Add user to group
      challengeGroups.get(groupId)!.add(socket.user.id);

      // Get all users in the group
      const users = Array.from(challengeGroups.get(groupId) || []);

      // Notify others in the group
      socket.to(roomId).emit("userJoinedChallengeGroup", {
        userId: socket.user.id,
        username: socket.user.username,
        groupId,
      });

      // Send user list to joining user
      socket.emit("challengeGroupMembers", {
        groupId,
        users,
      });

      logger.debug(
        `User ${socket.user.username} joined challenge group ${groupId}`
      );
    });

    // Handler for leaving a challenge group
    socket.on(
      "leaveChallengeGroup",
      (data: ClientEvents.LeaveChallengeGroup) => {
        socket.lastActivity = new Date();

        const { groupId } = data;
        const roomId = `challenge:${groupId}`;

        // Leave the group room
        socket.leave(roomId);

        // Remove user from group
        const group = challengeGroups.get(groupId);
        if (group) {
          group.delete(socket.user.id);

          // If group is empty, delete it
          if (group.size === 0) {
            challengeGroups.delete(groupId);
          } else {
            // Notify others in the group
            socket.to(roomId).emit("userLeftChallengeGroup", {
              userId: socket.user.id,
              username: socket.user.username,
              groupId,
            });
          }
        }

        logger.debug(
          `User ${socket.user.username} left challenge group ${groupId}`
        );
      }
    );

    // Handler for inviting a user to a challenge
    socket.on(
      "inviteToChallenge",
      async (data: ClientEvents.InviteToChallenge) => {
        socket.lastActivity = new Date();

        const { challengeId, userId } = data;

        // Check if the invitee is online
        if (!connectionManager.isUserOnline(userId)) {
          socket.emit("systemMessage", {
            message:
              "User is not online. They will receive an invitation when they return.",
            type: "info",
            timestamp: new Date().toISOString(),
          } as ServerEvents.SystemMessage);
        }

        try {
          // Get challenge details
          const { data: challenge, error } = await supabase
            .from("challenges")
            .select("title")
            .eq("id", challengeId)
            .single();

          if (error) {
            throw error;
          }

          // Create invitation
          const invitation: ServerEvents.ChallengeInvitation = {
            from: {
              id: socket.user.id,
              username: socket.user.username,
            },
            challengeId,
            challengeName: challenge.title,
            expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
          };

          // Store invitation
          if (!pendingInvitations.has(userId)) {
            pendingInvitations.set(userId, new Map());
          }

          const invitationId = uuidv4();
          pendingInvitations.get(userId)!.set(invitationId, {
            ...invitation,
            id: invitationId,
          });

          // Send invitation to user
          const recipientSockets = connectionManager.getUserSockets(userId);
          recipientSockets.forEach((socketId) => {
            io.to(socketId).emit("challengeInvitation", {
              ...invitation,
              id: invitationId,
            });
          });

          // Also send notification
          await notificationService.sendNotification({
            user_id: userId,
            type: "challenge_invitation",
            title: "Challenge Invitation",
            message: `${socket.user.username} has invited you to take the "${challenge.title}" challenge!`,
            data: {
              challengeId,
              inviterId: socket.user.id,
              inviterName: socket.user.username,
              invitationId,
            },
          });

          // Confirm to sender
          socket.emit("invitationSent", {
            success: true,
            userId,
            challengeId,
          });

          logger.debug(
            `User ${socket.user.username} invited user ${userId} to challenge ${challengeId}`
          );
        } catch (error) {
          logger.error("Error sending challenge invitation", {
            error,
            challengeId,
            userId,
          });

          socket.emit("systemMessage", {
            message: "Failed to send invitation. Please try again.",
            type: "error",
            timestamp: new Date().toISOString(),
          } as ServerEvents.SystemMessage);
        }
      }
    );

    // Handler for accepting a challenge invitation
    socket.on("acceptChallengeInvitation", (data: { invitationId: string }) => {
      socket.lastActivity = new Date();

      const { invitationId } = data;
      const userId = socket.user.id;

      // Check if invitation exists
      const userInvitations = pendingInvitations.get(userId);
      if (!userInvitations || !userInvitations.has(invitationId)) {
        socket.emit("systemMessage", {
          message: "Invitation not found or has expired.",
          type: "error",
          timestamp: new Date().toISOString(),
        } as ServerEvents.SystemMessage);
        return;
      }

      const invitation = userInvitations.get(invitationId);

      // Remove invitation
      userInvitations.delete(invitationId);
      if (userInvitations.size === 0) {
        pendingInvitations.delete(userId);
      }

      // Notify the inviter if they're online
      const inviterSockets = connectionManager.getUserSockets(
        invitation.from.id
      );
      inviterSockets.forEach((socketId) => {
        io.to(socketId).emit("challengeInvitationAccepted", {
          invitationId,
          userId: socket.user.id,
          username: socket.user.username,
          challengeId: invitation.challengeId,
        });
      });

      // Create or join a challenge group for both users
      const groupId = `${invitation.challengeId}-${uuidv4().substring(0, 8)}`;

      // Auto-join both users to group (will trigger the joinChallengeGroup handler)
      socket.emit("autoJoinChallengeGroup", {
        groupId,
        challengeId: invitation.challengeId,
      });

      inviterSockets.forEach((socketId) => {
        io.to(socketId).emit("autoJoinChallengeGroup", {
          groupId,
          challengeId: invitation.challengeId,
        });
      });

      logger.debug(
        `User ${socket.user.username} accepted challenge invitation from ${invitation.from.username}`
      );
    });

    // Handler for declining a challenge invitation
    socket.on(
      "declineChallengeInvitation",
      (data: { invitationId: string }) => {
        socket.lastActivity = new Date();

        const { invitationId } = data;
        const userId = socket.user.id;

        // Check if invitation exists
        const userInvitations = pendingInvitations.get(userId);
        if (!userInvitations || !userInvitations.has(invitationId)) {
          return; // Silently ignore
        }

        const invitation = userInvitations.get(invitationId);

        // Remove invitation
        userInvitations.delete(invitationId);
        if (userInvitations.size === 0) {
          pendingInvitations.delete(userId);
        }

        // Notify the inviter if they're online
        const inviterSockets = connectionManager.getUserSockets(
          invitation.from.id
        );
        inviterSockets.forEach((socketId) => {
          io.to(socketId).emit("challengeInvitationDeclined", {
            invitationId,
            userId: socket.user.id,
            username: socket.user.username,
            challengeId: invitation.challengeId,
          });
        });

        logger.debug(
          `User ${socket.user.username} declined challenge invitation from ${invitation.from.username}`
        );
      }
    );
  };

  return {
    onConnection,
    onDisconnect,
    registerHandlers,
  };
}
