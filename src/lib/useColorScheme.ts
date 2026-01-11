import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppStore } from './state/app-store';

export function useColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useRNColorScheme();
  const currentUser = useAppStore((s) => s.currentUser);

  const userPreference = currentUser?.preferences?.themeMode;

  // If user has set a preference, use it
  if (userPreference === 'light') return 'light';
  if (userPreference === 'dark') return 'dark';

  // If preference is 'system' or not set, use system preference
  return systemColorScheme === 'light' ? 'light' : 'dark';
}
