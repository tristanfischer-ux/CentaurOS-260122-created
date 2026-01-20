/**
 * TaskCardExpansion - Progressive Inline Disclosure
 *
 * Two expansion tiers that add information below the Compact card:
 * - Medium: Quick actions (status, progress, notes)
 * - Full: Resource planning (team capacity, coordination, what-if)
 *
 * All inline, no modals. Each tier builds on the previous.
 */

import { View, Text, Pressable, TextInput, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Users,
  UserPlus,
  Zap,
  Target,
  BarChart3,
  Split,
  ArrowUpCircle,
  Edit3,
  X,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { SlideInDown, SlideOutUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import type { PriorityLevel } from '@/lib/ai-priority-scoring';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import type { OrganizationMember } from '@/lib/organization-seed';
import { HapticPressable } from '@/components/HapticPressable';
import { TaskProgressBar } from './index';
import {
  calculateNetVelocity,
  calculateEstimatedWeeks,
} from '@/lib/task-calculations';

type ExpansionLevel = 'medium' | 'full';

interface TaskCardExpansionProps {
  task: WorkPlan;
  level: ExpansionLevel;
  onClose: () => void;
  onExpandMore?: () => void; // Go from medium → full
  onUpdateStatus?: (status: WorkPlan['status']) => void;
  onUpdateProgress?: (progress: number) => void;
  onRescheduleDays?: (days: number) => void;
  onUpdateDescription?: (description: string) => void;
  onSave?: (updates: Partial<WorkPlan>) => void;
  priorityLevel?: PriorityLevel;
  priorityReasoning?: string;
}

export function TaskCardExpansion({
  task,
  level,
  onClose,
  onExpandMore,
  onUpdateStatus,
  onUpdateProgress,
  onRescheduleDays,
  onUpdateDescription,
  onSave,
  priorityLevel,
  priorityReasoning,
}: TaskCardExpansionProps) {
  const members = useOrganizationStore((s) => s.members);
  const allTasks = useWorkPlanStore((s) => s.workPlans);
  const updateWorkPlan = useWorkPlanStore((s) => s.updateWorkPlan);
  const addWorkPlan = useWorkPlanStore((s) => s.addWorkPlan);

  const [editingDescription, setEditingDescription] = useState(false);
  const [localDescription, setLocalDescription] = useState(task.description);
  const [editedTask, setEditedTask] = useState(task);

  // Modal state for strategic actions
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showSplitTaskModal, setShowSplitTaskModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  // Add Resource modal state
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [newAllocationSquares, setNewAllocationSquares] = useState<number>(4);

  // Split Task modal state
  const [splitTaskName1, setSplitTaskName1] = useState<string>('');
  const [splitTaskName2, setSplitTaskName2] = useState<string>('');
  const [splitPercentage, setSplitPercentage] = useState<number>(50);

  // Calculate current metrics
  const rawVelocity = task.allocations.reduce((sum, a) => sum + a.squaresPerWeek, 0);
  const teamSize = task.allocations.length;
  const netVelocity = calculateNetVelocity(teamSize, rawVelocity);
  const completed = task.tusExpended || 0;
  const remaining = Math.max(0, task.estimatedTimeUnits - completed);
  const estimatedWeeks = calculateEstimatedWeeks(remaining, netVelocity);

  // Coordination cost analysis
  const coordinationCost = teamSize > 1 ? Math.round((teamSize * (teamSize - 1)) / 2 * 0.5) : 0;
  const effectiveVelocity = Math.max(0.1, rawVelocity - coordinationCost);
  const coordinationPercentage = rawVelocity > 0 ? Math.round((coordinationCost / rawVelocity) * 100) : 0;

  // What-if scenario
  const whatIfTeamSize = teamSize + 1;
  const whatIfRawVelocity = rawVelocity + 8;
  const whatIfCoordinationCost = Math.round((whatIfTeamSize * (whatIfTeamSize - 1)) / 2 * 0.5);
  const whatIfNetVelocity = calculateNetVelocity(whatIfTeamSize, whatIfRawVelocity);
  const whatIfWeeks = calculateEstimatedWeeks(remaining, whatIfNetVelocity);
  const velocityImprovement = whatIfNetVelocity - netVelocity;
  const timeReduction = estimatedWeeks - whatIfWeeks;

  // Calculate per-member capacity
  const getMemberTotalCapacity = (memberId: string): {
    total: number;
    available: number;
    maxCapacity: number;
    tasks: number;
  } => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return { total: 0, available: 0, maxCapacity: 0, tasks: 0 };

    const maxCapacity =
      member.role === 'Founder' || member.role === 'Apprentice' ? 10 : (member.daysPerWeek || 2) * 2;

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
  const isHighCoordination = coordinationPercentage > 30;
  const hasOverallocatedMembers = task.allocations.some((a) => {
    const capacity = getMemberTotalCapacity(a.memberId);
    return capacity.total > capacity.maxCapacity;
  });

  const priorityBorderColor = priorityLevel
    ? priorityLevel === 'critical'
      ? '#ef4444'
      : priorityLevel === 'high'
      ? '#f59e0b'
      : priorityLevel === 'important'
      ? '#3b82f6'
      : '#e2e8f0'
    : '#e2e8f0';

  const statusConfig = {
    'not-started': { icon: Pause, color: '#6b7280', label: 'Queue' },
    'in-progress': { icon: Play, color: '#3b82f6', label: 'Active' },
    blocked: { icon: AlertTriangle, color: '#ef4444', label: 'Blocked' },
    completed: { icon: CheckCircle2, color: '#10b981', label: 'Done' },
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedTask);
    }
  };

  // Handler: Add Resource
  const handleAddResource = () => {
    if (!selectedMemberId) return;

    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) return;

    // Calculate cost per square: costPerDay / (daysPerWeek * 2 squares per day)
    const daysPerWeek = member.daysPerWeek || 5;
    const squaresPerDay = 2;
    const costPerSquare = (member.costPerDay || 0) / squaresPerDay;

    const updatedAllocations: typeof task.allocations = [
      ...task.allocations,
      {
        memberId: selectedMemberId,
        memberName: member.name,
        squaresPerWeek: newAllocationSquares,
        costPerSquare: costPerSquare,
      },
    ];

    updateWorkPlan(task.id, { allocations: updatedAllocations });
    setShowAddResourceModal(false);
    setSelectedMemberId('');
    setNewAllocationSquares(4);
  };

  // Handler: Split Task
  const handleSplitTask = () => {
    if (!splitTaskName1 || !splitTaskName2) return;

    const splitRatio = splitPercentage / 100;
    const task1TUs = Math.round(task.estimatedTimeUnits * splitRatio);
    const task2TUs = task.estimatedTimeUnits - task1TUs;

    // Create first split task
    const newTask1: WorkPlan = {
      ...task,
      id: `${task.id}-split-1-${Date.now()}`,
      title: splitTaskName1,
      description: `Split from: ${task.title}\n\n${task.description}`,
      progress: 0,
      estimatedTimeUnits: task1TUs,
      tusExpended: 0,
    };

    // Create second split task
    const newTask2: WorkPlan = {
      ...task,
      id: `${task.id}-split-2-${Date.now()}`,
      title: splitTaskName2,
      description: `Split from: ${task.title}\n\n${task.description}`,
      progress: 0,
      estimatedTimeUnits: task2TUs,
      tusExpended: 0,
    };

    // Add both tasks
    addWorkPlan(newTask1);
    addWorkPlan(newTask2);

    // Mark original as completed
    updateWorkPlan(task.id, {
      status: 'completed',
      description: `${task.description}\n\n✂️ Split into: "${splitTaskName1}" and "${splitTaskName2}"`,
    });

    setShowSplitTaskModal(false);
    setSplitTaskName1('');
    setSplitTaskName2('');
    setSplitPercentage(50);
  };

  // Handler: Escalate to Leadership
  const handleEscalate = () => {
    const escalationNote = `🚨 ESCALATED TO LEADERSHIP\n\nThis task requires leadership attention due to:\n- Critical priority level\n- Resource constraints\n- Timeline concerns\n\nEscalated on: ${new Date().toLocaleDateString()}\n\n${task.description}`;

    updateWorkPlan(task.id, {
      description: escalationNote,
    });

    setShowEscalateModal(false);
  };

  return (
    <>
    <Animated.View
      entering={SlideInDown.duration(200)}
      exiting={SlideOutUp.duration(150)}
      className="bg-white dark:bg-slate-800 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-lg mb-2 overflow-hidden"
      style={{
        borderLeftWidth: priorityLevel ? 4 : 1,
        borderLeftColor: priorityBorderColor,
      }}
    >
      <View className="p-3">
        {/* MEDIUM TIER - Quick Actions */}
        <>
          {/* AI Priority insight */}
          {priorityReasoning && (
            <View className="bg-purple-50 dark:bg-purple-900/30 rounded-md px-2.5 py-1.5 mb-2.5">
              <Text className="text-purple-700 dark:text-purple-300 text-[11px] leading-tight">
                {priorityReasoning}
              </Text>
            </View>
          )}

          {/* Quick Status Row */}
          {onUpdateStatus && (
            <View className="flex-row gap-1.5 mb-2.5">
              {(['not-started', 'in-progress', 'blocked', 'completed'] as const).map((status) => {
                const isActive = task.status === status;
                const { icon: Icon, color, label } = statusConfig[status];

                return (
                  <HapticPressable
                    key={status}
                    onPress={() => onUpdateStatus(status)}
                    className="flex-1 flex-row items-center justify-center gap-1 py-2 rounded-md"
                    style={{
                      backgroundColor: isActive ? color + '15' : '#f1f5f9',
                      borderWidth: isActive ? 1 : 0,
                      borderColor: color,
                    }}
                  >
                    <Icon size={12} color={isActive ? color : '#9ca3af'} />
                    <Text className="text-[10px] font-semibold" style={{ color: isActive ? color : '#9ca3af' }}>
                      {label}
                    </Text>
                  </HapticPressable>
                );
              })}
            </View>
          )}

          {/* Progress + Reschedule Row */}
          <View className="flex-row gap-2 mb-2.5">
            {onUpdateProgress && (
              <View className="flex-1">
                <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Progress</Text>
                <View className="flex-row gap-1">
                  {[25, 50, 75, 100].map((preset) => (
                    <HapticPressable
                      key={preset}
                      onPress={() => onUpdateProgress(preset)}
                      className="flex-1 py-1.5 rounded items-center"
                      style={{
                        backgroundColor: task.progress === preset ? '#3b82f6' : '#f1f5f9',
                      }}
                    >
                      <Text
                        className={`text-[10px] font-semibold ${
                          task.progress === preset ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {preset}%
                      </Text>
                    </HapticPressable>
                  ))}
                </View>
              </View>
            )}

            {onRescheduleDays && (
              <View className="flex-1">
                <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Reschedule</Text>
                <View className="flex-row gap-1">
                  {[
                    { days: 1, label: '+1d' },
                    { days: 3, label: '+3d' },
                    { days: 7, label: '+1w' },
                  ].map(({ days, label }) => (
                    <HapticPressable
                      key={days}
                      onPress={() => onRescheduleDays(days)}
                      className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 rounded items-center"
                    >
                      <Text className="text-slate-700 dark:text-slate-300 text-[10px] font-semibold">{label}</Text>
                    </HapticPressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          {editingDescription ? (
            <TextInput
              value={localDescription}
              onChangeText={setLocalDescription}
              onBlur={() => {
                setEditingDescription(false);
                if (onUpdateDescription && localDescription !== task.description) {
                  onUpdateDescription(localDescription);
                }
              }}
              autoFocus
              multiline
              numberOfLines={2}
              className="text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-700 rounded-md px-2.5 py-2 mb-2.5"
              placeholder="Add notes..."
              placeholderTextColor="#94a3b8"
            />
          ) : (
            <Pressable
              onPress={() => setEditingDescription(true)}
              className="bg-slate-50 dark:bg-slate-700/50 rounded-md px-2.5 py-2 mb-2.5"
            >
              <Text className="text-slate-600 dark:text-slate-400 text-xs" numberOfLines={2}>
                {task.description || 'Tap to add notes...'}
              </Text>
            </Pressable>
          )}
        </>

        {/* FULL TIER - Resource Planning (only if level === 'full') */}
        {level === 'full' && (
          <>
            {/* Divider */}
            <View className="h-px bg-slate-200 dark:bg-slate-700 my-3" />

            {/* Issue Alerts */}
            {(isHighCoordination || hasOverallocatedMembers) && (
              <View className="gap-2 mb-3">
                {isHighCoordination && (
                  <View className="flex-row items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5">
                    <Zap size={14} color="#f59e0b" style={{ marginTop: 1 }} />
                    <View className="flex-1">
                      <Text className="text-amber-900 dark:text-amber-100 font-semibold text-xs">
                        High coordination overhead
                      </Text>
                      <Text className="text-amber-700 dark:text-amber-300 text-[10px] mt-0.5">
                        {coordinationPercentage}% of effort goes to communication
                      </Text>
                    </View>
                  </View>
                )}
                {hasOverallocatedMembers && (
                  <View className="flex-row items-start gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5">
                    <AlertTriangle size={14} color="#ef4444" style={{ marginTop: 1 }} />
                    <View className="flex-1">
                      <Text className="text-red-900 dark:text-red-100 font-semibold text-xs">
                        Team members overallocated
                      </Text>
                      <Text className="text-red-700 dark:text-red-300 text-[10px] mt-0.5">
                        Some team members are over 100% capacity
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Team Capacity */}
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <Users size={14} color="#64748b" />
                  <Text className="text-slate-900 dark:text-white font-semibold text-xs">Team Capacity</Text>
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-[9px]">Across all tasks</Text>
              </View>

              <View className="gap-2">
                {task.allocations.map((allocation) => {
                  const member = members.find((m) => m.id === allocation.memberId);
                  if (!member) return null;

                  const capacity = getMemberTotalCapacity(allocation.memberId);
                  const utilizationPercent = Math.round((capacity.total / capacity.maxCapacity) * 100);
                  const isOverallocated = utilizationPercent > 100;
                  const isNearCapacity = utilizationPercent > 80 && utilizationPercent <= 100;

                  return (
                    <View
                      key={allocation.memberId}
                      className={`rounded-lg p-2.5 ${
                        isOverallocated
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          : isNearCapacity
                          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                          : 'bg-slate-50 dark:bg-slate-800'
                      }`}
                    >
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className="flex-row items-center gap-2 flex-1">
                          <View className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                            <Text className="text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                              {member.name.charAt(0)}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-slate-900 dark:text-white font-semibold text-xs">
                              {member.name}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-[9px]">
                              {member.role} • {member.function}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text
                            className={`font-bold text-sm ${
                              isOverallocated
                                ? 'text-red-600 dark:text-red-400'
                                : isNearCapacity
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {utilizationPercent}%
                          </Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-[9px]">capacity</Text>
                        </View>
                      </View>

                      {/* Capacity bar */}
                      <View className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                        <View
                          className={`h-full ${
                            isOverallocated ? 'bg-red-500' : isNearCapacity ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                        />
                      </View>

                      {/* Details */}
                      <View className="flex-row items-center justify-between">
                        <Text className="text-slate-600 dark:text-slate-400 text-[9px]">
                          This task: {allocation.squaresPerWeek} TU/wk
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-400 text-[9px]">
                          Total: {capacity.total}/{capacity.maxCapacity} TU • {capacity.tasks} tasks
                        </Text>
                      </View>

                      {isOverallocated && (
                        <Text className="text-red-600 dark:text-red-400 text-[9px] mt-1 font-medium">
                          ⚠️ Over by {capacity.total - capacity.maxCapacity} TU/wk
                        </Text>
                      )}

                      {/* Navigation to People Tab */}
                      <Pressable
                        onPress={() => {
                          router.push('/(tabs)/people');
                        }}
                        className="flex-row items-center justify-center gap-1 mt-2 active:opacity-70"
                      >
                        <Text className="text-blue-500 text-[9px] font-semibold">
                          View {member.name.split(' ')[0]}'s Profile
                        </Text>
                        <ChevronRight size={10} color="#3b82f6" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Coordination Cost */}
            {teamSize > 1 && (
              <View className="mb-3">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Zap size={14} color="#f59e0b" />
                  <Text className="text-slate-900 dark:text-white font-semibold text-xs">Coordination Cost</Text>
                </View>
                <View className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-slate-600 dark:text-slate-400 text-[10px]">Raw velocity</Text>
                    <Text className="text-slate-900 dark:text-white font-semibold text-xs">{rawVelocity} TU/wk</Text>
                  </View>
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-slate-600 dark:text-slate-400 text-[10px]">Communication overhead</Text>
                    <Text className="text-red-600 dark:text-red-400 font-semibold text-xs">-{coordinationCost} TU/wk</Text>
                  </View>
                  <View className="h-px bg-slate-200 dark:bg-slate-700 my-1.5" />
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-900 dark:text-white font-bold text-xs">Effective velocity</Text>
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      {effectiveVelocity.toFixed(1)} TU/wk
                    </Text>
                  </View>
                  <Text className="text-amber-700 dark:text-amber-300 text-[9px] mt-1.5">
                    {coordinationPercentage}% goes to coordination
                  </Text>
                </View>
              </View>
            )}

            {/* What-If */}
            <View className="mb-3">
              <View className="flex-row items-center gap-1.5 mb-2">
                <BarChart3 size={14} color="#8b5cf6" />
                <Text className="text-slate-900 dark:text-white font-semibold text-xs">What if we add 1 person?</Text>
              </View>
              <View className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5">
                <Text className="text-purple-700 dark:text-purple-300 text-[9px] mb-2">
                  Adding 1 person at 8 TU/wk to {teamSize}-person team
                </Text>

                <View className="gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-600 dark:text-slate-400 text-[10px]">New velocity</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-slate-500 line-through text-[10px]">{effectiveVelocity.toFixed(1)}</Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {whatIfNetVelocity.toFixed(1)} TU/wk
                      </Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-[9px]">
                        (+{velocityImprovement.toFixed(1)})
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-600 dark:text-slate-400 text-[10px]">Completion</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-slate-500 line-through text-[10px]">{estimatedWeeks.toFixed(1)}w</Text>
                      <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                        ~{whatIfWeeks.toFixed(1)}w
                      </Text>
                      {timeReduction > 0 && (
                        <Text className="text-emerald-600 dark:text-emerald-400 text-[9px]">
                          (-{timeReduction.toFixed(1)}w)
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {velocityImprovement < 2 && (
                  <View className="bg-amber-100 dark:bg-amber-900/30 rounded p-1.5 mt-2">
                    <Text className="text-amber-800 dark:text-amber-200 text-[9px]">
                      ⚠️ Only gains {velocityImprovement.toFixed(1)} TU/wk due to coordination
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Strategic Actions */}
            <View className="gap-2">
              <View className="flex-row gap-2">
                <HapticPressable
                  onPress={() => setShowAddResourceModal(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 bg-blue-500 rounded-lg py-2.5"
                >
                  <UserPlus size={14} color="#ffffff" />
                  <Text className="text-white font-bold text-xs">Add Resource</Text>
                </HapticPressable>

                <HapticPressable
                  onPress={() => setShowSplitTaskModal(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 bg-purple-500 rounded-lg py-2.5"
                >
                  <Split size={14} color="#ffffff" />
                  <Text className="text-white font-bold text-xs">Split Task</Text>
                </HapticPressable>
              </View>

              <HapticPressable
                onPress={() => setShowEscalateModal(true)}
                className="flex-row items-center justify-center gap-1.5 bg-amber-500 rounded-lg py-2.5"
              >
                <ArrowUpCircle size={16} color="#ffffff" />
                <Text className="text-white font-bold text-xs">Escalate to Leadership</Text>
              </HapticPressable>
            </View>
          </>
        )}

        {/* Footer */}
        <View className="flex-row items-center gap-2 mt-2.5">
          {level === 'medium' && onExpandMore && (
            <HapticPressable
              onPress={onExpandMore}
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-blue-500 rounded-md py-2"
            >
              <ChevronDown size={14} color="#ffffff" />
              <Text className="text-white font-semibold text-xs">Resource Planning</Text>
            </HapticPressable>
          )}

          <HapticPressable
            onPress={onClose}
            className="w-10 h-8 items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-md"
          >
            <ChevronUp size={16} color="#64748b" />
          </HapticPressable>
        </View>
      </View>
    </Animated.View>

    {/* Add Resource Modal */}
    <Modal
      visible={showAddResourceModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddResourceModal(false)}
    >
      <Pressable className="flex-1 bg-black/70" onPress={() => setShowAddResourceModal(false)}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <View className="p-6">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                      <UserPlus size={20} color="#3b82f6" />
                    </View>
                    <Text className="text-slate-900 dark:text-white font-bold text-lg">Add Resource</Text>
                  </View>
                  <HapticPressable onPress={() => setShowAddResourceModal(false)}>
                    <X size={24} color="#64748b" />
                  </HapticPressable>
                </View>

                {/* Select Member */}
                <View className="mb-6">
                  <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-3">Select Team Member</Text>
                  <View className="gap-2">
                    {members
                      .filter((m) => !task.allocations.some((a) => a.memberId === m.id))
                      .map((member) => {
                        const capacity = getMemberTotalCapacity(member.id);
                        const isSelected = selectedMemberId === member.id;

                        return (
                          <HapticPressable
                            key={member.id}
                            onPress={() => setSelectedMemberId(member.id)}
                            className={`flex-row items-center justify-between p-3 rounded-lg border ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <View className="flex-row items-center gap-3 flex-1">
                              <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                                <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                                  {member.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
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
                            <View className="items-end">
                              <Text
                                className={`font-bold text-sm ${
                                  capacity.available <= 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : capacity.available < 4
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {capacity.available} TU
                              </Text>
                              <Text className="text-slate-500 dark:text-slate-400 text-xs">available</Text>
                            </View>
                          </HapticPressable>
                        );
                      })}
                  </View>
                </View>

                {/* Allocation Amount */}
                {selectedMemberId && (
                  <View className="mb-6">
                    <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-3">
                      Time Units per Week
                    </Text>
                    <View className="flex-row gap-2">
                      {[2, 4, 6, 8, 10].map((amount) => (
                        <HapticPressable
                          key={amount}
                          onPress={() => setNewAllocationSquares(amount)}
                          className={`flex-1 py-3 rounded-lg ${
                            newAllocationSquares === amount
                              ? 'bg-blue-500'
                              : 'bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          <Text
                            className={`text-center font-bold text-sm ${
                              newAllocationSquares === amount
                                ? 'text-white'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {amount}
                          </Text>
                        </HapticPressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <HapticPressable
                    onPress={() => setShowAddResourceModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    <Text className="text-slate-900 dark:text-white font-bold text-sm text-center">Cancel</Text>
                  </HapticPressable>
                  <HapticPressable
                    onPress={handleAddResource}
                    disabled={!selectedMemberId}
                    className={`flex-1 py-3 rounded-lg ${
                      selectedMemberId ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <Text
                      className={`font-bold text-sm text-center ${
                        selectedMemberId ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      Add Resource
                    </Text>
                  </HapticPressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>

    {/* Split Task Modal */}
    <Modal
      visible={showSplitTaskModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSplitTaskModal(false)}
    >
      <Pressable className="flex-1 bg-black/70" onPress={() => setShowSplitTaskModal(false)}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <View className="p-6">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                      <Split size={20} color="#8b5cf6" />
                    </View>
                    <Text className="text-slate-900 dark:text-white font-bold text-lg">Split Task</Text>
                  </View>
                  <HapticPressable onPress={() => setShowSplitTaskModal(false)}>
                    <X size={24} color="#64748b" />
                  </HapticPressable>
                </View>

                {/* Original Task Info */}
                <View className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-6">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">Splitting task:</Text>
                  <Text className="text-slate-900 dark:text-white font-semibold text-sm">{task.title}</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    {task.estimatedTimeUnits} TUs total
                  </Text>
                </View>

                {/* Task 1 Name */}
                <View className="mb-4">
                  <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-2">First Task Name</Text>
                  <TextInput
                    value={splitTaskName1}
                    onChangeText={setSplitTaskName1}
                    className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white text-sm"
                    placeholder="Enter first task name..."
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Task 2 Name */}
                <View className="mb-6">
                  <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-2">Second Task Name</Text>
                  <TextInput
                    value={splitTaskName2}
                    onChangeText={setSplitTaskName2}
                    className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white text-sm"
                    placeholder="Enter second task name..."
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Split Percentage */}
                <View className="mb-6">
                  <Text className="text-slate-900 dark:text-white font-semibold text-sm mb-3">
                    Split {splitPercentage}% / {100 - splitPercentage}%
                  </Text>
                  <View className="flex-row gap-2 mb-3">
                    {[30, 40, 50, 60, 70].map((percent) => (
                      <HapticPressable
                        key={percent}
                        onPress={() => setSplitPercentage(percent)}
                        className={`flex-1 py-2 rounded-lg ${
                          splitPercentage === percent ? 'bg-purple-500' : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        <Text
                          className={`text-center font-bold text-xs ${
                            splitPercentage === percent ? 'text-white' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {percent}%
                        </Text>
                      </HapticPressable>
                    ))}
                  </View>
                  <View className="flex-row items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <View className="flex-1">
                      <Text className="text-purple-700 dark:text-purple-300 font-semibold text-xs">Task 1</Text>
                      <Text className="text-purple-600 dark:text-purple-400 text-xs">
                        {Math.round(task.estimatedTimeUnits * (splitPercentage / 100))} TUs
                      </Text>
                    </View>
                    <View className="flex-1 items-end">
                      <Text className="text-purple-700 dark:text-purple-300 font-semibold text-xs">Task 2</Text>
                      <Text className="text-purple-600 dark:text-purple-400 text-xs">
                        {task.estimatedTimeUnits - Math.round(task.estimatedTimeUnits * (splitPercentage / 100))} TUs
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <HapticPressable
                    onPress={() => setShowSplitTaskModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    <Text className="text-slate-900 dark:text-white font-bold text-sm text-center">Cancel</Text>
                  </HapticPressable>
                  <HapticPressable
                    onPress={handleSplitTask}
                    disabled={!splitTaskName1 || !splitTaskName2}
                    className={`flex-1 py-3 rounded-lg ${
                      splitTaskName1 && splitTaskName2 ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <Text
                      className={`font-bold text-sm text-center ${
                        splitTaskName1 && splitTaskName2 ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      Split Task
                    </Text>
                  </HapticPressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>

    {/* Escalate to Leadership Modal */}
    <Modal
      visible={showEscalateModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEscalateModal(false)}
    >
      <Pressable className="flex-1 bg-black/70" onPress={() => setShowEscalateModal(false)}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <View className="p-6">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center">
                      <ArrowUpCircle size={20} color="#f59e0b" />
                    </View>
                    <Text className="text-slate-900 dark:text-white font-bold text-lg">Escalate to Leadership</Text>
                  </View>
                  <HapticPressable onPress={() => setShowEscalateModal(false)}>
                    <X size={24} color="#64748b" />
                  </HapticPressable>
                </View>

                {/* Warning */}
                <View className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-6">
                  <View className="flex-row items-start gap-3">
                    <AlertTriangle size={20} color="#f59e0b" style={{ marginTop: 2 }} />
                    <View className="flex-1">
                      <Text className="text-amber-900 dark:text-amber-100 font-bold text-sm mb-1">
                        This will flag the task for leadership review
                      </Text>
                      <Text className="text-amber-700 dark:text-amber-300 text-xs">
                        The task description will be updated to indicate it has been escalated and requires
                        leadership attention for resource constraints or timeline concerns.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Task Info */}
                <View className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">Task to escalate:</Text>
                  <Text className="text-slate-900 dark:text-white font-bold text-base mb-3">{task.title}</Text>

                  <View className="flex-row items-center gap-4">
                    <View>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">Team Size</Text>
                      <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                        {task.allocations.length} members
                      </Text>
                    </View>
                    <View>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">Progress</Text>
                      <Text className="text-slate-900 dark:text-white font-semibold text-sm">{task.progress}%</Text>
                    </View>
                    <View>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">Due Date</Text>
                      <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <HapticPressable
                    onPress={() => setShowEscalateModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    <Text className="text-slate-900 dark:text-white font-bold text-sm text-center">Cancel</Text>
                  </HapticPressable>
                  <HapticPressable
                    onPress={handleEscalate}
                    className="flex-1 py-3 bg-amber-500 rounded-lg"
                  >
                    <Text className="text-white font-bold text-sm text-center">Escalate Task</Text>
                  </HapticPressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}
