import Phaser from 'phaser';
import { GameConfig, SceneType } from '@/types/phaser';

/**
 * Membuat konfigurasi Phaser untuk game dengan optimasi pixel art
 * @param parent - ID elemen parent untuk canvas game
 * @param width - Lebar default game canvas
 * @param height - Tinggi default game canvas
 * @param debug - Mode debug untuk development
 * @returns Konfigurasi Phaser yang sudah dioptimasi
 */
export const createGameConfig = (
  parent: string,
  width: number = 960,
  height: number = 540, // 16:9 aspect ratio
  debug: boolean = false
): GameConfig => {
  return {
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width,
      height,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: debug,
      }
    },
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
    },
    pixelArt: true, // Untuk mempertahankan pixel art style
    roundPixels: true, // Hindari anti-aliasing
    pixelPerfect: true, // Memastikan pixel perfect rendering
    disableContextMenu: true, // Mencegah context menu di game canvas
    // Starter scenes akan diinjeksi secara dinamis
    scene: [], 
    customOptions: {
      debug,
      defaultScene: SceneType.BOOT,
      tileSize: 16, // Standard tile size for pixel art games
      uiScale: 1.0,
    },
    fps: {
      target: 60, // Target 60 fps
      forceSetTimeOut: true, // Paksa penggunaan setTimeout vs requestAnimationFrame untuk kasus-kasus tertentu
    },
    callbacks: {
      postBoot: (game) => {
        // Konfigurasi tambahan setelah game boot
        console.log('Game initialized with pixel art optimizations!');
      }
    },
    audio: {
      disableWebAudio: false,
      noAudio: false,
    },
    dom: {
      createContainer: true, // Untuk elemen DOM dalam game (misalnya input fields)
    },
    input: {
      keyboard: true,
      mouse: true,
      touch: true,
      gamepad: true,
    },
    title: 'Gamifikasi CS',
    version: '1.0.0',
    banner: {
      hidePhaser: false,
      text: '#ffffff',
      background: [
        '#4B7BEC', // primary dari theme
        '#45AAF2', // secondary dari theme
        '#2ECC71', // accent dari theme
      ]
    },
  };
};

/**
 * Definisi asset-asset yang perlu dimuat dalam game
 */
export const gameAssets = {
  images: [
    { key: 'logo', path: '/assets/game/ui/logo.png' },
    { key: 'background', path: '/assets/game/ui/background.png' },
    { key: 'dialog-box', path: '/assets/game/ui/dialog-box.png' },
    { key: 'button', path: '/assets/game/ui/button.png' },
  ],
  spritesheets: [
    {
      key: 'player',
      path: '/assets/game/sprites/player.png',
      frameWidth: 32,
      frameHeight: 32,
      animations: [
        {
          key: 'idle-down',
          frames: { start: 0, end: 3 },
          frameRate: 5,
          repeat: -1,
        },
        {
          key: 'idle-up',
          frames: { start: 4, end: 7 },
          frameRate: 5,
          repeat: -1,
        },
        {
          key: 'idle-left',
          frames: { start: 8, end: 11 },
          frameRate: 5,
          repeat: -1,
        },
        {
          key: 'idle-right',
          frames: { start: 12, end: 15 },
          frameRate: 5,
          repeat: -1,
        },
        {
          key: 'walk-down',
          frames: { start: 16, end: 23 },
          frameRate: 10,
          repeat: -1,
        },
        {
          key: 'walk-up',
          frames: { start: 24, end: 31 },
          frameRate: 10,
          repeat: -1,
        },
        {
          key: 'walk-left',
          frames: { start: 32, end: 39 },
          frameRate: 10,
          repeat: -1,
        },
        {
          key: 'walk-right',
          frames: { start: 40, end: 47 },
          frameRate: 10,
          repeat: -1,
        },
      ],
    },
    {
      key: 'npcs',
      path: '/assets/game/sprites/npcs.png',
      frameWidth: 32,
      frameHeight: 32,
    },
    {
      key: 'tileset-items',
      path: '/assets/game/tilesets/items.png',
      frameWidth: 16,
      frameHeight: 16,
    },
    {
      key: 'ui-icons',
      path: '/assets/game/ui/icons.png',
      frameWidth: 16,
      frameHeight: 16,
    },
  ],
  tilesets: [
    { key: 'main-tileset', path: '/assets/game/tilesets/main-tileset.png' },
    { key: 'interior-tileset', path: '/assets/game/tilesets/interior-tileset.png' },
  ],
  maps: [
    { key: 'world-map', path: '/assets/game/maps/world-map.json' },
    { key: 'tutorial-area', path: '/assets/game/maps/tutorial-area.json' },
  ],
  audio: [
    { key: 'bg-music', path: '/assets/game/audio/background.mp3' },
    { key: 'walk-sound', path: '/assets/game/audio/sfx/walk.mp3' },
    { key: 'interact-sound', path: '/assets/game/audio/sfx/interact.mp3' },
    { key: 'success-sound', path: '/assets/game/audio/sfx/success.mp3' },
  ],
};

/**
 * Inisialisasi game scenes
 * @param game - Game instance Phaser
 */
export const initScenes = (game: Phaser.Game): void => {
  // Scenes akan diimport dan ditambahkan ke game instance
  // Implementasi ini akan dinamis berdasarkan load requirements
  console.log('Scenes will be initialized dynamically');
};

/**
 * Inisialisasi game dengan konfigurasi
 * @param containerId - ID container untuk game
 * @param width - Lebar game canvas
 * @param height - Tinggi game canvas
 * @returns Instance Phaser.Game
 */
export const initGame = (
  containerId: string,
  width?: number,
  height?: number,
  debug: boolean = false
): Phaser.Game => {
  // Buat konfigurasi game
  const config = createGameConfig(containerId, width, height, debug);
  
  // Jika Phaser masih undefined, kembalikan null
  if (typeof window === 'undefined' || !Phaser) {
    console.error('Phaser tidak tersedia. Game tidak dapat diinisialisasi.');
    return null as unknown as Phaser.Game;
  }
  
  try {
    // Create game instance
    const game = new Phaser.Game(config);
    
    // Initialize scenes
    initScenes(game);
    
    return game;
  } catch (error) {
    console.error('Error initializing Phaser game:', error);
    return null as unknown as Phaser.Game;
  }
};

export default { createGameConfig, gameAssets, initGame };
