/**
 * TimeAllocationBadge Component (DEPRECATED - use SquaresDisplay instead)
 *
 * Displays squares allocation for tasks/OKRs
 * - Shows square count with visual indicator
 * - Indicates AI boost if applicable
 * - Shows stretched warning if needed
 *
 * Note: This component is being phased out. Use SquaresDisplay for new code.
 */

import { View, Text } from 'react-native';
import { Zap, AlertTriangle, Clock } from 'lucide-react-native';
import { cn } from '@/lib/cn';

interface TimeAllocationBadgeProps {
  timeUnits: number;              // Total squares
  effectiveTimeUnits?: number;    // Squares with AI efficiency applied
  aiMultiplier?: number;          // AI efficiency multiplier (1.0 - 20.0)
  isStretched?: boolean;          // Is this causing stretched capacity
  compact?: boolean;              // Smaller version
  showDays?: boolean;             // Show conversion to days
}

// Convert squares to human-readable format
function formatTimeUnits(squares: number, showDays: boolean): string {
  if (showDays) {
    const days = squares / 2; // 2 squares = 1 day
    if (days < 1) return `${squares}□ (½ day)`;
    if (days === 1) return `${squares}□ (1 day)`;
    if (days % 1 === 0) return `${squares}□ (${days} days)`;
    return `${squares}□ (${days.toFixed(1)} days)`;
  }
  return `${squares}□`;
}

export function TimeAllocationBadge({
  timeUnits,
  effectiveTimeUnits,
  aiMultiplier,
  isStretched = false,
  compact = false,
  showDays = true,
}: TimeAllocationBadgeProps) {
  const hasAIBoost = aiMultiplier !== undefined && aiMultiplier > 1;
  const effectiveTU = effectiveTimeUnits ?? timeUnits;

  // Determine badge style
  const getBadgeStyle = () => {
    if (isStretched) {
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-300 dark:border-red-700',
        text: 'text-red-700 dark:text-red-300',
        icon: AlertTriangle,
        iconColor: '#ef4444',
      };
    }
    if (hasAIBoost) {
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-300 dark:border-blue-700',
        text: 'text-blue-700 dark:text-blue-300',
        icon: Zap,
        iconColor: '#3b82f6',
      };
    }
    return {
      bg: 'bg-gray-100 dark:bg-slate-900',
      border: 'border-gray-300 dark:border-slate-600',
      text: 'text-gray-700 dark:text-gray-300',
      icon: Clock,
      iconColor: '#6b7280',
    };
  };

  const style = getBadgeStyle();
  const IconComponent = style.icon;

  if (compact) {
    return (
      <View
        className={cn(
          'flex-row items-center px-1.5 py-0.5 rounded border',
          style.bg,
          style.border
        )}
      >
        <IconComponent size={10} color={style.iconColor} />
        <Text className={cn('text-xs font-semibold ml-0.5', style.text)}>
          {effectiveTU}
        </Text>
      </View>
    );
  }

  return (
    <View
      className={cn(
        'flex-row items-center px-2 py-1 rounded-lg border',
        style.bg,
        style.border
      )}
    >
      <IconComponent size={14} color={style.iconColor} />
      <View className="ml-1.5">
        <Text className={cn('text-xs font-semibold', style.text)}>
          {formatTimeUnits(effectiveTU, showDays)}
        </Text>
        {hasAIBoost && effectiveTU !== timeUnits && (
          <Text className="text-xs text-blue-500 dark:text-blue-400">
            ({timeUnits}□ → {effectiveTU} with {aiMultiplier}x AI)
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * Mini version that shows just the number
 */
export function TimeUnitPill({
  timeUnits,
  variant = 'default',
}: {
  timeUnits: number;
  variant?: 'default' | 'ai' | 'stretched';
}) {
  const styles = {
    default: 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300',
    ai: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    stretched: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  };

  return (
    <View className={cn('px-1.5 py-0.5 rounded', styles[variant])}>
      <Text className="text-xs font-bold">{timeUnits}□</Text>
    </View>
  );
}

/**
 * Inline text version for use in sentences
 */
export function TimeUnitText({
  timeUnits,
  showDays = false,
}: {
  timeUnits: number;
  showDays?: boolean;
}) {
  const days = timeUnits / 2;
  const daysText = days === 0.5 ? '½ day' : days === 1 ? '1 day' : `${days} days`;

  return (
    <Text className="text-gray-600 dark:text-gray-400">
      {timeUnits}□{showDays && ` (${daysText})`}
    </Text>
  );
}

export default TimeAllocationBadge;
