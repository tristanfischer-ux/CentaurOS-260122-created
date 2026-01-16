/**
 * Onboarding Screen - Immersive Introduction Experience
 * Beautiful, animated walkthrough showcasing the Executive Command Center
 */

import { View, Text, Pressable, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Home,
  Target,
  ClipboardList,
  Users,
  CheckCircle,
  Briefcase,
  Calendar,
  Settings,
  Trophy,
  Award,
  BarChart3,
  Zap,
  AlertTriangle,
  Activity,
  Clock,
  TrendingUp,
  Book,
  Rocket,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  PieChart,
  Play,
  AlertCircle,
  Info,
  Flag,
  User,
  MessageCircle,
  Star,
  Upload,
  RefreshCw,
  HelpCircle,
  Flame,
  FileText,
  List,
  Building2,
  LayoutGrid,
} from 'lucide-react-native';
import { useAppStore } from '@/lib/state/app-store';
import { getOnboardingFlow, markOnboardingComplete, type OnboardingFeature } from '@/lib/onboarding';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Extended icon mapping for all the new icons
const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  home: Home,
  target: Target,
  clipboard: ClipboardList,
  users: Users,
  'check-circle': CheckCircle,
  briefcase: Briefcase,
  calendar: Calendar,
  settings: Settings,
  trophy: Trophy,
  award: Award,
  'bar-chart': BarChart3,
  zap: Zap,
  'alert-triangle': AlertTriangle,
  activity: Activity,
  clock: Clock,
  'trending-up': TrendingUp,
  book: Book,
  rocket: Rocket,
  'dollar-sign': DollarSign,
  'pie-chart': PieChart,
  play: Play,
  'alert-circle': AlertCircle,
  info: Info,
  flag: Flag,
  user: User,
  'message-circle': MessageCircle,
  star: Star,
  upload: Upload,
  'refresh-cw': RefreshCw,
  'help-circle': HelpCircle,
  flame: Flame,
  'file-text': FileText,
  list: List,
  building: Building2,
  layout: LayoutGrid,
};

// Animated background particles
function BackgroundParticles() {
  return (
    <View className="absolute inset-0 overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <Animated.View
          key={i}
          entering={FadeInDown.delay(i * 100).duration(1000)}
          className="absolute rounded-full bg-white/5"
          style={{
            width: 20 + Math.random() * 60,
            height: 20 + Math.random() * 60,
            left: Math.random() * SCREEN_WIDTH,
            top: Math.random() * SCREEN_HEIGHT,
          }}
        />
      ))}
    </View>
  );
}

// Feature pill component
interface FeaturePillProps {
  feature: OnboardingFeature;
  index: number;
}

function FeaturePill({ feature, index }: FeaturePillProps) {
  const Icon = ICON_MAP[feature.icon] || Zap;

  return (
    <Animated.View
      entering={FadeInDown.delay(400 + index * 100).springify()}
      className="flex-row items-center gap-2 bg-white/10 rounded-full px-3 py-2 mr-2 mb-2"
    >
      <View
        className="w-6 h-6 rounded-full items-center justify-center"
        style={{ backgroundColor: feature.color + '30' }}
      >
        <Icon size={12} color={feature.color} />
      </View>
      <Text className="text-white text-xs font-medium">{feature.label}</Text>
    </Animated.View>
  );
}

// Progress indicator
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <View className="flex-row items-center gap-1.5">
      {[...Array(totalSteps)].map((_, i) => (
        <View
          key={i}
          className={`rounded-full transition-all ${
            i === currentStep
              ? 'w-6 h-2 bg-white'
              : i < currentStep
              ? 'w-2 h-2 bg-white/60'
              : 'w-2 h-2 bg-white/20'
          }`}
        />
      ))}
    </View>
  );
}

// Animated icon display
interface AnimatedIconProps {
  iconName: string;
  isAnimating: boolean;
}

function AnimatedIcon({ iconName, isAnimating }: AnimatedIconProps) {
  const Icon = ICON_MAP[iconName] || Rocket;
  const scale = useSharedValue(0.8);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isAnimating) {
      scale.value = withSequence(
        withSpring(1.1, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );
      rotation.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }
  }, [isAnimating, scale, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="w-32 h-32 rounded-3xl bg-white/10 items-center justify-center border-2 border-white/20"
    >
      <Icon size={56} color="white" strokeWidth={1.5} />
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentMembership = useAppStore((s) => s.currentMembership);
  const role = currentMembership?.role || 'Founder';

  const onboardingFlow = getOnboardingFlow(role);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const currentStep = onboardingFlow.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === onboardingFlow.steps.length - 1;

  // Content animation
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);

  const animateContent = () => {
    setIsAnimating(true);
    contentOpacity.value = 0;
    contentTranslateY.value = 30;

    contentOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    contentTranslateY.value = withSpring(0, { damping: 20, stiffness: 100 });

    setTimeout(() => setIsAnimating(false), 500);
  };

  useEffect(() => {
    animateContent();
  }, [currentStepIndex]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
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

  // Get gradient colors for current step
  const gradientColors = currentStep.gradient || ['#7c3aed', '#4f46e5'];

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[gradientColors[0], gradientColors[1], '#0f172a']}
        locations={[0, 0.5, 1]}
        style={{ flex: 1 }}
      >
        {/* Background particles */}
        <BackgroundParticles />

        {/* Content */}
        <View style={{ flex: 1, paddingTop: insets.top }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3">
            <ProgressIndicator
              currentStep={currentStepIndex}
              totalSteps={onboardingFlow.steps.length}
            />
            <Pressable
              onPress={handleSkip}
              className="px-4 py-2 bg-white/10 rounded-full active:opacity-70"
            >
              <Text className="text-white/80 font-semibold text-sm">Skip</Text>
            </Pressable>
          </View>

          {/* Main Content */}
          <Animated.View
            style={[{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }, contentAnimatedStyle]}
          >
            {/* Icon */}
            <View className="items-center mb-8">
              <AnimatedIcon
                iconName={currentStep.illustration || 'rocket'}
                isAnimating={isAnimating}
              />
            </View>

            {/* Step Counter */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text className="text-white/50 text-center text-sm font-medium mb-3 tracking-widest">
                STEP {currentStepIndex + 1} OF {onboardingFlow.steps.length}
              </Text>
            </Animated.View>

            {/* Title */}
            <Animated.View entering={FadeInDown.delay(250).springify()}>
              <Text className="text-white text-3xl font-bold text-center mb-4 leading-tight">
                {currentStep.title}
              </Text>
            </Animated.View>

            {/* Description */}
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Text className="text-white/80 text-base text-center leading-relaxed mb-6">
                {currentStep.description}
              </Text>
            </Animated.View>

            {/* Feature Pills */}
            {currentStep.features && currentStep.features.length > 0 && (
              <View className="flex-row flex-wrap justify-center mt-2">
                {currentStep.features.map((feature, index) => (
                  <FeaturePill key={feature.label} feature={feature} index={index} />
                ))}
              </View>
            )}
          </Animated.View>

          {/* Navigation */}
          <View
            className="px-5 pb-6"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="flex-row gap-3">
              {/* Previous Button */}
              {!isFirstStep && (
                <Pressable
                  onPress={handlePrevious}
                  className="flex-1 bg-white/10 rounded-2xl py-4 flex-row items-center justify-center active:opacity-70"
                >
                  <ChevronLeft size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-1">Back</Text>
                </Pressable>
              )}

              {/* Next/Complete Button */}
              <Pressable
                onPress={handleNext}
                className="flex-1 bg-white rounded-2xl py-4 flex-row items-center justify-center active:opacity-90 shadow-lg"
              >
                <Text className="text-slate-900 font-bold text-base mr-2">
                  {isLastStep ? (currentStep.action || 'Get Started') : 'Continue'}
                </Text>
                {isLastStep ? (
                  <Rocket size={20} color="#0f172a" />
                ) : (
                  <ChevronRight size={20} color="#0f172a" />
                )}
              </Pressable>
            </View>

            {/* Swipe hint on first step */}
            {isFirstStep && (
              <Animated.View
                entering={FadeInUp.delay(1000).springify()}
                className="items-center mt-4"
              >
                <Text className="text-white/40 text-xs">
                  Swipe through to learn the essentials
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
