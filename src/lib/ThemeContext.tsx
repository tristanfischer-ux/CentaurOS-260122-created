// Theme Context for managing light/dark mode

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useAppStore } from './state/app-store';
import type { ThemeMode } from '@/types';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
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
  const theme: 'light' | 'dark' =
    themeMode === 'system'
      ? (deviceColorScheme ?? 'dark')
      : (themeMode === 'light' || themeMode === 'off-white')
      ? 'light'
      : 'dark';

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
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
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
