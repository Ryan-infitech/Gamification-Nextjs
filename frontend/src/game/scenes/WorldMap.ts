import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { NPCDefinition, GameChallengeDefinition, MapArea } from '../types';
// Import manager transisi map
import MapTransitionManager, { Portal, TransitionType } from '../utils/mapTransition';
import CollisionManager from '../utils/collisions';
import InteractionManager, { InteractionType, createInteraction } from '../utils/interactions';

export class WorldMap extends BaseScene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerVelocity = 200;
  private currentPlayerDirection = 'down';
  private playerIsMoving = false;
  private walkSound!: Phaser.Sound.BaseSound;
  private backgroundMusic!: Phaser.Sound.BaseSound;

  private mapAreas!: MapArea[];
  private currentArea: MapArea | null = null;

  private npcData!: NPCDefinition[];
  private npcs!: Phaser.Physics.Arcade.Sprite[];

  private challenges!: Phaser.Physics.Arcade.Sprite[];

  // Tambahkan properti baru untuk MapTransitionManager
  private mapTransitionManager!: MapTransitionManager;
  private collisionManager!: CollisionManager;
  private interactionManager!: InteractionManager;
  private mapPortals: Portal[] = [];
  private doorObjects: Phaser.Physics.Arcade.Sprite[] = [];
  private mapSigns: Phaser.Physics.Arcade.Sprite[] = [];
  private teleporters: Phaser.Physics.Arcade.Sprite[] = [];
  private isTeleporting: boolean = false;

  /**
   * Preload assets for the world map
   */
  preload(): void {
    // Load player, NPC, challenge, and map assets
    this.load.image('tiles', 'assets/tilesets/main-tileset.png');
    this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 32, frameHeight: 32 });
    this.load.audio('walk', 'assets/audio/sfx/walk.mp3');
    this.load.audio('bgMusic', 'assets/audio/music/world-music.mp3');
    
    // Load NPC and challenge assets
    this.load.json('npcData', 'data/npcs.json');
    this.load.json('challengeData', 'data/challenges.json');
    this.load.json('mapAreas', 'data/mapAreas.json');
  }

  /**
   * Create the world map scene
   */
  create(): void {
    // Set up the tilemap and layers
    const map = this.make.tilemap({ key: 'worldMap' });
    const tileset = map.addTilesetImage('main-tileset', 'tiles');
    const groundLayer = map.createLayer('Ground', tileset, 0, 0);
    const wallLayer = map.createLayer('Walls', tileset, 0, 0);
    
    // Set collision for walls
    wallLayer.setCollisionByProperty({ collides: true });
    
    // Find the spawn point and place the player
    const spawnPoint = map.findObject('Objects', obj => obj.name === 'SpawnPoint');
    this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'player');
    this.player.setCollideWorldBounds(true);
    
    // Set up camera
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player);
    
    // Load NPC and challenge data
    this.npcData = this.cache.json.get('npcData');
    this.challenges = this.cache.json.get('challengeData');
    this.mapAreas = this.cache.json.get('mapAreas');
    
    // Create NPCs and challenges
    this.createNPCs();
    this.createChallenges();
    
    // Inisialisasi map transition manager
    this.mapTransitionManager = new MapTransitionManager(this);
    
    // Inisialisasi collision manager
    this.collisionManager = new CollisionManager(this, this.debug);
    
    // Inisialisasi interaction manager
    this.interactionManager = new InteractionManager(this, this.debug);
    
    // Siapkan portals dan pintu di map
    this.setupMapPortals();
    
    // Siapkan lokasi navigasi
    this.setupNavigationLocations();
    
    // Siapkan interaksi dengan objek di peta
    this.setupMapInteractions();
    
    // Cek apakah ini hasil transisi dari map lain
    this.checkMapTransition();
    
    // Set up controls
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Play background music
    this.backgroundMusic = this.sound.add('bgMusic', { loop: true, volume: 0.5 });
    this.backgroundMusic.play();
    
    // Add player animations
    this.addPlayerAnimations();
    
    // Initialize indicators for NPCs and challenges
    this.initIndicators();
    
    // Set initial area based on player position
    this.checkCurrentArea();
    
    // Save player position from the registry if available
    this.loadPlayerPosition();
    
    // Set up interaction controls
    this.setupInteractionControls();
  }

  /**
   * Create NPCs in the world map
   */
  private createNPCs(): void {
    this.npcData.forEach(npcDef => {
      const npc = this.physics.add.sprite(npcDef.x, npcDef.y, 'npc');
      npc.setOrigin(0.5, 1);
      npc.setCollideWorldBounds(true);
      
      // Add NPC to the group
      this.npcs.push(npc);
      
      // Create interaction indicator for NPC
      this.createIndicator(npc, 'npc');
    });
  }

  /**
   * Create challenges in the world map
   */
  private createChallenges(): void {
    this.challenges.forEach(challengeDef => {
      const challenge = this.physics.add.sprite(challengeDef.x, challengeDef.y, 'challenge');
      challenge.setOrigin(0.5, 1);
      challenge.setCollideWorldBounds(true);
      
      // Add challenge to the group
      this.challenges.push(challenge);
      
      // Create interaction indicator for challenge
      this.createIndicator(challenge, 'challenge');
    });
  }

  /**
   * Create an interaction indicator for NPCs and challenges
   */
  private createIndicator(sprite: Phaser.Physics.Arcade.Sprite, type: 'npc' | 'challenge'): void {
    const indicator = this.add.sprite(0, 0, 'indicator');
    indicator.setOrigin(0.5, 1);
    indicator.setVisible(false);
    
    // Add to sprite data for reference
    sprite.setData('indicator', indicator);
  }

  /**
   * Add player animations
   */
  private addPlayerAnimations(): void {
    this.anims.create({
      key: 'walk-down',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'walk-up',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'walk-left',
      frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'walk-right',
      frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'idle-down',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 10
    });
    
    this.anims.create({
      key: 'idle-up',
      frames: [{ key: 'player', frame: 4 }],
      frameRate: 10
    });
    
    this.anims.create({
      key: 'idle-left',
      frames: [{ key: 'player', frame: 8 }],
      frameRate: 10
    });
    
    this.anims.create({
      key: 'idle-right',
      frames: [{ key: 'player', frame: 12 }],
      frameRate: 10
    });
  }

  /**
   * Initialize indicators for NPCs and challenges
   */
  private initIndicators(): void {
    this.npcs.forEach(npc => {
      const indicator = npc.getData('indicator');
      if (indicator) {
        indicator.setPosition(npc.x, npc.y - 35);
      }
    });
    
    this.challenges.forEach(challenge => {
      const indicator = challenge.getData('indicator');
      if (indicator) {
        indicator.setPosition(challenge.x + 10, challenge.y - 10);
      }
    });
  }

  /**
   * Set up interaction controls
   */
  private setupInteractionControls(): void {
    this.input.keyboard.on('keydown-SPACE', () => {
      // Check for nearby NPC or challenge
      const nearbyNPC = this.findNearbyNPC();
      const nearbyChallenge = this.findNearbyChallenge();
      
      if (nearbyNPC) {
        // Interact with NPC
        this.interactWithNPC(nearbyNPC);
      } else if (nearbyChallenge) {
        // Interact with challenge
        this.interactWithChallenge(nearbyChallenge);
      }
    });
  }

  /**
   * Interact with a nearby NPC
   */
  private interactWithNPC(npc: NPCDefinition): void {
    // Show NPC dialogue or interaction menu
    this.showInteractPrompt(`Talk to ${npc.name}`, npc.dialogue);
    
    // Emit event for analytics
    if (this.game.events) {
      this.game.events.emit('npcInteract', {
        npcName: npc.name,
        playerLevel: this.playerData.stats.level,
        position: {
          x: this.player.x,
          y: this.player.y
        }
      });
    }
  }

  /**
   * Interact with a nearby challenge
   */
  private interactWithChallenge(challenge: GameChallengeDefinition): void {
    // Show challenge details or start challenge
    this.showInteractPrompt(`Challenge: ${challenge.title}`, challenge.description);
    
    // Emit event for analytics
    if (this.game.events) {
      this.game.events.emit('challengeInteract', {
        challengeTitle: challenge.title,
        playerLevel: this.playerData.stats.level,
        position: {
          x: this.player.x,
          y: this.player.y
        }
      });
    }
  }

  /**
   * Find nearby NPC for interaction
   */
  private findNearbyNPC(): NPCDefinition | null {
    const interactionDistance = 50; // Pixel distance for interaction
    
    // Find the closest NPC within interaction distance
    let closestNPC: NPCDefinition | null = null;
    let closestDistance = interactionDistance;
    
    this.npcs.forEach((npcSprite, index) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npcSprite.x,
        npcSprite.y
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestNPC = this.npcData[index];
      }
    });
    
    return closestNPC;
  }

  /**
   * Find nearby challenge for interaction
   */
  private findNearbyChallenge(): GameChallengeDefinition | null {
    const interactionDistance = 50; // Pixel distance for interaction
    
    // Find the closest challenge within interaction distance
    let closestChallenge: GameChallengeDefinition | null = null;
    let closestDistance = interactionDistance;
    
    this.challenges.forEach((challengeSprite, index) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        challengeSprite.x,
        challengeSprite.y
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestChallenge = this.challengeData[index];
      }
    });
    
    return closestChallenge;
  }

  /**
   * Show interaction prompt on screen
   */
  private showInteractPrompt(title: string, message: string): void {
    // Clear any existing prompt
    this.hideInteractPrompt();
    
    // Create prompt container
    const promptContainer = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100
    );
    promptContainer.setScrollFactor(0);
    promptContainer.setDepth(999);
    promptContainer.setData('type', 'interactPrompt');
    
    // Background
    const background = this.add.graphics();
    background.fillStyle(0x000000, 0.8);
    background.fillRoundedRect(-150, -40, 300, 80, 10);
    background.lineStyle(2, 0xFFFFFF, 0.8);
    background.strokeRoundedRect(-150, -40, 300, 80, 10);
    
    // Title text
    const titleText = this.add.text(
      0,
      -20,
      title,
      {
        fontFamily: 'Press Start 2P',
        fontSize: '12px',
        color: '#FFFFFF',
        align: 'center'
      }
    );
    titleText.setOrigin(0.5);
    
    // Message text
    const messageText = this.add.text(
      0,
      5,
      message,
      {
        fontFamily: 'VT323',
        fontSize: '16px',
        color: '#FFFFFF',
        align: 'center'
      }
    );
    messageText.setOrigin(0.5);
    
    // Add to container
    promptContainer.add([background, titleText, messageText]);
    
    // Add to scene
    this.children.add(promptContainer);
    
    // Automatically hide after a few seconds
    this.time.delayedCall(5000, () => {
      this.hideInteractPrompt();
    });
  }

  /**
   * Hide interaction prompt
   */
  private hideInteractPrompt(): void {
    const existingPrompts = this.children.getAll().filter(child => {
      return child.getData('type') === 'interactPrompt';
    });
    
    existingPrompts.forEach(prompt => {
      prompt.destroy();
    });
  }

  /**
   * Check current map area
   */
  private checkCurrentArea(): void {
    const playerX = this.player.x;
    const playerY = this.player.y;
    
    // Check all map areas
    let newArea: MapArea | null = null;
    
    for (const area of this.mapAreas) {
      if (
        playerX >= area.bounds.x &&
        playerX < area.bounds.x + area.bounds.width &&
        playerY >= area.bounds.y &&
        playerY < area.bounds.y + area.bounds.height
      ) {
        newArea = area;
        break;
      }
    }
    
    // If player entered a new area
    if (newArea && (!this.currentArea || newArea.name !== this.currentArea.name)) {
      this.enterNewArea(newArea);
    } else if (this.currentArea && !newArea) {
      // Player left an area
      this.exitArea(this.currentArea);
    }
    
    // Update current area
    this.currentArea = newArea;
    
    // Update location text if in area
    if (newArea) {
      this.locationText.setText(newArea.name);
    } else {
      this.locationText.setText('World Map');
    }
  }

  /**
   * Handle entering a new area
   */
  private enterNewArea(area: MapArea): void {
    console.log(`Entering area: ${area.name}`);
    
    // Check if player meets level requirements
    if (area.requiredLevel && this.playerData.stats.level < area.requiredLevel) {
      // Show level requirement message
      this.showAreaLevelRequirement(area);
      
      // Bounce the player back
      this.bouncePlayerBack();
      
      return;
    }
    
    // Show area name
    this.showAreaName(area.name);
    
    // Emit event for analytics
    if (this.game.events) {
      this.game.events.emit('areaEnter', {
        areaName: area.name,
        playerLevel: this.playerData.stats.level,
        position: {
          x: this.player.x,
          y: this.player.y
        }
      });
    }
  }

  /**
   * Handle exiting an area
   */
  private exitArea(area: MapArea): void {
    console.log(`Exiting area: ${area.name}`);
    
    // Emit event for analytics
    if (this.game.events) {
      this.game.events.emit('areaExit', {
        areaName: area.name,
        playerLevel: this.playerData.stats.level,
        position: {
          x: this.player.x,
          y: this.player.y
        }
      });
    }
  }

  /**
   * Show area name overlay when entering new area
   */
  private showAreaName(areaName: string): void {
    // Set the text
    this.areaOverlayText.setText(areaName);
    this.areaOverlayText.setAlpha(0);
    
    // Fade in
    this.tweens.add({
      targets: this.areaOverlayText,
      alpha: 1,
      y: 100,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Hold, then fade out
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: this.areaOverlayText,
            alpha: 0,
            y: 90,
            duration: 500,
            ease: 'Cubic.easeIn'
          });
        });
      }
    });
  }

  /**
   * Show area level requirement message
   */
  private showAreaLevelRequirement(area: MapArea): void {
    const message = `Level ${area.requiredLevel} Required`;
    const submessage = `You need to be level ${area.requiredLevel} to enter ${area.name}`;
    
    // Create container for message
    const container = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2
    );
    container.setScrollFactor(0);
    container.setDepth(1000);
    
    // Background
    const background = this.add.graphics();
    background.fillStyle(0x000000, 0.8);
    background.fillRoundedRect(-200, -70, 400, 140, 10);
    background.lineStyle(2, 0xFF6B6B, 0.8);
    background.strokeRoundedRect(-200, -70, 400, 140, 10);
    
    // Message text
    const messageText = this.add.text(
      0,
      -30,
      message,
      {
        fontFamily: 'Press Start 2P',
        fontSize: '16px',
        color: '#FF6B6B',
        align: 'center'
      }
    );
    messageText.setOrigin(0.5);
    
    // Submessage text
    const submessageText = this.add.text(
      0,
      10,
      submessage,
      {
        fontFamily: 'VT323',
        fontSize: '20px',
        color: '#FFFFFF',
        align: 'center'
      }
    );
    submessageText.setOrigin(0.5);
    
    // Add to container
    container.add([background, messageText, submessageText]);
    
    // Animation
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        // Auto-dismiss after a few seconds
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: container,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              container.destroy();
            }
          });
        });
      }
    });
  }

  /**
   * Bounce the player back from restricted areas
   */
  private bouncePlayerBack(): void {
    // Calculate bounce direction (away from restricted area)
    const bounceVector = new Phaser.Math.Vector2(
      this.player.x - this.player.body.x,
      this.player.y - this.player.body.y
    ).normalize();
    
    // Apply bounce effect
    this.player.setVelocity(
      bounceVector.x * this.playerVelocity * 2,
      bounceVector.y * this.playerVelocity * 2
    );
    
    // Pause player control briefly
    this.player.setData('controlDisabled', true);
    
    // Play bounce animation or effect
    this.cameras.main.shake(100, 0.01);
    
    // Re-enable control after a short delay
    this.time.delayedCall(500, () => {
      this.player.setData('controlDisabled', false);
    });
  }

  /**
   * Update method called every frame
   */
  update(time: number, delta: number): void {
    // Skip update if game is paused
    if (this.scene.isPaused()) return;
    
    // Handle player movement
    this.handlePlayerMovement();
    
    // Update minimap
    this.updateMinimap();
    
    // Check current area
    this.checkCurrentArea();
    
    // Update NPCs
    this.updateNPCs();
    
    // Update indicators
    this.updateIndicators();
    
    // Update challenges
    this.updateChallenges();
    
    // Update collision manager
    this.collisionManager.update();
    
    // Update interaction manager
    this.interactionManager.update(time, delta);
    
    // Save player position every few seconds
    if (time % 10000 < delta) {
      this.savePlayerPosition();
    }
  }

  /**
   * Handle player movement based on input
   */
  private handlePlayerMovement(): void {
    // Skip if player control is disabled
    if (this.player.getData('controlDisabled')) return;
    
    // Reset velocity
    this.player.setVelocity(0);
    
    // Track if the player is moving
    let isMoving = false;
    
    // Handle up/down movement
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-this.playerVelocity);
      this.currentPlayerDirection = 'up';
      isMoving = true;
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(this.playerVelocity);
      this.currentPlayerDirection = 'down';
      isMoving = true;
    }
    
    // Handle left/right movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-this.playerVelocity);
      this.currentPlayerDirection = 'left';
      isMoving = true;
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(this.playerVelocity);
      this.currentPlayerDirection = 'right';
      isMoving = true;
    }
    
    // Normalize diagonal movement
    if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
      this.player.body.velocity.normalize().scale(this.playerVelocity);
    }
    
    // Update animation based on movement
    if (isMoving) {
      // Start walking animation in current direction
      this.player.anims.play(`walk-${this.currentPlayerDirection}`, true);
      
      // Start walking sound if not already playing
      if (!this.playerIsMoving && !this.walkSound.isPlaying) {
        this.walkSound.play();
      }
      
      this.playerIsMoving = true;
    } else {
      // Switch to idle animation in current direction
      this.player.anims.play(`idle-${this.currentPlayerDirection}`, true);
      
      // Stop walking sound
      if (this.playerIsMoving && this.walkSound.isPlaying) {
        this.walkSound.stop();
      }
      
      this.playerIsMoving = false;
    }
  }

  /**
   * Update NPCs (animations, behaviors)
   */
  private updateNPCs(): void {
    this.npcs.forEach((npc) => {
      // Get indicator
      const indicator = npc.getData('indicator');
      
      // Check if player is nearby to show interaction indicator
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.x,
        npc.y
      );
      
      // Show/hide indicator based on distance
      if (indicator) {
        indicator.setVisible(distance < 100);
      }
    });
  }

  /**
   * Update indicators (NPC, challenge, etc.)
   */
  private updateIndicators(): void {
    this.npcs.forEach(npc => {
      const indicator = npc.getData('indicator');
      if (indicator) {
        indicator.setPosition(npc.x, npc.y - 35);
      }
    });
    
    this.challenges.forEach(challenge => {
      const indicator = challenge.getData('indicator');
      if (indicator) {
        indicator.setPosition(challenge.x + 10, challenge.y - 10);
      }
    });
  }

  /**
   * Update challenges (animations, behaviors)
   */
  private updateChallenges(): void {
    this.challenges.forEach((challenge) => {
      // Check if player is nearby to show interaction prompt
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        challenge.x,
        challenge.y
      );
      
      // Get indicator
      const indicator = challenge.getData('indicator');
      
      // Show/hide indicator based on distance
      if (indicator) {
        indicator.setVisible(distance < 100);
      }
    });
  }

  /**
   * Siapkan portal-portal di map
   */
  private setupMapPortals(): void {
    // Ambil dari object layer di Tiled map
    const portalsLayer = this.map.getObjectLayer('portals');
    
    if (!portalsLayer) return;
    
    // Proses setiap objek portal dari Tiled
    portalsLayer.objects.forEach(portalObj => {
      // Buat objek portal
      const portalPosition = { x: portalObj.x || 0, y: portalObj.y || 0 };
      
      // Mendapatkan properti dari Tiled
      const targetMapKey = portalObj.properties?.find((p: any) => p.name === 'targetMap')?.value || 'tutorial-area';
      const targetX = portalObj.properties?.find((p: any) => p.name === 'targetX')?.value || 0;
      const targetY = portalObj.properties?.find((p: any) => p.name === 'targetY')?.value || 0;
      const portalType = portalObj.properties?.find((p: any) => p.name === 'portalType')?.value || 'door';
      const requiredLevel = portalObj.properties?.find((p: any) => p.name === 'requiredLevel')?.value;
      const targetDirection = portalObj.properties?.find((p: any) => p.name === 'targetDirection')?.value;
      
      // Buat sprite yang sesuai dengan tipe portal
      let portalSprite: Phaser.Physics.Arcade.Sprite;
      let transitionType: TransitionType = TransitionType.FADE;
      
      switch (portalType) {
        case 'door':
          portalSprite = this.physics.add.sprite(portalPosition.x, portalPosition.y, 'door-sprite', 0);
          this.doorObjects.push(portalSprite);
          transitionType = TransitionType.DOOR;
          break;
        case 'teleporter':
          portalSprite = this.physics.add.sprite(portalPosition.x, portalPosition.y, 'teleporter-sprite', 0);
          this.teleporters.push(portalSprite);
          transitionType = TransitionType.TELEPORT;
          
          // Tambahkan efek visual untuk teleporter
          this.createTeleporterEffect(portalSprite);
          break;
        case 'cave':
          portalSprite = this.physics.add.sprite(portalPosition.x, portalPosition.y, 'cave-entrance', 0);
          this.doorObjects.push(portalSprite);
          transitionType = TransitionType.FADE;
          break;
        case 'stairs':
          portalSprite = this.physics.add.sprite(portalPosition.x, portalPosition.y, 'stairs-sprite', 0);
          transitionType = TransitionType.SLIDE;
          break;
        default:
          // Portal default (tidak terlihat)
          portalSprite = this.physics.add.sprite(portalPosition.x, portalPosition.y, 'invisible-sprite', 0);
          portalSprite.setAlpha(0);
          transitionType = TransitionType.FADE;
          break;
      }
      
      // Setup fisika untuk portal sprite
      portalSprite.setImmovable(true);
      if (portalType !== 'door' && portalType !== 'cave') {
        portalSprite.body.setAllowGravity(false);
      }
      
      // Tambahkan ke grup untuk collision
      const portalWidth = portalObj.width || 32;
      const portalHeight = portalObj.height || 32;
      
      // Sesuaikan collision box
      portalSprite.body.setSize(portalWidth, portalHeight);
      
      // Tambahkan informasi portal di custom data sprite
      portalSprite.setData('portalId', portalObj.id);
      portalSprite.setData('portalType', portalType);
      portalSprite.setData('targetMap', targetMapKey);
      portalSprite.setData('targetPosition', { x: targetX, y: targetY });
      portalSprite.setData('transitionType', transitionType);
      
      // Buat objek Portal dan register ke manager
      const portal: Portal = {
        id: portalObj.id.toString(),
        sourceMapKey: this.scene.key,
        targetMapKey: targetMapKey,
        sourcePosition: portalPosition,
        targetPosition: { x: targetX, y: targetY },
        width: portalWidth,
        height: portalHeight,
        targetDirection: targetDirection,
        requiredLevel: requiredLevel,
        name: portalObj.name || `Portal to ${targetMapKey}`,
        customTransition: portalType
      };
      
      // Simpan portal untuk digunakan nanti
      this.mapPortals.push(portal);
      
      // Register portal ke manager
      this.mapTransitionManager.registerPortal(portal);
      
      // Buat collision zone untuk portal
      this.collisionManager.addCollisionZone(
        `portal_${portal.id}`,
        portalPosition.x - portalWidth / 2,
        portalPosition.y - portalHeight / 2,
        portalWidth,
        portalHeight,
        {
          onCollide: this.handlePortalCollision.bind(this, portal)
        }
      );
      
      // Register sebagai interactable jika perlu interaksi (seperti pintu)
      if (portalType === 'door' || portalType === 'cave') {
        this.interactionManager.registerInteractable(portalSprite, 
          createInteraction(InteractionType.DOOR, {
            id: `door_${portal.id}`,
            text: `Enter ${portal.name}`,
            onInteract: (player) => this.handleDoorInteraction(player, portal),
            requiredLevel: portal.requiredLevel
          })
        );
      }
    });
  }
  
  /**
   * Setup lokasi dan fitur navigasi
   */
  private setupNavigationLocations(): void {
    // Setup sign posts/papan informasi di peta
    const signsLayer = this.map.getObjectLayer('signs');
    
    if (signsLayer) {
      signsLayer.objects.forEach(signObj => {
        const x = signObj.x || 0;
        const y = signObj.y || 0;
        const text = signObj.properties?.find((p: any) => p.name === 'text')?.value || 'Sign';
        
        // Buat sign sprite
        const sign = this.physics.add.sprite(x, y, 'sign-sprite', 0);
        sign.setImmovable(true);
        
        // Tambahkan ke array untuk tracking
        this.mapSigns.push(sign);
        
        // Register sebagai interactable
        this.interactionManager.registerInteractable(sign, 
          createInteraction(InteractionType.SIGN, {
            id: `sign_${signObj.id}`,
            text: text
          })
        );
      });
    }
    
    // Setup teleport spots
    const teleportLayer = this.map.getObjectLayer('teleporters');
    
    if (teleportLayer) {
      teleportLayer.objects.forEach(teleporterObj => {
        const x = teleporterObj.x || 0;
        const y = teleporterObj.y || 0;
        const targetX = teleporterObj.properties?.find((p: any) => p.name === 'targetX')?.value || x;
        const targetY = teleporterObj.properties?.find((p: any) => p.name === 'targetY')?.value || y;
        const name = teleporterObj.name || 'Teleporter';
        
        // Buat teleporter sprite
        const teleporter = this.physics.add.sprite(x, y, 'teleporter-sprite', 0);
        teleporter.setImmovable(true);
        
        // Tambahkan ke array untuk tracking
        this.teleporters.push(teleporter);
        
        // Tambahkan efek visual untuk teleporter
        this.createTeleporterEffect(teleporter);
        
        // Register sebagai interactable
        this.interactionManager.registerInteractable(teleporter, 
          createInteraction(InteractionType.TELEPORT, {
            id: `teleporter_${teleporterObj.id}`,
            text: `Teleport to ${name}`,
            customData: {
              targetPosition: { x: targetX, y: targetY }
            },
            onInteract: (player) => this.handleTeleporterInteraction(
              player, 
              { x: targetX, y: targetY }
            )
          })
        );
      });
    }
  }
  
  /**
   * Setup interaksi dengan elemen di map
   */
  private setupMapInteractions(): void {
    // Set player di interaction manager
    this.interactionManager.setPlayer(this.player!);
    
    // Tambahkan collision check untuk player dengan map layers
    this.collisionManager.setPlayer(this.player!);
    this.collisionManager.setupTilemapCollision(
      this.player!,
      [this.obstaclesLayer, this.buildingsLayer]
    );
    
    // Setup overlap untuk zona interaksi player
    this.physics.add.overlap(
      this.player!.getInteractionZone(),
      this.doorObjects,
      this.handleInteractionOverlap.bind(this)
    );
    
    this.physics.add.overlap(
      this.player!.getInteractionZone(),
      this.mapSigns,
      this.handleInteractionOverlap.bind(this)
    );
    
    // Setup collision dengan teleporter (langsung teleport saat berjalan ke atasnya)
    this.physics.add.overlap(
      this.player!,
      this.teleporters,
      this.handleTeleporterOverlap.bind(this)
    );
    
    // Listen untuk event interaksi dari player
    this.events.on('playerInteract', this.handlePlayerInteraction, this);
  }
  
  /**
   * Cek dan proses jika scene ini dimulai dari transisi map lain
   */
  private checkMapTransition(): void {
    // Cek jika ada data transisi
    const sceneData = this.scene.settings.data;
    
    if (sceneData && sceneData.transitionData) {
      // Proses transisi
      this.mapTransitionManager.processSceneStart(this, this.player!);
    }
  }
  
  /**
   * Buat efek visual untuk teleporter
   */
  private createTeleporterEffect(teleporter: Phaser.Physics.Arcade.Sprite): void {
    // Buat particle effect di bawah teleporter
    const particles = this.add.particles('pixel-bg');
    
    const emitter = particles.createEmitter({
      x: teleporter.x,
      y: teleporter.y,
      speed: { min: 20, max: 40 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      tint: 0x4B7BEC,
      frequency: 100,
      quantity: 1
    });
    
    // Tambahkan light effect di sekitar teleporter
    const light = this.add.pointlight(teleporter.x, teleporter.y, 0x4B7BEC, 60, 0.5, 0.05);
    
    // Tambahkan glow pulsing
    this.tweens.add({
      targets: light,
      radius: 80,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Simpan referensi ke efek untuk cleanup nanti
    teleporter.setData('particles', particles);
    teleporter.setData('light', light);
  }
  
  /**
   * Handle collision dengan portal
   */
  private handlePortalCollision(portal: Portal, player: Player): void {
    // Tidak melakukan apa-apa untuk portal yang membutuhkan interaksi
    // seperti pintu, karena mereka ditangani melalui interaksi
    
    // Untuk portal yang auto-trigger (misalnya border map), lakukan transisi
    const customTransition = portal.customTransition;
    
    if (customTransition !== 'door' && customTransition !== 'cave' && !this.isTeleporting) {
      // Cek jika player memenuhi syarat untuk menggunakan portal
      if (this.mapTransitionManager.canUsePortal(portal, player)) {
        this.isTeleporting = true;
        
        // Tentukan tipe transisi berdasarkan portal
        let transitionType = TransitionType.FADE;
        
        if (customTransition === 'teleporter') {
          transitionType = TransitionType.TELEPORT;
        } else if (customTransition === 'stairs') {
          transitionType = TransitionType.SLIDE;
        }
        
        // Lakukan transisi ke map target
        this.mapTransitionManager.startTransition(
          this.scene.key,
          portal.targetMapKey,
          player,
          portal.targetPosition,
          portal.targetDirection,
          transitionType
        );
      } else {
        // Tampilkan pesan jika tidak memenuhi syarat
        this.showRequirementMessage(portal, player);
      }
    }
  }
  
  /**
   * Handle interaksi player
   */
  private handlePlayerInteraction(player: Player, interactionZone: Phaser.GameObjects.Zone): void {
    // Delegasikan ke interaction manager
    this.interactionManager.update(this.time.now, 0);
  }
  
  /**
   * Handle overlap zone interaksi dengan objek
   */
  private handleInteractionOverlap(
    zone: Phaser.GameObjects.Zone,
    interactiveObj: Phaser.GameObjects.GameObject
  ): void {
    // Show indicators or highlights untuk objek yang bisa diinteraksi
    // Ini ditangani oleh interaction manager di update loop
  }
  
  /**
   * Handle player overlap dengan teleporter
   */
  private handleTeleporterOverlap(
    player: Phaser.Physics.Arcade.Sprite,
    teleporter: Phaser.Physics.Arcade.Sprite
  ): void {
    // Hindari multiple teleports dengan flag
    if (this.isTeleporting) return;
    
    // Teleport langsung tanpa perlu tombol interaksi
    const targetMap = teleporter.getData('targetMap');
    const targetPosition = teleporter.getData('targetPosition');
    
    // Jika ini teleporter di map yang sama
    if (!targetMap && targetPosition) {
      this.isTeleporting = true;
      
      // Play teleport sound
      this.sound.play('teleport-sound');
      
      // Disable control sementara
      player.disableControl(1000);
      
      // Buat efek teleport di posisi awal
      this.createTeleportEffect(player.x, player.y);
      
      // Pindahkan player ke posisi target setelah delay singkat
      this.time.delayedCall(200, () => {
        // Fade out/in kamera untuk efek
        this.cameras.main.flash(200, 255, 255, 255, true);
        
        // Teleport ke posisi baru
        (player as Player).teleport(targetPosition.x, targetPosition.y);
        
        // Reset flag setelah teleport
        this.time.delayedCall(500, () => {
          this.isTeleporting = false;
        });
      });
      
      return;
    }
    
    // Jika teleporter ke map lain, gunakan map transition manager
    if (targetMap && !this.isTeleporting) {
      const portalId = teleporter.getData('portalId');
      const portal = this.mapPortals.find(p => p.id === portalId);
      
      if (portal && this.mapTransitionManager.canUsePortal(portal, player as Player)) {
        this.isTeleporting = true;
        
        // Gunakan tipe transisi teleport
        this.mapTransitionManager.startTransition(
          this.scene.key,
          targetMap,
          player as Player,
          targetPosition,
          undefined,
          TransitionType.TELEPORT
        );
      }
    }
  }
  
  /**
   * Handle interaksi dengan pintu
   */
  private handleDoorInteraction(player: Player, portal: Portal): void {
    if (this.isTeleporting) return;
    
    // Cek persyaratan portal
    if (this.mapTransitionManager.canUsePortal(portal, player)) {
      this.isTeleporting = true;
      
      // Lakukan transisi dengan tipe door
      this.mapTransitionManager.startTransition(
        this.scene.key,
        portal.targetMapKey,
        player,
        portal.targetPosition,
        portal.targetDirection,
        TransitionType.DOOR
      );
    } else {
      // Tampilkan pesan jika tidak memenuhi syarat
      this.showRequirementMessage(portal, player);
    }
  }
  
  /**
   * Handle interaksi dengan teleporter
   */
  private handleTeleporterInteraction(player: Player, targetPosition: GamePosition): void {
    if (this.isTeleporting) return;
    
    this.isTeleporting = true;
    
    // Play teleport sound
    this.sound.play('teleport-sound');
    
    // Disable control sementara
    player.disableControl(1000);
    
    // Buat efek teleport di posisi awal
    this.createTeleportEffect(player.x, player.y);
    
    // Pindahkan player ke posisi target setelah delay singkat
    this.time.delayedCall(200, () => {
      // Fade out/in kamera untuk efek
      this.cameras.main.flash(200, 255, 255, 255, true);
      
      // Teleport ke posisi baru
      player.teleport(targetPosition.x, targetPosition.y);
      
      // Reset flag setelah teleport
      this.time.delayedCall(500, () => {
        this.isTeleporting = false;
      });
    });
  }
  
  /**
   * Tampilkan pesan ketika tidak memenuhi persyaratan portal
   */
  private showRequirementMessage(portal: Portal, player: Player): void {
    if (portal.requiredLevel && player.getPlayerData().stats.level < portal.requiredLevel) {
      // Tampilkan pesan level requirement
      const message = `Level ${portal.requiredLevel} Required`;
      this.showFloatingMessage(message, 0xFF6B6B);
    } else if (portal.unlockCondition) {
      // Tampilkan pesan kondisi unlock
      let message = 'Cannot enter yet.';
      
      switch (portal.unlockCondition.type) {
        case 'item':
          message = `You need ${portal.unlockCondition.value} to enter`;
          break;
        case 'quest':
          message = `Complete required quest first`;
          break;
      }
      
      this.showFloatingMessage(message, 0xFF6B6B);
    } else if (portal.isLocked) {
      // Tampilkan pesan terkunci
      this.showFloatingMessage('This door is locked', 0xFF6B6B);
    }
    
    // Play sound effect untuk denied access
    this.sound.play('denied-sound');
  }
  
  /**
   * Buat efek teleport
   */
  private createTeleportEffect(x: number, y: number): void {
    // Buat particle system untuk efek teleport
    const particles = this.add.particles('pixel-bg');
    
    // Emitter yang meledak keluar
    const burstEmitter = particles.createEmitter({
      x, y,
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      quantity: 20,
      tint: 0x4B7BEC
    });
    
    // Emitter spiral
    const spiralEmitter = particles.createEmitter({
      x, y,
      emitCallback: (particle) => {
        const t = particle.life;
        const angle = t * 0.2;
        const radius = 20 * (1 - t);
        
        particle.velocityX = Math.cos(angle) * radius;
        particle.velocityY = Math.sin(angle) * radius;
      },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      quantity: 2,
      frequency: 50,
      tint: 0x45AAF2
    });
    
    // Flash light
    const light = this.add.pointlight(x, y, 0x4B7BEC, 100, 0.8, 0.1);
    
    // Animasi light fading
    this.tweens.add({
      targets: light,
      radius: 0,
      intensity: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        light.destroy();
      }
    });
    
    // Destroy particle system setelah selesai
    this.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }
  
  /**
   * Tampilkan pesan floating
   */
  private showFloatingMessage(message: string, color: number = 0xFFFFFF): void {
    // Buat text di atas player
    const text = this.add.text(
      this.player!.x,
      this.player!.y - 50,
      message,
      {
        fontFamily: 'Press Start 2P',
        fontSize: '10px',
        color: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    text.setOrigin(0.5, 0.5);
    text.setDepth(1000);
    
    // Animasi floating dan fading
    this.tweens.add({
      targets: text,
      y: text.y - 20,
      alpha: { from: 1, to: 0 },
      duration: 2000,
      ease: 'Linear',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  /**
   * Clean up resources when scene is shut down
   */
  shutdown(): void {
    // Stop animations and sounds
    if (this.walkSound.isPlaying) {
      this.walkSound.stop();
    }
    
    if (this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
    }
    
    // Clean up transition manager resources
    
    // Clean up collision manager
    this.collisionManager.destroy();
    
    // Clean up interaction manager
    this.interactionManager.destroy();
    
    // Clean up custom effects
    this.teleporters.forEach(teleporter => {
      const particles = teleporter.getData('particles');
      const light = teleporter.getData('light');
      
      if (particles) particles.destroy();
      if (light) light.destroy();
    });
    
    // Remove event listeners
    this.events.off('playerInteract', this.handlePlayerInteraction, this);
    
    // Call parent shutdown
    super.shutdown();
  }
}