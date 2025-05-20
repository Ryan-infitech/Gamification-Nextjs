import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { env } from "../config/env";

// Interface for the extended request with CSRF token
export interface CSRFRequest extends Request {
  csrfToken?: () => string;
}

/**
 * Generates a random token for CSRF protection
 */
const generateToken = (size: number = 64): string => {
  return randomBytes(size).toString("hex");
};

/**
 * Validates the CSRF token
 * Compares the token from the request header with the token from the session
 */
const validateToken = (req: CSRFRequest, token: string): boolean => {
  // Mendapatkan CSRF token dari request header
  const headerToken = req.headers["x-csrf-token"] as string;

  // Jika tidak ada token, validasi gagal
  if (!headerToken || !token) {
    return false;
  }

  // Bandingkan token dari header dengan token yang tersimpan
  return headerToken === token;
};

/**
 * Middleware untuk menggenerate dan menyimpan CSRF token
 * Token akan disimpan di session dan juga direturn sebagai function di request object
 */
export const csrfProtection = (
  sessionKey: string = "csrfToken",
  headerName: string = "x-csrf-token"
) => {
  return (req: CSRFRequest, res: Response, next: NextFunction) => {
    // Skip CSRF protection pada environment test
    if (env.NODE_ENV === "test") {
      req.csrfToken = () => "test-csrf-token";
      return next();
    }

    // Ensure we have session
    if (!req.session) {
      return next(new Error("CSRF requires session middleware"));
    }

    // Get existing token or create a new one
    let token = (req.session as any)[sessionKey];
    if (!token) {
      token = generateToken();
      (req.session as any)[sessionKey] = token;
    }

    // Set the CSRF token generation function
    req.csrfToken = () => token;

    // Set csrf token cookie for SPA applications
    res.cookie("csrf-token", token, {
      httpOnly: false, // Perlu diakses oleh JavaScript
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Skip validation for non-mutating methods
    const ignoreMethods = ["GET", "HEAD", "OPTIONS"];
    if (ignoreMethods.includes(req.method)) {
      return next();
    }

    // Validate token for mutating methods
    if (!validateToken(req, token)) {
      return res.status(403).json({
        success: false,
        message: "CSRF token validation failed",
      });
    }

    next();
  };
};

/**
 * Express middleware yang hanya melakukan CSRF validation
 * Berguna untuk API endpoints yang membutuhkan CSRF validation tapi tidak menggenerate token baru
 */
export const validateCSRF = (sessionKey: string = "csrfToken") => {
  return (req: CSRFRequest, res: Response, next: NextFunction) => {
    // Skip pada environment test
    if (env.NODE_ENV === "test") {
      return next();
    }

    // Ensure we have session
    if (!req.session) {
      return next(new Error("CSRF requires session middleware"));
    }

    const token = (req.session as any)[sessionKey];

    // Skip validation for non-mutating methods
    const ignoreMethods = ["GET", "HEAD", "OPTIONS"];
    if (ignoreMethods.includes(req.method)) {
      return next();
    }

    // Validate token for mutating methods
    if (!validateToken(req, token)) {
      return res.status(403).json({
        success: false,
        message: "CSRF token validation failed",
      });
    }

    next();
  };
};

/**
 * Contoh penggunaan:
 *
 * // Di app.ts/server.ts (global setup)
 * import { csrfProtection } from './middleware/csrf';
 * import session from 'express-session';
 *
 * app.use(session({ ... })); // Setup session dulu
 * app.use(csrfProtection()); // Kemudian CSRF protection
 *
 * // Di route tertentu yang membutuhkan CSRF protection:
 * import { validateCSRF } from './middleware/csrf';
 *
 * router.post('/sensitive-action', validateCSRF(), controller.action);
 */
