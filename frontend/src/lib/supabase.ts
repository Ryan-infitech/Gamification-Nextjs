import { createClient } from "@supabase/supabase-js";

// Environment variables are automatically injected by Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== "undefined") {
    console.error(
      "Supabase URL or Anon Key is missing. Please check your environment variables."
    );
  }
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication helpers
export const auth = {
  signUp: async (email: string, password: string, username: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  getUser: async () => {
    return await supabase.auth.getUser();
  },

  getSession: async () => {
    return await supabase.auth.getSession();
  },
};

// Game data helpers
export const gameData = {
  // Player profile
  getPlayerProfile: async (userId: string) => {
    return await supabase
      .from("users")
      .select("*, player_stats(*)")
      .eq("id", userId)
      .single();
  },

  // Game areas
  getGameAreas: async () => {
    return await supabase
      .from("game_areas")
      .select("*")
      .order("difficulty_level", { ascending: true });
  },

  // Challenges
  getChallenges: async (areaId: string) => {
    return await supabase
      .from("challenges")
      .select("*")
      .eq("area_id", areaId)
      .order("difficulty", { ascending: true });
  },

  // Player progress
  getPlayerProgress: async (userId: string) => {
    return await supabase
      .from("game_progress")
      .select("*")
      .eq("user_id", userId)
      .single();
  },

  updatePlayerProgress: async (userId: string, progress: any) => {
    return await supabase
      .from("game_progress")
      .update(progress)
      .eq("user_id", userId);
  },

  // Achievements
  getPlayerAchievements: async (userId: string) => {
    return await supabase
      .from("user_achievements")
      .select("*, achievements(*)")
      .eq("user_id", userId);
  },

  // Inventory
  getPlayerInventory: async (userId: string) => {
    return await supabase
      .from("user_inventory")
      .select("*, items(*)")
      .eq("user_id", userId);
  },
};

// Real-time subscriptions
export const subscriptions = {
  // Chat messages
  subscribeToAreaChat: (areaId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`area-chat-${areaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `area_id=eq.${areaId}`,
        },
        callback
      )
      .subscribe();
  },

  // Player presence in an area
  subscribeToAreaPlayers: (
    areaId: string,
    callback: (payload: any) => void
  ) => {
    return supabase
      .channel(`area-players-${areaId}`)
      .on("presence", { event: "sync" }, callback)
      .subscribe();
  },
};

export default supabase;
