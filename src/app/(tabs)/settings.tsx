import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { LogOut, ChevronRight, Sun, Moon, Smartphone, FileText, Info, X } from 'lucide-react-native';
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
  const [showAbout, setShowAbout] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/sign-in');
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          themeMode: mode,
        },
      };

      // Update in store (which also persists to storage)
      setCurrentUser(updatedUser);

      // Also update in the users database
      const users = useAppStore.getState().users;
      const setUsers = useAppStore.getState().setUsers;
      setUsers({
        ...users,
        [currentUser.id]: updatedUser,
      });
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Smartphone },
  ];

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-950">
      <View className="p-4">
        <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-6 mb-4">
          <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Logged in as</Text>
          <Text className="text-gray-900 dark:text-white text-lg font-semibold">{currentUser?.name}</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm">{currentUser?.email}</Text>
          {currentMembership && (
            <View className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-800">
              <Text className="text-gray-500 dark:text-slate-500 text-xs">Role: {currentMembership.role}</Text>
            </View>
          )}
        </View>

        {/* Theme Selection */}
        <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4">
          <Text className="text-gray-900 dark:text-white font-semibold mb-3">Theme</Text>
          <View className="flex-row gap-2">
            {themeOptions.map(({ mode, label, icon: Icon }) => (
              <Pressable
                key={mode}
                onPress={() => handleThemeChange(mode)}
                className={`flex-1 p-3 rounded-xl border-2 ${
                  themeMode === mode
                    ? 'bg-blue-500/10 border-blue-500'
                    : 'bg-gray-200 dark:bg-slate-800 border-gray-300 dark:border-slate-700'
                } active:opacity-70`}
              >
                <View className="items-center">
                  <Icon size={20} color={themeMode === mode ? '#3b82f6' : '#94a3b8'} />
                  <Text
                    className={`text-sm font-medium mt-1 ${
                      themeMode === mode ? 'text-blue-400' : 'text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Text className="text-gray-500 dark:text-slate-500 text-xs mt-2">
            {themeMode === 'system'
              ? 'Theme follows your device settings'
              : `Using ${themeMode} mode`}
          </Text>
        </View>

        {/* Reports */}
        <Pressable
          onPress={() => router.push('/reports')}
          className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4 flex-row items-center justify-between active:opacity-80"
        >
          <View className="flex-row items-center">
            <FileText size={20} color="#10b981" />
            <Text className="text-gray-900 dark:text-white font-semibold ml-3">Reports</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </Pressable>

        {/* About */}
        <Pressable
          onPress={() => setShowAbout(true)}
          className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 mb-4 flex-row items-center justify-between active:opacity-80"
        >
          <View className="flex-row items-center">
            <Info size={20} color="#3b82f6" />
            <Text className="text-gray-900 dark:text-white font-semibold ml-3">About Centaur OS</Text>
          </View>
          <ChevronRight size={20} color="#64748b" />
        </Pressable>

        <Pressable
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex-row items-center active:opacity-80"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-3">Sign Out</Text>
        </Pressable>
      </View>

      {/* About Modal */}
      <Modal visible={showAbout} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
            <View className="p-6 border-b border-gray-200 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">About Centaur OS</Text>
                <Pressable onPress={() => setShowAbout(false)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
              <View className="gap-6">
                {/* Overview */}
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">What is Centaur OS?</Text>
                  <Text className="text-gray-700 dark:text-slate-300 leading-6">
                    Centaur OS is the operating system for lean hardware startups. It helps you run your business efficiently with a small team: 2 founders, apprentices (doers), and fractional executives (reviewers), augmented by AI agents and manufacturing partners.
                  </Text>
                </View>

                {/* Key Features */}
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">Key Features</Text>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">📊 Dashboard</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Role-specific views for Founders, Executives, and Apprentices. Founders see financial dashboards with burn rate, runway, and budget tracking. All roles see relevant KPIs, task progress, and strategic objectives.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🎯 OKR Management</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Create objectives and track key results. Link tasks directly to objectives to ensure all work supports strategic goals. Set custom start/end dates and target numbers. Track progress with health status indicators.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">✅ Work Hub</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Manage tasks with full editing capabilities. Assign to executives or apprentices, set priorities, link to objectives, and track status. Filter by status or objective. See warnings for unlinked tasks to maintain strategic alignment.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">👥 Team Directory</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      View all workspace members with contact info, roles, and specializations. Assign tasks directly from profiles. See task performance metrics. Interactive org chart shows reporting structure.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🤖 AI Agents</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      36 AI agents organized by function (Finance, Sales, Marketing, Ops, Engineering, Admin, Design & Manufacturing). Track which team members use which AI agents. Includes specialized tools like Autodesk Fusion AI, Manufacturing GPT, Quality AI Inspector, 11x Alice, Jasper AI, and standard tools like ChatGPT, Midjourney, and GitHub Copilot. View agent websites and usage statistics. Total spend: £7,334/month.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🏭 Supplier Management</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Track supplier engagements with costs, timelines, and deliverables. View suppliers on an interactive map. Manage contact information and project tasks. Monitor total spend and payment status.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">🌐 Network</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Browse suppliers, companies, and events. Hire fractional executives and apprentices. Onboard AI agents. Connect with other hardware startups in the ecosystem.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">📅 Community Events</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Create and join networking events, workshops, and meetups. View event locations on interactive maps with markers. Invite specific team members to events and track who has joined. Support for in-person (with maps), virtual, and hybrid events.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">💰 Financial Dashboard</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Founders-only view with monthly revenue, gross profit, burn rate, and runway. Tap any metric for detailed breakdowns including BOM, People, AI, and Other costs. Set budget targets and track variance. Interactive scenario planning with sliders to model revenue increases and burn reductions.
                    </Text>
                  </View>

                  <View className="mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-1">📈 Reports</Text>
                    <Text className="text-gray-700 dark:text-slate-400 text-sm">
                      Generate and export weekly packs and board packs. Export OKRs and tasks to CSV. Professional summaries of progress, risks, and decisions.
                    </Text>
                  </View>
                </View>

                {/* Organizational Philosophy */}
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2">Decide • Evaluate • Do</Text>
                  <Text className="text-gray-700 dark:text-slate-300 leading-6 mb-2">
                    Centaur OS is built around a three-tier organizational model:
                  </Text>
                  <View className="ml-3">
                    <Text className="text-gray-700 dark:text-slate-300 mb-1">
                      <Text className="font-semibold">Founders (Decide):</Text> Set strategy, make key decisions, manage finances.
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300 mb-1">
                      <Text className="font-semibold">Fractional Execs (Evaluate):</Text> Review work, provide expertise, ensure quality.
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-300">
                      <Text className="font-semibold">Apprentices (Do):</Text> Execute tasks, learn from feedback, deliver results.
                    </Text>
                  </View>
                </View>

                {/* Version */}
                <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">Version 1.0.0</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">Built with Expo SDK 53 & React Native 0.76.7</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
