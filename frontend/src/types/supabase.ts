export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          email: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          email: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          email?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
      };
      player_stats: {
        Row: {
          id: string;
          user_id: string;
          level: number;
          xp: number;
          coins: number;
          power_level: number;
          coding_skill: number;
          problem_solving: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          level?: number;
          xp?: number;
          coins?: number;
          power_level?: number;
          coding_skill?: number;
          problem_solving?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          level?: number;
          xp?: number;
          coins?: number;
          power_level?: number;
          coding_skill?: number;
          problem_solving?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add more tables as needed
    };
  };
}
