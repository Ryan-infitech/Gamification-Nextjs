import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { verifyToken } from "../services/sessionService";
import logger from "../config/logger";
import { env } from "../config/env";
import {
  AuthenticatedSocket,
  GameNamespace,
  UserStatus,
  SocketEventHandlers,
  ServerEvents,
  ClientEvents,
  ConnectionManager,
  SocketAuthResult,
} from "../types/socket";
import { setupPlayerMovementHandlers } from "./handlers/playerMovement";
import { setupChatHandlers } from "./handlers/chat";
import { setupChallengeHandlers } from "./handlers/challenges";
import { AuthenticationError } from "../types/error";

// Collection of all connected sockets by user ID
class SocketConnectionManager implements ConnectionManager {
  private userConnections: Map<string, Set<string>> = new Map();

  addConnection(userId: string, socketId: string): void {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)?.add(socketId);
    logger.debug(`User ${userId} connected with socket ${socketId}`);
  }

  removeConnection(socketId: string): string | undefined {
    let removedUserId: string | undefined;

    this.userConnections.forEach((sockets, userId) => {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        removedUserId = userId;

        // If no more connections for this user, remove the user entry
        if (sockets.size === 0) {
          this.userConnections.delete(userId);
        }
      }
    });

    if (removedUserId) {
      logger.debug(`Socket ${socketId} for user ${removedUserId} disconnected`);
    }

    return removedUserId;
  }

  getUserSockets(userId: string): string[] {
    return Array.from(this.userConnections.get(userId) || []);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userConnections.keys());
  }

  isUserOnline(userId: string): boolean {
    return (
      this.userConnections.has(userId) &&
      (this.userConnections.get(userId)?.size || 0) > 0
    );
  }

  getConnectionCount(): number {
    let count = 0;
    this.userConnections.forEach((sockets) => {
      count += sockets.size;
    });
    return count;
  }
}

// Socket Server class
export class SocketServer {
  private io: GameNamespace;
  private connectionManager: ConnectionManager;
  private handlers: SocketEventHandlers[];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(httpServer: HTTPServer) {
    this.connectionManager = new SocketConnectionManager();

    // Initialize Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.CORS_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 30000,
      pingInterval: 10000,
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e6, // 1MB
    }) as GameNamespace;

    // Set up middleware for authentication
    this.io.use(this.authMiddleware.bind(this));

    // Initialize handlers
    this.handlers = [
      setupPlayerMovementHandlers(this.io, this.connectionManager),
      setupChatHandlers(this.io, this.connectionManager),
      setupChallengeHandlers(this.io, this.connectionManager),
    ];
  }

  // Initialize the socket server
  public initialize(): void {
    // Set up connection event
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      if (!socket.user) {
        socket.disconnect(true);
        return;
      }

      // Initialize socket properties
      socket.joinedRooms = new Set();
      socket.lastActivity = new Date();
      socket.status = UserStatus.ONLINE;

      // Automatically join user-specific room
      socket.join(`user:${socket.user.id}`);

      // Register this connection
      this.connectionManager.addConnection(socket.user.id, socket.id);

      // Register event handlers from all handler modules
      this.handlers.forEach((handler) => {
        handler.onConnection(socket);
        handler.registerHandlers(socket);
      });

      // Handle disconnect
      socket.on("disconnect", (reason) => {
        logger.debug(`Socket ${socket.id} disconnected: ${reason}`);

        this.handlers.forEach((handler) => {
          handler.onDisconnect(socket);
        });

        const userId = this.connectionManager.removeConnection(socket.id);

        // If this was the last connection for this user, broadcast offline status
        if (userId && !this.connectionManager.isUserOnline(userId)) {
          this.io.emit("userStatus", {
            userId,
            status: UserStatus.OFFLINE,
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Send connection acknowledgment
      socket.emit("connected", {
        success: true,
        user: {
          id: socket.user.id,
          username: socket.user.username,
          role: socket.user.role,
        },
      } as ServerEvents.AuthenticationResult);

      // Log connection
      logger.info("Socket connected", {
        socketId: socket.id,
        userId: socket.user.id,
        username: socket.user.username,
        timestamp: new Date().toISOString(),
      });
    });

    // Start heartbeat checks
    this.startHeartbeat();

    // Start stats collection
    this.startStatsCollection();

    logger.info("Socket.IO server initialized");
  }

  // Authentication middleware
  private async authMiddleware(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      const token = this.extractToken(socket);

      if (!token) {
        return next(new AuthenticationError("Authentication token missing"));
      }

      const authResult = await this.authenticateToken(token);

      if (!authResult.success || !authResult.user) {
        return next(
          new AuthenticationError(authResult.message || "Authentication failed")
        );
      }

      // Set user data on socket
      socket.user = authResult.user;
      next();
    } catch (error) {
      logger.error("Socket authentication error", { error });
      next(new AuthenticationError("Authentication failed"));
    }
  }

  // Extract token from socket handshake
  private extractToken(socket: AuthenticatedSocket): string | null {
    const authHeader =
      socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (authHeader && typeof authHeader === "string") {
      // If it's a Bearer token
      if (authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7);
      }
      // Otherwise assume it's the raw token
      return authHeader;
    }

    // Try to get from cookie
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      const tokenCookie = cookies
        .split(";")
        .find((c) => c.trim().startsWith(`${env.AUTH_COOKIE_NAME}=`));
      if (tokenCookie) {
        return tokenCookie.split("=")[1].trim();
      }
    }

    return null;
  }

  // Authenticate token
  private async authenticateToken(token: string): Promise<SocketAuthResult> {
    try {
      const decodedToken = await verifyToken(token);

      return {
        success: true,
        user: {
          id: decodedToken.id,
          email: decodedToken.email,
          username: decodedToken.username,
          role: decodedToken.role,
          verified: decodedToken.verified,
        },
      };
    } catch (error) {
      logger.warn("Token verification failed for socket connection", { error });
      return {
        success: false,
        message: "Invalid or expired token",
      };
    }
  }

  // Start heartbeat check
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      const timestamp = Date.now();
      this.io.emit("heartbeat", { timestamp });

      // Optionally check for stale connections
      this.checkStaleConnections();
    }, 30000); // 30 seconds
  }

  // Check for stale connections
  private checkStaleConnections(): void {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    this.io.sockets.sockets.forEach((socket: AuthenticatedSocket) => {
      if (
        socket.lastActivity &&
        now.getTime() - socket.lastActivity.getTime() > staleThreshold
      ) {
        logger.debug(`Disconnecting stale socket: ${socket.id}`);
        socket.disconnect(true);
      }
    });
  }

  // Start stats collection
  private startStatsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    this.statsInterval = setInterval(() => {
      const stats = this.collectStats();
      logger.debug("Socket server stats", { stats });

      // Emit stats to admin namespace if it exists
      if (this.io.adapter.rooms.has("admin")) {
        this.io.to("admin").emit("serverStats", stats);
      }
    }, 60000); // 1 minute
  }

  // Collect server stats
  private collectStats() {
    return {
      connectionCount: this.connectionManager.getConnectionCount(),
      onlineUsers: this.connectionManager.getOnlineUsers().length,
      timestamp: new Date().toISOString(),
    };
  }

  // Cleanup on shutdown
  public cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    this.io.disconnectSockets(true);
    logger.info("Socket.IO server shut down");
  }

  // Get the socket.io server instance
  public getIO(): GameNamespace {
    return this.io;
  }

  // Get connection manager
  public getConnectionManager(): ConnectionManager {
    return this.connectionManager;
  }
}

// Singleton instance
let socketServer: SocketServer | null = null;

// Initialize socket server with HTTP server
export const setupSocketServer = (httpServer: HTTPServer): SocketServer => {
  if (!socketServer) {
    socketServer = new SocketServer(httpServer);
    socketServer.initialize();
  }
  return socketServer;
};

// Get existing socket server
export const getSocketServer = (): SocketServer | null => {
  return socketServer;
};
