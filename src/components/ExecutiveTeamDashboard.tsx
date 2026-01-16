/**
 * Executive Team Dashboard
 *
 * Shows executives their team roster, availability, and utilization.
 * Allows them to request resource allocation from available apprentices.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  UserPlus,
  Clock,
  TrendingUp,
  ChevronRight,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useAllocationRequestStore } from '@/lib/state/allocation-request-store';
import { useCurrentMembership } from '@/lib/state/app-store';
import { usePermissions } from '@/lib/permissions';
import type { OrganizationMember } from '@/lib/organization-seed';

interface TeamMemberCardProps {
  member: OrganizationMember;
  utilization: number;
  allocatedTU: number;
  availableTU: number;
  isDirectReport: boolean;
  onRequestAllocation: () => void;
  canViewCosts: boolean;
}

function TeamMemberCard({
  member,
  utilization,
  allocatedTU,
  availableTU,
  isDirectReport,
  onRequestAllocation,
  canViewCosts,
}: TeamMemberCardProps) {
  const utilizationColor =
    utilization >= 90
      ? '#ef4444'
      : utilization >= 70
      ? '#f59e0b'
      : utilization >= 40
      ? '#10b981'
      : '#3b82f6';

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder':
        return '#8b5cf6';
      case 'FractionalExec':
        return '#3b82f6';
      case 'Apprentice':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  return (
    <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 border border-gray-200 dark:border-slate-700">
      <View className="flex-row items-center justify-between">
        {/* Avatar & Info */}
        <View className="flex-row items-center flex-1">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: getRoleColor(member.role) + '20' }}
          >
            <Text
              className="font-bold text-base"
              style={{ color: getRoleColor(member.role) }}
            >
              {getInitials(member.name)}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-gray-900 dark:text-white font-semibold">
                {member.name}
              </Text>
              {isDirectReport && (
                <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                  <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    DIRECT
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-gray-500 dark:text-slate-400 text-sm">
              {member.function}
            </Text>
            {canViewCosts && member.costPerDay && (
              <Text className="text-gray-400 dark:text-slate-500 text-xs">
                £{member.costPerDay}/day
              </Text>
            )}
          </View>
        </View>

        {/* Utilization */}
        <View className="items-end">
          <View className="flex-row items-center gap-1">
            <Text
              className="font-bold text-lg"
              style={{ color: utilizationColor }}
            >
              {utilization}%
            </Text>
          </View>
          <Text className="text-gray-500 dark:text-slate-400 text-xs">
            {allocatedTU}□ / {allocatedTU + availableTU}□
          </Text>
        </View>
      </View>

      {/* Utilization Bar */}
      <View className="mt-3">
        <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(utilization, 100)}%`,
              backgroundColor: utilizationColor,
            }}
          />
        </View>
      </View>

      {/* Request Allocation Button (for available apprentices) */}
      {member.role === 'Apprentice' && availableTU > 0 && (
        <Pressable
          onPress={onRequestAllocation}
          className="mt-3 flex-row items-center justify-center bg-blue-50 dark:bg-blue-900/20 py-2 px-3 rounded-lg active:opacity-80"
        >
          <UserPlus size={14} color="#3b82f6" />
          <Text className="text-blue-600 dark:text-blue-400 font-medium text-sm ml-2">
            Request {availableTU}□ Available
          </Text>
        </Pressable>
      )}
    </View>
  );
}

interface AllocationRequestModalProps {
  visible: boolean;
  onClose: () => void;
  apprentice: OrganizationMember | null;
  availableTU: number;
}

function AllocationRequestModal({
  visible,
  onClose,
  apprentice,
  availableTU,
}: AllocationRequestModalProps) {
  const [timeUnits, setTimeUnits] = useState('2');
  const [duration, setDuration] = useState('');
  const [justification, setJustification] = useState('');
  const [taskTitle, setTaskTitle] = useState('');

  const membership = useCurrentMembership();
  const createRequest = useAllocationRequestStore((s) => s.createRequest);
  const needsApproval = useAllocationRequestStore((s) => s.needsApproval);

  const currentMember = useOrganizationStore((s) =>
    s.members.find((m) => m.id === membership?.userId)
  );

  const isDirectReport = currentMember?.manages?.includes(apprentice?.id ?? '') ?? false;
  const requestedTU = parseInt(timeUnits) || 0;
  const requiresApproval = needsApproval(
    currentMember?.id ?? '',
    apprentice?.id ?? '',
    isDirectReport,
    requestedTU
  );

  const handleSubmit = () => {
    if (!apprentice || !currentMember || !justification.trim()) return;

    createRequest({
      requesterId: currentMember.id,
      requesterName: currentMember.name,
      requesterRole: 'FractionalExec',
      apprenticeId: apprentice.id,
      apprenticeName: apprentice.name,
      taskTitle: taskTitle.trim() || undefined,
      timeUnitsPerWeek: requestedTU,
      durationWeeks: duration ? parseInt(duration) : undefined,
      justification: justification.trim(),
    });

    // Reset and close
    setTimeUnits('2');
    setDuration('');
    setJustification('');
    setTaskTitle('');
    onClose();
  };

  if (!apprentice) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <Text className="text-gray-900 dark:text-white font-bold text-lg">
                Request Allocation
              </Text>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="p-4">
              {/* Apprentice Info */}
              <View className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2">
                  REQUESTING ALLOCATION FROM
                </Text>
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {apprentice.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {apprentice.name}
                    </Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-sm">
                      {apprentice.function} • {availableTU}□ available
                    </Text>
                  </View>
                </View>
              </View>

              {/* Approval Notice */}
              <View
                className={`rounded-xl p-3 mb-4 flex-row items-center ${
                  requiresApproval
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : 'bg-green-50 dark:bg-green-900/20'
                }`}
              >
                {requiresApproval ? (
                  <>
                    <AlertCircle size={16} color="#f59e0b" />
                    <Text className="text-amber-700 dark:text-amber-400 text-sm ml-2 flex-1">
                      This request requires founder approval
                    </Text>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#10b981" />
                    <Text className="text-green-700 dark:text-green-400 text-sm ml-2 flex-1">
                      Auto-approved (delegation enabled)
                    </Text>
                  </>
                )}
              </View>

              {/* Time Units */}
              <View className="mb-4">
                <Text className="text-gray-700 dark:text-slate-300 font-medium mb-2">
                  Time Units per Week
                </Text>
                <View className="flex-row gap-2">
                  {[2, 4, 6, 8].map((tu) => (
                    <Pressable
                      key={tu}
                      onPress={() => setTimeUnits(tu.toString())}
                      className={`flex-1 py-3 rounded-xl items-center ${
                        timeUnits === tu.toString()
                          ? 'bg-blue-500'
                          : 'bg-gray-100 dark:bg-slate-800'
                      }`}
                    >
                      <Text
                        className={`font-bold ${
                          timeUnits === tu.toString()
                            ? 'text-white'
                            : 'text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        {tu}□
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Duration */}
              <View className="mb-4">
                <Text className="text-gray-700 dark:text-slate-300 font-medium mb-2">
                  Duration (weeks, optional)
                </Text>
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="e.g., 4"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                />
              </View>

              {/* Task Title */}
              <View className="mb-4">
                <Text className="text-gray-700 dark:text-slate-300 font-medium mb-2">
                  For Task (optional)
                </Text>
                <TextInput
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder="e.g., Sales Demo Automation"
                  placeholderTextColor="#94a3b8"
                  className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                />
              </View>

              {/* Justification */}
              <View className="mb-6">
                <Text className="text-gray-700 dark:text-slate-300 font-medium mb-2">
                  Justification *
                </Text>
                <TextInput
                  value={justification}
                  onChangeText={setJustification}
                  placeholder="Why do you need this allocation?"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white min-h-[100px]"
                />
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={!justification.trim()}
                className={`flex-row items-center justify-center py-4 rounded-xl mb-6 ${
                  justification.trim()
                    ? 'bg-blue-500 active:bg-blue-600'
                    : 'bg-gray-300 dark:bg-slate-700'
                }`}
              >
                <Send size={18} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  {requiresApproval ? 'Submit Request' : 'Allocate Now'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ExecutiveTeamDashboard() {
  const [selectedApprentice, setSelectedApprentice] = useState<OrganizationMember | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);

  const membership = useCurrentMembership();
  const members = useOrganizationStore((s) => s.members);
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const { canViewPersonnelCosts, role } = usePermissions();

  const currentMember = useMemo(
    () => members.find((m) => m.id === membership?.userId),
    [members, membership]
  );

  // Get team members (direct reports + other apprentices)
  const teamData = useMemo(() => {
    if (!currentMember) return { directReports: [], otherApprentices: [] };

    const directReportIds = currentMember.manages ?? [];
    const directReports = members.filter((m) => directReportIds.includes(m.id));
    const otherApprentices = members.filter(
      (m) =>
        m.role === 'Apprentice' &&
        !directReportIds.includes(m.id) &&
        m.status === 'active'
    );

    return { directReports, otherApprentices };
  }, [members, currentMember]);

  // Calculate utilization for each member
  const getMemberUtilization = (member: OrganizationMember) => {
    const memberAllocations = workPlans.flatMap((wp) =>
      (wp.allocations ?? []).filter((a) => a.memberId === member.id)
    );

    const totalAllocated = memberAllocations.reduce(
      (sum, a) => sum + (a.squaresPerWeek ?? 0),
      0
    );

    // Assume 40 TU per week capacity (8 per day, 5 days)
    const capacity = 40;
    const utilization = Math.round((totalAllocated / capacity) * 100);
    const available = Math.max(0, capacity - totalAllocated);

    return { utilization, allocated: totalAllocated, available };
  };

  const handleRequestAllocation = (apprentice: OrganizationMember) => {
    setSelectedApprentice(apprentice);
    setShowAllocationModal(true);
  };

  if (role !== 'FractionalExec') return null;

  const { directReports, otherApprentices } = teamData;

  return (
    <View className="flex-1">
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 20,
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 16,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
            <Users size={24} color="white" />
          </View>
          <View>
            <Text className="text-white/80 text-sm">Your Team</Text>
            <Text className="text-white font-bold text-xl">
              {directReports.length} Direct Report{directReports.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-4 mt-4">
          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <Text className="text-white/70 text-xs">Avg Utilization</Text>
            <Text className="text-white font-bold text-lg">
              {directReports.length > 0
                ? Math.round(
                    directReports.reduce(
                      (sum, m) => sum + getMemberUtilization(m).utilization,
                      0
                    ) / directReports.length
                  )
                : 0}
              %
            </Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-3">
            <Text className="text-white/70 text-xs">Available Capacity</Text>
            <Text className="text-white font-bold text-lg">
              {directReports.reduce(
                (sum, m) => sum + getMemberUtilization(m).available,
                0
              )}
              □
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-4">
        {/* Direct Reports */}
        {directReports.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-3">
              YOUR DIRECT REPORTS
            </Text>
            {directReports.map((member) => {
              const { utilization, allocated, available } = getMemberUtilization(member);
              return (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  utilization={utilization}
                  allocatedTU={allocated}
                  availableTU={available}
                  isDirectReport
                  onRequestAllocation={() => handleRequestAllocation(member)}
                  canViewCosts={canViewPersonnelCosts}
                />
              );
            })}
          </View>
        )}

        {/* Other Available Apprentices */}
        {otherApprentices.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-3">
              OTHER AVAILABLE APPRENTICES
            </Text>
            <Text className="text-gray-400 dark:text-slate-500 text-xs mb-3">
              Request allocation (requires founder approval)
            </Text>
            {otherApprentices.map((member) => {
              const { utilization, allocated, available } = getMemberUtilization(member);
              return (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  utilization={utilization}
                  allocatedTU={allocated}
                  availableTU={available}
                  isDirectReport={false}
                  onRequestAllocation={() => handleRequestAllocation(member)}
                  canViewCosts={canViewPersonnelCosts}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Allocation Request Modal */}
      <AllocationRequestModal
        visible={showAllocationModal}
        onClose={() => {
          setShowAllocationModal(false);
          setSelectedApprentice(null);
        }}
        apprentice={selectedApprentice}
        availableTU={
          selectedApprentice
            ? getMemberUtilization(selectedApprentice).available
            : 0
        }
      />
    </View>
  );
}
