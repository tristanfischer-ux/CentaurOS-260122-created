import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Mail, User, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { userApi, workspaceApi } from '@/lib/api';
import { useAppStore } from '@/lib/state/app-store';
import { router } from 'expo-router';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setAuthToken = useAppStore((s) => s.setAuthToken);

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

      // Navigate to onboarding for new users
      router.replace('/onboarding');
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 justify-center py-12">
            {/* Back Button */}
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center mb-6 active:opacity-70"
            >
              <ArrowLeft size={20} color="#94a3b8" />
              <Text className="text-slate-400 ml-2">Back to Sign In</Text>
            </Pressable>

            {/* Logo and Title */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-blue-500 rounded-2xl items-center justify-center mb-6">
                <Building2 size={40} color="white" />
              </View>
              <Text className="text-4xl font-bold text-white mb-2">Create Account</Text>
              <Text className="text-slate-400 text-center text-base">
                Start managing your lean startup today
              </Text>
            </View>

            {/* Sign Up Form */}
            <View className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700">
              <Text className="text-white text-xl font-semibold mb-4">Sign Up</Text>

              {/* Name Input */}
              <View className="mb-4">
                <Text className="text-slate-400 mb-2 text-sm">Full Name</Text>
                <View className="flex-row items-center bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-700">
                  <User size={20} color="#94a3b8" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="John Doe"
                    placeholderTextColor="#64748b"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-slate-400 mb-2 text-sm">Email</Text>
                <View className="flex-row items-center bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-700">
                  <Mail size={20} color="#94a3b8" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="you@example.com"
                    placeholderTextColor="#64748b"
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
              <View className="mb-4">
                <Text className="text-slate-400 mb-2 text-sm">Workspace Name</Text>
                <View className="flex-row items-center bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-700">
                  <Building2 size={20} color="#94a3b8" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="My Startup"
                    placeholderTextColor="#64748b"
                    value={workspaceName}
                    onChangeText={setWorkspaceName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                <Text className="text-slate-500 text-xs mt-1">
                  This will be your workspace. You can invite team members later.
                </Text>
              </View>

              {error ? (
                <Text className="text-red-400 text-sm mb-4">{error}</Text>
              ) : null}

              <Pressable
                onPress={handleSignUp}
                disabled={isLoading}
                className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-80"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white font-semibold text-base mr-2">Create Account</Text>
                    <ArrowRight size={20} color="white" />
                  </>
                )}
              </Pressable>
            </View>

            {/* Sign In Link */}
            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-slate-400 text-sm">Already have an account? </Text>
              <Pressable
                onPress={() => router.replace('/sign-in')}
                disabled={isLoading}
                className="active:opacity-70"
              >
                <Text className="text-blue-400 font-semibold text-sm">Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
