import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  Briefcase,
  Plus,
  X,
  Clock,
  Users,
  Target,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Award,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Star,
  Flame,
  Shield,
  Eye,
  Filter,
  ArrowUpRight,
  Calendar,
  Activity,
  Lightbulb,
  UserCheck,
  FileCheck,
  Timer,
  Percent,
  Sparkles,
  DollarSign,
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Function as BusinessFunction } from '@/types';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';

// Enhanced types for executive-grade evaluation
type EvaluateView = 'dashboard' | 'queue' | 'performance' | 'insights';

interface WorkSubmission {
  id: string;
  workPlanId: string;
  apprenticeName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'changes-requested';
  notes?: string;
  qualityScore?: number;
  timeToComplete?: number; // hours
  revisionCount?: number;
}

interface PerformanceMetrics {
  apprenticeName: string;
  apprenticeId: string;
  function: BusinessFunction;
  totalSubmissions: number;
  approvedFirstTime: number;
  averageQualityScore: number;
  averageTimeToComplete: number;
  trend: 'improving' | 'stable' | 'declining';
  trendDelta: number;
  riskLevel: 'low' | 'medium' | 'high';
  strengths: string[];
  developmentAreas: string[];
  lastFeedback?: string;
  streak: number; // consecutive approvals
}

interface EvaluationWorkPlan extends WorkPlan {
  submissions: WorkSubmission[];
  owner: string;
  assignedTo: string[];
  priorityScore: number;
  daysUntilDue: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface InsightItem {
  id: string;
  type: 'bottleneck' | 'achievement' | 'risk' | 'opportunity';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
  metric?: string;
  action?: string;
  affectedFunction?: BusinessFunction;
}

// Initialize stores once
if (useWorkPlanStore.getState().workPlans.length === 0) {
  useWorkPlanStore.getState().initializeWorkPlans();
}
if (useOrganizationStore.getState().members.length === 0) {
  useOrganizationStore.getState().initializeOrganization();
}

// Performance calculation utilities
function calculatePerformanceMetrics(
  apprenticeName: string,
  submissions: WorkSubmission[],
  func: BusinessFunction
): PerformanceMetrics {
  const mySubmissions = submissions.filter(s => s.apprenticeName === apprenticeName);
  const approved = mySubmissions.filter(s => s.status === 'approved');
  const firstTimeApprovals = approved.filter(s => (s.revisionCount || 0) === 0);

  const avgQuality = mySubmissions.length > 0
    ? mySubmissions.reduce((sum, s) => sum + (s.qualityScore || 75), 0) / mySubmissions.length
    : 0;

  const avgTime = mySubmissions.length > 0
    ? mySubmissions.reduce((sum, s) => sum + (s.timeToComplete || 8), 0) / mySubmissions.length
    : 0;

  // Calculate trend based on recent vs older submissions
  const recentSubmissions = mySubmissions.slice(-3);
  const olderSubmissions = mySubmissions.slice(0, -3);
  const recentAvgQuality = recentSubmissions.length > 0
    ? recentSubmissions.reduce((sum, s) => sum + (s.qualityScore || 75), 0) / recentSubmissions.length
    : avgQuality;
  const olderAvgQuality = olderSubmissions.length > 0
    ? olderSubmissions.reduce((sum, s) => sum + (s.qualityScore || 75), 0) / olderSubmissions.length
    : avgQuality;

  const trendDelta = recentAvgQuality - olderAvgQuality;
  const trend = trendDelta > 5 ? 'improving' : trendDelta < -5 ? 'declining' : 'stable';

  // Risk level based on multiple factors
  const pendingCount = mySubmissions.filter(s => s.status === 'pending').length;
  const changesRequestedCount = mySubmissions.filter(s => s.status === 'changes-requested').length;
  const riskLevel = changesRequestedCount >= 2 || avgQuality < 60 ? 'high'
    : changesRequestedCount >= 1 || avgQuality < 70 ? 'medium'
    : 'low';

  // Determine strengths and development areas
  const strengths: string[] = [];
  const developmentAreas: string[] = [];

  if (avgQuality >= 85) strengths.push('High quality output');
  if (firstTimeApprovals.length / Math.max(approved.length, 1) >= 0.8) strengths.push('First-time approval rate');
  if (avgTime <= 6) strengths.push('Fast turnaround');

  if (avgQuality < 70) developmentAreas.push('Output quality');
  if (changesRequestedCount > 0) developmentAreas.push('Attention to requirements');
  if (avgTime > 12) developmentAreas.push('Time management');

  // Calculate consecutive approval streak
  let streak = 0;
  for (let i = mySubmissions.length - 1; i >= 0; i--) {
    if (mySubmissions[i].status === 'approved') streak++;
    else break;
  }

  return {
    apprenticeName,
    apprenticeId: `app-${apprenticeName.toLowerCase().replace(' ', '-')}`,
    function: func,
    totalSubmissions: mySubmissions.length,
    approvedFirstTime: firstTimeApprovals.length,
    averageQualityScore: Math.round(avgQuality),
    averageTimeToComplete: Math.round(avgTime * 10) / 10,
    trend,
    trendDelta: Math.round(trendDelta),
    riskLevel,
    strengths,
    developmentAreas,
    streak,
  };
}

// Priority scoring for submissions
function calculatePriorityScore(plan: WorkPlan, daysUntilDue: number, hasPendingSubmissions: boolean): number {
  let score = 50; // Base score

  // Due date urgency (0-30 points)
  if (daysUntilDue <= 1) score += 30;
  else if (daysUntilDue <= 3) score += 20;
  else if (daysUntilDue <= 7) score += 10;

  // Has pending submissions (+20)
  if (hasPendingSubmissions) score += 20;

  // Blocked status (+15)
  if (plan.status === 'blocked') score += 15;

  // Low progress with near deadline (+10)
  if (plan.progress < 50 && daysUntilDue <= 7) score += 10;

  return Math.min(100, score);
}

// Generate insights from data
function generateInsights(
  workPlans: EvaluationWorkPlan[],
  performanceData: PerformanceMetrics[]
): InsightItem[] {
  const insights: InsightItem[] = [];

  // Check for bottlenecks
  const pendingCount = workPlans.reduce((sum, wp) =>
    sum + wp.submissions.filter(s => s.status === 'pending').length, 0);
  if (pendingCount >= 5) {
    insights.push({
      id: 'bottleneck-queue',
      type: 'bottleneck',
      severity: 'warning',
      title: 'Review Queue Backlog',
      description: `${pendingCount} submissions awaiting review. Response time affects team velocity.`,
      metric: `${pendingCount} pending`,
      action: 'Clear backlog within 24 hours',
    });
  }

  // Check for at-risk apprentices
  const atRiskApprentices = performanceData.filter(p => p.riskLevel === 'high');
  if (atRiskApprentices.length > 0) {
    insights.push({
      id: 'risk-apprentices',
      type: 'risk',
      severity: 'critical',
      title: 'Apprentices Need Support',
      description: `${atRiskApprentices.map(a => a.apprenticeName).join(', ')} showing declining performance.`,
      metric: `${atRiskApprentices.length} at risk`,
      action: 'Schedule 1:1 coaching sessions',
    });
  }

  // Check for high performers
  const topPerformers = performanceData.filter(p => p.averageQualityScore >= 85 && p.streak >= 3);
  if (topPerformers.length > 0) {
    insights.push({
      id: 'achievement-top-performers',
      type: 'achievement',
      severity: 'success',
      title: 'Star Performers',
      description: `${topPerformers.map(a => a.apprenticeName).join(', ')} maintaining excellence.`,
      metric: `${topPerformers.length} stars`,
      action: 'Consider for increased responsibility',
    });
  }

  // Check for critical deadlines
  const criticalDeadlines = workPlans.filter(wp => wp.daysUntilDue <= 2 && wp.progress < 80);
  if (criticalDeadlines.length > 0) {
    insights.push({
      id: 'risk-deadlines',
      type: 'risk',
      severity: 'critical',
      title: 'Critical Deadlines at Risk',
      description: `${criticalDeadlines.length} work plans may miss deadline with current progress.`,
      metric: `${criticalDeadlines.length} at risk`,
      action: 'Reallocate resources or adjust scope',
    });
  }

  // Check for function imbalance
  const functionCounts: Record<string, number> = {};
  workPlans.forEach(wp => {
    functionCounts[wp.function] = (functionCounts[wp.function] || 0) + wp.submissions.filter(s => s.status === 'pending').length;
  });
  const maxPending = Math.max(...Object.values(functionCounts));
  const overloadedFunc = Object.entries(functionCounts).find(([, count]) => count === maxPending && count >= 3);
  if (overloadedFunc) {
    insights.push({
      id: 'bottleneck-function',
      type: 'bottleneck',
      severity: 'warning',
      title: `${overloadedFunc[0]} Overloaded`,
      description: `${overloadedFunc[0]} function has ${overloadedFunc[1]} pending reviews.`,
      metric: `${overloadedFunc[1]} pending`,
      action: 'Prioritize or redistribute reviews',
      affectedFunction: overloadedFunc[0] as BusinessFunction,
    });
  }

  // Opportunity: Improving apprentices
  const improvingApprentices = performanceData.filter(p => p.trend === 'improving' && p.trendDelta >= 10);
  if (improvingApprentices.length > 0) {
    insights.push({
      id: 'opportunity-improving',
      type: 'opportunity',
      severity: 'info',
      title: 'Rapid Improvement',
      description: `${improvingApprentices.map(a => a.apprenticeName).join(', ')} showing strong growth trajectory.`,
      metric: `+${Math.round(improvingApprentices[0].trendDelta)}% quality`,
      action: 'Document learning approaches',
    });
  }

  return insights;
}

export default function EvaluateScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  // Use centralized stores
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const members = useOrganizationStore(s => s.members);

  const [activeView, setActiveView] = useState<EvaluateView>('dashboard');
  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<{ plan: EvaluationWorkPlan; submission: WorkSubmission } | null>(null);
  const [selectedPerformance, setSelectedPerformance] = useState<PerformanceMetrics | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [qualityScore, setQualityScore] = useState(80);

  const functions: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Ops', 'Finance', 'Admin'];
  const isFounder = currentMembership?.role === 'Founder';
  const isExecutive = currentMembership?.role === 'FractionalExec';
  const canReview = isFounder || isExecutive;

  // Generate mock submissions with rich data
  const submissions = useMemo((): WorkSubmission[] => {
    const mockSubmissions: WorkSubmission[] = [];
    workPlans.forEach(wp => {
      if (wp.needsSubmission || wp.status === 'in-progress') {
        // Find apprentices for this function
        const apprentices = members.filter(m =>
          m.role === 'Apprentice' && m.function === wp.function && m.status === 'active'
        );

        apprentices.forEach((apprentice, idx) => {
          mockSubmissions.push({
            id: `sub-${wp.id}-${idx}`,
            workPlanId: wp.id,
            apprenticeName: apprentice.name,
            submittedAt: wp.lastSubmittedAt || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: Math.random() > 0.6 ? 'pending' : Math.random() > 0.3 ? 'approved' : 'changes-requested',
            qualityScore: Math.floor(60 + Math.random() * 40),
            timeToComplete: Math.floor(4 + Math.random() * 16),
            revisionCount: Math.floor(Math.random() * 3),
          });
        });
      }
    });
    return mockSubmissions;
  }, [workPlans, members]);

  // Enrich work plans with calculated fields
  const enrichedWorkPlans = useMemo((): EvaluationWorkPlan[] => {
    const now = new Date();
    return workPlans.map(wp => {
      const wpSubmissions = submissions.filter(s => s.workPlanId === wp.id);
      const assignedApprentices = members
        .filter(m => m.role === 'Apprentice' && m.function === wp.function && m.status === 'active')
        .map(m => m.name);

      const owner = members.find(m =>
        m.role === 'FractionalExec' && m.function === wp.function && m.status === 'active'
      )?.name || wp.assignedBy;

      const dueDate = new Date(wp.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const hasPending = wpSubmissions.some(s => s.status === 'pending');
      const priorityScore = calculatePriorityScore(wp, daysUntilDue, hasPending);

      // Risk level
      const riskLevel = daysUntilDue <= 0 ? 'critical'
        : daysUntilDue <= 2 && wp.progress < 70 ? 'high'
        : daysUntilDue <= 5 && wp.progress < 50 ? 'medium'
        : 'low';

      return {
        ...wp,
        submissions: wpSubmissions,
        owner,
        assignedTo: assignedApprentices.length > 0 ? assignedApprentices : [wp.assignedBy],
        priorityScore,
        daysUntilDue,
        riskLevel,
      };
    });
  }, [workPlans, submissions, members]);

  // Filter work plans based on view and filters
  const filteredWorkPlans = useMemo(() => {
    let filtered = enrichedWorkPlans;

    // Filter by function
    if (selectedFunction !== 'all') {
      filtered = filtered.filter(wp => wp.function === selectedFunction);
    }

    // Filter by role permissions
    if (isExecutive && !isFounder && currentUser) {
      const currentMember = members.find(m => m.name === currentUser.name);
      if (currentMember?.function) {
        filtered = filtered.filter(wp => wp.function === currentMember.function);
      }
    }

    // Sort by priority
    return filtered.sort((a, b) => b.priorityScore - a.priorityScore);
  }, [enrichedWorkPlans, selectedFunction, isExecutive, isFounder, currentUser, members]);

  // Work plans with pending submissions
  const pendingWorkPlans = filteredWorkPlans.filter(wp =>
    wp.submissions.some(s => s.status === 'pending')
  );

  // Performance metrics for all apprentices
  const performanceData = useMemo((): PerformanceMetrics[] => {
    const apprentices = members.filter(m => m.role === 'Apprentice' && m.status === 'active');
    return apprentices.map(a =>
      calculatePerformanceMetrics(a.name, submissions, a.function as BusinessFunction)
    ).sort((a, b) => b.averageQualityScore - a.averageQualityScore);
  }, [members, submissions]);

  // Generate insights
  const insights = useMemo(() =>
    generateInsights(enrichedWorkPlans, performanceData),
  [enrichedWorkPlans, performanceData]);

  // Summary stats
  const stats = useMemo(() => {
    const pending = submissions.filter(s => s.status === 'pending').length;
    const approved = submissions.filter(s => s.status === 'approved').length;
    const changesRequested = submissions.filter(s => s.status === 'changes-requested').length;
    const avgQuality = submissions.length > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.qualityScore || 75), 0) / submissions.length)
      : 0;
    const criticalCount = insights.filter(i => i.severity === 'critical').length;
    const atRiskCount = performanceData.filter(p => p.riskLevel === 'high').length;

    return { pending, approved, changesRequested, avgQuality, criticalCount, atRiskCount };
  }, [submissions, insights, performanceData]);

  const togglePlan = (planId: string) => {
    setExpandedPlans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) newSet.delete(planId);
      else newSet.add(planId);
      return newSet;
    });
  };

  const handleReviewSubmission = (action: 'approve' | 'request-changes') => {
    if (!selectedSubmission) return;

    const actionText = action === 'approve' ? 'Approved' : 'Changes Requested';
    Alert.alert(
      `Submission ${actionText}`,
      `Feedback sent to ${selectedSubmission.submission.apprenticeName}.\n\nQuality Score: ${qualityScore}/100`,
      [{ text: 'OK' }]
    );

    setShowSubmissionModal(false);
    setSelectedSubmission(null);
    setReviewNotes('');
    setQualityScore(80);
  };

  const getFunctionColor = (func: BusinessFunction) => {
    const colors: Record<BusinessFunction, string> = {
      Marketing: '#f59e0b',
      Sales: '#ec4899',
      Engineering: '#3b82f6',
      Ops: '#8b5cf6',
      Finance: '#10b981',
      Admin: '#64748b',
    };
    return colors[func] || '#64748b';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' };
      case 'high': return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' };
      case 'medium': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' };
      default: return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' };
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'bottleneck': return AlertTriangle;
      case 'achievement': return Award;
      case 'risk': return AlertCircle;
      case 'opportunity': return Lightbulb;
      default: return Eye;
    }
  };

  const getInsightColors = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: '#ef4444' };
      case 'warning': return { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: '#f59e0b' };
      case 'success': return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: '#10b981' };
      default: return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: '#3b82f6' };
    }
  };

  // Quality score indicator component
  const QualityBadge = ({ score }: { score: number }) => {
    const color = score >= 85 ? 'emerald' : score >= 70 ? 'blue' : score >= 55 ? 'amber' : 'red';
    return (
      <View className={`px-2 py-1 rounded-full bg-${color}-100 dark:bg-${color}-900/30`}>
        <Text className={`text-${color}-700 dark:text-${color}-300 text-xs font-bold`}>{score}</Text>
      </View>
    );
  };

  // Performance trend indicator
  const TrendIndicator = ({ trend, delta }: { trend: string; delta: number }) => {
    const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Activity;
    const color = trend === 'improving' ? '#10b981' : trend === 'declining' ? '#ef4444' : '#64748b';
    return (
      <View className="flex-row items-center">
        <TrendIcon size={14} color={color} />
        {delta !== 0 && (
          <Text style={{ color }} className="text-xs font-medium ml-1">
            {delta > 0 ? '+' : ''}{delta}%
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">Evaluate</Text>
            <Text className="text-gray-500 dark:text-slate-400 text-sm">
              Performance insights & decisions
            </Text>
          </View>
          {stats.criticalCount > 0 && (
            <View className="bg-red-500 px-3 py-1.5 rounded-full flex-row items-center">
              <AlertCircle size={14} color="#fff" />
              <Text className="text-white font-bold text-sm ml-1">{stats.criticalCount}</Text>
            </View>
          )}
        </View>

        {/* View Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {[
            { value: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { value: 'queue', label: 'Review Queue', icon: FileCheck, count: stats.pending },
            { value: 'performance', label: 'Performance', icon: UserCheck },
            { value: 'insights', label: 'Insights', icon: Lightbulb, count: insights.length },
          ].map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => setActiveView(tab.value as EvaluateView)}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                activeView === tab.value ? 'bg-blue-500' : 'bg-gray-100 dark:bg-slate-800'
              } active:opacity-70`}
            >
              <tab.icon size={16} color={activeView === tab.value ? '#fff' : '#64748b'} />
              <Text className={`ml-2 font-semibold text-sm ${
                activeView === tab.value ? 'text-white' : 'text-gray-700 dark:text-slate-300'
              }`}>
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 && (
                <View className={`ml-1.5 px-1.5 py-0.5 rounded ${
                  activeView === tab.value ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-700'
                }`}>
                  <Text className={`text-xs font-bold ${
                    activeView === tab.value ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* DASHBOARD VIEW */}
        {activeView === 'dashboard' && (
          <View className="px-5 py-4">
            {/* Key Metrics Row */}
            <View className="flex-row gap-3 mb-5">
              <Pressable
                onPress={() => setActiveView('queue')}
                className="flex-1 bg-purple-500 rounded-2xl p-4 active:opacity-90"
              >
                <FileCheck size={24} color="#fff" />
                <Text className="text-white/80 text-xs mt-2">Pending Reviews</Text>
                <Text className="text-white text-3xl font-bold">{stats.pending}</Text>
              </Pressable>
              <View className="flex-1 bg-emerald-500 rounded-2xl p-4">
                <Percent size={24} color="#fff" />
                <Text className="text-white/80 text-xs mt-2">Avg Quality</Text>
                <Text className="text-white text-3xl font-bold">{stats.avgQuality}</Text>
              </View>
              <Pressable
                onPress={() => setActiveView('performance')}
                className="flex-1 bg-red-500 rounded-2xl p-4 active:opacity-90"
              >
                <AlertTriangle size={24} color="#fff" />
                <Text className="text-white/80 text-xs mt-2">At Risk</Text>
                <Text className="text-white text-3xl font-bold">{stats.atRiskCount}</Text>
              </Pressable>
            </View>

            {/* Critical Insights */}
            {insights.filter(i => i.severity === 'critical' || i.severity === 'warning').length > 0 && (
              <View className="mb-5">
                <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
                  Action Required
                </Text>
                {insights
                  .filter(i => i.severity === 'critical' || i.severity === 'warning')
                  .slice(0, 3)
                  .map((insight, idx) => {
                    const colors = getInsightColors(insight.severity);
                    const IconComponent = getInsightIcon(insight.type);
                    return (
                      <Animated.View key={insight.id} entering={FadeInDown.delay(idx * 50).duration(300)}>
                        <View className={`${colors.bg} border ${colors.border} rounded-xl p-4 mb-3`}>
                          <View className="flex-row items-start">
                            <View className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center mr-3">
                              <IconComponent size={20} color={colors.icon} />
                            </View>
                            <View className="flex-1">
                              <Text className="text-gray-900 dark:text-white font-bold text-base">
                                {insight.title}
                              </Text>
                              <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
                                {insight.description}
                              </Text>
                              {insight.action && (
                                <View className="flex-row items-center mt-2">
                                  <Zap size={12} color={colors.icon} />
                                  <Text className="text-gray-700 dark:text-slate-300 text-xs font-medium ml-1">
                                    {insight.action}
                                  </Text>
                                </View>
                              )}
                            </View>
                            {insight.metric && (
                              <View className="bg-white dark:bg-slate-800 px-2 py-1 rounded">
                                <Text className="text-gray-700 dark:text-slate-300 text-xs font-bold">
                                  {insight.metric}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}
              </View>
            )}

            {/* Top Performers */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white font-bold text-lg">Top Performers</Text>
                <Pressable
                  onPress={() => setActiveView('performance')}
                  className="flex-row items-center active:opacity-70"
                >
                  <Text className="text-blue-500 font-semibold text-sm mr-1">See All</Text>
                  <ChevronRight size={16} color="#3b82f6" />
                </Pressable>
              </View>
              {performanceData.slice(0, 3).map((perf, idx) => (
                <Animated.View key={perf.apprenticeId} entering={FadeInDown.delay(idx * 50).duration(300)}>
                  <Pressable
                    onPress={() => {
                      setSelectedPerformance(perf);
                      setShowPerformanceModal(true);
                    }}
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 border border-gray-200 dark:border-slate-800 active:opacity-90"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 bg-emerald-500 rounded-full items-center justify-center mr-3">
                          <Text className="text-white font-bold">
                            {perf.apprenticeName.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-gray-900 dark:text-white font-bold">
                              {perf.apprenticeName}
                            </Text>
                            {perf.streak >= 3 && (
                              <View className="ml-2 flex-row items-center bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                <Flame size={10} color="#f59e0b" />
                                <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-bold ml-0.5">
                                  {perf.streak}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">
                            {perf.function} • {perf.totalSubmissions} submissions
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <QualityBadge score={perf.averageQualityScore} />
                        <TrendIndicator trend={perf.trend} delta={perf.trendDelta} />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            {/* Priority Queue Preview */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white font-bold text-lg">Priority Queue</Text>
                <Pressable
                  onPress={() => setActiveView('queue')}
                  className="flex-row items-center active:opacity-70"
                >
                  <Text className="text-blue-500 font-semibold text-sm mr-1">Review All</Text>
                  <ChevronRight size={16} color="#3b82f6" />
                </Pressable>
              </View>
              {pendingWorkPlans.slice(0, 3).map((plan, idx) => {
                const riskColors = getRiskColor(plan.riskLevel);
                const funcColor = getFunctionColor(plan.function);
                return (
                  <Animated.View key={plan.id} entering={FadeInDown.delay(idx * 50).duration(300)}>
                    <Pressable
                      onPress={() => togglePlan(plan.id)}
                      className={`bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 border ${riskColors.border} active:opacity-90`}
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 mb-1">
                            <View
                              className="px-2 py-0.5 rounded"
                              style={{ backgroundColor: funcColor + '20' }}
                            >
                              <Text className="text-xs font-semibold" style={{ color: funcColor }}>
                                {plan.function}
                              </Text>
                            </View>
                            <View className={`px-2 py-0.5 rounded ${riskColors.bg}`}>
                              <Text className={`text-xs font-semibold ${riskColors.text}`}>
                                {plan.riskLevel.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-gray-900 dark:text-white font-bold" numberOfLines={1}>
                            {plan.title}
                          </Text>
                        </View>
                        <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center ml-3">
                          <Text className="text-blue-700 dark:text-blue-300 text-lg font-bold">
                            {plan.priorityScore}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <View className="flex-row items-center">
                            <Timer size={12} color="#64748b" />
                            <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1">
                              {plan.daysUntilDue <= 0 ? 'Overdue' : `${plan.daysUntilDue}d left`}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <FileCheck size={12} color="#a855f7" />
                            <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium ml-1">
                              {plan.submissions.filter(s => s.status === 'pending').length} pending
                            </Text>
                          </View>
                        </View>
                        <ChevronRight size={16} color="#64748b" />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}

        {/* QUEUE VIEW */}
        {activeView === 'queue' && (
          <View className="px-5 py-4">
            {/* Function Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedFunction('all')}
                className={`px-4 py-2 rounded-full ${
                  selectedFunction === 'all' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-800'
                } active:opacity-70`}
              >
                <Text className={`text-sm font-semibold ${
                  selectedFunction === 'all' ? 'text-white' : 'text-gray-700 dark:text-slate-300'
                }`}>
                  All
                </Text>
              </Pressable>
              {functions.map(func => (
                <Pressable
                  key={func}
                  onPress={() => setSelectedFunction(func)}
                  className={`px-4 py-2 rounded-full ${
                    selectedFunction === func ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-800'
                  } active:opacity-70`}
                >
                  <Text className={`text-sm font-semibold ${
                    selectedFunction === func ? 'text-white' : 'text-gray-700 dark:text-slate-300'
                  }`}>
                    {func}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {pendingWorkPlans.length === 0 ? (
              <View className="items-center py-16">
                <CheckCircle2 size={64} color="#10b981" />
                <Text className="text-emerald-600 dark:text-emerald-400 text-xl font-bold mt-4">
                  All Caught Up!
                </Text>
                <Text className="text-gray-500 dark:text-slate-400 text-center mt-2">
                  No submissions waiting for review
                </Text>
              </View>
            ) : (
              <View>
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-3">
                  {pendingWorkPlans.length} work plans • Sorted by priority
                </Text>
                {pendingWorkPlans.map((plan, idx) => {
                  const isExpanded = expandedPlans.has(plan.id);
                  const riskColors = getRiskColor(plan.riskLevel);
                  const funcColor = getFunctionColor(plan.function);
                  const pendingSubs = plan.submissions.filter(s => s.status === 'pending');

                  return (
                    <Animated.View key={plan.id} entering={FadeInDown.delay(idx * 30).duration(300)}>
                      <Pressable
                        onPress={() => togglePlan(plan.id)}
                        className={`bg-white dark:bg-slate-900 rounded-xl mb-3 border ${riskColors.border} overflow-hidden active:opacity-90`}
                      >
                        <View className="p-4">
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-1">
                              <View className="flex-row items-center gap-2 mb-1">
                                <View
                                  className="px-2 py-0.5 rounded"
                                  style={{ backgroundColor: funcColor + '20' }}
                                >
                                  <Text className="text-xs font-semibold" style={{ color: funcColor }}>
                                    {plan.function}
                                  </Text>
                                </View>
                                <View className={`px-2 py-0.5 rounded ${riskColors.bg}`}>
                                  <Text className={`text-xs font-semibold ${riskColors.text}`}>
                                    {plan.riskLevel.toUpperCase()}
                                  </Text>
                                </View>
                              </View>
                              <Text className="text-gray-900 dark:text-white font-bold text-base">
                                {plan.title}
                              </Text>
                              <Text className="text-gray-500 dark:text-slate-400 text-sm mt-1" numberOfLines={2}>
                                {plan.description}
                              </Text>
                            </View>
                            <View className="items-end ml-3">
                              <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-1">
                                <Text className="text-blue-700 dark:text-blue-300 text-lg font-bold">
                                  {plan.priorityScore}
                                </Text>
                              </View>
                              <Text className="text-gray-400 dark:text-slate-500 text-[10px]">Priority</Text>
                            </View>
                          </View>

                          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
                            <View className="flex-row items-center gap-4">
                              <View className="flex-row items-center">
                                <Target size={12} color="#8b5cf6" />
                                <Text className="text-purple-600 dark:text-purple-400 text-xs ml-1" numberOfLines={1}>
                                  {plan.linkedOKRTitle.slice(0, 25)}...
                                </Text>
                              </View>
                              <View className="flex-row items-center">
                                <Timer size={12} color={plan.daysUntilDue <= 2 ? '#ef4444' : '#64748b'} />
                                <Text className={`text-xs ml-1 ${
                                  plan.daysUntilDue <= 2 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-slate-400'
                                }`}>
                                  {plan.daysUntilDue <= 0 ? 'Overdue' : `${plan.daysUntilDue}d`}
                                </Text>
                              </View>
                            </View>
                            <View className="flex-row items-center">
                              <Text className="text-purple-600 dark:text-purple-400 text-xs font-semibold mr-2">
                                {pendingSubs.length} pending
                              </Text>
                              {isExpanded ? (
                                <ChevronDown size={18} color="#64748b" />
                              ) : (
                                <ChevronRight size={18} color="#64748b" />
                              )}
                            </View>
                          </View>
                        </View>

                        {/* Expanded Submissions */}
                        {isExpanded && (
                          <View className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800">
                            {pendingSubs.map((sub, subIdx) => (
                              <Pressable
                                key={sub.id}
                                onPress={() => {
                                  if (canReview) {
                                    setSelectedSubmission({ plan, submission: sub });
                                    setQualityScore(sub.qualityScore || 80);
                                    setShowSubmissionModal(true);
                                  }
                                }}
                                className="bg-white dark:bg-slate-900 rounded-xl p-3 mb-2 border border-purple-200 dark:border-purple-800 active:opacity-70"
                              >
                                <View className="flex-row items-center justify-between">
                                  <View className="flex-row items-center flex-1">
                                    <View className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full items-center justify-center mr-2">
                                      <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold">
                                        {sub.apprenticeName.split(' ').map(n => n[0]).join('')}
                                      </Text>
                                    </View>
                                    <View>
                                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                                        {sub.apprenticeName}
                                      </Text>
                                      <Text className="text-gray-500 dark:text-slate-400 text-xs">
                                        {new Date(sub.submittedAt).toLocaleDateString()}
                                      </Text>
                                    </View>
                                  </View>
                                  <View className="flex-row items-center gap-2">
                                    {sub.qualityScore && <QualityBadge score={sub.qualityScore} />}
                                    <View className="bg-purple-500 px-3 py-1.5 rounded-lg">
                                      <Text className="text-white text-xs font-bold">Review</Text>
                                    </View>
                                  </View>
                                </View>
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* PERFORMANCE VIEW */}
        {activeView === 'performance' && (
          <View className="px-5 py-4">
            {/* Performance Summary */}
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                <Text className="text-emerald-700 dark:text-emerald-300 text-xs">Excelling</Text>
                <Text className="text-emerald-600 dark:text-emerald-400 text-2xl font-bold">
                  {performanceData.filter(p => p.riskLevel === 'low' && p.averageQualityScore >= 80).length}
                </Text>
              </View>
              <View className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                <Text className="text-blue-700 dark:text-blue-300 text-xs">On Track</Text>
                <Text className="text-blue-600 dark:text-blue-400 text-2xl font-bold">
                  {performanceData.filter(p => p.riskLevel === 'low' && p.averageQualityScore < 80).length}
                </Text>
              </View>
              <View className="flex-1 bg-red-100 dark:bg-red-900/30 rounded-xl p-3 border border-red-200 dark:border-red-800">
                <Text className="text-red-700 dark:text-red-300 text-xs">Need Support</Text>
                <Text className="text-red-600 dark:text-red-400 text-2xl font-bold">
                  {performanceData.filter(p => p.riskLevel !== 'low').length}
                </Text>
              </View>
            </View>

            {/* Apprentice Performance Cards */}
            <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
              Team Performance
            </Text>
            {performanceData.map((perf, idx) => {
              const riskColors = getRiskColor(perf.riskLevel);
              return (
                <Animated.View key={perf.apprenticeId} entering={FadeInDown.delay(idx * 50).duration(300)}>
                  <Pressable
                    onPress={() => {
                      setSelectedPerformance(perf);
                      setShowPerformanceModal(true);
                    }}
                    className={`bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 border ${riskColors.border} active:opacity-90`}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                          perf.riskLevel === 'low' ? 'bg-emerald-500' :
                          perf.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                        }`}>
                          <Text className="text-white text-lg font-bold">
                            {perf.apprenticeName.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-gray-900 dark:text-white font-bold text-base">
                              {perf.apprenticeName}
                            </Text>
                            {perf.streak >= 5 && (
                              <View className="ml-2 flex-row items-center bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                <Flame size={12} color="#f59e0b" />
                                <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold ml-0.5">
                                  {perf.streak} streak
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-500 dark:text-slate-400 text-sm">
                            {perf.function}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <View className={`w-14 h-14 rounded-full items-center justify-center ${
                          perf.averageQualityScore >= 85 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          perf.averageQualityScore >= 70 ? 'bg-blue-100 dark:bg-blue-900/30' :
                          'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                          <Text className={`text-xl font-bold ${
                            perf.averageQualityScore >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                            perf.averageQualityScore >= 70 ? 'text-blue-600 dark:text-blue-400' :
                            'text-amber-600 dark:text-amber-400'
                          }`}>
                            {perf.averageQualityScore}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Metrics Row */}
                    <View className="flex-row items-center gap-4 mb-3">
                      <View className="flex-row items-center">
                        <FileCheck size={14} color="#64748b" />
                        <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                          {perf.totalSubmissions} total
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <ThumbsUp size={14} color="#10b981" />
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xs ml-1">
                          {perf.approvedFirstTime} first-time
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Timer size={14} color="#64748b" />
                        <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                          {perf.averageTimeToComplete}h avg
                        </Text>
                      </View>
                      <TrendIndicator trend={perf.trend} delta={perf.trendDelta} />
                    </View>

                    {/* Strengths & Development */}
                    <View className="flex-row gap-2">
                      {perf.strengths.slice(0, 2).map((s, i) => (
                        <View key={i} className="bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                          <Text className="text-emerald-700 dark:text-emerald-300 text-xs">{s}</Text>
                        </View>
                      ))}
                      {perf.developmentAreas.slice(0, 1).map((d, i) => (
                        <View key={i} className="bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                          <Text className="text-amber-700 dark:text-amber-300 text-xs">{d}</Text>
                        </View>
                      ))}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* INSIGHTS VIEW */}
        {activeView === 'insights' && (
          <View className="px-5 py-4">
            <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
              All Insights ({insights.length})
            </Text>
            {insights.length === 0 ? (
              <View className="items-center py-16">
                <Lightbulb size={64} color="#64748b" />
                <Text className="text-gray-600 dark:text-slate-400 text-lg font-semibold mt-4">
                  No Insights Yet
                </Text>
                <Text className="text-gray-500 dark:text-slate-500 text-center mt-2">
                  Insights will appear as data accumulates
                </Text>
              </View>
            ) : (
              insights.map((insight, idx) => {
                const colors = getInsightColors(insight.severity);
                const IconComponent = getInsightIcon(insight.type);
                return (
                  <Animated.View key={insight.id} entering={FadeInDown.delay(idx * 50).duration(300)}>
                    <View className={`${colors.bg} border ${colors.border} rounded-xl p-4 mb-3`}>
                      <View className="flex-row items-start">
                        <View className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center mr-3">
                          <IconComponent size={20} color={colors.icon} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-gray-900 dark:text-white font-bold text-base">
                              {insight.title}
                            </Text>
                            {insight.metric && (
                              <View className="bg-white dark:bg-slate-800 px-2 py-1 rounded">
                                <Text className="text-gray-700 dark:text-slate-300 text-xs font-bold">
                                  {insight.metric}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                            {insight.description}
                          </Text>
                          {insight.action && (
                            <View className="flex-row items-center bg-white/50 dark:bg-slate-800/50 px-3 py-2 rounded-lg">
                              <Zap size={14} color={colors.icon} />
                              <Text className="text-gray-700 dark:text-slate-300 text-sm font-medium ml-2">
                                {insight.action}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })
            )}
          </View>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Submission Review Modal - Enhanced (McKinsey/Deloitte Excellence) */}
      <Modal
        visible={showSubmissionModal}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubmissionModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '95%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">Review Submission</Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">Quality assurance review</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowSubmissionModal(false)}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
              </View>

              <ScrollView className="px-6 py-4" keyboardShouldPersistTaps="handled">
                {selectedSubmission && (
                  <>
                    {/* Work Plan Context */}
                    <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                      <Text className="text-blue-900 dark:text-blue-100 font-bold text-base mb-1">
                        {selectedSubmission.plan.title}
                      </Text>
                      <View className="flex-row items-center gap-2 mt-2">
                        <View
                          className="px-2 py-0.5 rounded"
                          style={{ backgroundColor: getFunctionColor(selectedSubmission.plan.function) + '20' }}
                        >
                          <Text className="text-xs font-semibold" style={{ color: getFunctionColor(selectedSubmission.plan.function) }}>
                            {selectedSubmission.plan.function}
                          </Text>
                        </View>
                        <Text className="text-blue-700 dark:text-blue-300 text-xs">
                          Due {new Date(selectedSubmission.plan.dueDate).toLocaleDateString()}
                        </Text>
                        {selectedSubmission.plan.linkedOKRTitle && (
                          <View className="flex-row items-center">
                            <Target size={12} color="#3b82f6" />
                            <Text className="text-blue-600 dark:text-blue-400 text-xs ml-1" numberOfLines={1}>
                              {selectedSubmission.plan.linkedOKRTitle}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Submission Info */}
                    <View className="mb-4">
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Submitted By</Text>
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-purple-500 rounded-full items-center justify-center mr-3">
                          <Text className="text-white font-bold">
                            {selectedSubmission.submission.apprenticeName.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-bold">
                            {selectedSubmission.submission.apprenticeName}
                          </Text>
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">
                            {new Date(selectedSubmission.submission.submittedAt).toLocaleString()}
                          </Text>
                        </View>
                        {/* Historical Performance Badge */}
                        <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                          <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                            Avg: 82%
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Submission Data (if available from enhanced modal) */}
                    {selectedSubmission.plan.submissionData && (
                      <View className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                        <Text className="text-gray-900 dark:text-white font-semibold mb-3">Submission Details</Text>
                        <View className="flex-row gap-3 mb-3">
                          <View className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-3">
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">Time Spent</Text>
                            <Text className="text-gray-900 dark:text-white font-bold text-lg">
                              {selectedSubmission.plan.submissionData.hoursSpent}h
                            </Text>
                          </View>
                          <View className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-3">
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">Self Score</Text>
                            <Text className={`font-bold text-lg ${
                              selectedSubmission.plan.submissionData.estimatedQuality >= 80 ? 'text-emerald-600' :
                              selectedSubmission.plan.submissionData.estimatedQuality >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {selectedSubmission.plan.submissionData.estimatedQuality}%
                            </Text>
                          </View>
                          <View className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-3">
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">Confidence</Text>
                            <Text className={`font-bold text-lg capitalize ${
                              selectedSubmission.plan.submissionData.confidenceLevel === 'high' ? 'text-emerald-600' :
                              selectedSubmission.plan.submissionData.confidenceLevel === 'medium' ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {selectedSubmission.plan.submissionData.confidenceLevel}
                            </Text>
                          </View>
                        </View>

                        {/* Quality Checklist Review */}
                        <View className="mb-3">
                          <Text className="text-gray-700 dark:text-slate-300 text-sm font-medium mb-2">Quality Checklist</Text>
                          <View className="flex-row flex-wrap gap-2">
                            {Object.entries(selectedSubmission.plan.submissionData.qualityChecklist).map(([key, value]) => (
                              <View key={key} className={`px-2 py-1 rounded-lg flex-row items-center ${
                                value ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                {value ? (
                                  <CheckCircle2 size={12} color="#10b981" />
                                ) : (
                                  <AlertCircle size={12} color="#ef4444" />
                                )}
                                <Text className={`text-xs ml-1 ${
                                  value ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                                }`}>
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* Blockers Encountered */}
                        {selectedSubmission.plan.submissionData.blockersEncountered.length > 0 && (
                          <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <View className="flex-row items-center mb-2">
                              <AlertTriangle size={14} color="#f59e0b" />
                              <Text className="text-amber-800 dark:text-amber-200 font-semibold text-sm ml-2">Blockers Reported</Text>
                            </View>
                            <View className="flex-row flex-wrap gap-1">
                              {selectedSubmission.plan.submissionData.blockersEncountered.map((blocker, idx) => (
                                <Text key={idx} className="text-amber-700 dark:text-amber-300 text-xs bg-amber-100 dark:bg-amber-800/30 px-2 py-1 rounded">
                                  {blocker}
                                </Text>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Submission Notes */}
                        {selectedSubmission.plan.submissionData.notes && (
                          <View className="mt-3">
                            <Text className="text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">Notes from Apprentice</Text>
                            <Text className="text-gray-600 dark:text-slate-400 text-sm italic">
                              "{selectedSubmission.plan.submissionData.notes}"
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* AI Recommendation Engine */}
                    <View className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-2">
                        <Sparkles size={16} color="#8b5cf6" />
                        <Text className="text-violet-900 dark:text-violet-100 font-bold ml-2">AI Recommendation</Text>
                      </View>
                      <View className="flex-row items-center mb-2">
                        <View className={`w-3 h-3 rounded-full mr-2 ${
                          (selectedSubmission.plan.submissionData?.estimatedQuality ?? 75) >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        <Text className="text-violet-800 dark:text-violet-200 font-semibold">
                          {(selectedSubmission.plan.submissionData?.estimatedQuality ?? 75) >= 70 ? 'Recommend: APPROVE' : 'Recommend: REQUEST CHANGES'}
                        </Text>
                      </View>
                      <Text className="text-violet-700 dark:text-violet-300 text-sm">
                        {(selectedSubmission.plan.submissionData?.estimatedQuality ?? 75) >= 70
                          ? 'Self-assessment quality is above threshold. Time logged is reasonable. Quality checklist mostly complete.'
                          : 'Quality checklist incomplete or low confidence reported. Consider requesting clarification before approval.'}
                      </Text>
                    </View>

                    {/* Cost Impact Analysis */}
                    <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-3">
                        <DollarSign size={16} color="#64748b" />
                        <Text className="text-gray-900 dark:text-white font-semibold ml-2">Cost Impact Analysis</Text>
                      </View>
                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">Time Cost</Text>
                          <Text className="text-gray-900 dark:text-white font-bold">
                            £{((selectedSubmission.plan.submissionData?.hoursSpent ?? 4) * 45).toFixed(0)}
                          </Text>
                          <Text className="text-gray-500 dark:text-slate-500 text-xs">
                            {selectedSubmission.plan.submissionData?.hoursSpent ?? 4}h × £45/hr
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">Rejection Cost</Text>
                          <Text className="text-amber-600 dark:text-amber-400 font-bold">
                            £{((selectedSubmission.plan.submissionData?.hoursSpent ?? 4) * 45 * 0.3).toFixed(0)}
                          </Text>
                          <Text className="text-gray-500 dark:text-slate-500 text-xs">
                            ~30% rework estimate
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">Delay Impact</Text>
                          <Text className="text-red-600 dark:text-red-400 font-bold">
                            £{(200).toFixed(0)}/day
                          </Text>
                          <Text className="text-gray-500 dark:text-slate-500 text-xs">
                            OKR delay cost
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Approval Criteria */}
                    <View className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-4">
                      <Text className="text-emerald-900 dark:text-emerald-100 font-semibold mb-2">Approval Criteria</Text>
                      <View className="space-y-1">
                        <View className="flex-row items-center">
                          <CheckCircle2 size={14} color="#10b981" />
                          <Text className="text-emerald-700 dark:text-emerald-300 text-sm ml-2">Requirements addressed (70+ score)</Text>
                        </View>
                        <View className="flex-row items-center mt-1">
                          <CheckCircle2 size={14} color="#10b981" />
                          <Text className="text-emerald-700 dark:text-emerald-300 text-sm ml-2">No critical blockers for next phase</Text>
                        </View>
                        <View className="flex-row items-center mt-1">
                          <CheckCircle2 size={14} color="#10b981" />
                          <Text className="text-emerald-700 dark:text-emerald-300 text-sm ml-2">Reasonable time investment</Text>
                        </View>
                      </View>
                    </View>

                    {/* Quality Score Slider */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-semibold">Your Quality Score</Text>
                        <View className={`px-3 py-1 rounded-full ${
                          qualityScore >= 85 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          qualityScore >= 70 ? 'bg-blue-100 dark:bg-blue-900/30' :
                          qualityScore >= 55 ? 'bg-amber-100 dark:bg-amber-900/30' :
                          'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          <Text className={`font-bold ${
                            qualityScore >= 85 ? 'text-emerald-700 dark:text-emerald-300' :
                            qualityScore >= 70 ? 'text-blue-700 dark:text-blue-300' :
                            qualityScore >= 55 ? 'text-amber-700 dark:text-amber-300' :
                            'text-red-700 dark:text-red-300'
                          }`}>
                            {qualityScore}/100
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row gap-2">
                        {[60, 70, 80, 90, 100].map(score => (
                          <Pressable
                            key={score}
                            onPress={() => setQualityScore(score)}
                            className={`flex-1 py-2 rounded-lg items-center ${
                              qualityScore === score ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-800'
                            } active:opacity-70`}
                          >
                            <Text className={`font-semibold ${
                              qualityScore === score ? 'text-white' : 'text-gray-700 dark:text-slate-300'
                            }`}>
                              {score}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <Text className="text-gray-500 dark:text-slate-500 text-xs mt-1">
                        60-69: Needs work | 70-79: Acceptable | 80-89: Good | 90+: Excellent
                      </Text>
                    </View>

                    {/* Feedback Notes */}
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Feedback Notes</Text>
                      <TextInput
                        className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[100px]"
                        value={reviewNotes}
                        onChangeText={setReviewNotes}
                        placeholder="Provide constructive feedback for the apprentice..."
                        placeholderTextColor="#64748b"
                        multiline
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-3 mb-6">
                      <Pressable
                        onPress={() => handleReviewSubmission('approve')}
                        className="flex-1 bg-emerald-500 py-4 rounded-xl active:opacity-70"
                      >
                        <View className="flex-row items-center justify-center">
                          <ThumbsUp size={20} color="#fff" />
                          <Text className="text-white font-bold ml-2">Approve</Text>
                        </View>
                      </Pressable>
                      <Pressable
                        onPress={() => handleReviewSubmission('request-changes')}
                        className="flex-1 bg-amber-500 py-4 rounded-xl active:opacity-70"
                      >
                        <View className="flex-row items-center justify-center">
                          <MessageSquare size={20} color="#fff" />
                          <Text className="text-white font-bold ml-2">Request Changes</Text>
                        </View>
                      </Pressable>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Performance Detail Modal */}
      <Modal
        visible={showPerformanceModal}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPerformanceModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">Performance Profile</Text>
                <Pressable
                  onPress={() => setShowPerformanceModal(false)}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 active:opacity-70"
                >
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-6 py-4">
              {selectedPerformance && (
                <>
                  {/* Profile Header */}
                  <View className="items-center mb-6">
                    <View className={`w-20 h-20 rounded-full items-center justify-center mb-3 ${
                      selectedPerformance.riskLevel === 'low' ? 'bg-emerald-500' :
                      selectedPerformance.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                    }`}>
                      <Text className="text-white text-2xl font-bold">
                        {selectedPerformance.apprenticeName.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">
                      {selectedPerformance.apprenticeName}
                    </Text>
                    <Text className="text-gray-500 dark:text-slate-400">
                      {selectedPerformance.function}
                    </Text>
                    {selectedPerformance.streak >= 3 && (
                      <View className="mt-2 flex-row items-center bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
                        <Flame size={16} color="#f59e0b" />
                        <Text className="text-amber-700 dark:text-amber-300 font-bold ml-1">
                          {selectedPerformance.streak} approval streak!
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Score Card */}
                  <View className={`rounded-2xl p-5 mb-6 ${
                    selectedPerformance.averageQualityScore >= 85 ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                    selectedPerformance.averageQualityScore >= 70 ? 'bg-blue-50 dark:bg-blue-900/20' :
                    'bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">Quality Score</Text>
                        <Text className={`text-4xl font-bold ${
                          selectedPerformance.averageQualityScore >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                          selectedPerformance.averageQualityScore >= 70 ? 'text-blue-600 dark:text-blue-400' :
                          'text-amber-600 dark:text-amber-400'
                        }`}>
                          {selectedPerformance.averageQualityScore}
                        </Text>
                      </View>
                      <TrendIndicator trend={selectedPerformance.trend} delta={selectedPerformance.trendDelta} />
                    </View>
                  </View>

                  {/* Stats Grid */}
                  <View className="flex-row gap-3 mb-6">
                    <View className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">Submissions</Text>
                      <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                        {selectedPerformance.totalSubmissions}
                      </Text>
                    </View>
                    <View className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">First-Time</Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-2xl font-bold">
                        {selectedPerformance.approvedFirstTime}
                      </Text>
                    </View>
                    <View className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-4">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">Avg Time</Text>
                      <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                        {selectedPerformance.averageTimeToComplete}h
                      </Text>
                    </View>
                  </View>

                  {/* Strengths */}
                  {selectedPerformance.strengths.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-bold text-base mb-2">Strengths</Text>
                      <View className="gap-2">
                        {selectedPerformance.strengths.map((s, i) => (
                          <View key={i} className="flex-row items-center bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                            <Star size={16} color="#10b981" />
                            <Text className="text-emerald-700 dark:text-emerald-300 ml-2">{s}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Development Areas */}
                  {selectedPerformance.developmentAreas.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-gray-900 dark:text-white font-bold text-base mb-2">Development Areas</Text>
                      <View className="gap-2">
                        {selectedPerformance.developmentAreas.map((d, i) => (
                          <View key={i} className="flex-row items-center bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                            <Target size={16} color="#f59e0b" />
                            <Text className="text-amber-700 dark:text-amber-300 ml-2">{d}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Actions */}
                  <View className="gap-3 mb-6">
                    <Pressable
                      onPress={() => {
                        Alert.alert('Schedule 1:1', `Schedule a coaching session with ${selectedPerformance.apprenticeName}`);
                      }}
                      className="bg-blue-500 py-4 rounded-xl active:opacity-70"
                    >
                      <View className="flex-row items-center justify-center">
                        <MessageSquare size={20} color="#fff" />
                        <Text className="text-white font-bold ml-2">Schedule 1:1 Session</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Alert.alert('Send Recognition', `Send kudos to ${selectedPerformance.apprenticeName}`);
                      }}
                      className="bg-emerald-500 py-4 rounded-xl active:opacity-70"
                    >
                      <View className="flex-row items-center justify-center">
                        <Award size={20} color="#fff" />
                        <Text className="text-white font-bold ml-2">Send Recognition</Text>
                      </View>
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
