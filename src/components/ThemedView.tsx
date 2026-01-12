import { View, type ViewProps } from 'react-native';
import { useThemeMode } from '@/lib/useColorScheme';

interface ThemedViewProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * ThemedView automatically applies the correct background based on theme mode
 * - Dark mode: slate-950 (#020617)
 * - Light mode: white (#ffffff)
 * - Off-white mode: stone-50 (#fafaf9) - softer on the eyes
 */
export function ThemedView({ children, className, style, ...props }: ThemedViewProps) {
  const themeMode = useThemeMode();

  // Determine background class based on theme mode
  let bgClass = 'bg-white dark:bg-slate-950';

  if (themeMode === 'off-white') {
    // Off-white theme uses a warmer, softer background
    bgClass = 'bg-stone-50';
  }

  const combinedClassName = className ? `${bgClass} ${className}` : bgClass;

  return (
    <View className={combinedClassName} style={style} {...props}>
      {children}
    </View>
  );
}
