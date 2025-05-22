import Phaser from 'phaser';
import { SceneType, GameConfig, GameControls, PlayerData, GamePosition } from '@/types/phaser';

/**
 * Tutorial scene untuk memperkenalkan pemain ke game
 */
export default class TutorialAreaScene extends Phaser.Scene {
  // Configuration and data
  private gameConfig!: GameConfig;
  private playerData!: PlayerData;
  
  // Map elements
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private obstaclesLayer!: Phaser.Tilemaps.TilemapLayer;
  private decorationLayer!: Phaser.Tilemaps.TilemapLayer;
  
  // Character and player
  private player!: Phaser.Physics.Arcade.Sprite;
  private tutor!: Phaser.Physics.Arcade.Sprite;
  
  // Movement and controls
  private controls!: GameControls;
  private playerVelocity: number = 100; // Slower for tutorial
  private playerIsMoving: boolean = false;
  private currentPlayerDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  
  // Tutorial specific
  private tutorialStep: number = 0;
  private tutorialComplete: boolean = false;
  private tutorialTexts: Phaser.GameObjects.Text[] = [];
  private helpBubble!: Phaser.GameObjects.Container;
  private dialogActive: boolean = false;
  
  // Audio
  private backgroundMusic!: Phaser.Sound.BaseSound;
  private walkSound!: Phaser.Sound.BaseSound;
  private interactSound!: Phaser.Sound.BaseSound;
  
  // Dialog steps for tutorial
  private tutorialSteps = [
    {
      text: "Welcome to the Computer Science Adventure! I'm Professor Pixel, your guide.",
      position: { x: 240, y: 240 }
    },
    {
      text: "Let's learn the basics. Use W,A,S,D or arrow keys to move around.",
      position: { x: 240, y: 240 },
      task: 'move'
    },
    {
      text: "Great job! Now press E to interact with objects and NPCs like me.",
      position: { x: 240, y: 240 },
      task: 'interact'
    },
    {
      text: "Excellent! Throughout your journey, you'll encounter coding challenges.",
      position: { x: 240, y: 240 }
    },
    {
      text: "Let's try a simple one! Head to the glowing terminal ahead.",
      position: { x: 350, y: 200 },
      task: 'gotoChallenge'
    },
    {
      text: "This is a basic 'Hello World' challenge. Press E to start.",
      position: { x: 350, y: 200 },
      task: 'startChallenge'
    },
    {
      text: "Congratulations! You've completed the tutorial. Let's head to the main world!",
      position: { x: 240, y: 240 },
      task: 'finishTutorial'
    }
  ];
  
  constructor() {
    super({
      key: SceneType.TUTORIAL
    });
  }

  /**
   * Initialize scene data
   */
  init(): void {
    this.gameConfig = this.game.config as GameConfig;
    
    // Get player data from registry or create default
    this.playerData = this.registry.get('playerData') || {
      position: { x: 240, y: 240 },
      sprite: 'player',
      stats: {
        level: 1,
        experience: 0,
        health: 100,
        strength: 10,
        intelligence: 10,
        agility: 10
      }
    };
    
    // Check if tutorial was already completed from localStorage
    const completedTutorial = localStorage.getItem('completedTutorial');
    this.tutorialComplete = !!completedTutorial;
    
    // Reset tutorial state
    this.tutorialStep = 0;
    this.tutorialTexts = [];
    this.dialogActive = false;
  }

  /**
   * Create tutorial scene
   */
  create(): void {
    // If tutorial already completed, skip to world map
    if (this.tutorialComplete) {
      this.skipToWorldMap();
      return;
    }
    
    // Setup map
    this.createMap();
    
    // Setup player
    this.createPlayer();
    
    // Setup tutor character
    this.createTutor();
    
    // Setup camera
    this.setupCamera();
    
    // Setup controls
    this.setupControls();
    
    // Setup collisions
    this.setupCollisions();
    
    // Setup audio
    this.setupAudio();
    
    // Setup tutorial elements
    this.setupTutorial();
    
    // Add challenges
    this.createChallenges();
    
    // Create dialog bubble
    this.createDialogBubble();
    
    // Start the tutorial
    this.startTutorialStep();
    
    // Fade in
    this.cameras.main.fadeIn(1000);
  }

  /**
   * Create the tilemap from Tiled JSON
   */
  private createMap(): void {
    // Create tilemap from JSON
    this.map = this.make.tilemap({ key: 'tutorial-area' });
    
    // Add tileset image
    this.tileset = this.map.addTilesetImage('main-tileset', 'main-tileset') as Phaser.Tilemaps.Tileset;
    
    // Create layers
    this.groundLayer = this.map.createLayer('ground', this.tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer;
    this.decorationLayer = this.map.createLayer('decoration', this.tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer;
    this.obstaclesLayer = this.map.createLayer('obstacles', this.tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer;
    
    // Set collision properties
    this.obstaclesLayer.setCollisionByProperty({ collides: true });
  }

  /**
   * Create player character
   */
  private createPlayer(): void {
    // Create player sprite at start position
    this.player = this.physics.add.sprite(
      this.playerData.position.x,
      this.playerData.position.y,
      'player',
      0
    );
    
    // Enable physics for the player
    this.player.setCollideWorldBounds(true);
    this.player.setSize(24, 16); // Smaller collision box than sprite
    this.player.setOffset(4, 16); // Offset collision box to fit character
    
    // Set z-index for proper overlap rendering
    this.player.setDepth(1);
    
    // Create animations for player
    this.createPlayerAnimations();
    
    // Start with idle animation
    this.player.anims.play('idle-down');
  }

  /**
   * Create player animations
   */
  private createPlayerAnimations(): void {
    // Only create animations if they don't exist yet
    if (!this.anims.exists('idle-down')) {
      // Idle animations
      this.anims.create({
        key: 'idle-down',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
      });
      
      this.anims.create({
        key: 'idle-up',
        frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
        frameRate: 5,
        repeat: -1
      });
      
      this.anims.create({
        key: 'idle-left',
        frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
        frameRate: 5,
        repeat: -1
      });
      
      this.anims.create({
        key: 'idle-right',
        frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
        frameRate: 5,
        repeat: -1
      });
      
      // Walking animations
      this.anims.create({
        key: 'walk-down',
        frames: this.anims.generateFrameNumbers('player', { start: 16, end: 23 }),
        frameRate: 10,
        repeat: -1
      });
      
      this.anims.create({
        key: 'walk-up',
        frames: this.anims.generateFrameNumbers('player', { start: 24, end: 31 }),
        frameRate: 10,
        repeat: -1
      });
      
      this.anims.create({
        key: 'walk-left',
        frames: this.anims.generateFrameNumbers('player', { start: 32, end: 39 }),
        frameRate: 10,
        repeat: -1
      });
      
      this.anims.create({
        key: 'walk-right',
        frames: this.anims.generateFrameNumbers('player', { start: 40, end: 47 }),
        frameRate: 10,
        repeat: -1
      });
    }
  }

  /**
   * Create tutor character (professor)
   */
  private createTutor(): void {
    // Create tutor at fixed position
    this.tutor = this.physics.add.sprite(
      240,
      180,
      'npcs',
      0
    );
    
    // Enable physics
    this.tutor.setImmovable(true);
    
    // Create tutor idle animation
    if (!this.anims.exists('tutor-idle')) {
      this.anims.create({
        key: 'tutor-idle',
        frames: this.anims.generateFrameNumbers('npcs', { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
      });
    }
    
    // Play idle animation
    this.tutor.anims.play('tutor-idle');
    
    // Add exclamation mark indicator
    const indicator = this.add.sprite(
      this.tutor.x,
      this.tutor.y - 30,
      'ui-icons',
      5
    );
    
    // Add floating animation to indicator
    this.tweens.add({
      targets: indicator,
      y: indicator.y - 5,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Store indicator reference
    this.tutor.setData('indicator', indicator);
  }

  /**
   * Setup camera to follow player
   */
  private setupCamera(): void {
    // Configure main camera
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2); // Closer zoom for tutorial
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
  }

  /**
   * Setup keyboard controls
   */
  private setupControls(): void {
    // Get keyboard inputs
    this.controls = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      interact: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      menu: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    };
    
    // Arrow keys also work
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => {
      this.controls.up.isDown = true;
    });
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).on('down', () => {
      this.controls.down.isDown = true;
    });
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT).on('down', () => {
      this.controls.left.isDown = true;
    });
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT).on('down', () => {
      this.controls.right.isDown = true;
    });
    
    // Add interact handler
    this.controls.interact.on('down', () => this.handleInteract());
    
    // Add skip tutorial option
    this.controls.menu.on('down', () => this.showSkipTutorialPrompt());
  }

  /**
   * Setup collisions between objects
   */
  private setupCollisions(): void {
    // Player collides with obstacles
    this.physics.add.collider(this.player, this.obstaclesLayer);
    
    // Player collides with tutor
    this.physics.add.collider(this.player, this.tutor);
  }

  /**
   * Setup game audio
   */
  private setupAudio(): void {
    // Background music (different, more peaceful for tutorial)
    this.backgroundMusic = this.sound.add('bg-music', {
      volume: 0.3,
      loop: true
    });
    
    // Check if sound is enabled in player preferences
    const soundEnabled = this.registry.get('soundEnabled');
    if (soundEnabled !== false) {
      this.backgroundMusic.play();
    }
    
    // Walking sound
    this.walkSound = this.sound.add('walk-sound', {
      volume: 0.2,
      loop: true,
      rate: 1.5
    });
    
    // Interaction sound
    this.interactSound = this.sound.add('interact-sound', {
      volume: 0.5
    });
  }

  /**
   * Setup tutorial elements
   */
  private setupTutorial(): void {
    // Create "Skip Tutorial" button
    const skipButton = this.add.container(
      this.cameras.main.width - 80,
      30
    );
    skipButton.setScrollFactor(0);
    skipButton.setDepth(100);
    
    // Button background
    const skipBg = this.add.graphics();
    skipBg.fillStyle(0x000000, 0.6);
    skipBg.fillRoundedRect(0, 0, 120, 30, 5);
    skipBg.lineStyle(2, 0xFFFFFF, 0.8);
    skipBg.strokeRoundedRect(0, 0, 120, 30, 5);
    
    // Button text
    const skipText = this.add.text(
      60,
      15,
      'Skip Tutorial',
      {
        fontFamily: 'Press Start 2P',
        fontSize: '8px',
        color: '#FFFFFF'
      }
    );
    skipText.setOrigin(0.5);
    
    // Add to container
    skipButton.add([skipBg, skipText]);
    
    // Make button interactive
    skipBg.setInteractive({
      useHandCursor: true
    });
    skipBg.on('pointerdown', () => {
      this.showSkipTutorialPrompt();
    });
  }

  /**
   * Create dialog bubble for tutorial messages
   */
  private createDialogBubble(): void {
    // Create container
    this.helpBubble = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100
    );
    this.helpBubble.setScrollFactor(0);
    this.helpBubble.setDepth(100);
    this.helpBubble.setAlpha(0);
    
    // Background
    const bubbleBg = this.add.nineslice(
      0, 0,
      'dialog-box',
      0,
      400, 100,
      20, 20, 20, 20
    );
    
    // Text
    const bubbleText = this.add.text(
      0,
      0,
      '',
      {
        fontFamily: 'VT323',
        fontSize: '20px',
        color: '#FFFFFF',
        align: 'center',
        wordWrap: { width: 360 }
      }
    );
    bubbleText.setOrigin(0.5);
    
    // Continue indicator
    const continueText = this.add.text(
      160,
      35,
      'Press E to continue',
      {
        fontFamily: 'Press Start 2P',
        fontSize: '8px',
        color: '#FFFFFF',
      }
    );
    continueText.setOrigin(0.5);
    
    // Blinking animation
    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Add to container
    this.helpBubble.add([bubbleBg, bubbleText, continueText]);
    
    // Store text reference for easy updating
    this.helpBubble.setData('textObject', bubbleText);
    this.helpBubble.setData('continueText', continueText);
  }

  /**
   * Create tutorial challenges
   */
  private createChallenges(): void {
    // Create challenge terminal
    const terminal = this.physics.add.sprite(
      350,
      200,
      'tileset-items',
      0
    );
    
    // Add glow effect
    const glow = this.add.graphics();
    glow.fillStyle(0x4B7BEC, 0.4);
    glow.fillCircle(350, 200, 20);
    
    // Add pulsing animation
    this.tweens.add({
      targets: glow,
      alpha: 0.2,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Store reference
    terminal.setData('glow', glow);
    terminal.setData('type', 'challenge');
    
    // Make terminal interactive
    terminal.setInteractive();
    
    // Start floating effect
    this.tweens.add({
      targets: terminal,
      y: terminal.y - 5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Start tutorial step
   */
  private startTutorialStep(): void {
    // Get current step
    const step = this.tutorialSteps[this.tutorialStep];
    
    // If no step, end tutorial
    if (!step) {
      this.completeTutorial();
      return;
    }
    
    // Update professor position if needed
    if (step.position && this.tutorialStep > 0) {
      this.moveTutorTo(step.position);
    }
    
    // Show dialog
    this.showDialog(step.text);
    
    // Setup task for this step if needed
    this.setupStepTask(step);
  }

  /**
   * Show dialog bubble with text
   */
  private showDialog(text: string): void {
    // Set dialog text
    const textObject = this.helpBubble.getData('textObject');
    textObject.setText(text);
    
    // Show dialog bubble
    this.helpBubble.setAlpha(0);
    this.tweens.add({
      targets: this.helpBubble,
      alpha: 1,
      y: this.cameras.main.height - 100,
      duration: 300
    });
    
    // Set dialog as active
    this.dialogActive = true;
  }

  /**
   * Hide dialog bubble
   */
  private hideDialog(): void {
    // Hide dialog bubble
    this.tweens.add({
      targets: this.helpBubble,
      alpha: 0,
      y: this.cameras.main.height - 80,
      duration: 300
    });
    
    // Set dialog as inactive
    this.dialogActive = false;
  }

  /**
   * Setup task for current tutorial step
   */
  private setupStepTask(step: any): void {
    // Clear any existing task state
    this.player.setData('taskCompleted', false);
    
    // Setup task based on type
    switch (step.task) {
      case 'move':
        // Will be checked on update() for player movement
        break;
        
      case 'interact':
        // Will be checked when player presses E near tutor
        break;
        
      case 'gotoChallenge':
        // Will be checked on update() for player position
        break;
        
      case 'startChallenge':
        // Will be checked when player presses E near terminal
        break;
        
      case 'finishTutorial':
        // Will be completed when player presses E to continue
        break;
    }
  }

  /**
   * Check if current step task is completed
   */
  private checkStepTaskCompletion(): void {
    // If no current step or task already completed, skip
    if (this.tutorialStep >= this.tutorialSteps.length || this.player.getData('taskCompleted')) {
      return;
    }
    
    // Get current step
    const step = this.tutorialSteps[this.tutorialStep];
    
    // Check completion based on task type
    switch (step.task) {
      case 'move':
        // Check if player has moved
        if (this.playerIsMoving) {
          this.completeCurrentTask();
        }
        break;
        
      case 'gotoChallenge':
        // Check if player is near the challenge terminal
        const terminal = this.children.getAll().find(child => child.getData && child.getData('type') === 'challenge');
        if (terminal) {
          const distance = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            terminal.x,
            terminal.y
          );
          
          if (distance < 50) {
            this.completeCurrentTask();
          }
        }
        break;
    }
  }

  /**
   * Complete current tutorial task
   */
  private completeCurrentTask(): void {
    // Mark task as completed
    this.player.setData('taskCompleted', true);
    
    // Play success sound
    this.sound.play('success-sound');
    
    // Hide current dialog
    this.hideDialog();
    
    // Move to next step after a short delay
    this.time.delayedCall(1000, () => {
      this.tutorialStep++;
      this.startTutorialStep();
    });
  }

  /**
   * Move tutor to a new position with animation
   */
  private moveTutorTo(position: GamePosition): void {
    // Skip if already at position
    if (this.tutor.x === position.x && this.tutor.y === position.y) {
      return;
    }
    
    // Calculate direction
    const dirX = position.x - this.tutor.x;
    const dirY = position.y - this.tutor.y;
    
    // Determine animation based on direction
    /*
    // This would be implemented with proper tutor walking animations
    if (Math.abs(dirX) > Math.abs(dirY)) {
      // Horizontal movement
      this.tutor.anims.play(dirX > 0 ? 'tutor-walk-right' : 'tutor-walk-left', true);
    } else {
      // Vertical movement
      this.tutor.anims.play(dirY > 0 ? 'tutor-walk-down' : 'tutor-walk-up', true);
    }
    */
    
    // Move tutor
    this.tweens.add({
      targets: this.tutor,
      x: position.x,
      y: position.y,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // Return to idle animation
        this.tutor.anims.play('tutor-idle');
      }
    });
    
    // Also move the indicator
    const indicator = this.tutor.getData('indicator');
    if (indicator) {
      this.tweens.add({
        targets: indicator,
        x: position.x,
        y: position.y - 30,
        duration: 1000,
        ease: 'Power2'
      });
    }
  }

  /**
   * Handle E key interaction
   */
  private handleInteract(): void {
    // Play interaction sound
    this.interactSound.play();
    
    // If dialog is active, advance dialog
    if (this.dialogActive) {
      this.handleDialogAdvance();
      return;
    }
    
    // Check for interaction with tutor
    const distanceToTutor = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.tutor.x,
      this.tutor.y
    );
    
    if (distanceToTutor < 50) {
      // Get current step
      const step = this.tutorialSteps[this.tutorialStep];
      
      // Check if this is the interact task
      if (step && step.task === 'interact') {
        this.completeCurrentTask();
      } else {
        // Otherwise just show current step dialog again
        this.showDialog(step ? step.text : "Let's continue our adventure!");
      }
      
      return;
    }
    
    // Check for interaction with challenge terminal
    const terminal = this.children.getAll().find(child => child.getData && child.getData('type') === 'challenge');
    if (terminal) {
      const distanceToTerminal = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        terminal.x,
        terminal.y
      );
      
      if (distanceToTerminal < 50) {
        // Get current step
        const step = this.tutorialSteps[this.tutorialStep];
        
        // Check if this is the start challenge task
        if (step && step.task === 'startChallenge') {
          this.startCodeChallenge();
        }
      }
    }
  }

  /**
   * Handle dialog advance when pressing E
   */
  private handleDialogAdvance(): void {
    // Get current step
    const step = this.tutorialSteps[this.tutorialStep];
    
    // If this is a task step, don't advance automatically
    if (step && step.task && step.task !== 'finishTutorial') {
      // Just hide dialog
      this.hideDialog();
      return;
    }
    
    // If current step is finish tutorial, complete tutorial
    if (step && step.task === 'finishTutorial') {
      this.completeTutorial();
      return;
    }
    
    // Otherwise move to next step
    this.tutorialStep++;
    this.hideDialog();
    
    // Start next step after a short delay
    this.time.delayedCall(500, () => {
      this.startTutorialStep();
    });
  }

  /**
   * Start Hello World code challenge
   */
  private startCodeChallenge(): void {
    // Complete current task first
    this.completeCurrentTask();
    
    // In a real implementation, this would launch the code editor
    // For now, we'll simulate completion after a brief delay
    this.time.delayedCall(1000, () => {
      // Show a temporary "challenge completed" message
      const completedText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 50,
        'Challenge Completed!',
        {
          fontFamily: 'Press Start 2P',
          fontSize: '20px',
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 6
        }
      );
      completedText.setOrigin(0.5);
      completedText.setScrollFactor(0);
      completedText.setDepth(200);
      
      // Animate it
      completedText.setAlpha(0);
      completedText.setScale(0.5);
      this.tweens.add({
        targets: completedText,
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Hold, then fade out
          this.time.delayedCall(2000, () => {
            this.tweens.add({
              targets: completedText,
              alpha: 0,
              scale: 1.2,
              duration: 500,
              ease: 'Back.easeIn',
              onComplete: () => {
                completedText.destroy();
                
                // Advance to next step
                this.tutorialStep++;
                this.startTutorialStep();
              }
            });
          });
        }
      });
      
      // Play success sound
      this.sound.play('success-sound');
    });
  }

  /**
   * Complete the tutorial and move on
   */
  private completeTutorial(): void {
    // Mark tutorial as completed in localStorage
    localStorage.setItem('completedTutorial', 'true');
    
    // Hide dialog
    this.hideDialog();
    
    // Show completion message
    const completedText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      'Tutorial Completed!',
      {
        fontFamily: 'Press Start 2P',
        fontSize: '24px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6
      }
    );
    completedText.setOrigin(0.5);
    completedText.setScrollFactor(0);
    completedText.setDepth(200);
    
    // Animate it
    completedText.setAlpha(0);
    completedText.setScale(0.5);
    this.tweens.add({
      targets: completedText,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold, then transition to World Map
        this.time.delayedCall(3000, () => {
          this.cameras.main.fadeOut(1000);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // Transition to world map
            this.moveToWorldMap();
          });
        });
      }
    });
    
    // Play success sound
    this.sound.play('success-sound');
  }

  /**
   * Show skip tutorial prompt
   */
  private showSkipTutorialPrompt(): void {
    // Create container for prompt
    const container = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2
    );
    container.setScrollFactor(0);
    container.setDepth(1000);
    
    // Background
    const background = this.add.graphics();
    background.fillStyle(0x000000, 0.8);
    background.fillRoundedRect(-200, -100, 400, 200, 10);
    background.lineStyle(2, 0xFFFFFF, 0.8);
    background.strokeRoundedRect(-200, -100, 400, 200, 10);
    
    // Message text
    const messageText = this.add.text(
      0,
      -50,
      'Skip Tutorial?',
      {
        fontFamily: 'Press Start 2P',
        fontSize: '20px',
        color: '#FFFFFF',
        align: 'center'
      }
    );
    messageText.setOrigin(0.5);
    
    // Submessage text
    const submessageText = this.add.text(
      0,
      -10,
      'Are you sure you want to skip the tutorial?',
      {
        fontFamily: 'VT323',
        fontSize: '20px',
        color: '#FFFFFF',
        align: 'center'
      }
    );
    submessageText.setOrigin(0.5);
    
    // Yes button
    const yesButton = this.add.graphics();
    yesButton.fillStyle(0x2ECC71, 1);
    yesButton.fillRoundedRect(-100, 30, 90, 40, 5);
    yesButton.lineStyle(2, 0xFFFFFF, 0.8);
    yesButton.strokeRoundedRect(-100, 30, 90, 40, 5);
    
    const yesText = this.add.text(
      -55,
      50,
      'YES',
      {
        fontFamily: 'Press Start 2P',
        fontSize: '14px',
        color: '#FFFFFF',
        align: 'center'
      }
    );
    yesText.setOrigin(0.5);
    
    // No button
    const noButton = this.add.graphics();
    noButton.fillStyle(0xFF6B6B, 1);
    noButton.fillRoundedRect(10, 30, 90, 40, 5);
    noButton.lineStyle(2, 0xFFFFFF, 0.8);
    noButton.strokeRoundedRect(10, 30, 90, 40, 5);
    
    const noText = this.add.text(
      55,
      50,
      'NO',
      {
        fontFamily: 'Press Start 2P',
        fontSize: '14px',
        color: '#FFFFFF',
        align: 'center'
      }
    );
    noText.setOrigin(0.5);
    
    // Add to container
    container.add([background, messageText, submessageText, yesButton, yesText, noButton, noText]);
    
    // Make buttons interactive
    yesButton.setInteractive({
      useHandCursor: true
    });
    yesButton.on('pointerdown', () => {
      // Destroy prompt
      container.destroy();
      
      // Skip tutorial
      this.skipToWorldMap();
    });
    
    noButton.setInteractive({
      useHandCursor: true
    });
    noButton.on('pointerdown', () => {
      // Just destroy prompt
      container.destroy();
    });
    
    // Animation
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300
    });
  }

  /**
   * Skip directly to world map
   */
  private skipToWorldMap(): void {
    // Mark tutorial as completed
    localStorage.setItem('completedTutorial', 'true');
    
    // Fade out and transition
    this.cameras.main.fadeOut(500);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.moveToWorldMap();
    });
  }

  /**
   * Move to world map scene
   */
  private moveToWorldMap(): void {
    // Stop music
    if (this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
    }
    
    // Transition to world map
    this.scene.start(SceneType.WORLD_MAP, {
      playerData: {
        position: { x: 240, y: 240 } // Starting position in world map
      }
    });
  }

  /**
   * Update method called every frame
   */
  update(time: number, delta: number): void {
    // Skip update if scene is transitioning or paused
    if (this.scene.isTransitioning || this.scene.isPaused()) return;
    
    // Handle player movement
    this.handlePlayerMovement();
    
    // Check step task completion
    this.checkStepTaskCompletion();
    
    // Update indicators
    this.updateIndicators();
  }

  /**
   * Handle player movement based on input
   */
  private handlePlayerMovement(): void {
    // Reset velocity
    this.player.setVelocity(0);
    
    // Track if the player is moving
    let isMoving = false;
    
    // Handle up/down movement
    if (this.controls.up.isDown) {
      this.player.setVelocityY(-this.playerVelocity);
      this.currentPlayerDirection = 'up';
      isMoving = true;
    } else if (this.controls.down.isDown) {
      this.player.setVelocityY(this.playerVelocity);
      this.currentPlayerDirection = 'down';
      isMoving = true;
    }
    
    // Handle left/right movement
    if (this.controls.left.isDown) {
      this.player.setVelocityX(-this.playerVelocity);
      this.currentPlayerDirection = 'left';
      isMoving = true;
    } else if (this.controls.right.isDown) {
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
   * Update indicators (tutor, challenge, etc.)
   */
  private updateIndicators(): void {
    // Update tutor indicator
    const tutorIndicator = this.tutor.getData('indicator');
    if (tutorIndicator) {
      tutorIndicator.setPosition(this.tutor.x, this.tutor.y - 30);
    }
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
    
    // Remove event listeners
    this.controls.interact.off('down');
    this.controls.menu.off('down');
    
    // Clean up any remaining tweens
    this.tweens.killAll();
    
    // Call parent shutdown
    super.shutdown();
  }
}
