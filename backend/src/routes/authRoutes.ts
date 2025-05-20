import express from "express";
import { validate } from "../middleware/validator";
import {
  authenticateJwt,
  requireVerified,
  blockAuthenticated,
} from "../middleware/auth";
import {
  loginUser,
  registerUser,
  refreshTokenController,
  getCurrentUser,
  forgotPasswordController,
  resetPasswordController,
  verifyEmailController,
  resendVerificationController,
  changePasswordController,
} from "../controllers/authController";
import { logout, logoutAll, clearCsrf } from "../controllers/logoutController";
import {
  loginSchema,
  registrationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
} from "../utils/validationSchemas";

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  "/register",
  blockAuthenticated,
  validate(registrationSchema),
  registerUser
);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post("/login", blockAuthenticated, validate(loginSchema), loginUser);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate token
 * @access Private
 */
router.post("/logout", authenticateJwt, logout);

/**
 * @route POST /api/auth/logout-all
 * @desc Logout from all devices
 * @access Private
 */
router.post("/logout-all", authenticateJwt, logoutAll);

/**
 * @route POST /api/auth/clear-csrf
 * @desc Clear CSRF token
 * @access Public
 */
router.post("/clear-csrf", clearCsrf);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token
 * @access Public (with refresh token)
 */
router.post("/refresh-token", refreshTokenController);

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get("/me", authenticateJwt, getCurrentUser);

/**
 * @route POST /api/auth/verify-email
 * @desc Verify user email with token
 * @access Public
 */
router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  verifyEmailController
);

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend verification email
 * @access Private
 */
router.post(
  "/resend-verification",
  authenticateJwt,
  resendVerificationController
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPasswordController
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPasswordController
);

/**
 * @route POST /api/auth/change-password
 * @desc Change password when logged in
 * @access Private
 */
router.post(
  "/change-password",
  authenticateJwt,
  requireVerified,
  validate(changePasswordSchema),
  changePasswordController
);

export default router;
