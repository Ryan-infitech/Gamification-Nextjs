import { TablesRow, TablesInsert } from "./supabase";

/**
 * Tipe notifikasi dari database
 */
export type Notification = TablesRow<"notifications">;
export type NotificationInsert = TablesInsert<"notifications">;

/**
 * Enum untuk tipe notifikasi
 */
export enum NotificationType {
  ACHIEVEMENT = "achievement_unlock",
  LEVEL_UP = "level_up",
  CHALLENGE_COMPLETE = "challenge_complete",
  CHALLENGE_INVITATION = "challenge_invitation",
  FRIEND_REQUEST = "friend_request",
  SYSTEM = "system",
  WELCOME = "welcome",
  QUIZ_COMPLETE = "quiz_complete",
  MESSAGE = "message",
  ADMIN = "admin",
  ITEM_ACQUIRE = "item_acquire",
  CONTENT_UPDATE = "content_update",
}

/**
 * Interface untuk notifikasi
 */
export interface INotification {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  action_url?: string;
  created_at: string;
}

/**
 * Request untuk menambahkan notifikasi
 */
export interface CreateNotificationRequest {
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
}

/**
 * Request untuk update status notifikasi
 */
export interface UpdateNotificationRequest {
  read?: boolean;
}

/**
 * Request untuk notifikasi massal
 */
export interface BulkNotificationRequest {
  user_ids: string[];
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
}

/**
 * Response untuk daftar notifikasi
 */
export interface NotificationsListResponse {
  notifications: INotification[];
  pagination: {
    total: number;
    unread: number;
    page: number;
    limit: number;
  };
}

/**
 * Interface untuk konfigurasi email
 */
export interface EmailConfig {
  to: string;
  subject?: string;
  template: string;
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

/**
 * Interface untuk template email
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  placeholders: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface untuk notifikasi real-time
 */
export interface RealtimeNotification {
  id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

/**
 * Interface untuk notifikasi socket
 */
export interface SocketNotification {
  userId: string;
  notification: RealtimeNotification;
}

/**
 * Interface untuk statistik notifikasi
 */
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  recentActivity: {
    date: string;
    count: number;
  }[];
}

/**
 * Interface untuk preferensi notifikasi
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    [key in NotificationType]?: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}
