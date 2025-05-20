import express from "express";
import { authenticateJwt } from "../middleware/auth";
import { requireRole } from "../middleware/rolePermission";
import { validate } from "../middleware/validator";
import {
  getNotifications,
  getNotificationById,
  updateNotification,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
  createBulkNotifications,
  getNotificationStats,
} from "../controllers/notificationController";

const router = express.Router();

/**
 * @route GET /api/notifications
 * @desc Get notifications for current user
 * @access Private
 */
router.get(
  "/",
  authenticateJwt,
  validate({
    query: {
      page: "number?",
      limit: "number?",
      unreadOnly: "boolean?",
    },
  }),
  getNotifications
);

/**
 * @route GET /api/notifications/:id
 * @desc Get a single notification by ID
 * @access Private
 */
router.get(
  "/:id",
  authenticateJwt,
  validate({
    params: {
      id: "string",
    },
  }),
  getNotificationById
);

/**
 * @route PATCH /api/notifications/:id
 * @desc Update notification (mark as read/unread)
 * @access Private
 */
router.patch(
  "/:id",
  authenticateJwt,
  validate({
    params: {
      id: "string",
    },
    body: {
      read: "boolean?",
    },
  }),
  updateNotification
);

/**
 * @route PATCH /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.patch("/read-all", authenticateJwt, markAllAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete(
  "/:id",
  authenticateJwt,
  validate({
    params: {
      id: "string",
    },
  }),
  deleteNotification
);

/**
 * @route DELETE /api/notifications
 * @desc Delete all notifications for current user
 * @access Private
 */
router.delete(
  "/",
  authenticateJwt,
  validate({
    query: {
      readOnly: "boolean?",
    },
  }),
  deleteAllNotifications
);

/**
 * @route POST /api/notifications
 * @desc Create a notification
 * @access Admin or System
 */
router.post(
  "/",
  authenticateJwt,
  validate({
    body: {
      user_id: "string",
      type: "string",
      title: "string",
      message: "string",
      data: "object?",
      action_url: "string?",
    },
  }),
  createNotification
);

/**
 * @route POST /api/notifications/bulk
 * @desc Send bulk notifications
 * @access Admin only
 */
router.post(
  "/bulk",
  authenticateJwt,
  requireRole(["admin"]),
  validate({
    body: {
      user_ids: "array",
      type: "string",
      title: "string",
      message: "string",
      data: "object?",
      action_url: "string?",
    },
  }),
  createBulkNotifications
);

/**
 * @route GET /api/notifications/stats
 * @desc Get notification stats
 * @access Admin only
 */
router.get(
  "/stats",
  authenticateJwt,
  requireRole(["admin"]),
  getNotificationStats
);

export default router;
