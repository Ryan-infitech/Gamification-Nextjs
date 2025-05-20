import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

// Define schema for environment variables with validation
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().default("3001"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Supabase Configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),

  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Email Configuration
  EMAIL_HOST: z.string().min(1),
  EMAIL_PORT: z.string().transform(Number),
  EMAIL_USER: z.string().email(),
  EMAIL_PASS: z.string().min(1),
  EMAIL_FROM: z.string().email(),

  // Redis Configuration (for caching, optional)
  REDIS_URL: z.string().optional(),

  // Logging
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
    .default("info"),

  // Security
  CORS_ORIGINS: z.string().transform((value) => value.split(",")),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"),
  RATE_LIMIT_MAX: z.string().transform(Number).default("100"),
});

// Parse and validate environment variables
const _env = envSchema.safeParse(process.env);

// Handle validation errors
if (!_env.success) {
  console.error("❌ Invalid environment variables:");
  console.error(_env.error.format());

  throw new Error("Invalid environment variables");
}

// Export validated environment variables
export const env = _env.data;

// Type definition for the environment variables
export type Env = z.infer<typeof envSchema>;
