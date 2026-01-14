/**
 * Squares Display Component
 *
 * Shows visual time unit (squares) for tasks/OKRs
 * 1 Square = 4 hours of focused work
 *
 * Variants:
 * - compact: Small inline display for cards
 * - full: Larger grid display for detail views
 */

import { View, Text } from 'react-native';
import { Bot } from 'lucide-react-native';

interface SquaresDisplayProps {
  /** Total squares needed (after AI adjustment) */
  totalSquares: number;
  /** Squares completed so far */
  completedSquares: number;
  /** Original squares before AI reduction (optional) */
  originalSquares?: number;
  /** AI mode for showing reduction */
  aiMode?: 'none' | 'assist' | 'heavy' | 'autonomous';
  /** Display variant */
  variant?: 'compact' | 'full' | 'mini';
  /** Status color override */
  statusColor?: string;
  /** Show label */
  showLabel?: boolean;
}

const AI_MODE_COLORS: Record<string, string> = {
  none: '#6b7280',
  assist: '#3b82f6',
  heavy: '#8b5cf6',
  autonomous: '#ec4899',
};

const AI_MODE_LABELS: Record<string, string> = {
  none: '',
  assist: 'AI Assist',
  heavy: 'AI Heavy',
  autonomous: 'AI Auto',
};

export function SquaresDisplay({
  totalSquares,
  completedSquares,
  originalSquares,
  aiMode = 'none',
  variant = 'compact',
  statusColor = '#10b981',
  showLabel = true,
}: SquaresDisplayProps) {
  const remaining = totalSquares - completedSquares;
  const hasAIReduction = aiMode !== 'none' && originalSquares && originalSquares > totalSquares;

  if (variant === 'mini') {
    // Super compact - just numbers and tiny squares
    return (
      <View className="flex-row items-center">
        <View className="flex-row items-center gap-0.5 mr-1">
          {Array.from({ length: Math.min(totalSquares, 6) }).map((_, i) => (
            <View
              key={i}
              className="w-2 h-2 rounded-sm"
              style={{
                backgroundColor: i < completedSquares ? statusColor : '#e5e7eb',
              }}
            />
          ))}
          {totalSquares > 6 && (
            <Text className="text-gray-400 text-[8px] ml-0.5">+{totalSquares - 6}</Text>
          )}
        </View>
        <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-medium">
          {completedSquares}/{totalSquares}
        </Text>
        {hasAIReduction && (
          <Bot size={10} color={AI_MODE_COLORS[aiMode]} style={{ marginLeft: 2 }} />
        )}
      </View>
    );
  }

  if (variant === 'compact') {
    return (
      <View className="flex-row items-center">
        {showLabel && (
          <Text className="text-gray-500 dark:text-slate-400 text-[10px] font-medium mr-1.5">
            Effort:
          </Text>
        )}
        <View className="flex-row items-center gap-0.5 mr-1.5">
          {Array.from({ length: Math.min(totalSquares, 8) }).map((_, i) => (
            <View
              key={i}
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                backgroundColor: i < completedSquares ? statusColor : '#d1d5db',
              }}
            />
          ))}
          {totalSquares > 8 && (
            <Text className="text-gray-400 dark:text-slate-500 text-[10px] ml-0.5">
              +{totalSquares - 8}
            </Text>
          )}
        </View>
        <Text className="text-gray-600 dark:text-slate-300 text-[10px] font-semibold">
          {completedSquares}/{totalSquares}□
        </Text>
        {hasAIReduction && (
          <View className="flex-row items-center ml-1.5 bg-purple-50 dark:bg-purple-900/30 px-1 py-0.5 rounded">
            <Bot size={10} color={AI_MODE_COLORS[aiMode]} />
            <Text className="text-[9px] ml-0.5" style={{ color: AI_MODE_COLORS[aiMode] }}>
              -{Math.round(((originalSquares - totalSquares) / originalSquares) * 100)}%
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Full variant - larger display
  return (
    <View>
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-gray-500 dark:text-slate-400 text-xs font-semibold">
          EFFORT (SQUARES)
        </Text>
        <Text className="text-gray-900 dark:text-white text-xs font-bold">
          {completedSquares} / {totalSquares} ({Math.round((completedSquares / totalSquares) * 100)}%)
        </Text>
      </View>

      {/* Visual squares grid */}
      <View className="flex-row flex-wrap gap-1 mb-2">
        {Array.from({ length: Math.min(totalSquares, 20) }).map((_, i) => (
          <View
            key={i}
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: i < completedSquares ? statusColor : '#e5e7eb',
            }}
          />
        ))}
        {totalSquares > 20 && (
          <Text className="text-gray-500 text-xs ml-1 self-center">
            +{totalSquares - 20} more
          </Text>
        )}
      </View>

      {/* AI Reduction indicator */}
      {hasAIReduction && (
        <View className="flex-row items-center">
          <Bot size={12} color={AI_MODE_COLORS[aiMode]} />
          <Text className="text-xs ml-1" style={{ color: AI_MODE_COLORS[aiMode] }}>
            {AI_MODE_LABELS[aiMode]}: {originalSquares} → {totalSquares} squares
            ({Math.round(((originalSquares - totalSquares) / originalSquares) * 100)}% reduction)
          </Text>
        </View>
      )}

      {/* Time estimate */}
      <View className="flex-row items-center mt-1">
        <Text className="text-gray-400 dark:text-slate-500 text-[10px]">
          ≈ {(remaining * 4)} hours remaining ({remaining} squares × 4h)
        </Text>
      </View>
    </View>
  );
}

/**
 * Helper to estimate squares from hours
 */
export function hoursToSquares(hours: number): number {
  return Math.ceil(hours / 4);
}

/**
 * Helper to convert squares to hours
 */
export function squaresToHours(squares: number): number {
  return squares * 4;
}
