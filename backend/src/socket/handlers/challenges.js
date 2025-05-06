/**
 * Challenge Handler
 * Manages real-time challenge interactions and updates
 */
const { executeDbOperation } = require("../../config/database");
const gameProgressService = require("../../services/gameProgressService");

/**
 * Handle challenge events
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Client socket connection
 * @param {Map} connectedUsers - Map of connected users
 */
function challengeHandler(io, socket, connectedUsers) {
  const userData = connectedUsers.get(socket.id);
  if (!userData) return;

  /**
   * Handle starting a challenge
   */
  socket.on("challenge:start", async (data) => {
    try {
      const { challengeId } = data;
      const userData = connectedUsers.get(socket.id);

      if (!userData) return;

      // Check if challenge exists
      const challengeResult = await executeDbOperation(async (client) => {
        return await client
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single();
      });

      if (!challengeResult.data) {
        socket.emit("challenge:error", { message: "Challenge not found" });
        return;
      }

      // Track attempt in database
      await gameProgressService.trackChallengeAttempt(
        userData.userId,
        challengeId
      );

      // Join challenge-specific room
      socket.join(`challenge:${challengeId}`);

      // Inform player that challenge has started
      socket.emit("challenge:started", {
        challenge: challengeResult.data,
        startTime: new Date().toISOString(),
      });

      // Let others in the area know this player started a challenge
      if (userData.areaId) {
        socket.to(`area:${userData.areaId}`).emit("challenge:playerStarted", {
          userId: userData.userId,
          username: userData.username,
          challengeId,
          challengeName: challengeResult.data.title,
        });
      }
    } catch (error) {
      console.error("Error starting challenge:", error);
      socket.emit("challenge:error", { message: "Failed to start challenge" });
    }
  });

  /**
   * Handle challenge completion
   */
  socket.on("challenge:complete", async (data) => {
    try {
      const { challengeId, score, timeTaken } = data;
      const userData = connectedUsers.get(socket.id);

      if (!userData) return;

      // Get challenge details
      const challengeResult = await executeDbOperation(async (client) => {
        return await client
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single();
      });

      if (!challengeResult.data) {
        socket.emit("challenge:error", { message: "Challenge not found" });
        return;
      }

      // Leave challenge-specific room
      socket.leave(`challenge:${challengeId}`);

      // Get recent submission from database to verify
      const submissionResult = await executeDbOperation(async (client) => {
        return await client
          .from("code_submissions")
          .select("*")
          .eq("user_id", userData.userId)
          .eq("challenge_id", challengeId)
          .eq("passed", true)
          .order("submission_date", { ascending: false })
          .limit(1)
          .single();
      });

      // If we found a valid submission, notify about success
      if (submissionResult.data) {
        // Broadcast achievement to area if any
        if (userData.areaId) {
          // Get any earned achievements
          const achievementsResult = await executeDbOperation(
            async (client) => {
              return await client
                .from("user_achievements")
                .select("*, achievements(*)")
                .eq("user_id", userData.userId)
                .order("awarded_at", { ascending: false })
                .limit(3); // Get most recent 3 achievements
            }
          );

          if (achievementsResult.data && achievementsResult.data.length > 0) {
            // Find achievements awarded in the last minute
            const now = new Date();
            const recentAchievements = achievementsResult.data.filter((a) => {
              const awardDate = new Date(a.awarded_at);
              return now - awardDate < 60000; // Less than 1 minute old
            });

            if (recentAchievements.length > 0) {
              socket
                .to(`area:${userData.areaId}`)
                .emit("achievement:unlocked", {
                  userId: userData.userId,
                  username: userData.username,
                  achievements: recentAchievements.map((a) => ({
                    id: a.achievement_id,
                    title: a.achievements.title,
                    description: a.achievements.description,
                    badgeImageUrl: a.achievements.badge_image_url,
                  })),
                });
            }
          }

          // Notify users in the area about challenge completion
          socket
            .to(`area:${userData.areaId}`)
            .emit("challenge:playerCompleted", {
              userId: userData.userId,
              username: userData.username,
              challengeId,
              challengeName: challengeResult.data.title,
              score: submissionResult.data.score,
            });
        }
      }
    } catch (error) {
      console.error("Error completing challenge:", error);
      socket.emit("challenge:error", {
        message: "Failed to process challenge completion",
      });
    }
  });

  /**
   * Handle real-time collaboration on challenges
   */
  socket.on("challenge:collaborate", async (data) => {
    try {
      const { challengeId, collaboratorId, action } = data;
      const userData = connectedUsers.get(socket.id);

      if (!userData) return;

      // Find the collaborator's socket
      const collaboratorSocketEntries = Array.from(
        connectedUsers.entries()
      ).filter(([_, data]) => data.userId === collaboratorId);

      if (collaboratorSocketEntries.length === 0) {
        socket.emit("challenge:error", {
          message: "Collaborator is not online",
        });
        return;
      }

      // Handle different collaboration actions
      switch (action) {
        case "invite":
          // Send invitation to collaborator
          for (const [collaboratorSocketId] of collaboratorSocketEntries) {
            io.to(collaboratorSocketId).emit("challenge:collaborationInvite", {
              challengeId,
              inviterId: userData.userId,
              inviterName: userData.username,
            });
          }
          break;

        case "accept":
          // Add both users to a collaboration room
          const collaborationRoom = `collaboration:${challengeId}:${userData.userId}:${collaboratorId}`;
          socket.join(collaborationRoom);

          for (const [collaboratorSocketId] of collaboratorSocketEntries) {
            io.sockets.sockets
              .get(collaboratorSocketId)
              ?.join(collaborationRoom);

            // Notify collaborator that invitation was accepted
            io.to(collaboratorSocketId).emit(
              "challenge:collaborationAccepted",
              {
                challengeId,
                accepterId: userData.userId,
                accepterName: userData.username,
              }
            );
          }
          break;

        case "code":
          // Share code changes with collaborator
          const { code } = data;
          const collaborationRoom = `collaboration:${challengeId}:${userData.userId}:${collaboratorId}`;
          socket.to(collaborationRoom).emit("challenge:codeUpdate", {
            challengeId,
            senderId: userData.userId,
            senderName: userData.username,
            code,
          });
          break;

        case "end":
          // End the collaboration session
          const endRoom = `collaboration:${challengeId}:${userData.userId}:${collaboratorId}`;
          socket.leave(endRoom);

          for (const [collaboratorSocketId] of collaboratorSocketEntries) {
            io.sockets.sockets.get(collaboratorSocketId)?.leave(endRoom);

            // Notify collaborator that session ended
            io.to(collaboratorSocketId).emit("challenge:collaborationEnded", {
              challengeId,
              endedBy: userData.userId,
              endedByName: userData.username,
            });
          }
          break;
      }
    } catch (error) {
      console.error("Error in challenge collaboration:", error);
      socket.emit("challenge:error", {
        message: "Failed to process collaboration action",
      });
    }
  });
}

module.exports = challengeHandler;
