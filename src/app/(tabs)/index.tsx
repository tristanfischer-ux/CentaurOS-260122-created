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
} from 'lucide-react-native';

// Stores
import { useTechTreeStore } from '@/lib/state/tech-tree-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useSupplierStore } from '@/lib/state/supplier-store';
import { useRoleStore, useActiveRole } from '@/lib/state/role-store';
import { useDecisionsStore } from '@/lib/state/decisions-store';
import { useObjectivesStore } from '@/lib/state/objectives-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useAutomaticSquadDetection } from '@/lib/hooks/useAutomaticSquadDetection';
import { autoSeedDemoDataIfNeeded } from '@/lib/seed-demo-data';
import { subscribeToWorkPlans } from '@/lib/realtime-subscriptions';

// Components
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { ApprenticeHome } from '@/components/ApprenticeHome';
import { ExecutiveHome } from '@/components/ExecutiveHome';
import { FilingCabinetDrawers } from '@/components/FilingCabinetDrawers';

// New redesigned components
import { AIInsightsPanel } from '@/components/home/AIInsightsPanel';
import { BusinessHealthMetrics } from '@/components/home/BusinessHealthMetrics';
import { ThisWeekSection } from '@/components/home/ThisWeekSection';
import { CondensedObjectivesSection } from '@/components/home/CondensedObjectivesSection';

// AI-Powered Priority Section
import { FocusTodaySection } from '@/components/FocusTodaySection';

// Task Assignment System
import { PendingAssignmentsBadge } from '@/components/PendingAssignmentsBadge';
import { PendingAssignmentsModal } from '@/components/PendingAssignmentsModal';

// Escalation System
import { EscalationsBadge } from '@/components/EscalationsBadge';
import { EscalationsInboxModal } from '@/components/EscalationsInboxModal';

// Role-based components
import { FounderApprovalPanel } from '@/components/FounderApprovalPanel';
import { seedAllocationRequests } from '@/lib/state/allocation-request-store';

const HOME_HELP: HelpContent = {
  title: 'Mission Control',
  subtitle: 'Your AI-Powered Executive Command Center',
  description: 'Mission Control is your business intelligence hub - everything you need to make fast, informed decisions. AI-powered priority surfacing, real-time team capacity, urgent decisions, and performance metrics all in one place.',
  tips: [
    '🎯 Focus Today: AI analyzes your tasks and surfaces the most critical ones based on deadlines, team blockers, business impact, and capacity',
    '🔔 Pending Assignments: Get notified when tasks are assigned to you - accept or reject with one tap',
    '⚡ Urgent Decisions: Color-coded warnings appear when decisions are blocking team progress',
    '📊 Business Objectives: Track Q1 goals with real-time progress and linked tasks',
    '👥 Team Capacity: See who has bandwidth for new work, who\'s at capacity, and who\'s overloaded',
    '📈 Performance KPIs: Instant health checks across all business functions',
    '🔄 Pull down to refresh all data in real-time',
    '➕ Green button at bottom: Create new tasks instantly with AI assistance',
  ],
  quickActions: [
    { label: 'Focus Today', description: 'AI-prioritized tasks that need your attention right now' },
    { label: 'Review Assignments', description: 'Accept or reject tasks assigned to you' },
    { label: 'Make Decisions', description: 'Unblock team progress with urgent decisions' },
    { label: 'Check Capacity', description: 'See who can take on new work this week' },
    { label: 'Create Task', description: 'Tap green + button to add tasks with AI' },
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
    case 'CoFounder':
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
  const [showPendingAssignments, setShowPendingAssignments] = useState(false);
  const [showEscalationsModal, setShowEscalationsModal] = useState(false);
  const [statsFilter, setStatsFilter] = useState<'all' | 'doing' | 'blocked' | 'team' | null>(null);

  // Task expansion state (for inline Medium view)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<WorkPlan | null>(null);
  const [showFullModal, setShowFullModal] = useState(false);

  // DISABLED: Auto-detect squads from task allocations
  // This creates squads automatically, which should not happen after reset
  // useAutomaticSquadDetection();

  // Store initializations
  const initializeTechTree = useTechTreeStore((s) => s.initialize);
  const initializeSuppliers = useSupplierStore((s) => s.initializeSuppliers);
  const initializeDecisions = useDecisionsStore((s) => s.initialize);
  const initializeObjectives = useObjectivesStore((s) => s.initialize);
  const loadWorkPlansFromSupabase = useWorkPlanStore((s) => s.loadWorkPlansFromSupabase);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const members = useOrganizationStore((s) => s.members);
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  // Get current member from organization members
  const currentMember = members.find(m => m.id === currentMembership?.id);

  // Initialize all stores on mount
  useEffect(() => {
    initializeTechTree();
    initializeDecisions();
    initializeObjectives();

    // DISABLED: Auto-seeding demo data
    // autoSeedDemoDataIfNeeded();
    // seedAllocationRequests();

    if (suppliers.length === 0) {
      initializeSuppliers();
    }
  }, [initializeTechTree, initializeSuppliers, initializeDecisions, initializeObjectives, suppliers.length]);

  // Load work plans from Supabase and subscribe to real-time updates
  useEffect(() => {
    if (!currentWorkspace?.id) {
      console.log('[Home] No workspace selected, skipping work plan load');
      return;
    }

    console.log('[Home] Loading work plans for workspace:', currentWorkspace.id);

    // Load work plans from Supabase
    loadWorkPlansFromSupabase(currentWorkspace.id);

    // Subscribe to real-time updates
    const cleanup = subscribeToWorkPlans(currentWorkspace.id, (payload) => {
      console.log('[Home] Work plan update received:', payload.eventType);
      // Reload work plans when changes occur
      loadWorkPlansFromSupabase(currentWorkspace.id);
    });

    return cleanup;
  }, [currentWorkspace?.id, loadWorkPlansFromSupabase]);

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
    const promises = [
      initializeDecisions(),
      initializeObjectives(),
    ];

    // Also reload work plans if workspace is available
    if (currentWorkspace?.id) {
      promises.push(loadWorkPlansFromSupabase(currentWorkspace.id));
    }

    await Promise.all(promises);
    setLastUpdated(new Date());
    setTimeout(() => setRefreshing(false), 800);
  }, [initializeDecisions, initializeObjectives, currentWorkspace?.id, loadWorkPlansFromSupabase]);

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
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">
              {currentDate}
            </Text>
            <Text className="text-white text-2xl font-bold">
              Mission Control
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {/* Pending Assignments Badge */}
            {currentMembership?.id && (
              <PendingAssignmentsBadge
                memberId={currentMembership.id}
                onPress={() => setShowPendingAssignments(true)}
                style="icon-only"
              />
            )}
            {/* Escalations Badge (Founders only) */}
            {currentMember?.role === 'Founder' && currentWorkspace?.id && (
              <EscalationsBadge
                workspaceId={currentWorkspace.id}
                onPress={() => setShowEscalationsModal(true)}
                style="icon-only"
              />
            )}
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

        {/* Business Health Indicator */}
        <View className="flex-row items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
          <View
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: workPlans.filter(wp => wp.status === 'blocked').length > 5 ||
                              workPlans.filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned' && new Date(wp.dueDate) < new Date()).length > 3
                ? '#ef4444'  // Red
                : workPlans.filter(wp => wp.status === 'blocked').length > 2
                ? '#f59e0b'  // Yellow
                : '#10b981'  // Green
            }}
          />
          <Text className="text-white/90 text-sm font-medium flex-1">
            Business Health: {
              workPlans.filter(wp => wp.status === 'blocked').length > 5 ||
              workPlans.filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned' && new Date(wp.dueDate) < new Date()).length > 3
                ? 'Needs Attention'
                : workPlans.filter(wp => wp.status === 'blocked').length > 2
                ? 'At Risk'
                : 'On Track'
            }
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
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
        {/* ===== FOUNDER APPROVAL PANEL (Allocation Requests) ===== */}
        <View className="px-5 pt-3">
          <FounderApprovalPanel />
        </View>

        {/* ===== AI INSIGHTS (replaces Focus Today) ===== */}
        <View className="px-5 pt-4">
          <AIInsightsPanel />
        </View>

        {/* ===== THIS WEEK (new forward-looking section) ===== */}
        <View className="px-5 pt-4">
          <ThisWeekSection />
        </View>

        {/* ===== BUSINESS HEALTH (simplified 3 metrics) ===== */}
        <View className="px-5 pt-4">
          <BusinessHealthMetrics />
        </View>

        {/* ===== OBJECTIVES (condensed list) ===== */}
        <View className="px-5 pt-4">
          <CondensedObjectivesSection />
        </View>
      </ScrollView>

      {/* Filing Cabinet Drawers - Team & Timeline */}
      <FilingCabinetDrawers
        onTaskPress={(taskId: string) => {
          router.push({
            pathname: '/(tabs)/tasks',
            params: { selectedTaskId: taskId },
          });
        }}
      />

      {/* Pending Assignments Modal */}
      {currentMembership?.id && (
        <PendingAssignmentsModal
          visible={showPendingAssignments}
          onClose={() => setShowPendingAssignments(false)}
          memberId={currentMembership.id}
        />
      )}

      {/* Escalations Inbox Modal (Founders only) */}
      {currentWorkspace?.id && currentMembership?.id && (
        <EscalationsInboxModal
          visible={showEscalationsModal}
          onClose={() => setShowEscalationsModal(false)}
          workspaceId={currentWorkspace.id}
          currentMemberId={currentMembership.id}
        />
      )}
    </View>
  );
}
