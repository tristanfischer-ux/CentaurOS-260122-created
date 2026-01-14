import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Rocket,
  Target,
  Users,
  Zap,
  Award,
  TrendingUp,
  Shield,
  Cpu,
  Factory,
  Globe,
  Mail,
  ExternalLink,
  Heart,
  Sparkles,
  Building2,
  Book,
  MessageSquare,
  FileText,
  BarChart3,
  Smile,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  const features = [
    {
      icon: Target,
      title: 'OKR Management',
      description: 'Set company-wide objectives, track key results, and maintain strategic alignment across all functions.',
      color: '#3b82f6',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Connect founders, fractional executives, and apprentices in a structured workflow that scales.',
      color: '#8b5cf6',
    },
    {
      icon: Zap,
      title: 'Work Execution',
      description: 'Create, assign, and track work plans linked to your strategic goals with real-time progress updates.',
      color: '#eab308',
    },
    {
      icon: Award,
      title: 'Performance Tracking',
      description: 'Monitor individual and team performance with detailed analytics and achievement celebrations.',
      color: '#10b981',
    },
    {
      icon: Factory,
      title: 'Manufacturing Network',
      description: 'Access 30+ UK manufacturers for prototyping, PCB assembly, injection molding, and more.',
      color: '#f59e0b',
    },
    {
      icon: Cpu,
      title: 'AI Tools Library',
      description: 'Browse 25+ third-party AI tools organized by business function - Finance, Sales, Marketing, Ops, Engineering, and Admin.',
      color: '#a855f7',
    },
    {
      icon: MessageSquare,
      title: 'In-App Messaging',
      description: 'Direct and group messaging with file attachments, read receipts, and typing indicators.',
      color: '#06b6d4',
    },
    {
      icon: FileText,
      title: 'Template Library',
      description: 'Pre-built work plan templates across Marketing, Engineering, Sales, and Product functions to accelerate productivity.',
      color: '#f43f5e',
    },
    {
      icon: BarChart3,
      title: 'Homeworld-Style Planning',
      description: 'Build queue system with OKRs as queue items, people-hours as resources, and capacity tracking with burnout detection.',
      color: '#14b8a6',
      badge: 'NEW',
    },
    {
      icon: Smile,
      title: 'Elite UX Design',
      description: 'iOS-grade tactile feedback, consulting-firm methodology, and Clay/IDEO/Goji design standards throughout.',
      color: '#8b5cf6',
    },
  ];

  const principles = [
    {
      title: 'Lean by Design',
      description: 'Built specifically for small teams doing big things. No bloat, just what you need to execute.',
    },
    {
      title: 'Role-Based Access',
      description: 'Founders get full visibility, executives get focused dashboards, apprentices get clear tasks.',
    },
    {
      title: 'Manufacturing-First',
      description: 'Hardware startups need more than software. Access real suppliers, track BOMs, manage production.',
    },
    {
      title: 'Execution Over Planning',
      description: 'Beautiful interfaces that make you want to get work done, not endless planning sessions.',
    },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
        >
          <ArrowLeft size={20} color="#64748b" />
        </Pressable>
        <Text className="text-gray-900 dark:text-white text-2xl font-bold">About Centaur OS</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="px-6 pt-8 pb-6">
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24 }}
          >
            <View className="items-center">
              <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
                <Rocket size={40} color="#ffffff" strokeWidth={2} />
              </View>
              <Text className="text-white text-3xl font-bold text-center mb-3">
                The Operating System for{'\n'}Lean Hardware Startups
              </Text>
              <Text className="text-white/90 text-base text-center leading-6">
                Centaur OS empowers hardware startups to operate with the efficiency of a large company while maintaining the agility of a small team.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Mission Statement */}
        <View className="px-6 pb-6">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-6 border border-gray-300 dark:border-slate-800">
            <View className="flex-row items-center gap-3 mb-3">
              <Sparkles size={24} color="#f59e0b" />
              <Text className="text-gray-900 dark:text-white text-xl font-bold">Our Mission</Text>
            </View>
            <Text className="text-gray-700 dark:text-slate-300 text-base leading-7">
              We believe hardware innovation shouldn't require a massive team or complex enterprise software.
              Centaur OS gives founders the tools to run their entire company with 2-3 core team members,
              leveraging fractional executives and skilled apprentices to execute at scale.
            </Text>
          </View>
        </View>

        {/* Features Grid */}
        <View className="px-6 pb-6">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-4">
            Everything You Need to Scale
          </Text>
          <View className="gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View
                  key={index}
                  className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-5 border border-gray-300 dark:border-slate-800"
                >
                  <View className="flex-row items-start gap-4">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: feature.color + '20' }}
                    >
                      <Icon size={24} color={feature.color} strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-gray-900 dark:text-white text-lg font-bold">
                          {feature.title}
                        </Text>
                        {feature.badge && (
                          <View className={`px-2 py-0.5 rounded ${feature.badge === 'NEW' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                            <Text className="text-white text-xs font-bold">{feature.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm leading-6">
                        {feature.description}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Design Principles */}
        <View className="px-6 pb-6">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-4">
            Our Design Principles
          </Text>
          <View className="gap-3">
            {principles.map((principle, index) => (
              <View
                key={index}
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 rounded-xl p-5 border border-blue-200 dark:border-slate-700"
              >
                <Text className="text-gray-900 dark:text-white text-base font-bold mb-2">
                  {principle.title}
                </Text>
                <Text className="text-gray-700 dark:text-slate-400 text-sm leading-6">
                  {principle.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Who It's For */}
        <View className="px-6 pb-6">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-4">
            Who Is Centaur OS For?
          </Text>

          <View className="gap-4">
            {/* Founders */}
            <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
                  <Rocket size={24} color="#ffffff" />
                </View>
                <Text className="text-white text-xl font-bold flex-1">Founders</Text>
              </View>
              <Text className="text-white/90 text-base leading-6">
                Get complete visibility across your entire operation. Manage OKRs, track work,
                build your team, connect with suppliers, and run your startup like a seasoned CEO—even if it's your first rodeo.
              </Text>
            </View>

            {/* Fractional Executives */}
            <View className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
                  <Award size={24} color="#ffffff" />
                </View>
                <Text className="text-white text-xl font-bold flex-1">Fractional Executives</Text>
              </View>
              <Text className="text-white/90 text-base leading-6">
                Offer your expertise to multiple startups simultaneously. Create structured work,
                review submissions, mentor apprentices, and help founders execute your vision across your function.
              </Text>
            </View>

            {/* Apprentices */}
            <View className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
                  <Zap size={24} color="#ffffff" />
                </View>
                <Text className="text-white text-xl font-bold flex-1">Apprentices</Text>
              </View>
              <Text className="text-white/90 text-base leading-6">
                Build your career by executing real work for real startups. Learn from experienced executives,
                complete structured tasks, track your progress, and level up your skills with every submission.
              </Text>
            </View>
          </View>
        </View>

        {/* Technology Stack */}
        <View className="px-6 pb-6">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-4">
            Built With Modern Technology
          </Text>
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-6 border border-gray-300 dark:border-slate-800">
            <Text className="text-gray-700 dark:text-slate-300 text-base leading-7 mb-4">
              Centaur OS is built with React Native and Expo SDK 53, delivering a native mobile experience
              with beautiful animations, smooth gestures, and offline-first architecture.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {['React Native 0.76', 'Expo SDK 53', 'TypeScript', 'Zustand', 'React Query', 'NativeWind', 'Reanimated'].map((tech, index) => (
                <View key={index} className="bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                  <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold">{tech}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 pb-6">
          <View className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-1">
            <View className="bg-white dark:bg-slate-950 rounded-[15px] p-6">
              <Text className="text-gray-900 dark:text-white text-xl font-bold text-center mb-6">
                By The Numbers
              </Text>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-gray-900 dark:text-white text-4xl font-bold mb-1">31+</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">UK Suppliers</Text>
                </View>
                <View className="w-px bg-gray-300 dark:bg-slate-800" />
                <View className="items-center">
                  <Text className="text-gray-900 dark:text-white text-4xl font-bold mb-1">50+</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">AI Tools</Text>
                </View>
                <View className="w-px bg-gray-300 dark:bg-slate-800" />
                <View className="items-center">
                  <Text className="text-gray-900 dark:text-white text-4xl font-bold mb-1">100%</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">Mobile Native</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Contact & Support */}
        <View className="px-6 pb-8">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-4">
            Get In Touch
          </Text>

          <Pressable
            onPress={() => Linking.openURL('mailto:support@centauros.com')}
            className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-5 border border-gray-300 dark:border-slate-800 flex-row items-center gap-4 mb-3 active:opacity-70"
          >
            <View className="w-12 h-12 bg-blue-500/10 rounded-xl items-center justify-center">
              <Mail size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">Email Support</Text>
              <Text className="text-blue-500 text-sm">support@centauros.com</Text>
            </View>
            <ExternalLink size={20} color="#64748b" />
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL('https://docs.centauros.com')}
            className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-5 border border-gray-300 dark:border-slate-800 flex-row items-center gap-4 mb-3 active:opacity-70"
          >
            <View className="w-12 h-12 bg-purple-500/10 rounded-xl items-center justify-center">
              <Book size={24} color="#8b5cf6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">Documentation</Text>
              <Text className="text-gray-600 dark:text-slate-400 text-sm">Learn how to use Centaur OS</Text>
            </View>
            <ExternalLink size={20} color="#64748b" />
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL('https://centauros.com')}
            className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-5 border border-gray-300 dark:border-slate-800 flex-row items-center gap-4 active:opacity-70"
          >
            <View className="w-12 h-12 bg-emerald-500/10 rounded-xl items-center justify-center">
              <Globe size={24} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">Website</Text>
              <Text className="text-gray-600 dark:text-slate-400 text-sm">Visit centauros.com</Text>
            </View>
            <ExternalLink size={20} color="#64748b" />
          </Pressable>
        </View>

        {/* Footer */}
        <View className="px-6 pb-8 items-center">
          <View className="flex-row items-center gap-2 mb-3">
            <Heart size={16} color="#ef4444" fill="#ef4444" />
            <Text className="text-gray-600 dark:text-slate-400 text-sm">
              Made with love for hardware founders
            </Text>
          </View>
          <Text className="text-gray-500 dark:text-slate-500 text-xs">
            © 2026 Centaur OS. All rights reserved.
          </Text>
          <Text className="text-gray-500 dark:text-slate-500 text-xs mt-1">
            Version 1.1.0 • Build 2026.01.14
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
