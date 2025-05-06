/**
 * Environment variables configuration
 * Loads and validates required environment variables
 */
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Required environment variables
const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_KEY"];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Environment variable ${envVar} is required`);
    process.exit(1);
  }
}

// Export environment variables with defaults
module.exports = {
  // Server
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: (process.env.NODE_ENV || "development") === "development",
  isProduction: process.env.NODE_ENV === "production",

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || "",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "default-development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Game settings
  initialPlayerLevel: parseInt(process.env.INITIAL_PLAYER_LEVEL || "1", 10),
  initialPlayerCoins: parseInt(process.env.INITIAL_PLAYER_COINS || "0", 10),
  initialPlayerXp: parseInt(process.env.INITIAL_PLAYER_XP || "0", 10),
  startingAreaId:
    process.env.STARTING_AREA_ID || "11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
};
