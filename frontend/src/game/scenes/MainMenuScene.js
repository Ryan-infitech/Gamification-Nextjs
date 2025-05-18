import Phaser from "phaser";

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainMenuScene" });
  }

  init(data) {
    this.gameData = data.gameData || this.registry.get("gameData") || {};
  }

  create() {
    // Get game dimensions
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Add background
    this.add
      .image(width / 2, height / 2, "background")
      .setDisplaySize(width, height);

    // Add logo
    const logo = this.add
      .image(width / 2, height * 0.3, "logo")
      .setDisplaySize(200, 200);

    // Add title text
    const titleText = this.add
      .text(width / 2, height * 0.5, "CodeQuest Pixels", {
        fontFamily: "Arial",
        fontSize: "48px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#000000",
          blur: 2,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // Add pulse animation to the title
    this.tweens.add({
      targets: titleText,
      scale: { from: 1, to: 1.05 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Create menu buttons
    this.createMenuButtons();

    // Add version text
    this.add
      .text(width - 10, height - 10, "v0.1.0", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#ffffff",
      })
      .setOrigin(1);

    // Play background music
    if (!this.sound.get("main-theme")) {
      this.sound.add("main-theme", { loop: true, volume: 0.5 }).play();
    }
  }

  createMenuButtons() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const centerX = width / 2;
    const startY = height * 0.6;
    const spacing = 60;

    // Create Play button
    this.createButton(centerX, startY, "Play Game", () => {
      if (this.gameData.hasCompletedTutorial) {
        this.scene.start("WorldMapScene");
      } else {
        this.scene.start("TutorialAreaScene");
      }
    });

    // Create Options button
    this.createButton(centerX, startY + spacing, "Options", () => {
      // Options scene would go here
      console.log("Options button clicked");
    });

    // Create Credits button
    this.createButton(centerX, startY + spacing * 2, "Credits", () => {
      // Credits scene would go here
      console.log("Credits button clicked");
    });

    // If user is logged in, show "Continue" instead of "Play Game"
    if (this.gameData.user && this.gameData.user.id) {
      // Show player info
      this.add.text(20, 20, `Welcome back, ${this.gameData.user.username}!`, {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      });

      // Show level and XP
      if (this.gameData.user.level) {
        this.add.text(
          20,
          50,
          `Level: ${this.gameData.user.level} | XP: ${
            this.gameData.user.xp || 0
          }`,
          {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 3,
          }
        );
      }
    }
  }

  createButton(x, y, text, callback) {
    // Create button container
    const button = this.add.container(x, y);

    // Button background
    const bg = this.add.image(0, 0, "button").setDisplaySize(200, 50);

    // Button text
    const buttonText = this.add
      .text(0, 0, text, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Add to container
    button.add([bg, buttonText]);

    // Make interactive
    bg.setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        bg.setTexture("button-hover");
        bg.setScale(1.05);
        buttonText.setScale(1.05);
      })
      .on("pointerout", () => {
        bg.setTexture("button");
        bg.setScale(1);
        buttonText.setScale(1);
      })
      .on("pointerdown", () => {
        this.sound.play("click");
        callback();
      });

    return button;
  }
}
