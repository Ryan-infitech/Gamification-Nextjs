import { Request, Response } from "express";
import { gameProgressService } from "../services/gameProgressService";
import { AuthRequest } from "../types/auth";
import {
  SavePositionRequest,
  SaveProgressRequest,
  UpdateStatsRequest,
  AddItemRequest,
  RemoveItemRequest,
  EquipItemRequest,
  UnlockAchievementRequest,
  CompleteChallengRequest,
  GameEvent,
  GameEventType,
} from "../types/game";
import { asyncHandler } from "../middleware/errorHandler";
import { ValidationError, AuthorizationError } from "../types/error";
import logger from "../config/logger";

/**
 * Get player game state
 * @route GET /api/game/state
 */
export const getGameState = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;

    // Get complete game state from service
    const gameState = await gameProgressService.getPlayerGameState(userId);

    res.status(200).json({
      success: true,
      message: "Game state retrieved successfully",
      data: gameState,
    });
  }
);

/**
 * Get player stats
 * @route GET /api/game/stats
 */
export const getPlayerStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;

    // Get player stats from service
    const stats = await gameProgressService.getPlayerStats(userId);

    res.status(200).json({
      success: true,
      message: "Player stats retrieved successfully",
      data: { stats },
    });
  }
);

/**
 * Get player progress
 * @route GET /api/game/progress
 */
export const getGameProgress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;

    // Get game progress from service
    const progress = await gameProgressService.getGameProgress(userId);

    res.status(200).json({
      success: true,
      message: "Game progress retrieved successfully",
      data: { progress },
    });
  }
);

/**
 * Save player position
 * @route POST /api/game/position
 */
export const savePosition = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;
    const { map, x, y, direction } = req.body;

    // Validate required fields
    if (!map || x === undefined || y === undefined) {
      throw new ValidationError("Map, x, and y coordinates are required");
    }

    // Create position request
    const positionRequest: SavePositionRequest = {
      userId,
      map,
      x,
      y,
      direction,
    };

    // Save position using service
    const updatedStats = await gameProgressService.savePosition(
      positionRequest
    );

    // Log the event - in production we might want to log only significant movements
    logger.debug("Player position updated", {
      userId,
      map,
      x,
      y,
      direction,
    });

    res.status(200).json({
      success: true,
      message: "Position saved successfully",
      data: { stats: updatedStats },
    });
  }
);

/**
 * Save game progress
 * @route POST /api/game/progress
 */
export const saveProgress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;
    const {
      currentChapter,
      currentLevel,
      unlockedZones,
      completedLevels,
      savedPositionData,
    } = req.body;

    // Create progress request with optional fields
    const progressRequest: SaveProgressRequest = {
      userId,
      currentChapter,
      currentLevel,
      unlockedZones,
      completedLevels,
      savedPositionData,
    };

    // Save progress using service
    const updatedProgress = await gameProgressService.saveProgress(
      progressRequest
    );

    logger.info("Game progress saved", {
      userId,
      currentChapter,
      currentLevel,
      unlockedZones: unlockedZones?.length,
      completedLevels: completedLevels?.length,
    });

    res.status(200).json({
      success: true,
      message: "Progress saved successfully",
      data: { progress: updatedProgress },
    });
  }
);

/**
 * Update player stats
 * @route PATCH /api/game/stats
 */
export const updateStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;
    const {
      level,
      experience,
      coins,
      health,
      strength,
      intelligence,
      agility,
      playTimeMinutes,
    } = req.body;

    // Create stats update request with optional fields
    const statsRequest: UpdateStatsRequest = {
      userId,
      level,
      experience,
      coins,
      health,
      strength,
      intelligence,
      agility,
      playTimeMinutes,
    };

    // Update stats using service
    const result = await gameProgressService.updateStats(statsRequest);

    // Special handling for level up
    if (result.levelUp) {
      logger.info("Player leveled up", {
        userId,
        oldLevel: result.levelUp.oldLevel,
        newLevel: result.levelUp.newLevel,
      });

      res.status(200).json({
        success: true,
        message: `Level up! You are now level ${result.levelUp.newLevel}`,
        data: { stats: result.stats, levelUp: result.levelUp },
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Stats updated successfully",
        data: { stats: result.stats },
      });
    }
  }
);

/**
 * Add item to inventory
 * @route POST /api/game/inventory/add
 */
export const addItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AuthorizationError("User authentication required");
  }

  const userId = req.user.id;
  const { itemId, quantity, properties } = req.body;

  // Validate required fields
  if (!itemId) {
    throw new ValidationError("Item ID is required");
  }

  // Create add item request
  const itemRequest: AddItemRequest = {
    userId,
    itemId,
    quantity,
    properties,
  };

  // Add item using service
  const item = await gameProgressService.addItem(itemRequest);

  logger.info("Item added to inventory", { userId, itemId, quantity });

  res.status(200).json({
    success: true,
    message: `Added ${quantity || 1}x ${itemId} to inventory`,
    data: { item },
  });
});

/**
 * Remove item from inventory
 * @route POST /api/game/inventory/remove
 */
export const removeItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;
    const { itemId, quantity } = req.body;

    // Validate required fields
    if (!itemId) {
      throw new ValidationError("Item ID is required");
    }

    // Create remove item request
    const itemRequest: RemoveItemRequest = {
      userId,
      itemId,
      quantity,
    };

    // Remove item using service
    const result = await gameProgressService.removeItem(itemRequest);

    logger.info("Item removed from inventory", {
      userId,
      itemId,
      quantity,
      remaining: result.remainingQuantity,
    });

    res.status(200).json({
      success: true,
      message: `Removed ${quantity || 1}x ${itemId} from inventory`,
      data: {
        success: result.success,
        remainingQuantity: result.remainingQuantity,
      },
    });
  }
);

/**
 * Equip or unequip item
 * @route POST /api/game/inventory/equip
 */
export const equipItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;
    const { itemId, equipped } = req.body;

    // Validate required fields
    if (!itemId || equipped === undefined) {
      throw new ValidationError("Item ID and equipped status are required");
    }

    // Create equip item request
    const equipRequest: EquipItemRequest = {
      userId,
      itemId,
      equipped,
    };

    // Equip/unequip item using service
    const item = await gameProgressService.equipItem(equipRequest);

    logger.info("Item equip status changed", { userId, itemId, equipped });

    res.status(200).json({
      success: true,
      message: equipped ? `Equipped ${itemId}` : `Unequipped ${itemId}`,
      data: { item },
    });
  }
);

/**
 * Unlock achievement
 * @route POST /api/game/achievements/unlock
 */
export const unlockAchievement = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;
    const { achievementId, progress } = req.body;

    // Validate required field
    if (!achievementId) {
      throw new ValidationError("Achievement ID is required");
    }

    // Create achievement request
    const achievementRequest: UnlockAchievementRequest = {
      userId,
      achievementId,
      progress,
    };

    // Unlock achievement using service
    const achievement = await gameProgressService.unlockAchievement(
      achievementRequest
    );

    // Different messages based on progress
    const isCompleted = achievement.progress >= 100;
    const message = isCompleted
      ? `Achievement unlocked: ${achievementId}`
      : `Progress updated for achievement: ${achievementId}`;

    logger.info("Achievement progress updated", {
      userId,
      achievementId,
      progress: achievement.progress,
      isCompleted,
    });

    res.status(200).json({
      success: true,
      message,
      data: {
        achievement,
        isCompleted,
      },
    });
  }
);

/**
 * Complete challenge
 * @route POST /api/game/challenges/complete
 */
export const completeChallenge = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;
    const { challengeId, score, timeTaken, solutionCode, feedback } = req.body;

    // Validate required field
    if (!challengeId) {
      throw new ValidationError("Challenge ID is required");
    }

    // Create challenge completion request
    const challengeRequest: CompleteChallengRequest = {
      userId,
      challengeId,
      score,
      timeTaken,
      solutionCode,
      feedback,
    };

    // Complete challenge using service
    const challenge = await gameProgressService.completeChallenge(
      challengeRequest
    );

    logger.info("Challenge completed", {
      userId,
      challengeId,
      score,
      timeTaken,
    });

    res.status(200).json({
      success: true,
      message: `Challenge completed: ${challengeId}`,
      data: { challenge },
    });
  }
);

/**
 * Log game event
 * @route POST /api/game/events
 */
export const logGameEvent = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    const userId = req.user.id;
    const { type, data } = req.body;

    // Validate required fields
    if (!type || !Object.values(GameEventType).includes(type)) {
      throw new ValidationError("Valid event type is required");
    }

    // Create game event object
    const gameEvent: GameEvent = {
      type,
      userId,
      data: data || {},
      timestamp: new Date().toISOString(),
    };

    // In a production app, we would store this in a events/logs table
    // For now, we'll just log it
    logger.info("Game event", { gameEvent });

    res.status(200).json({
      success: true,
      message: "Event logged successfully",
    });
  }
);

/**
 * Reset player game state (for admin or debugging)
 * @route POST /api/game/reset
 */
export const resetGameState = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("User authentication required");
    }

    // For safety, this should be restricted to admin or have additional verification
    if (req.user.role !== "admin") {
      throw new AuthorizationError(
        "Admin privileges required for this operation"
      );
    }

    const userId = req.body.userId || req.user.id;

    // Reset player game state using service
    const result = await gameProgressService.resetPlayerGameState(userId);

    logger.info("Game state reset", {
      adminId: req.user.id,
      targetUserId: userId,
    });

    res.status(200).json({
      success: result.success,
      message: "Game state reset successfully",
    });
  }
);

export default {
  getGameState,
  getPlayerStats,
  getGameProgress,
  savePosition,
  saveProgress,
  updateStats,
  addItem,
  removeItem,
  equipItem,
  unlockAchievement,
  completeChallenge,
  logGameEvent,
  resetGameState,
};
