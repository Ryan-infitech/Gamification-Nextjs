import Phaser from "phaser";

// Define the shape of the user data stored in game registry
export interface GameUserData {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

// Define the structure for tilemap objects
export interface TiledMapObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  visible: boolean;
  properties?: {
    name: string;
    type: string;
    value: any;
  }[];
}

// Extend Phaser's Scene type
export interface GameScene extends Phaser.Scene {
  player?: Phaser.Physics.Arcade.Sprite & {
    direction: "up" | "down" | "left" | "right";
    speed: number;
    updateMovement: (cursors: Phaser.Types.Input.Keyboard.CursorKeys) => void;
  };
  map?: Phaser.Tilemaps.Tilemap;
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  otherPlayers?: Phaser.Physics.Arcade.Group;
  spawns?: TiledMapObject[];
  collisionLayer?: Phaser.Tilemaps.TilemapLayer;
}

// Define tile animation data structure
export interface TileAnimationData {
  tileId: number;
  frameRate: number;
  frames: number[];
}

// Socket message types for player movements
export interface PlayerMovement {
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  playerId: string;
  username: string;
  animation?: string;
}

// Chat message interface
export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  content: string;
  timestamp: number;
  type: "global" | "local" | "system" | "private";
  recipientId?: string;
}

// Player info from the server
export interface PlayerInfo {
  id: string;
  username: string;
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  animation?: string;
  level?: number;
  avatarUrl?: string;
}

// Define the structure of the map data from Tiled
export interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  infinite: boolean;
  orientation: string;
  renderorder: string;
  layers: TiledLayer[];
  tilesets: TiledTileset[];
  nextlayerid: number;
  nextobjectid: number;
}

// Define a Tiled layer
export interface TiledLayer {
  id: number;
  name: string;
  type: "tilelayer" | "objectgroup";
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  data?: number[];
  chunks?: TiledChunk[];
  objects?: TiledMapObject[];
  properties?: TiledProperty[];
  startx?: number;
  starty?: number;
}

// Define a chunk in an infinite map
export interface TiledChunk {
  x: number;
  y: number;
  width: number;
  height: number;
  data: number[];
}

// Define property for Tiled objects
export interface TiledProperty {
  name: string;
  type: string;
  value: any;
}

// Define a tileset reference in Tiled
export interface TiledTileset {
  firstgid: number;
  source?: string;
  name?: string;
  tilewidth?: number;
  tileheight?: number;
  spacing?: number;
  margin?: number;
  tilecount?: number;
  columns?: number;
  image?: string;
}

// Define the structure for a quest
export interface Quest {
  id: string;
  title: string;
  description: string;
  status: "available" | "active" | "completed" | "failed";
  objectives: QuestObjective[];
  rewards: QuestReward[];
  prerequisiteQuestIds?: string[];
  level?: number;
  location?: {
    x: number;
    y: number;
    name: string;
  };
}

// Define a quest objective
export interface QuestObjective {
  id: string;
  description: string;
  progress: number;
  target: number;
  type: "collect" | "kill" | "interact" | "location" | "code";
  completed: boolean;
  targetId?: string;
}

// Define quest rewards
export interface QuestReward {
  type: "experience" | "item" | "currency" | "skill";
  amount: number;
  itemId?: string;
}

// Define inventory item
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: "weapon" | "armor" | "consumable" | "quest" | "key";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  quantity: number;
  icon: string;
  stats?: {
    [key: string]: number;
  };
  usable: boolean;
  equippable: boolean;
  equipped?: boolean;
}
