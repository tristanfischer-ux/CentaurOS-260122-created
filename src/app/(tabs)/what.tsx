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
  Sparkles,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useCurrentMembership, useCurrentWorkspace } from '@/lib/state/app-store';
import type { OrganizationMember } from '@/lib/organization-seed';
import type { Function as BusinessFunction } from '@/types';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { MiniGanttChart } from '@/components/MiniGanttChart';
import { UnifiedTaskAllocationModal } from '@/components/UnifiedTaskAllocationModal';
import { SquaresDisplay } from '@/components/SquaresDisplay';
import { CompactTaskCard } from '@/components/CompactTaskCard';
import { filterWorkPlansByRole } from '@/lib/role-utils';
import { RoleIndicator } from '@/components/RoleIndicator';
import { getTemplatesByFunction, type TaskTemplate } from '@/lib/task-templates';
import { UnifiedBottomDrawer } from '@/components/UnifiedBottomDrawer';
import { TaskDraftsReviewModal } from '@/components/TaskDraftsReviewModal';
import { extractTasksFromText } from '@/lib/ai/task-extraction';
import { supabase } from '@/lib/supabase';

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

  // Fallback: Use first member as current user if currentMembership is null (for demo/dev)
  // If no members, create a default user with proper UUID
  const effectiveMembership = currentMembership ||
    (members.length > 0
      ? { id: members[0].id, role: members[0].role, function: members[0].function }
      : {
          id: '00000000-0000-0000-0000-000000000001', // Valid UUID for demo
          role: 'Founder' as const,
          function: 'Engineering' as const
        });

  // Fallback workspace for demo/dev with proper UUID
  const effectiveWorkspace = currentWorkspace || {
    id: '00000000-0000-0000-0000-000000000002', // Valid UUID for demo
    name: 'Demo Workspace'
  };

  // State
  const [showHelp, setShowHelp] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [functionFilter, setFunctionFilter] = useState<BusinessFunction | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<WorkPlan | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResourcePool, setShowResourcePool] = useState(false);
  const [selectedPersonForAllocation, setSelectedPersonForAllocation] = useState<string | null>(null);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showDraftsReview, setShowDraftsReview] = useState(false);
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([]);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);
  const [isConfirmingDrafts, setIsConfirmingDrafts] = useState(false);

  // Debug: Log when modal visibility changes
  useEffect(() => {
    console.log('[What Tab] showVoiceTranscript changed:', showVoiceTranscript);
    console.log('[What Tab] voiceTranscript:', voiceTranscript);
  }, [showVoiceTranscript, voiceTranscript]);

  // Debug: Log when drafts review modal changes
  useEffect(() => {
    console.log('[What Tab] showDraftsReview changed:', showDraftsReview);
    console.log('[What Tab] taskDrafts count:', taskDrafts.length);
    if (taskDrafts.length > 0) {
      console.log('[What Tab] First draft:', taskDrafts[0]);
    }
  }, [showDraftsReview, taskDrafts]);

  // Create task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskFunction, setNewTaskFunction] = useState<BusinessFunction>('Engineering');
  const [newTaskEstimate, setNewTaskEstimate] = useState('10');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Get task templates for current function
  const taskTemplates = useMemo(() => {
    return getTemplatesByFunction(newTaskFunction);
  }, [newTaskFunction]);

  // Handle template selection
  const handleSelectTemplate = (template: TaskTemplate) => {
    setNewTaskTitle(template.title);
    setNewTaskEstimate(template.estimatedTimeUnits.toString());
    setShowSuggestions(false);
  };

  const isFounder = currentMembership?.role === 'Founder';

  // Role-based filtering first
  const roleFilteredTasks = useMemo(() => {
    if (!currentMembership?.role) return workPlans;
    return filterWorkPlansByRole(
      workPlans,
      currentMembership.role,
      currentMembership.function,
      currentMembership.id
    );
  }, [workPlans, currentMembership]);

  // Then apply UI filters (status, function)
  const filteredTasks = useMemo(() => {
    return roleFilteredTasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesFunction = functionFilter === 'all' || task.function === functionFilter;
      return matchesStatus && matchesFunction;
    });
  }, [roleFilteredTasks, statusFilter, functionFilter]);

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

  // Stats (based on role-filtered tasks)
  const stats = useMemo(() => {
    const active = roleFilteredTasks.filter(t => t.status === 'in-progress').length;
    const queued = roleFilteredTasks.filter(t => t.status === 'not-started').length;
    const blocked = roleFilteredTasks.filter(t => t.status === 'blocked').length;
    const completed = roleFilteredTasks.filter(t => t.status === 'completed').length;
    return { active, queued, blocked, completed };
  }, [roleFilteredTasks]);

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

    console.log('[What Tab] Creating task, current count:', workPlans.length);

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

    console.log('[What Tab] New task:', newTask);
    addWorkPlan(newTask);
    console.log('[What Tab] After adding, count should be:', workPlans.length + 1);

    // Reset form
    setNewTaskTitle('');
    setNewTaskEstimate('10');
    setShowSuggestions(true);
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

  // Handle voice transcript - shows modal for confirmation
  const handleVoiceTranscript = (transcript: string) => {
    console.log('[What Tab] handleVoiceTranscript called');
    console.log('[What Tab] Transcript received:', transcript);
    console.log('[What Tab] Transcript length:', transcript.length);
    console.log('[What Tab] Setting voiceTranscript and showVoiceTranscript to true...');
    setVoiceTranscript(transcript);
    setShowVoiceTranscript(true);
    console.log('[What Tab] State updated - modal should be visible now');

    // Add a small delay to check state
    setTimeout(() => {
      console.log('[What Tab] Checking state after 100ms - voiceTranscript:', voiceTranscript?.substring(0, 20));
    }, 100);
  };

  // Handle text input - auto-processes immediately without modal
  const handleTextInput = async (text: string) => {
    console.log('[What Tab] handleTextInput called with:', text);

    if (!text.trim()) {
      console.error('[What Tab] No text provided!');
      alert('Please enter some text to extract tasks from.');
      return;
    }

    console.log('[What Tab] Processing text input directly');
    setIsProcessingTranscript(true);

    try {
      // Extract tasks using client-side AI
      console.log('[What Tab] Calling extractTasksFromText...');
      const extraction = await extractTasksFromText(text, 'text');

      console.log('[What Tab] Tasks extracted:', extraction);
      console.log('[What Tab] Number of tasks:', extraction.tasks.length);

      if (extraction.tasks.length === 0) {
        console.warn('[What Tab] No tasks extracted from text');
        alert('No tasks found in your text. Please try again with clearer instructions.');
        setIsProcessingTranscript(false);
        return;
      }

      // Convert extraction format to TaskDraft format
      const drafts: TaskDraft[] = extraction.tasks.map((task, index) => ({
        id: `draft-${Date.now()}-${index}`,
        title: task.title,
        notes: task.notes || '',
        due_iso: task.due_date || undefined,
        units: task.units,
        confidence_assignee: task.confidence_assignee,
        confidence_due: task.confidence_due,
      }));

      console.log('[What Tab] Extracted drafts from text:', drafts);

      // Show drafts review modal
      setTaskDrafts(drafts);
      setShowDraftsReview(true);
    } catch (error) {
      console.error('[What Tab] Failed to extract drafts from text:', error);
      alert(`Failed to extract tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingTranscript(false);
    }
  };

  const handleProcessVoiceTranscript = async () => {
    console.log('[What Tab] handleProcessVoiceTranscript called');
    console.log('[What Tab] voiceTranscript:', voiceTranscript);
    console.log('[What Tab] effectiveWorkspace:', effectiveWorkspace);
    console.log('[What Tab] effectiveMembership:', effectiveMembership);

    if (!voiceTranscript.trim()) {
      console.error('[What Tab] No transcript text!');
      alert('No transcript text found. Please try again.');
      return;
    }

    console.log('[What Tab] All data present, processing voice transcript');
    setIsProcessingTranscript(true);

    try {
      // Extract tasks using client-side Gemini AI
      console.log('[What Tab] Calling extractTasksFromText...');
      const extraction = await extractTasksFromText(voiceTranscript, 'voice');

      console.log('[What Tab] Tasks extracted:', extraction);
      console.log('[What Tab] Number of tasks:', extraction.tasks.length);

      if (extraction.tasks.length === 0) {
        console.warn('[What Tab] No tasks extracted from transcript');
        alert('No tasks found in your recording. Please try again with clearer instructions.');
        setShowVoiceTranscript(false);
        setIsProcessingTranscript(false);
        return;
      }

      // Convert extraction format to TaskDraft format for local display
      const drafts: TaskDraft[] = extraction.tasks.map((task, index) => ({
        id: `draft-${Date.now()}-${index}`,
        title: task.title,
        notes: task.notes || '',
        due_iso: task.due_date || undefined,
        units: task.units,
        confidence_assignee: task.confidence_assignee,
        confidence_due: task.confidence_due,
      }));

      console.log('[What Tab] Extracted drafts (v2):', drafts);
      console.log('[What Tab] About to set taskDrafts and showDraftsReview...');

      // Show drafts review modal directly (no Supabase needed)
      setTaskDrafts(drafts);
      console.log('[What Tab] taskDrafts set');
      setShowVoiceTranscript(false);
      console.log('[What Tab] showVoiceTranscript set to false');
      setShowDraftsReview(true);
      console.log('[What Tab] showDraftsReview set to true - modal should appear now!');
    } catch (error) {
      console.error('[What Tab] Failed to extract drafts:', error);
      console.error('[What Tab] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert(`Failed to extract tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingTranscript(false);
    }
  };

  const handleConfirmDrafts = async (draftIds: string[]) => {
    console.log('[What Tab] Confirming drafts:', draftIds);
    setIsConfirmingDrafts(true);

    try {
      // Get drafts to confirm
      const draftsToConfirm = taskDrafts.filter(d => draftIds.includes(d.id));
      console.log('[What Tab] Drafts to confirm:', draftsToConfirm);

      // Add each draft as a work plan task
      for (const draft of draftsToConfirm) {
        // Generate a proper UUID
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

        console.log('[What Tab] Adding task to work plan:', newTask);
        try {
          await addWorkPlan(newTask);
          console.log('[What Tab] Task added successfully:', newTask.id);
        } catch (err) {
          console.error('[What Tab] Failed to add task:', err);
          const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
          console.error('[What Tab] Error message:', errorMessage);
          // Continue anyway - don't fail the whole batch
        }
      }

      console.log('[What Tab] Tasks created successfully!');

      // Close modals and clear state
      setShowDraftsReview(false);
      setTaskDrafts([]);
      setVoiceTranscript('');

      // Show success message
      alert(`${draftsToConfirm.length} task(s) created successfully!`);
    } catch (error) {
      console.error('[What Tab] Failed to confirm drafts:', error);
      alert('Failed to create tasks. Please try again.');
    } finally {
      setIsConfirmingDrafts(false);
    }
  };

  const handleEditDraft = (draftId: string, updates: Partial<TaskDraft>) => {
    setTaskDrafts(prev =>
      prev.map(draft => (draft.id === draftId ? { ...draft, ...updates } : draft))
    );
  };

  const handleRemoveDraft = (draftId: string) => {
    setTaskDrafts(prev => prev.filter(draft => draft.id !== draftId));
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
        onRequestClose={() => {
          setShowCreateModal(false);
          setShowSuggestions(true);
        }}
      >
        <Pressable className="flex-1 bg-black/70" onPress={() => {
          setShowCreateModal(false);
          setShowSuggestions(true);
        }}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '85%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <Text className="text-slate-900 dark:text-white font-bold text-xl">Create Task</Text>
                <Pressable onPress={() => {
                  setShowCreateModal(false);
                  setShowSuggestions(true);
                }} className="p-2">
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView
                className="px-6 py-4"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* Function Selection First */}
                <View className="mb-4">
                  <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Function</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {(['Marketing', 'Sales', 'Finance', 'Engineering', 'Ops', 'Admin'] as BusinessFunction[]).map(func => (
                        <Pressable
                          key={func}
                          onPress={() => {
                            setNewTaskFunction(func);
                            setShowSuggestions(true);
                          }}
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

                {/* Task Suggestions Section */}
                {showSuggestions && taskTemplates.length > 0 && (
                  <View className="mb-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <Sparkles size={16} color="#8b5cf6" />
                      <Text className="text-slate-700 dark:text-slate-300 font-semibold">
                        Suggested Tasks
                      </Text>
                    </View>
                    <View className="gap-2">
                      {taskTemplates.map((template) => (
                        <Pressable
                          key={template.id}
                          onPress={() => handleSelectTemplate(template)}
                          className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border-2 border-slate-200 dark:border-slate-700 active:border-purple-500"
                        >
                          <Text className="text-slate-900 dark:text-white font-semibold mb-1">
                            {template.title}
                          </Text>
                          <Text className="text-slate-600 dark:text-slate-400 text-xs mb-2" numberOfLines={2}>
                            {template.description}
                          </Text>
                          <View className="flex-row items-center gap-3">
                            <View className="flex-row items-center gap-1">
                              <Clock size={12} color="#8b5cf6" />
                              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                {template.estimatedTimeUnits} TU
                              </Text>
                            </View>
                            <View className="flex-row gap-1 flex-wrap">
                              {template.tags.slice(0, 2).map((tag) => (
                                <View key={tag} className="bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                                  <Text className="text-purple-600 dark:text-purple-400 text-xs">
                                    {tag}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable
                      onPress={() => setShowSuggestions(false)}
                      className="mt-3 py-2 items-center"
                    >
                      <Text className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                        Or create custom task
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Title Input - Show when not showing suggestions or has input */}
                {(!showSuggestions || newTaskTitle) && (
                  <View className="mb-4">
                    <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Task Title</Text>
                    <TextInput
                      value={newTaskTitle}
                      onChangeText={(text) => {
                        setNewTaskTitle(text);
                        if (text && showSuggestions) {
                          setShowSuggestions(false);
                        }
                      }}
                      placeholder="What needs to be done?"
                      placeholderTextColor="#94a3b8"
                      className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                    />
                    {showSuggestions && (
                      <Pressable
                        onPress={() => setShowSuggestions(true)}
                        className="mt-2"
                      >
                        <Text className="text-purple-600 dark:text-purple-400 text-sm">
                          View suggestions
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Estimated TUs - Show when not showing suggestions */}
                {!showSuggestions && (
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
                )}

                {/* Create Button - Only show when not showing suggestions */}
                {!showSuggestions && (
                  <Pressable
                    onPress={handleCreateTask}
                    className="bg-blue-500 py-4 rounded-xl items-center"
                    disabled={!newTaskTitle.trim()}
                  >
                    <Text className="text-white font-bold text-base">Create Task</Text>
                  </Pressable>
                )}
              </ScrollView>
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

      {/* Unified Bottom Drawer - combines Resource Pool and Task Creator */}
      <UnifiedBottomDrawer
        selectedPersonId={selectedPersonForAllocation}
        onPersonSelect={(personId) => setSelectedPersonForAllocation(personId)}
        onVoiceTranscript={handleVoiceTranscript}
        onTextSubmit={handleTextInput}
        pendingDraftsCount={taskDrafts.length}
        accentColor="#10b981" // Green for WHAT tab
      />

      {/* Voice Transcript Modal - Extract Tasks */}
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
              {/* Header */}
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

              {/* Transcript */}
              <ScrollView className="max-h-60 mb-4">
                <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <Text className="text-slate-700 dark:text-slate-300 text-base leading-6">
                    {voiceTranscript}
                  </Text>
                </View>
              </ScrollView>

              {/* Info */}
              <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
                <View className="flex-row items-start gap-3">
                  <Sparkles size={20} color="#3b82f6" />
                  <Text className="flex-1 text-blue-700 dark:text-blue-300 text-sm">
                    The AI will analyze your recording and extract actionable tasks with assignees, due dates, and time estimates.
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowVoiceTranscript(false)}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 py-4 rounded-xl items-center"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-semibold text-base">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleProcessVoiceTranscript}
                  disabled={isProcessingTranscript}
                  className="flex-1 bg-emerald-500 py-4 rounded-xl items-center"
                >
                  {isProcessingTranscript ? (
                    <Text className="text-white font-semibold text-base">Processing...</Text>
                  ) : (
                    <Text className="text-white font-semibold text-base">Extract Tasks</Text>
                  )}
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
