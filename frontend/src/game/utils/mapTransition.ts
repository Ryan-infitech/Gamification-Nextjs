import Phaser from 'phaser';
import { SceneType, GamePosition, Direction, PlayerData } from '@/types/phaser';
import Player from '../objects/Player';

/**
 * Interface untuk definisi portal/pintu
 */
export interface Portal {
  id: string;
  sourceMapKey: string;
  targetMapKey: string;
  sourcePosition: GamePosition;
  targetPosition: GamePosition;
  width: number;
  height: number;
  targetDirection?: Direction;
  unlockCondition?: {
    type: 'level' | 'item' | 'quest';
    value: string | number;
  };
  requiredLevel?: number;
  isLocked?: boolean;
  name?: string;
  customTransition?: string;
}

/**
 * Interface untuk data transisi
 */
export interface TransitionData {
  sourceMap: string;
  targetMap: string;
  sourcePosition: GamePosition;
  targetPosition: GamePosition;
  targetDirection?: Direction;
  player: PlayerData;
  transitionType?: string;
  preserveCamera?: boolean;
  fadeColor?: number;
  additionalData?: any;
}

/**
 * Enum untuk jenis transisi
 */
export enum TransitionType {
  FADE = 'fade',
  DOOR = 'door',
  TELEPORT = 'teleport',
  INSTANT = 'instant',
  SLIDE = 'slide',
  PIXELATE = 'pixelate'
}

/**
 * Class untuk mengelola transisi antar map dalam game
 */
export class MapTransitionManager {
  private scene: Phaser.Scene;
  private portals: Map<string, Portal[]> = new Map();
  private transitionDuration: number = 500;
  private fadeColor: number = 0x000000;
  private isTransitioning: boolean = false;
  
  /**
   * Constructor
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * Register portal untuk map tertentu
   */
  public registerPortal(portal: Portal): void {
    // Pastikan map key ada dalam registry
    if (!this.portals.has(portal.sourceMapKey)) {
      this.portals.set(portal.sourceMapKey, []);
    }
    
    // Tambahkan portal ke map
    this.portals.get(portal.sourceMapKey)?.push(portal);
  }
  
  /**
   * Register banyak portal sekaligus
   */
  public registerPortals(portals: Portal[]): void {
    portals.forEach(portal => this.registerPortal(portal));
  }
  
  /**
   * Dapatkan semua portal untuk map tertentu
   */
  public getPortalsForMap(mapKey: string): Portal[] {
    return this.portals.get(mapKey) || [];
  }
  
  /**
   * Cek apakah player bisa menggunakan portal (level requirement, dll)
   */
  public canUsePortal(portal: Portal, player: Player): boolean {
    // Cek jika portal terkunci
    if (portal.isLocked) return false;
    
    // Cek jika ada requirement level
    if (portal.requiredLevel && player.getPlayerData().stats.level < portal.requiredLevel) {
      return false;
    }
    
    // Cek untuk unlock condition lainnya
    if (portal.unlockCondition) {
      switch (portal.unlockCondition.type) {
        case 'level':
          return player.getPlayerData().stats.level >= Number(portal.unlockCondition.value);
        case 'item':
          // Implementasi cek item akan bergantung pada sistem inventory
          return true; // Placeholder
        case 'quest':
          // Implementasi cek quest akan bergantung pada sistem quest
          return true; // Placeholder
      }
    }
    
    return true;
  }
  
  /**
   * Cek jika saat ini sedang dalam transisi
   */
  public isInTransition(): boolean {
    return this.isTransitioning;
  }
  
  /**
   * Jalankan transisi ke map lain
   */
  public startTransition(
    sourceMap: string, 
    targetMap: string, 
    player: Player, 
    targetPosition?: GamePosition,
    targetDirection?: Direction,
    transitionType: TransitionType = TransitionType.FADE
  ): void {
    // Cek jika sedang dalam transisi
    if (this.isTransitioning) return;
    
    // Mark sebagai sedang dalam transisi
    this.isTransitioning = true;
    
    // Disable control player selama transisi
    player.disableControl();
    
    // Dapatkan player data untuk diteruskan ke map tujuan
    const playerData = player.getPlayerData();
    
    // Dapatkan posisi sumber
    const sourcePosition = { x: player.x, y: player.y };
    
    // Setup transition data
    const transitionData: TransitionData = {
      sourceMap,
      targetMap,
      sourcePosition,
      targetPosition: targetPosition || sourcePosition,
      targetDirection: targetDirection || player.getDirection(),
      player: playerData,
      transitionType: transitionType
    };
    
    // Save transition data ke registry agar bisa diakses scene lain
    this.scene.registry.set('transitionData', transitionData);
    
    // Jalankan transisi berdasarkan tipe
    switch (transitionType) {
      case TransitionType.DOOR:
        this.doDoorTransition(transitionData);
        break;
      case TransitionType.TELEPORT:
        this.doTeleportTransition(transitionData);
        break;
      case TransitionType.INSTANT:
        this.doInstantTransition(transitionData);
        break;
      case TransitionType.SLIDE:
        this.doSlideTransition(transitionData);
        break;
      case TransitionType.PIXELATE:
        this.doPixelateTransition(transitionData);
        break;
      case TransitionType.FADE:
      default:
        this.doFadeTransition(transitionData);
        break;
    }
  }
  
  /**
   * Lakukan transisi fade
   */
  private doFadeTransition(data: TransitionData): void {
    // Fade out
    this.scene.cameras.main.fadeOut(this.transitionDuration, this.fadeColor);
    
    // Ketika fade out selesai, pindah scene
    this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.completeTransition(data);
    });
  }
  
  /**
   * Lakukan transisi door (seperti memasuki pintu)
   */
  private doDoorTransition(data: TransitionData): void {
    // Play door sound jika ada
    if (this.scene.sound.get('door-open')) {
      this.scene.sound.play('door-open');
    }
    
    // Animasi menutup pintu (fade to black)
    this.scene.cameras.main.fadeOut(this.transitionDuration, 0x000000);
    
    // Ketika animasi selesai, pindah scene
    this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.completeTransition(data);
    });
  }
  
  /**
   * Lakukan transisi teleport (dengan efek teleport)
   */
  private doTeleportTransition(data: TransitionData): void {
    // Dapatkan player dari scene
    const player = this.scene.children.getByName('player') as Player;
    
    if (player) {
      // Buat efek teleport pada player
      this.createTeleportEffect(player.x, player.y);
      
      // Play teleport sound
      if (this.scene.sound.get('teleport-sound')) {
        this.scene.sound.play('teleport-sound');
      }
      
      // Delay sebentar untuk efek teleport
      this.scene.time.delayedCall(300, () => {
        // Fade out cepat
        this.scene.cameras.main.fadeOut(200, 0xFFFFFF);
        
        // Ketika fade out selesai, pindah scene
        this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.completeTransition(data);
        });
      });
    } else {
      // Fallback ke fade biasa jika tidak ada player
      this.doFadeTransition(data);
    }
  }
  
  /**
   * Lakukan transisi instant (tanpa animasi)
   */
  private doInstantTransition(data: TransitionData): void {
    // Langsung pindah tanpa animasi
    this.completeTransition(data);
  }
  
  /**
   * Lakukan transisi slide (camera slide)
   */
  private doSlideTransition(data: TransitionData): void {
    // Tentukan arah slide berdasarkan posisi target vs source
    const slideDirection = this.determineSlideDirection(data.sourcePosition, data.targetPosition);
    
    // Setup tween untuk slide
    const cameraX = this.scene.cameras.main.scrollX;
    const cameraY = this.scene.cameras.main.scrollY;
    
    // Sesuaikan target slide berdasarkan arah
    let targetX = cameraX;
    let targetY = cameraY;
    
    switch (slideDirection) {
      case 'up':
        targetY = cameraY - this.scene.cameras.main.height;
        break;
      case 'down':
        targetY = cameraY + this.scene.cameras.main.height;
        break;
      case 'left':
        targetX = cameraX - this.scene.cameras.main.width;
        break;
      case 'right':
        targetX = cameraX + this.scene.cameras.main.width;
        break;
    }
    
    // Animasi slide
    this.scene.tweens.add({
      targets: this.scene.cameras.main,
      scrollX: targetX,
      scrollY: targetY,
      duration: this.transitionDuration,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.completeTransition(data);
      }
    });
  }
  
  /**
   * Lakukan transisi pixelate (efek pixelate)
   */
  private doPixelateTransition(data: TransitionData): void {
    // Setup shader untuk pixelate effect
    const pixelateShader = this.setupPixelateShader();
    
    // Animasi pixelate
    this.scene.tweens.add({
      targets: pixelateShader,
      pixelSize: { from: 1, to: 20 },
      duration: this.transitionDuration,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // Pindah scene setelah efek selesai
        this.completeTransition(data);
      }
    });
  }
  
  /**
   * Setup shader untuk efek pixelate
   */
  private setupPixelateShader(): any {
    // Ini adalah implementasi placeholder
    // Implementasi sebenarnya akan melibatkan shader Phaser
    return { pixelSize: 1 };
  }
  
  /**
   * Selesaikan transisi dengan memulai scene baru
   */
  private completeTransition(data: TransitionData): void {
    // Mulai scene target dengan passing transition data
    this.scene.scene.start(data.targetMap, { 
      transitionData: data 
    });
    
    // Reset flag transisi
    this.isTransitioning = false;
  }
  
  /**
   * Tentukan arah slide berdasarkan posisi source dan target
   */
  private determineSlideDirection(source: GamePosition, target: GamePosition): Direction {
    // Jika koordinat sangat berbeda, cari arah dominan
    const dx = Math.abs(target.x - source.x);
    const dy = Math.abs(target.y - source.y);
    
    if (dx > dy) {
      return target.x > source.x ? 'right' : 'left';
    } else {
      return target.y > source.y ? 'down' : 'up';
    }
  }
  
  /**
   * Buat efek partikel teleport
   */
  private createTeleportEffect(x: number, y: number): void {
    // Create particle emitter untuk efek teleport
    const particles = this.scene.add.particles('pixel-bg');
    
    const emitter = particles.createEmitter({
      x,
      y,
      speed: { min: 30, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      tint: 0x4B7BEC
    });
    
    // Stop emitter setelah beberapa saat
    this.scene.time.delayedCall(300, () => {
      emitter.stop();
    });
    
    // Destroy particle system setelah selesai
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }
  
  /**
   * Memproses ketika scene baru dimulai (untuk menyelesaikan transisi)
   */
  public processSceneStart(scene: Phaser.Scene, player: Player): void {
    // Dapatkan transition data dari registry
    const transitionData = scene.registry.get('transitionData') as TransitionData;
    
    if (!transitionData) return;
    
    // Pastikan ini adalah target map yang benar
    if (scene.scene.key !== transitionData.targetMap) return;
    
    // Posisikan player di posisi target
    if (transitionData.targetPosition) {
      player.setPosition(transitionData.targetPosition.x, transitionData.targetPosition.y);
      
      // Update arah player jika ditentukan
      if (transitionData.targetDirection) {
        const direction = transitionData.targetDirection;
        player.anims.play(`idle-${direction}`, true);
      }
    }
    
    // Jalankan fade in atau transisi lain berdasarkan jenis transisi
    const transitionType = transitionData.transitionType as TransitionType || TransitionType.FADE;
    
    switch (transitionType) {
      case TransitionType.DOOR:
        // Fade in dari hitam
        scene.cameras.main.fadeIn(this.transitionDuration, 0x000000);
        scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
          player.enableControl();
        });
        break;
      
      case TransitionType.TELEPORT:
        // Fade in dari putih, lebih cepat
        scene.cameras.main.fadeIn(200, 0xFFFFFF);
        scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
          player.enableControl();
          // Buat efek teleport di lokasi baru
          this.createTeleportEffect(player.x, player.y);
        });
        break;
      
      case TransitionType.SLIDE:
        // Re-enable control langsung setelah slide
        player.enableControl();
        break;
      
      case TransitionType.PIXELATE:
        // Reverse efek pixelate
        const pixelateShader = this.setupPixelateShader();
        pixelateShader.pixelSize = 20;
        
        scene.tweens.add({
          targets: pixelateShader,
          pixelSize: { from: 20, to: 1 },
          duration: this.transitionDuration,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            player.enableControl();
          }
        });
        break;
      
      case TransitionType.INSTANT:
        // Re-enable control langsung
        player.enableControl();
        break;
      
      case TransitionType.FADE:
      default:
        // Default fade in
        scene.cameras.main.fadeIn(this.transitionDuration, this.fadeColor);
        scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
          player.enableControl();
        });
        break;
    }
    
    // Reset transition data dari registry setelah selesai
    scene.registry.remove('transitionData');
  }
  
  /**
   * Lock/unlock portal
   */
  public setPortalLocked(portalId: string, mapKey: string, locked: boolean): void {
    const portals = this.portals.get(mapKey);
    
    if (portals) {
      const portal = portals.find(p => p.id === portalId);
      if (portal) {
        portal.isLocked = locked;
      }
    }
  }
  
  /**
   * Set transition duration
   */
  public setTransitionDuration(duration: number): void {
    this.transitionDuration = duration;
  }
  
  /**
   * Set fade color
   */
  public setFadeColor(color: number): void {
    this.fadeColor = color;
  }
}

/**
 * Factory function untuk membuat portal
 */
export function createPortal(
  id: string,
  sourceMapKey: string,
  targetMapKey: string,
  sourcePosition: GamePosition,
  targetPosition: GamePosition,
  width: number = 32,
  height: number = 32,
  options: Partial<Omit<Portal, 'id' | 'sourceMapKey' | 'targetMapKey' | 'sourcePosition' | 'targetPosition' | 'width' | 'height'>> = {}
): Portal {
  return {
    id,
    sourceMapKey,
    targetMapKey,
    sourcePosition,
    targetPosition,
    width,
    height,
    ...options
  };
}

export default MapTransitionManager;
