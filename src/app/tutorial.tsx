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
  X,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
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
  stats?: Array<{ label: string; value: string; color: string; icon?: LucideIcon }>;
  features?: Array<{ title: string; detail: string; value: string; fullTime: string }> | string[];
  realExample?: {
    task: string;
    before: string;
    after: string[];
  };
  dashboard?: Array<{ label: string; status: string; icon: LucideIcon }>;
  suppliers?: Array<{ name: string; capability: string; lead: string }>;
  testimonials?: Array<{ founder: string; quote: string; metric: string }>;
  matchingProcess?: string[];
  workflow?: {
    you: string;
    aiAgent: string;
    apprentice: string;
    result: string;
  };
  learning?: Array<{ exec: string; teaches: string; yourTasks: string }>;
  portfolio?: string[];
  workPlan?: Record<string, string>;
  comparison?: {
    traditional: string;
    centaurOS: string;
  };
}

const TUTORIAL_SLIDES: Record<Role, TutorialSlide[]> = {
  Founder: [
    {
      title: "Your Startup,\nSuperpowered",
      subtitle: "Build a £10M company with a £100K budget",
      gradient: ['#3b82f6', '#2563eb', '#1e40af'],
      icon: Rocket,
      stats: [
        { label: 'Traditional Team Cost', value: '£500K+/year', color: '#ef4444' },
        { label: 'With Centaur OS', value: '£95K/year', color: '#10b981' },
        { label: 'Savings', value: '81%', color: '#8b5cf6' },
      ],
      description: "Most hardware startups fail because they run out of money before finding product-market fit. You need a £500K team but only have £100K. That's where Centaur OS changes everything.",
    },
    {
      title: "Hire World-Class\nExpertise, Not FTEs",
      subtitle: "Access 60+ fractional executives & apprentices",
      gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'],
      icon: Award,
      features: [
        {
          title: 'Marketing Executive',
          detail: '£800/day, 2 days/week',
          value: '£6,400/month',
          fullTime: '£120K/year equivalent',
        },
        {
          title: 'Sales Executive',
          detail: '£850/day, 1 day/week',
          value: '£3,400/month',
          fullTime: '£140K/year equivalent',
        },
        {
          title: 'Finance CFO',
          detail: '£950/day, 1 day/week',
          value: '£3,800/month',
          fullTime: '£160K/year equivalent',
        },
      ],
      description: "Hire fractional executives with 10-20 years experience for a fraction of the cost. Get VP-level talent working on exactly what matters, when it matters.",
    },
    {
      title: "Your Team Works\nfor You 24/7",
      subtitle: "AI agents + apprentices = unstoppable execution",
      gradient: ['#10b981', '#059669', '#047857'],
      icon: Bot,
      realExample: {
        task: "Launch 30-day social media campaign",
        before: "You: 20 hours/week trying to do marketing + build product",
        after: [
          "Marketing Exec: Creates strategy (4 hours)",
          "AI Agent (Jasper): Writes 30 posts (1 hour)",
          "Apprentice: Schedules posts, tracks analytics (2 hours/week)",
          "Result: Professional marketing on autopilot, you focus on product",
        ],
      },
      description: "Combine human expertise with AI automation and junior talent. Get work done 10x faster at 1/10th the cost.",
    },
    {
      title: "Everything You Need\nIn One Place",
      subtitle: "OKRs, work plans, team, suppliers, AI tools",
      gradient: ['#f59e0b', '#d97706', '#b45309'],
      icon: Target,
      dashboard: [
        { label: 'OKRs', status: '6 on track, 2 at risk', icon: Target },
        { label: 'Active Work', status: '12 in progress', icon: Zap },
        { label: 'Team', status: '2 execs, 3 apprentices', icon: Users },
        { label: 'Runway', status: '13.7 months', icon: TrendingUp },
      ],
      description: "Stop switching between 10 different tools. Centaur OS is your single dashboard to run your entire startup.",
    },
    {
      title: "Find the Right\nSuppliers, Fast",
      subtitle: "Access 31 verified UK manufacturers",
      gradient: ['#ec4899', '#db2777', '#be185d'],
      icon: Factory,
      suppliers: [
        { name: 'Proto Labs', capability: 'CNC + 3D Printing', lead: '1 week' },
        { name: 'Swindon Silicon', capability: 'PCB Assembly', lead: '2 weeks' },
        { name: 'Olympic Plastics', capability: 'Injection Molding', lead: '3 weeks' },
      ],
      description: "Browse verified suppliers, compare capabilities, see reviews, and contract directly through the platform. No more endless Googling and cold emails.",
    },
    {
      title: "The Result?\nYou Move Fast",
      subtitle: "Real founders, real results",
      gradient: ['#06b6d4', '#0891b2', '#0e7490'],
      icon: Sparkles,
      testimonials: [
        {
          founder: "Sarah Chen, Hardware Startup",
          quote: "Went from idea to first 100 customers in 8 months with just £95K spend. Centaur OS made it possible.",
          metric: "0 → £500K ARR in 12 months",
        },
        {
          founder: "Marcus Thompson, IoT Company",
          quote: "Hired a fractional CFO who helped raise £2M. Would have cost £160K full-time, paid £3,800/month.",
          metric: "Raised £2M seed round",
        },
      ],
      description: "This isn't theory. Real founders are building real companies with lean teams and getting real results.",
    },
  ],
  FractionalExec: [
    {
      title: "Turn Your Expertise\nInto Income",
      subtitle: "Work with 5 startups, earn £15K+/month",
      gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'],
      icon: Award,
      stats: [
        { label: 'Your Day Rate', value: '£800/day', color: '#8b5cf6' },
        { label: '5 Clients × 2 days/week', value: '£32K/month', color: '#10b981' },
        { label: 'Annual Income', value: '£384K/year', color: '#f59e0b' },
      ],
      description: "You've got 15 years of experience. Why work for one company when you can help 5 startups succeed and earn more doing it?",
    },
    {
      title: "Get Matched with\nGreat Founders",
      subtitle: "Choose who you work with, on your terms",
      gradient: ['#3b82f6', '#2563eb', '#1e40af'],
      icon: Users,
      matchingProcess: [
        "Founders browse your profile and expertise",
        "You receive engagement requests with details",
        "Review the startup, team, and challenge",
        "Accept engagements that excite you",
        "Set your own schedule and deliverables",
      ],
      description: "No more job hunting. Founders come to you. You pick the best opportunities and work on your own terms.",
    },
    {
      title: "Structure Your Work,\nScale Your Impact",
      subtitle: "Work smarter with AI agents & apprentices",
      gradient: ['#10b981', '#059669', '#047857'],
      icon: Zap,
      workflow: {
        you: "4 hours: Strategy, high-level decisions, executive oversight",
        aiAgent: "Jasper AI writes content, Gong analyzes calls, Vic.ai processes invoices",
        apprentice: "Junior talent executes tasks, manages details, reports back",
        result: "10x output, same time investment",
      },
      description: "Stop doing everything yourself. Delegate to AI and apprentices. Focus on what only you can do: strategic thinking and leadership.",
    },
    {
      title: "Track Everything,\nStay Accountable",
      subtitle: "Transparent work plans and deliverables",
      gradient: ['#f59e0b', '#d97706', '#b45309'],
      icon: CheckCircle2,
      features: [
        "Create weekly work plans for each client",
        "Founders see exactly what you're delivering",
        "Track progress with clear milestones",
        "Submit work for review and feedback",
        "Build your reputation with every win",
      ],
      description: "Centaur OS keeps you organized across multiple clients. Founders see your impact. You build a track record that attracts more work.",
    },
    {
      title: "Build Your Brand,\nGrow Your Practice",
      subtitle: "Ratings, reviews, and repeat business",
      gradient: ['#ec4899', '#db2777', '#be185d'],
      icon: TrendingUp,
      stats: [
        { label: 'Average Executive Rating', value: '4.8 stars', color: '#8b5cf6', icon: Award },
        { label: 'Repeat Engagement Rate', value: '87%', color: '#10b981', icon: Users },
        { label: 'Avg Engagement Length', value: '8 months', color: '#f59e0b', icon: Clock },
      ],
      description: "Great work leads to great reviews. Great reviews lead to more opportunities. Build a thriving fractional executive practice.",
    },
  ],
  Apprentice: [
    {
      title: "Learn While You\nEarn Real Money",
      subtitle: "Get paid to build skills working with top startups",
      gradient: ['#10b981', '#059669', '#047857'],
      icon: Zap,
      stats: [
        { label: 'Your Day Rate', value: '£180-220/day', color: '#10b981' },
        { label: 'Part-time (2-3 days/week)', value: '£1,600+/month', color: '#3b82f6' },
        { label: 'Annual Income', value: '£19K+/year', color: '#f59e0b' },
      ],
      description: "Most internships pay nothing or minimum wage. Centaur OS apprentices earn £180-220/day learning real startup skills.",
    },
    {
      title: "Work with Experts\nWho Teach You",
      subtitle: "Learn from fractional executives with 10-20 years experience",
      gradient: ['#3b82f6', '#2563eb', '#1e40af'],
      icon: Award,
      learning: [
        {
          exec: "Marketing Executive",
          teaches: "Content strategy, SEO, social media campaigns",
          yourTasks: "Write blog posts, schedule content, track analytics",
        },
        {
          exec: "Sales Executive",
          teaches: "Lead generation, CRM, customer qualification",
          yourTasks: "Research prospects, update Salesforce, book meetings",
        },
        {
          exec: "Engineering Executive",
          teaches: "Product development, CAD, prototyping",
          yourTasks: "3D modeling, testing, supplier coordination",
        },
      ],
      description: "You're not making coffee. You're doing real work under expert guidance. Every task is a learning opportunity.",
    },
    {
      title: "Build Skills That\nActually Matter",
      subtitle: "Portfolio work that gets you hired",
      gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'],
      icon: Building2,
      portfolio: [
        "Launched social media campaign → 50K reach",
        "Generated 200 qualified leads → 12 became customers",
        "Created product documentation → used by 500 users",
        "Coordinated 3 supplier projects → all on time, on budget",
      ],
      description: "Graduates with generic internships struggle to get jobs. You'll have a portfolio of real startup wins that prove your value.",
    },
    {
      title: "Get Clear Direction,\nNever Wonder What to Do",
      subtitle: "Structured work plans from your executive",
      gradient: ['#f59e0b', '#d97706', '#b45309'],
      icon: Target,
      workPlan: {
        monday: "Research 50 potential customers, add to CRM (2 hours)",
        tuesday: "Write 3 LinkedIn posts, schedule for next week (3 hours)",
        wednesday: "Call 20 leads, qualify and book 3 demos (4 hours)",
        feedback: "Marketing Exec reviews your work every Friday",
      },
      description: "No guessing what to do. Your executive gives you clear tasks, reviews your work, and helps you improve every week.",
    },
    {
      title: "Start Your Career\nThe Smart Way",
      subtitle: "Multiple startups = faster learning curve",
      gradient: ['#ec4899', '#db2777', '#be185d'],
      icon: Sparkles,
      comparison: {
        traditional: "1 internship → 1 company → 1 way of doing things",
        centaurOS: "Work with 2-3 startups → See different approaches → Learn faster",
      },
      description: "Most people spend years at one company learning slowly. You'll work with multiple startups, see what works, and accelerate your career.",
    },
  ],
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
        {/* Header - Role Selector */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="px-6 pt-2 pb-4"
        >
          <View className="flex-row justify-between items-center mb-4">
            <View className="bg-white/10 px-3 py-1.5 rounded-full">
              <Text className="text-white/80 text-xs font-semibold">Interactive Demo</Text>
            </View>
            <Pressable onPress={handleSkip} className="bg-white/10 px-3 py-1.5 rounded-full">
              <Text className="text-white/80 text-xs font-bold">Skip</Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            {(['Founder', 'FractionalExec', 'Apprentice'] as Role[]).map((role) => (
              <Pressable
                key={role}
                onPress={() => handleRoleChange(role)}
                className={`flex-1 px-4 py-3.5 rounded-2xl border-2 ${
                  selectedRole === role
                    ? 'bg-white/20 border-white/40'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <Text
                  className={`text-center text-sm font-bold ${
                    selectedRole === role ? 'text-white' : 'text-white/50'
                  }`}
                >
                  {role === 'FractionalExec' ? 'Executive' : role}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Icon */}
          <Animated.View
            key={`icon-${currentSlide}`}
            entering={FadeIn.duration(800).springify()}
            className="items-center mb-8 mt-4"
          >
            <View className="bg-white/15 p-8 rounded-[32px] shadow-2xl border-2 border-white/20">
              <Icon size={72} color="white" strokeWidth={2} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View
            key={`title-${currentSlide}`}
            entering={FadeInUp.delay(200).duration(700).springify()}
          >
            <Text className="text-white text-5xl font-black mb-3 leading-tight">
              {slide.title}
            </Text>
            <Text className="text-white/90 text-2xl font-bold mb-8">{slide.subtitle}</Text>
          </Animated.View>

          {/* Content */}
          <Animated.View
            key={`content-${currentSlide}`}
            entering={FadeInUp.delay(400).duration(700).springify()}
            className="mb-6"
          >
            {/* Stats */}
            {slide.stats && (
              <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-7 mb-7 border border-white/20 shadow-xl">
                {slide.stats.map((stat, index) => (
                  <View
                    key={index}
                    className={`flex-row justify-between items-center ${
                      index < slide.stats!.length - 1 ? 'mb-5 pb-5 border-b border-white/15' : ''
                    }`}
                  >
                    <Text className="text-white/90 text-base font-semibold flex-1">{stat.label}</Text>
                    <Text className="text-3xl font-black ml-4" style={{ color: stat.color }}>
                      {stat.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Features for Executives */}
            {slide.features && (
              <View className="gap-4 mb-7">
                {slide.features.map((feature, index) => {
                  if (typeof feature === 'string') {
                    return (
                      <View key={index} className="flex-row items-start bg-white/5 rounded-2xl p-4 border border-white/10">
                        <CheckCircle2 size={22} color="#10b981" style={{ marginRight: 12, marginTop: 2 }} />
                        <Text className="text-white/90 text-base flex-1 font-medium">{feature}</Text>
                      </View>
                    );
                  }
                  return (
                    <View key={index} className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
                      <Text className="text-white text-xl font-black mb-2">
                        {feature.title}
                      </Text>
                      <Text className="text-white/70 text-sm mb-4">{feature.detail}</Text>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-white/90 text-lg font-bold">{feature.value}</Text>
                        <Text className="text-white/50 text-xs">{feature.fullTime}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Real Example */}
            {slide.realExample && (
              <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-7 mb-7 border border-white/20 shadow-xl">
                <Text className="text-white text-xl font-black mb-5">
                  {slide.realExample.task}
                </Text>
                <View className="bg-red-500/25 rounded-2xl p-5 mb-4 border border-red-400/30">
                  <Text className="text-red-200 text-sm font-bold mb-2">Before:</Text>
                  <Text className="text-white/90 text-base">{slide.realExample.before}</Text>
                </View>
                <View className="bg-emerald-500/25 rounded-2xl p-5 border border-emerald-400/30">
                  <Text className="text-emerald-200 text-sm font-bold mb-3">After:</Text>
                  {slide.realExample.after.map((item, index) => (
                    <View key={index} className="flex-row items-start mb-2">
                      <CheckCircle2 size={18} color="#10b981" style={{ marginRight: 10, marginTop: 2 }} />
                      <Text className="text-white/90 text-base flex-1">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Dashboard Preview */}
            {slide.dashboard && (
              <View className="gap-3 mb-7">
                {slide.dashboard.map((item, index) => {
                  const ItemIcon = item.icon;
                  return (
                    <View key={index} className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 flex-row items-center border border-white/20 shadow-lg">
                      <View className="bg-white/20 p-3 rounded-xl mr-4">
                        <ItemIcon size={24} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-base font-bold">{item.label}</Text>
                        <Text className="text-white/70 text-sm">{item.status}</Text>
                      </View>
                      <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                    </View>
                  );
                })}
              </View>
            )}

            {/* Suppliers */}
            {slide.suppliers && (
              <View className="gap-4 mb-7">
                {slide.suppliers.map((supplier, index) => (
                  <View key={index} className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
                    <Text className="text-white text-xl font-black mb-3">
                      {supplier.name}
                    </Text>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-white/70 text-base">{supplier.capability}</Text>
                      <View className="bg-emerald-500/30 px-3 py-1.5 rounded-full">
                        <Text className="text-emerald-300 text-sm font-bold">
                          {supplier.lead}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Testimonials */}
            {slide.testimonials && (
              <View className="gap-5 mb-7">
                {slide.testimonials.map((testimonial, index) => (
                  <View key={index} className="bg-white/10 backdrop-blur-xl rounded-3xl p-7 border border-white/20 shadow-xl">
                    <Text className="text-white text-lg italic mb-5 leading-7">
                      "{testimonial.quote}"
                    </Text>
                    <Text className="text-white/70 text-sm mb-3">{testimonial.founder}</Text>
                    <View className="bg-emerald-500/30 rounded-2xl px-4 py-3 self-start border border-emerald-400/30">
                      <Text className="text-emerald-200 text-base font-black">
                        {testimonial.metric}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Matching Process */}
            {slide.matchingProcess && (
              <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-7 mb-7 border border-white/20 shadow-xl">
                {slide.matchingProcess.map((step, index) => (
                  <View key={index} className="flex-row items-start mb-5 last:mb-0">
                    <View className="bg-white/30 rounded-full w-10 h-10 items-center justify-center mr-4">
                      <Text className="text-white font-black text-base">{index + 1}</Text>
                    </View>
                    <Text className="text-white/90 text-base flex-1 pt-2 leading-6">{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Workflow */}
            {slide.workflow && (
              <View className="gap-4 mb-7">
                <View className="bg-violet-500/25 backdrop-blur-xl rounded-2xl p-5 border border-violet-400/30">
                  <Text className="text-violet-200 text-sm font-bold mb-2">You</Text>
                  <Text className="text-white text-base">{slide.workflow.you}</Text>
                </View>
                <View className="bg-blue-500/25 backdrop-blur-xl rounded-2xl p-5 border border-blue-400/30">
                  <Text className="text-blue-200 text-sm font-bold mb-2">AI Agents</Text>
                  <Text className="text-white text-base">{slide.workflow.aiAgent}</Text>
                </View>
                <View className="bg-emerald-500/25 backdrop-blur-xl rounded-2xl p-5 border border-emerald-400/30">
                  <Text className="text-emerald-200 text-sm font-bold mb-2">Apprentice</Text>
                  <Text className="text-white text-base">{slide.workflow.apprentice}</Text>
                </View>
                <View className="bg-amber-500/25 backdrop-blur-xl rounded-2xl p-5 border border-amber-400/30">
                  <Text className="text-amber-200 text-sm font-bold mb-2">Result</Text>
                  <Text className="text-white text-xl font-black">{slide.workflow.result}</Text>
                </View>
              </View>
            )}

            {/* Learning Examples */}
            {slide.learning && (
              <View className="gap-4 mb-7">
                {slide.learning.map((item, index) => (
                  <View key={index} className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
                    <Text className="text-white text-lg font-black mb-3">{item.exec}</Text>
                    <Text className="text-emerald-300 text-sm mb-2 font-semibold">Teaches: {item.teaches}</Text>
                    <Text className="text-white/70 text-sm">Your Tasks: {item.yourTasks}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Portfolio */}
            {slide.portfolio && (
              <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-7 mb-7 border border-white/20 shadow-xl">
                {slide.portfolio.map((item, index) => (
                  <View key={index} className="flex-row items-start mb-4 last:mb-0">
                    <CheckCircle2 size={22} color="#10b981" style={{ marginRight: 12, marginTop: 2 }} />
                    <Text className="text-white text-base flex-1 font-medium">{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Work Plan */}
            {slide.workPlan && (
              <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-7 mb-7 border border-white/20 shadow-xl">
                {Object.entries(slide.workPlan).map(([day, task], index) => {
                  if (day === 'feedback') {
                    return (
                      <View key={day} className="bg-violet-500/25 rounded-2xl p-5 mt-4 border border-violet-400/30">
                        <Text className="text-violet-200 text-sm font-bold mb-2">
                          Weekly Feedback
                        </Text>
                        <Text className="text-white text-base">{task}</Text>
                      </View>
                    );
                  }
                  return (
                    <View key={day} className="mb-4 last:mb-0">
                      <Text className="text-white/60 text-xs font-black uppercase mb-2 tracking-wider">
                        {day}
                      </Text>
                      <Text className="text-white text-base">{task}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Comparison */}
            {slide.comparison && (
              <View className="gap-4 mb-7">
                <View className="bg-red-500/25 backdrop-blur-xl rounded-2xl p-5 border border-red-400/30">
                  <Text className="text-red-200 text-sm font-bold mb-3">Traditional Path</Text>
                  <Text className="text-white/90 text-base">{slide.comparison.traditional}</Text>
                </View>
                <View className="bg-emerald-500/25 backdrop-blur-xl rounded-2xl p-5 border border-emerald-400/30">
                  <Text className="text-emerald-200 text-sm font-bold mb-3">Centaur OS</Text>
                  <Text className="text-white text-base font-semibold">{slide.comparison.centaurOS}</Text>
                </View>
              </View>
            )}

            {/* Description */}
            <Text className="text-white/80 text-lg leading-8 font-medium">{slide.description}</Text>
          </Animated.View>
        </ScrollView>

        {/* Footer - Progress & CTA */}
        <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-xl">
          <View className="flex-row justify-center mb-5">
            {slides.map((_, index) => (
              <View
                key={index}
                className={`h-2.5 rounded-full mx-1 ${
                  index === currentSlide ? 'bg-white w-10' : 'bg-white/30 w-2.5'
                }`}
              />
            ))}
          </View>

          <Pressable
            onPress={handleNext}
            className="bg-white rounded-3xl py-5 flex-row items-center justify-center active:scale-[0.98] shadow-2xl"
          >
            <Text className="text-slate-900 text-xl font-black mr-2">
              {currentSlide === slides.length - 1 ? "Let's Get Started" : 'Next'}
            </Text>
            <ArrowRight size={28} color="#0f172a" strokeWidth={3} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
