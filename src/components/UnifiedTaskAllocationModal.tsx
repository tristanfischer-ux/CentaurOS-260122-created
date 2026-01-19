/**
 * UnifiedTaskAllocationModal - Redesigned to match PersonDetailsModal aesthetic
 * Clean, elegant interface for viewing and editing task details
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import {
  X, Calendar, Clock, Users, Target, ChevronRight, Crown, Briefcase, GraduationCap,
} from 'lucide-react-native';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { router } from 'expo-router';

interface Props {
  visible: boolean;
  onClose: () => void;
  workPlan: WorkPlan | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  'not-started': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', badge: '#6b7280' },
  'in-progress': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', badge: '#3b82f6' },
  'completed': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', badge: '#10b981' },
  'blocked': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', badge: '#ef4444' },
  'abandoned': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-500', badge: '#6b7280' },
};

const FUNCTION_COLORS: Record<string, string> = {
  'Engineering': '#8b5cf6',
  'Sales': '#3b82f6',
  'Marketing': '#ec4899',
  'Finance': '#10b981',
  'Ops': '#f59e0b',
  'Admin': '#6b7280',
};

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

export function UnifiedTaskAllocationModal({ visible, onClose, workPlan }: Props) {
  const members = useOrganizationStore(s => s.members);

  // Get assigned team members
  const assignedMembers = useMemo(() => {
    if (!workPlan) return [];
    const memberIds = workPlan.assignedMemberIds || [];
    return memberIds
      .map(id => members.find(m => m.id === id))
      .filter((m): m is NonNullable<typeof m> => m !== undefined);
  }, [workPlan, members]);

  if (!workPlan || !visible) return null;

  const statusConfig = STATUS_COLORS[workPlan.status] || STATUS_COLORS['not-started'];
  const functionColor = FUNCTION_COLORS[workPlan.function] || '#8b5cf6';

  // Calculate metrics
  const totalAllocatedPerWeek = workPlan.allocations?.reduce((sum, a) => sum + (a.squaresPerWeek || 0), 0) || 0;
  const weeksToComplete = totalAllocatedPerWeek > 0 ? Math.ceil(workPlan.estimatedTimeUnits / totalAllocatedPerWeek) : 0;
  const completedTUs = Math.round((workPlan.progress / 100) * workPlan.estimatedTimeUnits);
  const remainingTUs = workPlan.estimatedTimeUnits - completedTUs;

  const handleEdit = () => {
    onClose();
    router.push({
      pathname: '/(tabs)/tasks',
      params: { selectedTaskId: workPlan.id },
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {/* Header Section */}
              <View className="bg-slate-50 dark:bg-slate-800 px-6 pt-6 pb-6">
                {/* Close Button */}
                <Pressable
                  onPress={onClose}
                  className="absolute top-4 right-4 z-10 bg-white dark:bg-slate-700 rounded-full p-2 active:opacity-70"
                >
                  <X size={20} color="#6b7280" />
                </Pressable>

                {/* Task Icon/Status */}
                <View className="items-center mb-4">
                  <View
                    className={`w-20 h-20 rounded-full items-center justify-center mb-3 ${statusConfig.bg}`}
                  >
                    <Target size={32} color={statusConfig.badge} />
                  </View>
                  <Text className="text-slate-900 dark:text-white text-xl font-bold text-center px-4">
                    {workPlan.title}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-3">
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: functionColor + '30' }}
                    >
                      <Text className="font-semibold text-sm" style={{ color: functionColor }}>
                        {workPlan.function}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${statusConfig.bg}`}>
                      <Text className={`font-semibold text-sm ${statusConfig.text}`}>
                        {workPlan.status.replace('-', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Key Metrics - 3 columns */}
                <View className="flex-row justify-center gap-6 mt-2">
                  <View className="items-center">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">Progress</Text>
                    <Text className="text-slate-900 dark:text-white font-semibold text-base">
                      {workPlan.progress}%
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">TU Allocated</Text>
                    <Text className="text-slate-900 dark:text-white font-semibold text-base">
                      {totalAllocatedPerWeek}/wk
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">Timeline</Text>
                    <Text className="text-slate-900 dark:text-white font-semibold text-base">
                      {weeksToComplete > 0 ? `${weeksToComplete} wks` : 'TBD'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              {workPlan.description && (
                <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <Text className="text-slate-700 dark:text-slate-300 text-sm leading-5">
                    {workPlan.description}
                  </Text>
                </View>
              )}

              {/* Timeline Section */}
              <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <View className="flex-row items-center gap-2 mb-3">
                  <Calendar size={18} color="#3b82f6" />
                  <Text className="text-slate-900 dark:text-white font-bold text-sm">
                    Timeline
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">Start Date</Text>
                    <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                      {workPlan.startDate ? new Date(workPlan.startDate).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      }) : 'Not set'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">Due Date</Text>
                    <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                      {workPlan.dueDate ? new Date(workPlan.dueDate).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      }) : 'Not set'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Time Units Section */}
              <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <View className="flex-row items-center gap-2 mb-3">
                  <Clock size={18} color="#10b981" />
                  <Text className="text-slate-900 dark:text-white font-bold text-sm">
                    Time Units
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">Total Required</Text>
                    <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                      {workPlan.estimatedTimeUnits} TU
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">Completed</Text>
                    <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                      {completedTUs} TU
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">Remaining</Text>
                    <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                      {remainingTUs} TU
                    </Text>
                  </View>
                </View>
              </View>

              {/* Team Section */}
              {assignedMembers.length > 0 && (
                <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Users size={18} color="#8b5cf6" />
                    <Text className="text-slate-900 dark:text-white font-bold text-sm">
                      Team ({assignedMembers.length})
                    </Text>
                  </View>
                  <View className="gap-2">
                    {assignedMembers.map((member) => {
                      const allocation = workPlan.allocations?.find(a => a.memberId === member.id);
                      const memberTUsPerWeek = allocation?.squaresPerWeek || 0;
                      const roleColor = ROLE_COLORS[member.role] || '#6b7280';

                      return (
                        <View
                          key={member.id}
                          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex-row items-center justify-between"
                        >
                          <View className="flex-row items-center gap-3 flex-1">
                            {/* Avatar */}
                            <View
                              className="w-10 h-10 rounded-full items-center justify-center"
                              style={{ backgroundColor: roleColor + '30' }}
                            >
                              <Text className="font-bold text-xs" style={{ color: roleColor }}>
                                {getInitials(member.name)}
                              </Text>
                            </View>
                            {/* Info */}
                            <View className="flex-1">
                              <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                                {member.name}
                              </Text>
                              <View className="flex-row items-center gap-1">
                                {member.role === 'Founder' && <Crown size={10} color={roleColor} />}
                                {member.role === 'FractionalExec' && <Briefcase size={10} color={roleColor} />}
                                {member.role === 'Apprentice' && <GraduationCap size={10} color={roleColor} />}
                                <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                  {member.role === 'FractionalExec' ? 'Executive' : member.role}
                                </Text>
                              </View>
                            </View>
                          </View>
                          {/* TU Allocation */}
                          <View className="items-end">
                            <Text className="text-slate-900 dark:text-white font-bold text-sm">
                              {memberTUsPerWeek} TU
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs">
                              per week
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Edit Button */}
              <View className="px-6 pt-4">
                <Pressable
                  onPress={handleEdit}
                  className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center gap-2 active:opacity-80"
                >
                  <Text className="text-white font-semibold text-base">Edit Task Details</Text>
                  <ChevronRight size={20} color="white" />
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
