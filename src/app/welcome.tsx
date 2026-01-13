import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Rocket,
  Award,
  Zap,
  Building2,
  Sparkles,
  TrendingUp,
  Target,
} from 'lucide-react-native';
import type { Role } from '@/types';

export default function WelcomeScreen() {
  const router = useRouter();

  // Floating animation for sparkles
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const handleRoleSelect = (role: Role | 'Manufacturer') => {
    router.push('/tutorial' as any);
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Animated Background */}
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#312e81', '#1e293b']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Elements */}
      <View className="absolute inset-0">
        <Animated.View
          style={[{ position: 'absolute', top: 100, right: 40 }, floatingStyle]}
        >
          <Sparkles size={40} color="rgba(139, 92, 246, 0.3)" />
        </Animated.View>
        <Animated.View
          style={[{ position: 'absolute', top: 250, left: 30 }, floatingStyle]}
        >
          <TrendingUp size={32} color="rgba(59, 130, 246, 0.2)" />
        </Animated.View>
        <Animated.View
          style={[{ position: 'absolute', bottom: 200, right: 50 }, floatingStyle]}
        >
          <Target size={36} color="rgba(16, 185, 129, 0.25)" />
        </Animated.View>
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(800).springify()}
            className="px-6 pt-16 pb-12 items-center"
          >
            <View className="mb-6 items-center">
              <View className="bg-gradient-to-br from-blue-500 to-violet-600 p-5 rounded-3xl mb-4 shadow-2xl">
                <Rocket size={48} color="#ffffff" strokeWidth={2} />
              </View>
            </View>

            <Text className="text-white text-6xl font-black mb-3 text-center tracking-tight">
              Centaur OS
            </Text>

            <View className="bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 px-4 py-2 rounded-full mb-6">
              <Text className="text-white text-base font-bold">The Operating System for Lean Startups</Text>
            </View>

            <Text className="text-slate-300 text-lg text-center leading-8 px-4 max-w-md">
              Build a £10M company with a £100K budget. Choose your role and join the revolution.
            </Text>
          </Animated.View>

          {/* Role Cards */}
          <View className="px-6 gap-5">
            {/* Founder */}
            <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
              <Pressable
                onPress={() => handleRoleSelect('Founder')}
                className="active:scale-[0.98]"
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb', '#1d4ed8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 28, padding: 1.5 }}
                >
                  <View className="bg-slate-900/95 rounded-[26px] p-7 border-2 border-blue-500/20">
                    <View className="flex-row items-center mb-5">
                      <View className="bg-blue-500 p-4 rounded-2xl mr-5 shadow-lg">
                        <Rocket size={36} color="#ffffff" strokeWidth={2.5} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-3xl font-black mb-1">
                          Founder
                        </Text>
                        <Text className="text-blue-300 text-base font-bold">
                          Build Your Startup
                        </Text>
                      </View>
                    </View>
                    <Text className="text-slate-300 text-base leading-7 mb-4">
                      Get complete visibility and control across your entire company.
                      Manage OKRs, track work, build your team, and run your startup like a pro.
                    </Text>
                    <View className="flex-row items-center">
                      <View className="bg-blue-500/20 px-3 py-1.5 rounded-full mr-2">
                        <Text className="text-blue-300 text-xs font-bold">Save 81%</Text>
                      </View>
                      <View className="bg-blue-500/20 px-3 py-1.5 rounded-full">
                        <Text className="text-blue-300 text-xs font-bold">£95K vs £500K+</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Executive */}
            <Animated.View entering={FadeInDown.delay(400).duration(600).springify()}>
              <Pressable
                onPress={() => handleRoleSelect('FractionalExec')}
                className="active:scale-[0.98]"
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 28, padding: 1.5 }}
                >
                  <View className="bg-slate-900/95 rounded-[26px] p-7 border-2 border-violet-500/20">
                    <View className="flex-row items-center mb-5">
                      <View className="bg-violet-500 p-4 rounded-2xl mr-5 shadow-lg">
                        <Award size={36} color="#ffffff" strokeWidth={2.5} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-3xl font-black mb-1">
                          Executive
                        </Text>
                        <Text className="text-violet-300 text-base font-bold">
                          Lead & Earn More
                        </Text>
                      </View>
                    </View>
                    <Text className="text-slate-300 text-base leading-7 mb-4">
                      Offer your expertise to multiple startups. Create structured work,
                      review output, and help founders execute. Work with clients on your terms.
                    </Text>
                    <View className="flex-row items-center">
                      <View className="bg-violet-500/20 px-3 py-1.5 rounded-full mr-2">
                        <Text className="text-violet-300 text-xs font-bold">£800/day</Text>
                      </View>
                      <View className="bg-violet-500/20 px-3 py-1.5 rounded-full">
                        <Text className="text-violet-300 text-xs font-bold">£384K/year</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Apprentice */}
            <Animated.View entering={FadeInDown.delay(500).duration(600).springify()}>
              <Pressable
                onPress={() => handleRoleSelect('Apprentice')}
                className="active:scale-[0.98]"
              >
                <LinearGradient
                  colors={['#10b981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 28, padding: 1.5 }}
                >
                  <View className="bg-slate-900/95 rounded-[26px] p-7 border-2 border-emerald-500/20">
                    <View className="flex-row items-center mb-5">
                      <View className="bg-emerald-500 p-4 rounded-2xl mr-5 shadow-lg">
                        <Zap size={36} color="#ffffff" strokeWidth={2.5} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-3xl font-black mb-1">
                          Apprentice
                        </Text>
                        <Text className="text-emerald-300 text-base font-bold">
                          Learn While You Earn
                        </Text>
                      </View>
                    </View>
                    <Text className="text-slate-300 text-base leading-7 mb-4">
                      Complete tasks, build your skills, and level up your career.
                      Work with top startups and learn from experienced executives.
                    </Text>
                    <View className="flex-row items-center">
                      <View className="bg-emerald-500/20 px-3 py-1.5 rounded-full mr-2">
                        <Text className="text-emerald-300 text-xs font-bold">£180-220/day</Text>
                      </View>
                      <View className="bg-emerald-500/20 px-3 py-1.5 rounded-full">
                        <Text className="text-emerald-300 text-xs font-bold">£19K+/year</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Manufacturer - Coming Soon */}
            <Animated.View entering={FadeInDown.delay(600).duration(600).springify()}>
              <View className="opacity-60">
                <LinearGradient
                  colors={['#64748b', '#475569', '#334155']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 28, padding: 1.5 }}
                >
                  <View className="bg-slate-900/95 rounded-[26px] p-7 border-2 border-slate-600/20">
                    <View className="flex-row items-center mb-5">
                      <View className="bg-slate-600 p-4 rounded-2xl mr-5">
                        <Building2 size={36} color="#ffffff" strokeWidth={2.5} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-3xl font-black mb-1">
                          Manufacturing
                        </Text>
                        <View className="bg-amber-500/30 px-3 py-1 rounded-full self-start">
                          <Text className="text-amber-300 text-xs font-bold">COMING SOON</Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-slate-400 text-base leading-7">
                      Offer manufacturing capabilities to hardware startups.
                      List your services, capabilities, and connect with founders.
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          </View>

          {/* Footer */}
          <Animated.View
            entering={FadeInUp.delay(700).duration(600)}
            className="px-8 mt-12"
          >
            <Text className="text-slate-500 text-sm text-center leading-6">
              By continuing, you agree to Centaur OS's{'\n'}
              <Text className="text-slate-400 font-semibold">Terms of Service</Text> and <Text className="text-slate-400 font-semibold">Privacy Policy</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
