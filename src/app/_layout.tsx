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

  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
      // Show welcome splash after initialization
      setShowWelcomeSplash(true);
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding-executive" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding-apprentice" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="swipe" options={{ headerShown: false }} />
          <Stack.Screen
            name="utilization"
            options={{
              headerShown: true,
              title: 'Team Utilization',
              headerStyle: { backgroundColor: '#0f172a' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="reports"
            options={{
              headerShown: true,
              title: 'Reports',
              headerStyle: { backgroundColor: '#09090b' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="org-diagram"
            options={{
              headerShown: true,
              title: 'Organization Chart',
              headerStyle: { backgroundColor: '#020617' },
              headerTintColor: '#fff',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="kpi-details"
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: '#020617' },
              headerTintColor: '#fff',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="learning"
            options={{
              headerShown: true,
              title: 'Learning & Development',
              headerStyle: { backgroundColor: '#020617' },
              headerTintColor: '#fff',
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
              headerStyle: { backgroundColor: '#0f172a' },
              headerTintColor: '#fff',
              headerShadowVisible: false,
            }}
          />
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
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootLayoutNav colorScheme={colorScheme} />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}