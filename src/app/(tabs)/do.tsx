import { View, Text, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import {
  Briefcase, Plus, X, Clock, Target, CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronRight,
  Flame, Calendar, AlertTriangle, Play, Pause, ArrowRight, TrendingUp, Zap, Filter,
  CalendarDays, CalendarClock, BarChart3, RefreshCw, Send, MessageSquare, Flag, Timer, HelpCircle,
  DollarSign, Users
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { Function as BusinessFunction } from '@/types';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOKRStore, type OKR } from '@/lib/state/okr-store';
import { cn } from '@/lib/cn';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SquaresDisplay } from '@/components/SquaresDisplay';
import { ResourceBar } from '@/components/ResourceBar';
import { useResourceStore, getTeamSizeEfficiency } from '@/lib/state/resource-store';
import { useOrganizationStore } from '@/lib/state/organization-store';

const DO_HELP_APPRENTICE: HelpContent = {
  title: 'Task Execution',
  subtitle: 'Get things done',
  description: 'The Do tab shows your tasks organized by the OKRs they contribute to. Focus on executing tasks and see how your work drives objectives forward.',
  tips: [
    'Tasks are grouped by OKR to show you the bigger picture',
    'See how each task contributes to overall objective progress',
    'Use Focus Mode to see only your highest-priority tasks',
    'Submit work for review once you\'ve completed the quality checklist',
  ],
  quickActions: [
    { label: 'Focus Mode', description: 'See only your most urgent and important tasks' },
    { label: 'Submit Work', description: 'Mark a task as complete and send it for executive review' },
    { label: 'Track Time', description: 'Start a timer to record hours spent on each task' },
  ],
};

const DO_HELP_EXECUTIVE: HelpContent = {
  title: 'OKR Execution',
  subtitle: 'Drive objectives forward',
  description: 'The Do tab shows your OKRs with all related tasks nested underneath. Track progress on objectives and help your team execute.',
  tips: [
    'Each OKR shows all tasks that drive it forward',
    'Monitor task progress and unblock your team',
    'Review submitted work and provide feedback',
    'Use OKR health indicators to identify risks early',
  ],
  quickActions: [
    { label: 'Expand OKR', description: 'See all tasks contributing to an objective' },
    { label: 'Review Work', description: 'Provide feedback on submitted tasks' },
    { label: 'Unblock Tasks', description: 'Help remove blockers for your team' },
  ],
};

// Initialize work plan store once
if (useWorkPlanStore.getState().workPlans.length === 0) {
  useWorkPlanStore.getState().initializeWorkPlans();
}

// Types
type ViewMode = 'focus' | 'all' | 'blocked';
type TimeFilter = 'today' | 'week' | 'all';

// Priority calculation
interface PrioritizedPlan extends WorkPlan {
  priority: 'critical' | 'high' | 'medium' | 'low';
  daysUntilDue: number;
  okrHealth: 'on-track' | 'at-risk' | 'off-track';
  okrProgress: number;
}

export default function DoScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  // Use centralized stores
  const getApprenticeWorkPlans = useWorkPlanStore(s => s.getApprenticeWorkPlans);
  const getFounderWorkPlansByFunction = useWorkPlanStore(s => s.getFounderWorkPlansByFunction);
  const getExecutiveWorkPlans = useWorkPlanStore(s => s.getExecutiveWorkPlans);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const okrs = useOKRStore(s => s.okrs);

  // Initialize resource store if empty
  const resourcePeople = useResourceStore(s => s.people);
  const seedResourceData = useResourceStore(s => s.seedDemoData);
  useEffect(() => {
    if (resourcePeople.length === 0 && currentWorkspace) {
      seedResourceData(currentWorkspace.id);
    }
  }, [resourcePeople.length, currentWorkspace]);

  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');
  const [expandedOKRs, setExpandedOKRs] = useState<Set<string>>(new Set());
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WorkPlan | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('focus');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Enhanced submission state
  const [hoursSpent, setHoursSpent] = useState('');
  const [blockersEncountered, setBlockersEncountered] = useState<string[]>([]);
  const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [qualityChecklist, setQualityChecklist] = useState({
    requirementsMet: false,
    testedLocally: false,
    documentationUpdated: false,
    peerReviewed: false,
  });

  const functions: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Ops', 'Finance', 'Admin'];
  const isFounder = currentMembership?.role === 'Founder';
  const isExecutive = currentMembership?.role === 'FractionalExec';
  const isApprentice = currentMembership?.role === 'Apprentice';

  // Get all work plans
  const allWorkPlans = useWorkPlanStore(s => s.workPlans);

  // Get current user's member ID from organization store
  const orgMembers = useOrganizationStore(s => s.members);
  const currentUserMemberId = useMemo(() => {
    // Find the member that matches the current user
    // For demo, match by role and function
    const member = orgMembers.find(m =>
      m.role === currentMembership?.role &&
      (currentMembership?.role !== 'FractionalExec' || m.function === currentMembership?.function)
    );
    return member?.id;
  }, [orgMembers, currentMembership]);

  // Get work plans for current user - filter by assignedMemberIds
  const myWorkPlans = useMemo(() => {
    // If we have a specific member ID, filter by it
    if (currentUserMemberId) {
      return allWorkPlans.filter(wp =>
        wp.assignedMemberIds?.includes(currentUserMemberId)
      );
    }
    // Fallback to role-based filtering for demo
    if (isApprentice) {
      return getApprenticeWorkPlans();
    }
    if (isExecutive) {
      return getExecutiveWorkPlans((currentMembership?.function || 'Marketing') as BusinessFunction);
    }
    return [];
  }, [allWorkPlans, currentUserMemberId, isApprentice, isExecutive, currentMembership?.function]);

  // Categorize tasks by status for proper ordering
  const categorizedTasks = useMemo(() => {
    const enriched = myWorkPlans.map(enrichWorkPlan);

    // Active tasks (in-progress) - ordered by days to completion
    const activeTasks = enriched
      .filter(t => t.status === 'in-progress')
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // Not started tasks
    const notStartedTasks = enriched
      .filter(t => t.status === 'not-started')
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // Abandoned tasks (blocked with progress > 0)
    const abandonedTasks = enriched
      .filter(t => t.status === 'blocked' && t.progress > 0)
      .sort((a, b) => b.progress - a.progress); // Higher progress = more wasted

    // Completed tasks
    const completedTasks = enriched
      .filter(t => t.status === 'completed')
      .sort((a, b) => {
        // Sort by completion date if available
        const dateA = a.lastSubmittedAt ? new Date(a.lastSubmittedAt).getTime() : 0;
        const dateB = b.lastSubmittedAt ? new Date(b.lastSubmittedAt).getTime() : 0;
        return dateB - dateA;
      });

    return { activeTasks, notStartedTasks, abandonedTasks, completedTasks };
  }, [myWorkPlans]);

  // Calculate task cost and team efficiency
  const calculateTaskCost = (plan: WorkPlan) => {
    const teamSize = plan.assignedMemberIds?.length || 1;
    const teamEfficiency = getTeamSizeEfficiency(teamSize);
    const totalSquares = plan.estimatedTimeUnits;
    const allocatedPerWeek = plan.allocatedTimeUnitsPerWeek || 2;
    const effectiveOutputPerWeek = allocatedPerWeek * teamEfficiency.efficiencyMultiplier;
    const remainingSquares = Math.ceil(totalSquares * (1 - plan.progress / 100));
    const weeksToComplete = effectiveOutputPerWeek > 0 ? Math.ceil(remainingSquares / effectiveOutputPerWeek) : 0;

    return {
      teamSize,
      teamEfficiency,
      totalSquares,
      allocatedPerWeek,
      effectiveOutputPerWeek,
      remainingSquares,
      weeksToComplete,
    };
  };

  // Calculate priority and enrich work plans
  const enrichWorkPlan = (plan: WorkPlan): PrioritizedPlan => {
    const today = new Date();
    const dueDate = new Date(plan.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Find linked OKR
    const linkedOKR = okrs.find(o => o.title === plan.linkedOKRTitle);
    const okrHealth = linkedOKR?.status || 'on-track';
    const okrProgress = linkedOKR?.objectives && linkedOKR.objectives.length > 0
      ? Math.round(linkedOKR.objectives.reduce((sum, obj) => sum + obj.progress, 0) / linkedOKR.objectives.length)
      : 0;

    // Calculate priority
    let priority: 'critical' | 'high' | 'medium' | 'low';
    if (plan.status === 'blocked' || daysUntilDue <= 2 || okrHealth === 'off-track') {
      priority = 'critical';
    } else if (daysUntilDue <= 7 || okrHealth === 'at-risk') {
      priority = 'high';
    } else if (daysUntilDue <= 14) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    return {
      ...plan,
      priority,
      daysUntilDue,
      okrHealth,
      okrProgress,
    };
  };

  const toggleOKR = (okrId: string) => {
    const newExpanded = new Set(expandedOKRs);
    if (newExpanded.has(okrId)) {
      newExpanded.delete(okrId);
    } else {
      newExpanded.add(okrId);
    }
    setExpandedOKRs(newExpanded);
  };

  const togglePlan = (planId: string) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedPlans(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started':
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', color: '#64748b' };
      case 'in-progress':
        return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', color: '#3b82f6' };
      case 'completed':
        return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', color: '#10b981' };
      case 'blocked':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', color: '#ef4444' };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', color: '#64748b' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not-started': return 'Not Started';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'blocked': return 'Blocked';
      default: return 'Unknown';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return { bg: '#ef4444', text: 'CRITICAL' };
      case 'high': return { bg: '#f59e0b', text: 'HIGH' };
      case 'medium': return { bg: '#3b82f6', text: 'MEDIUM' };
      case 'low': return { bg: '#64748b', text: 'LOW' };
      default: return { bg: '#64748b', text: 'LOW' };
    }
  };

  const handleSubmitWork = () => {
    if (!selectedPlan) return;

    const checklistScore = Object.values(qualityChecklist).filter(Boolean).length * 20;
    const confidenceBonus = confidenceLevel === 'high' ? 20 : confidenceLevel === 'medium' ? 10 : 0;
    const estimatedQuality = Math.min(100, checklistScore + confidenceBonus);

    updateWorkPlan(selectedPlan.id, {
      needsSubmission: true,
      lastSubmittedAt: new Date().toISOString(),
      submissionData: {
        notes: submissionNotes,
        hoursSpent: parseFloat(hoursSpent) || 0,
        blockersEncountered,
        confidenceLevel,
        qualityChecklist,
        estimatedQuality,
      },
    });

    // Reset form
    setShowSubmitModal(false);
    setSelectedPlan(null);
    setSubmissionNotes('');
    setHoursSpent('');
    setBlockersEncountered([]);
    setConfidenceLevel('high');
    setQualityChecklist({
      requirementsMet: false,
      testedLocally: false,
      documentationUpdated: false,
      peerReviewed: false,
    });
  };

  const handleQuickProgress = (plan: WorkPlan, increment: number) => {
    const newProgress = Math.min(100, Math.max(0, plan.progress + increment));
    const newStatus = newProgress === 100 ? 'completed' : newProgress > 0 ? 'in-progress' : 'not-started';
    updateWorkPlan(plan.id, { progress: newProgress, status: newStatus });
  };

  const handleToggleBlocked = (plan: WorkPlan) => {
    const newStatus = plan.status === 'blocked' ? 'in-progress' : 'blocked';
    updateWorkPlan(plan.id, { status: newStatus });
  };

  const toggleTimer = (planId: string) => {
    if (activeTimer === planId) {
      setActiveTimer(null);
    } else {
      setActiveTimer(planId);
    }
  };

  // Filter and sort plans
  const filterAndSortPlans = (plans: WorkPlan[]): PrioritizedPlan[] => {
    let enrichedPlans = plans.map(enrichWorkPlan);

    if (viewMode === 'focus') {
      enrichedPlans = enrichedPlans.filter(p => p.status !== 'completed' && p.priority !== 'low');
    } else if (viewMode === 'blocked') {
      enrichedPlans = enrichedPlans.filter(p => p.status === 'blocked');
    } else {
      enrichedPlans = enrichedPlans.filter(p => p.status !== 'completed');
    }

    if (timeFilter === 'today') {
      enrichedPlans = enrichedPlans.filter(p => p.daysUntilDue <= 1);
    } else if (timeFilter === 'week') {
      enrichedPlans = enrichedPlans.filter(p => p.daysUntilDue <= 7);
    }

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return enrichedPlans.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.daysUntilDue - b.daysUntilDue;
    });
  };

  // Velocity metrics
  const calculateVelocity = (plans: WorkPlan[]) => {
    const completed = plans.filter(p => p.status === 'completed').length;
    const total = plans.length;
    const blocked = plans.filter(p => p.status === 'blocked').length;
    const avgProgress = plans.length > 0
      ? Math.round(plans.reduce((sum, p) => sum + p.progress, 0) / plans.length)
      : 0;
    return { completed, total, blocked, avgProgress };
  };

  // Filter and prepare data at top level
  const filteredPlans = filterAndSortPlans(myWorkPlans);

  // Group tasks by OKR for Apprentices
  const tasksByOKR = useMemo(() => {
    if (!isApprentice) return [];

    const grouped = new Map<string, { okr: OKR; tasks: PrioritizedPlan[]; highestPriority: number }>();

    filteredPlans.forEach(task => {
      const okr = okrs.find(o => o.title === task.linkedOKRTitle);
      if (okr) {
        if (!grouped.has(okr.id)) {
          grouped.set(okr.id, { okr, tasks: [], highestPriority: 4 }); // 4 = lowest priority (low)
        }
        const group = grouped.get(okr.id)!;
        group.tasks.push(task);

        // Track highest priority (lowest number = highest priority)
        const priorityValue = { critical: 0, high: 1, medium: 2, low: 3 }[task.priority];
        if (priorityValue < group.highestPriority) {
          group.highestPriority = priorityValue;
        }
      }
    });

    // Sort OKRs by highest priority task they contain
    return Array.from(grouped.values()).sort((a, b) => a.highestPriority - b.highestPriority);
  }, [isApprentice, filteredPlans, okrs]);

  // Group OKRs with tasks for Executives
  const okrsWithTasks = useMemo(() => {
    if (!isExecutive) return [];

    const execFunction = (currentMembership?.function || 'Marketing') as BusinessFunction;
    const myOKRs = okrs.filter(okr => okr.function === execFunction);

    const okrsWithTasksAndPriority = myOKRs.map(okr => {
      const tasks = myWorkPlans
        .filter(plan => plan.linkedOKRTitle === okr.title && plan.status !== 'completed')
        .map(enrichWorkPlan)
        .sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.daysUntilDue - b.daysUntilDue;
        });

      // Calculate highest priority for this OKR based on its tasks
      const highestPriority = tasks.length > 0
        ? { critical: 0, high: 1, medium: 2, low: 3 }[tasks[0].priority]
        : 4; // No tasks = lowest priority

      return { okr, tasks, highestPriority };
    });

    // Sort OKRs by highest priority task they contain
    return okrsWithTasksAndPriority.sort((a, b) => a.highestPriority - b.highestPriority);
  }, [isExecutive, currentMembership?.function, okrs, myWorkPlans]);

  // Render compact task card (for OKR-grouped view)
  const renderCompactTaskCard = (plan: PrioritizedPlan) => {
    const isExpanded = expandedPlans.has(plan.id);
    const statusStyle = getStatusColor(plan.status);
    const priorityStyle = getPriorityColor(plan.priority);
    const isTimerActive = activeTimer === plan.id;

    return (
      <View key={plan.id} className="mb-2">
        <Pressable
          onPress={() => togglePlan(plan.id)}
          className={cn(
            'rounded-xl p-3 active:opacity-70 border',
            plan.status === 'blocked'
              ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
              : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
          )}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-gray-900 dark:text-white font-bold text-sm">
                {plan.title}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Squares Badge */}
              <View className="flex-row items-center gap-0.5 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {Array.from({ length: Math.min(plan.estimatedTimeUnits, 5) }).map((_, i) => (
                  <View
                    key={i}
                    className="w-2 h-2 rounded-sm"
                    style={{
                      backgroundColor: i < Math.round((plan.progress / 100) * plan.estimatedTimeUnits)
                        ? (plan.status === 'blocked' ? '#ef4444' : '#10b981')
                        : '#d1d5db',
                    }}
                  />
                ))}
                <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-bold ml-1">
                  {plan.estimatedTimeUnits}□
                </Text>
              </View>

              {/* Priority Badge */}
              <View
                className="px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: priorityStyle.bg }}
              >
                <Text className="text-white text-xs font-bold">{priorityStyle.text[0]}</Text>
              </View>

              {/* Due Date */}
              <View className={cn(
                'px-2 py-0.5 rounded',
                plan.daysUntilDue <= 2 ? 'bg-red-100 dark:bg-red-900/30' :
                plan.daysUntilDue <= 7 ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-gray-100 dark:bg-slate-800'
              )}>
                <Text className={cn(
                  'text-xs font-semibold',
                  plan.daysUntilDue <= 2 ? 'text-red-600 dark:text-red-400' :
                  plan.daysUntilDue <= 7 ? 'text-amber-600 dark:text-amber-400' :
                  'text-gray-600 dark:text-slate-400'
                )}>
                  {plan.daysUntilDue}d
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mb-2">
            <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <View
                className={cn(
                  'h-full rounded-full',
                  plan.status === 'completed' ? 'bg-emerald-500' :
                  plan.status === 'blocked' ? 'bg-red-500' :
                  'bg-blue-500'
                )}
                style={{ width: `${plan.progress}%` }}
              />
            </View>
          </View>

          {/* Squares Display */}
          <View className="mb-2">
            <SquaresDisplay
              totalSquares={plan.estimatedTimeUnits}
              completedSquares={Math.round((plan.progress / 100) * plan.estimatedTimeUnits)}
              variant="compact"
              statusColor={
                plan.status === 'completed' ? '#10b981' :
                plan.status === 'blocked' ? '#ef4444' : '#3b82f6'
              }
            />
          </View>

          {/* Quick Actions Row */}
          <View className="flex-row items-center justify-between">
            <View className={cn('px-2 py-0.5 rounded', statusStyle.bg)}>
              <Text className={cn('text-xs font-semibold', statusStyle.text)}>{getStatusText(plan.status)}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Timer */}
              <Pressable
                onPress={() => toggleTimer(plan.id)}
                className={cn(
                  'w-7 h-7 rounded-lg items-center justify-center',
                  isTimerActive ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-700'
                )}
              >
                {isTimerActive ? <Pause size={14} color="#fff" /> : <Play size={14} color="#64748b" />}
              </Pressable>

              {/* Blocked Toggle */}
              <Pressable
                onPress={() => handleToggleBlocked(plan)}
                className={cn(
                  'w-7 h-7 rounded-lg items-center justify-center',
                  plan.status === 'blocked' ? 'bg-red-500' : 'bg-gray-200 dark:bg-slate-700'
                )}
              >
                <AlertTriangle size={14} color={plan.status === 'blocked' ? '#fff' : '#64748b'} />
              </Pressable>

              {/* Expand */}
              {isExpanded ? (
                <ChevronDown size={18} color="#64748b" />
              ) : (
                <ChevronRight size={18} color="#64748b" />
              )}
            </View>
          </View>
        </Pressable>

        {/* Expanded Actions */}
        {isExpanded && (
          <View className="mt-1 ml-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3">
            <Text className="text-gray-700 dark:text-slate-300 text-sm mb-3">{plan.description}</Text>

            {/* Quick Progress Buttons */}
            <View className="mb-3">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-semibold mb-2">QUICK PROGRESS</Text>
              <View className="flex-row gap-2">
                {[25, 50].map((increment) => (
                  <Pressable
                    key={increment}
                    onPress={() => handleQuickProgress(plan, increment)}
                    className="flex-1 bg-blue-100 dark:bg-blue-900/30 py-2 rounded-lg active:opacity-70"
                  >
                    <Text className="text-blue-600 dark:text-blue-400 text-center font-semibold text-sm">+{increment}%</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => handleQuickProgress(plan, 100 - plan.progress)}
                  className="flex-1 bg-emerald-100 dark:bg-emerald-900/30 py-2 rounded-lg active:opacity-70"
                >
                  <Text className="text-emerald-600 dark:text-emerald-400 text-center font-semibold text-sm">Done</Text>
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            {isApprentice && (
              <Pressable
                onPress={() => {
                  setSelectedPlan(plan);
                  setShowSubmitModal(true);
                }}
                className="bg-purple-500 py-2 rounded-lg active:opacity-70 flex-row items-center justify-center"
              >
                <Send size={14} color="#fff" />
                <Text className="text-white text-center font-semibold text-sm ml-1.5">Submit Work</Text>
              </Pressable>
            )}

            {/* Feedback Display */}
            {plan.feedback && (
              <View className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                <View className="flex-row items-center mb-1">
                  <MessageSquare size={12} color="#3b82f6" />
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold ml-1">Feedback</Text>
                </View>
                <Text className="text-blue-600 dark:text-blue-400 text-xs">{plan.feedback}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render for Apprentices - Task-focused grouped by OKR
  if (isApprentice) {
    const velocity = calculateVelocity(myWorkPlans);
    const blockedCount = myWorkPlans.filter(p => p.status === 'blocked').length;
    const criticalCount = filteredPlans.filter(p => p.priority === 'critical').length;

    return (
      <View className="flex-1 bg-gray-50 dark:bg-slate-950">
        {/* Help Modal */}
        <HelpModal
          visible={showHelp}
          onClose={() => setShowHelp(false)}
          content={DO_HELP_APPRENTICE}
          gradientColors={['#10b981', '#059669']}
        />

        {/* Header */}
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white/70 text-xs font-medium">MY TASKS</Text>
              <Text className="text-white text-xl font-bold">Do</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <HelpButton onPress={() => setShowHelp(true)} />
              {blockedCount > 0 && (
                <View className="bg-white/20 px-3 py-2 rounded-xl">
                  <Text className="text-white/80 text-xs font-medium">BLOCKED</Text>
                  <Text className="text-white text-lg font-bold">{blockedCount}</Text>
                </View>
              )}
            </View>
          </View>
          <View className="flex-row gap-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-emerald-300" />
              <Text className="text-white/90 text-xs">{filteredPlans.length} tasks</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-white" />
              <Text className="text-white/90 text-xs">{velocity.avgProgress}% avg</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Resource Bar */}
        <ResourceBar
          workspaceId={currentWorkspace?.id || ''}
          compact
        />

        {/* View Tabs */}
        <View className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {[
              { value: 'focus', label: 'Focus', icon: Flame },
              { value: 'all', label: 'All Tasks', icon: BarChart3 },
              { value: 'blocked', label: 'Blocked', icon: AlertTriangle, count: blockedCount },
            ].map((tab) => (
              <Pressable
                key={tab.value}
                onPress={() => setViewMode(tab.value as ViewMode)}
                className={`flex-row items-center px-4 py-2 rounded-full ${
                  viewMode === tab.value ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-slate-800'
                } active:opacity-70`}
              >
                <tab.icon size={16} color={viewMode === tab.value ? '#fff' : tab.value === 'blocked' ? '#ef4444' : '#64748b'} />
                <Text className={`ml-2 font-semibold text-sm ${
                  viewMode === tab.value ? 'text-white' : 'text-gray-700 dark:text-slate-300'
                }`}>
                  {tab.label}
                </Text>
                {tab.count !== undefined && tab.count > 0 && (
                  <View className={`ml-1.5 px-1.5 py-0.5 rounded ${
                    viewMode === tab.value ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <Text className={`text-xs font-bold ${
                      viewMode === tab.value ? 'text-white' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Time Filter */}
        <View className="px-5 py-2 bg-white dark:bg-slate-900">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(['today', 'week', 'all'] as TimeFilter[]).map((filter) => (
              <Pressable
                key={filter}
                onPress={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded-lg ${
                  timeFilter === filter ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-50 dark:bg-slate-800'
                }`}
              >
                <Text className={`text-xs font-semibold ${
                  timeFilter === filter ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-slate-400'
                }`}>
                  {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'All'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView className="flex-1 px-5 py-4">
          {/* ACTIVE TASKS - In Progress, ordered by days to completion */}
          {categorizedTasks.activeTasks.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide">
                  ACTIVE - IN PROGRESS
                </Text>
                <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    {categorizedTasks.activeTasks.length} task{categorizedTasks.activeTasks.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              {categorizedTasks.activeTasks.map(task => renderCompactTaskCard(task))}
            </View>
          )}

          {/* NOT STARTED TASKS */}
          {categorizedTasks.notStartedTasks.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold tracking-wide">
                  NOT STARTED
                </Text>
                <View className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold">
                    {categorizedTasks.notStartedTasks.length} task{categorizedTasks.notStartedTasks.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              {categorizedTasks.notStartedTasks.map(task => renderCompactTaskCard(task))}
            </View>
          )}

          {/* ABANDONED TASKS */}
          {categorizedTasks.abandonedTasks.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-red-500 dark:text-red-400 text-xs font-bold tracking-wide">
                  ABANDONED
                </Text>
                <View className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                  <Text className="text-red-600 dark:text-red-400 text-xs font-semibold">
                    {categorizedTasks.abandonedTasks.length} task{categorizedTasks.abandonedTasks.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-xl p-3 mb-3">
                <View className="flex-row items-center">
                  <AlertTriangle size={14} color="#ef4444" />
                  <Text className="text-red-600 dark:text-red-400 text-xs ml-2 flex-1">
                    These tasks were started but abandoned. TUs shown represent wasted effort.
                  </Text>
                </View>
              </View>
              {categorizedTasks.abandonedTasks.map(task => renderCompactTaskCard(task))}
            </View>
          )}

          {/* COMPLETED TASKS */}
          {categorizedTasks.completedTasks.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide">
                  COMPLETED
                </Text>
                <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                  <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    {categorizedTasks.completedTasks.length} task{categorizedTasks.completedTasks.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              {categorizedTasks.completedTasks.map(task => renderCompactTaskCard(task))}
            </View>
          )}

          {/* Empty State */}
          {categorizedTasks.activeTasks.length === 0 &&
           categorizedTasks.notStartedTasks.length === 0 &&
           categorizedTasks.abandonedTasks.length === 0 &&
           categorizedTasks.completedTasks.length === 0 && (
            <View className="items-center justify-center py-12 bg-white dark:bg-slate-900 rounded-xl">
              <CheckCircle2 size={48} color="#10b981" />
              <Text className="text-emerald-600 dark:text-emerald-400 text-center font-semibold text-lg mt-4">
                No Tasks Assigned
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-center mt-2">
                Tasks assigned to you will appear here
              </Text>
            </View>
          )}

          <View className="h-8" />
        </ScrollView>

        {/* Submit Work Modal - kept as before */}
        <Modal
          visible={showSubmitModal}
          transparent
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSubmitModal(false)}
        >
          <View className="flex-1 bg-black/70 justify-end">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
              <View className="bg-white dark:bg-slate-900 rounded-t-3xl flex-1" style={{ maxHeight: '95%' }}>
                <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-gray-900 dark:text-white text-xl font-bold">Submit Work</Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">Complete all sections for faster approval</Text>
                    </View>
                    <Pressable
                      onPress={() => setShowSubmitModal(false)}
                      className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 active:opacity-70"
                    >
                      <X size={24} color="#64748b" />
                    </Pressable>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
                  {selectedPlan && (
                    <>
                      {/* Task Context */}
                      <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                        <Text className="text-blue-900 dark:text-blue-100 font-bold text-base mb-1">
                          {selectedPlan.title}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Target size={14} color="#3b82f6" />
                          <Text className="text-blue-700 dark:text-blue-300 text-xs ml-1">
                            Linked to: {selectedPlan.linkedOKRTitle}
                          </Text>
                        </View>
                      </View>

                      {/* Time Tracking */}
                      <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                          <Clock size={16} color="#64748b" />
                          <Text className="text-gray-900 dark:text-white font-semibold ml-2">Time Spent</Text>
                          <Text className="text-red-500 ml-1">*</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <TextInput
                            className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                            value={hoursSpent}
                            onChangeText={setHoursSpent}
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="decimal-pad"
                          />
                          <Text className="text-gray-600 dark:text-slate-400 font-medium">hours</Text>
                        </View>
                      </View>

                      {/* Quality Checklist */}
                      <View className="mb-4">
                        <View className="flex-row items-center mb-3">
                          <CheckCircle2 size={16} color="#10b981" />
                          <Text className="text-gray-900 dark:text-white font-semibold ml-2">Quality Checklist</Text>
                        </View>
                        <View className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
                          {[
                            { key: 'requirementsMet', label: 'All requirements met', icon: Target },
                            { key: 'testedLocally', label: 'Tested/verified locally', icon: CheckCircle2 },
                            { key: 'documentationUpdated', label: 'Documentation updated', icon: Briefcase },
                            { key: 'peerReviewed', label: 'Peer reviewed (if applicable)', icon: MessageSquare },
                          ].map(({ key, label, icon: Icon }) => (
                            <Pressable
                              key={key}
                              onPress={() => setQualityChecklist(prev => ({
                                ...prev,
                                [key]: !prev[key as keyof typeof prev]
                              }))}
                              className="flex-row items-center py-2 active:opacity-70"
                            >
                              <View className={cn(
                                'w-6 h-6 rounded-md border-2 items-center justify-center mr-3',
                                qualityChecklist[key as keyof typeof qualityChecklist]
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-gray-300 dark:border-slate-600'
                              )}>
                                {qualityChecklist[key as keyof typeof qualityChecklist] && (
                                  <CheckCircle2 size={14} color="#fff" />
                                )}
                              </View>
                              <Icon size={14} color="#64748b" />
                              <Text className="text-gray-700 dark:text-slate-300 ml-2 flex-1">{label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      {/* Confidence Level */}
                      <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                          <Zap size={16} color="#64748b" />
                          <Text className="text-gray-900 dark:text-white font-semibold ml-2">Confidence Level</Text>
                        </View>
                        <View className="flex-row gap-2">
                          {(['high', 'medium', 'low'] as const).map((level) => (
                            <Pressable
                              key={level}
                              onPress={() => setConfidenceLevel(level)}
                              className={cn(
                                'flex-1 py-3 rounded-xl items-center border-2',
                                confidenceLevel === level
                                  ? level === 'high' ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500'
                                    : level === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-500'
                                    : 'bg-red-100 dark:bg-red-900/30 border-red-500'
                                  : 'bg-gray-100 dark:bg-slate-800 border-transparent'
                              )}
                            >
                              <Text className={cn(
                                'font-semibold capitalize',
                                confidenceLevel === level
                                  ? level === 'high' ? 'text-emerald-700 dark:text-emerald-300'
                                    : level === 'medium' ? 'text-amber-700 dark:text-amber-300'
                                    : 'text-red-700 dark:text-red-300'
                                  : 'text-gray-600 dark:text-slate-400'
                              )}>
                                {level}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      {/* Blockers */}
                      <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                          <AlertTriangle size={16} color="#f59e0b" />
                          <Text className="text-gray-900 dark:text-white font-semibold ml-2">Blockers Encountered</Text>
                          <Text className="text-gray-500 dark:text-slate-500 text-xs ml-2">(optional)</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2 mb-2">
                          {['Unclear requirements', 'Missing resources', 'Technical issues', 'Waiting on others'].map((blocker) => (
                            <Pressable
                              key={blocker}
                              onPress={() => {
                                setBlockersEncountered(prev =>
                                  prev.includes(blocker)
                                    ? prev.filter(b => b !== blocker)
                                    : [...prev, blocker]
                                );
                              }}
                              className={cn(
                                'px-3 py-2 rounded-lg border',
                                blockersEncountered.includes(blocker)
                                  ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-500'
                                  : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                              )}
                            >
                              <Text className={cn(
                                'text-sm',
                                blockersEncountered.includes(blocker)
                                  ? 'text-amber-700 dark:text-amber-300 font-semibold'
                                  : 'text-gray-600 dark:text-slate-400'
                              )}>
                                {blocker}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      {/* Summary Notes */}
                      <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                          <MessageSquare size={16} color="#64748b" />
                          <Text className="text-gray-900 dark:text-white font-semibold ml-2">Summary Notes</Text>
                        </View>
                        <TextInput
                          className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[100px]"
                          value={submissionNotes}
                          onChangeText={setSubmissionNotes}
                          placeholder="What was completed? Any key decisions made?"
                          placeholderTextColor="#94a3b8"
                          multiline
                          textAlignVertical="top"
                        />
                      </View>

                      {/* Submit Button */}
                      <Pressable
                        onPress={handleSubmitWork}
                        disabled={!hoursSpent}
                        className={cn(
                          'py-4 rounded-xl flex-row items-center justify-center mb-6',
                          hoursSpent ? 'bg-purple-500 active:opacity-70' : 'bg-gray-300 dark:bg-slate-700'
                        )}
                      >
                        <Send size={18} color={hoursSpent ? '#fff' : '#94a3b8'} />
                        <Text className={cn(
                          'text-center font-bold ml-2',
                          hoursSpent ? 'text-white' : 'text-gray-500'
                        )}>
                          Submit for Review
                        </Text>
                      </Pressable>
                    </>
                  )}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    );
  }

  // Render for Executives - OKR-focused with tasks nested
  if (isExecutive) {
    const execFunction = (currentMembership?.function || 'Marketing') as BusinessFunction;
    const myOKRs = okrs.filter(okr => okr.function === execFunction);

    const velocity = calculateVelocity(myWorkPlans);
    const blockedCount = myWorkPlans.filter(p => p.status === 'blocked').length;

    return (
      <View className="flex-1 bg-gray-50 dark:bg-slate-950">
        {/* Help Modal */}
        <HelpModal
          visible={showHelp}
          onClose={() => setShowHelp(false)}
          content={DO_HELP_EXECUTIVE}
          gradientColors={['#3b82f6', '#2563eb']}
        />

        {/* Header */}
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white/70 text-xs font-medium">{execFunction.toUpperCase()} OKRS</Text>
              <Text className="text-white text-xl font-bold">Do</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <HelpButton onPress={() => setShowHelp(true)} />
              {blockedCount > 0 && (
                <View className="bg-white/20 px-3 py-2 rounded-xl">
                  <Text className="text-white/80 text-xs font-medium">BLOCKED</Text>
                  <Text className="text-white text-lg font-bold">{blockedCount}</Text>
                </View>
              )}
            </View>
          </View>
          <View className="flex-row gap-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-blue-300" />
              <Text className="text-white/90 text-xs">{myOKRs.length} OKRs</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-white" />
              <Text className="text-white/90 text-xs">{velocity.total - velocity.completed} active tasks</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1 px-5 py-4">
          {okrsWithTasks.length === 0 ? (
            <View className="items-center justify-center py-12 bg-white dark:bg-slate-900 rounded-xl">
              <Target size={48} color="#3b82f6" />
              <Text className="text-blue-600 dark:text-blue-400 text-center font-semibold text-lg mt-4">
                No OKRs Yet
              </Text>
            </View>
          ) : (
            okrsWithTasks.map(({ okr, tasks }) => {
              const isExpanded = expandedOKRs.has(okr.id);
              const okrProgress = okr.objectives.length > 0
                ? Math.round(okr.objectives.reduce((sum, obj) => sum + obj.progress, 0) / okr.objectives.length)
                : 0;
              const healthColor = okr.status === 'on-track' ? '#10b981' : okr.status === 'at-risk' ? '#f59e0b' : '#ef4444';

              return (
                <View key={okr.id} className="mb-4">
                  {/* OKR Card */}
                  <Pressable
                    onPress={() => toggleOKR(okr.id)}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center mb-2">
                          <View
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: healthColor }}
                          />
                          <Text className="text-gray-900 dark:text-white font-bold text-base flex-1">
                            {okr.title}
                          </Text>
                        </View>
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">
                          {tasks.length} active task{tasks.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      {isExpanded ? (
                        <ChevronDown size={24} color="#64748b" />
                      ) : (
                        <ChevronRight size={24} color="#64748b" />
                      )}
                    </View>

                    {/* OKR Progress */}
                    <View className="mb-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-gray-500 dark:text-slate-400 text-xs">Overall Progress</Text>
                        <Text className="text-gray-900 dark:text-white font-bold text-sm">{okrProgress}%</Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{ width: `${okrProgress}%`, backgroundColor: healthColor }}
                        />
                      </View>
                    </View>

                    {/* Key Results */}
                    <View className="flex-row flex-wrap gap-2 mt-2">
                      {okr.objectives.map((obj, idx) => (
                        <View
                          key={idx}
                          className="bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded"
                        >
                          <Text className="text-gray-700 dark:text-slate-300 text-xs">
                            {obj.progress}% • {obj.title}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Pressable>

                  {/* Tasks under this OKR */}
                  {isExpanded && tasks.length > 0 && (
                    <View className="mt-2 ml-3">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs font-semibold mb-2 px-1">
                        TASKS ({tasks.length})
                      </Text>
                      {tasks.map(task => renderCompactTaskCard(task))}
                    </View>
                  )}

                  {isExpanded && tasks.length === 0 && (
                    <View className="mt-2 ml-3 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                      <Text className="text-gray-500 dark:text-slate-400 text-sm text-center">
                        No active tasks for this OKR
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}

          <View className="h-8" />
        </ScrollView>
      </View>
    );
  }

  // Render for Founders - keep as before but simplified
  if (isFounder) {
    const allPlans = functions.flatMap(func => getFounderWorkPlansByFunction(func));
    const filteredFunctions = selectedFunction === 'all' ? functions : [selectedFunction];
    const velocity = calculateVelocity(allPlans);
    const blockedCount = allPlans.filter(p => p.status === 'blocked').length;

    return (
      <View className="flex-1 bg-gray-50 dark:bg-slate-950">
        <LinearGradient
          colors={['#8b5cf6', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white/70 text-xs font-medium">EXECUTION OVERVIEW</Text>
              <Text className="text-white text-xl font-bold">Do</Text>
            </View>
            {blockedCount > 0 && (
              <View className="bg-white/20 px-3 py-2 rounded-xl">
                <Text className="text-white/80 text-xs font-medium">BLOCKED</Text>
                <Text className="text-white text-lg font-bold">{blockedCount}</Text>
              </View>
            )}
          </View>
          <View className="flex-row gap-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-violet-300" />
              <Text className="text-white/90 text-xs">{velocity.total - velocity.completed} active</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-emerald-400" />
              <Text className="text-white/90 text-xs">{velocity.completed} completed</Text>
            </View>
          </View>
        </LinearGradient>

        <View className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Pressable
              onPress={() => setSelectedFunction('all')}
              className={`px-4 py-2 rounded-full ${
                selectedFunction === 'all' ? 'bg-purple-500' : 'bg-gray-100 dark:bg-slate-800'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                selectedFunction === 'all' ? 'text-white' : 'text-gray-600 dark:text-slate-400'
              }`}>
                All Functions
              </Text>
            </Pressable>
            {functions.map((func) => (
              <Pressable
                key={func}
                onPress={() => setSelectedFunction(func)}
                className={`px-4 py-2 rounded-full ${
                  selectedFunction === func ? 'bg-purple-500' : 'bg-gray-100 dark:bg-slate-800'
                }`}
              >
                <Text className={`text-sm font-semibold ${
                  selectedFunction === func ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                }`}>
                  {func}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView className="flex-1 px-5 py-4">
          <Text className="text-gray-500 dark:text-slate-400 text-center py-12">
            Founder view shows all tasks across functions
          </Text>
          <View className="h-8" />
        </ScrollView>
      </View>
    );
  }

  return null;
}
