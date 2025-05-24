import { z } from 'zod';

// Variabel untuk menyimpan pesan error dalam bahasa Indonesia
const errorMessages = {
  required: 'Bidang ini wajib diisi',
  email: 'Format email tidak valid',
  minLength: (min: number) => `Minimal ${min} karakter`,
  maxLength: (max: number) => `Maksimal ${max} karakter`,
  passwordMatch: 'Kata sandi tidak sama',
  passwordRequirements: 'Kata sandi harus memiliki minimal 8 karakter, setidaknya 1 huruf besar, 1 huruf kecil, dan 1 angka',
  username: 'Username hanya boleh berisi huruf, angka, underscore, dan dash',
  url: 'Format URL tidak valid',
  numeric: 'Hanya boleh berisi angka',
  integer: 'Harus berupa bilangan bulat',
  boolean: 'Harus berupa nilai boolean',
  date: 'Format tanggal tidak valid',
};

// Regex untuk validasi
const patterns = {
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  username: /^[a-zA-Z0-9_-]+$/,
  numeric: /^\d+$/,
};

// ====== Reusable schema components ======

export const nameSchema = z.string()
  .min(2, { message: errorMessages.minLength(2) })
  .max(100, { message: errorMessages.maxLength(100) });

export const usernameSchema = z.string()
  .min(3, { message: errorMessages.minLength(3) })
  .max(30, { message: errorMessages.maxLength(30) })
  .regex(patterns.username, { message: errorMessages.username });

export const emailSchema = z.string()
  .email({ message: errorMessages.email });

export const passwordSchema = z.string()
  .min(8, { message: errorMessages.minLength(8) })
  .regex(patterns.password, { message: errorMessages.passwordRequirements });

export const confirmPasswordSchema = (passwordFieldName: string = 'password') => 
  z.string().min(1, { message: errorMessages.required })
    .refine((confirmPwd, formData) => confirmPwd === formData.data[passwordFieldName], {
      message: errorMessages.passwordMatch,
    });

// ====== Login validation schema ======

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: errorMessages.required }),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ====== Registration validation schema ======

export const registrationSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: errorMessages.required }),
  role: z.enum(['student', 'teacher']),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'Anda harus menyetujui syarat dan ketentuan',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: errorMessages.passwordMatch,
  path: ['confirmPassword'],
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// ====== Password reset validation schema ======

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: errorMessages.required }),
}).refine(data => data.password === data.confirmPassword, {
  message: errorMessages.passwordMatch,
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ====== Profile validation schema ======

export const profileUpdateSchema = z.object({
  displayName: z.string().max(100, { message: errorMessages.maxLength(100) }).optional(),
  bio: z.string().max(500, { message: errorMessages.maxLength(500) }).optional(),
  avatarUrl: z.string().url({ message: errorMessages.url }).optional().nullable(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// ====== Change password validation schema ======

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: errorMessages.required }),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, { message: errorMessages.required }),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: errorMessages.passwordMatch,
  path: ['confirmNewPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ====== Feedback submission validation schema ======

export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'content']),
  title: z.string()
    .min(5, { message: errorMessages.minLength(5) })
    .max(100, { message: errorMessages.maxLength(100) }),
  description: z.string()
    .min(10, { message: errorMessages.minLength(10) })
    .max(1000, { message: errorMessages.maxLength(1000) }),
  email: emailSchema.optional(),
  includeBrowserInfo: z.boolean().optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

// ====== Challenge submission validation schema ======

export const challengeSubmissionSchema = z.object({
  challengeId: z.string().min(1, { message: errorMessages.required }),
  solutionCode: z.string().min(1, { message: errorMessages.required }),
  language: z.string().min(1, { message: errorMessages.required }),
});

export type ChallengeSubmissionFormData = z.infer<typeof challengeSubmissionSchema>;

// ====== Quiz submission validation schema ======

export const quizSubmissionSchema = z.object({
  quizId: z.string().min(1, { message: errorMessages.required }),
  answers: z.array(
    z.object({
      questionId: z.string().min(1, { message: errorMessages.required }),
      answer: z.string().min(1, { message: errorMessages.required }),
    })
  ),
  timeTaken: z.number().int().positive(),
});

export type QuizSubmissionFormData = z.infer<typeof quizSubmissionSchema>;

// ====== Content search validation schema ======

export const searchSchema = z.object({
  query: z.string().min(2, { message: errorMessages.minLength(2) }),
  filters: z.object({
    category: z.array(z.string()).optional(),
    difficulty: z.array(z.string()).optional(),
    type: z.array(z.string()).optional(),
  }).optional(),
});

export type SearchFormData = z.infer<typeof searchSchema>;

// ====== Settings validation schema ======

export const settingsSchema = z.object({
  language: z.string().min(2, { message: errorMessages.minLength(2) }),
  theme: z.enum(['light', 'dark', 'system']),
  soundEnabled: z.boolean(),
  musicEnabled: z.boolean(),
  musicVolume: z.number().min(0).max(100),
  soundVolume: z.number().min(0).max(100),
  notificationsEnabled: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
  highContrastMode: z.boolean(),
  textToSpeech: z.boolean(),
  uiScale: z.number().min(0.5).max(2),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

// Utility function for form error handling
export const getFormErrors = (error: unknown): Record<string, string> => {
  if (error instanceof z.ZodError) {
    const errors: Record<string, string> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = err.message;
      }
    });
    return errors;
  }
  return {};
};

// Helper function untuk sanitasi input sebelum validasi
export const sanitizeInput = (input: string): string => {
  return input.trim();
};

// Helper function to validate form field on change
export const validateField = <T extends z.ZodTypeAny>(
  schema: T,
  fieldName: string,
  value: any
): string | null => {
  try {
    schema.parse({ [fieldName]: value });
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(err => err.path[0] === fieldName);
      return fieldError ? fieldError.message : null;
    }
    return null;
  }
};
