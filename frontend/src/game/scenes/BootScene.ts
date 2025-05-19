import Phaser from "phaser";
import { GameScene } from "@/types/phaser";

export default class BootScene extends Phaser.Scene implements GameScene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Create loading UI elements
    this.createLoadingUI();

    // Load minimum assets needed for the loading screen
    this.load.image("logo", "/assets/ui/logo.png");
    this.load.image("pixel-button", "/assets/ui/pixel-button.png");
    this.load.image(
      "pixel-button-pressed",
      "/assets/ui/pixel-button-pressed.png"
    );
    this.load.image("background-grid", "/assets/ui/background-grid.png");

    // Set up loading events
    this.load.on("progress", this.onLoadProgress, this);
    this.load.on("complete", this.onLoadComplete, this);
  }

  create(): void {
    // Apply pixel art settings
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Add subtle animation to loading text for visual feedback
    this.tweens.add({
      targets: this.loadingText,
      alpha: 0.8,
      duration: 500,
      ease: "Power1",
      yoyo: true,
      repeat: -1,
    });

    // Apply any global game settings here

    // Go to the preload scene after a short delay
    this.time.delayedCall(1000, () => {
      this.scene.start("PreloadScene");
    });
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background box for progress bar
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(centerX - 160, centerY - 25, 320, 50);

    // Initial empty progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add
      .text(centerX, centerY - 50, "INITIALIZING...", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#00f0ff",
      })
      .setOrigin(0.5);

    // Add cyberpunk styling with pixel border
    this.addPixelBorder(this.progressBox, 0x00f0ff);
  }

  private onLoadProgress(value: number): void {
    // Update progress bar as assets load
    const { width } = this.cameras.main;
    const centerX = width / 2;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x00f0ff, 1);
    this.progressBar.fillRect(
      centerX - 150,
      this.cameras.main.height / 2 - 15,
      300 * value,
      30
    );

    // Update text to show percentage
    const percentage = Math.floor(value * 100);
    this.loadingText.setText(`INITIALIZING... ${percentage}%`);
  }

  private onLoadComplete(): void {
    // Add completion flash effect
    this.tweens.add({
      targets: this.progressBar,
      alpha: 0,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        this.loadingText.setText("SYSTEM READY");
        this.loadingText.setColor("#42ffbf");
      },
    });
  }

  private addPixelBorder(
    graphics: Phaser.GameObjects.Graphics,
    color: number
  ): void {
    const lineWidth = 2;
    const alpha = 1;

    // Get the bounds of the filled rect
    const bounds = new Phaser.Geom.Rectangle(
      this.cameras.main.width / 2 - 160 - lineWidth,
      this.cameras.main.height / 2 - 25 - lineWidth,
      320 + lineWidth * 2,
      50 + lineWidth * 2
    );

    // Draw pixel-perfect borders
    graphics.lineStyle(lineWidth, color, alpha);
    graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // Add "pixel" corners for cyberpunk aesthetic
    const cornerSize = 8;

    // Top-left corner
    graphics.fillStyle(color, alpha);
    graphics.fillRect(bounds.x, bounds.y, cornerSize, lineWidth);
    graphics.fillRect(bounds.x, bounds.y, lineWidth, cornerSize);

    // Top-right corner
    graphics.fillRect(
      bounds.right - cornerSize,
      bounds.y,
      cornerSize,
      lineWidth
    );
    graphics.fillRect(
      bounds.right - lineWidth,
      bounds.y,
      lineWidth,
      cornerSize
    );

    // Bottom-left corner
    graphics.fillRect(
      bounds.x,
      bounds.bottom - lineWidth,
      cornerSize,
      lineWidth
    );
    graphics.fillRect(
      bounds.x,
      bounds.bottom - cornerSize,
      lineWidth,
      cornerSize
    );

    // Bottom-right corner
    graphics.fillRect(
      bounds.right - cornerSize,
      bounds.bottom - lineWidth,
      cornerSize,
      lineWidth
    );
    graphics.fillRect(
      bounds.right - lineWidth,
      bounds.bottom - cornerSize,
      lineWidth,
      cornerSize
    );
  }
}
