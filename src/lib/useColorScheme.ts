import { useColorScheme as useRNColorScheme } from 'react-native';
import { useColorScheme as useNWColorScheme } from 'nativewind';
import { useAppStore } from './state/app-store';
import { useEffect } from 'react';
import type { ThemeMode } from '@/types';

export function useColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useRNColorScheme();
  const { setColorScheme } = useNWColorScheme();
  const currentUser = useAppStore((s) => s.currentUser);

  const userPreference = currentUser?.preferences?.themeMode;

  // Determine the effective color scheme
  let effectiveScheme: 'light' | 'dark';

  if (userPreference === 'light' || userPreference === 'off-white') {
    // Both light and off-white use light mode (off-white is handled with bg colors)
    effectiveScheme = 'light';
  } else if (userPreference === 'dark') {
    effectiveScheme = 'dark';
  } else {
    // If preference is 'system' or not set, use system preference
    effectiveScheme = systemColorScheme === 'light' ? 'light' : 'dark';
  }

  // Apply the color scheme to NativeWind
  useEffect(() => {
    setColorScheme(effectiveScheme);
  }, [effectiveScheme, setColorScheme]);

  return effectiveScheme;
}

// Helper to get the exact theme mode (including off-white)
export function useThemeMode(): ThemeMode {
  const currentUser = useAppStore((s) => s.currentUser);
  return currentUser?.preferences?.themeMode || 'system';
}

// Helper to check if using off-white theme
export function useIsOffWhite(): boolean {
  const themeMode = useThemeMode();
  return themeMode === 'off-white';
}
