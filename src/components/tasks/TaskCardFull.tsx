/**
 * TaskCardFull - Tier 3
 * Full detail/edit modal with comprehensive view
 *
 * Shows: EVERYTHING - all fields, coordination cost, capacity warnings, full editing
 * This is the complete task overview with editing capabilities
 */

import { View, Text, Modal, ScrollView, Pressable, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { X, Calendar, User } from 'lucide-react-native';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import {
  TaskStatusBadge,
  TaskProgressBar,
  TaskPriorityIndicator,
  TaskAvatarStack,
  CoordinationCostDisplay,
  MemberCapacityIndicator,
} from './index';
import {
  calculateNetVelocity,
  calculateEstimatedWeeks,
  calculateEstimatedDate,
  formatTaskDate,
} from '@/lib/task-calculations';

interface TaskCardFullProps {
  task: WorkPlan;
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<WorkPlan>) => void;
}

export function TaskCardFull({ task, visible, onClose, onSave }: TaskCardFullProps) {
  const members = useOrganizationStore((s) => s.members);

  // Local state for editing
  const [editedTask, setEditedTask] = useState(task);

  // Calculate effort metrics
  const rawVelocity = editedTask.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
  const teamSize = editedTask.allocations.length;
  const netVelocity = calculateNetVelocity(teamSize, rawVelocity);
  const completed = editedTask.tusExpended || 0;
  const remaining = Math.max(0, editedTask.estimatedTimeUnits - completed);
  const estimatedWeeks = calculateEstimatedWeeks(remaining, netVelocity);
  const estimatedDate = calculateEstimatedDate(new Date(), estimatedWeeks);

  // Check if overdue
  const dueDate = new Date(editedTask.dueDate);
  const isOverdue = dueDate < new Date() && editedTask.status !== 'completed';

  // Priority placeholder
  const priority: 'normal' | 'high' | 'critical' = 'normal';

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-900/95">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}
        >
          <View className="bg-white dark:bg-slate-800 mx-4 rounded-2xl overflow-hidden">
            {/* Header with avatars */}
            <View className="bg-blue-600 dark:bg-blue-700 p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <TaskStatusBadge status={editedTask.status} size="medium" />
                  <Text className="text-blue-100 text-xs font-medium">{editedTask.function}</Text>
                </View>
                <Pressable onPress={onClose} className="p-1">
                  <X size={24} color="#ffffff" />
                </Pressable>
              </View>

              <View className="flex-row items-start justify-between gap-3">
                <Text className="flex-1 text-white text-xl font-bold">
                  {editedTask.title}
                </Text>
                <View className="flex-row items-center gap-2">
                  <TaskAvatarStack memberIds={editedTask.allocations.map(a => a.memberId)} maxVisible={3} size={28} />
                  <TaskPriorityIndicator priority={priority} size={24} />
                </View>
              </View>

              {/* Quick stats bar */}
              <View className="flex-row items-center gap-4 mt-4 bg-white/10 rounded-lg p-3">
                <View className="flex-1">
                  <Text className="text-blue-200 text-[10px]">Progress</Text>
                  <Text className="text-white text-lg font-bold">{task.progress}%</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-blue-200 text-[10px]">TU/Week</Text>
                  <Text className="text-white text-lg font-bold">{netVelocity.toFixed(1)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-blue-200 text-[10px]">Weeks Left</Text>
                  <Text className="text-white text-lg font-bold">~{estimatedWeeks.toFixed(1)}</Text>
                </View>
              </View>
            </View>

            <ScrollView className="p-5 gap-5" style={{ maxHeight: 500 }}>
              {/* Description */}
              {editedTask.description && (
                <View className="gap-2">
                  <Text className="text-slate-900 dark:text-white text-sm font-bold">DESCRIPTION</Text>
                  <Text className="text-slate-700 dark:text-slate-300 text-sm">
                    {editedTask.description}
                  </Text>
                </View>
              )}

              {/* Timeline */}
              <View className="gap-3">
                <Text className="text-slate-900 dark:text-white text-sm font-bold">TIMELINE</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Calendar size={14} color="#64748B" />
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">Start Date</Text>
                    </View>
                    <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                      {formatTaskDate(new Date(editedTask.startDate))}
                    </Text>
                  </View>
                  <View className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Calendar size={14} color="#64748B" />
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">Due Date</Text>
                    </View>
                    <Text className={`text-sm font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {formatTaskDate(dueDate)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress Details */}
              <View className="gap-3">
                <Text className="text-slate-900 dark:text-white text-sm font-bold">PROGRESS</Text>
                <TaskProgressBar
                  completed={completed}
                  total={editedTask.estimatedTimeUnits}
                  showPercentage={true}
                />
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-slate-600 dark:text-slate-400 text-xs">Completed</Text>
                    <Text className="text-slate-900 dark:text-white text-lg font-bold">{completed} TU</Text>
                  </View>
                  <View>
                    <Text className="text-slate-600 dark:text-slate-400 text-xs">Total</Text>
                    <Text className="text-slate-900 dark:text-white text-lg font-bold">{editedTask.estimatedTimeUnits} TU</Text>
                  </View>
                  <View>
                    <Text className="text-slate-600 dark:text-slate-400 text-xs">Remaining</Text>
                    <Text className="text-slate-900 dark:text-white text-lg font-bold">{remaining} TU</Text>
                  </View>
                </View>
              </View>

              {/* Separator */}
              <View className="h-px bg-slate-300 dark:bg-slate-600" />

              {/* Team Allocation with capacity warnings */}
              <View className="gap-3">
                <Text className="text-slate-900 dark:text-white text-sm font-bold">
                  TEAM ALLOCATION ({teamSize} {teamSize === 1 ? 'member' : 'members'})
                </Text>
                {editedTask.allocations.map((allocation) => {
                  const member = members.find((m) => m.id === allocation.memberId);
                  const memberName = member?.name || `User ${allocation.memberId.slice(0, 4)}`;
                  const memberRole = member?.role || 'Unknown';
                  const memberFunction = member?.function || 'Unknown';

                  // Calculate member's capacity (simplified)
                  const memberCapacity = member?.role === 'Founder' || member?.role === 'Apprentice'
                    ? 10
                    : (member?.daysPerWeek || 2) * 2;

                  return (
                    <View key={allocation.memberId} className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 gap-2">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <User size={16} color="#64748B" />
                          <View>
                            <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                              {memberName}
                            </Text>
                            <Text className="text-slate-600 dark:text-slate-400 text-xs">
                              {memberRole} • {memberFunction}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-slate-900 dark:text-white text-lg font-bold">
                            {allocation.squaresPerWeek} TU/wk
                          </Text>
                        </View>
                      </View>
                      <MemberCapacityIndicator
                        allocatedTU={allocation.squaresPerWeek}
                        totalCapacity={memberCapacity}
                        showDetails={true}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Coordination Cost - ONLY SHOWN IN FULL VIEW */}
              <View className="gap-3">
                <Text className="text-slate-900 dark:text-white text-sm font-bold">
                  COORDINATION COST
                </Text>
                <CoordinationCostDisplay teamSize={teamSize} rawVelocity={rawVelocity} />
              </View>

              {/* Estimated Completion */}
              <View className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                <Text className="text-blue-900 dark:text-blue-100 text-sm font-semibold mb-1">
                  📊 Estimated Completion
                </Text>
                <Text className="text-blue-800 dark:text-blue-200 text-lg font-bold">
                  ~{estimatedWeeks.toFixed(1)} weeks ({formatTaskDate(estimatedDate)})
                </Text>
                <Text className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  Based on {netVelocity.toFixed(1)} TU/week net velocity with {teamSize} team {teamSize === 1 ? 'member' : 'members'}
                </Text>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View className="border-t border-slate-200 dark:border-slate-700 p-4 flex-row gap-3">
              <Pressable
                onPress={() => {
                  // Mark as done
                  setEditedTask({ ...editedTask, status: 'completed', progress: 100 });
                  handleSave();
                }}
                className="flex-1 bg-green-500 rounded-lg py-3 items-center active:opacity-70"
              >
                <Text className="text-white text-sm font-bold">Mark as Done</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg py-3 items-center active:opacity-70"
              >
                <Text className="text-slate-900 dark:text-white text-sm font-bold">Close</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
