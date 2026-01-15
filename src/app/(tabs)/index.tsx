/**
 * Mission Control Home Screen
 * RPG-style command center driven by Tech Tree progression
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
  subtitle: 'Your RPG-style command center',
  description: 'Mission Control surfaces your Main Quest from the Tech Tree, critical blockers, and TU allocation. Focus on high-impact actions to progress through acts and unlock new capabilities.',
  tips: [
    'Your Main Quest shows the active Tech Tree node with progress, ETA, and next best action',
    'Critical section highlights top blockers by impact—resolve these first to unblock TUs',
    'TU Plan shows weekly allocation across all tasks—use Auto-rebalance to optimize',
    'Company Health tracks runway, burn, and cash at risk from supplier engagements',
    'Tap any card to deep link directly to the relevant screen (Decide, Make, Hub, etc.)',
  ],
  quickActions: [
    { label: 'View Quest', description: 'Open Tech Tree node detail to see full task pack' },
    { label: 'Allocate TUs', description: 'Navigate to Decide filtered to Main Quest tasks' },
    { label: 'Resolve', description: 'Deep link to unblock the top critical item' },
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
  const activeBuffs = useTechTreeStore((s) => s.activeBuffs);
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

  // Decision stores - select data directly, not through getter functions
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
    // Initialize suppliers if empty
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
    // Simplified financials calculation
    const financials = {
      totalCash: 50000,
      burnPerMonth: 5000,
      revenuePerMonth: 2000,
    };
    return calculateCompanyHealth(financials, okrs);
  }, [okrs]);

  // Financials for display (should come from a real finance store in production)
  const financials = useMemo(() => ({
    totalCash: 50000,
    burnPerMonth: 5000,
    revenuePerMonth: 2000,
  }), []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const tuBankRemaining = tuAllocation.remaining;
  const runwayDisplay =
    companyHealth.runwayMonths !== null
      ? `${companyHealth.runwayMonths.toFixed(1)}mo`
      : '∞';

  const weekInfo = currentWorkspace ? getWeekCounterInfo(currentWorkspace.createdAt) : null;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
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
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">
              MISSION CONTROL
            </Text>
            <Text className="text-white text-xl font-bold">
              Home
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <HelpButton onPress={() => setShowHelp(true)} />
            {tuBankRemaining < 10 && (
              <View className="bg-white/20 px-3 py-2 rounded-xl">
                <Text className="text-white/80 text-xs font-medium">LOW TU</Text>
                <Text className="text-white text-lg font-bold">{tuBankRemaining}</Text>
              </View>
            )}
          </View>
        </View>
        {/* Quick Health Indicators */}
        <View className="flex-row gap-4">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-1.5 bg-purple-300" />
            <Text className="text-white/90 text-xs">Level {currentLevel}</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-1.5 bg-white" />
            <Text className="text-white/90 text-xs">{runwayDisplay} runway</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* FINANCIAL OVERVIEW */}
        <View className="px-6 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <DollarSign size={20} color="#10b981" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold">FINANCIAL OVERVIEW</Text>
          </View>

          <View className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Cash in Bank</Text>
                <Text className="text-emerald-400 text-2xl font-bold">
                  £{(financials.totalCash / 1000).toFixed(0)}K
                </Text>
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">This Week's Cost</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  £{(financials.burnPerMonth / 4 / 1000).toFixed(1)}K
                </Text>
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Runway</Text>
                <Text className="text-emerald-400 text-2xl font-bold">
                  {runwayDisplay}
                </Text>
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Monthly Burn</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  £{(financials.burnPerMonth / 1000).toFixed(1)}K/mo
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* RESOURCE UTILIZATION */}
        <View className="px-6 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Zap size={20} color="#3b82f6" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold">RESOURCE UTILIZATION</Text>
          </View>

          <View className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">This Week</Text>
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  {resourceCapacity.allocated} / {resourceCapacity.total} Squares
                </Text>
                <Text className="text-gray-500 dark:text-slate-500 text-xs mt-1">
                  {resourceCapacity.available} available
                </Text>
              </View>
              <View className={`px-4 py-2 rounded-xl ${
                resourceCapacity.available === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                resourceCapacity.available < 5 ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Text className={`text-center font-bold ${
                  resourceCapacity.available === 0 ? 'text-emerald-600 dark:text-emerald-400' :
                  resourceCapacity.available < 5 ? 'text-amber-600 dark:text-amber-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {resourceCapacity.available === 0 ? 'Fully Allocated' :
                   resourceCapacity.available < 5 ? 'Near Capacity' :
                   'Under-allocated'}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <View
                className={`h-full ${
                  resourceCapacity.available === 0 ? 'bg-emerald-500' :
                  resourceCapacity.available < 5 ? 'bg-amber-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${(resourceCapacity.allocated / resourceCapacity.total) * 100}%` }}
              />
            </View>
          </View>
        </View>

        {/* MANUFACTURING & EVENTS */}
        {activeSuppliers.length > 0 && (
          <View className="px-6 pt-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Package size={20} color="#8b5cf6" />
              <Text className="text-gray-900 dark:text-white text-lg font-bold">MANUFACTURING</Text>
            </View>

            <View className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <Text className="text-gray-600 dark:text-slate-400 text-sm mb-3">Active Suppliers</Text>
              <View className="gap-2">
                {activeSuppliers.slice(0, 3).map((supplier) => (
                  <Pressable
                    key={supplier.id}
                    onPress={() => router.push('/(tabs)/community')}
                    className="flex-row items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg active:opacity-70"
                  >
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white text-sm font-semibold">
                        {supplier.name}
                      </Text>
                      <Text className="text-gray-500 dark:text-slate-500 text-xs">
                        {supplier.location.city}, {supplier.location.country}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#64748b" />
                  </Pressable>
                ))}
              </View>
              {activeSuppliers.length > 3 && (
                <Pressable
                  onPress={() => router.push('/(tabs)/community')}
                  className="mt-3 py-2 items-center active:opacity-70"
                >
                  <Text className="text-purple-600 dark:text-purple-400 text-sm font-semibold">
                    View all {activeSuppliers.length} suppliers →
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Upcoming Events from Startup Hub */}
        <View className="px-6 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Activity size={20} color="#f59e0b" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold">UPCOMING EVENTS</Text>
          </View>

          <View className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <Pressable
              onPress={() => router.push('/startup-pack/wizard')}
              className="flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white text-base font-semibold mb-1">
                  Startup Hub Events
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-sm">
                  Access networking events, workshops, and resources for founders
                </Text>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>
          </View>
        </View>

        {/* FOUNDER DECISIONS - Critical items needing immediate attention */}
        {(pendingHiringRequests.length > 0 || pendingTaskRequests.length > 0) && (
          <View className="px-6 pt-6">
            <View className="flex-row items-center gap-2 mb-3">
              <AlertCircle size={20} color="#ef4444" />
              <Text className="text-gray-900 dark:text-white text-lg font-bold">DECISIONS NEEDED</Text>
              <View className="bg-red-500 px-2 py-0.5 rounded-full">
                <Text className="text-white text-xs font-bold">
                  {pendingHiringRequests.length + pendingTaskRequests.length}
                </Text>
              </View>
            </View>

            <View className="gap-3">
              {/* Hiring Requests */}
              {pendingHiringRequests.map((request) => (
                <View
                  key={request.id}
                  className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-sm"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <User size={16} color="#f59e0b" />
                        <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold">HIRING REQUEST</Text>
                      </View>
                      <Text className="text-gray-900 dark:text-white text-base font-bold mb-1">
                        {request.candidateName}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                        {request.candidateRole} • {request.candidateFunction}
                      </Text>
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">
                        {request.proposedDaysPerWeek} days/week @ £{request.proposedDayRate}/day
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        approveHiringRequest(request.id, 'Founder');
                        router.push('/(tabs)/community');
                      }}
                      className="flex-1 bg-emerald-500 rounded-xl py-3 items-center active:opacity-70"
                    >
                      <Text className="text-white text-sm font-bold">Approve</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => rejectHiringRequest(request.id, 'Founder')}
                      className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl py-3 items-center active:opacity-70"
                    >
                      <Text className="text-gray-700 dark:text-slate-300 text-sm font-bold">Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              {/* Task Requests */}
              {pendingTaskRequests.map((request) => (
                <View
                  key={request.id}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <CheckCircle2 size={16} color="#3b82f6" />
                        <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                          {request.type === 'task' ? 'TASK REQUEST' : 'OKR REQUEST'}
                        </Text>
                      </View>
                      <Text className="text-gray-900 dark:text-white text-base font-bold mb-1">
                        {request.title}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                        Requested by {request.requestedByName} ({request.requestedByRole})
                      </Text>
                      {request.type === 'task' && (
                        <Text className="text-gray-700 dark:text-slate-300 text-sm">
                          {request.estimatedTimeUnits} TU • {request.function}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        approveTaskRequest(request.id);
                        router.push('/(tabs)/decide');
                      }}
                      className="flex-1 bg-emerald-500 rounded-xl py-3 items-center active:opacity-70"
                    >
                      <Text className="text-white text-sm font-bold">Approve</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => rejectTaskRequest(request.id)}
                      className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl py-3 items-center active:opacity-70"
                    >
                      <Text className="text-gray-700 dark:text-slate-300 text-sm font-bold">Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CRITICAL */}
        {criticalItems.length > 0 && (
          <View className="px-6 pt-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={20} color="#ef4444" />
                <Text className="text-gray-900 dark:text-white text-lg font-bold">CRITICAL</Text>
              </View>
              <Text className="text-gray-600 dark:text-slate-400 text-sm">{criticalItems.length}</Text>
            </View>

            {criticalItems.slice(0, 1).map((item) => (
              <View
                key={item.id}
                className={`border rounded-xl p-4 mb-3 shadow-sm ${
                  item.severity === 'critical'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-base font-bold mb-1">
                      {item.title}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                      {item.description}
                    </Text>
                    <View className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded self-start">
                      <Text className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
                        {item.impact}
                      </Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push(item.deepLink as any)}
                  className="bg-red-500 rounded-lg py-2 items-center active:opacity-70"
                >
                  <Text className="text-white text-sm font-bold">
                    {item.primaryCTA}
                  </Text>
                </Pressable>
              </View>
            ))}

            {criticalItems.length > 1 && (
              <Pressable
                onPress={() => router.push('/(tabs)/decide')}
                className="flex-row items-center justify-center gap-2 py-2"
              >
                <Text className="text-blue-400 text-sm font-semibold">
                  View All ({criticalItems.length})
                </Text>
                <ChevronRight size={16} color="#3b82f6" />
              </Pressable>
            )}
          </View>
        )}

        {/* THIS WEEK'S TU PLAN */}
        <View className="px-6 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Activity size={20} color="#3b82f6" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold">THIS WEEK'S TU PLAN</Text>
          </View>

          <View className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            {/* Summary */}
            <View className="flex-row justify-between mb-4">
              <View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Allocated</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  {tuAllocation.totalAllocated} TU
                </Text>
              </View>
              <View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Available</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  {tuAllocation.totalAvailable} TU
                </Text>
              </View>
              <View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Blocked</Text>
                <Text className="text-red-400 text-xl font-bold">
                  {tuAllocation.blockedTU} TU
                </Text>
              </View>
            </View>

            {mainQuest && (
              <View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4">
                <Text className="text-purple-600 dark:text-purple-300 text-xs font-semibold mb-1">
                  Main Quest Allocation
                </Text>
                <Text className="text-gray-900 dark:text-white text-lg font-bold">
                  {tuAllocation.mainQuestAllocation} TU/wk
                </Text>
              </View>
            )}

            {/* Top Tasks */}
            {tuAllocation.topActiveTasks.length > 0 && (
              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold mb-2">
                  TOP ACTIVE TASKS
                </Text>
                {tuAllocation.topActiveTasks.map((task) => (
                  <View
                    key={task.id}
                    className="flex-row items-center justify-between py-2 border-b border-gray-200 dark:border-slate-800"
                  >
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white text-sm font-medium" numberOfLines={1}>
                        {task.title}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <View className="bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">{task.ownerInitials}</Text>
                      </View>
                      {task.etaDays && (
                        <View className="bg-blue-500/20 px-2 py-1 rounded">
                          <Text className="text-blue-400 text-xs font-semibold">
                            {task.etaDays}d
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* CTAs */}
            <Pressable
              onPress={() => router.push('/(tabs)/decide')}
              className="bg-blue-500 rounded-xl py-3 items-center active:opacity-70"
            >
              <Text className="text-white text-sm font-bold">Open Decide</Text>
            </Pressable>
          </View>
        </View>

        {/* COMPANY HEALTH */}
        <View className="px-6 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <TrendingUp size={20} color="#10b981" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold">COMPANY HEALTH</Text>
          </View>

          <View className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Runway</Text>
                <Text className="text-emerald-400 text-2xl font-bold">
                  {runwayDisplay}
                </Text>
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Net Flow</Text>
                <View className="flex-row items-center gap-1">
                  {companyHealth.netFlowMonthly >= 0 ? (
                    <TrendingUp size={16} color="#10b981" />
                  ) : (
                    <TrendingDown size={16} color="#ef4444" />
                  )}
                  <Text
                    className={`text-xl font-bold ${
                      companyHealth.netFlowMonthly >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    £{(Math.abs(companyHealth.netFlowMonthly) / 1000).toFixed(1)}K
                  </Text>
                </View>
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Burn</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  £{(companyHealth.burnMonthly / 1000).toFixed(1)}K/mo
                </Text>
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">OKRs</Text>
                <Text className="text-gray-900 dark:text-white text-xl font-bold">
                  {companyHealth.okrsOnTrack}/{companyHealth.okrsTotal}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* HUB / UPGRADES */}
        <View className="px-6 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Sparkles size={20} color="#f59e0b" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold">UPGRADES</Text>
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/community')}
            className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-sm active:opacity-70"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-amber-600 dark:text-amber-400 text-base font-bold mb-1">
                  Visit Hub Marketplace
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-sm">
                  Hire talent, find suppliers, equip AI tools
                </Text>
              </View>
              <ChevronRight size={24} color="#f59e0b" />
            </View>
          </Pressable>
        </View>

        {/* STARTUP HUB */}
        <View className="px-6 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Rocket size={20} color="#8b5cf6" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold">STARTUP HUB</Text>
          </View>

          <Pressable
            onPress={() => router.push('/startup-pack/wizard')}
            className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl p-4 shadow-sm active:opacity-70"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-purple-600 dark:text-purple-400 text-base font-bold mb-1">
                  Startup Pack Wizard
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-sm">
                  Guides, templates, and checklists for your startup
                </Text>
              </View>
              <ChevronRight size={24} color="#8b5cf6" />
            </View>
          </Pressable>
        </View>

        {/* REPORTS & ANALYTICS */}
        <View className="px-6 pt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <FileText size={20} color="#3b82f6" />
            <Text className="text-gray-900 dark:text-white text-lg font-bold">REPORTS & ANALYTICS</Text>
          </View>

          <Pressable
            onPress={() => router.push('/analytics')}
            className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm active:opacity-70 mb-3"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-blue-600 dark:text-blue-400 text-base font-bold mb-1">
                  TU Analytics Dashboard
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-sm">
                  View detailed reports and insights
                </Text>
              </View>
              <ChevronRight size={24} color="#3b82f6" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/reports')}
            className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm active:opacity-70"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-blue-600 dark:text-blue-400 text-base font-bold mb-1">
                  Export Reports
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-sm">
                  Generate and download board packs & reports
                </Text>
              </View>
              <ChevronRight size={24} color="#3b82f6" />
            </View>
          </Pressable>
        </View>

        {/* Quick Links */}
        <View className="px-6 pt-6">
          <Text className="text-gray-600 dark:text-slate-400 text-sm font-semibold mb-3">QUICK LINKS</Text>
          <View className="flex-row gap-3 mb-3">
            <Pressable
              onPress={() => router.push('/(tabs)/make')}
              className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm active:opacity-70"
            >
              <Package size={24} color="#8b5cf6" />
              <Text className="text-gray-900 dark:text-white font-semibold text-sm mt-2">Make</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/evaluate')}
              className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm active:opacity-70"
            >
              <CheckCircle2 size={24} color="#10b981" />
              <Text className="text-gray-900 dark:text-white font-semibold text-sm mt-2">Evaluate</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/tech-tree')}
              className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm active:opacity-70"
            >
              <Trophy size={24} color="#a855f7" />
              <Text className="text-gray-900 dark:text-white font-semibold text-sm mt-2">Tech Tree</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
