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

import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
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
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useDraftStore, type Draft } from '@/lib/state/draft-store';
import { useCurrentMembership, useCurrentWorkspace } from '@/lib/state/app-store';
import type { OrganizationMember } from '@/lib/organization-seed';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { TaskCardCompact, TaskCardExpansion } from '@/components/tasks';
import { filterWorkPlansByRole } from '@/lib/role-utils';
import { TaskCreationModal } from '@/components/TaskCreationModal';
import { extractTasksFromText } from '@/lib/ai/task-extraction';

const TASKS_HELP: HelpContent = {
  title: 'Tasks',
  subtitle: 'AI-Powered Task Creation & Management',
  description: 'The Tasks tab is your intelligent work hub. Create tasks with voice or text, and AI automatically extracts everything - title, description, deadlines, and estimates. Tasks are auto-assigned to you and scheduled based on your available capacity.',
  tips: [
    '🤖 AI Task Creation: Speak or type naturally - AI extracts all details automatically',
    '👤 Auto-Assignment: AI-created tasks are automatically assigned to you with your avatar and initials',
    '⏰ Smart Scheduling: Tasks start today if you have capacity, otherwise auto-schedule to your next available week',
    '📋 Draft Confirmation: Review AI-extracted drafts at the top - confirm with one tap or select multiple',
    '🏷️ Auto-Categorization: Tasks default to Miscellaneous (Ops) unless you choose a function',
    '🔢 Time Units: Each task shows estimated TUs (4-hour blocks) for capacity planning',
    '✅ Status Organization: Tasks grouped by Doing, Queued, Blocked, Done',
    '👥 Team Allocation: Tap any task to view details and assign team members',
    '🔄 Bulk Operations: Select multiple drafts and confirm them all at once',
  ],
  quickActions: [
    { label: 'Voice Input', description: 'Speak your task - AI handles the rest' },
    { label: 'Text Input', description: 'Type naturally - AI extracts structure' },
    { label: 'Confirm Drafts', description: 'Review and approve AI-created tasks' },
    { label: 'Bulk Confirm', description: 'Select multiple drafts and confirm together' },
    { label: 'View by Status', description: 'Filter by Doing/Queued/Blocked/Done' },
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
  const params = useLocalSearchParams<{ openNewTaskDrawer?: string }>();

  // Stores
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const addWorkPlan = useWorkPlanStore(s => s.addWorkPlan);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);

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
  // Inline expansion state (same pattern as Focus Today)
  const [expansionState, setExpansionState] = useState<{ taskId: string; level: 'medium' | 'full' } | null>(null);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);
  const [isConfirmingDrafts, setIsConfirmingDrafts] = useState(false);
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Listen for URL param to open modal (from FAB press)
  useEffect(() => {
    if (params.openNewTaskDrawer === 'true') {
      // Trigger modal to open
      setShowTaskModal(true);
      // Clear the param to prevent re-triggering
      router.setParams({ openNewTaskDrawer: undefined });
    }
  }, [params.openNewTaskDrawer]);

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

  // Confirm selected drafts - with warning for low confidence
  const handleConfirmWithWarning = () => {
    if (selectedDraftIds.size === 0) return;

    // Check for low-confidence drafts
    const selectedDrafts = workspaceDrafts.filter(d => selectedDraftIds.has(d.id));
    const lowConfidenceDrafts = selectedDrafts.filter(d =>
      (d.sourceMetadata?.confidence ?? 0.8) < 0.7
    );
    const hasProblems = selectedDrafts.some(d => !d.title.trim());

    if (hasProblems) {
      Alert.alert(
        'Cannot Confirm',
        'Some drafts have missing titles. Please fix them before confirming.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (lowConfidenceDrafts.length > 0) {
      Alert.alert(
        'Review Recommended',
        `${lowConfidenceDrafts.length} draft(s) have low AI confidence and may need review. Confirm anyway?`,
        [
          { text: 'Review First', style: 'cancel' },
          { text: 'Confirm Anyway', onPress: handleConfirmSelectedDrafts }
        ]
      );
    } else {
      handleConfirmSelectedDrafts();
    }
  };

  // Confirm selected drafts - converts them to real tasks
  const handleConfirmSelectedDrafts = async () => {
    if (selectedDraftIds.size === 0) return;

    setIsConfirmingDrafts(true);
    try {
      // Get drafts to confirm and remove from store
      const confirmedDrafts = await confirmDrafts(Array.from(selectedDraftIds));

      // Import scheduling functions
      const { autoScheduleTask } = await import('@/lib/task-scheduling');

      // Create real tasks from confirmed drafts
      for (const draft of confirmedDrafts) {
        // Default to 1 TU if not specified
        const estimatedTUs = draft.units || 1;

        // Use assignee from draft, or default to current user
        const assigneeId = draft.assigneeId || effectiveMembership.id;
        const assigneeName = draft.assigneeName || members.find(m => m.id === assigneeId)?.name || 'You';

        // Allocation based on draft values
        const allocation = assigneeId ? [{
          memberId: assigneeId,
          memberName: assigneeName,
          squaresPerWeek: draft.units || 1, // Use draft TU value
          costPerSquare: 0,
        }] : [];

        // Create task with assignee from draft
        let newTask: WorkPlan = {
          id: generateUUID(),
          workspaceId: draft.workspaceId,
          title: draft.title,
          description: draft.description,
          function: draft.function || 'Ops' as const, // Use draft function or default to Ops
          startDate: new Date().toISOString().split('T')[0],
          dueDate: draft.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'not-started' as const,
          progress: 0,
          assignedBy: draft.createdBy,
          ownerId: assigneeId || effectiveMembership.id, // Set owner to assignee
          needsSubmission: false,
          estimatedTimeUnits: estimatedTUs,
          allocations: allocation,
          appliedAITools: [],
          tusExpended: 0,
        };

        // Auto-schedule based on assignee's capacity
        if (allocation.length > 0) {
          newTask = autoScheduleTask(newTask, members, workPlans);
          console.log('[Tasks] Auto-scheduled task:', {
            title: newTask.title,
            startDate: newTask.startDate,
            dueDate: newTask.dueDate,
          });
        }

        await addWorkPlan(newTask);
      }

      setSelectedDraftIds(new Set());

      // Show detailed success message
      const taskWord = confirmedDrafts.length === 1 ? 'task' : 'tasks';
      alert(
        `✅ ${confirmedDrafts.length} ${taskWord} created!\n\n` +
        `📋 Assigned to: You\n` +
        `📦 Category: Miscellaneous (Ops)\n` +
        `⏰ Scheduled: Based on your available capacity\n\n` +
        `Tasks will start as soon as you have free TUs.`
      );
    } catch (error) {
      console.error('[Tasks] Failed to create tasks:', error);

      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API') || error.message.includes('network')) {
          alert('Failed to create tasks. Check your connection and try again.\n\nIf the problem persists, check the LOGS tab for details.');
        } else if (error.message.includes('capacity') || error.message.includes('schedule')) {
          alert('Failed to schedule tasks. Try adjusting due dates or reducing time units.');
        } else {
          alert(`Failed to create tasks: ${error.message}\n\nCheck the LOGS tab for details.`);
        }
      } else {
        alert('Failed to create tasks. Please try again.\n\nCheck the LOGS tab for details.');
      }
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

      {/* No separate modal - using inline expansion only */}

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
              onPress={() => setShowTaskModal(true)}
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
                  className={`px-3 py-1.5 rounded-full flex-row items-center gap-1 ${statusFilter === status ? 'bg-slate-900 dark:bg-white' : 'bg-slate-100 dark:bg-slate-900'
                    }`}
                >
                  <Text
                    className={`text-sm font-medium ${statusFilter === status ? 'text-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'
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
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 180 }}
        showsVerticalScrollIndicator={true}
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
                    onPress={handleConfirmWithWarning}
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
                <Text className="font-bold">Auto-Assignment:</Text> Tasks will be assigned to you with 1 TU, categorized as Miscellaneous (Ops), and scheduled based on your available capacity.
              </Text>
            </View>

            {workspaceDrafts.map((draft) => {
              // Get confidence from AI extraction
              const confidence = draft.sourceMetadata?.confidence ?? 0.8;
              const needsAttention = confidence < 0.7 || !draft.title.trim();

              // Get assignee info
              const assignee = draft.assigneeId
                ? members.find(m => m.id === draft.assigneeId)
                : members.find(m => m.id === effectiveMembership.id);

              const initials = assignee?.name
                ? assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : 'ME';

              // Confidence indicator colors
              const confidenceDotColor = confidence >= 0.9
                ? '#10b981' // emerald
                : confidence >= 0.7
                  ? '#f59e0b' // amber
                  : '#ef4444'; // red

              return (
                <Pressable
                  key={draft.id}
                  onPress={() => toggleDraftSelection(draft.id)}
                  className={`bg-white dark:bg-slate-900 rounded-xl p-4 mb-2 border-l-4 ${selectedDraftIds.has(draft.id) ? 'border-emerald-500' : 'border-amber-500'
                    }`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-1">
                        {/* Selection checkbox */}
                        <Pressable
                          onPress={() => toggleDraftSelection(draft.id)}
                          className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedDraftIds.has(draft.id)
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-slate-300 dark:border-slate-600'
                            }`}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          {selectedDraftIds.has(draft.id) && <Check size={12} color="white" />}
                        </Pressable>
                        {/* Confidence indicator dot */}
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: confidenceDotColor }}
                        />
                        {/* Inline title editing */}
                        {editingDraftId === draft.id ? (
                          <TextInput
                            value={editingTitle}
                            onChangeText={setEditingTitle}
                            onBlur={() => {
                              if (editingTitle.trim()) {
                                updateDraft(draft.id, { title: editingTitle.trim() });
                              }
                              setEditingDraftId(null);
                            }}
                            autoFocus
                            className="flex-1 text-slate-900 dark:text-white font-medium border-b border-blue-500"
                            style={{ minHeight: 20, padding: 0 }}
                            placeholderTextColor="#9ca3af"
                          />
                        ) : (
                          <Pressable
                            onPress={() => {
                              setEditingDraftId(draft.id);
                              setEditingTitle(draft.title);
                            }}
                            className="flex-1"
                          >
                            <Text className="text-slate-900 dark:text-white font-medium" numberOfLines={1}>
                              {draft.title}
                            </Text>
                          </Pressable>
                        )}
                        {/* Low confidence badge */}
                        {confidence < 0.7 && (
                          <View className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                            <Text className="text-red-600 dark:text-red-400 text-[9px] font-bold">⚠️ Review</Text>
                          </View>
                        )}
                      </View>
                      {draft.description && (
                        <Text className="text-slate-500 dark:text-slate-400 text-sm ml-9" numberOfLines={2}>
                          {draft.description}
                        </Text>
                      )}
                      {/* Assignment Info */}
                      <View className="flex-row items-center gap-2 mt-2 ml-9">
                        <View className="w-7 h-7 rounded-full bg-blue-500 items-center justify-center">
                          <Text className="text-white text-xs font-bold">{initials}</Text>
                        </View>
                        <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                          {assignee?.name || 'You'}
                        </Text>
                      </View>
                      {/* Chips for TU, Function, Due Date */}
                      <View className="flex-row items-center gap-2 mt-2 ml-9 flex-wrap">
                        {/* Source */}
                        <View className={`px-2 py-0.5 rounded-full ${draft.source === 'marketplace' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                          <Text className={`text-xs font-medium ${draft.source === 'marketplace' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
                            }`}>
                            {getDraftSourceLabel(draft)}
                          </Text>
                        </View>
                        {/* TU */}
                        <View className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          <Text className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                            {draft.units || 1} TU
                          </Text>
                        </View>
                        {/* Function */}
                        <View className="bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                          <Text className="text-orange-600 dark:text-orange-400 text-xs font-medium">
                            {draft.function || 'Ops'}
                          </Text>
                        </View>
                        {/* Due Date */}
                        {draft.dueDate && (
                          <Text className="text-slate-400 text-xs">
                            Due: {new Date(draft.dueDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    {/* Delete button */}
                    <Pressable
                      onPress={() => removeDraft(draft.id)}
                      className="p-2"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
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
              const isExpanded = expansionState?.taskId === task.id;
              const expansionLevel = expansionState?.taskId === task.id ? expansionState.level : null;

              return (
                <View key={task.id}>
                  <TaskCardCompact
                    task={task}
                    isExpanded={isExpanded}
                    onPress={() => {
                      if (expansionState?.taskId === task.id) {
                        if (expansionState.level === 'medium') {
                          setExpansionState({ taskId: task.id, level: 'full' });
                        } else {
                          setExpansionState(null);
                        }
                      } else {
                        setExpansionState({ taskId: task.id, level: 'medium' });
                      }
                    }}
                  />
                  {isExpanded && expansionLevel && (
                    <TaskCardExpansion
                      task={task}
                      level={expansionLevel}
                      onClose={() => setExpansionState(null)}
                      onExpandMore={() => setExpansionState({ taskId: task.id, level: 'full' })}
                      onUpdateStatus={(status: WorkPlan['status']) => {
                        updateWorkPlan(task.id, { status });
                      }}
                      onUpdateProgress={(progress: number) => {
                        updateWorkPlan(task.id, { progress });
                      }}
                      onRescheduleDays={(days: number) => {
                        const currentDate = new Date(task.dueDate);
                        currentDate.setDate(currentDate.getDate() + days);
                        updateWorkPlan(task.id, { dueDate: currentDate.toISOString().split('T')[0] });
                      }}
                      onUpdateDescription={(description: string) => {
                        updateWorkPlan(task.id, { description });
                      }}
                      onSave={(updates: Partial<WorkPlan>) => {
                        updateWorkPlan(task.id, updates);
                      }}
                    />
                  )}
                </View>
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
              const isExpanded = expansionState?.taskId === task.id;
              const expansionLevel = expansionState?.taskId === task.id ? expansionState.level : null;

              return (
                <View key={task.id}>
                  <TaskCardCompact
                    task={task}
                    isExpanded={isExpanded}
                    onPress={() => {
                      if (expansionState?.taskId === task.id) {
                        if (expansionState.level === 'medium') {
                          setExpansionState({ taskId: task.id, level: 'full' });
                        } else {
                          setExpansionState(null);
                        }
                      } else {
                        setExpansionState({ taskId: task.id, level: 'medium' });
                      }
                    }}
                  />
                  {isExpanded && expansionLevel && (
                    <TaskCardExpansion
                      task={task}
                      level={expansionLevel}
                      onClose={() => setExpansionState(null)}
                      onExpandMore={() => setExpansionState({ taskId: task.id, level: 'full' })}
                      onUpdateStatus={(status: WorkPlan['status']) => {
                        updateWorkPlan(task.id, { status });
                      }}
                      onUpdateProgress={(progress: number) => {
                        updateWorkPlan(task.id, { progress });
                      }}
                      onRescheduleDays={(days: number) => {
                        const currentDate = new Date(task.dueDate);
                        currentDate.setDate(currentDate.getDate() + days);
                        updateWorkPlan(task.id, { dueDate: currentDate.toISOString().split('T')[0] });
                      }}
                      onUpdateDescription={(description: string) => {
                        updateWorkPlan(task.id, { description });
                      }}
                      onSave={(updates: Partial<WorkPlan>) => {
                        updateWorkPlan(task.id, updates);
                      }}
                    />
                  )}
                </View>
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
              const isExpanded = expansionState?.taskId === task.id;
              const expansionLevel = expansionState?.taskId === task.id ? expansionState.level : null;

              return (
                <View key={task.id}>
                  <TaskCardCompact
                    task={task}
                    isExpanded={isExpanded}
                    onPress={() => {
                      if (expansionState?.taskId === task.id) {
                        if (expansionState.level === 'medium') {
                          setExpansionState({ taskId: task.id, level: 'full' });
                        } else {
                          setExpansionState(null);
                        }
                      } else {
                        setExpansionState({ taskId: task.id, level: 'medium' });
                      }
                    }}
                  />
                  {isExpanded && expansionLevel && (
                    <TaskCardExpansion
                      task={task}
                      level={expansionLevel}
                      onClose={() => setExpansionState(null)}
                      onExpandMore={() => setExpansionState({ taskId: task.id, level: 'full' })}
                      onUpdateStatus={(status: WorkPlan['status']) => {
                        updateWorkPlan(task.id, { status });
                      }}
                      onUpdateProgress={(progress: number) => {
                        updateWorkPlan(task.id, { progress });
                      }}
                      onRescheduleDays={(days: number) => {
                        const currentDate = new Date(task.dueDate);
                        currentDate.setDate(currentDate.getDate() + days);
                        updateWorkPlan(task.id, { dueDate: currentDate.toISOString().split('T')[0] });
                      }}
                      onUpdateDescription={(description: string) => {
                        updateWorkPlan(task.id, { description });
                      }}
                      onSave={(updates: Partial<WorkPlan>) => {
                        updateWorkPlan(task.id, updates);
                      }}
                    />
                  )}
                </View>
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
              const isExpanded = expansionState?.taskId === task.id;
              const expansionLevel = expansionState?.taskId === task.id ? expansionState.level : null;

              return (
                <View key={task.id}>
                  <TaskCardCompact
                    task={task}
                    isExpanded={isExpanded}
                    onPress={() => {
                      if (expansionState?.taskId === task.id) {
                        if (expansionState.level === 'medium') {
                          setExpansionState({ taskId: task.id, level: 'full' });
                        } else {
                          setExpansionState(null);
                        }
                      } else {
                        setExpansionState({ taskId: task.id, level: 'medium' });
                      }
                    }}
                  />
                  {isExpanded && expansionLevel && (
                    <TaskCardExpansion
                      task={task}
                      level={expansionLevel}
                      onClose={() => setExpansionState(null)}
                      onExpandMore={() => setExpansionState({ taskId: task.id, level: 'full' })}
                      onUpdateStatus={(status: WorkPlan['status']) => {
                        updateWorkPlan(task.id, { status });
                      }}
                      onUpdateProgress={(progress: number) => {
                        updateWorkPlan(task.id, { progress });
                      }}
                      onRescheduleDays={(days: number) => {
                        const currentDate = new Date(task.dueDate);
                        currentDate.setDate(currentDate.getDate() + days);
                        updateWorkPlan(task.id, { dueDate: currentDate.toISOString().split('T')[0] });
                      }}
                      onUpdateDescription={(description: string) => {
                        updateWorkPlan(task.id, { description });
                      }}
                      onSave={(updates: Partial<WorkPlan>) => {
                        updateWorkPlan(task.id, updates);
                      }}
                    />
                  )}
                </View>
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

        {/* Empty state - only show "Create First Task" when there are truly no tasks */}
        {filteredTasks.length === 0 && workspaceDrafts.length === 0 && statusFilter === 'all' && (
          <View className="items-center py-12">
            <CheckSquare size={48} color="#94a3b8" />
            <Text className="text-slate-500 dark:text-slate-400 text-center mt-4 text-base">
              No tasks found
            </Text>
            <Pressable
              onPress={() => setShowTaskModal(true)}
              className="mt-4 bg-emerald-500 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Create First Task</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>



      {/* Task Creation Modal */}
      <TaskCreationModal
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onVoiceTranscript={handleVoiceTranscript}
        onTextSubmit={handleTextInput}
        onConfirmDrafts={async (draftIds) => {
          setSelectedDraftIds(new Set(draftIds));
          await handleConfirmSelectedDrafts();
        }}
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
                <View className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
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
