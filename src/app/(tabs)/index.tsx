/**
 * Mission Control Home Screen
 * Command center for solo entrepreneurs - everything needed to make decisions
 */

import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Target,
  Trophy,
  AlertTriangle,
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  User,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Activity,
  Package,
  ShoppingCart,
  HelpCircle,
  FileText,
  Book,
  Rocket,
  Wallet,
  BarChart3,
  PieChart,
  Play,
  UserPlus,
  Briefcase,
} from 'lucide-react-native';

// Stores
import { useTechTreeStore } from '@/lib/state/tech-tree-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useOKRStore } from '@/lib/state/okr-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { useResourceStore } from '@/lib/state/resource-store';
import { useSupplierStore } from '@/lib/state/supplier-store';
import { useFinanceStore } from '@/lib/state/finance-store';

// Mission Control Logic
import {
  selectMainQuest,
  getCriticalItems,
  calculateTUAllocation,
  calculateCompanyHealth,
  type MainQuest,
  type CriticalItem,
} from '@/lib/mission-control';

// Components
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { BusinessImprovements } from '@/components/BusinessImprovements';
import { autoSeedDemoDataIfNeeded } from '@/lib/seed-demo-data';
import { getWeekCounterInfo } from '@/lib/time-utils';
import { useMarketplaceRequestsStore } from '@/lib/state/marketplace-requests-store';
import { useRequestStore } from '@/lib/state/request-store';
import { MiniGanttChart } from '@/components/MiniGanttChart';

const HOME_HELP: HelpContent = {
  title: 'Mission Control',
  subtitle: 'Perceive → Act → Reflect',
  description: 'Your command center organized around how entrepreneurs make decisions: understand where you are, take immediate action, and reflect deeply on strategy.',
  tips: [
    'PERCEIVING shows business health, runway, progress, and blockers at a glance',
    'ACTING surfaces decisions and tasks that need immediate attention right now',
    'REFLECTING provides tools for deep analysis of performance, market, and customers',
    'All sections are real-time and actionable - tap any card to drill deeper',
  ],
  quickActions: [
    { label: 'Perceive', description: 'Understand your current business state and trajectory' },
    { label: 'Act', description: 'Make decisions and unblock progress immediately' },
    { label: 'Reflect', description: 'Analyze performance, market, and strategic direction' },
  ],
};

export default function MissionControlHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [showHelp, setShowHelp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Stores
  const currentWorkspace = useCurrentWorkspace();
  const initialize = useTechTreeStore((s) => s.initialize);
  const nodeProgress = useTechTreeStore((s) => s.nodeProgress);
  const currentLevel = useTechTreeStore((s) => s.currentLevel);
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const members = useOrganizationStore((s) => s.members);
  const okrs = useOKRStore((s) => s.okrs);

  // Resource utilization - Calculate directly from organization members (matching Decide tab logic)
  const resourceCapacity = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active');

    const total = activeMembers.reduce((sum, member) => {
      // Match ResourcePoolHeader capacity calculation
      if (member.role === 'Founder' || member.role === 'Apprentice') {
        return sum + 15; // 10 normal + 5 overtime
      }
      // Executives: days per week * 2 TU per day + overtime
      const daysPerWeek = member.daysPerWeek || 2;
      const normalSquares = daysPerWeek * 2;
      const overtimeSquares = Math.min((5 - daysPerWeek) * 2, 10);
      return sum + normalSquares + overtimeSquares;
    }, 0);

    // Calculate allocated from work plans (excluding completed/abandoned)
    // Match Decide tab logic: count tasks with team assigned (assignedMemberIds)
    const allocated = activeMembers.reduce((sum, member) => {
      const memberAllocated = workPlans
        .filter(wp =>
          wp.status !== 'completed' &&
          wp.status !== 'abandoned' &&
          wp.assignedMemberIds &&
          wp.assignedMemberIds.length > 0
        )
        .reduce((wpSum, wp) => {
          const allocation = wp.allocations?.find(a => a.memberId === member.id);
          return wpSum + (allocation?.squaresPerWeek || 0);
        }, 0);
      return sum + memberAllocated;
    }, 0);

    const available = total - allocated;

    return { total, allocated, available };
  }, [members, workPlans]);

  // Supplier/Manufacturing data
  const suppliers = useSupplierStore((s) => s.suppliers);
  const getFavoriteSupplierIds = useSupplierStore((s) => s.getFavoriteSupplierIds);
  const favoriteSupplierIds = currentWorkspace ? getFavoriteSupplierIds(currentWorkspace.id) : [];
  const activeSuppliers = useMemo(() =>
    suppliers.filter(s => favoriteSupplierIds.includes(s.id) && s.serviceType === 'manufacturing'),
    [suppliers, favoriteSupplierIds]
  );

  // Decision stores
  const allHiringRequests = useMarketplaceRequestsStore((s) => s.requests);
  const allTaskRequests = useRequestStore((s) => s.requests);

  const pendingHiringRequests = useMemo(
    () => allHiringRequests.filter((req) => req.status === 'pending'),
    [allHiringRequests]
  );
  const pendingTaskRequests = useMemo(
    () => allTaskRequests.filter((req) => req.status === 'pending'),
    [allTaskRequests]
  );

  const approveHiringRequest = useMarketplaceRequestsStore((s) => s.approveRequest);
  const rejectHiringRequest = useMarketplaceRequestsStore((s) => s.rejectRequest);
  const approveTaskRequest = useRequestStore((s) => s.approveRequest);
  const rejectTaskRequest = useRequestStore((s) => s.rejectRequest);

  // Initialize stores
  const initializeSuppliers = useSupplierStore((s) => s.initializeSuppliers);

  useEffect(() => {
    initialize();
    autoSeedDemoDataIfNeeded();
    if (suppliers.length === 0) {
      initializeSuppliers();
    }
  }, [initialize, initializeSuppliers, suppliers.length]);

  // Compute Mission Control state
  const mainQuest = useMemo<MainQuest | null>(() => {
    return selectMainQuest(nodeProgress, workPlans);
  }, [nodeProgress, workPlans]);

  const criticalItems = useMemo<CriticalItem[]>(() => {
    return getCriticalItems(workPlans);
  }, [workPlans]);

  const tuAllocation = useMemo(() => {
    return calculateTUAllocation(members, workPlans, mainQuest?.node.id);
  }, [members, workPlans, mainQuest]);

  // Get financials from finance store
  const getCashBalance = useFinanceStore(s => s.getCashBalance);
  const getWeeklyBurn = useFinanceStore(s => s.getWeeklyBurn);
  const getMonthlyRevenue = useFinanceStore(s => s.getMonthlyRevenue);

  const financials = useMemo(() => {
    const totalCash = currentWorkspace ? getCashBalance(currentWorkspace.id) : 0;
    const weeklyBurn = currentWorkspace ? getWeeklyBurn(currentWorkspace.id) : 0;
    const burnPerMonth = weeklyBurn * 4.33; // Convert weekly to monthly (4.33 weeks/month)
    const revenuePerMonth = currentWorkspace ? getMonthlyRevenue(currentWorkspace.id) : 0;

    return {
      totalCash,
      burnPerMonth,
      revenuePerMonth,
    };
  }, [currentWorkspace, getCashBalance, getWeeklyBurn, getMonthlyRevenue]);

  const companyHealth = useMemo(() => {
    return calculateCompanyHealth(financials, okrs);
  }, [financials, okrs]);

  const netCashFlow = financials.revenuePerMonth - financials.burnPerMonth;
  const runway = netCashFlow >= 0 ? 999 : financials.totalCash / Math.abs(netCashFlow);

  // Count actionable items
  const blockedTasks = workPlans.filter(wp => wp.status === 'blocked').length;
  const queuedTasks = workPlans.filter(wp => wp.status === 'not-started').length;
  const activeTasks = workPlans.filter(wp => wp.status === 'in-progress').length;
  const totalDecisions = pendingHiringRequests.length + pendingTaskRequests.length;

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const tuBankRemaining = tuAllocation.remaining;
  const runwayDisplay =
    companyHealth.runwayMonths !== null
      ? `${companyHealth.runwayMonths.toFixed(1)}mo`
      : '∞';

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={HOME_HELP}
        gradientColors={['#7c3aed', '#3b82f6']}
      />

      {/* Header */}
      <LinearGradient
        colors={['#7c3aed', '#6d28d9', '#5b21b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 16,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">
              COMMAND CENTER
            </Text>
            <Text className="text-white text-2xl font-bold">
              Mission Control
            </Text>
          </View>
          <HelpButton onPress={() => setShowHelp(true)} />
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* ===== PERCEIVING ===== */}
        <View className="px-5 pt-5">
          <View className="flex-row items-center gap-2 mb-3">
            <Activity size={18} color="#3b82f6" />
            <Text className="text-slate-900 dark:text-white text-base font-bold uppercase tracking-wide">
              Perceiving
            </Text>
          </View>
          <Text className="text-slate-600 dark:text-slate-400 text-xs mb-4 leading-relaxed">
            Where am I? Where am I going? What's the health of my business?
          </Text>

          {/* Time Horizon: This Week vs Next Week */}
          <View className="mb-4">
            <View className="flex-row gap-3">
              {/* This Week */}
              <View className="flex-1">
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white/80 text-xs font-bold uppercase">This Week</Text>
                    <Clock size={16} color="#fff" />
                  </View>
                  <Text className="text-white text-2xl font-bold mb-1">
                    {activeTasks}
                  </Text>
                  <Text className="text-white/80 text-xs">
                    Active tasks
                  </Text>
                  {blockedTasks > 0 && (
                    <View className="mt-2 bg-white/20 rounded-lg px-2 py-1">
                      <Text className="text-white text-xs font-semibold">
                        {blockedTasks} blocked
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </View>

              {/* Next Week */}
              <View className="flex-1">
                <LinearGradient
                  colors={['#a855f7', '#9333ea']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white/80 text-xs font-bold uppercase">Next Week</Text>
                    <ArrowRight size={16} color="#fff" />
                  </View>
                  <Text className="text-white text-2xl font-bold mb-1">
                    {queuedTasks}
                  </Text>
                  <Text className="text-white/80 text-xs">
                    Ready to start
                  </Text>
                  {totalDecisions > 0 && (
                    <View className="mt-2 bg-white/20 rounded-lg px-2 py-1">
                      <Text className="text-white text-xs font-semibold">
                        {totalDecisions} decisions
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Critical Metrics Grid */}
          <View className="flex-row gap-3 mb-3">
            {/* Financial Runway */}
            <Pressable
              onPress={() => router.push('/financial-dashboard')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Wallet size={20} color={runway < 6 ? "#ef4444" : runway < 12 ? "#f59e0b" : "#10b981"} />
                <Text className={`text-xs font-bold ${
                  runway < 6 ? 'text-red-500' : runway < 12 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {runway < 6 ? 'CRITICAL' : runway < 12 ? 'MONITOR' : 'HEALTHY'}
                </Text>
              </View>
              <Text className="text-slate-600 dark:text-slate-400 text-xs mb-1">Runway</Text>
              <Text className="text-slate-900 dark:text-white text-2xl font-bold">
                {runway === 999 ? '∞' : `${runway.toFixed(0)}mo`}
              </Text>
              <Text className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                £{(financials.totalCash / 1000).toFixed(0)}K cash
              </Text>
            </Pressable>

            {/* Active Tasks ETA */}
            <Pressable
              onPress={() => router.push('/(tabs)/decide')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Clock size={20} color="#3b82f6" />
                <Text className="text-xs font-bold text-blue-500">
                  {activeTasks} ACTIVE
                </Text>
              </View>
              <Text className="text-slate-600 dark:text-slate-400 text-xs mb-1">Avg. ETA</Text>
              <Text className="text-slate-900 dark:text-white text-2xl font-bold">
                {tuAllocation.topActiveTasks[0]?.etaDays || 0}d
              </Text>
              <Text className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                Fastest task
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-3 mb-3">
            {/* OKR Progress */}
            <Pressable
              onPress={() => router.push('/(tabs)/evaluate')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Target size={20} color="#8b5cf6" />
                <Text className="text-xs font-bold text-purple-500">
                  OKRs
                </Text>
              </View>
              <Text className="text-slate-600 dark:text-slate-400 text-xs mb-1">On Track</Text>
              <Text className="text-slate-900 dark:text-white text-2xl font-bold">
                {companyHealth.okrsOnTrack}/{companyHealth.okrsTotal}
              </Text>
              <Text className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                {Math.round((companyHealth.okrsOnTrack / (companyHealth.okrsTotal || 1)) * 100)}% completion
              </Text>
            </Pressable>

            {/* Team Utilization */}
            <Pressable
              onPress={() => router.push('/(tabs)/community')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Users size={20} color="#10b981" />
                <Text className="text-xs font-bold text-emerald-500">
                  {Math.round((resourceCapacity.allocated / resourceCapacity.total) * 100)}%
                </Text>
              </View>
              <Text className="text-slate-600 dark:text-slate-400 text-xs mb-1">Utilization</Text>
              <Text className="text-slate-900 dark:text-white text-2xl font-bold">
                {resourceCapacity.allocated}/{resourceCapacity.total}
              </Text>
              <Text className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                TU allocated
              </Text>
            </Pressable>
          </View>

          {/* Blockers Banner - Only show if any exist */}
          {(blockedTasks > 0 || totalDecisions > 0) && (
            <Pressable
              onPress={() => router.push('/(tabs)/do')}
              className="active:opacity-70"
            >
              <LinearGradient
                colors={['#ef4444', '#f59e0b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="bg-white/20 rounded-full p-2">
                    <AlertTriangle size={20} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">
                      {blockedTasks + totalDecisions} Items Need Attention
                    </Text>
                    <Text className="text-white/80 text-xs mt-0.5">
                      {blockedTasks} blocked • {totalDecisions} decisions pending
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          )}

          {/* What's Happening: Weekly Activity Timeline */}
          <View className="mt-4">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold mb-3">
              What's Happening
            </Text>

            {/* This Week's Active Tasks */}
            {tuAllocation.topActiveTasks.length > 0 && (
              <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase">
                    This Week
                  </Text>
                  <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                    <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                      In Progress
                    </Text>
                  </View>
                </View>
                {tuAllocation.topActiveTasks.slice(0, 3).map((task) => (
                  <Pressable
                    key={task.id}
                    onPress={() => router.push('/(tabs)/do')}
                    className="flex-row items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 last:border-b-0 active:opacity-70"
                  >
                    <View className="flex-1">
                      <Text className="text-slate-900 dark:text-white text-sm font-medium" numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-500 text-xs mt-0.5">
                        {task.ownerInitials}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {task.etaDays && (
                        <View className="bg-blue-500/10 px-2.5 py-1 rounded-lg">
                          <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                            {task.etaDays}d left
                          </Text>
                        </View>
                      )}
                      <ChevronRight size={16} color="#64748b" />
                    </View>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => router.push('/(tabs)/do')}
                  className="flex-row items-center justify-center gap-1 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 active:opacity-70"
                >
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                    View All Active Tasks
                  </Text>
                  <ChevronRight size={14} color="#3b82f6" />
                </Pressable>
              </View>
            )}

            {/* Next Week's Queued Tasks */}
            {queuedTasks > 0 && (
              <View className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-2xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase">
                    Coming Up Next
                  </Text>
                  <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                    <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                      Ready to Start
                    </Text>
                  </View>
                </View>
                {workPlans
                  .filter(wp => wp.status === 'not-started')
                  .slice(0, 3)
                  .map((plan) => (
                    <Pressable
                      key={plan.id}
                      onPress={() => router.push('/(tabs)/decide')}
                      className="flex-row items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 last:border-b-0 active:opacity-70"
                    >
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white text-sm font-medium" numberOfLines={1}>
                          {plan.title}
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-500 text-xs mt-0.5">
                          {plan.function}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <View className="bg-purple-500/10 px-2.5 py-1 rounded-lg">
                          <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                            {plan.estimatedTimeUnits} TU
                          </Text>
                        </View>
                        <ChevronRight size={16} color="#64748b" />
                      </View>
                    </Pressable>
                  ))}
                <Pressable
                  onPress={() => router.push('/(tabs)/decide')}
                  className="flex-row items-center justify-center gap-1 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 active:opacity-70"
                >
                  <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                    Allocate & Start Tasks
                  </Text>
                  <ChevronRight size={14} color="#8b5cf6" />
                </Pressable>
              </View>
            )}
          </View>

          {/* Team Health & People Intelligence */}
          <View className="mt-4">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold mb-3">
              Team Health
            </Text>

            <Pressable
              onPress={() => router.push('/(tabs)/community')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
            >
              {/* Team Summary Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <Users size={18} color="#10b981" />
                  <Text className="text-slate-900 dark:text-white font-bold text-sm">
                    {members.length} Team Members
                  </Text>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </View>

              {/* Capacity Overview */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-3">
                  <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
                    UTILIZED
                  </Text>
                  <Text className="text-emerald-900 dark:text-emerald-100 text-xl font-bold">
                    {resourceCapacity.total > 0
                      ? `${Math.round((resourceCapacity.allocated / resourceCapacity.total) * 100)}%`
                      : '0%'}
                  </Text>
                  <Text className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">
                    {resourceCapacity.allocated} of {resourceCapacity.total} TU
                  </Text>
                </View>
                <View className="flex-1 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">
                    AVAILABLE
                  </Text>
                  <Text className="text-blue-900 dark:text-blue-100 text-xl font-bold">
                    {resourceCapacity.available} TU
                  </Text>
                  <Text className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                    {resourceCapacity.available > 0
                      ? 'Can start new work'
                      : resourceCapacity.total === 0
                        ? 'No team members'
                        : 'Team at capacity'}
                  </Text>
                </View>
              </View>

              {/* Top Contributors */}
              {members.length > 0 && (
                <View>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold mb-2 uppercase">
                    Who's Doing What
                  </Text>
                  {members
                    .map((member) => {
                      // Calculate member's workload - match Decide tab logic
                      const memberTasks = workPlans.filter(wp =>
                        wp.status !== 'completed' &&
                        wp.status !== 'abandoned' &&
                        wp.assignedMemberIds &&
                        wp.assignedMemberIds.length > 0 &&
                        wp.allocations?.some(a => a.memberId === member.id)
                      );
                      const allocatedTU = workPlans
                        .filter(wp =>
                          wp.status !== 'completed' &&
                          wp.status !== 'abandoned' &&
                          wp.assignedMemberIds &&
                          wp.assignedMemberIds.length > 0
                        )
                        .reduce((sum, wp) => {
                          const allocation = wp.allocations?.find(a => a.memberId === member.id);
                          return sum + (allocation?.squaresPerWeek || 0);
                        }, 0);

                      // Calculate capacity based on role (including overtime to match header)
                      const maxCapacity = member.role === 'Founder' || member.role === 'Apprentice' ? 15 :
                                         (() => {
                                           const daysPerWeek = member.daysPerWeek || 2;
                                           const normalSquares = daysPerWeek * 2;
                                           const overtimeSquares = Math.min((5 - daysPerWeek) * 2, 10);
                                           return normalSquares + overtimeSquares;
                                         })();

                      const utilizationPercent = maxCapacity > 0
                        ? Math.round((allocatedTU / maxCapacity) * 100)
                        : 0;

                      return {
                        ...member,
                        allocatedTU,
                        maxCapacity,
                        utilizationPercent,
                        activeTasks: memberTasks.length,
                      };
                    })
                    .sort((a, b) => b.allocatedTU - a.allocatedTU) // Sort by workload (highest first)
                    .slice(0, 5) // Top 5 team members
                    .map((member) => (
                      <View
                        key={member.id}
                        className="flex-row items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 last:border-b-0"
                      >
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 mb-1">
                            <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                              {member.name}
                            </Text>
                            {member.utilizationPercent >= 100 && (
                              <View className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                                <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
                                  FULL
                                </Text>
                              </View>
                            )}
                            {member.utilizationPercent === 0 && (
                              <View className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                                  IDLE
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-slate-500 dark:text-slate-500 text-xs">
                            {member.role} • {member.function} • {member.activeTasks} {member.activeTasks === 1 ? 'task' : 'tasks'}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-slate-900 dark:text-white text-sm font-bold">
                            {member.allocatedTU}/{member.maxCapacity} TU
                          </Text>
                          <Text className={`text-xs font-semibold ${
                            member.utilizationPercent >= 100 ? 'text-red-500' :
                            member.utilizationPercent >= 80 ? 'text-amber-500' :
                            member.utilizationPercent === 0 ? 'text-slate-400' :
                            'text-emerald-500'
                          }`}>
                            {member.utilizationPercent}%
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>
              )}

              {/* Capacity Alert */}
              {resourceCapacity.available < 5 && resourceCapacity.available > 0 && (
                <View className="mt-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <Text className="text-amber-700 dark:text-amber-400 text-xs font-semibold">
                    ⚠️ Low Capacity: Only {resourceCapacity.available} TU available. Consider hiring or reallocating.
                  </Text>
                </View>
              )}
              {resourceCapacity.available === 0 && (
                <View className="mt-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <Text className="text-red-700 dark:text-red-400 text-xs font-semibold">
                    🚨 No Capacity: Team is fully allocated. Cannot start new work without hiring or pausing tasks.
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Time Allocation by Function - NEW */}
          <View className="mt-4">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold mb-3">
              Weekly Time Allocation
            </Text>
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <Text className="text-slate-600 dark:text-slate-400 text-xs mb-3">
                Where is your team spending time this week?
              </Text>

              {(() => {
                // Calculate TU allocation by function
                const functionAllocation: Record<string, number> = {
                  'Marketing': 0,
                  'Sales': 0,
                  'Engineering': 0,
                  'Ops': 0,
                  'Finance': 0,
                  'Admin': 0,
                };

                // Sum up allocations from active work plans
                workPlans
                  .filter(wp => wp.status === 'in-progress' || wp.status === 'not-started')
                  .forEach(wp => {
                    const weeklyAllocation = wp.allocations?.reduce((sum, alloc) => sum + alloc.squaresPerWeek, 0) || 0;
                    if (wp.function && functionAllocation.hasOwnProperty(wp.function)) {
                      functionAllocation[wp.function] += weeklyAllocation;
                    }
                  });

                const totalAllocated = Object.values(functionAllocation).reduce((sum, val) => sum + val, 0);

                // Function colors
                const functionColors: Record<string, string> = {
                  'Marketing': '#ec4899',
                  'Sales': '#10b981',
                  'Engineering': '#3b82f6',
                  'Ops': '#f59e0b',
                  'Finance': '#8b5cf6',
                  'Admin': '#64748b',
                };

                // Sort by allocation (highest first)
                const sortedFunctions = Object.entries(functionAllocation)
                  .sort(([, a], [, b]) => b - a)
                  .filter(([, allocation]) => allocation > 0);

                if (totalAllocated === 0) {
                  return (
                    <View className="py-6 items-center">
                      <Text className="text-slate-400 dark:text-slate-500 text-xs text-center">
                        No active work allocated yet
                      </Text>
                    </View>
                  );
                }

                return (
                  <>
                    {/* Visual Bar Chart */}
                    <View className="mb-4">
                      <View className="flex-row h-2 rounded-full overflow-hidden">
                        {sortedFunctions.map(([func, allocation]) => {
                          const percentage = (allocation / totalAllocated) * 100;
                          if (percentage < 1) return null; // Hide tiny segments
                          return (
                            <View
                              key={func}
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: functionColors[func],
                              }}
                            />
                          );
                        })}
                      </View>
                    </View>

                    {/* Function Breakdown */}
                    <View className="gap-2">
                      {sortedFunctions.map(([func, allocation]) => {
                        const percentage = totalAllocated > 0 ? Math.round((allocation / totalAllocated) * 100) : 0;
                        return (
                          <View key={func} className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2 flex-1">
                              <View
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: functionColors[func] }}
                              />
                              <Text className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                                {func}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                {allocation} TU
                              </Text>
                              <Text className="text-slate-900 dark:text-white text-xs font-bold w-10 text-right">
                                {percentage}%
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Total */}
                    <View className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex-row justify-between">
                      <Text className="text-slate-700 dark:text-slate-300 text-xs font-bold">
                        Total Allocated
                      </Text>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        {totalAllocated} TU/week
                      </Text>
                    </View>

                    {/* Insights */}
                    {(() => {
                      const topFunction = sortedFunctions[0];
                      if (!topFunction) return null;
                      const [funcName, allocation] = topFunction;
                      const percentage = Math.round((allocation / totalAllocated) * 100);

                      if (percentage > 50) {
                        return (
                          <View className="mt-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                            <Text className="text-amber-700 dark:text-amber-400 text-xs">
                              ⚠️ {percentage}% of time on {funcName} - consider if this aligns with current priorities
                            </Text>
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </>
                );
              })()}
            </View>
          </View>

          {/* Team Composition Analysis: Apprentices vs Executives */}
          <View className="mt-4">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold mb-3">
              Team Composition Strategy
            </Text>

            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4">
              <Text className="text-slate-600 dark:text-slate-400 text-xs mb-4 leading-relaxed">
                Should you hire many apprentices with AI tools, or a few experienced executives? Compare output vs cost:
              </Text>

              {/* Comparison Cards */}
              <View className="gap-3">
                {/* Many Apprentices + AI */}
                <View className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">👥</Text>
                      <View>
                        <Text className="text-slate-900 dark:text-white font-bold text-sm">
                          Many Apprentices + AI
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-400 text-xs">
                          High volume, AI-assisted
                        </Text>
                      </View>
                    </View>
                    <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                      <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        SCALABLE
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2 mb-3">
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Team Size:
                      </Text>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        5 Apprentices
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Base Capacity:
                      </Text>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        50 TU/week (10 each)
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        With AI (5x):
                      </Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        250 TU/week effective
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Monthly Cost:
                      </Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        £10K (£2K each)
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Cost per TU:
                      </Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        £40/TU
                      </Text>
                    </View>
                  </View>

                  <View className="border-t border-emerald-200 dark:border-emerald-800 pt-3">
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
                      ✅ Pros: Low cost, high output, easily scalable
                    </Text>
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      ❌ Cons: Need oversight, AI dependency, quality varies
                    </Text>
                  </View>
                </View>

                {/* Balanced Mix */}
                <View className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">⚖️</Text>
                      <View>
                        <Text className="text-slate-900 dark:text-white font-bold text-sm">
                          Balanced Mix
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-400 text-xs">
                          Executives + Apprentices
                        </Text>
                      </View>
                    </View>
                    <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                        RECOMMENDED
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2 mb-3">
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Team Size:
                      </Text>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        2 Execs + 3 Apprentices
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Base Capacity:
                      </Text>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        38 TU/week (8+30)
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        With AI (3x avg):
                      </Text>
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                        114 TU/week effective
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Monthly Cost:
                      </Text>
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                        £14K (£4K each exec)
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Cost per TU:
                      </Text>
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                        £123/TU
                      </Text>
                    </View>
                  </View>

                  <View className="border-t border-blue-300 dark:border-blue-700 pt-3">
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
                      ✅ Pros: High quality, good mentorship, balanced cost
                    </Text>
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      ⚠️ Cons: More expensive per TU than pure apprentices
                    </Text>
                  </View>
                </View>

                {/* Few Executives */}
                <View className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">👔</Text>
                      <View>
                        <Text className="text-slate-900 dark:text-white font-bold text-sm">
                          Few Executives
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-400 text-xs">
                          High expertise, premium cost
                        </Text>
                      </View>
                    </View>
                    <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-lg">
                      <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                        QUALITY
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2 mb-3">
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Team Size:
                      </Text>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        3 Executives
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Base Capacity:
                      </Text>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        12 TU/week (4 each)
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        With AI (2x):
                      </Text>
                      <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                        24 TU/week effective
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Monthly Cost:
                      </Text>
                      <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                        £12K (£4K each)
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Cost per TU:
                      </Text>
                      <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold">
                        £500/TU
                      </Text>
                    </View>
                  </View>

                  <View className="border-t border-purple-200 dark:border-purple-800 pt-3">
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
                      ✅ Pros: Highest quality, strategic thinking, self-sufficient
                    </Text>
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      ❌ Cons: Very expensive, limited capacity, hard to scale
                    </Text>
                  </View>
                </View>
              </View>

              {/* Key Insight */}
              <View className="mt-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <Text className="text-amber-700 dark:text-amber-400 text-xs font-semibold leading-relaxed">
                  💡 Key Insight: With 5x AI multiplier, 5 apprentices (£10K) deliver 10x more output than 3 executives (£12K) at similar cost. But executives provide strategy and quality oversight.
                </Text>
              </View>
            </View>
          </View>

          {/* Pace & Runway Scenarios: Tortoise vs Hare */}
          <View className="mt-4">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold mb-3">
              Pace & Runway Scenarios
            </Text>

            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <Text className="text-slate-600 dark:text-slate-400 text-xs mb-4 leading-relaxed">
                Should you sprint fast and risk running out of cash, or move slowly and risk missing the market? Compare three scenarios:
              </Text>

              {/* Scenario Cards */}
              <View className="gap-3">
                {/* HARE: Fast Sprint */}
                <View className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">🐇</Text>
                      <View>
                        <Text className="text-slate-900 dark:text-white font-bold text-sm">
                          Hare (Sprint)
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-400 text-xs">
                          Max speed, high burn
                        </Text>
                      </View>
                    </View>
                    <View className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-lg">
                      <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
                        RISKY
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2 mb-3">
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Team Size:
                      </Text>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        {members.length + 2} (+2 hires)
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Monthly Burn:
                      </Text>
                      <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
                        £{((financials.burnPerMonth * 1.6) / 1000).toFixed(1)}K
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Time to Launch:
                      </Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        ~2 months
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Runway Left:
                      </Text>
                      <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
                        {Math.floor(financials.totalCash / (financials.burnPerMonth * 1.6))}mo
                      </Text>
                    </View>
                  </View>

                  <View className="border-t border-red-200 dark:border-red-800 pt-3">
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
                      ✅ Pros: Fast to market, capitalize on opportunity
                    </Text>
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      ❌ Cons: Risk running out of cash before revenue
                    </Text>
                  </View>
                </View>

                {/* BALANCED: Middle Ground */}
                <View className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">⚖️</Text>
                      <View>
                        <Text className="text-slate-900 dark:text-white font-bold text-sm">
                          Balanced
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-400 text-xs">
                          Steady pace, managed risk
                        </Text>
                      </View>
                    </View>
                    <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                        RECOMMENDED
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2 mb-3">
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Team Size:
                      </Text>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        {members.length + 1} (+1 hire)
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Monthly Burn:
                      </Text>
                      <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                        £{((financials.burnPerMonth * 1.2) / 1000).toFixed(1)}K
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Time to Launch:
                      </Text>
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                        ~4 months
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Runway Left:
                      </Text>
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                        {Math.floor(financials.totalCash / (financials.burnPerMonth * 1.2))}mo
                      </Text>
                    </View>
                  </View>

                  <View className="border-t border-blue-300 dark:border-blue-700 pt-3">
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
                      ✅ Pros: Good speed, sustainable runway, time to pivot
                    </Text>
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      ⚠️ Cons: May miss fleeting opportunities
                    </Text>
                  </View>
                </View>

                {/* TORTOISE: Slow & Steady */}
                <View className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl">🐢</Text>
                      <View>
                        <Text className="text-slate-900 dark:text-white font-bold text-sm">
                          Tortoise (Steady)
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-400 text-xs">
                          Low burn, long runway
                        </Text>
                      </View>
                    </View>
                    <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                      <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        SAFE
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2 mb-3">
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Team Size:
                      </Text>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        {members.length} (current)
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Monthly Burn:
                      </Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        £{(financials.burnPerMonth / 1000).toFixed(1)}K
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Time to Launch:
                      </Text>
                      <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                        ~6 months
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs">
                        Runway Left:
                      </Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        {Math.floor(financials.totalCash / financials.burnPerMonth)}mo
                      </Text>
                    </View>
                  </View>

                  <View className="border-t border-emerald-200 dark:border-emerald-800 pt-3">
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
                      ✅ Pros: Maximum runway, time to iterate, less risk
                    </Text>
                    <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      ❌ Cons: Slow to market, may miss opportunity window
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action CTA */}
              <Pressable
                onPress={() => router.push('/financial-dashboard')}
                className="mt-4 bg-blue-500 rounded-xl py-3 items-center active:opacity-70"
              >
                <Text className="text-white text-sm font-bold">
                  Explore Financial Scenarios
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ===== ACTING ===== */}
        <View className="px-5 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Zap size={18} color="#f59e0b" />
            <Text className="text-slate-900 dark:text-white text-base font-bold uppercase tracking-wide">
              Acting
            </Text>
          </View>
          <Text className="text-slate-600 dark:text-slate-400 text-xs mb-4 leading-relaxed">
            What must I do right now based on what I perceive?
          </Text>

          {/* Decisions Needed */}
          {totalDecisions > 0 && (
            <View className="mb-3">
              <View className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <AlertCircle size={18} color="#f59e0b" />
                    <Text className="text-slate-900 dark:text-white font-bold text-sm">
                      Decisions Needed
                    </Text>
                  </View>
                  <View className="bg-amber-500 px-2.5 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">
                      {totalDecisions}
                    </Text>
                  </View>
                </View>

                {/* Show first hiring request */}
                {pendingHiringRequests.length > 0 && (
                  <View className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 mb-2">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
                          HIRING REQUEST
                        </Text>
                        <Text className="text-slate-900 dark:text-white text-sm font-bold">
                          {pendingHiringRequests[0].candidateName}
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                          {pendingHiringRequests[0].candidateRole} • £{pendingHiringRequests[0].proposedDayRate}/day
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => {
                          approveHiringRequest(pendingHiringRequests[0].id, 'Founder');
                          router.push('/(tabs)/community');
                        }}
                        className="flex-1 bg-emerald-500 rounded-lg py-2 items-center active:opacity-70"
                      >
                        <Text className="text-white text-xs font-bold">Approve</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => rejectHiringRequest(pendingHiringRequests[0].id, 'Founder')}
                        className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-lg py-2 items-center active:opacity-70"
                      >
                        <Text className="text-slate-700 dark:text-slate-300 text-xs font-bold">Reject</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Show first task request */}
                {pendingTaskRequests.length > 0 && (
                  <View className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 mb-2">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold mb-1">
                          {pendingTaskRequests[0].type === 'task' ? 'TASK REQUEST' : 'OKR REQUEST'}
                        </Text>
                        <Text className="text-slate-900 dark:text-white text-sm font-bold">
                          {pendingTaskRequests[0].title}
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                          By {pendingTaskRequests[0].requestedByName}{pendingTaskRequests[0].type === 'task' ? ` • ${pendingTaskRequests[0].estimatedTimeUnits} TU` : ''}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => {
                          approveTaskRequest(pendingTaskRequests[0].id);
                          router.push('/(tabs)/decide');
                        }}
                        className="flex-1 bg-emerald-500 rounded-lg py-2 items-center active:opacity-70"
                      >
                        <Text className="text-white text-xs font-bold">Approve</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => rejectTaskRequest(pendingTaskRequests[0].id)}
                        className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-lg py-2 items-center active:opacity-70"
                      >
                        <Text className="text-slate-700 dark:text-slate-300 text-xs font-bold">Reject</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {totalDecisions > 1 && (
                  <Pressable
                    onPress={() => router.push('/(tabs)/decide')}
                    className="flex-row items-center justify-center gap-1 pt-2"
                  >
                    <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold">
                      View {totalDecisions - 1} more {totalDecisions - 1 === 1 ? 'decision' : 'decisions'}
                    </Text>
                    <ArrowRight size={14} color="#f59e0b" />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons Grid */}
          <View className="flex-row gap-3 mb-3">
            <Pressable
              onPress={() => router.push('/(tabs)/decide')}
              className="flex-1 active:opacity-80"
            >
              <LinearGradient
                colors={['#a855f7', '#9333ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="bg-white/20 rounded-full p-2 self-start mb-2">
                  <Play size={18} color="#fff" />
                </View>
                <Text className="text-white font-bold text-sm">Start Task</Text>
                <Text className="text-white/80 text-xs mt-1">
                  {queuedTasks} queued
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/do')}
              className="flex-1 active:opacity-80"
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="bg-white/20 rounded-full p-2 self-start mb-2">
                  <AlertTriangle size={18} color="#fff" />
                </View>
                <Text className="text-white font-bold text-sm">Unblock</Text>
                <Text className="text-white/80 text-xs mt-1">
                  {blockedTasks} blocked
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/(tabs)/community')}
              className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
            >
              <View className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-2 self-start mb-2">
                <UserPlus size={18} color="#10b981" />
              </View>
              <Text className="text-slate-900 dark:text-white font-bold text-sm">Hire</Text>
              <Text className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                {members.length} team members
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/decide')}
              className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
            >
              <View className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 self-start mb-2">
                <Briefcase size={18} color="#3b82f6" />
              </View>
              <Text className="text-slate-900 dark:text-white font-bold text-sm">Allocate</Text>
              <Text className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                {tuBankRemaining} TU left
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ===== REFLECTING ===== */}
        <View className="px-5 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Sparkles size={18} color="#8b5cf6" />
            <Text className="text-slate-900 dark:text-white text-base font-bold uppercase tracking-wide">
              Reflecting
            </Text>
          </View>
          <Text className="text-slate-600 dark:text-slate-400 text-xs mb-4 leading-relaxed">
            Deep analysis to think carefully about performance, market, and customers
          </Text>

          {/* Analysis & Performance Tools */}
          <View className="gap-3">
            {/* Financial Dashboard - Deep dive */}
            <Pressable
              onPress={() => router.push('/financial-dashboard')}
              className="active:opacity-80"
            >
              <LinearGradient
                colors={['#10b981', '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="bg-white/20 rounded-xl p-3">
                    <Wallet size={24} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">Financial Analysis</Text>
                    <Text className="text-white/80 text-xs mt-0.5">
                      Deep dive into cash, burn, revenue & margins
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#fff" />
              </LinearGradient>
            </Pressable>

            {/* Analytics & Reports */}
            <Pressable
              onPress={() => router.push('/analytics')}
              className="bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3">
                  <BarChart3 size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-base">Performance Analytics</Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                    TU efficiency, team velocity & task completion
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>

            {/* OKR Progress - Strategic Goals */}
            <Pressable
              onPress={() => router.push('/(tabs)/evaluate')}
              className="bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-3">
                  <Target size={24} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-base">Goals & Objectives</Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                    Review OKR progress and strategic alignment
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>

            {/* Market & Customer Insights - Placeholder for future */}
            <View className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-3">
                  <Users size={24} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-base">Market & Customers</Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                    Understand your market position and customer insights
                  </Text>
                </View>
              </View>
              <View className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <Text className="text-slate-500 dark:text-slate-400 text-xs text-center">
                  Coming soon: Customer feedback, market analysis, competitive intelligence
                </Text>
              </View>
            </View>

            {/* Reports & Board Packs */}
            <Pressable
              onPress={() => router.push('/reports')}
              className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
                  <FileText size={24} color="#64748b" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-base">Reports & Exports</Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                    Generate board packs and detailed reports
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>
          </View>
        </View>

        {/* Business Improvements - Elite Consulting Insights */}
        <View className="pt-6">
          <BusinessImprovements isDark={false} />
        </View>

        {/* Essential Tools Section */}
        <View className="px-5 pt-6">
          <Text className="text-slate-500 dark:text-slate-500 text-xs font-semibold mb-3 uppercase tracking-wider">
            Essential Tools
          </Text>
          <View className="gap-3">
            {/* Function Hub */}
            <Pressable
              onPress={() => router.push('/function-hub')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <Briefcase size={20} color="#8b5cf6" />
                <Text className="text-slate-900 dark:text-white font-semibold text-sm">Function Hub</Text>
              </View>
              <ChevronRight size={16} color="#64748b" />
            </Pressable>

            {/* AI Armory */}
            <Pressable
              onPress={() => router.push('/armory')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <Zap size={20} color="#f59e0b" />
                <Text className="text-slate-900 dark:text-white font-semibold text-sm">AI Armory</Text>
              </View>
              <ChevronRight size={16} color="#64748b" />
            </Pressable>

            {/* Getting Started */}
            <Pressable
              onPress={() => router.push('/tech-tree')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <Trophy size={20} color="#10b981" />
                <Text className="text-slate-900 dark:text-white font-semibold text-sm">Getting Started</Text>
              </View>
              <ChevronRight size={16} color="#64748b" />
            </Pressable>

            {/* Startup Hub */}
            <Pressable
              onPress={() => router.push('/startup-pack/wizard')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <Rocket size={20} color="#3b82f6" />
                <Text className="text-slate-900 dark:text-white font-semibold text-sm">Startup Hub</Text>
              </View>
              <ChevronRight size={16} color="#64748b" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Task Timeline Gantt Chart - Fixed at bottom */}
      <MiniGanttChart
        workPlans={workPlans}
        members={members}
        onTaskPress={(taskId) => {
          console.log('[Home] Navigating to decide with task:', taskId);
          router.push({
            pathname: '/(tabs)/decide',
            params: { selectedTaskId: taskId }
          });
        }}
      />
    </View>
  );
}
