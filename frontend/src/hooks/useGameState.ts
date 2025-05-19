import { useGameContext } from "@/contexts/GameContext";
import { GameState, Challenge, GameSettings, Player } from "@/types/game";

/**
 * Custom hook for accessing and manipulating game state
 * Provides simplified interface to the GameContext
 */
export function useGameState() {
  const {
    state,
    movePlayer,
    changeArea,
    startChallenge,
    endChallenge,
    addItemToInventory,
    removeItemFromInventory,
    updatePlayerStats,
    updateGameSettings,
    sendChatMessage,
    interactWithNPC,
  } = useGameContext();

  /**
   * Check if the player is within interaction range of coordinates
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param range - Interaction range (default: 50)
   */
  const isInRange = (x: number, y: number, range = 50): boolean => {
    if (!state.player?.position) return false;

    const dx = state.player.position.x - x;
    const dy = state.player.position.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= range;
  };

  /**
   * Get nearby players within a specific range
   * @param range - Distance range (default: 200)
   */
  const getNearbyPlayers = (range = 200) => {
    if (!state.player?.position) return [];

    const { x, y } = state.player.position;
    const nearbyPlayers: any[] = [];

    state.otherPlayers.forEach((player, playerId) => {
      if (player.position) {
        const dx = player.position.x - x;
        const dy = player.position.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= range) {
          nearbyPlayers.push({
            id: playerId,
            ...player,
            distance,
          });
        }
      }
    });

    // Sort by distance
    return nearbyPlayers.sort((a, b) => a.distance - b.distance);
  };

  /**
   * Check if current area has a specific feature (like a shop, npc, etc)
   * @param featureType - Type of feature to check for
   * @param featureId - Optional specific feature ID
   */
  const areaHasFeature = (featureType: string, featureId?: string): boolean => {
    if (!state.currentArea?.features) return false;

    return state.currentArea.features.some(
      (feature) =>
        feature.type === featureType && (!featureId || feature.id === featureId)
    );
  };

  /**
   * Move player in a specific direction by a delta amount
   * @param dx - X delta
   * @param dy - Y delta
   */
  const movePlayerByDelta = (dx: number, dy: number) => {
    if (!state.player?.position) return;

    const { x, y } = state.player.position;
    let direction: string = state.player.direction;

    // Determine direction based on movement
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? "right" : "left";
    } else if (dy !== 0) {
      direction = dy > 0 ? "down" : "up";
    }

    movePlayer(x + dx, y + dy, direction, true);
  };

  /**
   * Toggle a game setting
   * @param setting - Setting to toggle
   */
  const toggleSetting = (setting: keyof GameSettings) => {
    // Only works for boolean settings
    if (typeof state.settings[setting] === "boolean") {
      updateGameSettings({
        [setting]: !state.settings[setting],
      } as Partial<GameState["settings"]>);
    }
  };

  /**
   * Save the current game state
   */
  const saveGameState = async () => {
    try {
      // Save to API endpoint
      const response = await fetch("/api/game/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: state.player.position,
          areaId: state.player.currentAreaId,
          stats: state.player.stats,
          inventory: state.player.inventory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save game state");
      }

      return true;
    } catch (error) {
      console.error("Error saving game state:", error);
      return false;
    }
  };

  // Return all the tools to interact with game state
  return {
    // Original state and methods
    ...state,
    playerPosition: state.player.position,
    playerStats: state.player.stats,
    playerInventory: state.player.inventory,
    allPlayers: state.otherPlayers,
    gameSettings: state.settings,

    // Original actions
    movePlayer,
    changeArea,
    startChallenge,
    endChallenge,
    addItemToInventory,
    removeItemFromInventory,
    updatePlayerStats,
    updateGameSettings,
    sendChatMessage,
    interactWithNPC,

    // Additional helper methods
    isInRange,
    getNearbyPlayers,
    areaHasFeature,
    movePlayerByDelta,
    toggleSetting,
    saveGameState,

    // Computed properties
    hasActiveChallenge: !!state.currentChallenge,
    isConnectedToServer: state.status.isConnected,
    isGameLoading: state.status.isLoading,
    gameEvents: state.events,
    gameError: state.status.error,
  };
}

/**
 * Hook for accessing player-specific state and actions
 */
export function usePlayerState() {
  const {
    state,
    movePlayer,
    updatePlayerStats,
    addItemToInventory,
    removeItemFromInventory,
  } = useGameContext();

  return {
    // Player properties
    position: state.player.position,
    direction: state.player.direction,
    isMoving: state.player.isMoving,
    stats: state.player.stats,
    inventory: state.player.inventory,
    currentAreaId: state.player.currentAreaId,

    // Player actions
    move: movePlayer,
    updateStats: updatePlayerStats,
    addItem: addItemToInventory,
    removeItem: removeItemFromInventory,

    // Computed properties
    level: state.player.stats.level,
    xp: state.player.stats.xp,
    coins: state.player.stats.coins,
    health: state.player.stats.health,
    maxHealth: state.player.stats.maxHealth,

    // Helper methods
    hasItem: (itemId: string) =>
      state.player.inventory.some((item) => item.id === itemId),
    getItemCount: (itemId: string) =>
      state.player.inventory.filter((item) => item.id === itemId).length,
  };
}

export default useGameState;
