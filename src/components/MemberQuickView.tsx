/**
 * Member Quick View Popover
 * Lightweight popover showing key member info when tapping avatars
 * Provides quick context without full navigation
 */

import { View, Text, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Target, TrendingUp } from 'lucide-react-native';
import type { OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useMemo } from 'react';
import { lightImpact } from '@/lib/haptics';
import { RoleAvatar, ROLE_COLORS } from './Avatar';

interface MemberQuickViewProps {
  visible: boolean;
  onClose: () => void;
  member: OrganizationMember | null;
}

export function MemberQuickView({ visible, onClose, member }: MemberQuickViewProps) {
  const router = useRouter();
  const workPlans = useWorkPlanStore(s => s.workPlans);

  const memberWorkload = useMemo(() => {
    if (!member) return { tasks: [], allocated: 0, total: 0, topTasks: [] };

    const tasks = workPlans.filter(wp =>
      wp.status !== 'completed' &&
      wp.status !== 'abandoned' &&
      wp.allocations?.some(a => a.memberId === member.id)
    );

    const totalAllocated = workPlans
      .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
      .reduce((sum, wp) => {
        const allocation = wp.allocations?.find(a => a.memberId === member.id);
        return sum + (allocation?.squaresPerWeek || 0);
      }, 0);

    const totalCapacity = member.role === 'Founder' || member.role === 'Apprentice'
      ? 15
      : (member.daysPerWeek || 2) * 2;

    const topTasks = tasks
      .sort((a, b) => {
        // Prioritize: in-progress > not-started > blocked
        const statusPriority: Record<string, number> = {
          'in-progress': 3,
          'not-started': 2,
          'blocked': 1,
        };
        return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
      })
      .slice(0, 2);

    return {
      tasks,
      allocated: totalAllocated,
      total: totalCapacity,
      topTasks,
    };
  }, [member, workPlans]);

  if (!member) return null;

  const utilizationPercent = memberWorkload.total > 0
    ? Math.round((memberWorkload.allocated / memberWorkload.total) * 100)
    : 0;

  const getUtilColor = () => {
    if (memberWorkload.allocated > memberWorkload.total) return '#ef4444'; // red
    if (utilizationPercent >= 85) return '#f59e0b'; // amber
    if (utilizationPercent >= 50) return '#10b981'; // green
    return '#3b82f6'; // blue
  };

  const utilColor = getUtilColor();
  const roleColor = ROLE_COLORS[member.role] || '#8b5cf6';

  const handleViewProfile = () => {
    lightImpact();
    onClose();
    router.push('/(tabs)/people');
  };

  const handleAssignTask = () => {
    lightImpact();
    onClose();
    // TODO: Open quick assign modal or navigate to tasks
    router.push('/(tabs)/tasks');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-center items-center p-4" onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl" style={{ width: 280 }}>
            {/* Header */}
            <View className="flex-row items-center mb-3">
              <RoleAvatar name={member.name} role={member.role} size="lg" />
              <View className="ml-3 flex-1">
                <Text className="font-bold text-base text-slate-900 dark:text-white">
                  {member.name}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {member.role === 'FractionalExec' ? 'Fractional Exec' : member.role} • {member.function || 'General'}
                </Text>
              </View>
            </View>

            {/* Capacity */}
            <View className="mb-3">
              <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                Capacity This Week
              </Text>
              <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, utilizationPercent)}%`,
                    backgroundColor: utilColor,
                  }}
                />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  {memberWorkload.allocated}/{memberWorkload.total} TU
                </Text>
                <Text className="text-xs font-semibold" style={{ color: utilColor }}>
                  {utilizationPercent}%
                </Text>
              </View>
            </View>

            {/* Current Focus */}
            {memberWorkload.topTasks.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  Current Focus
                </Text>
                {memberWorkload.topTasks.map(task => {
                  const statusColor = task.status === 'in-progress'
                    ? '#3b82f6'
                    : task.status === 'blocked'
                    ? '#ef4444'
                    : '#94a3b8';

                  return (
                    <View key={task.id} className="flex-row items-center mb-1.5">
                      <View
                        className="w-1.5 h-1.5 rounded-full mr-2"
                        style={{ backgroundColor: statusColor }}
                      />
                      <Text className="text-xs flex-1 text-slate-700 dark:text-slate-300" numberOfLines={1}>
                        {task.title}
                      </Text>
                    </View>
                  );
                })}
                {memberWorkload.tasks.length > 2 && (
                  <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    +{memberWorkload.tasks.length - 2} more task{memberWorkload.tasks.length - 2 !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            )}

            {memberWorkload.tasks.length === 0 && (
              <View className="mb-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 items-center">
                <Target size={20} color="#94a3b8" />
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  No active tasks
                </Text>
              </View>
            )}

            {/* Actions */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleViewProfile}
                className="flex-1 bg-blue-500 py-2.5 rounded-lg active:opacity-80"
              >
                <Text className="text-white text-xs font-bold text-center">
                  View Profile
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAssignTask}
                className="flex-1 bg-slate-200 dark:bg-slate-700 py-2.5 rounded-lg active:opacity-80"
              >
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-bold text-center">
                  Assign Task
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
