import { View, Pressable, Text } from 'react-native';
import { ReactNode, useCallback } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { Trash2, Archive } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SwipeableOKRCardProps {
  okrId: string;
  onSwipeLeft: (okrId: string) => void; // Called when swiped left beyond threshold
  onPress: () => void;
  children: ReactNode;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 100; // How far to swipe before triggering action
const MAX_SWIPE = 150; // Maximum swipe distance

export function SwipeableOKRCard({
  okrId,
  onSwipeLeft,
  onPress,
  children,
  disabled = false,
}: SwipeableOKRCardProps) {
  const translateX = useSharedValue(0);
  const actionTriggered = useSharedValue(false);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleSwipeAction = useCallback(() => {
    onSwipeLeft(okrId);
  }, [okrId, onSwipeLeft]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-15, 15])
    .failOffsetY([-20, 20])
    .maxPointers(1)
    .onChange((e) => {
      // Only allow left swipe (negative values)
      if (e.translationX < 0) {
        translateX.value = Math.max(-MAX_SWIPE, e.translationX);

        // Trigger haptic when crossing threshold
        if (!actionTriggered.value && translateX.value < -SWIPE_THRESHOLD) {
          actionTriggered.value = true;
          runOnJS(triggerHaptic)();
        } else if (actionTriggered.value && translateX.value > -SWIPE_THRESHOLD) {
          actionTriggered.value = false;
        }
      }
    })
    .onEnd(() => {
      // If swiped past threshold, trigger action
      if (translateX.value < -SWIPE_THRESHOLD) {
        runOnJS(handleSwipeAction)();
      }

      // Reset position
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      actionTriggered.value = false;
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 1)'] // red-500
    );

    return {
      backgroundColor,
      opacity: Math.abs(translateX.value) / SWIPE_THRESHOLD,
    };
  });

  return (
    <View className="relative">
      {/* Background action indicator */}
      <Animated.View
        style={[animatedBackgroundStyle]}
        className="absolute right-0 top-0 bottom-0 rounded-xl justify-center items-end px-6"
        pointerEvents="none"
      >
        <Archive size={24} color="#fff" />
        <Text className="text-white text-xs font-bold mt-1">QUEUE</Text>
      </Animated.View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedCardStyle}>
          <Pressable onPress={onPress} className="flex-1">
            {children}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

interface SwipeableTaskCardProps {
  taskId: string;
  onSwipeLeft: (taskId: string) => void;
  onPress: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export function SwipeableTaskCard({
  taskId,
  onSwipeLeft,
  onPress,
  children,
  disabled = false,
}: SwipeableTaskCardProps) {
  const translateX = useSharedValue(0);
  const actionTriggered = useSharedValue(false);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleSwipeAction = useCallback(() => {
    onSwipeLeft(taskId);
  }, [taskId, onSwipeLeft]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-15, 15])
    .failOffsetY([-20, 20])
    .maxPointers(1)
    .onChange((e) => {
      // Only allow left swipe (negative values)
      if (e.translationX < 0) {
        translateX.value = Math.max(-MAX_SWIPE, e.translationX);

        // Trigger haptic when crossing threshold
        if (!actionTriggered.value && translateX.value < -SWIPE_THRESHOLD) {
          actionTriggered.value = true;
          runOnJS(triggerHaptic)();
        } else if (actionTriggered.value && translateX.value > -SWIPE_THRESHOLD) {
          actionTriggered.value = false;
        }
      }
    })
    .onEnd(() => {
      // If swiped past threshold, trigger action
      if (translateX.value < -SWIPE_THRESHOLD) {
        runOnJS(handleSwipeAction)();
      }

      // Reset position
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      actionTriggered.value = false;
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 1)'] // red-500
    );

    return {
      backgroundColor,
      opacity: Math.abs(translateX.value) / SWIPE_THRESHOLD,
    };
  });

  return (
    <View className="relative">
      {/* Background action indicator */}
      <Animated.View
        style={[animatedBackgroundStyle]}
        className="absolute right-0 top-0 bottom-0 rounded-xl justify-center items-end px-6"
        pointerEvents="none"
      >
        <Trash2 size={20} color="#fff" />
        <Text className="text-white text-xs font-bold mt-1">DELETE</Text>
      </Animated.View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedCardStyle}>
          <Pressable onPress={onPress} className="flex-1">
            {children}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
