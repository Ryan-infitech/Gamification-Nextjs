import Phaser from "phaser";
import { NPCDirection } from "@/game/objects/NPC";

/**
 * Base interface for all game objects
 */
export interface GameObject {
  id: string;
  type: string;
}

/**
 * Character interface representing shared properties between
 * player and NPCs
 */
export interface Character extends GameObject {
  direction: "up" | "down" | "left" | "right";
  speed: number;
  isMoving: boolean;
  sprite: Phaser.Physics.Arcade.Sprite;
}

/**
 * Player specific properties
 */
export interface Player extends Character {
  type: "player";
  health: number;
  maxHealth: number;
  level: number;
  experience: number;
  inventory: InventoryItem[];
  skills: Skill[];
  updateMovement: (cursors: Phaser.Types.Input.Keyboard.CursorKeys) => void;
  interact: () => void;
}

/**
 * NPC specific properties
 */
export interface NPC extends Character {
  type: "npc";
  name: string;
  dialogId?: string;
  behaviorType: NPCBehaviorType;
  interactionDistance: number;
  faceDirection: (direction: NPCDirection) => void;
}

/**
 * NPC behavior types
 */
export enum NPCBehaviorType {
  STATIC = "static",
  PATROL = "patrol",
  FOLLOW = "follow",
  WANDER = "wander",
  GUARD = "guard",
  FLEE = "flee",
  CUSTOM = "custom",
}

/**
 * Dialog data structure for conversations
 */
export interface Dialog {
  id: string;
  lines: Record<string, DialogLine>;
  startLineId: string;
}

/**
 * Individual dialog line
 */
export interface DialogLine {
  text: string;
  speaker?: string;
  responses?: DialogResponse[];
  onDisplay?: () => void;
}

/**
 * Response option in a dialog
 */
export interface DialogResponse {
  text: string;
  nextId?: string;
  action?: () => void;
}

/**
 * Interactive object in the game world
 */
export interface InteractiveObject extends GameObject {
  type: "interactive";
  interactionType: "examine" | "pickup" | "use" | "trigger" | "custom";
  sprite: Phaser.Physics.Arcade.Sprite;
  interactionDistance: number;
  onInteract: (player: Player) => void;
  description?: string;
}

/**
 * Challenge zone that triggers a coding challenge
 */
export interface ChallengeZone extends GameObject {
  type: "challenge-zone";
  challengeId: string;
  requiredLevel?: number;
  completionStatus: "not-started" | "in-progress" | "completed";
  rewards: Reward[];
  onEnter: (player: Player) => void;
  onComplete: (player: Player) => void;
}

/**
 * Inventory item that can be collected
 */
export interface InventoryItem extends GameObject {
  type: "item";
  name: string;
  description: string;
  quantity: number;
  stackable: boolean;
  maxStack: number;
  itemType: "consumable" | "key" | "equipment" | "quest" | "misc";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  iconPath: string;
  use: (player: Player) => void;
}

/**
 * Skill that the player can learn and use
 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  experiencePoints: number;
  use: (player: Player, target?: GameObject) => void;
}

/**
 * Reward given to the player for completing challenges
 */
export interface Reward {
  type: "experience" | "currency" | "item" | "skill";
  amount: number;
  itemId?: string;
  skillId?: string;
}

/**
 * Portal or exit point to another map/area
 */
export interface Portal extends GameObject {
  type: "portal";
  targetMapKey: string;
  targetPortalId?: string;
  targetPosition?: { x: number; y: number };
  requiresItem?: string;
  requiresQuest?: string;
  sprite: Phaser.Physics.Arcade.Sprite;
  onEnter: (player: Player) => void;
}

/**
 * Trigger zone that executes code when player enters
 */
export interface TriggerZone extends GameObject {
  type: "trigger";
  triggerType: "once" | "repeatable" | "toggle";
  hasTriggered: boolean;
  sprite: Phaser.GameObjects.Zone;
  onEnter: (player: Player) => void;
  onExit?: (player: Player) => void;
  resetCondition?: () => boolean;
}

/**
 * Quest marker or giver in the game world
 */
export interface QuestMarker extends GameObject {
  type: "quest-marker";
  questId: string;
  questStatus: "available" | "in-progress" | "completed" | "failed";
  sprite: Phaser.Physics.Arcade.Sprite;
  onInteract: (player: Player) => void;
  showIndicator: boolean;
}

/**
 * Collectible item in the game world
 */
export interface Collectible extends GameObject {
  type: "collectible";
  itemId: string;
  quantity: number;
  respawns: boolean;
  respawnTime: number;
  collectTime?: number;
  sprite: Phaser.Physics.Arcade.Sprite;
  onCollect: (player: Player) => void;
}

/**
 * Game map area data
 */
export interface GameMap {
  key: string;
  name: string;
  tileMap: Phaser.Tilemaps.Tilemap;
  layers: Record<string, Phaser.Tilemaps.TilemapLayer[]>;
  objects: Record<string, GameObject[]>;
  properties: Record<string, any>;
  width: number;
  height: number;
  spawnPoints: Record<string, { x: number; y: number }>;
  music?: string;
  ambience?: string;
}

/**
 * Save data format for game progress
 */
export interface GameSaveData {
  player: {
    position: { x: number; y: number };
    stats: {
      health: number;
      level: number;
      experience: number;
    };
    inventory: {
      id: string;
      quantity: number;
    }[];
    skills: {
      id: string;
      level: number;
    }[];
  };
  currentMap: string;
  completedChallenges: string[];
  gameTimestamp: number;
  checkpoints: Record<string, boolean>;
  gameVersion: string;
}
