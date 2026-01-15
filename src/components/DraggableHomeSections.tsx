/**
 * Draggable Home Sections
 *
 * Enables long-press to edit and drag-to-reorder sections on the Home tab.
 * - Long press any section to enter edit mode (wiggle animation)
 * - Drag sections to reorder them
 * - Order is persisted to AsyncStorage
 */

import { View, Text, Pressable } from 'react-native';
import { ReactNode, useEffect, useCallback, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { GripVertical } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WIGGLE_ANGLE = 1.5;
const STORAGE_KEY = 'home-section-order';

// ============ DRAGGABLE SECTION WRAPPER ============

interface DraggableSectionProps {
  id: string;
  index: number;
  isEditMode: boolean;
  isDragging: boolean;
  onLongPress: () => void;
  onDragStart: (index: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  sectionHeight?: number;
  children: ReactNode;
}

export function DraggableSection({
  id,
  index,
  isEditMode,
  isDragging,
  onLongPress,
  onDragStart,
  onDragEnd,
  sectionHeight = 120,
  children,
}: DraggableSectionProps) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const zIndex = useSharedValue(0);

  // Wiggle animation when in edit mode
  useEffect(() => {
    if (isEditMode && !isDragging) {
      const randomOffset = Math.random() * 300;
      const timeout = setTimeout(() => {
        rotation.value = withRepeat(
          withSequence(
            withTiming(WIGGLE_ANGLE, { duration: 80 }),
            withTiming(-WIGGLE_ANGLE, { duration: 80 }),
            withTiming(WIGGLE_ANGLE, { duration: 80 }),
            withTiming(0, { duration: 80 })
          ),
          -1,
          true
        );
      }, randomOffset);
      return () => clearTimeout(timeout);
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 100 });
    }
  }, [isEditMode, isDragging, rotation]);

  const panGesture = Gesture.Pan()
    .enabled(isEditMode)
    .onStart(() => {
      'worklet';
      zIndex.value = 100;
      scale.value = withSpring(1.02);
      runOnJS(onDragStart)(index);
    })
    .onUpdate((event) => {
      'worklet';
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      const positions = Math.round(event.translationY / sectionHeight);
      const targetIndex = index + positions;
      runOnJS(onDragEnd)(index, targetIndex);
      translateY.value = withSpring(0, { damping: 15 });
      scale.value = withSpring(1);
      zIndex.value = 0;
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onEnd((_, success) => {
      'worklet';
      if (success) {
        runOnJS(onLongPress)();
      }
    });

  const composedGesture = Gesture.Race(panGesture, longPressGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={animatedStyle} className="relative">
        {isEditMode && (
          <View className="absolute -left-1 top-0 bottom-0 justify-center z-10">
            <View className="bg-purple-600/90 rounded-l-lg p-1.5">
              <GripVertical size={14} color="#fff" />
            </View>
          </View>
        )}
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// ============ EDIT MODE BANNER ============

interface EditModeBannerProps {
  visible: boolean;
  onDone: () => void;
}

export function EditModeBanner({ visible, onDone }: EditModeBannerProps) {
  if (!visible) return null;

  return (
    <View className="bg-purple-600 py-3 px-5 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <GripVertical size={18} color="#fff" />
        <Text className="text-white font-semibold ml-2">Editing Layout</Text>
      </View>
      <Pressable
        onPress={onDone}
        className="bg-white/20 px-4 py-1.5 rounded-full active:opacity-70"
      >
        <Text className="text-white font-semibold">Done</Text>
      </Pressable>
    </View>
  );
}

// ============ HOOK FOR SECTION ORDERING ============

export function useSectionOrder(defaultOrder: string[]) {
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultOrder);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSectionOrder(parsed);
          }
        } catch {}
      }
    });
  }, []);

  const handleLongPress = useCallback(() => {
    if (!isEditMode) {
      setIsEditMode(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [isEditMode]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex) {
      setSectionOrder(prev => {
        const newOrder = [...prev];
        const [removed] = newOrder.splice(fromIndex, 1);
        const targetIdx = Math.min(Math.max(0, toIndex), newOrder.length);
        newOrder.splice(targetIdx, 0, removed);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
        return newOrder;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setDraggedIndex(null);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    setDraggedIndex(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return {
    sectionOrder,
    isEditMode,
    draggedIndex,
    handleLongPress,
    handleDragStart,
    handleDragEnd,
    exitEditMode,
  };
}
