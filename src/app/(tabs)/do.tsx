/**
 * Do Tab - REDIRECT to Tasks
 * This route is kept for backward compatibility only.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function DoRedirect() {
  useEffect(() => {
    router.replace('/(tabs)/tasks');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}
