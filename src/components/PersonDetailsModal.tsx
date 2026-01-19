import { View, Text, Modal, Pressable, ScrollView, Linking, TextInput, Dimensions } from 'react-native';
import { useState, useMemo, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import {
  X,
  Mail,
  Phone,
  Linkedin,
  Calendar,
  DollarSign,
  Briefcase,
  Users,
  Clock,
  TrendingUp,
  Zap,
  UsersRound,
  Plus,
  UserPlus,
  LogOut,
  Crown,
  Trash2,
  Cpu,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  CalendarClock,
  UserMinus,
  MoreHorizontal,
} from 'lucide-react-native';
import { type OrganizationMember, type AIAgent } from '@/lib/organization-seed';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useSquadStore, type Squad as SquadStoreSquad } from '@/lib/state/squad-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import { useAppStore } from '@/lib/state/app-store';
import { cn } from '@/lib/cn';
import type { Squad as ArmorySquad, Function as BusinessFunction } from '@/types';
import { lightImpact, heavyImpact } from '@/lib/haptics';
import { MiniGanttChart } from './MiniGanttChart';

// Combined squad type for display
type CombinedSquad = SquadStoreSquad | ArmorySquad;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PersonDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  member: OrganizationMember | null;
  allMembers?: OrganizationMember[]; // NEW: Array of all members for swiping
  onMemberChange?: (member: OrganizationMember) => void; // NEW: Callback when member changes via swipe
}

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

const ROLE_LABELS: Record<string, string> = {
  Founder: 'Founder',
  FractionalExec: 'Fractional Executive',
  Apprentice: 'Apprentice',
};

const BUSINESS_FUNCTIONS: BusinessFunction[] = ['Ops', 'Marketing', 'Sales', 'Finance', 'Engineering', 'Admin'];

export function PersonDetailsModal({
  visible,
  onClose,
  member,
  allMembers: allMembersProp = [],
  onMemberChange
}: PersonDetailsModalProps) {
  // Swipe state
  const translateX = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Find current member index
  const currentIndex = useMemo(() => {
    if (!member || allMembersProp.length === 0) return -1;
    return allMembersProp.findIndex(m => m.id === member.id);
  }, [member, allMembersProp]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allMembersProp.length - 1;

  // Navigate to previous/next member
  const navigateToPrevious = () => {
    if (hasPrevious && onMemberChange) {
      lightImpact();
      onMemberChange(allMembersProp[currentIndex - 1]);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const navigateToNext = () => {
    if (hasNext && onMemberChange) {
      lightImpact();
      onMemberChange(allMembersProp[currentIndex + 1]);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  // Gesture handler for horizontal swipe
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const threshold = SCREEN_WIDTH * 0.3;

      if (e.translationX > threshold && hasPrevious) {
        runOnJS(navigateToPrevious)();
      } else if (e.translationX < -threshold && hasNext) {
        runOnJS(navigateToNext)();
      }

      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const workPlans = useWorkPlanStore(s => s.workPlans);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const deleteWorkPlan = useWorkPlanStore(s => s.deleteWorkPlan);
  const allMembers = useOrganizationStore(s => s.members);
  const squadsFromSquadStore = useSquadStore(s => s.squads);

  // Task action states
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [taskToReassign, setTaskToReassign] = useState<WorkPlan | null>(null);

  // Armory store for squad management and AI tools
  const armorySquads = useArmoryStore(s => s.squads);
  const createSquad = useArmoryStore(s => s.createSquad);
  const assignApprentice = useArmoryStore(s => s.assignApprentice);
  const removeApprentice = useArmoryStore(s => s.removeApprentice);
  const deleteSquad = useArmoryStore(s => s.deleteSquad);
  const loadout = useArmoryStore(s => member ? s.getLoadoutForMember(member.id) : undefined);
  const aiAgents = useOrganizationStore(s => s.aiAgents);

  // Get current user permissions
  const currentMembership = useAppStore(s => s.currentMembership);
  const canManage = currentMembership?.role === 'Founder';

  // Squad management modal states
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [showJoinSquad, setShowJoinSquad] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadFunction, setNewSquadFunction] = useState<BusinessFunction>('Ops');

  // Calculate member's current workload and tasks
  const memberWorkload = useMemo(() => {
    if (!member) return { tasks: [], totalAllocated: 0, totalCapacity: 0 };

    // Check allocations array for tasks assigned to this member (not assignedMemberIds)
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
      ? 15  // 10 normal + 5 overtime
      : (member.daysPerWeek || 2) * 2;

    return { tasks, totalAllocated, totalCapacity };
  }, [member, workPlans]);

  // Get reporting relationships
  const reportsToMember = useMemo(() => {
    if (!member?.reportsTo) return null;
    return allMembers.find(m => m.id === member.reportsTo);
  }, [member, allMembers]);

  const directReports = useMemo(() => {
    if (!member?.manages || member.manages.length === 0) return [];
    return allMembers.filter(m => member.manages?.includes(m.id));
  }, [member, allMembers]);

  // Get squads this member belongs to (from both stores)
  const memberSquads = useMemo(() => {
    if (!member) return [];
    const fromSquadStore = squadsFromSquadStore.filter(squad => squad.memberIds.includes(member.id));
    const fromArmoryStore = armorySquads.filter(squad =>
      squad.leaderMemberId === member.id ||
      squad.apprenticeMemberIds.includes(member.id)
    );
    // Combine and dedupe by id
    const all = [...fromSquadStore, ...fromArmoryStore];
    const seen = new Set<string>();
    return all.filter(squad => {
      if (seen.has(squad.id)) return false;
      seen.add(squad.id);
      return true;
    });
  }, [member, squadsFromSquadStore, armorySquads]);

  // Squads this member leads
  const ledSquads = useMemo(() => {
    if (!member) return [];
    return armorySquads.filter(squad => squad.leaderMemberId === member.id);
  }, [armorySquads, member]);

  // Squads available to join (not already a member)
  const availableSquads = useMemo(() => {
    if (!member) return [];
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
      .filter((t): t is AIAgent => t !== undefined);
  }, [loadout, aiAgents]);

  // Squad action handlers
  const handleCreateSquad = async () => {
    if (!newSquadName.trim() || !member) return;

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
    // Postpone by 1 week
    const task = workPlans.find(t => t.id === taskId);
    if (task?.dueDate) {
      const newDueDate = new Date(task.dueDate);
      newDueDate.setDate(newDueDate.getDate() + 7);
      updateWorkPlan(taskId, { dueDate: newDueDate.toISOString().split('T')[0] });
    }
    setExpandedTaskId(null);
  };

  const handleUnassignFromTask = (taskId: string) => {
    if (!member) return;
    lightImpact();
    const task = workPlans.find(t => t.id === taskId);
    if (task) {
      const newAllocations = task.allocations.filter(a => a.memberId !== member.id);
      updateWorkPlan(taskId, { allocations: newAllocations });
    }
    setExpandedTaskId(null);
  };

  const handleReassignTask = (task: WorkPlan, newMemberId: string) => {
    if (!member) return;
    lightImpact();
    // Replace current member's allocation with new member
    const newAllocations = task.allocations.map(a =>
      a.memberId === member.id ? { ...a, memberId: newMemberId } : a
    );
    updateWorkPlan(task.id, { allocations: newAllocations });
    setShowReassignModal(false);
    setTaskToReassign(null);
  };

  const handleJoinSquad = async (squadId: string) => {
    if (!member) return;
    await assignApprentice(squadId, member.id);
    setShowJoinSquad(false);
  };

  const handleLeaveSquad = async (squadId: string) => {
    if (!member) return;
    await removeApprentice(squadId, member.id);
  };

  const handleDeleteSquad = async (squadId: string) => {
    await deleteSquad(squadId);
  };

  // Don't render anything if no member selected or modal not visible
  if (!member || !visible) {
    return null;
  }

  const roleColor = ROLE_COLORS[member.role];
  const utilizationPercent = memberWorkload.totalCapacity > 0
    ? Math.round((memberWorkload.totalAllocated / memberWorkload.totalCapacity) * 100)
    : 0;

  return (
    <>
      <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable className="flex-1 bg-black/70 justify-center items-center p-4" onPress={onClose}>
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[animatedStyle, { width: '100%', maxWidth: 450 }]}
            >
              <Pressable
                onPress={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-2xl"
                style={{ maxHeight: '90%' }}
              >
                <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View
                  className="p-6 rounded-t-2xl"
                  style={{ backgroundColor: roleColor + '15' }}
                >
                  <Pressable
                    onPress={onClose}
                    className="absolute top-4 right-4 z-10 bg-white dark:bg-slate-800 rounded-full p-2"
                  >
                    <X size={20} color="#64748b" />
                  </Pressable>

                  {/* Navigation Arrows */}
                  {allMembersProp.length > 1 && (
                    <>
                      {hasPrevious && (
                        <Pressable
                          onPress={navigateToPrevious}
                          className="absolute top-4 left-4 z-10 bg-white dark:bg-slate-800 rounded-full p-2 active:opacity-70"
                        >
                          <ChevronLeft size={20} color="#3b82f6" />
                        </Pressable>
                      )}
                      {hasNext && (
                        <Pressable
                          onPress={navigateToNext}
                          className="absolute top-4 right-14 z-10 bg-white dark:bg-slate-800 rounded-full p-2 active:opacity-70"
                        >
                          <ChevronRight size={20} color="#3b82f6" />
                        </Pressable>
                      )}

                      {/* Member Counter */}
                      <View className="absolute top-16 right-4 bg-white dark:bg-slate-800 rounded-full px-2 py-1">
                        <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
                          {currentIndex + 1}/{allMembersProp.length}
                        </Text>
                      </View>
                    </>
                  )}

              {/* Avatar */}
              <View className="items-center mb-4">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: roleColor }}
                >
                  <Text className="text-white font-bold text-2xl">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <Text className="text-slate-900 dark:text-white text-xl font-bold text-center">
                  {member.name}
                </Text>
                <View
                  className="px-3 py-1 rounded-full mt-2"
                  style={{ backgroundColor: roleColor + '30' }}
                >
                  <Text className="font-semibold text-sm" style={{ color: roleColor }}>
                    {ROLE_LABELS[member.role]}
                  </Text>
                </View>
              </View>

              {/* Function & Capacity */}
              <View className="flex-row justify-center gap-4 mt-2">
                <View className="items-center">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">Function</Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {member.function}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">Capacity</Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {memberWorkload.totalAllocated}/{memberWorkload.totalCapacity} TU/wk
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">Utilization</Text>
                  <Text className={`font-semibold ${utilizationPercent >= 100 ? 'text-red-600' : utilizationPercent >= 80 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {utilizationPercent}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Bio */}
            {member.bio && (
              <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <Text className="text-slate-700 dark:text-slate-300 text-sm leading-5">
                  {member.bio}
                </Text>
              </View>
            )}

            {/* AI Tools Equipped Section */}
            <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Cpu size={18} color="#f59e0b" />
                  <Text className="text-slate-900 dark:text-white font-bold text-sm">
                    AI Tools ({equippedTools.length})
                  </Text>
                </View>
              </View>

              {equippedTools.length === 0 ? (
                <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 items-center">
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

            {/* Squads Section with Management */}
            <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Users size={18} color="#8b5cf6" />
                  <Text className="text-slate-900 dark:text-white font-bold text-sm">
                    Squads ({memberSquads.length})
                  </Text>
                </View>
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
                <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 items-center">
                  <Users size={24} color="#94a3b8" />
                  <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
                    Not in any squads yet
                  </Text>
                  <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1 text-center">
                    Create or join a squad to collaborate
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {memberSquads.map((squad) => {
                    // Handle both squad store formats
                    const isLeader = 'leaderMemberId' in squad
                      ? squad.leaderMemberId === member.id
                      : false;
                    const squadMemberIds = 'memberIds' in squad
                      ? squad.memberIds
                      : [...(squad.apprenticeMemberIds || []), squad.leaderMemberId];
                    const squadMembers = allMembers.filter(m =>
                      squadMemberIds.includes(m.id) && m.id !== member.id
                    );
                    // Get optional properties with type guards
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
                          <View className={`px-2 py-0.5 rounded-full ${
                            squadType === 'manual' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-200 dark:bg-slate-700'
                          }`}>
                            <Text className={`text-[10px] font-medium ${
                              squadType === 'manual' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {squadType === 'manual' ? 'MANUAL' : 'AUTO'}
                            </Text>
                          </View>
                        </View>

                        {squad.function && (
                          <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">
                            {squad.function}
                          </Text>
                        )}

                        {/* Squad members preview */}
                        {squadMembers.length > 0 && (
                          <View className="flex-row flex-wrap gap-1 mb-2">
                            {squadMembers.slice(0, 3).map(squadMember => (
                              <View
                                key={squadMember.id}
                                className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full"
                              >
                                <Text className="text-slate-700 dark:text-slate-300 text-xs">
                                  {squadMember.name.split(' ')[0]}
                                </Text>
                              </View>
                            ))}
                            {squadMembers.length > 3 && (
                              <View className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                  +{squadMembers.length - 3}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}

                        {/* Squad actions */}
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
            <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <Text className="text-slate-900 dark:text-white font-bold text-sm mb-3">
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

            {/* Company Details */}
            <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <Text className="text-slate-900 dark:text-white font-bold text-sm mb-3">
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
              <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <Text className="text-slate-900 dark:text-white font-bold text-sm mb-3">
                  Performance Modifiers
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                  These multipliers affect task completion speed when working with teams and AI tools
                </Text>

                {member.teamLeadershipMultiplier && (
                  <View className="flex-row items-center justify-between mb-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-full items-center justify-center mr-3">
                        <UsersRound size={16} color="#8b5cf6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                          Team Leadership
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs">
                          How well they lead teams
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold text-lg ${member.teamLeadershipMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.teamLeadershipMultiplier.toFixed(2)}x
                      </Text>
                      <Text className={`text-xs font-semibold ${member.teamLeadershipMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.teamLeadershipMultiplier >= 1.0 ? '+' : ''}{((member.teamLeadershipMultiplier - 1) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                )}

                {member.collaborationMultiplier && (
                  <View className="flex-row items-center justify-between mb-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full items-center justify-center mr-3">
                        <TrendingUp size={16} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                          Collaboration
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs">
                          How well they work with others
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold text-lg ${member.collaborationMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.collaborationMultiplier.toFixed(2)}x
                      </Text>
                      <Text className={`text-xs font-semibold ${member.collaborationMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.collaborationMultiplier >= 1.0 ? '+' : ''}{((member.collaborationMultiplier - 1) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                )}

                {member.aiProficiencyMultiplier && (
                  <View className="flex-row items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-full items-center justify-center mr-3">
                        <Zap size={16} color="#f59e0b" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                          AI Proficiency
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs">
                          How effectively they use AI tools
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold text-lg ${member.aiProficiencyMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.aiProficiencyMultiplier.toFixed(2)}x
                      </Text>
                      <Text className={`text-xs font-semibold ${member.aiProficiencyMultiplier >= 1.0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {member.aiProficiencyMultiplier >= 1.0 ? '+' : ''}{((member.aiProficiencyMultiplier - 1) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Current Tasks - Interactive with Actions */}
            {memberWorkload.tasks.length > 0 && (
              <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-900 dark:text-white font-bold text-sm">
                    Current Tasks ({memberWorkload.tasks.length})
                  </Text>
                  <Text className="text-slate-400 dark:text-slate-500 text-xs">
                    Tap task for actions
                  </Text>
                </View>

                {/* Scrollable task list with max height */}
                <ScrollView
                  style={{ maxHeight: 280 }}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
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

                          {/* Progress bar - always visible */}
                          <View className="mt-2 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <View
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            />
                          </View>

                          {/* Action Buttons - Visible when expanded */}
                          {isExpanded && (
                            <View className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                              <View className="flex-row flex-wrap gap-2">
                                {/* Complete */}
                                <Pressable
                                  onPress={() => handleCompleteTask(task.id)}
                                  className="flex-row items-center gap-1.5 bg-emerald-500 px-3 py-2 rounded-lg active:opacity-70"
                                >
                                  <CheckCircle size={14} color="white" />
                                  <Text className="text-white text-xs font-bold">Complete</Text>
                                </Pressable>

                                {/* Postpone */}
                                <Pressable
                                  onPress={() => handlePostponeTask(task.id)}
                                  className="flex-row items-center gap-1.5 bg-amber-500 px-3 py-2 rounded-lg active:opacity-70"
                                >
                                  <CalendarClock size={14} color="white" />
                                  <Text className="text-white text-xs font-bold">+1 Week</Text>
                                </Pressable>

                                {/* Unassign */}
                                <Pressable
                                  onPress={() => handleUnassignFromTask(task.id)}
                                  className="flex-row items-center gap-1.5 bg-blue-500 px-3 py-2 rounded-lg active:opacity-70"
                                >
                                  <UserMinus size={14} color="white" />
                                  <Text className="text-white text-xs font-bold">Unassign</Text>
                                </Pressable>

                                {/* Reassign */}
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

                                {/* Delete */}
                                <Pressable
                                  onPress={() => handleDeleteTask(task.id)}
                                  className="flex-row items-center gap-1.5 bg-red-500 px-3 py-2 rounded-lg active:opacity-70"
                                >
                                  <XCircle size={14} color="white" />
                                  <Text className="text-white text-xs font-bold">Delete</Text>
                                </Pressable>
                              </View>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Person's Timeline - Mini Gantt Chart */}
            {memberWorkload.tasks.length > 0 && (
              <View className="px-6 py-4">
                <Text className="text-slate-900 dark:text-white font-bold text-sm mb-3">
                  Personal Timeline
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                  Tasks assigned to {member.name.split(' ')[0]} across time
                </Text>
                <View className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden" style={{ height: 200 }}>
                  <MiniGanttChart
                    workPlans={memberWorkload.tasks}
                    members={allMembers}
                  />
                </View>
              </View>
            )}
          </ScrollView>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Pressable>
  </Modal>

  {/* Create Squad Modal */}
  <Modal visible={showCreateSquad} transparent animationType="fade" onRequestClose={() => setShowCreateSquad(false)}>
    <Pressable
      className="flex-1 bg-black/70 justify-center items-center px-6"
      onPress={() => setShowCreateSquad(false)}
    >
      <Pressable onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm">
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

            <Text className="text-slate-400 dark:text-slate-500 text-xs mb-4">
              You will be the leader of this squad. You can add members after creating it.
            </Text>

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
          </Pressable>
        </Pressable>
      </Modal>

      {/* Join Squad Modal */}
      <Modal visible={showJoinSquad} transparent animationType="fade" onRequestClose={() => setShowJoinSquad(false)}>
        <Pressable
          className="flex-1 bg-black/70 justify-center items-center px-6"
          onPress={() => setShowJoinSquad(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm">
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
              <ScrollView style={{ maxHeight: 300 }}>
                {availableSquads.map((squad) => {
                  const leader = allMembers.find(m => m.id === squad.leaderMemberId);
                  return (
                    <Pressable
                      key={squad.id}
                      onPress={() => handleJoinSquad(squad.id)}
                      className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-2 active:opacity-70"
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
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reassign Task Modal */}
      <Modal visible={showReassignModal} transparent animationType="fade" onRequestClose={() => setShowReassignModal(false)}>
        <Pressable
          className="flex-1 bg-black/70 justify-center items-center px-6"
          onPress={() => setShowReassignModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm">
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

            <ScrollView style={{ maxHeight: 250 }}>
              {allMembers
                .filter(m => m.status === 'active' && m.id !== member?.id)
                .map((teamMember) => {
                  const roleColor = ROLE_COLORS[teamMember.role];
                  return (
                    <Pressable
                      key={teamMember.id}
                      onPress={() => taskToReassign && handleReassignTask(taskToReassign, teamMember.id)}
                      className="flex-row items-center p-3 mb-2 bg-slate-50 dark:bg-slate-800 rounded-xl active:opacity-70"
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: roleColor + '20' }}
                      >
                        <Text className="font-bold text-sm" style={{ color: roleColor }}>
                          {teamMember.name.split(' ').map(n => n[0]).join('')}
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
            </ScrollView>

            <Pressable
              onPress={() => setShowReassignModal(false)}
              className="mt-4 bg-slate-200 dark:bg-slate-700 rounded-xl py-3 active:opacity-70"
            >
              <Text className="text-slate-700 dark:text-slate-300 font-semibold text-center">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
