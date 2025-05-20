import { Request, Response, NextFunction } from "express";
import {
  login,
  register,
  refreshToken as refreshTokenService,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
} from "../services/authService";
import {
  LoginData,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  VerifyEmailData,
  ChangePasswordData,
  AuthRequest,
  AuthResponseData,
} from "../types/auth";
import { env } from "../config/env";
import logger from "../config/logger";
import { ValidationError } from "../types/error";
import { asyncHandler } from "../middleware/errorHandler";

/**
 * Handle user login
 * @route POST /api/auth/login
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const loginData: LoginData = req.body;

  // Get IP and user agent
  const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  // Login user
  const result = await login(loginData, ipAddress, userAgent);

  // Set auth token as HTTP-only cookie
  setAuthCookie(res, result.token);

  // Set refresh token as HTTP-only cookie if available
  if (result.refreshToken) {
    setRefreshCookie(res, result.refreshToken);
  }

  // Return response without tokens in body (they are in cookies)
  const responseData: AuthResponseData = {
    user: {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
      role: result.user.role,
      displayName: result.user.displayName,
      verified: result.user.verified,
    },
    token: result.token, // For clients that can't use cookies
    refreshToken: result.refreshToken, // For clients that can't use cookies
    expiresIn: result.expiresIn,
  };

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: responseData,
  });
});

/**
 * Handle user registration
 * @route POST /api/auth/register
 */
export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const registerData: RegisterData = req.body;

    // Ensure passwords match
    if (registerData.password !== registerData.confirmPassword) {
      throw new ValidationError("Passwords do not match", {
        confirmPassword: ["Passwords do not match"],
      });
    }

    // Get IP and user agent
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Register user
    const result = await register(registerData, ipAddress, userAgent);

    // Set auth token as HTTP-only cookie
    setAuthCookie(res, result.token);

    // Set refresh token as HTTP-only cookie
    if (result.refreshToken) {
      setRefreshCookie(res, result.refreshToken);
    }

    // Return response without tokens in body (they are in cookies)
    const responseData: AuthResponseData = {
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
        displayName: result.user.displayName,
        verified: result.user.verified,
      },
      token: result.token, // For clients that can't use cookies
      refreshToken: result.refreshToken, // For clients that can't use cookies
      expiresIn: result.expiresIn,
    };

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: responseData,
    });
  }
);

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 */
export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    // Get refresh token from cookie or request body
    const refreshTokenFromCookie = req.cookies[env.REFRESH_COOKIE_NAME];
    const refreshTokenFromBody = req.body.refreshToken;
    const refreshTokenValue = refreshTokenFromCookie || refreshTokenFromBody;

    if (!refreshTokenValue) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Get IP and user agent
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Refresh token
    const result = await refreshTokenService(
      refreshTokenValue,
      ipAddress,
      userAgent
    );

    // Set new auth token as HTTP-only cookie
    setAuthCookie(res, result.token);

    // Set new refresh token as HTTP-only cookie
    if (result.refreshToken) {
      setRefreshCookie(res, result.refreshToken);
    }

    // Return response
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: result.token,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    });
  }
);

/**
 * Get current user
 * @route GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    res.status(200).json({
      success: true,
      message: "User data retrieved successfully",
      data: {
        user: req.user,
      },
    });
  }
);

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
export const forgotPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const forgotPasswordData: ForgotPasswordData = req.body;

    await forgotPassword(forgotPasswordData);

    // Always return success to avoid revealing if email exists
    res.status(200).json({
      success: true,
      message:
        "If the email is registered, password reset instructions have been sent",
    });
  }
);

/**
 * Reset password
 * @route POST /api/auth/reset-password
 */
export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const resetPasswordData: ResetPasswordData = req.body;

    // Ensure passwords match
    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      throw new ValidationError("Passwords do not match", {
        confirmPassword: ["Passwords do not match"],
      });
    }

    await resetPassword(resetPasswordData);

    res.status(200).json({
      success: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  }
);

/**
 * Verify email
 * @route POST /api/auth/verify-email
 */
export const verifyEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    const verifyEmailData: VerifyEmailData = req.body;

    await verifyEmail(verifyEmailData);

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  }
);

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 */
export const resendVerificationController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    await resendVerificationEmail(req.user.id);

    res.status(200).json({
      success: true,
      message: "Verification email has been resent. Please check your email.",
    });
  }
);

/**
 * Change password (when logged in)
 * @route POST /api/auth/change-password
 */
export const changePasswordController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const changePasswordData: ChangePasswordData = req.body;

    // Ensure passwords match
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      throw new ValidationError("Passwords do not match", {
        confirmPassword: ["Passwords do not match"],
      });
    }

    await changePassword(req.user.id, changePasswordData);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  }
);

/**
 * Helper function to set auth cookie
 */
const setAuthCookie = (res: Response, token: string) => {
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(env.JWT_EXPIRES_IN) * 1000, // Convert to milliseconds
    path: "/",
  });
};

/**
 * Helper function to set refresh cookie
 */
const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(env.REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: parseInt(env.JWT_REFRESH_EXPIRES_IN) * 1000, // Convert to milliseconds
    path: "/",
  });
};
