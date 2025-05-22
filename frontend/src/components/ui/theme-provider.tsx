'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSettingsStore } from '@/lib/stateManagement';

// Tipe tema yang tersedia
export type Theme = 'light' | 'dark' | 'system';

// Interface untuk context theme
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  isHighContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

// Context untuk theme
const ThemeContext = createContext<ThemeContextType | null>(null);

// Props untuk ThemeProvider
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Provider component
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  // Get theme from settings store
  const storeTheme = useSettingsStore((state) => state.theme);
  const setStoreTheme = useSettingsStore((state) => state.setTheme);
  
  // Get high contrast from settings store
  const highContrast = useSettingsStore((state) => state.highContrastMode);
  const setStoreHighContrast = useSettingsStore((state) => state.toggleHighContrastMode);
  
  // State untuk theme dan high contrast mode
  const [theme, setThemeState] = useState<Theme>(storeTheme || defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isHighContrast, setHighContrastState] = useState<boolean>(highContrast);
  
  // Function untuk mengatur theme
  const setTheme = (theme: Theme) => {
    setThemeState(theme);
    setStoreTheme(theme); // Update theme di settings store
    localStorage.setItem(storageKey, theme);
  };
  
  // Function untuk mengatur high contrast mode
  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    setStoreHighContrast(); // Toggle high contrast di settings store (karena menggunakan toggle)
  };
  
  // Mendeteksi dan mengatur tema berdasarkan preferensi sistem
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Function untuk menerapkan tema
    const applyTheme = (theme: Theme) => {
      let resolvedTheme: 'light' | 'dark';
      
      if (theme === 'system') {
        resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolvedTheme = theme as 'light' | 'dark';
      }
      
      setResolvedTheme(resolvedTheme);
      
      // Toggle class pada root element
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Toggle high contrast class jika diperlukan
      if (isHighContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    };
    
    // Apply theme saat component mount dan saat theme berubah
    applyTheme(theme);
    
    // Listen untuk perubahan system theme
    const handleMediaChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    
    // Add event listener
    mediaQuery.addEventListener('change', handleMediaChange);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [theme, isHighContrast]);
  
  // Apply high contrast mode changes
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);
  
  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme | null;
    
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
      setStoreTheme(savedTheme);
    }
  }, [storageKey, setStoreTheme]);
  
  const value = {
    theme,
    setTheme,
    resolvedTheme,
    isHighContrast,
    setHighContrast,
  };
  
  return (
    <ThemeContext.Provider value={value} {...props}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook untuk menggunakan theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// Component untuk toggle theme
interface ThemeTogglerProps {
  className?: string;
}

export const ThemeToggler: React.FC<ThemeTogglerProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-5 h-5"
        >
          <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
        </svg>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-5 h-5"
        >
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

// Component for theme selector (light, dark, system)
interface ThemeSelectorProps {
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="text-sm font-medium">Tema</label>
      <div className="flex space-x-2">
        <button
          onClick={() => setTheme('light')}
          className={`px-3 py-2 rounded-md transition-colors ${
            theme === 'light' 
              ? 'bg-primary-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label="Aktifkan mode terang"
        >
          Terang
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`px-3 py-2 rounded-md transition-colors ${
            theme === 'dark' 
              ? 'bg-primary-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label="Aktifkan mode gelap"
        >
          Gelap
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`px-3 py-2 rounded-md transition-colors ${
            theme === 'system' 
              ? 'bg-primary-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label="Gunakan tema sistem"
        >
          Sistem
        </button>
      </div>
    </div>
  );
};

// Accessibility toggle for high contrast
interface HighContrastTogglerProps {
  className?: string;
}

export const HighContrastToggler: React.FC<HighContrastTogglerProps> = ({ className }) => {
  const { isHighContrast, setHighContrast } = useTheme();
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <input
        type="checkbox"
        id="high-contrast-toggle"
        checked={isHighContrast}
        onChange={(e) => setHighContrast(e.target.checked)}
        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
      />
      <label htmlFor="high-contrast-toggle" className="text-sm font-medium">
        Mode Kontras Tinggi
      </label>
    </div>
  );
};
