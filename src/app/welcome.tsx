import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Rocket,
  Award,
  Zap,
  Building2
} from 'lucide-react-native';
import type { Role } from '@/types';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleRoleSelect = (role: Role | 'Manufacturer') => {
    // Go to tutorial first, which will then route to appropriate onboarding
    router.push('/tutorial' as any);
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-6 pt-12 pb-8">
            <Text className="text-gray-900 dark:text-white text-5xl font-bold mb-4">
              Welcome to{'\n'}Centaur OS
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-lg leading-7">
              The operating system for lean startups. Choose your role to get started.
            </Text>
          </View>

          {/* Role Cards */}
          <View className="px-6 gap-4">
            {/* Founder */}
            <Pressable
              onPress={() => handleRoleSelect('Founder')}
              className="active:opacity-80"
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 1 }}
              >
                <View className="bg-gray-100 dark:bg-slate-900 rounded-[23px] p-6">
                  <View className="flex-row items-center mb-4">
                    <View className="bg-blue-500/20 p-3 rounded-2xl mr-4">
                      <Rocket size={32} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
                        Founder
                      </Text>
                      <Text className="text-blue-400 text-sm font-semibold">
                        I'm building a startup
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-base leading-6">
                    Get complete visibility and control across your entire company.
                    Manage OKRs, track work, build your team, and run your startup like a pro.
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Executive */}
            <Pressable
              onPress={() => handleRoleSelect('FractionalExec')}
              className="active:opacity-80"
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 1 }}
              >
                <View className="bg-gray-100 dark:bg-slate-900 rounded-[23px] p-6">
                  <View className="flex-row items-center mb-4">
                    <View className="bg-violet-500/20 p-3 rounded-2xl mr-4">
                      <Award size={32} color="#8b5cf6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
                        Fractional Executive
                      </Text>
                      <Text className="text-violet-400 text-sm font-semibold">
                        I provide expert leadership
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-base leading-6">
                    Offer your expertise to multiple startups. Create structured work,
                    review output, and help founders execute. Work with clients on your terms.
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Apprentice */}
            <Pressable
              onPress={() => handleRoleSelect('Apprentice')}
              className="active:opacity-80"
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 1 }}
              >
                <View className="bg-gray-100 dark:bg-slate-900 rounded-[23px] p-6">
                  <View className="flex-row items-center mb-4">
                    <View className="bg-emerald-500/20 p-3 rounded-2xl mr-4">
                      <Zap size={32} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
                        Apprentice
                      </Text>
                      <Text className="text-emerald-400 text-sm font-semibold">
                        I want to learn & execute
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-base leading-6">
                    Complete tasks, build your skills, and level up your career.
                    Work with top startups and learn from experienced executives.
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Manufacturer - Coming Soon */}
            <View className="opacity-50">
              <LinearGradient
                colors={['#64748b', '#475569']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 1 }}
              >
                <View className="bg-gray-100 dark:bg-slate-900 rounded-[23px] p-6">
                  <View className="flex-row items-center mb-4">
                    <View className="bg-slate-500/20 p-3 rounded-2xl mr-4">
                      <Building2 size={32} color="#64748b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-1">
                        Manufacturing Partner
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm font-semibold">
                        Coming Soon
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-base leading-6">
                    Offer manufacturing capabilities to hardware startups.
                    List your services, capabilities, and connect with founders.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Footer Note */}
          <View className="px-6 mt-8">
            <Text className="text-slate-500 text-sm text-center leading-6">
              By continuing, you agree to Centaur OS's Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
