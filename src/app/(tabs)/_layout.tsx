import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Home, Target, Briefcase, CheckCircle, MessageSquare, Settings } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useIsAuthenticated, useCurrentWorkspace, useAppStore } from '@/lib/state/app-store';

function TabBarIcon(props: { Icon: any; color: string }) {
  const { Icon, color } = props;
  return <Icon size={24} color={color} strokeWidth={2} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useIsAuthenticated();
  const currentWorkspace = useCurrentWorkspace();
  const workspaces = useAppStore((s) => s.workspaces);
  const setCurrentWorkspace = useAppStore((s) => s.setCurrentWorkspace);

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
          backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff',
          borderTopColor: colorScheme === 'dark' ? '#1e293b' : '#e2e8f0',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff',
        },
        headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: currentWorkspace?.name || 'Centaur OS',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Home} color={color} />,
        }}
      />
      <Tabs.Screen
        name="okrs"
        options={{
          title: 'OKRs',
          headerTitle: 'Objectives & Key Results',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Target} color={color} />,
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: 'Work',
          headerTitle: 'Work Hub',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Briefcase} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: 'Reviews',
          headerTitle: 'Review Queue',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={CheckCircle} color={color} />,
        }}
      />
      <Tabs.Screen
        name="copilot"
        options={{
          title: 'Copilot',
          headerTitle: 'AI Copilot',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={MessageSquare} color={color} />,
        }}
      />
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
