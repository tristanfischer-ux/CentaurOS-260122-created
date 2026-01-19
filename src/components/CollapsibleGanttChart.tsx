import { View, Text, Pressable, Dimensions } from 'react-native';
import { useState, useMemo } from 'react';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { ChevronUp, ChevronDown, Calendar, Clock, AlertTriangle } from 'lucide-react-native';
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

  // Count active tasks
  const activeTasks = useMemo(() =>
    workPlans.filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned'),
    [workPlans]
  );

  // Calculate heights
  const COLLAPSED_HEIGHT = 120; // Taller to show mini task preview
  const MAX_EXPANDED_HEIGHT = screenHeight * 0.5; // Max 50% of screen

  // Calculate content height based on number of tasks
  const HEADER_HEIGHT = 52; // Tab header
  const TASK_ROW_HEIGHT = 48; // Height per task row in Gantt chart
  const PADDING_BOTTOM = 20; // Bottom padding

  const contentHeight = HEADER_HEIGHT + (activeTasks.length * TASK_ROW_HEIGHT) + PADDING_BOTTOM;
  const EXPANDED_HEIGHT = Math.min(contentHeight, MAX_EXPANDED_HEIGHT);

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

  const activeTasksCount = activeTasks.length;

  // Get preview tasks for collapsed state
  const previewTasks = useMemo(() => {
    const inProgress = workPlans.filter(wp => wp.status === 'in-progress').slice(0, 2);
    const blocked = workPlans.filter(wp => wp.status === 'blocked').slice(0, 1);
    return { inProgress, blocked };
  }, [workPlans]);

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
        <View style={{ flex: 1 }}>
          <MiniGanttChart
            workPlans={workPlans}
            members={members}
            onTaskPress={onTaskPress}
          />
        </View>
      )}

      {/* Collapsed State - Mini Task Preview */}
      {!isExpanded && (
        <View className="flex-1 px-4 py-2">
          {previewTasks.inProgress.length > 0 || previewTasks.blocked.length > 0 ? (
            <View className="flex-row gap-2">
              {/* In Progress Tasks */}
              {previewTasks.inProgress.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => onTaskPress?.(task.id)}
                  className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 active:opacity-70"
                >
                  <View className="flex-row items-center gap-1 mb-1">
                    <Clock size={10} color="#3b82f6" />
                    <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                      IN PROGRESS
                    </Text>
                  </View>
                  <Text className="text-slate-900 dark:text-white text-xs font-medium" numberOfLines={1}>
                    {task.title}
                  </Text>
                </Pressable>
              ))}

              {/* Blocked Task */}
              {previewTasks.blocked.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => onTaskPress?.(task.id)}
                  className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 active:opacity-70"
                >
                  <View className="flex-row items-center gap-1 mb-1">
                    <AlertTriangle size={10} color="#ef4444" />
                    <Text className="text-red-600 dark:text-red-400 text-[10px] font-bold">
                      BLOCKED
                    </Text>
                  </View>
                  <Text className="text-slate-900 dark:text-white text-xs font-medium" numberOfLines={1}>
                    {task.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-slate-400 dark:text-slate-600 text-xs">
                No active tasks - tap to view timeline
              </Text>
            </View>
          )}

          {/* Drag indicator */}
          <View className="items-center mt-2">
            <View className="w-10 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
          </View>
        </View>
      )}
    </Animated.View>
  );
}
