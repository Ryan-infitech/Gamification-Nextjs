import { supabase } from "../config/database";
import logger from "../config/logger";
import { env } from "../config/env";

/**
 * Analytics service for tracking user activities and collecting metrics
 */
class AnalyticsService {
  /**
   * Track a user event
   * @param userId User ID
   * @param event Event name
   * @param data Event data
   */
  public async trackEvent(
    userId: string | null,
    event: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Insert event data into session_logs table
      await supabase.from("session_logs").insert({
        user_id: userId,
        action: event,
        details: data,
        created_at: new Date().toISOString(),
      });

      logger.debug("Event tracked", { userId, event, data });
    } catch (error) {
      // Don't let analytics errors impact the application flow
      logger.error("Failed to track event", { error, userId, event, data });
    }
  }

  /**
   * Track page view
   * @param userId User ID
   * @param path Page path
   * @param referrer Referrer URL
   * @param userAgent User agent
   */
  public async trackPageView(
    userId: string | null,
    path: string,
    referrer?: string,
    userAgent?: string
  ): Promise<void> {
    await this.trackEvent(userId, "page_view", {
      path,
      referrer,
      userAgent,
    });
  }

  /**
   * Track user login
   * @param userId User ID
   * @param ipAddress IP address
   * @param userAgent User agent
   */
  public async trackLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.trackEvent(userId, "login", {
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    // Update user's last login time
    try {
      await supabase
        .from("users")
        .update({
          last_login_at: new Date().toISOString(),
          login_streak: supabase.rpc("increment_login_streak", {
            user_id: userId,
          }),
        })
        .eq("id", userId);
    } catch (error) {
      logger.error("Failed to update login streak", { error, userId });
    }
  }

  /**
   * Track user registration
   * @param userId User ID
   * @param registrationData Registration data
   */
  public async trackRegistration(
    userId: string,
    registrationData: {
      email: string;
      username: string;
      role: string;
      referrer?: string;
    }
  ): Promise<void> {
    await this.trackEvent(userId, "registration", {
      email: registrationData.email,
      username: registrationData.username,
      role: registrationData.role,
      referrer: registrationData.referrer,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track challenge attempt
   * @param userId User ID
   * @param challengeId Challenge ID
   * @param success Whether the attempt was successful
   * @param timeTaken Time taken to complete in seconds
   * @param score Score achieved
   */
  public async trackChallengeAttempt(
    userId: string,
    challengeId: string,
    success: boolean,
    timeTaken: number,
    score: number
  ): Promise<void> {
    await this.trackEvent(userId, "challenge_attempt", {
      challengeId,
      success,
      timeTaken,
      score,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track quiz attempt
   * @param userId User ID
   * @param quizId Quiz ID
   * @param success Whether the attempt was successful
   * @param timeTaken Time taken to complete in seconds
   * @param score Score achieved
   */
  public async trackQuizAttempt(
    userId: string,
    quizId: string,
    success: boolean,
    timeTaken: number,
    score: number
  ): Promise<void> {
    await this.trackEvent(userId, "quiz_attempt", {
      quizId,
      success,
      timeTaken,
      score,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track user achievement
   * @param userId User ID
   * @param achievementId Achievement ID
   * @param achievementName Achievement name
   */
  public async trackAchievement(
    userId: string,
    achievementId: string,
    achievementName: string
  ): Promise<void> {
    await this.trackEvent(userId, "achievement_unlock", {
      achievementId,
      achievementName,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track user level up
   * @param userId User ID
   * @param newLevel New level
   * @param oldLevel Old level
   */
  public async trackLevelUp(
    userId: string,
    newLevel: number,
    oldLevel: number
  ): Promise<void> {
    await this.trackEvent(userId, "level_up", {
      newLevel,
      oldLevel,
      levelsGained: newLevel - oldLevel,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track item acquisition
   * @param userId User ID
   * @param itemId Item ID
   * @param itemName Item name
   * @param quantity Quantity
   * @param source Source of acquisition
   */
  public async trackItemAcquisition(
    userId: string,
    itemId: string,
    itemName: string,
    quantity: number,
    source: string
  ): Promise<void> {
    await this.trackEvent(userId, "item_acquire", {
      itemId,
      itemName,
      quantity,
      source,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track error occurrence
   * @param userId User ID (if available)
   * @param errorType Error type
   * @param errorMessage Error message
   * @param stackTrace Stack trace
   * @param metadata Additional metadata
   */
  public async trackError(
    userId: string | null,
    errorType: string,
    errorMessage: string,
    stackTrace?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(userId, "error", {
      errorType,
      errorMessage,
      stackTrace,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track feature usage
   * @param userId User ID
   * @param feature Feature name
   * @param action Action performed
   * @param metadata Additional metadata
   */
  public async trackFeatureUsage(
    userId: string,
    feature: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent(userId, "feature_usage", {
      feature,
      action,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get user activity summary
   * @param userId User ID
   * @param days Number of days to look back
   */
  public async getUserActivitySummary(
    userId: string,
    days: number = 30
  ): Promise<Record<string, any>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all user events in the date range
      const { data, error } = await supabase
        .from("session_logs")
        .select("action, created_at, details")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalEvents: 0,
          eventsByType: {},
          activityByDay: {},
          firstActivity: null,
          lastActivity: null,
          activeDays: 0,
        };
      }

      // Process data
      const eventsByType: Record<string, number> = {};
      const activityByDay: Record<string, number> = {};

      data.forEach((log) => {
        // Count by event type
        eventsByType[log.action] = (eventsByType[log.action] || 0) + 1;

        // Count by day
        const day = log.created_at.substring(0, 10); // YYYY-MM-DD
        activityByDay[day] = (activityByDay[day] || 0) + 1;
      });

      return {
        totalEvents: data.length,
        eventsByType,
        activityByDay,
        firstActivity: data[0].created_at,
        lastActivity: data[data.length - 1].created_at,
        activeDays: Object.keys(activityByDay).length,
      };
    } catch (error) {
      logger.error("Failed to get user activity summary", { error, userId });
      throw new Error("Failed to get user activity summary");
    }
  }

  /**
   * Get platform activity metrics
   * @param days Number of days to look back
   */
  public async getPlatformMetrics(
    days: number = 30
  ): Promise<Record<string, any>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get active users count
      const { count: activeUsers, error: activeError } = await supabase
        .from("session_logs")
        .select("user_id", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .not("user_id", "is", null);

      if (activeError) {
        throw activeError;
      }

      // Get new users count
      const { count: newUsers, error: newUsersError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString());

      if (newUsersError) {
        throw newUsersError;
      }

      // Get challenge completion metrics
      const { count: challengeCompletions, error: challengeError } =
        await supabase
          .from("completed_challenges")
          .select("id", { count: "exact", head: true })
          .gte("completed_at", startDate.toISOString());

      if (challengeError) {
        throw challengeError;
      }

      // Get quiz completion metrics
      const { count: quizCompletions, error: quizError } = await supabase
        .from("quiz_attempts")
        .select("id", { count: "exact", head: true })
        .gte("completed_at", startDate.toISOString())
        .not("completed_at", "is", null);

      if (quizError) {
        throw quizError;
      }

      // Get daily activity data
      const { data: dailyData, error: dailyError } = await supabase
        .from("session_logs")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      if (dailyError) {
        throw dailyError;
      }

      // Process daily activity
      const activityByDay: Record<string, number> = {};

      if (dailyData) {
        dailyData.forEach((log) => {
          const day = log.created_at.substring(0, 10); // YYYY-MM-DD
          activityByDay[day] = (activityByDay[day] || 0) + 1;
        });
      }

      return {
        activeUsers: activeUsers || 0,
        newUsers: newUsers || 0,
        challengeCompletions: challengeCompletions || 0,
        quizCompletions: quizCompletions || 0,
        totalEvents: dailyData?.length || 0,
        activityByDay,
      };
    } catch (error) {
      logger.error("Failed to get platform metrics", { error });
      throw new Error("Failed to get platform metrics");
    }
  }

  /**
   * Get content engagement metrics
   * @param days Number of days to look back
   */
  public async getContentEngagementMetrics(
    days: number = 30
  ): Promise<Record<string, any>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get most popular challenges
      const { data: challengeData, error: challengeError } = await supabase.rpc(
        "get_popular_challenges",
        {
          days_back: days,
        }
      );

      if (challengeError) {
        throw challengeError;
      }

      // Get most popular quizzes
      const { data: quizData, error: quizError } = await supabase.rpc(
        "get_popular_quizzes",
        {
          days_back: days,
        }
      );

      if (quizError) {
        throw quizError;
      }

      // Get most viewed study materials
      const { data: studyData, error: studyError } = await supabase
        .from("study_materials")
        .select("id, title, view_count, category, difficulty")
        .order("view_count", { ascending: false })
        .limit(10);

      if (studyError) {
        throw studyError;
      }

      return {
        popularChallenges: challengeData || [],
        popularQuizzes: quizData || [],
        popularStudyMaterials: studyData || [],
      };
    } catch (error) {
      logger.error("Failed to get content engagement metrics", { error });
      throw new Error("Failed to get content engagement metrics");
    }
  }

  /**
   * Get retention metrics
   * @param days Number of days to look back
   */
  public async getRetentionMetrics(
    days: number = 30
  ): Promise<Record<string, any>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get cohort data (users grouped by registration date)
      const { data: cohortData, error: cohortError } = await supabase.rpc(
        "get_retention_metrics",
        {
          days_back: days,
        }
      );

      if (cohortError) {
        throw cohortError;
      }

      // Get average session duration
      const { data: sessionData, error: sessionError } = await supabase.rpc(
        "get_average_session_duration",
        {
          days_back: days,
        }
      );

      if (sessionError) {
        throw sessionError;
      }

      // Get returning user rate
      const { data: returnRateData, error: returnRateError } =
        await supabase.rpc("get_returning_user_rate", {
          days_back: days,
        });

      if (returnRateError) {
        throw returnRateError;
      }

      return {
        cohortRetention: cohortData || [],
        averageSessionDuration: sessionData?.[0]?.average_duration || 0,
        returningUserRate: returnRateData?.[0]?.returning_rate || 0,
      };
    } catch (error) {
      logger.error("Failed to get retention metrics", { error });
      throw new Error("Failed to get retention metrics");
    }
  }

  /**
   * Export analytics data
   * @param startDate Start date
   * @param endDate End date
   * @param format Export format (csv or json)
   */
  public async exportAnalyticsData(
    startDate: Date,
    endDate: Date,
    format: "csv" | "json" = "csv"
  ): Promise<string> {
    try {
      // Get all events in date range
      const { data, error } = await supabase
        .from("session_logs")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (format === "json") {
        return JSON.stringify(data || [], null, 2);
      } else {
        // Convert to CSV
        if (!data || data.length === 0) {
          return "id,user_id,session_id,ip_address,action,resource,status,created_at\n";
        }

        const headers = Object.keys(data[0]).filter((key) => key !== "details");
        const csvRows = [headers.join(",")];

        data.forEach((item) => {
          const row = headers
            .map((header) => {
              let cell = item[header];

              // Handle special cases
              if (header === "details" && cell) {
                cell = JSON.stringify(cell).replace(/"/g, '""');
              }

              // Ensure proper CSV formatting
              if (cell === null || cell === undefined) {
                return "";
              } else if (typeof cell === "string") {
                return `"${cell.replace(/"/g, '""')}"`;
              } else {
                return cell;
              }
            })
            .join(",");

          csvRows.push(row);
        });

        return csvRows.join("\n");
      }
    } catch (error) {
      logger.error("Failed to export analytics data", {
        error,
        startDate,
        endDate,
        format,
      });
      throw new Error("Failed to export analytics data");
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
