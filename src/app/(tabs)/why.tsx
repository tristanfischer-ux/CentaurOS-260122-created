/**
 * Why Tab - REDIRECT to Home
 * This route is kept for backward compatibility only.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function WhyRedirect() {
  useEffect(() => {
    router.replace('/(tabs)/');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}
