import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Save,
  Camera,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore, useCurrentUser, useCurrentMembership } from '@/lib/state/app-store';
import { useTheme } from '@/lib/ThemeContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const currentMembership = useCurrentMembership();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const inputBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';
  const inputText = isDark ? 'text-white' : 'text-gray-900';
  const placeholderColor = isDark ? '#64748b' : '#9ca3af';

  // Form state
  const [name, setName] = useState(currentUser?.name ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name ?? '');
      setEmail(currentUser.email ?? '');
    }
  }, [currentUser]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email.');
      return;
    }

    setIsSaving(true);

    // Update user profile
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name: name.trim(),
        email: email.trim(),
      });
    }

    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Profile Updated', 'Your profile has been saved successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 500);
  };

  const getRoleDisplay = () => {
    const role = currentMembership?.role ?? 'User';
    switch (role) {
      case 'Founder': return 'Founder';
      case 'FractionalExec': return 'Executive';
      case 'Apprentice': return 'Team Member';
      case 'Government': return 'Investor';
      default: return role;
    }
  };

  return (
    <View className={`flex-1 ${bgPrimary}`}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#3b82f6', '#1d4ed8'] : ['#3b82f6', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 24 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">ACCOUNT</Text>
            <Text className="text-white text-xl font-bold">Edit Profile</Text>
          </View>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg ${isSaving ? 'bg-white/20' : 'bg-white/30'} active:opacity-70`}
          >
            <View className="flex-row items-center">
              <Save size={16} color="#fff" />
              <Text className="text-white font-semibold ml-2">
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Avatar Section */}
        <View className="items-center">
          <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-3">
            <User size={48} color="#fff" />
          </View>
          <Pressable className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-full active:opacity-70">
            <Camera size={14} color="#fff" />
            <Text className="text-white text-sm ml-1">Change Photo</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Role Badge */}
        <View className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-4`}>
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-lg bg-blue-500/20 items-center justify-center mr-3">
              <Briefcase size={20} color="#3b82f6" />
            </View>
            <View>
              <Text className={`${textSecondary} text-xs`}>YOUR ROLE</Text>
              <Text className={`${textPrimary} font-bold text-lg`}>{getRoleDisplay()}</Text>
            </View>
          </View>
          {currentMembership?.function && (
            <View className="flex-row items-center mt-3 pt-3 border-t border-slate-800/30">
              <Building2 size={14} color="#64748b" />
              <Text className={`${textSecondary} text-sm ml-2`}>
                Function: {currentMembership.function}
              </Text>
            </View>
          )}
        </View>

        {/* Form Fields */}
        <View className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-4`}>
          <Text className={`${textPrimary} font-bold mb-4`}>Personal Information</Text>

          {/* Name */}
          <View className="mb-4">
            <Text className={`${textSecondary} text-sm mb-2`}>Full Name *</Text>
            <View className={`flex-row items-center ${inputBg} rounded-xl px-4`}>
              <User size={18} color={placeholderColor} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={placeholderColor}
                className={`flex-1 ${inputText} py-3 ml-3`}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className={`${textSecondary} text-sm mb-2`}>Email Address *</Text>
            <View className={`flex-row items-center ${inputBg} rounded-xl px-4`}>
              <Mail size={18} color={placeholderColor} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={placeholderColor}
                className={`flex-1 ${inputText} py-3 ml-3`}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone */}
          <View className="mb-4">
            <Text className={`${textSecondary} text-sm mb-2`}>Phone Number</Text>
            <View className={`flex-row items-center ${inputBg} rounded-xl px-4`}>
              <Phone size={18} color={placeholderColor} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={placeholderColor}
                className={`flex-1 ${inputText} py-3 ml-3`}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Bio */}
          <View>
            <Text className={`${textSecondary} text-sm mb-2`}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={placeholderColor}
              className={`${inputBg} ${inputText} rounded-xl px-4 py-3`}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />
          </View>
        </View>

        {/* Info Note */}
        <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <Text className="text-blue-400 text-sm">
            Your profile information is visible to other team members in your workspace.
            Changes are saved automatically when you tap Save.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
