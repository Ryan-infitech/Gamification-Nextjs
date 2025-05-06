/**
 * Player Movement Handler
 * Manages real-time player movement in the game world
 */
const { executeDbOperation } = require("../../config/database");
const gameProgressService = require("../../services/gameProgressService");

/**
 * Handle player movement events
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - Client socket connection
 * @param {Map} connectedUsers - Map of connected users
 * @param {Map} areaUsers - Map of users in each area
 */
function playerMovementHandler(io, socket, connectedUsers, areaUsers) {
  const userData = connectedUsers.get(socket.id);
  if (!userData) return;

  /**
   * Handle player movement within an area
   */
  socket.on("player:move", async (data) => {
    try {
      const { position, animation } = data;
      const userData = connectedUsers.get(socket.id);

      if (!userData || !userData.areaId) return;

      // Update player position in memory
      userData.position = position;

      // Broadcast movement to other players in the same area
      socket.to(`area:${userData.areaId}`).emit("player:moved", {
        userId: userData.userId,
        position,
        animation,
      });

      // Update position in database (throttled to every 5 seconds)
      const now = Date.now();
      if (
        !userData.lastPositionUpdate ||
        now - userData.lastPositionUpdate > 5000
      ) {
        userData.lastPositionUpdate = now;

        // Use the service to update player position
        await gameProgressService.updatePlayerPosition(
          userData.userId,
          userData.areaId,
          position.x,
          position.y
        );
      }
    } catch (error) {
      console.error("Error handling player movement:", error);
    }
  });

  /**
   * Handle player changing areas
   */
  socket.on("player:changeArea", async (data) => {
    try {
      const { areaId, position, checkpoint } = data;
      const userData = connectedUsers.get(socket.id);

      if (!userData) return;

      const oldAreaId = userData.areaId;

      // Check if the area exists and player meets requirements
      const areaResult = await executeDbOperation(async (client) => {
        return await client
          .from("game_areas")
          .select("*")
          .eq("id", areaId)
          .single();
      });

      if (!areaResult.data) {
        socket.emit("player:error", { message: "Area not found" });
        return;
      }

      // Check if player is allowed to access this area
      const statsResult = await executeDbOperation(async (client) => {
        return await client
          .from("player_stats")
          .select("level")
          .eq("user_id", userData.userId)
          .single();
      });

      if (
        statsResult.data &&
        statsResult.data.level < areaResult.data.min_player_level
      ) {
        socket.emit("player:error", {
          message: `You need to be level ${areaResult.data.min_player_level} to enter this area`,
        });
        return;
      }

      // Leave old area if any
      if (oldAreaId) {
        // Remove from old area set
        const oldAreaSet = areaUsers.get(oldAreaId);
        if (oldAreaSet) {
          oldAreaSet.delete(userData.userId);

          // Notify others in old area
          socket.to(`area:${oldAreaId}`).emit("player:left", {
            userId: userData.userId,
          });

          // Leave old area room
          socket.leave(`area:${oldAreaId}`);

          // Remove area set if empty
          if (oldAreaSet.size === 0) {
            areaUsers.delete(oldAreaId);
          }
        }
      }

      // Join new area
      userData.areaId = areaId;
      userData.position = position;

      // Add to new area users
      if (!areaUsers.has(areaId)) {
        areaUsers.set(areaId, new Set());
      }
      areaUsers.get(areaId).add(userData.userId);

      // Join new area room
      socket.join(`area:${areaId}`);

      // Notify others in the new area
      socket.to(`area:${areaId}`).emit("player:joined", {
        userId: userData.userId,
        username: userData.username,
        position,
      });

      // Send list of players in this area to the player
      const playersInArea = Array.from(areaUsers.get(areaId))
        .filter((id) => id !== userData.userId) // Exclude self
        .map((id) => {
          const otherUserSocketId = Array.from(connectedUsers.entries()).find(
            ([_, data]) => data.userId === id
          )?.[0];

          if (otherUserSocketId) {
            const playerData = connectedUsers.get(otherUserSocketId);
            return {
              userId: id,
              username: playerData.username,
              position: playerData.position,
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null entries

      socket.emit("area:players", { areaId, players: playersInArea });

      // Update position in database
      await gameProgressService.updatePlayerPosition(
        userData.userId,
        areaId,
        position.x,
        position.y,
        checkpoint
      );

      // Confirm area change to player
      socket.emit("player:areaChanged", {
        areaId,
        name: areaResult.data.name,
        checkpoint,
      });
    } catch (error) {
      console.error("Error handling area change:", error);
      socket.emit("player:error", { message: "Failed to change area" });
    }
  });

  /**
   * Handle player checkpoint update
   */
  socket.on("player:checkpoint", async (data) => {
    try {
      const { checkpoint } = data;
      const userData = connectedUsers.get(socket.id);

      if (!userData || !userData.areaId) return;

      // Update checkpoint in database
      await gameProgressService.updatePlayerPosition(
        userData.userId,
        userData.areaId,
        userData.position.x,
        userData.position.y,
        checkpoint
      );

      // Confirm checkpoint saved
      socket.emit("player:checkpointSaved", { checkpoint });
    } catch (error) {
      console.error("Error handling checkpoint update:", error);
    }
  });
}

module.exports = playerMovementHandler;
