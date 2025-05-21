import express from "express";
import quizController from "../controllers/quizController";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/rolePermission";
import validator from "../middleware/validator";
import {
  quizValidation,
  submissionValidation,
} from "../validators/quizValidator";

const router = express.Router();

/**
 * @route GET /api/quiz
 * @desc Get all available quizzes with optional filters
 * @access Public (basic info) / Private (with user progress)
 */
router.get("/", quizController.getQuizzes);

/**
 * @route GET /api/quiz/:id
 * @desc Get a specific quiz by ID with its questions
 * @access Private
 */
router.get("/:id", authMiddleware, quizController.getQuizById);

/**
 * @route POST /api/quiz
 * @desc Create a new quiz
 * @access Private (teachers and admins only)
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "teacher"]),
  validator(quizValidation.create),
  quizController.createQuiz
);

/**
 * @route PUT /api/quiz/:id
 * @desc Update an existing quiz
 * @access Private (teachers, admins, and quiz creator)
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "teacher"]),
  validator(quizValidation.update),
  quizController.updateQuiz
);

/**
 * @route DELETE /api/quiz/:id
 * @desc Delete a quiz
 * @access Private (teachers, admins, and quiz creator)
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "teacher"]),
  quizController.deleteQuiz
);

/**
 * @route POST /api/quiz/submit
 * @desc Submit a quiz attempt
 * @access Private
 */
router.post(
  "/submit",
  authMiddleware,
  validator(submissionValidation.submit),
  quizController.submitQuiz
);

/**
 * @route GET /api/quiz/attempts
 * @desc Get quiz attempts for the current user
 * @access Private
 */
router.get("/attempts", authMiddleware, quizController.getQuizAttempts);

/**
 * @route GET /api/quiz/attempts/:quizId
 * @desc Get quiz attempts for the current user for a specific quiz
 * @access Private
 */
router.get("/attempts/:quizId", authMiddleware, quizController.getQuizAttempts);

/**
 * @route GET /api/quiz/attempt/:attemptId
 * @desc Get detailed information about a specific quiz attempt
 * @access Private
 */
router.get(
  "/attempt/:attemptId",
  authMiddleware,
  quizController.getQuizAttemptDetail
);

/**
 * @route GET /api/quiz/:quizId/stats
 * @desc Get statistics for a quiz (admin/teacher only)
 * @access Private (admin/teacher)
 */
router.get(
  "/:quizId/stats",
  authMiddleware,
  roleMiddleware(["admin", "teacher"]),
  quizController.getQuizStats
);

export default router;
