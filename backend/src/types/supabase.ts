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
          email: string;
          password_hash: string;
          role: "admin" | "student" | "teacher";
          avatar_url: string | null;
          display_name: string | null;
          bio: string | null;
          verified: boolean;
          verification_token: string | null;
          reset_password_token: string | null;
          reset_password_expires: string | null;
          login_streak: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          password_hash: string;
          role: "admin" | "student" | "teacher";
          avatar_url?: string | null;
          display_name?: string | null;
          bio?: string | null;
          verified?: boolean;
          verification_token?: string | null;
          reset_password_token?: string | null;
          reset_password_expires?: string | null;
          login_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          password_hash?: string;
          role?: "admin" | "student" | "teacher";
          avatar_url?: string | null;
          display_name?: string | null;
          bio?: string | null;
          verified?: boolean;
          verification_token?: string | null;
          reset_password_token?: string | null;
          reset_password_expires?: string | null;
          login_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      player_stats: {
        Row: {
          id: string;
          user_id: string;
          level: number;
          experience: number;
          coins: number;
          health: number;
          strength: number;
          intelligence: number;
          agility: number;
          current_map: string;
          last_position_x: number;
          last_position_y: number;
          playtime_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          level?: number;
          experience?: number;
          coins?: number;
          health?: number;
          strength?: number;
          intelligence?: number;
          agility?: number;
          current_map?: string;
          last_position_x?: number;
          last_position_y?: number;
          playtime_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          level?: number;
          experience?: number;
          coins?: number;
          health?: number;
          strength?: number;
          intelligence?: number;
          agility?: number;
          current_map?: string;
          last_position_x?: number;
          last_position_y?: number;
          playtime_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      game_progress: {
        Row: {
          id: string;
          user_id: string;
          current_chapter: number;
          current_level: number;
          unlocked_zones: string[];
          completed_levels: string[];
          saved_position_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_chapter?: number;
          current_level?: number;
          unlocked_zones?: string[];
          completed_levels?: string[];
          saved_position_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_chapter?: number;
          current_level?: number;
          unlocked_zones?: string[];
          completed_levels?: string[];
          saved_position_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      completed_challenges: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          completed_at: string;
          score: number | null;
          time_taken: number | null;
          solution_code: string | null;
          feedback: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          completed_at?: string;
          score?: number | null;
          time_taken?: number | null;
          solution_code?: string | null;
          feedback?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          challenge_id?: string;
          completed_at?: string;
          score?: number | null;
          time_taken?: number | null;
          solution_code?: string | null;
          feedback?: string | null;
        };
      };
      items_inventory: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          quantity: number;
          equipped: boolean;
          properties: Json | null;
          acquired_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          quantity?: number;
          equipped?: boolean;
          properties?: Json | null;
          acquired_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          quantity?: number;
          equipped?: boolean;
          properties?: Json | null;
          acquired_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          progress: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          progress?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
          progress?: number;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          room_id: string;
          message: string;
          sent_at: string;
          is_system_message: boolean;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          room_id: string;
          message: string;
          sent_at?: string;
          is_system_message?: boolean;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          room_id?: string;
          message?: string;
          sent_at?: string;
          is_system_message?: boolean;
          metadata?: Json | null;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question: string;
          options: Json;
          correct_answer: string;
          explanation: string | null;
          difficulty: "easy" | "medium" | "hard";
          category: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question: string;
          options: Json;
          correct_answer: string;
          explanation?: string | null;
          difficulty: "easy" | "medium" | "hard";
          category?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question?: string;
          options?: Json;
          correct_answer?: string;
          explanation?: string | null;
          difficulty?: "easy" | "medium" | "hard";
          category?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number | null;
          answers: Json | null;
          time_taken: number | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score?: number | null;
          answers?: Json | null;
          time_taken?: number | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_id?: string;
          score?: number | null;
          answers?: Json | null;
          time_taken?: number | null;
          started_at?: string;
          completed_at?: string | null;
        };
      };
      study_materials: {
        Row: {
          id: string;
          title: string;
          content: string;
          type: "article" | "video" | "interactive" | "code_example";
          category: string;
          difficulty: "beginner" | "intermediate" | "advanced";
          order_index: number | null;
          path_id: string | null;
          author_id: string | null;
          featured: boolean;
          status: "draft" | "published" | "archived";
          view_count: number;
          likes: number;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          type: "article" | "video" | "interactive" | "code_example";
          category: string;
          difficulty: "beginner" | "intermediate" | "advanced";
          order_index?: number | null;
          path_id?: string | null;
          author_id?: string | null;
          featured?: boolean;
          status?: "draft" | "published" | "archived";
          view_count?: number;
          likes?: number;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          type?: "article" | "video" | "interactive" | "code_example";
          category?: string;
          difficulty?: "beginner" | "intermediate" | "advanced";
          order_index?: number | null;
          path_id?: string | null;
          author_id?: string | null;
          featured?: boolean;
          status?: "draft" | "published" | "archived";
          view_count?: number;
          likes?: number;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Tambahkan definisi tabel lainnya sesuai dengan schema.sql
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
