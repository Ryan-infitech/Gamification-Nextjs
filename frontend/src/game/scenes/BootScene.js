import Phaser from "phaser";

/**
 * Boot Scene - The first scene that loads, displays a loading screen
 * and loads the necessary assets for the preloader scene
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Create loading bar
    this.createLoadingBar();

    // Load essential assets for the loading screen
    this.load.image("logo", "/assets/images/logo.png");
    this.load.image("background", "/assets/images/background.png");

    // Load UI assets
    this.loadUIAssets();

    // Load tilemaps and tilesets
    this.loadMaps();

    // Load character sprites
    this.loadCharacters();

    // Load item and object sprites
    this.loadItems();

    // Load audio
    this.loadAudio();
  }

  createLoadingBar() {
    // Get the game dimensions
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create loading bar background
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Create loading bar
    const progressBar = this.add.graphics();

    // Loading text
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: { font: "20px monospace", fill: "#ffffff" },
    });
    loadingText.setOrigin(0.5, 0.5);

    // Percentage text
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: "0%",
      style: { font: "18px monospace", fill: "#ffffff" },
    });
    percentText.setOrigin(0.5, 0.5);

    // Asset text
    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: "",
      style: { font: "18px monospace", fill: "#ffffff" },
    });
    assetText.setOrigin(0.5, 0.5);

    // Update the loading bar as assets are loaded
    this.load.on("progress", (value) => {
      percentText.setText(`${parseInt(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0x00aaff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    // Update the asset text with the file being loaded
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

  loadUIAssets() {
    // UI elements
    this.load.image("button", "/assets/images/ui/button.png");
    this.load.image("button-hover", "/assets/images/ui/button-hover.png");
    this.load.image("panel", "/assets/images/ui/panel.png");
    this.load.image("dialog-box", "/assets/images/ui/dialog-box.png");

    // Icons
    this.load.image("coin-icon", "/assets/images/ui/coin-icon.png");
    this.load.image("xp-icon", "/assets/images/ui/xp-icon.png");
    this.load.image("health-icon", "/assets/images/ui/health-icon.png");

    // Load bitmap font
    this.load.bitmapFont(
      "pixel-font",
      "/assets/fonts/pixel.png",
      "/assets/fonts/pixel.xml"
    );
  }

  loadMaps() {
    // Load tilemap data
    this.load.tilemapTiledJSON("map-prototype", "/assets/maps/Maprototype.tmj");
    this.load.tilemapTiledJSON("world-map", "/assets/maps/worldmap.json");

    // Load tilesets used in maps
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
    this.load.image(
      "water-tileset",
      "/assets/tilesets/environment/nature/Water.png"
    );
    this.load.image(
      "buildings-tileset",
      "/assets/tilesets/interiors/modern/building.png"
    );
    this.load.image(
      "plant-tileset",
      "/assets/tilesets/environment/nature/Basic_TX Plant.png"
    );
    this.load.image(
      "plant-tileset-32",
      "/assets/tilesets/environment/nature/Basic_TX Plant32.png"
    );
  }

  loadCharacters() {
    // Player character
    this.load.spritesheet("player", "/assets/sprites/player.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    // NPCs
    this.load.spritesheet("npc-mentor", "/assets/sprites/npc-mentor.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet("npc-quest", "/assets/sprites/npc-quest.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  loadItems() {
    // Collectibles
    this.load.spritesheet("coins", "/assets/sprites/coins.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet("powerups", "/assets/sprites/powerups.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Interactive objects
    this.load.spritesheet("chest", "/assets/sprites/chest.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet("door", "/assets/sprites/door.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  loadAudio() {
    // Background music
    this.load.audio("main-theme", [
      "/assets/audio/music/main-theme.mp3",
      "/assets/audio/music/main-theme.ogg",
    ]);

    this.load.audio("tutorial-theme", [
      "/assets/audio/music/tutorial-theme.mp3",
      "/assets/audio/music/tutorial-theme.ogg",
    ]);

    // Sound effects
    this.load.audio("click", "/assets/audio/sfx/click.mp3");
    this.load.audio("coin-collect", "/assets/audio/sfx/coin.mp3");
    this.load.audio("powerup", "/assets/audio/sfx/powerup.mp3");
    this.load.audio("door-open", "/assets/audio/sfx/door.mp3");
    this.load.audio("achievement", "/assets/audio/sfx/achievement.mp3");
  }

  create() {
    // Create animations
    this.createAnimations();

    // Start the main menu scene
    this.scene.start("MainMenuScene");
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
      key: "player-walk-down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "player-walk-up",
      frames: this.anims.generateFrameNumbers("player", { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "player-walk-left",
      frames: this.anims.generateFrameNumbers("player", { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "player-walk-right",
      frames: this.anims.generateFrameNumbers("player", { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1,
    });

    // Coin animation
    this.anims.create({
      key: "coin-spin",
      frames: this.anims.generateFrameNumbers("coins", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });

    // Chest animation
    this.anims.create({
      key: "chest-open",
      frames: this.anims.generateFrameNumbers("chest", { start: 0, end: 4 }),
      frameRate: 8,
      repeat: 0,
    });
  }
}

export default BootScene;
