import { Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../config/database";
import { AuthRequest } from "../types/auth";
import {
  AdminUserCreateRequest,
  AdminUserUpdateRequest,
  mapUserToProfile,
  UserErrorType,
} from "../types/user";
import { asyncHandler } from "../middleware/errorHandler";
import {
  ResourceNotFoundError,
  ConflictError,
  ValidationError,
  AuthorizationError,
} from "../types/error";
import { UserRole } from "../types/roles";
import logger from "../config/logger";

/**
 * Create a new user (admin only)
 * @route POST /api/admin/users
 */
export const createUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new AuthorizationError("Admin access required");
    }

    const userData: AdminUserCreateRequest = req.body;
    const adminId = req.user.id;

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", userData.email.toLowerCase().trim())
      .single();

    if (existingEmail) {
      throw new ConflictError("Email already in use", {
        code: UserErrorType.EMAIL_ALREADY_EXISTS,
      });
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from("users")
      .select("id")
      .eq("username", userData.username.trim())
      .single();

    if (existingUsername) {
      throw new ConflictError("Username already in use", {
        code: UserErrorType.USERNAME_ALREADY_EXISTS,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Prepare user data
    const newUser = {
      username: userData.username.trim(),
      email: userData.email.toLowerCase().trim(),
      password_hash: passwordHash,
      role: userData.role,
      display_name: userData.displayName?.trim(),
      verified: userData.verified || false,
    };

    // Create user
    const { data: createdUser, error } = await supabase
      .from("users")
      .insert(newUser)
      .select("*")
      .single();

    if (error) {
      logger.error("Error creating user from admin", { error, adminId });
      throw new Error("Failed to create user");
    }

    // Create initial player stats
    await supabase.from("player_stats").insert({
      user_id: createdUser.id,
    });

    // Create initial game progress
    await supabase.from("game_progress").insert({
      user_id: createdUser.id,
    });

    // Create default preferences
    await supabase.from("user_preferences").insert({
      user_id: createdUser.id,
    });

    // Log user creation
    logger.info("Admin created new user", {
      adminId,
      newUserId: createdUser.id,
      role: createdUser.role,
    });

    // Return created user
    const userProfile = mapUserToProfile(createdUser);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: userProfile,
      },
    });
  }
);

/**
 * Update a user (admin only)
 * @route PUT /api/admin/users/:id
 */
export const updateUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new AuthorizationError("Admin access required");
    }

    const userId = req.params.id;
    const updateData: AdminUserUpdateRequest = req.body;
    const adminId = req.user.id;

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !existingUser) {
      throw new ResourceNotFoundError("User not found");
    }

    // Special validation for admin users
    if (
      existingUser.role === UserRole.ADMIN &&
      updateData.role &&
      updateData.role !== UserRole.ADMIN
    ) {
      // Count total admins
      const { count, error } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", UserRole.ADMIN);

      if (error) {
        logger.error("Error counting admins", { error });
        throw new Error("Failed to validate admin count");
      }

      if (count <= 1) {
        throw new ConflictError("Cannot change role of the last admin", {
          code: UserErrorType.LAST_ADMIN_DELETE,
        });
      }
    }

    // Check if the updated email is already in use
    if (updateData.email && updateData.email !== existingUser.email) {
      const { data: existingEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", updateData.email.toLowerCase().trim())
        .neq("id", userId)
        .single();

      if (existingEmail) {
        throw new ConflictError("Email already in use", {
          code: UserErrorType.EMAIL_ALREADY_EXISTS,
        });
      }
    }

    // Check if the updated username is already in use
    if (updateData.username && updateData.username !== existingUser.username) {
      const { data: existingUsername } = await supabase
        .from("users")
        .select("id")
        .eq("username", updateData.username.trim())
        .neq("id", userId)
        .single();

      if (existingUsername) {
        throw new ConflictError("Username already in use", {
          code: UserErrorType.USERNAME_ALREADY_EXISTS,
        });
      }
    }

    // Prepare update data
    const userUpdate: Record<string, any> = {};

    if (updateData.username) userUpdate.username = updateData.username.trim();
    if (updateData.email)
      userUpdate.email = updateData.email.toLowerCase().trim();
    if (updateData.role !== undefined) userUpdate.role = updateData.role;
    if (updateData.displayName !== undefined)
      userUpdate.display_name = updateData.displayName.trim() || null;
    if (updateData.bio !== undefined)
      userUpdate.bio = updateData.bio.trim() || null;
    if (updateData.verified !== undefined)
      userUpdate.verified = updateData.verified;

    // Add updated_at timestamp
    userUpdate.updated_at = new Date().toISOString();

    // Handle password update separately
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      userUpdate.password_hash = await bcrypt.hash(updateData.password, salt);
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(userUpdate)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      logger.error("Error updating user from admin", {
        error,
        adminId,
        userId,
      });
      throw new Error("Failed to update user");
    }

    // Log user update
    logger.info("Admin updated user", {
      adminId,
      userId,
      updatedFields: Object.keys(userUpdate).filter(
        (key) => key !== "updated_at"
      ),
    });

    // Return updated user
    const userProfile = mapUserToProfile(updatedUser);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: userProfile,
      },
    });
  }
);

/**
 * Delete a user (admin only)
 * @route DELETE /api/admin/users/:id
 */
export const deleteUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new AuthorizationError("Admin access required");
    }

    const userId = req.params.id;
    const adminId = req.user.id;

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      throw new ValidationError("You cannot delete your own account", {
        code: UserErrorType.CANNOT_DELETE_SELF,
      });
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !existingUser) {
      throw new ResourceNotFoundError("User not found");
    }

    // Special validation for admin users
    if (existingUser.role === UserRole.ADMIN) {
      // Count total admins
      const { count, error } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", UserRole.ADMIN);

      if (error) {
        logger.error("Error counting admins", { error });
        throw new Error("Failed to validate admin count");
      }

      if (count <= 1) {
        throw new ConflictError("Cannot delete the last admin", {
          code: UserErrorType.LAST_ADMIN_DELETE,
        });
      }
    }

    // Delete user
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      logger.error("Error deleting user from admin", {
        error,
        adminId,
        userId,
      });
      throw new Error("Failed to delete user");
    }

    // Log user deletion
    logger.info("Admin deleted user", {
      adminId,
      userId,
      userRole: existingUser.role,
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  }
);

/**
 * Get system dashboard stats (admin only)
 * @route GET /api/admin/dashboard
 */
export const getDashboardStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new AuthorizationError("Admin access required");
    }

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (usersError) {
      logger.error("Error counting users for dashboard", { error: usersError });
      throw new Error("Failed to fetch dashboard stats");
    }

    // Get users by role
    const { data: roleData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .contains("role", ["admin", "teacher", "student"]);

    if (roleError) {
      logger.error("Error counting users by role for dashboard", {
        error: roleError,
      });
      throw new Error("Failed to fetch dashboard stats");
    }

    // Count by role
    const usersByRole = {
      admin: roleData.filter((u) => u.role === "admin").length,
      teacher: roleData.filter((u) => u.role === "teacher").length,
      student: roleData.filter((u) => u.role === "student").length,
    };

    // Get new users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newUsers, error: newUsersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (newUsersError) {
      logger.error("Error counting new users for dashboard", {
        error: newUsersError,
      });
      throw new Error("Failed to fetch dashboard stats");
    }

    // Get average active time and other metrics
    // These would typically come from analytics data
    // For now, we'll return placeholder values

    res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: {
        userStats: {
          total: totalUsers || 0,
          byRole: usersByRole,
          newLast30Days: newUsers || 0,
          verifiedPercentage: 0, // Placeholder
          activeToday: 0, // Placeholder
        },
        contentStats: {
          totalChallenges: 0, // Placeholder
          totalQuizzes: 0, // Placeholder
          totalStudyMaterials: 0, // Placeholder
        },
        engagementStats: {
          averageSessionTimeMinutes: 0, // Placeholder
          challengesCompletedToday: 0, // Placeholder
          quizzesCompletedToday: 0, // Placeholder
        },
        systemHealth: {
          apiResponseTimeMs: 0, // Placeholder
          errorRateLast24h: 0, // Placeholder
          databaseSizeBytes: 0, // Placeholder
        },
      },
    });
  }
);

export default {
  createUser,
  updateUser,
  deleteUser,
  getDashboardStats,
};
