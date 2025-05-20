import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { AuthUser } from "./auth";
import { PlayerPosition } from "./game";

/**
 * Namespace untuk tipe event socket client-to-server
 */
export namespace ClientEvents {
  // Authentication events
  export interface Authenticate {
    token: string;
  }

  // Player movement events
  export interface PlayerMove {
    position: PlayerPosition;
    animation?: string;
  }

  export interface JoinMap {
    mapId: string;
    position: PlayerPosition;
  }

  export interface LeaveMap {
    mapId: string;
  }

  // Chat events
  export interface SendMessage {
    content: string;
    roomId: string;
    isPrivate?: boolean;
    recipientId?: string;
  }

  export interface JoinChatRoom {
    roomId: string;
  }

  export interface LeaveChatRoom {
    roomId: string;
  }

  export interface StartTyping {
    roomId: string;
  }

  export interface StopTyping {
    roomId: string;
  }

  // Challenge events
  export interface StartChallenge {
    challengeId: string;
  }

  export interface SubmitChallenge {
    challengeId: string;
    solution: string;
    language: string;
  }

  export interface JoinChallengeGroup {
    groupId: string;
  }

  export interface LeaveChallengeGroup {
    groupId: string;
  }

  export interface InviteToChallenge {
    challengeId: string;
    userId: string;
  }

  // Presence events
  export interface UpdateStatus {
    status: UserStatus;
    activity?: string;
  }

  export interface PingServer {
    timestamp: number;
  }
}

/**
 * Namespace untuk tipe event socket server-to-client
 */
export namespace ServerEvents {
  // Authentication events
  export interface AuthenticationResult {
    success: boolean;
    message?: string;
    user?: {
      id: string;
      username: string;
      role: string;
    };
  }

  // Player events
  export interface PlayerJoined {
    userId: string;
    username: string;
    position: PlayerPosition;
    avatar?: string;
    level?: number;
  }

  export interface PlayerLeft {
    userId: string;
    mapId: string;
  }

  export interface PlayerMoved {
    userId: string;
    username: string;
    position: PlayerPosition;
    animation?: string;
  }

  export interface PlayersInMap {
    mapId: string;
    players: {
      userId: string;
      username: string;
      position: PlayerPosition;
      avatar?: string;
      level?: number;
    }[];
  }

  // Chat events
  export interface ReceiveMessage {
    id: string;
    content: string;
    sender: {
      id: string;
      username: string;
      avatar?: string;
    };
    roomId: string;
    isPrivate: boolean;
    timestamp: string;
    metadata?: any;
  }

  export interface UserJoinedRoom {
    userId: string;
    username: string;
    roomId: string;
    timestamp: string;
  }

  export interface UserLeftRoom {
    userId: string;
    username: string;
    roomId: string;
    timestamp: string;
  }

  export interface UserTyping {
    userId: string;
    username: string;
    roomId: string;
  }

  export interface UserStoppedTyping {
    userId: string;
    roomId: string;
  }

  // Challenge events
  export interface ChallengeStarted {
    userId: string;
    username: string;
    challengeId: string;
    timestamp: string;
  }

  export interface ChallengeCompleted {
    userId: string;
    username: string;
    challengeId: string;
    score: number;
    timeTaken: number;
    timestamp: string;
  }

  export interface ChallengeInvitation {
    from: {
      id: string;
      username: string;
    };
    challengeId: string;
    challengeName: string;
    expires: string;
  }

  // Notification events
  export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    data?: any;
  }

  // System events
  export interface SystemMessage {
    message: string;
    type: "info" | "warning" | "error" | "success";
    timestamp: string;
  }

  export interface Pong {
    timestamp: number;
    serverTime: number;
  }
}

/**
 * Status user
 */
export enum UserStatus {
  ONLINE = "online",
  AWAY = "away",
  BUSY = "busy",
  OFFLINE = "offline",
  IN_GAME = "in_game",
  IN_CHALLENGE = "in_challenge",
}

/**
 * Tipe untuk Socket yang sudah terautentikasi
 */
export interface AuthenticatedSocket extends Socket {
  user?: AuthUser;
  joinedRooms: Set<string>;
  currentMap?: string;
  lastActivity: Date;
  status: UserStatus;
}

/**
 * Type untuk hasil autentikasi socket
 */
export interface SocketAuthResult {
  success: boolean;
  user?: AuthUser;
  message?: string;
}

/**
 * Interface untuk namespace socket dengan type safety
 */
export interface GameNamespace extends SocketIOServer {
  use(
    fn: (socket: AuthenticatedSocket, next: (err?: Error) => void) => void
  ): this;
}

/**
 * Interface gabungan untuk event handler
 */
export interface SocketEventHandlers {
  onConnection: (socket: AuthenticatedSocket) => void;
  onDisconnect: (socket: AuthenticatedSocket) => void;
  registerHandlers: (socket: AuthenticatedSocket) => void;
}

/**
 * Interface untuk room management
 */
export interface RoomManager {
  addUserToRoom: (userId: string, roomId: string) => Promise<void>;
  removeUserFromRoom: (userId: string, roomId: string) => Promise<void>;
  getUsersInRoom: (roomId: string) => Promise<string[]>;
  getRoomsForUser: (userId: string) => Promise<string[]>;
}

/**
 * Interface untuk tracking user connections
 */
export interface ConnectionManager {
  addConnection: (userId: string, socketId: string) => void;
  removeConnection: (socketId: string) => string | undefined;
  getUserSockets: (userId: string) => string[];
  getOnlineUsers: () => string[];
  isUserOnline: (userId: string) => boolean;
  getConnectionCount: () => number;
}

/**
 * Tipe untuk stats socket server
 */
export interface SocketServerStats {
  connectionCount: number;
  roomsCount: number;
  messagesPerMinute: number;
  onlineUsers: number;
  topRooms: { roomId: string; userCount: number }[];
  uptime: number;
}
