import { View, Text, Pressable, ScrollView, Linking, Modal, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import {
  Clock,
  Target,
  AlertCircle,
  Calendar,
  ChevronRight,
  Play,
  AlertTriangle,
  Circle,
  Mail,
  Phone,
  Linkedin,
  Users,
  Cpu,
  Crown,
  Plus,
  UserPlus,
  LogOut,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  CalendarClock,
  UserMinus,
  UsersRound,
  TrendingUp,
  Zap,
  Briefcase,
  DollarSign,
  X,
  ChevronLeft,
} from 'lucide-react-native';
import { router } from 'expo-router';
import type { OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useSquadStore } from '@/lib/state/squad-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import { useAppStore } from '@/lib/state/app-store';
import { lightImpact, heavyImpact } from '@/lib/haptics';
import { cn } from '@/lib/cn';
import { getInitials, ROLE_COLORS } from './Avatar';
import { QuickAssignModal } from './QuickAssignModal';
import { CapacityIndicator } from './CapacityIndicator';
import type { Function as BusinessFunction } from '@/types';

type PersonViewState = 'compact' | 'medium' | 'full';

interface PersonCardNewProps {
  member: OrganizationMember;
  allMembers?: OrganizationMember[];
  onMemberChange?: (member: OrganizationMember) => void;
}

const ROLE_LABELS: Record<string, string> = {
  Founder: 'Founder',
  FractionalExec: 'Fractional Executive',
  Apprentice: 'Apprentice',
};

const BUSINESS_FUNCTIONS: BusinessFunction[] = ['Ops', 'Marketing', 'Sales', 'Finance', 'Engineering', 'Admin'];

export function PersonCardNew({ member, allMembers = [], onMemberChange }: PersonCardNewProps) {
  const [viewState, setViewState] = useState<PersonViewState>('compact');
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const deleteWorkPlan = useWorkPlanStore(s => s.deleteWorkPlan);
  const orgMembers = useOrganizationStore(s => s.members);
  const squadsFromSquadStore = useSquadStore(s => s.squads);
  const armorySquads = useArmoryStore(s => s.squads);
  const createSquad = useArmoryStore(s => s.createSquad);
  const assignApprentice = useArmoryStore(s => s.assignApprentice);
  const removeApprentice = useArmoryStore(s => s.removeApprentice);
  const deleteSquad = useArmoryStore(s => s.deleteSquad);
  const loadout = useArmoryStore(s => s.getLoadoutForMember(member.id));
  const aiAgents = useOrganizationStore(s => s.aiAgents);
  const currentMembership = useAppStore(s => s.currentMembership);
  const canManage = currentMembership?.role === 'Founder';

  // Task action states
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [taskToReassign, setTaskToReassign] = useState<WorkPlan | null>(null);

  // Squad management modal states
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [showJoinSquad, setShowJoinSquad] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadFunction, setNewSquadFunction] = useState<BusinessFunction>('Ops');

  // Quick assign modal state
  const [showQuickAssign, setShowQuickAssign] = useState(false);

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

  // Get utilization color
  const getUtilColor = () => {
    if (isOverAllocated) return { bg: '#ef4444', text: '#fff', dot: '#ef4444' };
    if (utilizationPercent >= 80) return { bg: '#f59e0b', text: '#fff', dot: '#f59e0b' };
    if (utilizationPercent >= 50) return { bg: '#10b981', text: '#fff', dot: '#10b981' };
    return { bg: '#3b82f6', text: '#fff', dot: '#3b82f6' };
  };

  const utilColor = getUtilColor();
  const roleColor = ROLE_COLORS[member.role] || '#8b5cf6';

  // Get reporting relationships
  const reportsToMember = useMemo(() => {
    if (!member?.reportsTo) return null;
    return orgMembers.find(m => m.id === member.reportsTo);
  }, [member, orgMembers]);

  const directReports = useMemo(() => {
    if (!member?.manages || member.manages.length === 0) return [];
    return orgMembers.filter(m => member.manages?.includes(m.id));
  }, [member, orgMembers]);

  // Get squads this member belongs to
  const memberSquads = useMemo(() => {
    const fromSquadStore = squadsFromSquadStore.filter(squad => squad.memberIds.includes(member.id));
    const fromArmoryStore = armorySquads.filter(squad =>
      squad.leaderMemberId === member.id ||
      squad.apprenticeMemberIds.includes(member.id)
    );
    const all = [...fromSquadStore, ...fromArmoryStore];
    const seen = new Set<string>();
    return all.filter(squad => {
      if (seen.has(squad.id)) return false;
      seen.add(squad.id);
      return true;
    });
  }, [member, squadsFromSquadStore, armorySquads]);

  const ledSquads = useMemo(() => {
    return armorySquads.filter(squad => squad.leaderMemberId === member.id);
  }, [armorySquads, member]);

  const availableSquads = useMemo(() => {
    return armorySquads.filter(squad =>
      squad.leaderMemberId !== member.id &&
      !squad.apprenticeMemberIds.includes(member.id) &&
      squad.workspaceId === member.workspaceId
    );
  }, [armorySquads, member]);

  // Get equipped AI tools
  const equippedTools = useMemo(() => {
    if (!loadout) return [];
    return loadout.aiToolIds
      .map(id => aiAgents.find(a => a.id === id))
      .filter((t): t is any => t !== undefined);
  }, [loadout, aiAgents]);

  // Task action handlers
  const handleCompleteTask = (taskId: string) => {
    heavyImpact();
    updateWorkPlan(taskId, { status: 'completed', progress: 100 });
    setExpandedTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    heavyImpact();
    deleteWorkPlan(taskId);
    setExpandedTaskId(null);
  };

  const handlePostponeTask = (taskId: string) => {
    lightImpact();
    const task = workPlans.find(t => t.id === taskId);
    if (task?.dueDate) {
      const newDueDate = new Date(task.dueDate);
      newDueDate.setDate(newDueDate.getDate() + 7);
      updateWorkPlan(taskId, { dueDate: newDueDate.toISOString().split('T')[0] });
    }
    setExpandedTaskId(null);
  };

  const handleUnassignFromTask = (taskId: string) => {
    lightImpact();
    const task = workPlans.find(t => t.id === taskId);
    if (task) {
      const newAllocations = task.allocations.filter(a => a.memberId !== member.id);
      updateWorkPlan(taskId, { allocations: newAllocations });
    }
    setExpandedTaskId(null);
  };

  const handleReassignTask = (task: WorkPlan, newMemberId: string) => {
    lightImpact();
    const newAllocations = task.allocations.map(a =>
      a.memberId === member.id ? { ...a, memberId: newMemberId } : a
    );
    updateWorkPlan(task.id, { allocations: newAllocations });
    setShowReassignModal(false);
    setTaskToReassign(null);
  };

  const handleCreateSquad = async () => {
    if (!newSquadName.trim()) return;

    await createSquad({
      workspaceId: member.workspaceId,
      name: newSquadName.trim(),
      function: newSquadFunction,
      leaderMemberId: member.id,
      apprenticeMemberIds: [],
    });

    setNewSquadName('');
    setShowCreateSquad(false);
  };

  const handleJoinSquad = async (squadId: string) => {
    await assignApprentice(squadId, member.id);
    setShowJoinSquad(false);
  };

  const handleLeaveSquad = async (squadId: string) => {
    await removeApprentice(squadId, member.id);
  };

  const handleDeleteSquad = async (squadId: string) => {
    await deleteSquad(squadId);
  };

  // Find current member index for navigation
  const currentIndex = useMemo(() => {
    if (allMembers.length === 0) return -1;
    return allMembers.findIndex(m => m.id === member.id);
  }, [member, allMembers]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allMembers.length - 1;

  const navigateToPrevious = () => {
    if (hasPrevious && onMemberChange) {
      lightImpact();
      onMemberChange(allMembers[currentIndex - 1]);
    }
  };

  const navigateToNext = () => {
    if (hasNext && onMemberChange) {
      lightImpact();
      onMemberChange(allMembers[currentIndex + 1]);
    }
  };

  const handlePress = () => {
    lightImpact();
    if (viewState === 'compact') {
      setViewState('medium');
    } else if (viewState === 'medium') {
      setViewState('full');
    } else {
      setViewState('compact');
    }
  };

  // Status icon helper
  const getStatusIcon = (status: string) => {
    if (status === 'in-progress') return <Play size={10} color="#3b82f6" fill="#3b82f6" />;
    if (status === 'blocked') return <AlertTriangle size={10} color="#ef4444" />;
    return <Circle size={10} color="#94a3b8" />;
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        className="bg-white dark:bg-slate-900 rounded-2xl mb-3 overflow-hidden active:opacity-90"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* ===== TIER 1: COMPACT ===== */}
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
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: roleColor + '20' }}
              >
                <Text className="text-xs font-semibold" style={{ color: roleColor }}>
                  {member.role === 'FractionalExec' ? 'Exec' : member.role}
                </Text>
              </View>
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                {member.function || 'General'}
              </Text>
            </View>
          </View>

          {/* Capacity Indicator */}
          <View className="items-end">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: utilColor.dot }}
              />
              <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                {available > 0 ? `${available} TU free` : isOverAllocated ? `Over by ${Math.abs(available)}` : 'At capacity'}
              </Text>
            </View>
            <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              <Text className="text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                {memberWorkload.tasks.length} task{memberWorkload.tasks.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {viewState === 'compact' && (
            <ChevronRight size={16} color="#94a3b8" style={{ marginLeft: 8 }} />
          )}
        </View>

        {/* ===== TIER 2: MEDIUM ===== */}
        {(viewState === 'medium' || viewState === 'full') && (
          <View className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
            {/* Capacity Bar */}
            <View className="mb-4">
              <CapacityIndicator
                allocated={memberWorkload.totalAllocated}
                total={memberWorkload.totalCapacity}
                size="small"
                variant="bar"
                showLabel={true}
                showPercentage={true}
              />
            </View>

            {/* Alert Badges */}
            {(memberWorkload.dueSoon.length > 0 || memberWorkload.blocked.length > 0 || available > 2) && (
              <View className="flex-row flex-wrap gap-2 mb-3">
                {memberWorkload.dueSoon.length > 0 && (
                  <View className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                    <Calendar size={10} color="#f59e0b" />
                    <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                      {memberWorkload.dueSoon.length} due this week
                    </Text>
                  </View>
                )}
                {memberWorkload.blocked.length > 0 && (
                  <View className="flex-row items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full border border-red-200 dark:border-red-800">
                    <AlertTriangle size={10} color="#ef4444" />
                    <Text className="text-red-700 dark:text-red-300 text-[10px] font-semibold">
                      {memberWorkload.blocked.length} blocked
                    </Text>
                  </View>
                )}
                {available > 2 && (
                  <View className="flex-row items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle size={10} color="#10b981" />
                    <Text className="text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                      Available for work
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Top 3 Current Tasks */}
            <View className="mb-3">
              <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-2">
                Current Focus ({memberWorkload.tasks.length > 0 ? Math.min(3, memberWorkload.tasks.length) : 0} of {memberWorkload.tasks.length})
              </Text>
              {memberWorkload.tasks.length > 0 ? (
                <View className="gap-2">
                  {memberWorkload.tasks.slice(0, 3).map(task => {
                    const allocation = task.allocations?.find(a => a.memberId === member.id);
                    const tuPerWeek = allocation?.squaresPerWeek || 0;

                    return (
                      <View
                        key={task.id}
                        className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5"
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
                          <Text className="text-slate-400 dark:text-slate-500 text-[10px]">
                            {task.progress}% • Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}
                          </Text>
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
                </View>
              ) : (
                <View className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 items-center">
                  <Text className="text-slate-400 dark:text-slate-500 text-xs">
                    No active tasks
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Stats Row */}
            <View className="flex-row items-center justify-around bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2">
              <View className="items-center">
                <Text className="text-slate-400 dark:text-slate-500 text-[10px]">Days/Week</Text>
                <Text className="text-slate-900 dark:text-white text-sm font-bold">
                  {member.daysPerWeek || 5}d
                </Text>
              </View>
              <View className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
              <View className="items-center">
                <Text className="text-slate-400 dark:text-slate-500 text-[10px]">Utilization</Text>
                <Text className="text-sm font-bold" style={{ color: utilColor.bg }}>
                  {utilizationPercent}%
                </Text>
              </View>
              <View className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
              <View className="items-center">
                <Text className="text-slate-400 dark:text-slate-500 text-[10px]">This Week</Text>
                <Text className="text-slate-900 dark:text-white text-sm font-bold">
                  {memberWorkload.totalAllocated} TU
                </Text>
              </View>
            </View>

            {viewState === 'medium' && (
              <Text className="text-slate-400 dark:text-slate-500 text-[10px] text-center mt-3">
                Tap again for full details
              </Text>
            )}
          </View>
        )}

        {/* ===== TIER 3: FULL ===== */}
        {viewState === 'full' && (
          <View className="border-t border-slate-100 dark:border-slate-800">
            {/* Navigation Controls (only in full view) */}
            {allMembers.length > 1 && (
              <View className="flex-row items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <Pressable
                  onPress={navigateToPrevious}
                  disabled={!hasPrevious}
                  className={cn(
                    "flex-row items-center gap-1 px-2 py-1 rounded-lg",
                    hasPrevious ? "active:opacity-70" : "opacity-30"
                  )}
                >
                  <ChevronLeft size={16} color="#3b82f6" />
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    Previous
                  </Text>
                </Pressable>
                <View className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
                    {currentIndex + 1}/{allMembers.length}
                  </Text>
                </View>
                <Pressable
                  onPress={navigateToNext}
                  disabled={!hasNext}
                  className={cn(
                    "flex-row items-center gap-1 px-2 py-1 rounded-lg",
                    hasNext ? "active:opacity-70" : "opacity-30"
                  )}
                >
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    Next
                  </Text>
                  <ChevronRight size={16} color="#3b82f6" />
                </Pressable>
              </View>
            )}

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={true}>
              <View className="p-4">
                {/* Bio */}
                {member.bio && (
                  <View className="mb-4">
                    <Text className="text-slate-900 dark:text-white font-bold text-sm mb-2">
                      About
                    </Text>
                    <Text className="text-slate-700 dark:text-slate-300 text-sm leading-5">
                      {member.bio}
                    </Text>
                  </View>
                )}

                {/* All Current Tasks - Interactive */}
                {memberWorkload.tasks.length > 0 && (
                  <View className="mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-slate-900 dark:text-white font-bold text-sm">
                        All Tasks ({memberWorkload.tasks.length})
                      </Text>
                      <Pressable
                        onPress={() => setShowQuickAssign(true)}
                        className="bg-blue-500 px-3 py-1.5 rounded-lg active:opacity-80"
                      >
                        <Text className="text-white text-xs font-bold">Assign Task</Text>
                      </Pressable>
                    </View>

                    <View className="gap-2">
                      {memberWorkload.tasks.map((task) => {
                        const allocation = task.allocations.find(a => a.memberId === member.id);
                        const tuPerWeek = allocation?.squaresPerWeek || 0;
                        const isExpanded = expandedTaskId === task.id;

                        const statusColors: Record<string, string> = {
                          'not-started': 'border-gray-300 dark:border-gray-700',
                          'in-progress': 'border-blue-400 dark:border-blue-600',
                          'blocked': 'border-red-400 dark:border-red-600',
                          'completed': 'border-emerald-400 dark:border-emerald-600',
                          'abandoned': 'border-gray-400 dark:border-gray-700',
                        };
                        const statusBgColors: Record<string, string> = {
                          'not-started': 'bg-gray-50 dark:bg-gray-900/20',
                          'in-progress': 'bg-blue-50 dark:bg-blue-900/20',
                          'blocked': 'bg-red-50 dark:bg-red-900/20',
                          'completed': 'bg-emerald-50 dark:bg-emerald-900/20',
                          'abandoned': 'bg-gray-50 dark:bg-gray-900/20',
                        };

                        return (
                          <Pressable
                            key={task.id}
                            onPress={() => {
                              lightImpact();
                              setExpandedTaskId(isExpanded ? null : task.id);
                            }}
                            className={`rounded-lg p-3 border-l-4 ${statusColors[task.status]} ${statusBgColors[task.status]} active:opacity-80`}
                          >
                              {/* Task Header */}
                              <View className="flex-row items-start justify-between">
                                <View className="flex-1 mr-2">
                                  <Text className="text-slate-900 dark:text-white font-semibold text-sm" numberOfLines={isExpanded ? undefined : 1}>
                                    {task.title}
                                  </Text>
                                  <View className="flex-row items-center gap-2 mt-1">
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                      {task.function}
                                    </Text>
                                    <Text className="text-slate-400 dark:text-slate-500 text-xs">•</Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                      {task.progress}%
                                    </Text>
                                    <Text className="text-slate-400 dark:text-slate-500 text-xs">•</Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                      Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}
                                    </Text>
                                  </View>
                                </View>
                                <View className="flex-row items-center gap-1">
                                  <View className="bg-purple-500/20 px-2 py-0.5 rounded-full">
                                    <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                                      {tuPerWeek} TU/wk
                                    </Text>
                                  </View>
                                  <MoreHorizontal size={16} color={isExpanded ? '#8b5cf6' : '#94a3b8'} />
                                </View>
                              </View>

                              {/* Progress bar */}
                              <View className="mt-2 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <View
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </View>

                              {/* Action Buttons */}
                              {isExpanded && (
                                <View className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                  <View className="flex-row flex-wrap gap-2">
                                    <Pressable
                                      onPress={() => handleCompleteTask(task.id)}
                                      className="flex-row items-center gap-1.5 bg-emerald-500 px-3 py-2 rounded-lg active:opacity-70"
                                    >
                                      <CheckCircle size={14} color="white" />
                                      <Text className="text-white text-xs font-bold">Complete</Text>
                                    </Pressable>

                                    <Pressable
                                      onPress={() => handlePostponeTask(task.id)}
                                      className="flex-row items-center gap-1.5 bg-amber-500 px-3 py-2 rounded-lg active:opacity-70"
                                    >
                                      <CalendarClock size={14} color="white" />
                                      <Text className="text-white text-xs font-bold">+1 Week</Text>
                                    </Pressable>

                                    <Pressable
                                      onPress={() => handleUnassignFromTask(task.id)}
                                      className="flex-row items-center gap-1.5 bg-blue-500 px-3 py-2 rounded-lg active:opacity-70"
                                    >
                                      <UserMinus size={14} color="white" />
                                      <Text className="text-white text-xs font-bold">Unassign</Text>
                                    </Pressable>

                                    <Pressable
                                      onPress={() => {
                                        setTaskToReassign(task);
                                        setShowReassignModal(true);
                                      }}
                                      className="flex-row items-center gap-1.5 bg-purple-500 px-3 py-2 rounded-lg active:opacity-70"
                                    >
                                      <Users size={14} color="white" />
                                      <Text className="text-white text-xs font-bold">Reassign</Text>
                                    </Pressable>

                                    <Pressable
                                      onPress={() => handleDeleteTask(task.id)}
                                      className="flex-row items-center gap-1.5 bg-red-500 px-3 py-2 rounded-lg active:opacity-70"
                                    >
                                      <XCircle size={14} color="white" />
                                      <Text className="text-white text-xs font-bold">Delete</Text>
                                    </Pressable>
                                  </View>

                                  {/* Navigation to Tasks Tab */}
                                  <Pressable
                                    onPress={() => {
                                      lightImpact();
                                      router.push('/(tabs)/tasks');
                                    }}
                                    className="mt-2 flex-row items-center justify-center gap-1 active:opacity-70"
                                  >
                                    <Text className="text-blue-500 text-xs font-semibold">View in Tasks</Text>
                                    <ChevronRight size={12} color="#3b82f6" />
                                  </Pressable>
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* What-If Capacity Calculator */}
                  <View className="mb-4">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Target size={14} color="#8b5cf6" />
                      <Text className="text-slate-900 dark:text-white font-bold text-sm">
                        What-If Calculator
                      </Text>
                    </View>

                    <View className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                      <Text className="text-purple-700 dark:text-purple-300 text-xs mb-3">
                        Impact of adding more work to {member.name.split(' ')[0]}
                      </Text>

                      <View className="gap-2">
                        {[2, 4, 6, 8].map((additionalTU) => {
                          const newAllocated = memberWorkload.totalAllocated + additionalTU;
                          const newUtilization = Math.round((newAllocated / memberWorkload.totalCapacity) * 100);
                          const isOverallocated = newAllocated > memberWorkload.totalCapacity;
                          const isNearCapacity = newUtilization > 80 && newUtilization <= 100;
                          const remaining = memberWorkload.totalCapacity - newAllocated;

                          const statusColor = isOverallocated
                            ? '#ef4444'
                            : isNearCapacity
                            ? '#f59e0b'
                            : '#10b981';

                          const statusBg = isOverallocated
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : isNearCapacity
                            ? 'bg-amber-50 dark:bg-amber-900/20'
                            : 'bg-emerald-50 dark:bg-emerald-900/20';

                          return (
                            <View
                              key={additionalTU}
                              className={`rounded-lg p-2.5 ${statusBg}`}
                            >
                              <View className="flex-row items-center justify-between mb-1">
                                <Text className="text-slate-900 dark:text-white font-semibold text-xs">
                                  +{additionalTU} TU/week
                                </Text>
                                <View className="flex-row items-center gap-2">
                                  <Text className="text-slate-600 dark:text-slate-400 text-xs">
                                    {newAllocated}/{memberWorkload.totalCapacity} TU
                                  </Text>
                                  <Text className="font-bold text-xs" style={{ color: statusColor }}>
                                    {newUtilization}%
                                  </Text>
                                </View>
                              </View>

                              {/* Mini progress bar */}
                              <View className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                                <View
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, newUtilization)}%`,
                                    backgroundColor: statusColor,
                                  }}
                                />
                              </View>

                              <Text className="text-[9px]" style={{ color: statusColor }}>
                                {isOverallocated
                                  ? `⚠️ Overallocated by ${Math.abs(remaining)} TU`
                                  : isNearCapacity
                                  ? `⚠️ ${remaining} TU remaining (near capacity)`
                                  : `✓ ${remaining} TU would remain available`}
                              </Text>
                            </View>
                          );
                        })}
                      </View>

                      <Text className="text-purple-600 dark:text-purple-400 text-[9px] mt-2 text-center">
                        Current: {memberWorkload.totalAllocated}/{memberWorkload.totalCapacity} TU ({utilizationPercent}%)
                      </Text>
                    </View>
                  </View>

                  {/* Company Details */}
                <View className="mb-4">
                  <Text className="text-slate-900 dark:text-white font-bold text-sm mb-2">
                    Company Details
                  </Text>

                  <View className="flex-row items-center mb-2">
                    <Calendar size={16} color="#64748b" />
                    <Text className="text-slate-700 dark:text-slate-300 text-sm ml-2">
                      Started: {new Date(member.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>

                  {member.costPerDay && (
                    <View className="flex-row items-center mb-2">
                      <DollarSign size={16} color="#64748b" />
                      <Text className="text-slate-700 dark:text-slate-300 text-sm ml-2">
                        Day Rate: £{member.costPerDay}
                      </Text>
                    </View>
                  )}

                  {member.daysPerWeek && (
                    <View className="flex-row items-center mb-2">
                      <Clock size={16} color="#64748b" />
                      <Text className="text-slate-700 dark:text-slate-300 text-sm ml-2">
                        Works {member.daysPerWeek} days/week
                      </Text>
                    </View>
                  )}

                  {reportsToMember && (
                    <View className="flex-row items-center mb-2">
                      <Briefcase size={16} color="#64748b" />
                      <Text className="text-slate-700 dark:text-slate-300 text-sm ml-2">
                        Reports to: {reportsToMember.name}
                      </Text>
                    </View>
                  )}

                  {directReports.length > 0 && (
                    <View className="flex-row items-start">
                      <Users size={16} color="#64748b" style={{ marginTop: 2 }} />
                      <View className="flex-1 ml-2">
                        <Text className="text-slate-700 dark:text-slate-300 text-sm">
                          Manages: {directReports.map(m => m.name).join(', ')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Performance Modifiers */}
                {(member.teamLeadershipMultiplier || member.collaborationMultiplier || member.aiProficiencyMultiplier) && (
                  <View className="mb-4">
                    <Text className="text-slate-900 dark:text-white font-bold text-sm mb-2">
                      Performance Modifiers
                    </Text>

                    {member.teamLeadershipMultiplier && (
                      <View className="flex-row items-center justify-between mb-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                        <View className="flex-row items-center flex-1">
                          <View className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-full items-center justify-center mr-3">
                            <UsersRound size={16} color="#8b5cf6" />
                          </View>
                          <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                            Team Leadership
                          </Text>
                        </View>
                        <Text className={`font-bold text-lg ${member.teamLeadershipMultiplier >= 1.0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {member.teamLeadershipMultiplier.toFixed(2)}x
                        </Text>
                      </View>
                    )}

                    {member.collaborationMultiplier && (
                      <View className="flex-row items-center justify-between mb-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <View className="flex-row items-center flex-1">
                          <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center mr-3">
                            <TrendingUp size={16} color="#3b82f6" />
                          </View>
                          <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                            Collaboration
                          </Text>
                        </View>
                        <Text className={`font-bold text-lg ${member.collaborationMultiplier >= 1.0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {member.collaborationMultiplier.toFixed(2)}x
                        </Text>
                      </View>
                    )}

                    {member.aiProficiencyMultiplier && (
                      <View className="flex-row items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                        <View className="flex-row items-center flex-1">
                          <View className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-full items-center justify-center mr-3">
                            <Zap size={16} color="#f59e0b" />
                          </View>
                          <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                            AI Proficiency
                          </Text>
                        </View>
                        <Text className={`font-bold text-lg ${member.aiProficiencyMultiplier >= 1.0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {member.aiProficiencyMultiplier.toFixed(2)}x
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* AI Tools */}
                <View className="mb-4">
                  <Text className="text-slate-900 dark:text-white font-bold text-sm mb-2">
                    AI Tools ({equippedTools.length})
                  </Text>
                  {equippedTools.length === 0 ? (
                    <View className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 items-center">
                      <Cpu size={24} color="#94a3b8" />
                      <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
                        No AI tools equipped
                      </Text>
                    </View>
                  ) : (
                    <View className="gap-2">
                      {equippedTools.map((tool) => (
                        <View
                          key={tool.id}
                          className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 flex-row items-center justify-between"
                        >
                          <View className="flex-1 mr-2">
                            <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                              {tool.name}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs" numberOfLines={1}>
                              {tool.purpose}
                            </Text>
                          </View>
                          <View className="bg-amber-500/20 px-2 py-1 rounded">
                            <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                              £{tool.costPerMonth}/mo
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Squads */}
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-slate-900 dark:text-white font-bold text-sm">
                      Squads ({memberSquads.length})
                    </Text>
                    <View className="flex-row gap-2">
                      {availableSquads.length > 0 && (
                        <Pressable
                          onPress={() => setShowJoinSquad(true)}
                          className="bg-purple-500/20 px-2 py-1 rounded-lg flex-row items-center gap-1 active:opacity-70"
                        >
                          <UserPlus size={12} color="#a855f7" />
                          <Text className="text-purple-500 dark:text-purple-400 text-xs font-bold">Join</Text>
                        </Pressable>
                      )}
                      {(member.role === 'Founder' || member.role === 'FractionalExec') && (
                        <Pressable
                          onPress={() => setShowCreateSquad(true)}
                          className="bg-blue-500 px-2 py-1 rounded-lg flex-row items-center gap-1 active:opacity-70"
                        >
                          <Plus size={12} color="white" />
                          <Text className="text-white text-xs font-bold">Create</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {memberSquads.length === 0 ? (
                    <View className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 items-center">
                      <Users size={24} color="#94a3b8" />
                      <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
                        Not in any squads yet
                      </Text>
                    </View>
                  ) : (
                    <View className="gap-2">
                      {memberSquads.map((squad) => {
                        const isLeader = 'leaderMemberId' in squad
                          ? squad.leaderMemberId === member.id
                          : false;
                        const squadMemberIds = 'memberIds' in squad
                          ? squad.memberIds
                          : [...(squad.apprenticeMemberIds || []), squad.leaderMemberId];
                        const squadMembers = orgMembers.filter(m =>
                          squadMemberIds.includes(m.id) && m.id !== member.id
                        );
                        const squadColor = 'color' in squad ? squad.color : undefined;
                        const squadType = 'type' in squad ? squad.type : undefined;

                        return (
                          <View
                            key={squad.id}
                            className="rounded-lg p-3"
                            style={{
                              backgroundColor: (squadColor || '#8b5cf6') + '15',
                              borderLeftWidth: 4,
                              borderLeftColor: squadColor || '#8b5cf6',
                            }}
                          >
                            <View className="flex-row items-center justify-between mb-2">
                              <View className="flex-row items-center gap-2 flex-1">
                                {isLeader && <Crown size={14} color="#f59e0b" />}
                                <Text className="text-slate-900 dark:text-white font-semibold text-sm flex-1" numberOfLines={1}>
                                  {squad.name}
                                </Text>
                              </View>
                            </View>

                            {squad.function && (
                              <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">
                                {squad.function}
                              </Text>
                            )}

                            {squadMembers.length > 0 && (
                              <View className="flex-row flex-wrap gap-1 mb-2">
                                {squadMembers.slice(0, 3).map(squadMember => (
                                  <View
                                    key={squadMember.id}
                                    className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full"
                                  >
                                    <Text className="text-slate-700 dark:text-slate-300 text-xs">
                                      {squadMember.name.split(' ')[0]}
                                    </Text>
                                  </View>
                                ))}
                                {squadMembers.length > 3 && (
                                  <View className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full">
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                      +{squadMembers.length - 3}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )}

                            <View className="flex-row gap-2 mt-1">
                              {isLeader && canManage && (
                                <Pressable
                                  onPress={() => handleDeleteSquad(squad.id)}
                                  className="bg-red-500/20 rounded-lg px-3 py-1.5 flex-row items-center gap-1 active:opacity-70"
                                >
                                  <Trash2 size={12} color="#ef4444" />
                                  <Text className="text-red-500 text-xs font-bold">Delete</Text>
                                </Pressable>
                              )}
                              {!isLeader && (
                                <Pressable
                                  onPress={() => handleLeaveSquad(squad.id)}
                                  className="bg-red-500/20 rounded-lg px-3 py-1.5 flex-row items-center gap-1 active:opacity-70"
                                >
                                  <LogOut size={12} color="#ef4444" />
                                  <Text className="text-red-500 text-xs font-bold">Leave</Text>
                                </Pressable>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Contact Info */}
                <View className="mb-4">
                  <Text className="text-slate-900 dark:text-white font-bold text-sm mb-2">
                    Contact Information
                  </Text>

                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${member.email}`)}
                    className="flex-row items-center mb-2 active:opacity-70"
                  >
                    <Mail size={16} color={roleColor} />
                    <Text className="text-slate-700 dark:text-slate-300 text-sm ml-2">
                      {member.email}
                    </Text>
                  </Pressable>

                  {member.phone && (
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${member.phone}`)}
                      className="flex-row items-center mb-2 active:opacity-70"
                    >
                      <Phone size={16} color={roleColor} />
                      <Text className="text-slate-700 dark:text-slate-300 text-sm ml-2">
                        {member.phone}
                      </Text>
                    </Pressable>
                  )}

                  {member.linkedIn && (
                    <Pressable
                      onPress={() => Linking.openURL(member.linkedIn!)}
                      className="flex-row items-center active:opacity-70"
                    >
                      <Linkedin size={16} color={roleColor} />
                      <Text className="text-blue-600 dark:text-blue-400 text-sm ml-2">
                        LinkedIn Profile
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </ScrollView>

            <Text className="text-slate-400 dark:text-slate-500 text-[10px] text-center py-3 border-t border-slate-100 dark:border-slate-800">
              Tap again to collapse
            </Text>
          </View>
        )}
      </Pressable>

      {/* Reassign Task Modal */}
      <Modal visible={showReassignModal} transparent animationType="fade" onRequestClose={() => setShowReassignModal(false)}>
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setShowReassignModal(false)}
        >
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <View className="bg-white dark:bg-slate-900 rounded-t-2xl p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-slate-900 dark:text-white text-xl font-bold">Reassign Task</Text>
                  <Pressable onPress={() => setShowReassignModal(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                    <X size={18} color="#64748b" />
                  </Pressable>
                </View>

                {taskToReassign && (
                  <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4">
                    <Text className="text-slate-900 dark:text-white font-semibold text-sm" numberOfLines={2}>
                      {taskToReassign.title}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                      {taskToReassign.function} • {taskToReassign.progress}% complete
                    </Text>
                  </View>
                )}

                <Text className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                  Select a team member to reassign this task to:
                </Text>

                <View className="gap-2">
                  {orgMembers
                    .filter(m => m.status === 'active' && m.id !== member.id)
                    .map((teamMember) => {
                      const teamMemberRoleColor = ROLE_COLORS[teamMember.role];
                      return (
                        <Pressable
                          key={teamMember.id}
                          onPress={() => taskToReassign && handleReassignTask(taskToReassign, teamMember.id)}
                          className="flex-row items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl active:opacity-70"
                        >
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: teamMemberRoleColor + '20' }}
                          >
                            <Text className="font-bold text-sm" style={{ color: teamMemberRoleColor }}>
                              {getInitials(teamMember.name)}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                              {teamMember.name}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs">
                              {teamMember.role === 'FractionalExec' ? 'Fractional Exec' : teamMember.role} • {teamMember.function}
                            </Text>
                          </View>
                          <ChevronRight size={18} color="#94a3b8" />
                        </Pressable>
                      );
                    })}
                </View>

                <Pressable
                  onPress={() => setShowReassignModal(false)}
                  className="mt-4 bg-slate-200 dark:bg-slate-700 rounded-xl py-3 active:opacity-70"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold text-center">Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Squad Modal */}
      <Modal visible={showCreateSquad} transparent animationType="fade" onRequestClose={() => setShowCreateSquad(false)}>
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setShowCreateSquad(false)}
        >
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <View className="bg-white dark:bg-slate-900 rounded-t-2xl p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-slate-900 dark:text-white text-xl font-bold">Create New Squad</Text>
                  <Pressable onPress={() => setShowCreateSquad(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                    <X size={18} color="#64748b" />
                  </Pressable>
                </View>

                <Text className="text-slate-500 dark:text-slate-400 text-sm mb-2">Squad Name</Text>
                <TextInput
                  value={newSquadName}
                  onChangeText={setNewSquadName}
                  placeholder="e.g., Alpha Team"
                  placeholderTextColor="#9ca3af"
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 mb-4"
                />

                <Text className="text-slate-500 dark:text-slate-400 text-sm mb-2">Function</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {BUSINESS_FUNCTIONS.map((func) => (
                    <Pressable
                      key={func}
                      onPress={() => setNewSquadFunction(func)}
                      className={cn(
                        'px-3 py-2 rounded-lg',
                        newSquadFunction === func ? 'bg-purple-500' : 'bg-slate-100 dark:bg-slate-800'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-sm font-semibold',
                          newSquadFunction === func ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                        )}
                      >
                        {func}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowCreateSquad(false)}
                    className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-xl py-3 active:opacity-70"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 font-semibold text-center">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateSquad}
                    className="flex-1 bg-blue-500 rounded-xl py-3 active:opacity-70"
                  >
                    <Text className="text-white font-semibold text-center">Create</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Join Squad Modal */}
      <Modal visible={showJoinSquad} transparent animationType="fade" onRequestClose={() => setShowJoinSquad(false)}>
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setShowJoinSquad(false)}
        >
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <View className="bg-white dark:bg-slate-900 rounded-t-2xl p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-slate-900 dark:text-white text-xl font-bold">Join a Squad</Text>
                  <Pressable onPress={() => setShowJoinSquad(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                    <X size={18} color="#64748b" />
                  </Pressable>
                </View>

                {availableSquads.length === 0 ? (
                  <View className="py-8 items-center">
                    <Users size={40} color="#94a3b8" />
                    <Text className="text-slate-500 dark:text-slate-400 text-center mt-3">No squads available to join</Text>
                  </View>
                ) : (
                  <View className="gap-2">
                    {availableSquads.map((squad) => {
                      const leader = orgMembers.find(m => m.id === squad.leaderMemberId);
                      return (
                        <Pressable
                          key={squad.id}
                          onPress={() => handleJoinSquad(squad.id)}
                          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 active:opacity-70"
                        >
                          <Text className="text-slate-900 dark:text-white font-bold text-base">{squad.name}</Text>
                          {leader && (
                            <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                              Led by {leader.name}
                            </Text>
                          )}
                          <View className="flex-row items-center gap-2 mt-2">
                            <View className="bg-purple-500/20 px-2 py-1 rounded">
                              <Text className="text-purple-500 text-xs font-bold">{squad.function}</Text>
                            </View>
                            <Text className="text-slate-400 dark:text-slate-500 text-xs">
                              {squad.apprenticeMemberIds.length} members
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Quick Assign Modal */}
      <QuickAssignModal
        visible={showQuickAssign}
        onClose={() => setShowQuickAssign(false)}
        member={member}
        currentCapacity={{
          allocated: memberWorkload.totalAllocated,
          total: memberWorkload.totalCapacity,
        }}
      />
    </>
  );
}
