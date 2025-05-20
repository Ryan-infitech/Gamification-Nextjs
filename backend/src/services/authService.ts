import bcrypt from "bcryptjs";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../config/database";
import {
  AuthResult,
  AuthUser,
  LoginData,
  RegisterData,
  ResetPasswordData,
  VerifyEmailData,
  ForgotPasswordData,
  ChangePasswordData,
  mapDbUserToAuthUser,
  AuthErrorCode,
} from "../types/auth";
import {
  generateToken,
  generateRefreshToken,
  useRefreshToken,
  createSession,
  revokeAllUserTokens,
} from "./sessionService";
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
} from "../types/error";
import logger from "../config/logger";
import { UserRole, Permission } from "../types/roles";
import { sendEmail } from "../config/email";
import { env } from "../config/env";
import { TablesRow } from "../types/supabase";

/**
 * Handle user login
 * @param loginData - Email and password
 * @param ipAddress - IP address of client
 * @param userAgent - User agent string
 * @returns Auth result with user data and tokens
 */
export const login = async (
  loginData: LoginData,
  ipAddress: string,
  userAgent: string
): Promise<AuthResult> => {
  const { email, password, rememberMe = false } = loginData;

  // Find user by email
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error || !user) {
    logger.warn("Login attempt failed: User not found", { email });
    throw new AuthenticationError("Invalid email or password", {
      code: AuthErrorCode.INVALID_CREDENTIALS,
    });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    logger.warn("Login attempt failed: Invalid password", { email });
    throw new AuthenticationError("Invalid email or password", {
      code: AuthErrorCode.INVALID_CREDENTIALS,
    });
  }

  // Convert DB user to AuthUser
  const authUser = mapDbUserToAuthUser(user);

  // Generate access token
  const { token, expiresIn } = generateToken(authUser);

  // Generate refresh token if remember me is enabled
  let refreshToken: string | undefined;

  if (rememberMe) {
    const refreshTokenResult = await generateRefreshToken(user.id);
    refreshToken = refreshTokenResult.token;

    // Create session record
    await createSession(
      user.id,
      refreshTokenResult.tokenRecord.family_id || "",
      ipAddress,
      userAgent
    );
  }

  // Update user login streak
  await updateLoginStreak(user);

  // Log successful login
  logger.info("User logged in successfully", {
    userId: user.id,
    email: user.email,
    role: user.role,
    ipAddress,
    userAgent: userAgent.substring(0, 255), // Truncate if too long
  });

  // Return auth result
  return {
    user: authUser,
    token,
    refreshToken,
    expiresIn,
  };
};

/**
 * Handle user registration
 * @param registerData - Registration data
 * @returns Auth result with user data and tokens
 */
export const register = async (
  registerData: RegisterData,
  ipAddress: string,
  userAgent: string
): Promise<AuthResult> => {
  const { username, email, password, role } = registerData;

  // Check email availability
  const { data: existingEmail } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (existingEmail) {
    throw new ConflictError("Email already in use", {
      code: AuthErrorCode.EMAIL_IN_USE,
    });
  }

  // Check username availability
  const { data: existingUsername } = await supabase
    .from("users")
    .select("id")
    .eq("username", username.trim())
    .single();

  if (existingUsername) {
    throw new ConflictError("Username already in use", {
      code: AuthErrorCode.USERNAME_IN_USE,
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Default to student role if attempting to register as admin
  const safeRole: UserRole = role === "admin" ? "student" : role;

  // Create user
  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      role: safeRole,
      verification_token: verificationToken,
      verified: false, // Require email verification
    })
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to register user", { error, email });
    throw new Error("Failed to register user");
  }

  // Send verification email
  await sendVerificationEmail(newUser);

  // Convert DB user to AuthUser
  const authUser = mapDbUserToAuthUser(newUser);

  // Generate access token
  const { token, expiresIn } = generateToken(authUser);

  // Generate refresh token
  const refreshTokenResult = await generateRefreshToken(newUser.id);
  const refreshToken = refreshTokenResult.token;

  // Create session record
  await createSession(
    newUser.id,
    refreshTokenResult.tokenRecord.family_id || "",
    ipAddress,
    userAgent
  );

  // Log successful registration
  logger.info("User registered successfully", {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  return {
    user: authUser,
    token,
    refreshToken,
    expiresIn,
  };
};

/**
 * Refresh access token using refresh token
 * @param currentRefreshToken - Current refresh token
 * @param ipAddress - IP address of client
 * @param userAgent - User agent string
 * @returns New auth result with new tokens
 */
export const refreshToken = async (
  currentRefreshToken: string,
  ipAddress: string,
  userAgent: string
): Promise<AuthResult> => {
  try {
    // Use the refresh token
    const { userId, family } = await useRefreshToken(currentRefreshToken);

    // Get user data
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      logger.error("User not found during token refresh", { userId });
      throw new AuthenticationError("User not found", {
        code: AuthErrorCode.USER_NOT_FOUND,
      });
    }

    // Convert DB user to AuthUser
    const authUser = mapDbUserToAuthUser(user);

    // Generate new access token
    const { token, expiresIn } = generateToken(authUser);

    // Generate new refresh token (rotation)
    const refreshTokenResult = await generateRefreshToken(userId, family);
    const newRefreshToken = refreshTokenResult.token;

    // Update session
    await createSession(userId, family, ipAddress, userAgent);

    // Return new tokens
    return {
      user: authUser,
      token,
      refreshToken: newRefreshToken,
      expiresIn,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    logger.error("Error refreshing token", { error });
    throw new AuthenticationError("Failed to refresh token");
  }
};

/**
 * Logout user by revoking their tokens
 * @param userId - User ID
 * @param token - Current token to revoke
 */
export const logout = async (userId: string, token?: string): Promise<void> => {
  try {
    // Revoke all user tokens for complete logout
    await revokeAllUserTokens(userId);

    logger.info("User logged out", { userId });
  } catch (error) {
    logger.error("Error during logout", { error, userId });
    throw new Error("Failed to logout");
  }
};

/**
 * Request password reset
 * @param forgotPasswordData - Email address
 */
export const forgotPassword = async (
  forgotPasswordData: ForgotPasswordData
): Promise<void> => {
  const { email } = forgotPasswordData;

  // Find user by email
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error || !user) {
    // Don't reveal if email exists or not for security
    logger.info("Password reset requested for non-existent email", { email });
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Set expiration (1 hour)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Save token to database
  await supabase
    .from("users")
    .update({
      reset_password_token: resetToken,
      reset_password_expires: expiresAt.toISOString(),
    })
    .eq("id", user.id);

  // Also save to tokens table for better tracking
  await supabase.from("tokens").insert({
    user_id: user.id,
    token: resetToken,
    type: "reset_password",
    expires_at: expiresAt.toISOString(),
    used: false,
    revoked: false,
  });

  // Send password reset email
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    template: "password_reset",
    context: {
      name: user.display_name || user.username,
      reset_url: resetUrl,
      expiry_hours: "1",
    },
  });

  logger.info("Password reset email sent", {
    userId: user.id,
    email: user.email,
  });
};

/**
 * Reset password using token
 * @param resetPasswordData - Reset data
 */
export const resetPassword = async (
  resetPasswordData: ResetPasswordData
): Promise<void> => {
  const { token, password } = resetPasswordData;

  // Find user by reset token
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("reset_password_token", token)
    .single();

  if (error || !user) {
    logger.warn("Invalid password reset token", { token });
    throw new AuthenticationError("Invalid or expired token", {
      code: AuthErrorCode.INVALID_TOKEN,
    });
  }

  // Check if token is expired
  const tokenExpiry = new Date(user.reset_password_expires || "");
  if (tokenExpiry < new Date()) {
    logger.warn("Expired password reset token", { token, userId: user.id });
    throw new AuthenticationError("Token has expired", {
      code: AuthErrorCode.TOKEN_EXPIRED,
    });
  }

  // Check token in tokens table too
  const { data: tokenRecord } = await supabase
    .from("tokens")
    .select("*")
    .eq("token", token)
    .eq("type", "reset_password")
    .eq("used", false)
    .eq("revoked", false)
    .single();

  if (!tokenRecord) {
    logger.warn("Reset token not found or already used", {
      token,
      userId: user.id,
    });
    throw new AuthenticationError("Invalid or expired token", {
      code: AuthErrorCode.INVALID_TOKEN,
    });
  }

  // Mark token as used
  await supabase.from("tokens").update({ used: true }).eq("id", tokenRecord.id);

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Update password
  await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      reset_password_token: null,
      reset_password_expires: null,
    })
    .eq("id", user.id);

  // Invalidate all user sessions for security
  await revokeAllUserTokens(user.id);

  logger.info("Password reset successful", { userId: user.id });

  // Send password change notification email
  await sendEmail({
    to: user.email,
    template: "password_changed",
    context: {
      name: user.display_name || user.username,
    },
  });
};

/**
 * Verify email address
 * @param verifyEmailData - Verification data
 */
export const verifyEmail = async (
  verifyEmailData: VerifyEmailData
): Promise<void> => {
  const { token } = verifyEmailData;

  // Find user by verification token
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("verification_token", token)
    .single();

  if (error || !user) {
    logger.warn("Invalid email verification token", { token });
    throw new AuthenticationError("Invalid verification token", {
      code: AuthErrorCode.INVALID_TOKEN,
    });
  }

  if (user.verified) {
    // Email already verified
    return;
  }

  // Update user verified status
  await supabase
    .from("users")
    .update({
      verified: true,
      verification_token: null,
    })
    .eq("id", user.id);

  logger.info("Email verified successfully", {
    userId: user.id,
    email: user.email,
  });

  // Send welcome email
  await sendEmail({
    to: user.email,
    template: "welcome",
    context: {
      name: user.display_name || user.username,
      login_url: `${env.CLIENT_URL}/login`,
    },
  });
};

/**
 * Change user password (when logged in)
 * @param userId - User ID
 * @param changePasswordData - Change password data
 */
export const changePassword = async (
  userId: string,
  changePasswordData: ChangePasswordData
): Promise<void> => {
  const { currentPassword, newPassword } = changePasswordData;

  // Find user
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !user) {
    logger.error("User not found during password change", { userId });
    throw new AuthenticationError("User not found", {
      code: AuthErrorCode.USER_NOT_FOUND,
    });
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(
    currentPassword,
    user.password_hash
  );
  if (!isValidPassword) {
    logger.warn("Invalid current password during password change", { userId });
    throw new AuthenticationError("Current password is incorrect", {
      code: AuthErrorCode.INVALID_CREDENTIALS,
    });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  // Update password
  await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
    })
    .eq("id", userId);

  logger.info("Password changed successfully", { userId });

  // Send password change notification email
  await sendEmail({
    to: user.email,
    template: "password_changed",
    context: {
      name: user.display_name || user.username,
    },
  });
};

/**
 * Resend verification email
 * @param userId - User ID
 */
export const resendVerificationEmail = async (
  userId: string
): Promise<void> => {
  // Find user
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !user) {
    logger.error("User not found during resend verification", { userId });
    throw new AuthenticationError("User not found", {
      code: AuthErrorCode.USER_NOT_FOUND,
    });
  }

  if (user.verified) {
    logger.info("Email already verified, no need to resend", { userId });
    throw new ValidationError("Email already verified", {
      verified: ["Email is already verified"],
    });
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Update verification token
  await supabase
    .from("users")
    .update({
      verification_token: verificationToken,
    })
    .eq("id", userId);

  // Send verification email
  await sendVerificationEmail({
    ...user,
    verification_token: verificationToken,
  });

  logger.info("Verification email resent", { userId, email: user.email });
};

/**
 * Helper function to send verification email
 * @param user - User object
 */
const sendVerificationEmail = async (
  user: TablesRow<"users">
): Promise<void> => {
  const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${user.verification_token}`;

  await sendEmail({
    to: user.email,
    template: "email_verification",
    context: {
      name: user.display_name || user.username,
      verification_url: verificationUrl,
    },
  });

  logger.info("Verification email sent", {
    userId: user.id,
    email: user.email,
  });
};

/**
 * Update user login streak
 * @param user - User object
 */
const updateLoginStreak = async (user: TablesRow<"users">): Promise<void> => {
  const now = new Date();
  const lastLogin = new Date(user.updated_at);

  // Check if last login was yesterday (within 48 hours but not same day)
  const isWithin48Hours =
    now.getTime() - lastLogin.getTime() < 48 * 60 * 60 * 1000;
  const isSameDay = now.toDateString() === lastLogin.toDateString();
  const isYesterday = isWithin48Hours && !isSameDay;

  let newStreak = user.login_streak;

  if (isYesterday) {
    // Increment streak if logged in yesterday
    newStreak += 1;
  } else if (!isSameDay) {
    // Reset streak if not logged in yesterday and not same day
    newStreak = 1;
  }

  // Only update if streak changed
  if (newStreak !== user.login_streak) {
    await supabase
      .from("users")
      .update({
        login_streak: newStreak,
      })
      .eq("id", user.id);

    // Check if achievement should be triggered based on login streak
    if ([3, 7, 14, 30, 60, 90, 180, 365].includes(newStreak)) {
      logger.info("Login streak achievement triggered", {
        userId: user.id,
        streak: newStreak,
      });

      // This could trigger achievement notification or other reward systems
      // Implement as needed
    }
  }
};
