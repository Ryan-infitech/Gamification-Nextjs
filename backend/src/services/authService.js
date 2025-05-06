/**
 * Authentication service
 * Contains business logic for user authentication
 */
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { executeDbOperation } = require("../config/database");
const env = require("../config/env");

/**
 * Generate JWT token for a user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles || ["user"],
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

/**
 * Register a new user
 * @param {String} email - User email
 * @param {String} password - User password
 * @param {String} username - Username
 * @param {String} displayName - User display name
 * @returns {Promise<Object>} Result object with success flag and user/token data
 */
const registerUser = async (email, password, username, displayName = null) => {
  try {
    // Use Supabase for registration
    const result = await executeDbOperation(async (client) => {
      return await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName || username,
          },
        },
      });
    });

    if (result.error) {
      return {
        success: false,
        message: result.error.message,
      };
    }

    const user = result.data.user;
    const token = generateToken(user);

    // For better security, we don't return the password
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || username,
        displayName:
          user.user_metadata?.display_name || displayName || username,
      },
      token,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: "Registration failed: " + error.message,
    };
  }
};

/**
 * Login a user
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Promise<Object>} Result object with success flag and user/token data
 */
const loginUser = async (email, password) => {
  try {
    // Use Supabase for login
    const result = await executeDbOperation(async (client) => {
      return await client.auth.signInWithPassword({
        email,
        password,
      });
    });

    if (result.error) {
      return {
        success: false,
        message: result.error.message,
      };
    }

    const user = result.data.user;
    const token = result.data.session.access_token;

    // Get additional user data from our DB
    const userData = await executeDbOperation(async (client) => {
      return await client
        .from("users")
        .select("*, player_stats(*)")
        .eq("id", user.id)
        .single();
    });

    // For better security, we don't return the password
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: userData.data?.username || user.user_metadata?.username,
        displayName:
          userData.data?.display_name || user.user_metadata?.display_name,
        playerStats: userData.data?.player_stats || null,
      },
      token,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Login failed: " + error.message,
    };
  }
};

/**
 * Get user profile
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Result object with success flag and user data
 */
const getUserProfile = async (userId) => {
  try {
    // Get user from Supabase auth
    const userResult = await executeDbOperation(async (client) => {
      return await client.auth.admin.getUserById(userId);
    }, true);

    if (userResult.error || !userResult.data.user) {
      return {
        success: false,
        message: userResult.error?.message || "User not found",
      };
    }

    // Get additional user data from our DB
    const userData = await executeDbOperation(async (client) => {
      return await client
        .from("users")
        .select("*, player_stats(*)")
        .eq("id", userId)
        .single();
    });

    if (userData.error || !userData.data) {
      return {
        success: false,
        message: userData.error?.message || "User data not found",
      };
    }

    const user = userResult.data.user;

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: userData.data.username,
        displayName: userData.data.display_name,
        avatarUrl: userData.data.avatar_url,
        playerStats: userData.data.player_stats,
      },
    };
  } catch (error) {
    console.error("Get profile error:", error);
    return {
      success: false,
      message: "Failed to get user profile: " + error.message,
    };
  }
};

/**
 * Logout a user
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Result object with success flag
 */
const logoutUser = async (userId) => {
  try {
    // Use Supabase for logout
    const result = await executeDbOperation(async (client) => {
      return await client.auth.signOut();
    });

    if (result.error) {
      return {
        success: false,
        message: result.error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      message: "Logout failed: " + error.message,
    };
  }
};

/**
 * Refresh user token
 * @param {String} refreshToken - Refresh token
 * @returns {Promise<Object>} Result object with success flag and new token
 */
const refreshUserToken = async (refreshToken) => {
  try {
    // Use Supabase to refresh token
    const result = await executeDbOperation(async (client) => {
      return await client.auth.refreshSession({ refresh_token: refreshToken });
    });

    if (result.error) {
      return {
        success: false,
        message: result.error.message,
      };
    }

    return {
      success: true,
      token: result.data.session.access_token,
      refreshToken: result.data.session.refresh_token,
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    return {
      success: false,
      message: "Token refresh failed: " + error.message,
    };
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  refreshUserToken,
  generateToken,
};
