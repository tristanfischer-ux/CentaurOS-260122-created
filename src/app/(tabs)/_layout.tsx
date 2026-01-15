import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Home, Lightbulb, PlayCircle, BarChart3, Factory, Users, Settings } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useIsAuthenticated, useCurrentWorkspace, useAppStore } from '@/lib/state/app-store';

// Tab navigation layout
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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor,
        },
        headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
      }}
    >
      {/* Home - Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Home} color={color} />,
        }}
      />

      {/* Decide - Strategy/Founders (OKRs + Team Structure) */}
      <Tabs.Screen
        name="decide"
        options={{
          title: 'Decide',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Lightbulb} color={color} />,
        }}
      />

      {/* Do - Execution/Apprentices (Work/Tasks) */}
      <Tabs.Screen
        name="do"
        options={{
          title: 'Do',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={PlayCircle} color={color} />,
        }}
      />

      {/* Evaluate - Review/Execs */}
      <Tabs.Screen
        name="evaluate"
        options={{
          title: 'Evaluate',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={BarChart3} color={color} />,
        }}
      />

      {/* Make - Manufacturing (Suppliers + AI) */}
      <Tabs.Screen
        name="make"
        options={{
          title: 'Make',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Factory} color={color} />,
        }}
      />

      {/* Hub - Intelligence + Recommendations */}
      <Tabs.Screen
        name="hub"
        options={{
          title: 'Hub',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Users} color={color} />,
        }}
      />

      {/* Keep old community as backup */}
      <Tabs.Screen
        name="community"
        options={{
          href: null, // Hide from tabs
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Settings} color={color} />,
        }}
      />
    </Tabs>
  );
}
