import { supabase } from "../config/database";
import {
  PlayerStats,
  GameProgress,
  SavePositionRequest,
  SaveProgressRequest,
  UpdateStatsRequest,
  AddItemRequest,
  RemoveItemRequest,
  EquipItemRequest,
  UnlockAchievementRequest,
  CompleteChallengRequest,
  PlayerGameState,
  GameErrorType,
  InventoryItem,
  Achievement,
  CompletedChallenge,
} from "../types/game";
import logger from "../config/logger";
import {
  ResourceNotFoundError,
  ConflictError,
  ValidationError,
} from "../types/error";
import {
  calculateExperienceForLevel,
  calculateLevelForExperience,
} from "../utils/gameCalculations";
import { notificationService } from "./notificationService";

/**
 * Service untuk pengelolaan progress game player
 */
export class GameProgressService {
  /**
   * Mendapatkan stats player
   * @param userId - ID user
   * @returns Player stats
   */
  async getPlayerStats(userId: string): Promise<PlayerStats> {
    const { data, error } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      logger.error("Error fetching player stats", { error, userId });
      throw new ResourceNotFoundError("Player stats not found", {
        code: GameErrorType.PROGRESS_NOT_FOUND,
      });
    }

    return data as PlayerStats;
  }

  /**
   * Mendapatkan game progress player
   * @param userId - ID user
   * @returns Game progress
   */
  async getGameProgress(userId: string): Promise<GameProgress> {
    const { data, error } = await supabase
      .from("game_progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      logger.error("Error fetching game progress", { error, userId });
      throw new ResourceNotFoundError("Game progress not found", {
        code: GameErrorType.PROGRESS_NOT_FOUND,
      });
    }

    return data as GameProgress;
  }

  /**
   * Mendapatkan keseluruhan game state player
   * @param userId - ID user
   * @returns Complete player game state
   */
  async getPlayerGameState(userId: string): Promise<PlayerGameState> {
    try {
      // Get player stats
      const stats = await this.getPlayerStats(userId);

      // Get game progress
      const progress = await this.getGameProgress(userId);

      // Get inventory items
      const { data: inventory, error: inventoryError } = await supabase
        .from("items_inventory")
        .select("*")
        .eq("user_id", userId);

      if (inventoryError) {
        logger.error("Error fetching player inventory", {
          error: inventoryError,
          userId,
        });
        throw new Error("Failed to fetch player inventory");
      }

      // Get achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId);

      if (achievementsError) {
        logger.error("Error fetching player achievements", {
          error: achievementsError,
          userId,
        });
        throw new Error("Failed to fetch player achievements");
      }

      // Get completed challenges
      const { data: completedChallenges, error: challengesError } =
        await supabase
          .from("completed_challenges")
          .select("*")
          .eq("user_id", userId);

      if (challengesError) {
        logger.error("Error fetching completed challenges", {
          error: challengesError,
          userId,
        });
        throw new Error("Failed to fetch completed challenges");
      }

      // Determine player position
      const position = {
        map: stats.current_map,
        x: stats.last_position_x,
        y: stats.last_position_y,
        direction: "down" as const, // Default direction
      };

      // Return complete game state
      return {
        stats,
        progress,
        position,
        inventory: inventory as InventoryItem[],
        achievements: achievements as Achievement[],
        completedChallenges: completedChallenges as CompletedChallenge[],
      };
    } catch (error) {
      logger.error("Error getting player game state", { error, userId });
      throw error;
    }
  }

  /**
   * Save player position in game
   * @param data - Position data to save
   * @returns Updated player stats
   */
  async savePosition(data: SavePositionRequest): Promise<PlayerStats> {
    try {
      const { userId, map, x, y, direction } = data;

      // Update player stats with new position
      const { data: updatedStats, error } = await supabase
        .from("player_stats")
        .update({
          current_map: map,
          last_position_x: x,
          last_position_y: y,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        logger.error("Error saving player position", {
          error,
          userId,
          map,
          x,
          y,
        });
        throw new Error("Failed to save player position");
      }

      return updatedStats as PlayerStats;
    } catch (error) {
      logger.error("Error in savePosition", { error, data });
      throw error;
    }
  }

  /**
   * Save game progress
   * @param data - Progress data to save
   * @returns Updated game progress
   */
  async saveProgress(data: SaveProgressRequest): Promise<GameProgress> {
    try {
      const { userId, ...progressData } = data;

      // Create update object with only provided values
      const updateData: Record<string, any> = {};

      if (progressData.currentChapter !== undefined) {
        updateData.current_chapter = progressData.currentChapter;
      }

      if (progressData.currentLevel !== undefined) {
        updateData.current_level = progressData.currentLevel;
      }

      if (progressData.unlockedZones !== undefined) {
        updateData.unlocked_zones = progressData.unlockedZones;
      }

      if (progressData.completedLevels !== undefined) {
        updateData.completed_levels = progressData.completedLevels;
      }

      if (progressData.savedPositionData !== undefined) {
        updateData.saved_position_data = progressData.savedPositionData;
      }

      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();

      // Update game progress
      const { data: updatedProgress, error } = await supabase
        .from("game_progress")
        .update(updateData)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        logger.error("Error saving game progress", {
          error,
          userId,
          progressData,
        });
        throw new Error("Failed to save game progress");
      }

      return updatedProgress as GameProgress;
    } catch (error) {
      logger.error("Error in saveProgress", { error, data });
      throw error;
    }
  }

  /**
   * Update player stats
   * @param data - Stats to update
   * @returns Updated player stats and level up info if applicable
   */
  async updateStats(data: UpdateStatsRequest): Promise<{
    stats: PlayerStats;
    levelUp?: { oldLevel: number; newLevel: number };
  }> {
    try {
      const { userId, ...statsData } = data;

      // First get current stats
      const { data: currentStats, error: fetchError } = await supabase
        .from("player_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError || !currentStats) {
        logger.error("Error fetching current player stats", {
          error: fetchError,
          userId,
        });
        throw new ResourceNotFoundError("Player stats not found", {
          code: GameErrorType.PROGRESS_NOT_FOUND,
        });
      }

      // Create update object with only provided values
      const updateData: Record<string, any> = {};
      let levelUp: { oldLevel: number; newLevel: number } | undefined;

      // Handle experience update and level calculation
      if (statsData.experience !== undefined) {
        updateData.experience = statsData.experience;

        // Calculate level based on total experience if not explicitly provided
        if (statsData.level === undefined) {
          const currentLevel = currentStats.level;
          const newLevel = calculateLevelForExperience(statsData.experience);

          if (newLevel > currentLevel) {
            updateData.level = newLevel;
            levelUp = { oldLevel: currentLevel, newLevel };
          }
        }
      }

      // Add other stats if provided
      if (statsData.level !== undefined) updateData.level = statsData.level;
      if (statsData.coins !== undefined) updateData.coins = statsData.coins;
      if (statsData.health !== undefined) updateData.health = statsData.health;
      if (statsData.strength !== undefined)
        updateData.strength = statsData.strength;
      if (statsData.intelligence !== undefined)
        updateData.intelligence = statsData.intelligence;
      if (statsData.agility !== undefined)
        updateData.agility = statsData.agility;

      // Update playtime if provided
      if (statsData.playTimeMinutes !== undefined) {
        updateData.playtime_minutes =
          currentStats.playtime_minutes + statsData.playTimeMinutes;
      }

      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();

      // Update stats in database
      const { data: updatedStats, error } = await supabase
        .from("player_stats")
        .update(updateData)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        logger.error("Error updating player stats", {
          error,
          userId,
          statsData,
        });
        throw new Error("Failed to update player stats");
      }

      // If level up occurred, send notification
      if (levelUp) {
        const { newLevel } = levelUp;

        // Save achievement for reaching certain levels
        if ([5, 10, 20, 30, 50, 100].includes(newLevel)) {
          await this.unlockAchievement({
            userId,
            achievementId: `level_${newLevel}`,
          });
        }

        // Send notification
        await notificationService.sendNotification({
          user_id: userId,
          type: "level_up",
          title: "Level Up!",
          message: `Congratulations! You've reached level ${newLevel}!`,
          data: { oldLevel: levelUp.oldLevel, newLevel },
        });
      }

      return { stats: updatedStats as PlayerStats, levelUp };
    } catch (error) {
      logger.error("Error in updateStats", { error, data });
      throw error;
    }
  }

  /**
   * Add item to player's inventory
   * @param data - Item data to add
   * @returns Updated inventory item
   */
  async addItem(data: AddItemRequest): Promise<InventoryItem> {
    try {
      const { userId, itemId, quantity = 1, properties = {} } = data;

      // Check if item already exists in inventory
      const { data: existingItem, error: checkError } = await supabase
        .from("items_inventory")
        .select("*")
        .eq("user_id", userId)
        .eq("item_id", itemId)
        .single();

      if (!checkError && existingItem) {
        // Item exists, update quantity
        const newQuantity = existingItem.quantity + quantity;

        const { data: updatedItem, error } = await supabase
          .from("items_inventory")
          .update({
            quantity: newQuantity,
            properties: { ...existingItem.properties, ...properties },
            acquired_at: new Date().toISOString(),
          })
          .eq("id", existingItem.id)
          .select("*")
          .single();

        if (error) {
          logger.error("Error updating inventory item", {
            error,
            userId,
            itemId,
          });
          throw new Error("Failed to update inventory item");
        }

        // Notify item acquisition
        await notificationService.sendNotification({
          user_id: userId,
          type: "item_collect",
          title: "Item Acquired",
          message: `You received ${quantity}x ${itemId}`,
          data: { itemId, quantity, total: newQuantity },
        });

        return updatedItem as InventoryItem;
      } else {
        // Item doesn't exist, insert new one
        const { data: newItem, error } = await supabase
          .from("items_inventory")
          .insert({
            user_id: userId,
            item_id: itemId,
            quantity,
            equipped: false,
            properties,
            acquired_at: new Date().toISOString(),
          })
          .select("*")
          .single();

        if (error) {
          logger.error("Error adding inventory item", {
            error,
            userId,
            itemId,
          });
          throw new Error("Failed to add inventory item");
        }

        // Notify item acquisition
        await notificationService.sendNotification({
          user_id: userId,
          type: "item_collect",
          title: "Item Acquired",
          message: `You received ${quantity}x ${itemId}`,
          data: { itemId, quantity },
        });

        return newItem as InventoryItem;
      }
    } catch (error) {
      logger.error("Error in addItem", { error, data });
      throw error;
    }
  }

  /**
   * Remove item from player's inventory
   * @param data - Item data to remove
   * @returns Success status
   */
  async removeItem(
    data: RemoveItemRequest
  ): Promise<{ success: boolean; remainingQuantity: number }> {
    try {
      const { userId, itemId, quantity = 1 } = data;

      // Check if item exists in inventory
      const { data: existingItem, error: checkError } = await supabase
        .from("items_inventory")
        .select("*")
        .eq("user_id", userId)
        .eq("item_id", itemId)
        .single();

      if (checkError || !existingItem) {
        throw new ResourceNotFoundError("Item not found in inventory", {
          code: GameErrorType.ITEM_NOT_FOUND,
        });
      }

      if (existingItem.quantity < quantity) {
        throw new ValidationError("Not enough items to remove", {
          code: GameErrorType.INSUFFICIENT_RESOURCES,
        });
      }

      const newQuantity = existingItem.quantity - quantity;

      if (newQuantity <= 0) {
        // Remove item completely
        const { error } = await supabase
          .from("items_inventory")
          .delete()
          .eq("id", existingItem.id);

        if (error) {
          logger.error("Error removing inventory item", {
            error,
            userId,
            itemId,
          });
          throw new Error("Failed to remove inventory item");
        }

        return { success: true, remainingQuantity: 0 };
      } else {
        // Update quantity
        const { data: updatedItem, error } = await supabase
          .from("items_inventory")
          .update({
            quantity: newQuantity,
          })
          .eq("id", existingItem.id)
          .select("*")
          .single();

        if (error) {
          logger.error("Error updating inventory item quantity", {
            error,
            userId,
            itemId,
          });
          throw new Error("Failed to update inventory item quantity");
        }

        return { success: true, remainingQuantity: newQuantity };
      }
    } catch (error) {
      logger.error("Error in removeItem", { error, data });
      throw error;
    }
  }

  /**
   * Equip or unequip an item
   * @param data - Equip item data
   * @returns Updated inventory item
   */
  async equipItem(data: EquipItemRequest): Promise<InventoryItem> {
    try {
      const { userId, itemId, equipped } = data;

      // Check if item exists in inventory
      const { data: existingItem, error: checkError } = await supabase
        .from("items_inventory")
        .select("*")
        .eq("user_id", userId)
        .eq("item_id", itemId)
        .single();

      if (checkError || !existingItem) {
        throw new ResourceNotFoundError("Item not found in inventory", {
          code: GameErrorType.ITEM_NOT_FOUND,
        });
      }

      // Update equipped status
      const { data: updatedItem, error } = await supabase
        .from("items_inventory")
        .update({
          equipped,
        })
        .eq("id", existingItem.id)
        .select("*")
        .single();

      if (error) {
        logger.error("Error equipping/unequipping item", {
          error,
          userId,
          itemId,
        });
        throw new Error("Failed to equip/unequip item");
      }

      return updatedItem as InventoryItem;
    } catch (error) {
      logger.error("Error in equipItem", { error, data });
      throw error;
    }
  }

  /**
   * Unlock achievement for a player
   * @param data - Achievement data
   * @returns Unlocked achievement
   */
  async unlockAchievement(
    data: UnlockAchievementRequest
  ): Promise<Achievement> {
    try {
      const { userId, achievementId, progress = 100 } = data;

      // Check if achievement already unlocked
      const { data: existingAchievement, error: checkError } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .eq("achievement_id", achievementId)
        .single();

      if (!checkError && existingAchievement) {
        // Achievement already exists, update progress if needed
        if (existingAchievement.progress < progress) {
          const { data: updatedAchievement, error } = await supabase
            .from("achievements")
            .update({
              progress,
              unlocked_at:
                progress >= 100
                  ? new Date().toISOString()
                  : existingAchievement.unlocked_at,
            })
            .eq("id", existingAchievement.id)
            .select("*")
            .single();

          if (error) {
            logger.error("Error updating achievement progress", {
              error,
              userId,
              achievementId,
            });
            throw new Error("Failed to update achievement progress");
          }

          // Send notification only if achievement was completed
          if (existingAchievement.progress < 100 && progress >= 100) {
            await notificationService.sendNotification({
              user_id: userId,
              type: "achievement_unlock",
              title: "Achievement Unlocked!",
              message: `You've unlocked the achievement: "${achievementId}"`,
              data: { achievementId },
            });
          }

          return updatedAchievement as Achievement;
        }

        return existingAchievement as Achievement;
      } else {
        // Achievement doesn't exist, create new one
        const { data: newAchievement, error } = await supabase
          .from("achievements")
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            progress,
            unlocked_at: new Date().toISOString(),
          })
          .select("*")
          .single();

        if (error) {
          logger.error("Error unlocking achievement", {
            error,
            userId,
            achievementId,
          });
          throw new Error("Failed to unlock achievement");
        }

        // Send notification
        if (progress >= 100) {
          await notificationService.sendNotification({
            user_id: userId,
            type: "achievement_unlock",
            title: "Achievement Unlocked!",
            message: `You've unlocked the achievement: "${achievementId}"`,
            data: { achievementId },
          });
        }

        return newAchievement as Achievement;
      }
    } catch (error) {
      logger.error("Error in unlockAchievement", { error, data });
      throw error;
    }
  }

  /**
   * Mark a challenge as completed
   * @param data - Challenge completion data
   * @returns Completed challenge
   */
  async completeChallenge(
    data: CompleteChallengRequest
  ): Promise<CompletedChallenge> {
    try {
      const { userId, challengeId, score, timeTaken, solutionCode, feedback } =
        data;

      // Check if challenge already completed
      const { data: existingChallenge, error: checkError } = await supabase
        .from("completed_challenges")
        .select("*")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .single();

      if (!checkError && existingChallenge) {
        // Challenge already completed, update if better score
        if (!score || existingChallenge.score >= score) {
          // Existing score is better or same
          return existingChallenge as CompletedChallenge;
        }

        // Update with better score
        const { data: updatedChallenge, error } = await supabase
          .from("completed_challenges")
          .update({
            score,
            time_taken: timeTaken,
            solution_code: solutionCode,
            feedback,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existingChallenge.id)
          .select("*")
          .single();

        if (error) {
          logger.error("Error updating completed challenge", {
            error,
            userId,
            challengeId,
          });
          throw new Error("Failed to update completed challenge");
        }

        return updatedChallenge as CompletedChallenge;
      } else {
        // Challenge not previously completed, mark as completed
        const { data: newCompletion, error } = await supabase
          .from("completed_challenges")
          .insert({
            user_id: userId,
            challenge_id: challengeId,
            score,
            time_taken: timeTaken,
            solution_code: solutionCode,
            feedback,
            completed_at: new Date().toISOString(),
          })
          .select("*")
          .single();

        if (error) {
          logger.error("Error completing challenge", {
            error,
            userId,
            challengeId,
          });
          throw new Error("Failed to complete challenge");
        }

        // Send notification
        await notificationService.sendNotification({
          user_id: userId,
          type: "challenge_complete",
          title: "Challenge Completed!",
          message: `You've completed the challenge: "${challengeId}"`,
          data: { challengeId, score },
        });

        return newCompletion as CompletedChallenge;
      }
    } catch (error) {
      logger.error("Error in completeChallenge", { error, data });
      throw error;
    }
  }

  /**
   * Reset player game state (for testing or admin purposes)
   * @param userId - User ID
   * @returns Success status
   */
  async resetPlayerGameState(userId: string): Promise<{ success: boolean }> {
    try {
      // Reset player stats
      await supabase
        .from("player_stats")
        .update({
          level: 1,
          experience: 0,
          coins: 0,
          health: 100,
          strength: 10,
          intelligence: 10,
          agility: 10,
          current_map: "tutorial-area",
          last_position_x: 0,
          last_position_y: 0,
          playtime_minutes: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      // Reset game progress
      await supabase
        .from("game_progress")
        .update({
          current_chapter: 1,
          current_level: 1,
          unlocked_zones: [],
          completed_levels: [],
          saved_position_data: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      // Delete inventory items
      await supabase.from("items_inventory").delete().eq("user_id", userId);

      // Delete achievements
      await supabase.from("achievements").delete().eq("user_id", userId);

      // Delete completed challenges
      await supabase
        .from("completed_challenges")
        .delete()
        .eq("user_id", userId);

      logger.info("Player game state reset successfully", { userId });

      return { success: true };
    } catch (error) {
      logger.error("Error in resetPlayerGameState", { error, userId });
      throw error;
    }
  }
}

// Export instance untuk digunakan di aplikasi
export const gameProgressService = new GameProgressService();
