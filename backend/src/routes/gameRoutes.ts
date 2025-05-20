import express from "express";
import { authenticateJwt, requireVerified } from "../middleware/auth";
import { requireRole, requirePermission } from "../middleware/rolePermission";
import { validate } from "../middleware/validator";
import {
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
} from "../controllers/gameController";
import { Permission } from "../types/roles";

const router = express.Router();

/**
 * @route GET /api/game/state
 * @desc Get complete player game state
 * @access Private
 */
router.get("/state", authenticateJwt, getGameState);

/**
 * @route GET /api/game/stats
 * @desc Get player stats
 * @access Private
 */
router.get("/stats", authenticateJwt, getPlayerStats);

/**
 * @route GET /api/game/progress
 * @desc Get player game progress
 * @access Private
 */
router.get("/progress", authenticateJwt, getGameProgress);

/**
 * @route POST /api/game/position
 * @desc Save player position
 * @access Private
 */
router.post(
  "/position",
  authenticateJwt,
  validate({
    body: {
      map: "string",
      x: "number",
      y: "number",
      direction: "string?",
    },
  }),
  savePosition
);

/**
 * @route POST /api/game/progress
 * @desc Save game progress
 * @access Private
 */
router.post(
  "/progress",
  authenticateJwt,
  validate({
    body: {
      currentChapter: "number?",
      currentLevel: "number?",
      unlockedZones: "array?",
      completedLevels: "array?",
      savedPositionData: "object?",
    },
  }),
  saveProgress
);

/**
 * @route PATCH /api/game/stats
 * @desc Update player stats
 * @access Private
 */
router.patch(
  "/stats",
  authenticateJwt,
  validate({
    body: {
      level: "number?",
      experience: "number?",
      coins: "number?",
      health: "number?",
      strength: "number?",
      intelligence: "number?",
      agility: "number?",
      playTimeMinutes: "number?",
    },
  }),
  updateStats
);

/**
 * @route POST /api/game/inventory/add
 * @desc Add item to player inventory
 * @access Private
 */
router.post(
  "/inventory/add",
  authenticateJwt,
  validate({
    body: {
      itemId: "string",
      quantity: "number?",
      properties: "object?",
    },
  }),
  addItem
);

/**
 * @route POST /api/game/inventory/remove
 * @desc Remove item from player inventory
 * @access Private
 */
router.post(
  "/inventory/remove",
  authenticateJwt,
  validate({
    body: {
      itemId: "string",
      quantity: "number?",
    },
  }),
  removeItem
);

/**
 * @route POST /api/game/inventory/equip
 * @desc Equip or unequip item
 * @access Private
 */
router.post(
  "/inventory/equip",
  authenticateJwt,
  validate({
    body: {
      itemId: "string",
      equipped: "boolean",
    },
  }),
  equipItem
);

/**
 * @route POST /api/game/achievements/unlock
 * @desc Unlock achievement
 * @access Private
 */
router.post(
  "/achievements/unlock",
  authenticateJwt,
  validate({
    body: {
      achievementId: "string",
      progress: "number?",
    },
  }),
  unlockAchievement
);

/**
 * @route POST /api/game/challenges/complete
 * @desc Complete challenge
 * @access Private
 */
router.post(
  "/challenges/complete",
  authenticateJwt,
  validate({
    body: {
      challengeId: "string",
      score: "number?",
      timeTaken: "number?",
      solutionCode: "string?",
      feedback: "string?",
    },
  }),
  completeChallenge
);

/**
 * @route POST /api/game/events
 * @desc Log game event
 * @access Private
 */
router.post(
  "/events",
  authenticateJwt,
  validate({
    body: {
      type: "string",
      data: "object?",
    },
  }),
  logGameEvent
);

/**
 * @route POST /api/game/reset
 * @desc Reset player game state (admin only)
 * @access Admin
 */
router.post(
  "/reset",
  authenticateJwt,
  requireRole(["admin"]),
  validate({
    body: {
      userId: "string?",
    },
  }),
  resetGameState
);

/**
 * @route POST /api/game/admin/add-item
 * @desc Admin-only route to add item to any player
 * @access Admin
 */
router.post(
  "/admin/add-item",
  authenticateJwt,
  requireRole(["admin"]),
  validate({
    body: {
      userId: "string",
      itemId: "string",
      quantity: "number?",
      properties: "object?",
    },
  }),
  (req, res, next) => {
    // Override the userId in body to use for the target user
    req.body = {
      ...req.body,
      userId: req.body.userId,
    };
    next();
  },
  addItem
);

/**
 * @route POST /api/game/admin/set-stats
 * @desc Admin-only route to set player stats
 * @access Admin
 */
router.post(
  "/admin/set-stats",
  authenticateJwt,
  requireRole(["admin"]),
  validate({
    body: {
      userId: "string",
      level: "number?",
      experience: "number?",
      coins: "number?",
      health: "number?",
      strength: "number?",
      intelligence: "number?",
      agility: "number?",
    },
  }),
  (req, res, next) => {
    // Override the userId in body to use for the target user
    req.body = {
      ...req.body,
      userId: req.body.userId,
    };
    next();
  },
  updateStats
);

export default router;
