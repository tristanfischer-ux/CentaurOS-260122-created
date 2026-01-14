import { View, Pressable, Dimensions } from 'react-native';
import { ReactNode, useCallback, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GripVertical } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DraggableOKRCardProps {
  okrId: string;
  onDragStart: (okrId: string) => void;
  onDragEnd: (okrId: string, translationY: number, absoluteY: number) => void;
  onDragMove?: (okrId: string, absoluteY: number) => void;
  onPress: () => void;
  isDragging: boolean;
  isDropTarget?: boolean;
  children: ReactNode;
}

export function DraggableOKRCard({
  okrId,
  onDragStart,
  onDragEnd,
  onDragMove,
  onPress,
  isDragging,
  isDropTarget,
  children,
}: DraggableOKRCardProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isActive = useSharedValue(false);
  const startY = useRef(0);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragStart = useCallback(() => {
    onDragStart(okrId);
  }, [okrId, onDragStart]);

  const handleDragEnd = useCallback((translationY: number, absoluteY: number) => {
    onDragEnd(okrId, translationY, absoluteY);
  }, [okrId, onDragEnd]);

  const handleDragMove = useCallback((absoluteY: number) => {
    onDragMove?.(okrId, absoluteY);
  }, [okrId, onDragMove]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart((e) => {
      isActive.value = true;
      startY.current = e.absoluteY;
      scale.value = withSpring(1.05);
      zIndex.value = 100;
      opacity.value = 0.95;
      runOnJS(triggerHaptic)();
      runOnJS(handleDragStart)();
    });

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((e, state) => {
      if (isActive.value) {
        state.activate();
      }
    })
    .onChange((e) => {
      if (isActive.value) {
        translateY.value = e.translationY;
        translateX.value = e.translationX * 0.15;
        runOnJS(handleDragMove)(e.absoluteY);
      }
    })
    .onEnd((e) => {
      if (isActive.value) {
        runOnJS(handleDragEnd)(e.translationY, e.absoluteY);
      }
      translateY.value = withSpring(0);
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      opacity.value = 1;
      isActive.value = false;
    })
    .onFinalize(() => {
      translateY.value = withSpring(0);
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      opacity.value = 1;
      isActive.value = false;
    });

  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    opacity: opacity.value,
  }));

  const dropTargetStyle = useAnimatedStyle(() => ({
    borderWidth: isDropTarget ? 2 : 0,
    borderColor: isDropTarget ? '#22c55e' : 'transparent',
    borderRadius: 12,
  }));

  return (
    <Animated.View style={[animatedStyle, dropTargetStyle]}>
      <GestureDetector gesture={composedGesture}>
        <Pressable onPress={onPress} className="flex-1">
          <View className="flex-row items-stretch">
            <View className="justify-center px-1 py-2">
              <View className="bg-gray-200 dark:bg-slate-700 rounded-lg p-1.5">
                <GripVertical size={16} color="#9ca3af" />
              </View>
            </View>
            <View className="flex-1">
              {children}
            </View>
          </View>
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

interface DraggableTaskCardProps {
  taskId: string;
  onDragStart: (taskId: string) => void;
  onDragEnd: (taskId: string, translationY: number, absoluteY: number) => void;
  onDragMove?: (taskId: string, absoluteY: number) => void;
  onPress: () => void;
  isDragging: boolean;
  isDropTarget?: boolean;
  isBeingDraggedOver?: boolean;
  children: ReactNode;
}

export function DraggableTaskCard({
  taskId,
  onDragStart,
  onDragEnd,
  onDragMove,
  onPress,
  isDragging,
  isDropTarget,
  isBeingDraggedOver,
  children,
}: DraggableTaskCardProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isActive = useSharedValue(false);
  const startY = useRef(0);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragStart = useCallback(() => {
    onDragStart(taskId);
  }, [taskId, onDragStart]);

  const handleDragEnd = useCallback((translationY: number, absoluteY: number) => {
    onDragEnd(taskId, translationY, absoluteY);
  }, [taskId, onDragEnd]);

  const handleDragMove = useCallback((absoluteY: number) => {
    onDragMove?.(taskId, absoluteY);
  }, [taskId, onDragMove]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart((e) => {
      isActive.value = true;
      startY.current = e.absoluteY;
      scale.value = withSpring(1.05);
      zIndex.value = 100;
      opacity.value = 0.95;
      runOnJS(triggerHaptic)();
      runOnJS(handleDragStart)();
    });

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((e, state) => {
      if (isActive.value) {
        state.activate();
      }
    })
    .onChange((e) => {
      if (isActive.value) {
        translateY.value = e.translationY;
        translateX.value = e.translationX * 0.15;
        runOnJS(handleDragMove)(e.absoluteY);
      }
    })
    .onEnd((e) => {
      if (isActive.value) {
        runOnJS(handleDragEnd)(e.translationY, e.absoluteY);
      }
      translateY.value = withSpring(0);
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      opacity.value = 1;
      isActive.value = false;
    })
    .onFinalize(() => {
      translateY.value = withSpring(0);
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      opacity.value = 1;
      isActive.value = false;
    });

  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <GestureDetector gesture={composedGesture}>
        <Pressable onPress={onPress} className="flex-1">
          <View
            className={`flex-row items-stretch rounded-xl ${
              isBeingDraggedOver
                ? 'border-2 border-dashed border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20'
                : isDropTarget
                  ? 'border-2 border-purple-400 dark:border-purple-500'
                  : ''
            }`}
          >
            <View className="justify-center px-1 py-1.5">
              <View className="bg-gray-200 dark:bg-slate-700 rounded p-1">
                <GripVertical size={12} color="#9ca3af" />
              </View>
            </View>
            <View className="flex-1">
              {children}
            </View>
          </View>
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

// Drop zone indicator component
interface DropZoneProps {
  isActive: boolean;
  label: string;
  variant: 'create-okr' | 'queued' | 'active';
}

export function DropZone({ isActive, label, variant }: DropZoneProps) {
  const colors = {
    'create-okr': {
      active: 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-500',
      inactive: 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600',
      text: 'text-purple-600 dark:text-purple-400',
    },
    'queued': {
      active: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500',
      inactive: 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600',
      text: 'text-blue-600 dark:text-blue-400',
    },
    'active': {
      active: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-500',
      inactive: 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
  };

  const style = colors[variant];

  return (
    <View
      className={`border-2 border-dashed rounded-xl p-4 items-center justify-center ${
        isActive ? style.active : style.inactive
      }`}
    >
      <View className={`text-sm font-semibold ${style.text}`}>
        {/* The Text component will be rendered where this is used */}
      </View>
    </View>
  );
}
