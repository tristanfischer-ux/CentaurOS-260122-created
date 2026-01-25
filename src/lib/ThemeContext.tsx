// Theme Context for managing light/dark/off-white modes

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useAppStore } from './state/app-store';
import type { ThemeMode } from '@/types';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isOffWhite: boolean; // New: to distinguish off-white from light
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const currentUser = useAppStore((s) => s.currentUser);
  const updateUser = useAppStore((s) => s.setCurrentUser);

  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    currentUser?.preferences?.themeMode ?? 'system'
  );

  // Determine the actual theme based on mode
  // Default to 'light' if device scheme is null/undefined
  const theme: 'light' | 'dark' =
    themeMode === 'system'
      ? (deviceColorScheme === 'dark' ? 'dark' : 'light')
      : (themeMode === 'light' || themeMode === 'off-white')
      ? 'light'
      : 'dark';

  // Track if we're in off-white mode specifically
  const isOffWhite = themeMode === 'off-white';

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);

    // Update user preferences
    if (currentUser) {
      updateUser({
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          themeMode: mode,
        },
      });
    }
  };

  // Sync with user preferences when they change
  useEffect(() => {
    if (currentUser?.preferences?.themeMode) {
      setThemeModeState(currentUser.preferences.themeMode);
    }
  }, [currentUser?.preferences?.themeMode]);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isOffWhite }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
