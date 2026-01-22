import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingState({ message = 'Loading...', size = 'large' }: LoadingStateProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View className="flex-1 items-center justify-center py-12">
      <ActivityIndicator size={size} color="#8b5cf6" />
      {message && (
        <Text className={`mt-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          {message}
        </Text>
      )}
    </View>
  );
}

// Skeleton loader for list items
export function SkeletonLoader({ count = 3 }: { count?: number }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View className="gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className={`rounded-xl p-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}
        >
          <View className="flex-row items-center mb-3">
            <View className={`w-10 h-10 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
            <View className="ml-3 flex-1">
              <View className={`h-4 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'} mb-2`} style={{ width: '60%' }} />
              <View className={`h-3 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} style={{ width: '40%' }} />
            </View>
          </View>
          <View className={`h-3 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'} mb-2`} />
          <View className={`h-3 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} style={{ width: '80%' }} />
        </View>
      ))}
    </View>
  );
}

// Loading button state
export function LoadingButton({
  onPress,
  isLoading,
  disabled,
  children,
  className = 'bg-purple-600 rounded-xl py-4 px-6 active:opacity-70',
  textClassName = 'text-white font-bold text-center'
}: {
  onPress: () => void;
  isLoading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}) {
  const isDisabled = disabled || isLoading;

  return (
    <View
      className={`${className} ${isDisabled ? 'opacity-50' : ''}`}
      onTouchEnd={isDisabled ? undefined : onPress}
    >
      <View className="flex-row items-center justify-center">
        {isLoading && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
        <Text className={textClassName}>{children}</Text>
      </View>
    </View>
  );
}
