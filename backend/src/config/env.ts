import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Define environment variable types
interface Environment {
  PORT: string;
  NODE_ENV: "development" | "production" | "test";
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  COOKIE_SECRET: string;
  EMAIL_HOST: string;
  EMAIL_PORT: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  EMAIL_FROM: string;
  CORS_ORIGINS: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  LOG_LEVEL: string;
  REDIS_URL?: string;
  APP_NAME: string; // Add APP_NAME
}

// Helper function to ensure required environment variables are present
const requiredEnvVars = [
  "PORT",
  "NODE_ENV",
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "SUPABASE_JWT_SECRET",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "JWT_REFRESH_EXPIRES_IN",
  "COOKIE_SECRET",
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
  "EMAIL_FROM",
  "CORS_ORIGINS",
  "LOG_LEVEL",
];

// Check if all required environment variables are present
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

// Parse and validate environment variables
export const env: Environment = {
  PORT: process.env.PORT || "3001",
  NODE_ENV: (process.env.NODE_ENV as Environment["NODE_ENV"]) || "development",
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_KEY!,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN!,
  COOKIE_SECRET: process.env.COOKIE_SECRET!,
  EMAIL_HOST: process.env.EMAIL_HOST!,
  EMAIL_PORT: process.env.EMAIL_PORT!,
  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASS: process.env.EMAIL_PASS!,
  EMAIL_FROM: process.env.EMAIL_FROM!,
  CORS_ORIGINS: process.env.CORS_ORIGINS!,
  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "900000",
    10
  ),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  REDIS_URL: process.env.REDIS_URL,
  APP_NAME: process.env.APP_NAME || "Gamification CS", // Add default value
};

// Parse CORS origins into array
export const corsOrigins = env.CORS_ORIGINS.split(",");

export default env;
