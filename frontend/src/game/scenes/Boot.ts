import Phaser from 'phaser';
import { gameAssets } from '../config';
import { SceneType, GameConfig, GameEvents } from '@/types/phaser';

/**
 * Boot scene untuk loading assets dan menampilkan splash screen
 */
export default class BootScene extends Phaser.Scene {
  // Properties
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private loadingBg!: Phaser.GameObjects.Graphics;
  private progressBarHeight: number = 25;
  private progressBarWidth: number = 400;
  private loadingAssets: boolean = false;

  // References to assets that can be used across scenes
  private gameLogoImage!: Phaser.GameObjects.Image;
  private gameConfig: GameConfig;
  
  constructor() {
    super({
      key: SceneType.BOOT
    });
  }

  /**
   * Preload assets yang dibutuhkan untuk loading screen
   * Minimal loading screen assets
   */
  preload(): void {
    this.gameConfig = this.game.config as GameConfig;

    // Load logo dan assets for loading screen first
    this.load.image('logo', '/assets/game/ui/logo.png');
    this.load.image('pixel-bg', '/assets/game/ui/pixel-bg.png');
  }

  /**
   * Create loading screen dan mulai loading assets
   */
  create(): void {
    // Check jika kita sudah loading assets (prevent double load)
    if (this.loadingAssets) return;
    this.loadingAssets = true;

    // Show logo
    this.gameLogoImage = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 3,
      'logo'
    );
    this.gameLogoImage.setScale(0.5);

    // Setup background untuk loading bar
    this.loadingBg = this.add.graphics();
    this.loadingBg.fillStyle(0x2F3542, 0.8);
    this.loadingBg.fillRoundedRect(
      (this.cameras.main.width - this.progressBarWidth) / 2 - 10,
      this.cameras.main.height / 2 - this.progressBarHeight / 2 - 10,
      this.progressBarWidth + 20,
      this.progressBarHeight + 20,
      5
    );

    // Setup loading bar
    this.loadingBar = this.add.graphics();
    this.drawLoadingBar(0); // 0% progress

    // Loading text
    this.loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 40,
      'Loading...',
      {
        fontFamily: 'Press Start 2P',
        fontSize: '16px',
        color: '#FFFFFF'
      }
    ).setOrigin(0.5);

    // Pixel dust particles for fancy loading effect
    this.createLoadingParticles();

    // Register event listeners
    this.registerLoaderEvents();

    // Start loading all game assets
    this.loadGameAssets();
  }

  /**
   * Register loader events untuk progress bar dan complete handling
   */
  private registerLoaderEvents(): void {
    // Show progress as assets are loaded
    this.load.on('progress', (value: number) => {
      this.drawLoadingBar(value);
      const percentage = Math.floor(value * 100);
      this.loadingText.setText(`Loading... ${percentage}%`);
    });

    // Update stage text as files are loaded
    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      if (file.type === 'image') {
        this.loadingText.setText(`Loading ${file.key}...`);
      }
    });

    // Move to next scene when loading is complete
    this.load.on('complete', () => {
      this.loadingText.setText('Loading complete!');
      
      // Add delay before transitioning to menu for better UX
      this.time.delayedCall(1000, () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          // Check if we should go to tutorial or menu
          const shouldShowTutorial = this.checkShouldShowTutorial();
          const nextScene = shouldShowTutorial ? SceneType.TUTORIAL : SceneType.MAIN_MENU;
          
          // Start next scene
          this.scene.start(nextScene);
        });
      });
    });
  }

  /**
   * Load all game assets
   */
  private loadGameAssets(): void {
    // Load image assets
    gameAssets.images.forEach(img => {
      this.load.image(img.key, img.path);
    });

    // Load sprite sheets
    gameAssets.spritesheets.forEach(sprite => {
      this.load.spritesheet(sprite.key, sprite.path, {
        frameWidth: sprite.frameWidth,
        frameHeight: sprite.frameHeight
      });
    });

    // Load tilesets
    gameAssets.tilesets.forEach(tileset => {
      this.load.image(tileset.key, tileset.path);
    });

    // Load tilemaps
    gameAssets.maps.forEach(map => {
      this.load.tilemapTiledJSON(map.key, map.path);
    });

    // Load audio assets
    gameAssets.audio.forEach(audio => {
      this.load.audio(audio.key, audio.path);
    });

    // Start loading process
    this.load.start();
  }

  /**
   * Draw loading bar dengan current progress
   */
  private drawLoadingBar(value: number): void {
    // Clear previous bar
    this.loadingBar.clear();
    
    // Fill background (gray)
    this.loadingBar.fillStyle(0x5D6D7E, 1);
    this.loadingBar.fillRoundedRect(
      (this.cameras.main.width - this.progressBarWidth) / 2,
      this.cameras.main.height / 2 - this.progressBarHeight / 2,
      this.progressBarWidth,
      this.progressBarHeight,
      5
    );

    // Only add the progress bar if there is progress
    if (value > 0) {
      // Fill progress (primary color)
      this.loadingBar.fillStyle(0x4B7BEC, 1);
      const width = (this.progressBarWidth - 4) * value;
      this.loadingBar.fillRoundedRect(
        (this.cameras.main.width - this.progressBarWidth) / 2 + 2,
        this.cameras.main.height / 2 - this.progressBarHeight / 2 + 2,
        width,
        this.progressBarHeight - 4,
        3
      );

      // Add pixel effect at the edge
      this.loadingBar.fillStyle(0x45AAF2, 1);
      const pixelWidth = 6;
      if (width > pixelWidth) {
        for (let i = 0; i < 3; i++) {
          this.loadingBar.fillRect(
            (this.cameras.main.width - this.progressBarWidth) / 2 + 2 + width - pixelWidth,
            this.cameras.main.height / 2 - this.progressBarHeight / 2 + 4 + i * 6,
            pixelWidth,
            4
          );
        }
      }
    }
  }

  /**
   * Create loading particle effect
   */
  private createLoadingParticles(): void {
    const particles = this.add.particles('pixel-bg');
    
    particles.createEmitter({
      frame: 0,
      x: this.cameras.main.width / 2,
      y: this.cameras.main.height * 0.7,
      lifespan: 2000,
      speedY: { min: -100, max: -50 },
      speedX: { min: -20, max: 20 },
      angle: { min: -15, max: 15 },
      scale: { start: 0.5, end: 0 },
      quantity: 2,
      blendMode: 'ADD',
      tint: [0x4B7BEC, 0x45AAF2, 0x2ECC71],
      alpha: { start: 1, end: 0 }
    });
  }

  /**
   * Check if we should show tutorial to this player (new player)
   */
  private checkShouldShowTutorial(): boolean {
    // Check registry or local storage to see if player is new
    // In a real app, this would check player progress in database
    const registry = this.game.registry;
    const playerData = registry.get('playerData');
    
    if (playerData && playerData.level > 1) {
      return false;
    }
    
    // Check localStorage for completed tutorial flag
    const completedTutorial = localStorage.getItem('completedTutorial');
    return !completedTutorial;
  }

  /**
   * Update method dipanggil setiap frame
   */
  update(): void {
    // Animate logo with a subtle floating effect
    if (this.gameLogoImage) {
      this.gameLogoImage.y = this.cameras.main.height / 3 + Math.sin(this.time.now / 500) * 5;
    }
  }
}
