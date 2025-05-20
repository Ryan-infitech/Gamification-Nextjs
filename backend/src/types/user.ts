import { UserRole, Permission } from "./roles";
import { TablesRow, TablesInsert, TablesUpdate } from "./supabase";

/**
 * Tipe untuk user yang disimpan di database
 */
export type User = TablesRow<"users">;
export type UserInsert = TablesInsert<"users">;
export type UserUpdate = TablesUpdate<"users">;

/**
 * Tipe untuk profile user yang disimpan di database
 */
export type UserProfile = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  verified: boolean;
  login_streak: number;
  created_at: string;
  updated_at: string;
};

/**
 * Tipe untuk user preferences
 */
export type UserPreferences = TablesRow<"user_preferences">;
export type UserPreferencesUpdate = Partial<{
  theme: "light" | "dark" | "system";
  language: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sound_enabled: boolean;
  music_volume: number;
  sfx_volume: number;
  ui_scale: number;
  accessibility_options: {
    high_contrast: boolean;
    large_text: boolean;
    reduced_motion: boolean;
    screen_reader_optimized: boolean;
  };
}>;

/**
 * Tipe untuk player stats
 */
export type PlayerStats = TablesRow<"player_stats">;
export type PlayerStatsUpdate = Partial<{
  level: number;
  experience: number;
  coins: number;
  health: number;
  strength: number;
  intelligence: number;
  agility: number;
  current_map: string;
  last_position_x: number;
  last_position_y: number;
  playtime_minutes: number;
}>;

/**
 * Tipe untuk game progress
 */
export type GameProgress = TablesRow<"game_progress">;
export type GameProgressUpdate = Partial<{
  current_chapter: number;
  current_level: number;
  unlocked_zones: string[];
  completed_levels: string[];
  saved_position_data: Record<string, any>;
}>;

/**
 * Interface untuk user roles
 */
export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  permissions: Permission[];
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
}

/**
 * Interface untuk request user creation dari admin
 */
export interface AdminUserCreateRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  displayName?: string;
  verified?: boolean;
}

/**
 * Interface untuk request update user dari admin
 */
export interface AdminUserUpdateRequest {
  username?: string;
  email?: string;
  role?: UserRole;
  displayName?: string;
  bio?: string;
  verified?: boolean;
  password?: string;
}

/**
 * Interface untuk request update profile dari user
 */
export interface ProfileUpdateRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
}

/**
 * Interface untuk response list users
 */
export interface UsersListResponse {
  users: UserProfile[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Filter untuk pencarian user
 */
export interface UserSearchFilters {
  query?: string;
  role?: UserRole;
  verified?: boolean;
  sortBy?: "username" | "created_at" | "login_streak";
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

/**
 * Interface untuk user activity log
 */
export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  details?: Record<string, any>;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Enum untuk tipe user activity
 */
export enum UserActivityType {
  LOGIN = "login",
  LOGOUT = "logout",
  REGISTER = "register",
  PROFILE_UPDATE = "profile_update",
  PASSWORD_CHANGE = "password_change",
  EMAIL_VERIFICATION = "email_verification",
  CHALLENGE_COMPLETE = "challenge_complete",
  QUIZ_COMPLETE = "quiz_complete",
  ACHIEVEMENT_UNLOCK = "achievement_unlock",
  LEVEL_UP = "level_up",
  ITEM_ACQUIRE = "item_acquire",
  CONTENT_VIEW = "content_view",
  ADMIN_ACTION = "admin_action",
}

/**
 * Tipe untuk error terkait user management
 */
export enum UserErrorType {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS",
  INVALID_ROLE = "INVALID_ROLE",
  INVALID_PERMISSIONS = "INVALID_PERMISSIONS",
  CANNOT_DELETE_SELF = "CANNOT_DELETE_SELF",
  CANNOT_MODIFY_ADMIN = "CANNOT_MODIFY_ADMIN",
  LAST_ADMIN_DELETE = "LAST_ADMIN_DELETE",
}

/**
 * Helper function untuk mapping DB user ke UserProfile untuk response API
 */
export function mapUserToProfile(user: User): UserProfile {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as UserRole,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    verified: user.verified,
    login_streak: user.login_streak,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
