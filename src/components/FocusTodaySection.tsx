/**
 * Focus Today Section
 * AI-Powered Priority Task Surfacing for Mission Control
 */

import { View, Text, Pressable, ScrollView } from 'react-native';
import { Sparkles, Zap, AlertTriangle, CheckCircle, Play, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { getFocusTodayTasks, type PriorityScore } from '@/lib/ai-priority-scoring';
import { LinearGradient } from 'expo-linear-gradient';
import { UnifiedTaskAllocationModal } from './UnifiedTaskAllocationModal';

interface FocusTodaySectionProps {
  onTaskPress?: (taskId: string) => void;
}

const PRIORITY_CONFIG = {
  critical: {
    bgColor: '#fef2f2',
    bgColorDark: '#7f1d1d',
    borderColor: '#ef4444',
    textColor: '#dc2626',
    badge: 'CRITICAL',
    icon: AlertTriangle,
  },
  high: {
    bgColor: '#fff7ed',
    bgColorDark: '#7c2d12',
    borderColor: '#f97316',
    textColor: '#ea580c',
    badge: 'HIGH',
    icon: Zap,
  },
  important: {
    bgColor: '#fefce8',
    bgColorDark: '#713f12',
    borderColor: '#eab308',
    textColor: '#ca8a04',
    badge: 'IMPORTANT',
    icon: Sparkles,
  },
  normal: {
    bgColor: '#f8fafc',
    bgColorDark: '#1e293b',
    borderColor: '#64748b',
    textColor: '#475569',
    badge: 'NORMAL',
    icon: CheckCircle,
  },
};

function PriorityTaskCard({ priorityScore, onPress }: { priorityScore: PriorityScore; onPress: () => void }) {
  const config = PRIORITY_CONFIG[priorityScore.level];
  const Icon = config.icon;

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 border-l-4 active:opacity-80"
      style={{ borderLeftColor: config.borderColor }}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-slate-900 dark:text-white font-bold text-base mb-1" numberOfLines={2}>
            {priorityScore.task.title}
          </Text>
          <View className="flex-row items-center gap-2 flex-wrap">
            <View
              className="px-2 py-0.5 rounded-full flex-row items-center gap-1"
              style={{ backgroundColor: config.bgColor }}
            >
              <Icon size={10} color={config.textColor} />
              <Text className="text-xs font-bold" style={{ color: config.textColor }}>
                {config.badge}
              </Text>
            </View>
            <View className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                {priorityScore.totalScore}/100
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* AI Reasoning */}
      <View className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3">
        <View className="flex-row items-start gap-2">
          <Sparkles size={14} color="#8b5cf6" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            {priorityScore.reasoning}
          </Text>
        </View>
      </View>

      {/* Score Breakdown */}
      <View className="flex-row items-center gap-2 mb-3 flex-wrap">
        {priorityScore.factors.deadlineUrgency > 0 && (
          <View className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
            <Text className="text-red-700 dark:text-red-300 text-xs">
              Deadline: {priorityScore.factors.deadlineUrgency}
            </Text>
          </View>
        )}
        {priorityScore.factors.blockingOthers > 0 && (
          <View className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
            <Text className="text-orange-700 dark:text-orange-300 text-xs">
              Blocking: {priorityScore.factors.blockingOthers}
            </Text>
          </View>
        )}
        {priorityScore.factors.businessImpact > 0 && (
          <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
            <Text className="text-blue-700 dark:text-blue-300 text-xs">
              Impact: {priorityScore.factors.businessImpact}
            </Text>
          </View>
        )}
        {priorityScore.factors.riskAndStatus > 0 && (
          <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
            <Text className="text-purple-700 dark:text-purple-300 text-xs">
              Risk: {priorityScore.factors.riskAndStatus}
            </Text>
          </View>
        )}
        {priorityScore.factors.resourceAvailability > 0 && (
          <View className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
            <Text className="text-green-700 dark:text-green-300 text-xs">
              Capacity: {priorityScore.factors.resourceAvailability}
            </Text>
          </View>
        )}
      </View>

      {/* Action Button */}
      <Pressable
        onPress={onPress}
        className="py-2.5 rounded-lg flex-row items-center justify-center gap-2"
        style={{ backgroundColor: config.borderColor }}
      >
        {priorityScore.actionType === 'unblock' && <AlertTriangle size={16} color="white" />}
        {priorityScore.actionType === 'assign' && <Users size={16} color="white" />}
        {priorityScore.actionType === 'start' && <Play size={16} color="white" />}
        {priorityScore.actionType === 'complete' && <CheckCircle size={16} color="white" />}
        <Text className="text-white font-semibold">{priorityScore.actionLabel}</Text>
      </Pressable>
    </Pressable>
  );
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

  const handleTaskPress = (taskId: string) => {
    setSelectedTaskId(taskId);
    onTaskPress?.(taskId);
  };

  if (priorityTasks.length === 0) {
    return (
      <View className="pt-2 pb-2">
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
    <View className="pt-2 pb-2">
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

      {/* Priority Tasks */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
      >
        {priorityTasks.map((priorityScore) => (
          <View key={priorityScore.task.id} style={{ width: 340, marginRight: 12 }}>
            <PriorityTaskCard
              priorityScore={priorityScore}
              onPress={() => handleTaskPress(priorityScore.task.id)}
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
