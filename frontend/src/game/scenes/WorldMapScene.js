import Phaser from "phaser";

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorldMapScene" });

    this.areas = [
      {
        id: "tutorial",
        name: "Tutorial Island",
        x: 200,
        y: 300,
        unlocked: true,
        scene: "TutorialAreaScene",
      },
      {
        id: "forest",
        name: "Coding Forest",
        x: 400,
        y: 200,
        unlocked: false,
        requiredLevel: 2,
        scene: "ForestAreaScene",
      },
      {
        id: "city",
        name: "Algorithm City",
        x: 600,
        y: 350,
        unlocked: false,
        requiredLevel: 5,
        scene: "CityAreaScene",
      },
      {
        id: "castle",
        name: "Data Structure Castle",
        x: 500,
        y: 500,
        unlocked: false,
        requiredLevel: 10,
        scene: "CastleAreaScene",
      },
    ];
  }

  init(data) {
    this.gameData = data.gameData || this.registry.get("gameData") || {};
    this.playerLevel = this.gameData?.user?.level || 1;
  }

  create() {
    // Load map
    this.createMap();

    // Add player marker
    this.createPlayerMarker();

    // Create area nodes
    this.createAreaNodes();

    // Add UI
    this.createUI();

    // Add back button
    this.createBackButton();

    // Play world map music if not already playing
    if (this.sound.get("main-theme")?.isPlaying) {
      this.sound.get("main-theme").stop();
    }

    if (!this.sound.get("world-theme")) {
      this.sound.add("world-theme", { loop: true, volume: 0.4 }).play();
    }
  }

  createMap() {
    // Create world map background
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Use tilemap if it exists, otherwise use a background image
    try {
      const map = this.make.tilemap({ key: "world-map" });
      const tileset = map.addTilesetImage("nature-tileset", "nature-tileset");

      map.createLayer("background", tileset);
      map.createLayer("decorations", tileset);
      map.createLayer("overlays", tileset);
    } catch (error) {
      console.warn(
        "World map tilemap not found, using background image instead"
      );
      this.add
        .image(width / 2, height / 2, "background")
        .setDisplaySize(width, height)
        .setAlpha(0.7);

      // Add some decorative elements to make it look more like a map
      for (let i = 0; i < 20; i++) {
        const x = Phaser.Math.Between(50, width - 50);
        const y = Phaser.Math.Between(50, height - 50);
        const size = Phaser.Math.Between(20, 40);

        this.add.circle(x, y, size, 0x00aa00, 0.3);
      }

      // Add "water" areas
      for (let i = 0; i < 5; i++) {
        const x = Phaser.Math.Between(50, width - 50);
        const y = Phaser.Math.Between(50, height - 50);
        const width = Phaser.Math.Between(50, 150);
        const height = Phaser.Math.Between(50, 100);

        this.add
          .rectangle(x, y, width, height, 0x0088ff, 0.3)
          .setStrokeStyle(2, 0x0055aa);
      }
    }

    // Add map title
    this.add
      .text(width / 2, 40, "World Map", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
  }

  createPlayerMarker() {
    // Player marker starts at the last area they visited, or tutorial by default
    const lastArea = this.gameData.lastVisitedArea || "tutorial";
    const area = this.areas.find((a) => a.id === lastArea) || this.areas[0];

    this.playerMarker = this.add
      .sprite(area.x, area.y, "player")
      .setScale(1.5)
      .setDepth(10);

    // Play idle animation
    this.playerMarker.play("player-idle");

    // Add glow effect around player
    const glow = this.add.circle(area.x, area.y, 25, 0xffff00, 0.4).setDepth(9);

    // Pulse animation for the glow
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 0.8 },
      scale: { from: 1, to: 1.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  createAreaNodes() {
    // Update which areas are unlocked based on player level
    this.areas.forEach((area) => {
      if (area.requiredLevel && this.playerLevel >= area.requiredLevel) {
        area.unlocked = true;
      }
    });

    // Create nodes for each area
    this.areas.forEach((area) => {
      // Create node container
      const node = this.add.container(area.x, area.y);
      node.setDepth(5);

      // Node background (different colors based on unlocked status)
      const bgColor = area.unlocked ? 0x00aa00 : 0x888888;
      const nodeBg = this.add
        .circle(0, 0, 20, bgColor, 1)
        .setStrokeStyle(3, 0xffffff);

      // Node icon or level requirement text
      if (area.unlocked) {
        // Show area icon
        const icon = this.add.sprite(0, 0, "area-icon");
        node.add(icon);
      } else {
        // Show required level
        const levelText = this.add
          .text(0, 0, area.requiredLevel.toString(), {
            fontFamily: "Arial",
            fontSize: "12px",
            color: "#ffffff",
          })
          .setOrigin(0.5);

        node.add(levelText);
      }

      // Add to container
      node.add(nodeBg);

      // Add area name text below node
      const nameText = this.add
        .text(0, 30, area.name, {
          fontFamily: "Arial",
          fontSize: "16px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5);

      // Make nodes interactive if they're unlocked
      if (area.unlocked) {
        nodeBg
          .setInteractive({ useHandCursor: true })
          .on("pointerover", () => {
            nodeBg.setFillStyle(0x00ff00);
            nameText.setScale(1.1);
          })
          .on("pointerout", () => {
            nodeBg.setFillStyle(bgColor);
            nameText.setScale(1);
          })
          .on("pointerdown", () => {
            this.sound.play("click");
            this.enterArea(area);
          });
      } else {
        // Add "locked" effect for locked areas
        const lock = this.add.sprite(0, 0, "lock-icon").setScale(0.8);
        node.add(lock);

        // Add info about level requirement
        const infoText = this.add
          .text(0, 48, `Requires Level ${area.requiredLevel}`, {
            fontFamily: "Arial",
            fontSize: "12px",
            color: "#ffff00",
            stroke: "#000000",
            strokeThickness: 3,
          })
          .setOrigin(0.5);
      }
    });

    // Draw paths between areas to show progression
    const graphics = this.add.graphics().setDepth(1);
    graphics.lineStyle(3, 0xffffff, 0.5);

    // Draw paths between nodes (tutorial to forest, forest to city, etc.)
    for (let i = 0; i < this.areas.length - 1; i++) {
      const start = this.areas[i];
      const end = this.areas[i + 1];

      graphics.beginPath();
      graphics.moveTo(start.x, start.y);
      graphics.lineTo(end.x, end.y);
      graphics.strokePath();
    }
  }

  createUI() {
    // Show player info
    const padding = 20;
    const playerInfo = this.add.container(padding, padding);

    // Background panel
    const panelBg = this.add
      .image(0, 0, "panel")
      .setOrigin(0, 0)
      .setDisplaySize(200, 80)
      .setAlpha(0.8);

    // Player name
    const playerName = this.add
      .text(10, 10, this.gameData.user?.username || "Player", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0);

    // Player level
    const levelText = this.add
      .text(10, 32, `Level: ${this.playerLevel}`, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0);

    // XP bar
    const xpBg = this.add.rectangle(10, 54, 180, 10, 0x000000).setOrigin(0);

    const xpCurrent = this.gameData.user?.xp || 0;
    const xpRequired = this.playerLevel * 100; // Example XP calculation
    const xpWidth = Math.min(180 * (xpCurrent / xpRequired), 180);

    const xpFill = this.add
      .rectangle(10, 54, xpWidth, 10, 0x00ff00)
      .setOrigin(0);

    const xpText = this.add
      .text(100, 54, `${xpCurrent}/${xpRequired} XP`, {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    // Add all elements to container
    playerInfo.add([panelBg, playerName, levelText, xpBg, xpFill, xpText]);
  }

  createBackButton() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Back button in the bottom-left corner
    const backButton = this.add.container(100, height - 50);

    const buttonBg = this.add.image(0, 0, "button").setDisplaySize(150, 40);

    const buttonText = this.add
      .text(0, 0, "Main Menu", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    backButton.add([buttonBg, buttonText]);

    buttonBg
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        buttonBg.setTexture("button-hover");
        buttonBg.setScale(1.05);
        buttonText.setScale(1.05);
      })
      .on("pointerout", () => {
        buttonBg.setTexture("button");
        buttonBg.setScale(1);
        buttonText.setScale(1);
      })
      .on("pointerdown", () => {
        this.sound.play("click");

        // Stop world map music if it's playing
        if (this.sound.get("world-theme")?.isPlaying) {
          this.sound.get("world-theme").stop();
        }

        this.scene.start("MainMenuScene");
      });
  }

  enterArea(area) {
    // Save which area the player visited
    this.gameData.lastVisitedArea = area.id;
    this.registry.set("gameData", this.gameData);

    // Transition to the area scene
    this.cameras.main.fade(500, 0, 0, 0, false, (camera, progress) => {
      if (progress === 1) {
        // Stop world map music if it's playing
        if (this.sound.get("world-theme")?.isPlaying) {
          this.sound.get("world-theme").stop();
        }

        this.scene.start(area.scene, { gameData: this.gameData });
      }
    });
  }
}
