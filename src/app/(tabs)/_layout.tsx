import React, { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Home, Users, CheckSquare, Calendar, Wrench, Store, Settings, Plus } from 'lucide-react-native';
import { View, Pressable, Modal, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Type, Sparkles, X } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useIsAuthenticated, useCurrentWorkspace, useAppStore } from '@/lib/state/app-store';

/**
 * Tab Navigation Layout - 7-Tab Structure
 *
 * VISIBLE TABS (7):
 * 1. Home - Summary dashboard + entry points (Plan/Analytics drilldowns)
 * 2. People - Team roster, capacity, hiring pipeline
 * 3. Tasks - Task management (Doing/Queued/Blocked/Done)
 * 4. When - Timeline/capacity view (who doing what when)
 * 5. Resources - Current AI tools + active supplier engagements
 * 6. Marketplace - Discovery (people/suppliers/tools/advisors)
 * 7. Settings - Config/integrations
 *
 * HIDDEN TABS (legacy - redirected):
 * - who -> people (redirect)
 * - what -> tasks (redirect)
 * - why -> home (Plan/Strategy drilldown)
 * - tools -> resources (redirect)
 * - performance -> home (Analytics drilldown)
 * - decide, do, evaluate, make, community -> tasks or marketplace
 */

function TabBarIcon(props: { Icon: any; color: string }) {
  const { Icon, color } = props;
  return <Icon size={24} color={color} strokeWidth={2} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const currentUser = useAppStore((s) => s.currentUser);
  const isOffWhite = currentUser?.preferences?.themeMode === 'off-white';
  const isAuthenticated = useIsAuthenticated();
  const currentWorkspace = useCurrentWorkspace();
  const workspaces = useAppStore((s) => s.workspaces);
  const memberships = useAppStore((s) => s.memberships);
  const setCurrentWorkspace = useAppStore((s) => s.setCurrentWorkspace);
  const insets = useSafeAreaInsets();
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Determine background colors based on theme
  const backgroundColor = colorScheme === 'dark'
    ? '#0f172a'
    : isOffWhite
    ? '#fafaf9' // stone-50
    : '#ffffff';

  const borderColor = colorScheme === 'dark'
    ? '#1e293b'
    : isOffWhite
    ? '#e7e5e4' // stone-200
    : '#e2e8f0';

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/sign-in');
    }
  }, [isAuthenticated]);

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (isAuthenticated && !currentWorkspace && Object.keys(workspaces).length > 0 && Object.keys(memberships).length > 0) {
      const firstWorkspace = Object.values(workspaces)[0];
      if (firstWorkspace) {
        setCurrentWorkspace(firstWorkspace.id);
      }
    }
  }, [isAuthenticated, currentWorkspace, workspaces, memberships]);

  if (!isAuthenticated) {
    return null;
  }

  // Determine active/inactive colors based on theme
  const activeColor = '#3b82f6'; // Keep blue accent consistent
  const inactiveColor = colorScheme === 'dark'
    ? '#64748b'
    : isOffWhite
    ? '#78716c' // stone-500
    : '#9ca3af'; // gray-400

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor,
            borderTopColor: borderColor,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          headerStyle: {
            backgroundColor,
          },
          headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
        }}
      >
        {/* ========== VISIBLE TABS (5 + 1 button) ========== */}

        {/* 1. Home - Summary Dashboard */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon Icon={Home} color={color} />,
          }}
        />

        {/* 2. Tasks - Task Management */}
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon Icon={CheckSquare} color={color} />,
          }}
        />

        {/* 3. CREATE BUTTON - Custom rendering */}
        <Tabs.Screen
          name="create-task"
          options={{
            title: '',
            headerShown: false,
            tabBarIcon: () => (
              <View
                style={{
                  top: -20,
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.5,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 5,
                    borderColor: backgroundColor,
                  }}
                >
                  <Plus size={36} color="#ffffff" strokeWidth={3} />
                </LinearGradient>
              </View>
            ),
            tabBarButton: (props) => (
              <Pressable
                {...props}
                onPress={() => setShowTaskModal(true)}
                style={{ flex: 1 }}
              />
            ),
          }}
        />

        {/* 4. When - Timeline/Capacity */}
        <Tabs.Screen
          name="when"
          options={{
            title: 'When',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon Icon={Calendar} color={color} />,
          }}
        />

        {/* 5. Settings */}
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon Icon={Settings} color={color} />,
          }}
        />

        {/* ========== HIDDEN TABS ========== */}

        {/* People - HIDDEN for now */}
        <Tabs.Screen
          name="people"
          options={{ href: null }}
        />

        {/* 5. Resources - HIDDEN - Needs rebuild */}
        <Tabs.Screen
          name="resources"
          options={{ href: null }}
        />

        {/* 6. Marketplace - Discovery */}
        <Tabs.Screen
          name="marketplace"
          options={{ href: null }}
        />

      {/* ========== HIDDEN LEGACY TABS ========== */}
      {/*
        These tabs are hidden from the tab bar but kept for backward compatibility.
        They redirect to the new tab structure.
        See MIGRATION_NOTES.md for full mapping.
      */}

      {/* Legacy: who -> people */}
      <Tabs.Screen
        name="who"
        options={{ href: null }}
      />

      {/* Legacy: what -> tasks */}
      <Tabs.Screen
        name="what"
        options={{ href: null }}
      />

      {/* Legacy: why -> home (Plan/Strategy drilldown) */}
      <Tabs.Screen
        name="why"
        options={{ href: null }}
      />

      {/* Legacy: tools -> resources */}
      <Tabs.Screen
        name="tools"
        options={{ href: null }}
      />

      {/* Legacy: performance -> home (Analytics drilldown) */}
      <Tabs.Screen
        name="performance"
        options={{ href: null }}
      />

      {/* Legacy: decide -> tasks */}
      <Tabs.Screen
        name="decide"
        options={{ href: null }}
      />

      {/* Legacy: do -> tasks */}
      <Tabs.Screen
        name="do"
        options={{ href: null }}
      />

      {/* Legacy: evaluate -> tasks */}
      <Tabs.Screen
        name="evaluate"
        options={{ href: null }}
      />

      {/* Legacy: make -> resources */}
      <Tabs.Screen
        name="make"
        options={{ href: null }}
      />

      {/* Legacy: community -> marketplace */}
      <Tabs.Screen
        name="community"
        options={{ href: null }}
      />
    </Tabs>

    {/* Task Creation Modal */}
    <Modal
      visible={showTaskModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowTaskModal(false)}
    >
      <Pressable
        className="flex-1 bg-black/70"
        onPress={() => setShowTaskModal(false)}
      >
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '50%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="bg-white/20 p-2 rounded-full">
                    <Sparkles size={24} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-2xl font-bold">Create Task</Text>
                    <Text className="text-white/80 text-sm">Voice or text - your choice</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setShowTaskModal(false)}
                  className="bg-white/20 p-2 rounded-full active:opacity-70"
                >
                  <X size={24} color="white" />
                </Pressable>
              </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView className="px-6 py-6">
              {/* Instructions */}
              <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-4">
                <Text className="text-emerald-900 dark:text-emerald-100 font-semibold text-sm mb-2">
                  How to create a task:
                </Text>
                <View className="gap-2">
                  <View className="flex-row items-start gap-2">
                    <Text className="text-emerald-600 dark:text-emerald-400">•</Text>
                    <Text className="text-emerald-800 dark:text-emerald-200 text-sm flex-1">
                      Know what you should be saying - be clear and specific
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <Text className="text-emerald-600 dark:text-emerald-400">•</Text>
                    <Text className="text-emerald-800 dark:text-emerald-200 text-sm flex-1">
                      You can tap to type if you prefer typing over speaking
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <Text className="text-emerald-600 dark:text-emerald-400">•</Text>
                    <Text className="text-emerald-800 dark:text-emerald-200 text-sm flex-1">
                      All the information you want is in the typing space
                    </Text>
                  </View>
                  <View className="flex-row items-start gap-2">
                    <Text className="text-emerald-600 dark:text-emerald-400">•</Text>
                    <Text className="text-emerald-800 dark:text-emerald-200 text-sm flex-1">
                      Or use the speaker icon to record your voice
                    </Text>
                  </View>
                </View>
              </View>

              {/* Voice Input Option */}
              <Pressable
                onPress={() => {
                  setShowTaskModal(false);
                  router.push('/(tabs)/tasks');
                }}
                className="mb-3 active:opacity-90"
                style={{
                  shadowColor: '#8b5cf6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 20 }}
                >
                  <View className="flex-row items-center gap-4">
                    <View className="bg-white/20 p-3 rounded-full">
                      <Mic size={28} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold">Voice Input</Text>
                      <Text className="text-white/80 text-sm">Speak naturally</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Text Input Option */}
              <Pressable
                onPress={() => {
                  setShowTaskModal(false);
                  router.push('/(tabs)/tasks');
                }}
                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-5 active:opacity-90"
              >
                <View className="flex-row items-center gap-4">
                  <View className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full">
                    <Type size={28} color="#64748b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white text-lg font-bold">Text Input</Text>
                    <Text className="text-slate-600 dark:text-slate-400 text-sm">Type your task</Text>
                  </View>
                </View>
              </Pressable>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  </>
  );
}
