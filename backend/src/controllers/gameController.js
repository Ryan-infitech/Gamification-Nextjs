/**
 * Game controller
 * Handles game state management and game-related operations
 */
const { validationResult } = require("express-validator");
const { executeDbOperation } = require("../config/database");
const gameProgressService = require("../services/gameProgressService");
const { ApiError } = require("../middleware/errorHandler");

/**
 * Get all game areas/worlds
 * @route GET /api/game/areas
 */
const getGameAreas = async (req, res, next) => {
  try {
    const result = await executeDbOperation(async (client) => {
      return await client
        .from("game_areas")
        .select("*")
        .order("difficulty_level", { ascending: true });
    });

    if (result.error) {
      return next(ApiError.internal("Failed to fetch game areas"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        areas: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific game area by ID
 * @route GET /api/game/areas/:areaId
 */
const getGameAreaById = async (req, res, next) => {
  try {
    const { areaId } = req.params;

    const result = await executeDbOperation(async (client) => {
      return await client
        .from("game_areas")
        .select("*")
        .eq("id", areaId)
        .single();
    });

    if (result.error || !result.data) {
      return next(ApiError.notFound("Game area not found"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        area: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get challenges for a game area
 * @route GET /api/game/areas/:areaId/challenges
 */
const getAreaChallenges = async (req, res, next) => {
  try {
    const { areaId } = req.params;

    const result = await executeDbOperation(async (client) => {
      return await client
        .from("challenges")
        .select("*")
        .eq("area_id", areaId)
        .order("difficulty", { ascending: true });
    });

    if (result.error) {
      return next(ApiError.internal("Failed to fetch challenges"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        challenges: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific challenge by ID
 * @route GET /api/game/challenges/:challengeId
 */
const getChallengeById = async (req, res, next) => {
  try {
    const { challengeId } = req.params;

    const result = await executeDbOperation(async (client) => {
      return await client
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
    });

    if (result.error || !result.data) {
      return next(ApiError.notFound("Challenge not found"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        challenge: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update player position in game
 * @route PATCH /api/game/position
 */
const updatePlayerPosition = async (req, res, next) => {
  try {
    const { areaId, positionX, positionY, checkpoint } = req.body;
    const userId = req.user.id;

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest("Validation error", errors.array()));
    }

    // Update player position
    const result = await gameProgressService.updatePlayerPosition(
      userId,
      areaId,
      positionX,
      positionY,
      checkpoint
    );

    if (!result.success) {
      return next(
        ApiError.internal(result.message || "Failed to update position")
      );
    }

    return res.status(200).json({
      status: "success",
      message: "Position updated successfully",
      data: {
        progress: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start a challenge
 * @route POST /api/game/challenges/:challengeId/start
 */
const startChallenge = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    // Check if challenge exists
    const challengeResult = await executeDbOperation(async (client) => {
      return await client
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
    });

    if (challengeResult.error || !challengeResult.data) {
      return next(ApiError.notFound("Challenge not found"));
    }

    // Check if player meets requirements (could be expanded)
    const playerStatsResult = await executeDbOperation(async (client) => {
      return await client
        .from("player_stats")
        .select("*")
        .eq("user_id", userId)
        .single();
    });

    if (playerStatsResult.error || !playerStatsResult.data) {
      return next(ApiError.notFound("Player stats not found"));
    }

    // Track challenge attempt
    await gameProgressService.trackChallengeAttempt(userId, challengeId);

    return res.status(200).json({
      status: "success",
      message: "Challenge started",
      data: {
        challenge: challengeResult.data,
        startTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a challenge solution
 * @route POST /api/game/challenges/:challengeId/submit
 */
const submitChallenge = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const { solution, timeTaken } = req.body;
    const userId = req.user.id;

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest("Validation error", errors.array()));
    }

    // Process challenge completion
    const result = await gameProgressService.completeChallenge(
      userId,
      challengeId,
      solution,
      timeTaken
    );

    if (!result.success) {
      return next(
        ApiError.badRequest(result.message || "Failed to submit challenge")
      );
    }

    return res.status(200).json({
      status: "success",
      message: "Challenge completed successfully",
      data: {
        ...result.data,
        achievements: result.achievements || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available game items (e.g., shop items)
 * @route GET /api/game/items
 */
const getGameItems = async (req, res, next) => {
  try {
    const result = await executeDbOperation(async (client) => {
      return await client.from("items").select("*");
    });

    if (result.error) {
      return next(ApiError.internal("Failed to fetch items"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        items: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Purchase an item
 * @route POST /api/game/items/:itemId/purchase
 */
const purchaseItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Purchase item using the progress service
    const result = await gameProgressService.purchaseItem(userId, itemId);

    if (!result.success) {
      return next(
        ApiError.badRequest(result.message || "Failed to purchase item")
      );
    }

    return res.status(200).json({
      status: "success",
      message: "Item purchased successfully",
      data: {
        transaction: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Use an item
 * @route POST /api/game/inventory/:inventoryItemId/use
 */
const useItem = async (req, res, next) => {
  try {
    const { inventoryItemId } = req.params;
    const userId = req.user.id;

    // Use the item through the progress service
    const result = await gameProgressService.useItem(userId, inventoryItemId);

    if (!result.success) {
      return next(ApiError.badRequest(result.message || "Failed to use item"));
    }

    return res.status(200).json({
      status: "success",
      message: "Item used successfully",
      data: {
        effects: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get player leaderboard
 * @route GET /api/game/leaderboard
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { category = "xp", limit = 10 } = req.query;

    // Validate category
    const validCategories = ["xp", "level", "challenges", "achievements"];
    if (!validCategories.includes(category)) {
      return next(ApiError.badRequest("Invalid leaderboard category"));
    }

    // Get leaderboard based on category
    let result;
    if (category === "challenges") {
      // For challenges completed
      result = await executeDbOperation(async (client) => {
        return await client.rpc("get_challenge_leaderboard", {
          limit_count: limit,
        });
      });
    } else if (category === "achievements") {
      // For achievements earned
      result = await executeDbOperation(async (client) => {
        return await client.rpc("get_achievement_leaderboard", {
          limit_count: limit,
        });
      });
    } else {
      // For XP or level
      const orderField = category === "xp" ? "xp" : "level";
      result = await executeDbOperation(async (client) => {
        return await client
          .from("player_stats")
          .select(
            "id, user_id, level, xp, users(username, display_name, avatar_url)"
          )
          .order(orderField, { ascending: false })
          .limit(limit);
      });
    }

    if (result.error) {
      return next(ApiError.internal("Failed to fetch leaderboard"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        category,
        leaderboard: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGameAreas,
  getGameAreaById,
  getAreaChallenges,
  getChallengeById,
  updatePlayerPosition,
  startChallenge,
  submitChallenge,
  getGameItems,
  purchaseItem,
  useItem,
  getLeaderboard,
};
