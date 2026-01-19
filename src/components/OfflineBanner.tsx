/**
 * Offline Banner
 * Shows a banner when the app is offline or has pending AI jobs
 */

import { View, Text, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { WifiOff, CloudOff, RefreshCw, Check } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { useNetworkStatus, getSyncState, onSyncStateChange, syncNow, type SyncState } from '@/lib/offline';

interface OfflineBannerProps {
  showPendingJobs?: boolean;
}

export function OfflineBanner({ showPendingJobs = true }: OfflineBannerProps) {
  const { isOnline } = useNetworkStatus();
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const translateY = useSharedValue(-50);
  const opacity = useSharedValue(0);

  // Subscribe to sync state
  useEffect(() => {
    const unsubscribe = onSyncStateChange(setSyncState);
    return unsubscribe;
  }, []);

  // Animate banner visibility
  useEffect(() => {
    const shouldShow = !isOnline || (showPendingJobs && syncState.pendingCount > 0);

    if (shouldShow) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-50, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOnline, syncState.pendingCount, showPendingJobs]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleRefresh = async () => {
    if (isRefreshing || !isOnline) return;

    setIsRefreshing(true);
    try {
      await syncNow();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine banner state
  const isOffline = !isOnline;
  const hasPending = syncState.pendingCount > 0;
  const isSyncing = syncState.isSyncing;

  if (!isOffline && !hasPending) {
    return null;
  }

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        },
      ]}
    >
      <View
        className={`flex-row items-center justify-between px-4 py-2 ${
          isOffline ? 'bg-amber-500' : 'bg-blue-500'
        }`}
      >
        <View className="flex-row items-center flex-1">
          {isOffline ? (
            <>
              <WifiOff size={16} color="white" />
              <Text className="text-white text-sm font-medium ml-2">
                Offline mode
              </Text>
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw size={16} color="white" className="animate-spin" />
              <Text className="text-white text-sm font-medium ml-2">
                Syncing...
              </Text>
            </>
          ) : hasPending ? (
            <>
              <CloudOff size={16} color="white" />
              <Text className="text-white text-sm font-medium ml-2">
                {syncState.pendingCount} pending
              </Text>
            </>
          ) : null}
        </View>

        {isOnline && hasPending && !isSyncing && (
          <Pressable
            onPress={handleRefresh}
            className="bg-white/20 rounded-full px-3 py-1"
          >
            <Text className="text-white text-xs font-medium">Sync now</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * Pending AI indicator
 * Small indicator showing pending AI jobs count
 */
export function PendingAIIndicator() {
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());

  useEffect(() => {
    const unsubscribe = onSyncStateChange(setSyncState);
    return unsubscribe;
  }, []);

  if (syncState.pendingCount === 0) {
    return null;
  }

  return (
    <View className="flex-row items-center bg-blue-100 dark:bg-blue-900/30 rounded-full px-2 py-1">
      {syncState.isSyncing ? (
        <RefreshCw size={12} color="#3b82f6" />
      ) : (
        <CloudOff size={12} color="#3b82f6" />
      )}
      <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium ml-1">
        {syncState.pendingCount}
      </Text>
    </View>
  );
}
