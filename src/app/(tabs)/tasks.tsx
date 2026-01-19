/**
 * Tasks Tab - Task Management
 * Status-first view: Drafts / Doing / Queued / Blocked / Done
 *
 * MIGRATION: This tab consolidates features from 'what', 'decide', 'do' tabs
 * Anti-bloat: This is the ONLY place to create/edit/confirm tasks
 *
 * IMPORTANT: Uses unified Draft store for all drafts (AI extraction + Marketplace)
 * Drafts are a separate entity from tasks and must be explicitly confirmed.
 */

import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CheckSquare,
  Plus,
  X,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  Trash2,
  Check,
  Edit3,
  Store,
  Mic,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useDraftStore, type Draft } from '@/lib/state/draft-store';
import { useCurrentMembership, useCurrentWorkspace } from '@/lib/state/app-store';
import type { OrganizationMember } from '@/lib/organization-seed';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { UnifiedTaskAllocationModal } from '@/components/UnifiedTaskAllocationModal';
import { CompactTaskCard } from '@/components/CompactTaskCard';
import { filterWorkPlansByRole } from '@/lib/role-utils';
import { UnifiedBottomDrawer } from '@/components/UnifiedBottomDrawer';
import { extractTasksFromText } from '@/lib/ai/task-extraction';

const TASKS_HELP: HelpContent = {
  title: 'Tasks',
  subtitle: 'Manage all your work',
  description: 'The Tasks tab is the single source of truth for all tasks. Drafts appear at the top and must be confirmed before becoming real tasks.',
  tips: [
    'Drafts are shown at the top - confirm them to create real tasks',
    'Tasks are organized by status: Doing, Queued, Blocked, Done',
    'Use voice or text input to create task drafts',
    'Marketplace actions also create drafts here',
    'Tap a task to view details and allocate team members',
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

// Generate UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const currentWorkspace = useCurrentWorkspace();

  // Stores
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const addWorkPlan = useWorkPlanStore(s => s.addWorkPlan);

  // Unified Draft Store
  const drafts = useDraftStore(s => s.drafts);
  const addDrafts = useDraftStore(s => s.addDrafts);
  const updateDraft = useDraftStore(s => s.updateDraft);
  const removeDraft = useDraftStore(s => s.removeDraft);
  const confirmDrafts = useDraftStore(s => s.confirmDrafts);

  // Fallback for demo mode
  const effectiveMembership = currentMembership ||
    (members.length > 0
      ? { id: members[0].id, role: members[0].role, function: members[0].function }
      : { id: '00000000-0000-0000-0000-000000000001', role: 'Founder' as const, function: 'Engineering' as const });

  const effectiveWorkspace = currentWorkspace || {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Demo Workspace'
  };

  // Filter drafts by workspace
  const workspaceDrafts = useMemo(() => {
    return drafts.filter(d => d.workspaceId === effectiveWorkspace.id);
  }, [drafts, effectiveWorkspace.id]);

  // State
  const [showHelp, setShowHelp] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedTask, setSelectedTask] = useState<WorkPlan | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [openDrawerToNewTask, setOpenDrawerToNewTask] = useState(false);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);
  const [isConfirmingDrafts, setIsConfirmingDrafts] = useState(false);
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());

  // Role-based filtering for REAL tasks only (not drafts)
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

  // Stats - DOES NOT include drafts (drafts are separate)
  const stats = useMemo(() => {
    const doing = roleFilteredTasks.filter(t => t.status === 'in-progress').length;
    const queued = roleFilteredTasks.filter(t => t.status === 'not-started').length;
    const blocked = roleFilteredTasks.filter(t => t.status === 'blocked').length;
    const done = roleFilteredTasks.filter(t => t.status === 'completed').length;
    return { doing, queued, blocked, done, drafts: workspaceDrafts.length };
  }, [roleFilteredTasks, workspaceDrafts.length]);

  // Handle voice transcript
  const handleVoiceTranscript = (transcript: string) => {
    setVoiceTranscript(transcript);
    setShowVoiceTranscript(true);
  };

  // Handle text input - creates drafts in the unified Draft store
  const handleTextInput = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessingTranscript(true);
    try {
      const extraction = await extractTasksFromText(text, 'text');
      if (extraction.tasks.length === 0) {
        alert('No tasks found. Please try again with clearer instructions.');
        return;
      }

      // Add to unified Draft store
      addDrafts(extraction.tasks.map(task => ({
        workspaceId: effectiveWorkspace.id,
        title: task.title,
        description: task.notes || '',
        createdBy: effectiveMembership.id,
        dueDate: task.due_date || undefined,
        units: task.units,
        source: 'ai_extraction' as const,
        sourceMetadata: {
          confidence: task.confidence_due,
          extractionType: 'text' as const,
          originalText: text,
        },
      })));

    } catch (error) {
      alert(`Failed to extract tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingTranscript(false);
    }
  };

  // Process voice transcript - creates drafts in the unified Draft store
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

      // Add to unified Draft store
      addDrafts(extraction.tasks.map(task => ({
        workspaceId: effectiveWorkspace.id,
        title: task.title,
        description: task.notes || '',
        createdBy: effectiveMembership.id,
        dueDate: task.due_date || undefined,
        units: task.units,
        source: 'ai_extraction' as const,
        sourceMetadata: {
          confidence: task.confidence_due,
          extractionType: 'voice' as const,
          originalText: voiceTranscript,
        },
      })));

      setShowVoiceTranscript(false);
      setVoiceTranscript('');
    } catch (error) {
      alert(`Failed to extract tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingTranscript(false);
    }
  };

  // Confirm selected drafts - converts them to real tasks
  const handleConfirmSelectedDrafts = async () => {
    if (selectedDraftIds.size === 0) return;

    setIsConfirmingDrafts(true);
    try {
      // Get drafts to confirm and remove from store
      const confirmedDrafts = await confirmDrafts(Array.from(selectedDraftIds));

      // Create real tasks from confirmed drafts
      for (const draft of confirmedDrafts) {
        const newTask: WorkPlan = {
          id: generateUUID(),
          workspaceId: draft.workspaceId,
          title: draft.title,
          description: draft.description,
          function: 'Engineering' as const,
          startDate: new Date().toISOString().split('T')[0],
          dueDate: draft.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'not-started' as const,
          progress: 0,
          assignedBy: draft.createdBy,
          needsSubmission: false, // Real tasks don't need submission flag
          estimatedTimeUnits: draft.units,
          allocations: [],
          appliedAITools: [],
          tusExpended: 0,
        };

        await addWorkPlan(newTask);
      }

      setSelectedDraftIds(new Set());
      alert(`${confirmedDrafts.length} task(s) created!`);
    } catch (error) {
      alert('Failed to create tasks. Please try again.');
    } finally {
      setIsConfirmingDrafts(false);
    }
  };

  // Toggle draft selection
  const toggleDraftSelection = (draftId: string) => {
    setSelectedDraftIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(draftId)) {
        newSet.delete(draftId);
      } else {
        newSet.add(draftId);
      }
      return newSet;
    });
  };

  // Select all drafts
  const selectAllDrafts = () => {
    setSelectedDraftIds(new Set(workspaceDrafts.map(d => d.id)));
  };

  // Get source label for draft
  const getDraftSourceLabel = (draft: Draft): string => {
    switch (draft.source) {
      case 'marketplace':
        return 'Marketplace';
      case 'ai_extraction':
        return draft.sourceMetadata?.extractionType === 'voice' ? 'Voice' : 'Text';
      case 'import':
        return 'Import';
      case 'manual':
        return 'Manual';
      default:
        return 'Draft';
    }
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

        {/* Stats - Status-first, drafts shown separately */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          {stats.drafts > 0 && (
            <View className="items-center flex-1">
              <Text className="text-white/70 text-xs">Drafts</Text>
              <Text className="text-amber-300 font-bold text-lg">{stats.drafts}</Text>
            </View>
          )}
          <View className={`items-center flex-1 ${stats.drafts > 0 ? 'border-l border-white/20' : ''}`}>
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
        {/* DRAFTS SECTION - Always at top */}
        {workspaceDrafts.length > 0 && (
          <Animated.View entering={FadeInDown.springify()} className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <FileText size={18} color="#f59e0b" />
                <Text className="text-slate-900 dark:text-white font-semibold text-base">
                  Drafts ({workspaceDrafts.length})
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                {selectedDraftIds.size > 0 && (
                  <Pressable
                    onPress={handleConfirmSelectedDrafts}
                    disabled={isConfirmingDrafts}
                    className="bg-emerald-500 px-3 py-1.5 rounded-full flex-row items-center gap-1"
                  >
                    <Check size={14} color="white" />
                    <Text className="text-white text-xs font-medium">
                      {isConfirmingDrafts ? 'Creating...' : `Confirm (${selectedDraftIds.size})`}
                    </Text>
                  </Pressable>
                )}
                {workspaceDrafts.length > 1 && selectedDraftIds.size !== workspaceDrafts.length && (
                  <Pressable
                    onPress={selectAllDrafts}
                    className="bg-slate-200 dark:bg-slate-700 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">Select All</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-3">
              <Text className="text-amber-700 dark:text-amber-300 text-xs">
                Drafts must be confirmed to become real tasks. They won't appear in timeline or metrics until confirmed.
              </Text>
            </View>

            {workspaceDrafts.map((draft) => (
              <Pressable
                key={draft.id}
                onPress={() => toggleDraftSelection(draft.id)}
                className={`bg-white dark:bg-slate-800 rounded-xl p-4 mb-2 border-l-4 ${
                  selectedDraftIds.has(draft.id) ? 'border-emerald-500' : 'border-amber-500'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                        selectedDraftIds.has(draft.id)
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {selectedDraftIds.has(draft.id) && <Check size={12} color="white" />}
                      </View>
                      <Text className="text-slate-900 dark:text-white font-medium flex-1" numberOfLines={1}>
                        {draft.title}
                      </Text>
                    </View>
                    {draft.description && (
                      <Text className="text-slate-500 dark:text-slate-400 text-sm ml-7" numberOfLines={2}>
                        {draft.description}
                      </Text>
                    )}
                    <View className="flex-row items-center gap-2 mt-2 ml-7">
                      <View className={`px-2 py-0.5 rounded-full ${
                        draft.source === 'marketplace' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          draft.source === 'marketplace' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {getDraftSourceLabel(draft)}
                        </Text>
                      </View>
                      <Text className="text-slate-400 text-xs">
                        {draft.units} TU
                      </Text>
                      {draft.dueDate && (
                        <Text className="text-slate-400 text-xs">
                          Due: {new Date(draft.dueDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Pressable
                    onPress={() => removeDraft(draft.id)}
                    className="p-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </Animated.View>
        )}

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
        {filteredTasks.length === 0 && workspaceDrafts.length === 0 && (
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
        pendingDraftsCount={workspaceDrafts.length}
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
    </View>
  );
}
