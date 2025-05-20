import { Request, Response } from "express";
import { supabase } from "../config/database";
import { AuthRequest } from "../types/auth";
import {
  CreateNotificationRequest,
  UpdateNotificationRequest,
  BulkNotificationRequest,
  NotificationsListResponse,
} from "../types/notification";
import { asyncHandler } from "../middleware/errorHandler";
import {
  ResourceNotFoundError,
  AuthorizationError,
  ValidationError,
} from "../types/error";
import logger from "../config/logger";
import { getSocketServer } from "../socket/socketManager";
import { emailService } from "../services/emailService";

/**
 * Get notifications for current user
 * @route GET /api/notifications
 */
export const getNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Add filter for unread only if requested
    if (unreadOnly) {
      query = query.eq("read", false);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: notifications, error, count } = await query;

    if (error) {
      logger.error("Error fetching notifications", { error, userId });
      throw new Error("Failed to fetch notifications");
    }

    // Get count of unread notifications for this user
    const { count: unreadCount, error: unreadError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (unreadError) {
      logger.error("Error counting unread notifications", {
        error: unreadError,
        userId,
      });
    }

    // Build response
    const response: NotificationsListResponse = {
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        unread: unreadCount || 0,
      },
    };

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: response,
    });
  }
);

/**
 * Get a single notification by ID
 * @route GET /api/notifications/:id
 */
export const getNotificationById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const userId = req.user.id;
    const notificationId = req.params.id;

    // Get notification
    const { data: notification, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .eq("user_id", userId)
      .single();

    if (error || !notification) {
      throw new ResourceNotFoundError("Notification not found");
    }

    res.status(200).json({
      success: true,
      message: "Notification retrieved successfully",
      data: notification,
    });
  }
);

/**
 * Mark notification as read
 * @route PATCH /api/notifications/:id
 */
export const updateNotification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const userId = req.user.id;
    const notificationId = req.params.id;
    const updateData: UpdateNotificationRequest = req.body;

    // Validate notification ownership
    const { data: existingNotification, error: checkError } = await supabase
      .from("notifications")
      .select("id")
      .eq("id", notificationId)
      .eq("user_id", userId)
      .single();

    if (checkError || !existingNotification) {
      throw new ResourceNotFoundError("Notification not found");
    }

    // Update notification
    const { data: updatedNotification, error } = await supabase
      .from("notifications")
      .update({
        read: updateData.read !== undefined ? updateData.read : true,
        // If we have more fields to update in the future, add them here
      })
      .eq("id", notificationId)
      .select("*")
      .single();

    if (error) {
      logger.error("Error updating notification", {
        error,
        notificationId,
        userId,
      });
      throw new Error("Failed to update notification");
    }

    res.status(200).json({
      success: true,
      message: "Notification updated successfully",
      data: updatedNotification,
    });
  }
);

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 */
export const markAllAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const userId = req.user.id;

    // Update all unread notifications for this user
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      logger.error("Error marking all notifications as read", {
        error,
        userId,
      });
      throw new Error("Failed to mark notifications as read");
    }

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  }
);

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 */
export const deleteNotification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const userId = req.user.id;
    const notificationId = req.params.id;

    // Validate notification ownership
    const { data: existingNotification, error: checkError } = await supabase
      .from("notifications")
      .select("id")
      .eq("id", notificationId)
      .eq("user_id", userId)
      .single();

    if (checkError || !existingNotification) {
      throw new ResourceNotFoundError("Notification not found");
    }

    // Delete notification
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      logger.error("Error deleting notification", {
        error,
        notificationId,
        userId,
      });
      throw new Error("Failed to delete notification");
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  }
);

/**
 * Delete all notifications for current user
 * @route DELETE /api/notifications
 */
export const deleteAllNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const userId = req.user.id;

    // Option to only delete read notifications
    const deleteReadOnly = req.query.readOnly === "true";

    // Build query
    let query = supabase.from("notifications").delete().eq("user_id", userId);

    // Add filter for read only if requested
    if (deleteReadOnly) {
      query = query.eq("read", true);
    }

    // Execute query
    const { error } = await query;

    if (error) {
      logger.error("Error deleting notifications", {
        error,
        userId,
        deleteReadOnly,
      });
      throw new Error("Failed to delete notifications");
    }

    res.status(200).json({
      success: true,
      message: deleteReadOnly
        ? "All read notifications deleted successfully"
        : "All notifications deleted successfully",
    });
  }
);

/**
 * Create a notification
 * @route POST /api/notifications
 * @access Admin or System
 */
export const createNotification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    // Only admin or system can create notifications for other users
    if (req.user.role !== "admin" && req.body.user_id !== req.user.id) {
      throw new AuthorizationError(
        "You are not authorized to create notifications for other users"
      );
    }

    const notificationData: CreateNotificationRequest = req.body;

    // Validate required fields
    if (
      !notificationData.user_id ||
      !notificationData.type ||
      !notificationData.title ||
      !notificationData.message
    ) {
      throw new ValidationError("Missing required fields");
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: notificationData.user_id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || null,
        action_url: notificationData.action_url || null,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Error creating notification", { error, notificationData });
      throw new Error("Failed to create notification");
    }

    // Send real-time notification if socket server is available
    const socketServer = getSocketServer();
    if (socketServer) {
      socketServer
        .getIO()
        .to(`user:${notificationData.user_id}`)
        .emit("notification", {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          timestamp: notification.created_at,
        });
    }

    // Optionally send email notification
    if (notificationData.data?.sendEmail) {
      try {
        await emailService.sendNotificationEmail(
          notificationData.user_id,
          notificationData.type,
          {
            title: notificationData.title,
            message: notificationData.message,
            actionUrl: notificationData.action_url,
            ...notificationData.data,
          }
        );
      } catch (emailError) {
        logger.error("Failed to send notification email", {
          error: emailError,
          userId: notificationData.user_id,
          type: notificationData.type,
        });
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  }
);

/**
 * Send bulk notifications
 * @route POST /api/notifications/bulk
 * @access Admin only
 */
export const createBulkNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    // Only admin can send bulk notifications
    if (req.user.role !== "admin") {
      throw new AuthorizationError(
        "Only administrators can send bulk notifications"
      );
    }

    const bulkData: BulkNotificationRequest = req.body;

    // Validate required fields
    if (
      !bulkData.user_ids ||
      !bulkData.user_ids.length ||
      !bulkData.type ||
      !bulkData.title ||
      !bulkData.message
    ) {
      throw new ValidationError("Missing required fields");
    }

    // Prepare notifications
    const notifications = bulkData.user_ids.map((userId) => ({
      user_id: userId,
      type: bulkData.type,
      title: bulkData.title,
      message: bulkData.message,
      data: bulkData.data || null,
      action_url: bulkData.action_url || null,
      read: false,
      created_at: new Date().toISOString(),
    }));

    // Insert notifications
    const { data, error } = await supabase
      .from("notifications")
      .insert(notifications)
      .select("id, user_id");

    if (error) {
      logger.error("Error creating bulk notifications", { error, bulkData });
      throw new Error("Failed to create bulk notifications");
    }

    // Send real-time notifications
    const socketServer = getSocketServer();
    if (socketServer && data) {
      const io = socketServer.getIO();

      // Group notifications by user for socket delivery
      data.forEach((notification) => {
        io.to(`user:${notification.user_id}`).emit("notification", {
          id: notification.id,
          type: bulkData.type,
          title: bulkData.title,
          message: bulkData.message,
          data: bulkData.data,
          timestamp: new Date().toISOString(),
        });
      });
    }

    // Optionally send email notifications
    if (bulkData.data?.sendEmail) {
      // Run email sending in background, don't wait for completion
      bulkData.user_ids.forEach((userId) => {
        emailService
          .sendNotificationEmail(userId, bulkData.type, {
            title: bulkData.title,
            message: bulkData.message,
            actionUrl: bulkData.action_url,
            ...bulkData.data,
          })
          .catch((error) => {
            logger.error("Failed to send bulk notification email", {
              error,
              userId,
              type: bulkData.type,
            });
          });
      });
    }

    res.status(201).json({
      success: true,
      message: `Sent ${bulkData.user_ids.length} notifications successfully`,
      data: {
        count: bulkData.user_ids.length,
        notificationIds: data?.map((n) => n.id) || [],
      },
    });
  }
);

/**
 * Get notification stats
 * @route GET /api/notifications/stats
 * @access Admin only
 */
export const getNotificationStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    // Only admin can view notification stats
    if (req.user.role !== "admin") {
      throw new AuthorizationError(
        "Only administrators can view notification statistics"
      );
    }

    // Get total notifications
    const { count: totalCount, error: totalError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      logger.error("Error counting notifications", { error: totalError });
      throw new Error("Failed to get notification stats");
    }

    // Get unread notifications
    const { count: unreadCount, error: unreadError } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false);

    if (unreadError) {
      logger.error("Error counting unread notifications", {
        error: unreadError,
      });
      throw new Error("Failed to get notification stats");
    }

    // Get counts by type
    const { data: typeData, error: typeError } = await supabase
      .from("notifications")
      .select("type, count")
      .group("type");

    if (typeError) {
      logger.error("Error counting notifications by type", {
        error: typeError,
      });
      throw new Error("Failed to get notification stats");
    }

    // Get recent activity (count per day for last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentData, error: recentError } = await supabase
      .from("notifications")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (recentError) {
      logger.error("Error getting recent notification activity", {
        error: recentError,
      });
      throw new Error("Failed to get notification stats");
    }

    // Process recent activity by day
    const activityByDay: Record<string, number> = {};

    if (recentData) {
      recentData.forEach((notification) => {
        const date = notification.created_at.substring(0, 10); // YYYY-MM-DD
        activityByDay[date] = (activityByDay[date] || 0) + 1;
      });
    }

    // Convert to array format for response
    const recentActivity = Object.entries(activityByDay)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build type counts
    const byType: Record<string, number> = {};
    if (typeData) {
      typeData.forEach((item) => {
        byType[item.type] = parseInt(item.count);
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification statistics retrieved successfully",
      data: {
        total: totalCount || 0,
        unread: unreadCount || 0,
        byType,
        recentActivity,
      },
    });
  }
);

export default {
  getNotifications,
  getNotificationById,
  updateNotification,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
  createBulkNotifications,
  getNotificationStats,
};
