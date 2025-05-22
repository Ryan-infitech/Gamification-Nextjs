import Phaser from 'phaser';
import Player from '@/game/objects/Player';
import NPC from '@/game/objects/NPC';

/**
 * Interface untuk callback collision event
 */
interface CollisionCallback {
  (object1: Phaser.GameObjects.GameObject, object2: Phaser.GameObjects.GameObject): void;
}

/**
 * Interface untuk custom collision object
 */
interface CollisionZone {
  name: string;
  bounds: Phaser.Geom.Rectangle;
  onEnter?: (player: Player) => void;
  onLeave?: (player: Player) => void;
  onCollide?: (player: Player) => void;
  oneTime?: boolean;
  isActive: boolean;
  wasTriggered?: boolean;
  requiredLevel?: number;
  requiredItem?: string;
  data?: any;
}

/**
 * Class untuk collision detection dan management
 */
export class CollisionManager {
  private scene: Phaser.Scene;
  private player?: Player;
  private collisionZones: CollisionZone[] = [];
  private activeCollidingZones: Set<string> = new Set();
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private showDebug: boolean = false;
  
  /**
   * Constructor
   */
  constructor(scene: Phaser.Scene, debug: boolean = false) {
    this.scene = scene;
    this.showDebug = debug;
    
    if (debug) {
      this.debugGraphics = scene.add.graphics();
      this.debugGraphics.setDepth(1000);
    }
  }
  
  /**
   * Set player reference
   */
  public setPlayer(player: Player): void {
    this.player = player;
  }
  
  /**
   * Setup collision between player and tilemap layers
   */
  public setupTilemapCollision(
    player: Player, 
    layers: Phaser.Tilemaps.TilemapLayer[], 
    callback?: CollisionCallback
  ): void {
    if (!player) return;
    
    layers.forEach(layer => {
      // Setup collision with layer
      this.scene.physics.add.collider(player, layer, (obj1, obj2) => {
        // Run custom callback if provided
        if (callback) {
          callback(obj1, obj2);
        }
      });
    });
  }
  
  /**
   * Setup collision between player and NPCs
   */
  public setupNPCCollision(
    player: Player, 
    npcs: NPC[] | Phaser.Physics.Arcade.Group, 
    callback?: CollisionCallback
  ): void {
    if (!player) return;
    
    // Setup collision with NPCs
    this.scene.physics.add.collider(player, npcs, (obj1, obj2) => {
      // Run custom callback if provided
      if (callback) {
        callback(obj1, obj2);
      }
    });
  }
  
  /**
   * Setup collision between player and physics objects
   */
  public setupObjectCollision(
    player: Player,
    objects: Phaser.Physics.Arcade.Sprite[] | Phaser.Physics.Arcade.Group,
    callback?: CollisionCallback
  ): void {
    if (!player) return;
    
    // Setup collision with objects
    this.scene.physics.add.collider(player, objects, (obj1, obj2) => {
      // Run custom callback if provided
      if (callback) {
        callback(obj1, obj2);
      }
    });
  }
  
  /**
   * Setup overlap detection between interaction zone and interactive objects
   */
  public setupInteractionOverlap(
    player: Player,
    interactiveObjects: Phaser.Physics.Arcade.Sprite[] | Phaser.Physics.Arcade.Group,
    callback: CollisionCallback
  ): void {
    if (!player) return;
    
    // Get the interaction zone from player
    const interactionZone = player.getInteractionZone();
    
    // Setup overlap with interactive objects
    this.scene.physics.add.overlap(interactionZone, interactiveObjects, (zone, obj) => {
      // Run callback
      callback(zone, obj);
    });
  }
  
  /**
   * Add a custom collision zone to the manager
   */
  public addCollisionZone(
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options: Partial<Omit<CollisionZone, 'name' | 'bounds' | 'isActive'>> = {}
  ): CollisionZone {
    const newZone: CollisionZone = {
      name,
      bounds: new Phaser.Geom.Rectangle(x, y, width, height),
      onEnter: options.onEnter,
      onLeave: options.onLeave,
      onCollide: options.onCollide,
      oneTime: options.oneTime || false,
      isActive: true,
      wasTriggered: false,
      requiredLevel: options.requiredLevel,
      requiredItem: options.requiredItem,
      data: options.data
    };
    
    this.collisionZones.push(newZone);
    
    // Draw debug visualization if enabled
    if (this.showDebug && this.debugGraphics) {
      this.drawCollisionZoneDebug(newZone);
    }
    
    return newZone;
  }
  
  /**
   * Remove a collision zone by name
   */
  public removeCollisionZone(name: string): void {
    const index = this.collisionZones.findIndex(zone => zone.name === name);
    if (index !== -1) {
      this.collisionZones.splice(index, 1);
      this.activeCollidingZones.delete(name);
      
      // Redraw debug graphics if enabled
      if (this.showDebug && this.debugGraphics) {
        this.drawDebugVisualization();
      }
    }
  }
  
  /**
   * Enable or disable a collision zone
   */
  public setCollisionZoneActive(name: string, isActive: boolean): void {
    const zone = this.collisionZones.find(zone => zone.name === name);
    if (zone) {
      zone.isActive = isActive;
      
      // If deactivating, remove from active colliding zones
      if (!isActive) {
        this.activeCollidingZones.delete(name);
      }
      
      // Redraw debug graphics if enabled
      if (this.showDebug && this.debugGraphics) {
        this.drawDebugVisualization();
      }
    }
  }
  
  /**
   * Reset 'wasTriggered' flag for one-time collision zones
   */
  public resetOneTimeZones(): void {
    this.collisionZones.forEach(zone => {
      if (zone.oneTime) {
        zone.wasTriggered = false;
      }
    });
  }
  
  /**
   * Update method to check collision with custom zones
   */
  public update(): void {
    if (!this.player) return;
    
    // Get player bounds
    const playerBounds = new Phaser.Geom.Rectangle(
      this.player.x - this.player.width / 2,
      this.player.y - this.player.height / 2,
      this.player.width,
      this.player.height
    );
    
    // Set of zones player is currently colliding with
    const currentCollidingZones = new Set<string>();
    
    // Check each collision zone
    this.collisionZones.forEach(zone => {
      // Skip if zone is inactive or was triggered (if one-time)
      if (!zone.isActive || (zone.oneTime && zone.wasTriggered)) return;
      
      // Check if player meets prerequisites for this zone
      if (!this.checkZonePrerequisites(zone)) return;
      
      // Check intersection
      const isColliding = Phaser.Geom.Rectangle.Overlaps(playerBounds, zone.bounds);
      
      if (isColliding) {
        // Add to current colliding zones
        currentCollidingZones.add(zone.name);
        
        // Check if this is a new collision
        if (!this.activeCollidingZones.has(zone.name)) {
          // Call onEnter callback if provided
          if (zone.onEnter) {
            zone.onEnter(this.player!);
          }
          
          // Mark as triggered if one-time
          if (zone.oneTime) {
            zone.wasTriggered = true;
          }
        }
        
        // Call onCollide callback if provided
        if (zone.onCollide) {
          zone.onCollide(this.player!);
        }
      }
    });
    
    // Check for zones player has left
    this.activeCollidingZones.forEach(zoneName => {
      if (!currentCollidingZones.has(zoneName)) {
        // Get the zone
        const zone = this.collisionZones.find(z => z.name === zoneName);
        
        // Call onLeave callback if provided
        if (zone && zone.onLeave) {
          zone.onLeave(this.player!);
        }
      }
    });
    
    // Update active colliding zones
    this.activeCollidingZones = currentCollidingZones;
  }
  
  /**
   * Check if player meets prerequisites for a zone
   */
  private checkZonePrerequisites(zone: CollisionZone): boolean {
    // Skip checks if no player
    if (!this.player) return false;
    
    // Check level requirement
    if (zone.requiredLevel && this.player.getPlayerData().stats.level < zone.requiredLevel) {
      return false;
    }
    
    // Check item requirement
    if (zone.requiredItem) {
      // This would require inventory system integration
      // For now, we'll always return true for item checks
      return true;
    }
    
    return true;
  }
  
  /**
   * Draw debug visualization for collision zones
   */
  private drawDebugVisualization(): void {
    if (!this.debugGraphics) return;
    
    // Clear previous graphics
    this.debugGraphics.clear();
    
    // Draw each collision zone
    this.collisionZones.forEach(zone => {
      this.drawCollisionZoneDebug(zone);
    });
  }
  
  /**
   * Draw debug visualization for a single collision zone
   */
  private drawCollisionZoneDebug(zone: CollisionZone): void {
    if (!this.debugGraphics) return;
    
    // Color based on zone type and state
    let color: number;
    let alpha: number;
    
    if (!zone.isActive) {
      // Inactive zone
      color = 0x999999;
      alpha = 0.3;
    } else if (zone.oneTime && zone.wasTriggered) {
      // Triggered one-time zone
      color = 0x996633;
      alpha = 0.3;
    } else if (this.activeCollidingZones.has(zone.name)) {
      // Active collision
      color = 0xff0000;
      alpha = 0.5;
    } else {
      // Normal active zone
      color = 0x00ff00;
      alpha = 0.3;
    }
    
    // Draw rectangle
    this.debugGraphics.lineStyle(2, color, 1);
    this.debugGraphics.strokeRect(
      zone.bounds.x, 
      zone.bounds.y, 
      zone.bounds.width, 
      zone.bounds.height
    );
    
    // Fill rectangle
    this.debugGraphics.fillStyle(color, alpha);
    this.debugGraphics.fillRect(
      zone.bounds.x, 
      zone.bounds.y, 
      zone.bounds.width, 
      zone.bounds.height
    );
    
    // Draw name if zone is active
    if (zone.isActive) {
      const textX = zone.bounds.x + zone.bounds.width / 2;
      const textY = zone.bounds.y + zone.bounds.height / 2;
      
      // Create text if it doesn't exist
      const text = this.scene.add.text(textX, textY, zone.name, {
        font: '8px Arial',
        color: '#ffffff'
      });
      text.setOrigin(0.5);
      text.setDepth(1001);
      
      // Store text in a temporary object that will be removed next frame
      this.scene.time.delayedCall(16, () => {
        text.destroy();
      });
    }
  }
  
  /**
   * Show or hide debug visualization
   */
  public setDebug(show: boolean): void {
    this.showDebug = show;
    
    if (show && !this.debugGraphics) {
      this.debugGraphics = this.scene.add.graphics();
      this.debugGraphics.setDepth(1000);
    }
    
    if (this.debugGraphics) {
      this.debugGraphics.visible = show;
      
      if (show) {
        this.drawDebugVisualization();
      }
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.collisionZones = [];
    this.activeCollidingZones.clear();
    
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = undefined;
    }
  }
}

/**
 * Utility function to check if point is within polygon
 */
export function isPointInPolygon(
  point: { x: number, y: number }, 
  polygon: { x: number, y: number }[]
): boolean {
  let inside = false;
  const x = point.x;
  const y = point.y;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Check if two circles overlap
 */
export function circlesOverlap(
  x1: number, 
  y1: number, 
  radius1: number, 
  x2: number, 
  y2: number, 
  radius2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < radius1 + radius2;
}

/**
 * Check if circle overlaps with rectangle
 */
export function circleRectOverlap(
  circleX: number, 
  circleY: number, 
  radius: number, 
  rectX: number, 
  rectY: number, 
  rectWidth: number, 
  rectHeight: number
): boolean {
  // Find the closest point to the circle within the rectangle
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
  
  // Calculate the distance between the circle's center and this closest point
  const distanceX = circleX - closestX;
  const distanceY = circleY - closestY;
  
  // If the distance is less than the circle's radius, an intersection occurs
  const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
  return distanceSquared < (radius * radius);
}

/**
 * Utility function to check if two objects are overlapping
 */
export function areObjectsOverlapping(
  obj1: Phaser.GameObjects.GameObject, 
  obj2: Phaser.GameObjects.GameObject
): boolean {
  // For sprites with physics bodies
  if (obj1 instanceof Phaser.Physics.Arcade.Sprite && 
      obj2 instanceof Phaser.Physics.Arcade.Sprite) {
    return Phaser.Geom.Rectangle.Overlaps(
      obj1.getBounds(),
      obj2.getBounds()
    );
  }
  
  // For zones
  if (obj1 instanceof Phaser.GameObjects.Zone && 
      obj2 instanceof Phaser.Physics.Arcade.Sprite) {
    return Phaser.Geom.Rectangle.Overlaps(
      (obj1 as any).getBounds(), // Zones don't have getBounds, so this is a bit hacky
      obj2.getBounds()
    );
  }
  
  // Fallback to basic position checking
  const dist = Phaser.Math.Distance.Between(
    (obj1 as any).x, 
    (obj1 as any).y, 
    (obj2 as any).x, 
    (obj2 as any).y
  );
  
  // Arbitrary distance threshold
  return dist < 50;
}

export default CollisionManager;
