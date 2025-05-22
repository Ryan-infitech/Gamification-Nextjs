import Phaser from 'phaser';
import { PlayerStats, PlayerData, GamePosition, Direction } from '@/types/phaser';

/**
 * Definisi untuk inputkeys player
 */
interface PlayerInputKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  interact: Phaser.Input.Keyboard.Key;
  sprint: Phaser.Input.Keyboard.Key;
  menu: Phaser.Input.Keyboard.Key;
}

/**
 * Definisi untuk footstep type
 */
enum FootstepType {
  GRASS = 'footstep-grass',
  STONE = 'footstep-stone',
  WOOD = 'footstep-wood',
  WATER = 'footstep-water',
  SAND = 'footstep-sand'
}

/**
 * Class untuk karakter player dalam game
 * Menangani gerakan, animasi, dan interaksi player
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  // Player properties
  private playerStats: PlayerStats;
  private baseSpeed: number = 150;
  private sprintSpeed: number = 240;
  private currentSpeed: number = 150;
  private diagonalSpeedFactor: number = 0.7071; // ~1/sqrt(2) for diagonal movement normalization
  private isMoving: boolean = false;
  private isSprinting: boolean = false;
  private currentDirection: Direction = 'down';
  private lastFootstepTime: number = 0;
  private footstepInterval: number = 350; // ms between footstep sounds
  private sprintStamina: number = 100;
  private maxStamina: number = 100;
  private staminaRegen: number = 10; // per second
  private staminaDeplete: number = 20; // per second
  private staminaBar?: Phaser.GameObjects.Graphics;
  private interactionZone!: Phaser.GameObjects.Zone;
  private interactionRange: number = 40;
  private walkSound?: Phaser.Sound.BaseSound;
  private sprintSound?: Phaser.Sound.BaseSound;
  private footstepSounds: Map<FootstepType, Phaser.Sound.BaseSound> = new Map();
  private lastSavedPosition: GamePosition = { x: 0, y: 0 };
  private inputs: PlayerInputKeys;
  private hasJustTeleported: boolean = false;
  private teleportCooldown: number = 500; // ms
  private canInteract: boolean = true;
  private interactionCooldown: number = 500; // ms
  private disableControls: boolean = false;
  private playerNameText?: Phaser.GameObjects.Text;
  private statusEffects: Map<string, { duration: number, endTime: number, effect: (delta: number) => void }> = new Map();
  private emoteBubble?: Phaser.GameObjects.Sprite;
  private shadowSprite?: Phaser.GameObjects.Sprite;
  
  // Animation frames mapping
  private static readonly IDLE_FRAMES: Record<Direction, number[]> = {
    'down': [0, 1, 2, 3],
    'up': [4, 5, 6, 7],
    'left': [8, 9, 10, 11],
    'right': [12, 13, 14, 15]
  };

  private static readonly WALK_FRAMES: Record<Direction, number[]> = {
    'down': [16, 17, 18, 19, 20, 21, 22, 23],
    'up': [24, 25, 26, 27, 28, 29, 30, 31],
    'left': [32, 33, 34, 35, 36, 37, 38, 39],
    'right': [40, 41, 42, 43, 44, 45, 46, 47]
  };

  private static readonly SPRINT_FRAMES: Record<Direction, number[]> = {
    'down': [48, 49, 50, 51, 52, 53, 54, 55],
    'up': [56, 57, 58, 59, 60, 61, 62, 63],
    'left': [64, 65, 66, 67, 68, 69, 70, 71],
    'right': [72, 73, 74, 75, 76, 77, 78, 79]
  };

  /**
   * Constructor for the Player class
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame: number,
    stats: PlayerStats,
    username?: string
  ) {
    super(scene, x, y, texture, frame);
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up physics properties
    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.setSize(24, 16); // Smaller collision box than sprite
    this.setOffset(4, 16); // Offset collision box to center at the feet
    
    // Store player stats & properties
    this.playerStats = stats;
    
    // Set depth to ensure player is rendered above the ground but below some objects
    this.setDepth(5);
    
    // Create shadow
    this.createShadow();
    
    // Setup input keys
    this.inputs = this.setupInputs();
    
    // Create the player animations if they don't exist
    this.createAnimations();
    
    // Set the default animation
    this.anims.play('idle-down');
    
    // Create interaction zone for detecting interactable objects
    this.createInteractionZone();
    
    // Create stamina bar
    this.createStaminaBar();
    
    // Create username text display
    if (username) {
      this.createNameText(username);
    }
    
    // Load sound effects
    this.loadSoundEffects();
    
    // Set initial position as last saved
    this.lastSavedPosition = { x, y };
    
    // Register to scene update
    this.scene.events.on('update', this.update, this);
    
    // Clean up on destroy
    this.on('destroy', this.onDestroy, this);
  }

  /**
   * Setup input keys for player controls
   */
  private setupInputs(): PlayerInputKeys {
    return {
      up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      interact: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      sprint: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      menu: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    };
  }

  /**
   * Create player shadow
   */
  private createShadow(): void {
    // Create an ellipse shadow below the player
    this.shadowSprite = this.scene.add.sprite(this.x, this.y + 16, 'shadow');
    this.shadowSprite.setScale(0.7, 0.4);
    this.shadowSprite.setAlpha(0.3);
    this.shadowSprite.setDepth(1);
  }

  /**
   * Create all player animations
   */
  private createAnimations(): void {
    const directions: Direction[] = ['down', 'up', 'left', 'right'];
    const frameRate = 10;
    
    // Only create animations if they don't exist
    directions.forEach(dir => {
      // Idle animations
      if (!this.scene.anims.exists(`idle-${dir}`)) {
        this.scene.anims.create({
          key: `idle-${dir}`,
          frames: this.anims.generateFrameNumbers(this.texture.key, { 
            frames: Player.IDLE_FRAMES[dir] 
          }),
          frameRate: 5,
          repeat: -1
        });
      }
      
      // Walk animations
      if (!this.scene.anims.exists(`walk-${dir}`)) {
        this.scene.anims.create({
          key: `walk-${dir}`,
          frames: this.anims.generateFrameNumbers(this.texture.key, { 
            frames: Player.WALK_FRAMES[dir] 
          }),
          frameRate: frameRate,
          repeat: -1
        });
      }
      
      // Sprint animations
      if (!this.scene.anims.exists(`sprint-${dir}`)) {
        this.scene.anims.create({
          key: `sprint-${dir}`,
          frames: this.anims.generateFrameNumbers(this.texture.key, { 
            frames: Player.SPRINT_FRAMES[dir] 
          }),
          frameRate: frameRate * 1.5,
          repeat: -1
        });
      }
    });
  }

  /**
   * Create interaction zone around player for interactable objects
   */
  private createInteractionZone(): void {
    // Create an invisible zone in front of the player for interaction detection
    this.interactionZone = this.scene.add.zone(this.x, this.y - 32, this.interactionRange, this.interactionRange);
    this.scene.physics.world.enable(this.interactionZone);
    
    // Make the zone move with the player
    this.interactionZone.body.setAllowGravity(false);
    this.interactionZone.body.moves = false;
    
    // Make zone non-collidable but still detectable
    (this.interactionZone.body as Phaser.Physics.Arcade.Body).setCircle(this.interactionRange / 2);
  }

  /**
   * Create stamina bar for sprint
   */
  private createStaminaBar(): void {
    // Create a stamina bar above the player
    this.staminaBar = this.scene.add.graphics();
    this.updateStaminaBar();
  }

  /**
   * Create username text display above player
   */
  private createNameText(username: string): void {
    this.playerNameText = this.scene.add.text(this.x, this.y - 35, username, {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.playerNameText.setOrigin(0.5);
    this.playerNameText.setDepth(10);
  }

  /**
   * Load sound effects for player
   */
  private loadSoundEffects(): void {
    // Main movement sounds
    if (this.scene.cache.audio.exists('walk-sound')) {
      this.walkSound = this.scene.sound.add('walk-sound', { volume: 0.2, loop: true });
    }
    
    if (this.scene.cache.audio.exists('sprint-sound')) {
      this.sprintSound = this.scene.sound.add('sprint-sound', { volume: 0.3, loop: true });
    }
    
    // Footstep sounds for different surfaces
    const footstepTypes = [
      { type: FootstepType.GRASS, key: 'footstep-grass' },
      { type: FootstepType.STONE, key: 'footstep-stone' },
      { type: FootstepType.WOOD, key: 'footstep-wood' },
      { type: FootstepType.WATER, key: 'footstep-water' },
      { type: FootstepType.SAND, key: 'footstep-sand' }
    ];
    
    footstepTypes.forEach(({ type, key }) => {
      if (this.scene.cache.audio.exists(key)) {
        this.footstepSounds.set(type, this.scene.sound.add(key, { volume: 0.3 }));
      }
    });
  }

  /**
   * Update method called every frame
   */
  public update(time: number, delta: number): void {
    // Skip if controls are disabled
    if (this.disableControls) return;
    
    // Track previous position and velocity for later comparison
    const prevVelocityX = this.body.velocity.x;
    const prevVelocityY = this.body.velocity.y;
    
    // Handle player movement
    this.handleMovement(delta);
    
    // Update interaction zone position
    this.updateInteractionZone();
    
    // Update stamina bar
    this.updateStaminaBar();
    
    // Update shadow position
    if (this.shadowSprite) {
      this.shadowSprite.setPosition(this.x, this.y + 16);
    }
    
    // Update player name text position
    if (this.playerNameText) {
      this.playerNameText.setPosition(this.x, this.y - 35);
    }
    
    // Update any active status effects
    this.updateStatusEffects(delta);
    
    // Play footstep sound if moving and enough time has passed
    if (this.isMoving && time > this.lastFootstepTime + this.footstepInterval) {
      this.playFootstepSound();
      this.lastFootstepTime = time;
    }
    
    // Periodically save position (every 5 seconds)
    if (time % 5000 < delta) {
      this.savePosition();
    }
    
    // Handle interaction when interact key is pressed
    if (Phaser.Input.Keyboard.JustDown(this.inputs.interact) && this.canInteract) {
      this.interact();
      
      // Set cooldown on interaction
      this.canInteract = false;
      this.scene.time.delayedCall(this.interactionCooldown, () => {
        this.canInteract = true;
      });
    }
  }

  /**
   * Handle player movement based on input
   */
  private handleMovement(delta: number): void {
    // Reset velocity
    this.setVelocity(0);
    
    // Track if player is moving
    let isMoving = false;
    let newDirection = this.currentDirection;
    
    // Handle sprint toggle
    this.isSprinting = this.inputs.sprint.isDown && this.sprintStamina > 0;
    
    // Update speed based on sprint state
    this.currentSpeed = this.isSprinting ? this.sprintSpeed : this.baseSpeed;
    
    // Update stamina
    if (this.isSprinting) {
      this.sprintStamina = Math.max(0, this.sprintStamina - (this.staminaDeplete * delta / 1000));
    } else {
      this.sprintStamina = Math.min(this.maxStamina, this.sprintStamina + (this.staminaRegen * delta / 1000));
    }
    
    // Handle directional movement
    const moveVertical = this.inputs.up.isDown || this.inputs.down.isDown;
    const moveHorizontal = this.inputs.left.isDown || this.inputs.right.isDown;
    
    // Handle up/down movement
    if (this.inputs.up.isDown) {
      this.setVelocityY(-this.currentSpeed);
      newDirection = 'up';
      isMoving = true;
    } else if (this.inputs.down.isDown) {
      this.setVelocityY(this.currentSpeed);
      newDirection = 'down';
      isMoving = true;
    }
    
    // Handle left/right movement
    if (this.inputs.left.isDown) {
      this.setVelocityX(-this.currentSpeed);
      newDirection = 'left';
      isMoving = true;
    } else if (this.inputs.right.isDown) {
      this.setVelocityX(this.currentSpeed);
      newDirection = 'right';
      isMoving = true;
    }
    
    // Normalize diagonal movement
    if (moveVertical && moveHorizontal) {
      // Only need to normalize if moving diagonally
      this.body.velocity.normalize().scale(this.currentSpeed);
    }
    
    // Update direction only if moving
    if (isMoving) {
      this.currentDirection = newDirection;
    }
    
    // Update animation based on movement
    this.updateAnimation(isMoving);
    
    // Update movement sound
    this.updateMovementSound(isMoving);
    
    // Update isMoving state
    this.isMoving = isMoving;
  }

  /**
   * Update player animation based on movement state
   */
  private updateAnimation(isMoving: boolean): void {
    // Choose animation type based on movement
    const animationType = !isMoving ? 'idle' : (this.isSprinting ? 'sprint' : 'walk');
    
    // Set animation for current direction
    const animationKey = `${animationType}-${this.currentDirection}`;
    
    // Only change animation if needed
    if (!this.anims.isPlaying || this.anims.currentAnim?.key !== animationKey) {
      this.anims.play(animationKey, true);
    }
  }

  /**
   * Update movement sound based on player state
   */
  private updateMovementSound(isMoving: boolean): void {
    // Handle main movement sound
    if (isMoving) {
      // Play appropriate sound based on sprint state
      if (this.isSprinting && this.sprintSound && !this.sprintSound.isPlaying) {
        if (this.walkSound?.isPlaying) this.walkSound.stop();
        this.sprintSound.play();
      } else if (!this.isSprinting && this.walkSound && !this.walkSound.isPlaying) {
        if (this.sprintSound?.isPlaying) this.sprintSound.stop();
        this.walkSound.play();
      }
    } else {
      // Stop all movement sounds if not moving
      if (this.walkSound?.isPlaying) this.walkSound.stop();
      if (this.sprintSound?.isPlaying) this.sprintSound.stop();
    }
  }

  /**
   * Play footstep sound based on current terrain
   */
  private playFootstepSound(): void {
    // Default to grass
    let footstepType = FootstepType.GRASS;
    
    // Detect terrain based on tile (this is a simplified example)
    // In a real game, you'd check the tile property the player is standing on
    const scene = this.scene as any; // Type assertion for accessing tile layers
    
    if (scene.map && scene.groundLayer) {
      const tile = scene.groundLayer.getTileAtWorldXY(this.x, this.y);
      
      if (tile) {
        // Determine footstep type based on tile properties
        if (tile.properties?.terrain === 'stone') {
          footstepType = FootstepType.STONE;
        } else if (tile.properties?.terrain === 'wood') {
          footstepType = FootstepType.WOOD;
        } else if (tile.properties?.terrain === 'water') {
          footstepType = FootstepType.WATER;
        } else if (tile.properties?.terrain === 'sand') {
          footstepType = FootstepType.SAND;
        }
      }
    }
    
    // Play the appropriate sound
    const sound = this.footstepSounds.get(footstepType);
    if (sound) {
      sound.play({
        volume: this.isSprinting ? 0.4 : 0.3,
        rate: this.isSprinting ? 1.5 : 1
      });
    }
  }

  /**
   * Update position of interaction zone based on player's facing direction
   */
  private updateInteractionZone(): void {
    const offset = this.interactionRange / 2;
    
    switch (this.currentDirection) {
      case 'up':
        this.interactionZone.setPosition(this.x, this.y - offset);
        break;
      case 'down':
        this.interactionZone.setPosition(this.x, this.y + offset);
        break;
      case 'left':
        this.interactionZone.setPosition(this.x - offset, this.y);
        break;
      case 'right':
        this.interactionZone.setPosition(this.x + offset, this.y);
        break;
    }
  }

  /**
   * Update stamina bar display
   */
  private updateStaminaBar(): void {
    if (!this.staminaBar) return;
    
    // Only show stamina bar when sprinting or recovering
    const shouldShow = this.isSprinting || this.sprintStamina < this.maxStamina;
    
    if (!shouldShow) {
      this.staminaBar.clear();
      return;
    }
    
    // Draw stamina bar
    this.staminaBar.clear();
    
    // Background
    this.staminaBar.fillStyle(0x000000, 0.5);
    this.staminaBar.fillRect(this.x - 20, this.y - 30, 40, 4);
    
    // Fill based on current stamina
    const fillWidth = 40 * (this.sprintStamina / this.maxStamina);
    
    // Color based on stamina level
    const color = this.sprintStamina > 60 ? 0x45AAF2 : 
                 this.sprintStamina > 30 ? 0xFFA502 : 0xFF6B6B;
    
    this.staminaBar.fillStyle(color, 1);
    this.staminaBar.fillRect(this.x - 20, this.y - 30, fillWidth, 4);
  }

  /**
   * Update active status effects
   */
  private updateStatusEffects(delta: number): void {
    const currentTime = this.scene.time.now;
    const effectsToRemove: string[] = [];
    
    this.statusEffects.forEach((effect, key) => {
      // Apply effect
      effect.effect(delta);
      
      // Check if effect has expired
      if (currentTime >= effect.endTime) {
        effectsToRemove.push(key);
      }
    });
    
    // Remove expired effects
    effectsToRemove.forEach(key => {
      this.statusEffects.delete(key);
    });
  }

  /**
   * Interact with objects in front of the player
   */
  public interact(): void {
    // Emit interaction event that the scene can listen for
    this.scene.events.emit('playerInteract', this, this.interactionZone);
    
    // Add simple visual feedback for interaction
    this.showInteractionEmote();
    
    // Play interaction sound
    this.scene.sound.play('interact-sound', { volume: 0.4 });
  }

  /**
   * Show emote bubble above player
   */
  private showInteractionEmote(): void {
    // Remove existing emote if present
    if (this.emoteBubble) {
      this.emoteBubble.destroy();
    }
    
    // Create emote bubble
    this.emoteBubble = this.scene.add.sprite(this.x, this.y - 50, 'emotes', 0);
    this.emoteBubble.setDepth(100);
    
    // Animation and fade
    this.scene.tweens.add({
      targets: this.emoteBubble,
      y: this.y - 60,
      alpha: { from: 1, to: 0 },
      duration: 800,
      ease: 'Cubic.out',
      onComplete: () => {
        if (this.emoteBubble) {
          this.emoteBubble.destroy();
          this.emoteBubble = undefined;
        }
      }
    });
  }

  /**
   * Teleport player to new position
   */
  public teleport(x: number, y: number, direction?: Direction): void {
    // Save original position for reference
    const originalX = this.x;
    const originalY = this.y;
    
    // Move player
    this.setPosition(x, y);
    
    // Update direction if specified
    if (direction) {
      this.currentDirection = direction;
      this.anims.play(`idle-${this.currentDirection}`);
    }
    
    // Update saved position
    this.lastSavedPosition = { x, y };
    
    // Update shadow position
    if (this.shadowSprite) {
      this.shadowSprite.setPosition(x, y + 16);
    }
    
    // Flag that we just teleported to avoid immediate interaction
    this.hasJustTeleported = true;
    this.scene.time.delayedCall(this.teleportCooldown, () => {
      this.hasJustTeleported = false;
    });
    
    // Create teleport effect
    this.createTeleportEffect(originalX, originalY);
    
    // Emit teleport event
    this.scene.events.emit('playerTeleport', {
      from: { x: originalX, y: originalY },
      to: { x, y },
      direction: this.currentDirection
    });
  }

  /**
   * Create visual effect for teleporting
   */
  private createTeleportEffect(fromX: number, fromY: number): void {
    // Create a simple particle effect at the old position
    const particles = this.scene.add.particles('pixel-bg');
    
    const emitter = particles.createEmitter({
      speed: { min: 20, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      tint: 0x4B7BEC
    });
    
    // Emit particles at the starting position
    emitter.explode(30, fromX, fromY);
    
    // Also emit particles at destination
    emitter.explode(30, this.x, this.y);
    
    // Destroy the particle system after animation completes
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
    
    // Play teleport sound if available
    if (this.scene.sound.get('teleport-sound')) {
      this.scene.sound.play('teleport-sound');
    }
  }

  /**
   * Add a status effect to the player
   */
  public addStatusEffect(id: string, duration: number, effect: (delta: number) => void): void {
    this.statusEffects.set(id, {
      duration,
      endTime: this.scene.time.now + duration,
      effect
    });
  }

  /**
   * Remove a status effect from the player
   */
  public removeStatusEffect(id: string): void {
    this.statusEffects.delete(id);
  }

  /**
   * Save current player position
   */
  private savePosition(): void {
    if (this.active && !this.hasJustTeleported) {
      this.lastSavedPosition = { x: this.x, y: this.y };
      
      // Emit position update event
      this.scene.events.emit('playerPositionUpdate', {
        x: this.x,
        y: this.y,
        direction: this.currentDirection,
        mapKey: this.scene.scene.key
      });
    }
  }

  /**
   * Disable player controls temporarily
   */
  public disableControl(duration?: number): void {
    this.disableControls = true;
    this.setVelocity(0, 0);
    
    if (duration) {
      this.scene.time.delayedCall(duration, () => {
        this.enableControl();
      });
    }
  }

  /**
   * Enable player controls
   */
  public enableControl(): void {
    this.disableControls = false;
  }

  /**
   * Add experience points to player
   */
  public addExperience(amount: number): void {
    this.playerStats.experience += amount;
    
    // Emit XP gain event
    this.scene.events.emit('experienceGain', {
      amount,
      total: this.playerStats.experience
    });
    
    // Check for level up
    this.checkLevelUp();
  }

  /**
   * Check if player has leveled up
   */
  private checkLevelUp(): void {
    // Calculate new level (simple formula - could be more complex)
    const xpPerLevel = 100; // Base XP per level
    const levelScaling = 0.5; // How much each level increases XP requirement
    
    let newLevel = 1;
    let xpRemaining = this.playerStats.experience;
    let requiredXP = xpPerLevel;
    
    while (xpRemaining >= requiredXP) {
      xpRemaining -= requiredXP;
      newLevel++;
      requiredXP = Math.floor(xpPerLevel * (1 + newLevel * levelScaling));
    }
    
    // If level has increased
    if (newLevel > this.playerStats.level) {
      // Store old level
      const oldLevel = this.playerStats.level;
      
      // Update stats
      this.playerStats.level = newLevel;
      this.playerStats.health += 10;
      this.playerStats.strength += 2;
      this.playerStats.intelligence += 2;
      this.playerStats.agility += 2;
      
      // Emit level up event
      this.scene.events.emit('levelUp', {
        oldLevel,
        newLevel,
        stats: this.playerStats
      });
      
      // Play level up effect
      this.createLevelUpEffect();
      
      // Play sound if available
      if (this.scene.sound.get('levelup-sound')) {
        this.scene.sound.play('levelup-sound');
      } else {
        this.scene.sound.play('success-sound');
      }
    }
  }

  /**
   * Create visual effect for level up
   */
  private createLevelUpEffect(): void {
    // Create particles
    const particles = this.scene.add.particles('pixel-bg');
    
    // Add circular emitter
    const emitter = particles.createEmitter({
      x: this.x,
      y: this.y,
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      tint: 0x2ECC71
    });
    
    // Add rising emitter
    const risingEmitter = particles.createEmitter({
      x: { min: this.x - 20, max: this.x + 20 },
      y: this.y,
      speedY: { min: -40, max: -80 },
      quantity: 1,
      frequency: 50,
      lifespan: 1500,
      scale: { start: 0.8, end: 0 },
      tint: [0x4B7BEC, 0x45AAF2, 0x2ECC71],
      blendMode: 'ADD'
    });
    
    // Add "Level Up" text
    const levelText = this.scene.add.text(this.x, this.y - 40, 'LEVEL UP!', {
      fontFamily: 'Press Start 2P',
      fontSize: '12px',
      color: '#2ECC71',
      stroke: '#000000',
      strokeThickness: 4
    });
    levelText.setOrigin(0.5);
    levelText.setAlpha(0);
    
    // Animate text
    this.scene.tweens.add({
      targets: levelText,
      y: this.y - 60,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: levelText,
          alpha: 0,
          y: this.y - 80,
          duration: 500,
          delay: 1000,
          ease: 'Back.easeIn',
          onComplete: () => {
            levelText.destroy();
          }
        });
      }
    });
    
    // Stop emitters after some time
    this.scene.time.delayedCall(2000, () => {
      emitter.stop();
      risingEmitter.stop();
      
      // Destroy particle system after all particles are gone
      this.scene.time.delayedCall(1500, () => {
        particles.destroy();
      });
    });
  }

  /**
   * Get player data for saving
   */
  public getPlayerData(): PlayerData {
    return {
      position: this.lastSavedPosition,
      sprite: this.texture.key,
      stats: { ...this.playerStats }
    };
  }

  /**
   * Get current direction as string
   */
  public getDirection(): Direction {
    return this.currentDirection;
  }

  /**
   * Get interaction zone
   */
  public getInteractionZone(): Phaser.GameObjects.Zone {
    return this.interactionZone;
  }

  /**
   * Update player stats
   */
  public updateStats(stats: Partial<PlayerStats>): void {
    this.playerStats = { ...this.playerStats, ...stats };
  }

  /**
   * Handle cleanup on destroy
   */
  private onDestroy(): void {
    // Stop any sounds
    if (this.walkSound?.isPlaying) this.walkSound.stop();
    if (this.sprintSound?.isPlaying) this.sprintSound.stop();
    
    // Clean up extras
    if (this.staminaBar) this.staminaBar.destroy();
    if (this.shadowSprite) this.shadowSprite.destroy();
    if (this.interactionZone) this.interactionZone.destroy();
    if (this.playerNameText) this.playerNameText.destroy();
    if (this.emoteBubble) this.emoteBubble.destroy();
    
    // Remove update listener
    this.scene.events.off('update', this.update, this);
  }
}
