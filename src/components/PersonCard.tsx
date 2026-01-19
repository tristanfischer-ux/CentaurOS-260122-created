import { View, Text, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { Clock, Target, AlertCircle, Calendar, Briefcase, Cpu, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import type { OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { lightImpact } from '@/lib/haptics';

type ViewState = 'collapsed' | 'expanded';

interface PersonCardProps {
  member: OrganizationMember;
  roleColor: string;
  onOpenModal: () => void;
}

// Get initials from name - first letter of first name + first letter of last name (uppercase)
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
  const armorySquads = useArmoryStore(s => s.squads);
  const loadout = useArmoryStore(s => s.getLoadoutForMember(member.id));
  const aiAgents = useOrganizationStore(s => s.aiAgents);

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
      ? 15  // 10 normal + 5 overtime (matching CollapsibleResourcePool and TeamCapacityDashboard)
      : (member.daysPerWeek || 2) * 2;

    // Calculate tasks by status
    const inProgress = tasks.filter(t => t.status === 'in-progress');
    const blocked = tasks.filter(t => t.status === 'blocked');
    const notStarted = tasks.filter(t => t.status === 'not-started');

    // Find tasks due soon (within 7 days)
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

  // Get member's squads
  const memberSquads = useMemo(() => {
    return armorySquads.filter(squad =>
      squad.leaderMemberId === member.id ||
      squad.apprenticeMemberIds.includes(member.id)
    );
  }, [armorySquads, member.id]);

  // Get equipped AI tools
  const equippedTools = useMemo(() => {
    if (!loadout) return [];
    return loadout.aiToolIds
      .map(id => aiAgents.find(a => a.id === id))
      .filter(Boolean);
  }, [loadout, aiAgents]);

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

  // Get utilization color and status
  const getUtilizationStyle = () => {
    if (utilizationPercent >= 100) {
      return { bgClass: 'bg-red-500/20', textClass: 'text-red-600 dark:text-red-400', status: 'Over' };
    } else if (utilizationPercent >= 80) {
      return { bgClass: 'bg-orange-500/20', textClass: 'text-orange-600 dark:text-orange-400', status: 'High' };
    } else if (utilizationPercent >= 50) {
      return { bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-600 dark:text-emerald-400', status: 'Good' };
    }
    return { bgClass: 'bg-blue-500/20', textClass: 'text-blue-600 dark:text-blue-400', status: 'Low' };
  };

  const utilStyle = getUtilizationStyle();

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 active:opacity-80"
    >
      {/* Compact View - Always Visible */}
      <View className="flex-row items-center">
        {/* Avatar with initials */}
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: roleColor + '20' }}
        >
          <Text
            className="text-lg font-bold"
            style={{ color: roleColor }}
          >
            {getInitials(member.name)}
          </Text>
        </View>

        {/* Name and function */}
        <View className="flex-1">
          <Text className="text-slate-900 dark:text-white font-semibold text-base" numberOfLines={1}>
            {member.name}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-slate-500 dark:text-slate-400 text-sm">
              {member.function}
            </Text>
            <View className="flex-row items-center gap-1">
              <Clock size={12} color="#64748b" />
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                {member.daysPerWeek || 5}d/wk
              </Text>
            </View>
          </View>
        </View>

        {/* Compact stats on right */}
        <View className="items-end gap-1">
          {/* TU Allocation */}
          <View className={`px-2 py-0.5 rounded-full flex-row items-center gap-1 ${utilStyle.bgClass}`}>
            <Text className={`text-xs font-bold ${utilStyle.textClass}`}>
              {memberWorkload.totalAllocated}/{memberWorkload.totalCapacity} TU
            </Text>
            {utilizationPercent >= 100 && <AlertCircle size={10} color="#ef4444" />}
          </View>
          {/* Task count */}
          <View className="flex-row items-center gap-1">
            <Target size={10} color="#64748b" />
            <Text className="text-slate-500 dark:text-slate-400 text-[10px]">
              {memberWorkload.tasks.length} task{memberWorkload.tasks.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Compact view - Quick info bar */}
      {viewState === 'collapsed' && (
        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <View className="flex-row items-center gap-3">
            {/* Capacity */}
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-purple-500" />
              <Text className="text-slate-600 dark:text-slate-400 text-[10px]">
                {memberWorkload.totalAllocated}/{memberWorkload.totalCapacity} TU
              </Text>
            </View>
            {/* Squads */}
            {memberSquads.length > 0 && (
              <View className="flex-row items-center gap-1">
                <Users size={10} color="#8b5cf6" />
                <Text className="text-slate-600 dark:text-slate-400 text-[10px]">
                  {memberSquads.length} squad{memberSquads.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {/* AI Tools */}
            {equippedTools.length > 0 && (
              <View className="flex-row items-center gap-1">
                <Cpu size={10} color="#f59e0b" />
                <Text className="text-slate-600 dark:text-slate-400 text-[10px]">
                  {equippedTools.length} tool{equippedTools.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-blue-500 text-[10px] font-medium">Tap for more</Text>
        </View>
      )}

      {/* Expanded View - Show More Details */}
      {viewState === 'expanded' && (
        <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          {/* Task Status Breakdown */}
          <View className="flex-row items-center gap-2 mb-3">
            {/* In Progress */}
            <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
              <Text className="text-slate-500 dark:text-slate-400 text-[9px] mb-0.5">In Progress</Text>
              <Text className="text-blue-600 dark:text-blue-400 text-base font-bold">
                {memberWorkload.inProgress.length}
              </Text>
            </View>
            {/* Blocked */}
            <View className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
              <Text className="text-slate-500 dark:text-slate-400 text-[9px] mb-0.5">Blocked</Text>
              <Text className="text-red-600 dark:text-red-400 text-base font-bold">
                {memberWorkload.blocked.length}
              </Text>
            </View>
            {/* Queued */}
            <View className="flex-1 bg-slate-50 dark:bg-slate-700 rounded-lg p-2">
              <Text className="text-slate-500 dark:text-slate-400 text-[9px] mb-0.5">Queued</Text>
              <Text className="text-slate-600 dark:text-slate-300 text-base font-bold">
                {memberWorkload.notStarted.length}
              </Text>
            </View>
          </View>

          {/* Workload metrics */}
          <View className="flex-row items-center gap-2 mb-3">
            {/* Total Capacity */}
            <View className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">Weekly Capacity</Text>
              <Text className="text-purple-600 dark:text-purple-400 text-sm font-bold">
                {memberWorkload.totalAllocated} / {memberWorkload.totalCapacity} TU
              </Text>
            </View>
            {/* Available TUs */}
            <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">Available</Text>
              <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                {Math.max(0, memberWorkload.totalCapacity - memberWorkload.totalAllocated)} TU
              </Text>
            </View>
          </View>

          {/* Due Soon Alert */}
          {memberWorkload.dueSoon.length > 0 && (
            <View className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 mb-3">
              <View className="flex-row items-center gap-1 mb-1">
                <Calendar size={12} color="#f59e0b" />
                <Text className="text-amber-700 dark:text-amber-300 text-xs font-semibold">
                  Due This Week ({memberWorkload.dueSoon.length})
                </Text>
              </View>
              <View className="gap-1">
                {memberWorkload.dueSoon.slice(0, 2).map(task => (
                  <Text key={task.id} className="text-amber-600 dark:text-amber-400 text-[10px]">
                    • {task.title}
                  </Text>
                ))}
                {memberWorkload.dueSoon.length > 2 && (
                  <Text className="text-amber-500 text-[9px]">
                    +{memberWorkload.dueSoon.length - 2} more
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Squads Section */}
          {memberSquads.length > 0 && (
            <View className="mb-3">
              <View className="flex-row items-center gap-1 mb-1.5">
                <Users size={12} color="#8b5cf6" />
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  Squads ({memberSquads.length})
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-1.5">
                {memberSquads.map(squad => (
                  <View
                    key={squad.id}
                    className="bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg"
                  >
                    <Text className="text-purple-700 dark:text-purple-300 text-[10px] font-medium">
                      {squad.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* AI Tools Section */}
          {equippedTools.length > 0 && (
            <View className="mb-3">
              <View className="flex-row items-center gap-1 mb-1.5">
                <Cpu size={12} color="#f59e0b" />
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  AI Tools ({equippedTools.length})
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-1.5">
                {equippedTools.slice(0, 4).map((tool: any) => (
                  <View
                    key={tool.id}
                    className="bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg"
                  >
                    <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                      {tool.name}
                    </Text>
                  </View>
                ))}
                {equippedTools.length > 4 && (
                  <View className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px]">
                      +{equippedTools.length - 4} more
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Current Tasks Summary */}
          <View className="mb-3">
            <View className="flex-row items-center gap-1 mb-1.5">
              <Target size={12} color="#3b82f6" />
              <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                Current Tasks ({memberWorkload.tasks.length})
              </Text>
            </View>
            {memberWorkload.tasks.length > 0 ? (
              <View className="gap-1.5">
                {memberWorkload.tasks.slice(0, 3).map(task => {
                  const allocation = task.allocations.find(a => a.memberId === member.id);
                  return (
                    <View
                      key={task.id}
                      className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2 py-1.5"
                    >
                      <View
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: task.status === 'in-progress' ? '#3b82f6' :
                                          task.status === 'blocked' ? '#ef4444' : '#94a3b8'
                        }}
                      />
                      <Text
                        className="text-slate-700 dark:text-slate-300 text-xs flex-1"
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-purple-500 text-[10px] font-medium">
                          {allocation?.squaresPerWeek || 0}□
                        </Text>
                        <Text className="text-slate-400 dark:text-slate-500 text-[10px]">
                          {task.progress}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
                {memberWorkload.tasks.length > 3 && (
                  <Text className="text-slate-400 dark:text-slate-500 text-xs text-center">
                    +{memberWorkload.tasks.length - 3} more tasks
                  </Text>
                )}
              </View>
            ) : (
              <View className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                <Text className="text-slate-400 dark:text-slate-500 text-xs text-center">
                  No active tasks assigned
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
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-lg active:opacity-70"
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
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 py-2 rounded-lg active:opacity-70"
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
    </Pressable>
  );
}
