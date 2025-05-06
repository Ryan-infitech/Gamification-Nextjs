/**
 * Authentication controller
 * Handles HTTP requests for authentication operations
 */
const { validationResult } = require("express-validator");
const authService = require("../services/authService");
const { ApiError } = require("../middleware/errorHandler");

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest("Validation failed", errors.array()));
    }

    const { email, password, username, displayName } = req.body;

    // Register user via auth service
    const result = await authService.registerUser(
      email,
      password,
      username,
      displayName
    );

    if (!result.success) {
      return next(ApiError.badRequest(result.message || "Registration failed"));
    }

    // Return user data and token
    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest("Validation failed", errors.array()));
    }

    const { email, password } = req.body;

    // Login user via auth service
    const result = await authService.loginUser(email, password);

    if (!result.success) {
      return next(
        ApiError.unauthorized(result.message || "Invalid credentials")
      );
    }

    // Return user data and token
    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Not authenticated"));
    }

    // Get user profile via auth service
    const result = await authService.getUserProfile(req.user.id);

    if (!result.success) {
      return next(ApiError.notFound(result.message || "User not found"));
    }

    // Return user profile
    res.status(200).json({
      status: "success",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out the current user
 * @route POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Not authenticated"));
    }

    // Logout user via auth service
    const result = await authService.logoutUser(req.user.id);

    res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh user token
 * @route POST /api/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(ApiError.badRequest("Refresh token is required"));
    }

    // Refresh token via auth service
    const result = await authService.refreshUserToken(refreshToken);

    if (!result.success) {
      return next(
        ApiError.unauthorized(result.message || "Invalid refresh token")
      );
    }

    // Return new token
    res.status(200).json({
      status: "success",
      data: {
        token: result.token,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout,
  refreshToken,
};
