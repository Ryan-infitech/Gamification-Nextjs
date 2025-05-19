import Phaser from "phaser";
import { PLAYER_SPEED } from "../config";

type PlayerDirection = "up" | "down" | "left" | "right";
type PlayerAnimationState = "idle" | "walk";

/**
 * Player class representing the main character controlled by the user
 * Uses the Adam character sprite set for animations
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  // Player state properties
  private _direction: PlayerDirection = "down";
  private _state: PlayerAnimationState = "idle";
  private _speed: number = PLAYER_SPEED;
  private _isMoving: boolean = false;
  private _interactKey: Phaser.Input.Keyboard.Key;
  private _lastInteractionTime: number = 0;
  private _interactionCooldown: number = 300; // ms

  /**
   * Creates a new Player instance
   *
   * @param scene The scene this player belongs to
   * @param x Initial X position
   * @param y Initial Y position
   * @param texture The texture key for the player sprite
   * @param frame The initial frame to display
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "adam",
    frame: number = 0
  ) {
    super(scene, x, y, texture, frame);

    // Add player to the scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configure physics body
    this.setCollideWorldBounds(true);
    this.body.setSize(14, 10); // Slightly smaller than the 16x16 sprite for better feel
    this.body.setOffset(1, 6); // Adjust the collision body to match the visual

    // Set up interaction key
    this._interactKey = scene.input.keyboard.addKey("E");

    // Create animations
    this.createAnimations();

    // Set initial animation
    this.anims.play("adam-idle-down");
  }

  /**
   * Creates all animations for the player based on the Adam sprite sheet
   */
  private createAnimations(): void {
    const scene = this.scene;
    const anims = scene.anims;

    if (!anims.exists("adam-idle-down")) {
      // Idle animations
      anims.create({
        key: "adam-idle-down",
        frames: anims.generateFrameNumbers("adam", { frames: [0] }),
        frameRate: 5,
        repeat: -1,
      });

      anims.create({
        key: "adam-idle-up",
        frames: anims.generateFrameNumbers("adam", { frames: [24] }),
        frameRate: 5,
        repeat: -1,
      });

      anims.create({
        key: "adam-idle-left",
        frames: anims.generateFrameNumbers("adam", { frames: [12] }),
        frameRate: 5,
        repeat: -1,
      });

      anims.create({
        key: "adam-idle-right",
        frames: anims.generateFrameNumbers("adam", { frames: [36] }),
        frameRate: 5,
        repeat: -1,
      });

      // Walking animations
      anims.create({
        key: "adam-walk-down",
        frames: anims.generateFrameNumbers("adam", {
          frames: [0, 1, 2, 3, 4, 5],
        }),
        frameRate: 10,
        repeat: -1,
      });

      anims.create({
        key: "adam-walk-up",
        frames: anims.generateFrameNumbers("adam", {
          frames: [24, 25, 26, 27, 28, 29],
        }),
        frameRate: 10,
        repeat: -1,
      });

      anims.create({
        key: "adam-walk-left",
        frames: anims.generateFrameNumbers("adam", {
          frames: [12, 13, 14, 15, 16, 17],
        }),
        frameRate: 10,
        repeat: -1,
      });

      anims.create({
        key: "adam-walk-right",
        frames: anims.generateFrameNumbers("adam", {
          frames: [36, 37, 38, 39, 40, 41],
        }),
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  /**
   * Updates the player's state each frame
   * @param time The current time
   * @param delta Time elapsed since the last update
   */
  update(time: number, delta: number): void {
    // Reset velocity
    this.setVelocity(0);

    // Check for interaction key press
    if (Phaser.Input.Keyboard.JustDown(this._interactKey)) {
      this.interact();
    }
  }

  /**
   * Updates the player's movement based on cursor input
   * @param cursors The cursor keys for movement input
   */
  updateMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    // Reset movement state
    this._isMoving = false;

    // Determine movement direction from cursor keys
    const leftDown = cursors.left?.isDown || false;
    const rightDown = cursors.right?.isDown || false;
    const upDown = cursors.up?.isDown || false;
    const downDown = cursors.down?.isDown || false;

    // Handle diagonal movement by normalizing velocity
    let dirX = 0;
    let dirY = 0;

    if (leftDown) dirX = -1;
    else if (rightDown) dirX = 1;

    if (upDown) dirY = -1;
    else if (downDown) dirY = 1;

    // If moving diagonally, normalize the velocity
    if (dirX !== 0 && dirY !== 0) {
      // Normalize the direction vector
      const length = Math.sqrt(dirX * dirX + dirY * dirY);
      dirX = dirX / length;
      dirY = dirY / length;
    }

    // Set velocity based on direction and speed
    this.setVelocity(dirX * this._speed, dirY * this._speed);

    // Update direction based on movement
    if (leftDown && !rightDown) this._direction = "left";
    else if (rightDown && !leftDown) this._direction = "right";
    else if (upDown && !downDown) this._direction = "up";
    else if (downDown && !upDown) this._direction = "down";

    // Update animation state
    this._isMoving = dirX !== 0 || dirY !== 0;
    this._state = this._isMoving ? "walk" : "idle";

    // Play the appropriate animation
    const animKey = `adam-${this._state}-${this._direction}`;
    if (this.anims.currentAnim?.key !== animKey) {
      this.anims.play(animKey, true);
    }
  }

  /**
   * Handles player interaction with objects in the game world
   */
  interact(): void {
    const currentTime = this.scene.time.now;
    if (currentTime - this._lastInteractionTime < this._interactionCooldown) {
      return; // Still on cooldown
    }

    this._lastInteractionTime = currentTime;

    // Get the position in front of the player based on their direction
    const interactRange = 20;
    let interactX = this.x;
    let interactY = this.y;

    switch (this._direction) {
      case "up":
        interactY -= interactRange;
        break;
      case "down":
        interactY += interactRange;
        break;
      case "left":
        interactX -= interactRange;
        break;
      case "right":
        interactX += interactRange;
        break;
    }

    // Emit an interaction event that the scene can listen for
    this.scene.events.emit("player-interact", {
      player: this,
      x: interactX,
      y: interactY,
      direction: this._direction,
    });
  }

  /**
   * Sets the player's position and stops any movement
   * @param x The new X position
   * @param y The new Y position
   * @param direction Optional direction to face
   */
  teleportTo(x: number, y: number, direction?: PlayerDirection): void {
    this.setVelocity(0, 0);
    this.setPosition(x, y);

    if (direction) {
      this._direction = direction;
      this._state = "idle";
      this.anims.play(`adam-idle-${direction}`);
    }
  }

  /**
   * Makes the player face a specific direction
   * @param direction The direction to face
   */
  faceDirection(direction: PlayerDirection): void {
    this._direction = direction;
    this.anims.play(`adam-idle-${direction}`);
  }

  /**
   * Gets the current direction the player is facing
   * @returns The player's current direction
   */
  get direction(): PlayerDirection {
    return this._direction;
  }

  /**
   * Gets the player's current movement speed
   * @returns The player's speed
   */
  get speed(): number {
    return this._speed;
  }

  /**
   * Sets the player's movement speed
   * @param value The new speed
   */
  set speed(value: number) {
    this._speed = value;
  }

  /**
   * Gets whether the player is currently moving
   * @returns True if the player is moving, false otherwise
   */
  get isMoving(): boolean {
    return this._isMoving;
  }

  /**
   * Gets the player's current state (idle or walking)
   * @returns The player's current animation state
   */
  get state(): PlayerAnimationState {
    return this._state;
  }
}
