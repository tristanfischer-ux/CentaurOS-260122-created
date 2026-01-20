/**
 * TaskCardFull - Tier 3 (Full Details + Strategic Resource Planning)
 *
 * ADDITIVE design: Includes everything from Medium PLUS strategic info
 * - Medium content: Status buttons, progress quick set, reschedule, description
 * - Full additions: Team capacity analysis, coordination cost, what-if scenarios
 */

import { View, Text, Modal, ScrollView, Pressable, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Users,
  UserPlus,
  AlertCircle,
  Edit3,
  Zap,
  Activity,
  Target,
  BarChart3,
  Split,
  ArrowUpCircle,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { HapticPressable } from '@/components/HapticPressable';
import { TaskProgressBar, TaskAvatarStack, TaskEffortTimeline } from './index';
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
  const allTasks = useWorkPlanStore((s) => s.workPlans);

  const [editedTask, setEditedTask] = useState(task);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  // Sync state when task prop changes
  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  // Calculate current metrics
  const rawVelocity = editedTask.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
  const teamSize = editedTask.allocations.length;
  const netVelocity = calculateNetVelocity(teamSize, rawVelocity);
  const completed = editedTask.tusExpended || 0;
  const remaining = Math.max(0, editedTask.estimatedTimeUnits - completed);
  const estimatedWeeks = calculateEstimatedWeeks(remaining, netVelocity);
  const estimatedDate = calculateEstimatedDate(new Date(), estimatedWeeks);
  const progressPercent = Math.round((completed / editedTask.estimatedTimeUnits) * 100);

  // Coordination cost analysis
  const coordinationCost = teamSize > 1 ? Math.round((teamSize * (teamSize - 1)) / 2 * 0.5) : 0;
  const effectiveVelocity = Math.max(0.1, rawVelocity - coordinationCost);
  const coordinationPercentage = rawVelocity > 0 ? Math.round((coordinationCost / rawVelocity) * 100) : 0;

  // What-if scenario: Add one person
  const whatIfTeamSize = teamSize + 1;
  const whatIfRawVelocity = rawVelocity + 8;
  const whatIfCoordinationCost = Math.round((whatIfTeamSize * (whatIfTeamSize - 1)) / 2 * 0.5);
  const whatIfNetVelocity = calculateNetVelocity(whatIfTeamSize, whatIfRawVelocity);
  const whatIfWeeks = calculateEstimatedWeeks(remaining, whatIfNetVelocity);
  const velocityImprovement = whatIfNetVelocity - netVelocity;
  const timeReduction = estimatedWeeks - whatIfWeeks;

  // Calculate per-member capacity across all tasks
  const getMemberTotalCapacity = (memberId: string): {
    total: number;
    available: number;
    maxCapacity: number;
    tasks: number;
  } => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return { total: 0, available: 0, maxCapacity: 0, tasks: 0 };

    const maxCapacity =
      member.role === 'Founder' || member.role === 'Apprentice'
        ? 10
        : (member.daysPerWeek || 2) * 2;

    const allocatedAcrossAllTasks = allTasks
      .filter((t: WorkPlan) => t.status !== 'completed' && t.status !== 'abandoned')
      .reduce((sum: number, t: WorkPlan) => {
        const allocation = t.allocations.find((a) => a.memberId === memberId);
        return sum + (allocation?.squaresPerWeek || 0);
      }, 0);

    const taskCount = allTasks.filter(
      (t: WorkPlan) =>
        t.status !== 'completed' &&
        t.status !== 'abandoned' &&
        t.allocations.some((a) => a.memberId === memberId)
    ).length;

    return {
      total: allocatedAcrossAllTasks,
      available: maxCapacity - allocatedAcrossAllTasks,
      maxCapacity,
      tasks: taskCount,
    };
  };

  // Check for issues
  const dueDate = new Date(editedTask.dueDate);
  const isOverdue = dueDate < new Date() && editedTask.status !== 'completed';
  const isHighCoordination = coordinationPercentage > 30;
  const hasOverallocatedMembers = editedTask.allocations.some((a) => {
    const capacity = getMemberTotalCapacity(a.memberId);
    return capacity.total > capacity.maxCapacity;
  });

  // Get member IDs for avatars
  const memberIds = editedTask.allocations.map((a) => a.memberId);

  // Status config (same as Medium)
  const statusConfig = {
    'not-started': { icon: Pause, color: '#6b7280', label: 'Queue' },
    'in-progress': { icon: Play, color: '#3b82f6', label: 'Active' },
    blocked: { icon: AlertTriangle, color: '#ef4444', label: 'Blocked' },
    completed: { icon: CheckCircle2, color: '#10b981', label: 'Done' },
  };

  const handleStatusUpdate = (status: WorkPlan['status']) => {
    setEditedTask({ ...editedTask, status });
  };

  const handleProgressUpdate = (progress: number) => {
    setEditedTask({ ...editedTask, progress });
  };

  const handleReschedule = (days: number) => {
    const currentDate = new Date(editedTask.dueDate);
    currentDate.setDate(currentDate.getDate() + days);
    setEditedTask({ ...editedTask, dueDate: currentDate.toISOString().split('T')[0] });
  };

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '94%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden">
            {/* Header with gradient */}
            <LinearGradient
              colors={isOverdue ? ['#fee2e2', '#fef2f2'] : ['#dbeafe', '#eff6ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20 }}
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 mr-3">
                  {editingTitle ? (
                    <TextInput
                      value={editedTask.title}
                      onChangeText={(title) => setEditedTask({ ...editedTask, title })}
                      onBlur={() => setEditingTitle(false)}
                      autoFocus
                      className="text-slate-900 text-xl font-bold bg-white/50 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <Pressable
                      onPress={() => setEditingTitle(true)}
                      className="flex-row items-start gap-2"
                    >
                      <Text className="flex-1 text-slate-900 text-xl font-bold leading-tight">
                        {editedTask.title}
                      </Text>
                      <Edit3 size={16} color="#94a3b8" style={{ marginTop: 4 }} />
                    </Pressable>
                  )}
                </View>
                <HapticPressable
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-white/80 items-center justify-center"
                >
                  <X size={18} color="#64748b" />
                </HapticPressable>
              </View>

              {/* Quick stats row */}
              <View className="flex-row items-center gap-3 flex-wrap">
                <View className="flex-row items-center gap-1.5 bg-white/60 rounded-full px-3 py-1">
                  <Users size={12} color="#64748b" />
                  <Text className="text-slate-700 text-xs font-semibold">{teamSize} people</Text>
                </View>
                <View className="flex-row items-center gap-1.5 bg-white/60 rounded-full px-3 py-1">
                  <Calendar size={12} color={isOverdue ? '#ef4444' : '#64748b'} />
                  <Text
                    className={`text-xs font-semibold ${
                      isOverdue ? 'text-red-600' : 'text-slate-700'
                    }`}
                  >
                    {formatTaskDate(dueDate)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5 bg-white/60 rounded-full px-3 py-1">
                  <Activity size={12} color="#64748b" />
                  <Text className="text-slate-700 text-xs font-semibold">{progressPercent}% done</Text>
                </View>
              </View>
            </LinearGradient>

            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingBottom: 180 }}
              showsVerticalScrollIndicator={false}
            >
              {/* ===== MEDIUM CONTENT (from TaskCardMediumInline) ===== */}

              {/* Task Info Row - Avatars and Timeline */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <TaskAvatarStack memberIds={memberIds} maxVisible={3} size={24} />
                    <TaskEffortTimeline
                      totalTU={editedTask.estimatedTimeUnits}
                      velocityPerWeek={netVelocity}
                      estimatedWeeks={estimatedWeeks}
                      completed={completed}
                      showProgressBar={false}
                    />
                  </View>
                </View>
              </View>

              {/* Quick Status Row - Same as Medium */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                  Status
                </Text>
                <View className="flex-row gap-1.5">
                  {(['not-started', 'in-progress', 'blocked', 'completed'] as const).map((status) => {
                    const isActive = editedTask.status === status;
                    const { icon: Icon, color, label } = statusConfig[status];

                    return (
                      <HapticPressable
                        key={status}
                        onPress={() => handleStatusUpdate(status)}
                        className="flex-1 flex-row items-center justify-center gap-1 py-2.5 rounded-lg"
                        style={{
                          backgroundColor: isActive ? color + '15' : '#f1f5f9',
                          borderWidth: isActive ? 1.5 : 0,
                          borderColor: color,
                        }}
                      >
                        <Icon size={14} color={isActive ? color : '#9ca3af'} />
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: isActive ? color : '#9ca3af' }}
                        >
                          {label}
                        </Text>
                      </HapticPressable>
                    );
                  })}
                </View>
              </View>

              {/* Progress + Reschedule Row - Same as Medium */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <View className="flex-row gap-3">
                  {/* Progress Quick Set */}
                  <View className="flex-1">
                    <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Progress
                    </Text>
                    <View className="flex-row gap-1.5">
                      {[25, 50, 75, 100].map((preset) => (
                        <HapticPressable
                          key={preset}
                          onPress={() => handleProgressUpdate(preset)}
                          className="flex-1 py-2 rounded-lg items-center"
                          style={{
                            backgroundColor: editedTask.progress === preset ? '#3b82f6' : '#f1f5f9',
                          }}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              editedTask.progress === preset ? 'text-white' : 'text-slate-600'
                            }`}
                          >
                            {preset}%
                          </Text>
                        </HapticPressable>
                      ))}
                    </View>
                  </View>

                  {/* Reschedule Quick Set */}
                  <View className="flex-1">
                    <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Reschedule
                    </Text>
                    <View className="flex-row gap-1.5">
                      {[
                        { days: 1, label: '+1d' },
                        { days: 3, label: '+3d' },
                        { days: 7, label: '+1w' },
                      ].map(({ days, label }) => (
                        <HapticPressable
                          key={days}
                          onPress={() => handleReschedule(days)}
                          className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg items-center"
                        >
                          <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                            {label}
                          </Text>
                        </HapticPressable>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* Description - Editable (from Medium) */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Notes
                </Text>
                {editingDescription ? (
                  <TextInput
                    value={editedTask.description}
                    onChangeText={(description) => setEditedTask({ ...editedTask, description })}
                    onBlur={() => setEditingDescription(false)}
                    autoFocus
                    multiline
                    numberOfLines={3}
                    className="text-slate-900 dark:text-white text-sm bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-3"
                    placeholder="Add notes..."
                    placeholderTextColor="#94a3b8"
                  />
                ) : (
                  <Pressable
                    onPress={() => setEditingDescription(true)}
                    className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-3"
                  >
                    <Text
                      className="text-slate-600 dark:text-slate-400 text-sm"
                      numberOfLines={3}
                    >
                      {editedTask.description || 'Tap to add notes...'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* ===== FULL-ONLY CONTENT (Strategic Analysis) ===== */}

              {/* Issue Alerts */}
              {(isHighCoordination || hasOverallocatedMembers || isOverdue) && (
                <View className="py-4 gap-2 border-b border-slate-100 dark:border-slate-800">
                  <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Alerts
                  </Text>
                  {isHighCoordination && (
                    <View className="flex-row items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                      <Zap size={16} color="#f59e0b" style={{ marginTop: 2 }} />
                      <View className="flex-1">
                        <Text className="text-amber-900 dark:text-amber-100 font-semibold text-sm">
                          High coordination overhead
                        </Text>
                        <Text className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                          {coordinationPercentage}% of effort goes to team communication with {teamSize}{' '}
                          people
                        </Text>
                      </View>
                    </View>
                  )}
                  {hasOverallocatedMembers && (
                    <View className="flex-row items-start gap-2 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                      <AlertCircle size={16} color="#ef4444" style={{ marginTop: 2 }} />
                      <View className="flex-1">
                        <Text className="text-red-900 dark:text-red-100 font-semibold text-sm">
                          Team members overallocated
                        </Text>
                        <Text className="text-red-700 dark:text-red-300 text-xs mt-0.5">
                          Some team members are over 100% capacity across all tasks
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Current Progress - Enhanced with TU details */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center gap-2 mb-2">
                  <Target size={16} color="#3b82f6" />
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    Progress Details
                  </Text>
                </View>
                <TaskProgressBar
                  completed={completed}
                  total={editedTask.estimatedTimeUnits}
                  showPercentage={false}
                />
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    {completed} of {editedTask.estimatedTimeUnits} TU completed
                  </Text>
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    ~{estimatedWeeks.toFixed(1)} weeks remaining
                  </Text>
                </View>
              </View>

              {/* Team Capacity Analysis */}
              <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <Users size={16} color="#64748b" />
                    <Text className="text-slate-900 dark:text-white font-semibold">
                      Team Capacity
                    </Text>
                  </View>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    Across all active tasks
                  </Text>
                </View>

                <View className="gap-2.5">
                  {editedTask.allocations.map((allocation) => {
                    const member = members.find((m) => m.id === allocation.memberId);
                    if (!member) return null;

                    const capacity = getMemberTotalCapacity(allocation.memberId);
                    const utilizationPercent = Math.round(
                      (capacity.total / capacity.maxCapacity) * 100
                    );
                    const isOverallocated = utilizationPercent > 100;
                    const isNearCapacity = utilizationPercent > 80 && utilizationPercent <= 100;

                    return (
                      <View
                        key={allocation.memberId}
                        className={`rounded-xl p-3 ${
                          isOverallocated
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            : isNearCapacity
                            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                              <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                                <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                                  {member.name.charAt(0)}
                                </Text>
                              </View>
                              <View className="flex-1">
                                <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                                  {member.name}
                                </Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                  {member.role} • {member.function}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View className="items-end">
                            <Text
                              className={`font-bold text-base ${
                                isOverallocated
                                  ? 'text-red-600 dark:text-red-400'
                                  : isNearCapacity
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {utilizationPercent}%
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs">
                              capacity
                            </Text>
                          </View>
                        </View>

                        {/* Capacity bar */}
                        <View className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                          <View
                            className={`h-full ${
                              isOverallocated
                                ? 'bg-red-500'
                                : isNearCapacity
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                          />
                        </View>

                        {/* Details */}
                        <View className="flex-row items-center justify-between">
                          <Text className="text-slate-600 dark:text-slate-400 text-xs">
                            This task: {allocation.squaresPerWeek} TU/wk
                          </Text>
                          <Text className="text-slate-600 dark:text-slate-400 text-xs">
                            Total: {capacity.total} / {capacity.maxCapacity} TU/wk • {capacity.tasks}{' '}
                            tasks
                          </Text>
                        </View>

                        {isOverallocated && (
                          <Text className="text-red-600 dark:text-red-400 text-xs mt-1 font-medium">
                            Over capacity by {capacity.total - capacity.maxCapacity} TU/wk
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Coordination Cost Impact */}
              {teamSize > 1 && (
                <View className="py-4 border-b border-slate-100 dark:border-slate-800">
                  <View className="flex-row items-center gap-2 mb-3">
                    <Zap size={16} color="#f59e0b" />
                    <Text className="text-slate-900 dark:text-white font-semibold">
                      Coordination Cost
                    </Text>
                  </View>
                  <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">
                        Raw team velocity
                      </Text>
                      <Text className="text-slate-900 dark:text-white font-semibold">
                        {rawVelocity} TU/wk
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">
                        Communication overhead ({teamSize} people)
                      </Text>
                      <Text className="text-red-600 dark:text-red-400 font-semibold">
                        -{coordinationCost} TU/wk
                      </Text>
                    </View>
                    <View className="h-px bg-slate-200 dark:bg-slate-700 mb-3" />
                    <View className="flex-row items-center justify-between">
                      <Text className="text-slate-900 dark:text-white font-bold">
                        Effective velocity
                      </Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                        {effectiveVelocity.toFixed(1)} TU/wk
                      </Text>
                    </View>
                    <Text className="text-amber-700 dark:text-amber-300 text-xs mt-3">
                      {coordinationPercentage}% of team effort goes to coordination instead of work
                    </Text>
                  </View>
                </View>
              )}

              {/* What-If: Add Resource */}
              <View className="py-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <BarChart3 size={16} color="#8b5cf6" />
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    What if we add 1 person?
                  </Text>
                </View>
                <View className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <View className="flex-row items-start gap-3 mb-3">
                    <View className="flex-1">
                      <Text className="text-purple-900 dark:text-purple-100 font-semibold mb-1">
                        Impact Analysis
                      </Text>
                      <Text className="text-purple-700 dark:text-purple-300 text-xs">
                        Adding 1 person at 8 TU/wk to a {teamSize}-person team
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">
                        New velocity
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-slate-500 line-through text-sm">
                          {effectiveVelocity.toFixed(1)}
                        </Text>
                        <Text className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {whatIfNetVelocity.toFixed(1)} TU/wk
                        </Text>
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xs">
                          (+{velocityImprovement.toFixed(1)})
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">
                        New coordination cost
                      </Text>
                      <Text className="text-red-600 dark:text-red-400 font-semibold">
                        -{whatIfCoordinationCost} TU/wk
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm">
                        Estimated completion
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-slate-500 line-through text-sm">
                          {estimatedWeeks.toFixed(1)}w
                        </Text>
                        <Text className="text-blue-600 dark:text-blue-400 font-bold">
                          ~{whatIfWeeks.toFixed(1)}w
                        </Text>
                        {timeReduction > 0 && (
                          <Text className="text-emerald-600 dark:text-emerald-400 text-xs">
                            (-{timeReduction.toFixed(1)}w)
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {velocityImprovement < 2 && (
                    <View className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-2 mt-3">
                      <Text className="text-amber-800 dark:text-amber-200 text-xs">
                        Warning: Adding another person only gains{' '}
                        {velocityImprovement.toFixed(1)} TU/wk due to coordination overhead
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Fixed Footer - Strategic Actions */}
            <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-5 py-4">
              <View className="gap-2.5">
                <View className="flex-row gap-2.5">
                  <HapticPressable
                    onPress={() => {
                      handleSave();
                    }}
                    className="flex-1 flex-row items-center justify-center gap-2 bg-blue-500 rounded-xl py-3.5"
                  >
                    <UserPlus size={18} color="#ffffff" />
                    <Text className="text-white font-bold text-sm">Add Resource</Text>
                  </HapticPressable>

                  <HapticPressable
                    onPress={() => {
                      handleSave();
                    }}
                    className="flex-1 flex-row items-center justify-center gap-2 bg-purple-500 rounded-xl py-3.5"
                  >
                    <Split size={18} color="#ffffff" />
                    <Text className="text-white font-bold text-sm">Split Task</Text>
                  </HapticPressable>
                </View>

                <View className="flex-row gap-2.5">
                  <HapticPressable
                    onPress={handleSave}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl py-3.5 items-center"
                  >
                    <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                      Save Changes
                    </Text>
                  </HapticPressable>

                  <HapticPressable
                    onPress={() => {
                      handleSave();
                    }}
                    className="flex-row items-center gap-2 bg-amber-500 rounded-xl px-5 py-3.5"
                  >
                    <ArrowUpCircle size={18} color="#ffffff" />
                    <Text className="text-white font-semibold text-sm">Escalate</Text>
                  </HapticPressable>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
