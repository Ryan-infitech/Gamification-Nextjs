/**
 * User routes
 * Defines API endpoints for user management
 */
const express = require("express");
const { body, param } = require("express-validator");
const userController = require("../controllers/userController");
const {
  authenticate,
  authorizeRoles,
  optionalAuth,
} = require("../middleware/auth");

const router = express.Router();

/**
 * @route GET /api/users/:userId
 * @desc Get user by ID
 * @access Public (limited) / Private (full profile)
 */
router.get(
  "/:userId",
  optionalAuth, // Use optional auth to determine how much info to return
  param("userId").isUUID().withMessage("Invalid user ID format"),
  userController.getUserById
);

/**
 * @route PATCH /api/users/:userId
 * @desc Update user profile
 * @access Private
 */
router.patch(
  "/:userId",
  authenticate,
  [
    param("userId").isUUID().withMessage("Invalid user ID format"),
    body("displayName")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Display name must be between 2 and 100 characters"),
    body("avatarUrl")
      .optional()
      .isURL()
      .withMessage("Avatar URL must be a valid URL"),
  ],
  userController.updateUserProfile
);

/**
 * @route GET /api/users/:userId/stats
 * @desc Get user player stats
 * @access Private (own) / Public (others)
 */
router.get(
  "/:userId/stats",
  optionalAuth,
  param("userId").isUUID().withMessage("Invalid user ID format"),
  userController.getUserStats
);

/**
 * @route PATCH /api/users/:userId/stats
 * @desc Update user player stats
 * @access Admin only
 */
router.patch(
  "/:userId/stats",
  authenticate,
  authorizeRoles("admin"),
  [
    param("userId").isUUID().withMessage("Invalid user ID format"),
    body("level")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Level must be at least 1"),
    body("xp")
      .optional()
      .isInt({ min: 0 })
      .withMessage("XP cannot be negative"),
    body("coins")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Coins cannot be negative"),
    body("powerLevel")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Power level must be at least 1"),
    body("codingSkill")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Coding skill must be at least 1"),
    body("problemSolving")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Problem solving must be at least 1"),
  ],
  userController.updateUserStats
);

/**
 * @route GET /api/users/:userId/progress
 * @desc Get user game progress
 * @access Private
 */
router.get(
  "/:userId/progress",
  authenticate,
  param("userId").isUUID().withMessage("Invalid user ID format"),
  userController.getUserProgress
);

/**
 * @route GET /api/users/:userId/inventory
 * @desc Get user inventory
 * @access Private
 */
router.get(
  "/:userId/inventory",
  authenticate,
  param("userId").isUUID().withMessage("Invalid user ID format"),
  userController.getUserInventory
);

/**
 * @route GET /api/users/:userId/achievements
 * @desc Get user achievements
 * @access Public
 */
router.get(
  "/:userId/achievements",
  param("userId").isUUID().withMessage("Invalid user ID format"),
  userController.getUserAchievements
);

/**
 * @route GET /api/users/:userId/completed-challenges
 * @desc Get completed challenges for a user
 * @access Public
 */
router.get(
  "/:userId/completed-challenges",
  param("userId").isUUID().withMessage("Invalid user ID format"),
  userController.getUserCompletedChallenges
);

module.exports = router;
