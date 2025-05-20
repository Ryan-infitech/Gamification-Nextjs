import { supabase } from "../config/database";
import { UserRole, Permission, rolePermissions } from "../types/roles";
import { UserRoleRecord, UserErrorType } from "../types/user";
import {
  AuthorizationError,
  ResourceNotFoundError,
  ConflictError,
} from "../types/error";
import logger from "../config/logger";

/**
 * Service untuk manajemen role user
 */
export class RoleService {
  /**
   * Mendapatkan daftar role untuk user tertentu
   * @param userId - ID user
   * @returns Array of user roles
   */
  async getUserRoles(userId: string): Promise<UserRoleRecord[]> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      logger.error("Error fetching user roles", { error, userId });
      throw new Error("Failed to fetch user roles");
    }

    return data as UserRoleRecord[];
  }

  /**
   * Mendapatkan role utama user dari tabel users
   * @param userId - ID user
   * @returns Role user
   */
  async getPrimaryUserRole(userId: string): Promise<UserRole> {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      logger.error("Error fetching primary user role", { error, userId });
      throw new ResourceNotFoundError(`User with ID ${userId} not found`, {
        code: UserErrorType.USER_NOT_FOUND,
      });
    }

    return data.role as UserRole;
  }

  /**
   * Mendapatkan semua permission untuk user berdasarkan role
   * @param userId - ID user
   * @returns Array of permissions
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    // Get primary role
    const primaryRole = await this.getPrimaryUserRole(userId);

    // Get standard permissions for primary role
    let permissions = [...rolePermissions[primaryRole]];

    // Get additional roles from user_roles table
    const additionalRoles = await this.getUserRoles(userId);

    // Add permissions from additional roles
    additionalRoles.forEach((role) => {
      // Check if the role has not expired
      const currentDate = new Date();
      const expiryDate = role.expires_at ? new Date(role.expires_at) : null;

      if (!expiryDate || expiryDate > currentDate) {
        // Add explicit permissions assigned to this role
        if (role.permissions && Array.isArray(role.permissions)) {
          permissions = [...permissions, ...role.permissions];
        }
      }
    });

    // Remove duplicates
    return [...new Set(permissions)];
  }

  /**
   * Mengubah role primary user
   * @param userId - ID user yang akan diubah
   * @param role - Role baru
   * @param adminId - ID admin yang melakukan perubahan
   * @returns Updated user
   */
  async changeUserRole(
    userId: string,
    role: UserRole,
    adminId: string
  ): Promise<void> {
    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      throw new AuthorizationError(`Invalid role: ${role}`, {
        code: UserErrorType.INVALID_ROLE,
      });
    }

    // Special validation for admin role
    if (role === UserRole.ADMIN) {
      // You can add more strict validation here, like only super admins can make others admin
      logger.info("Creating new admin user", { userId, adminId });
    }

    // If changing from admin, make sure this is not the last admin
    const currentRole = await this.getPrimaryUserRole(userId);

    if (currentRole === UserRole.ADMIN && role !== UserRole.ADMIN) {
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
        logger.warn("Attempted to change role of last admin", {
          userId,
          adminId,
        });
        throw new ConflictError("Cannot change role of the last admin", {
          code: UserErrorType.LAST_ADMIN_DELETE,
        });
      }
    }

    // Update user role
    const { error } = await supabase
      .from("users")
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      logger.error("Error updating user role", { error, userId, role });
      throw new Error("Failed to update user role");
    }

    // Log this change
    logger.info("User role changed", {
      userId,
      fromRole: currentRole,
      toRole: role,
      changedBy: adminId,
    });

    // Add an entry in user_roles for audit trail
    await supabase.from("user_roles").insert({
      user_id: userId,
      role,
      permissions: rolePermissions[role],
      granted_by: adminId,
      granted_at: new Date().toISOString(),
    });
  }

  /**
   * Memberikan permission tambahan untuk user
   * @param userId - ID user
   * @param permissions - Array of permissions
   * @param adminId - ID admin
   * @param expiresIn - Masa berlaku dalam hari (optional)
   */
  async grantPermissions(
    userId: string,
    permissions: Permission[],
    adminId: string,
    expiresIn?: number
  ): Promise<void> {
    // Validate permissions
    const invalidPermissions = permissions.filter(
      (perm) => !Object.values(Permission).includes(perm)
    );

    if (invalidPermissions.length > 0) {
      throw new AuthorizationError(
        `Invalid permissions: ${invalidPermissions.join(", ")}`,
        {
          code: UserErrorType.INVALID_PERMISSIONS,
        }
      );
    }

    // Calculate expiry date if provided
    let expiresAt: string | undefined;

    if (expiresIn && expiresIn > 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + expiresIn);
      expiresAt = expiry.toISOString();
    }

    // Add permissions to user_roles table
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: "custom", // Custom role for additional permissions
      permissions,
      granted_by: adminId,
      granted_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    if (error) {
      logger.error("Error granting permissions", {
        error,
        userId,
        permissions,
      });
      throw new Error("Failed to grant permissions");
    }

    logger.info("Permissions granted to user", {
      userId,
      permissions,
      grantedBy: adminId,
      expiresAt,
    });
  }

  /**
   * Mencabut permission tambahan untuk user
   * @param roleId - ID role entry yang akan dicabut
   * @param adminId - ID admin
   */
  async revokePermissions(roleId: string, adminId: string): Promise<void> {
    // Get role entry first
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("id", roleId)
      .single();

    if (error || !data) {
      logger.error("Role entry not found", { error, roleId });
      throw new ResourceNotFoundError("Role entry not found");
    }

    // Delete the role entry
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", roleId);

    if (deleteError) {
      logger.error("Error revoking permissions", {
        error: deleteError,
        roleId,
      });
      throw new Error("Failed to revoke permissions");
    }

    logger.info("Permissions revoked from user", {
      roleId,
      userId: data.user_id,
      permissions: data.permissions,
      revokedBy: adminId,
    });
  }

  /**
   * Mendapatkan daftar role dan permission dalam sistem
   * @returns Object dengan daftar role dan permission
   */
  getRolesAndPermissions() {
    return {
      roles: Object.values(UserRole),
      permissions: Object.values(Permission),
      defaultPermissions: rolePermissions,
    };
  }

  /**
   * Memeriksa apakah user memiliki permission tertentu
   * @param userId - ID user
   * @param requiredPermission - Permission yang diperlukan
   * @returns Boolean
   */
  async hasPermission(
    userId: string,
    requiredPermission: Permission
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(requiredPermission);
  }

  /**
   * Memeriksa apakah user memiliki semua permission yang diperlukan
   * @param userId - ID user
   * @param requiredPermissions - Array of permissions yang diperlukan
   * @returns Boolean
   */
  async hasAllPermissions(
    userId: string,
    requiredPermissions: Permission[]
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return requiredPermissions.every((perm) => permissions.includes(perm));
  }

  /**
   * Memeriksa apakah user memiliki salah satu permission yang diperlukan
   * @param userId - ID user
   * @param requiredPermissions - Array of permissions yang diperlukan
   * @returns Boolean
   */
  async hasAnyPermission(
    userId: string,
    requiredPermissions: Permission[]
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return requiredPermissions.some((perm) => permissions.includes(perm));
  }
}

// Export instance dari service
export const roleService = new RoleService();
