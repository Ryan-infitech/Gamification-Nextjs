import Phaser from "phaser";

/**
 * NPC behavior types that determine how an NPC moves and interacts
 */
export enum NPCBehaviorType {
  STATIC = "static", // Doesn't move
  PATROL = "patrol", // Moves back and forth along a path
  FOLLOW = "follow", // Follows the player when nearby
  WANDER = "wander", // Moves randomly within an area
  GUARD = "guard", // Stays in place but rotates to face player
  FLEE = "flee", // Runs away from player when nearby
  CUSTOM = "custom", // Custom behavior defined in subclass
}

/**
 * Direction that an NPC can face
 */
export type NPCDirection = "up" | "down" | "left" | "right";

/**
 * Dialog line with optional speaker and responses
 */
export interface DialogLine {
  text: string;
  speaker?: string;
  responses?: Array<{
    text: string;
    nextId?: string;
    action?: () => void;
  }>;
  onDisplay?: () => void;
}

/**
 * Dialog data structure for conversations
 */
export interface NPCDialog {
  id: string;
  lines: { [key: string]: DialogLine };
  startLineId: string;
}

/**
 * Configuration options for creating an NPC
 */
export interface NPCConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  texture: string;
  frame?: number;
  name?: string;
  id?: string;
  behaviorType?: NPCBehaviorType;
  speed?: number;
  detectionRadius?: number;
  dialog?: NPCDialog;
  patrolPoints?: Phaser.Math.Vector2[];
  wanderArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  interactionDistance?: number;
  collisionBodyOffset?: { x: number; y: number; width: number; height: number };
  initialDirection?: NPCDirection;
}

/**
 * Base NPC class for all non-player characters in the game
 */
export default class NPC extends Phaser.Physics.Arcade.Sprite {
  // Identification
  public name: string;
  public id: string;

  // Behavior
  public behaviorType: NPCBehaviorType;
  public speed: number;
  public detectionRadius: number;
  public dialog?: NPCDialog;
  public interactionDistance: number;

  // State
  protected _direction: NPCDirection;
  protected _isMoving: boolean = false;
  protected _isInteracting: boolean = false;
  protected _lastMovementTime: number = 0;
  protected _movementDelay: number = 0;
  protected _targetPoint?: Phaser.Math.Vector2;
  protected _patrolPoints: Phaser.Math.Vector2[] = [];
  protected _currentPatrolPoint: number = 0;
  protected _wanderArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  protected _interactionEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  protected _interactionIndicator?: Phaser.GameObjects.Sprite;
  protected _dialogActive: boolean = false;

  /**
   * Creates a new NPC
   *
   * @param config - NPC configuration object
   */
  constructor(config: NPCConfig) {
    super(config.scene, config.x, config.y, config.texture, config.frame);

    // Add to scene and enable physics
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);

    // Set core properties
    this.name = config.name || "NPC";
    this.id = config.id || `npc-${Date.now()}`;
    this.behaviorType = config.behaviorType || NPCBehaviorType.STATIC;
    this.speed = config.speed || 50;
    this.detectionRadius = config.detectionRadius || 150;
    this.dialog = config.dialog;
    this.interactionDistance = config.interactionDistance || 50;
    this._direction = config.initialDirection || "down";

    // Set up physics body
    if (config.collisionBodyOffset) {
      this.body.setSize(
        config.collisionBodyOffset.width,
        config.collisionBodyOffset.height
      );
      this.body.setOffset(
        config.collisionBodyOffset.x,
        config.collisionBodyOffset.y
      );
    }

    this.setCollideWorldBounds(true);
    this.setPushable(false);

    // Setup patrol points if specified
    if (config.patrolPoints && this.behaviorType === NPCBehaviorType.PATROL) {
      this._patrolPoints = config.patrolPoints;
    }

    // Setup wander area if specified
    if (config.wanderArea && this.behaviorType === NPCBehaviorType.WANDER) {
      this._wanderArea = config.wanderArea;
    }

    // Set up interaction indicator if this NPC is interactive
    if (this.dialog) {
      this.createInteractionIndicator();
    }

    // Start initial animation
    this.playAnimationForCurrentState();
  }

  /**
   * Updates the NPC each frame
   * @param time - Current time
   * @param delta - Time since last frame in ms
   * @param playerPosition - Optional position of the player
   */
  update(
    time: number,
    delta: number,
    playerPosition?: Phaser.Math.Vector2
  ): void {
    // Skip update if interacting
    if (this._isInteracting || this._dialogActive) return;

    // Reset velocity
    this.setVelocity(0);

    // Run behavior update based on NPC type
    switch (this.behaviorType) {
      case NPCBehaviorType.PATROL:
        this.updatePatrol(time, delta);
        break;

      case NPCBehaviorType.WANDER:
        this.updateWander(time, delta);
        break;

      case NPCBehaviorType.FOLLOW:
        if (playerPosition) {
          this.updateFollow(time, delta, playerPosition);
        }
        break;

      case NPCBehaviorType.FLEE:
        if (playerPosition) {
          this.updateFlee(time, delta, playerPosition);
        }
        break;

      case NPCBehaviorType.GUARD:
        if (playerPosition) {
          this.updateGuard(time, delta, playerPosition);
        }
        break;

      case NPCBehaviorType.STATIC:
      default:
        // Static NPCs don't move, but could have idle animations
        this._isMoving = false;
        break;
    }

    // Update animation based on current state
    this.playAnimationForCurrentState();

    // Update interaction indicator
    this.updateInteractionIndicator(playerPosition);
  }

  /**
   * Make the NPC face in a specific direction
   * @param direction - Direction to face
   */
  faceDirection(direction: NPCDirection): void {
    this._direction = direction;
    this.playAnimationForCurrentState();
  }

  /**
   * Update patrol behavior, moving between patrol points
   * @param time - Current time
   * @param delta - Time since last frame in ms
   */
  protected updatePatrol(time: number, delta: number): void {
    if (this._patrolPoints.length === 0) return;

    // Get current target point
    const target = this._patrolPoints[this._currentPatrolPoint];

    // If no target point, just stop moving
    if (!target) {
      this._isMoving = false;
      return;
    }

    // Check if we've reached the target
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      target.x,
      target.y
    );
    if (distance < 5) {
      // Move to next patrol point
      this._currentPatrolPoint =
        (this._currentPatrolPoint + 1) % this._patrolPoints.length;

      // Add a short pause at each point
      this._movementDelay = time + Phaser.Math.Between(500, 1500);
      this._isMoving = false;
      return;
    }

    // If we're in a delay, wait
    if (time < this._movementDelay) {
      this._isMoving = false;
      return;
    }

    // Move toward the target
    this._isMoving = true;
    this.moveTowardPoint(target, this.speed);
  }

  /**
   * Update wander behavior, moving randomly within an area
   * @param time - Current time
   * @param delta - Time since last frame in ms
   */
  protected updateWander(time: number, delta: number): void {
    if (!this._wanderArea) return;

    // If no target or we've reached the current target, pick a new one
    if (
      !this._targetPoint ||
      Phaser.Math.Distance.Between(
        this.x,
        this.y,
        this._targetPoint.x,
        this._targetPoint.y
      ) < 5
    ) {
      // Clear current target
      this._targetPoint = undefined;

      // If we've just reached a point, add a delay
      if (this._isMoving) {
        this._movementDelay = time + Phaser.Math.Between(1000, 3000);
        this._isMoving = false;
        return;
      }

      // If we're in a delay, wait
      if (time < this._movementDelay) {
        this._isMoving = false;
        return;
      }

      // Pick a new random point within wander area
      const x = Phaser.Math.Between(
        this._wanderArea.x,
        this._wanderArea.x + this._wanderArea.width
      );

      const y = Phaser.Math.Between(
        this._wanderArea.y,
        this._wanderArea.y + this._wanderArea.height
      );

      this._targetPoint = new Phaser.Math.Vector2(x, y);
      this._isMoving = true;
    }

    // Move toward the target
    this.moveTowardPoint(this._targetPoint, this.speed);
  }

  /**
   * Update follow behavior to follow the player
   * @param time - Current time
   * @param delta - Time since last frame
   * @param playerPosition - Player's position
   */
  protected updateFollow(
    time: number,
    delta: number,
    playerPosition: Phaser.Math.Vector2
  ): void {
    // Check if player is within detection radius
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      playerPosition.x,
      playerPosition.y
    );

    if (distance <= this.detectionRadius && distance > 20) {
      this._isMoving = true;
      this.moveTowardPoint(playerPosition, this.speed);
    } else {
      this._isMoving = false;
    }
  }

  /**
   * Update flee behavior to run away from the player
   * @param time - Current time
   * @param delta - Time since last frame
   * @param playerPosition - Player's position
   */
  protected updateFlee(
    time: number,
    delta: number,
    playerPosition: Phaser.Math.Vector2
  ): void {
    // Check if player is within detection radius
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      playerPosition.x,
      playerPosition.y
    );

    if (distance <= this.detectionRadius) {
      // Calculate direction away from player
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        playerPosition.x,
        playerPosition.y
      );
      const oppositeAngle = angle + Math.PI;

      // Move in the opposite direction
      const vx = Math.cos(oppositeAngle) * this.speed;
      const vy = Math.sin(oppositeAngle) * this.speed;

      this.setVelocity(vx, vy);
      this._isMoving = true;

      // Set direction based on velocity
      this.updateDirectionFromVelocity();
    } else {
      this._isMoving = false;
    }
  }

  /**
   * Update guard behavior to face the player
   * @param time - Current time
   * @param delta - Time since last frame
   * @param playerPosition - Player's position
   */
  protected updateGuard(
    time: number,
    delta: number,
    playerPosition: Phaser.Math.Vector2
  ): void {
    // Check if player is within detection radius
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      playerPosition.x,
      playerPosition.y
    );

    if (distance <= this.detectionRadius) {
      // Calculate direction to player
      const dx = playerPosition.x - this.x;
      const dy = playerPosition.y - this.y;

      // Determine which direction to face
      if (Math.abs(dx) > Math.abs(dy)) {
        this._direction = dx > 0 ? "right" : "left";
      } else {
        this._direction = dy > 0 ? "down" : "up";
      }

      this._isMoving = false;
    }
  }

  /**
   * Move toward a specific point
   * @param target - Target point
   * @param speed - Movement speed
   */
  protected moveTowardPoint(target: Phaser.Math.Vector2, speed: number): void {
    // Calculate direction to target
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const angle = Math.atan2(dy, dx);

    // Move toward target
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    this.setVelocity(vx, vy);

    // Update direction based on velocity
    this.updateDirectionFromVelocity();
  }

  /**
   * Update the NPC's direction based on current velocity
   */
  protected updateDirectionFromVelocity(): void {
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;

    // Determine direction based on velocity
    if (Math.abs(vx) > Math.abs(vy)) {
      this._direction = vx > 0 ? "right" : "left";
    } else {
      this._direction = vy > 0 ? "down" : "up";
    }
  }

  /**
   * Play the appropriate animation based on current state
   */
  protected playAnimationForCurrentState(): void {
    // Default implementation to be overridden by specific NPC types
    const state = this._isMoving ? "walk" : "idle";
    const key = `${this.texture.key}-${state}-${this._direction}`;

    // Only change animation if needed
    if (!this.anims.isPlaying || this.anims.currentAnim?.key !== key) {
      if (this.scene.anims.exists(key)) {
        this.anims.play(key, true);
      }
    }
  }

  /**
   * Creates the interaction indicator for this NPC
   */
  protected createInteractionIndicator(): void {
    // Create an indicator that appears when player is nearby
    this._interactionIndicator = this.scene.add.sprite(
      this.x,
      this.y - this.height - 15,
      "ui",
      "interaction-indicator"
    );

    this._interactionIndicator.setOrigin(0.5, 1);
    this._interactionIndicator.setVisible(false);
    this._interactionIndicator.setDepth(this.depth + 10);

    // Add a simple animation to make it more noticeable
    this.scene.tweens.add({
      targets: this._interactionIndicator,
      y: "-=5",
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /**
   * Updates the interaction indicator based on player position
   * @param playerPosition - Position of the player
   */
  protected updateInteractionIndicator(
    playerPosition?: Phaser.Math.Vector2
  ): void {
    if (!this._interactionIndicator || !this.dialog || !playerPosition) return;

    // Update position
    this._interactionIndicator.x = this.x;
    this._interactionIndicator.y = this.y - this.height - 15;

    // Show/hide based on distance to player
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      playerPosition.x,
      playerPosition.y
    );
    this._interactionIndicator.setVisible(distance <= this.interactionDistance);
  }

  /**
   * Handle interaction with the player
   * @returns True if interaction occurred, false otherwise
   */
  interact(): boolean {
    if (!this.dialog) return false;

    this._dialogActive = true;
    this._isInteracting = true;

    // Emit interaction event that the scene can listen for
    this.scene.events.emit("npc-interact", {
      npc: this,
      dialog: this.dialog,
    });

    return true;
  }

  /**
   * End the current interaction
   */
  endInteraction(): void {
    this._dialogActive = false;
    this._isInteracting = false;
  }

  /**
   * Get the NPC's current direction
   */
  get direction(): NPCDirection {
    return this._direction;
  }

  /**
   * Check if the NPC is currently moving
   */
  get isMoving(): boolean {
    return this._isMoving;
  }

  /**
   * Check if the NPC is currently interacting
   */
  get isInteracting(): boolean {
    return this._isInteracting;
  }
}

/**
 * Wasp NPC implementing robot wasp behavior with its own sprite animations
 */
export class WaspNPC extends NPC {
  constructor(config: NPCConfig) {
    super({
      ...config,
      texture: "wasp", // This should match the key used when loading the sprite
      collisionBodyOffset: { x: 4, y: 4, width: 8, height: 8 },
      behaviorType: config.behaviorType || NPCBehaviorType.WANDER,
    });

    // Create Wasp-specific animations if they don't exist yet
    this.createWaspAnimations();
  }

  /**
   * Creates animations for the Wasp NPC
   */
  private createWaspAnimations(): void {
    const anims = this.scene.anims;

    // Only create animations if they don't already exist
    if (!anims.exists("wasp-idle")) {
      // Flying animation (used for both idle and movement)
      anims.create({
        key: "wasp-idle",
        frames: anims.generateFrameNumbers("wasp", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });

      // We use the same animation for all directions and states
      // since the wasp sprite is simple and circular
      anims.create({
        key: "wasp-idle-left",
        frames: anims.generateFrameNumbers("wasp", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });

      anims.create({
        key: "wasp-idle-right",
        frames: anims.generateFrameNumbers("wasp", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });

      anims.create({
        key: "wasp-idle-up",
        frames: anims.generateFrameNumbers("wasp", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });

      anims.create({
        key: "wasp-idle-down",
        frames: anims.generateFrameNumbers("wasp", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });

      // Movement animations are the same as idle for the wasp
      anims.create({
        key: "wasp-walk-left",
        frames: anims.generateFrameNumbers("wasp", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });

      anims.create({
        key: "wasp-walk-right",
        frames: anims.generateFrameNumbers("wasp", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });

      anims.create({
        key: "wasp-walk-up",
        frames: anims.generateFrameNumbers("wasp", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });

      anims.create({
        key: "wasp-walk-down",
        frames: anims.generateFrameNumbers("wasp", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });
    }
  }

  /**
   * Wasp-specific update method to add hovering movement
   */
  update(
    time: number,
    delta: number,
    playerPosition?: Phaser.Math.Vector2
  ): void {
    super.update(time, delta, playerPosition);

    // Add a slight hovering effect
    this.y += Math.sin(time / 200) * 0.3;
  }

  /**
   * Override to use wasp-specific animations
   */
  protected playAnimationForCurrentState(): void {
    const state = this._isMoving ? "walk" : "idle";
    const key = `wasp-${state}-${this._direction}`;

    if (!this.anims.isPlaying || this.anims.currentAnim?.key !== key) {
      if (this.scene.anims.exists(key)) {
        this.anims.play(key, true);
      } else {
        // Fallback to default animation
        this.anims.play("wasp-idle", true);
      }
    }
  }
}
