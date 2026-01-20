/**
 * TaskCardFull - Tier 3
 * Full detail/edit modal with all fields editable
 *
 * Shows: Everything including coordination cost, capacity warnings
 * This is a complex component - implementation will continue in iterations
 */

import { View, Text, Modal, ScrollView, Pressable, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { X, ChevronDown } from 'lucide-react-native';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import {
  TaskStatusBadge,
  TaskProgressBar,
  TaskPriorityIndicator,
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
          <View className="bg-white dark:bg-slate-800 mx-4 rounded-2xl overflow-hidden" style={{ maxHeight: '92%' }}>
            {/* Header */}
            <View className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex-row items-center justify-between">
              <Text className="text-white text-lg font-bold">Edit Task</Text>
              <Pressable onPress={onClose} className="p-1">
                <X size={24} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView className="p-5 gap-4">
              {/* Title */}
              <View className="gap-1">
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">Title</Text>
                <TextInput
                  value={editedTask.title}
                  onChangeText={(title) => setEditedTask({ ...editedTask, title })}
                  className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2"
                  placeholder="Task title"
                />
              </View>

              {/* Function & Status */}
              <View className="flex-row gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">Function</Text>
                  <View className="bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2">
                    <Text className="text-slate-900 dark:text-white text-sm">
                      {editedTask.function}
                    </Text>
                  </View>
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">Status</Text>
                  <View className="items-start">
                    <TaskStatusBadge status={editedTask.status} size="medium" />
                  </View>
                </View>
              </View>

              {/* Description */}
              <View className="gap-1">
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">Description</Text>
                <TextInput
                  value={editedTask.description}
                  onChangeText={(description) => setEditedTask({ ...editedTask, description })}
                  className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2"
                  placeholder="Task description"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Separator */}
              <View className="h-px bg-slate-300 dark:bg-slate-600" />

              {/* Progress */}
              <View className="gap-2">
                <Text className="text-slate-900 dark:text-white text-sm font-bold">PROGRESS</Text>
                <TaskProgressBar
                  completed={completed}
                  total={editedTask.estimatedTimeUnits}
                  showPercentage={true}
                />
              </View>

              {/* Separator */}
              <View className="h-px bg-slate-300 dark:bg-slate-600" />

              {/* Effort Estimate */}
              <View className="gap-2">
                <Text className="text-slate-900 dark:text-white text-sm font-bold">EFFORT ESTIMATE</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Total Time Units Required</Text>
                  <Text className="text-slate-500 dark:text-slate-500 text-[10px]">
                    💡 1 TU = 4 hours of focused work
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-slate-900 dark:text-white text-2xl font-bold">
                    {editedTask.estimatedTimeUnits} TU
                  </Text>
                </View>
                <View className="flex-row justify-between text-xs">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">
                    Completed: {completed} TU ({task.progress}%)
                  </Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">
                    Remaining: {remaining} TU
                  </Text>
                </View>
              </View>

              {/* Separator */}
              <View className="h-px bg-slate-300 dark:bg-slate-600" />

              {/* Team Allocation */}
              <View className="gap-3">
                <Text className="text-slate-900 dark:text-white text-sm font-bold">
                  TEAM ALLOCATION ({teamSize} members)
                </Text>
                {editedTask.allocations.map((allocation) => {
                  const member = members.find((m) => m.id === allocation.memberId);
                  if (!member) return null;

                  // Calculate member's total allocation across all tasks (simplified for now)
                  const memberAllocated = allocation.squaresPerWeek;
                  const memberCapacity = member.role === 'Founder' || member.role === 'Apprentice'
                    ? 10
                    : (member.daysPerWeek || 2) * 2;

                  return (
                    <View key={allocation.memberId} className="gap-2">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-slate-900 dark:text-white text-sm font-medium">
                          👤 {member.name}
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs">
                          {member.role} • {member.function}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-slate-600 dark:text-slate-400 text-xs">
                          TU per week: {allocation.squaresPerWeek}
                        </Text>
                      </View>
                      <MemberCapacityIndicator
                        allocatedTU={memberAllocated}
                        totalCapacity={memberCapacity}
                        showDetails={true}
                      />
                    </View>
                  );
                })}

                {/* Coordination Cost Display */}
                <View className="mt-2">
                  <CoordinationCostDisplay teamSize={teamSize} rawVelocity={rawVelocity} />
                </View>

                <View className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                  <Text className="text-blue-900 dark:text-blue-100 text-xs font-semibold">
                    📊 Estimated Completion: ~{estimatedWeeks.toFixed(1)} weeks ({formatTaskDate(estimatedDate)})
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View className="border-t border-slate-200 dark:border-slate-700 p-4 flex-row gap-3">
              <Pressable
                onPress={handleSave}
                className="flex-1 bg-blue-500 rounded-lg py-3 items-center active:opacity-70"
              >
                <Text className="text-white text-sm font-bold">Save Changes</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg py-3 items-center active:opacity-70"
              >
                <Text className="text-slate-900 dark:text-white text-sm font-bold">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
