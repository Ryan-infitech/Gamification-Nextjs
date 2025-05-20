import { Request } from "express";
import { UserRole } from "./roles";
import { TablesRow } from "./supabase";

/**
 * Interface untuk user yang terauthentikasi
 */
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  displayName?: string;
  verified: boolean;
}

/**
 * Extended Request dengan informasi user terauthentikasi
 */
export interface AuthRequest extends Request {
  user?: AuthUser;
  token?: string;
}

/**
 * Payload yang disimpan dalam JWT token
 */
export interface JwtPayload {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  verified: boolean;
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID, unik untuk setiap token
}

/**
 * Payload untuk refresh token
 */
export interface RefreshTokenPayload {
  id: string;
  jti: string; // Token ID
  family: string; // Family ID untuk deteksi token reuse
  iat?: number;
  exp?: number;
}

/**
 * Data untuk login
 */
export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Data untuk registrasi
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

/**
 * Data untuk reset password
 */
export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Data untuk verifikasi email
 */
export interface VerifyEmailData {
  token: string;
}

/**
 * Data untuk request reset password
 */
export interface ForgotPasswordData {
  email: string;
}

/**
 * Data untuk request change password
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Token dalam database
 */
export interface TokenRecord {
  id: string;
  user_id: string;
  token: string;
  type: "refresh" | "verification" | "reset_password";
  expires_at: Date;
  created_at: Date;
  used: boolean;
  revoked: boolean;
  family_id?: string;
}

/**
 * Output dari proses autentikasi
 */
export interface AuthResult {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Session dalam database
 */
export interface SessionRecord {
  id: string;
  user_id: string;
  token_family: string;
  ip_address: string;
  user_agent: string;
  expires_at: Date;
  created_at: Date;
  last_active_at: Date;
  is_valid: boolean;
}

/**
 * Info hasil login/register untuk response
 */
export interface AuthResponseData {
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    displayName?: string;
    verified: boolean;
  };
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Fungsi untuk mengkonversi database user ke AuthUser
 */
export function mapDbUserToAuthUser(user: TablesRow<"users">): AuthUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as UserRole,
    displayName: user.display_name || undefined,
    verified: user.verified,
  };
}

/**
 * Enum untuk error codes autentikasi
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_IN_USE = "EMAIL_IN_USE",
  USERNAME_IN_USE = "USERNAME_IN_USE",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  PASSWORD_MISMATCH = "PASSWORD_MISMATCH",
  ACCOUNT_NOT_VERIFIED = "ACCOUNT_NOT_VERIFIED",
  WEAK_PASSWORD = "WEAK_PASSWORD",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SESSION_REVOKED = "SESSION_REVOKED",
  NOT_AUTHENTICATED = "NOT_AUTHENTICATED",
  NOT_AUTHORIZED = "NOT_AUTHORIZED",
  TOKEN_REUSED = "TOKEN_REUSED",
}
