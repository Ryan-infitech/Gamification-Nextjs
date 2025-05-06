/**
 * Code evaluation routes
 * Defines API endpoints for code execution and evaluation
 */
const express = require("express");
const { body, param } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const codeEvaluationController = require("../controllers/codeEvaluationController");

const router = express.Router();

/**
 * @route GET /api/code/challenge/:challengeId/test-cases
 * @desc Get test cases for a challenge
 * @access Private
 */
router.get(
  "/challenge/:challengeId/test-cases",
  authenticate,
  param("challengeId").isUUID().withMessage("Invalid challenge ID"),
  codeEvaluationController.getTestCases
);

/**
 * @route POST /api/code/run
 * @desc Run code without evaluating (for debugging)
 * @access Private
 */
router.post(
  "/run",
  authenticate,
  [
    body("code").notEmpty().withMessage("Code is required"),
    body("language")
      .optional()
      .isIn(["javascript", "js"])
      .withMessage("Unsupported language"),
    body("inputs")
      .optional()
      .isObject()
      .withMessage("Inputs must be an object"),
  ],
  codeEvaluationController.runCodeOnly
);

/**
 * @route POST /api/code/challenge/:challengeId/submit
 * @desc Submit code solution for a challenge
 * @access Private
 */
router.post(
  "/challenge/:challengeId/submit",
  authenticate,
  [
    param("challengeId").isUUID().withMessage("Invalid challenge ID"),
    body("code").notEmpty().withMessage("Code is required"),
    body("language")
      .optional()
      .isIn(["javascript", "js"])
      .withMessage("Unsupported language"),
  ],
  codeEvaluationController.submitSolution
);

/**
 * @route GET /api/code/challenge/:challengeId/submissions
 * @desc Get submission history for a challenge
 * @access Private
 */
router.get(
  "/challenge/:challengeId/submissions",
  authenticate,
  param("challengeId").isUUID().withMessage("Invalid challenge ID"),
  codeEvaluationController.getSubmissions
);

module.exports = router;
