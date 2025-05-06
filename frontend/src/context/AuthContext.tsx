import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/router";
import {
  useSupabaseClient,
  useUser,
  Session,
} from "@supabase/auth-helpers-react";
import { toast } from "sonner";

// Define types for auth-related data
interface PlayerStats {
  level: number;
  xp: number;
  coins: number;
  power_level: number;
  coding_skill: number;
  problem_solving: number;
}

interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  player_stats?: PlayerStats;
}

// Define what our auth context will expose
interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    data: Partial<UserProfile>
  ) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create the auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const supabase = useSupabaseClient();
  const supabaseUser = useUser();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session and fetch user profile data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession && supabaseUser) {
          setSession(currentSession);

          // Fetch additional user data from our custom users table
          const { data, error } = await supabase
            .from("users")
            .select("*, player_stats(*)")
            .eq("id", supabaseUser.id)
            .single();

          if (error) {
            throw error;
          }

          // Set user profile
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || "",
            username: data.username,
            display_name: data.display_name,
            avatar_url: data.avatar_url,
            player_stats: data.player_stats,
          });
        }
      } catch (error: any) {
        console.error("Error loading auth:", error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setLoading(true);

      if (event === "SIGNED_IN" && session?.user) {
        const { data, error } = await supabase
          .from("users")
          .select("*, player_stats(*)")
          .eq("id", session.user.id)
          .single();

        if (!error && data) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            username: data.username,
            display_name: data.display_name,
            avatar_url: data.avatar_url,
            player_stats: data.player_stats,
          });
        }
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, supabaseUser]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      toast.success("Signed in successfully!");
      return { success: true };
    } catch (error: any) {
      toast.error("Failed to sign in");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName?: string
  ) => {
    try {
      setLoading(true);

      // 1. Create the auth user
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
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      toast.success(
        "Account created! Please check your email for verification."
      );

      // For Supabase email confirmations, we redirect to login page
      if (data?.user?.identities?.length === 0) {
        toast.info("This email is already registered. Please login instead.");
        router.push("/login");
      }

      return { success: true };
    } catch (error: any) {
      toast.error("Failed to create account");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      router.push("/");
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error("Error signing out");
      console.error("Sign out error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Password reset
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error: error.message };
      }

      toast.success("Password reset email sent");
      return { success: true };
    } catch (error: any) {
      toast.error("Failed to send reset email");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setLoading(true);

      if (!user) {
        return { success: false, error: "Not authenticated" };
      }

      // Update Supabase auth metadata if needed
      if (data.email) {
        const { error } = await supabase.auth.updateUser({ email: data.email });
        if (error) throw error;
      }

      // Update profile data in users table
      const updateData: any = {};
      if (data.username) updateData.username = data.username;
      if (data.display_name) updateData.display_name = data.display_name;
      if (data.avatar_url) updateData.avatar_url = data.avatar_url;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", user.id);

        if (error) throw error;
      }

      // Refresh user data
      const { data: refreshedUser, error } = await supabase
        .from("users")
        .select("*, player_stats(*)")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Update local state
      setUser({
        ...user,
        ...refreshedUser,
      });

      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error: any) {
      toast.error("Failed to update profile");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Session refresh
  const refreshSession = async () => {
    try {
      const { data } = await supabase.auth.refreshSession();
      setSession(data.session);

      if (data.session?.user) {
        const { data: userData, error } = await supabase
          .from("users")
          .select("*, player_stats(*)")
          .eq("id", data.session.user.id)
          .single();

        if (!error && userData) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || "",
            username: userData.username,
            display_name: userData.display_name,
            avatar_url: userData.avatar_url,
            player_stats: userData.player_stats,
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  // Value for the context provider
  const value = {
    session,
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export the useAuth hook
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
