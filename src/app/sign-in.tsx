import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Mail, ArrowRight, Zap, Sparkles, TrendingUp, Rocket, Lock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { userService } from '@/lib/supabase-service';
import { useAppStore } from '@/lib/state/app-store';
import { router } from 'expo-router';
import { hasCompletedOnboarding } from '@/lib/onboarding';
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
        {/* Floating decorative elements */}
        <View className="absolute inset-0 overflow-hidden">
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 100,
                right: 30,
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
              },
              float1Style,
            ]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 200,
                left: -20,
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              float2Style,
            ]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                bottom: 150,
                right: -30,
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
              float1Style,
            ]}
          />
        </View>

        <View className="flex-1 px-6 justify-center">
          {/* Logo and Title */}
          <View className="items-center mb-10">
            <Animated.View style={pulseStyle}>
              <LinearGradient
                colors={['#fbbf24', '#f59e0b', '#ea580c']}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.5,
                  shadowRadius: 16,
                }}
              >
                <Rocket size={48} color="white" strokeWidth={2.5} />
              </LinearGradient>
            </Animated.View>
            <Text className="text-5xl font-black text-white mb-3 tracking-tight">
              Centaur OS
            </Text>
            <View className="bg-white/20 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/30">
              <Text className="text-white text-base font-bold">
                The Operating System for Lean Startups
              </Text>
            </View>
          </View>

          {/* Sign In Form */}
          <View className="bg-white rounded-3xl p-7 shadow-2xl border-2 border-white/50">
            <View className="flex-row items-center mb-6">
              <Text className="text-gray-900 text-2xl font-black flex-1">Welcome Back</Text>
              <View className="bg-blue-500 p-2 rounded-full">
                <Sparkles size={20} color="white" />
              </View>
            </View>

            <View className="mb-5">
              <Text className="text-gray-700 mb-2 text-sm font-semibold">Email Address</Text>
              <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-4 border-2 border-gray-200">
                <View className="bg-blue-500 p-2 rounded-lg mr-3">
                  <Mail size={18} color="white" />
                </View>
                <TextInput
                  className="flex-1 text-gray-900 text-base font-medium"
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

            <View className="mb-5">
              <Text className="text-gray-700 mb-2 text-sm font-semibold">Password</Text>
              <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-4 border-2 border-gray-200">
                <View className="bg-blue-500 p-2 rounded-lg mr-3">
                  <Lock size={18} color="white" />
                </View>
                <TextInput
                  className="flex-1 text-gray-900 text-base font-medium"
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
              <View className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-5">
                <Text className="text-red-700 text-sm font-semibold">{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              className="rounded-2xl py-5 flex-row items-center justify-center active:scale-[0.98] shadow-lg"
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb', '#1d4ed8']}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 16,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-black text-lg mr-2">Sign In</Text>
                  <ArrowRight size={24} color="white" strokeWidth={3} />
                </>
              )}
            </Pressable>
          </View>

          {/* Demo Accounts */}
          <View className="mt-8">
            <View className="flex-row items-center justify-center mb-5">
              <View className="flex-1 h-px bg-white/30" />
              <Text className="text-white font-bold text-sm mx-4">Quick Demo Access</Text>
              <View className="flex-1 h-px bg-white/30" />
            </View>

            <View className="gap-3">
              <Pressable
                onPress={() => quickSignIn('founder@fractional.com')}
                disabled={isLoading}
                className="bg-white/95 border-2 border-white rounded-2xl p-5 active:scale-[0.98] shadow-lg"
              >
                <View className="flex-row items-center">
                  <View className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl mr-4">
                    <Building2 size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-black text-base mb-0.5">Founder Account</Text>
                    <Text className="text-gray-600 text-sm font-semibold">Sarah Chen • founder@fractional.com</Text>
                  </View>
                  <ArrowRight size={20} color="#3b82f6" />
                </View>
              </Pressable>

              <Pressable
                onPress={() => quickSignIn('exec@fractional.com')}
                disabled={isLoading}
                className="bg-white/95 border-2 border-white rounded-2xl p-5 active:scale-[0.98] shadow-lg"
              >
                <View className="flex-row items-center">
                  <View className="bg-gradient-to-br from-violet-500 to-violet-600 p-3 rounded-xl mr-4">
                    <TrendingUp size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-black text-base mb-0.5">Executive Account</Text>
                    <Text className="text-gray-600 text-sm font-semibold">Jordan Martinez • exec@fractional.com</Text>
                  </View>
                  <ArrowRight size={20} color="#8b5cf6" />
                </View>
              </Pressable>

              <Pressable
                onPress={() => quickSignIn('apprentice@fractional.com')}
                disabled={isLoading}
                className="bg-white/95 border-2 border-white rounded-2xl p-5 active:scale-[0.98] shadow-lg"
              >
                <View className="flex-row items-center">
                  <View className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl mr-4">
                    <Zap size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-black text-base mb-0.5">Apprentice Account</Text>
                    <Text className="text-gray-600 text-sm font-semibold">Alex Rivera • apprentice@fractional.com</Text>
                  </View>
                  <ArrowRight size={20} color="#10b981" />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Sign Up Link */}
          <View className="mt-8 flex-row items-center justify-center bg-white/15 backdrop-blur-xl rounded-2xl py-4 px-6 border border-white/30">
            <Text className="text-white text-base font-semibold">Don't have an account? </Text>
            <Pressable
              onPress={() => router.push('/sign-up')}
              disabled={isLoading}
              className="active:opacity-70"
            >
              <Text className="text-white font-black text-base underline">Sign Up Free</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
