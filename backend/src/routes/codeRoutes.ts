import express from "express";
import { authenticateJwt, requireVerified } from "../middleware/auth";
import { validate } from "../middleware/validator";
import { requireRole, requirePermission } from "../middleware/rolePermission";
import {
  executeUserCode,
  submitChallengeSolution,
  getChallengeDetails,
  getUserSubmissions,
  getRecommendedChallenges,
  getUserProgress,
} from "../controllers/codeEvaluationController";
import { Permission } from "../types/roles";

const router = express.Router();

/**
 * @route POST /api/code/execute
 * @desc Execute code without comparing to a challenge solution
 * @access Private
 */
router.post(
  "/execute",
  authenticateJwt,
  validate({
    body: {
      code: "string",
      language: "string",
      input: "string?",
    },
  }),
  executeUserCode
);

/**
 * @route POST /api/code/challenges/:challengeId/submit
 * @desc Submit a solution for a specific challenge
 * @access Private
 */
router.post(
  "/challenges/:challengeId/submit",
  authenticateJwt,
  requireVerified,
  validate({
    params: {
      challengeId: "string",
    },
    body: {
      code: "string",
      language: "string",
    },
  }),
  submitChallengeSolution
);

/**
 * @route GET /api/code/challenges/:challengeId
 * @desc Get challenge details with test cases
 * @access Private
 */
router.get(
  "/challenges/:challengeId",
  authenticateJwt,
  validate({
    params: {
      challengeId: "string",
    },
  }),
  getChallengeDetails
);

/**
 * @route GET /api/code/submissions
 * @desc Get user's challenge submissions history
 * @access Private
 */
router.get(
  "/submissions",
  authenticateJwt,
  validate({
    query: {
      limit: "number?",
      offset: "number?",
      challengeId: "string?",
    },
  }),
  getUserSubmissions
);

/**
 * @route GET /api/code/challenges/recommended
 * @desc Get popular or recommended challenges
 * @access Private
 */
router.get(
  "/challenges/recommended",
  authenticateJwt,
  validate({
    query: {
      limit: "number?",
      category: "string?",
      difficulty: "string?",
    },
  }),
  getRecommendedChallenges
);

/**
 * @route GET /api/code/progress
 * @desc Get user progress across challenge categories
 * @access Private
 */
router.get("/progress", authenticateJwt, getUserProgress);

/**
 * Admin routes for challenges management
 */

/**
 * @route POST /api/code/admin/challenges
 * @desc Create a new challenge (admin only)
 * @access Admin
 */
router.post(
  "/admin/challenges",
  authenticateJwt,
  requireVerified,
  requireRole(["admin", "teacher"]),
  validate({
    body: {
      title: "string",
      description: "string",
      difficulty: "string",
      category: "string",
      instructions: "string",
      codeTemplate: "object",
      testCases: "array",
      hints: "array",
      solution: "object",
      timeLimit: "number?",
      memoryLimit: "number?",
      xpReward: "number",
      coinReward: "number",
    },
  }),
  async (req, res) => {
    // This endpoint will be implemented in admin controllers
    res.status(501).json({
      success: false,
      message: "Not implemented yet",
    });
  }
);

/**
 * @route PUT /api/code/admin/challenges/:challengeId
 * @desc Update an existing challenge (admin only)
 * @access Admin
 */
router.put(
  "/admin/challenges/:challengeId",
  authenticateJwt,
  requireVerified,
  requireRole(["admin", "teacher"]),
  validate({
    params: {
      challengeId: "string",
    },
    body: {
      title: "string?",
      description: "string?",
      difficulty: "string?",
      category: "string?",
      instructions: "string?",
      codeTemplate: "object?",
      testCases: "array?",
      hints: "array?",
      solution: "object?",
      timeLimit: "number?",
      memoryLimit: "number?",
      xpReward: "number?",
      coinReward: "number?",
      isPublished: "boolean?",
    },
  }),
  async (req, res) => {
    // This endpoint will be implemented in admin controllers
    res.status(501).json({
      success: false,
      message: "Not implemented yet",
    });
  }
);

/**
 * @route DELETE /api/code/admin/challenges/:challengeId
 * @desc Delete a challenge (admin only)
 * @access Admin
 */
router.delete(
  "/admin/challenges/:challengeId",
  authenticateJwt,
  requireVerified,
  requireRole(["admin"]),
  validate({
    params: {
      challengeId: "string",
    },
  }),
  async (req, res) => {
    // This endpoint will be implemented in admin controllers
    res.status(501).json({
      success: false,
      message: "Not implemented yet",
    });
  }
);

export default router;
