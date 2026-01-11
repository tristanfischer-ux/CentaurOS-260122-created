import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Mail, ArrowRight } from 'lucide-react-native';
import { userApi } from '@/lib/api';
import { useAppStore } from '@/lib/state/app-store';
import { router } from 'expo-router';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setAuthToken = useAppStore((s) => s.setAuthToken);

  const handleSignIn = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate magic link auth - in a real app, this would send an email
      const user = await userApi.getByEmail(email.toLowerCase());

      if (!user) {
        setError('No account found with this email. Please check the demo accounts.');
        setIsLoading(false);
        return;
      }

      // Mock auth token
      const token = `token_${user.id}_${Date.now()}`;

      setCurrentUser(user);
      setAuthToken(token);

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickSignIn = async (demoEmail: string) => {
    setEmail(demoEmail);
    setTimeout(() => handleSignIn(), 100);
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="flex-1 px-6 justify-center">
          {/* Logo and Title */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-blue-500 rounded-2xl items-center justify-center mb-6">
              <Building2 size={40} color="white" />
            </View>
            <Text className="text-4xl font-bold text-white mb-2">Centaur OS</Text>
            <Text className="text-slate-400 text-center text-base">
              The operating system for lean hardware startups
            </Text>
          </View>

          {/* Sign In Form */}
          <View className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700">
            <Text className="text-white text-xl font-semibold mb-4">Sign In</Text>

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

            {error ? (
              <Text className="text-red-400 text-sm mb-4">{error}</Text>
            ) : null}

            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-80"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-semibold text-base mr-2">Continue</Text>
                  <ArrowRight size={20} color="white" />
                </>
              )}
            </Pressable>
          </View>

          {/* Demo Accounts */}
          <View className="mt-8">
            <Text className="text-slate-400 text-center mb-4 text-sm">Demo Accounts</Text>
            <View className="gap-3">
              <Pressable
                onPress={() => quickSignIn('founder@fractional.com')}
                disabled={isLoading}
                className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 active:opacity-80"
              >
                <Text className="text-white font-medium mb-1">Founder (Sarah Chen)</Text>
                <Text className="text-slate-400 text-xs">founder@fractional.com</Text>
              </Pressable>

              <Pressable
                onPress={() => quickSignIn('apprentice@fractional.com')}
                disabled={isLoading}
                className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 active:opacity-80"
              >
                <Text className="text-white font-medium mb-1">Apprentice (Alex Rivera)</Text>
                <Text className="text-slate-400 text-xs">apprentice@fractional.com</Text>
              </Pressable>

              <Pressable
                onPress={() => quickSignIn('exec@fractional.com')}
                disabled={isLoading}
                className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 active:opacity-80"
              >
                <Text className="text-white font-medium mb-1">Fractional Exec (Jordan Martinez)</Text>
                <Text className="text-slate-400 text-xs">exec@fractional.com</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
