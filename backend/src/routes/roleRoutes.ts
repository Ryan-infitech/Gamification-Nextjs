import express from "express";
import { authenticateJwt, requireVerified } from "../middleware/auth";
import { requireRole, requirePermission } from "../middleware/rolePermission";
import { validate } from "../middleware/validator";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthRequest } from "../types/auth";
import { roleService } from "../services/roleService";
import { ResourceNotFoundError, AuthorizationError } from "../types/error";
import { Permission } from "../types/roles";
import logger from "../config/logger";

const router = express.Router();

/**
 * @route GET /api/roles
 * @desc Get all available roles and their default permissions
 * @access Admin
 */
router.get(
  "/",
  authenticateJwt,
  requireVerified,
  requireRole(["admin"]),
  asyncHandler(async (req: AuthRequest, res) => {
    const rolesAndPermissions = roleService.getRolesAndPermissions();

    res.status(200).json({
      success: true,
      message: "Roles and permissions retrieved",
      data: rolesAndPermissions,
    });
  })
);

/**
 * @route GET /api/roles/user/:userId
 * @desc Get all roles and permissions for a user
 * @access Admin
 */
router.get(
  "/user/:userId",
  authenticateJwt,
  requireVerified,
  requireRole(["admin"]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { userId } = req.params;

    // Get primary role
    const primaryRole = await roleService.getPrimaryUserRole(userId);

    // Get additional roles
    const additionalRoles = await roleService.getUserRoles(userId);

    // Get all permissions
    const permissions = await roleService.getUserPermissions(userId);

    res.status(200).json({
      success: true,
      message: "User roles retrieved",
      data: {
        primaryRole,
        additionalRoles,
        permissions,
      },
    });
  })
);

/**
 * @route POST /api/roles/user/:userId
 * @desc Change a user's primary role
 * @access Admin
 */
router.post(
  "/user/:userId",
  authenticateJwt,
  requireVerified,
  requireRole(["admin"]),
  validate({
    body: {
      role: "string",
    },
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;

    // Prevent changing your own role (to avoid situations where you might downgrade yourself from admin)
    if (userId === adminId) {
      throw new AuthorizationError("You cannot change your own role");
    }

    // Change user role
    await roleService.changeUserRole(userId, role, adminId);

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}`,
    });
  })
);

/**
 * @route POST /api/roles/permissions/:userId
 * @desc Grant additional permissions to a user
 * @access Admin
 */
router.post(
  "/permissions/:userId",
  authenticateJwt,
  requireVerified,
  requireRole(["admin"]),
  validate({
    body: {
      permissions: "array",
      expiresIn: "number?",
    },
  }),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const { userId } = req.params;
    const { permissions, expiresIn } = req.body;
    const adminId = req.user.id;

    // Grant permissions
    await roleService.grantPermissions(userId, permissions, adminId, expiresIn);

    res.status(200).json({
      success: true,
      message: "Permissions granted successfully",
    });
  })
);

/**
 * @route DELETE /api/roles/permissions/:roleId
 * @desc Revoke a specific permission role
 * @access Admin
 */
router.delete(
  "/permissions/:roleId",
  authenticateJwt,
  requireVerified,
  requireRole(["admin"]),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const { roleId } = req.params;
    const adminId = req.user.id;

    // Revoke permission
    await roleService.revokePermissions(roleId, adminId);

    res.status(200).json({
      success: true,
      message: "Permission revoked successfully",
    });
  })
);

/**
 * @route GET /api/roles/check-permission
 * @desc Check if current user has a specific permission
 * @access Private
 */
router.get(
  "/check-permission",
  authenticateJwt,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw new AuthorizationError("Not authenticated");
    }

    const { permission } = req.query;

    if (!permission || typeof permission !== "string") {
      throw new AuthorizationError("Permission parameter is required");
    }

    // Check if permission is valid
    if (!Object.values(Permission).includes(permission as Permission)) {
      throw new AuthorizationError(`Invalid permission: ${permission}`);
    }

    // Check if user has permission
    const hasPermission = await roleService.hasPermission(
      req.user.id,
      permission as Permission
    );

    res.status(200).json({
      success: true,
      data: {
        permission,
        hasPermission,
      },
    });
  })
);

export default router;
