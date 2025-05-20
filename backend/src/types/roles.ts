// Roles in the application
export enum UserRole {
  ADMIN = "admin",
  TEACHER = "teacher",
  STUDENT = "student",
}

// Permissions available in the system
export enum Permission {
  // User management
  VIEW_USERS = "view_users",
  CREATE_USER = "create_user",
  UPDATE_USER = "update_user",
  DELETE_USER = "delete_user",

  // Content management
  VIEW_CONTENT = "view_content",
  CREATE_CONTENT = "create_content",
  UPDATE_CONTENT = "update_content",
  DELETE_CONTENT = "delete_content",

  // Challenge management
  VIEW_CHALLENGES = "view_challenges",
  CREATE_CHALLENGE = "create_challenge",
  UPDATE_CHALLENGE = "update_challenge",
  DELETE_CHALLENGE = "delete_challenge",

  // Quiz management
  VIEW_QUIZZES = "view_quizzes",
  CREATE_QUIZ = "create_quiz",
  UPDATE_QUIZ = "update_quiz",
  DELETE_QUIZ = "delete_quiz",

  // Progress management
  VIEW_OWN_PROGRESS = "view_own_progress",
  UPDATE_OWN_PROGRESS = "update_own_progress",
  VIEW_ANY_PROGRESS = "view_any_progress",

  // System management
  VIEW_SYSTEM_SETTINGS = "view_system_settings",
  UPDATE_SYSTEM_SETTINGS = "update_system_settings",
  VIEW_LOGS = "view_logs",

  // Feedback management
  VIEW_FEEDBACK = "view_feedback",
  RESPOND_TO_FEEDBACK = "respond_to_feedback",
}

// Define permissions for each role
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.TEACHER]: [
    Permission.VIEW_USERS,
    Permission.VIEW_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.VIEW_CHALLENGES,
    Permission.CREATE_CHALLENGE,
    Permission.UPDATE_CHALLENGE,
    Permission.VIEW_QUIZZES,
    Permission.CREATE_QUIZ,
    Permission.UPDATE_QUIZ,
    Permission.VIEW_OWN_PROGRESS,
    Permission.UPDATE_OWN_PROGRESS,
    Permission.VIEW_ANY_PROGRESS,
    Permission.VIEW_FEEDBACK,
    Permission.RESPOND_TO_FEEDBACK,
  ],
  [UserRole.STUDENT]: [
    Permission.VIEW_CONTENT,
    Permission.VIEW_CHALLENGES,
    Permission.VIEW_QUIZZES,
    Permission.VIEW_OWN_PROGRESS,
    Permission.UPDATE_OWN_PROGRESS,
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

// Get all permissions for a role
export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

// User with role information
export interface RoleUser {
  id: string;
  email: string;
  role: UserRole;
  permissions?: Permission[];
}
