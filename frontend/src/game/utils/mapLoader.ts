import Phaser from "phaser";
import { MapConfig } from "../config";
import { TiledLayerType, TiledObject } from "@/types/phaser";

/**
 * MapLoader utility for loading and processing Tiled maps in Phaser
 */
export class MapLoader {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Preload a map and its associated tilesets
   * @param mapConfig - The map configuration
   */
  preload(mapConfig: MapConfig): void {
    // Load the tilemap JSON file
    this.scene.load.tilemapTiledJSON(mapConfig.key, mapConfig.path);

    // Load all tilesets specified in the map config
    mapConfig.tileset.forEach((tileset) => {
      const key = tileset.name.replace(/\s+/g, "_").toLowerCase();
      this.scene.load.image(key, tileset.path);
    });
  }

  /**
   * Create a map from a loaded tilemap
   * @param key - The key for the loaded tilemap
   * @returns The created tilemap or null if creation failed
   */
  create(key: string): Phaser.Tilemaps.Tilemap | null {
    try {
      // Create the tilemap
      const map = this.scene.make.tilemap({ key });

      // Return the created map
      return map;
    } catch (error) {
      console.error(`Failed to create map with key "${key}":`, error);
      return null;
    }
  }

  /**
   * Initialize a map with its tilesets
   * @param map - The tilemap to initialize
   * @param tilesets - Array of tileset configurations
   * @returns Array of added tileset objects
   */
  initializeTilesets(
    map: Phaser.Tilemaps.Tilemap,
    tilesets: { name: string; path: string }[]
  ): Phaser.Tilemaps.Tileset[] {
    const addedTilesets: Phaser.Tilemaps.Tileset[] = [];

    tilesets.forEach((tilesetConfig) => {
      const key = tilesetConfig.name.replace(/\s+/g, "_").toLowerCase();
      const tileset = map.addTilesetImage(tilesetConfig.name, key);

      if (tileset) {
        addedTilesets.push(tileset);
      } else {
        console.warn(
          `Failed to add tileset "${tilesetConfig.name}" with key "${key}"`
        );
      }
    });

    return addedTilesets;
  }

  /**
   * Create map layers from a tilemap
   * @param map - The tilemap to create layers from
   * @param tilesets - Array of tilesets for the layers
   * @returns Object containing layer types mapped to their created layers
   */
  createLayers(
    map: Phaser.Tilemaps.Tilemap,
    tilesets: Phaser.Tilemaps.Tileset[]
  ): Record<string, Phaser.Tilemaps.TilemapLayer[]> {
    const layers: Record<string, Phaser.Tilemaps.TilemapLayer[]> = {
      ground: [],
      terrain: [],
      object: [],
      collision: [],
      above: [],
      decoration: [],
    };

    // Process all layers in the map
    map.layers.forEach((layerData, index) => {
      if (layerData.type !== "tilelayer") return;

      const layerName = layerData.name.toLowerCase();
      const layer = map.createLayer(index, tilesets, 0, 0);

      if (!layer) return;

      // Determine the layer category based on naming conventions
      if (layerName.includes("ground") || layerName.includes("base")) {
        layers.ground.push(layer);
        layer.setDepth(0);
      } else if (layerName.includes("terrain")) {
        layers.terrain.push(layer);
        layer.setDepth(10);
      } else if (
        layerName.includes("object") ||
        layerName.includes("furniture")
      ) {
        layers.object.push(layer);
        layer.setDepth(20);
      } else if (
        layerName.includes("collision") ||
        layerName.includes("obstacle") ||
        layerName.includes("wall")
      ) {
        layers.collision.push(layer);
        layer.setCollisionByProperty({ collides: true });
        layer.setVisible(false); // Hide collision layers in production
      } else if (layerName.includes("above") || layerName.includes("roof")) {
        layers.above.push(layer);
        layer.setDepth(40);
      } else if (
        layerName.includes("decoration") ||
        layerName.includes("deco")
      ) {
        layers.decoration.push(layer);
        layer.setDepth(30);
      } else {
        // Default case for unnamed layers
        layers.ground.push(layer);
        layer.setDepth(5);
      }
    });

    return layers;
  }

  /**
   * Extract objects from specific object layers in the map
   * @param map - The tilemap to extract objects from
   * @param layerName - Name of the object layer to extract from (optional)
   * @returns Array of extracted Tiled objects
   */
  getObjectsFromLayer(
    map: Phaser.Tilemaps.Tilemap,
    layerName?: string
  ): TiledObject[] {
    const objects: TiledObject[] = [];

    // If a specific layer is requested, extract only from that layer
    if (layerName) {
      const objectLayer = map.getObjectLayer(layerName);
      if (objectLayer && objectLayer.objects) {
        return objectLayer.objects as TiledObject[];
      }
      return [];
    }

    // Otherwise, extract from all object layers
    map.objects.forEach((objectLayer) => {
      if (objectLayer.objects) {
        objects.push(...(objectLayer.objects as TiledObject[]));
      }
    });

    return objects;
  }

  /**
   * Create physics sprites from object layer
   * @param map - The tilemap containing the objects
   * @param layerName - The object layer name
   * @param texture - The texture key to use for the sprites
   * @param scene - The scene to add the sprites to
   * @returns Map of object names to their sprite instances
   */
  createObjectsFromLayer(
    map: Phaser.Tilemaps.Tilemap,
    layerName: string,
    texture: string,
    scene: Phaser.Scene = this.scene
  ): Map<string, Phaser.Physics.Arcade.Sprite> {
    const objectMap = new Map<string, Phaser.Physics.Arcade.Sprite>();
    const objects = this.getObjectsFromLayer(map, layerName);

    objects.forEach((object) => {
      if (object.x === undefined || object.y === undefined) return;

      // Create a sprite for this object
      const sprite = scene.physics.add.sprite(object.x, object.y, texture);

      // Set size and properties based on Tiled object
      if (object.width) sprite.displayWidth = object.width;
      if (object.height) sprite.displayHeight = object.height;

      // Set sprite properties from object properties
      if (object.properties) {
        object.properties.forEach((prop) => {
          (sprite as any)[prop.name] = prop.value;
        });
      }

      // Use name as key if available, otherwise use a generated ID
      const key = object.name || `obj_${object.id}`;
      objectMap.set(key, sprite);
    });

    return objectMap;
  }

  /**
   * Sets up map collision with a player character
   * @param map - The tilemap to set up collision for
   * @param layers - The layers to collide with
   * @param player - The player sprite
   */
  setupCollision(
    map: Phaser.Tilemaps.Tilemap,
    layers: Phaser.Tilemaps.TilemapLayer[],
    player: Phaser.Physics.Arcade.Sprite
  ): void {
    // Add collision between player and layers
    this.scene.physics.add.collider(player, layers);

    // Set world bounds based on map dimensions
    this.scene.physics.world.bounds.width = map.widthInPixels;
    this.scene.physics.world.bounds.height = map.heightInPixels;

    // Make player collide with bounds
    player.setCollideWorldBounds(true);
  }

  /**
   * Add custom properties to the map for game logic
   * @param map - The tilemap to process
   */
  processMapProperties(map: Phaser.Tilemaps.Tilemap): void {
    // Extract any custom properties defined at the map level
    if (map.properties && Array.isArray(map.properties)) {
      map.properties.forEach((prop) => {
        // Store custom properties on the map object
        (map as any)[prop.name] = prop.value;
      });
    }
  }
}

// Export a factory function for creating map loaders
export function createMapLoader(scene: Phaser.Scene): MapLoader {
  return new MapLoader(scene);
}
