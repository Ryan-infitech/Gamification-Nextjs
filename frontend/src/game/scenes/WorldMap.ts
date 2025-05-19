import Phaser from "phaser";
import {
  GameScene,
  TiledMapObject,
  PlayerMovement,
  PlayerInfo,
} from "@/types/phaser";
import { MAPS, PLAYER_SPEED, TILE_SIZE } from "../config";
import { Socket } from "socket.io-client";

export default class WorldMap extends Phaser.Scene implements GameScene {
  // Scene properties
  private map!: Phaser.Tilemaps.Tilemap;
  private player!: Phaser.Physics.Arcade.Sprite & {
    direction: "up" | "down" | "left" | "right";
    speed: number;
    updateMovement: (cursors: Phaser.Types.Input.Keyboard.CursorKeys) => void;
  };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private socket: Socket | null = null;
  private npcs: Phaser.Physics.Arcade.Group | null = null;
  private challengeZones: Phaser.Physics.Arcade.Group | null = null;
  private transitionZones: Phaser.Physics.Arcade.Group | null = null;
  private playerInfoText!: Phaser.GameObjects.Text;
  private minimap!: Phaser.GameObjects.Graphics;
  private minimapMask!: Phaser.Display.Masks.GeometryMask;
  private locationNameText!: Phaser.GameObjects.Text;

  // Network properties
  private lastPosition: { x: number; y: number } = { x: 0, y: 0 };
  private throttledPositionUpdate: boolean = false;
  private networkUpdateRate: number = 100; // ms

  // Game data
  private userData: any = null;
  private interactionActive: boolean = false;
  private interactionTarget: any = null;
  private locationName: string = "Algorithm Forest";

  constructor() {
    super({ key: "WorldMap" });
  }

  init(data: any): void {
    // Get user data from registry
    this.userData = this.registry.get("userData") || { username: "Player" };

    // Get any specific spawn data (from transitions)
    if (data && data.spawnPosition) {
      this.lastPosition = data.spawnPosition;
    }

    // Initialize network update properties
    this.throttledPositionUpdate = false;

    // Reset collection of other players
    this.otherPlayers = new Map();

    // Get socket reference from main game scene if available
    this.socket = (this.registry.get("socket") as Socket) || null;

    // Initialize interaction state
    this.interactionActive = false;
    this.interactionTarget = null;

    // Set scene location name
    this.locationName = data?.locationName || "Algorithm Forest";
  }

  preload(): void {
    // Most assets should be loaded in Preload scene, but we can load scene-specific
    // assets here if needed
  }

  create(): void {
    // Create the world map from Tiled JSON data
    this.createMap();

    // Set up the player
    this.createPlayer();

    // Set up NPCs and interactive zones
    this.createNPCs();
    this.createChallengeZones();
    this.createTransitionZones();

    // Set up controls
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Set up camera to follow player
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setZoom(2); // Adjust zoom for pixel art clarity

    // Create UI elements
    this.createUI();

    // Set up collisions
    this.createCollisions();

    // Set up network event listeners if socket is available
    if (this.socket) {
      this.setupNetworkListeners();

      // Emit join area event
      this.socket.emit("player:changeArea", {
        areaId: "world-map",
        position: {
          x: this.player.x,
          y: this.player.y,
        },
      });
    }

    // Display welcome message
    this.showLocationName(this.locationName);

    // Set up input for interaction
    this.input.keyboard!.on("keydown-E", this.handleInteraction, this);

    // Add some ambient particle effects for cyberpunk feel
    this.createAmbientEffects();
  }

  update(time: number, delta: number): void {
    // Handle player movement
    if (this.player && this.cursors) {
      this.player.updateMovement(this.cursors);

      // Send position updates to other players if moved
      if (
        this.socket &&
        !this.throttledPositionUpdate &&
        (this.player.x !== this.lastPosition.x ||
          this.player.y !== this.lastPosition.y)
      ) {
        this.throttledPositionUpdate = true;
        this.lastPosition = { x: this.player.x, y: this.player.y };

        // Emit movement to server
        this.socket.emit("player:move", {
          position: this.lastPosition,
          animation: `walk-${this.player.direction}`,
        });

        // Reset throttle after delay
        this.time.delayedCall(this.networkUpdateRate, () => {
          this.throttledPositionUpdate = false;
        });
      }

      // Check for interaction zones
      this.updateInteractionPrompts();
    }

    // Update minimap if it exists
    this.updateMinimap();
  }

  private createMap(): void {
    // Create the tilemap using the World Map JSON file
    this.map = this.make.tilemap({ key: MAPS.PROTOTYPE.key });

    // Add all tilesets
    const tilesets: Phaser.Tilemaps.Tileset[] = [];
    MAPS.PROTOTYPE.tileset.forEach((tileset) => {
      const key = tileset.name.replace(/\s+/g, "_").toLowerCase();
      const createdTileset = this.map.addTilesetImage(tileset.name, key);
      if (createdTileset) {
        tilesets.push(createdTileset);
      }
    });

    // Create all layers
    if (this.map.layers) {
      for (let i = 0; i < this.map.layers.length; i++) {
        const layerData = this.map.layers[i];
        if (layerData.type === "tilelayer") {
          const layer = this.map.createLayer(layerData.name, tilesets, 0, 0);
          if (layer) {
            // Set depth based on layer order
            layer.setDepth(i * 10);

            // Set collision for appropriate layers
            if (
              layerData.name === "Collision" ||
              layerData.name.includes("Buildings")
            ) {
              layer.setCollisionByProperty({ collides: true });

              // Debug collision in development
              if (process.env.NODE_ENV === "development") {
                const debugGraphics = this.add.graphics().setAlpha(0.4);
                layer.renderDebug(debugGraphics, {
                  tileColor: null,
                  collidingTileColor: new Phaser.Display.Color(255, 0, 0, 128),
                  faceColor: new Phaser.Display.Color(40, 39, 37, 255),
                });
              }
            }
          }
        }
      }
    }

    // Set world bounds based on map dimensions
    this.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
  }

  private createPlayer(): void {
    // Find spawn point from the map
    let spawnX = this.lastPosition.x || 100;
    let spawnY = this.lastPosition.y || 100;

    // If we have a spawn point object layer, use it
    const spawnLayer = this.map.getObjectLayer("Spawn");
    if (spawnLayer && spawnLayer.objects && spawnLayer.objects.length > 0) {
      const spawnPoint = spawnLayer.objects[0];
      spawnX = spawnPoint.x || spawnX;
      spawnY = spawnPoint.y || spawnY;
    }

    // Create the player sprite with physics
    this.player = this.physics.add.sprite(spawnX, spawnY, "player", 0) as any;
    this.player.setOrigin(0.5, 0.5);
    this.player.setCollideWorldBounds(true);

    // Add custom properties to player
    this.player.direction = "down";
    this.player.speed = PLAYER_SPEED;

    // Player update movement method
    this.player.updateMovement = (cursors) => {
      // Reset velocity
      this.player.setVelocity(0);

      // Diagonal movement
      let movingX = false;
      let movingY = false;

      // Horizontal movement
      if (cursors.left.isDown) {
        this.player.setVelocityX(-this.player.speed);
        this.player.direction = "left";
        movingX = true;
      } else if (cursors.right.isDown) {
        this.player.setVelocityX(this.player.speed);
        this.player.direction = "right";
        movingX = true;
      }

      // Vertical movement
      if (cursors.up.isDown) {
        this.player.setVelocityY(-this.player.speed);
        if (!movingX) this.player.direction = "up";
        movingY = true;
      } else if (cursors.down.isDown) {
        this.player.setVelocityY(this.player.speed);
        if (!movingX) this.player.direction = "down";
        movingY = true;
      }

      // Normalize diagonal movement speed
      if (movingX && movingY) {
        const normalizedSpeed = this.player.speed / Math.sqrt(2);
        this.player.setVelocity(
          this.player.body.velocity.x > 0 ? normalizedSpeed : -normalizedSpeed,
          this.player.body.velocity.y > 0 ? normalizedSpeed : -normalizedSpeed
        );
      }

      // Update animation based on movement
      if (movingX || movingY) {
        this.player.anims.play(`walk-${this.player.direction}`, true);
      } else {
        // Idle animation based on last direction
        if (["up", "down"].includes(this.player.direction)) {
          this.player.anims.play(`idle-${this.player.direction}`, true);
        } else {
          // Use specific frame for idle left/right
          this.player.anims.stop();
          this.player.setFrame(this.player.direction === "left" ? 16 : 20);
        }
      }
    };
  }

  private createNPCs(): void {
    // Create a physics group for NPCs
    this.npcs = this.physics.add.group();

    // Get NPC objects from Tiled map
    const npcLayer = this.map.getObjectLayer("Interactables");
    if (npcLayer && npcLayer.objects) {
      npcLayer.objects.forEach((obj) => {
        if (obj.type === "npc") {
          // Create NPC sprite at object location
          const npc = this.physics.add.sprite(obj.x!, obj.y!, "player", 0);
          npc.setData("type", "npc");
          npc.setData("id", obj.id);
          npc.setData("name", obj.name || "NPC");

          // Store any custom properties from Tiled
          if (obj.properties) {
            obj.properties.forEach((prop) => {
              npc.setData(prop.name, prop.value);
            });
          }

          // Add to NPC group
          this.npcs.add(npc);

          // Add chat bubble or indicator
          const indicator = this.add.sprite(obj.x!, obj.y! - 20, "ui", "chat");
          indicator.setScale(0.5);
          indicator.setVisible(false);
          npc.setData("indicator", indicator);
        }
      });
    }
  }

  private createChallengeZones(): void {
    // Create a physics group for challenge zones
    this.challengeZones = this.physics.add.group();

    // Get challenge zones from Tiled map
    const interactLayer = this.map.getObjectLayer("Interactables");
    if (interactLayer && interactLayer.objects) {
      interactLayer.objects.forEach((obj) => {
        if (obj.type === "challenge") {
          // Create invisible sprite as interaction zone
          const zone = this.physics.add.sprite(obj.x!, obj.y!, "pixel");
          zone.setAlpha(0.1); // Almost invisible, but can be seen in dev
          zone.setDisplaySize(obj.width || 32, obj.height || 32);

          // Set challenge data
          zone.setData("type", "challenge");
          zone.setData("id", obj.id);
          zone.setData("name", obj.name || "Challenge");

          // Store custom properties
          if (obj.properties) {
            obj.properties.forEach((prop) => {
              zone.setData(prop.name, prop.value);
            });
          }

          // Add to challenge zones group
          this.challengeZones.add(zone);

          // Add visual indicator
          const indicator = this.add.sprite(
            obj.x!,
            obj.y! - 20,
            "ui",
            "challenge"
          );
          indicator.setScale(0.5);
          indicator.setVisible(false);
          zone.setData("indicator", indicator);

          // Add a pulsing effect to make it noticeable
          if (
            obj.properties?.find((p) => p.name === "active" && p.value === true)
          ) {
            this.tweens.add({
              targets: indicator,
              alpha: { from: 0.7, to: 1 },
              scale: { from: 0.4, to: 0.5 },
              duration: 1000,
              ease: "Sine.easeInOut",
              yoyo: true,
              repeat: -1,
            });
            indicator.setVisible(true);
          }
        }
      });
    }
  }

  private createTransitionZones(): void {
    // Create a physics group for transition zones
    this.transitionZones = this.physics.add.group();

    // Get transition zones from Tiled map
    const transitionLayer = this.map.getObjectLayer("Finish");
    if (transitionLayer && transitionLayer.objects) {
      transitionLayer.objects.forEach((obj) => {
        if (obj.type === "transition") {
          // Create invisible sprite as transition zone
          const zone = this.physics.add.sprite(obj.x!, obj.y!, "pixel");
          zone.setAlpha(0.1); // Almost invisible
          zone.setDisplaySize(obj.width || 32, obj.height || 32);

          // Set transition data
          zone.setData("type", "transition");
          zone.setData("id", obj.id);
          zone.setData(
            "targetScene",
            obj.properties?.find((p) => p.name === "targetScene")?.value ||
              "TutorialArea"
          );
          zone.setData(
            "targetX",
            obj.properties?.find((p) => p.name === "targetX")?.value || 0
          );
          zone.setData(
            "targetY",
            obj.properties?.find((p) => p.name === "targetY")?.value || 0
          );

          // Add to transition zones group
          this.transitionZones.add(zone);
        }
      });
    }
  }

  private createUI(): void {
    // Create player info display
    this.playerInfoText = this.add.text(
      10,
      10,
      `${this.userData.username || "Player"}`,
      {
        fontSize: "14px",
        color: "#00f0ff",
        stroke: "#000",
        strokeThickness: 4,
        fontFamily: "monospace",
      }
    );
    this.playerInfoText.setScrollFactor(0);
    this.playerInfoText.setDepth(1000);

    // Create location name text (for entrance/exit notifications)
    this.locationNameText = this.add.text(this.cameras.main.width / 2, 50, "", {
      fontSize: "20px",
      color: "#00f0ff",
      stroke: "#000",
      strokeThickness: 4,
      fontFamily: "monospace",
    });
    this.locationNameText.setOrigin(0.5, 0);
    this.locationNameText.setScrollFactor(0);
    this.locationNameText.setDepth(1000);
    this.locationNameText.setAlpha(0);

    // Create simple minimap
    const minimapSize = 100;
    const minimapX = this.cameras.main.width - minimapSize - 10;
    const minimapY = 10;

    // Background for minimap
    this.add
      .rectangle(
        minimapX + minimapSize / 2,
        minimapY + minimapSize / 2,
        minimapSize + 6,
        minimapSize + 6,
        0x000000,
        0.5
      )
      .setScrollFactor(0)
      .setDepth(990);

    // Create minimap graphics
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(991);

    // Create minimap mask
    const shape = this.make.graphics({});
    shape.fillStyle(0xffffff);
    shape.fillRect(minimapX, minimapY, minimapSize, minimapSize);
    this.minimapMask = shape.createGeometryMask();
    this.minimap.setMask(this.minimapMask);
  }

  private createCollisions(): void {
    // Add collisions between player and world
    const collisionLayers = this.map.layers
      .filter(
        (layer) =>
          layer.name === "Collision" || layer.name.includes("Buildings")
      )
      .map((layer) => this.map.getLayer(layer.name).tilemapLayer);

    collisionLayers.forEach((layer) => {
      if (layer) {
        this.physics.add.collider(this.player, layer);
      }
    });

    // Add collisions with NPCs
    if (this.npcs) {
      this.physics.add.collider(this.player, this.npcs);
    }

    // Add overlap with interactive zones
    if (this.challengeZones) {
      this.physics.add.overlap(
        this.player,
        this.challengeZones,
        this.handleChallengeZoneOverlap,
        undefined,
        this
      );
    }

    // Add overlap with transition zones
    if (this.transitionZones) {
      this.physics.add.overlap(
        this.player,
        this.transitionZones,
        this.handleTransitionZoneOverlap,
        undefined,
        this
      );
    }
  }

  private setupNetworkListeners(): void {
    if (!this.socket) return;

    // Handle other players joining
    this.socket.on("player:joined", (data: PlayerInfo) => {
      // Skip if this is us or if we already have this player
      if (
        data.userId === this.userData.id ||
        this.otherPlayers.has(data.userId)
      ) {
        return;
      }

      // Create sprite for other player
      const otherPlayer = this.physics.add.sprite(
        data.position.x,
        data.position.y,
        "player"
      );
      otherPlayer.setDepth(10);

      // Store reference by player ID
      this.otherPlayers.set(data.userId, otherPlayer);

      // Add username text above player
      const text = this.add.text(
        data.position.x,
        data.position.y - 20,
        data.username,
        {
          fontSize: "10px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 2,
        }
      );
      text.setOrigin(0.5, 1);
      otherPlayer.setData("nameText", text);
    });

    // Handle player movement
    this.socket.on("player:moved", (data: PlayerMovement) => {
      const otherPlayer = this.otherPlayers.get(data.playerId);
      if (otherPlayer) {
        // Move the player
        this.tweens.add({
          targets: otherPlayer,
          x: data.position.x,
          y: data.position.y,
          duration: 100,
          ease: "Linear",
        });

        // Update the name text
        const nameText = otherPlayer.getData("nameText");
        if (nameText) {
          nameText.setPosition(data.position.x, data.position.y - 20);
        }

        // Play animation if provided
        if (data.animation) {
          otherPlayer.anims.play(data.animation, true);
        }
      }
    });

    // Handle player leaving
    this.socket.on("player:left", (data: { userId: string }) => {
      const otherPlayer = this.otherPlayers.get(data.userId);
      if (otherPlayer) {
        // Remove name text
        const nameText = otherPlayer.getData("nameText");
        if (nameText) {
          nameText.destroy();
        }

        // Remove player sprite
        otherPlayer.destroy();

        // Remove from otherPlayers map
        this.otherPlayers.delete(data.userId);
      }
    });
  }

  private handleChallengeZoneOverlap(
    player: Phaser.Physics.Arcade.Sprite,
    zone: Phaser.Physics.Arcade.Sprite
  ): void {
    // Set the current interaction target to the challenge zone
    this.interactionTarget = zone;

    // Show interaction indicator
    const indicator = zone.getData("indicator");
    if (indicator && !indicator.visible) {
      indicator.setVisible(true);
    }
  }

  private handleTransitionZoneOverlap(
    player: Phaser.Physics.Arcade.Sprite,
    zone: Phaser.Physics.Arcade.Sprite
  ): void {
    // Get target scene data
    const targetScene = zone.getData("targetScene");
    const targetX = zone.getData("targetX");
    const targetY = zone.getData("targetY");

    // Transition to the target scene
    this.cameras.main.fade(
      500,
      0,
      0,
      0,
      false,
      (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          // Stop listening to network events in this scene
          if (this.socket) {
            this.socket.off("player:joined");
            this.socket.off("player:moved");
            this.socket.off("player:left");
          }

          // Start the target scene
          this.scene.start(targetScene, {
            spawnPosition: { x: targetX, y: targetY },
            coming_from: "WorldMap",
          });
        }
      }
    );
  }

  private handleInteraction(): void {
    if (!this.interactionActive && this.interactionTarget) {
      const targetType = this.interactionTarget.getData("type");

      if (targetType === "npc") {
        // Handle NPC interaction (e.g., show dialog)
        this.showDialog(
          this.interactionTarget.getData("name"),
          this.interactionTarget.getData("dialog") || "Hello, adventurer!"
        );
      } else if (targetType === "challenge") {
        // Handle challenge interaction (e.g., start challenge)
        const challengeId = this.interactionTarget.getData("id");
        const challengeName = this.interactionTarget.getData("name");

        // Show challenge UI or transition to challenge scene
        this.events.emit("challenge:start", {
          id: challengeId,
          name: challengeName,
        });
      }

      this.interactionActive = true;

      // Reset interaction state after short delay
      this.time.delayedCall(500, () => {
        this.interactionActive = false;
      });
    }
  }

  private updateInteractionPrompts(): void {
    // Reset interaction target
    this.interactionTarget = null;

    // Check all NPCs
    if (this.npcs) {
      this.npcs.getChildren().forEach((npc: Phaser.GameObjects.GameObject) => {
        const sprite = npc as Phaser.Physics.Arcade.Sprite;
        const indicator = sprite.getData("indicator");

        // Calculate distance to player
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          sprite.x,
          sprite.y
        );

        // Show/hide interaction indicator based on proximity
        if (distance < 50) {
          this.interactionTarget = sprite;
          if (indicator) indicator.setVisible(true);
        } else {
          if (indicator) indicator.setVisible(false);
        }
      });
    }

    // Check all challenge zones
    if (this.challengeZones) {
      this.challengeZones
        .getChildren()
        .forEach((zone: Phaser.GameObjects.GameObject) => {
          const sprite = zone as Phaser.Physics.Arcade.Sprite;

          // Skip if manually made visible (e.g., active challenges)
          const indicator = sprite.getData("indicator");
          if (indicator && indicator.getData("alwaysVisible")) {
            return;
          }

          // Calculate if player is within the zone's bounds
          const bounds = sprite.getBounds();
          const playerBounds = this.player.getBounds();

          if (Phaser.Geom.Rectangle.Overlaps(bounds, playerBounds)) {
            this.interactionTarget = sprite;
            if (indicator) indicator.setVisible(true);
          } else {
            if (indicator && !indicator.getData("alwaysVisible")) {
              indicator.setVisible(false);
            }
          }
        });
    }
  }

  private updateMinimap(): void {
    if (!this.minimap) return;

    // Calculate minimap scale based on map size
    const minimapScale = 0.05; // Adjust based on your map size

    const minimapSize = 100;
    const minimapX = this.cameras.main.width - minimapSize - 10;
    const minimapY = 10;

    // Clear previous frame
    this.minimap.clear();

    // Draw background
    this.minimap.fillStyle(0x000000, 0.5);
    this.minimap.fillRect(minimapX, minimapY, minimapSize, minimapSize);

    // Draw player position (centered relative to minimap)
    const playerX = minimapX + this.player.x * minimapScale;
    const playerY = minimapY + this.player.y * minimapScale;

    // Draw player dot
    this.minimap.fillStyle(0x00ffff, 1);
    this.minimap.fillCircle(playerX, playerY, 3);

    // Draw other players if any
    this.minimap.fillStyle(0xff00ff, 1);
    this.otherPlayers.forEach((otherPlayer) => {
      const x = minimapX + otherPlayer.x * minimapScale;
      const y = minimapY + otherPlayer.y * minimapScale;
      this.minimap.fillCircle(x, y, 2);
    });

    // Draw special zones (challenges, NPCs, etc.)
    this.minimap.fillStyle(0xffff00, 0.8);

    // Draw challenges
    if (this.challengeZones) {
      this.challengeZones
        .getChildren()
        .forEach((zone: Phaser.GameObjects.GameObject) => {
          const sprite = zone as Phaser.Physics.Arcade.Sprite;
          const x = minimapX + sprite.x * minimapScale;
          const y = minimapY + sprite.y * minimapScale;
          this.minimap.fillCircle(x, y, 1.5);
        });
    }

    // Draw NPCs
    if (this.npcs) {
      this.minimap.fillStyle(0x00ff00, 0.8);
      this.npcs.getChildren().forEach((npc: Phaser.GameObjects.GameObject) => {
        const sprite = npc as Phaser.Physics.Arcade.Sprite;
        const x = minimapX + sprite.x * minimapScale;
        const y = minimapY + sprite.y * minimapScale;
        this.minimap.fillCircle(x, y, 1.5);
      });
    }
  }

  private showDialog(name: string, text: string): void {
    // Create dialog box
    const dialogBox = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      this.cameras.main.width - 100,
      100,
      0x000000,
      0.8
    );
    dialogBox.setStrokeStyle(2, 0x00f0ff);
    dialogBox.setScrollFactor(0);
    dialogBox.setDepth(1000);

    // Add name text
    const nameText = this.add.text(
      dialogBox.x - dialogBox.width / 2 + 20,
      dialogBox.y - dialogBox.height / 2 + 10,
      name,
      {
        fontSize: "16px",
        color: "#00f0ff",
        fontFamily: "monospace",
        fontStyle: "bold",
      }
    );
    nameText.setScrollFactor(0);
    nameText.setDepth(1001);

    // Add dialog text
    const dialogText = this.add.text(
      dialogBox.x - dialogBox.width / 2 + 20,
      dialogBox.y - dialogBox.height / 2 + 35,
      text,
      {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "monospace",
        wordWrap: { width: dialogBox.width - 40 },
      }
    );
    dialogText.setScrollFactor(0);
    dialogText.setDepth(1001);

    // Add close instruction
    const closeText = this.add.text(
      dialogBox.x + dialogBox.width / 2 - 100,
      dialogBox.y + dialogBox.height / 2 - 20,
      "Press E to close",
      {
        fontSize: "12px",
        color: "#888888",
        fontFamily: "monospace",
      }
    );
    closeText.setScrollFactor(0);
    closeText.setDepth(1001);

    // Add event to close dialog
    const closeDialog = () => {
      dialogBox.destroy();
      nameText.destroy();
      dialogText.destroy();
      closeText.destroy();
      this.input.keyboard!.off("keydown-E", closeDialog);
    };

    this.input.keyboard!.once("keydown-E", closeDialog);
  }

  private showLocationName(name: string): void {
    // Show location name with fade in/out animation
    this.locationNameText.setText(name);
    this.locationNameText.setAlpha(0);

    this.tweens.add({
      targets: this.locationNameText,
      alpha: 1,
      y: 60,
      duration: 1000,
      ease: "Power2",
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: this.locationNameText,
            alpha: 0,
            y: 50,
            duration: 1000,
            ease: "Power2",
          });
        });
      },
    });
  }

  private createAmbientEffects(): void {
    // Create cyberpunk-style ambient particle effects
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
      frequency: 500,
    });

    particles.setDepth(5);
    particles.setScrollFactor(0.1); // Parallax effect
  }
}
