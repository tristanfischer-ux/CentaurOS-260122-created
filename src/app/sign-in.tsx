import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Mail, ArrowRight, Zap, Sparkles, TrendingUp, Lock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { userService } from '@/lib/supabase-service';
import { useAppStore } from '@/lib/state/app-store';
import { router } from 'expo-router';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { CentaurLogo } from '@/components/CentaurLogo';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setAuthToken = useAppStore((s) => s.setAuthToken);

  // Animated values for floating elements
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
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
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
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

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleSignIn = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to sign in. Please try again.');
        setIsLoading(false);
        return;
      }

      // Get user profile from local API (or create if doesn't exist)
      let user = await userService.getByEmail(email.toLowerCase());

      if (!user) {
        // Create user profile in local store if it doesn't exist
        user = await userService.create({
          id: authData.user.id,
          email: email.toLowerCase(),
          name: authData.user.user_metadata?.name || email.split('@')[0],
        });
      }

      // Set auth token from Supabase session
      const token = authData.session?.access_token || '';

      setCurrentUser(user);
      setAuthToken(token);

      // Load user data from Supabase
      await useAppStore.getState().loadUserData(user.id);

      // Check if user has completed onboarding
      const completedOnboarding = await hasCompletedOnboarding(user.id);

      if (completedOnboarding) {
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        // Navigate to onboarding
        router.replace('/onboarding');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickSignIn = async (demoEmail: string, demoPassword: string = 'demo1234') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);
    setError('');

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: demoEmail.toLowerCase(),
        password: demoPassword,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to sign in. Please try again.');
        setIsLoading(false);
        return;
      }

      // Get user profile from Supabase
      let user = await userService.getByEmail(demoEmail.toLowerCase());

      if (!user) {
        // Create user profile in database if it doesn't exist
        user = await userService.create({
          id: authData.user.id,
          email: demoEmail.toLowerCase(),
          name: authData.user.user_metadata?.name || demoEmail.split('@')[0],
        });
      }

      // Set auth token from Supabase session
      const token = authData.session?.access_token || '';

      setCurrentUser(user);
      setAuthToken(token);

      // Load user data from Supabase
      await useAppStore.getState().loadUserData(user.id);

      // Check if user has completed onboarding
      const completedOnboarding = await hasCompletedOnboarding(user.id);

      if (completedOnboarding) {
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        // Navigate to onboarding
        router.replace('/onboarding');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Compact Logo and Title */}
          <View className="items-center mb-6">
            <Text className="text-5xl font-black text-white tracking-tight">
              Centaur OS
            </Text>
            <Text className="text-white text-sm font-semibold mt-2 opacity-90">
              The OS for Lean Companies
            </Text>
          </View>

          {/* Sign In Form */}
          <View className="bg-white rounded-3xl p-6 shadow-2xl mb-4">
            <View className="flex-row items-center mb-4">
              <Text className="text-gray-900 text-xl font-black flex-1">Welcome Back</Text>
              <View className="bg-blue-500 p-2 rounded-full">
                <Sparkles size={16} color="white" />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1.5 text-xs font-semibold">Email Address</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-3 border border-gray-200">
                <View className="bg-blue-500 p-1.5 rounded-lg mr-2">
                  <Mail size={16} color="white" />
                </View>
                <TextInput
                  className="flex-1 text-gray-900 text-sm font-medium"
                  placeholder="you@example.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1.5 text-xs font-semibold">Password</Text>
              <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-3 border border-gray-200">
                <View className="bg-blue-500 p-1.5 rounded-lg mr-2">
                  <Lock size={16} color="white" />
                </View>
                <TextInput
                  className="flex-1 text-gray-900 text-sm font-medium"
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-4">
                <Text className="text-red-700 text-xs font-semibold">{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              className="rounded-xl py-4 flex-row items-center justify-center active:scale-[0.98] shadow-lg mb-3"
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 12,
                }}
              />
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-black text-base mr-2">Sign In</Text>
                  <ArrowRight size={20} color="white" strokeWidth={3} />
                </>
              )}
            </Pressable>

            {/* Sign Up Link - Inside the card */}
            <View className="flex-row items-center justify-center pt-2 border-t border-gray-200">
              <Text className="text-gray-600 text-xs font-medium">Don't have an account? </Text>
              <Pressable
                onPress={() => router.push('/sign-up')}
                disabled={isLoading}
                className="active:opacity-70"
              >
                <Text className="text-blue-600 font-black text-xs">Sign Up Free</Text>
              </Pressable>
            </View>
          </View>

          {/* Compact Demo Accounts */}
          <Text className="text-white text-xs font-bold text-center mb-3 opacity-80">Quick Demo Access</Text>

          <View className="gap-2.5">
            <Pressable
              onPress={() => quickSignIn('founder@fractional.com')}
              disabled={isLoading}
              className="bg-white/95 rounded-xl p-3.5 active:scale-[0.98] shadow-lg"
            >
              <View className="flex-row items-center">
                <View className="bg-blue-500 p-2 rounded-lg mr-3">
                  <Building2 size={18} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-black text-sm">Founder Account</Text>
                  <Text className="text-gray-600 text-xs font-medium">Sarah Chen</Text>
                </View>
                <ArrowRight size={16} color="#3b82f6" />
              </View>
            </Pressable>

            <Pressable
              onPress={() => quickSignIn('exec@fractional.com')}
              disabled={isLoading}
              className="bg-white/95 rounded-xl p-3.5 active:scale-[0.98] shadow-lg"
            >
              <View className="flex-row items-center">
                <View className="bg-violet-500 p-2 rounded-lg mr-3">
                  <TrendingUp size={18} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-black text-sm">Executive Account</Text>
                  <Text className="text-gray-600 text-xs font-medium">Jordan Martinez</Text>
                </View>
                <ArrowRight size={16} color="#8b5cf6" />
              </View>
            </Pressable>

            <Pressable
              onPress={() => quickSignIn('apprentice@fractional.com')}
              disabled={isLoading}
              className="bg-white/95 rounded-xl p-3.5 active:scale-[0.98] shadow-lg"
            >
              <View className="flex-row items-center">
                <View className="bg-emerald-500 p-2 rounded-lg mr-3">
                  <Zap size={18} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-black text-sm">Apprentice Account</Text>
                  <Text className="text-gray-600 text-xs font-medium">Alex Rivera</Text>
                </View>
                <ArrowRight size={16} color="#10b981" />
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
