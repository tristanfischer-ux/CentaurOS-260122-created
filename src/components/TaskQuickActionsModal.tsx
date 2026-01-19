/**
 * TaskQuickActionsModal - Interactive modal for the When tab
 * Allows quick actions on tasks directly from the Gantt chart:
 * - Change status
 * - Update progress
 * - Reschedule due date
 * - View team
 * - Navigate to full details
 */

import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  ChevronRight,
  Minus,
  Plus,
  CalendarDays,
  RotateCcw,
} from 'lucide-react-native';
import { type WorkPlan, useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { lightImpact, mediumImpact, successNotification } from '@/lib/haptics';
import type { Function as BusinessFunction } from '@/types';
import { RoleAvatar } from './Avatar';

interface TaskQuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
  task: WorkPlan | null;
  onNavigateToDetails?: (taskId: string) => void;
}

const FUNCTION_COLORS: Record<BusinessFunction, string> = {
  Marketing: '#ec4899',
  Sales: '#8b5cf6',
  Engineering: '#f59e0b',
  Ops: '#3b82f6',
  Finance: '#10b981',
  Admin: '#6366f1',
};

const STATUS_CONFIG = {
  'not-started': {
    label: 'Not Started',
    icon: Clock,
    color: '#6b7280',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Play,
    color: '#3b82f6',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  'blocked': {
    label: 'Blocked',
    icon: AlertTriangle,
    color: '#ef4444',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  'completed': {
    label: 'Completed',
    icon: CheckCircle2,
    color: '#10b981',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  'abandoned': {
    label: 'Abandoned',
    icon: X,
    color: '#9ca3af',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
};

export function TaskQuickActionsModal({
  visible,
  onClose,
  task,
  onNavigateToDetails,
}: TaskQuickActionsModalProps) {
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const completeWorkPlan = useWorkPlanStore(s => s.completeWorkPlan);
  const members = useOrganizationStore(s => s.members);

  // Local state for editing
  const [localProgress, setLocalProgress] = useState(0);
  const [localDueDate, setLocalDueDate] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Animation
  const progressAnim = useSharedValue(0);

  // Animated progress bar style - must be called before early return
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%`,
  }));

  // Sync local state with task
  useEffect(() => {
    if (task) {
      setLocalProgress(task.progress);
      setLocalDueDate(task.dueDate);
      setHasChanges(false);
      progressAnim.value = withSpring(task.progress / 100);
    }
  }, [task?.id, task?.progress, task?.dueDate]);

  if (!task) return null;

  const functionColor = FUNCTION_COLORS[task.function as BusinessFunction] || '#6366f1';
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG['not-started'];
  const StatusIcon = statusConfig.icon;

  // Get assigned members
  const assignedMembers = task.allocations
    .map(alloc => members.find(m => m.id === alloc.memberId))
    .filter(Boolean);

  // Handlers
  const handleStatusChange = (newStatus: WorkPlan['status']) => {
    lightImpact();

    if (newStatus === 'completed') {
      completeWorkPlan(task.id);
      successNotification();
      onClose();
      return;
    }

    updateWorkPlan(task.id, { status: newStatus });
    setHasChanges(true);
  };

  const handleProgressChange = (delta: number) => {
    lightImpact();
    const newProgress = Math.max(0, Math.min(100, localProgress + delta));
    setLocalProgress(newProgress);
    progressAnim.value = withSpring(newProgress / 100);
    setHasChanges(true);
  };

  const handleDueDateChange = (days: number) => {
    lightImpact();
    const currentDate = new Date(localDueDate);
    currentDate.setDate(currentDate.getDate() + days);
    setLocalDueDate(currentDate.toISOString().split('T')[0]);
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    mediumImpact();
    updateWorkPlan(task.id, {
      progress: localProgress,
      dueDate: localDueDate,
      // Auto-update status based on progress
      status: localProgress === 100 ? 'completed' :
              localProgress > 0 && task.status === 'not-started' ? 'in-progress' :
              task.status,
    });

    if (localProgress === 100) {
      successNotification();
    }

    setHasChanges(false);
    onClose();
  };

  const handleViewDetails = () => {
    onClose();
    onNavigateToDetails?.(task.id);
  };

  // Format dates
  const dueDateDisplay = new Date(localDueDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const daysUntilDue = Math.ceil(
    (new Date(localDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysUntilDue < 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/70"
        onPress={onClose}
      >
        <View className="flex-1" />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ maxHeight: '90%' }}
        >
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden">
            {/* Header */}
            <View
              className="px-5 pt-5 pb-4"
              style={{ backgroundColor: functionColor + '15' }}
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-3">
                  {/* Function & Status badges */}
                  <View className="flex-row items-center gap-2 mb-2">
                    <View
                      className="px-2 py-1 rounded-lg"
                      style={{ backgroundColor: functionColor + '30' }}
                    >
                      <Text className="text-xs font-bold" style={{ color: functionColor }}>
                        {task.function}
                      </Text>
                    </View>
                    <View className={`flex-row items-center px-2 py-1 rounded-lg ${statusConfig.bgColor}`}>
                      <StatusIcon size={12} color={statusConfig.color} />
                      <Text
                        className="text-xs font-bold ml-1"
                        style={{ color: statusConfig.color }}
                      >
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">
                    {task.title}
                  </Text>
                </View>

                <Pressable
                  onPress={onClose}
                  className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full items-center justify-center active:opacity-70"
                >
                  <X size={20} color="#6b7280" />
                </Pressable>
              </View>

              {/* Due Date Display */}
              <View className="flex-row items-center">
                <Calendar size={14} color={isOverdue ? '#ef4444' : functionColor} />
                <Text
                  className={`text-sm ml-2 font-medium ${
                    isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-slate-300'
                  }`}
                >
                  Due: {dueDateDisplay}
                  {isOverdue ? ` (${Math.abs(daysUntilDue)}d overdue)` : daysUntilDue <= 7 ? ` (${daysUntilDue}d left)` : ''}
                </Text>
              </View>
            </View>

            {/* Scrollable Content Area */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Quick Status Change */}
              {task.status !== 'completed' && task.status !== 'abandoned' && (
                <View className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                  <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                    Quick Status Change
                  </Text>
                  <View className="flex-row gap-2">
                    {(['not-started', 'in-progress', 'blocked', 'completed'] as const).map((status) => {
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      const isActive = task.status === status;

                      return (
                        <Pressable
                          key={status}
                          onPress={() => handleStatusChange(status)}
                          className={`flex-1 py-3 rounded-xl items-center justify-center ${
                            isActive ? '' : 'opacity-60'
                          } active:opacity-80`}
                          style={{
                            backgroundColor: isActive ? config.color + '20' : '#f3f4f6',
                            borderWidth: isActive ? 2 : 0,
                            borderColor: config.color,
                          }}
                        >
                          <Icon
                            size={20}
                            color={isActive ? config.color : '#9ca3af'}
                          />
                          <Text
                            className="text-xs font-semibold mt-1"
                            style={{ color: isActive ? config.color : '#6b7280' }}
                          >
                            {status === 'not-started' ? 'Queue' :
                             status === 'in-progress' ? 'Start' :
                             status === 'blocked' ? 'Block' : 'Done'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Progress Control */}
              {task.status !== 'completed' && task.status !== 'abandoned' && (
                <View className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      Progress
                    </Text>
                    <Text className="text-2xl font-bold" style={{ color: functionColor }}>
                      {localProgress}%
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                    <Animated.View
                      className="h-full rounded-full"
                      style={[
                        { backgroundColor: functionColor },
                        progressBarStyle,
                      ]}
                    />
                  </View>

                  {/* Progress Controls */}
                  <View className="flex-row items-center justify-center gap-4">
                    <Pressable
                      onPress={() => handleProgressChange(-10)}
                      className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl items-center justify-center active:opacity-70"
                    >
                      <Minus size={24} color="#6b7280" />
                    </Pressable>

                    <View className="flex-row items-center gap-2">
                      {[25, 50, 75, 100].map((preset) => (
                        <Pressable
                          key={preset}
                          onPress={() => {
                            lightImpact();
                            setLocalProgress(preset);
                            progressAnim.value = withSpring(preset / 100);
                            setHasChanges(true);
                          }}
                          className={`px-3 py-2 rounded-lg ${
                            localProgress === preset
                              ? 'bg-gray-900 dark:bg-white'
                              : 'bg-gray-100 dark:bg-slate-800'
                          } active:opacity-70`}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              localProgress === preset
                                ? 'text-white dark:text-gray-900'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {preset}%
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => handleProgressChange(10)}
                      className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl items-center justify-center active:opacity-70"
                    >
                      <Plus size={24} color="#6b7280" />
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Reschedule */}
              {task.status !== 'completed' && task.status !== 'abandoned' && (
                <View className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      Reschedule Due Date
                    </Text>
                    <View className="flex-row items-center">
                      <CalendarDays size={16} color={functionColor} />
                      <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">
                        {dueDateDisplay}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-center gap-3">
                    <Pressable
                      onPress={() => handleDueDateChange(-7)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl items-center active:opacity-70"
                    >
                      <Text className="text-gray-700 dark:text-gray-300 font-semibold">-1 Week</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDueDateChange(-1)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl items-center active:opacity-70"
                    >
                      <Text className="text-gray-700 dark:text-gray-300 font-semibold">-1 Day</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        lightImpact();
                        setLocalDueDate(task.dueDate);
                        setHasChanges(true);
                      }}
                      className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl items-center justify-center active:opacity-70"
                    >
                      <RotateCcw size={18} color="#6b7280" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDueDateChange(1)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl items-center active:opacity-70"
                    >
                      <Text className="text-gray-700 dark:text-gray-300 font-semibold">+1 Day</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDueDateChange(7)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl items-center active:opacity-70"
                    >
                      <Text className="text-gray-700 dark:text-gray-300 font-semibold">+1 Week</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Team Members Preview */}
              <View className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Users size={16} color="#6b7280" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      Team ({assignedMembers.length})
                    </Text>
                  </View>
                </View>

                {assignedMembers.length > 0 ? (
                  <View className="flex-row flex-wrap gap-2">
                    {assignedMembers.map((member) => {
                      if (!member) return null;
                      const allocation = task.allocations.find(a => a.memberId === member.id);
                      return (
                        <View
                          key={member.id}
                          className="flex-row items-center bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-lg"
                        >
                          <View className="mr-2">
                            <RoleAvatar name={member.name} role={member.role} size="sm" />
                          </View>
                          <View>
                            <Text className="text-gray-900 dark:text-white text-sm font-medium">
                              {member.name.split(' ')[0]}
                            </Text>
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">
                              {allocation?.squaresPerWeek || 0} TU/wk
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text className="text-gray-500 dark:text-slate-400 text-sm italic">
                    No team members assigned
                  </Text>
                )}
              </View>

              {/* Task Info Summary */}
              <View className="px-5 py-4">
                <View className="flex-row gap-4">
                  <View className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 items-center">
                    <Clock size={20} color={functionColor} />
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">Est. TUs</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">
                      {task.estimatedTimeUnits}
                    </Text>
                  </View>
                  <View className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 items-center">
                    <Clock size={20} color="#10b981" />
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">TUs Spent</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">
                      {task.tusExpended}
                    </Text>
                  </View>
                  <View className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 items-center">
                    <Clock size={20} color="#f59e0b" />
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">Remaining</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">
                      {Math.max(0, task.estimatedTimeUnits - task.tusExpended)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 gap-3">
              {hasChanges && (
                <Pressable
                  onPress={handleSaveChanges}
                  className="py-3.5 rounded-xl items-center active:opacity-80"
                  style={{ backgroundColor: functionColor }}
                >
                  <Text className="text-white font-bold text-base">
                    Save Changes
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleViewDetails}
                className="flex-row items-center justify-center py-3.5 bg-gray-100 dark:bg-slate-800 rounded-xl active:opacity-70"
              >
                <Text className="text-gray-900 dark:text-white font-semibold mr-2">
                  View Full Details
                </Text>
                <ChevronRight size={18} color="#6b7280" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
