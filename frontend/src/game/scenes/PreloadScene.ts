import Phaser from "phaser";
import { MAPS } from "../config";
import { GameScene } from "@/types/phaser";

export default class PreloadScene extends Phaser.Scene implements GameScene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    this.createLoadingUI();

    // Load main menu assets
    this.load.image("background-grid", "/assets/ui/background-grid.png");
    this.load.image("logo-full", "/assets/ui/logo-full.png");
    this.load.image("pixel", "/assets/effects/pixel.png");

    // UI elements
    this.load.image("panel", "/assets/ui/panel.png");
    this.load.image("button", "/assets/ui/button.png");
    this.load.image("button-pressed", "/assets/ui/button-pressed.png");
    this.load.image("checkbox", "/assets/ui/checkbox.png");
    this.load.image("checkbox-checked", "/assets/ui/checkbox-checked.png");
    this.load.image("slider", "/assets/ui/slider.png");
    this.load.image("slider-handle", "/assets/ui/slider-handle.png");

    // Audio
    this.load.audio("bgm", ["/assets/audio/cyberpunk-street.mp3"]);
    this.load.audio("click", ["/assets/audio/click.wav"]);
    this.load.audio("hover", ["/assets/audio/hover.wav"]);
    this.load.audio("success", ["/assets/audio/success.wav"]);
    this.load.audio("error", ["/assets/audio/error.wav"]);

    // Load player character spritesheet
    this.load.spritesheet(
      "player",
      "/assets/sprites/player/cyberpunk-character.png",
      {
        frameWidth: 16,
        frameHeight: 32,
      }
    );

    // Load map and tilesets
    this.load.tilemapTiledJSON(MAPS.PROTOTYPE.key, MAPS.PROTOTYPE.path);

    // Load all tilesets for the map
    MAPS.PROTOTYPE.tileset.forEach((tileset) => {
      const key = tileset.name.replace(/\s+/g, "_").toLowerCase();
      this.load.image(key, tileset.path);
    });

    // Update loading bar as assets are loaded
    this.load.on("progress", (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ffff, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 4,
        this.cameras.main.height / 2 - 16,
        (this.cameras.main.width / 2) * value,
        32
      );
    });

    // Clean up after loading is complete
    this.load.on("complete", () => {
      this.progressBar.destroy();
      this.loadingBar.destroy();
    });
  }

  create(): void {
    // Create animations for the player
    this.createPlayerAnimations();

    // Add a small delay for visual polish
    this.time.delayedCall(500, () => {
      // Go to main menu with fade transition
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start("MainMenuScene");
        }
      );
    });
  }

  private createLoadingUI(): void {
    // Create the loading bar background
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x222222, 1);
    this.loadingBar.fillRect(
      this.cameras.main.width / 4 - 2,
      this.cameras.main.height / 2 - 18,
      this.cameras.main.width / 2 + 4,
      36
    );

    // Create the progress bar
    this.progressBar = this.add.graphics();

    // Add loading text
    this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 40,
        "LOADING GAME ASSETS...",
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#00ffff",
        }
      )
      .setOrigin(0.5);
  }

  private createPlayerAnimations(): void {
    // Idle animations
    this.anims.create({
      key: "idle-down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "idle-up",
      frames: this.anims.generateFrameNumbers("player", { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });

    // Walk animations
    this.anims.create({
      key: "walk-down",
      frames: this.anims.generateFrameNumbers("player", { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk-up",
      frames: this.anims.generateFrameNumbers("player", { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk-left",
      frames: this.anims.generateFrameNumbers("player", { start: 16, end: 19 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk-right",
      frames: this.anims.generateFrameNumbers("player", { start: 20, end: 23 }),
      frameRate: 8,
      repeat: -1,
    });
  }
}
