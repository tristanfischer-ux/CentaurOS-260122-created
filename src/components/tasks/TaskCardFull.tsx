/**
 * TaskCardFull - Tier 3
 * Full detail/edit modal - ADDITIVE from Medium view
 *
 * Shows: Everything from Medium view + Coordination cost + Enhanced editing UI
 * This builds on Medium view with additional details, not a replacement
 */

import { View, Text, Modal, ScrollView, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { X, Calendar, User, Edit3 } from 'lucide-react-native';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import {
  TaskStatusBadge,
  TaskProgressBar,
  TaskPriorityIndicator,
  TaskAvatarStack,
  CoordinationCostDisplay,
  MemberCapacityIndicator,
  TaskStatusDot,
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
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

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
  const daysOverdue = isOverdue
    ? Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Priority placeholder
  const priority: 'normal' | 'high' | 'critical' = 'normal';

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '95%' }}>
          <ScrollView
            className="bg-white dark:bg-slate-900 rounded-t-3xl"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="p-5 gap-4">
              {/* Header - Same as Medium view */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <TaskStatusBadge status={editedTask.status} size="small" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    {editedTask.function}
                  </Text>
                </View>
                <Pressable onPress={onClose} className="p-1">
                  <X size={24} color="#64748B" />
                </Pressable>
              </View>

              {/* Title with avatars - EDITABLE with indicator */}
              <View className="gap-2">
                <View className="flex-row items-start justify-between gap-2">
                  {editingTitle ? (
                    <TextInput
                      value={editedTask.title}
                      onChangeText={(title) => setEditedTask({ ...editedTask, title })}
                      onBlur={() => setEditingTitle(false)}
                      autoFocus
                      className="flex-1 text-slate-900 dark:text-white text-lg font-bold bg-slate-100 dark:bg-slate-700 rounded px-2 py-1"
                    />
                  ) : (
                    <Pressable onPress={() => setEditingTitle(true)} className="flex-1 flex-row items-center gap-2">
                      <Text className="flex-1 text-slate-900 dark:text-white text-lg font-bold">
                        {editedTask.title}
                      </Text>
                      <Edit3 size={16} color="#94A3B8" />
                    </Pressable>
                  )}
                  <View className="flex-row items-center gap-2">
                    <TaskAvatarStack memberIds={editedTask.allocations.map(a => a.memberId)} maxVisible={3} size={24} />
                    <TaskPriorityIndicator priority={priority} size={20} />
                  </View>
                </View>
              </View>

              {/* Due Date - Same as Medium */}
              <View>
                <Text
                  className={`text-sm font-semibold ${
                    isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  📅 {isOverdue ? `${daysOverdue} days overdue` : `Due ${formatTaskDate(dueDate)}`}
                </Text>
              </View>

              {/* Description - EDITABLE with indicator */}
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-slate-900 dark:text-white text-sm font-semibold">Description</Text>
                  {!editingDescription && <Edit3 size={12} color="#94A3B8" />}
                </View>
                {editingDescription ? (
                  <TextInput
                    value={editedTask.description}
                    onChangeText={(description) => setEditedTask({ ...editedTask, description })}
                    onBlur={() => setEditingDescription(false)}
                    autoFocus
                    multiline
                    numberOfLines={4}
                    className="text-slate-900 dark:text-white text-sm bg-slate-100 dark:bg-slate-700 rounded px-3 py-2"
                    placeholder="Add description..."
                  />
                ) : (
                  <Pressable onPress={() => setEditingDescription(true)}>
                    <Text className="text-slate-700 dark:text-slate-300 text-sm">
                      {editedTask.description || 'Tap to add description...'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Progress - Same as Medium */}
              <View className="gap-2">
                <Text className="text-slate-900 dark:text-white text-sm font-semibold">Progress</Text>
                <TaskProgressBar
                  completed={completed}
                  total={editedTask.estimatedTimeUnits}
                  showPercentage={true}
                />
              </View>

              {/* Effort Breakdown - Same as Medium */}
              <View className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 gap-2">
                <Text className="text-slate-900 dark:text-white text-sm font-bold mb-1">
                  EFFORT BREAKDOWN
                </Text>
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Total Required:</Text>
                  <Text className="text-slate-900 dark:text-white text-xs font-semibold">
                    {editedTask.estimatedTimeUnits} TU
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Completed:</Text>
                  <Text className="text-slate-900 dark:text-white text-xs font-semibold">
                    {completed} TU
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Remaining:</Text>
                  <Text className="text-slate-900 dark:text-white text-xs font-semibold">
                    {remaining} TU
                  </Text>
                </View>
                <View className="h-px bg-slate-300 dark:bg-slate-600 my-1" />
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Team Velocity:</Text>
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    {netVelocity.toFixed(1)} TU/week
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs">Est. Completion:</Text>
                  <Text className="text-slate-900 dark:text-white text-xs font-semibold">
                    ~{estimatedWeeks.toFixed(1)} weeks ({formatTaskDate(estimatedDate)})
                  </Text>
                </View>
              </View>

              {/* Team Preview - Same as Medium */}
              <View className="gap-2">
                <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                  Team ({teamSize} members)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {editedTask.allocations.slice(0, 3).map((allocation) => {
                    const member = members.find((m) => m.id === allocation.memberId);
                    if (!member) return null;
                    return (
                      <Text
                        key={allocation.memberId}
                        className="text-slate-600 dark:text-slate-400 text-xs"
                      >
                        👤 {member.name}
                      </Text>
                    );
                  })}
                  {teamSize > 3 && (
                    <Text className="text-slate-500 dark:text-slate-500 text-xs">
                      +{teamSize - 3} more
                    </Text>
                  )}
                </View>
              </View>

              {/* Separator - Indicates ADDITIONAL details below */}
              <View className="flex-row items-center gap-2 my-2">
                <View className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
                <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">
                  ADDITIONAL DETAILS
                </Text>
                <View className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
              </View>

              {/* Team Allocation with capacity warnings - NEW in Full view */}
              <View className="gap-3">
                <Text className="text-slate-900 dark:text-white text-sm font-bold">
                  TEAM ALLOCATION DETAILS
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

              {/* Coordination Cost - ONLY in Full view */}
              <View className="gap-3">
                <Text className="text-slate-900 dark:text-white text-sm font-bold">
                  COORDINATION COST ANALYSIS
                </Text>
                <CoordinationCostDisplay teamSize={teamSize} rawVelocity={rawVelocity} />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mt-4">
                <Pressable
                  onPress={handleSave}
                  className="flex-1 bg-blue-500 rounded-lg py-3 items-center active:opacity-70"
                >
                  <Text className="text-white text-sm font-bold">Save Changes</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setEditedTask({ ...editedTask, status: 'completed', progress: 100 });
                    handleSave();
                  }}
                  className="flex-1 bg-green-500 rounded-lg py-3 items-center active:opacity-70"
                >
                  <Text className="text-white text-sm font-bold">Mark Done</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
