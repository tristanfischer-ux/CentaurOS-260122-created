import { View, Pressable } from 'react-native';
import { ReactNode, useCallback } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { GripVertical } from 'lucide-react-native';

interface DraggableOKRCardProps {
  okrId: string;
  onDragStart: (okrId: string) => void;
  onDragEnd: (okrId: string, translationY: number) => void;
  onPress: () => void;
  isDragging: boolean;
  children: ReactNode;
}

export function DraggableOKRCard({
  okrId,
  onDragStart,
  onDragEnd,
  onPress,
  isDragging,
  children,
}: DraggableOKRCardProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handleDragStart = useCallback(() => {
    onDragStart(okrId);
  }, [okrId, onDragStart]);

  const handleDragEnd = useCallback((translationY: number) => {
    onDragEnd(okrId, translationY);
  }, [okrId, onDragEnd]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.02);
      zIndex.value = 100;
      opacity.value = 0.9;
      runOnJS(handleDragStart)();
    })
    .onChange((e) => {
      translateY.value = e.translationY;
      translateX.value = e.translationX * 0.1; // Subtle horizontal movement
    })
    .onEnd((e) => {
      runOnJS(handleDragEnd)(e.translationY);
      translateY.value = withSpring(0);
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      opacity.value = 1;
    });

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
      <View className="flex-row items-stretch">
        <GestureDetector gesture={panGesture}>
          <View className="justify-center px-1 py-2">
            <View className="bg-gray-200 dark:bg-slate-700 rounded-lg p-1.5 active:bg-gray-300 dark:active:bg-slate-600">
              <GripVertical size={16} color="#9ca3af" />
            </View>
          </View>
        </GestureDetector>
        <Pressable onPress={onPress} className="flex-1">
          {children}
        </Pressable>
      </View>
    </Animated.View>
  );
}

interface DraggableTaskCardProps {
  taskId: string;
  onDragStart: (taskId: string) => void;
  onDragEnd: (taskId: string, translationY: number) => void;
  onPress: () => void;
  onDropTarget: (taskId: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  children: ReactNode;
}

export function DraggableTaskCard({
  taskId,
  onDragStart,
  onDragEnd,
  onPress,
  onDropTarget,
  isDragging,
  isDropTarget,
  children,
}: DraggableTaskCardProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handleDragStart = useCallback(() => {
    onDragStart(taskId);
  }, [taskId, onDragStart]);

  const handleDragEnd = useCallback((translationY: number) => {
    onDragEnd(taskId, translationY);
  }, [taskId, onDragEnd]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.02);
      zIndex.value = 100;
      opacity.value = 0.9;
      runOnJS(handleDragStart)();
    })
    .onChange((e) => {
      translateY.value = e.translationY;
      translateX.value = e.translationX * 0.1;
    })
    .onEnd((e) => {
      runOnJS(handleDragEnd)(e.translationY);
      translateY.value = withSpring(0);
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      opacity.value = 1;
    });

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
      <View className="flex-row items-stretch">
        <GestureDetector gesture={panGesture}>
          <View className="justify-center px-1 py-2">
            <View className="bg-gray-200 dark:bg-slate-700 rounded-lg p-1 active:bg-gray-300 dark:active:bg-slate-600">
              <GripVertical size={14} color="#9ca3af" />
            </View>
          </View>
        </GestureDetector>
        <Pressable
          onPress={onPress}
          onLongPress={() => onDropTarget(taskId)}
          className={`flex-1 ${isDropTarget ? 'border-2 border-green-400 dark:border-green-600 rounded-xl' : ''}`}
        >
          {children}
        </Pressable>
      </View>
    </Animated.View>
  );
}
