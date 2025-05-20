import express from "express";
import { authenticateJwt, requireVerified } from "../middleware/auth";
import { requireRole, requireSelfOrAdmin } from "../middleware/rolePermission";
import { validate } from "../middleware/validator";
import {
  getCurrentUserProfile,
  updateUserProfile,
  updateUserPreferences,
  updatePlayerStats,
  updateGameProgress,
  getUserById,
  getUsers,
  changePassword,
  getUserActivity,
} from "../controllers/userController";
import {
  profileUpdateSchema,
  userPreferencesSchema,
  playerStatsSchema,
  gameProgressSchema,
  changePasswordSchema,
} from "../utils/validationSchemas";

const router = express.Router();

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get("/me", authenticateJwt, getCurrentUserProfile);

/**
 * @route PATCH /api/users/me
 * @desc Update current user profile
 * @access Private
 */
router.patch(
  "/me",
  authenticateJwt,
  requireVerified,
  validate(profileUpdateSchema),
  updateUserProfile
);

/**
 * @route PATCH /api/users/preferences
 * @desc Update user preferences
 * @access Private
 */
router.patch(
  "/preferences",
  authenticateJwt,
  validate(userPreferencesSchema),
  updateUserPreferences
);

/**
 * @route PATCH /api/users/stats
 * @desc Update player stats
 * @access Private
 */
router.patch(
  "/stats",
  authenticateJwt,
  validate(playerStatsSchema),
  updatePlayerStats
);

/**
 * @route PATCH /api/users/progress
 * @desc Update game progress
 * @access Private
 */
router.patch(
  "/progress",
  authenticateJwt,
  validate(gameProgressSchema),
  updateGameProgress
);

/**
 * @route POST /api/users/change-password
 * @desc Change user password
 * @access Private
 */
router.post(
  "/change-password",
  authenticateJwt,
  requireVerified,
  validate(changePasswordSchema),
  changePassword
);

/**
 * @route GET /api/users/activity
 * @desc Get user activity history
 * @access Private
 */
router.get("/activity", authenticateJwt, getUserActivity);

/**
 * @route GET /api/users
 * @desc Get list of users (with pagination & filtering)
 * @access Admin, Teacher
 */
router.get(
  "/",
  authenticateJwt,
  requireVerified,
  requireRole(["admin", "teacher"]),
  getUsers
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Admin, Teacher can view all, Students can only view themselves
 */
router.get("/:id", authenticateJwt, requireVerified, getUserById);

export default router;
