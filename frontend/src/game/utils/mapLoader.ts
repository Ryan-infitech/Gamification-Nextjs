import Phaser from 'phaser';
import NPC from '../objects/NPC';
import { NPCDefinition, GameChallengeDefinition, MapArea } from '@/types/phaser';

/**
 * Interface untuk object layer yang di-load dari Tiled
 */
interface TiledObjectLayer {
  name: string;
  objects: any[];
  type: string;
}

/**
 * Interface untuk map data
 */
interface MapData {
  tilesets: string[];
  npcs: NPCDefinition[];
  challenges: GameChallengeDefinition[];
  areas: MapArea[];
  portals: any[];
  items: any[];
  triggers: any[];
}

/**
 * Class untuk loading dan processing map dari Tiled
 */
export default class MapLoader {
  private scene: Phaser.Scene;
  private map?: Phaser.Tilemaps.Tilemap;
  private tilesetNames: string[] = [];
  private tilesets: Phaser.Tilemaps.Tileset[] = [];
  private layers: { [key: string]: Phaser.Tilemaps.TilemapLayer } = {};
  private npcs: NPC[] = [];
  private debug: boolean = false;
  
  /**
   * Constructor
   */
  constructor(scene: Phaser.Scene, debug: boolean = false) {
    this.scene = scene;
    this.debug = debug;
  }
  
  /**
   * Load map dari key Tiled JSON
   */
  public loadMap(
    mapKey: string, 
    tilesetKey: string = 'main-tileset'
  ): Phaser.Tilemaps.Tilemap {
    // Create tilemap from key
    this.map = this.scene.make.tilemap({ key: mapKey });
    
    // Add tileset
    this.tilesetNames = [tilesetKey];
    const mainTileset = this.map.addTilesetImage(tilesetKey, tilesetKey);
    
    if (!mainTileset) {
      throw new Error(`Could not load tileset: ${tilesetKey}`);
    }
    
    this.tilesets = [mainTileset];
    
    return this.map;
  }
  
  /**
   * Add tileset ke map
   */
  public addTileset(tilesetName: string, tilesetKey: string): Phaser.Tilemaps.Tileset | null {
    if (!this.map) {
      console.error('Map not loaded yet. Call loadMap first.');
      return null;
    }
    
    // Check if already added
    if (this.tilesetNames.includes(tilesetName)) {
      const index = this.tilesetNames.indexOf(tilesetName);
      return this.tilesets[index];
    }
    
    // Add new tileset
    const tileset = this.map.addTilesetImage(tilesetName, tilesetKey);
    
    if (!tileset) {
      console.error(`Could not load tileset: ${tilesetName}`);
      return null;
    }
    
    this.tilesetNames.push(tilesetName);
    this.tilesets.push(tileset);
    
    return tileset;
  }
  
  /**
   * Create layers dari map
   */
  public createLayers(): { [key: string]: Phaser.Tilemaps.TilemapLayer } {
    if (!this.map) {
      console.error('Map not loaded yet. Call loadMap first.');
      return {};
    }
    
    // Get all the layers we need to create
    const layerNames = this.map.layers.map(layer => layer.name);
    
    // Create each layer
    for (const name of layerNames) {
      // Skip object layers
      if (name.startsWith('objects') || name === 'npcs' || name === 'challenges' || name === 'areas') {
        continue;
      }
      
      // Create layer
      const layer = this.map.createLayer(name, this.tilesets, 0, 0);
      
      if (!layer) {
        console.warn(`Could not create layer: ${name}`);
        continue;
      }
      
      // Set collision for layers that should have collision
      if (name === 'obstacles' || name === 'buildings' || name === 'walls') {
        layer.setCollisionByProperty({ collides: true });
        
        // Show debug collision if debug mode is enabled
        if (this.debug && this.scene.physics.world.drawDebug) {
          const debugGraphics = this.scene.add.graphics().setAlpha(0.7);
          layer.renderDebug(debugGraphics, {
            tileColor: null,
            collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
            faceColor: new Phaser.Display.Color(40, 39, 37, 255)
          });
        }
      }
      
      // Set depth based on layer type
      if (name === 'ground') {
        layer.setDepth(0);
      } else if (name === 'decoration') {
        layer.setDepth(2);
      } else if (name === 'buildings' || name === 'roof') {
        layer.setDepth(10);
      } else {
        layer.setDepth(5);
      }
      
      // Store the layer
      this.layers[name] = layer;
    }
    
    return this.layers;
  }
  
  /**
   * Create NPCs from object layer
   */
  public createNPCs(behaviorCreator?: (npc: NPCDefinition) => 'static' | 'wander' | 'patrol' | 'follow'): NPC[] {
    if (!this.map) {
      console.error('Map not loaded yet. Call loadMap first.');
      return [];
    }
    
    // Clear any existing NPCs
    this.npcs.forEach(npc => npc.destroy());
    this.npcs = [];
    
    // Get the NPC object layer
    const npcLayer = this.map.objects.find(layer => layer.name === 'npcs');
    
    if (!npcLayer) {
      console.warn('No NPCs layer found in map');
      return [];
    }
    
    // Process each NPC
    for (const npcObj of npcLayer.objects) {
      try {
        // Extract NPC data from Tiled object
        const npc: NPCDefinition = {
          id: npcObj.id.toString(),
          name: npcObj.name || `NPC ${npcObj.id}`,
          sprite: npcObj.properties?.find((p: any) => p.name === 'sprite')?.value || 'npcs',
          position: {
            x: npcObj.x,
            y: npcObj.y
          },
          dialog: JSON.parse(npcObj.properties?.find((p: any) => p.name === 'dialog')?.value || '[]'),
          questGiver: npcObj.properties?.find((p: any) => p.name === 'questGiver')?.value || false,
          merchant: npcObj.properties?.find((p: any) => p.name === 'merchant')?.value || false,
          teacherRole: npcObj.properties?.find((p: any) => p.name === 'teacherRole')?.value || ''
        };
        
        // Determine behavior pattern
        let behavior: 'static' | 'wander' | 'patrol' | 'follow' = 'static';
        
        if (behaviorCreator) {
          behavior = behaviorCreator(npc);
        } else {
          // Default behavior based on properties
          const behaviorProp = npcObj.properties?.find((p: any) => p.name === 'behavior')?.value;
          if (behaviorProp && ['static', 'wander', 'patrol', 'follow'].includes(behaviorProp)) {
            behavior = behaviorProp as any;
          }
        }
        
        // Create NPC instance
        const npcInstance = new NPC(this.scene, npc, behavior);
        
        // Add to list
        this.npcs.push(npcInstance);
        
        // Handle patrol points if needed
        if (behavior === 'patrol') {
          const patrolPointsString = npcObj.properties?.find((p: any) => p.name === 'patrolPoints')?.value;
          if (patrolPointsString) {
            try {
              const patrolPoints = JSON.parse(patrolPointsString);
              npcInstance.setPatrolPoints(patrolPoints);
            } catch (e) {
              console.warn(`Invalid patrol points format for NPC ${npc.id}`);
            }
          }
        }
      } catch (e) {
        console.error(`Error creating NPC from object: ${npcObj.id}`, e);
      }
    }
    
    return this.npcs;
  }
  
  /**
   * Extract all map data
   */
  public extractMapData(): MapData {
    if (!this.map) {
      console.error('Map not loaded yet. Call loadMap first.');
      return {
        tilesets: [],
        npcs: [],
        challenges: [],
        areas: [],
        portals: [],
        items: [],
        triggers: []
      };
    }
    
    // Results object
    const mapData: MapData = {
      tilesets: this.tilesetNames,
      npcs: [],
      challenges: [],
      areas: [],
      portals: [],
      items: [],
      triggers: []
    };
    
    // Process each object layer
    for (const layer of this.map.objects) {
      switch (layer.name) {
        case 'npcs':
          mapData.npcs = this.extractNPCs(layer);
          break;
        case 'challenges':
          mapData.challenges = this.extractChallenges(layer);
          break;
        case 'areas':
          mapData.areas = this.extractAreas(layer);
          break;
        case 'portals':
          mapData.portals = this.extractPortals(layer);
          break;
        case 'items':
          mapData.items = this.extractItems(layer);
          break;
        case 'triggers':
          mapData.triggers = this.extractTriggers(layer);
          break;
      }
    }
    
    return mapData;
  }
  
  /**
   * Extract NPCs from layer
   */
  private extractNPCs(layer: TiledObjectLayer): NPCDefinition[] {
    const npcs: NPCDefinition[] = [];
    
    for (const npcObj of layer.objects) {
      try {
        // Create NPC definition from Tiled object
        const npc: NPCDefinition = {
          id: npcObj.id.toString(),
          name: npcObj.name || `NPC ${npcObj.id}`,
          sprite: npcObj.properties?.find((p: any) => p.name === 'sprite')?.value || 'npcs',
          position: {
            x: npcObj.x,
            y: npcObj.y
          },
          dialog: JSON.parse(npcObj.properties?.find((p: any) => p.name === 'dialog')?.value || '[]'),
          questGiver: npcObj.properties?.find((p: any) => p.name === 'questGiver')?.value || false,
          merchant: npcObj.properties?.find((p: any) => p.name === 'merchant')?.value || false,
          teacherRole: npcObj.properties?.find((p: any) => p.name === 'teacherRole')?.value || ''
        };
        
        npcs.push(npc);
      } catch (e) {
        console.error(`Error extracting NPC data: ${npcObj.id}`, e);
      }
    }
    
    return npcs;
  }
  
  /**
   * Extract challenges from layer
   */
  private extractChallenges(layer: TiledObjectLayer): GameChallengeDefinition[] {
    const challenges: GameChallengeDefinition[] = [];
    
    for (const challengeObj of layer.objects) {
      try {
        // Create challenge definition from Tiled object
        const challenge: GameChallengeDefinition = {
          id: challengeObj.id.toString(),
          name: challengeObj.name || `Challenge ${challengeObj.id}`,
          position: {
            x: challengeObj.x,
            y: challengeObj.y
          },
          type: challengeObj.properties?.find((p: any) => p.name === 'type')?.value || 'code',
          difficulty: challengeObj.properties?.find((p: any) => p.name === 'difficulty')?.value || 'easy',
          xpReward: parseInt(challengeObj.properties?.find((p: any) => p.name === 'xpReward')?.value || '50'),
          coinReward: parseInt(challengeObj.properties?.find((p: any) => p.name === 'coinReward')?.value || '10'),
          challengeId: challengeObj.properties?.find((p: any) => p.name === 'challengeId')?.value || ''
        };
        
        challenges.push(challenge);
      } catch (e) {
        console.error(`Error extracting challenge data: ${challengeObj.id}`, e);
      }
    }
    
    return challenges;
  }
  
  /**
   * Extract areas from layer
   */
  private extractAreas(layer: TiledObjectLayer): MapArea[] {
    const areas: MapArea[] = [];
    
    for (const areaObj of layer.objects) {
      try {
        // Create area definition from Tiled object
        const area: MapArea = {
          name: areaObj.name || `Area ${areaObj.id}`,
          bounds: {
            x: areaObj.x,
            y: areaObj.y,
            width: areaObj.width,
            height: areaObj.height
          },
          requiredLevel: areaObj.properties?.find((p: any) => p.name === 'requiredLevel')?.value
        };
        
        areas.push(area);
      } catch (e) {
        console.error(`Error extracting area data: ${areaObj.id}`, e);
      }
    }
    
    return areas;
  }
  
  /**
   * Extract portals from layer
   */
  private extractPortals(layer: TiledObjectLayer): any[] {
    const portals: any[] = [];
    
    for (const portalObj of layer.objects) {
      try {
        // Create portal definition from Tiled object
        const portal = {
          id: portalObj.id.toString(),
          name: portalObj.name || `Portal ${portalObj.id}`,
          position: {
            x: portalObj.x,
            y: portalObj.y
          },
          width: portalObj.width,
          height: portalObj.height,
          targetMap: portalObj.properties?.find((p: any) => p.name === 'targetMap')?.value,
          targetX: portalObj.properties?.find((p: any) => p.name === 'targetX')?.value,
          targetY: portalObj.properties?.find((p: any) => p.name === 'targetY')?.value,
          requiredLevel: portalObj.properties?.find((p: any) => p.name === 'requiredLevel')?.value
        };
        
        portals.push(portal);
      } catch (e) {
        console.error(`Error extracting portal data: ${portalObj.id}`, e);
      }
    }
    
    return portals;
  }
  
  /**
   * Extract items from layer
   */
  private extractItems(layer: TiledObjectLayer): any[] {
    const items: any[] = [];
    
    for (const itemObj of layer.objects) {
      try {
        // Create item definition from Tiled object
        const item = {
          id: itemObj.id.toString(),
          name: itemObj.name || `Item ${itemObj.id}`,
          position: {
            x: itemObj.x,
            y: itemObj.y
          },
          itemId: itemObj.properties?.find((p: any) => p.name === 'itemId')?.value,
          quantity: itemObj.properties?.find((p: any) => p.name === 'quantity')?.value || 1,
          respawn: itemObj.properties?.find((p: any) => p.name === 'respawn')?.value || false
        };
        
        items.push(item);
      } catch (e) {
        console.error(`Error extracting item data: ${itemObj.id}`, e);
      }
    }
    
    return items;
  }
  
  /**
   * Extract triggers from layer
   */
  private extractTriggers(layer: TiledObjectLayer): any[] {
    const triggers: any[] = [];
    
    for (const triggerObj of layer.objects) {
      try {
        // Create trigger definition from Tiled object
        const trigger = {
          id: triggerObj.id.toString(),
          name: triggerObj.name || `Trigger ${triggerObj.id}`,
          position: {
            x: triggerObj.x,
            y: triggerObj.y
          },
          width: triggerObj.width,
          height: triggerObj.height,
          type: triggerObj.properties?.find((p: any) => p.name === 'type')?.value || 'event',
          eventName: triggerObj.properties?.find((p: any) => p.name === 'eventName')?.value,
          eventData: triggerObj.properties?.find((p: any) => p.name === 'eventData')?.value,
          once: triggerObj.properties?.find((p: any) => p.name === 'once')?.value || false
        };
        
        triggers.push(trigger);
      } catch (e) {
        console.error(`Error extracting trigger data: ${triggerObj.id}`, e);
      }
    }
    
    return triggers;
  }
  
  /**
   * Get layer by name
   */
  public getLayer(name: string): Phaser.Tilemaps.TilemapLayer | undefined {
    return this.layers[name];
  }
  
  /**
   * Get all NPCs
   */
  public getNPCs(): NPC[] {
    return this.npcs;
  }
  
  /**
   * Get a specific NPC by ID
   */
  public getNPC(id: string): NPC | undefined {
    return this.npcs.find(npc => npc.getData('id') === id);
  }
  
  /**
   * Get the map instance
   */
  public getMap(): Phaser.Tilemaps.Tilemap | undefined {
    return this.map;
  }
  
  /**
   * Destroy the map and related resources
   */
  public destroy(): void {
    // Destroy NPCs
    this.npcs.forEach(npc => npc.destroy());
    this.npcs = [];
    
    // Clear layers
    for (const key in this.layers) {
      if (this.layers[key]) {
        this.layers[key].destroy();
      }
    }
    this.layers = {};
    
    // Clear map reference
    this.map = undefined;
    this.tilesets = [];
    this.tilesetNames = [];
  }
}
