# Micro-Animations Implementation Guide
## Phase 2 - CentaurOS

**Date**: 2026-01-13
**Status**: Ready for Implementation
**Library**: react-native-reanimated v3

---

## Overview

This guide provides production-ready animation patterns using react-native-reanimated v3. All animations are optimized for 60fps performance and follow iOS Human Interface Guidelines.

---

## 1. Button Press Animation

### Haptic Button with Scale Feedback

```typescript
// src/components/AnimatedButton.tsx
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { lightImpact } from '@/lib/haptics';

interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedButton({ onPress, children, className }: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.7, { duration: 150 });
    lightImpact();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
      <Animated.View style={animatedStyle} className={className}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

**Usage:**
```typescript
<AnimatedButton
  onPress={() => console.log('Pressed')}
  className="bg-blue-500 px-6 py-3 rounded-xl"
>
  <Text className="text-white font-bold">Save Changes</Text>
</AnimatedButton>
```

---

## 2. Progress Bar Animation

### Smooth Progress Transition

```typescript
// src/components/AnimatedProgressBar.tsx
import { View, Text } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  label?: string;
}

export function AnimatedProgressBar({
  progress,
  color = '#3b82f6',
  height = 8,
  label,
}: AnimatedProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View>
      {label && (
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-700 dark:text-slate-300 text-sm font-medium">{label}</Text>
          <Text className="text-gray-900 dark:text-white text-sm font-bold">{progress}%</Text>
        </View>
      )}
      <View
        className="w-full bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden"
        style={{ height }}
      >
        <Animated.View
          className="h-full rounded-full"
          style={[animatedStyle, { backgroundColor: color }]}
        />
      </View>
    </View>
  );
}
```

**Usage:**
```typescript
<AnimatedProgressBar progress={75} label="Task Completion" color="#10b981" />
```

---

## 3. Number Counter Animation

### Animated Metric Counter

```typescript
// src/components/AnimatedCounter.tsx
import { Text } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1500,
  className,
  prefix = '',
  suffix = '',
}: AnimatedCounterProps) {
  const counter = useSharedValue(0);

  useEffect(() => {
    counter.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: `${prefix}${Math.floor(counter.value)}${suffix}`,
    };
  });

  return <AnimatedText animatedProps={animatedProps} className={className} />;
}
```

**Usage:**
```typescript
<AnimatedCounter
  value={127}
  className="text-4xl font-bold text-gray-900 dark:text-white"
  suffix=" Tasks"
/>
```

---

## 4. Card Entrance Stagger Animation

### List Items with Staggered Entrance

```typescript
// src/components/AnimatedListItem.tsx
import { View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
}

export function AnimatedListItem({ children, index, delay = 100 }: AnimatedListItemProps) {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * delay,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    opacity.value = withDelay(index * delay, withTiming(1, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
```

**Usage:**
```typescript
{tasks.map((task, index) => (
  <AnimatedListItem key={task.id} index={index}>
    <TaskCard task={task} />
  </AnimatedListItem>
))}
```

---

## 5. Modal Slide-Up Animation

### Bottom Sheet Modal with Blur

```typescript
// src/components/AnimatedModal.tsx
import { Modal, View, Pressable, Dimensions } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

interface AnimatedModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function AnimatedModal({ visible, onClose, children }: AnimatedModalProps) {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(height, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1">
        <Pressable onPress={onClose} className="flex-1">
          <Animated.View style={[{ flex: 1 }, backdropStyle]}>
            <BlurView intensity={20} tint="dark" style={{ flex: 1 }} />
          </Animated.View>
        </Pressable>
        <Animated.View
          style={modalStyle}
          className="bg-white dark:bg-slate-950 rounded-t-3xl p-6"
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
```

**Usage:**
```typescript
<AnimatedModal visible={showModal} onClose={() => setShowModal(false)}>
  <Text className="text-2xl font-bold mb-4">Modal Content</Text>
</AnimatedModal>
```

---

## 6. Success Checkmark Animation

### Drawing Checkmark with Path Animation

```typescript
// src/components/SuccessCheckmark.tsx
import { View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export function SuccessCheckmark({ size = 80 }: { size?: number }) {
  const circleProgress = useSharedValue(0);
  const checkProgress = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    circleProgress.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    checkProgress.value = withDelay(
      200,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const circleAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 251 * (1 - circleProgress.value),
  }));

  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 100 * (1 - checkProgress.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <AnimatedCircle
          cx="50"
          cy="50"
          r="40"
          stroke="#10b981"
          strokeWidth="4"
          fill="none"
          strokeDasharray="251"
          animatedProps={circleAnimatedProps}
        />
        <AnimatedPath
          d="M 30 50 L 45 65 L 70 35"
          stroke="#10b981"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="100"
          animatedProps={checkAnimatedProps}
        />
      </Svg>
    </View>
  );
}
```

**Usage:**
```typescript
{taskCompleted && <SuccessCheckmark size={100} />}
```

---

## 7. Tab Switch Crossfade Animation

### Smooth Tab Content Transition

```typescript
// src/components/AnimatedTabView.tsx
import { View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

interface AnimatedTabViewProps {
  activeTab: string;
  tabs: {
    id: string;
    content: React.ReactNode;
  }[];
}

export function AnimatedTabView({ activeTab, tabs }: AnimatedTabViewProps) {
  return (
    <View className="flex-1">
      {tabs.map((tab) => {
        if (tab.id !== activeTab) return null;

        return (
          <Animated.View
            key={tab.id}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            {tab.content}
          </Animated.View>
        );
      })}
    </View>
  );
}
```

**Usage:**
```typescript
<AnimatedTabView
  activeTab={activeTab}
  tabs={[
    { id: 'overview', content: <OverviewTab /> },
    { id: 'details', content: <DetailsTab /> },
  ]}
/>
```

---

## 8. Skeleton Loading with Shimmer

### Loading Placeholder Animation

```typescript
// src/components/SkeletonLoader.tsx
import { View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export function SkeletonLoader({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-300, 300]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      className="bg-gray-200 dark:bg-slate-800 overflow-hidden"
      style={{ width, height, borderRadius }}
    >
      <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

// Pre-built skeleton components
export function SkeletonCard() {
  return (
    <View className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-3">
      <View className="flex-row items-center mb-3">
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View className="ml-3 flex-1">
          <SkeletonLoader width="60%" height={16} borderRadius={4} />
          <View className="h-2" />
          <SkeletonLoader width="40%" height={12} borderRadius={4} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={12} borderRadius={4} />
      <View className="h-2" />
      <SkeletonLoader width="80%" height={12} borderRadius={4} />
    </View>
  );
}
```

**Usage:**
```typescript
{loading ? <SkeletonCard /> : <ActualCard data={data} />}
```

---

## Implementation Rollout Plan

### Week 1: Core Animations
1. Replace all buttons with AnimatedButton
2. Add AnimatedProgressBar to OKR and task screens
3. Implement AnimatedCounter on dashboard

### Week 2: List & Modal Animations
4. Add AnimatedListItem to all FlatLists
5. Implement AnimatedModal for all modals
6. Add SuccessCheckmark to task completion flows

### Week 3: Polish & Loading States
7. Add AnimatedTabView to tab switches
8. Implement SkeletonLoader for all loading states
9. Test and optimize performance

---

## Performance Best Practices

1. **Use `worklet` for Complex Calculations**
```typescript
const calculateProgress = (value: number) => {
  'worklet';
  return (value / 100) * width;
};
```

2. **Avoid Re-renders with `runOnUI`**
```typescript
const handleAnimation = () => {
  runOnUI(() => {
    scale.value = withSpring(1.2);
  })();
};
```

3. **Cancel Animations on Unmount**
```typescript
useEffect(() => {
  return () => {
    cancelAnimation(scale);
  };
}, []);
```

4. **Use `entering`/`exiting` for Simple Animations**
```typescript
<Animated.View entering={FadeIn} exiting={FadeOut}>
  {content}
</Animated.View>
```

---

## Testing Animations

```typescript
// Test animation completes
await waitFor(() => {
  expect(scale.value).toBe(1);
});

// Test animation triggers haptic
const hapticSpy = jest.spyOn(Haptics, 'impactAsync');
fireEvent.press(button);
expect(hapticSpy).toHaveBeenCalled();
```

---

## Next Steps

1. Create `src/components/animated/` directory
2. Implement each animation component
3. Replace existing components gradually
4. Test on real devices for 60fps performance
5. Document any custom animations added
