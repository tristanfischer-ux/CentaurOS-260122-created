import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import {
  Rocket,
  Target,
  Users,
  TrendingUp,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  DollarSign,
  Award,
  Bot,
  Factory,
  ChevronRight,
  Crown,
  Briefcase,
  GraduationCap,
  Brain,
  Cpu,
  Network,
  Workflow,
  LayoutGrid,
  Calendar,
  AlertTriangle,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type Role = 'Founder' | 'FractionalExec' | 'Apprentice';

interface TutorialSlide {
  title: string;
  subtitle: string;
  gradient: [string, string, string];
  icon: LucideIcon;
  description: string;
  content?: React.ReactNode;
}

// ============ SHARED INTRO SLIDES ============
const INTRO_SLIDES: TutorialSlide[] = [
  {
    title: "Welcome to\nCentaurOS",
    subtitle: "The Operating System for Lean Companies",
    gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'],
    icon: Cpu,
    description: "CentaurOS helps small teams operate like large organizations. Named after the mythical centaur—half human, half horse—we combine human creativity with AI power to help you move faster.",
  },
  {
    title: "The Centaur\nPhilosophy",
    subtitle: "Humans + AI = Superpowers",
    gradient: ['#3b82f6', '#2563eb', '#1e40af'],
    icon: Brain,
    description: "A centaur is neither fully human nor fully horse—it's something greater than both. In CentaurOS, you don't replace humans with AI. Instead, each person is equipped with AI tools that multiply their effectiveness 2-10x.",
  },
  {
    title: "Three Roles,\nOne Team",
    subtitle: "Founders, Executives, and Apprentices",
    gradient: ['#10b981', '#059669', '#047857'],
    icon: Users,
    description: "CentaurOS is built for lean teams with three types of people working together. Each role has specific capabilities, costs, and responsibilities—and each can be equipped with AI tools.",
  },
];

// ============ FOUNDER SLIDES ============
const FOUNDER_SLIDES: TutorialSlide[] = [
  ...INTRO_SLIDES,
  {
    title: "You're the\nFounder",
    subtitle: "Captain of the ship",
    gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'],
    icon: Crown,
    description: "As a Founder, you have full access to everything. You set the vision, make key decisions, and orchestrate your team. You can create tasks, assign work, hire team members, and track progress across all business functions.",
  },
  {
    title: "Time Units (TU)",
    subtitle: "1 TU = 4 hours of focused work",
    gradient: ['#f59e0b', '#d97706', '#b45309'],
    icon: Clock,
    description: "Every person in CentaurOS has a weekly TU capacity. Founders have 10 TU/week (40 hours). Work is assigned in TU blocks. This helps you see exactly how much capacity your team has and where it's being used.",
  },
  {
    title: "Your Team\nStructure",
    subtitle: "Build a lean, powerful organization",
    gradient: ['#ec4899', '#db2777', '#be185d'],
    icon: Network,
    description: "Hire Fractional Executives (part-time experts) for strategic leadership. Hire Apprentices (full-time doers) for execution. Equip everyone with AI tools. A team of 2-5 people can achieve what traditionally required 15-20.",
  },
  {
    title: "Assign Work\nto Your Team",
    subtitle: "Create tasks, allocate TUs, track progress",
    gradient: ['#06b6d4', '#0891b2', '#0e7490'],
    icon: Workflow,
    description: "Create tasks in the Tasks tab. Assign team members and allocate their TUs. Set due dates and track progress. Your team will see their assignments and can update their progress. You'll see everything in real-time.",
  },
  {
    title: "Mission Control",
    subtitle: "Your command center",
    gradient: ['#3b82f6', '#2563eb', '#1e40af'],
    icon: LayoutGrid,
    description: "The Home tab is your Mission Control. See your team's capacity, active tasks, blocked items, and priorities at a glance. Focus Today shows AI-prioritized tasks that need your attention. The bottom drawers show Team and Timeline views.",
  },
  {
    title: "Invite Your\nTeam",
    subtitle: "Add Executives, Apprentices, or Co-Founders",
    gradient: ['#10b981', '#059669', '#047857'],
    icon: Users,
    description: "Go to Settings to invite team members. Select their role (Founder, Executive, or Apprentice), their primary function (Engineering, Sales, Marketing, etc.), and send an invitation. You can change roles later as people grow.",
  },
];

// ============ EXECUTIVE SLIDES ============
const EXECUTIVE_SLIDES: TutorialSlide[] = [
  ...INTRO_SLIDES,
  {
    title: "You're a\nFractional Executive",
    subtitle: "Strategic leadership, part-time",
    gradient: ['#3b82f6', '#2563eb', '#1e40af'],
    icon: Briefcase,
    description: "As a Fractional Executive, you provide strategic leadership to startups on a part-time basis. You might work 2-3 days per week for each company, bringing your 10-20 years of experience to help them succeed.",
  },
  {
    title: "Your TU\nCapacity",
    subtitle: "2 TU per day × days worked",
    gradient: ['#f59e0b', '#d97706', '#b45309'],
    icon: Clock,
    description: "Your TU capacity depends on how many days per week you work for each company. Working 2 days/week = 4 TU capacity. Working 3 days/week = 6 TU capacity. This is visible to Founders so they know your availability.",
  },
  {
    title: "Review &\nGuide Work",
    subtitle: "Mentor apprentices, make decisions",
    gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'],
    icon: Award,
    description: "Your main job is to provide strategic guidance. Review work from Apprentices, make key decisions, unblock problems, and guide the team. You don't do all the execution—you enable others to execute well.",
  },
  {
    title: "Your Dashboard",
    subtitle: "See your tasks and team",
    gradient: ['#10b981', '#059669', '#047857'],
    icon: LayoutGrid,
    description: "Your Home tab shows tasks assigned to you, decisions that need your input, and work from your function that needs review. The When tab shows your timeline. The Tasks tab shows all tasks you're involved in.",
  },
  {
    title: "Work with\nApprentices",
    subtitle: "Delegate execution, review results",
    gradient: ['#ec4899', '#db2777', '#be185d'],
    icon: GraduationCap,
    description: "Apprentices handle execution under your guidance. Create tasks for them with clear instructions. Review their work and provide feedback. Help them learn and grow while you focus on high-level strategy.",
  },
];

// ============ APPRENTICE SLIDES ============
const APPRENTICE_SLIDES: TutorialSlide[] = [
  ...INTRO_SLIDES,
  {
    title: "You're an\nApprentice",
    subtitle: "Learn while you earn",
    gradient: ['#10b981', '#059669', '#047857'],
    icon: GraduationCap,
    description: "As an Apprentice, you're the execution engine of the company. You do real work on real projects, learning from experienced Executives and Founders. This isn't an unpaid internship—you're a valuable team member.",
  },
  {
    title: "Your TU\nCapacity",
    subtitle: "10 TU/week = 40 hours",
    gradient: ['#f59e0b', '#d97706', '#b45309'],
    icon: Clock,
    description: "You have 10 TU per week (40 hours of focused work). Tasks are assigned to you by Founders and Executives. Each task shows how many TUs it needs. Complete your tasks and update your progress in the app.",
  },
  {
    title: "Your Assignments",
    subtitle: "Clear tasks with due dates",
    gradient: ['#3b82f6', '#2563eb', '#1e40af'],
    icon: Target,
    description: "Go to the Tasks tab to see work assigned to you. Each task has a title, description, due date, and TU estimate. Mark tasks as in-progress when you start, and completed when you're done. Ask for help if you get blocked.",
  },
  {
    title: "Learn from\nExperts",
    subtitle: "Executives mentor you",
    gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'],
    icon: Award,
    description: "Fractional Executives in your function will review your work and teach you their expertise. Marketing Execs teach marketing. Sales Execs teach sales. Engineering Execs teach engineering. You're building real skills.",
  },
  {
    title: "Build Your\nPortfolio",
    subtitle: "Real work, real results",
    gradient: ['#ec4899', '#db2777', '#be185d'],
    icon: Sparkles,
    description: "Every task you complete is a portfolio piece. 'Launched social media campaign with 50K reach.' 'Generated 200 qualified leads.' 'Coordinated 3 supplier projects.' This is how you prove your value to future employers.",
  },
];

const TUTORIAL_SLIDES: Record<Role, TutorialSlide[]> = {
  Founder: FOUNDER_SLIDES,
  FractionalExec: EXECUTIVE_SLIDES,
  Apprentice: APPRENTICE_SLIDES,
};

export default function TutorialScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>('Founder');
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = TUTORIAL_SLIDES[selectedRole];
  const slide = slides[currentSlide];

  // Floating animation
  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    scale.value = withRepeat(
      withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: scale.value }],
  }));

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Tutorial complete - go to onboarding
      if (selectedRole === 'FractionalExec') {
        router.push('/onboarding-executive');
      } else if (selectedRole === 'Apprentice') {
        router.push('/onboarding-apprentice');
      } else {
        router.push('/onboarding');
      }
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setCurrentSlide(0);
  };

  const handleSkip = () => {
    if (selectedRole === 'FractionalExec') {
      router.push('/onboarding-executive');
    } else if (selectedRole === 'Apprentice') {
      router.push('/onboarding-apprentice');
    } else {
      router.push('/onboarding');
    }
  };

  const Icon = slide.icon;

  // Determine if we're in the shared intro section (first 3 slides)
  const isIntroSlide = currentSlide < 3;

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={[...slide.gradient, '#0f172a']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Gradient Orbs */}
      <View className="absolute inset-0 overflow-hidden">
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
            },
            floatingStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: -80,
              left: -60,
              width: 250,
              height: 250,
              borderRadius: 125,
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
            },
            floatingStyle,
          ]}
        />
      </View>

      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="px-6 pt-2 pb-4"
        >
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <View className="bg-white/10 px-3 py-1.5 rounded-full">
                <Text className="text-white/80 text-xs font-semibold">
                  {currentSlide + 1} of {slides.length}
                </Text>
              </View>
              {isIntroSlide && (
                <View className="bg-purple-500/30 px-3 py-1.5 rounded-full">
                  <Text className="text-purple-200 text-xs font-semibold">
                    What is CentaurOS?
                  </Text>
                </View>
              )}
            </View>
            <Pressable onPress={handleSkip} className="bg-white/10 px-3 py-1.5 rounded-full">
              <Text className="text-white/80 text-xs font-bold">Skip</Text>
            </Pressable>
          </View>

          {/* Role Selector - only show after intro slides */}
          {!isIntroSlide && (
            <View className="flex-row gap-2">
              {(['Founder', 'FractionalExec', 'Apprentice'] as Role[]).map((role) => (
                <Pressable
                  key={role}
                  onPress={() => handleRoleChange(role)}
                  className={`flex-1 px-4 py-3 rounded-2xl border-2 ${
                    selectedRole === role
                      ? 'bg-white/20 border-white/40'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Text
                    className={`text-center text-xs font-bold ${
                      selectedRole === role ? 'text-white' : 'text-white/50'
                    }`}
                  >
                    {role === 'FractionalExec' ? 'Executive' : role}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {/* Icon */}
          <Animated.View
            key={`icon-${currentSlide}`}
            entering={FadeIn.duration(800).springify()}
            className="items-center mb-6 mt-2"
          >
            <View className="bg-white/15 p-6 rounded-[28px] shadow-2xl border-2 border-white/20">
              <Icon size={56} color="white" strokeWidth={2} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View
            key={`title-${currentSlide}`}
            entering={FadeInUp.delay(200).duration(700).springify()}
          >
            <Text className="text-white text-4xl font-black mb-2 leading-tight">
              {slide.title}
            </Text>
            <Text className="text-white/90 text-xl font-bold mb-6">{slide.subtitle}</Text>
          </Animated.View>

          {/* Description */}
          <Animated.View
            key={`desc-${currentSlide}`}
            entering={FadeInUp.delay(400).duration(700).springify()}
          >
            <View className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
              <Text className="text-white/90 text-base leading-7">{slide.description}</Text>
            </View>

            {/* Role-specific highlights for intro slides */}
            {currentSlide === 2 && (
              <View className="mt-5 gap-3">
                <View className="bg-purple-500/20 rounded-2xl p-4 border border-purple-400/30 flex-row items-center">
                  <View className="bg-purple-500/30 p-2 rounded-xl mr-3">
                    <Crown size={20} color="#a78bfa" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-purple-200 text-sm font-bold">Founders</Text>
                    <Text className="text-white/70 text-xs">Own the vision, make decisions, orchestrate the team</Text>
                  </View>
                </View>
                <View className="bg-blue-500/20 rounded-2xl p-4 border border-blue-400/30 flex-row items-center">
                  <View className="bg-blue-500/30 p-2 rounded-xl mr-3">
                    <Briefcase size={20} color="#93c5fd" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-blue-200 text-sm font-bold">Fractional Executives</Text>
                    <Text className="text-white/70 text-xs">Part-time experts who guide strategy and review work</Text>
                  </View>
                </View>
                <View className="bg-emerald-500/20 rounded-2xl p-4 border border-emerald-400/30 flex-row items-center">
                  <View className="bg-emerald-500/30 p-2 rounded-xl mr-3">
                    <GraduationCap size={20} color="#6ee7b7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-emerald-200 text-sm font-bold">Apprentices</Text>
                    <Text className="text-white/70 text-xs">Full-time doers who execute tasks and learn on the job</Text>
                  </View>
                </View>
              </View>
            )}

            {/* TU capacity visual for TU slides */}
            {slide.title.includes('Time Units') && (
              <View className="mt-5 bg-white/10 rounded-2xl p-5 border border-white/20">
                <Text className="text-white/60 text-xs font-bold uppercase mb-3">Weekly Capacity</Text>
                <View className="flex-row items-center mb-3">
                  <View className="flex-1 bg-white/10 h-3 rounded-full overflow-hidden mr-3">
                    <View className="bg-purple-500 h-full w-full rounded-full" />
                  </View>
                  <Text className="text-white text-sm font-bold">10 TU</Text>
                </View>
                <Text className="text-white/50 text-xs">= 40 hours of focused work per week</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Footer - Progress & Navigation */}
        <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
          {/* Progress dots */}
          <View className="flex-row justify-center mb-5">
            {slides.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full mx-1 ${
                  index === currentSlide ? 'bg-white w-8' : 'bg-white/30 w-2'
                }`}
              />
            ))}
          </View>

          {/* Navigation buttons */}
          <View className="flex-row gap-3">
            {currentSlide > 0 && (
              <Pressable
                onPress={handleBack}
                className="bg-white/20 rounded-2xl py-4 px-6 active:scale-[0.98]"
              >
                <Text className="text-white text-base font-bold">Back</Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleNext}
              className="flex-1 bg-white rounded-2xl py-4 flex-row items-center justify-center active:scale-[0.98] shadow-2xl"
            >
              <Text className="text-slate-900 text-lg font-black mr-2">
                {currentSlide === slides.length - 1 ? "Get Started" : 'Next'}
              </Text>
              <ArrowRight size={24} color="#0f172a" strokeWidth={3} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
