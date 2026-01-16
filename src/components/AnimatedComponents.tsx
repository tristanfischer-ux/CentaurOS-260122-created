import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import type { ComponentProps } from 'react';

// Animated list item with fade in
export function AnimatedListItem({
  children,
  index = 0,
  delay = 50,
}: {
  children: React.ReactNode;
  index?: number;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * delay).springify()}>
      {children}
    </Animated.View>
  );
}

// Animated card with slide in
export function AnimatedCard({
  children,
  index = 0,
  delay = 100,
}: {
  children: React.ReactNode;
  index?: number;
  delay?: number;
}) {
  return (
    <Animated.View entering={SlideInRight.delay(index * delay).springify()}>
      {children}
    </Animated.View>
  );
}

// Fade in container
export function FadeInContainer({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(300)}>
      {children}
    </Animated.View>
  );
}
