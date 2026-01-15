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
import { autoSeedDemoDataIfNeeded } from '@/lib/seed-demo-data';
import { getWeekCounterInfo } from '@/lib/time-utils';
import { useMarketplaceRequestsStore } from '@/lib/state/marketplace-requests-store';
import { useRequestStore } from '@/lib/state/request-store';

const HOME_HELP: HelpContent = {
  title: 'Mission Control',
  subtitle: 'Your command center',
  description: 'Everything you need to sense your business state, take immediate action, and access critical tools - all in one place.',
  tips: [
    'Business Dashboard shows runway, tasks, blockers, and team utilization at a glance',
    'Quick Actions section lets you approve requests, unblock tasks, and allocate resources instantly',
    'Tools & Resources provides one-tap access to AI tools, Function Hub, and templates',
    'All metrics are real-time and actionable - tap any card to drill deeper',
  ],
  quickActions: [
    { label: 'View Dashboard', description: 'See comprehensive financial and operational metrics' },
    { label: 'Take Action', description: 'Respond to pending decisions and unblock tasks' },
    { label: 'Access Tools', description: 'Open Function Hub, AI tools, or startup resources' },
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

  // Resource utilization
  const getTotalCapacity = useResourceStore((s) => s.getTotalCapacity);
  const resourceCapacity = useMemo(() => getTotalCapacity(), [getTotalCapacity]);

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

  const companyHealth = useMemo(() => {
    const financials = {
      totalCash: 50000,
      burnPerMonth: 5000,
      revenuePerMonth: 2000,
    };
    return calculateCompanyHealth(financials, okrs);
  }, [okrs]);

  // Financials for display
  const financials = useMemo(() => ({
    totalCash: 50000,
    burnPerMonth: 5000,
    revenuePerMonth: 2000,
  }), []);

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
        {/* ===== BUSINESS SENSING DASHBOARD ===== */}
        <View className="px-5 pt-5">
          <View className="flex-row items-center gap-2 mb-3">
            <Activity size={18} color="#3b82f6" />
            <Text className="text-slate-900 dark:text-white text-base font-bold uppercase tracking-wide">
              Business Dashboard
            </Text>
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
              className="bg-gradient-to-r from-red-500 to-amber-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
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
            </Pressable>
          )}
        </View>

        {/* ===== QUICK ACTIONS ===== */}
        <View className="px-5 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Zap size={18} color="#f59e0b" />
            <Text className="text-slate-900 dark:text-white text-base font-bold uppercase tracking-wide">
              Quick Actions
            </Text>
          </View>

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
              className="flex-1 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 active:opacity-80"
            >
              <View className="bg-white/20 rounded-full p-2 self-start mb-2">
                <Play size={18} color="#fff" />
              </View>
              <Text className="text-white font-bold text-sm">Start Task</Text>
              <Text className="text-white/80 text-xs mt-1">
                {queuedTasks} queued
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/do')}
              className="flex-1 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 active:opacity-80"
            >
              <View className="bg-white/20 rounded-full p-2 self-start mb-2">
                <AlertTriangle size={18} color="#fff" />
              </View>
              <Text className="text-white font-bold text-sm">Unblock</Text>
              <Text className="text-white/80 text-xs mt-1">
                {blockedTasks} blocked
              </Text>
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

        {/* ===== TOOLS & RESOURCES ===== */}
        <View className="px-5 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Sparkles size={18} color="#8b5cf6" />
            <Text className="text-slate-900 dark:text-white text-base font-bold uppercase tracking-wide">
              Tools & Resources
            </Text>
          </View>

          {/* Primary Tools */}
          <View className="gap-3">
            {/* Function Hub */}
            <Pressable
              onPress={() => router.push('/function-hub')}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-80"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-white/20 rounded-xl p-3">
                  <Briefcase size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">Function Hub</Text>
                  <Text className="text-white/80 text-xs mt-0.5">
                    People, AI agents, templates & guides
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#fff" />
            </Pressable>

            {/* AI Tools / Armory */}
            <Pressable
              onPress={() => router.push('/armory')}
              className="bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-3">
                  <Zap size={24} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-base">AI Armory</Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                    Manage your AI productivity tools
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>

            {/* Getting Started / Tech Tree */}
            <Pressable
              onPress={() => router.push('/tech-tree')}
              className="bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-3">
                  <Trophy size={24} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-base">Getting Started</Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                    Progress through startup milestones
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>

            {/* Startup Hub */}
            <Pressable
              onPress={() => router.push('/startup-pack/wizard')}
              className="bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3">
                  <Rocket size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-base">Startup Hub</Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                    Events, workshops & founder resources
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>

            {/* Reports & Analytics */}
            <Pressable
              onPress={() => router.push('/analytics')}
              className="bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-emerald-100 dark:bg-emerald-900/30 rounded-xl p-3">
                  <BarChart3 size={24} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-base">Analytics</Text>
                  <Text className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                    Reports, insights & board packs
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>
          </View>
        </View>

        {/* Quick Nav Footer */}
        <View className="px-5 pt-6 pb-2">
          <Text className="text-slate-500 dark:text-slate-500 text-xs font-semibold mb-3 uppercase tracking-wider">
            Quick Navigation
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/(tabs)/make')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 items-center active:opacity-70"
            >
              <Package size={20} color="#8b5cf6" />
              <Text className="text-slate-900 dark:text-white font-semibold text-xs mt-1.5">Make</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/evaluate')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 items-center active:opacity-70"
            >
              <CheckCircle2 size={20} color="#10b981" />
              <Text className="text-slate-900 dark:text-white font-semibold text-xs mt-1.5">Evaluate</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/financial-dashboard')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 items-center active:opacity-70"
            >
              <Wallet size={20} color="#3b82f6" />
              <Text className="text-slate-900 dark:text-white font-semibold text-xs mt-1.5">Finance</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/reports')}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 items-center active:opacity-70"
            >
              <FileText size={20} color="#f59e0b" />
              <Text className="text-slate-900 dark:text-white font-semibold text-xs mt-1.5">Reports</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
