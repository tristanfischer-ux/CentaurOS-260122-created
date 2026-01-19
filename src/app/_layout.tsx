import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useInitializeApp } from '@/lib/hooks/useInitializeApp';
import { WelcomeSplash } from '@/components/WelcomeSplash';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/ToastContainer';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/lib/ThemeContext';
import { OfflineBanner } from '@/components/OfflineBanner';
import {
  startNetworkMonitoring,
  stopNetworkMonitoring,
  initializeSyncManager,
  startAutoSync,
  stopAutoSync,
} from '@/lib/offline';

export const unstable_settings = {
  initialRouteName: 'sign-in',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const { isInitialized } = useInitializeApp();
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);
  const { theme, isOffWhite } = useTheme();

  // Theme-aware colors
  const getBackgroundColor = () => {
    if (theme === 'dark') return '#0f172a';
    if (isOffWhite) return '#fafaf9';
    return '#ffffff';
  };

  const getHeaderBackgroundColor = () => {
    if (theme === 'dark') return '#020617';
    if (isOffWhite) return '#fafaf9';
    return '#ffffff';
  };

  const getHeaderTintColor = () => {
    if (theme === 'dark') return '#ffffff';
    if (isOffWhite) return '#1c1917';
    return '#000000';
  };

  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
      // Show welcome splash after initialization
      setShowWelcomeSplash(true);
    }
  }, [isInitialized]);

  // Initialize offline module
  useEffect(() => {
    startNetworkMonitoring();
    initializeSyncManager();
    startAutoSync(30000); // Sync every 30 seconds when online

    return () => {
      stopNetworkMonitoring();
      stopAutoSync();
    };
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: getBackgroundColor() }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding-executive" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding-apprentice" options={{ headerShown: false }} />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="swipe" options={{ headerShown: false }} />
          <Stack.Screen
            name="utilization"
            options={{
              headerShown: true,
              title: 'Team Utilization',
              headerStyle: { backgroundColor: getHeaderBackgroundColor() },
              headerTintColor: getHeaderTintColor(),
            }}
          />
          <Stack.Screen
            name="reports"
            options={{
              headerShown: true,
              title: 'Reports',
              headerStyle: { backgroundColor: getHeaderBackgroundColor() },
              headerTintColor: getHeaderTintColor(),
            }}
          />
          <Stack.Screen
            name="org-diagram"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="kpi-details"
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: getHeaderBackgroundColor() },
              headerTintColor: getHeaderTintColor(),
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="learning"
            options={{
              headerShown: true,
              title: 'Learning & Development',
              headerStyle: { backgroundColor: getHeaderBackgroundColor() },
              headerTintColor: getHeaderTintColor(),
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="function-hub"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="marketplace"
            options={{
              headerShown: true,
              title: 'Marketplace',
              headerStyle: { backgroundColor: getHeaderBackgroundColor() },
              headerTintColor: getHeaderTintColor(),
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen name="guilds" options={{ headerShown: false }} />
          <Stack.Screen name="events" options={{ headerShown: false }} />
          <Stack.Screen name="invitations" options={{ headerShown: false }} />
          <Stack.Screen name="supplier-orders" options={{ headerShown: false }} />
          <Stack.Screen name="send-invitation" options={{ headerShown: false }} />
          <Stack.Screen name="engagements" options={{ headerShown: false }} />
          <Stack.Screen name="financial-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
          <Stack.Screen name="build-queue" options={{ headerShown: false }} />
          <Stack.Screen name="create-team" options={{ headerShown: false }} />
          <Stack.Screen name="okr-planner" options={{ headerShown: false }} />
          <Stack.Screen name="okr-queue" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="messages" options={{ headerShown: false }} />
          <Stack.Screen name="calendar" options={{ headerShown: false }} />
          <Stack.Screen name="startup-pack" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>

      {/* Welcome Splash Overlay */}
      {showWelcomeSplash && (
        <WelcomeSplash onComplete={() => setShowWelcomeSplash(false)} />
      )}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
              <RootLayoutNav colorScheme={colorScheme} />
              <ToastContainer />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </AppThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}