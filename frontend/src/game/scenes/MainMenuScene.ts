import Phaser from "phaser";
import { GameScene } from "@/types/phaser";

export default class MainMenuScene extends Phaser.Scene implements GameScene {
  private title!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Image;
  private optionsButton!: Phaser.GameObjects.Image;
  private backgroundGrid!: Phaser.GameObjects.TileSprite;
  private soundEnabled: boolean = true;
  private bgMusic!: Phaser.Sound.BaseSound;

  // Decorative cyberpunk elements
  private scanline!: Phaser.GameObjects.Graphics;
  private glitchFX: Phaser.FX.Glitch | null = null;
  private glitchTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: "MainMenuScene" });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Create animated background
    this.createBackground(width, height);

    // Add scanline effect
    this.createScanlines(width, height);

    // Add title with cyberpunk styling
    this.createTitle(width, height);

    // Create menu buttons
    this.createButtons(width, height);

    // Create sound toggle
    this.createSoundToggle(width, height);

    // Add version info
    this.createVersionInfo(width, height);

    // Play background music
    this.setupAudio();

    // Add camera effects
    this.setupCameraEffects();

    // Set up periodic glitch effect
    this.setupGlitchEffect();

    // Fade in the scene
    this.cameras.main.fadeIn(1000, 0, 0, 0);
  }

  update(time: number, delta: number): void {
    // Update background animation
    this.backgroundGrid.tilePositionY += 0.2;
    this.backgroundGrid.tilePositionX += 0.1;

    // Update scanline effect
    this.updateScanlines(time);
  }

  private createBackground(width: number, height: number): void {
    // Cyberpunk grid background
    this.backgroundGrid = this.add
      .tileSprite(0, 0, width, height, "background-grid")
      .setOrigin(0, 0)
      .setTint(0x150a20)
      .setAlpha(0.4);

    // Add overlay gradient
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(
      0x000000,
      0x000000,
      0x150a20,
      0x150a20,
      0.6,
      0.6,
      0.2,
      0.2
    );
    gradient.fillRect(0, 0, width, height);

    // Add some ambient "cyberpunk city" particles
    this.addAmbientParticles();
  }

  private createTitle(width: number, height: number): void {
    // Main title
    this.title = this.add
      .text(width / 2, height * 0.2, "CODEQUEST PIXELS", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#00f0ff",
        stroke: "#000000",
        strokeThickness: 6,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#000",
          blur: 2,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // Add subtitle
    const subtitle = this.add
      .text(width / 2, height * 0.28, "A CYBERPUNK CODING ADVENTURE", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ff00ff",
      })
      .setOrigin(0.5);

    // Add neon glow to title
    this.title.setData("glowColor", 0x00f0ff);
    this.title.setData("glowAmount", 0);

    // Animate the title glow
    this.tweens.add({
      targets: this.title.getData("glowAmount"),
      duration: 1500,
      yoyo: true,
      repeat: -1,
      from: 0,
      to: 16,
      onUpdate: () => {
        const glowColor = this.title.getData("glowColor");
        const glowAmount = this.title.getData("glowAmount");
        const hexColor = Phaser.Display.Color.GetColor(
          (glowColor >> 16) & 0xff,
          (glowColor >> 8) & 0xff,
          glowColor & 0xff
        );
        this.title.setShadow(0, 0, hexColor, glowAmount);
      },
    });
  }

  private createButtons(width: number, height: number): void {
    // Start Game button
    this.startButton = this.add
      .image(width / 2, height * 0.5, "pixel-button")
      .setDisplaySize(200, 50)
      .setInteractive({ useHandCursor: true });

    const startText = this.add
      .text(width / 2, height * 0.5, "START GAME", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Options button
    this.optionsButton = this.add
      .image(width / 2, height * 0.6, "pixel-button")
      .setDisplaySize(200, 50)
      .setInteractive({ useHandCursor: true });

    const optionsText = this.add
      .text(width / 2, height * 0.6, "OPTIONS", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Button event handling
    this.startButton.on("pointerdown", () => {
      this.startButton.setTexture("pixel-button-pressed");
      this.sound.play("click");
    });

    this.startButton.on("pointerup", () => {
      this.startButton.setTexture("pixel-button");

      // Add transition effect
      this.cameras.main.flash(300, 0, 240, 255);
      this.cameras.main.fadeOut(500);

      this.time.delayedCall(500, () => {
        this.scene.start("GameScene");
      });
    });

    this.startButton.on("pointerout", () => {
      this.startButton.setTexture("pixel-button");
    });

    this.optionsButton.on("pointerdown", () => {
      this.optionsButton.setTexture("pixel-button-pressed");
      this.sound.play("click");
    });

    this.optionsButton.on("pointerup", () => {
      this.optionsButton.setTexture("pixel-button");
      // Future: Show options menu
    });

    this.optionsButton.on("pointerout", () => {
      this.optionsButton.setTexture("pixel-button");
    });

    // Add hover effects
    [this.startButton, this.optionsButton].forEach((button) => {
      button.on("pointerover", () => {
        button.setTint(0x88ffff);
        this.sound.play("hover", { volume: 0.5 });
      });

      button.on("pointerout", () => {
        button.clearTint();
      });
    });
  }

  private createSoundToggle(width: number, height: number): void {
    // Sound toggle button in top-right corner
    const soundButton = this.add
      .image(width - 40, 40, "pixel-button")
      .setDisplaySize(60, 30)
      .setInteractive({ useHandCursor: true });

    const soundText = this.add
      .text(width - 40, 40, this.soundEnabled ? "SOUND: ON" : "SOUND: OFF", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    soundButton.on("pointerup", () => {
      this.soundEnabled = !this.soundEnabled;
      soundText.setText(this.soundEnabled ? "SOUND: ON" : "SOUND: OFF");
      this.sound.mute = !this.soundEnabled;
      this.sound.play("click");
    });
  }

  private createVersionInfo(width: number, height: number): void {
    // Version text in bottom-right corner
    this.add
      .text(width - 10, height - 10, "v0.1.0 ALPHA", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#444444",
      })
      .setOrigin(1);
  }

  private setupAudio(): void {
    // Load and play background music if not already playing
    if (!this.sound.get("bgm")) {
      this.bgMusic = this.sound.add("bgm", {
        volume: 0.4,
        loop: true,
      });

      if (!this.sound.locked) {
        // If audio already unlocked, play immediately
        this.bgMusic.play();
      } else {
        // Wait for unlock
        this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
          this.bgMusic.play();
        });
      }
    }

    // Add sound effects if they don't exist yet
    if (!this.sound.get("click")) {
      this.sound.add("click", { volume: 0.5 });
    }

    if (!this.sound.get("hover")) {
      this.sound.add("hover", { volume: 0.2 });
    }
  }

  private createScanlines(width: number, height: number): void {
    // Create scanline effect
    this.scanline = this.add.graphics();
    this.scanline.setDepth(100); // Make sure scanlines are on top

    // Initial draw
    this.scanline.fillStyle(0x000000, 0.2);
    for (let y = 0; y < height; y += 4) {
      this.scanline.fillRect(0, y, width, 1);
    }
  }

  private updateScanlines(time: number): void {
    // Animate scanlines for a CRT effect
    const { width, height } = this.cameras.main;
    const offset = Math.floor(time * 0.1) % 4;

    this.scanline.clear();
    this.scanline.fillStyle(0x000000, 0.2);

    for (let y = offset; y < height; y += 4) {
      this.scanline.fillRect(0, y, width, 1);
    }
  }

  private setupCameraEffects(): void {
    // Add subtle camera shake for ambience
    this.cameras.main.shake(2000, 0.001, true);
  }

  private setupGlitchEffect(): void {
    // Apply glitch effect to title periodically
    if (this.title.postFX) {
      this.glitchFX = this.title.postFX.addGlitch(0, 0, 0, 0);

      // Setup periodic glitch
      this.glitchTimer = this.time.addEvent({
        delay: Phaser.Math.Between(5000, 10000),
        callback: this.triggerGlitch,
        callbackScope: this,
        loop: true,
      });
    }
  }

  private triggerGlitch(): void {
    if (this.glitchFX) {
      // Activate glitch effect temporarily
      this.glitchFX.setActive(true).setStrength(0.02);

      // Reset after a short delay
      this.time.delayedCall(Phaser.Math.Between(100, 500), () => {
        if (this.glitchFX) {
          this.glitchFX.setActive(false);
        }
      });

      // Randomize next glitch timing
      if (this.glitchTimer) {
        this.glitchTimer.delay = Phaser.Math.Between(3000, 8000);
      }
    }
  }

  private addAmbientParticles(): void {
    // Create particles for cyberpunk city "dust" effect
    const particles = this.add.particles(0, 0, "pixel", {
      x: { min: 0, max: this.cameras.main.width },
      y: { min: 0, max: this.cameras.main.height },
      scale: { start: 0.5, end: 0 },
      speed: { min: 10, max: 50 },
      angle: { min: 0, max: 360 },
      blendMode: "ADD",
      lifespan: 2000,
      tint: [0x00f0ff, 0xff00ff, 0x7b61ff],
      quantity: 1,
      frequency: 200,
    });

    particles.setDepth(1);
  }
}
