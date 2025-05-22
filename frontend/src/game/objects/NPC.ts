import Phaser from 'phaser';
import { NPCDefinition, DialogLine, GamePosition } from '@/types/phaser';

/**
 * Type untuk NPC behavior pattern
 */
type NPCBehaviorPattern = 'static' | 'wander' | 'patrol' | 'follow';

/**
 * Class untuk NPC (Non-Player Character) dalam game
 */
export default class NPC extends Phaser.Physics.Arcade.Sprite {
  // NPC properties
  private npcData: NPCDefinition;
  private behaviorPattern: NPCBehaviorPattern;
  private moveSpeed: number = 40;
  private dialogActive: boolean = false;
  private indicator?: Phaser.GameObjects.Sprite;
  private patrolPoints: GamePosition[] = [];
  private currentPatrolIndex: number = 0;
  private patrolWaitTime: number = 3000;
  private lastPatrolTime: number = 0;
  private wanderTimer?: Phaser.Time.TimerEvent;
  private wanderDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private isMoving: boolean = false;
  private targetPosition?: GamePosition;
  private interactionDistance: number = 60;
  private interactionEnabled: boolean = true;
  private questGiver: boolean = false;
  private hasActiveQuest: boolean = false;
  
  // Animation mapping
  private static readonly ANIMATIONS = {
    idle: {
      down: 'idle-down',
      up: 'idle-up',
      left: 'idle-left',
      right: 'idle-right'
    },
    walk: {
      down: 'walk-down',
      up: 'walk-up',
      left: 'walk-left',
      right: 'walk-right'
    }
  };
  
  /**
   * Constructor for the NPC class
   */
  constructor(
    scene: Phaser.Scene,
    npcData: NPCDefinition,
    pattern: NPCBehaviorPattern = 'static'
  ) {
    super(scene, npcData.position.x, npcData.position.y, npcData.sprite, 0);
    
    // Store NPC data
    this.npcData = npcData;
    this.behaviorPattern = pattern;
    this.questGiver = npcData.questGiver || false;
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up physics properties
    this.setImmovable(pattern === 'static');
    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.setSize(24, 16);  // Adjust collision box
    this.setOffset(4, 16); // Offset collision box
    
    // Set depth to ensure proper render order
    this.setDepth(4);
    
    // Set name for easier identification
    this.setName(npcData.name);
    this.setData('id', npcData.id);
    
    // Create or setup animations if needed
    this.setupAnimations();
    
    // Start with idle animation
    this.anims.play(`npc-idle-${npcData.id}`, true);
    
    // Create interaction indicator
    this.createInteractionIndicator();
    
    // Setup behavior based on pattern
    this.setupBehavior();
    
    // Events
    this.on('destroy', this.onDestroy, this);
  }

  /**
   * Setup NPC animations
   */
  private setupAnimations(): void {
    // Only create animations if they don't exist yet
    const hasExistingAnim = this.scene.anims.exists(`npc-idle-${this.npcData.id}`);
    
    if (!hasExistingAnim) {
      // For NPCs we'll use a simpler animation approach - just a basic idle
      this.scene.anims.create({
        key: `npc-idle-${this.npcData.id}`,
        frames: this.scene.anims.generateFrameNumbers(this.npcData.sprite, { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
      });
      
      // Only create walking animation for non-static NPCs
      if (this.behaviorPattern !== 'static') {
        this.scene.anims.create({
          key: `npc-walk-${this.npcData.id}`,
          frames: this.scene.anims.generateFrameNumbers(this.npcData.sprite, { start: 4, end: 7 }),
          frameRate: 8,
          repeat: -1
        });
      }
    }
  }

  /**
   * Create interaction indicator above NPC
   */
  private createInteractionIndicator(): void {
    // Create a sprite that will serve as interaction indicator
    this.indicator = this.scene.add.sprite(
      this.x,
      this.y - 35,
      'ui-icons',
      this.questGiver ? 6 : 5 // Different icon for quest givers
    );
    
    // Initially hide the indicator
    this.indicator.setVisible(false);
    
    // Add floating animation to indicator
    this.scene.tweens.add({
      targets: this.indicator,
      y: this.indicator.y - 5,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Set depth to ensure it's above everything
    this.indicator.setDepth(10);
    
    // If this is a quest giver, add special styling
    if (this.questGiver) {
      // Add a yellow glow for quest givers
      const glowEffect = this.scene.add.graphics();
      glowEffect.fillStyle(0xFFAA00, 0.3);
      glowEffect.fillCircle(this.x, this.y - 35, 12);
      glowEffect.setDepth(9);
      
      // Pulse animation for the glow
      this.scene.tweens.add({
        targets: glowEffect,
        alpha: 0.1,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      // Store reference to glow effect
      this.setData('glowEffect', glowEffect);
    }
  }

  /**
   * Setup NPC behavior pattern
   */
  private setupBehavior(): void {
    switch (this.behaviorPattern) {
      case 'wander':
        this.setupWanderBehavior();
        break;
      case 'patrol':
        this.setupPatrolBehavior();
        break;
      case 'follow':
        // Requires target to follow, will be implemented as needed
        break;
      case 'static':
      default:
        // No special behavior for static NPCs
        break;
    }
  }

  /**
   * Setup wandering behavior (random movement)
   */
  private setupWanderBehavior(): void {
    // Create a timer that triggers random movement
    this.wanderTimer = this.scene.time.addEvent({
      delay: Phaser.Math.Between(3000, 8000),  // Random time between moves
      callback: this.startWandering,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Start wandering in a random direction
   */
  private startWandering(): void {
    // Only start wandering if not already moving and not in dialog
    if (this.isMoving || this.dialogActive) return;
    
    // 30% chance to just stand still
    if (Phaser.Math.Between(1, 10) <= 3) {
      // Stop for a moment
      this.stopMoving();
      return;
    }
    
    // Choose a random direction
    const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
    this.wanderDirection = Phaser.Utils.Array.GetRandom(directions);
    
    // Start moving in that direction
    switch (this.wanderDirection) {
      case 'up':
        this.setVelocity(0, -this.moveSpeed);
        break;
      case 'down':
        this.setVelocity(0, this.moveSpeed);
        break;
      case 'left':
        this.setVelocity(-this.moveSpeed, 0);
        break;
      case 'right':
        this.setVelocity(this.moveSpeed, 0);
        break;
    }
    
    // Play walking animation
    this.anims.play(`npc-walk-${this.npcData.id}`, true);
    
    // Set as moving
    this.isMoving = true;
    
    // Stop after a random time
    this.scene.time.delayedCall(Phaser.Math.Between(500, 2000), () => {
      this.stopMoving();
    });
  }

  /**
   * Setup patrol behavior (move between points)
   */
  private setupPatrolBehavior(): void {
    // Set default patrol points if none are defined
    if (this.patrolPoints.length === 0) {
      // Create a simple patrol route around the NPC's starting point
      const startX = this.npcData.position.x;
      const startY = this.npcData.position.y;
      const radius = 60; // Distance to patrol around start point
      
      this.patrolPoints = [
        { x: startX, y: startY },
        { x: startX + radius, y: startY },
        { x: startX + radius, y: startY + radius },
        { x: startX, y: startY + radius }
      ];
    }
    
    // Start patrolling
    this.moveToNextPatrolPoint();
  }

  /**
   * Move to the next patrol point
   */
  private moveToNextPatrolPoint(): void {
    // Skip if in dialog
    if (this.dialogActive) return;
    
    // Get next patrol point
    const target = this.patrolPoints[this.currentPatrolIndex];
    
    // Set as target position
    this.targetPosition = target;
    
    // Update patrol index for next time
    this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    
    // Record time
    this.lastPatrolTime = this.scene.time.now;
  }

  /**
   * Stop the NPC from moving
   */
  private stopMoving(): void {
    // Stop movement
    this.setVelocity(0, 0);
    
    // Update state
    this.isMoving = false;
    
    // Play idle animation
    this.anims.play(`npc-idle-${this.npcData.id}`, true);
  }

  /**
   * Check if player is within interaction distance
   */
  public canInteractWithPlayer(player: Phaser.GameObjects.GameObject): boolean {
    if (!this.interactionEnabled) return false;
    
    // Calculate distance to player
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      (player as any).x,
      (player as any).y
    );
    
    return distance <= this.interactionDistance;
  }

  /**
   * Show the interaction indicator when player is nearby
   */
  public showInteractionIndicator(show: boolean): void {
    if (this.indicator) {
      this.indicator.setVisible(show);
    }
    
    // Also show/hide quest giver glow effect if present
    const glowEffect = this.getData('glowEffect');
    if (glowEffect) {
      glowEffect.setVisible(show);
    }
  }

  /**
   * Start interaction with this NPC
   */
  public interact(): DialogLine[] {
    // Set dialog as active
    this.dialogActive = true;
    
    // Stop movement during dialog
    if (this.isMoving) {
      this.stopMoving();
    }
    
    // Pause wandering/patrolling during dialog
    if (this.wanderTimer) {
      this.wanderTimer.paused = true;
    }
    
    // Emit interaction event
    this.scene.events.emit('npcInteraction', {
      npc: this.npcData,
      dialog: this.npcData.dialog
    });
    
    // Return dialog lines
    return this.npcData.dialog;
  }

  /**
   * End interaction with this NPC
   */
  public endInteraction(): void {
    // Set dialog as inactive
    this.dialogActive = false;
    
    // Resume wandering/patrolling
    if (this.wanderTimer) {
      this.wanderTimer.paused = false;
    }
    
    // If patrolling, resume from where we left off
    if (this.behaviorPattern === 'patrol') {
      this.moveToNextPatrolPoint();
    }
    
    // Emit interaction end event
    this.scene.events.emit('npcInteractionEnd', {
      npc: this.npcData
    });
  }

  /**
   * Update NPC state each frame
   */
  public update(time: number, delta: number): void {
    // Skip update if dialog is active
    if (this.dialogActive) return;
    
    // Move indicator along with NPC
    this.updateIndicator();
    
    // Handle behavior patterns
    switch (this.behaviorPattern) {
      case 'patrol':
        this.updatePatrolBehavior(time);
        break;
      case 'follow':
        this.updateFollowBehavior();
        break;
      case 'wander':
        // Handled by timer events
        break;
    }
    
    // If we have a target position, move towards it
    if (this.targetPosition) {
      this.moveTowardsTarget();
    }
  }

  /**
   * Update interaction indicator position
   */
  private updateIndicator(): void {
    if (this.indicator) {
      this.indicator.setPosition(this.x, this.y - 35);
    }
    
    // Update quest giver glow effect if present
    const glowEffect = this.getData('glowEffect');
    if (glowEffect) {
      glowEffect.clear();
      glowEffect.fillStyle(0xFFAA00, 0.3);
      glowEffect.fillCircle(this.x, this.y - 35, 12);
    }
  }

  /**
   * Update patrol behavior
   */
  private updatePatrolBehavior(time: number): void {
    // Check if we're moving to a target
    if (!this.targetPosition) {
      // If we've waited long enough at this point, move to the next
      if (time - this.lastPatrolTime >= this.patrolWaitTime) {
        this.moveToNextPatrolPoint();
      }
      return;
    }
    
    // Check if we've reached the target position
    const distanceToTarget = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.targetPosition.x,
      this.targetPosition.y
    );
    
    if (distanceToTarget < 5) {
      // We've reached the target
      this.stopMoving();
      this.targetPosition = undefined;
      
      // Record time for waiting
      this.lastPatrolTime = time;
      
      // Wait before moving to next point
      this.scene.time.delayedCall(this.patrolWaitTime, () => {
        if (!this.dialogActive) {
          this.moveToNextPatrolPoint();
        }
      });
    }
  }

  /**
   * Update follow behavior (follow a target)
   */
  private updateFollowBehavior(): void {
    // Get the target to follow (typically the player)
    const targetToFollow = this.scene.children.getByName('player');
    
    if (!targetToFollow) return;
    
    // Calculate distance to target
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      (targetToFollow as any).x,
      (targetToFollow as any).y
    );
    
    // Only follow if within a certain range but not too close
    if (distance > 150 || distance < 60) {
      this.stopMoving();
      return;
    }
    
    // Set target position to follow
    this.targetPosition = {
      x: (targetToFollow as any).x,
      y: (targetToFollow as any).y
    };
    
    // Move towards target
    this.moveTowardsTarget();
  }

  /**
   * Move towards target position
   */
  private moveTowardsTarget(): void {
    if (!this.targetPosition) return;
    
    // Calculate direction to target
    const dx = this.targetPosition.x - this.x;
    const dy = this.targetPosition.y - this.y;
    
    // Determine animation based on primary direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal movement is primary
      this.wanderDirection = dx > 0 ? 'right' : 'left';
    } else {
      // Vertical movement is primary
      this.wanderDirection = dy > 0 ? 'down' : 'up';
    }
    
    // Move in that direction
    this.scene.physics.moveTo(this, this.targetPosition.x, this.targetPosition.y, this.moveSpeed);
    
    // Play walking animation if not already moving
    if (!this.isMoving) {
      this.anims.play(`npc-walk-${this.npcData.id}`, true);
      this.isMoving = true;
    }
  }

  /**
   * Set NPC data
   */
  public setNPCData(data: Partial<NPCDefinition>): void {
    this.npcData = { ...this.npcData, ...data };
    
    // Update quest giver status if provided
    if (data.questGiver !== undefined) {
      this.questGiver = data.questGiver;
      
      // Update indicator if needed
      if (this.indicator) {
        this.indicator.setFrame(this.questGiver ? 6 : 5);
      }
    }
  }

  /**
   * Enable/disable the NPC interaction
   */
  public setInteractionEnabled(enabled: boolean): void {
    this.interactionEnabled = enabled;
    
    // Hide indicator when disabled
    if (!enabled && this.indicator) {
      this.indicator.setVisible(false);
    }
  }

  /**
   * Set whether NPC has an active quest available
   */
  public setHasActiveQuest(hasQuest: boolean): void {
    this.hasActiveQuest = hasQuest;
    
    // Could change the indicator appearance based on quest status
    if (this.questGiver && this.indicator) {
      // Frame 6 for available quest, 7 for completed quest, etc.
      this.indicator.setFrame(hasQuest ? 6 : 7);
    }
  }

  /**
   * Set patrol points for the NPC
   */
  public setPatrolPoints(points: GamePosition[]): void {
    this.patrolPoints = points;
    
    // Reset patrol index
    this.currentPatrolIndex = 0;
    
    // If we're using patrol behavior, start patrolling
    if (this.behaviorPattern === 'patrol') {
      this.moveToNextPatrolPoint();
    }
  }

  /**
   * Change the NPC's behavior pattern
   */
  public setBehaviorPattern(pattern: NPCBehaviorPattern): void {
    // Clean up previous behavior
    if (this.wanderTimer) {
      this.wanderTimer.destroy();
      this.wanderTimer = undefined;
    }
    
    // Stop current movement
    this.stopMoving();
    this.targetPosition = undefined;
    
    // Set new behavior pattern
    this.behaviorPattern = pattern;
    
    // Setup new behavior
    this.setupBehavior();
  }

  /**
   * Handle cleanup on destroy
   */
  private onDestroy(): void {
    // Clean up timers
    if (this.wanderTimer) {
      this.wanderTimer.destroy();
    }
    
    // Clean up indicators
    if (this.indicator) {
      this.indicator.destroy();
    }
    
    // Clean up any other effects
    const glowEffect = this.getData('glowEffect');
    if (glowEffect) {
      glowEffect.destroy();
    }
  }
}
