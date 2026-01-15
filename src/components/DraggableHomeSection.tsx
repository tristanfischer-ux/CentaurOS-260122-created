/**
 * Draggable Home Section Component
 *
 * Wraps home screen sections to make them draggable.
 * - Long press (hold) to enter edit mode with wiggle animation
 * - Drag to reorder sections
 * - Drop to snap into new position
 * - Items swap positions when dropped on another item
 */

import { View, Text, Pressable, Dimensions } from 'react-native';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  runOnJS,
  cancelAnimation,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { GripVertical, X } from 'lucide-react-native';

interface DraggableSectionProps {
  id: string;
  index: number;
  isEditMode: boolean;
  isDragging: boolean;
  draggedIndex: number | null;
  onDragStart: (index: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  onDragMove: (index: number, translationY: number) => void;
  onLongPress: () => void;
  sectionHeight: number;
  children: ReactNode;
}

const WIGGLE_ANGLE = 1.5; // Degrees
const DRAG_SCALE = 1.02;

export function DraggableSection({
  id,
  index,
  isEditMode,
  isDragging,
  draggedIndex,
  onDragStart,
  onDragEnd,
  onDragMove,
  onLongPress,
  sectionHeight,
  children,
}: DraggableSectionProps) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const [isBeingDragged, setIsBeingDragged] = useState(false);

  // Wiggle animation when in edit mode
  useEffect(() => {
    if (isEditMode && !isDragging) {
      // Start wiggle animation with random offset for each item
      const randomOffset = Math.random() * 200;
      setTimeout(() => {
        rotation.value = withRepeat(
          withSequence(
            withTiming(WIGGLE_ANGLE, { duration: 100 }),
            withTiming(-WIGGLE_ANGLE, { duration: 100 }),
            withTiming(WIGGLE_ANGLE, { duration: 100 }),
            withTiming(0, { duration: 100 })
          ),
          -1, // Infinite repeat
          true
        );
      }, randomOffset);
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 100 });
    }
  }, [isEditMode, isDragging, rotation]);

  // Handle position changes when other items are dragged
  useEffect(() => {
    if (draggedIndex !== null && draggedIndex !== index && !isBeingDragged) {
      // This item might need to move to make room
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    }
  }, [draggedIndex, index, isBeingDragged, translateY]);

  const panGesture = Gesture.Pan()
    .enabled(isEditMode)
    .onStart(() => {
      'worklet';
      runOnJS(setIsBeingDragged)(true);
      zIndex.value = 100;
      scale.value = withSpring(DRAG_SCALE);
      opacity.value = withTiming(0.9);
      runOnJS(onDragStart)(index);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((event) => {
      'worklet';
      translateY.value = event.translationY;
      runOnJS(onDragMove)(index, event.translationY);
    })
    .onEnd((event) => {
      'worklet';
      // Calculate which position to snap to
      const moveDistance = event.translationY;
      const positions = Math.round(moveDistance / sectionHeight);
      const targetIndex = Math.max(0, index + positions);

      runOnJS(onDragEnd)(index, targetIndex);
      runOnJS(setIsBeingDragged)(false);

      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      scale.value = withSpring(1);
      opacity.value = withTiming(1);
      zIndex.value = 0;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onEnd((_, success) => {
      'worklet';
      if (success) {
        runOnJS(onLongPress)();
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
      }
    });

  const composedGesture = Gesture.Race(panGesture, longPressGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
      zIndex: zIndex.value,
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={animatedStyle} className="relative">
        {/* Edit mode indicator */}
        {isEditMode && (
          <View className="absolute -left-2 top-0 bottom-0 justify-center z-10">
            <View className="bg-slate-700 rounded-l-lg p-1">
              <GripVertical size={16} color="#94a3b8" />
            </View>
          </View>
        )}
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// Hook to manage draggable sections
interface SectionConfig {
  id: string;
  visible: boolean;
}

interface UseDraggableSectionsResult {
  sections: SectionConfig[];
  isEditMode: boolean;
  draggedIndex: number | null;
  setEditMode: (mode: boolean) => void;
  handleDragStart: (index: number) => void;
  handleDragEnd: (fromIndex: number, toIndex: number) => void;
  handleDragMove: (index: number, translationY: number) => void;
  getSectionOrder: () => string[];
}

export function useDraggableSections(
  initialSections: SectionConfig[],
  onOrderChange?: (newOrder: string[]) => void
): UseDraggableSectionsResult {
  const [sections, setSections] = useState(initialSections);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const setEditMode = useCallback((mode: boolean) => {
    setIsEditMode(mode);
    if (!mode) {
      setDraggedIndex(null);
    }
    Haptics.impactAsync(mode ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      setDraggedIndex(null);
      return;
    }

    setSections(prev => {
      const newSections = [...prev];
      const [removed] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, removed);

      // Notify parent of order change
      const newOrder = newSections.map(s => s.id);
      onOrderChange?.(newOrder);

      return newSections;
    });

    setDraggedIndex(null);
  }, [onOrderChange]);

  const handleDragMove = useCallback((index: number, translationY: number) => {
    // Could be used to highlight drop targets
  }, []);

  const getSectionOrder = useCallback(() => {
    return sections.map(s => s.id);
  }, [sections]);

  return {
    sections,
    isEditMode,
    draggedIndex,
    setEditMode,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    getSectionOrder,
  };
}

// Edit mode toggle button
interface EditModeButtonProps {
  isEditMode: boolean;
  onToggle: () => void;
}

export function EditModeButton({ isEditMode, onToggle }: EditModeButtonProps) {
  return (
    <Pressable
      onPress={onToggle}
      className={`px-3 py-1.5 rounded-full ${
        isEditMode ? 'bg-purple-500' : 'bg-slate-700'
      } active:opacity-70`}
    >
      <Text className="text-white text-xs font-semibold">
        {isEditMode ? 'Done' : 'Edit'}
      </Text>
    </Pressable>
  );
}

// Exit edit mode overlay
interface EditModeOverlayProps {
  isEditMode: boolean;
  onExit: () => void;
}

export function EditModeOverlay({ isEditMode, onExit }: EditModeOverlayProps) {
  if (!isEditMode) return null;

  return (
    <Animated.View
      className="absolute top-0 left-0 right-0 bg-purple-600 py-2 px-4 flex-row items-center justify-between z-50"
    >
      <Text className="text-white font-semibold">Editing Layout</Text>
      <Pressable
        onPress={onExit}
        className="bg-white/20 px-4 py-1.5 rounded-full active:opacity-70"
      >
        <Text className="text-white font-semibold">Done</Text>
      </Pressable>
    </Animated.View>
  );
}
