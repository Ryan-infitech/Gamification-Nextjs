import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth";
import { AuthorizationError } from "../types/error";
import { Permission, UserRole, hasPermission } from "../types/roles";
import logger from "../config/logger";

/**
 * Middleware untuk membatasi akses berdasarkan role user
 * @param allowedRoles - Array role yang diperbolehkan
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthorizationError("Authentication required."));
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      logger.warn("Unauthorized role access attempt", {
        userId: req.user.id,
        userRole: role,
        allowedRoles,
        path: req.path,
        method: req.method,
      });

      return next(
        new AuthorizationError(
          `Access denied. Required role: ${allowedRoles.join(" or ")}.`
        )
      );
    }

    next();
  };
};

/**
 * Middleware untuk membatasi akses berdasarkan permission
 * @param requiredPermissions - Array permission yang dibutuhkan
 * @param requireAll - Jika true, user harus memiliki semua permission.
 *                    Jika false, user hanya perlu salah satu permission.
 */
export const requirePermission = (
  requiredPermissions: Permission[],
  requireAll: boolean = false
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthorizationError("Authentication required."));
    }

    const { role } = req.user;

    if (role === "admin") {
      // Admin always has all permissions
      return next();
    }

    // Check permissions based on role
    let hasRequiredPermission = false;

    if (requireAll) {
      // Require all permissions
      hasRequiredPermission = requiredPermissions.every((permission) =>
        hasPermission(role, permission)
      );
    } else {
      // Require at least one permission
      hasRequiredPermission = requiredPermissions.some((permission) =>
        hasPermission(role, permission)
      );
    }

    if (!hasRequiredPermission) {
      logger.warn("Unauthorized permission access attempt", {
        userId: req.user.id,
        userRole: role,
        requiredPermissions,
        requireAll,
        path: req.path,
        method: req.method,
      });

      return next(
        new AuthorizationError(
          `Access denied. Required ${
            requireAll ? "all" : "one"
          } of these permissions: ${requiredPermissions.join(", ")}.`
        )
      );
    }

    next();
  };
};

/**
 * Middleware untuk membatasi akses ke resource milik user sendiri
 * @param extractResourceUserId - Function untuk extract user ID dari resource
 */
export const requireOwnership = (
  extractResourceUserId: (
    req: AuthRequest
  ) => Promise<string | null> | string | null
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthorizationError("Authentication required."));
    }

    // Skip check for admin
    if (req.user.role === "admin") {
      return next();
    }

    // Get resource owner ID
    const resourceUserId = await extractResourceUserId(req);

    if (!resourceUserId) {
      return next(
        new AuthorizationError("Resource ownership cannot be determined.")
      );
    }

    if (resourceUserId !== req.user.id) {
      logger.warn("Unauthorized resource access attempt", {
        userId: req.user.id,
        resourceUserId,
        path: req.path,
        method: req.method,
      });

      return next(
        new AuthorizationError(
          "Access denied. You can only access your own resources."
        )
      );
    }

    next();
  };
};

/**
 * Factory function untuk membuat middleware yang mengecek apakah user
 * adalah user itu sendiri, berdasarkan user ID di parameter URL
 */
export const requireSelfOrAdmin = (paramName: string = "userId") => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthorizationError("Authentication required."));
    }

    const paramUserId = req.params[paramName];

    // Admin dapat mengakses semua user
    if (req.user.role === "admin") {
      return next();
    }

    // User hanya bisa mengakses dirinya sendiri
    if (req.user.id !== paramUserId) {
      logger.warn("Unauthorized user access attempt", {
        userId: req.user.id,
        targetUserId: paramUserId,
        path: req.path,
        method: req.method,
      });

      return next(
        new AuthorizationError(
          "Access denied. You can only access your own user data."
        )
      );
    }

    next();
  };
};

/**
 * Shortcut untuk role-based middleware
 */
export const adminOnly = requireRole(["admin"]);
export const teacherOrAdmin = requireRole(["admin", "teacher"]);
export const authenticatedOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AuthorizationError("Authentication required."));
  }
  next();
};
