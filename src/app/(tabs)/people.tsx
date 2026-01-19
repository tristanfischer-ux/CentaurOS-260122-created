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
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useCurrentWorkspace, useCurrentMembership, useAppStore } from '@/lib/state/app-store';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { CollapsibleResourcePool } from '@/components/CollapsibleResourcePool';
import { memberService } from '@/lib/supabase-service';

const PEOPLE_HELP: HelpContent = {
  title: 'People',
  subtitle: 'Your team and hiring',
  description: 'The People tab shows your team roster, individual capacity, and hiring pipeline. Track who\'s on your team and who you\'re bringing on.',
  tips: [
    'View team members by role: Founder, Executive, Apprentice',
    'See capacity allocation per person',
    'Track hiring pipeline: Identified → Contacted → Intro → Trial → Engaged',
    'Tap a person to see their tasks in the Tasks tab',
    'Tap "View Schedule" to see their allocation in the When tab',
  ],
  quickActions: [
    { label: 'My Team', description: 'View current team members and their capacity' },
    { label: 'Hiring Pipeline', description: 'Track candidates through the hiring process' },
    { label: 'Capacity View', description: 'See who has availability' },
  ],
};

type PeopleTab = 'team' | 'hiring';

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useAppStore(s => s.currentUser);
  const loadMembersFromSupabase = useOrganizationStore(s => s.loadMembersFromSupabase);

  // Stores
  const members = useOrganizationStore(s => s.members);

  // State
  const [activeTab, setActiveTab] = useState<PeopleTab>('team');
  const [showHelp, setShowHelp] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Check if current user has a member record
  const userHasMemberRecord = useMemo(() => {
    if (!currentUser?.id) return true; // Don't show if not logged in
    return members.some(m => m.userId === currentUser.id);
  }, [members, currentUser?.id]);

  // Handler to add current user as a member
  const handleAddSelfAsMember = async () => {
    console.log('[People] handleAddSelfAsMember called', {
      currentUser: currentUser?.id,
      currentWorkspace: currentWorkspace?.id,
      currentMembership: currentMembership?.id,
    });

    if (!currentUser || !currentWorkspace?.id || !currentMembership) {
      console.error('[People] Missing required data:', {
        hasUser: !!currentUser,
        hasWorkspace: !!currentWorkspace?.id,
        hasMembership: !!currentMembership,
      });
      Alert.alert('Error', 'Unable to add member. Please try again.');
      return;
    }

    setIsAddingMember(true);
    try {
      const memberData = {
        workspaceId: currentWorkspace.id,
        userId: currentUser.id,
        name: currentUser.name || 'Team Member',
        role: currentMembership.role || 'Founder', // Use their membership role
        function: currentMembership.function || 'Admin',
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
            { key: 'team', label: 'My Team', icon: Users },
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
                      <Pressable
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 active:opacity-80"
                      >
                        <View className="flex-row items-center">
                          <View
                            className="w-12 h-12 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: getRoleColor(member.role) + '20' }}
                          >
                            <Text
                              className="text-lg font-bold"
                              style={{ color: getRoleColor(member.role) }}
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

                        {/* Quick Actions */}
                        <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <Pressable
                            onPress={() => router.push('/(tabs)/tasks')}
                            className="flex-1 flex-row items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-700 py-2 rounded-lg active:opacity-70"
                          >
                            <Target size={14} color="#3b82f6" />
                            <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                              View Tasks
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => router.push('/(tabs)/when')}
                            className="flex-1 flex-row items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-700 py-2 rounded-lg active:opacity-70"
                          >
                            <Calendar size={14} color="#8b5cf6" />
                            <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                              View Schedule
                            </Text>
                          </Pressable>
                        </View>
                      </Pressable>
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
    </View>
  );
}
