/**
 * What Tab - Task Execution
 * Tasks, Gantt chart, and resource allocations
 */

import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import {
  CheckSquare,
  Plus,
  X,
  Clock,
  Users,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Target,
  Zap,
  Filter,
  BarChart3,
  ListTodo,
  GanttChartSquare,
  HelpCircle,
  Trash2,
  Edit3,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useCurrentMembership, useCurrentWorkspace } from '@/lib/state/app-store';
import type { OrganizationMember } from '@/lib/organization-seed';
import type { Function as BusinessFunction } from '@/types';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { CollapsibleResourcePool } from '@/components/CollapsibleResourcePool';
import { MiniGanttChart } from '@/components/MiniGanttChart';
import { UnifiedTaskAllocationModal } from '@/components/UnifiedTaskAllocationModal';
import { SquaresDisplay } from '@/components/SquaresDisplay';
import { CompactTaskCard } from '@/components/CompactTaskCard';

const WHAT_HELP: HelpContent = {
  title: 'Task Execution',
  subtitle: 'Plan, allocate, and execute work',
  description: 'The What tab is your task management hub. View all tasks in a Gantt timeline, allocate team members, and track progress. Use the resource pool to see who has capacity and assign them to tasks.',
  tips: [
    'Tasks are organized by status: In Progress, Queued, Blocked, and Completed',
    'Click any task to open the allocation panel and assign team members',
    'The Gantt chart shows task timelines - scroll left/right to see different weeks',
    'Resource Pool at the bottom shows who has available capacity',
    'Long-press a task to see quick actions like start, block, or complete',
  ],
  quickActions: [
    { label: 'Create Task', description: 'Add a new task with title, function, and estimated TUs' },
    { label: 'Allocate Resources', description: 'Assign team members and their weekly TU contribution' },
    { label: 'Gantt Timeline', description: 'Visual timeline of all tasks and their durations' },
    { label: 'Resource Pool', description: 'See team capacity and quickly allocate to tasks' },
  ],
};

const STATUS_CONFIG = {
  'in-progress': { label: 'In Progress', color: '#3b82f6', bgColor: '#3b82f620', icon: Play },
  'not-started': { label: 'Queued', color: '#64748b', bgColor: '#64748b20', icon: Clock },
  'blocked': { label: 'Blocked', color: '#ef4444', bgColor: '#ef444420', icon: AlertTriangle },
  'completed': { label: 'Completed', color: '#10b981', bgColor: '#10b98120', icon: CheckCircle2 },
  'abandoned': { label: 'Abandoned', color: '#94a3b8', bgColor: '#94a3b820', icon: X },
};

const FUNCTION_COLORS: Record<string, string> = {
  Marketing: '#ec4899',
  Sales: '#f59e0b',
  Finance: '#10b981',
  Engineering: '#3b82f6',
  Ops: '#8b5cf6',
  Admin: '#64748b',
};

type ViewMode = 'list' | 'gantt';
type StatusFilter = 'all' | 'in-progress' | 'not-started' | 'blocked' | 'completed';

export default function WhatScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const currentWorkspace = useCurrentWorkspace();

  // Stores
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const addWorkPlan = useWorkPlanStore(s => s.addWorkPlan);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const completeWorkPlan = useWorkPlanStore(s => s.completeWorkPlan);
  const abandonWorkPlan = useWorkPlanStore(s => s.abandonWorkPlan);

  // State
  const [showHelp, setShowHelp] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [functionFilter, setFunctionFilter] = useState<BusinessFunction | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<WorkPlan | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResourcePool, setShowResourcePool] = useState(false);

  // Create task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskFunction, setNewTaskFunction] = useState<BusinessFunction>('Engineering');
  const [newTaskEstimate, setNewTaskEstimate] = useState('10');

  const isFounder = currentMembership?.role === 'Founder';

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return workPlans.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesFunction = functionFilter === 'all' || task.function === functionFilter;
      return matchesStatus && matchesFunction;
    });
  }, [workPlans, statusFilter, functionFilter]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, WorkPlan[]> = {
      'in-progress': [],
      'not-started': [],
      'blocked': [],
      'completed': [],
    };
    filteredTasks.forEach(task => {
      if (task.status !== 'abandoned' && grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    const active = workPlans.filter(t => t.status === 'in-progress').length;
    const queued = workPlans.filter(t => t.status === 'not-started').length;
    const blocked = workPlans.filter(t => t.status === 'blocked').length;
    const completed = workPlans.filter(t => t.status === 'completed').length;
    return { active, queued, blocked, completed };
  }, [workPlans]);

  // Get allocated members for a task
  const getTaskMembers = (task: WorkPlan) => {
    if (!task.allocations || task.allocations.length === 0) return [];
    return task.allocations.map(alloc => {
      const member = members.find(m => m.id === alloc.memberId);
      return { ...alloc, member };
    }).filter(a => a.member);
  };

  // Handle task creation
  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || !currentWorkspace) return;

    const newTask: WorkPlan = {
      id: `task-${Date.now()}`,
      workspaceId: currentWorkspace.id,
      title: newTaskTitle.trim(),
      description: '',
      function: newTaskFunction,
      status: 'not-started',
      progress: 0,
      estimatedTimeUnits: parseInt(newTaskEstimate) || 10,
      allocations: [],
      appliedAITools: [],
      tusExpended: 0,
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      assignedBy: currentMembership?.id || 'founder',
      needsSubmission: false,
    };

    addWorkPlan(newTask);
    setNewTaskTitle('');
    setNewTaskEstimate('10');
    setShowCreateModal(false);
  };

  // Handle task status change
  const handleStartTask = (task: WorkPlan) => {
    updateWorkPlan(task.id, { status: 'in-progress' });
  };

  const handleBlockTask = (task: WorkPlan) => {
    updateWorkPlan(task.id, { status: 'blocked' });
  };

  const handleCompleteTask = (task: WorkPlan) => {
    completeWorkPlan(task.id);
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={WHAT_HELP}
        gradientColors={['#10b981', '#059669']}
      />

      {/* Task Allocation Modal */}
      <UnifiedTaskAllocationModal
        visible={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        workPlan={selectedTask}
      />

      {/* Create Task Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable className="flex-1 bg-black/70" onPress={() => setShowCreateModal(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '80%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-slate-900 dark:text-white font-bold text-xl">Create Task</Text>
                <Pressable onPress={() => setShowCreateModal(false)} className="p-2">
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>

              {/* Title */}
              <View className="mb-4">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Task Title</Text>
                <TextInput
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  placeholder="What needs to be done?"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                />
              </View>

              {/* Function */}
              <View className="mb-4">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Function</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {(['Marketing', 'Sales', 'Finance', 'Engineering', 'Ops', 'Admin'] as BusinessFunction[]).map(func => (
                      <Pressable
                        key={func}
                        onPress={() => setNewTaskFunction(func)}
                        className={`px-4 py-2 rounded-lg ${newTaskFunction === func ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-800'}`}
                      >
                        <Text className={`font-medium ${newTaskFunction === func ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          {func}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Estimated TUs */}
              <View className="mb-6">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Estimated Time Units</Text>
                <TextInput
                  value={newTaskEstimate}
                  onChangeText={setNewTaskEstimate}
                  placeholder="10"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                />
                <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  1 TU = 4 hours of focused work
                </Text>
              </View>

              {/* Create Button */}
              <Pressable
                onPress={handleCreateTask}
                className="bg-blue-500 py-4 rounded-xl items-center"
                disabled={!newTaskTitle.trim()}
              >
                <Text className="text-white font-bold text-base">Create Task</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Tasks</Text>
            <Text className="text-white text-2xl font-bold">What</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="bg-white/20 p-2 rounded-full"
            >
              <Plus size={20} color="white" />
            </Pressable>
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          <View className="items-center flex-1">
            <Text className="text-white/70 text-xs">Active</Text>
            <Text className="text-white font-bold text-lg">{stats.active}</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Queued</Text>
            <Text className="text-white font-bold text-lg">{stats.queued}</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Blocked</Text>
            <Text className="text-red-300 font-bold text-lg">{stats.blocked}</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Done</Text>
            <Text className="text-emerald-300 font-bold text-lg">{stats.completed}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View className="px-5 pt-4 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {(['all', 'in-progress', 'not-started', 'blocked', 'completed'] as StatusFilter[]).map(status => {
              const config = status === 'all' ? { label: 'All', color: '#64748b' } : STATUS_CONFIG[status];
              return (
                <Pressable
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full flex-row items-center gap-1 ${
                    statusFilter === status ? 'bg-slate-900 dark:bg-white' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      statusFilter === status ? 'text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {config.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
      >
        {/* In Progress */}
        {tasksByStatus['in-progress'].length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Play size={18} color="#3b82f6" />
              <Text className="text-slate-900 dark:text-white font-semibold text-base">
                In Progress ({tasksByStatus['in-progress'].length})
              </Text>
            </View>
            {tasksByStatus['in-progress'].map((task, index) => {
              const taskMembers = task.assignedMemberIds?.map(id => members.find(m => m.id === id)).filter(Boolean) as OrganizationMember[];
              return (
                <CompactTaskCard
                  key={task.id}
                  task={task}
                  assignedMembers={taskMembers}
                  onPress={() => {}}
                  onFullDetailPress={() => {
                    setSelectedTask(task);
                    setShowTaskModal(true);
                  }}
                />
              );
            })}
          </View>
        )}

        {/* Blocked */}
        {tasksByStatus['blocked'].length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <AlertTriangle size={18} color="#ef4444" />
              <Text className="text-slate-900 dark:text-white font-semibold text-base">
                Blocked ({tasksByStatus['blocked'].length})
              </Text>
            </View>
            {tasksByStatus['blocked'].map((task, index) => {
              const taskMembers = task.assignedMemberIds?.map(id => members.find(m => m.id === id)).filter(Boolean) as OrganizationMember[];
              return (
                <CompactTaskCard
                  key={task.id}
                  task={task}
                  assignedMembers={taskMembers}
                  onPress={() => {}}
                  onFullDetailPress={() => {
                    setSelectedTask(task);
                    setShowTaskModal(true);
                  }}
                />
              );
            })}
          </View>
        )}

        {/* Queued */}
        {tasksByStatus['not-started'].length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Clock size={18} color="#64748b" />
              <Text className="text-slate-900 dark:text-white font-semibold text-base">
                Queued ({tasksByStatus['not-started'].length})
              </Text>
            </View>
            {tasksByStatus['not-started'].map((task, index) => {
              const taskMembers = task.assignedMemberIds?.map(id => members.find(m => m.id === id)).filter(Boolean) as OrganizationMember[];
              return (
                <CompactTaskCard
                  key={task.id}
                  task={task}
                  assignedMembers={taskMembers}
                  onPress={() => {}}
                  onFullDetailPress={() => {
                    setSelectedTask(task);
                    setShowTaskModal(true);
                  }}
                />
              );
            })}
          </View>
        )}

        {/* Completed */}
        {tasksByStatus['completed'].length > 0 && statusFilter === 'all' && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <CheckCircle2 size={18} color="#10b981" />
              <Text className="text-slate-900 dark:text-white font-semibold text-base">
                Completed ({tasksByStatus['completed'].length})
              </Text>
            </View>
            {tasksByStatus['completed'].slice(0, 5).map((task, index) => {
              const taskMembers = task.assignedMemberIds?.map(id => members.find(m => m.id === id)).filter(Boolean) as OrganizationMember[];
              return (
                <CompactTaskCard
                  key={task.id}
                  task={task}
                  assignedMembers={taskMembers}
                  onPress={() => {}}
                  onFullDetailPress={() => {
                    setSelectedTask(task);
                    setShowTaskModal(true);
                  }}
                />
              );
            })}
            {tasksByStatus['completed'].length > 5 && (
              <Pressable className="py-3 items-center">
                <Text className="text-blue-500 font-medium">
                  View all {tasksByStatus['completed'].length} completed tasks
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Empty state */}
        {filteredTasks.length === 0 && (
          <View className="items-center py-12">
            <CheckSquare size={48} color="#94a3b8" />
            <Text className="text-slate-500 dark:text-slate-400 text-center mt-4 text-base">
              No tasks found
            </Text>
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Create First Task</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Collapsible Resource Pool */}
      <CollapsibleResourcePool
        onPersonSelect={(personId) => {
          // If a task is selected, we could auto-allocate
          console.log('Person selected:', personId);
        }}
        selectedPersonId={null}
      />
    </View>
  );
}
