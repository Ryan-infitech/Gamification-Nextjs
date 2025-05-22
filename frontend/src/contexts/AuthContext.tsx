'use client';

import React, { createContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'admin' | 'student' | 'teacher';
  verified: boolean;
  level?: number;
  experience?: number;
  completed_challenges?: number;
  achievements?: number;
  login_streak?: number;
  created_at?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  checkAuth: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

// Default context values
const defaultContextValues: AuthContextType = {
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  isAuthenticated: false,
  checkAuth: async () => false,
  resetPassword: async () => {},
  verifyEmail: async () => {},
  changePassword: async () => {},
  clearError: () => {},
};

// Create context
export const AuthContext = createContext<AuthContextType>(defaultContextValues);

// Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Clear any auth errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if user is authenticated
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await axios.get('/api/auth/session');
      const userData = response.data.user;
      
      if (userData) {
        setUser(userData);
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error('Error checking authentication:', err);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check authentication status when component mounts
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    
    initAuth();
  }, [checkAuth]);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.user) {
        setUser(response.data.user);
        
        // Redirect based on user role
        if (response.data.user.role === 'admin') {
          router.push('/admin');
        } else {
          // Check if coming from a protected page or login page
          if (pathname === '/login' || pathname === '/register') {
            router.push('/dashboard');
          } else {
            // Stay on the current page if it's not login/register
            router.refresh();
          }
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/register', { username, email, password });
      
      if (response.data.success) {
        // Automatically log in after registration or redirect to verification page
        if (response.data.verificationRequired) {
          router.push('/verify-email');
        } else {
          await login(email, password);
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/update-profile', data);
      
      if (response.data.user) {
        setUser(prev => prev ? { ...prev, ...response.data.user } : response.data.user);
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/auth/reset-password', { email });
      // Successful request will redirect user or show success message
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email function
  const verifyEmail = async (token: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/verify-email', { token });
      
      if (response.data.success) {
        // Email verified successfully
        if (response.data.user) {
          setUser(response.data.user);
        }
      }
    } catch (err: any) {
      console.error('Email verification error:', err);
      setError(err.response?.data?.message || 'Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/auth/change-password', { currentPassword, newPassword });
      // Successful password change
    } catch (err: any) {
      console.error('Change password error:', err);
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate isAuthenticated
  const isAuthenticated = !!user;

  // Context value
  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated,
    checkAuth,
    resetPassword,
    verifyEmail,
    changePassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
