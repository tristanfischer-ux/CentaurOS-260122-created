/**
 * RefreshableScrollView
 * ScrollView with pull-to-refresh and haptic feedback
 */

import { ScrollView, ScrollViewProps, RefreshControl } from 'react-native';
import { useState } from 'react';
import { mediumImpact } from '@/lib/haptics';

interface RefreshableScrollViewProps extends ScrollViewProps {
  /**
   * Callback when user pulls to refresh
   */
  onRefresh: () => Promise<void>;

  /**
   * Colors for the refresh indicator
   * @default ['#3b82f6']
   */
  refreshColors?: string[];
}

/**
 * ScrollView with built-in pull-to-refresh and haptic feedback
 *
 * @example
 * ```tsx
 * <RefreshableScrollView onRefresh={async () => {
 *   await fetchData();
 * }}>
 *   <YourContent />
 * </RefreshableScrollView>
 * ```
 */
export function RefreshableScrollView({
  onRefresh,
  refreshColors = ['#3b82f6'],
  children,
  ...props
}: RefreshableScrollViewProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await mediumImpact(); // Haptic feedback on refresh start
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={refreshColors[0]}
          colors={refreshColors}
        />
      }
    >
      {children}
    </ScrollView>
  );
}
