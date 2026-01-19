import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Home, Users, CheckSquare, Calendar, Store, Settings, Plus } from 'lucide-react-native';
import { View, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/lib/useColorScheme';
import { useIsAuthenticated, useCurrentWorkspace, useAppStore } from '@/lib/state/app-store';
import { useUIStore } from '@/lib/state/ui-store';

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
  const triggerNewTaskDrawer = useUIStore((s) => s.triggerNewTaskDrawer);
  const insets = useSafeAreaInsets();

  // Screen dimensions
  const screenWidth = Dimensions.get('window').width;

  // Calculate FAB position (centered in tab bar)
  const fabSize = 70;
  const fabBottom = insets.bottom + (60 - fabSize) / 2; // Center in visible tab bar area
  const fabLeft = (screenWidth - fabSize) / 2; // Horizontally centered

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

  // Handle FAB press - navigate to tasks and open drawer
  const handleFABPress = () => {
    // First trigger the drawer to open
    triggerNewTaskDrawer();
    // Then navigate to tasks tab
    router.push('/(tabs)/tasks');
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
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        headerStyle: {
          backgroundColor,
        },
        headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
      }}
    >
      {/* ========== VISIBLE TABS (6 + 1 button = 7 total) ========== */}

      {/* 1. Home - Summary Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Home} color={color} />,
        }}
      />

      {/* 2. People - Team Management */}
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Users} color={color} />,
        }}
      />

      {/* 3. Tasks - Task Management */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={CheckSquare} color={color} />,
        }}
      />

      {/* 4. CREATE BUTTON - Custom rendering */}
      <Tabs.Screen
        name="create-task"
        options={{
          title: '',
          headerShown: false,
          tabBarIcon: () => (
            <View
              style={{
                position: 'absolute',
                bottom: fabBottom,
                left: fabLeft,
                width: fabSize,
                height: fabSize,
                borderRadius: fabSize / 2,
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
                  width: fabSize,
                  height: fabSize,
                  borderRadius: fabSize / 2,
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
              onPress={handleFABPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            />
          ),
        }}
      />

      {/* 5. When - Timeline/Capacity */}
      <Tabs.Screen
        name="when"
        options={{
          title: 'When',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Calendar} color={color} />,
        }}
      />

      {/* 6. Marketplace - Discovery */}
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Market',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Store} color={color} />,
        }}
      />

      {/* 7. Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Settings} color={color} />,
        }}
      />

      {/* ========== HIDDEN TABS ========== */}

      {/* Resources - HIDDEN - Needs rebuild */}
      <Tabs.Screen
        name="resources"
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
  );
}
