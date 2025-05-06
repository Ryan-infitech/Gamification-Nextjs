import { useAuthContext } from "@/context/AuthContext";

/**
 * Custom hook for accessing authentication functionality throughout the app
 * Provides a simplified interface to the AuthContext
 */
export default function useAuth() {
  const auth = useAuthContext();

  return {
    // User data and status
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.loading,
    error: auth.error,
    session: auth.session,

    // Auth methods
    login: auth.signIn,
    signup: auth.signUp,
    logout: auth.signOut,
    resetPassword: auth.resetPassword,
    updateProfile: auth.updateProfile,
    refreshSession: auth.refreshSession,
  };
}

// Type for auth state returned by the hook - useful for type checking
export type AuthState = ReturnType<typeof useAuth>;
