/**
 * Supabase database configuration
 * Initializes and exports Supabase client
 */
const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

// Create Supabase client with anonymous key for client-side operations
const supabase = createClient(env.supabaseUrl, env.supabaseKey);

// Create Supabase admin client with service role key for server-side operations
// This client has elevated privileges and should only be used server-side
let supabaseAdmin = null;
if (env.supabaseServiceKey) {
  supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceKey);
}

/**
 * Get the appropriate Supabase client based on the operation type
 * @param {boolean} adminOperation - Whether the operation requires admin privileges
 * @returns {Object} Supabase client
 */
function getClient(adminOperation = false) {
  if (adminOperation) {
    if (!supabaseAdmin) {
      console.warn(
        "Warning: Admin operation requested but SUPABASE_SERVICE_KEY is not set. Using regular client instead."
      );
      return supabase;
    }
    return supabaseAdmin;
  }
  return supabase;
}

/**
 * Execute a database operation with error handling
 * @param {Function} operation - Async function that performs the database operation
 * @param {boolean} adminOperation - Whether the operation requires admin privileges
 * @returns {Promise<Object>} Result object with success flag and data/error
 */
async function executeDbOperation(operation, adminOperation = false) {
  try {
    const client = getClient(adminOperation);
    const result = await operation(client);

    if (result.error) {
      return {
        success: false,
        error: result.error,
        status: result.error?.status || 500,
      };
    }

    return {
      success: true,
      data: result.data,
      status: result.status || 200,
    };
  } catch (error) {
    console.error("Database operation error:", error);
    return {
      success: false,
      error: error.message || "Unknown database error",
      status: error.status || 500,
    };
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  executeDbOperation,
  getClient,
};
