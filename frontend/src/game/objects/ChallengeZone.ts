import Phaser from 'phaser';
import Player from './Player';
import { ChallengeType } from '@/types/challenges';

/**
 * Interface untuk data konfigurasi ChallengeZone
 */
export interface ChallengeZoneConfig {
  /**
   * ID unik dari zone
   */
  id: string;
  
  /**
   * ID tantangan yang terkait
   */
  challengeId: string;
  
  /**
   * Judul tantangan untuk ditampilkan
   */
  title: string;
  
  /**
   * Deskripsi singkat tantangan (opsional)
   */
  description?: string;
  
  /**
   * Level minimum yang diperlukan untuk mengakses tantangan
   */
  requiredLevel?: number;
  
  /**
   * Apakah tantangan sudah diselesaikan oleh pemain
   */
  isCompleted?: boolean;
  
  /**
   * Apakah tantangan terbuka atau terkunci
   */
  isLocked?: boolean;
  
  /**
   * Alasan mengapa tantangan terkunci (jika ada)
   */
  lockedReason?: string;
  
  /**
   * ID tantangan yang perlu diselesaikan sebelum yang ini (prasyarat)
   */
  prerequisiteChallengeIds?: string[];
  
  /**
   * Jenis indikator visual (default: 'circle')
   */
  indicatorType?: 'circle' | 'exclamation' | 'question' | 'star' | 'custom';
  
  /**
   * Warna untuk indikator (dalam format hex)
   */
  indicatorColor?: number;
  
  /**
   * Texture kustom untuk indikator (jika indicatorType = 'custom')
   */
  customIndicatorTexture?: string;
  
  /**
   * Jenis tantangan (koding, quiz, dll)
   */
  challengeType: 'programming' | 'quiz' | 'interactive' | 'debug';
  
  /**
   * Data tambahan untuk tantangan
   */
  metadata?: Record<string, any>;
}

/**
 * Class untuk zona tantangan - area di mana player dapat memulai tantangan kode
 */
export default class ChallengeZone extends Phaser.GameObjects.Zone {
  private config: ChallengeZoneConfig;
  private indicator: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
  private labelText: Phaser.GameObjects.Text;
  private isPlayerInRange: boolean = false;
  private interactKey: Phaser.Input.Keyboard.Key;
  private pulseAnimation: Phaser.Tweens.Tween | null = null;
  private statusIcon: Phaser.GameObjects.Sprite | null = null;
  private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private debugGraphics: Phaser.GameObjects.Graphics | null = null;
  private challengeData: ChallengeType | null = null;
  
  /**
   * Constructor untuk ChallengeZone
   */
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, config: ChallengeZoneConfig) {
    super(scene, x, y, width, height);
    this.config = config;
    
    // Tambahkan zone ke scene
    scene.add.existing(this);
    scene.physics.world.enable(this);
    
    // Setup physics properties
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    
    // Setup collision zone (biasanya lebih besar dari indikator visual)
    const interactionRadius = Math.max(width, height) / 2;
    body.setCircle(interactionRadius);
    
    // Buat indikator visual sesuai dengan tipe yang dipilih
    this.createVisualIndicator();
    
    // Tambahkan text label di atas indikator
    this.createLabel();
    
    // Setup status icon (jika completed atau locked)
    this.updateStatusIcon();
    
    // Setup interact key (E)
    this.interactKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    
    // Setup debug visualizer jika mode debug aktif
    if (scene.game.config.physics?.arcade?.debug) {
      this.createDebugVisualizer();
    }
    
    // Setup particles jika tantangan belum diselesaikan
    if (!this.config.isCompleted && !this.config.isLocked) {
      this.createParticleEffect();
    }
    
    // Set nama object untuk referensi mudah
    this.setName(`challenge-zone-${config.id}`);
    
    // Set data untuk diakses oleh scene atau objects lain
    this.setData('challengeId', config.challengeId);
    this.setData('challengeType', config.challengeType);
    
    // Listen untuk events dari scene
    this.scene.events.on('update', this.update, this);
    this.on('destroy', this.onDestroy, this);
  }
  
  /**
   * Buat indikator visual untuk zona tantangan
   */
  private createVisualIndicator(): void {
    // Default color jika tidak diatur
    const color = this.config.indicatorColor || 0x4B7BEC;
    
    // Buat indikator berdasarkan tipe
    switch (this.config.indicatorType) {
      case 'exclamation':
        this.indicator = this.scene.add.sprite(this.x, this.y, 'challenge-icons', 0);
        break;
      case 'question':
        this.indicator = this.scene.add.sprite(this.x, this.y, 'challenge-icons', 1);
        break;
      case 'star':
        this.indicator = this.scene.add.sprite(this.x, this.y, 'challenge-icons', 2);
        break;
      case 'custom':
        if (this.config.customIndicatorTexture) {
          this.indicator = this.scene.add.sprite(this.x, this.y, this.config.customIndicatorTexture);
        } else {
          // Fallback ke circle jika custom texture tidak tersedia
          this.createCircleIndicator(color);
        }
        break;
      case 'circle':
      default:
        this.createCircleIndicator(color);
        break;
    }
    
    // Set depth untuk indikator (di atas ground, di bawah objects)
    this.indicator.setDepth(3);
    
    // Mulai animasi pulse
    this.startPulseAnimation();
  }
  
  /**
   * Buat indikator lingkaran dengan efek glow
   */
  private createCircleIndicator(color: number): void {
    // Buat container untuk indicator
    this.indicator = this.scene.add.container(this.x, this.y);
    
    // Tambahkan glow effect (circle lebih besar dengan alpha rendah)
    const glow = this.scene.add.circle(0, 0, 16, color, 0.3);
    
    // Tambahkan lingkaran utama
    const circle = this.scene.add.circle(0, 0, 10, color, 1);
    
    // Tambahkan simbol sesuai jenis tantangan
    let icon: Phaser.GameObjects.Sprite | null = null;
    
    switch (this.config.challengeType) {
      case 'programming':
        // Simbol kode { }
        icon = this.scene.add.sprite(0, 0, 'challenge-type-icons', 0);
        break;
      case 'quiz':
        // Simbol tanda tanya
        icon = this.scene.add.sprite(0, 0, 'challenge-type-icons', 1);
        break;
      case 'debug':
        // Simbol bug
        icon = this.scene.add.sprite(0, 0, 'challenge-type-icons', 2);
        break;
      case 'interactive':
        // Simbol lab/experiment
        icon = this.scene.add.sprite(0, 0, 'challenge-type-icons', 3);
        break;
    }
    
    // Tambahkan elemen ke container
    this.indicator.add(glow);
    this.indicator.add(circle);
    if (icon) {
      icon.setScale(0.5);
      this.indicator.add(icon);
    }
  }
  
  /**
   * Buat text label untuk zona
   */
  private createLabel(): void {
    // Buat text dengan judul tantangan
    this.labelText = this.scene.add.text(
      this.x,
      this.y - 32,
      this.config.title,
      {
        fontSize: '12px',
        fontFamily: 'Press Start 2P',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }
    );
    
    // Set properties
    this.labelText.setOrigin(0.5, 1);
    this.labelText.setDepth(3);
    this.labelText.setAlpha(0); // Awalnya tersembunyi
  }
  
  /**
   * Update status icon berdasarkan status tantangan
   */
  private updateStatusIcon(): void {
    // Hapus status icon yang ada jika ada
    if (this.statusIcon) {
      this.statusIcon.destroy();
      this.statusIcon = null;
    }
    
    // Kita perlu icon status jika tantangan selesai atau terkunci
    if (this.config.isCompleted) {
      // Completed icon (checkmark)
      this.statusIcon = this.scene.add.sprite(
        this.x + 14,
        this.y - 14,
        'status-icons',
        0 // Checkmark frame
      );
      this.statusIcon.setDepth(4);
      
      // Nonaktifkan particle emitter jika ada
      if (this.particleEmitter) {
        this.particleEmitter.stop();
      }
    } else if (this.config.isLocked) {
      // Locked icon (padlock)
      this.statusIcon = this.scene.add.sprite(
        this.x + 14,
        this.y - 14,
        'status-icons',
        1 // Lock frame
      );
      this.statusIcon.setDepth(4);
      
      // Nonaktifkan particle emitter jika ada
      if (this.particleEmitter) {
        this.particleEmitter.stop();
      }
      
      // Buat indikator abu-abu jika terkunci
      this.setTint(0x888888);
    }
  }
  
  /**
   * Buat debug visualizer untuk zona
   */
  private createDebugVisualizer(): void {
    this.debugGraphics = this.scene.add.graphics();
    this.debugGraphics.setDepth(100); // Selalu di atas
    
    // Update debug graphics setiap frame
    this.scene.events.on('update', this.updateDebugGraphics, this);
  }
  
  /**
   * Update debug graphics
   */
  private updateDebugGraphics(): void {
    if (!this.debugGraphics) return;
    
    this.debugGraphics.clear();
    
    // Draw zone boundary
    this.debugGraphics.lineStyle(1, 0x00ff00, 0.8);
    this.debugGraphics.strokeCircle(this.x, this.y, (this.body as Phaser.Physics.Arcade.Body).width / 2);
    
    // Draw text showing challenge ID
    if (this.isPlayerInRange) {
      this.debugGraphics.lineStyle(1, 0xff0000, 1);
      this.debugGraphics.strokeCircle(this.x, this.y, (this.body as Phaser.Physics.Arcade.Body).width / 2 + 2);
    }
  }
  
  /**
   * Buat particle effect untuk tantangan
   */
  private createParticleEffect(): void {
    // Skip jika particles tidak didukung atau tidak diinginkan
    if (!this.scene.add.particles) return;
    
    // Warna partikel berdasarkan tipe tantangan
    let particleColor;
    switch (this.config.challengeType) {
      case 'programming':
        particleColor = 0x4B7BEC; // Blue
        break;
      case 'quiz':
        particleColor = 0x2ECC71; // Green
        break;
      case 'debug':
        particleColor = 0xFFA502; // Orange
        break;
      case 'interactive':
        particleColor = 0xFF6B6B; // Red
        break;
      default:
        particleColor = 0x4B7BEC; // Blue default
    }
    
    // Buat particle emitter
    const particles = this.scene.add.particles('pixel-bg');
    this.particleEmitter = particles.createEmitter({
      x: this.x,
      y: this.y,
      speed: { min: 10, max: 20 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 1000,
      blendMode: 'ADD',
      frequency: 200,
      quantity: 1,
      tint: particleColor
    });
    
    // Emitter bergerak dalam lingkaran di sekitar zona
    this.scene.tweens.add({
      targets: this.particleEmitter,
      emitX: {
        value: `+=${Math.cos(0) * 20}`,
        ease: 'Sine.easeInOut'
      },
      emitY: {
        value: `+=${Math.sin(0) * 20}`,
        ease: 'Sine.easeInOut'
      },
      duration: 2000,
      yoyo: true,
      repeat: -1
    });
  }
  
  /**
   * Mulai animasi pulse untuk indikator
   */
  private startPulseAnimation(): void {
    // Stop existing animation if any
    if (this.pulseAnimation) {
      this.pulseAnimation.stop();
    }
    
    // Different animation based on indicator type
    if (this.indicator instanceof Phaser.GameObjects.Container) {
      // If indicator is a container, apply scale animation
      this.pulseAnimation = this.scene.tweens.add({
        targets: this.indicator,
        scaleX: { from: 1, to: 1.2 },
        scaleY: { from: 1, to: 1.2 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      // If indicator is a sprite, apply alpha and scale animation
      this.pulseAnimation = this.scene.tweens.add({
        targets: this.indicator,
        alpha: { from: 0.7, to: 1 },
        scaleX: { from: 1, to: 1.1 },
        scaleY: { from: 1, to: 1.1 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
  
  /**
   * Set tint pada indikator
   */
  private setTint(color: number): void {
    if (this.indicator instanceof Phaser.GameObjects.Sprite) {
      this.indicator.setTint(color);
    } else if (this.indicator instanceof Phaser.GameObjects.Container) {
      // Apply tint to all container children that can be tinted
      this.indicator.getAll().forEach((child: any) => {
        if (child.setTint) {
          child.setTint(color);
        }
      });
    }
  }
  
  /**
   * Check apakah player berada dalam jangkauan
   */
  public checkPlayerInRange(player: Player): boolean {
    // Jarak player ke zona
    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      this.x,
      this.y
    );
    
    // Player dianggap dalam jangkauan jika distance kurang dari radius + buffer
    const body = this.body as Phaser.Physics.Arcade.Body;
    const isInRange = distance < (body.width / 2) + 10;
    
    // Update state hanya jika berubah
    if (isInRange !== this.isPlayerInRange) {
      this.isPlayerInRange = isInRange;
      this.handleRangeChange();
    }
    
    return isInRange;
  }
  
  /**
   * Handle perubahan saat player masuk/keluar jangkauan
   */
  private handleRangeChange(): void {
    if (this.isPlayerInRange) {
      // Player masuk jangkauan - tampilkan label
      this.scene.tweens.add({
        targets: this.labelText,
        alpha: 1,
        y: this.y - 40,
        duration: 200,
        ease: 'Back.easeOut'
      });
      
      // Tingkatkan scale indikator
      this.scene.tweens.add({
        targets: this.indicator,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        ease: 'Back.easeOut'
      });
      
      // Tampilkan hint "Press E" jika tantangan tidak terkunci
      if (!this.config.isLocked) {
        this.showInteractionHint();
      } else if (this.config.lockedReason) {
        // Tampilkan alasan mengapa terkunci
        this.showLockedReason();
      }
      
      // Play sound effect
      this.scene.sound.play('challenge-found', { volume: 0.5 });
      
    } else {
      // Player keluar jangkauan - sembunyikan label
      this.scene.tweens.add({
        targets: this.labelText,
        alpha: 0,
        y: this.y - 32,
        duration: 200,
        ease: 'Back.easeIn'
      });
      
      // Kembalikan scale indikator ke normal
      this.scene.tweens.add({
        targets: this.indicator,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.easeIn'
      });
      
      // Hapus hint
      this.hideInteractionHint();
    }
  }
  
  /**
   * Tampilkan hint "Press E" untuk interaksi
   */
  private showInteractionHint(): void {
    // Hapus hint yang ada jika sudah ada
    this.hideInteractionHint();
    
    // Buat hint text
    const hintText = this.scene.add.text(
      this.x,
      this.y + 25,
      'Press E',
      {
        fontSize: '10px',
        fontFamily: 'Press Start 2P',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    
    // Set properties
    hintText.setOrigin(0.5);
    hintText.setDepth(3);
    hintText.setName('interaction-hint');
    
    // Tambahkan pulsing animation
    this.scene.tweens.add({
      targets: hintText,
      alpha: { from: 0.7, to: 1 },
      scaleX: { from: 0.9, to: 1 },
      scaleY: { from: 0.9, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Tambahkan hint ke scene
    this.scene.add.existing(hintText);
    
    // Simpan reference ke hint
    this.setData('hintText', hintText);
  }
  
  /**
   * Sembunyikan hint interaksi
   */
  private hideInteractionHint(): void {
    const hintText = this.getData('hintText') as Phaser.GameObjects.Text;
    if (hintText) {
      hintText.destroy();
      this.setData('hintText', null);
    }
    
    const lockedText = this.getData('lockedText') as Phaser.GameObjects.Text;
    if (lockedText) {
      lockedText.destroy();
      this.setData('lockedText', null);
    }
  }
  
  /**
   * Tampilkan alasan mengapa tantangan terkunci
   */
  private showLockedReason(): void {
    // Hapus hint yang ada jika sudah ada
    this.hideInteractionHint();
    
    // Buat locked text
    const lockedText = this.scene.add.text(
      this.x,
      this.y + 25,
      this.config.lockedReason || 'Locked',
      {
        fontSize: '10px',
        fontFamily: 'Press Start 2P',
        color: '#FF6B6B',
        stroke: '#000000',
        strokeThickness: 3,
        wordWrap: { width: 120 }
      }
    );
    
    // Set properties
    lockedText.setOrigin(0.5);
    lockedText.setDepth(3);
    lockedText.setName('locked-reason');
    
    // Tambahkan ke scene
    this.scene.add.existing(lockedText);
    
    // Simpan reference
    this.setData('lockedText', lockedText);
  }
  
  /**
   * Set data tantangan
   */
  public setChallengeData(data: ChallengeType): void {
    this.challengeData = data;
  }
  
  /**
   * Get data tantangan
   */
  public getChallengeData(): ChallengeType | null {
    return this.challengeData;
  }
  
  /**
   * Set status tantangan (completed)
   */
  public setCompleted(completed: boolean = true): void {
    this.config.isCompleted = completed;
    this.updateStatusIcon();
    
    if (completed) {
      // Buat efek completion
      this.createCompletionEffect();
    }
  }
  
  /**
   * Set status tantangan (locked)
   */
  public setLocked(locked: boolean, reason?: string): void {
    this.config.isLocked = locked;
    if (reason) {
      this.config.lockedReason = reason;
    }
    this.updateStatusIcon();
  }
  
  /**
   * Buat effect saat tantangan diselesaikan
   */
  private createCompletionEffect(): void {
    // Buat particle burst
    const particles = this.scene.add.particles('pixel-bg');
    const emitter = particles.createEmitter({
      x: this.x,
      y: this.y,
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      tint: 0x2ECC71 // Green particles
    });
    
    // One-shot burst
    emitter.explode(20, this.x, this.y);
    
    // Play completion sound
    this.scene.sound.play('challenge-complete', { volume: 0.6 });
    
    // Self-destruct emitter
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
    
    // Buat text "Completed!"
    const completedText = this.scene.add.text(
      this.x,
      this.y - 50,
      'COMPLETED!',
      {
        fontSize: '12px',
        fontFamily: 'Press Start 2P',
        color: '#2ECC71',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    
    // Set properties
    completedText.setOrigin(0.5);
    completedText.setDepth(5);
    completedText.setAlpha(0);
    
    // Animate the text
    this.scene.tweens.add({
      targets: completedText,
      y: this.y - 70,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: completedText,
          alpha: 0,
          y: this.y - 90,
          duration: 500,
          delay: 1000,
          ease: 'Back.easeIn',
          onComplete: () => {
            completedText.destroy();
          }
        });
      }
    });
  }
  
  /**
   * Update method
   */
  public update(time: number, delta: number): void {
    // Jika player dalam jangkauan dan tantangan tidak terkunci, cek input
    if (this.isPlayerInRange && !this.config.isLocked) {
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.triggerChallenge();
      }
    }
  }
  
  /**
   * Trigger tantangan
   */
  public triggerChallenge(): void {
    // Skip jika tantangan terkunci
    if (this.config.isLocked) return;
    
    // Tambahkan animasi pada zona saat dipicu
    this.scene.tweens.add({
      targets: [this.indicator, this.labelText],
      alpha: 0,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // Emit event untuk membuka tantangan
        this.scene.events.emit('openChallenge', {
          id: this.config.challengeId,
          type: this.config.challengeType,
          title: this.config.title,
          data: this.challengeData
        });
        
        // Untuk debugging
        console.log(`Challenge triggered: ${this.config.challengeId} (${this.config.title})`);
      }
    });
    
    // Play sound effect
    this.scene.sound.play('challenge-start', { volume: 0.7 });
    
    // Sembunyikan interaction hint
    this.hideInteractionHint();
  }
  
  /**
   * Cleanup pada destroy
   */
  private onDestroy(): void {
    // Remove tweens
    if (this.pulseAnimation) {
      this.pulseAnimation.stop();
    }
    
    // Remove event listeners
    this.scene.events.off('update', this.update, this);
    if (this.debugGraphics) {
      this.scene.events.off('update', this.updateDebugGraphics, this);
    }
    
    // Destroy particles
    if (this.particleEmitter) {
      this.particleEmitter.stop();
      // The parent container should be destroyed
      const particles = this.particleEmitter.getParticleEmitterManager();
      if (particles) {
        particles.destroy();
      }
    }
    
    // Destroy indicator and texts
    if (this.indicator) {
      if (this.indicator instanceof Phaser.GameObjects.Container) {
        this.indicator.destroy();
      } else {
        this.indicator.destroy();
      }
    }
    
    if (this.labelText) {
      this.labelText.destroy();
    }
    
    if (this.statusIcon) {
      this.statusIcon.destroy();
    }
    
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
    }
    
    // Destroy any remaining hints
    this.hideInteractionHint();
  }
}
