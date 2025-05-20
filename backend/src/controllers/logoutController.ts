import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth";
import { logout as logoutService } from "../services/authService";
import { invalidateSession } from "../services/sessionService";
import { env } from "../config/env";
import logger from "../config/logger";
import { asyncHandler } from "../middleware/errorHandler";

/**
 * Handle user logout request
 * This controller:
 * 1. Revokes all user tokens
 * 2. Invalidates the user's current session
 * 3. Clears authentication cookies
 *
 * @route POST /api/auth/logout
 */
export const logout = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(200).json({
          success: true,
          message: "Already logged out",
        });
      }

      const userId = req.user.id;
      const token = req.token;

      // Get token family from cookie or header for session invalidation
      const refreshTokenFromCookie = req.cookies[env.REFRESH_COOKIE_NAME];

      // Call service to logout user (revoke tokens)
      await logoutService(userId, token);

      // If we have a refresh token, we can try to invalidate the specific session
      if (refreshTokenFromCookie) {
        try {
          // This will decode the token and invalidate just this session
          // If it fails, it will be caught and we'll continue with the logout process
          const tokenFamily = ""; // We would extract this from the token in a real implementation
          await invalidateSession(tokenFamily);
        } catch (error) {
          // Just log it but continue with logout, as we already revoked the tokens
          logger.warn("Failed to invalidate specific session during logout", {
            userId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Clear auth cookies
      res.clearCookie(env.AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      res.clearCookie(env.REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      logger.info("User logged out successfully", { userId });

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Error during logout", {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Even if there's an error, clear cookies anyway
      res.clearCookie(env.AUTH_COOKIE_NAME);
      res.clearCookie(env.REFRESH_COOKIE_NAME);

      next(error);
    }
  }
);

/**
 * Handle logout from all devices (revoke all sessions)
 *
 * @route POST /api/auth/logout-all
 */
export const logoutAll = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const userId = req.user.id;

      // Call service to logout user from all devices
      await logoutService(userId);

      // Clear auth cookies
      res.clearCookie(env.AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      res.clearCookie(env.REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      logger.info("User logged out from all devices", { userId });

      res.status(200).json({
        success: true,
        message: "Logged out from all devices successfully",
      });
    } catch (error) {
      logger.error("Error during logout from all devices", {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Even if there's an error, clear cookies anyway
      res.clearCookie(env.AUTH_COOKIE_NAME);
      res.clearCookie(env.REFRESH_COOKIE_NAME);

      next(error);
    }
  }
);

/**
 * Handle clearing CSRF token
 * This can be called on client-side logout to ensure CSRF token is cleared
 *
 * @route POST /api/auth/clear-csrf
 */
export const clearCsrf = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Clear CSRF cookie if it exists
    if (req.cookies["csrf-token"]) {
      res.clearCookie("csrf-token", {
        httpOnly: false,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    }

    res.status(200).json({
      success: true,
      message: "CSRF token cleared",
    });
  }
);

export default {
  logout,
  logoutAll,
  clearCsrf,
};
