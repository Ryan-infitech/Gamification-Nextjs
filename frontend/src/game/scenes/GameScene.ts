import Phaser from "phaser";
import { MAPS, PLAYER_SPEED, TILE_SIZE } from "../config";
import { GameScene as IGameScene, TiledMapObject } from "@/types/phaser";

export default class GameScene extends Phaser.Scene implements IGameScene {
  player?: Phaser.Physics.Arcade.Sprite & {
    direction: "up" | "down" | "left" | "right";
    speed: number;
    updateMovement: (cursors: Phaser.Types.Input.Keyboard.CursorKeys) => void;
  };
  map?: Phaser.Tilemaps.Tilemap;
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  otherPlayers?: Phaser.Physics.Arcade.Group;
  spawns?: TiledMapObject[];
  collisionLayer?: Phaser.Tilemaps.TilemapLayer;

  private socketConnected = false;
  private tilesets: Phaser.Tilemaps.Tileset[] = [];

  constructor() {
    super("GameScene");
  }

  create() {
    // Create the tilemap
    this.createMap();

    // Create the player
    this.createPlayer();

    // Set up input
    this.cursors = this.input.keyboard?.createCursorKeys();

    // Set up camera to follow player
    this.cameras.main.startFollow(this.player!, true);
    this.cameras.main.setZoom(2); // Start with a bit of zoom for the pixelated look

    // Create collision detection
    this.createCollisions();

    // Set up game socket
    this.setupSocket();

    // Add some example text to demonstrate rendering
    this.add
      .text(0, 0, "Use arrow keys to move", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setScrollFactor(0)
      .setDepth(1000);
  }

  update(time: number, delta: number) {
    // Handle player movement if player exists
    if (this.player && this.cursors) {
      this.player.updateMovement(this.cursors);

      // Emit player movement to server if connected
      if (this.socketConnected) {
        // This would be implemented in the actual socket handler
      }
    }
  }

  private createMap() {
    // Create tilemap from JSON file
    this.map = this.make.tilemap({ key: MAPS.PROTOTYPE.key });

    // Add all tilesets to the map
    MAPS.PROTOTYPE.tileset.forEach((tileset) => {
      const key = tileset.name.replace(/\s+/g, "_").toLowerCase();
      const parsedTileset = this.map!.addTilesetImage(tileset.name, key);
      if (parsedTileset) {
        this.tilesets.push(parsedTileset);
      }
    });

    // Create all layers
    if (this.map.layers) {
      for (let i = 0; i < this.map.layers.length; i++) {
        const layerData = this.map.layers[i];
        if (layerData.type === "tilelayer") {
          const layer = this.map.createLayer(
            layerData.name,
            this.tilesets,
            0,
            0
          );
          if (layer) {
            // Set depth based on layer order
            layer.setDepth(i * 10);

            // Mark the collision layer
            if (layerData.name === "Collision") {
              this.collisionLayer = layer;
              layer.setCollisionByProperty({ collides: true });
              // Optionally visualize collision areas
              if (process.env.NODE_ENV === "development") {
                const debugGraphics = this.add.graphics().setAlpha(0.7);
                layer.renderDebug(debugGraphics, {
                  tileColor: null,
                  collidingTileColor: new Phaser.Display.Color(
                    243,
                    134,
                    48,
                    200
                  ),
                  faceColor: new Phaser.Display.Color(40, 39, 37, 255),
                });
              }
            }
          }
        }
      }
    }

    // Find spawn points from object layers
    this.spawns = [];
    const spawnLayer = this.map.getObjectLayer("Spawn");
    if (spawnLayer && spawnLayer.objects) {
      this.spawns = spawnLayer.objects;
    }
  }

  private createPlayer() {
    // Determine spawn position (use first spawn point or default)
    let spawnX = 0;
    let spawnY = 0;

    if (this.spawns && this.spawns.length > 0) {
      const spawn = this.spawns[0];
      spawnX = spawn.x || 0;
      spawnY = spawn.y || 0;
    }

    // Create the player sprite
    this.player = this.physics.add.sprite(spawnX, spawnY, "player", 0) as any;
    this.player.setOrigin(0.5, 0.5);
    this.player.setScale(1);

    // Add custom properties to player
    this.player.direction = "down";
    this.player.speed = PLAYER_SPEED;

    // Method to update player movement
    this.player.updateMovement = (cursors) => {
      // Reset velocity
      this.player!.setVelocity(0);

      // Diagonal movement
      let movingX = false;
      let movingY = false;

      // Horizontal movement
      if (cursors.left.isDown) {
        this.player!.setVelocityX(-this.player!.speed);
        this.player!.direction = "left";
        movingX = true;
      } else if (cursors.right.isDown) {
        this.player!.setVelocityX(this.player!.speed);
        this.player!.direction = "right";
        movingX = true;
      }

      // Vertical movement
      if (cursors.up.isDown) {
        this.player!.setVelocityY(-this.player!.speed);
        if (!movingX) this.player!.direction = "up";
        movingY = true;
      } else if (cursors.down.isDown) {
        this.player!.setVelocityY(this.player!.speed);
        if (!movingX) this.player!.direction = "down";
        movingY = true;
      }

      // Normalize diagonal movement speed
      if (movingX && movingY) {
        const normalizedSpeed = this.player!.speed / Math.sqrt(2);
        this.player!.setVelocity(
          this.player!.body.velocity.x > 0 ? normalizedSpeed : -normalizedSpeed,
          this.player!.body.velocity.y > 0 ? normalizedSpeed : -normalizedSpeed
        );
      }

      // Update animation based on movement
      if (movingX || movingY) {
        this.player!.anims.play(`walk-${this.player!.direction}`, true);
      } else {
        // Idle animation based on last direction
        if (["up", "down"].includes(this.player!.direction)) {
          this.player!.anims.play(`idle-${this.player!.direction}`, true);
        } else {
          // Use specific frame for idle left/right
          this.player!.anims.stop();
          this.player!.setFrame(this.player!.direction === "left" ? 16 : 20);
        }
      }
    };
  }

  private createCollisions() {
    // Enable collision with collision layer if it exists
    if (this.player && this.collisionLayer) {
      this.physics.add.collider(this.player, this.collisionLayer);
    }

    // Collision with world bounds
    this.player?.setCollideWorldBounds(false);
  }

  private setupSocket() {
    // This would be implemented in the actual game to handle multiplayer
    this.socketConnected = false;
  }
}
