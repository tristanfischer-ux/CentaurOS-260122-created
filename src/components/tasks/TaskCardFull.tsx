/**
 * TaskCardFull - Tier 3 (Full Detail Modal)
 *
 * Professional, polished task detail modal.
 * Shows complete task information with editing capabilities.
 */

import { View, Text, Modal, ScrollView, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import {
  X,
  Calendar,
  Users,
  Clock,
  Target,
  Edit3,
  Check,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { HapticPressable } from '@/components/HapticPressable';
import {
  TaskStatusDot,
  TaskProgressBar,
  TaskAvatarStack,
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

  const [editedTask, setEditedTask] = useState(task);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  // Calculate metrics
  const rawVelocity = editedTask.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
  const teamSize = editedTask.allocations.length;
  const netVelocity = calculateNetVelocity(teamSize, rawVelocity);
  const completed = editedTask.tusExpended || 0;
  const remaining = Math.max(0, editedTask.estimatedTimeUnits - completed);
  const estimatedWeeks = calculateEstimatedWeeks(remaining, netVelocity);
  const estimatedDate = calculateEstimatedDate(new Date(), estimatedWeeks);
  const progress = Math.round((completed / editedTask.estimatedTimeUnits) * 100);

  // Overdue check
  const dueDate = new Date(editedTask.dueDate);
  const isOverdue = dueDate < new Date() && editedTask.status !== 'completed';
  const daysOverdue = isOverdue
    ? Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Coordination cost (simplified Brooks's Law)
  const coordinationCost = teamSize > 1 ? Math.round((teamSize * (teamSize - 1)) / 2 * 0.5) : 0;
  const effectiveVelocity = Math.max(0, rawVelocity - coordinationCost);

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  const updateStatus = (status: WorkPlan['status']) => {
    setEditedTask({ ...editedTask, status });
  };

  const statusConfig = {
    'not-started': { icon: Pause, color: '#6b7280', bg: '#f3f4f6', label: 'Not Started' },
    'in-progress': { icon: Play, color: '#3b82f6', bg: '#eff6ff', label: 'In Progress' },
    blocked: { icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2', label: 'Blocked' },
    completed: { icon: CheckCircle2, color: '#10b981', bg: '#f0fdf4', label: 'Completed' },
    abandoned: { icon: X, color: '#6b7280', bg: '#f3f4f6', label: 'Abandoned' },
  };

  const currentStatus = statusConfig[editedTask.status];
  const StatusIcon = currentStatus.icon;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '92%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden">
            {/* Header with gradient */}
            <LinearGradient
              colors={isOverdue ? ['#fecaca', '#fef2f2'] : ['#e0f2fe', '#f0f9ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20 }}
            >
              <View className="flex-row items-start justify-between mb-3">
                {/* Status Badge */}
                <View
                  className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: currentStatus.bg }}
                >
                  <StatusIcon size={14} color={currentStatus.color} />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: currentStatus.color }}
                  >
                    {currentStatus.label}
                  </Text>
                </View>

                {/* Close Button */}
                <HapticPressable
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 items-center justify-center"
                >
                  <X size={18} color="#64748b" />
                </HapticPressable>
              </View>

              {/* Title */}
              {editingTitle ? (
                <TextInput
                  value={editedTask.title}
                  onChangeText={(title) => setEditedTask({ ...editedTask, title })}
                  onBlur={() => setEditingTitle(false)}
                  autoFocus
                  className="text-slate-900 text-xl font-bold bg-white/50 rounded-lg px-3 py-2"
                />
              ) : (
                <Pressable onPress={() => setEditingTitle(true)} className="flex-row items-start gap-2">
                  <Text className="flex-1 text-slate-900 text-xl font-bold leading-tight">
                    {editedTask.title}
                  </Text>
                  <Edit3 size={16} color="#94a3b8" style={{ marginTop: 4 }} />
                </Pressable>
              )}

              {/* Due Date & Team */}
              <View className="flex-row items-center gap-4 mt-3">
                <View className="flex-row items-center gap-1.5">
                  <Calendar size={14} color={isOverdue ? '#ef4444' : '#64748b'} />
                  <Text
                    className={`text-sm font-medium ${
                      isOverdue ? 'text-red-600' : 'text-slate-600'
                    }`}
                  >
                    {isOverdue ? `${daysOverdue}d overdue` : formatTaskDate(dueDate)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <TaskAvatarStack
                    memberIds={editedTask.allocations.map((a) => a.memberId)}
                    maxVisible={4}
                    size={22}
                  />
                  <Text className="text-slate-600 text-sm font-medium ml-1">
                    {teamSize} {teamSize === 1 ? 'person' : 'people'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Progress Section */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-900 dark:text-white font-semibold">Progress</Text>
                  <Text className="text-blue-600 dark:text-blue-400 font-bold">{progress}%</Text>
                </View>
                <TaskProgressBar
                  completed={completed}
                  total={editedTask.estimatedTimeUnits}
                  showPercentage={false}
                />
                <Text className="text-slate-500 dark:text-slate-400 text-xs mt-2">
                  {completed} of {editedTask.estimatedTimeUnits} time units completed
                </Text>
              </View>

              {/* Effort Timeline */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <Text className="text-slate-900 dark:text-white font-semibold mb-3">
                  Effort Timeline
                </Text>
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Target size={14} color="#3b82f6" />
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">Total</Text>
                    </View>
                    <Text className="text-slate-900 dark:text-white text-lg font-bold">
                      {editedTask.estimatedTimeUnits} TU
                    </Text>
                  </View>
                  <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <TrendingUp size={14} color="#10b981" />
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">Velocity</Text>
                    </View>
                    <Text className="text-slate-900 dark:text-white text-lg font-bold">
                      {netVelocity.toFixed(1)}/wk
                    </Text>
                  </View>
                  <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Clock size={14} color="#f59e0b" />
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">Est.</Text>
                    </View>
                    <Text className="text-slate-900 dark:text-white text-lg font-bold">
                      ~{estimatedWeeks.toFixed(1)}w
                    </Text>
                  </View>
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mt-2">
                  Estimated completion: {formatTaskDate(estimatedDate)}
                </Text>
              </View>

              {/* Description */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-900 dark:text-white font-semibold">Description</Text>
                  {!editingDescription && (
                    <HapticPressable onPress={() => setEditingDescription(true)}>
                      <Edit3 size={14} color="#94a3b8" />
                    </HapticPressable>
                  )}
                </View>
                {editingDescription ? (
                  <View>
                    <TextInput
                      value={editedTask.description}
                      onChangeText={(description) => setEditedTask({ ...editedTask, description })}
                      multiline
                      numberOfLines={4}
                      className="text-slate-900 dark:text-white text-sm bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 min-h-[100px]"
                      textAlignVertical="top"
                      placeholder="Add a description..."
                      placeholderTextColor="#94a3b8"
                    />
                    <HapticPressable
                      onPress={() => setEditingDescription(false)}
                      className="self-end mt-2 px-4 py-2 bg-blue-500 rounded-lg"
                    >
                      <Text className="text-white font-semibold text-xs">Done</Text>
                    </HapticPressable>
                  </View>
                ) : (
                  <Text className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {editedTask.description || 'No description added yet. Tap the edit icon to add one.'}
                  </Text>
                )}
              </View>

              {/* Status Update */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <Text className="text-slate-900 dark:text-white font-semibold mb-3">Update Status</Text>
                <View className="flex-row gap-2">
                  {(['not-started', 'in-progress', 'blocked', 'completed'] as const).map((status) => {
                    const config = statusConfig[status];
                    const Icon = config.icon;
                    const isActive = editedTask.status === status;

                    return (
                      <HapticPressable
                        key={status}
                        onPress={() => updateStatus(status)}
                        className="flex-1 items-center py-3 rounded-xl"
                        style={{
                          backgroundColor: isActive ? config.color + '15' : '#f8fafc',
                          borderWidth: isActive ? 1.5 : 0,
                          borderColor: config.color,
                        }}
                      >
                        <Icon
                          size={20}
                          color={isActive ? config.color : '#9ca3af'}
                        />
                        <Text
                          className="text-[10px] font-semibold mt-1"
                          style={{ color: isActive ? config.color : '#9ca3af' }}
                        >
                          {config.label.split(' ')[0]}
                        </Text>
                      </HapticPressable>
                    );
                  })}
                </View>
              </View>

              {/* Team Allocation */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center gap-2 mb-3">
                  <Users size={16} color="#64748b" />
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    Team ({teamSize})
                  </Text>
                </View>
                <View className="gap-2">
                  {editedTask.allocations.map((allocation) => {
                    const member = members.find((m) => m.id === allocation.memberId);
                    if (!member) return null;

                    return (
                      <View
                        key={allocation.memberId}
                        className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3"
                      >
                        <View className="flex-row items-center gap-3">
                          <View className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                            <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                              {member.name.charAt(0)}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-slate-900 dark:text-white font-medium text-sm">
                              {member.name}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs">
                              {member.role} • {member.function}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-slate-900 dark:text-white font-bold">
                            {allocation.squaresPerWeek}
                          </Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-xs">TU/wk</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Coordination Cost */}
              {teamSize > 1 && (
                <View className="py-4">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Zap size={16} color="#f59e0b" />
                    <Text className="text-slate-900 dark:text-white font-semibold">
                      Coordination Cost
                    </Text>
                  </View>
                  <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">Raw velocity</Text>
                      <Text className="text-slate-900 dark:text-white font-medium">{rawVelocity} TU/wk</Text>
                    </View>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">Communication overhead</Text>
                      <Text className="text-red-600 dark:text-red-400 font-medium">-{coordinationCost} TU/wk</Text>
                    </View>
                    <View className="h-px bg-amber-200 dark:bg-amber-800 my-2" />
                    <View className="flex-row items-center justify-between">
                      <Text className="text-slate-900 dark:text-white font-semibold">Effective velocity</Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 font-bold">{effectiveVelocity} TU/wk</Text>
                    </View>
                    <Text className="text-amber-700 dark:text-amber-300 text-xs mt-3">
                      With {teamSize} people, ~{Math.round((coordinationCost / rawVelocity) * 100)}% of effort goes to coordination
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Fixed Footer */}
            <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-5 py-4">
              <View className="flex-row gap-3">
                <HapticPressable
                  onPress={handleSave}
                  className="flex-1 bg-blue-500 rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-bold">Save Changes</Text>
                </HapticPressable>
                {editedTask.status !== 'completed' && (
                  <HapticPressable
                    onPress={() => {
                      setEditedTask({ ...editedTask, status: 'completed', progress: 100 });
                    }}
                    className="flex-row items-center gap-2 bg-emerald-500 rounded-xl px-5 py-4"
                  >
                    <Check size={18} color="#ffffff" />
                    <Text className="text-white font-bold">Done</Text>
                  </HapticPressable>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
