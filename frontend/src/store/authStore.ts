import { create } from "zustand";
import { persist } from "zustand/middleware";

type PlayerStats = {
  id: string;
  user_id: string;
  xp_points: number;
  completed_challenges: number;
  current_level: number;
  created_at: string;
  updated_at: string;
};

type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  playerStats: PlayerStats | null;
};

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
    }
  )
);
