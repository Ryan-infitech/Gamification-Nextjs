import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { supabase } from "../config/database";
import {
  JwtPayload,
  RefreshTokenPayload,
  AuthUser,
  TokenRecord,
  SessionRecord,
  AuthErrorCode,
} from "../types/auth";
import logger from "../config/logger";
import { AuthenticationError } from "../types/error";

/**
 * Generate JWT token untuk user
 * @param user - Data user untuk payload token
 * @returns Token JWT dan expiration time
 */
export const generateToken = (
  user: AuthUser
): { token: string; expiresIn: number } => {
  // Generate unique token identifier
  const jti = crypto.randomBytes(16).toString("hex");

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    verified: user.verified,
    jti,
  };

  // Default expiration time in seconds
  const expiresIn = parseInt(env.JWT_EXPIRES_IN) || 3600; // 1 hour default

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn });

  return { token, expiresIn };
};

/**
 * Generate refresh token untuk user
 * @param userId - ID user
 * @param tokenFamily - ID family untuk deteksi token reuse
 * @returns Refresh token dan database token record
 */
export const generateRefreshToken = async (
  userId: string,
  tokenFamily?: string
): Promise<{ token: string; tokenRecord: TokenRecord }> => {
  // Generate unique token identifier
  const jti = uuidv4();

  // Generate atau gunakan family ID yang sudah ada
  const family = tokenFamily || uuidv4();

  const payload: RefreshTokenPayload = {
    id: userId,
    jti,
    family,
  };

  // Refresh token dengan expiry lebih lama dari access token
  const expiresIn = parseInt(env.JWT_REFRESH_EXPIRES_IN) || 604800; // 7 days default
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn });

  // Compute hash dari token untuk disimpan di database
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Expiry date untuk database
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

  // Simpan token ke database
  const { data, error } = await supabase
    .from("tokens")
    .insert({
      user_id: userId,
      token: tokenHash,
      type: "refresh",
      expires_at: expiresAt.toISOString(),
      used: false,
      revoked: false,
      family_id: family,
    })
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to save refresh token", { error, userId });
    throw new Error("Failed to generate refresh token");
  }

  const tokenRecord: TokenRecord = {
    id: data.id,
    user_id: data.user_id,
    token: data.token,
    type: data.type as "refresh" | "verification" | "reset_password",
    expires_at: new Date(data.expires_at),
    created_at: new Date(data.created_at),
    used: data.used,
    revoked: data.revoked,
    family_id: data.family_id,
  };

  return { token, tokenRecord };
};

/**
 * Verify dan decode JWT token
 * @param token - Token JWT untuk diverifikasi
 * @returns Decoded payload
 */
export const verifyToken = async (token: string): Promise<JwtPayload> => {
  try {
    // Verify signature dan expiration
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Check jika token telah di-revoke di database
    if (decoded.jti) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const { data } = await supabase
        .from("tokens")
        .select("revoked")
        .eq("token", tokenHash)
        .single();

      if (data && data.revoked) {
        throw new AuthenticationError("Token has been revoked", {
          code: AuthErrorCode.SESSION_REVOKED,
        });
      }
    }

    return decoded;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    if ((error as any).name === "TokenExpiredError") {
      throw new AuthenticationError("Token expired", {
        code: AuthErrorCode.TOKEN_EXPIRED,
      });
    }

    throw new AuthenticationError("Invalid token", {
      code: AuthErrorCode.INVALID_TOKEN,
    });
  }
};

/**
 * Verify dan gunakan refresh token
 * @param refreshToken - Refresh token
 * @returns User ID
 */
export const useRefreshToken = async (
  refreshToken: string
): Promise<{
  userId: string;
  family: string;
}> => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as RefreshTokenPayload;

    // Compute hash dari refresh token
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // Get token dari database
    const { data, error } = await supabase
      .from("tokens")
      .select("*")
      .eq("token", tokenHash)
      .eq("type", "refresh")
      .single();

    if (error || !data) {
      throw new AuthenticationError("Invalid refresh token", {
        code: AuthErrorCode.INVALID_TOKEN,
      });
    }

    const tokenRecord: TokenRecord = {
      id: data.id,
      user_id: data.user_id,
      token: data.token,
      type: data.type as "refresh" | "verification" | "reset_password",
      expires_at: new Date(data.expires_at),
      created_at: new Date(data.created_at),
      used: data.used,
      revoked: data.revoked,
      family_id: data.family_id,
    };

    // Check apakah token sudah digunakan (token reuse detection)
    if (tokenRecord.used) {
      // Token reuse detected! Revoke all tokens in this family
      await revokeTokenFamily(tokenRecord.family_id || "");

      throw new AuthenticationError(
        "Token reuse detected. All sessions have been invalidated for security reasons.",
        {
          code: AuthErrorCode.TOKEN_REUSED,
        }
      );
    }

    // Check apakah token sudah di-revoke
    if (tokenRecord.revoked) {
      throw new AuthenticationError("Token has been revoked", {
        code: AuthErrorCode.SESSION_REVOKED,
      });
    }

    // Check apakah token sudah expired
    if (tokenRecord.expires_at < new Date()) {
      throw new AuthenticationError("Refresh token expired", {
        code: AuthErrorCode.TOKEN_EXPIRED,
      });
    }

    // Mark token as used
    await supabase
      .from("tokens")
      .update({ used: true })
      .eq("id", tokenRecord.id);

    return {
      userId: tokenRecord.user_id,
      family: tokenRecord.family_id || "",
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    logger.error("Refresh token verification failed", { error });

    throw new AuthenticationError("Invalid refresh token", {
      code: AuthErrorCode.INVALID_TOKEN,
    });
  }
};

/**
 * Revoke all tokens in a family (untuk security breach)
 * @param familyId - ID family token
 */
export const revokeTokenFamily = async (familyId: string): Promise<void> => {
  await supabase
    .from("tokens")
    .update({ revoked: true })
    .eq("family_id", familyId);

  logger.warn("Token family revoked", { familyId });
};

/**
 * Revoke specific token
 * @param token - Token to revoke
 */
export const revokeToken = async (token: string): Promise<void> => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await supabase
    .from("tokens")
    .update({ revoked: true })
    .eq("token", tokenHash);
};

/**
 * Revoke all tokens for a user
 * @param userId - User ID
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await supabase
    .from("tokens")
    .update({ revoked: true })
    .eq("user_id", userId)
    .eq("type", "refresh");

  logger.info("All user tokens revoked", { userId });
};

/**
 * Create atau update user session
 * @param userId - User ID
 * @param tokenFamily - Token family ID
 * @param req - Express request object
 * @returns Session record
 */
export const createSession = async (
  userId: string,
  tokenFamily: string,
  ip: string,
  userAgent: string
): Promise<SessionRecord> => {
  // Default session expiry (30 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Check apakah session sudah ada
  const { data: existingSession } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("token_family", tokenFamily)
    .eq("is_valid", true)
    .single();

  if (existingSession) {
    // Update session yang ada
    const { data, error } = await supabase
      .from("sessions")
      .update({
        ip_address: ip,
        user_agent: userAgent,
        last_active_at: new Date().toISOString(),
      })
      .eq("id", existingSession.id)
      .select("*")
      .single();

    if (error) {
      logger.error("Failed to update session", { error, userId });
      throw new Error("Failed to update session");
    }

    return {
      id: data.id,
      user_id: data.user_id,
      token_family: data.token_family,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      expires_at: new Date(data.expires_at),
      created_at: new Date(data.created_at),
      last_active_at: new Date(data.last_active_at),
      is_valid: data.is_valid,
    };
  }

  // Buat session baru
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      token_family: tokenFamily,
      ip_address: ip,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString(),
      last_active_at: new Date().toISOString(),
      is_valid: true,
    })
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to create session", { error, userId });
    throw new Error("Failed to create session");
  }

  return {
    id: data.id,
    user_id: data.user_id,
    token_family: data.token_family,
    ip_address: data.ip_address,
    user_agent: data.user_agent,
    expires_at: new Date(data.expires_at),
    created_at: new Date(data.created_at),
    last_active_at: new Date(data.last_active_at),
    is_valid: data.is_valid,
  };
};

/**
 * Invalidate session
 * @param tokenFamily - Token family ID
 */
export const invalidateSession = async (tokenFamily: string): Promise<void> => {
  await supabase
    .from("sessions")
    .update({ is_valid: false })
    .eq("token_family", tokenFamily);

  // Revoke all tokens in this family
  await revokeTokenFamily(tokenFamily);
};

/**
 * Invalidate all sessions for a user
 * @param userId - User ID
 */
export const invalidateAllUserSessions = async (
  userId: string
): Promise<void> => {
  await supabase
    .from("sessions")
    .update({ is_valid: false })
    .eq("user_id", userId);

  // Revoke all tokens
  await revokeAllUserTokens(userId);
};

/**
 * Clean up expired sessions and tokens
 * This should be run periodically via a cron job
 */
export const cleanupExpiredSessionsAndTokens = async (): Promise<void> => {
  const now = new Date().toISOString();

  // Clean up expired sessions
  await supabase
    .from("sessions")
    .update({ is_valid: false })
    .lt("expires_at", now);

  // Clean up expired tokens
  await supabase.from("tokens").update({ revoked: true }).lt("expires_at", now);

  logger.info("Expired sessions and tokens cleaned up");
};
