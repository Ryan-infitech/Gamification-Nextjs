import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import PreloadScene from "./scenes/PreloadScene";
import MainMenuScene from "./scenes/MainMenuScene";
import GameScene from "./scenes/GameScene";
import { GameConfig } from "@/types/game";

/**
 * Default Phaser game configuration
 * This can be modified based on the needs of different scenes
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  parent: "game-container",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: process.env.NODE_ENV === "development",
    },
  },
  scene: [], // Scenes will be added when the game is initialized
};

/**
 * Create a game instance with the provided configuration
 * @param customConfig - Optional custom configuration to merge with defaults
 * @returns Phaser.Game instance
 */
export function createGame(customConfig?: Partial<GameConfig>): Phaser.Game {
  // Only create the game on the client-side
  if (typeof window === "undefined") {
    return null as any; // Return null for server-side rendering
  }

  const config = { ...DEFAULT_GAME_CONFIG, ...customConfig };
  return new Phaser.Game(config as Phaser.Types.Core.GameConfig);
}

// Helper types and interfaces for game objects
export interface GamePlayer extends Phaser.Physics.Arcade.Sprite {
  direction: "up" | "down" | "left" | "right";
  setPlayerPosition: (x: number, y: number) => void;
  updateMovement: (cursors: Phaser.Types.Input.Keyboard.CursorKeys) => void;
}

export interface MapConfig {
  key: string;
  path: string;
  tileset: {
    name: string;
    path: string;
  }[];
}

// Game constants
export const MAPS = {
  PROTOTYPE: {
    key: "prototype-map",
    path: "/assets/maps/Maprototype.tmj",
    tileset: [
      {
        name: "Robot_Warfare_tileset_arranged",
        path: "/assets/tilesets/environment/nature/Robot_Warfare_tileset_arranged.png",
      },
      {
        name: "Robot_Warfare_obstacles-and-objects",
        path: "/assets/tilesets/common/platforms/Robot_Warfare_obstacles-and-objects.png",
      },
      {
        name: "pixel-cyberpunk-interior",
        path: "/assets/tilesets/interiors/cyberpunk/pixel-cyberpunk-interior.png",
      },
      {
        name: "Basic_TX Plant",
        path: "/assets/tilesets/environment/nature/Basic_TX Plant.png",
      },
      {
        name: "Robot_Warfare_tileset_compressed",
        path: "/assets/tilesets/environment/nature/Robot_Warfare_tileset_compressed.png",
      },
      {
        name: "Basic_TX Plant32",
        path: "/assets/tilesets/environment/nature/Basic_TX Plant32.png",
      },
      {
        name: "building",
        path: "/assets/tilesets/interiors/modern/building.png",
      },
      {
        name: "Water",
        path: "/assets/tilesets/environment/nature/Water.png",
      },
      {
        name: "Fire64",
        path: "/assets/tilesets/special/animated/Fire64.png",
      },
      {
        name: "Explosions63",
        path: "/assets/tilesets/special/animated/Explosions63.png",
      },
      {
        name: "Rocks_04_64",
        path: "/assets/tilesets/special/animated/Rocks_04_64.png",
      },
    ],
  },
};

export const PLAYER_SPEED = 160;
export const TILE_SIZE = 16;
