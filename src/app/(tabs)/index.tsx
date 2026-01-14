import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
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
    return adjustedMonthlyBurn > 0 ? financialMetrics.cashPosition / adjustedMonthlyBurn : 999;
  }, [financialMetrics.cashPosition, adjustedMonthlyBurn]);

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
    inProgress: workPlans.filter(wp => wp.status === 'in-progress').length,
    completed: workPlans.filter(wp => wp.status === 'completed').length,
    blocked: workPlans.filter(wp => wp.status === 'blocked').length,
  }), [workPlans]);

  const orgCounts = useMemo(() => ({
    executives: members.filter(m => m.role === 'FractionalExec' && m.status === 'active').length,
    apprentices: members.filter(m => m.role === 'Apprentice' && m.status === 'active').length,
    activeAI: (aiAgents || []).filter(a => a.status === 'active').length,
  }), [members, aiAgents]);

  // Demo data for the dashboard - now using centralized stores
  const FOUNDER_DATA = {
    okrs: okrCounts,
    workPlans: {
      total: workPlanCounts.total,
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

const EXECUTIVE_DATA = {
  myWorkPlans: {
    total: 3,
    inProgress: 2,
    completed: 1,
  },
  apprentices: [
    { name: 'Emily Carter', workPlans: 2, progress: 75 },
    { name: 'David Kim', workPlans: 1, progress: 40 },
  ],
  pendingReviews: 2,
  myFunction: 'Marketing' as BusinessFunction,
  linkedOKRs: 2,
  aiUsage: {
    thisWeek: 12,
    tools: ['ChatGPT', 'Midjourney', 'Claude'],
  },
  aiAgents: [
    { name: 'ChatGPT Enterprise', status: 'active' },
    { name: 'Claude Pro', status: 'active' },
    { name: 'Midjourney', status: 'active' },
  ],
};

const APPRENTICE_DATA = {
  myWorkPlans: {
    active: 3,
    completed: 5,
  },
  assignedBy: {
    executive: 'Priya Sharma',
    founder: 'Sarah Johnson',
  },
  linkedOKR: {
    title: 'Build Brand Awareness & Generate Leads',
    function: 'Marketing' as BusinessFunction,
    progress: 65,
  },
  recentWork: [
    { title: 'Social Media Content Calendar', progress: 80, dueDate: '2026-01-20' },
    { title: 'Competitor Research', progress: 45, dueDate: '2026-01-25' },
    { title: 'Email Campaign Design', progress: 100, dueDate: '2026-01-15' },
  ],
  aiTools: ['ChatGPT', 'Canva AI', 'Grammarly'],
  teamMembers: [
    { name: 'Priya Sharma', role: 'Executive', function: 'Marketing' },
    { name: 'Sarah Johnson', role: 'Founder' },
  ],
};

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
        {/* Role Header */}
        <LinearGradient
          colors={getRoleGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 24, paddingTop: insets.top + 20, paddingBottom: 20 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white/80 text-sm font-medium">FOUNDER COMMAND CENTER</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {currentWorkspace.name}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1.5 rounded-full">
              <Text className="text-white text-xs font-bold">FOUNDER</Text>
            </View>
          </View>
          <Text className="text-white/90 text-sm">
            Overall company oversight • Strategy • Approvals
          </Text>
        </LinearGradient>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* Quick Stats */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => router.push('/financial-dashboard')}
                className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800 active:opacity-70"
              >
                <Text className="text-purple-700 dark:text-purple-300 text-xs font-semibold mb-1">
                  RUNWAY
                </Text>
                <Text className="text-purple-900 dark:text-purple-100 text-2xl font-bold">
                  {FOUNDER_DATA.financials.runway.toFixed(1)}
                </Text>
                <Text className="text-purple-600 dark:text-purple-400 text-xs">months</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/decide')}
                className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800 active:opacity-70"
              >
                <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
                  OKRs ON TRACK
                </Text>
                <Text className="text-emerald-900 dark:text-emerald-100 text-2xl font-bold">
                  {FOUNDER_DATA.okrs.onTrack}/{FOUNDER_DATA.okrs.total}
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-400 text-xs">75% healthy</Text>
              </Pressable>
            </View>

            {/* Pending Approvals */}
            {FOUNDER_DATA.pendingApprovals > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/decide')}
                className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 mb-4 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center">
                      <AlertCircle size={24} color="#fff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-amber-900 dark:text-amber-100 font-bold text-base">
                        {FOUNDER_DATA.pendingApprovals} Pending Approvals
                      </Text>
                      <Text className="text-amber-700 dark:text-amber-300 text-sm">
                        Resource allocation requests need review
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={20} color="#f59e0b" />
                </View>
              </Pressable>
            )}

            {/* OKRs by Function */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  OKRs by Function
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/decide')}>
                  <Text className="text-blue-500 text-sm font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="gap-2">
                {[
                  { function: 'Marketing', okrs: 1, status: 'on-track', progress: 65 },
                  { function: 'Sales', okrs: 1, status: 'on-track', progress: 67 },
                  { function: 'Engineering', okrs: 2, status: 'at-risk', progress: 58 },
                  { function: 'Ops', okrs: 1, status: 'on-track', progress: 72 },
                  { function: 'Finance', okrs: 2, status: 'on-track', progress: 80 },
                  { function: 'Admin', okrs: 1, status: 'on-track', progress: 75 },
                ].map((item, idx) => {
                  const functionColor = getFunctionColor(item.function as BusinessFunction);
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => router.push({
                        pathname: '/(tabs)/decide',
                        params: { function: item.function }
                      })}
                      className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center flex-1">
                          <View
                            className="w-8 h-8 rounded-lg items-center justify-center"
                            style={{ backgroundColor: functionColor + '20' }}
                          >
                            <Target size={16} color={functionColor} />
                          </View>
                          <View className="ml-3 flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                              {item.function}
                            </Text>
                            <Text className="text-gray-600 dark:text-slate-400 text-xs">
                              {item.okrs} OKR{item.okrs !== 1 ? 's' : ''} • {item.status.replace('-', ' ')}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-gray-900 dark:text-white font-bold text-base">
                          {item.progress}%
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <View
                          className="h-full bg-emerald-500"
                          style={{ width: `${item.progress}%` }}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Work Plans Overview */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-gray-900 dark:text-white text-lg font-bold">
                    Work Plans
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                    Structured tasks assigned to apprentices
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/(tabs)/do')}>
                  <Text className="text-blue-500 text-sm font-semibold">View All</Text>
                </Pressable>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => router.push('/(tabs)/do')}
                  className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 active:opacity-70"
                >
                  <Briefcase size={24} color="#3b82f6" />
                  <Text className="text-blue-900 dark:text-blue-100 text-2xl font-bold mt-2">
                    {FOUNDER_DATA.workPlans.inProgress}
                  </Text>
                  <Text className="text-blue-600 dark:text-blue-400 text-xs">Active Now</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(tabs)/evaluate')}
                  className="flex-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 active:opacity-70"
                >
                  <Clock size={24} color="#a855f7" />
                  <Text className="text-purple-900 dark:text-purple-100 text-2xl font-bold mt-2">
                    {FOUNDER_DATA.workPlans.total}
                  </Text>
                  <Text className="text-purple-600 dark:text-purple-400 text-xs">Total Active</Text>
                </Pressable>
              </View>
            </View>

            {/* Team Overview */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">
                Team
              </Text>

              <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800">
                <Pressable
                  onPress={() => router.push('/create-team')}
                  className="flex-row items-center justify-between mb-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Users size={20} color="#3b82f6" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      {FOUNDER_DATA.team.executives} Executives
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#3b82f6" />
                </Pressable>

                <Pressable
                  onPress={() => router.push('/create-team')}
                  className="flex-row items-center justify-between mb-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Award size={20} color="#10b981" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      {FOUNDER_DATA.team.apprentices} Apprentices
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#10b981" />
                </Pressable>

                <Pressable
                  onPress={() => router.push('/create-team')}
                  className="flex-row items-center justify-between mb-4 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Bot size={20} color="#8b5cf6" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      {FOUNDER_DATA.team.aiAgents} AI Agents
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#8b5cf6" />
                </Pressable>

                {/* Manage Team Button */}
                <Pressable
                  onPress={() => router.push('/create-team')}
                  className="bg-blue-500 rounded-xl py-3 items-center active:opacity-80"
                >
                  <Text className="text-white text-sm font-bold">
                    Manage Team
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Financial Overview */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  Financial Overview
                </Text>
                <Pressable onPress={() => router.push('/financial-dashboard')}>
                  <Text className="text-blue-500 text-sm font-semibold">Full Dashboard</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push('/financial-dashboard')}
                className="active:opacity-80"
              >
                <LinearGradient
                  colors={['#10b981', '#14b8a6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, padding: 16, marginBottom: 12 }}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-emerald-100 text-xs font-semibold mb-1">RUNWAY</Text>
                      <Text className="text-white text-3xl font-bold">
                        {FOUNDER_DATA.financials.runway.toFixed(1)} months
                      </Text>
                    </View>
                    <BarChart3 size={32} color="#fff" />
                  </View>

                  <View className="h-px bg-white/20 mb-3" />

                  <View className="flex-row gap-4 mb-2">
                    <View className="flex-1">
                      <Text className="text-emerald-100 text-xs mb-1">Monthly Revenue</Text>
                      <Text className="text-white text-lg font-bold">
                        £{(FOUNDER_DATA.financials.revenue / 1000).toFixed(0)}K
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-emerald-100 text-xs mb-1">Monthly Burn</Text>
                      <Text className="text-white text-lg font-bold">
                        £{(FOUNDER_DATA.financials.burnRate / 1000).toFixed(0)}K
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-4 mb-2">
                    <View className="flex-1">
                      <Text className="text-emerald-100 text-xs mb-1">Net Cash Flow</Text>
                      <Text className="text-white text-lg font-bold">
                        {FOUNDER_DATA.financials.netCashFlow >= 0 ? '+' : ''}£{(FOUNDER_DATA.financials.netCashFlow / 1000).toFixed(0)}K
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-emerald-100 text-xs mb-1">Cash Position</Text>
                      <Text className="text-white text-lg font-bold">
                        £{((FOUNDER_DATA.financials.runway * FOUNDER_DATA.financials.burnRate) / 1000).toFixed(0)}K
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-center mt-2">
                    <Text className="text-white text-sm font-semibold">Tap for detailed breakdown</Text>
                    <ArrowRight size={16} color="#fff" className="ml-1" />
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Cost Breakdown */}
              <Pressable
                onPress={() => router.push('/financial-dashboard')}
                className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-900 dark:text-white font-bold text-sm">
                    Monthly Cost Breakdown
                  </Text>
                  <ArrowRight size={20} color="#64748b" />
                </View>

                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">
                        Team ({orgCounts.executives} Execs + {orgCounts.apprentices} Apprentices)
                      </Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                      £{Math.round(costBreakdown.team / 1000)}K
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Manufacturing & Suppliers</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                      £{Math.round(costBreakdown.manufacturing / 1000)}K
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-cyan-500 mr-2" />
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">
                        AI Tools & Software ({personLoadouts.flatMap(l => l.aiToolIds || []).length} equipped)
                      </Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                      £{Math.round(actualAIToolCost / 1000)}K
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Infrastructure & Ops</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                      £{Math.round(costBreakdown.infrastructure / 1000)}K
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-pink-500 mr-2" />
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Marketing & Sales</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                      £{Math.round(costBreakdown.marketing / 1000)}K
                    </Text>
                  </View>

                  <View className="h-px bg-gray-300 dark:bg-slate-700 my-1" />

                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">Total Monthly Burn</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-base">
                      £{Math.round(adjustedMonthlyBurn / 1000)}K
                    </Text>
                  </View>
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
    const functionColor = getFunctionColor(EXECUTIVE_DATA.myFunction);

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
                {EXECUTIVE_DATA.myFunction}
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
            {EXECUTIVE_DATA.pendingReviews > 0 && (
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
                        {EXECUTIVE_DATA.pendingReviews} Work Submissions to Review
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
                    {EXECUTIVE_DATA.myWorkPlans.inProgress}
                  </Text>
                </View>
                <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                  <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
                    COMPLETED
                  </Text>
                  <Text className="text-emerald-900 dark:text-emerald-100 text-2xl font-bold">
                    {EXECUTIVE_DATA.myWorkPlans.completed}
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
                  params: { function: EXECUTIVE_DATA.myFunction }
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
                      {EXECUTIVE_DATA.myFunction}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">
                      {EXECUTIVE_DATA.linkedOKRs} linked OKRs
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
                {EXECUTIVE_DATA.apprentices.map((apprentice, idx) => (
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
                        {EXECUTIVE_DATA.aiUsage.thisWeek}
                      </Text>
                      <ArrowRight size={16} color="#64748b" />
                    </View>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {EXECUTIVE_DATA.aiUsage.tools.map((tool, idx) => (
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
                        {EXECUTIVE_DATA.aiAgents.length}
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
    const functionColor = getFunctionColor(APPRENTICE_DATA.linkedOKR.function);

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
                    {APPRENTICE_DATA.myWorkPlans.active}
                  </Text>
                </View>
                <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
                    COMPLETED
                  </Text>
                  <Text className="text-blue-900 dark:text-blue-100 text-2xl font-bold">
                    {APPRENTICE_DATA.myWorkPlans.completed}
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
                        {APPRENTICE_DATA.linkedOKR.function}
                      </Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                      {APPRENTICE_DATA.linkedOKR.title}
                    </Text>
                  </View>
                </View>
                <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mb-1">
                  <View
                    className="h-full bg-emerald-500"
                    style={{ width: `${APPRENTICE_DATA.linkedOKR.progress}%` }}
                  />
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">
                  {APPRENTICE_DATA.linkedOKR.progress}% progress • Your work contributes to this
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
                {APPRENTICE_DATA.recentWork.map((work, idx) => (
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
                {APPRENTICE_DATA.teamMembers.map((member, idx) => (
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
                    {idx === APPRENTICE_DATA.teamMembers.length - 1 && (
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
                    {APPRENTICE_DATA.aiTools.map((tool, idx) => (
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
