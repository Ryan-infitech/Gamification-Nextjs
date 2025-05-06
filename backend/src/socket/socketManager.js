/**
 * Socket Manager
 * Initializes and manages Socket.io connections
 */
const { Server } = require("socket.io");
const { authenticate } = require("../middleware/auth");
const { executeDbOperation } = require("../config/database");
const playerMovementHandler = require("./handlers/playerMovement");
const chatHandler = require("./handlers/chat");
const challengeHandler = require("./handlers/challenges");

// Connected users map: socket ID → { userId, username, areaId }
const connectedUsers = new Map();

// Authenticated users map: userId → socket ID
const authenticatedUsers = new Map();

// Area users map: areaId → Set of userIds
const areaUsers = new Map();

/**
 * Initialize Socket.io server
 * @param {Object} httpServer - HTTP server to attach Socket.io to
 * @param {Object} options - Socket.io configuration options
 * @returns {Object} Configured Socket.io server
 */
function initializeSocketIO(httpServer, options = {}) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    ...options,
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      // Extract token from handshake auth
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Create a fake req object for the authenticate middleware
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      // Use the authenticate middleware to verify token
      await new Promise((resolve) => {
        authenticate(req, {}, (err) => {
          if (err) {
            next(new Error("Invalid token"));
          } else {
            // Set authenticated user data on socket
            socket.user = req.user;
            resolve();
          }
        });
      });

      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    try {
      const userId = socket.user.id;
      const username = socket.user.username || "Unknown Player";

      // Store user connection
      connectedUsers.set(socket.id, { userId, username });
      authenticatedUsers.set(userId, socket.id);

      // Get user's current area from database
      const userProgress = await executeDbOperation(async (client) => {
        return await client
          .from("game_progress")
          .select("current_area_id, position_x, position_y")
          .eq("user_id", userId)
          .single();
      });

      let areaId = null;
      if (userProgress.data) {
        areaId = userProgress.data.current_area_id;

        // Add user position data
        connectedUsers.get(socket.id).areaId = areaId;
        connectedUsers.get(socket.id).position = {
          x: userProgress.data.position_x,
          y: userProgress.data.position_y,
        };

        // Add to area users
        if (!areaUsers.has(areaId)) {
          areaUsers.set(areaId, new Set());
        }
        areaUsers.get(areaId).add(userId);

        // Join area room
        socket.join(`area:${areaId}`);

        // Notify others in the area
        socket.to(`area:${areaId}`).emit("player:joined", {
          userId,
          username,
          position: connectedUsers.get(socket.id).position,
        });

        // Send list of players in this area to the newly connected player
        const playersInArea = Array.from(areaUsers.get(areaId))
          .filter((id) => id !== userId) // Exclude self
          .map((id) => {
            const socketId = authenticatedUsers.get(id);
            if (socketId) {
              const playerData = connectedUsers.get(socketId);
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
      }

      // Register handlers
      playerMovementHandler(io, socket, connectedUsers, areaUsers);
      chatHandler(io, socket, connectedUsers, areaUsers);
      challengeHandler(io, socket, connectedUsers);

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);

        // Remove from area if assigned
        const userData = connectedUsers.get(socket.id);
        if (userData && userData.areaId) {
          const userAreaSet = areaUsers.get(userData.areaId);
          if (userAreaSet) {
            userAreaSet.delete(userData.userId);

            // Notify others in the area
            socket.to(`area:${userData.areaId}`).emit("player:left", {
              userId: userData.userId,
            });

            // Remove area set if empty
            if (userAreaSet.size === 0) {
              areaUsers.delete(userData.areaId);
            }
          }
        }

        // Remove from maps
        if (userData) {
          authenticatedUsers.delete(userData.userId);
        }
        connectedUsers.delete(socket.id);
      });
    } catch (error) {
      console.error("Error in socket connection:", error);
    }
  });

  return io;
}

module.exports = {
  initializeSocketIO,
  connectedUsers,
  authenticatedUsers,
  areaUsers,
};
