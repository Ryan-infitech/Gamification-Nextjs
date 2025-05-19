import { io, Socket } from "socket.io-client";
import { getCurrentUser } from "./supabase";

/**
 * Types for socket event payloads
 */
export interface PlayerMovementPayload {
  position: { x: number; y: number };
  animation?: string;
}

export interface PlayerAreaChangePayload {
  areaId: string;
  position?: { x: number; y: number };
  checkpoint?: string;
}

export interface ChatMessagePayload {
  message: string;
}

export interface ChallengeStartPayload {
  challengeId: string;
}

export interface ChallengeCompletePayload {
  challengeId: string;
  score: number;
  timeTaken: number;
}

export interface NPCInteractionPayload {
  npcId: string;
}

/**
 * Socket manager class to handle connections and events
 */
class SocketManager {
  private socket: Socket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private isConnecting: boolean = false;

  constructor(
    url: string = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
  ) {
    this.url = url;
  }

  /**
   * Connect to the socket server
   * @param token - Authentication token
   * @returns Socket instance
   */
  connect(token: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      // Wait for the current connection attempt to finish
      if (this.socket) return this.socket;
    }

    this.isConnecting = true;
    this.reconnectAttempts = 0;

    // Create socket connection with auth token
    this.socket = io(this.url, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    // Set up event listeners
    this.setupEventListeners();

    return this.socket;
  }

  /**
   * Disconnect from the socket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Set up event listeners for connection management
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected");
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.reconnectAttempts += 1;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnect attempts reached, giving up");
        this.isConnecting = false;
      }
    });

    // Ping to keep connection alive
    setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit("ping");
      }
    }, 30000);
  }

  /**
   * Get the current socket instance
   * @returns Socket instance or null if not connected
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   * @returns True if connected
   */
  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  /**
   * Emit a typed event with payload
   * @param event - Event name
   * @param payload - Event payload
   * @returns True if sent successfully
   */
  emit<T>(event: string, payload: T): boolean {
    if (!this.socket || !this.socket.connected) {
      console.warn("Socket not connected, cannot emit event:", event);
      return false;
    }

    this.socket.emit(event, payload);
    return true;
  }

  /**
   * Add event listener with proper typing
   * @param event - Event name
   * @param callback - Event callback
   */
  on<T>(event: string, callback: (data: T) => void): void {
    if (!this.socket) {
      console.warn("Socket not initialized, cannot add listener for:", event);
      return;
    }

    this.socket.on(event, callback);
  }

  /**
   * Remove event listener
   * @param event - Event name
   * @param callback - Event callback
   */
  off<T>(event: string, callback?: (data: T) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
}

// Export a singleton instance
export const socketManager = new SocketManager();

// Export a custom hook for use in components
export function useSocket() {
  return socketManager;
}
