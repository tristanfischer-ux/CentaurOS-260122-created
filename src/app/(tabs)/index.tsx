import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Target,
  Briefcase,
  FileText,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Bot,
  Package,
  Settings,
  X,
  Lightbulb,
  Zap,
  Sliders as SlidersIcon,
  Sparkles,
  BarChart,
  Search,
  Store,
  AlertTriangle,
  Shield,
  Activity,
  Library,
} from "lucide-react-native";
import {
  useCurrentWorkspace,
  useCurrentMembership,
  useCurrentUser,
} from "@/lib/state/app-store";
import { useDashboardStats, useObjectives, useWorkspaceMembers } from "@/lib/hooks/queries";
import { router } from "expo-router";
import {
  CURRENT_FINANCIALS,
  DEFAULT_BUDGET,
  calculateFinancialRatios,
  calculateBudgetVariance,
  FINANCIAL_HISTORY,
  type BudgetTargets,
} from "@/lib/financial-seed";
import { EngagementSections } from "@/components/EngagementSections";
import { useTasks } from "@/lib/hooks/queries";
import { TabDescription } from "@/components/TabDescription";

export default function HomeScreen() {
  // Home screen with dashboard
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  const { data: stats, isLoading } = useDashboardStats(
    currentWorkspace?.id ?? null,
  );
  const { data: tasks } = useTasks(currentWorkspace?.id ?? null);
  const { data: objectives } = useObjectives(currentWorkspace?.id ?? null);
  const { data: teamMembers } = useWorkspaceMembers(currentWorkspace?.id ?? null);

  // Financial dashboard state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budget, setBudget] = useState<BudgetTargets>(DEFAULT_BUDGET);
  const [editingBudget, setEditingBudget] =
    useState<BudgetTargets>(DEFAULT_BUDGET);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsType, setDetailsType] = useState<
    "revenue" | "profit" | "burn" | "runway" | "cogs" | "team" | "ai" | "other" | null
  >(null);
  const [showScenarioPlanningModal, setShowScenarioPlanningModal] = useState(false);

  // Scenario planning interactive state
  const [revenueIncrease, setRevenueIncrease] = useState(30); // Percentage
  const [burnReduction, setBurnReduction] = useState(20); // Percentage
  const [customRevenue, setCustomRevenue] = useState(0); // Custom revenue increase %
  const [customBurn, setCustomBurn] = useState(0); // Custom burn reduction %

  const financials = CURRENT_FINANCIALS;
  const ratios = calculateFinancialRatios(financials);
  const variance = calculateBudgetVariance(financials, budget);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!stats || !currentMembership) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-6">
        <Text className="text-gray-600 dark:text-slate-400 text-center">
          No workspace selected
        </Text>
      </View>
    );
  }

  const role = currentMembership.role;

  // Command Center Metrics - Founders Only
  const commandCenterMetrics = role === 'Founder' ? {
    okrHealth: (() => {
      if (!objectives || objectives.length === 0) return { value: 0, status: 'warning', label: 'No OKRs' };
      const activeObjectives = objectives.filter((obj: any) => obj.status === 'active');
      if (activeObjectives.length === 0) return { value: 0, status: 'warning', label: 'No Active OKRs' };

      const totalProgress = activeObjectives.reduce((sum: number, obj: any) => {
        return sum + (obj.calculatedProgress || 0);
      }, 0);
      const avgProgress = totalProgress / activeObjectives.length;

      const status = avgProgress >= 70 ? 'healthy' : avgProgress >= 40 ? 'warning' : 'critical';
      return { value: Math.round(avgProgress), status, label: `${activeObjectives.length} Active` };
    })(),

    financialRunway: (() => {
      const runway = financials.cashBalance / financials.burnRate;
      const status = runway >= 12 ? 'healthy' : runway >= 6 ? 'warning' : 'critical';
      return { value: runway.toFixed(1), status, label: 'Months' };
    })(),

    teamCapacity: (() => {
      if (!tasks || !teamMembers || teamMembers.length === 0) return { value: 0, status: 'healthy', label: 'No Data' };
      const activeTasks = tasks.filter((t: any) => t.status !== 'done');
      const tasksPerPerson = activeTasks.length / teamMembers.length;

      const status = tasksPerPerson <= 5 ? 'healthy' : tasksPerPerson <= 10 ? 'warning' : 'critical';
      return { value: tasksPerPerson.toFixed(1), status, label: `Tasks/Person` };
    })(),

    supplierHealth: (() => {
      // Placeholder - will be enhanced with actual supplier data in future feature
      const verifiedSuppliers = 28; // Based on seed data
      return { value: verifiedSuppliers, status: 'healthy', label: 'Verified' };
    })(),
  } : null;

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1">
        <TabDescription description="Your command center for workspace insights, key metrics, and daily focus areas." />

        {/* Header Section */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Welcome back,</Text>
              <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                {currentUser?.name}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/search')}
              className="w-10 h-10 bg-gray-100 dark:bg-slate-900 rounded-xl items-center justify-center border border-gray-300 dark:border-slate-800 active:opacity-70"
            >
              <Search size={20} color="#3b82f6" />
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/settings")}
            className="active:opacity-70"
          >
            <View className="mt-2 bg-blue-500/20 self-start px-3 py-1 rounded-full">
              <Text className="text-blue-400 text-xs font-semibold">{role}</Text>
            </View>
          </Pressable>
        </View>

        {/* Engagement Sections - Streak, Today's Focus, Activity Feed */}
        <EngagementSections
          role={role}
          tasks={tasks || []}
          userName={currentUser?.name}
        />

        {/* KPI Tiles */}
        <View className="px-6 pb-4">
          <View className="flex-row flex-wrap gap-3">
            {stats.kpiTiles?.map((tile, index) => {
              // Determine route based on tile label
              const getRouteForTile = (label: string) => {
                if (label === 'Active Objectives') return '/(tabs)/okrs';
                if (label === 'Completed This Week') return '/kpi-details?type=completed';
                if (label === 'In Progress') return '/kpi-details?type=in_progress';
                if (label === 'Pending Reviews') return '/(tabs)/reviews';
                return null;
              };

              const route = getRouteForTile(tile.label);

              return (
                <Pressable
                  key={index}
                  onPress={() => route && router.push(route)}
                  className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
                  style={{ width: "48%" }}
                >
                  <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">
                    {tile.label}
                  </Text>
                  <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                    {tile.value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Command Center - Founders Only */}
        {role === "Founder" && commandCenterMetrics && (
          <View className="px-6 pb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-gray-900 dark:text-white text-lg font-semibold">
                  Command Center
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
                  Critical metrics at a glance
                </Text>
              </View>
              <View className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                <Text className="text-blue-400 text-xs font-bold uppercase tracking-wide">Live</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {/* OKR Health */}
              <Pressable
                onPress={() => router.push('/(tabs)/okrs')}
                className="flex-1 min-w-[155px] active:opacity-70"
              >
                <LinearGradient
                  colors={
                    commandCenterMetrics.okrHealth.status === 'healthy'
                      ? ['#10b981', '#059669']
                      : commandCenterMetrics.okrHealth.status === 'warning'
                      ? ['#f59e0b', '#d97706']
                      : ['#ef4444', '#dc2626']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    minHeight: 100,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Target size={20} color="white" />
                    {commandCenterMetrics.okrHealth.status === 'critical' && (
                      <AlertTriangle size={16} color="white" />
                    )}
                  </View>
                  <Text className="text-white text-xs font-semibold mb-1">
                    OKR Health
                  </Text>
                  <Text className="text-white text-2xl font-bold">
                    {commandCenterMetrics.okrHealth.value}%
                  </Text>
                  <Text className="text-white/80 text-xs mt-1">
                    {commandCenterMetrics.okrHealth.label}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Financial Runway */}
              <Pressable
                onPress={() => {/* Scroll to financial section */}}
                className="flex-1 min-w-[155px] active:opacity-70"
              >
                <LinearGradient
                  colors={
                    commandCenterMetrics.financialRunway.status === 'healthy'
                      ? ['#3b82f6', '#2563eb']
                      : commandCenterMetrics.financialRunway.status === 'warning'
                      ? ['#f59e0b', '#d97706']
                      : ['#ef4444', '#dc2626']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    minHeight: 100,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <DollarSign size={20} color="white" />
                    {commandCenterMetrics.financialRunway.status === 'critical' && (
                      <AlertTriangle size={16} color="white" />
                    )}
                  </View>
                  <Text className="text-white text-xs font-semibold mb-1">
                    Cash Runway
                  </Text>
                  <Text className="text-white text-2xl font-bold">
                    {commandCenterMetrics.financialRunway.value}
                  </Text>
                  <Text className="text-white/80 text-xs mt-1">
                    {commandCenterMetrics.financialRunway.label}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Team Capacity */}
              <Pressable
                onPress={() => router.push('/(tabs)/work')}
                className="flex-1 min-w-[155px] active:opacity-70"
              >
                <LinearGradient
                  colors={
                    commandCenterMetrics.teamCapacity.status === 'healthy'
                      ? ['#8b5cf6', '#7c3aed']
                      : commandCenterMetrics.teamCapacity.status === 'warning'
                      ? ['#f59e0b', '#d97706']
                      : ['#ef4444', '#dc2626']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    minHeight: 100,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Users size={20} color="white" />
                    {commandCenterMetrics.teamCapacity.status === 'critical' && (
                      <AlertTriangle size={16} color="white" />
                    )}
                  </View>
                  <Text className="text-white text-xs font-semibold mb-1">
                    Team Capacity
                  </Text>
                  <Text className="text-white text-2xl font-bold">
                    {commandCenterMetrics.teamCapacity.value}
                  </Text>
                  <Text className="text-white/80 text-xs mt-1">
                    {commandCenterMetrics.teamCapacity.label}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Supplier Health */}
              <Pressable
                onPress={() => router.push('/(tabs)/network')}
                className="flex-1 min-w-[155px] active:opacity-70"
              >
                <LinearGradient
                  colors={['#ec4899', '#db2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    minHeight: 100,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Package size={20} color="white" />
                    <Shield size={16} color="white" />
                  </View>
                  <Text className="text-white text-xs font-semibold mb-1">
                    Supplier Network
                  </Text>
                  <Text className="text-white text-2xl font-bold">
                    {commandCenterMetrics.supplierHealth.value}
                  </Text>
                  <Text className="text-white/80 text-xs mt-1">
                    {commandCenterMetrics.supplierHealth.label}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}

        {/* Financial Dashboard - Founders Only */}
        {role === "Founder" && (
          <View className="px-6 pb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">
                Financial Dashboard
              </Text>
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => setShowScenarioPlanningModal(true)}
                  className="active:opacity-70"
                >
                  <View className="flex-row items-center gap-1 bg-blue-500/20 px-3 py-1.5 rounded-lg">
                    <Lightbulb size={16} color="#3b82f6" />
                    <Text className="text-blue-400 text-sm font-semibold">Planning</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setEditingBudget(budget);
                    setShowBudgetModal(true);
                  }}
                  className="active:opacity-70"
                >
                  <View className="flex-row items-center gap-1">
                    <Settings size={16} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">Budget</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Key Metrics Grid */}
            <View className="flex-row flex-wrap gap-3 mb-3">
              {/* Revenue Card */}
              <Pressable
                onPress={() => {
                  setDetailsType("revenue");
                  setShowDetailsModal(true);
                }}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
                style={{ width: "48%" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <DollarSign size={20} color="#10b981" />
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">
                    Monthly Revenue
                  </Text>
                </View>
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                  £{(financials.revenue.total / 1000).toFixed(0)}k
                </Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <TrendingUp size={14} color="#10b981" />
                  <Text className="text-emerald-400 text-xs">
                    +{financials.revenue.growth}%
                  </Text>
                </View>
              </Pressable>

              {/* Gross Profit Card */}
              <Pressable
                onPress={() => {
                  setDetailsType("profit");
                  setShowDetailsModal(true);
                }}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
                style={{ width: "48%" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <TrendingUp size={20} color="#3b82f6" />
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">
                    Monthly Gross Profit
                  </Text>
                </View>
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                  £{(ratios.grossProfit / 1000).toFixed(0)}k
                </Text>
                <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                  {ratios.grossMargin.toFixed(1)}% margin
                </Text>
              </Pressable>

              {/* Burn Rate Card */}
              <Pressable
                onPress={() => {
                  setDetailsType("burn");
                  setShowDetailsModal(true);
                }}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
                style={{ width: "48%" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <TrendingDown size={20} color="#ef4444" />
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">Monthly Burn</Text>
                </View>
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                  £{(financials.burnRate / 1000).toFixed(0)}k
                </Text>
                <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                  {variance.burnRate.variance > 0 ? "+" : ""}
                  {(variance.burnRate.variance / 1000).toFixed(1)}k vs budget
                </Text>
              </Pressable>

              {/* Runway Card */}
              <Pressable
                onPress={() => {
                  setDetailsType("runway");
                  setShowDetailsModal(true);
                }}
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
                style={{ width: "48%" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Calendar size={20} color="#f59e0b" />
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">Runway</Text>
                </View>
                <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                  {financials.runway.toFixed(1)}
                </Text>
                <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">months</Text>
              </Pressable>
            </View>

            {/* Cost Breakdown */}
            <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 mb-3">
              <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                Cost Breakdown
              </Text>

              {/* COGS */}
              <Pressable
                className="mb-3 active:opacity-70"
                onPress={() => {
                  setDetailsType("cogs");
                  setShowDetailsModal(true);
                }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Package size={16} color="#8b5cf6" />
                    <Text className="text-gray-700 dark:text-slate-300 text-sm">COGS</Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-semibold">
                    £{(financials.cogs.total / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-purple-500 h-full rounded-full"
                    style={{
                      width: `${(financials.cogs.total / financials.burnRate) * 100}%`,
                    }}
                  />
                </View>
                <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                  {(
                    (financials.cogs.total / financials.burnRate) *
                    100
                  ).toFixed(1)}
                  % of burn
                </Text>
              </Pressable>

              {/* Team Costs */}
              <Pressable
                className="mb-3 active:opacity-70"
                onPress={() => {
                  setDetailsType("team");
                  setShowDetailsModal(true);
                }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Users size={16} color="#3b82f6" />
                    <Text className="text-gray-700 dark:text-slate-300 text-sm">Team</Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-semibold">
                    £{(financials.teamCosts.total / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${ratios.teamBurnPercentage}%` }}
                  />
                </View>
                <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                  {ratios.teamBurnPercentage.toFixed(1)}% of burn •{" "}
                  {financials.teamCosts.headcount.fractionalExecs} execs,{" "}
                  {financials.teamCosts.headcount.apprentices} apprentices
                </Text>
              </Pressable>

              {/* AI Costs */}
              <Pressable
                className="mb-3 active:opacity-70"
                onPress={() => {
                  setDetailsType("ai");
                  setShowDetailsModal(true);
                }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Bot size={16} color="#10b981" />
                    <Text className="text-gray-700 dark:text-slate-300 text-sm">AI Services</Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-semibold">
                    £{(financials.aiCosts.total / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${ratios.aiBurnPercentage}%` }}
                  />
                </View>
                <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                  {ratios.aiBurnPercentage.toFixed(1)}% of burn
                </Text>
              </Pressable>

              {/* Other Costs */}
              <Pressable
                className="active:opacity-70"
                onPress={() => {
                  setDetailsType("other");
                  setShowDetailsModal(true);
                }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Briefcase size={16} color="#f59e0b" />
                    <Text className="text-gray-700 dark:text-slate-300 text-sm">Other</Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-semibold">
                    £{(financials.otherCosts.total / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${(financials.otherCosts.total / financials.burnRate) * 100}%`,
                    }}
                  />
                </View>
                <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                  {(
                    (financials.otherCosts.total / financials.burnRate) *
                    100
                  ).toFixed(1)}
                  % of burn
                </Text>
              </Pressable>
            </View>

            {/* Net Profit/Loss */}
            <Pressable
              onPress={() => {
                setDetailsType("profit");
                setShowDetailsModal(true);
              }}
              className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600 dark:text-slate-400 text-sm">Net Profit/Loss</Text>
                <View className="flex-row items-center gap-2">
                  <Text
                    className={`text-xl font-bold ${ratios.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    £{(ratios.netProfit / 1000).toFixed(1)}k
                  </Text>
                  {ratios.netProfit >= 0 ? (
                    <TrendingUp size={20} color="#10b981" />
                  ) : (
                    <TrendingDown size={20} color="#ef4444" />
                  )}
                </View>
              </View>
              <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                {ratios.netMargin.toFixed(1)}% net margin
              </Text>
            </Pressable>
          </View>
        )}

        {/* Reports Section */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 dark:text-white text-lg font-semibold">Reports</Text>
          </View>
          <View className="gap-3">
            {/* Weekly Report Card */}
            <Pressable
              onPress={() => router.push("/reports?period=week")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 active:opacity-70"
            >
              <LinearGradient
                colors={["#2563eb", "#1d4ed8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0 rounded-2xl"
              />
              <View className="flex-row items-center justify-between relative z-10">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Calendar size={18} color="#fff" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      Weekly Report
                    </Text>
                  </View>
                  <Text className="text-blue-100 text-xs">
                    Last 7 days performance
                  </Text>
                </View>
                <ArrowRight size={20} color="#fff" />
              </View>
            </Pressable>

            {/* Quick Report Options Grid */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => router.push("/reports?period=month")}
                className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                <BarChart3 size={24} color="#10b981" />
                <Text className="text-gray-900 dark:text-white font-semibold mt-2 mb-1">
                  Monthly
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">30 day overview</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/reports?period=quarter")}
                className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
              >
                <PieChart size={24} color="#f59e0b" />
                <Text className="text-gray-900 dark:text-white font-semibold mt-2 mb-1">
                  Quarterly
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">90 day summary</Text>
              </Pressable>
            </View>

            {/* Board Pack for Founders */}
            {role === "Founder" && (
              <Pressable
                onPress={() =>
                  router.push("/reports?period=month&export=boardpack")
                }
                className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-emerald-800 active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <FileText size={18} color="#10b981" />
                      <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                        Board Pack
                      </Text>
                      <View className="bg-emerald-950 px-2 py-0.5 rounded-full ml-2">
                        <Text className="text-emerald-400 text-[10px] font-semibold">
                          FOUNDER
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">
                      Export board-ready report
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#10b981" />
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {/* Key Results Progress */}
        {stats.krProgress && stats.krProgress.length > 0 && (
          <View className="px-6 pb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">
                Key Results
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/okrs")}
                className="active:opacity-70"
              >
                <Text className="text-blue-500 text-sm">View all</Text>
              </Pressable>
            </View>
            <View className="gap-3">
              {stats.krProgress.slice(0, 3).map((kr) => {
                const healthColor =
                  kr.healthStatus === "on_track"
                    ? "bg-green-500"
                    : kr.healthStatus === "at_risk"
                      ? "bg-yellow-500"
                      : "bg-red-500";
                const percentage = Math.round(kr.progress * 100);

                return (
                  <Pressable
                    key={kr.krId}
                    onPress={() => router.push("/(tabs)/okrs")}
                    className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="text-gray-900 dark:text-white font-medium flex-1 mr-2">
                        {kr.title}
                      </Text>
                      <View className={`w-2 h-2 rounded-full ${healthColor}`} />
                    </View>
                    <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <View
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </View>
                    <Text className="text-gray-600 dark:text-slate-400 text-xs mt-2">
                      {percentage}% complete
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Today's Tasks (Role-specific) */}
        {role === "Apprentice" &&
          stats.todaysTasks &&
          stats.todaysTasks.length > 0 && (
            <View className="px-6 pb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-semibold">
                  Your Tasks
                </Text>
                <Pressable
                  onPress={() => router.push("/(tabs)/work")}
                  className="active:opacity-70"
                >
                  <Text className="text-blue-500 text-sm">View all</Text>
                </Pressable>
              </View>
              <View className="gap-3">
                {stats.todaysTasks.slice(0, 5).map((task: any) => {
                  const priorityColor =
                    task.priority === "urgent"
                      ? "bg-red-500"
                      : task.priority === "high"
                        ? "bg-orange-500"
                        : task.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-slate-500";

                  const statusIcon =
                    task.status === "done" ? (
                      <CheckCircle2 size={16} color="#10b981" />
                    ) : task.status === "in_progress" ? (
                      <Clock size={16} color="#3b82f6" />
                    ) : null;

                  return (
                    <Pressable
                      key={task.id}
                      onPress={() => router.push("/(tabs)/work")}
                      className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 mr-2">
                          <Text className="text-gray-900 dark:text-white font-medium mb-1">
                            {task.title}
                          </Text>
                          <View className="flex-row items-center gap-2">
                            <View
                              className={`w-2 h-2 rounded-full ${priorityColor}`}
                            />
                            <Text className="text-gray-600 dark:text-slate-400 text-xs capitalize">
                              {task.function}
                            </Text>
                            {task.dueDate && (
                              <Text className="text-gray-600 dark:text-slate-500 text-xs">
                                • {new Date(task.dueDate).toLocaleDateString()}
                              </Text>
                            )}
                          </View>
                        </View>
                        {statusIcon}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

        {/* Review Queue (Fractional Exec) */}
        {role === "FractionalExec" &&
          stats.reviewQueue &&
          stats.reviewQueue.length > 0 && (
            <View className="px-6 pb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-semibold">
                  Review Queue
                </Text>
                <Pressable
                  onPress={() => router.push("/(tabs)/reviews")}
                  className="active:opacity-70"
                >
                  <Text className="text-blue-500 text-sm">View all</Text>
                </Pressable>
              </View>
              <View className="gap-3">
                {stats.reviewQueue.slice(0, 3).map((review: any) => (
                  <Pressable
                    key={review.id}
                    onPress={() => router.push("/(tabs)/reviews")}
                    className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-medium mb-1">
                          Task awaiting review
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          Requested{" "}
                          {new Date(review.requestedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <ArrowRight size={20} color="#64748b" />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

        {/* Quick Actions */}
        <View className="px-6 pb-6">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-3">
            Quick Actions
          </Text>
          <View className="gap-3">
            <Pressable
              onPress={() => router.push("/(tabs)/okrs")}
              className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <LinearGradient
                colors={["#2563eb", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 16,
                }}
              />
              <View className="flex-row items-center flex-1">
                <Target size={24} color="white" />
                <Text className="text-gray-900 dark:text-white font-semibold ml-3">View OKRs</Text>
              </View>
              <ArrowRight size={20} color="white" />
            </Pressable>

            <Pressable
              onPress={() => router.push("/(tabs)/work")}
              className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <LinearGradient
                colors={["#7c3aed", "#8b5cf6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 16,
                }}
              />
              <View className="flex-row items-center flex-1">
                <Briefcase size={24} color="white" />
                <Text className="text-gray-900 dark:text-white font-semibold ml-3">Work Hub</Text>
              </View>
              <ArrowRight size={20} color="white" />
            </Pressable>

            <Pressable
              onPress={() => router.push("/marketplace")}
              className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <LinearGradient
                colors={["#db2777", "#ec4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 16,
                }}
              />
              <View className="flex-row items-center flex-1">
                <Store size={24} color="white" />
                <Text className="text-gray-900 dark:text-white font-semibold ml-3">Marketplace</Text>
              </View>
              <ArrowRight size={20} color="white" />
            </Pressable>

            <Pressable
              onPress={() => router.push("/function-hub")}
              className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <LinearGradient
                colors={["#d97706", "#f59e0b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 16,
                }}
              />
              <View className="flex-row items-center flex-1">
                <Library size={24} color="white" />
                <Text className="text-gray-900 dark:text-white font-semibold ml-3">Function Library</Text>
              </View>
              <ArrowRight size={20} color="white" />
            </Pressable>

            {(role === "Founder" || role === "FractionalExec") && (
              <Pressable
                onPress={() => router.push("/reports")}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-70"
              >
                <LinearGradient
                  colors={["#059669", "#10b981"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 16,
                  }}
                />
                <View className="flex-row items-center flex-1">
                  <FileText size={24} color="white" />
                  <Text className="text-gray-900 dark:text-white font-semibold ml-3">Reports</Text>
                </View>
                <ArrowRight size={20} color="white" />
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Budget Setting Modal */}
      <Modal visible={showBudgetModal} transparent animationType="slide" onRequestClose={() => setShowBudgetModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View
            className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl"
            style={{ maxHeight: "90%", minHeight: "60%" }}
          >
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <Text className="text-gray-900 dark:text-white text-xl font-bold">
                Budget Targets
              </Text>
              <Pressable
                onPress={() => setShowBudgetModal(false)}
                className="active:opacity-70"
              >
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView
              className="px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              {/* Monthly Revenue Target */}
              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                  Monthly Revenue Target
                </Text>
                <View className="flex-row items-center bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-gray-900 dark:text-white mr-2">£</Text>
                  <TextInput
                    value={editingBudget.monthlyRevenue.toString()}
                    onChangeText={(text) =>
                      setEditingBudget({
                        ...editingBudget,
                        monthlyRevenue: parseInt(text) || 0,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="50000"
                    placeholderTextColor="#64748b"
                    className="text-gray-900 dark:text-white flex-1"
                  />
                </View>
              </View>

              {/* Max Team Cost */}
              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                  Max Team Cost
                </Text>
                <View className="flex-row items-center bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-gray-900 dark:text-white mr-2">£</Text>
                  <TextInput
                    value={editingBudget.maxTeamCost.toString()}
                    onChangeText={(text) =>
                      setEditingBudget({
                        ...editingBudget,
                        maxTeamCost: parseInt(text) || 0,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="30000"
                    placeholderTextColor="#64748b"
                    className="text-gray-900 dark:text-white flex-1"
                  />
                </View>
              </View>

              {/* Max AI Cost */}
              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Max AI Cost</Text>
                <View className="flex-row items-center bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-gray-900 dark:text-white mr-2">£</Text>
                  <TextInput
                    value={editingBudget.maxAICost.toString()}
                    onChangeText={(text) =>
                      setEditingBudget({
                        ...editingBudget,
                        maxAICost: parseInt(text) || 0,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="2500"
                    placeholderTextColor="#64748b"
                    className="text-gray-900 dark:text-white flex-1"
                  />
                </View>
              </View>

              {/* Max COGS */}
              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Max COGS</Text>
                <View className="flex-row items-center bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-gray-900 dark:text-white mr-2">£</Text>
                  <TextInput
                    value={editingBudget.maxCOGS.toString()}
                    onChangeText={(text) =>
                      setEditingBudget({
                        ...editingBudget,
                        maxCOGS: parseInt(text) || 0,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="20000"
                    placeholderTextColor="#64748b"
                    className="text-gray-900 dark:text-white flex-1"
                  />
                </View>
              </View>

              {/* Max Other Costs */}
              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                  Max Other Costs
                </Text>
                <View className="flex-row items-center bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-gray-900 dark:text-white mr-2">£</Text>
                  <TextInput
                    value={editingBudget.maxOtherCosts.toString()}
                    onChangeText={(text) =>
                      setEditingBudget({
                        ...editingBudget,
                        maxOtherCosts: parseInt(text) || 0,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="9000"
                    placeholderTextColor="#64748b"
                    className="text-gray-900 dark:text-white flex-1"
                  />
                </View>
              </View>

              {/* Target Burn Rate */}
              <View className="mb-6">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                  Target Burn Rate
                </Text>
                <View className="flex-row items-center bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-gray-900 dark:text-white mr-2">£</Text>
                  <TextInput
                    value={editingBudget.targetBurnRate.toString()}
                    onChangeText={(text) =>
                      setEditingBudget({
                        ...editingBudget,
                        targetBurnRate: parseInt(text) || 0,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="60000"
                    placeholderTextColor="#64748b"
                    className="text-gray-900 dark:text-white flex-1"
                  />
                </View>
              </View>

              {/* Save Button */}
              <Pressable
                onPress={() => {
                  setBudget(editingBudget);
                  setShowBudgetModal(false);
                  Alert.alert(
                    "Success",
                    "Budget targets updated successfully!",
                  );
                }}
                className="active:opacity-70"
              >
                <LinearGradient
                  colors={["#2563eb", "#3b82f6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <Text className="text-gray-900 dark:text-white font-bold text-base">
                    Save Budget
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Financial Details Modal */}
      <Modal visible={showDetailsModal} transparent animationType="slide" onRequestClose={() => setShowDetailsModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View
            className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl"
            style={{ maxHeight: "90%", minHeight: "60%" }}
          >
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <Text className="text-gray-900 dark:text-white text-xl font-bold">
                {detailsType === "revenue" && "Revenue Breakdown"}
                {detailsType === "profit" && "Profit Breakdown"}
                {detailsType === "burn" && "Burn Rate Breakdown"}
                {detailsType === "runway" && "Runway Details"}
                {detailsType === "cogs" && "COGS Breakdown"}
                {detailsType === "team" && "Team Costs Breakdown"}
                {detailsType === "ai" && "AI Services Breakdown"}
                {detailsType === "other" && "Other Costs Breakdown"}
              </Text>
              <Pressable
                onPress={() => setShowDetailsModal(false)}
                className="active:opacity-70"
              >
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView
              className="px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              {detailsType === "revenue" && (
                <View>
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      Monthly Revenue Sources
                    </Text>

                    {/* Product Sales */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">
                          Product Sales
                        </Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £
                          {(
                            financials.revenue.breakdown.productSales / 1000
                          ).toFixed(1)}
                          k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${(financials.revenue.breakdown.productSales / financials.revenue.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {(
                          (financials.revenue.breakdown.productSales /
                            financials.revenue.total) *
                          100
                        ).toFixed(1)}
                        % of total
                      </Text>
                    </View>

                    {/* Services */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Services</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £
                          {(
                            financials.revenue.breakdown.services / 1000
                          ).toFixed(1)}
                          k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-blue-500 h-full rounded-full"
                          style={{
                            width: `${(financials.revenue.breakdown.services / financials.revenue.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {(
                          (financials.revenue.breakdown.services /
                            financials.revenue.total) *
                          100
                        ).toFixed(1)}
                        % of total
                      </Text>
                    </View>

                    {/* Recurring */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">
                          Recurring
                        </Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £
                          {(
                            financials.revenue.breakdown.recurring / 1000
                          ).toFixed(1)}
                          k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-purple-500 h-full rounded-full"
                          style={{
                            width: `${(financials.revenue.breakdown.recurring / financials.revenue.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {(
                          (financials.revenue.breakdown.recurring /
                            financials.revenue.total) *
                          100
                        ).toFixed(1)}
                        % of total
                      </Text>
                    </View>

                    {/* Other */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Other</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £
                          {(financials.revenue.breakdown.other / 1000).toFixed(
                            1,
                          )}
                          k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-amber-500 h-full rounded-full"
                          style={{
                            width: `${(financials.revenue.breakdown.other / financials.revenue.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {(
                          (financials.revenue.breakdown.other /
                            financials.revenue.total) *
                          100
                        ).toFixed(1)}
                        % of total
                      </Text>
                    </View>
                  </View>

                  {/* Total */}
                  <View className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-emerald-400 font-semibold">
                        Total Monthly Revenue
                      </Text>
                      <Text className="text-emerald-400 text-xl font-bold">
                        £{(financials.revenue.total / 1000).toFixed(1)}k
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {detailsType === "profit" && (
                <View>
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      Monthly Profit Calculation
                    </Text>

                    {/* Revenue */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Revenue</Text>
                        <Text className="text-emerald-400 font-bold">
                          £{(financials.revenue.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                    </View>

                    {/* COGS/BOM */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">
                          COGS (Bill of Materials)
                        </Text>
                        <Text className="text-red-400 font-bold">
                          -£{(financials.cogs.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="ml-4 mt-2">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            Materials
                          </Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.cogs.breakdown.materials / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            Manufacturing
                          </Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.cogs.breakdown.manufacturing / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            Shipping
                          </Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.cogs.breakdown.shipping / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">Other</Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(financials.cogs.breakdown.other / 1000).toFixed(
                              1,
                            )}
                            k
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Gross Profit */}
                  <View className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-blue-400 font-semibold">
                        Gross Profit
                      </Text>
                      <Text className="text-blue-400 text-xl font-bold">
                        £{(ratios.grossProfit / 1000).toFixed(1)}k
                      </Text>
                    </View>
                    <Text className="text-blue-300 text-xs">
                      {ratios.grossMargin.toFixed(1)}% margin
                    </Text>
                  </View>
                </View>
              )}

              {detailsType === "burn" && (
                <View>
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      Monthly Burn Rate by Category
                    </Text>

                    {/* Sales/Revenue (shown as COGS) */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">
                          Bill of Materials (BOM)
                        </Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.cogs.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-purple-500 h-full rounded-full"
                          style={{
                            width: `${(financials.cogs.total / financials.burnRate) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {(
                          (financials.cogs.total / financials.burnRate) *
                          100
                        ).toFixed(1)}
                        % of burn
                      </Text>
                    </View>

                    {/* People */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">People</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.teamCosts.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${ratios.teamBurnPercentage}%` }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {ratios.teamBurnPercentage.toFixed(1)}% of burn
                      </Text>
                      <View className="ml-4 mt-2">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            Founders
                          </Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.teamCosts.breakdown.founders / 1000
                            ).toFixed(1)}
                            k ({financials.teamCosts.headcount.founders})
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            Fractional Execs
                          </Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.teamCosts.breakdown.fractionalExecs /
                              1000
                            ).toFixed(1)}
                            k ({financials.teamCosts.headcount.fractionalExecs})
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            Apprentices
                          </Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.teamCosts.breakdown.apprentices / 1000
                            ).toFixed(1)}
                            k ({financials.teamCosts.headcount.apprentices})
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* AI */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">
                          AI Services
                        </Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.aiCosts.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${ratios.aiBurnPercentage}%` }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {ratios.aiBurnPercentage.toFixed(1)}% of burn
                      </Text>
                      <View className="ml-4 mt-2">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">OpenAI</Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.aiCosts.breakdown.openai / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            Anthropic
                          </Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.aiCosts.breakdown.anthropic / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">Google</Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.aiCosts.breakdown.google / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            ElevenLabs
                          </Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.aiCosts.breakdown.elevenlabs / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">Other</Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.aiCosts.breakdown.other / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Other */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">
                          Other Costs
                        </Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.otherCosts.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-amber-500 h-full rounded-full"
                          style={{
                            width: `${(financials.otherCosts.total / financials.burnRate) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {(
                          (financials.otherCosts.total / financials.burnRate) *
                          100
                        ).toFixed(1)}
                        % of burn
                      </Text>
                      <View className="ml-4 mt-2">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">Office</Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.otherCosts.breakdown.office / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            Software
                          </Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.otherCosts.breakdown.software / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            Marketing
                          </Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.otherCosts.breakdown.marketing / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">Legal</Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.otherCosts.breakdown.legal / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">Other</Text>
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">
                            £
                            {(
                              financials.otherCosts.breakdown.other / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Total Burn */}
                  <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-red-400 font-semibold">
                        Total Monthly Burn
                      </Text>
                      <Text className="text-red-400 text-xl font-bold">
                        £{(financials.burnRate / 1000).toFixed(1)}k
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {detailsType === "runway" && (
                <View>
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      Current Status
                    </Text>

                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">
                          Cash Balance
                        </Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.cashBalance / 1000).toFixed(0)}k
                        </Text>
                      </View>
                    </View>

                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">
                          Monthly Burn Rate
                        </Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.burnRate / 1000).toFixed(1)}k
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Runway Result */}
                  <View className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 mb-6">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-amber-400 font-semibold">
                        Runway Remaining
                      </Text>
                      <Text className="text-amber-400 text-xl font-bold">
                        {financials.runway.toFixed(1)} months
                      </Text>
                    </View>
                    <Text className="text-amber-300 text-xs">
                      Based on current burn rate of £
                      {(financials.burnRate / 1000).toFixed(0)}k/month
                    </Text>
                  </View>

                  {/* 12-Month Forecast */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                      12-Month Forecast
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      Projected cash balance assuming current burn rate
                    </Text>

                    {(() => {
                      const months = [];
                      let balance = financials.cashBalance;
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const today = new Date();

                      for (let i = 0; i < 12; i++) {
                        const monthIndex = (today.getMonth() + i) % 12;
                        const projectedBalance = Math.max(0, balance - (financials.burnRate * i));
                        months.push({
                          month: monthNames[monthIndex],
                          balance: projectedBalance,
                          percentage: (projectedBalance / financials.cashBalance) * 100,
                        });
                      }

                      return (
                        <View>
                          {months.map((m, idx) => (
                            <View key={idx} className="mb-3">
                              <View className="flex-row items-center justify-between mb-1">
                                <Text className="text-gray-900 dark:text-white text-sm font-medium">
                                  {m.month}
                                </Text>
                                <Text className={`text-sm font-bold ${
                                  m.balance === 0
                                    ? 'text-red-400'
                                    : m.percentage < 30
                                    ? 'text-amber-400'
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  £{(m.balance / 1000).toFixed(0)}k
                                </Text>
                              </View>
                              <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <View
                                  className={`h-full rounded-full ${
                                    m.balance === 0
                                      ? 'bg-red-500'
                                      : m.percentage < 30
                                      ? 'bg-amber-500'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{
                                    width: `${Math.max(2, m.percentage)}%`,
                                  }}
                                />
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })()}
                  </View>

                  {/* Burn Rate Scenarios */}
                  <View className="mb-6">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                      Burn Rate Scenarios
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      How different burn rates affect runway
                    </Text>

                    {[
                      { label: 'Increase 25%', multiplier: 1.25, color: 'red' },
                      { label: 'Current', multiplier: 1, color: 'amber' },
                      { label: 'Reduce 25%', multiplier: 0.75, color: 'green' },
                      { label: 'Reduce 50%', multiplier: 0.5, color: 'blue' },
                    ].map((scenario, idx) => {
                      const newBurn = financials.burnRate * scenario.multiplier;
                      const newRunway = financials.cashBalance / newBurn;

                      return (
                        <View key={idx} className="mb-3 bg-gray-100 dark:bg-slate-900 rounded-xl p-3">
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-900 dark:text-white text-sm font-medium">
                              {scenario.label}
                            </Text>
                            <Text className={`text-${scenario.color}-400 text-lg font-bold`}>
                              {newRunway.toFixed(1)}m
                            </Text>
                          </View>
                          <View className="flex-row items-center justify-between">
                            <Text className="text-gray-600 dark:text-slate-400 text-xs">
                              £{(newBurn / 1000).toFixed(1)}k/month
                            </Text>
                            <Text className={`text-${scenario.color}-400 text-xs font-semibold`}>
                              {newRunway >= 12 ? '✓ Healthy' : newRunway >= 6 ? '⚠ Warning' : '⚠ Critical'}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <View className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                    <Text className="text-blue-300 text-sm font-medium mb-1">
                      💡 Runway Strategy
                    </Text>
                    <Text className="text-blue-300/80 text-xs">
                      {financials.runway < 6
                        ? 'Critical: Reduce burn immediately or raise capital within 3 months'
                        : financials.runway < 12
                        ? 'Warning: Focus on burn reduction or revenue growth in next quarter'
                        : 'Healthy: Maintain current trajectory and plan for growth'}
                    </Text>
                  </View>
                </View>
              )}

              {detailsType === "cogs" && (
                <View>
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      Cost of Goods Sold (COGS) Breakdown
                    </Text>

                    {/* Materials */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Materials</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.cogs.breakdown.materials / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-purple-500 h-full rounded-full"
                          style={{
                            width: `${(financials.cogs.breakdown.materials / financials.cogs.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.cogs.breakdown.materials / financials.cogs.total) * 100).toFixed(1)}% of COGS
                      </Text>
                    </View>

                    {/* Manufacturing */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Manufacturing</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.cogs.breakdown.manufacturing / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-purple-400 h-full rounded-full"
                          style={{
                            width: `${(financials.cogs.breakdown.manufacturing / financials.cogs.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.cogs.breakdown.manufacturing / financials.cogs.total) * 100).toFixed(1)}% of COGS
                      </Text>
                    </View>

                    {/* Shipping */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Shipping</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.cogs.breakdown.shipping / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-purple-300 h-full rounded-full"
                          style={{
                            width: `${(financials.cogs.breakdown.shipping / financials.cogs.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.cogs.breakdown.shipping / financials.cogs.total) * 100).toFixed(1)}% of COGS
                      </Text>
                    </View>

                    {/* Other COGS */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Other</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.cogs.breakdown.other / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-purple-600 h-full rounded-full"
                          style={{
                            width: `${(financials.cogs.breakdown.other / financials.cogs.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.cogs.breakdown.other / financials.cogs.total) * 100).toFixed(1)}% of COGS
                      </Text>
                    </View>
                  </View>

                  {/* Total */}
                  <View className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-purple-400 font-semibold">Total COGS</Text>
                      <Text className="text-purple-400 text-xl font-bold">
                        £{(financials.cogs.total / 1000).toFixed(1)}k
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {detailsType === "team" && (
                <View>
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      Team Costs Breakdown
                    </Text>

                    {/* Founders */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Founders</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.teamCosts.breakdown.founders / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-blue-500 h-full rounded-full"
                          style={{
                            width: `${(financials.teamCosts.breakdown.founders / financials.teamCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.teamCosts.breakdown.founders / financials.teamCosts.total) * 100).toFixed(1)}% of team costs • {financials.teamCosts.headcount.founders} people
                      </Text>
                    </View>

                    {/* Fractional Execs */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Fractional Executives</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.teamCosts.breakdown.fractionalExecs / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-blue-400 h-full rounded-full"
                          style={{
                            width: `${(financials.teamCosts.breakdown.fractionalExecs / financials.teamCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.teamCosts.breakdown.fractionalExecs / financials.teamCosts.total) * 100).toFixed(1)}% of team costs • {financials.teamCosts.headcount.fractionalExecs} people
                      </Text>
                    </View>

                    {/* Apprentices */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Apprentices</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.teamCosts.breakdown.apprentices / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-blue-300 h-full rounded-full"
                          style={{
                            width: `${(financials.teamCosts.breakdown.apprentices / financials.teamCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.teamCosts.breakdown.apprentices / financials.teamCosts.total) * 100).toFixed(1)}% of team costs • {financials.teamCosts.headcount.apprentices} people
                      </Text>
                    </View>
                  </View>

                  {/* Total */}
                  <View className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-blue-400 font-semibold">Total Team Costs</Text>
                      <Text className="text-blue-400 text-xl font-bold">
                        £{(financials.teamCosts.total / 1000).toFixed(1)}k
                      </Text>
                    </View>
                    <Text className="text-blue-300 text-xs">
                      {ratios.teamBurnPercentage.toFixed(1)}% of monthly burn
                    </Text>
                  </View>
                </View>
              )}

              {detailsType === "ai" && (
                <View>
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      AI Services Breakdown
                    </Text>

                    {/* OpenAI */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">OpenAI</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.aiCosts.breakdown.openai / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${(financials.aiCosts.breakdown.openai / financials.aiCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.aiCosts.breakdown.openai / financials.aiCosts.total) * 100).toFixed(1)}% of AI costs
                      </Text>
                    </View>

                    {/* Anthropic */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Anthropic</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.aiCosts.breakdown.anthropic / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-emerald-400 h-full rounded-full"
                          style={{
                            width: `${(financials.aiCosts.breakdown.anthropic / financials.aiCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.aiCosts.breakdown.anthropic / financials.aiCosts.total) * 100).toFixed(1)}% of AI costs
                      </Text>
                    </View>

                    {/* Google */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Google</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.aiCosts.breakdown.google / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-emerald-300 h-full rounded-full"
                          style={{
                            width: `${(financials.aiCosts.breakdown.google / financials.aiCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.aiCosts.breakdown.google / financials.aiCosts.total) * 100).toFixed(1)}% of AI costs
                      </Text>
                    </View>

                    {/* ElevenLabs */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">ElevenLabs</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.aiCosts.breakdown.elevenlabs / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-emerald-600 h-full rounded-full"
                          style={{
                            width: `${(financials.aiCosts.breakdown.elevenlabs / financials.aiCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.aiCosts.breakdown.elevenlabs / financials.aiCosts.total) * 100).toFixed(1)}% of AI costs
                      </Text>
                    </View>

                    {/* Other AI */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Other</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.aiCosts.breakdown.other / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-emerald-700 h-full rounded-full"
                          style={{
                            width: `${(financials.aiCosts.breakdown.other / financials.aiCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.aiCosts.breakdown.other / financials.aiCosts.total) * 100).toFixed(1)}% of AI costs
                      </Text>
                    </View>
                  </View>

                  {/* Total */}
                  <View className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-emerald-400 font-semibold">Total AI Costs</Text>
                      <Text className="text-emerald-400 text-xl font-bold">
                        £{(financials.aiCosts.total / 1000).toFixed(1)}k
                      </Text>
                    </View>
                    <Text className="text-emerald-300 text-xs">
                      {ratios.aiBurnPercentage.toFixed(1)}% of monthly burn
                    </Text>
                  </View>
                </View>
              )}

              {detailsType === "other" && (
                <View>
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      Other Costs Breakdown
                    </Text>

                    {/* Office */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Office & Facilities</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.otherCosts.breakdown.office / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-amber-500 h-full rounded-full"
                          style={{
                            width: `${(financials.otherCosts.breakdown.office / financials.otherCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.otherCosts.breakdown.office / financials.otherCosts.total) * 100).toFixed(1)}% of other costs
                      </Text>
                    </View>

                    {/* Software */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Software & Tools</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.otherCosts.breakdown.software / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-amber-400 h-full rounded-full"
                          style={{
                            width: `${(financials.otherCosts.breakdown.software / financials.otherCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.otherCosts.breakdown.software / financials.otherCosts.total) * 100).toFixed(1)}% of other costs
                      </Text>
                    </View>

                    {/* Marketing */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Marketing</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.otherCosts.breakdown.marketing / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-amber-300 h-full rounded-full"
                          style={{
                            width: `${(financials.otherCosts.breakdown.marketing / financials.otherCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.otherCosts.breakdown.marketing / financials.otherCosts.total) * 100).toFixed(1)}% of other costs
                      </Text>
                    </View>

                    {/* Legal */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Legal & Compliance</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.otherCosts.breakdown.legal / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-amber-600 h-full rounded-full"
                          style={{
                            width: `${(financials.otherCosts.breakdown.legal / financials.otherCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.otherCosts.breakdown.legal / financials.otherCosts.total) * 100).toFixed(1)}% of other costs
                      </Text>
                    </View>

                    {/* Other */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 dark:text-white font-medium">Miscellaneous</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">
                          £{(financials.otherCosts.breakdown.other / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-amber-700 h-full rounded-full"
                          style={{
                            width: `${(financials.otherCosts.breakdown.other / financials.otherCosts.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-gray-600 dark:text-slate-500 text-xs mt-1">
                        {((financials.otherCosts.breakdown.other / financials.otherCosts.total) * 100).toFixed(1)}% of other costs
                      </Text>
                    </View>
                  </View>

                  {/* Total */}
                  <View className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-amber-400 font-semibold">Total Other Costs</Text>
                      <Text className="text-amber-400 text-xl font-bold">
                        £{(financials.otherCosts.total / 1000).toFixed(1)}k
                      </Text>
                    </View>
                    <Text className="text-amber-300 text-xs">
                      {((financials.otherCosts.total / financials.burnRate) * 100).toFixed(1)}% of monthly burn
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Scenario Planning Modal */}
      <Modal visible={showScenarioPlanningModal} transparent animationType="slide" onRequestClose={() => setShowScenarioPlanningModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: "90%", minHeight: "60%" }}>
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <View className="flex-row items-center gap-2">
                <Sparkles size={24} color="#3b82f6" />
                <Text className="text-gray-900 dark:text-white text-xl font-bold">Interactive Scenario Planning</Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowScenarioPlanningModal(false);
                  // Reset sliders
                  setRevenueIncrease(30);
                  setBurnReduction(20);
                  setCustomRevenue(0);
                  setCustomBurn(0);
                }}
                className="active:opacity-70"
              >
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView
              className="px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              {/* Current Situation - Compact */}
              <View className="mb-6 bg-gray-200 dark:bg-slate-800 rounded-xl p-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-3">Current Financials</Text>
                <View className="flex-row justify-between flex-wrap gap-y-2">
                  <View className="w-[48%]">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">Revenue</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">£{(financials.revenue.total / 1000).toFixed(0)}k</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">Burn Rate</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">£{(financials.burnRate / 1000).toFixed(1)}k</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">Cash Balance</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">£{(financials.cashBalance / 1000).toFixed(0)}k</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">Runway</Text>
                    <Text className="text-amber-400 font-bold text-lg">{financials.runway.toFixed(1)}m</Text>
                  </View>
                </View>
              </View>

              {/* Interactive Revenue Slider */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <TrendingUp size={20} color="#10b981" />
                    <Text className="text-gray-900 dark:text-white font-semibold">Increase Revenue</Text>
                  </View>
                  <Text className="text-emerald-400 font-bold text-xl">+{revenueIncrease}%</Text>
                </View>
                <Slider
                  value={revenueIncrease}
                  onValueChange={setRevenueIncrease}
                  minimumValue={0}
                  maximumValue={100}
                  step={5}
                  minimumTrackTintColor="#10b981"
                  maximumTrackTintColor="#334155"
                  thumbTintColor="#10b981"
                />
                <View className="flex-row justify-between mt-1">
                  <Text className="text-gray-600 dark:text-slate-500 text-xs">0%</Text>
                  <Text className="text-gray-600 dark:text-slate-500 text-xs">100%</Text>
                </View>

                {revenueIncrease > 0 && (
                  <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mt-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-emerald-400 font-semibold">New Revenue</Text>
                      <Text className="text-gray-900 dark:text-white font-bold text-lg">
                        £{((financials.revenue.total * (1 + revenueIncrease / 100)) / 1000).toFixed(1)}k/mo
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Additional Revenue</Text>
                      <Text className="text-emerald-400 font-semibold">
                        +£{((financials.revenue.total * (revenueIncrease / 100)) / 1000).toFixed(1)}k/mo
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Impact on Runway</Text>
                      <Text className="text-emerald-400 font-bold">
                        +{(((financials.cashBalance / (financials.burnRate - financials.revenue.total * (revenueIncrease / 100))) - financials.runway) || 0).toFixed(1)}m
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Interactive Burn Reduction Slider */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <TrendingDown size={20} color="#3b82f6" />
                    <Text className="text-gray-900 dark:text-white font-semibold">Reduce Burn Rate</Text>
                  </View>
                  <Text className="text-blue-400 font-bold text-xl">-{burnReduction}%</Text>
                </View>
                <Slider
                  value={burnReduction}
                  onValueChange={setBurnReduction}
                  minimumValue={0}
                  maximumValue={50}
                  step={5}
                  minimumTrackTintColor="#3b82f6"
                  maximumTrackTintColor="#334155"
                  thumbTintColor="#3b82f6"
                />
                <View className="flex-row justify-between mt-1">
                  <Text className="text-gray-600 dark:text-slate-500 text-xs">0%</Text>
                  <Text className="text-gray-600 dark:text-slate-500 text-xs">50%</Text>
                </View>

                {burnReduction > 0 && (
                  <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-blue-400 font-semibold">New Burn Rate</Text>
                      <Text className="text-gray-900 dark:text-white font-bold text-lg">
                        £{((financials.burnRate * (1 - burnReduction / 100)) / 1000).toFixed(1)}k/mo
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Monthly Savings</Text>
                      <Text className="text-blue-400 font-semibold">
                        £{((financials.burnRate * (burnReduction / 100)) / 1000).toFixed(1)}k/mo
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">Impact on Runway</Text>
                      <Text className="text-blue-400 font-bold">
                        +{((financials.cashBalance / (financials.burnRate * (1 - burnReduction / 100))) - financials.runway).toFixed(1)}m
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Combined Scenario Impact */}
              {(revenueIncrease > 0 || burnReduction > 0) && (
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-3">
                    <BarChart size={20} color="#a855f7" />
                    <Text className="text-gray-900 dark:text-white font-semibold text-lg">Combined Impact</Text>
                  </View>

                  <View className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
                    <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 mb-3">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-gray-600 dark:text-slate-400">New Monthly P&L</Text>
                        <Text className="text-gray-900 dark:text-white font-bold text-xl">
                          {((financials.revenue.total * (1 + revenueIncrease / 100) - financials.burnRate * (1 - burnReduction / 100)) / 1000) >= 0 ? '+' : ''}
                          £{((financials.revenue.total * (1 + revenueIncrease / 100) - financials.burnRate * (1 - burnReduction / 100)) / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="h-px bg-slate-700 mb-3" />
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">Revenue</Text>
                        <Text className="text-emerald-400 font-semibold">
                          £{((financials.revenue.total * (1 + revenueIncrease / 100)) / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">Burn Rate</Text>
                        <Text className="text-blue-400 font-semibold">
                          £{((financials.burnRate * (1 - burnReduction / 100)) / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">Net Burn</Text>
                        <Text className={`font-bold ${
                          (financials.revenue.total * (1 + revenueIncrease / 100) - financials.burnRate * (1 - burnReduction / 100)) >= 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}>
                          £{((financials.revenue.total * (1 + revenueIncrease / 100) - financials.burnRate * (1 - burnReduction / 100)) / 1000).toFixed(1)}k
                        </Text>
                      </View>
                    </View>

                    <View className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                          <Zap size={18} color="#a855f7" />
                          <Text className="text-purple-300 font-semibold">New Runway</Text>
                        </View>
                        <Text className="text-gray-900 dark:text-white font-bold text-2xl">
                          {(() => {
                            const newBurn = financials.burnRate * (1 - burnReduction / 100) - financials.revenue.total * (revenueIncrease / 100);
                            if (newBurn <= 0) return '∞';
                            return (financials.cashBalance / newBurn).toFixed(1) + 'm';
                          })()}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-purple-200 text-sm">Extension</Text>
                        <Text className="text-emerald-400 font-bold text-lg">
                          {(() => {
                            const newBurn = financials.burnRate * (1 - burnReduction / 100) - financials.revenue.total * (revenueIncrease / 100);
                            if (newBurn <= 0) return '♾️  Profitable!';
                            const newRunway = financials.cashBalance / newBurn;
                            return '+' + (newRunway - financials.runway).toFixed(1) + ' months';
                          })()}
                        </Text>
                      </View>
                    </View>

                    {(() => {
                      const newBurn = financials.burnRate * (1 - burnReduction / 100) - financials.revenue.total * (revenueIncrease / 100);
                      if (newBurn <= 0) {
                        return (
                          <View className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-4 mt-3">
                            <Text className="text-emerald-400 font-bold text-center text-lg">
                              🎉 Break-even Achieved!
                            </Text>
                            <Text className="text-emerald-300 text-center text-sm mt-2">
                              Your company is now cash flow positive
                            </Text>
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </View>
                </View>
              )}

              {/* Quick Action Buttons */}
              <View className="mb-6">
                <Text className="text-gray-900 dark:text-white font-semibold mb-3">Quick Presets</Text>
                <View className="flex-row gap-2 mb-2">
                  <Pressable
                    onPress={() => {
                      setRevenueIncrease(30);
                      setBurnReduction(0);
                    }}
                    className="flex-1 bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 active:opacity-70"
                  >
                    <Text className="text-emerald-400 font-semibold text-center text-sm">Growth Focus</Text>
                    <Text className="text-emerald-300 text-center text-xs mt-1">+30% Revenue</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setRevenueIncrease(0);
                      setBurnReduction(25);
                    }}
                    className="flex-1 bg-blue-500/20 border border-blue-500/40 rounded-xl p-3 active:opacity-70"
                  >
                    <Text className="text-blue-400 font-semibold text-center text-sm">Efficiency Focus</Text>
                    <Text className="text-blue-300 text-center text-xs mt-1">-25% Burn</Text>
                  </Pressable>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      setRevenueIncrease(15);
                      setBurnReduction(15);
                    }}
                    className="flex-1 bg-purple-500/20 border border-purple-500/40 rounded-xl p-3 active:opacity-70"
                  >
                    <Text className="text-purple-400 font-semibold text-center text-sm">Balanced</Text>
                    <Text className="text-purple-300 text-center text-xs mt-1">+15% Rev, -15% Burn</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setRevenueIncrease(0);
                      setBurnReduction(0);
                    }}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-xl p-3 active:opacity-70"
                  >
                    <Text className="text-gray-700 dark:text-slate-300 font-semibold text-center text-sm">Reset</Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-center text-xs mt-1">Clear All</Text>
                  </Pressable>
                </View>
              </View>

              {/* Break-even Calculator */}
              <View className="mb-4 bg-gray-200 dark:bg-slate-800 rounded-xl p-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Path to Break-even</Text>
                <Text className="text-gray-700 dark:text-slate-300 text-sm mb-3">
                  To reach break-even (£0 net burn):
                </Text>
                <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-700 dark:text-slate-300 text-sm">Revenue needed:</Text>
                    <Text className="text-emerald-400 font-bold">
                      £{(financials.burnRate / 1000).toFixed(1)}k/mo
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-700 dark:text-slate-300 text-sm">Growth required:</Text>
                    <Text className="text-emerald-400 font-bold">
                      {((financials.burnRate / financials.revenue.total - 1) * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
