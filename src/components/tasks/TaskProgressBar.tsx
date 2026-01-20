/**
 * TaskProgressBar
 * Reusable progress bar component with consistent styling
 */

import { View, Text } from 'react-native';

interface TaskProgressBarProps {
  completed: number;
  total: number;
  showPercentage?: boolean;
  height?: number;
  variant?: 'default' | 'thin';
}

export function TaskProgressBar({
  completed,
  total,
  showPercentage = false,
  height,
  variant = 'default',
}: TaskProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  const barHeight = height ?? (variant === 'thin' ? 4 : 8);

  return (
    <View className="flex-row items-center gap-2">
      <View
        className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
        style={{ height: barHeight }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: percentage === 100 ? '#10B981' : '#3B82F6',
          }}
        />
      </View>
      {showPercentage && (
        <Text className="text-slate-900 dark:text-white text-sm font-semibold min-w-[40px] text-right">
          {percentage}%
        </Text>
      )}
    </View>
  );
}
