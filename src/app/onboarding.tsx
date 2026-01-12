// Onboarding screen component
// Beautiful, interactive walkthrough for first-time users

import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Home,
  Target,
  ClipboardList,
  Users,
  CheckCircle,
  Briefcase,
  Network,
  Calendar,
  Settings,
  Trophy,
  Award,
  BarChart,
  Zap,
  Check,
  Eye,
  TrendingUp,
  Book,
  Rocket,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';
import { useAppStore } from '@/lib/state/app-store';
import { getOnboardingFlow, markOnboardingComplete, type OnboardingStep } from '@/lib/onboarding';
import { cn } from '@/lib/cn';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Icon mapping
const ICON_MAP: Record<string, any> = {
  home: Home,
  target: Target,
  clipboard: ClipboardList,
  users: Users,
  'check-circle': CheckCircle,
  briefcase: Briefcase,
  sitemap: Network,
  calendar: Calendar,
  settings: Settings,
  trophy: Trophy,
  award: Award,
  'bar-chart': BarChart,
  zap: Zap,
  check: Check,
  eye: Eye,
  'trending-up': TrendingUp,
  book: Book,
  rocket: Rocket,
};

export default function OnboardingScreen() {
  const currentUser = useAppStore((s) => s.currentUser);
  const currentMembership = useAppStore((s) => s.currentMembership);
  const role = currentMembership?.role || 'Founder';

  const onboardingFlow = getOnboardingFlow(role);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const currentStep = onboardingFlow.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === onboardingFlow.steps.length - 1;

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Animate on step change
  const animateStep = () => {
    scale.value = 0;
    opacity.value = 0;
    scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
  };

  useState(() => {
    animateStep();
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
      animateStep();
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
      animateStep();
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    if (currentUser) {
      await markOnboardingComplete(currentUser.id);
    }
    router.replace('/(tabs)');
  };

  const IconComponent = currentStep.illustration ? ICON_MAP[currentStep.illustration] : Rocket;

  // Role-specific gradient colors
  const gradientColors: Record<string, readonly [string, string, string, string]> = {
    Founder: ['#6366f1', '#8b5cf6', '#d946ef', '#0f172a'] as const,
    FractionalExec: ['#0ea5e9', '#06b6d4', '#14b8a6', '#0f172a'] as const,
    Apprentice: ['#f59e0b', '#f97316', '#ef4444', '#0f172a'] as const,
  };

  const currentGradient = gradientColors[role] || gradientColors.Founder;

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <LinearGradient
        colors={currentGradient}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-12 justify-between">
            {/* Header */}
            <View className="items-end">
              <Pressable
                onPress={handleSkip}
                className="px-4 py-2 bg-white/10 rounded-full active:opacity-70"
              >
                <Text className="text-white font-semibold text-sm">Skip</Text>
              </Pressable>
            </View>

            {/* Main Content */}
            <Animated.View style={[{ flex: 1, justifyContent: 'center' }, animatedStyle]}>
              <View className="items-center mb-8">
                {/* Icon */}
                <View className="w-32 h-32 bg-white/10 rounded-full items-center justify-center mb-8 border-4 border-white/20">
                  {IconComponent && <IconComponent size={64} color="white" strokeWidth={1.5} />}
                </View>

                {/* Step Number */}
                <View className="mb-4">
                  <Text className="text-white/60 text-center font-medium text-sm">
                    {currentStepIndex + 1} of {onboardingFlow.steps.length}
                  </Text>
                </View>

                {/* Title */}
                <Text className="text-gray-900 dark:text-white text-3xl font-bold text-center mb-4 px-4">
                  {currentStep.title}
                </Text>

                {/* Description */}
                <Text className="text-white/80 text-lg text-center leading-7 px-4">
                  {currentStep.description}
                </Text>
              </View>
            </Animated.View>

            {/* Progress Dots */}
            <View className="mb-6">
              <View className="flex-row justify-center gap-2">
                {onboardingFlow.steps.map((_, index) => (
                  <View
                    key={index}
                    className={cn(
                      'rounded-full transition-all',
                      index === currentStepIndex
                        ? 'w-8 h-2 bg-white'
                        : index < currentStepIndex
                        ? 'w-2 h-2 bg-white/60'
                        : 'w-2 h-2 bg-white/20'
                    )}
                  />
                ))}
              </View>
            </View>

            {/* Navigation Buttons */}
            <View className="flex-row gap-3">
              {/* Previous Button */}
              {!isFirstStep && (
                <Pressable
                  onPress={handlePrevious}
                  className="flex-1 bg-white/10 rounded-2xl py-5 flex-row items-center justify-center active:opacity-70"
                >
                  <ChevronLeft size={24} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Previous</Text>
                </Pressable>
              )}

              {/* Next/Complete Button */}
              <Pressable
                onPress={handleNext}
                className={cn(
                  'rounded-2xl py-5 flex-row items-center justify-center active:opacity-90 shadow-lg',
                  isFirstStep ? 'flex-1' : 'flex-1',
                  'bg-white'
                )}
              >
                <Text className="text-slate-900 font-bold text-lg mr-2">
                  {isLastStep ? 'Get Started' : 'Next'}
                </Text>
                {!isLastStep && <ChevronRight size={24} color="#0f172a" />}
                {isLastStep && <Trophy size={24} color="#0f172a" />}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
