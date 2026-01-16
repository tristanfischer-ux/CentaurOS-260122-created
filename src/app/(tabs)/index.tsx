/**
 * Mission Control Home Screen
 * Command center for solo entrepreneurs - everything needed to make decisions
 * Now with role-based rendering for Founder, Executive, and Apprentice views
 *
 * Layout hierarchy (from top to bottom):
 * 1. Header: Company name, date, profile/settings
 * 2. Urgent Decisions Needed (bright warning if items exist)
 * 3. Business Objectives (scrollable horizontal list)
 * 4. Current & Upcoming Activities
 * 5. Team Capacity Overview
 * 6. Performance Dashboard Suite (grid of KPI cards)
 * 7. Supplier & Spend Overview
 * 8. Essential Tools
 */

import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  RefreshCw,
  Trophy,
  Rocket,
  Zap,
  Briefcase,
  ChevronRight,
} from 'lucide-react-native';

// Stores
import { useTechTreeStore } from '@/lib/state/tech-tree-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useSupplierStore } from '@/lib/state/supplier-store';
import { useRoleStore, useActiveRole } from '@/lib/state/role-store';
import { useDecisionsStore } from '@/lib/state/decisions-store';
import { useObjectivesStore } from '@/lib/state/objectives-store';
import { useAutomaticSquadDetection } from '@/lib/hooks/useAutomaticSquadDetection';
import { autoSeedDemoDataIfNeeded } from '@/lib/seed-demo-data';

// Components
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { ApprenticeHome } from '@/components/ApprenticeHome';
import { ExecutiveHome } from '@/components/ExecutiveHome';
import { CollapsibleGanttChart } from '@/components/CollapsibleGanttChart';

// New Home Dashboard Components
import {
  UrgentDecisionsSection,
  BusinessObjectivesSection,
  CurrentActivitiesSection,
  TeamCapacityDashboard,
  SupplierSpendDashboard,
  PerformanceDashboardGrid,
} from '@/components/home';

const HOME_HELP: HelpContent = {
  title: 'Mission Control',
  subtitle: 'Your Executive Command Center',
  description: 'Everything you need to run your business at a glance. Urgent decisions, objectives, activities, team capacity, and performance metrics - all in one place.',
  tips: [
    'Urgent Decisions appear at the top with color-coded priority',
    'Business Objectives show Q1 goals with progress tracking',
    'Team Capacity dashboard shows who can take on new work',
    'Performance KPIs give you instant health checks',
    'Pull down to refresh all data',
  ],
  quickActions: [
    { label: 'Decide', description: 'Make urgent decisions that are blocking progress' },
    { label: 'Allocate', description: 'Assign team capacity to priority tasks' },
    { label: 'Review', description: 'Check performance and adjust course' },
  ],
};

// Auto-refresh interval in milliseconds (5 minutes)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

// Main export - Role-based home router
export default function HomeScreen() {
  const activeRole = useActiveRole();
  const initializeRoleStore = useRoleStore((s) => s.initialize);

  // Initialize role store on mount
  useEffect(() => {
    initializeRoleStore();
  }, [initializeRoleStore]);

  // Render appropriate home based on role
  switch (activeRole) {
    case 'Apprentice':
      return <ApprenticeHome />;
    case 'FractionalExec':
      return <ExecutiveHome />;
    case 'Founder':
    default:
      return <FounderHome />;
  }
}

// Founder Home - Executive Command Center
function FounderHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [showHelp, setShowHelp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-detect squads from task allocations
  useAutomaticSquadDetection();

  // Store initializations
  const initializeTechTree = useTechTreeStore((s) => s.initialize);
  const initializeSuppliers = useSupplierStore((s) => s.initializeSuppliers);
  const initializeDecisions = useDecisionsStore((s) => s.initialize);
  const initializeObjectives = useObjectivesStore((s) => s.initialize);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const members = useOrganizationStore((s) => s.members);

  // Initialize all stores on mount
  useEffect(() => {
    initializeTechTree();
    initializeDecisions();
    initializeObjectives();
    autoSeedDemoDataIfNeeded();
    if (suppliers.length === 0) {
      initializeSuppliers();
    }
  }, [initializeTechTree, initializeSuppliers, initializeDecisions, initializeObjectives, suppliers.length]);

  // Auto-refresh timer
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      setLastUpdated(new Date());
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Re-initialize stores to fetch latest data
    await Promise.all([
      initializeDecisions(),
      initializeObjectives(),
    ]);
    setLastUpdated(new Date());
    setTimeout(() => setRefreshing(false), 800);
  }, [initializeDecisions, initializeObjectives]);

  // Format last updated time
  const formattedLastUpdated = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [lastUpdated]);

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

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
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">
              {currentDate}
            </Text>
            <Text className="text-white text-xl font-bold">
              Mission Control
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {/* Last Updated */}
            <Pressable
              onPress={handleRefresh}
              className="flex-row items-center gap-1 bg-white/10 px-2 py-1 rounded-full"
            >
              <RefreshCw size={12} color="rgba(255,255,255,0.7)" />
              <Text className="text-white/70 text-[10px]">{formattedLastUpdated}</Text>
            </Pressable>
            <RoleSwitcher compact />
            <Pressable
              onPress={() => router.push('/settings')}
              className="bg-white/20 p-2 rounded-full"
            >
              <Settings size={16} color="white" />
            </Pressable>
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#7c3aed"
            colors={['#7c3aed']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ===== 1. URGENT DECISIONS (Top Priority) ===== */}
        <View className="px-5 pt-5">
          <UrgentDecisionsSection />
        </View>

        {/* ===== 2. BUSINESS OBJECTIVES ===== */}
        <View className="pt-2">
          <BusinessObjectivesSection />
        </View>

        {/* ===== 3. CURRENT & UPCOMING ACTIVITIES ===== */}
        <CurrentActivitiesSection />

        {/* ===== 4. TEAM CAPACITY OVERVIEW ===== */}
        <TeamCapacityDashboard />

        {/* ===== 5. PERFORMANCE DASHBOARD SUITE ===== */}
        <PerformanceDashboardGrid />

        {/* ===== 6. SUPPLIER & SPEND OVERVIEW ===== */}
        <SupplierSpendDashboard />

        {/* ===== 7. ESSENTIAL TOOLS SECTION ===== */}
        <View className="px-5 pt-4">
          <Text className="text-slate-500 dark:text-slate-500 text-xs font-semibold mb-3 uppercase tracking-wider">
            Quick Access
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {/* Function Hub */}
            <Pressable
              onPress={() => router.push('/function-hub')}
              className="flex-1 min-w-[45%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex-row items-center gap-2 active:opacity-70"
            >
              <View className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                <Briefcase size={16} color="#8b5cf6" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-white font-semibold text-sm">Functions</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs">Business areas</Text>
              </View>
              <ChevronRight size={14} color="#64748b" />
            </Pressable>

            {/* AI Armory */}
            <Pressable
              onPress={() => router.push('/armory')}
              className="flex-1 min-w-[45%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex-row items-center gap-2 active:opacity-70"
            >
              <View className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                <Zap size={16} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-white font-semibold text-sm">AI Armory</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs">AI tools</Text>
              </View>
              <ChevronRight size={14} color="#64748b" />
            </Pressable>

            {/* Getting Started */}
            <Pressable
              onPress={() => router.push('/tech-tree')}
              className="flex-1 min-w-[45%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex-row items-center gap-2 active:opacity-70"
            >
              <View className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                <Trophy size={16} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-white font-semibold text-sm">Progress</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs">Tech tree</Text>
              </View>
              <ChevronRight size={14} color="#64748b" />
            </Pressable>

            {/* Startup Hub */}
            <Pressable
              onPress={() => router.push('/startup-pack/wizard')}
              className="flex-1 min-w-[45%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex-row items-center gap-2 active:opacity-70"
            >
              <View className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Rocket size={16} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-white font-semibold text-sm">Startup</Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs">Launch tools</Text>
              </View>
              <ChevronRight size={14} color="#64748b" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Task Timeline Gantt Chart - Collapsible at bottom */}
      <CollapsibleGanttChart
        workPlans={workPlans}
        members={members}
        onTaskPress={(taskId) => {
          router.push({
            pathname: '/(tabs)/decide',
            params: { selectedTaskId: taskId },
          });
        }}
      />
    </View>
  );
}
