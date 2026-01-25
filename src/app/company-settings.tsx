/**
 * Company & Team Settings Screen
 * Complete team management: company profile, user profile, invite, accept, remove members
 * Enhanced with role explanations, role changes, and external collaborators
 */

import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Building2,
  ChevronLeft,
  Users,
  Edit2,
  Save,
  X,
  Mail,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  UserPlus,
  Trash2,
  User,
  Send,
  Clock,
  Shield,
  AlertTriangle,
  Crown,
  Zap,
  GraduationCap,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Building,
  Info,
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser, useAppStore } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import type { OrganizationMember } from '@/lib/organization-seed';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getInitials, ROLE_COLORS } from '@/components/Avatar';
import { AIUsageMonitor } from '@/components/AIUsageMonitor';

type InvitationStatus = 'pending' | 'accepted' | 'rejected';
type MemberRole = 'Founder' | 'CoFounder' | 'FractionalExec' | 'Apprentice';

type Invitation = {
  id: string;
  email: string;
  role: MemberRole;
  function: string;
  invitedBy: string;
  invitedAt: Date;
  status: InvitationStatus;
  isExternal?: boolean; // For suppliers/contractors
};

// Role information for clarity
const ROLE_INFO: Record<MemberRole, { icon: typeof Crown; title: string; description: string; color: string }> = {
  Founder: {
    icon: Crown,
    title: 'Founder',
    description: 'Full access. Owns the company. Can invite, remove, and manage all team members.',
    color: '#8b5cf6',
  },
  CoFounder: {
    icon: Shield,
    title: 'Co-Founder',
    description: 'Executive level access. Shares leadership with the Founder.',
    color: '#8b5cf6',
  },
  FractionalExec: {
    icon: Briefcase,
    title: 'Fractional Executive',
    description: 'Part-time leadership. Works specific days/week. Reviews work, makes decisions, guides strategy.',
    color: '#3b82f6',
  },
  Apprentice: {
    icon: GraduationCap,
    title: 'Apprentice',
    description: 'Full-time doer. Executes tasks, learns on the job. Work is reviewed by Executives or Founders.',
    color: '#10b981',
  },
};

export default function CompanySettingsScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();
  const updateWorkspace = useAppStore(s => s.updateWorkspace);
  const setCurrentUser = useAppStore(s => s.setCurrentUser);

  const members = useOrganizationStore(s => s.members);
  const addMember = useOrganizationStore(s => s.addMember);
  const removeMember = useOrganizationStore(s => s.removeMember);
  const updateMember = useOrganizationStore(s => s.updateMember);

  // Filter internal team (your company's employees)
  const internalTeam = members.filter(m =>
    m.workspaceId === currentWorkspace?.id && m.status === 'active'
  );

  // State management
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyName, setCompanyName] = useState(currentWorkspace?.name || '');

  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('Apprentice');
  const [inviteFunction, setInviteFunction] = useState('');
  const [isExternalInvite, setIsExternalInvite] = useState(false);

  // Role change modal
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] = useState<OrganizationMember | null>(null);
  const [newRole, setNewRole] = useState<MemberRole>('Apprentice');

  // Mock invitations (in real app, this would be in a store)
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);

  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // === COMPANY PROFILE ===
  const handleSaveCompanyName = async () => {
    if (!currentWorkspace?.id || !companyName.trim()) return;

    try {
      await updateWorkspace(currentWorkspace.id, { name: companyName.trim() });
      setIsEditingCompany(false);
    } catch (error) {
      console.error('Failed to update workspace:', error);
      Alert.alert('Error', 'Failed to update company name');
    }
  };

  // === USER PROFILE (YOU) ===
  const handleSaveUserProfile = async () => {
    if (!currentUser?.id || !userName.trim()) return;

    try {
      setCurrentUser({
        ...currentUser,
        name: userName.trim(),
        email: userEmail.trim(),
      });
      setIsEditingUser(false);
      Alert.alert('Success', 'Your profile has been updated');
    } catch (error) {
      console.error('Failed to update user:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  // === INVITE TEAM MEMBER ===
  const handleSendInvite = () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    if (!inviteFunction.trim()) {
      Alert.alert('Error', 'Please select a function');
      return;
    }

    // Create invitation
    const newInvitation: Invitation = {
      id: `inv-${Date.now()}`,
      email: inviteEmail.trim(),
      role: inviteRole,
      function: inviteFunction,
      invitedBy: currentUser?.name || 'Unknown',
      invitedAt: new Date(),
      status: 'pending',
      isExternal: isExternalInvite,
    };

    setPendingInvitations([...pendingInvitations, newInvitation]);

    // Reset form
    setInviteEmail('');
    setInviteRole('Apprentice');
    setInviteFunction('');
    setIsExternalInvite(false);
    setShowInviteModal(false);

    Alert.alert('Invitation Sent', `Invitation sent to ${inviteEmail}`);
  };

  // === ACCEPT INVITATION ===
  const handleAcceptInvitation = (invitation: Invitation) => {
    if (!currentWorkspace?.id) return;

    // Add as new team member
    addMember({
      id: `member-${Date.now()}`,
      workspaceId: currentWorkspace.id,
      name: invitation.email.split('@')[0],
      email: invitation.email,
      role: invitation.role,
      function: invitation.function,
      status: 'active',
      daysPerWeek: invitation.role === 'FractionalExec' ? 2 : 5,
      costPerDay: invitation.role === 'Apprentice' ? 150 : invitation.role === 'FractionalExec' ? 500 : 0,
    } as OrganizationMember);

    // Update invitation status
    setPendingInvitations(pendingInvitations.map(inv =>
      inv.id === invitation.id ? { ...inv, status: 'accepted' as InvitationStatus } : inv
    ));

    Alert.alert('Accepted', `${invitation.email} has joined your team`);
  };

  // === REJECT INVITATION ===
  const handleRejectInvitation = (invitation: Invitation) => {
    setPendingInvitations(pendingInvitations.map(inv =>
      inv.id === invitation.id ? { ...inv, status: 'rejected' as InvitationStatus } : inv
    ));
    Alert.alert('Rejected', `Invitation to ${invitation.email} has been rejected`);
  };

  // === CHANGE ROLE ===
  const openRoleChangeModal = (member: OrganizationMember) => {
    setMemberToChangeRole(member);
    setNewRole(member.role as MemberRole);
    setShowRoleChangeModal(true);
  };

  const handleChangeRole = () => {
    if (!memberToChangeRole) return;

    updateMember(memberToChangeRole.id, { role: newRole });
    setShowRoleChangeModal(false);
    setMemberToChangeRole(null);

    Alert.alert(
      'Role Updated',
      `${memberToChangeRole.name}'s role has been changed to ${ROLE_INFO[newRole].title}`
    );
  };

  // === REMOVE TEAM MEMBER ===
  const handleRemoveMember = (member: OrganizationMember) => {
    setMemberToRemove(member);
    setShowRemoveModal(true);
  };

  const confirmRemoveMember = () => {
    if (!memberToRemove) return;

    // Don't allow removing yourself
    if (memberToRemove.id === currentMembership?.id) {
      Alert.alert('Error', 'You cannot remove yourself from the team');
      setShowRemoveModal(false);
      setMemberToRemove(null);
      return;
    }

    removeMember(memberToRemove.id);
    setShowRemoveModal(false);
    setMemberToRemove(null);
    Alert.alert('Removed', `${memberToRemove.name} has been removed from the team`);
  };

  // Helper to get role display name
  const getRoleDisplayName = (role: string) => {
    if (role === 'FractionalExec') return 'Executive';
    if (role === 'CoFounder') return 'Co-Founder';
    return role;
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
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
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-2 active:opacity-70"
          >
            <ChevronLeft size={24} color="white" />
            <Text className="text-white text-lg font-medium">Settings</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="bg-white/20 p-3 rounded-xl">
            <Building2 size={28} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">
              Company & Team
            </Text>
            <Text className="text-white text-2xl font-bold">
              {currentWorkspace?.name || 'Your Company'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
      >
        {/* Company Profile Section */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View className="bg-white dark:bg-slate-900 rounded-xl p-5 mb-5">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Building2 size={20} color="#3b82f6" />
                <Text className="text-slate-900 dark:text-white font-bold text-lg">
                  Company Profile
                </Text>
              </View>
              {!isEditingCompany && (
                <Pressable
                  onPress={() => setIsEditingCompany(true)}
                  className="flex-row items-center gap-1 active:opacity-70"
                >
                  <Edit2 size={16} color="#3b82f6" />
                  <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    Edit
                  </Text>
                </Pressable>
              )}
            </View>

            {isEditingCompany ? (
              <View className="gap-3">
                <View>
                  <Text className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                    Company Name
                  </Text>
                  <TextInput
                    value={companyName}
                    onChangeText={setCompanyName}
                    placeholder="Enter company name"
                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View className="flex-row gap-3 mt-2">
                  <Pressable
                    onPress={handleSaveCompanyName}
                    className="flex-1 bg-blue-600 py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
                  >
                    <Save size={18} color="white" />
                    <Text className="text-white font-semibold">Save</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setCompanyName(currentWorkspace?.name || '');
                      setIsEditingCompany(false);
                    }}
                    className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-lg items-center active:opacity-80"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 font-semibold">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">Company Name</Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {currentWorkspace?.name}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">Workspace ID</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                    {currentWorkspace?.id.slice(0, 8)}...
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Your Profile Section (YOU) */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View className="bg-white dark:bg-slate-900 rounded-xl p-5 mb-5">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <User size={20} color="#8b5cf6" />
                <Text className="text-slate-900 dark:text-white font-bold text-lg">
                  Your Profile
                </Text>
              </View>
              {!isEditingUser && (
                <Pressable
                  onPress={() => setIsEditingUser(true)}
                  className="flex-row items-center gap-1 active:opacity-70"
                >
                  <Edit2 size={16} color="#8b5cf6" />
                  <Text className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                    Edit
                  </Text>
                </Pressable>
              )}
            </View>

            {isEditingUser ? (
              <View className="gap-3">
                <View>
                  <Text className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                    Your Name
                  </Text>
                  <TextInput
                    value={userName}
                    onChangeText={setUserName}
                    placeholder="Enter your name"
                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View>
                  <Text className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                    Email Address
                  </Text>
                  <TextInput
                    value={userEmail}
                    onChangeText={setUserEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View className="flex-row gap-3 mt-2">
                  <Pressable
                    onPress={handleSaveUserProfile}
                    className="flex-1 bg-purple-600 py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
                  >
                    <Save size={18} color="white" />
                    <Text className="text-white font-semibold">Save</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setUserName(currentUser?.name || '');
                      setUserEmail(currentUser?.email || '');
                      setIsEditingUser(false);
                    }}
                    className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-lg items-center active:opacity-80"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 font-semibold">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">Name</Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {currentUser?.name}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">Email</Text>
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    {currentUser?.email || 'Not set'}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">Role</Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ROLE_COLORS[currentMembership?.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.Founder }}
                    />
                    <Text className="text-slate-900 dark:text-white font-semibold">
                      {getRoleDisplayName(currentMembership?.role || 'Founder')}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Role Guide Section */}
        <Animated.View entering={FadeInDown.delay(250)}>
          <View className="bg-white dark:bg-slate-900 rounded-xl p-5 mb-5">
            <View className="flex-row items-center gap-2 mb-4">
              <Info size={20} color="#6366f1" />
              <Text className="text-slate-900 dark:text-white font-bold text-lg">
                Role Guide
              </Text>
            </View>

            <Text className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Understand each role before inviting team members. Roles can be changed later as people grow.
            </Text>

            {(Object.entries(ROLE_INFO) as [MemberRole, typeof ROLE_INFO[MemberRole]][]).map(([role, info]) => {
              const IconComponent = info.icon;
              return (
                <View
                  key={role}
                  className="flex-row items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                >
                  <View
                    className="w-10 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: info.color + '20' }}
                  >
                    <IconComponent size={20} color={info.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">
                      {info.title}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      {info.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* AI Usage & Cost Protection */}
        <Animated.View entering={FadeInDown.delay(275)}>
          <View className="mb-5">
            <View className="flex-row items-center gap-2 mb-3 px-1">
              <Shield size={18} color="#6366f1" />
              <Text className="text-slate-900 dark:text-white font-bold text-base">
                AI Cost Protection
              </Text>
            </View>
            <AIUsageMonitor />
          </View>
        </Animated.View>

        {/* Internal Team Section */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View className="bg-white dark:bg-slate-900 rounded-xl p-5 mb-5">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Users size={20} color="#10b981" />
                <Text className="text-slate-900 dark:text-white font-bold text-lg">
                  Team Members ({internalTeam.length})
                </Text>
              </View>
              <Pressable
                onPress={() => setShowInviteModal(true)}
                className="flex-row items-center gap-1 bg-emerald-500 px-3 py-2 rounded-lg active:opacity-80"
              >
                <UserPlus size={16} color="white" />
                <Text className="text-white text-sm font-semibold">Invite</Text>
              </Pressable>
            </View>

            <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-4">
              <View className="flex-row items-start gap-2">
                <Shield size={16} color="#10b981" className="mt-0.5" />
                <Text className="text-emerald-700 dark:text-emerald-400 text-xs flex-1">
                  Team members work FOR {currentWorkspace?.name}. Tap a member to change their role.
                </Text>
              </View>
            </View>

            {internalTeam.map((member, index) => {
              const isYou = member.id === currentMembership?.id;
              const roleColor = ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] || '#8b5cf6';
              const roleInfo = ROLE_INFO[member.role as MemberRole];

              return (
                <Pressable
                  key={member.id}
                  onPress={() => !isYou && openRoleChangeModal(member)}
                  className={`flex-row items-center justify-between py-3 ${index < internalTeam.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
                    } ${!isYou ? 'active:bg-slate-50 dark:active:bg-slate-800' : ''}`}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: roleColor + '20' }}
                    >
                      <Text className="font-bold text-sm" style={{ color: roleColor }}>
                        {getInitials(member.name)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-slate-900 dark:text-white font-semibold">
                          {member.name}
                        </Text>
                        {isYou && (
                          <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                            <Text className="text-purple-700 dark:text-purple-400 text-[10px] font-bold">
                              YOU
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <View
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: roleColor }}
                        />
                        <Text className="text-slate-500 dark:text-slate-400 text-xs">
                          {getRoleDisplayName(member.role)} • {member.function}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    {!isYou && (
                      <>
                        <Pressable
                          onPress={() => openRoleChangeModal(member)}
                          className="p-2 active:opacity-70"
                        >
                          <RefreshCw size={16} color="#64748b" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleRemoveMember(member)}
                          className="p-2 active:opacity-70"
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </Pressable>
                      </>
                    )}
                  </View>
                </Pressable>
              );
            })}

            {internalTeam.length === 0 && (
              <View className="py-8 items-center">
                <Users size={48} color="#cbd5e1" />
                <Text className="text-slate-400 dark:text-slate-500 text-sm mt-3">
                  No team members yet
                </Text>
                <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                  Tap "Invite" to add your first team member
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Pending Invitations Section */}
        {pendingInvitations.filter(inv => inv.status === 'pending').length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <View className="bg-white dark:bg-slate-900 rounded-xl p-5 mb-5">
              <View className="flex-row items-center gap-2 mb-4">
                <Clock size={20} color="#f59e0b" />
                <Text className="text-slate-900 dark:text-white font-bold text-lg">
                  Pending Invitations ({pendingInvitations.filter(inv => inv.status === 'pending').length})
                </Text>
              </View>

              {pendingInvitations.filter(inv => inv.status === 'pending').map((invitation, index) => (
                <View
                  key={invitation.id}
                  className={`py-3 ${index < pendingInvitations.filter(inv => inv.status === 'pending').length - 1
                      ? 'border-b border-slate-100 dark:border-slate-800'
                      : ''
                    }`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-slate-900 dark:text-white font-semibold">
                        {invitation.email}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">
                        {getRoleDisplayName(invitation.role)} • {invitation.function}
                      </Text>
                      <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                        Invited by {invitation.invitedBy} • {new Date(invitation.invitedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mt-2">
                    <Pressable
                      onPress={() => handleAcceptInvitation(invitation)}
                      className="flex-1 bg-emerald-500 py-2 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
                    >
                      <CheckCircle2 size={16} color="white" />
                      <Text className="text-white text-sm font-semibold">Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRejectInvitation(invitation)}
                      className="flex-1 bg-slate-200 dark:bg-slate-700 py-2 rounded-lg items-center active:opacity-80"
                    >
                      <Text className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Invite Team Member Modal */}
      <Modal visible={showInviteModal} transparent animationType="slide" onRequestClose={() => setShowInviteModal(false)}>
        <Pressable className="flex-1 bg-black/70" onPress={() => setShowInviteModal(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24 }}>
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-slate-900 dark:text-white text-xl font-bold">Invite Team Member</Text>
                <Pressable onPress={() => setShowInviteModal(false)} className="active:opacity-70">
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="gap-4">
                  <View>
                    <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                      Email Address
                    </Text>
                    <TextInput
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      placeholder="colleague@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View>
                    <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                      What role will they have?
                    </Text>
                    <View className="gap-2">
                      {(['Founder', 'CoFounder', 'FractionalExec', 'Apprentice'] as MemberRole[]).map((role) => {
                        const info = ROLE_INFO[role];
                        const IconComponent = info.icon;
                        const isSelected = inviteRole === role;

                        return (
                          <Pressable
                            key={role}
                            onPress={() => setInviteRole(role)}
                            className={`flex-row items-center p-3 rounded-xl border-2 ${isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                              } active:opacity-70`}
                          >
                            <View
                              className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                              style={{ backgroundColor: info.color + '20' }}
                            >
                              <IconComponent size={20} color={info.color} />
                            </View>
                            <View className="flex-1">
                              <Text className={`font-semibold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                {info.title}
                              </Text>
                              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5" numberOfLines={2}>
                                {info.description}
                              </Text>
                            </View>
                            {isSelected && (
                              <CheckCircle2 size={20} color="#3b82f6" />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View>
                    <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                      Primary Function
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {['Engineering', 'Sales', 'Marketing', 'Finance', 'Ops', 'Admin'].map((func) => (
                        <Pressable
                          key={func}
                          onPress={() => setInviteFunction(func)}
                          className={`px-4 py-2 rounded-lg border ${inviteFunction === func
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                            } active:opacity-70`}
                        >
                          <Text className={`text-sm font-medium ${inviteFunction === func
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-600 dark:text-slate-400'
                            }`}>
                            {func}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-2">
                    <View className="flex-row items-start gap-2">
                      <Mail size={16} color="#f59e0b" className="mt-0.5" />
                      <Text className="text-amber-700 dark:text-amber-400 text-xs flex-1">
                        An invitation email will be sent. The person can accept to join your team as a {getRoleDisplayName(inviteRole)}.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={handleSendInvite}
                    className="bg-blue-600 py-4 rounded-xl items-center flex-row justify-center gap-2 active:opacity-80 mt-2"
                  >
                    <Send size={20} color="white" />
                    <Text className="text-white font-bold text-base">Send Invitation</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Change Role Modal */}
      <Modal visible={showRoleChangeModal} transparent animationType="fade" onRequestClose={() => setShowRoleChangeModal(false)}>
        <Pressable className="flex-1 bg-black/70 items-center justify-center" onPress={() => setShowRoleChangeModal(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 mx-6" style={{ maxWidth: 400, width: 340 }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-900 dark:text-white text-xl font-bold">
                  Change Role
                </Text>
                <Pressable onPress={() => setShowRoleChangeModal(false)} className="active:opacity-70">
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>

              <Text className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Change <Text className="font-semibold">{memberToChangeRole?.name}</Text>'s role to:
              </Text>

              <View className="gap-2 mb-4">
                {(['Founder', 'CoFounder', 'FractionalExec', 'Apprentice'] as MemberRole[]).map((role) => {
                  const info = ROLE_INFO[role];
                  const IconComponent = info.icon;
                  const isSelected = newRole === role;
                  const isCurrent = memberToChangeRole?.role === role;

                  return (
                    <Pressable
                      key={role}
                      onPress={() => setNewRole(role)}
                      className={`flex-row items-center p-3 rounded-xl border-2 ${isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700'
                        } active:opacity-70`}
                    >
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: info.color + '20' }}
                      >
                        <IconComponent size={16} color={info.color} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className={`font-semibold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                            {info.title}
                          </Text>
                          {isCurrent && (
                            <View className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                                CURRENT
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {isSelected && (
                        <CheckCircle2 size={18} color="#3b82f6" />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowRoleChangeModal(false)}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-lg items-center active:opacity-80"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleChangeRole}
                  className="flex-1 bg-blue-600 py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
                >
                  <RefreshCw size={18} color="white" />
                  <Text className="text-white font-semibold">Update</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Remove Member Confirmation Modal */}
      <Modal visible={showRemoveModal} transparent animationType="fade" onRequestClose={() => setShowRemoveModal(false)}>
        <Pressable className="flex-1 bg-black/70 items-center justify-center" onPress={() => setShowRemoveModal(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 mx-6" style={{ maxWidth: 400 }}>
              <View className="items-center mb-4">
                <View className="bg-red-100 dark:bg-red-900/20 w-16 h-16 rounded-full items-center justify-center mb-3">
                  <AlertTriangle size={32} color="#ef4444" />
                </View>
                <Text className="text-slate-900 dark:text-white text-xl font-bold text-center">
                  Remove Team Member?
                </Text>
              </View>

              <Text className="text-slate-600 dark:text-slate-400 text-center mb-6">
                Are you sure you want to remove <Text className="font-semibold">{memberToRemove?.name}</Text> from your team? This action cannot be undone.
              </Text>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setShowRemoveModal(false);
                    setMemberToRemove(null);
                  }}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-lg items-center active:opacity-80"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmRemoveMember}
                  className="flex-1 bg-red-600 py-3 rounded-lg items-center flex-row justify-center gap-2 active:opacity-80"
                >
                  <Trash2 size={18} color="white" />
                  <Text className="text-white font-semibold">Remove</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
