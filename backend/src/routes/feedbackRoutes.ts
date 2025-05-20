import express from "express";
import { authenticateJwt } from "../middleware/auth";
import { requireRole } from "../middleware/rolePermission";
import { validate } from "../middleware/validator";
import {
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
} from "../controllers/feedbackController";

const router = express.Router();

/**
 * @route GET /api/feedback
 * @desc Get all feedback items (admin) or user's own feedback
 * @access Private
 */
router.get(
  "/",
  authenticateJwt,
  validate({
    query: {
      status: "string?",
      type: "string?",
      page: "number?",
      limit: "number?",
    },
  }),
  getAllFeedback
);

/**
 * @route GET /api/feedback/stats
 * @desc Get feedback statistics
 * @access Admin only
 */
router.get("/stats", authenticateJwt, requireRole(["admin"]), getFeedbackStats);

/**
 * @route GET /api/feedback/:id
 * @desc Get a specific feedback item
 * @access Private (admin or feedback owner)
 */
router.get(
  "/:id",
  authenticateJwt,
  validate({
    params: {
      id: "string",
    },
  }),
  getFeedbackById
);

/**
 * @route POST /api/feedback
 * @desc Create a new feedback
 * @access Private
 */
router.post(
  "/",
  authenticateJwt,
  validate({
    body: {
      type: "string",
      title: "string",
      description: "string",
      page_url: "string?",
      browser_info: "object?",
    },
  }),
  createFeedback
);

/**
 * @route PATCH /api/feedback/:id
 * @desc Update a feedback item
 * @access Private (admin full access, owner limited access)
 */
router.patch(
  "/:id",
  authenticateJwt,
  validate({
    params: {
      id: "string",
    },
    body: {
      status: "string?",
      priority: "string?",
      assignee_id: "string?",
      title: "string?",
      description: "string?",
    },
  }),
  updateFeedback
);

/**
 * @route DELETE /api/feedback/:id
 * @desc Delete a feedback item
 * @access Admin only
 */
router.delete(
  "/:id",
  authenticateJwt,
  requireRole(["admin"]),
  validate({
    params: {
      id: "string",
    },
  }),
  deleteFeedback
);

export default router;
