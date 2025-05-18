import Phaser from "phaser";

// Import game scenes
import BootScene from "./scenes/BootScene";
import PreloadScene from "./scenes/PreloadScene";
import MainMenuScene from "./scenes/MainMenuScene";
import GameScene from "./scenes/GameScene";
import UIScene from "./scenes/UIScene";

/**
 * Default game configuration
 * Can be overridden when initializing the game
 */
export const DEFAULT_WIDTH = 800;
export const DEFAULT_HEIGHT = 600;
export const DEFAULT_ZOOM = 1;

/**
 * Phaser game configuration
 */
const config = {
  // Basic configuration
  type: Phaser.AUTO, // Let Phaser decide whether to use WebGL or Canvas
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,

  // Rendering settings
  pixelArt: true, // Enable pixel art mode (disable image smoothing)
  roundPixels: true, // Round pixel values to avoid subpixel rendering
  antialias: false, // Disable antialiasing for a crisp pixelated look

  // Scale configuration
  scale: {
    mode: Phaser.Scale.FIT, // Fit the game to the available space
    autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game horizontally and vertically
    parent: "game-container", // ID of the DOM element that will contain the game canvas
  },

  // Background color
  backgroundColor: "#000000",

  // Physics configuration
  physics: {
    default: "arcade", // Use the simpler Arcade Physics system
    arcade: {
      debug: process.env.NODE_ENV === "development", // Show physics bodies in dev mode
      gravity: { y: 0 }, // Disable gravity for top-down game
    },
  },

  // Scene configuration - listed in the order they'll be initialized
  scene: [BootScene, PreloadScene, MainMenuScene, GameScene, UIScene],

  // Audio settings
  audio: {
    disableWebAudio: false,
    noAudio: false,
  },

  // Input configuration
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: false,
  },

  // Render properties
  render: {
    powerPreference: "high-performance",
    batchSize: 2048, // Max number of game objects before a new batch is created
  },
};

/**
 * Create a customized game configuration
 *
 * @param {Object} customConfig - Custom configuration properties to override defaults
 * @returns {Object} Final Phaser game configuration
 */
export function createGameConfig(customConfig = {}) {
  return {
    ...config,
    ...customConfig,
    // Deep merge physics settings if provided
    physics: customConfig.physics
      ? {
          ...config.physics,
          ...customConfig.physics,
          arcade: {
            ...config.physics.arcade,
            ...(customConfig.physics?.arcade || {}),
          },
        }
      : config.physics,
    // Deep merge scale settings if provided
    scale: customConfig.scale
      ? {
          ...config.scale,
          ...customConfig.scale,
        }
      : config.scale,
  };
}

/**
 * Game difficulty levels that can be used to adjust game parameters
 */
export const DIFFICULTY_LEVELS = {
  EASY: "easy",
  NORMAL: "normal",
  HARD: "hard",
};

/**
 * Player constants for movement and interactions
 */
export const PLAYER_CONSTANTS = {
  SPEED: 150,
  INTERACTION_DISTANCE: 50,
  ANIMATION_FRAMERATE: 10,
};

/**
 * Audio volume presets
 */
export const AUDIO_PRESETS = {
  MUSIC: 0.5,
  SFX: 0.8,
  UI: 0.6,
};

/**
 * Game states for tracking player progress
 */
export const GAME_STATES = {
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "gameOver",
  VICTORY: "victory",
};

/**
 * Debug settings for development mode
 */
export const DEBUG_SETTINGS = {
  SHOW_FPS: process.env.NODE_ENV === "development",
  SHOW_HITBOXES: process.env.NODE_ENV === "development",
  INVINCIBLE: false,
  UNLOCK_ALL: false,
};

/**
 * Helper function to get asset paths with proper prefixes
 *
 * @param {string} type - Asset type (images, audio, etc.)
 * @param {string} filename - Asset filename
 * @returns {string} Complete asset path
 */
export function getAssetPath(type, filename) {
  const BASE_PATH = "/assets/";

  switch (type) {
    case "image":
      return `${BASE_PATH}images/${filename}`;
    case "spritesheet":
      return `${BASE_PATH}sprites/${filename}`;
    case "tilemap":
      return `${BASE_PATH}maps/${filename}`;
    case "tileset":
      return `${BASE_PATH}tilesets/${filename}`;
    case "audio":
      return `${BASE_PATH}audio/${filename}`;
    case "font":
      return `${BASE_PATH}fonts/${filename}`;
    default:
      return `${BASE_PATH}${filename}`;
  }
}

// Default export for the main configuration
export default config;
