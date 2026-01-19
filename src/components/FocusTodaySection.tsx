/**
 * Focus Today Section
 * AI-Powered Priority Task Surfacing for Mission Control
 * Now uses CompactTaskCard for consistency with Tasks tab
 */

import { View, Text, ScrollView } from 'react-native';
import { Sparkles, CheckCircle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { getFocusTodayTasks } from '@/lib/ai-priority-scoring';
import { LinearGradient } from 'expo-linear-gradient';
import { UnifiedTaskAllocationModal } from './UnifiedTaskAllocationModal';
import { CompactTaskCard } from './CompactTaskCard';

interface FocusTodaySectionProps {
  onTaskPress?: (taskId: string) => void;
}

export function FocusTodaySection({ onTaskPress }: FocusTodaySectionProps) {
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const members = useOrganizationStore(s => s.members);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const priorityTasks = useMemo(() => {
    return getFocusTodayTasks(workPlans, members, 5);
  }, [workPlans, members]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return workPlans.find(wp => wp.id === selectedTaskId) || null;
  }, [selectedTaskId, workPlans]);

  // Get assigned members for a task
  const getAssignedMembers = (task: typeof workPlans[0]) => {
    const memberIds = task.allocations?.map(a => a.memberId) || [];
    return members.filter(m => memberIds.includes(m.id));
  };

  const handleTaskPress = (taskId: string) => {
    // Just expand/collapse the card, don't open modal
    onTaskPress?.(taskId);
  };

  const handleFullDetailPress = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  if (priorityTasks.length === 0) {
    return (
      <View className="pb-2">
        <View className="flex-row items-center gap-2 mb-3 px-5">
          <Sparkles size={20} color="#8b5cf6" />
          <Text className="text-slate-900 dark:text-white font-bold text-lg">Focus Today</Text>
          <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
            <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold">AI</Text>
          </View>
        </View>

        <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800 mx-5">
          <View className="items-center">
            <CheckCircle size={48} color="#10b981" />
            <Text className="text-slate-900 dark:text-white font-bold text-lg mt-3 text-center">
              You're All Caught Up!
            </Text>
            <Text className="text-slate-600 dark:text-slate-400 text-center mt-2">
              Great work staying on top of things. No critical tasks need your attention right now.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="pb-2">
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 14,
          marginBottom: 12,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Sparkles size={24} color="white" />
            <View>
              <Text className="text-white font-bold text-lg">Focus Today</Text>
              <Text className="text-white/80 text-xs">AI-powered priority tasks</Text>
            </View>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white font-bold text-sm">{priorityTasks.length}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Info Banner */}
      <View className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-3 mx-5">
        <Text className="text-purple-700 dark:text-purple-300 text-xs leading-relaxed">
          <Text className="font-bold">Smart Priority:</Text> These tasks have the highest impact based on deadlines, team blockers, business goals, and resource availability.
        </Text>
      </View>

      {/* Priority Tasks - Using CompactTaskCard for consistency */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
      >
        {priorityTasks.map((priorityScore) => (
          <View key={priorityScore.task.id} style={{ width: 340, marginRight: 12 }}>
            {/* Priority Reason Badge */}
            <View className="bg-purple-50 dark:bg-purple-900/20 rounded-t-xl p-2 border-l-2 border-r-2 border-t-2 border-purple-300 dark:border-purple-700">
              <View className="flex-row items-center gap-1.5">
                <Sparkles size={12} color="#8b5cf6" />
                <Text className="text-purple-700 dark:text-purple-300 text-[10px] font-medium flex-1" numberOfLines={2}>
                  {priorityScore.reasoning}
                </Text>
              </View>
            </View>
            <CompactTaskCard
              task={priorityScore.task}
              assignedMembers={getAssignedMembers(priorityScore.task)}
              onPress={() => handleTaskPress(priorityScore.task.id)}
              onFullDetailPress={() => handleFullDetailPress(priorityScore.task.id)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Task Details Modal */}
      <UnifiedTaskAllocationModal
        visible={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        workPlan={selectedTask}
      />
    </View>
  );
}
