import { Request, Response, NextFunction } from "express";
import { AuthRequest, AuthErrorCode, JwtPayload } from "../types/auth";
import { AuthenticationError, AuthorizationError } from "../types/error";
import { verifyToken } from "../services/sessionService";
import logger from "../config/logger";
import { env } from "../config/env";

/**
 * Middleware untuk memverifikasi token JWT pada request
 * Token dapat dari:
 * 1. Authorization header (Bearer token)
 * 2. Cookie named auth-token
 * 3. Query parameter token (hanya untuk non-production)
 */
export const authenticateJwt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Cek dari Authorization header
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // Cek dari cookie
      token = req.cookies[env.AUTH_COOKIE_NAME];
    }

    // Cek query parameter (hanya di development mode)
    if (!token && env.NODE_ENV !== "production") {
      token = req.query.token as string;
    }

    if (!token) {
      throw new AuthenticationError(
        "Authentication required. No token provided."
      );
    }

    // Verifikasi token
    const decodedToken = await verifyToken(token);

    // Simpan data user dan token ke request
    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      username: decodedToken.username,
      role: decodedToken.role,
      verified: decodedToken.verified,
    };

    req.token = token;

    next();
  } catch (error) {
    logger.warn("Authentication failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      ip: req.ip,
      path: req.path,
    });

    // Handle berbagai jenis error autentikasi
    if (error instanceof AuthenticationError) {
      return next(error);
    }

    if ((error as any).name === "TokenExpiredError") {
      return next(
        new AuthenticationError("Token expired. Please log in again.")
      );
    }

    if ((error as any).name === "JsonWebTokenError") {
      return next(
        new AuthenticationError("Invalid token. Please log in again.")
      );
    }

    return next(
      new AuthenticationError("Authentication failed. Please log in again.")
    );
  }
};

/**
 * Middleware opsional yang tidak menolak request tanpa token,
 * tapi tetap memproses data user jika token tersedia
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies[env.AUTH_COOKIE_NAME];
    }

    if (!token) {
      return next(); // Lanjut tanpa error jika tidak ada token
    }

    const decodedToken = await verifyToken(token);

    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      username: decodedToken.username,
      role: decodedToken.role,
      verified: decodedToken.verified,
    };

    req.token = token;

    return next();
  } catch (error) {
    // Jika token tidak valid, lanjut tanpa error tapi tanpa set user
    return next();
  }
};

/**
 * Middleware untuk memastikan user telah memverifikasi email
 */
export const requireVerified = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AuthenticationError("Authentication required."));
  }

  if (!req.user.verified) {
    return next(
      new AuthenticationError(
        "Email verification required. Please verify your email before proceeding.",
        { code: AuthErrorCode.ACCOUNT_NOT_VERIFIED }
      )
    );
  }

  next();
};

/**
 * Middleware untuk menolak akses jika user terautentikasi
 * Berguna untuk halaman login/register yang hanya untuk user yang belum login
 */
export const blockAuthenticated = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    return res.status(403).json({
      success: false,
      message: "Already authenticated. Please logout first.",
    });
  }

  next();
};
