import { createClient } from "@supabase/supabase-js";
import { env } from "./env";
import { Database } from "../types/supabase";

// Create Supabase client with type definitions
const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Verify database connection
const verifyConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      console.error("Supabase connection error:", error.message);
      return false;
    }

    console.log("✅ Supabase connection successful");
    return true;
  } catch (error) {
    console.error("Failed to connect to Supabase:", error);
    return false;
  }
};

export { supabase, verifyConnection };
