import { View, Text, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { Clock, Target, AlertCircle, Calendar, ChevronRight, Play, AlertTriangle, Circle } from 'lucide-react-native';
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

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export function PersonCard({ member, roleColor, onOpenModal }: PersonCardProps) {
  const [viewState, setViewState] = useState<ViewState>('collapsed');
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // Calculate member's workload
  const memberWorkload = useMemo(() => {
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

    const inProgress = tasks.filter(t => t.status === 'in-progress');
    const blocked = tasks.filter(t => t.status === 'blocked');
    const notStarted = tasks.filter(t => t.status === 'not-started');

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueSoon = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= now && dueDate <= weekFromNow;
    });

    return {
      tasks,
      totalAllocated,
      totalCapacity,
      inProgress,
      blocked,
      notStarted,
      dueSoon
    };
  }, [member, workPlans]);

  const utilizationPercent = memberWorkload.totalCapacity > 0
    ? Math.round((memberWorkload.totalAllocated / memberWorkload.totalCapacity) * 100)
    : 0;

  const available = Math.max(0, memberWorkload.totalCapacity - memberWorkload.totalAllocated);
  const isOverAllocated = memberWorkload.totalAllocated > memberWorkload.totalCapacity;

  const handlePress = () => {
    lightImpact();
    if (viewState === 'collapsed') {
      setViewState('expanded');
    } else {
      onOpenModal();
    }
  };

  // Get utilization color
  const getUtilColor = () => {
    if (isOverAllocated) return { bg: '#ef4444', text: '#fff' };
    if (utilizationPercent >= 80) return { bg: '#f59e0b', text: '#fff' };
    if (utilizationPercent >= 50) return { bg: '#10b981', text: '#fff' };
    return { bg: '#3b82f6', text: '#fff' };
  };

  const utilColor = getUtilColor();

  // Status icon helper
  const getStatusIcon = (status: string) => {
    if (status === 'in-progress') return <Play size={10} color="#3b82f6" fill="#3b82f6" />;
    if (status === 'blocked') return <AlertTriangle size={10} color="#ef4444" />;
    return <Circle size={10} color="#94a3b8" />;
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white dark:bg-slate-800 rounded-2xl mb-3 overflow-hidden active:opacity-90"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Header Row */}
      <View className="flex-row items-center p-4">
        {/* Avatar */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: roleColor }}
        >
          <Text className="text-white text-lg font-bold">
            {getInitials(member.name)}
          </Text>
        </View>

        {/* Name & Info */}
        <View className="flex-1 ml-3">
          <Text className="text-slate-900 dark:text-white font-semibold text-base" numberOfLines={1}>
            {member.name}
          </Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <Text className="text-slate-500 dark:text-slate-400 text-xs">
              {member.function || member.role}
            </Text>
            <View className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <Text className="text-slate-400 dark:text-slate-500 text-xs">
              {member.daysPerWeek || 5}d/wk
            </Text>
          </View>
        </View>

        {/* Capacity Badge */}
        <View className="items-end">
          <View
            className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
            style={{ backgroundColor: utilColor.bg }}
          >
            <Text className="text-xs font-bold" style={{ color: utilColor.text }}>
              {memberWorkload.totalAllocated}/{memberWorkload.totalCapacity} TU
            </Text>
          </View>
          <Text className="text-slate-400 dark:text-slate-500 text-[10px] mt-1">
            {memberWorkload.tasks.length} task{memberWorkload.tasks.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Collapsed Quick Stats */}
      {viewState === 'collapsed' && (
        <View className="flex-row items-center justify-between px-4 pb-3">
          {/* Status Pills */}
          <View className="flex-row items-center gap-2">
            {memberWorkload.inProgress.length > 0 && (
              <View className="flex-row items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                <Play size={10} color="#3b82f6" fill="#3b82f6" />
                <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                  {memberWorkload.inProgress.length}
                </Text>
              </View>
            )}
            {memberWorkload.blocked.length > 0 && (
              <View className="flex-row items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                <AlertTriangle size={10} color="#ef4444" />
                <Text className="text-red-600 dark:text-red-400 text-[10px] font-semibold">
                  {memberWorkload.blocked.length}
                </Text>
              </View>
            )}
            {memberWorkload.notStarted.length > 0 && (
              <View className="flex-row items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                <Circle size={10} color="#64748b" />
                <Text className="text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                  {memberWorkload.notStarted.length}
                </Text>
              </View>
            )}
            {available > 0 && (
              <View className="flex-row items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                  {available} TU free
                </Text>
              </View>
            )}
          </View>
          <ChevronRight size={16} color="#94a3b8" />
        </View>
      )}

      {/* Expanded View */}
      {viewState === 'expanded' && (
        <View className="px-4 pb-4">
          {/* Capacity Bar */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                Weekly Capacity
              </Text>
              <Text className="text-slate-900 dark:text-white text-[11px] font-bold">
                {available > 0 ? `${available} TU available` : isOverAllocated ? `${Math.abs(available)} TU over` : 'At capacity'}
              </Text>
            </View>
            <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, utilizationPercent)}%`,
                  backgroundColor: utilColor.bg,
                }}
              />
            </View>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-slate-400 dark:text-slate-500 text-[10px]">
                0 TU
              </Text>
              <Text className="text-slate-400 dark:text-slate-500 text-[10px]">
                {memberWorkload.totalCapacity} TU
              </Text>
            </View>
          </View>

          {/* Due This Week Alert */}
          {memberWorkload.dueSoon.length > 0 && (
            <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-3 border-l-4 border-amber-400">
              <View className="flex-row items-center gap-2 mb-2">
                <Calendar size={14} color="#f59e0b" />
                <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold">
                  Due This Week
                </Text>
              </View>
              {memberWorkload.dueSoon.slice(0, 3).map(task => (
                <Text key={task.id} className="text-amber-600 dark:text-amber-400 text-xs mb-0.5" numberOfLines={1}>
                  • {task.title}
                </Text>
              ))}
              {memberWorkload.dueSoon.length > 3 && (
                <Text className="text-amber-500 text-[10px] mt-1">
                  +{memberWorkload.dueSoon.length - 3} more
                </Text>
              )}
            </View>
          )}

          {/* Task List */}
          <View className="mb-3">
            <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-2">
              Current Tasks ({memberWorkload.tasks.length})
            </Text>
            {memberWorkload.tasks.length > 0 ? (
              <View className="gap-2">
                {memberWorkload.tasks.slice(0, 5).map(task => {
                  const allocation = task.allocations?.find(a => a.memberId === member.id);
                  const tuPerWeek = allocation?.squaresPerWeek || 0;

                  return (
                    <View
                      key={task.id}
                      className="flex-row items-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5"
                    >
                      {/* Status */}
                      <View className="mr-2">
                        {getStatusIcon(task.status)}
                      </View>

                      {/* Task Info */}
                      <View className="flex-1 mr-2">
                        <Text className="text-slate-800 dark:text-slate-200 text-xs font-medium" numberOfLines={1}>
                          {task.title}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-0.5">
                          <Text className="text-slate-400 dark:text-slate-500 text-[10px]">
                            {task.progress}% done
                          </Text>
                          {task.dueDate && (
                            <>
                              <View className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                              <Text className="text-slate-400 dark:text-slate-500 text-[10px]">
                                Due {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>

                      {/* TU Badge */}
                      <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-lg">
                        <Text className="text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                          {tuPerWeek} TU
                        </Text>
                      </View>
                    </View>
                  );
                })}
                {memberWorkload.tasks.length > 5 && (
                  <Text className="text-slate-400 dark:text-slate-500 text-[10px] text-center mt-1">
                    +{memberWorkload.tasks.length - 5} more tasks
                  </Text>
                )}
              </View>
            ) : (
              <View className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 items-center">
                <Text className="text-slate-400 dark:text-slate-500 text-xs">
                  No active tasks
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                router.push('/(tabs)/tasks');
              }}
              className="flex-1 bg-blue-500 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5 active:opacity-80"
            >
              <Target size={14} color="#fff" />
              <Text className="text-white text-xs font-semibold">View Tasks</Text>
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                router.push('/(tabs)/when');
              }}
              className="flex-1 bg-purple-500 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5 active:opacity-80"
            >
              <Calendar size={14} color="#fff" />
              <Text className="text-white text-xs font-semibold">Schedule</Text>
            </Pressable>
          </View>

          {/* Tap hint */}
          <Text className="text-slate-400 dark:text-slate-500 text-[10px] text-center mt-3">
            Tap again for full details
          </Text>
        </View>
      )}
    </Pressable>
  );
}
