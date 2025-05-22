import Player from '../objects/Player';
import { InteractionData, InteractionType } from '@/types/phaser';

/**
 * Manages interactions between the player and game objects
 */
export default class InteractionManager {
  private scene: Phaser.Scene;
  private player?: Player;
  private interactableObjects: Map<string, Phaser.GameObjects.GameObject & Partial<Interactable>> = new Map();
  private interactionIndicators: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private activeInteraction?: InteractionData;
  private isInteractionActive: boolean = false;
  private debugMode: boolean = false;
  
  // Proximity radius for finding interactable objects
  private proximityRadius: number = 100;
  
  /**
   * Constructor for InteractionManager
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Register to scene events
    this.scene.events.on('playerInteract', this.handlePlayerInteraction, this);
  }
  
  /**
   * Handle player interaction event
   */
  private handlePlayerInteraction(player: Player): void {
    this.player = player;
    
    // Find the closest interactable object
    const closestInteractable = this.findClosestInteractable(player);
    
    // If an interactable is found, handle the interaction
    if (closestInteractable) {
      this.handleInteraction(player, closestInteractable.getInteractionData());
    }
  }
  
  /**
   * Find the closest interactable object
   */
  private findClosestInteractable(player: Player): (Phaser.GameObjects.GameObject & Partial<Interactable>) | undefined {
    if (!player) return undefined;
    
    // Get interaction zone
    const interactionZone = player.getInteractionZone();
    let closestDistance = this.proximityRadius;
    let closestInteractable: (Phaser.GameObjects.GameObject & Partial<Interactable>) | undefined = undefined;
    
    // Check all interactable objects
    this.interactableObjects.forEach(interactable => {
      // Skip if not active
      if (!this.isInteractableActive(interactable)) return;
      
      // Calculate distance between player and interactable
      const distance = this.calculateDistance(player, interactable);
      
      // Check if within interaction range and closer than current closest
      if (distance < closestDistance) {
        closestDistance = distance;
        closestInteractable = interactable;
      }
    });
    
    // If we found a close interactable, show its indicator
    this.updateVisibleIndicators(player, closestInteractable);
    
    return closestInteractable;
  }
  
  /**
   * Calculate distance between player and interactable object
   */
  private calculateDistance(player: Player, interactable: Phaser.GameObjects.GameObject): number {
    // Get positions
    let x1 = player.x;
    let y1 = player.y;
    let x2 = 0;
    let y2 = 0;
    
    // Get interactable position
    if ('x' in interactable && 'y' in interactable) {
      x2 = (interactable as any).x;
      y2 = (interactable as any).y;
    } else if (interactable.getInteractionData && interactable.getInteractionData().position) {
      const position = interactable.getInteractionData().position;
      x2 = position.x;
      y2 = position.y;
    } else {
      // No position data available
      return Infinity;
    }
    
    // Calculate Euclidean distance
    return Phaser.Math.Distance.Between(x1, y1, x2, y2);
  }
  
  /**
   * Check if an interactable object is active
   */
  private isInteractableActive(interactable: Phaser.GameObjects.GameObject & Partial<Interactable>): boolean {
    // Skip if object is not active in the scene
    if (!interactable.active) return false;
    
    // Get interaction data
    const data = interactable.getInteractionData ? interactable.getInteractionData() : undefined;
    
    // Skip if no data or explicitly marked as inactive
    if (!data || data.active === false) return false;
    
    return true;
  }
  
  /**
   * Update the visibility of interaction indicators
   */
  private updateVisibleIndicators(
    player: Player, 
    closestInteractable?: Phaser.GameObjects.GameObject & Partial<Interactable>
  ): void {
    // Hide all indicators first
    this.interactionIndicators.forEach((indicator, id) => {
      indicator.setVisible(false);
    });
    
    // Show indicator for closest interactable if within range
    if (closestInteractable && closestInteractable.getInteractionData) {
      const id = closestInteractable.getInteractionData().id;
      const indicator = this.interactionIndicators.get(id);
      
      if (indicator) {
        indicator.setVisible(true);
      }
      
      // Also call the interactable's own method if it exists
      if (closestInteractable.showInteractionIndicator) {
        closestInteractable.showInteractionIndicator(true);
      }
    }
  }
  
  /**
   * Handle interaction with an object
   */
  private handleInteraction(player: Player, data: InteractionData): void {
    // Set the active interaction
    this.activeInteraction = data;
    this.isInteractionActive = true;
    
    // Handle interaction based on type
    switch (data.type) {
      case InteractionType.DIALOG:
        this.handleDialogInteraction(player, data);
        break;
      case InteractionType.CHALLENGE:
        this.handleChallengeInteraction(player, data);
        break;
      case InteractionType.DOOR:
        this.handleDoorInteraction(player, data);
        break;
      case InteractionType.ITEM:
        this.handleItemInteraction(player, data);
        break;
      case InteractionType.SIGN:
        this.handleSignInteraction(player, data);
        break;
      case InteractionType.TELEPORT:
        this.handleTeleportInteraction(player, data);
        break;
      case InteractionType.SHOP:
        this.handleShopInteraction(player, data);
        break;
      case InteractionType.TRIGGER:
        this.handleTriggerInteraction(player, data);
        break;
      case InteractionType.QUEST:
        this.handleQuestInteraction(player, data);
        break;
      case InteractionType.CUSTOM:
      default:
        // For custom interactions, we emit an event that can be handled elsewhere
        this.emitInteractionEvent(player, data);
        break;
    }
  }
  
  /**
   * Handle dialog interaction
   */
  private handleDialogInteraction(player: Player, data: InteractionData): void {
    // Emit event for dialog
    this.scene.events.emit('dialogInteraction', {
      player,
      data,
      text: data.text || [''],
      options: data.options || []
    });
    
    // Temporarily disable player movement during dialog
    player.disableControl();
    
    // Play dialog sound if specified
    if (data.soundEffect && this.scene.sound.get(data.soundEffect)) {
      this.scene.sound.play(data.soundEffect);
    }
  }
  
  /**
   * Handle challenge interaction
   */
  private handleChallengeInteraction(player: Player, data: InteractionData): void {
    // Emit event for challenge
    this.scene.events.emit('challengeInteraction', {
      player,
      data
    });
    
    // Temporarily disable player movement during challenge
    player.disableControl();
  }
  
  /**
   * Handle door interaction
   */
  private handleDoorInteraction(player: Player, data: InteractionData): void {
    // Check if door is locked and requires item
    if (data.requiredItem) {
      // This would check player inventory - simplified here
      const hasKey = true; // Replace with actual inventory check
      
      if (!hasKey) {
        // Emit locked door event
        this.scene.events.emit('doorLocked', {
          player,
          data,
          message: `This door requires ${data.requiredItem}`
        });
        
        // Play locked sound
        this.scene.sound.play('door-locked');
        return;
      }
    }
    
    // Door can be opened
    // Play open door sound
    if (data.soundEffect) {
      this.scene.sound.play(data.soundEffect);
    } else {
      this.scene.sound.play('door-open');
    }
    
    // Emit door opened event - the scene would handle the actual door animation
    this.scene.events.emit('doorOpened', {
      player,
      data
    });
  }
  
  /**
   * Handle item interaction
   */
  private handleItemInteraction(player: Player, data: InteractionData): void {
    // Emit item collected event
    this.scene.events.emit('itemCollected', {
      player,
      data
    });
    
    // Play item pickup sound
    if (data.soundEffect) {
      this.scene.sound.play(data.soundEffect);
    } else {
      this.scene.sound.play('item-pickup');
    }
  }
  
  /**
   * Handle sign interaction
   */
  private handleSignInteraction(player: Player, data: InteractionData): void {
    // Signs are simple dialogs without options
    this.scene.events.emit('signRead', {
      player,
      data,
      text: data.text || ['']
    });
    
    // Play sign interaction sound
    this.scene.sound.play('sign-read');
  }
  
  /**
   * Handle teleport interaction
   */
  private handleTeleportInteraction(player: Player, data: InteractionData): void {
    // Check level requirement if any
    if (data.requiredLevel && player.getPlayerData().stats.level < data.requiredLevel) {
      // Emit level requirement not met
      this.scene.events.emit('teleportLevelRequired', {
        player,
        data,
        requiredLevel: data.requiredLevel
      });
      return;
    }
    
    // Emit teleport event
    this.scene.events.emit('teleport', {
      player,
      data
    });
    
    // The actual teleportation would be handled by the scene
  }
  
  /**
   * Handle shop interaction
   */
  private handleShopInteraction(player: Player, data: InteractionData): void {
    // Emit shop event
    this.scene.events.emit('shopInteraction', {
      player,
      data
    });
    
    // Temporarily disable player movement during shopping
    player.disableControl();
    
    // Play shop sound
    this.scene.sound.play('shop-open');
  }
  
  /**
   * Handle trigger interaction
   */
  private handleTriggerInteraction(player: Player, data: InteractionData): void {
    // Emit generic trigger event
    this.scene.events.emit('triggerActivated', {
      player,
      data
    });
    
    // Play trigger sound if specified
    if (data.soundEffect) {
      this.scene.sound.play(data.soundEffect);
    }
  }
  
  /**
   * Handle quest interaction
   */
  private handleQuestInteraction(player: Player, data: InteractionData): void {
    // Emit quest interaction event
    this.scene.events.emit('questInteraction', {
      player,
      data
    });
    
    // Play quest sound
    this.scene.sound.play('quest-update');
  }
  
  /**
   * Emit a generic interaction event
   */
  private emitInteractionEvent(player: Player, data: InteractionData): void {
    // Emit generic interaction event that can be listened to by other components
    this.scene.events.emit('interaction', {
      player,
      data
    });
    
    // Notify any registered listeners
    this.interactionListeners.forEach(listener => {
      listener(data);
    });
  }
  
  /**
   * Completes the current interaction
   */
  public completeInteraction(result?: any): void {
    // If there's an active interaction
    if (this.activeInteraction) {
      // Call onComplete if available
      if (this.activeInteraction.onComplete) {
        this.activeInteraction.onComplete(this.player!, result);
      }
      
      // Emit completion event
      this.scene.events.emit('interactionComplete', {
        data: this.activeInteraction,
        result
      });
      
      // Reset active interaction state
      this.activeInteraction = undefined;
      this.isInteractionActive = false;
      
      // Re-enable player control if we have a player reference
      if (this.player) {
        this.player.enableControl();
      }
    }
  }
  
  /**
   * Cancels the current interaction
   */
  public cancelInteraction(): void {
    // If there's an active interaction
    if (this.activeInteraction) {
      // Emit cancellation event
      this.scene.events.emit('interactionCancelled', {
        data: this.activeInteraction
      });
      
      // Reset active interaction state
      this.activeInteraction = undefined;
      this.isInteractionActive = false;
      
      // Re-enable player control if we have a player reference
      if (this.player) {
        this.player.enableControl();
      }
    }
  }
  
  /**
   * Add an interaction event listener
   */
  public addInteractionListener(listener: (data: InteractionData) => void): void {
    this.interactionListeners.push(listener);
  }
  
  /**
   * Remove an interaction event listener
   */
  public removeInteractionListener(listener: (data: InteractionData) => void): void {
    const index = this.interactionListeners.indexOf(listener);
    if (index !== -1) {
      this.interactionListeners.splice(index, 1);
    }
  }
  
  /**
   * Trigger an interaction programmatically
   */
  public triggerInteraction(interactableId: string): void {
    // Find the interactable by ID
    const interactable = this.interactableObjects.get(interactableId);
    
    // Ensure we have a player and the interactable exists
    if (!this.player || !interactable) return;
    
    // Check if interactable is active
    if (!this.isInteractableActive(interactable)) return;
    
    // Trigger the interaction
    if (interactable.onInteract) {
      interactable.onInteract(this.player);
    } else if (interactable.getInteractionData) {
      this.handleInteraction(this.player, interactable.getInteractionData());
    }
  }
  
  /**
   * Show requirement feedback when interaction requirements not met
   */
  private showRequirementFeedback(player: Player, interactable: Phaser.GameObjects.GameObject & Partial<Interactable>): void {
    // Get interaction data
    const data = interactable.getInteractionData ? interactable.getInteractionData() : undefined;
    if (!data) return;
    
    // Check which requirement failed
    let messageText = 'Cannot interact with this.';
    
    // Level requirement
    if (data.requiredLevel && player.getPlayerData().stats.level < data.requiredLevel) {
      messageText = `Requires level ${data.requiredLevel}!`;
      
      // Emit level requirement event
      this.scene.events.emit('requirementNotMet', {
        type: 'level',
        required: data.requiredLevel,
        current: player.getPlayerData().stats.level,
        message: messageText
      });
    }
    // Item requirement
    else if (data.requiredItem) {
      messageText = `Requires ${data.requiredItem}!`;
      
      // Emit item requirement event
      this.scene.events.emit('requirementNotMet', {
        type: 'item',
        required: data.requiredItem,
        message: messageText
      });
    }
    // Quest requirement
    else if (data.requiredQuest) {
      messageText = `Complete quest first!`;
      
      // Emit quest requirement event
      this.scene.events.emit('requirementNotMet', {
        type: 'quest',
        required: data.requiredQuest,
        message: messageText
      });
    }
    
    // Show feedback message above player
    this.showFloatingText(player.x, player.y - 50, messageText, 0xFF6B6B);
    
    // Play error sound
    this.scene.sound.play('error-sound', { volume: 0.3 });
  }
  
  /**
   * Show floating text at a position
   */
  private showFloatingText(x: number, y: number, message: string, color: number = 0xFFFFFF): void {
    // Create text
    const text = this.scene.add.text(x, y, message, {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);
    text.setDepth(200);
    
    // Animate rising and fading
    this.scene.tweens.add({
      targets: text,
      y: y - 30,
      alpha: { from: 1, to: 0 },
      duration: 1500,
      ease: 'Cubic.Out',
      onComplete: () => {
        text.destroy();
      }
    });
  }
  
  /**
   * Update method to be called in scene's update loop
   */
  public update(time: number, delta: number): void {
    // Skip if no player or in the middle of an interaction
    if (!this.player || this.isInteractionActive) return;
    
    // Find closest interactable - this will also update visible indicators
    this.findClosestInteractable(this.player);
    
    // Debug visualization if enabled
    if (this.debugMode) {
      this.drawDebugVisualization();
    }
  }
  
  /**
   * Draw debug visualization
   */
  private drawDebugVisualization(): void {
    // This would draw interaction zones, distances, etc.
    // For simplicity, we're just adding a console message here
    console.log('Debug: Interaction zones would be visualized here');
  }
  
  /**
   * Enable or disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  /**
   * Clean up when scene is shut down
   */
  public destroy(): void {
    // Remove event listeners
    this.scene.events.off('playerInteract', this.handlePlayerInteraction, this);
    
    // Clear interactions
    this.activeInteraction = undefined;
    this.isInteractionActive = false;
    this.interactableObjects.clear();
    
    // Destroy indicators
    this.interactionIndicators.forEach(indicator => {
      indicator.destroy();
    });
    this.interactionIndicators.clear();
    
    // Clear listeners
    this.interactionListeners = [];
  }
}

/**
 * Factory function untuk membuat interaction data
 */
export function createInteraction(
  type: InteractionType,
  options: Partial<Omit<InteractionData, 'type' | 'id'>> = {}
): InteractionData {
  return {
    type,
    id: options.id || `${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    text: options.text || undefined,
    options: options.options || undefined,
    position: options.position,
    onInteract: options.onInteract,
    onComplete: options.onComplete,
    cooldown: options.cooldown,
    active: options.active !== false, // Default to true if not specified
    requiredItem: options.requiredItem,
    requiredLevel: options.requiredLevel,
    requiredQuest: options.requiredQuest,
    icon: options.icon,
    animation: options.animation,
    soundEffect: options.soundEffect,
    customData: options.customData
  };
}

/**
 * Helper function untuk membuat dialog interaksi
 */
export function createDialogInteraction(
  text: string | string[],
  options?: Array<{
    text: string;
    action?: string;
    nextId?: string;
    condition?: string;
    data?: any;
  }>,
  customOptions: Partial<Omit<InteractionData, 'type' | 'id' | 'text' | 'options'>> = {}
): InteractionData {
  return createInteraction(InteractionType.DIALOG, {
    ...customOptions,
    text,
    options
  });
}

/**
 * Helper function untuk membuat challenge interaksi
 */
export function createChallengeInteraction(
  challengeId: string,
  customOptions: Partial<Omit<InteractionData, 'type' | 'id'>> = {}
): InteractionData {
  return createInteraction(InteractionType.CHALLENGE, {
    ...customOptions,
    customData: {
      ...customOptions.customData,
      challengeId
    }
  });
}

/**
 * Helper function untuk membuat sign interaksi
 */
export function createSignInteraction(
  text: string | string[],
  customOptions: Partial<Omit<InteractionData, 'type' | 'id' | 'text'>> = {}
): InteractionData {
  return createInteraction(InteractionType.SIGN, {
    ...customOptions,
    text
  });
}