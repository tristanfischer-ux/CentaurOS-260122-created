/**
 * AddResourceModal
 *
 * A streamlined modal for quickly adding team members to a task.
 * Shows available team members with their capacity and allows
 * one-tap assignment with a default 2 TU/week allocation.
 */

import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { useState, useMemo } from 'react';
import {
  X,
  UsersRound,
  Crown,
  Briefcase,
  GraduationCap,
  Plus,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import type { OrganizationMember } from '@/lib/organization-seed';

interface AddResourceModalProps {
  visible: boolean;
  onClose: () => void;
  task: WorkPlan | null;
  onAddMember?: (memberId: string, tuPerWeek: number) => void;
}

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

const ROLE_ICONS: Record<string, any> = {
  Founder: Crown,
  FractionalExec: Briefcase,
  Apprentice: GraduationCap,
};

// Get capacity per week based on role
const getCapacityPerWeek = (member: OrganizationMember): number => {
  if (member.role === 'Founder' || member.role === 'Apprentice') {
    return 10; // Normal capacity
  }
  // Fractional exec: days per week * 2 TU per day
  return (member.daysPerWeek || 2) * 2;
};

export function AddResourceModal({
  visible,
  onClose,
  task,
  onAddMember,
}: AddResourceModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [tuAllocation, setTuAllocation] = useState(2); // Default 2 TU/week

  const members = useOrganizationStore((s) => s.members);
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const updateWorkPlan = useWorkPlanStore((s) => s.updateWorkPlan);

  // Get active members not already assigned to this task
  const availableMembers = useMemo(() => {
    if (!task) return [];

    const assignedIds = new Set(task.allocations?.map((a) => a.memberId) || []);

    return members
      .filter((m) => m.status === 'active' && !assignedIds.has(m.id))
      .map((member) => {
        // Calculate available TU
        const capacity = getCapacityPerWeek(member);
        const allocated = workPlans
          .filter((wp) => wp.status !== 'completed' && wp.status !== 'abandoned')
          .reduce((sum, wp) => {
            const alloc = wp.allocations?.find((a) => a.memberId === member.id);
            return sum + (alloc?.squaresPerWeek || 0);
          }, 0);

        return {
          ...member,
          capacity,
          allocated,
          available: Math.max(0, capacity - allocated),
        };
      })
      .sort((a, b) => b.available - a.available); // Sort by most available
  }, [members, task, workPlans]);

  const selectedMember = availableMembers.find((m) => m.id === selectedMemberId);

  const handleAddResource = () => {
    if (!selectedMemberId || !task) return;

    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) return;

    // Create new allocation
    const newAllocation = {
      memberId: selectedMemberId,
      memberName: member.name,
      squaresPerWeek: tuAllocation,
      costPerSquare: member.costPerDay ? member.costPerDay / 2 : 0,
    };

    // Update task with new allocation
    const existingAllocations = task.allocations || [];
    updateWorkPlan(task.id, {
      allocations: [...existingAllocations, newAllocation],
      assignedMemberIds: [...(task.assignedMemberIds || []), selectedMemberId],
      allocatedTimeUnitsPerWeek:
        (task.allocatedTimeUnitsPerWeek || 0) + tuAllocation,
      status: task.status === 'not-started' ? 'in-progress' : task.status,
    });

    // Callback if provided
    if (onAddMember) {
      onAddMember(selectedMemberId, tuAllocation);
    }

    // Reset and close
    setSelectedMemberId(null);
    setTuAllocation(2);
    onClose();
  };

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '80%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center">
                  <UsersRound size={22} color="#3b82f6" />
                </View>
                <View>
                  <Text className="text-slate-900 dark:text-white font-bold text-lg">
                    Add Resource
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={1}>
                    {task.title}
                  </Text>
                </View>
              </View>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView className="px-5 py-4" contentContainerStyle={{ paddingBottom: 20 }}>
              <Text className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Select a team member to assign to this task
              </Text>

              {/* Team Members List */}
              {availableMembers.length === 0 ? (
                <View className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 items-center">
                  <AlertCircle size={32} color="#94a3b8" />
                  <Text className="text-slate-600 dark:text-slate-400 text-center mt-3">
                    All team members are already assigned to this task
                  </Text>
                </View>
              ) : (
                <View className="gap-2 mb-4">
                  {availableMembers.map((member) => {
                    const Icon = ROLE_ICONS[member.role] || Crown;
                    const color = ROLE_COLORS[member.role] || '#64748b';
                    const isSelected = selectedMemberId === member.id;
                    const hasCapacity = member.available > 0;

                    return (
                      <Pressable
                        key={member.id}
                        onPress={() => hasCapacity && setSelectedMemberId(member.id)}
                        disabled={!hasCapacity}
                        className={`flex-row items-center p-4 rounded-xl border-2 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : hasCapacity
                            ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 opacity-50'
                        }`}
                      >
                        {/* Avatar */}
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: color + '20' }}
                        >
                          <Icon size={20} color={color} />
                        </View>

                        {/* Info */}
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-slate-900 dark:text-white font-semibold">
                              {member.name}
                            </Text>
                            {task.function === member.function && (
                              <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                                <Text className="text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                  FIT
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-slate-500 dark:text-slate-400 text-sm">
                            {member.role === 'FractionalExec' ? 'Executive' : member.role} • {member.function}
                          </Text>
                          <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                            {member.available} TU available this week
                          </Text>
                        </View>

                        {/* Selection indicator */}
                        {isSelected ? (
                          <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                            <Check size={18} color="white" />
                          </View>
                        ) : hasCapacity ? (
                          <View className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full items-center justify-center">
                            <Plus size={18} color="#64748b" />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* TU Allocation Selector (only show when member selected) */}
              {selectedMember && (
                <View className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold mb-3">
                    TIME UNITS PER WEEK
                  </Text>
                  <View className="flex-row gap-2">
                    {[1, 2, 3, 4, 5].map((tu) => {
                      const isDisabled = tu > selectedMember.available;
                      const isSelected = tuAllocation === tu;

                      return (
                        <Pressable
                          key={tu}
                          onPress={() => !isDisabled && setTuAllocation(tu)}
                          disabled={isDisabled}
                          className={`flex-1 py-3 rounded-lg items-center ${
                            isSelected
                              ? 'bg-blue-500'
                              : isDisabled
                              ? 'bg-slate-200 dark:bg-slate-700 opacity-50'
                              : 'bg-white dark:bg-slate-700'
                          }`}
                        >
                          <Text
                            className={`font-bold ${
                              isSelected
                                ? 'text-white'
                                : isDisabled
                                ? 'text-slate-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {tu}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-2">
                    {tuAllocation} TU = {tuAllocation * 4} hours/week
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Action Button */}
            <View className="px-5 py-4 border-t border-slate-200 dark:border-slate-700">
              <Pressable
                onPress={handleAddResource}
                disabled={!selectedMemberId}
                className={`py-4 rounded-xl items-center ${
                  selectedMemberId
                    ? 'bg-blue-500 active:opacity-80'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <View className="flex-row items-center gap-2">
                  <Plus size={20} color={selectedMemberId ? 'white' : '#94a3b8'} />
                  <Text
                    className={`font-semibold ${
                      selectedMemberId ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    Add Resource
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
