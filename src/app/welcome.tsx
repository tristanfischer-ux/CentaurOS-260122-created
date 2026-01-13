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
  withSequence,
  Easing,
} from 'react-native-reanimated';
import {
  Rocket,
  Award,
  Zap,
  Building2,
  Sparkles,
  Crown,
  ArrowRight,
} from 'lucide-react-native';
import type { Role } from '@/types';

export default function WelcomeScreen() {
  const router = useRouter();

  // Multiple floating animations for decorative elements
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    float1.value = withRepeat(
      withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    float2.value = withRepeat(
      withTiming(-15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    float3.value = withRepeat(
      withTiming(18, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const float1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: float1.value }],
  }));

  const float2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: float2.value }],
  }));

  const float3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: float3.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleRoleSelect = (role: Role | 'Manufacturer') => {
    router.push('/tutorial' as any);
  };

  return (
    <View className="flex-1">
      {/* Vibrant Gradient Background */}
      <LinearGradient
        colors={['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating decorative elements */}
      <View className="absolute inset-0 overflow-hidden">
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 80,
              right: 30,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            },
            float1Style,
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 200,
              left: -30,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
            float2Style,
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 100,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
            },
            float3Style,
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: '50%',
              left: 40,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            float1Style,
          ]}
        />
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
            className="px-6 pt-12 pb-10 items-center"
          >
            <Animated.View style={pulseStyle} className="mb-6">
              <LinearGradient
                colors={['#fbbf24', '#f59e0b', '#ea580c']}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.6,
                  shadowRadius: 20,
                }}
              >
                <Rocket size={56} color="white" strokeWidth={2.5} />
              </LinearGradient>
            </Animated.View>

            <Text className="text-white text-6xl font-black mb-4 text-center tracking-tight">
              Centaur OS
            </Text>

            <View className="bg-white/25 backdrop-blur-xl px-6 py-3 rounded-full mb-6 border border-white/40">
              <Text className="text-white text-base font-black">
                The Operating System for Lean Startups
              </Text>
            </View>

            <Text className="text-white/90 text-lg text-center leading-7 px-4 font-semibold">
              Build a £10M company with a £100K budget.{'\n'}Choose your role and join the revolution.
            </Text>
          </Animated.View>

          {/* Role Cards */}
          <View className="px-6 gap-4">
            {/* Founder */}
            <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
              <Pressable
                onPress={() => handleRoleSelect('Founder')}
                className="active:scale-[0.98]"
              >
                <View className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-white/50">
                  <View className="flex-row items-center mb-4">
                    <View className="bg-blue-500 p-4 rounded-2xl mr-4 shadow-lg">
                      <Rocket size={32} color="white" strokeWidth={2.5} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-2xl font-black mb-1">
                        Founder
                      </Text>
                      <Text className="text-blue-600 text-sm font-bold">
                        Build Your Startup
                      </Text>
                    </View>
                    <ArrowRight size={24} color="#3b82f6" strokeWidth={3} />
                  </View>
                  <Text className="text-gray-700 text-base leading-6 mb-4 font-medium">
                    Get complete visibility and control. Manage OKRs, track work, build your team, and run your startup like a pro.
                  </Text>
                  <View className="flex-row items-center">
                    <View className="bg-blue-100 px-3 py-2 rounded-xl mr-2 border border-blue-200">
                      <Text className="text-blue-700 text-xs font-black">Save 81%</Text>
                    </View>
                    <View className="bg-blue-100 px-3 py-2 rounded-xl border border-blue-200">
                      <Text className="text-blue-700 text-xs font-black">£95K vs £500K+</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            {/* Executive */}
            <Animated.View entering={FadeInDown.delay(400).duration(600).springify()}>
              <Pressable
                onPress={() => handleRoleSelect('FractionalExec')}
                className="active:scale-[0.98]"
              >
                <View className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-white/50">
                  <View className="flex-row items-center mb-4">
                    <View className="bg-violet-500 p-4 rounded-2xl mr-4 shadow-lg">
                      <Award size={32} color="white" strokeWidth={2.5} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-2xl font-black mb-1">
                        Executive
                      </Text>
                      <Text className="text-violet-600 text-sm font-bold">
                        Lead & Earn More
                      </Text>
                    </View>
                    <ArrowRight size={24} color="#8b5cf6" strokeWidth={3} />
                  </View>
                  <Text className="text-gray-700 text-base leading-6 mb-4 font-medium">
                    Offer your expertise to multiple startups. Create structured work, review output, and help founders execute on your terms.
                  </Text>
                  <View className="flex-row items-center">
                    <View className="bg-violet-100 px-3 py-2 rounded-xl mr-2 border border-violet-200">
                      <Text className="text-violet-700 text-xs font-black">£800/day</Text>
                    </View>
                    <View className="bg-violet-100 px-3 py-2 rounded-xl border border-violet-200">
                      <Text className="text-violet-700 text-xs font-black">£384K/year</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            {/* Apprentice */}
            <Animated.View entering={FadeInDown.delay(500).duration(600).springify()}>
              <Pressable
                onPress={() => handleRoleSelect('Apprentice')}
                className="active:scale-[0.98]"
              >
                <View className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-white/50">
                  <View className="flex-row items-center mb-4">
                    <View className="bg-emerald-500 p-4 rounded-2xl mr-4 shadow-lg">
                      <Zap size={32} color="white" strokeWidth={2.5} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-2xl font-black mb-1">
                        Apprentice
                      </Text>
                      <Text className="text-emerald-600 text-sm font-bold">
                        Learn While You Earn
                      </Text>
                    </View>
                    <ArrowRight size={24} color="#10b981" strokeWidth={3} />
                  </View>
                  <Text className="text-gray-700 text-base leading-6 mb-4 font-medium">
                    Complete tasks, build your skills, and level up your career. Work with top startups and learn from experienced executives.
                  </Text>
                  <View className="flex-row items-center">
                    <View className="bg-emerald-100 px-3 py-2 rounded-xl mr-2 border border-emerald-200">
                      <Text className="text-emerald-700 text-xs font-black">£180-220/day</Text>
                    </View>
                    <View className="bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200">
                      <Text className="text-emerald-700 text-xs font-black">£19K+/year</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            {/* Manufacturer - Coming Soon */}
            <Animated.View entering={FadeInDown.delay(600).duration(600).springify()}>
              <View className="opacity-60">
                <View className="bg-white/80 rounded-3xl p-6 shadow-xl border-2 border-gray-200">
                  <View className="flex-row items-center mb-4">
                    <View className="bg-gray-400 p-4 rounded-2xl mr-4">
                      <Building2 size={32} color="white" strokeWidth={2.5} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-2xl font-black mb-1">
                        Manufacturing
                      </Text>
                      <View className="bg-amber-100 px-3 py-1.5 rounded-full self-start border border-amber-200">
                        <Text className="text-amber-700 text-xs font-black">COMING SOON</Text>
                      </View>
                    </View>
                  </View>
                  <Text className="text-gray-600 text-base leading-6 font-medium">
                    Offer manufacturing capabilities to hardware startups. List your services, capabilities, and connect with founders.
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Footer */}
          <Animated.View
            entering={FadeInUp.delay(700).duration(600)}
            className="px-8 mt-10"
          >
            <View className="bg-white/15 backdrop-blur-xl rounded-2xl py-4 px-6 border border-white/30">
              <Text className="text-white text-sm text-center leading-6 font-semibold">
                By continuing, you agree to Centaur OS's{'\n'}
                <Text className="text-white font-black">Terms of Service</Text> and <Text className="text-white font-black">Privacy Policy</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
