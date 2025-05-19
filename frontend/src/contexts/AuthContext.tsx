"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Define types for our context
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName?: string
  ) => Promise<{
    success: boolean;
    error: AuthError | null;
  }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error: AuthError | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    success: boolean;
    error: AuthError | null;
  }>;
};

// Default context values
const defaultContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  signUp: async () => ({ success: false, error: null }),
  signIn: async () => ({ success: false, error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ success: false, error: null }),
};

// Create the context
const AuthContext = createContext<AuthContextType>(defaultContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get session from storage
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = await supabase.auth.onAuthStateChange((event, newSession) => {
          console.log(`Auth event: ${event}`);
          setSession(newSession);
          setUser(newSession?.user ?? null);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName || username,
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error.message);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Unexpected sign up error:", error);
      return {
        success: false,
        error: new AuthError("Unexpected error during sign up"),
      };
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error.message);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      return {
        success: false,
        error: new AuthError("Unexpected error during sign in"),
      };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Reset password error:", error.message);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Unexpected reset password error:", error);
      return {
        success: false,
        error: new AuthError("Unexpected error during password reset"),
      };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the context
export default AuthContext;
