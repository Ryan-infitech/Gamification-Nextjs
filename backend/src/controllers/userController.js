/**
 * User controller
 * Handles CRUD operations for users and their related data
 */
const { validationResult } = require("express-validator");
const { executeDbOperation } = require("../config/database");
const { ApiError } = require("../middleware/errorHandler");

/**
 * Get user by ID
 * @route GET /api/users/:userId
 */
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check if the user is requesting their own profile or has admin rights
    const isOwnProfile = req.user && req.user.id === userId;
    const isAdmin =
      req.user && req.user.roles && req.user.roles.includes("admin");

    if (!isOwnProfile && !isAdmin) {
      // If not own profile or admin, return limited public info
      const result = await executeDbOperation(async (client) => {
        return await client
          .from("users")
          .select("id, username, display_name, avatar_url")
          .eq("id", userId)
          .single();
      });

      if (result.error || !result.data) {
        return next(ApiError.notFound("User not found"));
      }

      return res.status(200).json({
        status: "success",
        data: {
          user: result.data,
        },
      });
    }

    // Full profile for own user or admin
    const result = await executeDbOperation(async (client) => {
      return await client
        .from("users")
        .select(
          `
          *,
          player_stats(*),
          game_progress(*),
          user_achievements(*, achievements(*))
        `
        )
        .eq("id", userId)
        .single();
    });

    if (result.error || !result.data) {
      return next(ApiError.notFound("User not found"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        user: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PATCH /api/users/:userId
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { displayName, avatarUrl } = req.body;

    // Can only update own profile unless admin
    if (req.user.id !== userId && !req.user.roles?.includes("admin")) {
      return next(ApiError.forbidden("You can only update your own profile"));
    }

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest("Validation error", errors.array()));
    }

    // Prepare update data
    const updateData = {};
    if (displayName !== undefined) updateData.display_name = displayName;
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
    updateData.updated_at = new Date();

    // Update user
    const result = await executeDbOperation(async (client) => {
      return await client
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select("*")
        .single();
    });

    if (result.error) {
      return next(ApiError.internal("Failed to update user profile"));
    }

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user player stats
 * @route GET /api/users/:userId/stats
 */
const getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await executeDbOperation(async (client) => {
      return await client
        .from("player_stats")
        .select("*")
        .eq("user_id", userId)
        .single();
    });

    if (result.error || !result.data) {
      return next(ApiError.notFound("Player stats not found"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        stats: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user player stats
 * @route PATCH /api/users/:userId/stats
 * @access Admin or server-side only
 */
const updateUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { level, xp, coins, powerLevel, codingSkill, problemSolving } =
      req.body;

    // This operation should be restricted to admin or server-side calls
    if (!req.user.roles?.includes("admin")) {
      return next(
        ApiError.forbidden("Only administrators can update player stats")
      );
    }

    // Prepare update data
    const updateData = {};
    if (level !== undefined) updateData.level = level;
    if (xp !== undefined) updateData.xp = xp;
    if (coins !== undefined) updateData.coins = coins;
    if (powerLevel !== undefined) updateData.power_level = powerLevel;
    if (codingSkill !== undefined) updateData.coding_skill = codingSkill;
    if (problemSolving !== undefined)
      updateData.problem_solving = problemSolving;
    updateData.updated_at = new Date();

    // Update stats
    const result = await executeDbOperation(async (client) => {
      return await client
        .from("player_stats")
        .update(updateData)
        .eq("user_id", userId)
        .select("*")
        .single();
    });

    if (result.error) {
      return next(ApiError.internal("Failed to update player stats"));
    }

    return res.status(200).json({
      status: "success",
      message: "Player stats updated successfully",
      data: {
        stats: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user game progress
 * @route GET /api/users/:userId/progress
 */
const getUserProgress = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Can only view own progress unless admin
    if (req.user.id !== userId && !req.user.roles?.includes("admin")) {
      return next(
        ApiError.forbidden("You can only view your own game progress")
      );
    }

    const result = await executeDbOperation(async (client) => {
      return await client
        .from("game_progress")
        .select("*, game_areas(*)")
        .eq("user_id", userId)
        .single();
    });

    if (result.error || !result.data) {
      return next(ApiError.notFound("Game progress not found"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        progress: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user inventory
 * @route GET /api/users/:userId/inventory
 */
const getUserInventory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Can only view own inventory unless admin
    if (req.user.id !== userId && !req.user.roles?.includes("admin")) {
      return next(ApiError.forbidden("You can only view your own inventory"));
    }

    const result = await executeDbOperation(async (client) => {
      return await client
        .from("user_inventory")
        .select("*, items(*)")
        .eq("user_id", userId);
    });

    if (result.error) {
      return next(ApiError.internal("Failed to fetch inventory"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        inventory: result.data || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user achievements
 * @route GET /api/users/:userId/achievements
 */
const getUserAchievements = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await executeDbOperation(async (client) => {
      return await client
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", userId);
    });

    if (result.error) {
      return next(ApiError.internal("Failed to fetch achievements"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        achievements: result.data || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get completed challenges for a user
 * @route GET /api/users/:userId/completed-challenges
 */
const getUserCompletedChallenges = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await executeDbOperation(async (client) => {
      return await client
        .from("completed_challenges")
        .select("*, challenges(*)")
        .eq("user_id", userId);
    });

    if (result.error) {
      return next(ApiError.internal("Failed to fetch completed challenges"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        completedChallenges: result.data || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserById,
  updateUserProfile,
  getUserStats,
  updateUserStats,
  getUserProgress,
  getUserInventory,
  getUserAchievements,
  getUserCompletedChallenges,
};
