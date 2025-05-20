import { Request } from "express";
import { z } from "zod";

// Custom Request type with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    username: string;
  };
}

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  perPage: number;
  total?: number;
  totalPages?: number;
}

// Pagination response
export interface PaginatedResponse<T> extends ApiResponse {
  data: T[];
  pagination: PaginationParams;
}

// User registration request schema
export const userRegistrationSchema = z
  .object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    role: z.enum(["student", "teacher"]).default("student"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type UserRegistrationRequest = z.infer<typeof userRegistrationSchema>;

// User login request schema
export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type UserLoginRequest = z.infer<typeof userLoginSchema>;

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

// Password reset confirmation schema
export const passwordResetConfirmSchema = z
  .object({
    token: z.string(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordResetConfirmRequest = z.infer<
  typeof passwordResetConfirmSchema
>;

// User profile update schema
export const userProfileUpdateSchema = z.object({
  display_name: z.string().min(1).max(255).optional(),
  bio: z.string().max(1000).optional(),
  avatar_url: z.string().url().optional().nullable(),
});

export type UserProfileUpdateRequest = z.infer<typeof userProfileUpdateSchema>;

// Game progress update schema
export const gameProgressUpdateSchema = z.object({
  current_chapter: z.number().optional(),
  current_level: z.number().optional(),
  unlocked_zones: z.array(z.string()).optional(),
  completed_levels: z.array(z.string()).optional(),
  saved_position_data: z.record(z.any()).optional(),
});

export type GameProgressUpdateRequest = z.infer<
  typeof gameProgressUpdateSchema
>;

// Challenge submission schema
export const challengeSubmissionSchema = z.object({
  challenge_id: z.string(),
  solution_code: z.string(),
  time_taken: z.number(),
});

export type ChallengeSubmissionRequest = z.infer<
  typeof challengeSubmissionSchema
>;

// Quiz submission schema
export const quizSubmissionSchema = z.object({
  quiz_id: z.string(),
  answers: z.array(
    z.object({
      question_id: z.string(),
      answer: z.string(),
    })
  ),
  time_taken: z.number(),
});

export type QuizSubmissionRequest = z.infer<typeof quizSubmissionSchema>;

// Feedback submission schema
export const feedbackSubmissionSchema = z.object({
  type: z.enum(["bug", "feature", "general", "content"]),
  title: z.string().min(5).max(255),
  description: z.string().min(10),
  page_url: z.string().url().optional(),
  browser_info: z.record(z.any()).optional(),
});

export type FeedbackSubmissionRequest = z.infer<
  typeof feedbackSubmissionSchema
>;
