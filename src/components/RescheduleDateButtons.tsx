/**
 * RescheduleDateButtons
 *
 * Shared component for quick date rescheduling with relative offset buttons.
 * Used in UnifiedTaskAllocationModal, CompactTaskCard, and When tab.
 *
 * Patterns:
 * - Full: [-1 Week] [-1 Day] [⟳] [+1 Day] [+1 Week]
 * - Compact: [+1d] [+3d] [+1w]
 */

import { View, Text, Pressable } from 'react-native';
import { RotateCcw, Calendar } from 'lucide-react-native';

interface RescheduleDateButtonsProps {
  /** Current date as ISO string */
  currentDate: string;
  /** Callback when date is changed */
  onReschedule: (newDate: string) => void;
  /** Original date for reset functionality (optional) */
  originalDate?: string;
  /** Show reset button (requires originalDate) */
  showReset?: boolean;
  /** Compact mode shows fewer, smaller buttons */
  compact?: boolean;
  /** Show the current date display */
  showDateDisplay?: boolean;
  /** Label above the buttons */
  label?: string;
}

export function RescheduleDateButtons({
  currentDate,
  onReschedule,
  originalDate,
  showReset = false,
  compact = false,
  showDateDisplay = true,
  label,
}: RescheduleDateButtonsProps) {

  const handleOffset = (days: number) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);
    onReschedule(date.toISOString());
  };

  const handleReset = () => {
    if (originalDate) {
      onReschedule(originalDate);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Check if overdue
  const isOverdue = () => {
    const date = new Date(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Calculate days difference from today
  const getDaysDiff = () => {
    const date = new Date(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysDiff = getDaysDiff();
  const overdue = isOverdue();

  if (compact) {
    // Compact mode: small chips for inline use
    return (
      <View className="flex-row items-center gap-2">
        {showDateDisplay && (
          <View className="flex-row items-center gap-1 mr-1">
            <Calendar size={12} color={overdue ? '#ef4444' : '#64748b'} />
            <Text className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
              {formatDate(currentDate)}
            </Text>
          </View>
        )}
        <Pressable
          onPress={() => handleOffset(1)}
          className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded active:opacity-70"
        >
          <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">+1d</Text>
        </Pressable>
        <Pressable
          onPress={() => handleOffset(3)}
          className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded active:opacity-70"
        >
          <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">+3d</Text>
        </Pressable>
        <Pressable
          onPress={() => handleOffset(7)}
          className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded active:opacity-70"
        >
          <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">+1w</Text>
        </Pressable>
      </View>
    );
  }

  // Full mode: complete rescheduling UI
  return (
    <View>
      {label && (
        <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
          {label}
        </Text>
      )}

      {showDateDisplay && (
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Calendar size={16} color={overdue ? '#ef4444' : '#3b82f6'} />
            <Text className={`font-semibold ${overdue ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
              {formatDate(currentDate)}
            </Text>
          </View>
          {overdue ? (
            <View className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
              <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
                {Math.abs(daysDiff)}d overdue
              </Text>
            </View>
          ) : daysDiff === 0 ? (
            <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
              <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                Due today
              </Text>
            </View>
          ) : daysDiff <= 3 ? (
            <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
              <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                {daysDiff}d left
              </Text>
            </View>
          ) : (
            <View className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                {daysDiff}d left
              </Text>
            </View>
          )}
        </View>
      )}

      <View className="flex-row items-center justify-center gap-2">
        <Pressable
          onPress={() => handleOffset(-7)}
          className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg active:opacity-70 active:bg-slate-200 dark:active:bg-slate-700"
        >
          <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium">-1 Week</Text>
        </Pressable>

        <Pressable
          onPress={() => handleOffset(-1)}
          className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg active:opacity-70 active:bg-slate-200 dark:active:bg-slate-700"
        >
          <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium">-1 Day</Text>
        </Pressable>

        {showReset && originalDate && (
          <Pressable
            onPress={handleReset}
            className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg active:opacity-70"
          >
            <RotateCcw size={18} color="#3b82f6" />
          </Pressable>
        )}

        <Pressable
          onPress={() => handleOffset(1)}
          className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg active:opacity-70 active:bg-slate-200 dark:active:bg-slate-700"
        >
          <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium">+1 Day</Text>
        </Pressable>

        <Pressable
          onPress={() => handleOffset(7)}
          className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg active:opacity-70 active:bg-slate-200 dark:active:bg-slate-700"
        >
          <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium">+1 Week</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default RescheduleDateButtons;
