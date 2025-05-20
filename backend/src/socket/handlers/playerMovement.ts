import {
  AuthenticatedSocket,
  GameNamespace,
  ConnectionManager,
  SocketEventHandlers,
  ClientEvents,
  ServerEvents,
} from "../../types/socket";
import logger from "../../config/logger";
import { gameProgressService } from "../../services/gameProgressService";

/**
 * Setup handlers untuk player movement
 * @param io - Socket.io server instance
 * @param connectionManager - Connection manager
 * @returns Socket event handlers
 */
export function setupPlayerMovementHandlers(
  io: GameNamespace,
  connectionManager: ConnectionManager
): SocketEventHandlers {
  // Map tracking
  const playersInMap: Map<
    string,
    Map<
      string,
      {
        userId: string;
        username: string;
        position: any;
        avatar?: string;
        level?: number;
      }
    >
  > = new Map();

  // Broadcast updated players list to all clients in a map
  const broadcastPlayersInMap = (mapId: string) => {
    const players = Array.from(playersInMap.get(mapId)?.values() || []);

    io.to(`map:${mapId}`).emit("playersInMap", {
      mapId,
      players,
    } as ServerEvents.PlayersInMap);
  };

  // Handler ketika user connect
  const onConnection = (socket: AuthenticatedSocket) => {
    logger.debug(
      `Player movement handler: User ${socket.user?.username} connected`
    );
  };

  // Handler ketika user disconnect
  const onDisconnect = (socket: AuthenticatedSocket) => {
    if (socket.currentMap) {
      leaveMap(socket, socket.currentMap);
    }
  };

  // Handler ketika user masuk ke map
  const joinMap = async (
    socket: AuthenticatedSocket,
    mapId: string,
    position: any
  ) => {
    if (!socket.user) return;

    // Leave previous map if any
    if (socket.currentMap && socket.currentMap !== mapId) {
      leaveMap(socket, socket.currentMap);
    }

    // Join the map room
    socket.join(`map:${mapId}`);
    socket.currentMap = mapId;

    // Initialize map player tracking if needed
    if (!playersInMap.has(mapId)) {
      playersInMap.set(mapId, new Map());
    }

    const mapPlayers = playersInMap.get(mapId)!;

    // Get player stats from database
    try {
      const playerStats = await gameProgressService.getPlayerStats(
        socket.user.id
      );

      // Add player to map
      mapPlayers.set(socket.user.id, {
        userId: socket.user.id,
        username: socket.user.username,
        position,
        avatar: playerStats.avatar_url,
        level: playerStats.level,
      });

      // Broadcast player joined to other players in this map
      socket.to(`map:${mapId}`).emit("playerJoined", {
        userId: socket.user.id,
        username: socket.user.username,
        position,
        avatar: playerStats.avatar_url,
        level: playerStats.level,
      } as ServerEvents.PlayerJoined);

      // Send current players in this map to the joining player
      socket.emit("playersInMap", {
        mapId,
        players: Array.from(mapPlayers.values()),
      } as ServerEvents.PlayersInMap);

      logger.debug(`Player ${socket.user.username} joined map ${mapId}`, {
        userId: socket.user.id,
        mapId,
        position,
      });

      // Save player position to database
      await gameProgressService.savePosition({
        userId: socket.user.id,
        map: mapId,
        x: position.x,
        y: position.y,
        direction: position.direction,
      });
    } catch (error) {
      logger.error(`Error handling player join map`, {
        error,
        userId: socket.user.id,
        mapId,
      });

      // Notify client of error
      socket.emit("systemMessage", {
        message: "Failed to join map. Please try again.",
        type: "error",
        timestamp: new Date().toISOString(),
      } as ServerEvents.SystemMessage);
    }
  };

  // Handler ketika user keluar dari map
  const leaveMap = (socket: AuthenticatedSocket, mapId: string) => {
    if (!socket.user) return;

    // Leave the map room
    socket.leave(`map:${mapId}`);

    // Remove player from map tracking
    const mapPlayers = playersInMap.get(mapId);
    if (mapPlayers) {
      mapPlayers.delete(socket.user.id);

      // If no more players in this map, cleanup
      if (mapPlayers.size === 0) {
        playersInMap.delete(mapId);
      } else {
        // Broadcast player left to other players
        socket.to(`map:${mapId}`).emit("playerLeft", {
          userId: socket.user.id,
          mapId,
        } as ServerEvents.PlayerLeft);
      }
    }

    socket.currentMap = undefined;

    logger.debug(`Player ${socket.user.username} left map ${mapId}`, {
      userId: socket.user.id,
      mapId,
    });
  };

  // Register all event handlers
  const registerHandlers = (socket: AuthenticatedSocket) => {
    if (!socket.user) return;

    // Handler for joining a map
    socket.on("joinMap", async (data: ClientEvents.JoinMap) => {
      socket.lastActivity = new Date();
      await joinMap(socket, data.mapId, data.position);
    });

    // Handler for leaving a map
    socket.on("leaveMap", (data: ClientEvents.LeaveMap) => {
      socket.lastActivity = new Date();
      leaveMap(socket, data.mapId);
    });

    // Handler for player movement
    socket.on("playerMove", async (data: ClientEvents.PlayerMove) => {
      socket.lastActivity = new Date();

      if (!socket.currentMap || !socket.user) return;

      const mapPlayers = playersInMap.get(socket.currentMap);
      if (!mapPlayers) return;

      // Update player position in the map
      const playerData = mapPlayers.get(socket.user.id);
      if (playerData) {
        playerData.position = data.position;
        mapPlayers.set(socket.user.id, playerData);

        // Broadcast player movement to other players in this map
        socket.to(`map:${socket.currentMap}`).emit("playerMoved", {
          userId: socket.user.id,
          username: socket.user.username,
          position: data.position,
          animation: data.animation,
        } as ServerEvents.PlayerMoved);

        // Periodically save position to database (not every movement to reduce DB load)
        const now = Date.now();
        const lastSavedTime = socket.data.lastPositionSaveTime || 0;

        if (now - lastSavedTime > 15000) {
          // Every 15 seconds
          socket.data.lastPositionSaveTime = now;

          try {
            await gameProgressService.savePosition({
              userId: socket.user.id,
              map: socket.currentMap,
              x: data.position.x,
              y: data.position.y,
              direction: data.position.direction,
            });
          } catch (error) {
            logger.error("Error saving player position", {
              error,
              userId: socket.user.id,
              mapId: socket.currentMap,
            });
          }
        }
      }
    });
  };

  return {
    onConnection,
    onDisconnect,
    registerHandlers,
  };
}
