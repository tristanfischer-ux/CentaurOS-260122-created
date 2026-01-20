/**
 * Task Display Demo Screen
 * Demonstrates the new standardized task card components
 *
 * This screen can be used to test and showcase the 3-tier task display system.
 * Remove or comment out once integrated into main app.
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskCardCompact, TaskCardMedium, TaskCardFull } from '@/components/tasks';
import type { WorkPlan } from '@/lib/state/work-plan-store';

// Mock task data for demonstration
const DEMO_TASK: WorkPlan = {
  id: 'demo-task-1',
  workspaceId: 'demo-workspace',
  title: 'Build authentication system',
  description: 'Implement user authentication with email/password and OAuth providers',
  function: 'Engineering',
  startDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
  status: 'in-progress',
  progress: 60,
  assignedBy: 'founder-1',
  needsSubmission: false,
  estimatedTimeUnits: 16,
  allocations: [
    {
      memberId: 'member-1',
      memberName: 'Sarah Chen',
      squaresPerWeek: 4,
      costPerSquare: 50,
    },
    {
      memberId: 'member-2',
      memberName: 'Mike Johnson',
      squaresPerWeek: 2,
      costPerSquare: 40,
    },
    {
      memberId: 'member-3',
      memberName: 'Emma Wilson',
      squaresPerWeek: 2,
      costPerSquare: 30,
    },
  ],
  appliedAITools: [],
  tusExpended: 10,
};

export default function TaskDisplayDemoScreen() {
  const insets = useSafeAreaInsets();
  const [showMedium, setShowMedium] = useState(false);
  const [showFull, setShowFull] = useState(false);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* Header */}
        <View>
          <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-2">
            Task Display System Demo
          </Text>
          <Text className="text-slate-600 dark:text-slate-400 text-sm">
            Standardized 3-tier task cards
          </Text>
        </View>

        {/* Tier 1: Compact */}
        <View className="gap-3">
          <Text className="text-slate-900 dark:text-white text-lg font-bold">
            Tier 1: Compact View
          </Text>
          <Text className="text-slate-600 dark:text-slate-400 text-xs">
            Single line for lists. Shows: status, title, avatars, effort timeline, progress.
          </Text>
          <TaskCardCompact
            task={DEMO_TASK}
            onPress={() => setShowMedium(true)}
          />
          <Text className="text-slate-500 dark:text-slate-500 text-[10px]">
            Format: "16 TU @ 8/wk = ~2w" (Total · Velocity · Timeline)
          </Text>
        </View>

        {/* Tier 2: Medium */}
        <View className="gap-3">
          <Text className="text-slate-900 dark:text-white text-lg font-bold">
            Tier 2: Medium View
          </Text>
          <Text className="text-slate-600 dark:text-slate-400 text-xs">
            Expanded card with quick actions. No coordination cost shown.
          </Text>
          <Pressable
            onPress={() => setShowMedium(true)}
            className="bg-blue-500 rounded-lg py-3 px-4 active:opacity-70"
          >
            <Text className="text-white text-sm font-bold text-center">
              Open Medium View Modal
            </Text>
          </Pressable>
        </View>

        {/* Tier 3: Full */}
        <View className="gap-3">
          <Text className="text-slate-900 dark:text-white text-lg font-bold">
            Tier 3: Full View
          </Text>
          <Text className="text-slate-600 dark:text-slate-400 text-xs">
            Complete editing with coordination cost breakdown and capacity warnings.
          </Text>
          <Pressable
            onPress={() => setShowFull(true)}
            className="bg-purple-500 rounded-lg py-3 px-4 active:opacity-70"
          >
            <Text className="text-white text-sm font-bold text-center">
              Open Full View Modal
            </Text>
          </Pressable>
        </View>

        {/* Coordination Cost Info */}
        <View className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 gap-2">
          <Text className="text-blue-900 dark:text-blue-100 text-sm font-bold">
            Coordination Cost Model
          </Text>
          <Text className="text-blue-800 dark:text-blue-200 text-xs">
            Based on Brooks' Law: communication overhead increases with team size
          </Text>
          <View className="gap-1 mt-2">
            <Text className="text-blue-700 dark:text-blue-300 text-[10px]">
              • 1 person: 0% overhead (100% efficient)
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-[10px]">
              • 2 people: 5% overhead (95% efficient)
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-[10px]">
              • 3 people: 10% overhead (90% efficient) ← Demo task
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-[10px]">
              • 4 people: 15% overhead (85% efficient)
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-[10px]">
              • 5+ people: 20% overhead (80% efficient)
            </Text>
          </View>
        </View>

        {/* Implementation Notes */}
        <View className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 gap-2">
          <Text className="text-slate-900 dark:text-white text-sm font-bold">
            Implementation Status
          </Text>
          <Text className="text-slate-700 dark:text-slate-300 text-xs">
            ✅ Task calculations utility created{'\n'}
            ✅ Reusable components created{'\n'}
            ✅ Tier 1 (Compact) completed{'\n'}
            ✅ Tier 2 (Medium) completed{'\n'}
            ✅ Tier 3 (Full) completed{'\n'}
            ⏳ Integration with main app pending
          </Text>
        </View>
      </ScrollView>

      {/* Medium View Modal */}
      <TaskCardMedium
        task={DEMO_TASK}
        visible={showMedium}
        onClose={() => setShowMedium(false)}
        onViewFullDetails={() => {
          setShowMedium(false);
          setShowFull(true);
        }}
        onUpdateStatus={(status) => console.log('Update status:', status)}
        onUpdateProgress={(progress) => console.log('Update progress:', progress)}
        onRescheduleDays={(days) => console.log('Reschedule days:', days)}
      />

      {/* Full View Modal */}
      <TaskCardFull
        task={DEMO_TASK}
        visible={showFull}
        onClose={() => setShowFull(false)}
        onSave={(updates) => {
          console.log('Save updates:', updates);
          setShowFull(false);
        }}
      />
    </View>
  );
}
