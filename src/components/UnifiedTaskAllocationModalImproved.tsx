/**
 * UnifiedTaskAllocationModalImproved - Single source of truth for task assignment
 *
 * Consolidates:
 * - QuickAssignModal (direct assignment)
 * - UnifiedTaskAllocationModal (team management)
 *
 * Features:
 * - Full-screen, readable interface
 * - Consent-based assignment workflow
 * - Capacity visualization
 * - Add/remove team members
 * - Adjust allocations
 * - Clear commitment tracking
 */

import { View, Text, Modal, Pressable, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import {
  X, Search, UserPlus, UserMinus, Target, AlertTriangle,
  CheckCircle, TrendingUp, Calendar, Minus, Plus
} from 'lucide-react-native';
import type { OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useTaskAssignmentStore } from '@/lib/state/task-assignment-store';
import { useAppStore } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { lightImpact, heavyImpact } from '@/lib/haptics';
import { cn } from '@/lib/cn';

interface UnifiedTaskAllocationModalImprovedProps {
  visible: boolean;
  onClose: () => void;
  workPlan: WorkPlan;
}

interface MemberAllocation {
  memberId: string;
  memberName: string;
  squaresPerWeek: number;
  status: 'active' | 'pending' | 'none';
  capacity: {
    allocated: number;
    total: number;
    available: number;
  };
}

export function UnifiedTaskAllocationModalImproved({
  visible,
  onClose,
  workPlan,
}: UnifiedTaskAllocationModalImprovedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [proposedTU, setProposedTU] = useState(2);

  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const createAssignment = useTaskAssignmentStore(s => s.createAssignment);
  const currentMembership = useAppStore(s => s.currentMembership);
  const currentWorkspace = useAppStore(s => s.currentWorkspace);
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // Calculate member allocations
  const memberAllocations = useMemo((): MemberAllocation[] => {
    return members
      .filter(m => m.status === 'active' && m.role !== 'Founder')
      .map(member => {
        const totalCapacity =
          member.role === 'Apprentice' ? 15 : (member.daysPerWeek || 2) * 2;

        const allocatedTUs = workPlans
          .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
          .reduce((sum, wp) => {
            const allocation = wp.allocations?.find(a => a.memberId === member.id);
            return sum + (allocation?.squaresPerWeek || 0);
          }, 0);

        const currentAllocation = workPlan.allocations?.find(a => a.memberId === member.id);
        const isActive = !!currentAllocation;

        return {
          memberId: member.id,
          memberName: member.name,
          squaresPerWeek: currentAllocation?.squaresPerWeek || 0,
          status: (isActive ? 'active' : 'none') as 'active' | 'pending' | 'none',
          capacity: {
            allocated: allocatedTUs,
            total: totalCapacity,
            available: totalCapacity - allocatedTUs,
          },
        };
      })
      .filter(m => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return m.memberName.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        // Active members first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        // Then by available capacity
        return b.capacity.available - a.capacity.available;
      });
  }, [members, workPlans, workPlan.allocations, searchQuery]);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return memberAllocations.find(m => m.memberId === selectedMemberId);
  }, [selectedMemberId, memberAllocations]);

  const capacityImpact = useMemo(() => {
    if (!selectedMember) return null;

    const newAllocated = selectedMember.capacity.allocated + proposedTU;
    const utilizationPercent = Math.round((newAllocated / selectedMember.capacity.total) * 100);
    const isOverallocated = newAllocated > selectedMember.capacity.total;
    const available = selectedMember.capacity.total - newAllocated;

    return {
      newAllocated,
      utilizationPercent,
      isOverallocated,
      available,
      status: isOverallocated ? 'overallocated' : utilizationPercent >= 85 ? 'warning' : 'good',
    };
  }, [selectedMember, proposedTU]);

  const handleAddMember = async () => {
    if (!selectedMember || !currentMembership || !currentWorkspace) return;

    heavyImpact();

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    try {
      // Create new allocation
      const newAllocation = {
        memberId: member.id,
        memberName: member.name,
        squaresPerWeek: proposedTU,
        costPerSquare: member.costPerDay ? (member.costPerDay / ((member.daysPerWeek || 5) * 2)) : 0,
      };

      // Update work plan with new allocation
      const updatedAllocations = [...(workPlan.allocations || []), newAllocation];
      updateWorkPlan(workPlan.id, { allocations: updatedAllocations });

      // Create assignment record (consent-based)
      await createAssignment({
        workPlanId: workPlan.id,
        workspaceId: currentWorkspace.id,
        assignedTo: member.id,
        assignedBy: currentMembership.id,
        proposedAllocation: {
          squaresPerWeek: proposedTU,
          estimatedWeeks: workPlan.estimatedTimeUnits
            ? Math.ceil(workPlan.estimatedTimeUnits / proposedTU)
            : 1,
        },
        taskTitle: workPlan.title,
        taskDescription: workPlan.description || '',
        taskDueDate: workPlan.dueDate || '',
        taskEstimatedTUs: workPlan.estimatedTimeUnits || 0,
      });

      // Reset selection
      setSelectedMemberId(null);
      setProposedTU(2);
    } catch (error) {
      console.error('[UnifiedAllocation] Failed to add member:', error);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    heavyImpact();

    const updatedAllocations = (workPlan.allocations || []).filter(
      a => a.memberId !== memberId
    );
    updateWorkPlan(workPlan.id, { allocations: updatedAllocations });
  };

  const handleAdjustAllocation = (memberId: string, delta: number) => {
    lightImpact();

    const updatedAllocations = (workPlan.allocations || []).map(a => {
      if (a.memberId !== memberId) return a;
      const newSquares = Math.max(1, a.squaresPerWeek + delta);
      return { ...a, squaresPerWeek: newSquares };
    });

    updateWorkPlan(workPlan.id, { allocations: updatedAllocations });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
        {/* Header */}
        <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                Team Allocation
              </Text>
              <Text className="text-lg text-slate-600 dark:text-slate-400 mt-1" numberOfLines={2}>
                {workPlan.title}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                lightImpact();
                onClose();
              }}
              className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center active:opacity-70"
            >
              <X size={28} color="#64748b" />
            </Pressable>
          </View>

          {/* Task Summary */}
          <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 mt-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Target size={20} color="#64748b" />
                <Text className="text-base text-slate-600 dark:text-slate-400">
                  Estimated Effort
                </Text>
              </View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                {workPlan.estimatedTimeUnits || 0} TU
              </Text>
            </View>
            {workPlan.dueDate && (
              <View className="flex-row items-center justify-between mt-3">
                <View className="flex-row items-center gap-3">
                  <Calendar size={20} color="#64748b" />
                  <Text className="text-base text-slate-600 dark:text-slate-400">
                    Due Date
                  </Text>
                </View>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">
                  {new Date(workPlan.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          {/* Current Team */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Current Team ({(workPlan.allocations || []).length})
            </Text>

            {(workPlan.allocations || []).length === 0 ? (
              <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 items-center">
                <UserPlus size={48} color="#94a3b8" />
                <Text className="text-slate-500 dark:text-slate-400 text-base mt-3 text-center">
                  No team members assigned yet
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {(workPlan.allocations || []).map(allocation => {
                  const memberData = memberAllocations.find(m => m.memberId === allocation.memberId);
                  return (
                    <View
                      key={allocation.memberId}
                      className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border-l-4 border-blue-500"
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-xl font-bold text-slate-900 dark:text-white">
                            {allocation.memberName}
                          </Text>
                          {memberData && (
                            <Text className="text-base text-slate-600 dark:text-slate-400 mt-1">
                              {memberData.capacity.allocated}/{memberData.capacity.total} TU allocated
                            </Text>
                          )}
                        </View>
                        <Pressable
                          onPress={() => handleRemoveMember(allocation.memberId)}
                          className="bg-red-500 p-3 rounded-full active:opacity-70"
                        >
                          <UserMinus size={20} color="white" />
                        </Pressable>
                      </View>

                      {/* Allocation Adjuster */}
                      <View className="bg-white dark:bg-slate-800 rounded-xl p-4">
                        <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                          TIME UNITS PER WEEK
                        </Text>
                        <View className="flex-row items-center">
                          <Pressable
                            onPress={() => handleAdjustAllocation(allocation.memberId, -1)}
                            disabled={allocation.squaresPerWeek <= 1}
                            className={cn(
                              'p-3 rounded-lg',
                              allocation.squaresPerWeek <= 1
                                ? 'bg-slate-200 dark:bg-slate-700'
                                : 'bg-blue-500 active:opacity-70'
                            )}
                          >
                            <Minus size={24} color={allocation.squaresPerWeek <= 1 ? '#94a3b8' : 'white'} />
                          </Pressable>
                          <View className="flex-1 items-center">
                            <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                              {allocation.squaresPerWeek}
                            </Text>
                            <Text className="text-sm text-slate-500 dark:text-slate-400">
                              TU/week
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleAdjustAllocation(allocation.memberId, 1)}
                            className="bg-blue-500 p-3 rounded-lg active:opacity-70"
                          >
                            <Plus size={24} color="white" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Add New Member */}
          <View>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Add Team Member
            </Text>

            {/* Search */}
            <View className="mb-4">
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                <Search size={20} color="#94a3b8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search team members..."
                  placeholderTextColor="#94a3b8"
                  className="flex-1 ml-3 text-base text-slate-900 dark:text-white"
                />
              </View>
            </View>

            {/* Member Selection */}
            {selectedMember ? (
              <View className="gap-4">
                {/* Selected Member Card */}
                <View className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border-l-4 border-purple-500">
                  <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {selectedMember.memberName}
                  </Text>
                  <Text className="text-base text-slate-600 dark:text-slate-400">
                    Current: {selectedMember.capacity.allocated}/{selectedMember.capacity.total} TU
                    ({Math.round((selectedMember.capacity.allocated / selectedMember.capacity.total) * 100)}% utilized)
                  </Text>
                </View>

                {/* TU Selector */}
                <View>
                  <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">
                    Allocation (TU per week)
                  </Text>
                  <View className="flex-row gap-2">
                    {[1, 2, 3, 4, 5].map(tu => (
                      <Pressable
                        key={tu}
                        onPress={() => {
                          lightImpact();
                          setProposedTU(tu);
                        }}
                        className={cn(
                          'flex-1 py-4 rounded-xl',
                          proposedTU === tu
                            ? 'bg-purple-500'
                            : 'bg-slate-100 dark:bg-slate-800'
                        )}
                      >
                        <Text
                          className={cn(
                            'text-center font-bold text-xl',
                            proposedTU === tu
                              ? 'text-white'
                              : 'text-slate-600 dark:text-slate-400'
                          )}
                        >
                          {tu}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Capacity Impact */}
                {capacityImpact && (
                  <View
                    className={cn(
                      'rounded-xl p-5 border-2',
                      capacityImpact.status === 'overallocated'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        : capacityImpact.status === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                        : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                    )}
                  >
                    <View className="flex-row items-center gap-3 mb-2">
                      {capacityImpact.status === 'overallocated' ? (
                        <AlertTriangle size={24} color="#ef4444" />
                      ) : capacityImpact.status === 'warning' ? (
                        <AlertTriangle size={24} color="#f59e0b" />
                      ) : (
                        <CheckCircle size={24} color="#10b981" />
                      )}
                      <Text
                        className={cn(
                          'font-bold text-lg',
                          capacityImpact.status === 'overallocated'
                            ? 'text-red-700 dark:text-red-300'
                            : capacityImpact.status === 'warning'
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-emerald-700 dark:text-emerald-300'
                        )}
                      >
                        Capacity Impact
                      </Text>
                    </View>

                    <Text
                      className={cn(
                        'text-base mb-2',
                        capacityImpact.status === 'overallocated'
                          ? 'text-red-600 dark:text-red-400'
                          : capacityImpact.status === 'warning'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      After assignment: {capacityImpact.newAllocated}/{selectedMember.capacity.total} TU ({capacityImpact.utilizationPercent}%)
                    </Text>

                    {capacityImpact.isOverallocated ? (
                      <Text className="text-base text-red-600 dark:text-red-400 font-bold">
                        ⚠️ This would overallocate by {Math.abs(capacityImpact.available)} TU
                      </Text>
                    ) : (
                      <Text className="text-base text-emerald-600 dark:text-emerald-400">
                        ✓ {capacityImpact.available} TU would remain available
                      </Text>
                    )}
                  </View>
                )}

                {/* Actions */}
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      lightImpact();
                      setSelectedMemberId(null);
                      setProposedTU(2);
                    }}
                    className="flex-1 bg-slate-200 dark:bg-slate-700 py-5 rounded-xl"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 font-bold text-xl text-center">
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddMember}
                    className="flex-1 bg-blue-500 py-5 rounded-xl active:opacity-80"
                  >
                    <Text className="text-white font-bold text-xl text-center">
                      Add Member
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator>
                <View className="gap-3">
                  {memberAllocations
                    .filter(m => m.status !== 'active')
                    .map(member => {
                      const utilizationPercent = Math.round(
                        (member.capacity.allocated / member.capacity.total) * 100
                      );

                      return (
                        <Pressable
                          key={member.memberId}
                          onPress={() => {
                            lightImpact();
                            setSelectedMemberId(member.memberId);
                          }}
                          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 active:opacity-70"
                        >
                          <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {member.memberName}
                          </Text>
                          <View className="flex-row items-center justify-between">
                            <Text className="text-base text-slate-600 dark:text-slate-400">
                              {member.capacity.allocated}/{member.capacity.total} TU ({utilizationPercent}%)
                            </Text>
                            {member.capacity.available > 0 ? (
                              <View className="bg-emerald-500 px-3 py-1 rounded-full">
                                <Text className="text-white text-sm font-bold">
                                  {member.capacity.available} TU free
                                </Text>
                              </View>
                            ) : (
                              <View className="bg-red-500 px-3 py-1 rounded-full">
                                <Text className="text-white text-sm font-bold">
                                  Full
                                </Text>
                              </View>
                            )}
                          </View>
                        </Pressable>
                      );
                    })}

                  {memberAllocations.filter(m => m.status !== 'active').length === 0 && (
                    <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 items-center">
                      <Text className="text-slate-500 dark:text-slate-400 text-base text-center">
                        {searchQuery ? 'No members match your search' : 'All team members are already assigned'}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
