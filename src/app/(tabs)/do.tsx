import { View, Text, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import {
  Briefcase, Plus, X, Clock, Target, CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronRight,
  Flame, Calendar, AlertTriangle, Play, Pause, ArrowRight, TrendingUp, Zap, Filter,
  CalendarDays, CalendarClock, BarChart3, RefreshCw, Send, MessageSquare, Flag, Timer, HelpCircle
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { Function as BusinessFunction } from '@/types';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOKRStore } from '@/lib/state/okr-store';
import { cn } from '@/lib/cn';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';

const DO_HELP: HelpContent = {
  title: 'Task Execution',
  subtitle: 'Get things done',
  description: 'The Do tab is your workspace for executing tasks. Track work plans, manage deadlines, and submit completed work for review.',
  tips: [
    'Use Focus Mode to see your highest-priority tasks based on deadline and OKR health',
    'Start timers to track how long tasks take for better future estimates',
    'Submit work for review once you\'ve completed the quality checklist',
    'Flag blocked tasks immediately so your executive can help unblock them',
  ],
  quickActions: [
    { label: 'Focus Mode', description: 'See only your most urgent and important tasks' },
    { label: 'Submit Work', description: 'Mark a task as complete and send it for executive review' },
    { label: 'Track Time', description: 'Start a timer to record hours spent on each task' },
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

  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WorkPlan | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('focus');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Enhanced submission state (Deloitte/Accenture process excellence)
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

  // Calculate priority and enrich work plans
  const enrichWorkPlan = (plan: WorkPlan): PrioritizedPlan => {
    const today = new Date();
    const dueDate = new Date(plan.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Find linked OKR
    const linkedOKR = okrs.find(o => o.title === plan.linkedOKRTitle);
    const okrHealth = linkedOKR?.status || 'on-track';
    // Calculate OKR progress from objectives average
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

  const getFunctionColor = (func: BusinessFunction) => {
    switch (func) {
      case 'Marketing': return '#f59e0b';
      case 'Sales': return '#ec4899';
      case 'Engineering': return '#3b82f6';
      case 'Ops': return '#8b5cf6';
      case 'Finance': return '#10b981';
      case 'Admin': return '#64748b';
      default: return '#64748b';
    }
  };

  const handleSubmitWork = () => {
    if (!selectedPlan) return;

    // Calculate quality score based on checklist and confidence
    const checklistScore = Object.values(qualityChecklist).filter(Boolean).length * 20; // 0-80
    const confidenceBonus = confidenceLevel === 'high' ? 20 : confidenceLevel === 'medium' ? 10 : 0;
    const estimatedQuality = Math.min(100, checklistScore + confidenceBonus);

    // Update work plan with enhanced submission data
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

  // Filter and sort plans based on view mode and time filter
  const filterAndSortPlans = (plans: WorkPlan[]): PrioritizedPlan[] => {
    let enrichedPlans = plans.map(enrichWorkPlan);

    // Filter by view mode
    if (viewMode === 'focus') {
      enrichedPlans = enrichedPlans.filter(p => p.status !== 'completed' && p.priority !== 'low');
    } else if (viewMode === 'blocked') {
      enrichedPlans = enrichedPlans.filter(p => p.status === 'blocked');
    } else {
      enrichedPlans = enrichedPlans.filter(p => p.status !== 'completed');
    }

    // Filter by time
    if (timeFilter === 'today') {
      enrichedPlans = enrichedPlans.filter(p => p.daysUntilDue <= 1);
    } else if (timeFilter === 'week') {
      enrichedPlans = enrichedPlans.filter(p => p.daysUntilDue <= 7);
    }

    // Sort by priority then due date
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

  // Render work plan card
  const renderWorkPlanCard = (plan: PrioritizedPlan, showFunction = false) => {
    const isExpanded = expandedPlans.has(plan.id);
    const functionColor = getFunctionColor(plan.function);
    const statusStyle = getStatusColor(plan.status);
    const priorityStyle = getPriorityColor(plan.priority);
    const isTimerActive = activeTimer === plan.id;

    return (
      <View key={plan.id} className="mb-3">
        <Pressable
          onPress={() => togglePlan(plan.id)}
          className={cn(
            'rounded-2xl p-4 active:opacity-70 border',
            plan.status === 'blocked'
              ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
              : plan.priority === 'critical'
                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800'
          )}
        >
          {/* Top Row: Priority Badge + Function */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              {/* Priority Badge */}
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: priorityStyle.bg }}
              >
                <Text className="text-white text-xs font-bold">{priorityStyle.text}</Text>
              </View>

              {showFunction && (
                <View
                  className="px-2 py-0.5 rounded"
                  style={{ backgroundColor: functionColor + '20' }}
                >
                  <Text className="text-xs font-semibold" style={{ color: functionColor }}>
                    {plan.function}
                  </Text>
                </View>
              )}
            </View>

            {/* Due Date Badge */}
            <View className={cn(
              'flex-row items-center px-2 py-1 rounded-lg',
              plan.daysUntilDue <= 2 ? 'bg-red-100 dark:bg-red-900/30' :
              plan.daysUntilDue <= 7 ? 'bg-amber-100 dark:bg-amber-900/30' :
              'bg-gray-100 dark:bg-slate-800'
            )}>
              <CalendarClock size={12} color={plan.daysUntilDue <= 2 ? '#ef4444' : plan.daysUntilDue <= 7 ? '#f59e0b' : '#64748b'} />
              <Text className={cn(
                'text-xs font-semibold ml-1',
                plan.daysUntilDue <= 2 ? 'text-red-600 dark:text-red-400' :
                plan.daysUntilDue <= 7 ? 'text-amber-600 dark:text-amber-400' :
                'text-gray-600 dark:text-slate-400'
              )}>
                {plan.daysUntilDue <= 0 ? 'Overdue!' : plan.daysUntilDue === 1 ? 'Due Tomorrow' : `${plan.daysUntilDue}d left`}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="text-gray-900 dark:text-white font-bold text-base mb-2">
            {plan.title}
          </Text>

          {/* OKR Link with Impact Indicator */}
          <View className="flex-row items-center mb-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2">
            <Target size={14} color="#8b5cf6" />
            <View className="flex-1 ml-2">
              <Text className="text-purple-700 dark:text-purple-300 text-xs font-medium" numberOfLines={1}>
                {plan.linkedOKRTitle}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="flex-1 bg-purple-200 dark:bg-purple-800 rounded-full h-1.5 mr-2">
                  <View
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${plan.okrProgress}%` }}
                  />
                </View>
                <Text className="text-purple-600 dark:text-purple-400 text-xs font-semibold">
                  {plan.okrProgress}%
                </Text>
              </View>
            </View>
            <View className={cn(
              'w-2 h-2 rounded-full ml-2',
              plan.okrHealth === 'on-track' && 'bg-emerald-500',
              plan.okrHealth === 'at-risk' && 'bg-amber-500',
              plan.okrHealth === 'off-track' && 'bg-red-500'
            )} />
          </View>

          {/* Progress Bar */}
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-gray-500 dark:text-slate-400 text-xs">Progress</Text>
              <Text className="text-gray-900 dark:text-white font-bold text-sm">{plan.progress}%</Text>
            </View>
            <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
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

          {/* Quick Actions Row */}
          <View className="flex-row items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
            <View className={cn('px-2 py-1 rounded', statusStyle.bg)}>
              <Text className={cn('text-xs font-semibold', statusStyle.text)}>{getStatusText(plan.status)}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Timer Button */}
              <Pressable
                onPress={() => toggleTimer(plan.id)}
                className={cn(
                  'w-8 h-8 rounded-lg items-center justify-center',
                  isTimerActive ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-700'
                )}
              >
                {isTimerActive ? <Pause size={16} color="#fff" /> : <Play size={16} color="#64748b" />}
              </Pressable>

              {/* Blocked Toggle */}
              <Pressable
                onPress={() => handleToggleBlocked(plan)}
                className={cn(
                  'w-8 h-8 rounded-lg items-center justify-center',
                  plan.status === 'blocked' ? 'bg-red-500' : 'bg-gray-200 dark:bg-slate-700'
                )}
              >
                <AlertTriangle size={16} color={plan.status === 'blocked' ? '#fff' : '#64748b'} />
              </Pressable>

              {/* Expand */}
              {isExpanded ? (
                <ChevronDown size={20} color="#64748b" />
              ) : (
                <ChevronRight size={20} color="#64748b" />
              )}
            </View>
          </View>
        </Pressable>

        {/* Expanded Actions */}
        {isExpanded && (
          <View className="mt-2 ml-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
            <Text className="text-gray-700 dark:text-slate-300 text-sm mb-3">{plan.description}</Text>

            {/* Quick Progress Buttons */}
            <View className="mb-3">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-semibold mb-2">QUICK PROGRESS UPDATE</Text>
              <View className="flex-row gap-2">
                {[10, 25, 50].map((increment) => (
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

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  setSelectedPlan(plan);
                  setShowSubmitModal(true);
                }}
                className="flex-1 bg-purple-500 py-2.5 rounded-lg active:opacity-70 flex-row items-center justify-center"
              >
                <Send size={16} color="#fff" />
                <Text className="text-white text-center font-semibold text-sm ml-1.5">Submit Work</Text>
              </Pressable>
            </View>

            {/* Feedback Display */}
            {plan.feedback && (
              <View className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <View className="flex-row items-center mb-1">
                  <MessageSquare size={14} color="#3b82f6" />
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold ml-1">Feedback from {plan.assignedBy}</Text>
                </View>
                <Text className="text-blue-600 dark:text-blue-400 text-sm">{plan.feedback}</Text>
              </View>
            )}

            {/* Last Submission */}
            {plan.lastSubmittedAt && (
              <View className="mt-2 flex-row items-center">
                <Clock size={12} color="#64748b" />
                <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1">
                  Last submitted: {new Date(plan.lastSubmittedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render for Apprentices
  if (isApprentice) {
    const myWorkPlans = getApprenticeWorkPlans();
    const filteredPlans = filterAndSortPlans(myWorkPlans);
    const velocity = calculateVelocity(myWorkPlans);
    const blockedCount = myWorkPlans.filter(p => p.status === 'blocked').length;
    const criticalCount = filteredPlans.filter(p => p.priority === 'critical').length;

    return (
      <View className="flex-1 bg-gray-50 dark:bg-slate-950">
        {/* Help Modal */}
        <HelpModal
          visible={showHelp}
          onClose={() => setShowHelp(false)}
          content={DO_HELP}
          gradientColors={['#10b981', '#059669']}
        />

        {/* Header - Matching Home Tab Style */}
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white/70 text-xs font-medium">TASK EXECUTION</Text>
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
          {/* Quick Health Indicators */}
          <View className="flex-row gap-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-emerald-300" />
              <Text className="text-white/90 text-xs">{filteredPlans.length} active tasks</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-white" />
              <Text className="text-white/90 text-xs">{velocity.avgProgress}% avg progress</Text>
            </View>
          </View>
        </LinearGradient>

        {/* View Tabs - Below Header */}
        <View className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {[
              { value: 'focus', label: 'Focus Mode', icon: Flame },
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

        {/* Time Filter Pills */}
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
                  {filter === 'today' ? 'Due Today' : filter === 'week' ? 'This Week' : 'All Tasks'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView className="flex-1 px-5 py-4">
          {filteredPlans.length === 0 ? (
            <View className="items-center justify-center py-12 bg-white dark:bg-slate-900 rounded-xl">
              <CheckCircle2 size={48} color="#10b981" />
              <Text className="text-emerald-600 dark:text-emerald-400 text-center font-semibold text-lg mt-4">
                All Clear!
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-center mt-2">
                {viewMode === 'blocked' ? 'No blocked tasks' : 'No tasks matching your filters'}
              </Text>
            </View>
          ) : (
            <>
              {/* Critical Alert Banner */}
              {criticalCount > 0 && viewMode !== 'blocked' && (
                <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center">
                    <Flame size={20} color="#ef4444" />
                    <Text className="text-red-700 dark:text-red-300 font-bold ml-2">
                      {criticalCount} Critical Task{criticalCount > 1 ? 's' : ''} Need Attention
                    </Text>
                  </View>
                  <Text className="text-red-600 dark:text-red-400 text-sm mt-1">
                    These are overdue, blocked, or linked to off-track OKRs
                  </Text>
                </View>
              )}

              {filteredPlans.map((plan) => renderWorkPlanCard(plan, true))}
            </>
          )}

          <View className="h-8" />
        </ScrollView>

        {/* Submit Work Modal - Enhanced (Deloitte/Accenture Process Excellence) */}
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

                      {/* Time Tracking Section */}
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
                        <Text className="text-gray-500 dark:text-slate-500 text-xs mt-1">
                          Accurate time helps with future capacity planning
                        </Text>
                      </View>

                      {/* Quality Checklist Section */}
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
                        <View className="flex-row items-center mt-2">
                          <Text className="text-gray-500 dark:text-slate-500 text-xs">Quality score: </Text>
                          <Text className={cn(
                            'text-xs font-bold',
                            Object.values(qualityChecklist).filter(Boolean).length >= 3 ? 'text-emerald-600' :
                            Object.values(qualityChecklist).filter(Boolean).length >= 2 ? 'text-amber-600' : 'text-red-600'
                          )}>
                            {Object.values(qualityChecklist).filter(Boolean).length * 20 + (confidenceLevel === 'high' ? 20 : confidenceLevel === 'medium' ? 10 : 0)}/100
                          </Text>
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
                        <Text className="text-gray-500 dark:text-slate-500 text-xs mt-1">
                          How confident are you that this meets quality standards?
                        </Text>
                      </View>

                      {/* Blockers Encountered */}
                      <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                          <AlertTriangle size={16} color="#f59e0b" />
                          <Text className="text-gray-900 dark:text-white font-semibold ml-2">Blockers Encountered</Text>
                          <Text className="text-gray-500 dark:text-slate-500 text-xs ml-2">(optional)</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2 mb-2">
                          {['Unclear requirements', 'Missing resources', 'Technical issues', 'Waiting on others', 'Scope creep'].map((blocker) => (
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
                        <Text className="text-gray-500 dark:text-slate-500 text-xs">
                          This helps us improve processes for future work
                        </Text>
                      </View>

                      {/* Submission Notes */}
                      <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                          <MessageSquare size={16} color="#64748b" />
                          <Text className="text-gray-900 dark:text-white font-semibold ml-2">Summary Notes</Text>
                        </View>
                        <TextInput
                          className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[100px]"
                          value={submissionNotes}
                          onChangeText={setSubmissionNotes}
                          placeholder="What was completed? Any key decisions made? What should the reviewer know?"
                          placeholderTextColor="#94a3b8"
                          multiline
                          textAlignVertical="top"
                        />
                      </View>

                      {/* Submission Summary */}
                      <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                        <Text className="text-gray-900 dark:text-white font-semibold mb-2">Submission Summary</Text>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">Time logged:</Text>
                          <Text className="text-gray-900 dark:text-white font-medium text-sm">{hoursSpent || '0'} hours</Text>
                        </View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">Quality checks:</Text>
                          <Text className="text-gray-900 dark:text-white font-medium text-sm">
                            {Object.values(qualityChecklist).filter(Boolean).length}/4 passed
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">Confidence:</Text>
                          <Text className={cn(
                            'font-medium text-sm capitalize',
                            confidenceLevel === 'high' ? 'text-emerald-600' :
                            confidenceLevel === 'medium' ? 'text-amber-600' : 'text-red-600'
                          )}>
                            {confidenceLevel}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">Blockers reported:</Text>
                          <Text className="text-gray-900 dark:text-white font-medium text-sm">{blockersEncountered.length}</Text>
                        </View>
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

  // Render for Founders
  if (isFounder) {
    const allPlans = functions.flatMap(func => getFounderWorkPlansByFunction(func));
    const filteredFunctions = selectedFunction === 'all' ? functions : [selectedFunction];
    const velocity = calculateVelocity(allPlans);
    const blockedCount = allPlans.filter(p => p.status === 'blocked').length;
    const criticalPlans = allPlans.map(enrichWorkPlan).filter(p => p.priority === 'critical' && p.status !== 'completed');

    return (
      <View className="flex-1 bg-gray-50 dark:bg-slate-950">
        {/* Header - Matching Home Tab Style */}
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
          {/* Quick Health Indicators */}
          <View className="flex-row gap-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-violet-300" />
              <Text className="text-white/90 text-xs">{velocity.total - velocity.completed} active</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-emerald-400" />
              <Text className="text-white/90 text-xs">{velocity.completed} completed</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-white" />
              <Text className="text-white/90 text-xs">{velocity.avgProgress}% avg</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Function Filter - Below Header */}
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
            {functions.map((func) => {
              const funcPlans = getFounderWorkPlansByFunction(func);
              const funcBlocked = funcPlans.filter(p => p.status === 'blocked').length;
              return (
                <Pressable
                  key={func}
                  onPress={() => setSelectedFunction(func)}
                  className={`flex-row items-center px-4 py-2 rounded-full ${
                    selectedFunction === func ? 'bg-purple-500' : 'bg-gray-100 dark:bg-slate-800'
                  }`}
                >
                  <Text className={`text-sm font-semibold ${
                    selectedFunction === func ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                  }`}>
                    {func}
                  </Text>
                  {funcBlocked > 0 && (
                    <View className={`ml-1.5 px-1.5 py-0.5 rounded ${
                      selectedFunction === func ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <Text className={`text-xs font-bold ${
                        selectedFunction === func ? 'text-white' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {funcBlocked}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView className="flex-1 px-5 py-4">
          {/* Critical Alert */}
          {criticalPlans.length > 0 && (
            <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <AlertTriangle size={20} color="#ef4444" />
                <Text className="text-red-700 dark:text-red-300 font-bold ml-2">
                  {criticalPlans.length} Critical Work Plan{criticalPlans.length > 1 ? 's' : ''}
                </Text>
              </View>
              {criticalPlans.slice(0, 3).map((plan, idx) => (
                <View key={idx} className="flex-row items-center mt-1">
                  <View className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                  <Text className="text-red-600 dark:text-red-400 text-sm flex-1" numberOfLines={1}>
                    {plan.function}: {plan.title}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {filteredFunctions.map((func) => {
            const plansForFunction = getFounderWorkPlansByFunction(func).filter(p => p.status !== 'completed');
            if (plansForFunction.length === 0) return null;

            const functionColor = getFunctionColor(func);
            const enrichedPlans = plansForFunction.map(enrichWorkPlan).sort((a, b) => {
              const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            });

            return (
              <View key={func} className="mb-4">
                <View
                  className="px-3 py-2 rounded-lg mb-2 flex-row items-center justify-between"
                  style={{ backgroundColor: functionColor + '20' }}
                >
                  <Text className="font-bold text-base" style={{ color: functionColor }}>
                    {func}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm font-semibold mr-2" style={{ color: functionColor }}>
                      {enrichedPlans.length} active
                    </Text>
                    {enrichedPlans.some(p => p.status === 'blocked') && (
                      <View className="bg-red-500 rounded-full px-2 py-0.5">
                        <Text className="text-white text-xs font-bold">
                          {enrichedPlans.filter(p => p.status === 'blocked').length} blocked
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {enrichedPlans.map((plan) => renderWorkPlanCard(plan, false))}
              </View>
            );
          })}

          <View className="h-8" />
        </ScrollView>
      </View>
    );
  }

  // Render for Executives
  if (isExecutive) {
    const execFunction = (currentMembership?.function || 'Marketing') as BusinessFunction;
    const myWorkPlans = getExecutiveWorkPlans(execFunction);
    const filteredPlans = filterAndSortPlans(myWorkPlans);
    const velocity = calculateVelocity(myWorkPlans);
    const blockedCount = myWorkPlans.filter(p => p.status === 'blocked').length;
    const functionColor = getFunctionColor(execFunction);

    return (
      <View className="flex-1 bg-gray-50 dark:bg-slate-950">
        {/* Header - Matching Home Tab Style */}
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white/70 text-xs font-medium">{execFunction.toUpperCase()} EXECUTION</Text>
              <Text className="text-white text-xl font-bold">Do</Text>
            </View>
            {blockedCount > 0 && (
              <View className="bg-white/20 px-3 py-2 rounded-xl">
                <Text className="text-white/80 text-xs font-medium">BLOCKED</Text>
                <Text className="text-white text-lg font-bold">{blockedCount}</Text>
              </View>
            )}
          </View>
          {/* Quick Health Indicators */}
          <View className="flex-row gap-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-blue-300" />
              <Text className="text-white/90 text-xs">{velocity.total - velocity.completed} active</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-emerald-400" />
              <Text className="text-white/90 text-xs">{velocity.completed} completed</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1.5 bg-white" />
              <Text className="text-white/90 text-xs">{velocity.avgProgress}% avg</Text>
            </View>
          </View>
        </LinearGradient>

        {/* View Tabs - Below Header */}
        <View className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {[
              { value: 'focus', label: 'Focus Mode', icon: Flame },
              { value: 'all', label: 'All Tasks', icon: BarChart3 },
              { value: 'blocked', label: 'Blocked', icon: AlertTriangle, count: blockedCount },
            ].map((tab) => (
              <Pressable
                key={tab.value}
                onPress={() => setViewMode(tab.value as ViewMode)}
                className={`flex-row items-center px-4 py-2 rounded-full ${
                  viewMode === tab.value ? 'bg-blue-500' : 'bg-gray-100 dark:bg-slate-800'
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

        <ScrollView className="flex-1 px-5 py-4">
          {filteredPlans.length === 0 ? (
            <View className="items-center justify-center py-12 bg-white dark:bg-slate-900 rounded-xl">
              <CheckCircle2 size={48} color="#10b981" />
              <Text className="text-emerald-600 dark:text-emerald-400 text-center font-semibold text-lg mt-4">
                All Clear!
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-center mt-2">
                {viewMode === 'blocked' ? 'No blocked tasks' : 'No tasks matching your filters'}
              </Text>
            </View>
          ) : (
            filteredPlans.map((plan) => renderWorkPlanCard(plan, false))
          )}

          <View className="h-8" />
        </ScrollView>
      </View>
    );
  }

  return null;
}
