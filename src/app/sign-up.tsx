import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Mail, User, ArrowRight, ArrowLeft, Sparkles, Rocket } from 'lucide-react-native';
import { userApi, workspaceApi } from '@/lib/api';
import { useAppStore } from '@/lib/state/app-store';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
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

  const handleSignUp = async () => {
    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!workspaceName.trim()) {
      setError('Please enter a workspace name');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Check if user already exists
      const existingUser = await userApi.getByEmail(email.toLowerCase());
      if (existingUser) {
        setError('An account with this email already exists. Please sign in instead.');
        setIsLoading(false);
        return;
      }

      // Create new user
      const user = await userApi.create({
        email: email.toLowerCase(),
        name: name.trim(),
      });

      // Create workspace for the user
      const workspace = await workspaceApi.create({
        name: workspaceName.trim(),
        ownerId: user.id,
      });

      // Mock auth token
      const token = `token_${user.id}_${Date.now()}`;

      setCurrentUser(user);
      setAuthToken(token);

      // Navigate to welcome screen for role selection
      router.replace('/welcome');
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Failed to create account. Please try again.');
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-6 justify-center py-12">
              {/* Back Button */}
              <Pressable
                onPress={() => router.back()}
                className="flex-row items-center mb-6 active:opacity-70 self-start"
              >
                <ArrowLeft size={20} color="white" />
                <Text className="text-white ml-2 font-semibold">Back to Sign In</Text>
              </Pressable>

              {/* Logo and Title */}
              <View className="items-center mb-8">
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
                    Start Your Lean Startup Journey
                  </Text>
                </View>
              </View>

              {/* Sign Up Form */}
              <View className="bg-white rounded-3xl p-7 shadow-2xl border-2 border-white/50">
                <View className="flex-row items-center mb-6">
                  <Text className="text-gray-900 text-2xl font-black flex-1">Create Account</Text>
                  <View className="bg-blue-500 p-2 rounded-full">
                    <Sparkles size={20} color="white" />
                  </View>
                </View>

                {/* Name Input */}
                <View className="mb-5">
                  <Text className="text-gray-700 mb-2 text-sm font-semibold">Full Name</Text>
                  <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-4 border-2 border-gray-200">
                    <View className="bg-blue-500 p-2 rounded-lg mr-3">
                      <User size={18} color="white" />
                    </View>
                    <TextInput
                      className="flex-1 text-gray-900 text-base font-medium"
                      placeholder="John Doe"
                      placeholderTextColor="#94a3b8"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Email Input */}
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

                {/* Workspace Name Input */}
                <View className="mb-5">
                  <Text className="text-gray-700 mb-2 text-sm font-semibold">Workspace Name</Text>
                  <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-4 border-2 border-gray-200">
                    <View className="bg-blue-500 p-2 rounded-lg mr-3">
                      <Building2 size={18} color="white" />
                    </View>
                    <TextInput
                      className="flex-1 text-gray-900 text-base font-medium"
                      placeholder="My Startup"
                      placeholderTextColor="#94a3b8"
                      value={workspaceName}
                      onChangeText={setWorkspaceName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                  <Text className="text-gray-500 text-xs mt-2 ml-1">
                    You can invite team members later
                  </Text>
                </View>

                {error ? (
                  <View className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-5">
                    <Text className="text-red-700 text-sm font-semibold">{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={handleSignUp}
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
                      <Text className="text-white font-black text-lg mr-2">Create Account</Text>
                      <ArrowRight size={24} color="white" strokeWidth={3} />
                    </>
                  )}
                </Pressable>
              </View>

              {/* Sign In Link */}
              <View className="mt-8 flex-row items-center justify-center bg-white/15 backdrop-blur-xl rounded-2xl py-4 px-6 border border-white/30">
                <Text className="text-white text-base font-semibold">Already have an account? </Text>
                <Pressable
                  onPress={() => router.replace('/sign-in')}
                  disabled={isLoading}
                  className="active:opacity-70"
                >
                  <Text className="text-white font-black text-base underline">Sign In</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
