/**
 * Authentication middleware
 * Verifies JWT tokens and protects routes
 */
const jwt = require("jsonwebtoken");
const { ApiError } = require("./errorHandler");
const env = require("../config/env");
const { supabase } = require("../config/database");

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(ApiError.unauthorized("No token provided"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(ApiError.unauthorized("Invalid token format"));
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      req.user = decoded;

      // Optionally verify with Supabase as well
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        return next(ApiError.unauthorized("Invalid or expired token"));
      }

      // Add user data to request
      req.user.supabaseUser = data.user;
      next();
    } catch (err) {
      return next(ApiError.unauthorized("Invalid or expired token"));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if the user has the required role
 * @param {String|Array} roles - Required role(s)
 * @returns {Function} Middleware function
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    const userRoles = req.user.roles || [];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't block the request if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      req.user = decoded;

      // Optionally verify with Supabase
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        req.user.supabaseUser = data.user;
      }
    } catch (err) {
      // Token invalid but we don't block the request
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  authorizeRoles,
  optionalAuth,
};
