/**
 * People Tab - Team Management
 * Team roster, capacity, and hiring pipeline
 *
 * MIGRATION: This tab consolidates features from 'who' tab
 */

import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  Users,
  UserPlus,
  Clock,
  ChevronRight,
  Briefcase,
  Target,
  Calendar,
  AlertCircle,
  UsersRound,
  Plus,
  ListTodo,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useSquadStore, type Squad } from '@/lib/state/squad-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useCurrentWorkspace, useCurrentMembership, useAppStore } from '@/lib/state/app-store';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { CollapsibleResourcePool } from '@/components/CollapsibleResourcePool';
import { PersonDetailsModal } from '@/components/PersonDetailsModal';
import { PersonCard } from '@/components/PersonCard';
import { memberService } from '@/lib/supabase-service';
import type { OrganizationMember } from '@/lib/organization-seed';

const PEOPLE_HELP: HelpContent = {
  title: 'People',
  subtitle: 'Team Management & Task Assignment',
  description: 'The People tab is your team intelligence center. View team capacity, assign tasks with smart suggestions, track pending assignments, and manage your hiring pipeline. Three-state cards let you quickly scan or dive deep into each person.',
  tips: [
    '👥 Three-State Cards: Tap once to expand, tap again for full modal with schedule and tasks',
    '📋 Task Assignment: Founders can assign tasks - recipients get a request to accept or reject',
    '🔔 Pending Assignments: See who has pending requests and manage bulk operations',
    '🤖 Smart Suggestions: After rejection, AI suggests alternative team members based on capacity and skills',
    '📊 Capacity Tracking: Each person shows available TUs (Time Units) for the current week',
    '🎯 Role-Based View: Filter by Founder, Executive, Apprentice, or view all',
    '⚡ Quick Actions: Assign to task, view schedule, or see all their current work',
    '🔴 Overload Warnings: Red indicators show when someone is over capacity',
    '✅ Greyed Out Pending: Tasks show as greyed in timeline until assignment is accepted',
    '📈 Hiring Pipeline: Track candidates from Identified → Contacted → Intro → Trial → Engaged',
  ],
  quickActions: [
    { label: 'Expand Card', description: 'Tap once to see capacity and quick actions' },
    { label: 'Full Details', description: 'Tap again for complete schedule and task list' },
    { label: 'Assign Task', description: 'Founders can assign - creates pending request' },
    { label: 'Review Pending', description: 'Accept or reject task assignments' },
    { label: 'View Schedule', description: 'See weekly timeline with all allocations' },
  ],
};

type PeopleTab = 'team' | 'squads' | 'hiring';

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useAppStore(s => s.currentUser);
  const loadMembersFromSupabase = useOrganizationStore(s => s.loadMembersFromSupabase);

  // Stores
  const members = useOrganizationStore(s => s.members);
  const squads = useSquadStore(s => s.squads);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // State
  const [activeTab, setActiveTab] = useState<PeopleTab>('team');
  const [showHelp, setShowHelp] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  // Handler for opening person details
  const handleOpenPersonDetails = (member: OrganizationMember) => {
    setSelectedMember(member);
    setShowPersonModal(true);
  };

  // Handler for changing member via swipe in modal
  const handleMemberChange = (member: OrganizationMember) => {
    setSelectedMember(member);
  };

  // Check if current user has a member record
  const userHasMemberRecord = useMemo(() => {
    if (!currentUser?.id) return true; // Don't show if not logged in
    return members.some(m => m.userId === currentUser.id);
  }, [members, currentUser?.id]);

  // Handler to add current user as a member
  const handleAddSelfAsMember = async () => {
    console.log('[People] handleAddSelfAsMember called', {
      currentUser: currentUser?.id,
      currentUserName: currentUser?.name,
      currentWorkspace: currentWorkspace?.id,
      currentWorkspaceName: currentWorkspace?.name,
      currentMembership: currentMembership?.id,
      currentMembershipRole: currentMembership?.role,
      currentMembershipFunction: currentMembership?.function,
    });

    if (!currentUser || !currentWorkspace?.id) {
      console.error('[People] Missing required data:', {
        hasUser: !!currentUser,
        hasWorkspace: !!currentWorkspace?.id,
        hasMembership: !!currentMembership,
      });
      Alert.alert('Error', 'Unable to add member. Missing user or workspace information.');
      return;
    }

    // Check if member already exists
    const existingMember = members.find(m => m.userId === currentUser.id);
    if (existingMember) {
      console.log('[People] Member already exists:', existingMember.id);
      Alert.alert('Already Added', 'You are already in the team roster!');
      return;
    }

    // If no membership, use defaults
    const role = currentMembership?.role || 'Founder';
    const functionName = currentMembership?.function || 'Admin';

    setIsAddingMember(true);
    try {
      const memberData = {
        workspaceId: currentWorkspace.id,
        userId: currentUser.id,
        name: currentUser.name || 'Team Member',
        role: role,
        function: functionName,
        status: 'active',
      };

      console.log('[People] Creating member with data:', memberData);

      // Create member record with current user's info
      const newMember = await memberService.create(memberData);

      console.log('[People] Created member record:', newMember);

      // Reload members from Supabase to update the UI
      await loadMembersFromSupabase(currentWorkspace.id);

      Alert.alert('Success', 'You have been added to the team roster!');
    } catch (error) {
      console.error('[People] Failed to create member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to add you to the team: ${errorMessage}`);
    } finally {
      setIsAddingMember(false);
    }
  };

  // Group members by role
  const membersByRole = useMemo(() => {
    const grouped: Record<string, typeof members> = {
      Founder: [],
      FractionalExec: [],
      Apprentice: [],
    };
    members.forEach(member => {
      if (grouped[member.role]) {
        grouped[member.role].push(member);
      }
    });
    return grouped;
  }, [members]);

  // Stats
  const stats = useMemo(() => {
    const founders = membersByRole.Founder.length;
    const execs = membersByRole.FractionalExec.length;
    const apprentices = membersByRole.Apprentice.length;
    const total = members.length;
    return { founders, execs, apprentices, total };
  }, [membersByRole, members]);

  // Squad data with member details and tasks
  const squadsWithDetails = useMemo(() => {
    return squads.map(squad => {
      // Get member details for this squad
      const squadMembers = squad.memberIds
        .map(id => members.find(m => m.id === id))
        .filter(Boolean);

      // Get tasks assigned to this squad
      const squadTasks = (squad.taskIds || [])
        .map(id => workPlans.find(wp => wp.id === id))
        .filter(Boolean) as WorkPlan[];

      // Also find tasks where squad members are allocated
      const memberTaskIds = new Set<string>();
      workPlans.forEach(wp => {
        const allocatedMemberIds = wp.allocations?.map(a => a.memberId) || [];
        const hasSquadMember = squad.memberIds.some(mid => allocatedMemberIds.includes(mid));
        if (hasSquadMember && wp.status !== 'completed' && wp.status !== 'abandoned') {
          memberTaskIds.add(wp.id);
        }
      });

      // Combine explicit squad tasks with tasks that have squad members
      const allTaskIds = new Set([
        ...(squad.taskIds || []),
        ...Array.from(memberTaskIds),
      ]);
      const allTasks = Array.from(allTaskIds)
        .map(id => workPlans.find(wp => wp.id === id))
        .filter(Boolean) as WorkPlan[];

      return {
        ...squad,
        members: squadMembers,
        tasks: allTasks,
        activeTasks: allTasks.filter(t => t.status === 'in-progress'),
      };
    });
  }, [squads, members, workPlans]);

  // Separate manual and automatic squads
  const manualSquads = squadsWithDetails.filter(s => s.type === 'manual');
  const automaticSquads = squadsWithDetails.filter(s => s.type === 'automatic');

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder': return '#3b82f6';
      case 'FractionalExec': return '#8b5cf6';
      case 'Apprentice': return '#10b981';
      default: return '#64748b';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Founder': return 'Founder';
      case 'FractionalExec': return 'Executive';
      case 'Apprentice': return 'Apprentice';
      default: return role;
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={PEOPLE_HELP}
        gradientColors={['#3b82f6', '#2563eb']}
      />

      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#2563eb', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Team</Text>
            <Text className="text-white text-2xl font-bold">People</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push('/send-invitation')}
              className="bg-white/20 p-2 rounded-full"
            >
              <UserPlus size={20} color="white" />
            </Pressable>
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          <View className="items-center flex-1">
            <Text className="text-white/70 text-xs">Total</Text>
            <Text className="text-white font-bold text-lg">{stats.total}</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Founders</Text>
            <Text className="text-white font-bold text-lg">{stats.founders}</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Execs</Text>
            <Text className="text-purple-300 font-bold text-lg">{stats.execs}</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Apprentices</Text>
            <Text className="text-emerald-300 font-bold text-lg">{stats.apprentices}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Switcher */}
      <View className="px-5 pt-4">
        <View className="flex-row bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {[
            { key: 'team', label: 'People', icon: Users },
            { key: 'squads', label: 'Teams', icon: UsersRound },
            { key: 'hiring', label: 'Hiring', icon: UserPlus },
          ].map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key as PeopleTab)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg ${
                activeTab === tab.key ? 'bg-white dark:bg-slate-700' : ''
              }`}
            >
              <tab.icon
                size={16}
                color={activeTab === tab.key ? '#3b82f6' : '#64748b'}
              />
              <Text
                className={`text-sm font-medium ${
                  activeTab === tab.key
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Missing Member Record Banner */}
      {!userHasMemberRecord && (
        <View className="px-5 pt-4">
          <Animated.View
            entering={FadeInDown.springify()}
            className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4"
          >
            <View className="flex-row items-start gap-3">
              <View className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-full">
                <AlertCircle size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-amber-900 dark:text-amber-100 font-semibold text-base mb-1">
                  Add Yourself to the Team
                </Text>
                <Text className="text-amber-700 dark:text-amber-200 text-sm mb-3">
                  You're not in the team roster yet. Add yourself so you can be assigned to tasks and manage your workload.
                </Text>
                <Pressable
                  onPress={handleAddSelfAsMember}
                  disabled={isAddingMember}
                  className={`bg-amber-500 rounded-lg py-2.5 px-4 active:opacity-80 ${
                    isAddingMember ? 'opacity-50' : ''
                  }`}
                >
                  <Text className="text-white font-semibold text-center">
                    {isAddingMember ? 'Adding...' : 'Add Me to Team'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
      >
        {activeTab === 'team' && (
          <View>
            {/* Team Members by Role */}
            {(['Founder', 'FractionalExec', 'Apprentice'] as const).map(role => {
              const roleMembers = membersByRole[role];
              if (roleMembers.length === 0) return null;

              return (
                <View key={role} className="mb-6">
                  <View className="flex-row items-center gap-2 mb-3">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getRoleColor(role) }}
                    />
                    <Text className="text-slate-900 dark:text-white font-semibold text-base">
                      {getRoleLabel(role)}s ({roleMembers.length})
                    </Text>
                  </View>

                  {roleMembers.map((member, index) => (
                    <Animated.View
                      key={member.id}
                      entering={FadeInDown.delay(index * 50).springify()}
                    >
                      <PersonCard
                        member={member}
                        roleColor={getRoleColor(member.role)}
                        onOpenModal={() => handleOpenPersonDetails(member)}
                      />
                    </Animated.View>
                  ))}
                </View>
              );
            })}

            {members.length === 0 && (
              <View className="items-center py-12">
                <Users size={48} color="#94a3b8" />
                <Text className="text-slate-500 dark:text-slate-400 text-center mt-4 text-base">
                  No team members yet
                </Text>
                <Pressable
                  onPress={() => router.push('/send-invitation')}
                  className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">Invite Team Member</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {activeTab === 'squads' && (
          <View>
            {/* Squad Stats Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-900 dark:text-white font-bold text-lg">
                Team Groups
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  <Text className="text-purple-700 dark:text-purple-300 text-xs font-medium">
                    {manualSquads.length + automaticSquads.length} teams
                  </Text>
                </View>
              </View>
            </View>

            {/* Manual Squads */}
            {manualSquads.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <UsersRound size={16} color="#8b5cf6" />
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold">
                    Custom Teams ({manualSquads.length})
                  </Text>
                </View>

                {manualSquads.map((squad, index) => (
                  <Animated.View
                    key={squad.id}
                    entering={FadeInDown.delay(index * 50).springify()}
                  >
                    <Pressable className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 active:opacity-80">
                      {/* Squad Header */}
                      <View className="flex-row items-center mb-3">
                        <View
                          className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                          style={{ backgroundColor: squad.color || '#8b5cf6' }}
                        >
                          <UsersRound size={20} color="white" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-900 dark:text-white font-semibold text-base">
                            {squad.name}
                          </Text>
                          {squad.function && (
                            <Text className="text-slate-500 dark:text-slate-400 text-sm">
                              {squad.function}
                            </Text>
                          )}
                        </View>
                        <View className="items-end">
                          <View className="flex-row items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                            <Users size={12} color="#64748b" />
                            <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                              {squad.members.length}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Squad Members */}
                      {squad.members.length > 0 && (
                        <View className="flex-row flex-wrap gap-1.5 mb-3">
                          {squad.members.slice(0, 5).map((member: any) => (
                            <Pressable
                              key={member.id}
                              onPress={() => handleOpenPersonDetails(member)}
                              className="flex-row items-center bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-full active:opacity-70"
                            >
                              <View
                                className="w-5 h-5 rounded-full items-center justify-center mr-1.5"
                                style={{ backgroundColor: getRoleColor(member.role) + '30' }}
                              >
                                <Text
                                  className="text-[10px] font-bold"
                                  style={{ color: getRoleColor(member.role) }}
                                >
                                  {member.name?.charAt(0) || '?'}
                                </Text>
                              </View>
                              <Text className="text-slate-600 dark:text-slate-300 text-xs">
                                {member.name}
                              </Text>
                            </Pressable>
                          ))}
                          {squad.members.length > 5 && (
                            <View className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                +{squad.members.length - 5} more
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Active Tasks */}
                      {squad.activeTasks.length > 0 && (
                        <View className="border-t border-slate-100 dark:border-slate-700 pt-3">
                          <View className="flex-row items-center gap-1.5 mb-2">
                            <ListTodo size={14} color="#10b981" />
                            <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                              Working on {squad.activeTasks.length} task{squad.activeTasks.length !== 1 ? 's' : ''}
                            </Text>
                          </View>
                          {squad.activeTasks.slice(0, 3).map((task: WorkPlan) => (
                            <View key={task.id} className="flex-row items-center gap-2 mb-1.5">
                              <View className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <Text className="text-slate-600 dark:text-slate-300 text-sm flex-1" numberOfLines={1}>
                                {task.title}
                              </Text>
                              <Text className="text-slate-400 dark:text-slate-500 text-xs">
                                {task.progress || 0}%
                              </Text>
                            </View>
                          ))}
                          {squad.activeTasks.length > 3 && (
                            <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                              +{squad.activeTasks.length - 3} more tasks
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Empty State for Tasks */}
                      {squad.activeTasks.length === 0 && (
                        <View className="border-t border-slate-100 dark:border-slate-700 pt-3">
                          <Text className="text-slate-400 dark:text-slate-500 text-sm text-center">
                            No active tasks assigned
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Automatic Squads (formed from task allocations) */}
            {automaticSquads.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <Target size={16} color="#3b82f6" />
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold">
                    Task Teams ({automaticSquads.length})
                  </Text>
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                  Automatically formed when 2+ people work on the same task
                </Text>

                {automaticSquads.map((squad, index) => (
                  <Animated.View
                    key={squad.id}
                    entering={FadeInDown.delay((manualSquads.length + index) * 50).springify()}
                  >
                    <Pressable className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 active:opacity-80 border border-dashed border-slate-200 dark:border-slate-700">
                      {/* Squad Header */}
                      <View className="flex-row items-center mb-3">
                        <View
                          className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                          style={{ backgroundColor: squad.color || '#3b82f6' }}
                        >
                          <Target size={20} color="white" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-900 dark:text-white font-semibold text-base">
                            {squad.name}
                          </Text>
                          <Text className="text-slate-400 dark:text-slate-500 text-xs">
                            Auto-formed team
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                          <Users size={12} color="#3b82f6" />
                          <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                            {squad.members.length}
                          </Text>
                        </View>
                      </View>

                      {/* Squad Members */}
                      {squad.members.length > 0 && (
                        <View className="flex-row flex-wrap gap-1.5 mb-3">
                          {squad.members.map((member: any) => (
                            <Pressable
                              key={member.id}
                              onPress={() => handleOpenPersonDetails(member)}
                              className="flex-row items-center bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-full active:opacity-70"
                            >
                              <View
                                className="w-5 h-5 rounded-full items-center justify-center mr-1.5"
                                style={{ backgroundColor: getRoleColor(member.role) + '30' }}
                              >
                                <Text
                                  className="text-[10px] font-bold"
                                  style={{ color: getRoleColor(member.role) }}
                                >
                                  {member.name?.charAt(0) || '?'}
                                </Text>
                              </View>
                              <Text className="text-slate-600 dark:text-slate-300 text-xs">
                                {member.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}

                      {/* Active Task */}
                      {squad.activeTasks.length > 0 && (
                        <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5">
                          {squad.activeTasks.map((task: WorkPlan) => (
                            <View key={task.id} className="flex-row items-center gap-2">
                              <View className="w-2 h-2 rounded-full bg-blue-500" />
                              <Text className="text-blue-800 dark:text-blue-200 text-sm flex-1 font-medium" numberOfLines={1}>
                                {task.title}
                              </Text>
                              <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                                {task.progress || 0}%
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Empty State */}
            {squads.length === 0 && (
              <View className="items-center py-12">
                <View className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full mb-4">
                  <UsersRound size={48} color="#8b5cf6" />
                </View>
                <Text className="text-slate-900 dark:text-white font-semibold text-lg mb-2">
                  No Teams Yet
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm mb-4 px-8">
                  Teams help you organize your team by function or project. They form automatically when multiple people work on the same task.
                </Text>
                <View className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 w-full">
                  <Text className="text-purple-800 dark:text-purple-300 font-medium text-center mb-2">
                    Teams will appear when:
                  </Text>
                  <Text className="text-purple-600 dark:text-purple-400 text-sm text-center">
                    2 or more team members are assigned to the same task
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'hiring' && (
          <View>
            {/* Hiring Pipeline */}
            <Text className="text-slate-900 dark:text-white font-bold text-lg mb-4">
              Hiring Pipeline
            </Text>

            {/* Pipeline Stages */}
            {['Identified', 'Contacted', 'Intro Call', 'Trial', 'Engaged'].map((stage, index) => (
              <View key={stage} className="mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#3b82f620' }}
                  >
                    <Text className="text-blue-600 text-xs font-bold">{index + 1}</Text>
                  </View>
                  <Text className="text-slate-700 dark:text-slate-300 font-medium">
                    {stage}
                  </Text>
                  <View className="flex-1 h-px bg-slate-200 dark:bg-slate-700 ml-2" />
                  <Text className="text-slate-400 text-sm">0</Text>
                </View>
              </View>
            ))}

            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mt-4">
              <Text className="text-blue-800 dark:text-blue-300 font-medium mb-2">
                Start Hiring
              </Text>
              <Text className="text-blue-600 dark:text-blue-400 text-sm mb-3">
                Add candidates to your hiring pipeline and track them through each stage.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/marketplace')}
                className="bg-blue-500 rounded-lg py-2.5 items-center active:opacity-80"
              >
                <Text className="text-white font-semibold">Browse Talent</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Resource Pool Drawer */}
      <CollapsibleResourcePool
        selectedPersonId={selectedPersonId}
        onPersonSelect={setSelectedPersonId}
      />

      {/* Person Details Modal */}
      <PersonDetailsModal
        visible={showPersonModal}
        onClose={() => setShowPersonModal(false)}
        member={selectedMember}
        allMembers={members}
        onMemberChange={handleMemberChange}
      />
    </View>
  );
}
