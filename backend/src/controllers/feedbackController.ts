import { Request, Response } from "express";
import { supabase } from "../config/database";
import { AuthRequest } from "../types/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  ValidationError,
  ResourceNotFoundError,
  AuthorizationError,
} from "../types/error";
import logger from "../config/logger";
import { notificationService } from "../services/notificationService";

/**
 * Get all feedback items with filtering and pagination
 * @route GET /api/feedback
 * @access Admin only (for all items), or user for their own feedback
 */
export const getAllFeedback = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const isAdmin = req.user.role === "admin";
    const userId = req.user.id;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("feedback")
      .select("*, assignee:assignee_id(*)", { count: "exact" });

    // Filter based on role
    if (!isAdmin) {
      // Non-admin users can only see their own feedback
      query = query.eq("user_id", userId);
    }

    // Apply optional filters
    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      logger.error("Error fetching feedback", { error });
      throw new Error("Failed to fetch feedback");
    }

    // Return feedback items with pagination info
    res.status(200).json({
      success: true,
      message: "Feedback items retrieved successfully",
      data: {
        items: data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: count ? Math.ceil(count / limit) : 0,
        },
      },
    });
  }
);

/**
 * Get a specific feedback item by ID
 * @route GET /api/feedback/:id
 * @access Admin or feedback owner
 */
export const getFeedbackById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const feedbackId = req.params.id;
    const isAdmin = req.user.role === "admin";

    // Get feedback
    const { data: feedback, error } = await supabase
      .from("feedback")
      .select("*, assignee:assignee_id(*)")
      .eq("id", feedbackId)
      .single();

    if (error || !feedback) {
      throw new ResourceNotFoundError("Feedback not found");
    }

    // Check if user is allowed to see this feedback
    if (!isAdmin && feedback.user_id !== req.user.id) {
      throw new AuthorizationError(
        "You are not authorized to view this feedback"
      );
    }

    res.status(200).json({
      success: true,
      message: "Feedback retrieved successfully",
      data: feedback,
    });
  }
);

/**
 * Create a new feedback
 * @route POST /api/feedback
 * @access Authenticated users
 */
export const createFeedback = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const { type, title, description, page_url, browser_info } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!type || !title || !description) {
      throw new ValidationError("Type, title and description are required");
    }

    // Create feedback record
    const { data: feedback, error } = await supabase
      .from("feedback")
      .insert({
        user_id: userId,
        type,
        title,
        description,
        status: "pending", // Default status
        priority: "medium", // Default priority
        page_url: page_url || null,
        browser_info: browser_info || null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Error creating feedback", { error, userId });
      throw new Error("Failed to create feedback");
    }

    // Notify admins about new feedback
    try {
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        // Send notification to all admins
        for (const admin of admins) {
          await notificationService.sendNotification({
            user_id: admin.id,
            type: "admin",
            title: "New Feedback Submitted",
            message: `New ${type} feedback: ${title}`,
            data: {
              feedbackId: feedback.id,
              type,
              priority: "medium",
            },
          });
        }
      }
    } catch (notifyError) {
      logger.error("Error notifying admins about new feedback", {
        notifyError,
      });
      // Continue despite notification error
    }

    // Record in logs
    try {
      await supabase.from("session_logs").insert({
        user_id: userId,
        action: "create_feedback",
        resource: "feedback",
        status: "success",
        details: {
          feedback_id: feedback.id,
          type,
          title,
        },
      });
    } catch (logError) {
      logger.error("Error logging feedback creation", { logError });
      // Continue despite logging error
    }

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  }
);

/**
 * Update a feedback (admin only, except for the user who can cancel their own feedback)
 * @route PATCH /api/feedback/:id
 * @access Admin (full access) or feedback owner (limited access)
 */
export const updateFeedback = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const feedbackId = req.params.id;
    const isAdmin = req.user.role === "admin";
    const userId = req.user.id;

    // Get existing feedback
    const { data: existingFeedback, error: fetchError } = await supabase
      .from("feedback")
      .select("*")
      .eq("id", feedbackId)
      .single();

    if (fetchError || !existingFeedback) {
      throw new ResourceNotFoundError("Feedback not found");
    }

    // Check permissions
    if (!isAdmin && existingFeedback.user_id !== userId) {
      throw new AuthorizationError(
        "You are not authorized to update this feedback"
      );
    }

    // Prepare update data
    const updateData: Record<string, any> = {};

    // Admin can update any field
    if (isAdmin) {
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.priority !== undefined)
        updateData.priority = req.body.priority;
      if (req.body.assignee_id !== undefined)
        updateData.assignee_id = req.body.assignee_id;
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined)
        updateData.description = req.body.description;
    } else {
      // Non-admin users can only cancel their own feedback or update description
      if (req.body.status === "closed") updateData.status = "closed";
      if (req.body.description !== undefined)
        updateData.description = req.body.description;
    }

    // Always update updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // If nothing to update, return early
    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        success: true,
        message: "No changes to update",
        data: existingFeedback,
      });
    }

    // Update feedback
    const { data: updatedFeedback, error: updateError } = await supabase
      .from("feedback")
      .update(updateData)
      .eq("id", feedbackId)
      .select("*")
      .single();

    if (updateError) {
      logger.error("Error updating feedback", { updateError, feedbackId });
      throw new Error("Failed to update feedback");
    }

    // Notify the feedback owner if status changed and updated by admin
    if (isAdmin && req.body.status && existingFeedback.user_id) {
      try {
        await notificationService.sendNotification({
          user_id: existingFeedback.user_id,
          type: "system",
          title: "Feedback Status Updated",
          message: `Your feedback "${existingFeedback.title}" is now ${req.body.status}`,
          data: {
            feedbackId,
            previousStatus: existingFeedback.status,
            newStatus: req.body.status,
          },
        });
      } catch (notifyError) {
        logger.error("Error notifying user about feedback update", {
          notifyError,
        });
      }
    }

    // Log the update
    try {
      await supabase.from("session_logs").insert({
        user_id: userId,
        action: "update_feedback",
        resource: "feedback",
        status: "success",
        details: {
          feedback_id: feedbackId,
          updated_fields: Object.keys(updateData),
          is_admin_update: isAdmin,
        },
      });
    } catch (logError) {
      logger.error("Error logging feedback update", { logError });
    }

    res.status(200).json({
      success: true,
      message: "Feedback updated successfully",
      data: updatedFeedback,
    });
  }
);

/**
 * Delete a feedback
 * @route DELETE /api/feedback/:id
 * @access Admin only
 */
export const deleteFeedback = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    if (req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can delete feedback");
    }

    const feedbackId = req.params.id;

    // Check if feedback exists
    const { data: existingFeedback, error: fetchError } = await supabase
      .from("feedback")
      .select("id")
      .eq("id", feedbackId)
      .single();

    if (fetchError || !existingFeedback) {
      throw new ResourceNotFoundError("Feedback not found");
    }

    // Delete feedback
    const { error: deleteError } = await supabase
      .from("feedback")
      .delete()
      .eq("id", feedbackId);

    if (deleteError) {
      logger.error("Error deleting feedback", { deleteError, feedbackId });
      throw new Error("Failed to delete feedback");
    }

    // Log the deletion
    try {
      await supabase.from("session_logs").insert({
        user_id: req.user.id,
        action: "delete_feedback",
        resource: "feedback",
        status: "success",
        details: {
          feedback_id: feedbackId,
        },
      });
    } catch (logError) {
      logger.error("Error logging feedback deletion", { logError });
    }

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  }
);

/**
 * Get feedback statistics for admin dashboard
 * @route GET /api/feedback/stats
 * @access Admin only
 */
export const getFeedbackStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    if (req.user.role !== "admin") {
      throw new AuthorizationError(
        "Only administrators can access feedback statistics"
      );
    }

    // Get counts by status
    const { data: statusStats, error: statusError } = await supabase
      .from("feedback")
      .select("status, count")
      .group("status");

    if (statusError) {
      logger.error("Error fetching feedback status stats", { statusError });
      throw new Error("Failed to fetch feedback statistics");
    }

    // Get counts by type
    const { data: typeStats, error: typeError } = await supabase
      .from("feedback")
      .select("type, count")
      .group("type");

    if (typeError) {
      logger.error("Error fetching feedback type stats", { typeError });
      throw new Error("Failed to fetch feedback statistics");
    }

    // Get counts by priority
    const { data: priorityStats, error: priorityError } = await supabase
      .from("feedback")
      .select("priority, count")
      .group("priority");

    if (priorityError) {
      logger.error("Error fetching feedback priority stats", { priorityError });
      throw new Error("Failed to fetch feedback statistics");
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true });

    if (countError) {
      logger.error("Error counting feedback", { countError });
      throw new Error("Failed to fetch feedback statistics");
    }

    // Get recent feedback
    const { data: recentFeedback, error: recentError } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) {
      logger.error("Error fetching recent feedback", { recentError });
      throw new Error("Failed to fetch feedback statistics");
    }

    // Convert counts to objects for easier consumption
    const byStatus = statusStats.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count as string);
      return acc;
    }, {} as Record<string, number>);

    const byType = typeStats.reduce((acc, { type, count }) => {
      acc[type] = parseInt(count as string);
      return acc;
    }, {} as Record<string, number>);

    const byPriority = priorityStats.reduce((acc, { priority, count }) => {
      acc[priority] = parseInt(count as string);
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      message: "Feedback statistics retrieved successfully",
      data: {
        total: totalCount || 0,
        byStatus,
        byType,
        byPriority,
        recentFeedback,
      },
    });
  }
);

export default {
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
};
