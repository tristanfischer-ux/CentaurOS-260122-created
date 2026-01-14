import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bot,
  Factory,
  ArrowRight,
  BarChart3,
  Zap,
  Award,
  Sparkles,
  Building2,
  PlayCircle,
  Plus,
  DollarSign,
  TrendingDown,
} from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { Function as BusinessFunction } from '@/types';
import { getFinancialMetrics, getCostBreakdown } from '@/lib/financial-calculations';
import { useOKRStore } from '@/lib/state/okr-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import { THIRD_PARTY_AI_TOOLS } from '@/lib/third-party-ai-tools';

// Initialize stores once
if (useOKRStore.getState().okrs.length === 0) {
  useOKRStore.getState().initializeOKRs();
}
if (useWorkPlanStore.getState().workPlans.length === 0) {
  useWorkPlanStore.getState().initializeWorkPlans();
}
if (useOrganizationStore.getState().members.length === 0) {
  useOrganizationStore.getState().initializeOrganization();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  // Use centralized stores - select primitive values to avoid infinite loops
  const okrs = useOKRStore(s => s.okrs);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const members = useOrganizationStore(s => s.members);
  const aiAgents = useOrganizationStore(s => s.aiAgents);
  const engagements = useOrganizationStore(s => s.supplierEngagements);
  const personLoadouts = useArmoryStore(s => s.personLoadouts);

  // Get real-time financial metrics - SINGLE SOURCE OF TRUTH (memoized inside component)
  const financialMetrics = useMemo(() => getFinancialMetrics(), []);
  const costBreakdown = useMemo(() => getCostBreakdown(), []);

  // Calculate actual AI tool costs from person loadouts
  const actualAIToolCost = useMemo(() => {
    const allEquippedToolIds = personLoadouts.flatMap(loadout => loadout.aiToolIds || []);
    const uniqueToolIds = [...new Set(allEquippedToolIds)];

    return uniqueToolIds.reduce((total, toolId) => {
      const tool = THIRD_PARTY_AI_TOOLS.find(t => t.id === toolId);
      return total + (tool?.costPerMonth || 0);
    }, 0);
  }, [personLoadouts]);

  // Adjust monthly burn to use actual AI tool costs
  const adjustedMonthlyBurn = useMemo(() => {
    return financialMetrics.monthlyBurn - costBreakdown.aiTools + actualAIToolCost;
  }, [financialMetrics.monthlyBurn, costBreakdown.aiTools, actualAIToolCost]);

  // Recalculate runway with adjusted burn
  const adjustedRunway = useMemo(() => {
    if (adjustedMonthlyBurn <= 0) return 999; // No burn means infinite runway

    const adjustedNetCashFlow = financialMetrics.monthlyRevenue - adjustedMonthlyBurn;

    // If we have positive cash flow, runway is infinite
    if (adjustedNetCashFlow >= 0) {
      return 999;
    }

    // If we're burning cash, calculate months until we run out
    const monthlyNetBurn = Math.abs(adjustedNetCashFlow);
    return financialMetrics.cashPosition / monthlyNetBurn;
  }, [financialMetrics.cashPosition, financialMetrics.monthlyRevenue, adjustedMonthlyBurn]);

  // Recalculate net cash flow with adjusted burn
  const adjustedNetCashFlow = useMemo(() => {
    return financialMetrics.monthlyRevenue - adjustedMonthlyBurn;
  }, [financialMetrics.monthlyRevenue, adjustedMonthlyBurn]);

  // Memoize counts to prevent re-renders
  const okrCounts = useMemo(() => ({
    total: okrs.length,
    onTrack: okrs.filter(o => o.status === 'on-track').length,
    atRisk: okrs.filter(o => o.status === 'at-risk').length,
    offTrack: okrs.filter(o => o.status === 'off-track').length,
  }), [okrs]);

  const workPlanCounts = useMemo(() => ({
    total: workPlans.length,
    active: workPlans.filter(wp => wp.status !== 'completed').length,
    inProgress: workPlans.filter(wp => wp.status === 'in-progress').length,
    completed: workPlans.filter(wp => wp.status === 'completed').length,
    blocked: workPlans.filter(wp => wp.status === 'blocked').length,
  }), [workPlans]);

  const orgCounts = useMemo(() => ({
    executives: members.filter(m => m.role === 'FractionalExec' && m.status === 'active').length,
    apprentices: members.filter(m => m.role === 'Apprentice' && m.status === 'active').length,
    activeAI: (aiAgents || []).filter(a => a.status === 'active').length,
  }), [members, aiAgents]);

  // Calculate OKRs by function
  const okrsByFunction = useMemo(() => {
    const functions: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Ops', 'Finance', 'Admin'];
    return functions.map(func => {
      const functionOKRs = okrs.filter(okr => okr.function === func);
      const avgProgress = functionOKRs.length > 0
        ? Math.round(functionOKRs.reduce((sum, okr) => {
            const okrProgress = okr.objectives.reduce((oSum, obj) => oSum + obj.progress, 0) / okr.objectives.length;
            return sum + okrProgress;
          }, 0) / functionOKRs.length)
        : 0;

      // Determine overall status for the function
      const statuses = functionOKRs.map(okr => okr.status);
      const status = statuses.includes('off-track') ? 'off-track'
        : statuses.includes('at-risk') ? 'at-risk'
        : 'on-track';

      return {
        function: func,
        okrs: functionOKRs.length,
        status,
        progress: avgProgress,
      };
    }).filter(item => item.okrs > 0); // Only show functions with OKRs
  }, [okrs]);

  // Calculate urgent items that need attention
  const urgentItems = useMemo(() => {
    const offTrackOKRs = okrs.filter(o => o.status === 'off-track');
    const atRiskOKRs = okrs.filter(o => o.status === 'at-risk');
    const blockedPlans = workPlans.filter(wp => wp.status === 'blocked');
    const pendingSubmissions = workPlans.filter(wp => wp.status === 'in-progress' && wp.progress >= 90);

    return {
      offTrackOKRs,
      atRiskOKRs,
      blockedPlans,
      pendingSubmissions,
      totalUrgent: offTrackOKRs.length + blockedPlans.length,
      totalWarning: atRiskOKRs.length,
    };
  }, [okrs, workPlans]);

  // Demo data for the dashboard - now using centralized stores
  const FOUNDER_DATA = {
    okrs: okrCounts,
    workPlans: {
      total: workPlanCounts.total,
      active: workPlanCounts.active,
      inProgress: workPlanCounts.inProgress,
      completed: workPlanCounts.completed,
      blocked: workPlanCounts.blocked,
    },
    team: {
      executives: orgCounts.executives,
      apprentices: orgCounts.apprentices,
      aiAgents: orgCounts.activeAI,
    },
    financials: {
      runway: adjustedRunway,
      burnRate: adjustedMonthlyBurn,
      revenue: financialMetrics.monthlyRevenue,
      netCashFlow: adjustedNetCashFlow,
    },
    pendingApprovals: 1, // This would need a separate approval store in the future
  };

  // Executive data - derived from stores based on current user
  const executiveData = useMemo(() => {
    // Find current user's function (if they're an executive)
    const currentMember = members.find(m => m.name === currentUser?.name);
    const myFunction = currentMember?.function || 'Marketing';

    // Get work plans in my function (assigned by executives in my function)
    const functionWorkPlans = workPlans.filter(wp => wp.function === myFunction);
    const myInProgress = functionWorkPlans.filter(wp => wp.status === 'in-progress').length;
    const myCompleted = functionWorkPlans.filter(wp => wp.status === 'completed').length;

    // Get apprentices in my function
    const myApprentices = members
      .filter(m => m.role === 'Apprentice' && m.function === myFunction && m.status === 'active')
      .map(apprentice => {
        const apprenticeWorkPlans = workPlans.filter(wp => wp.assignedBy === apprentice.name || wp.function === myFunction);
        const avgProgress = apprenticeWorkPlans.length > 0
          ? Math.round(apprenticeWorkPlans.reduce((sum, wp) => sum + wp.progress, 0) / apprenticeWorkPlans.length)
          : 0;
        return {
          name: apprentice.name,
          workPlans: apprenticeWorkPlans.filter(wp => wp.function === myFunction).length,
          progress: avgProgress,
        };
      });

    // Get pending reviews (work plans ready for review)
    const pendingReviews = workPlans.filter(wp =>
      wp.status === 'in-progress' &&
      wp.progress >= 90 &&
      wp.function === myFunction
    ).length;

    // Get OKRs for my function
    const functionOKRs = okrs.filter(okr => okr.function === myFunction);

    // Get AI tools from armory
    const myLoadout = personLoadouts.find(l => l.memberId === currentMember?.id);
    const equippedToolIds = myLoadout?.aiToolIds || [];
    const equippedTools = equippedToolIds
      .map(id => THIRD_PARTY_AI_TOOLS.find(t => t.id === id)?.name)
      .filter(Boolean) as string[];

    return {
      myWorkPlans: {
        total: functionWorkPlans.length,
        inProgress: myInProgress,
        completed: myCompleted,
      },
      apprentices: myApprentices.slice(0, 3), // Show max 3
      pendingReviews,
      myFunction: myFunction as BusinessFunction,
      linkedOKRs: functionOKRs.length,
      aiUsage: {
        thisWeek: equippedTools.length * 4, // Approximate usage
        tools: equippedTools.slice(0, 3),
      },
      aiAgents: aiAgents.filter(a => a.status === 'active').slice(0, 3),
    };
  }, [members, workPlans, okrs, currentUser, personLoadouts, aiAgents]);

  // Apprentice data - derived from stores based on current user
  const apprenticeData = useMemo(() => {
    // Find current user's member record
    const currentMember = members.find(m => m.name === currentUser?.name);
    const myFunction = currentMember?.function || 'Marketing';

    // Get work plans in my function (for the apprentice)
    const myWorkPlans = workPlans.filter(wp => wp.function === myFunction);
    const activeCount = myWorkPlans.filter(wp => wp.status !== 'completed').length;
    const completedCount = myWorkPlans.filter(wp => wp.status === 'completed').length;

    // Find my executive (supervisor)
    const myExecutive = members.find(m =>
      m.role === 'FractionalExec' &&
      m.function === myFunction &&
      m.status === 'active'
    );

    // Find the founder
    const founder = members.find(m => m.role === 'Founder' && m.status === 'active');

    // Get linked OKR for my function
    const myOKR = okrs.find(okr => okr.function === myFunction);
    const okrProgress = myOKR
      ? Math.round(myOKR.objectives.reduce((sum, obj) => sum + obj.progress, 0) / myOKR.objectives.length)
      : 0;

    // Recent work - my active work plans sorted by due date
    const recentWork = myWorkPlans
      .filter(wp => wp.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3)
      .map(wp => ({
        title: wp.title,
        progress: wp.progress,
        dueDate: wp.dueDate,
      }));

    // Get my AI tools from armory
    const myLoadout = personLoadouts.find(l => l.memberId === currentMember?.id);
    const equippedToolIds = myLoadout?.aiToolIds || [];
    const equippedTools = equippedToolIds
      .map(id => THIRD_PARTY_AI_TOOLS.find(t => t.id === id)?.name)
      .filter(Boolean) as string[];

    // Team members I work with
    const teamMembers: Array<{ name: string; role: 'Executive' | 'Founder'; function?: string }> = [];
    if (myExecutive) {
      teamMembers.push({ name: myExecutive.name, role: 'Executive', function: myFunction });
    }
    if (founder) {
      teamMembers.push({ name: founder.name, role: 'Founder', function: undefined });
    }

    return {
      myWorkPlans: {
        active: activeCount,
        completed: completedCount,
      },
      assignedBy: {
        executive: myExecutive?.name || 'Not assigned',
        founder: founder?.name || 'Not assigned',
      },
      linkedOKR: myOKR ? {
        title: myOKR.title,
        function: myOKR.function,
        progress: okrProgress,
      } : {
        title: 'No OKR assigned',
        function: myFunction as BusinessFunction,
        progress: 0,
      },
      recentWork: recentWork.length > 0 ? recentWork : [
        { title: 'No active work plans', progress: 0, dueDate: new Date().toISOString().split('T')[0] }
      ],
      aiTools: equippedTools.length > 0 ? equippedTools : ['No tools equipped'],
      teamMembers,
    };
  }, [members, workPlans, okrs, currentUser, personLoadouts]);

  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!currentMembership || !currentWorkspace) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-6">
        <Text className="text-gray-600 dark:text-slate-400 text-center">
          No workspace selected
        </Text>
      </View>
    );
  }

  const role = currentMembership.role;
  const isFounder = role === 'Founder';
  const isExecutive = role === 'FractionalExec';
  const isApprentice = role === 'Apprentice';

  const getRoleColor = () => {
    if (isFounder) return '#8b5cf6';
    if (isExecutive) return '#3b82f6';
    return '#10b981';
  };

  const getRoleGradient = (): [string, string] => {
    if (isFounder) return ['#8b5cf6', '#6366f1'];
    if (isExecutive) return ['#3b82f6', '#2563eb'];
    return ['#10b981', '#059669'];
  };

  const getFunctionColor = (func: BusinessFunction) => {
    switch (func) {
      case 'Marketing':
        return '#f59e0b';
      case 'Sales':
        return '#ec4899';
      case 'Engineering':
        return '#3b82f6';
      case 'Ops':
        return '#8b5cf6';
      case 'Finance':
        return '#10b981';
      case 'Admin':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  // Founder View
  if (isFounder) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950">
        {/* Role Header - Compact with Key Metrics */}
        <LinearGradient
          colors={getRoleGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white/70 text-xs font-medium">COMMAND CENTER</Text>
              <Text className="text-white text-xl font-bold">
                {currentWorkspace.name}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/financial-dashboard')}
              className="bg-white/20 px-3 py-2 rounded-xl active:opacity-70"
            >
              <Text className="text-white/80 text-xs font-medium">RUNWAY</Text>
              <Text className="text-white text-lg font-bold">
                {FOUNDER_DATA.financials.runway >= 999 ? '∞' : `${FOUNDER_DATA.financials.runway.toFixed(0)}mo`}
              </Text>
            </Pressable>
          </View>
          {/* Quick Health Indicators */}
          <View className="flex-row gap-4">
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full mr-1.5 ${urgentItems.totalUrgent > 0 ? 'bg-red-400' : 'bg-emerald-400'}`} />
              <Text className="text-white/90 text-xs">
                {FOUNDER_DATA.okrs.onTrack}/{FOUNDER_DATA.okrs.total} OKRs on track
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full mr-1.5 ${FOUNDER_DATA.financials.netCashFlow >= 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <Text className="text-white/90 text-xs">
                {FOUNDER_DATA.financials.netCashFlow >= 0 ? '+' : ''}£{(FOUNDER_DATA.financials.netCashFlow / 1000).toFixed(0)}K/mo
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1">
          <View className="px-5 py-4">
            {/* ATTENTION REQUIRED - Most Critical */}
            {(urgentItems.totalUrgent > 0 || urgentItems.totalWarning > 0 || FOUNDER_DATA.pendingApprovals > 0) && (
              <View className="mb-4">
                <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold mb-2 tracking-wide">
                  ATTENTION REQUIRED
                </Text>
                <View className="gap-2">
                  {/* Off-Track OKRs - Critical */}
                  {urgentItems.offTrackOKRs.length > 0 && (
                    <Pressable
                      onPress={() => router.push('/(tabs)/decide')}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 bg-red-500 rounded-lg items-center justify-center">
                          <AlertTriangle size={18} color="#fff" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-red-900 dark:text-red-100 font-bold text-sm">
                            {urgentItems.offTrackOKRs.length} OKR{urgentItems.offTrackOKRs.length > 1 ? 's' : ''} Off-Track
                          </Text>
                          <Text className="text-red-700 dark:text-red-300 text-xs">
                            Needs immediate intervention
                          </Text>
                        </View>
                        <ArrowRight size={18} color="#ef4444" />
                      </View>
                    </Pressable>
                  )}

                  {/* Blocked Work Plans */}
                  {urgentItems.blockedPlans.length > 0 && (
                    <Pressable
                      onPress={() => router.push('/(tabs)/do')}
                      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 bg-amber-500 rounded-lg items-center justify-center">
                          <AlertCircle size={18} color="#fff" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-amber-900 dark:text-amber-100 font-bold text-sm">
                            {urgentItems.blockedPlans.length} Work Plan{urgentItems.blockedPlans.length > 1 ? 's' : ''} Blocked
                          </Text>
                          <Text className="text-amber-700 dark:text-amber-300 text-xs">
                            Team waiting for resolution
                          </Text>
                        </View>
                        <ArrowRight size={18} color="#f59e0b" />
                      </View>
                    </Pressable>
                  )}

                  {/* Pending Approvals */}
                  {FOUNDER_DATA.pendingApprovals > 0 && (
                    <Pressable
                      onPress={() => router.push('/(tabs)/decide')}
                      className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 bg-purple-500 rounded-lg items-center justify-center">
                          <Clock size={18} color="#fff" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-purple-900 dark:text-purple-100 font-bold text-sm">
                            {FOUNDER_DATA.pendingApprovals} Pending Approval{FOUNDER_DATA.pendingApprovals > 1 ? 's' : ''}
                          </Text>
                          <Text className="text-purple-700 dark:text-purple-300 text-xs">
                            Resource allocation requests
                          </Text>
                        </View>
                        <ArrowRight size={18} color="#a855f7" />
                      </View>
                    </Pressable>
                  )}

                  {/* At-Risk Warning */}
                  {urgentItems.atRiskOKRs.length > 0 && (
                    <Pressable
                      onPress={() => router.push('/(tabs)/decide')}
                      className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 bg-yellow-500 rounded-lg items-center justify-center">
                          <TrendingDown size={18} color="#fff" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-yellow-900 dark:text-yellow-100 font-bold text-sm">
                            {urgentItems.atRiskOKRs.length} OKR{urgentItems.atRiskOKRs.length > 1 ? 's' : ''} At Risk
                          </Text>
                          <Text className="text-yellow-700 dark:text-yellow-300 text-xs">
                            May need course correction
                          </Text>
                        </View>
                        <ArrowRight size={18} color="#eab308" />
                      </View>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* QUICK ACTIONS */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold mb-2 tracking-wide">
                QUICK ACTIONS
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => router.push('/(tabs)/decide')}
                  className="flex-1 bg-purple-500 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center justify-center">
                    <Plus size={18} color="#fff" />
                    <Text className="text-white font-bold text-sm ml-1.5">New OKR</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(tabs)/evaluate')}
                  className="flex-1 bg-blue-500 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center justify-center">
                    <CheckCircle2 size={18} color="#fff" />
                    <Text className="text-white font-bold text-sm ml-1.5">Review</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/financial-dashboard')}
                  className="flex-1 bg-emerald-500 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center justify-center">
                    <DollarSign size={18} color="#fff" />
                    <Text className="text-white font-bold text-sm ml-1.5">Finance</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* OKRs by Function - Compact Grid */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                  OKR PROGRESS
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/decide')}>
                  <Text className="text-purple-500 text-xs font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {okrsByFunction.map((item, idx) => {
                  const functionColor = getFunctionColor(item.function as BusinessFunction);
                  const statusColor = item.status === 'off-track' ? '#ef4444' : item.status === 'at-risk' ? '#f59e0b' : '#10b981';
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => router.push({
                        pathname: '/(tabs)/decide',
                        params: { function: item.function }
                      })}
                      className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                      style={{ width: '48%' }}
                    >
                      <View className="flex-row items-center mb-2">
                        <View
                          className="w-7 h-7 rounded-lg items-center justify-center"
                          style={{ backgroundColor: functionColor + '20' }}
                        >
                          <Target size={14} color={functionColor} />
                        </View>
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm ml-2 flex-1" numberOfLines={1}>
                          {item.function}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className="text-gray-500 dark:text-slate-400 text-xs">
                          {item.okrs} OKR{item.okrs !== 1 ? 's' : ''}
                        </Text>
                        <Text className="font-bold text-sm" style={{ color: statusColor }}>
                          {item.progress}%
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{ width: `${item.progress}%`, backgroundColor: statusColor }}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* EXECUTION STATUS - Work Plans + Team Combined */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold mb-2 tracking-wide">
                EXECUTION STATUS
              </Text>

              {/* Work Plans Row */}
              <Pressable
                onPress={() => router.push('/(tabs)/do')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 mb-2 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg items-center justify-center">
                      <Briefcase size={18} color="#3b82f6" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">Work Plans</Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">
                        {FOUNDER_DATA.workPlans.inProgress} in progress • {FOUNDER_DATA.workPlans.completed} done
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-blue-500 font-bold text-lg">{FOUNDER_DATA.workPlans.active}</Text>
                    <Text className="text-gray-500 dark:text-slate-500 text-xs">active</Text>
                  </View>
                </View>
              </Pressable>

              {/* Team Row */}
              <Pressable
                onPress={() => router.push('/create-team')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-lg items-center justify-center">
                      <Users size={18} color="#8b5cf6" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">Team</Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">
                        {FOUNDER_DATA.team.executives} execs • {FOUNDER_DATA.team.apprentices} apprentices • {FOUNDER_DATA.team.aiAgents} AI
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={18} color="#64748b" />
                </View>
              </Pressable>
            </View>

            {/* FINANCIAL SNAPSHOT - Simplified */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold tracking-wide">
                  FINANCIAL SNAPSHOT
                </Text>
                <Pressable onPress={() => router.push('/financial-dashboard')}>
                  <Text className="text-emerald-500 text-xs font-semibold">Details</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push('/financial-dashboard')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 active:opacity-70"
              >
                <View className="flex-row justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mb-0.5">Revenue</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-base">
                      £{(FOUNDER_DATA.financials.revenue / 1000).toFixed(0)}K
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mb-0.5">Burn</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-base">
                      £{(FOUNDER_DATA.financials.burnRate / 1000).toFixed(0)}K
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mb-0.5">Net Flow</Text>
                    <Text className={`font-bold text-base ${FOUNDER_DATA.financials.netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {FOUNDER_DATA.financials.netCashFlow >= 0 ? '+' : ''}£{(FOUNDER_DATA.financials.netCashFlow / 1000).toFixed(0)}K
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
                  <Text className="text-gray-500 dark:text-slate-400 text-xs">Cash Position</Text>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    £{(financialMetrics.cashPosition / 1000).toFixed(0)}K
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Executive View
  if (isExecutive) {
    const functionColor = getFunctionColor(executiveData.myFunction);

    return (
      <View className="flex-1 bg-white dark:bg-slate-950">
        {/* Role Header */}
        <LinearGradient
          colors={getRoleGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 20, paddingBottom: 20 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white/80 text-sm font-medium">EXECUTIVE DASHBOARD</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {executiveData.myFunction}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white text-xs font-bold">EXECUTIVE</Text>
            </View>
          </View>
          <Text className="text-white/90 text-sm">
            Evaluate • Create work plans • Review apprentice work
          </Text>
        </LinearGradient>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* Pending Reviews Alert */}
            {executiveData.pendingReviews > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/evaluate')}
                className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-4 mb-4 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-purple-500 rounded-full items-center justify-center">
                      <AlertCircle size={24} color="#fff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-purple-900 dark:text-purple-100 font-bold text-base">
                        {executiveData.pendingReviews} Work Submissions to Review
                      </Text>
                      <Text className="text-purple-700 dark:text-purple-300 text-sm">
                        Apprentices waiting for your feedback
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={20} color="#a855f7" />
                </View>
              </Pressable>
            )}

            {/* My Work Plans */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  My Work Plans
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/evaluate')}>
                  <Text className="text-blue-500 text-sm font-semibold">Manage</Text>
                </Pressable>
              </View>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
                    IN PROGRESS
                  </Text>
                  <Text className="text-blue-900 dark:text-blue-100 text-2xl font-bold">
                    {executiveData.myWorkPlans.inProgress}
                  </Text>
                </View>
                <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                  <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
                    COMPLETED
                  </Text>
                  <Text className="text-emerald-900 dark:text-emerald-100 text-2xl font-bold">
                    {executiveData.myWorkPlans.completed}
                  </Text>
                </View>
              </View>
            </View>

            {/* My OKRs */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                My Function OKRs
              </Text>

              <Pressable
                onPress={() => router.push({
                  pathname: '/(tabs)/decide',
                  params: { function: executiveData.myFunction }
                })}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                <View className="flex-row items-center mb-2">
                  <View
                    className="w-10 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: functionColor + '20' }}
                  >
                    <Target size={20} color={functionColor} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base">
                      {executiveData.myFunction}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">
                      {executiveData.linkedOKRs} linked OKRs
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#64748b" />
                </View>
              </Pressable>
            </View>

            {/* My Apprentices */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  My Apprentices
                </Text>
                <Pressable onPress={() => router.push('/create-team')}>
                  <Text className="text-blue-500 text-sm font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="gap-2">
                {executiveData.apprentices.map((apprentice, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => router.push('/create-team')}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center">
                          <Text className="text-white text-xs font-bold">
                            {apprentice.name.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                            {apprentice.name}
                          </Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs">
                            {apprentice.workPlans} work plan{apprentice.workPlans !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-gray-900 dark:text-white font-bold text-sm">
                        {apprentice.progress}%
                      </Text>
                    </View>
                    <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <View
                        className="h-full bg-emerald-500"
                        style={{ width: `${apprentice.progress}%` }}
                      />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Resources in Use */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                Resources in Use
              </Text>

              <View className="bg-gray-100 dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-800 overflow-hidden">
                <Pressable
                  onPress={() => router.push({ pathname: '/(tabs)/make', params: { tab: 'ai' } })}
                  className="p-4 active:opacity-70"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Bot size={20} color="#8b5cf6" />
                      <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                        AI Tools This Week
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-gray-900 dark:text-white font-bold mr-2">
                        {executiveData.aiUsage.thisWeek}
                      </Text>
                      <ArrowRight size={16} color="#64748b" />
                    </View>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {executiveData.aiUsage.tools.map((tool, idx) => (
                      <View key={idx} className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs">{tool}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => router.push({ pathname: '/(tabs)/make', params: { tab: 'ai' } })}
                  className="p-4 border-t border-gray-300 dark:border-slate-700 active:opacity-70"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Bot size={20} color="#8b5cf6" />
                      <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                        AI Agents
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-gray-900 dark:text-white font-bold mr-2">
                        {executiveData.aiAgents.length}
                      </Text>
                      <ArrowRight size={16} color="#64748b" />
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* View Team Management Button */}
            <Pressable
              onPress={() => router.push('/create-team')}
              className="bg-blue-500 rounded-xl py-3 mb-4 items-center active:opacity-80"
            >
              <View className="flex-row items-center">
                <Users size={18} color="#fff" />
                <Text className="text-white font-bold ml-2">View Team Management</Text>
              </View>
            </Pressable>

            {/* Quick Actions */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => router.push('/(tabs)/evaluate')}
                className="flex-1 bg-blue-500 rounded-xl p-4 active:opacity-70"
              >
                <Briefcase size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Create Work Plan</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/make', params: { tab: 'ai' } })}
                className="flex-1 bg-purple-500 rounded-xl p-4 active:opacity-70"
              >
                <Sparkles size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">AI Tools</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Apprentice View
  if (isApprentice) {
    const functionColor = getFunctionColor(apprenticeData.linkedOKR.function);

    return (
      <View className="flex-1 bg-white dark:bg-slate-950">
        {/* Role Header */}
        <LinearGradient
          colors={getRoleGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 20, paddingBottom: 20 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white/80 text-sm font-medium">APPRENTICE WORKSPACE</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                My Work
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white text-xs font-bold">APPRENTICE</Text>
            </View>
          </View>
          <Text className="text-white/90 text-sm">
            Execute • Learn • Deliver results
          </Text>
        </LinearGradient>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* My Active Work */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                My Active Work
              </Text>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                  <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
                    ACTIVE
                  </Text>
                  <Text className="text-emerald-900 dark:text-emerald-100 text-2xl font-bold">
                    {apprenticeData.myWorkPlans.active}
                  </Text>
                </View>
                <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
                    COMPLETED
                  </Text>
                  <Text className="text-blue-900 dark:text-blue-100 text-2xl font-bold">
                    {apprenticeData.myWorkPlans.completed}
                  </Text>
                </View>
              </View>
            </View>

            {/* Linked OKR */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                My Objective
              </Text>

              <Pressable
                onPress={() => router.push('/(tabs)/decide')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 active:opacity-70"
              >
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-10 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: functionColor + '20' }}
                  >
                    <Target size={20} color={functionColor} />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: functionColor + '20', color: functionColor }}
                      >
                        {apprenticeData.linkedOKR.function}
                      </Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                      {apprenticeData.linkedOKR.title}
                    </Text>
                  </View>
                </View>
                <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mb-1">
                  <View
                    className="h-full bg-emerald-500"
                    style={{ width: `${apprenticeData.linkedOKR.progress}%` }}
                  />
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">
                  {apprenticeData.linkedOKR.progress}% progress • Your work contributes to this
                </Text>
              </Pressable>
            </View>

            {/* Recent Work */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  Recent Work
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/do')}>
                  <Text className="text-blue-500 text-sm font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="gap-2">
                {apprenticeData.recentWork.map((work, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => router.push('/(tabs)/do')}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                          {work.title}
                        </Text>
                        <View className="flex-row items-center">
                          <Clock size={12} color="#64748b" />
                          <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                            Due {work.dueDate}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        {work.progress === 100 ? (
                          <CheckCircle2 size={20} color="#10b981" />
                        ) : (
                          <Text className="text-gray-900 dark:text-white font-bold text-sm">
                            {work.progress}%
                          </Text>
                        )}
                      </View>
                    </View>
                    {work.progress < 100 && (
                      <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <View
                          className="h-full bg-blue-500"
                          style={{ width: `${work.progress}%` }}
                        />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* My Team */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                Working With
              </Text>

              <Pressable
                onPress={() => router.push('/create-team')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                {apprenticeData.teamMembers.map((member, idx) => (
                  <View key={idx} className={`flex-row items-center justify-between ${idx > 0 ? 'pt-3 mt-3 border-t border-gray-300 dark:border-slate-700' : ''}`}>
                    <View className="flex-row items-center flex-1">
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${
                        member.role === 'Executive' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        <Text className="text-white text-xs font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                          {member.name}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          {member.role}{member.function ? ` • ${member.function}` : ''}
                        </Text>
                      </View>
                    </View>
                    {idx === apprenticeData.teamMembers.length - 1 && (
                      <ArrowRight size={16} color="#64748b" />
                    )}
                  </View>
                ))}
              </Pressable>
            </View>

            {/* View Team Management Button */}
            <Pressable
              onPress={() => router.push('/create-team')}
              className="bg-blue-500 rounded-xl py-3 mb-4 items-center active:opacity-80"
            >
              <View className="flex-row items-center">
                <Users size={18} color="#fff" />
                <Text className="text-white font-bold ml-2">View Team Management</Text>
              </View>
            </Pressable>

            {/* AI Tools */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                My AI Tools
              </Text>

              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/make', params: { tab: 'ai' } })}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl active:opacity-70"
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, padding: 16 }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Bot size={24} color="#fff" />
                      <Text className="text-white font-bold text-base ml-2">
                        AI Tools Available
                      </Text>
                    </View>
                    <ArrowRight size={20} color="#fff" />
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {apprenticeData.aiTools.map((tool, idx) => (
                      <View key={idx} className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-semibold">{tool}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => router.push('/(tabs)/do')}
                className="flex-1 bg-emerald-500 rounded-xl p-4 active:opacity-70"
              >
                <Zap size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Report Progress</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/do')}
                className="flex-1 bg-blue-500 rounded-xl p-4 active:opacity-70"
              >
                <CheckCircle2 size={24} color="#fff" />
                <Text className="text-white font-bold text-sm mt-2">Submit Work</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}
