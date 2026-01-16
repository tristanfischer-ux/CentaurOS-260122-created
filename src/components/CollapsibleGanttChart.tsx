import { View, Text, Pressable, Dimensions } from 'react-native';
import { useState } from 'react';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { ChevronUp, ChevronDown, Calendar } from 'lucide-react-native';
import { MiniGanttChart } from './MiniGanttChart';
import { type WorkPlan } from '@/lib/state/work-plan-store';
import { type OrganizationMember } from '@/lib/organization-seed';

interface CollapsibleGanttChartProps {
  workPlans: WorkPlan[];
  members: OrganizationMember[];
  onTaskPress?: (taskId: string) => void;
}

export function CollapsibleGanttChart({ workPlans, members, onTaskPress }: CollapsibleGanttChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const screenHeight = Dimensions.get('window').height;

  // Calculate heights
  const COLLAPSED_HEIGHT = 52; // Just the tab
  const EXPANDED_HEIGHT = screenHeight * 0.5; // 50% of screen

  // Animated height
  const height = useSharedValue(COLLAPSED_HEIGHT);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(height.value, {
        damping: 20,
        stiffness: 90,
      }),
    };
  });

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    height.value = newExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
  };

  // Count active tasks
  const activeTasksCount = workPlans.filter(
    wp => wp.status !== 'completed' && wp.status !== 'abandoned'
  ).length;

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 2,
          borderTopColor: '#e5e7eb',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }
      ]}
      className="dark:bg-slate-900 dark:border-slate-700"
    >
      {/* Tab Header - Always Visible */}
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-800"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center">
            <Calendar size={18} color="#3b82f6" />
          </View>
          <View>
            <Text className="text-gray-900 dark:text-white text-sm font-bold">
              Task Timeline
            </Text>
            <Text className="text-gray-500 dark:text-slate-400 text-xs">
              {activeTasksCount} active task{activeTasksCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Expand/Collapse Indicator */}
        <View className="flex-row items-center gap-2">
          {!isExpanded && (
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-sm bg-blue-400" />
              <View className="w-2 h-2 rounded-sm bg-red-400" />
              <View className="w-2 h-2 rounded-sm bg-gray-300 dark:bg-gray-600" />
            </View>
          )}
          <View className="w-6 h-6 bg-gray-100 dark:bg-slate-800 rounded-full items-center justify-center">
            {isExpanded ? (
              <ChevronDown size={16} color="#6b7280" />
            ) : (
              <ChevronUp size={16} color="#6b7280" />
            )}
          </View>
        </View>
      </Pressable>

      {/* Gantt Chart Content - Only visible when expanded */}
      {isExpanded && (
        <View className="flex-1">
          <MiniGanttChart
            workPlans={workPlans}
            members={members}
            onTaskPress={onTaskPress}
          />
        </View>
      )}

      {/* Collapsed State Hint */}
      {!isExpanded && (
        <View className="absolute bottom-1 left-0 right-0 items-center">
          <View className="w-12 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
        </View>
      )}
    </Animated.View>
  );
}
