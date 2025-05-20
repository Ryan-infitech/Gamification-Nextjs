import { supabase } from "../config/database";
import logger from "../config/logger";
import emailService from "../config/email";
import { Server as SocketServer } from "socket.io";

// Interface untuk notifikasi
export interface Notification {
  id?: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read?: boolean;
  data?: Record<string, any>;
  action_url?: string;
  created_at?: string;
}

// Tipe notifikasi yang tersedia
export enum NotificationType {
  ACHIEVEMENT = "achievement",
  CHALLENGE = "challenge",
  FRIEND = "friend",
  SYSTEM = "system",
  QUIZ = "quiz",
  CONTENT = "content",
  ADMIN = "admin",
  COMMENT = "comment",
  LEVEL_UP = "level_up",
}

// Socket.io instance untuk realtime notifications
let io: SocketServer | null = null;

/**
 * Set socket.io instance untuk notifikasi realtime
 */
export const setSocketInstance = (socketIo: SocketServer) => {
  io = socketIo;
};

/**
 * Mengirim notifikasi ke user via berbagai channel (database, websocket, email)
 */
export const sendNotification = async (
  notification: Notification,
  options: {
    saveToDb?: boolean;
    sendSocket?: boolean;
    sendEmail?: boolean;
    emailOptions?: {
      template?: string;
      subject?: string;
    };
  } = {}
): Promise<string | null> => {
  const {
    saveToDb = true,
    sendSocket = true,
    sendEmail = false,
    emailOptions = {},
  } = options;

  try {
    let notificationId: string | null = null;

    // 1. Save to database if requested
    if (saveToDb) {
      const { data, error } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: notification.user_id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            read: false,
            data: notification.data || null,
            action_url: notification.action_url || null,
          },
        ])
        .select("id")
        .single();

      if (error) {
        logger.error("Failed to save notification to database", {
          notification,
          error,
        });
      } else {
        notificationId = data.id;
        logger.debug("Notification saved to database", { notificationId });
      }
    }

    // 2. Send via socket.io if available and requested
    if (sendSocket && io) {
      // Assuming we have a user-specific channel based on userId
      const userChannel = `user:${notification.user_id}`;

      // Emit to user's channel
      io.to(userChannel).emit("notification", {
        id: notificationId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        action_url: notification.action_url,
        created_at: new Date().toISOString(),
      });

      logger.debug("Notification emitted via socket.io", { userChannel });
    }

    // 3. Send email if requested
    if (sendEmail) {
      // Fetch user email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email, display_name, username")
        .eq("id", notification.user_id)
        .single();

      if (userError) {
        logger.error("Failed to fetch user for email notification", {
          userId: notification.user_id,
          error: userError,
        });
      } else if (userData) {
        // Fetch user preferences to check if email notifications are enabled
        const { data: prefData } = await supabase
          .from("user_preferences")
          .select("email_notifications")
          .eq("user_id", notification.user_id)
          .single();

        // Only send if email notifications are enabled (default to true if no preference set)
        const emailNotificationsEnabled =
          prefData?.email_notifications !== false;

        if (emailNotificationsEnabled) {
          // Prepare email options
          const emailContext = {
            name: userData.display_name || userData.username,
            title: notification.title,
            message: notification.message,
            action_url: notification.action_url,
            ...notification.data,
          };

          // Determine email template based on notification type
          const templateName =
            emailOptions.template ||
            getEmailTemplateForNotificationType(notification.type);

          // Send email
          const emailSent = await emailService.sendEmail({
            to: userData.email,
            template: templateName,
            subject: emailOptions.subject || notification.title,
            context: emailContext,
          });

          if (emailSent) {
            logger.debug("Notification email sent", {
              email: userData.email,
              template: templateName,
            });
          } else {
            logger.warn("Failed to send notification email", {
              email: userData.email,
            });
          }
        } else {
          logger.debug(
            "Email notification skipped, user preferences disabled",
            { userId: notification.user_id }
          );
        }
      }
    }

    return notificationId;
  } catch (error) {
    logger.error("Error in sendNotification", { error, notification });
    return null;
  }
};

/**
 * Mendapatkan template email untuk tipe notifikasi
 */
const getEmailTemplateForNotificationType = (
  type: NotificationType
): string => {
  switch (type) {
    case NotificationType.ACHIEVEMENT:
      return "achievement_unlocked";
    case NotificationType.CHALLENGE:
      return "challenge_notification";
    case NotificationType.FRIEND:
      return "friend_request";
    case NotificationType.LEVEL_UP:
      return "level_up";
    case NotificationType.QUIZ:
      return "quiz_notification";
    case NotificationType.CONTENT:
      return "content_notification";
    case NotificationType.ADMIN:
      return "admin_notification";
    case NotificationType.SYSTEM:
    default:
      return "system_notification";
  }
};

/**
 * Mendapatkan semua notifikasi untuk user
 */
export const getUserNotifications = async (
  userId: string,
  options: {
    limit?: number;
    onlyUnread?: boolean;
    offset?: number;
  } = {}
): Promise<{ data: Notification[] | null; count: number | null }> => {
  try {
    const { limit = 20, onlyUnread = false, offset = 0 } = options;

    // Build query
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filter for unread if requested
    if (onlyUnread) {
      query = query.eq("read", false);
    }

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      logger.error("Error fetching user notifications", { error, userId });
      return { data: null, count: null };
    }

    return { data, count };
  } catch (error) {
    logger.error("Exception in getUserNotifications", { error, userId });
    return { data: null, count: null };
  }
};

/**
 * Menandai notifikasi sebagai dibaca
 */
export const markNotificationsAsRead = async (
  notificationIds: string[],
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", notificationIds)
      .eq("user_id", userId);

    if (error) {
      logger.error("Error marking notifications as read", {
        error,
        notificationIds,
        userId,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Exception in markNotificationsAsRead", {
      error,
      notificationIds,
      userId,
    });
    return false;
  }
};

/**
 * Menghapus notifikasi
 */
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      logger.error("Error deleting notification", {
        error,
        notificationId,
        userId,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Exception in deleteNotification", {
      error,
      notificationId,
      userId,
    });
    return false;
  }
};

/**
 * Mendapatkan jumlah notifikasi yang belum dibaca untuk user
 */
export const getUnreadNotificationCount = async (
  userId: string
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      logger.error("Error getting unread notification count", {
        error,
        userId,
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error("Exception in getUnreadNotificationCount", { error, userId });
    return 0;
  }
};

/**
 * Broadcast notifikasi ke semua users atau group tertentu
 */
export const broadcastNotification = async (
  notification: Omit<Notification, "user_id">,
  options: {
    userIds?: string[];
    role?: string;
    saveToDb?: boolean;
    sendSocket?: boolean;
    sendEmail?: boolean;
  } = {}
): Promise<void> => {
  try {
    const {
      userIds,
      role,
      saveToDb = true,
      sendSocket = true,
      sendEmail = false,
    } = options;

    // Get target user IDs based on provided criteria
    let targetUserIds: string[] = [];

    if (userIds && userIds.length > 0) {
      // Use provided userIds
      targetUserIds = userIds;
    } else if (role) {
      // Query users by role
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("role", role);

      if (error) {
        logger.error("Error fetching users by role for broadcast", {
          error,
          role,
        });
      } else if (data) {
        targetUserIds = data.map((user) => user.id);
      }
    } else {
      // Get all users if no specific targets
      const { data, error } = await supabase.from("users").select("id");

      if (error) {
        logger.error("Error fetching all users for broadcast", { error });
      } else if (data) {
        targetUserIds = data.map((user) => user.id);
      }
    }

    // Send notifications to each target user
    const promises = targetUserIds.map((userId) =>
      sendNotification(
        {
          ...notification,
          user_id: userId,
        },
        {
          saveToDb,
          sendSocket,
          sendEmail,
        }
      )
    );

    await Promise.all(promises);

    logger.info("Broadcast notification sent", {
      notificationType: notification.type,
      targetCount: targetUserIds.length,
    });
  } catch (error) {
    logger.error("Error in broadcastNotification", { error, notification });
  }
};

export default {
  sendNotification,
  getUserNotifications,
  markNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  broadcastNotification,
  setSocketInstance,
};

/**
 * Contoh penggunaan:
 *
 * // 1. Mengirim notifikasi individual:
 * notificationService.sendNotification({
 *   user_id: 'user-123',
 *   type: NotificationType.ACHIEVEMENT,
 *   title: 'Pencapaian Baru!',
 *   message: 'Selamat! Anda telah membuka pencapaian "Code Master"',
 *   data: { achievement_id: 'ach-001' },
 *   action_url: '/achievements'
 * }, {
 *   saveToDb: true,
 *   sendSocket: true,
 *   sendEmail: true
 * });
 *
 * // 2. Broadcast ke semua users:
 * notificationService.broadcastNotification({
 *   type: NotificationType.SYSTEM,
 *   title: 'Pemeliharaan Server',
 *   message: 'Server akan down untuk pemeliharaan pada 22:00 WIB',
 *   action_url: '/announcements/server-maintenance'
 * }, {
 *   sendEmail: true
 * });
 *
 * // 3. Mendapatkan notifikasi user:
 * const { data: notifications, count } = await notificationService.getUserNotifications('user-123', {
 *   limit: 10,
 *   onlyUnread: true
 * });
 */
