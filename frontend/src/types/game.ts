// Game-related type definitions

import Phaser from "phaser";

/**
 * Game config type extending Phaser's config
 */
export interface GameConfig extends Phaser.Types.Core.GameConfig {
  // Additional configurations specific to our game
  parent: string;
  pixelArt: boolean;
}

/**
 * Player state
 */
export interface Player {
  position: {
    x: number;
    y: number;
  };
  direction: string;
  speed: number;
  stats: {
    level: number;
    xp: number;
    coins: number;
    health: number;
    maxHealth: number;
    codingSkill: number;
    problemSolving: number;
  };
  inventory: any[];
  currentAreaId: string | null;
  isMoving: boolean;
}

/**
 * Game area definition
 */
export interface GameArea {
  id: string;
  name: string;
  description: string;
  mapKey: string;
  requiredLevel: number;
  features?: Array<{
    id: string;
    type: string;
    position?: { x: number; y: number };
    data?: any;
  }>;
}

/**
 * Challenge definition
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: number;
  xpReward: number;
  coinReward: number;
  timeLimit?: number;
  hints: string[];
  testCases?: any[];
}

/**
 * Game event
 */
export interface GameEvent {
  id: string;
  type: "system" | "chat" | "achievement" | "player" | "npc" | "challenge";
  message: string;
  timestamp: Date;
  sender?: string;
  isGlobal?: boolean;
  data?: any;
}

/**
 * Game settings
 */
export interface GameSettings {
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  pixelPerfect: boolean;
  showFps: boolean;
}

/**
 * Main game state
 */
export interface GameState {
  player: Player;
  gameAreas: GameArea[];
  currentArea: GameArea | null;
  otherPlayers: Map<string, any>;
  challenges: Challenge[];
  currentChallenge: Challenge | null;
  events: GameEvent[];
  settings: GameSettings;
  status: {
    isInitialized: boolean;
    isLoading: boolean;
    isConnected: boolean;
    lastSyncTime: Date | null;
    error: string | null;
  };
}

/**
 * Game action types
 */
export type GameAction =
  | {
      type: "INITIALIZE_GAME";
      payload: { player: Partial<Player>; gameAreas: GameArea[] };
    }
  | {
      type: "UPDATE_PLAYER_POSITION";
      payload: {
        position: { x: number; y: number };
        direction?: string;
        isMoving?: boolean;
      };
    }
  | { type: "UPDATE_PLAYER_STATS"; payload: Partial<Player["stats"]> }
  | {
      type: "CHANGE_AREA";
      payload: {
        areaId: string;
        position?: { x: number; y: number };
        areaData?: GameArea;
      };
    }
  | { type: "UPDATE_OTHER_PLAYER"; payload: { id: string; data: any | null } }
  | { type: "START_CHALLENGE"; payload: Challenge }
  | { type: "END_CHALLENGE" }
  | { type: "ADD_ITEM_TO_INVENTORY"; payload: any }
  | { type: "REMOVE_ITEM_FROM_INVENTORY"; payload: { id: string } }
  | { type: "ADD_GAME_EVENT"; payload: Omit<GameEvent, "id" | "timestamp"> }
  | { type: "UPDATE_CONNECTION_STATUS"; payload: boolean }
  | { type: "UPDATE_GAME_SETTINGS"; payload: Partial<GameSettings> }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };

/**
 * Tilemaps types
 */
export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  properties?: Array<{ name: string; type: string; value: any }>;
}

export enum TiledLayerType {
  TILELAYER = "tilelayer",
  OBJECTGROUP = "objectgroup",
}

export interface TiledObjectWithGameObject extends TiledObject {
  gameObject?: Phaser.GameObjects.GameObject;
}
