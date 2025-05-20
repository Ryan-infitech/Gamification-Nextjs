import { TablesRow } from "./supabase";

/**
 * Tipe untuk player stats dari database
 */
export type PlayerStats = TablesRow<"player_stats">;

/**
 * Tipe untuk game progress dari database
 */
export type GameProgress = TablesRow<"game_progress">;

/**
 * Tipe untuk completed challenges dari database
 */
export type CompletedChallenge = TablesRow<"completed_challenges">;

/**
 * Tipe untuk items inventory dari database
 */
export type InventoryItem = TablesRow<"items_inventory">;

/**
 * Tipe untuk achievements dari database
 */
export type Achievement = TablesRow<"achievements">;

/**
 * Interface untuk player position dalam game
 */
export interface PlayerPosition {
  map: string;
  x: number;
  y: number;
  direction?: "up" | "down" | "left" | "right";
}

/**
 * Interface untuk player game state
 */
export interface PlayerGameState {
  stats: PlayerStats;
  progress: GameProgress;
  position: PlayerPosition;
  inventory: InventoryItem[];
  achievements: Achievement[];
  completedChallenges: CompletedChallenge[];
}

/**
 * Interface untuk update player position
 */
export interface SavePositionRequest {
  userId: string;
  map: string;
  x: number;
  y: number;
  direction?: "up" | "down" | "left" | "right";
}

/**
 * Interface untuk saving game progress
 */
export interface SaveProgressRequest {
  userId: string;
  currentChapter?: number;
  currentLevel?: number;
  unlockedZones?: string[];
  completedLevels?: string[];
  savedPositionData?: Record<string, any>;
}

/**
 * Interface untuk updating player stats
 */
export interface UpdateStatsRequest {
  userId: string;
  level?: number;
  experience?: number;
  coins?: number;
  health?: number;
  strength?: number;
  intelligence?: number;
  agility?: number;
  playTimeMinutes?: number;
}

/**
 * Interface untuk adding item to inventory
 */
export interface AddItemRequest {
  userId: string;
  itemId: string;
  quantity?: number;
  properties?: Record<string, any>;
}

/**
 * Interface untuk removing item from inventory
 */
export interface RemoveItemRequest {
  userId: string;
  itemId: string;
  quantity?: number;
}

/**
 * Interface untuk equipping/unequipping item
 */
export interface EquipItemRequest {
  userId: string;
  itemId: string;
  equipped: boolean;
}

/**
 * Interface untuk unlocking achievement
 */
export interface UnlockAchievementRequest {
  userId: string;
  achievementId: string;
  progress?: number;
}

/**
 * Interface untuk completing challenge
 */
export interface CompleteChallengRequest {
  userId: string;
  challengeId: string;
  score?: number;
  timeTaken?: number; // in seconds
  solutionCode?: string;
  feedback?: string;
}

/**
 * Interface untuk game event yang terjadi
 */
export interface GameEvent {
  type: GameEventType;
  userId: string;
  data: Record<string, any>;
  timestamp: string;
}

/**
 * Enum untuk tipe game event
 */
export enum GameEventType {
  PLAYER_MOVE = "player_move",
  PLAYER_INTERACT = "player_interact",
  ITEM_COLLECT = "item_collect",
  CHALLENGE_START = "challenge_start",
  CHALLENGE_COMPLETE = "challenge_complete",
  LEVEL_UP = "level_up",
  ACHIEVEMENT_UNLOCK = "achievement_unlock",
  QUIZ_COMPLETE = "quiz_complete",
  PLAYER_DEATH = "player_death",
  NPC_INTERACTION = "npc_interaction",
  ZONE_ENTER = "zone_enter",
  ZONE_EXIT = "zone_exit",
}

/**
 * Interface untuk player sync data (untuk multiplayer)
 */
export interface PlayerSyncData {
  userId: string;
  username: string;
  position: PlayerPosition;
  stats: {
    level: number;
    health: number;
  };
  appearance: {
    avatarUrl?: string;
    character: string;
    outfit?: string;
  };
  lastUpdated: string;
}

/**
 * Interface untuk game map data
 */
export interface GameMapData {
  id: string;
  name: string;
  file: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  properties?: Record<string, any>;
  npcs?: GameNpc[];
  objects?: GameObject[];
  spawnPoints?: GameSpawnPoint[];
  connections?: GameMapConnection[];
}

/**
 * Interface untuk NPC in game
 */
export interface GameNpc {
  id: string;
  name: string;
  x: number;
  y: number;
  sprite: string;
  dialog: GameDialog[];
  movementPattern?: "static" | "random" | "patrolling" | "following";
  properties?: Record<string, any>;
}

/**
 * Interface untuk dialog NPC
 */
export interface GameDialog {
  id: string;
  text: string;
  options?: {
    text: string;
    nextId?: string;
    action?: string;
    data?: Record<string, any>;
  }[];
}

/**
 * Interface untuk game object (item, chest, sign, etc)
 */
export interface GameObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: Record<string, any>;
  interaction?: {
    type: string;
    data?: Record<string, any>;
  };
}

/**
 * Interface untuk spawn point di map
 */
export interface GameSpawnPoint {
  id: string;
  x: number;
  y: number;
  direction?: "up" | "down" | "left" | "right";
  forMap?: string;
  properties?: Record<string, any>;
}

/**
 * Interface untuk connection antar map
 */
export interface GameMapConnection {
  sourceMapId: string;
  targetMapId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  direction?: "up" | "down" | "left" | "right";
  requiredLevel?: number;
  requiredItem?: string;
  properties?: Record<string, any>;
}

/**
 * Enum untuk tipe item dalam game
 */
export enum GameItemType {
  WEAPON = "weapon",
  ARMOR = "armor",
  CONSUMABLE = "consumable",
  KEY = "key",
  QUEST = "quest",
  DECORATION = "decoration",
  MATERIAL = "material",
}

/**
 * Enum untuk rarity item dalam game
 */
export enum ItemRarity {
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary",
}

/**
 * Interface untuk item definition (template/master data)
 */
export interface GameItemDefinition {
  id: string;
  name: string;
  description: string;
  type: GameItemType;
  rarity: ItemRarity;
  icon: string;
  sprite?: string;
  stackable: boolean;
  maxStack?: number;
  value: number;
  weight?: number;
  level?: number;
  usable: boolean;
  equipable: boolean;
  effects?: {
    type: string;
    value: number;
    duration?: number;
  }[];
  requirements?: {
    level?: number;
    stats?: Record<string, number>;
  };
  properties?: Record<string, any>;
}

/**
 * Interface untuk achievement definition (template/master data)
 */
export interface GameAchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  requirement: {
    type: string;
    value: number;
    criteria?: Record<string, any>;
  };
  rewards?: {
    experience?: number;
    coins?: number;
    items?: { id: string; quantity: number }[];
  };
  secret: boolean;
  related?: string[];
}

/**
 * Interface untuk challenge definition (template/master data)
 */
export interface GameChallengeDefinition {
  id: string;
  name: string;
  description: string;
  type: "code" | "quiz" | "interactive";
  category: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimit?: number; // in seconds
  points: number;
  experience: number;
  coins: number;
  content: Record<string, any>;
  requirements?: {
    level?: number;
    completedChallenges?: string[];
    items?: string[];
  };
  rewards?: {
    items?: { id: string; quantity: number }[];
    achievements?: string[];
  };
}

/**
 * Tipe untuk error terkait game
 */
export enum GameErrorType {
  INVALID_POSITION = "INVALID_POSITION",
  INVALID_MAP = "INVALID_MAP",
  INVALID_ITEM = "INVALID_ITEM",
  INVALID_ACHIEVEMENT = "INVALID_ACHIEVEMENT",
  INVALID_CHALLENGE = "INVALID_CHALLENGE",
  INSUFFICIENT_LEVEL = "INSUFFICIENT_LEVEL",
  INSUFFICIENT_RESOURCES = "INSUFFICIENT_RESOURCES",
  INVENTORY_FULL = "INVENTORY_FULL",
  ITEM_NOT_FOUND = "ITEM_NOT_FOUND",
  PROGRESS_NOT_FOUND = "PROGRESS_NOT_FOUND",
  ALREADY_COMPLETED = "ALREADY_COMPLETED",
  ALREADY_UNLOCKED = "ALREADY_UNLOCKED",
}
