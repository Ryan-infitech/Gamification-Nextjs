/**
 * Game routes
 * Defines API endpoints for game functionality
 */
const express = require("express");
const { body, param, query } = require("express-validator");
const gameController = require("../controllers/gameController");
const { authenticate, optionalAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route GET /api/game/areas
 * @desc Get all game areas/worlds
 * @access Public
 */
router.get("/areas", gameController.getGameAreas);

/**
 * @route GET /api/game/areas/:areaId
 * @desc Get specific game area by ID
 * @access Public
 */
router.get(
  "/areas/:areaId",
  param("areaId").isUUID().withMessage("Invalid area ID"),
  gameController.getGameAreaById
);

/**
 * @route GET /api/game/areas/:areaId/challenges
 * @desc Get challenges for a game area
 * @access Public
 */
router.get(
  "/areas/:areaId/challenges",
  param("areaId").isUUID().withMessage("Invalid area ID"),
  gameController.getAreaChallenges
);

/**
 * @route GET /api/game/challenges/:challengeId
 * @desc Get a specific challenge by ID
 * @access Public
 */
router.get(
  "/challenges/:challengeId",
  param("challengeId").isUUID().withMessage("Invalid challenge ID"),
  gameController.getChallengeById
);

/**
 * @route PATCH /api/game/position
 * @desc Update player position in game
 * @access Private
 */
router.patch(
  "/position",
  authenticate,
  [
    body("areaId").isUUID().withMessage("Invalid area ID"),
    body("positionX").isFloat().withMessage("Position X must be a number"),
    body("positionY").isFloat().withMessage("Position Y must be a number"),
    body("checkpoint")
      .optional()
      .isString()
      .withMessage("Checkpoint must be a string"),
  ],
  gameController.updatePlayerPosition
);

/**
 * @route POST /api/game/challenges/:challengeId/start
 * @desc Start a challenge
 * @access Private
 */
router.post(
  "/challenges/:challengeId/start",
  authenticate,
  param("challengeId").isUUID().withMessage("Invalid challenge ID"),
  gameController.startChallenge
);

/**
 * @route POST /api/game/challenges/:challengeId/submit
 * @desc Submit a challenge solution
 * @access Private
 */
router.post(
  "/challenges/:challengeId/submit",
  authenticate,
  [
    param("challengeId").isUUID().withMessage("Invalid challenge ID"),
    body("solution").isString().withMessage("Solution is required"),
    body("timeTaken")
      .isInt({ min: 0 })
      .withMessage("Time taken must be a positive integer"),
  ],
  gameController.submitChallenge
);

/**
 * @route GET /api/game/items
 * @desc Get available game items
 * @access Public
 */
router.get("/items", gameController.getGameItems);

/**
 * @route POST /api/game/items/:itemId/purchase
 * @desc Purchase an item
 * @access Private
 */
router.post(
  "/items/:itemId/purchase",
  authenticate,
  param("itemId").isUUID().withMessage("Invalid item ID"),
  gameController.purchaseItem
);

/**
 * @route POST /api/game/inventory/:inventoryItemId/use
 * @desc Use an item from inventory
 * @access Private
 */
router.post(
  "/inventory/:inventoryItemId/use",
  authenticate,
  param("inventoryItemId").isUUID().withMessage("Invalid inventory item ID"),
  gameController.useItem
);

/**
 * @route GET /api/game/leaderboard
 * @desc Get player leaderboard
 * @access Public
 */
router.get(
  "/leaderboard",
  [
    query("category")
      .optional()
      .isIn(["xp", "level", "challenges", "achievements"])
      .withMessage("Invalid category"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  gameController.getLeaderboard
);

module.exports = router;
