/**
 * Condensed Objectives Component
 * Replaces horizontal scroll with compact list view
 * Shows all objectives at once without scrolling
 */

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Target, ChevronRight, CheckCircle2, AlertTriangle, Clock } from 'lucide-react-native';
import { useObjectivesStore } from '@/lib/state/objectives-store';

export function CondensedObjectivesSection() {
  const router = useRouter();
  const objectives = useObjectivesStore((s) => s.objectives);

  const activeObjectives = objectives
    .filter(obj => obj.status !== 'completed')
    .slice(0, 3); // Show max 3

  const completedCount = objectives.filter(obj => obj.status === 'completed').length;

  if (objectives.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return { icon: CheckCircle2, color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/30' };
      case 'at-risk':
        return { icon: AlertTriangle, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/30' };
      case 'behind':
        return { icon: AlertTriangle, color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/30' };
      default:
        return { icon: Clock, color: '#64748b', bg: 'bg-slate-50 dark:bg-slate-900' };
    }
  };

  return (
    <View>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            🎯 Q1 Objectives
          </Text>
          <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">
              {completedCount}/{objectives.length}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/tasks')}
          className="flex-row items-center gap-1"
        >
          <Text className="text-purple-600 dark:text-purple-400 text-sm font-semibold">View All</Text>
          <ChevronRight size={16} color="#8b5cf6" />
        </Pressable>
      </View>

      {/* Compact Objective List */}
      <View className="gap-2">
        {activeObjectives.map((objective) => {
          const statusConfig = getStatusIcon(objective.status);
          const StatusIcon = statusConfig.icon;

          return (
            <Pressable
              key={objective.id}
              onPress={() => router.push('/(tabs)/tasks')}
              className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 active:opacity-70"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-slate-900 dark:text-white font-semibold text-sm flex-1 mr-2" numberOfLines={1}>
                  {objective.title}
                </Text>
                <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded ${statusConfig.bg}`}>
                  <StatusIcon size={10} color={statusConfig.color} />
                  <Text className="text-xs font-medium" style={{ color: statusConfig.color }}>
                    {objective.status === 'on-track' ? 'On Track' : objective.status === 'at-risk' ? 'At Risk' : 'Behind'}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="flex-row items-center gap-2">
                <View className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className={`h-full ${
                      objective.status === 'on-track'
                        ? 'bg-emerald-500'
                        : objective.status === 'at-risk'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${objective.progress}%` }}
                  />
                </View>
                <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium w-10 text-right">
                  {objective.progress}%
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
