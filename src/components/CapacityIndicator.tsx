/**
 * CapacityIndicator
 * Unified capacity visualization component used across People, Tasks, and Home tabs
 * Provides consistent display of capacity utilization with color-coded indicators
 */

import { View, Text } from 'react-native';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react-native';

interface CapacityIndicatorProps {
  allocated: number;
  total: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'dot' | 'bar' | 'full';
  showLabel?: boolean;
  showPercentage?: boolean;
}

export function CapacityIndicator({
  allocated,
  total,
  size = 'medium',
  variant = 'bar',
  showLabel = true,
  showPercentage = true,
}: CapacityIndicatorProps) {
  const utilizationPercent = total > 0 ? Math.round((allocated / total) * 100) : 0;
  const available = Math.max(0, total - allocated);
  const isOverallocated = allocated > total;

  // Get color based on utilization
  const getUtilColor = () => {
    if (isOverallocated) return { bg: '#ef4444', text: '#fff', dot: '#ef4444', label: 'Overallocated' };
    if (utilizationPercent >= 85) return { bg: '#f59e0b', text: '#fff', dot: '#f59e0b', label: 'At Capacity' };
    if (utilizationPercent >= 50) return { bg: '#10b981', text: '#fff', dot: '#10b981', label: 'Good' };
    return { bg: '#3b82f6', text: '#fff', dot: '#3b82f6', label: 'Available' };
  };

  const colors = getUtilColor();

  // Get icon based on status
  const getIcon = () => {
    if (isOverallocated) return <AlertTriangle size={sizeMap.icon} color={colors.dot} />;
    if (utilizationPercent >= 85) return <AlertTriangle size={sizeMap.icon} color={colors.dot} />;
    if (utilizationPercent >= 50) return <TrendingUp size={sizeMap.icon} color={colors.dot} />;
    return <CheckCircle size={sizeMap.icon} color={colors.dot} />;
  };

  // Size mapping
  const sizeMap = {
    icon: size === 'small' ? 12 : size === 'medium' ? 14 : 16,
    dot: size === 'small' ? 8 : size === 'medium' ? 10 : 12,
    barHeight: size === 'small' ? 4 : size === 'medium' ? 6 : 8,
    text: size === 'small' ? 'text-[10px]' : size === 'medium' ? 'text-xs' : 'text-sm',
    labelText: size === 'small' ? 'text-[9px]' : size === 'medium' ? 'text-[10px]' : 'text-xs',
  };

  // DOT VARIANT
  if (variant === 'dot') {
    return (
      <View className="flex-row items-center gap-1.5">
        <View
          className="rounded-full"
          style={{
            width: sizeMap.dot,
            height: sizeMap.dot,
            backgroundColor: colors.dot,
          }}
        />
        {showLabel && (
          <Text className={`text-slate-700 dark:text-slate-300 font-semibold ${sizeMap.text}`}>
            {available > 0 ? `${available} TU free` : isOverallocated ? `Over by ${Math.abs(available)}` : 'At capacity'}
          </Text>
        )}
      </View>
    );
  }

  // BAR VARIANT
  if (variant === 'bar') {
    return (
      <View>
        {showLabel && (
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className={`text-slate-500 dark:text-slate-400 font-medium ${sizeMap.labelText}`}>
              Weekly Capacity
            </Text>
            {showPercentage && (
              <Text className={`text-slate-900 dark:text-white font-bold ${sizeMap.labelText}`}>
                {utilizationPercent}% utilized
              </Text>
            )}
          </View>
        )}

        <View
          className="bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"
          style={{ height: sizeMap.barHeight }}
        >
          <View
            className="rounded-full"
            style={{
              width: `${Math.min(100, utilizationPercent)}%`,
              height: '100%',
              backgroundColor: colors.bg,
            }}
          />
        </View>

        {showLabel && (
          <View className="flex-row items-center justify-between mt-1">
            <Text className={`text-slate-400 dark:text-slate-500 ${sizeMap.labelText}`}>
              0 TU
            </Text>
            <Text className={`text-slate-400 dark:text-slate-500 ${sizeMap.labelText}`}>
              {total} TU
            </Text>
          </View>
        )}
      </View>
    );
  }

  // FULL VARIANT (with icon, bar, and detailed stats)
  return (
    <View>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          {getIcon()}
          <Text className={`text-slate-900 dark:text-white font-bold ${sizeMap.text}`}>
            Capacity
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className={`text-slate-700 dark:text-slate-300 font-bold ${sizeMap.text}`}>
            {allocated}/{total} TU
          </Text>
          <Text className={`font-bold ${sizeMap.text}`} style={{ color: colors.bg }}>
            {utilizationPercent}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View
        className="bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2"
        style={{ height: sizeMap.barHeight }}
      >
        <View
          className="rounded-full"
          style={{
            width: `${Math.min(100, utilizationPercent)}%`,
            height: '100%',
            backgroundColor: colors.bg,
          }}
        />
      </View>

      {/* Status Message */}
      <View
        className="rounded-lg px-3 py-2"
        style={{
          backgroundColor: colors.bg + '15',
          borderWidth: 1,
          borderColor: colors.bg + '30',
        }}
      >
        <Text className={`font-semibold ${sizeMap.labelText}`} style={{ color: colors.bg }}>
          {isOverallocated
            ? `⚠️ Overallocated by ${Math.abs(available)} TU/week`
            : utilizationPercent >= 85
            ? `⚠️ Near capacity - ${available} TU/week remaining`
            : utilizationPercent >= 50
            ? `✓ Good utilization - ${available} TU/week available`
            : `✓ ${available} TU/week available for new work`}
        </Text>
      </View>
    </View>
  );
}
