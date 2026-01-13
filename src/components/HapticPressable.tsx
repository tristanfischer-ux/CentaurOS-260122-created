/**
 * HapticPressable
 * A Pressable component with built-in haptic feedback
 * Drop-in replacement for standard Pressable with enhanced UX
 */

import { Pressable, PressableProps } from 'react-native';
import { lightImpact } from '@/lib/haptics';

interface HapticPressableProps extends PressableProps {
  /**
   * Type of haptic feedback to provide
   * @default 'light'
   */
  hapticType?: 'light' | 'medium' | 'heavy' | 'none';

  /**
   * Whether to disable haptics
   * @default false
   */
  disableHaptics?: boolean;
}

/**
 * Pressable with automatic haptic feedback
 *
 * @example
 * ```tsx
 * <HapticPressable onPress={handlePress} hapticType="medium">
 *   <Text>Press me</Text>
 * </HapticPressable>
 * ```
 */
export function HapticPressable({
  onPress,
  onPressIn,
  hapticType = 'light',
  disableHaptics = false,
  ...props
}: HapticPressableProps) {
  const handlePressIn = (event: any) => {
    if (!disableHaptics && hapticType !== 'none') {
      lightImpact();
    }
    onPressIn?.(event);
  };

  return (
    <Pressable
      {...props}
      onPress={onPress}
      onPressIn={handlePressIn}
    />
  );
}
