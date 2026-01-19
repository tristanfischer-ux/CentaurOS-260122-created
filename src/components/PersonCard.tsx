import { View, Text, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { Clock, Target, TrendingUp, AlertCircle, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import type { OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { lightImpact } from '@/lib/haptics';

type ViewState = 'collapsed' | 'expanded';

interface PersonCardProps {
  member: OrganizationMember;
  roleColor: string;
  onOpenModal: () => void;
}

export function PersonCard({ member, roleColor, onOpenModal }: PersonCardProps) {
  const [viewState, setViewState] = useState<ViewState>('collapsed');
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // Calculate member's workload
  const memberWorkload = useMemo(() => {
    const tasks = workPlans.filter(wp =>
      wp.status !== 'completed' &&
      wp.status !== 'abandoned' &&
      wp.assignedMemberIds?.includes(member.id)
    );

    const totalAllocated = workPlans
      .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
      .reduce((sum, wp) => {
        const allocation = wp.allocations.find(a => a.memberId === member.id);
        return sum + (allocation?.squaresPerWeek || 0);
      }, 0);

    const totalCapacity = member.role === 'Founder' || member.role === 'Apprentice'
      ? 10
      : (member.daysPerWeek || 2) * 2;

    return { tasks, totalAllocated, totalCapacity };
  }, [member, workPlans]);

  const utilizationPercent = memberWorkload.totalCapacity > 0
    ? Math.round((memberWorkload.totalAllocated / memberWorkload.totalCapacity) * 100)
    : 0;

  const handlePress = () => {
    lightImpact();
    if (viewState === 'collapsed') {
      setViewState('expanded');
    } else {
      // Expanded -> Full modal
      onOpenModal();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 active:opacity-80"
    >
      {/* Collapsed View - Always Visible */}
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: roleColor + '20' }}
        >
          <Text
            className="text-lg font-bold"
            style={{ color: roleColor }}
          >
            {member.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-slate-900 dark:text-white font-semibold text-base">
            {member.name}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm">
            {member.function}
          </Text>
        </View>
        <View className="items-end">
          <View className="flex-row items-center gap-1">
            <Clock size={14} color="#64748b" />
            <Text className="text-slate-500 dark:text-slate-400 text-sm">
              {member.daysPerWeek || 5}d/wk
            </Text>
          </View>
        </View>
      </View>

      {/* Expanded View - Show More Details */}
      {viewState === 'expanded' && (
        <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          {/* Utilization & Capacity */}
          <View className="flex-row items-center gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">Capacity</Text>
              <View className="flex-row items-center gap-1.5">
                <View className="bg-purple-500/20 px-2 py-0.5 rounded-full">
                  <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                    {memberWorkload.totalAllocated}□ / {memberWorkload.totalCapacity}□
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">Utilization</Text>
              <View className="flex-row items-center gap-1.5">
                <View
                  className={`px-2 py-0.5 rounded-full ${
                    utilizationPercent >= 100
                      ? 'bg-red-500/20'
                      : utilizationPercent >= 80
                      ? 'bg-orange-500/20'
                      : 'bg-emerald-500/20'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      utilizationPercent >= 100
                        ? 'text-red-600 dark:text-red-400'
                        : utilizationPercent >= 80
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {utilizationPercent}%
                  </Text>
                </View>
                {utilizationPercent >= 100 && (
                  <AlertCircle size={14} color="#ef4444" />
                )}
              </View>
            </View>
          </View>

          {/* Current Tasks Summary */}
          {memberWorkload.tasks.length > 0 ? (
            <View className="mb-3">
              <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1.5">
                Current Tasks ({memberWorkload.tasks.length})
              </Text>
              <View className="gap-1.5">
                {memberWorkload.tasks.slice(0, 3).map(task => (
                  <View
                    key={task.id}
                    className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2 py-1.5"
                  >
                    <View className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <Text
                      className="text-slate-700 dark:text-slate-300 text-xs flex-1"
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <Text className="text-slate-400 dark:text-slate-500 text-[10px]">
                      {task.progress}%
                    </Text>
                  </View>
                ))}
                {memberWorkload.tasks.length > 3 && (
                  <Text className="text-slate-400 dark:text-slate-500 text-xs text-center">
                    +{memberWorkload.tasks.length - 3} more tasks
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3">
              <Text className="text-slate-400 dark:text-slate-500 text-xs text-center">
                No active tasks
              </Text>
            </View>
          )}

          {/* Quick Actions */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                router.push('/(tabs)/tasks');
              }}
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-700 py-2 rounded-lg active:opacity-70"
            >
              <Target size={14} color="#3b82f6" />
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                View Tasks
              </Text>
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                router.push('/(tabs)/when');
              }}
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-700 py-2 rounded-lg active:opacity-70"
            >
              <Calendar size={14} color="#8b5cf6" />
              <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                View Schedule
              </Text>
            </Pressable>
          </View>

          {/* Tap hint */}
          <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-2">
            Tap again for full details
          </Text>
        </View>
      )}

      {/* Collapsed hint */}
      {viewState === 'collapsed' && (
        <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-2">
          Tap to expand
        </Text>
      )}
    </Pressable>
  );
}
