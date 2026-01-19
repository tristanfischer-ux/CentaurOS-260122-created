/**
 * Tasks Tab - Task Management
 * Status-first view: Doing / Queued / Blocked / Done
 *
 * MIGRATION: This tab consolidates features from 'what', 'decide', 'do' tabs
 * Anti-bloat: This is the ONLY place to create/edit/confirm tasks
 */

import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  CheckSquare,
  Plus,
  X,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Target,
  Filter,
  Sparkles,
  Calendar,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useCurrentMembership, useCurrentWorkspace } from '@/lib/state/app-store';
import type { OrganizationMember } from '@/lib/organization-seed';
import type { Function as BusinessFunction } from '@/types';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { UnifiedTaskAllocationModal } from '@/components/UnifiedTaskAllocationModal';
import { CompactTaskCard } from '@/components/CompactTaskCard';
import { filterWorkPlansByRole } from '@/lib/role-utils';
import { UnifiedBottomDrawer } from '@/components/UnifiedBottomDrawer';
import { TaskDraftsReviewModal } from '@/components/TaskDraftsReviewModal';
import { extractTasksFromText } from '@/lib/ai/task-extraction';

interface TaskDraft {
  id: string;
  title: string;
  notes?: string;
  assignee_id?: string;
  start_iso?: string;
  due_iso?: string;
  units: number;
  confidence_assignee?: number;
  confidence_due?: number;
}

const TASKS_HELP: HelpContent = {
  title: 'Tasks',
  subtitle: 'Manage all your work',
  description: 'The Tasks tab is the single source of truth for all tasks. View by status, create new tasks via voice or text, and manage task lifecycle.',
  tips: [
    'Tasks are organized by status: Doing, Queued, Blocked, Done',
    'Use voice or text input to create task drafts',
    'All task drafts require confirmation before becoming real tasks',
    'Tap a task to view details and allocate team members',
    'Link to When tab to see timeline, link to People to see who\'s assigned',
  ],
  quickActions: [
    { label: 'Create Task', description: 'Add a new task via voice or text' },
    { label: 'View by Status', description: 'Filter tasks by Doing/Queued/Blocked/Done' },
    { label: 'Allocate Team', description: 'Assign people to tasks' },
  ],
};

const STATUS_CONFIG = {
  'in-progress': { label: 'Doing', color: '#3b82f6', bgColor: '#3b82f620', icon: Play },
  'not-started': { label: 'Queued', color: '#64748b', bgColor: '#64748b20', icon: Clock },
  'blocked': { label: 'Blocked', color: '#ef4444', bgColor: '#ef444420', icon: AlertTriangle },
  'completed': { label: 'Done', color: '#10b981', bgColor: '#10b98120', icon: CheckCircle2 },
  'abandoned': { label: 'Abandoned', color: '#94a3b8', bgColor: '#94a3b820', icon: X },
};

type StatusFilter = 'all' | 'in-progress' | 'not-started' | 'blocked' | 'completed';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const currentWorkspace = useCurrentWorkspace();

  // Stores
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const addWorkPlan = useWorkPlanStore(s => s.addWorkPlan);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);

  // Fallback for demo mode
  const effectiveMembership = currentMembership ||
    (members.length > 0
      ? { id: members[0].id, role: members[0].role, function: members[0].function }
      : { id: '00000000-0000-0000-0000-000000000001', role: 'Founder' as const, function: 'Engineering' as const });

  const effectiveWorkspace = currentWorkspace || {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Demo Workspace'
  };

  // State
  const [showHelp, setShowHelp] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedTask, setSelectedTask] = useState<WorkPlan | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [openDrawerToNewTask, setOpenDrawerToNewTask] = useState(false);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showDraftsReview, setShowDraftsReview] = useState(false);
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([]);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);
  const [isConfirmingDrafts, setIsConfirmingDrafts] = useState(false);

  // Role-based filtering
  const roleFilteredTasks = useMemo(() => {
    if (!currentMembership?.role) return workPlans;
    return filterWorkPlansByRole(
      workPlans,
      currentMembership.role,
      currentMembership.function,
      currentMembership.id
    );
  }, [workPlans, currentMembership]);

  // UI filter
  const filteredTasks = useMemo(() => {
    return roleFilteredTasks.filter(task => {
      return statusFilter === 'all' || task.status === statusFilter;
    });
  }, [roleFilteredTasks, statusFilter]);

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
    const doing = roleFilteredTasks.filter(t => t.status === 'in-progress').length;
    const queued = roleFilteredTasks.filter(t => t.status === 'not-started').length;
    const blocked = roleFilteredTasks.filter(t => t.status === 'blocked').length;
    const done = roleFilteredTasks.filter(t => t.status === 'completed').length;
    return { doing, queued, blocked, done };
  }, [roleFilteredTasks]);

  // Handle voice transcript
  const handleVoiceTranscript = (transcript: string) => {
    setVoiceTranscript(transcript);
    setShowVoiceTranscript(true);
  };

  // Handle text input
  const handleTextInput = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessingTranscript(true);
    try {
      const extraction = await extractTasksFromText(text, 'text');
      if (extraction.tasks.length === 0) {
        alert('No tasks found. Please try again with clearer instructions.');
        return;
      }

      const drafts: TaskDraft[] = extraction.tasks.map((task, index) => ({
        id: `draft-${Date.now()}-${index}`,
        title: task.title,
        notes: task.notes || '',
        due_iso: task.due_date || undefined,
        units: task.units,
        confidence_assignee: task.confidence_assignee,
        confidence_due: task.confidence_due,
      }));

      setTaskDrafts(drafts);
      setShowDraftsReview(true);
    } catch (error) {
      alert(`Failed to extract tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingTranscript(false);
    }
  };

  // Process voice transcript
  const handleProcessVoiceTranscript = async () => {
    if (!voiceTranscript.trim()) return;

    setIsProcessingTranscript(true);
    try {
      const extraction = await extractTasksFromText(voiceTranscript, 'voice');
      if (extraction.tasks.length === 0) {
        alert('No tasks found. Please try again.');
        setShowVoiceTranscript(false);
        return;
      }

      const drafts: TaskDraft[] = extraction.tasks.map((task, index) => ({
        id: `draft-${Date.now()}-${index}`,
        title: task.title,
        notes: task.notes || '',
        due_iso: task.due_date || undefined,
        units: task.units,
        confidence_assignee: task.confidence_assignee,
        confidence_due: task.confidence_due,
      }));

      setTaskDrafts(drafts);
      setShowVoiceTranscript(false);
      setShowDraftsReview(true);
    } catch (error) {
      alert(`Failed to extract tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingTranscript(false);
    }
  };

  // Confirm drafts
  const handleConfirmDrafts = async (draftIds: string[]) => {
    setIsConfirmingDrafts(true);
    try {
      const draftsToConfirm = taskDrafts.filter(d => draftIds.includes(d.id));

      for (const draft of draftsToConfirm) {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

        const newTask: WorkPlan = {
          id: uuid,
          workspaceId: effectiveWorkspace.id,
          title: draft.title,
          description: draft.notes || '',
          function: 'Engineering' as const,
          startDate: new Date().toISOString().split('T')[0],
          dueDate: draft.due_iso ? draft.due_iso.split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'not-started' as const,
          progress: 0,
          assignedBy: effectiveMembership.id,
          needsSubmission: false,
          estimatedTimeUnits: draft.units,
          allocations: [],
          appliedAITools: [],
          tusExpended: 0,
        };

        await addWorkPlan(newTask);
      }

      setShowDraftsReview(false);
      setTaskDrafts([]);
      setVoiceTranscript('');
      alert(`${draftsToConfirm.length} task(s) created!`);
    } catch (error) {
      alert('Failed to create tasks. Please try again.');
    } finally {
      setIsConfirmingDrafts(false);
    }
  };

  const handleEditDraft = (draftId: string, updates: Partial<TaskDraft>) => {
    setTaskDrafts(prev => prev.map(d => d.id === draftId ? { ...d, ...updates } : d));
  };

  const handleRemoveDraft = (draftId: string) => {
    setTaskDrafts(prev => prev.filter(d => d.id !== draftId));
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={TASKS_HELP}
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
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Work</Text>
            <Text className="text-white text-2xl font-bold">Tasks</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                setOpenDrawerToNewTask(true);
                setTimeout(() => setOpenDrawerToNewTask(false), 100);
              }}
              className="bg-white/20 p-2 rounded-full"
            >
              <Plus size={20} color="white" />
            </Pressable>
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Stats - Status-first */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          <View className="items-center flex-1">
            <Text className="text-white/70 text-xs">Doing</Text>
            <Text className="text-white font-bold text-lg">{stats.doing}</Text>
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
            <Text className="text-emerald-300 font-bold text-lg">{stats.done}</Text>
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
        {/* Doing */}
        {tasksByStatus['in-progress'].length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Play size={18} color="#3b82f6" />
              <Text className="text-slate-900 dark:text-white font-semibold text-base">
                Doing ({tasksByStatus['in-progress'].length})
              </Text>
            </View>
            {tasksByStatus['in-progress'].map((task) => {
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
            {tasksByStatus['blocked'].map((task) => {
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
            {tasksByStatus['not-started'].map((task) => {
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

        {/* Done */}
        {tasksByStatus['completed'].length > 0 && statusFilter === 'all' && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <CheckCircle2 size={18} color="#10b981" />
              <Text className="text-slate-900 dark:text-white font-semibold text-base">
                Done ({tasksByStatus['completed'].length})
              </Text>
            </View>
            {tasksByStatus['completed'].slice(0, 5).map((task) => {
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
                  View all {tasksByStatus['completed'].length} done tasks
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
              onPress={() => {
                setOpenDrawerToNewTask(true);
                setTimeout(() => setOpenDrawerToNewTask(false), 100);
              }}
              className="mt-4 bg-emerald-500 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Create First Task</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Bottom Drawer */}
      <UnifiedBottomDrawer
        selectedPersonId={null}
        onPersonSelect={() => {}}
        onVoiceTranscript={handleVoiceTranscript}
        onTextSubmit={handleTextInput}
        pendingDraftsCount={taskDrafts.length}
        openToNewTask={openDrawerToNewTask}
        accentColor="#10b981"
      />

      {/* Voice Transcript Modal */}
      <Modal
        visible={showVoiceTranscript}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVoiceTranscript(false)}
      >
        <Pressable className="flex-1 bg-black/70" onPress={() => setShowVoiceTranscript(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '80%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <Sparkles size={24} color="#10b981" />
                  <Text className="text-xl font-bold text-slate-900 dark:text-white">
                    Extract Tasks
                  </Text>
                </View>
                <Pressable onPress={() => setShowVoiceTranscript(false)} className="p-2">
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView className="max-h-60 mb-4">
                <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <Text className="text-slate-700 dark:text-slate-300 text-base leading-6">
                    {voiceTranscript}
                  </Text>
                </View>
              </ScrollView>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowVoiceTranscript(false)}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 py-4 rounded-xl items-center"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleProcessVoiceTranscript}
                  disabled={isProcessingTranscript}
                  className="flex-1 bg-emerald-500 py-4 rounded-xl items-center"
                >
                  <Text className="text-white font-semibold">
                    {isProcessingTranscript ? 'Processing...' : 'Extract Tasks'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Task Drafts Review Modal */}
      <TaskDraftsReviewModal
        visible={showDraftsReview}
        onClose={() => setShowDraftsReview(false)}
        drafts={taskDrafts}
        onConfirm={handleConfirmDrafts}
        onEdit={handleEditDraft}
        onRemove={handleRemoveDraft}
      />
    </View>
  );
}
