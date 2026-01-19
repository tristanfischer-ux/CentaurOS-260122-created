/**
 * Squares Display Component
 *
 * Shows visual time unit (squares) for tasks/OKRs
 * 1 Square = 4 hours of focused work
 *
 * Variants:
 * - compact: Small inline display for cards
 * - full: Larger grid display for detail views (max 15 per line)
 *
 * Color Consistency:
 * - Completed/Used: Status color (typically blue/green/red based on status)
 * - Unused/Available: Light gray (#e5e7eb / #d1d5db)
 * - Overtime: Amber tones for overtime capacity
 */

import { View, Text } from 'react-native';
import { Bot, DollarSign, Zap } from 'lucide-react-native';

// Consistent capacity colors across the app
export const CAPACITY_COLORS = {
  USED: '#ef4444',           // Red - allocated/used capacity
  AVAILABLE: '#10b981',      // Green - available capacity
  UNUSED: '#e5e7eb',         // Light gray - unused in visualization
  OVERTIME_AVAILABLE: '#fbbf24', // Amber - overtime available
  OVERTIME_USED: '#f97316',  // Orange - overtime used
} as const;

interface SquaresDisplayProps {
  /** Total squares needed (after AI adjustment) */
  totalSquares: number;
  /** Squares completed so far */
  completedSquares: number;
  /** Original squares before AI reduction (optional) */
  originalSquares?: number;
  /** AI multiplier (1x = no AI, 2x-20x = AI acceleration) */
  aiMultiplier?: number;
  /** AI mode for showing reduction */
  aiMode?: 'none' | 'assist' | 'heavy' | 'autonomous';
  /** Display variant */
  variant?: 'compact' | 'full' | 'mini';
  /** Status color override */
  statusColor?: string;
  /** Show label */
  showLabel?: boolean;
  /** Cost in £ */
  cost?: number;
  /** Show cost */
  showCost?: boolean;
  /** Squares allocated per week */
  squaresPerWeek?: number;
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
  aiMultiplier = 1,
  aiMode = 'none',
  variant = 'compact',
  statusColor = '#10b981',
  showLabel = true,
  cost,
  showCost = false,
  squaresPerWeek,
}: SquaresDisplayProps) {
  const remaining = totalSquares - completedSquares;
  const hasAIReduction = (aiMode !== 'none' || aiMultiplier > 1) && originalSquares && originalSquares > totalSquares;
  const weeksRemaining = squaresPerWeek && squaresPerWeek > 0 ? Math.ceil(remaining / squaresPerWeek) : null;

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
      <View className="flex-row items-center flex-wrap">
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
          {completedSquares}/{totalSquares} TU
        </Text>
        {hasAIReduction && (
          <View className="flex-row items-center ml-1.5 bg-purple-50 dark:bg-purple-900/30 px-1 py-0.5 rounded">
            <Zap size={10} color="#8b5cf6" />
            <Text className="text-[9px] ml-0.5 text-purple-600 dark:text-purple-400">
              {aiMultiplier > 1 ? `${aiMultiplier}x` : `-${Math.round(((originalSquares - totalSquares) / originalSquares) * 100)}%`}
            </Text>
          </View>
        )}
        {showCost && cost !== undefined && cost > 0 && (
          <View className="flex-row items-center ml-1.5">
            <DollarSign size={10} color="#6b7280" />
            <Text className="text-gray-500 dark:text-slate-400 text-[9px]">
              £{cost.toLocaleString()}
            </Text>
          </View>
        )}
        {weeksRemaining !== null && weeksRemaining < Infinity && (
          <Text className="text-gray-400 dark:text-slate-500 text-[9px] ml-1.5">
            {weeksRemaining}w
          </Text>
        )}
      </View>
    );
  }

  // Full variant - larger display with consistent 15-per-line limit
  return (
    <View>
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-gray-500 dark:text-slate-400 text-xs font-semibold">
          EFFORT (SQUARES)
        </Text>
        <Text className="text-gray-900 dark:text-white text-xs font-bold">
          {completedSquares} / {totalSquares} ({Math.round((completedSquares / Math.max(totalSquares, 1)) * 100)}%)
        </Text>
      </View>

      {/* Visual squares grid - max 15 per line to prevent awkward wrapping */}
      <View className="mb-2">
        {Array.from({ length: Math.ceil(totalSquares / 15) }).map((_, rowIndex) => {
          const startIdx = rowIndex * 15;
          const endIdx = Math.min(startIdx + 15, totalSquares);
          const squaresInRow = endIdx - startIdx;

          return (
            <View key={rowIndex} className="flex-row gap-1 mb-1">
              {Array.from({ length: squaresInRow }).map((_, colIndex) => {
                const squareIndex = startIdx + colIndex;
                return (
                  <View
                    key={squareIndex}
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor: squareIndex < completedSquares ? statusColor : '#e5e7eb',
                    }}
                  />
                );
              })}
            </View>
          );
        })}
      </View>

      {/* AI Multiplier indicator */}
      {hasAIReduction && (
        <View className="flex-row items-center mb-1">
          <Zap size={12} color="#8b5cf6" />
          <Text className="text-xs ml-1 text-purple-600 dark:text-purple-400">
            AI {aiMultiplier}x: {originalSquares} → {totalSquares} squares
            ({Math.round(((originalSquares! - totalSquares) / originalSquares!) * 100)}% reduction)
          </Text>
        </View>
      )}

      {/* Time and Cost estimate */}
      <View className="flex-row items-center justify-between mt-1 pt-2 border-t border-gray-100 dark:border-slate-700">
        <View className="flex-row items-center">
          <Text className="text-gray-400 dark:text-slate-500 text-[10px]">
            ≈ {(remaining * 4)}h ({remaining} TU × 4h)
          </Text>
          {weeksRemaining !== null && weeksRemaining < Infinity && (
            <Text className="text-gray-500 dark:text-slate-400 text-[10px] ml-2 font-medium">
              {weeksRemaining} week{weeksRemaining !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {showCost && cost !== undefined && cost > 0 && (
          <View className="flex-row items-center">
            <DollarSign size={12} color="#10b981" />
            <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              £{cost.toLocaleString()}
            </Text>
          </View>
        )}
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
