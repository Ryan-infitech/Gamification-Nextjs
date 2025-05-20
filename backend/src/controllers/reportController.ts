import { Request, Response } from "express";
import { supabase } from "../config/database";
import { AuthRequest } from "../types/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { ValidationError, AuthorizationError } from "../types/error";
import logger from "../config/logger";
import { analyticsService } from "../services/analyticsService";

/**
 * Get user activity report
 * @route GET /api/reports/users/activity
 * @access Admin only
 */
export const getUserActivityReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can access reports");
    }

    const period = (req.query.period as string) || "30days";
    const userId = req.query.userId as string;

    // Get user activity report from analytics service
    const report = await analyticsService.getUserActivityReport(period, userId);

    res.status(200).json({
      success: true,
      message: "User activity report generated successfully",
      data: report,
    });
  }
);

/**
 * Get challenge completion report
 * @route GET /api/reports/challenges/completion
 * @access Admin only
 */
export const getChallengeCompletionReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can access reports");
    }

    const period = (req.query.period as string) || "30days";
    const challengeId = req.query.challengeId as string;
    const difficulty = req.query.difficulty as string;

    // Get challenge completion report from analytics service
    const report = await analyticsService.getChallengeCompletionReport(
      period,
      challengeId,
      difficulty
    );

    res.status(200).json({
      success: true,
      message: "Challenge completion report generated successfully",
      data: report,
    });
  }
);

/**
 * Get quiz performance report
 * @route GET /api/reports/quizzes/performance
 * @access Admin only
 */
export const getQuizPerformanceReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can access reports");
    }

    const period = (req.query.period as string) || "30days";
    const quizId = req.query.quizId as string;

    // Get quiz performance report from analytics service
    const report = await analyticsService.getQuizPerformanceReport(
      period,
      quizId
    );

    res.status(200).json({
      success: true,
      message: "Quiz performance report generated successfully",
      data: report,
    });
  }
);

/**
 * Get user engagement report
 * @route GET /api/reports/engagement
 * @access Admin only
 */
export const getUserEngagementReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can access reports");
    }

    const period = (req.query.period as string) || "30days";

    // Get user engagement report from analytics service
    const report = await analyticsService.getUserEngagementReport(period);

    res.status(200).json({
      success: true,
      message: "User engagement report generated successfully",
      data: report,
    });
  }
);

/**
 * Get content popularity report
 * @route GET /api/reports/content/popularity
 * @access Admin only
 */
export const getContentPopularityReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can access reports");
    }

    const period = (req.query.period as string) || "30days";
    const contentType = req.query.contentType as string;

    // Get content popularity report from analytics service
    const report = await analyticsService.getContentPopularityReport(
      period,
      contentType
    );

    res.status(200).json({
      success: true,
      message: "Content popularity report generated successfully",
      data: report,
    });
  }
);

/**
 * Get user registration report
 * @route GET /api/reports/users/registration
 * @access Admin only
 */
export const getUserRegistrationReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can access reports");
    }

    const period = (req.query.period as string) || "12months";

    // Get user registration report from analytics service
    const report = await analyticsService.getUserRegistrationReport(period);

    res.status(200).json({
      success: true,
      message: "User registration report generated successfully",
      data: report,
    });
  }
);

/**
 * Get learning paths progress report
 * @route GET /api/reports/learning-paths/progress
 * @access Admin only
 */
export const getLearningPathsProgressReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can access reports");
    }

    const pathId = req.query.pathId as string;

    // Get learning paths progress report from analytics service
    const report = await analyticsService.getLearningPathsProgressReport(
      pathId
    );

    res.status(200).json({
      success: true,
      message: "Learning paths progress report generated successfully",
      data: report,
    });
  }
);

/**
 * Get system performance report
 * @route GET /api/reports/system/performance
 * @access Admin only
 */
export const getSystemPerformanceReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can access reports");
    }

    const period = (req.query.period as string) || "7days";

    // Get system performance report from analytics service
    const report = await analyticsService.getSystemPerformanceReport(period);

    res.status(200).json({
      success: true,
      message: "System performance report generated successfully",
      data: report,
    });
  }
);

/**
 * Get dashboard overview stats
 * @route GET /api/reports/dashboard/overview
 * @access Admin only
 */
export const getDashboardOverview = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can access reports");
    }

    // Get dashboard overview stats
    const overview = await analyticsService.getDashboardOverview();

    res.status(200).json({
      success: true,
      message: "Dashboard overview retrieved successfully",
      data: overview,
    });
  }
);

/**
 * Export report data to CSV
 * @route POST /api/reports/export
 * @access Admin only
 */
export const exportReportData = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw new AuthorizationError("Only administrators can export reports");
    }

    const { reportType, period, filters, format = "csv" } = req.body;

    if (!reportType) {
      throw new ValidationError("Report type is required");
    }

    // Get CSV data from analytics service
    const exportData = await analyticsService.exportReportData(
      reportType,
      period,
      filters,
      format
    );

    // For CSV format, set appropriate headers
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${reportType}-${period}.csv`
      );
      return res.status(200).send(exportData);
    }

    // For JSON or other formats
    res.status(200).json({
      success: true,
      message: "Report data exported successfully",
      data: exportData,
    });
  }
);

export default {
  getUserActivityReport,
  getChallengeCompletionReport,
  getQuizPerformanceReport,
  getUserEngagementReport,
  getContentPopularityReport,
  getUserRegistrationReport,
  getLearningPathsProgressReport,
  getSystemPerformanceReport,
  getDashboardOverview,
  exportReportData,
};
