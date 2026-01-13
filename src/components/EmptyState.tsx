/**
 * EmptyState Component
 * Beautiful, contextual empty states following iOS design patterns
 */

import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { HapticPressable } from './HapticPressable';

interface EmptyStateProps {
  /**
   * Icon to display (Lucide icon component)
   */
  icon: LucideIcon;

  /**
   * Main title
   */
  title: string;

  /**
   * Description text
   */
  description: string;

  /**
   * Optional action button text
   */
  actionText?: string;

  /**
   * Optional action handler
   */
  onAction?: () => void;

  /**
   * Icon color
   * @default '#94a3b8' (slate-400)
   */
  iconColor?: string;

  /**
   * Secondary action button text
   */
  secondaryActionText?: string;

  /**
   * Secondary action handler
   */
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  iconColor = '#94a3b8',
  secondaryActionText,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {/* Icon */}
      <View className="w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-900 items-center justify-center mb-6">
        <Icon size={48} color={iconColor} strokeWidth={1.5} />
      </View>

      {/* Title */}
      <Text className="text-gray-900 dark:text-white text-2xl font-bold text-center mb-3">
        {title}
      </Text>

      {/* Description */}
      <Text className="text-gray-600 dark:text-slate-400 text-base text-center mb-8 leading-6 max-w-sm">
        {description}
      </Text>

      {/* Primary Action */}
      {actionText && onAction && (
        <HapticPressable
          onPress={onAction}
          className="bg-blue-500 px-8 py-4 rounded-xl active:opacity-80 mb-3"
        >
          <Text className="text-white font-bold text-base">{actionText}</Text>
        </HapticPressable>
      )}

      {/* Secondary Action */}
      {secondaryActionText && onSecondaryAction && (
        <HapticPressable
          onPress={onSecondaryAction}
          className="active:opacity-70"
        >
          <Text className="text-blue-500 font-semibold text-base">{secondaryActionText}</Text>
        </HapticPressable>
      )}
    </View>
  );
}
