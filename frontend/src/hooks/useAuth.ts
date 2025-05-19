"use client";

import { useContext } from "react";
import AuthContext from "@/contexts/AuthContext";

export default function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// Extended auth utilities
export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    isUnauthorized: !isLoading && !isAuthenticated,
  };
}

export function useUserProfile() {
  const { user, isLoading } = useAuth();

  return {
    user,
    isLoading,
    username: user?.user_metadata?.username || "Player",
    displayName:
      user?.user_metadata?.display_name ||
      user?.user_metadata?.username ||
      "Player",
    email: user?.email,
    userId: user?.id,
    avatarUrl: user?.user_metadata?.avatar_url,
  };
}
