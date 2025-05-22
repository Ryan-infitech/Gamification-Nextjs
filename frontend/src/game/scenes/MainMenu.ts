import Phaser from 'phaser';
import { SceneType, GameConfig } from '@/types/phaser';

interface MenuButton {
  text: Phaser.GameObjects.Text;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.NineSlice;
  icon?: Phaser.GameObjects.Image;
  isHovered: boolean;
  callback: () => void;
}

/**
 * Main Menu scene untuk menampilkan menu utama game
 */
export default class MainMenuScene extends Phaser.Scene {
  private gameConfig!: GameConfig;
  private backgroundImage!: Phaser.GameObjects.Image;
  private logoImage!: Phaser.GameObjects.Image;
  private versionText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private buttons: MenuButton[] = [];
  private backgroundMusic!: Phaser.Sound.BaseSound;
  private clickSound!: Phaser.Sound.BaseSound;
  private hoverSound!: Phaser.Sound.BaseSound;
  private playerData: any;
  private continueEnabled: boolean = false;

  constructor() {
    super({
      key: SceneType.MAIN_MENU
    });
  }

  /**
   * Initialize scene dengan data yang diperlukan
   */
  init(): void {
    this.gameConfig = this.game.config as GameConfig;
    
    // Get player data from registry
    this.playerData = this.registry.get('playerData') || null;
    
    // Check if continue should be enabled
    this.continueEnabled = !!this.playerData && this.playerData.level > 1;
  }

  /**
   * Create scene dan semua elemen UI
   */
  create(): void {
    // Setup background
    this.createBackground();
    
    // Play background music
    this.setupAudio();
    
    // Add logo
    this.createLogo();
    
    // Add menu title
    this.createTitle();
    
    // Create menu buttons
    this.createMenuButtons();
    
    // Add version text
    this.addVersionInfo();
    
    // Add pixel particles effect
    this.createParticles();
    
    // Create fade in animation
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.animateMenuElements();
    
    // Setup input listeners
    this.setupInputListeners();
  }

  /**
   * Create scrolling parallax background
   */
  private createBackground(): void {
    // Main background
    this.backgroundImage = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'background'
    );
    
    // Make sure the background covers the screen
    const scaleX = this.cameras.main.width / this.backgroundImage.width;
    const scaleY = this.cameras.main.height / this.backgroundImage.height;
    const scale = Math.max(scaleX, scaleY);
    this.backgroundImage.setScale(scale);
  }

  /**
   * Setup game audio
   */
  private setupAudio(): void {
    // Background music
    this.backgroundMusic = this.sound.add('bg-music', {
      volume: 0.5,
      loop: true
    });
    
    // Check if sound is enabled in player preferences
    const soundEnabled = this.registry.get('soundEnabled');
    if (soundEnabled !== false) {
      this.backgroundMusic.play();
    }
    
    // Sound effects
    this.clickSound = this.sound.add('interact-sound', { volume: 0.7 });
    this.hoverSound = this.sound.add('interact-sound', { volume: 0.3 });
  }

  /**
   * Create game logo
   */
  private createLogo(): void {
    this.logoImage = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.22,
      'logo'
    );
    this.logoImage.setScale(0.7);
    this.logoImage.setAlpha(0);
    
    // Animation
    this.tweens.add({
      targets: this.logoImage,
      alpha: 1,
      y: this.cameras.main.height * 0.2,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Add subtle floating animation
        this.tweens.add({
          targets: this.logoImage,
          y: this.cameras.main.height * 0.2 + 10,
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }

  /**
   * Create menu title
   */
  private createTitle(): void {
    this.titleText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.33,
      'COMPUTER SCIENCE ADVENTURE',
      {
        fontFamily: 'Press Start 2P',
        fontSize: '20px',
        color: '#FFFFFF',
        align: 'center',
        stroke: '#2F3542',
        strokeThickness: 6
      }
    );
    this.titleText.setOrigin(0.5);
    this.titleText.setAlpha(0);
    
    // Animation
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      y: this.cameras.main.height * 0.35,
      duration: 1000,
      delay: 200,
      ease: 'Cubic.easeOut'
    });
  }

  /**
   * Create menu buttons
   */
  private createMenuButtons(): void {
    const buttonData = [
      {
        text: 'Continue Game',
        iconKey: 'ui-icons',
        iconFrame: 0,
        callback: () => this.startGame(true),
        enabled: this.continueEnabled
      },
      {
        text: 'New Game',
        iconKey: 'ui-icons',
        iconFrame: 1,
        callback: () => this.startGame(false),
        enabled: true
      },
      {
        text: 'Tutorial',
        iconKey: 'ui-icons',
        iconFrame: 2,
        callback: () => this.startTutorial(),
        enabled: true
      },
      {
        text: 'Settings',
        iconKey: 'ui-icons',
        iconFrame: 3,
        callback: () => this.openSettings(),
        enabled: true
      },
      {
        text: 'Credits',
        iconKey: 'ui-icons',
        iconFrame: 4,
        callback: () => this.showCredits(),
        enabled: true
      }
    ];
    
    const buttonWidth = 250;
    const buttonHeight = 50;
    const buttonSpacing = 15;
    const startY = this.cameras.main.height * 0.45;
    
    buttonData.forEach((data, index) => {
      // Skip disabled buttons (e.g., Continue when no save game)
      if (!data.enabled) return;
      
      // Create button background (9-slice for pixel perfect scaling)
      const buttonBackground = this.add.nineslice(
        this.cameras.main.width / 2,
        startY + (buttonHeight + buttonSpacing) * index,
        'button',
        0, // frame
        buttonWidth,
        buttonHeight,
        10, 10, 10, 10 // Corner cuts
      );
      
      // Create button text
      const buttonText = this.add.text(
        this.cameras.main.width / 2,
        startY + (buttonHeight + buttonSpacing) * index,
        data.text,
        {
          fontFamily: 'Press Start 2P',
          fontSize: '16px',
          color: '#FFFFFF',
          align: 'center'
        }
      );
      buttonText.setOrigin(0.5);
      
      // Create icon if provided
      let icon;
      if (data.iconKey) {
        icon = this.add.image(
          buttonBackground.x - buttonWidth / 2 + 25,
          buttonBackground.y,
          data.iconKey,
          data.iconFrame
        );
        icon.setOrigin(0.5);
        
        // Adjust text position to make room for icon
        buttonText.setX(buttonBackground.x + 10);
      }
      
      // Create container for button elements
      const container = this.add.container(0, 0, [buttonBackground, buttonText]);
      if (icon) container.add(icon);
      
      // Make the button interactive
      buttonBackground.setInteractive({ 
        useHandCursor: true,
        pixelPerfect: true
      });
      
      // Add the button to our array
      this.buttons.push({
        text: buttonText,
        background: buttonBackground,
        container: container,
        icon: icon,
        isHovered: false,
        callback: data.callback
      });
      
      // Set initial alpha to 0 for animation
      container.setAlpha(0);
      
      // Animation with delay based on index
      this.tweens.add({
        targets: container,
        alpha: 1,
        x: 0,
        y: 0,
        duration: 500,
        delay: 300 + index * 100,
        ease: 'Cubic.easeOut'
      });
    });
    
    // Setup button hover and click effects
    this.setupButtonInteractions();
  }

  /**
   * Add interactions to buttons
   */
  private setupButtonInteractions(): void {
    this.buttons.forEach(button => {
      // Hover effects
      button.background.on('pointerover', () => {
        if (button.isHovered) return;
        button.isHovered = true;
        
        // Play hover sound
        this.hoverSound.play();
        
        // Scale effect
        this.tweens.add({
          targets: button.container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100,
          ease: 'Sine.easeOut'
        });
        
        // Change text color
        button.text.setTint(0xFFA502);
      });
      
      button.background.on('pointerout', () => {
        if (!button.isHovered) return;
        button.isHovered = false;
        
        // Scale back
        this.tweens.add({
          targets: button.container,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
          ease: 'Sine.easeIn'
        });
        
        // Reset text color
        button.text.clearTint();
      });
      
      // Click effect
      button.background.on('pointerdown', () => {
        // Scale down effect
        this.tweens.add({
          targets: button.container,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 50,
          ease: 'Sine.easeIn'
        });
      });
      
      button.background.on('pointerup', () => {
        // Play click sound
        this.clickSound.play();
        
        // Scale back with callback
        this.tweens.add({
          targets: button.container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 50,
          ease: 'Sine.easeOut',
          onComplete: () => {
            // Execute button action
            button.callback();
          }
        });
      });
    });
  }

  /**
   * Add version info text
   */
  private addVersionInfo(): void {
    const version = (this.gameConfig as any).version || '1.0.0';
    this.versionText = this.add.text(
      this.cameras.main.width - 10,
      this.cameras.main.height - 10,
      `v${version}`,
      {
        fontFamily: 'VT323',
        fontSize: '16px',
        color: '#FFFFFF',
        align: 'right'
      }
    );
    this.versionText.setOrigin(1, 1);
    this.versionText.setAlpha(0.7);
  }
  
  /**
   * Create particle effects
   */
  private createParticles(): void {
    const particles = this.add.particles('pixel-bg');
    
    particles.createEmitter({
      frame: 0,
      x: { min: 0, max: this.cameras.main.width },
      y: this.cameras.main.height + 10,
      lifespan: 5000,
      speedY: { min: -50, max: -30 },
      scale: { min: 0.1, max: 0.3 },
      alpha: { start: 0.2, end: 0 },
      tint: [0x4B7BEC, 0x45AAF2, 0x2ECC71],
      quantity: 1,
      frequency: 500
    });
  }

  /**
   * Animate menu elements on create
   */
  private animateMenuElements(): void {
    // Menu elements animations are created individually
    // in their respective creation methods to keep code organized
  }

  /**
   * Setup keyboard input listeners
   */
  private setupInputListeners(): void {
    // ESC key for settings
    this.input.keyboard.on('keydown-ESC', () => {
      this.openSettings();
    });
    
    // ENTER key for start game
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.continueEnabled) {
        this.startGame(true);
      } else {
        this.startGame(false);
      }
    });
    
    // Add keyboard navigation for buttons
    this.setupKeyboardNavigation();
  }

  /**
   * Setup keyboard navigation for menu
   */
  private setupKeyboardNavigation(): void {
    let selectedIndex = 0;
    
    // Initial button highlight
    if (this.buttons.length > 0) {
      this.highlightButton(0);
    }
    
    // Up/Down navigation
    this.input.keyboard.on('keydown-UP', () => {
      this.unhighlightButton(selectedIndex);
      selectedIndex = (selectedIndex - 1 + this.buttons.length) % this.buttons.length;
      this.highlightButton(selectedIndex);
      this.hoverSound.play();
    });
    
    this.input.keyboard.on('keydown-DOWN', () => {
      this.unhighlightButton(selectedIndex);
      selectedIndex = (selectedIndex + 1) % this.buttons.length;
      this.highlightButton(selectedIndex);
      this.hoverSound.play();
    });
    
    // Space/Enter to select
    this.input.keyboard.on('keydown-SPACE', () => {
      this.clickSound.play();
      this.buttons[selectedIndex].callback();
    });
  }

  /**
   * Highlight a button by index
   */
  private highlightButton(index: number): void {
    if (index >= 0 && index < this.buttons.length) {
      const button = this.buttons[index];
      button.isHovered = true;
      button.text.setTint(0xFFA502);
      this.tweens.add({
        targets: button.container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    }
  }

  /**
   * Remove highlight from a button
   */
  private unhighlightButton(index: number): void {
    if (index >= 0 && index < this.buttons.length) {
      const button = this.buttons[index];
      button.isHovered = false;
      button.text.clearTint();
      this.tweens.add({
        targets: button.container,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    }
  }

  /**
   * Start the game
   */
  private startGame(continueGame: boolean): void {
    // Fade out effect
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    // Stop music with fade
    if (this.backgroundMusic.isPlaying) {
      this.tweens.add({
        targets: this.backgroundMusic,
        volume: 0,
        duration: 500,
        onComplete: () => {
          this.backgroundMusic.stop();
        }
      });
    }
    
    // Transition to world map
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // Set continue game flag in registry
      this.registry.set('continueGame', continueGame);
      
      // Start world map scene
      this.scene.start(SceneType.WORLD_MAP);
    });
  }

  /**
   * Start the tutorial
   */
  private startTutorial(): void {
    // Fade out effect
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    // Stop music with fade
    if (this.backgroundMusic.isPlaying) {
      this.tweens.add({
        targets: this.backgroundMusic,
        volume: 0,
        duration: 500,
        onComplete: () => {
          this.backgroundMusic.stop();
        }
      });
    }
    
    // Transition to tutorial scene
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneType.TUTORIAL);
    });
  }

  /**
   * Open settings menu
   */
  private openSettings(): void {
    // This would open a settings overlay scene
    // For now we'll just log to console
    console.log('Settings menu would open here');
    
    // In a real implementation, you'd launch a settings scene:
    // this.scene.launch(SceneType.SETTINGS);
    // this.scene.pause();
  }

  /**
   * Show credits
   */
  private showCredits(): void {
    // This would show credits
    console.log('Credits would show here');
    
    // In a real implementation, you'd transition to a credits scene:
    // this.scene.start(SceneType.CREDITS);
  }

  /**
   * Update method dipanggil setiap frame
   */
  update(): void {
    // Add per-frame updates here if needed
    
    // Simple background parallax effect
    if (this.backgroundImage) {
      this.backgroundImage.x = this.cameras.main.width / 2 + Math.sin(this.time.now / 10000) * 20;
      this.backgroundImage.y = this.cameras.main.height / 2 + Math.cos(this.time.now / 12000) * 20;
    }
  }
}
