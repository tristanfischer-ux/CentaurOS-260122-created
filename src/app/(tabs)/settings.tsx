import { View, Text, Pressable, ScrollView } from 'react-native';
import { LogOut, Clock, ChevronRight, Sun, Moon, Smartphone, FileText } from 'lucide-react-native';
import { useAppStore, useCurrentUser, useCurrentMembership } from '@/lib/state/app-store';
import { router } from 'expo-router';
import { useState } from 'react';
import type { ThemeMode } from '@/types';

export default function SettingsScreen() {
  const currentUser = useCurrentUser();
  const currentMembership = useCurrentMembership();
  const logout = useAppStore((s) => s.logout);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    currentUser?.preferences?.themeMode ?? 'dark'
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/sign-in');
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          themeMode: mode,
        },
      });
    }
  };

  const canViewUtilization = currentMembership?.role === 'FractionalExec' || currentMembership?.role === 'Founder';

  const themeOptions: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Smartphone },
  ];

  return (
    <ScrollView className="flex-1 bg-slate-950">
      <View className="p-4">
        <View className="bg-slate-900 rounded-2xl p-6 mb-4">
          <Text className="text-slate-400 text-sm mb-2">Logged in as</Text>
          <Text className="text-white text-lg font-semibold">{currentUser?.name}</Text>
          <Text className="text-slate-400 text-sm">{currentUser?.email}</Text>
          {currentMembership && (
            <View className="mt-2 pt-2 border-t border-slate-800">
              <Text className="text-slate-500 text-xs">Role: {currentMembership.role}</Text>
            </View>
          )}
        </View>

        {/* Theme Selection */}
        <View className="bg-slate-900 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Theme</Text>
          <View className="flex-row gap-2">
            {themeOptions.map(({ mode, label, icon: Icon }) => (
              <Pressable
                key={mode}
                onPress={() => handleThemeChange(mode)}
                className={`flex-1 p-3 rounded-xl border-2 ${
                  themeMode === mode
                    ? 'bg-blue-500/10 border-blue-500'
                    : 'bg-slate-800 border-slate-700'
                } active:opacity-70`}
              >
                <View className="items-center">
                  <Icon size={20} color={themeMode === mode ? '#3b82f6' : '#94a3b8'} />
                  <Text
                    className={`text-sm font-medium mt-1 ${
                      themeMode === mode ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Text className="text-slate-500 text-xs mt-2">
            {themeMode === 'system'
              ? 'Theme follows your device settings'
              : `Using ${themeMode} mode (Note: Light mode coming soon)`}
          </Text>
        </View>

        {/* Reports */}
        <Pressable
          onPress={() => router.push('/reports')}
          className="bg-slate-900 rounded-2xl p-4 mb-4 flex-row items-center justify-between active:opacity-80"
        >
          <View className="flex-row items-center">
            <FileText size={20} color="#10b981" />
            <Text className="text-white font-semibold ml-3">Reports</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </Pressable>

        {canViewUtilization && (
          <Pressable
            onPress={() => router.push('/utilization')}
            className="bg-slate-900 rounded-2xl p-4 mb-4 flex-row items-center justify-between active:opacity-80"
          >
            <View className="flex-row items-center">
              <Clock size={20} color="#3b82f6" />
              <Text className="text-white font-semibold ml-3">Team Utilization</Text>
            </View>
            <ChevronRight size={20} color="#64748b" />
          </Pressable>
        )}

        <Pressable
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex-row items-center active:opacity-80"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-3">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
