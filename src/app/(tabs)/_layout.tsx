import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Home, Lightbulb, PlayCircle, BarChart3, Factory, Users, Settings } from 'lucide-react-native';
import { useColorScheme, useIsOffWhite } from '@/lib/useColorScheme';
import { useIsAuthenticated, useCurrentWorkspace, useAppStore } from '@/lib/state/app-store';

// Tab navigation layout
function TabBarIcon(props: { Icon: any; color: string }) {
  const { Icon, color } = props;
  return <Icon size={24} color={color} strokeWidth={2} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isOffWhite = useIsOffWhite();
  const isAuthenticated = useIsAuthenticated();
  const currentWorkspace = useCurrentWorkspace();
  const workspaces = useAppStore((s) => s.workspaces);
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
    if (isAuthenticated && !currentWorkspace) {
      const firstWorkspace = Object.values(workspaces)[0];
      if (firstWorkspace) {
        setCurrentWorkspace(firstWorkspace.id);
      }
    }
  }, [isAuthenticated, currentWorkspace, workspaces]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
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
          headerTitle: currentWorkspace?.name || 'Centaur OS',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Home} color={color} />,
        }}
      />

      {/* Decide - Strategy/Founders (OKRs + Team Structure) */}
      <Tabs.Screen
        name="decide"
        options={{
          title: 'Decide',
          headerTitle: 'Decide',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Lightbulb} color={color} />,
        }}
      />

      {/* Do - Execution/Apprentices (Work/Tasks) */}
      <Tabs.Screen
        name="do"
        options={{
          title: 'Do',
          headerTitle: 'Do',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={PlayCircle} color={color} />,
        }}
      />

      {/* Evaluate - Review/Execs */}
      <Tabs.Screen
        name="evaluate"
        options={{
          title: 'Evaluate',
          headerTitle: 'Evaluate',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={BarChart3} color={color} />,
        }}
      />

      {/* Make - Manufacturing (Suppliers + AI) */}
      <Tabs.Screen
        name="make"
        options={{
          title: 'Make',
          headerTitle: 'Make',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Factory} color={color} />,
        }}
      />

      {/* Community - Events + Hiring */}
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          headerTitle: 'Community',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Users} color={color} />,
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Settings} color={color} />,
        }}
      />
    </Tabs>
  );
}
