import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../config/database";
import { AuthRequest } from "../types/auth";
import {
  UserProfile,
  ProfileUpdateRequest,
  UserPreferencesUpdate,
  mapUserToProfile,
  UserSearchFilters,
  UsersListResponse,
  PlayerStatsUpdate,
  GameProgressUpdate,
} from "../types/user";
import { asyncHandler } from "../middleware/errorHandler";
import {
  ResourceNotFoundError,
  AuthorizationError,
  ValidationError,
  ConflictError,
} from "../types/error";
import logger from "../config/logger";
import { roleService } from "../services/roleService";
import { UserRole, Permission } from "../types/roles";

/**
 * Get current user profile
 * @route GET /api/users/me
 */
export const getCurrentUserProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const userId = req.user.id;

    // Fetch user profile from database
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      logger.error("Error fetching current user", { error, userId });
      throw new ResourceNotFoundError("User not found");
    }

    // Fetch user preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Fetch player stats
    const { data: playerStats } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Map to user profile and include additional data
    const userProfile = mapUserToProfile(user);

    // Get user permissions
    const permissions = await roleService.getUserPermissions(userId);

    // Return profile with additional data
    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: {
        profile: userProfile,
        preferences: preferences || null,
        stats: playerStats || null,
        permissions,
      },
    });
  }
);

/**
 * Update user profile
 * @route PATCH /api/users/me
 */
export const updateUserProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const userId = req.user.id;
    const updateData: ProfileUpdateRequest = req.body;

    // Validate and sanitize input
    const sanitizedData: Record<string, any> = {};

    if (updateData.displayName !== undefined) {
      sanitizedData.display_name = updateData.displayName.trim() || null;
    }

    if (updateData.bio !== undefined) {
      sanitizedData.bio = updateData.bio.trim() || null;
    }

    if (updateData.avatarUrl !== undefined) {
      sanitizedData.avatar_url = updateData.avatarUrl || null;
    }

    if (Object.keys(sanitizedData).length === 0) {
      throw new ValidationError("No valid fields to update");
    }

    // Add updated_at timestamp
    sanitizedData.updated_at = new Date().toISOString();

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(sanitizedData)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      logger.error("Error updating user profile", { error, userId });
      throw new Error("Failed to update user profile");
    }

    // Return updated profile
    const userProfile = mapUserToProfile(updatedUser);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        profile: userProfile,
      },
    });
  }
);

/**
 * Update user preferences
 * @route PATCH /api/users/preferences
 */
export const updateUserPreferences = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const userId = req.user.id;
    const preferences: UserPreferencesUpdate = req.body;

    // Check if preferences exist for this user
    const { data: existingPreferences } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", userId)
      .single();

    let result;

    if (existingPreferences) {
      // Update existing preferences
      result = await supabase
        .from("user_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("*")
        .single();
    } else {
      // Create new preferences
      result = await supabase
        .from("user_preferences")
        .insert({
          user_id: userId,
          ...preferences,
        })
        .select("*")
        .single();
    }

    if (result.error) {
      logger.error("Error updating user preferences", {
        error: result.error,
        userId,
      });
      throw new Error("Failed to update user preferences");
    }

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        preferences: result.data,
      },
    });
  }
);

/**
 * Update player stats
 * @route PATCH /api/users/stats
 */
export const updatePlayerStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const userId = req.user.id;
    const statsUpdate: PlayerStatsUpdate = req.body;

    // Check if stats exist for this user
    const { data: existingStats } = await supabase
      .from("player_stats")
      .select("id")
      .eq("user_id", userId)
      .single();

    let result;

    if (existingStats) {
      // Update existing stats
      result = await supabase
        .from("player_stats")
        .update({
          ...statsUpdate,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("*")
        .single();
    } else {
      // Create new stats
      result = await supabase
        .from("player_stats")
        .insert({
          user_id: userId,
          ...statsUpdate,
        })
        .select("*")
        .single();
    }

    if (result.error) {
      logger.error("Error updating player stats", {
        error: result.error,
        userId,
      });
      throw new Error("Failed to update player stats");
    }

    res.status(200).json({
      success: true,
      message: "Player stats updated successfully",
      data: {
        stats: result.data,
      },
    });
  }
);

/**
 * Update game progress
 * @route PATCH /api/users/progress
 */
export const updateGameProgress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const userId = req.user.id;
    const progressUpdate: GameProgressUpdate = req.body;

    // Check if progress exists for this user
    const { data: existingProgress } = await supabase
      .from("game_progress")
      .select("id")
      .eq("user_id", userId)
      .single();

    let result;

    if (existingProgress) {
      // Update existing progress
      result = await supabase
        .from("game_progress")
        .update({
          ...progressUpdate,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("*")
        .single();
    } else {
      // Create new progress
      result = await supabase
        .from("game_progress")
        .insert({
          user_id: userId,
          ...progressUpdate,
        })
        .select("*")
        .single();
    }

    if (result.error) {
      logger.error("Error updating game progress", {
        error: result.error,
        userId,
      });
      throw new Error("Failed to update game progress");
    }

    res.status(200).json({
      success: true,
      message: "Game progress updated successfully",
      data: {
        progress: result.data,
      },
    });
  }
);

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Admin, Teacher can view all users, Students can only view themselves
 */
export const getUserById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const userId = req.params.id;
    const currentUserId = req.user.id;
    const userRole = req.user.role as UserRole;

    // Check permissions: only admin, teacher, or self can view
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.TEACHER &&
      currentUserId !== userId
    ) {
      throw new AuthorizationError(
        "You do not have permission to view this user"
      );
    }

    // Fetch user from database
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      logger.error("Error fetching user by ID", { error, userId });
      throw new ResourceNotFoundError("User not found");
    }

    // Map to user profile
    const userProfile = mapUserToProfile(user);

    // Only fetch additional data for admin, teacher, or self
    if (
      userRole === UserRole.ADMIN ||
      userRole === UserRole.TEACHER ||
      currentUserId === userId
    ) {
      // Fetch user preferences
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Fetch player stats
      const { data: playerStats } = await supabase
        .from("player_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Get permissions for admin view
      let permissions = undefined;
      if (userRole === UserRole.ADMIN) {
        permissions = await roleService.getUserPermissions(userId);
      }

      // Return profile with additional data
      res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: {
          profile: userProfile,
          preferences: preferences || null,
          stats: playerStats || null,
          permissions,
        },
      });
    } else {
      // Return basic profile for other users
      res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: {
          profile: userProfile,
        },
      });
    }
  }
);

/**
 * Get list of users with pagination and filtering
 * @route GET /api/users
 * @access Admin, Teacher
 */
export const getUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const userRole = req.user.role as UserRole;

    // Check permissions: only admin or teacher can list users
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.TEACHER) {
      throw new AuthorizationError("You do not have permission to list users");
    }

    // Parse filters from query params
    const filters: UserSearchFilters = {
      query: req.query.q as string,
      role: req.query.role as UserRole,
      verified: req.query.verified === "true",
      sortBy: req.query.sortBy as "username" | "created_at" | "login_streak",
      sortOrder: req.query.sortOrder as "asc" | "desc",
      page: parseInt(req.query.page as string) || 1,
      perPage: parseInt(req.query.perPage as string) || 20,
    };

    // Validate page and perPage
    if (filters.page < 1) filters.page = 1;
    if (filters.perPage < 1 || filters.perPage > 100) filters.perPage = 20;

    // Calculate offset
    const offset = (filters.page - 1) * filters.perPage;

    // Build query
    let query = supabase.from("users").select("*", { count: "exact" });

    // Apply filters
    if (filters.query) {
      query = query.or(
        `username.ilike.%${filters.query}%,email.ilike.%${filters.query}%,display_name.ilike.%${filters.query}%`
      );
    }

    if (filters.role) {
      query = query.eq("role", filters.role);
    }

    if (filters.verified !== undefined) {
      query = query.eq("verified", filters.verified);
    }

    // Apply sorting
    if (filters.sortBy) {
      query = query.order(filters.sortBy, {
        ascending: filters.sortOrder === "asc",
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + filters.perPage - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      logger.error("Error fetching users", { error, filters });
      throw new Error("Failed to fetch users");
    }

    // Map user data to profiles
    const userProfiles: UserProfile[] = data.map(mapUserToProfile);

    // Prepare pagination info
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / filters.perPage);

    // Prepare response
    const response: UsersListResponse = {
      users: userProfiles,
      pagination: {
        page: filters.page,
        perPage: filters.perPage,
        total: totalCount,
        totalPages,
      },
    };

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: response,
    });
  }
);

/**
 * Change user password
 * @route POST /api/users/change-password
 */
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate password requirements
    if (newPassword.length < 8) {
      throw new ValidationError(
        "New password must be at least 8 characters long"
      );
    }

    // Fetch current user to verify password
    const { data: user, error } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single();

    if (error || !user) {
      logger.error("Error fetching user for password change", {
        error,
        userId,
      });
      throw new ResourceNotFoundError("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new ValidationError("Current password is incorrect");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashedNewPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      logger.error("Error updating password", { error: updateError, userId });
      throw new Error("Failed to update password");
    }

    // Log password change
    logger.info("User changed password", { userId });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  }
);

/**
 * Get user activity
 * @route GET /api/users/activity
 */
export const getUserActivity = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const userId = req.user.id;

    // Parse pagination params
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const offset = (page - 1) * perPage;

    // Fetch activities from session_logs
    const { data, error, count } = await supabase
      .from("session_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) {
      logger.error("Error fetching user activity", { error, userId });
      throw new Error("Failed to fetch user activity");
    }

    // Calculate pagination info
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / perPage);

    res.status(200).json({
      success: true,
      message: "User activity retrieved successfully",
      data: {
        activity: data,
        pagination: {
          page,
          perPage,
          total: totalCount,
          totalPages,
        },
      },
    });
  }
);

export default {
  getCurrentUserProfile,
  updateUserProfile,
  updateUserPreferences,
  updatePlayerStats,
  updateGameProgress,
  getUserById,
  getUsers,
  changePassword,
  getUserActivity,
};
