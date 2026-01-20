import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Home, Users, CheckSquare, Calendar, Store, Settings, Plus } from 'lucide-react-native';
import { View, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/lib/useColorScheme';
import { useIsAuthenticated, useCurrentWorkspace, useAppStore } from '@/lib/state/app-store';

/**
 * Tab Navigation Layout - 6-Tab Structure with center FAB
 *
 * VISIBLE TABS (6):
 * 1. Home - Summary dashboard
 * 2. People - Team roster, capacity
 * 3. Tasks - Task management
 * 4. When - Timeline/capacity view
 * 5. Marketplace - Discovery
 * 6. Settings - Config/integrations
 *
 * CENTER: Green FAB -> navigates to Tasks tab
 */

function TabBarIcon(props: { Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>; color: string }) {
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

  // Screen dimensions
  const screenWidth = Dimensions.get('window').width;

  // Calculate FAB position (centered in tab bar)
  const fabSize = 56;
  const fabBottom = insets.bottom + (60 - fabSize) / 2 + 2;
  const fabLeft = (screenWidth - fabSize) / 2;

  // Determine background colors based on theme
  const backgroundColor = colorScheme === 'dark'
    ? '#0f172a'
    : isOffWhite
    ? '#fafaf9'
    : '#ffffff';

  const borderColor = colorScheme === 'dark'
    ? '#1e293b'
    : isOffWhite
    ? '#e7e5e4'
    : '#e2e8f0';

  // Handle FAB press - navigate to tasks tab with openDrawer param
  const handleFABPress = () => {
    router.push({
      pathname: '/(tabs)/tasks',
      params: { openNewTaskDrawer: 'true' },
    });
  };

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
  }, [isAuthenticated, currentWorkspace, workspaces, memberships, setCurrentWorkspace]);

  if (!isAuthenticated) {
    return null;
  }

  // Determine active/inactive colors based on theme
  const activeColor = '#3b82f6';
  const inactiveColor = colorScheme === 'dark'
    ? '#64748b'
    : isOffWhite
    ? '#78716c'
    : '#9ca3af';

  // Calculate spacing - add gap around center for FAB
  const fabGap = 36; // Extra space on each side of center for FAB

  return (
    <View style={{ flex: 1 }}>
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
          tabBarLabelStyle: {
            fontSize: 10,
          },
        }}
      >
        {/* 1. Home - push left */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon Icon={Home} color={color} />,
            tabBarItemStyle: { marginRight: -4 },
          }}
        />

        {/* 2. People - push left */}
        <Tabs.Screen
          name="people"
          options={{
            title: 'People',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon Icon={Users} color={color} />,
            tabBarItemStyle: { marginRight: -4 },
          }}
        />

        {/* 3. Tasks - push left with extra margin before FAB */}
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon Icon={CheckSquare} color={color} />,
            tabBarItemStyle: { marginRight: fabGap },
          }}
        />

        {/* 4. When - push right with extra margin after FAB */}
        <Tabs.Screen
          name="when"
          options={{
            title: 'When',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon Icon={Calendar} color={color} />,
            tabBarItemStyle: { marginLeft: fabGap },
          }}
        />

        {/* 5. Marketplace - push right */}
        <Tabs.Screen
          name="marketplace"
          options={{
            title: 'Market',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon Icon={Store} color={color} />,
            tabBarItemStyle: { marginLeft: -4 },
          }}
        />

        {/* 6. Settings - push right */}
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon Icon={Settings} color={color} />,
            tabBarItemStyle: { marginLeft: -4 },
          }}
        />

        {/* ========== HIDDEN TABS ========== */}
        <Tabs.Screen name="create-task" options={{ href: null }} />
        <Tabs.Screen name="resources" options={{ href: null }} />
        <Tabs.Screen name="who" options={{ href: null }} />
        <Tabs.Screen name="what" options={{ href: null }} />
        <Tabs.Screen name="why" options={{ href: null }} />
        <Tabs.Screen name="tools" options={{ href: null }} />
        <Tabs.Screen name="performance" options={{ href: null }} />
        <Tabs.Screen name="decide" options={{ href: null }} />
        <Tabs.Screen name="do" options={{ href: null }} />
        <Tabs.Screen name="evaluate" options={{ href: null }} />
        <Tabs.Screen name="make" options={{ href: null }} />
        <Tabs.Screen name="community" options={{ href: null }} />
      </Tabs>

      {/* Green FAB - Absolutely positioned in center of tab bar */}
      <Pressable
        onPress={handleFABPress}
        style={{
          position: 'absolute',
          bottom: fabBottom,
          left: fabLeft,
          width: fabSize,
          height: fabSize,
          zIndex: 999,
          // Shadow for depth
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: backgroundColor,
          }}
        >
          <Plus size={28} color="#ffffff" strokeWidth={3} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
