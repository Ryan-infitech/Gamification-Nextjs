import Phaser from "phaser";

/**
 * Preload Scene - Loads all game assets and displays a loading bar
 */
class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  init(data) {
    this.gameData = data.gameData;
  }

  preload() {
    // Create loading bar
    this.createLoadingBar();

    // Load images
    this.loadImages();

    // Load spritesheets
    this.loadSpritesheets();

    // Load tilemaps
    this.loadTilemaps();

    // Load audio
    this.loadAudio();

    // Load bitmap fonts
    this.loadFonts();
  }

  createLoadingBar() {
    // Create a loading bar using graphics
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Add loading background
    this.add
      .image(width / 2, height / 2 - 50, "loading-background")
      .setOrigin(0.5);

    // Add logo
    this.add
      .image(width / 2, height / 2 - 150, "logo")
      .setOrigin(0.5)
      .setScale(0.5);

    // Create loading bar container
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Loading text
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace",
        fill: "#ffffff",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    // Percentage text
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: "0%",
      style: {
        font: "18px monospace",
        fill: "#ffffff",
      },
    });
    percentText.setOrigin(0.5, 0.5);

    // Loading asset text
    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: "",
      style: {
        font: "18px monospace",
        fill: "#ffffff",
      },
    });
    assetText.setOrigin(0.5, 0.5);

    // Update the loading bar as assets are loaded
    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x0096ff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      percentText.setText(`${parseInt(value * 100)}%`);
    });

    // Update the asset text with the asset being loaded
    this.load.on("fileprogress", (file) => {
      assetText.setText(`Loading: ${file.key}`);
    });

    // Remove the loading bar when complete
    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });
  }

  loadImages() {
    // UI elements
    this.load.image("button", "/assets/images/ui/button.png");
    this.load.image("button-hover", "/assets/images/ui/button-hover.png");
    this.load.image("panel", "/assets/images/ui/panel.png");
    this.load.image("dialog-box", "/assets/images/ui/dialog-box.png");

    // Game world
    this.load.image("background", "/assets/images/background.png");
  }

  loadSpritesheets() {
    // Player character
    this.load.spritesheet("player", "/assets/sprites/player.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    // NPCs
    this.load.spritesheet("npc", "/assets/sprites/npc.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Items
    this.load.spritesheet("items", "/assets/sprites/items.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Effects
    this.load.spritesheet("effects", "/assets/sprites/effects.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  loadTilemaps() {
    // Load the tilemap JSON file
    this.load.tilemapTiledJSON("map", "/assets/maps/Maprototype.tmj");

    // Load the tilesets used in the map
    this.load.image(
      "nature-tileset",
      "/assets/tilesets/environment/nature/Robot_Warfare_tileset_arranged.png"
    );
    this.load.image(
      "platform-tileset",
      "/assets/tilesets/common/platforms/Robot_Warfare_obstacles-and-objects.png"
    );
    this.load.image(
      "interior-tileset",
      "/assets/tilesets/interiors/cyberpunk/pixel-cyberpunk-interior.png"
    );
  }

  loadAudio() {
    // Music
    this.load.audio("main-theme", [
      "/assets/audio/music/main-theme.mp3",
      "/assets/audio/music/main-theme.ogg",
    ]);

    // Sound effects
    this.load.audio("click", "/assets/audio/sfx/click.mp3");
    this.load.audio("collect", "/assets/audio/sfx/collect.mp3");
    this.load.audio("footstep", "/assets/audio/sfx/footstep.mp3");
  }

  loadFonts() {
    // Bitmap fonts for better pixel art text
    this.load.bitmapFont(
      "pixel",
      "/assets/fonts/pixel.png",
      "/assets/fonts/pixel.xml"
    );
  }

  create() {
    // Create animations
    this.createAnimations();

    // Start the main menu scene
    this.scene.start("MainMenuScene", { gameData: this.gameData });
  }

  createAnimations() {
    // Player animations
    this.anims.create({
      key: "player-idle",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "player-walk",
      frames: this.anims.generateFrameNumbers("player", { start: 4, end: 11 }),
      frameRate: 12,
      repeat: -1,
    });

    // NPC animations
    this.anims.create({
      key: "npc-idle",
      frames: this.anims.generateFrameNumbers("npc", { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });

    // Effect animations
    this.anims.create({
      key: "collect-effect",
      frames: this.anims.generateFrameNumbers("effects", { start: 0, end: 5 }),
      frameRate: 12,
      repeat: 0,
    });
  }
}

export default PreloadScene;
