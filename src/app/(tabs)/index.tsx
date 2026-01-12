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
} from "lucide-react-native";
import {
  useCurrentWorkspace,
  useCurrentMembership,
  useCurrentUser,
} from "@/lib/state/app-store";
import { useDashboardStats } from "@/lib/hooks/queries";
import { router } from "expo-router";
import {
  CURRENT_FINANCIALS,
  DEFAULT_BUDGET,
  calculateFinancialRatios,
  calculateBudgetVariance,
  FINANCIAL_HISTORY,
  type BudgetTargets,
} from "@/lib/financial-seed";

export default function HomeScreen() {
  // Home screen with dashboard
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  const { data: stats, isLoading } = useDashboardStats(
    currentWorkspace?.id ?? null,
  );

  // Financial dashboard state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budget, setBudget] = useState<BudgetTargets>(DEFAULT_BUDGET);
  const [editingBudget, setEditingBudget] =
    useState<BudgetTargets>(DEFAULT_BUDGET);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsType, setDetailsType] = useState<
    "revenue" | "profit" | "burn" | "runway" | null
  >(null);
  const [showScenarioPlanningModal, setShowScenarioPlanningModal] = useState(false);

  const financials = CURRENT_FINANCIALS;
  const ratios = calculateFinancialRatios(financials);
  const variance = calculateBudgetVariance(financials, budget);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!stats || !currentMembership) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <Text className="text-slate-400 text-center">
          No workspace selected
        </Text>
      </View>
    );
  }

  const role = currentMembership.role;

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView className="flex-1">
        {/* Header Section */}
        <View className="p-6 pb-4">
          <Text className="text-slate-400 text-sm mb-1">Welcome back,</Text>
          <Text className="text-white text-2xl font-bold">
            {currentUser?.name}
          </Text>
          <View className="mt-2 bg-blue-500/20 self-start px-3 py-1 rounded-full">
            <Text className="text-blue-400 text-xs font-semibold">{role}</Text>
          </View>
        </View>

        {/* KPI Tiles */}
        <View className="px-6 pb-4">
          <View className="flex-row flex-wrap gap-3">
            {stats.kpiTiles?.map((tile, index) => (
              <View
                key={index}
                className="bg-slate-900 rounded-2xl p-4 border border-slate-800"
                style={{ width: "48%" }}
              >
                <Text className="text-slate-400 text-xs mb-1">
                  {tile.label}
                </Text>
                <Text className="text-white text-2xl font-bold">
                  {tile.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Financial Dashboard - Founders Only */}
        {role === "Founder" && (
          <View className="px-6 pb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-semibold">
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
                    <Text className="text-slate-400 text-sm">Budget</Text>
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
                className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
                style={{ width: "48%" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <DollarSign size={20} color="#10b981" />
                  <Text className="text-slate-400 text-xs">
                    Monthly Revenue
                  </Text>
                </View>
                <Text className="text-white text-2xl font-bold">
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
                className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
                style={{ width: "48%" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <TrendingUp size={20} color="#3b82f6" />
                  <Text className="text-slate-400 text-xs">
                    Monthly Gross Profit
                  </Text>
                </View>
                <Text className="text-white text-2xl font-bold">
                  £{(ratios.grossProfit / 1000).toFixed(0)}k
                </Text>
                <Text className="text-slate-500 text-xs mt-1">
                  {ratios.grossMargin.toFixed(1)}% margin
                </Text>
              </Pressable>

              {/* Burn Rate Card */}
              <Pressable
                onPress={() => {
                  setDetailsType("burn");
                  setShowDetailsModal(true);
                }}
                className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
                style={{ width: "48%" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <TrendingDown size={20} color="#ef4444" />
                  <Text className="text-slate-400 text-xs">Monthly Burn</Text>
                </View>
                <Text className="text-white text-2xl font-bold">
                  £{(financials.burnRate / 1000).toFixed(0)}k
                </Text>
                <Text className="text-slate-500 text-xs mt-1">
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
                className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
                style={{ width: "48%" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Calendar size={20} color="#f59e0b" />
                  <Text className="text-slate-400 text-xs">Runway</Text>
                </View>
                <Text className="text-white text-2xl font-bold">
                  {financials.runway.toFixed(1)}
                </Text>
                <Text className="text-slate-500 text-xs mt-1">months</Text>
              </Pressable>
            </View>

            {/* Cost Breakdown */}
            <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-3">
              <Text className="text-white font-semibold mb-3">
                Cost Breakdown
              </Text>

              {/* COGS */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Package size={16} color="#8b5cf6" />
                    <Text className="text-slate-300 text-sm">COGS</Text>
                  </View>
                  <Text className="text-white font-semibold">
                    £{(financials.cogs.total / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-purple-500 h-full rounded-full"
                    style={{
                      width: `${(financials.cogs.total / financials.burnRate) * 100}%`,
                    }}
                  />
                </View>
                <Text className="text-slate-500 text-xs mt-1">
                  {(
                    (financials.cogs.total / financials.burnRate) *
                    100
                  ).toFixed(1)}
                  % of burn
                </Text>
              </View>

              {/* Team Costs */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Users size={16} color="#3b82f6" />
                    <Text className="text-slate-300 text-sm">Team</Text>
                  </View>
                  <Text className="text-white font-semibold">
                    £{(financials.teamCosts.total / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${ratios.teamBurnPercentage}%` }}
                  />
                </View>
                <Text className="text-slate-500 text-xs mt-1">
                  {ratios.teamBurnPercentage.toFixed(1)}% of burn •{" "}
                  {financials.teamCosts.headcount.fractionalExecs} execs,{" "}
                  {financials.teamCosts.headcount.apprentices} apprentices
                </Text>
              </View>

              {/* AI Costs */}
              <View className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Bot size={16} color="#10b981" />
                    <Text className="text-slate-300 text-sm">AI Services</Text>
                  </View>
                  <Text className="text-white font-semibold">
                    £{(financials.aiCosts.total / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${ratios.aiBurnPercentage}%` }}
                  />
                </View>
                <Text className="text-slate-500 text-xs mt-1">
                  {ratios.aiBurnPercentage.toFixed(1)}% of burn
                </Text>
              </View>

              {/* Other Costs */}
              <View>
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Briefcase size={16} color="#f59e0b" />
                    <Text className="text-slate-300 text-sm">Other</Text>
                  </View>
                  <Text className="text-white font-semibold">
                    £{(financials.otherCosts.total / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${(financials.otherCosts.total / financials.burnRate) * 100}%`,
                    }}
                  />
                </View>
                <Text className="text-slate-500 text-xs mt-1">
                  {(
                    (financials.otherCosts.total / financials.burnRate) *
                    100
                  ).toFixed(1)}
                  % of burn
                </Text>
              </View>
            </View>

            {/* Net Profit/Loss */}
            <View className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-400 text-sm">Net Profit/Loss</Text>
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
              <Text className="text-slate-500 text-xs mt-1">
                {ratios.netMargin.toFixed(1)}% net margin
              </Text>
            </View>
          </View>
        )}

        {/* Reports Section */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-semibold">Reports</Text>
          </View>
          <View className="gap-3">
            {/* Weekly Report Card */}
            <Pressable
              onPress={() => router.push("/reports?period=week")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 active:opacity-80"
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
                    <Text className="text-white font-semibold ml-2">
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
                className="flex-1 bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-80"
              >
                <BarChart3 size={24} color="#10b981" />
                <Text className="text-white font-semibold mt-2 mb-1">
                  Monthly
                </Text>
                <Text className="text-slate-400 text-xs">30 day overview</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/reports?period=quarter")}
                className="flex-1 bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-80"
              >
                <PieChart size={24} color="#f59e0b" />
                <Text className="text-white font-semibold mt-2 mb-1">
                  Quarterly
                </Text>
                <Text className="text-slate-400 text-xs">90 day summary</Text>
              </Pressable>
            </View>

            {/* Board Pack for Founders */}
            {role === "Founder" && (
              <Pressable
                onPress={() =>
                  router.push("/reports?period=month&export=boardpack")
                }
                className="bg-slate-900 rounded-2xl p-4 border border-emerald-800 active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <FileText size={18} color="#10b981" />
                      <Text className="text-white font-semibold ml-2">
                        Board Pack
                      </Text>
                      <View className="bg-emerald-950 px-2 py-0.5 rounded-full ml-2">
                        <Text className="text-emerald-400 text-[10px] font-semibold">
                          FOUNDER
                        </Text>
                      </View>
                    </View>
                    <Text className="text-slate-400 text-xs">
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
              <Text className="text-white text-lg font-semibold">
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
                  <View
                    key={kr.krId}
                    className="bg-slate-900 rounded-2xl p-4 border border-slate-800"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="text-white font-medium flex-1 mr-2">
                        {kr.title}
                      </Text>
                      <View className={`w-2 h-2 rounded-full ${healthColor}`} />
                    </View>
                    <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                      <View
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </View>
                    <Text className="text-slate-400 text-xs mt-2">
                      {percentage}% complete
                    </Text>
                  </View>
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
                <Text className="text-white text-lg font-semibold">
                  Your Tasks
                </Text>
                <Pressable
                  onPress={() => router.push("/work")}
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
                      onPress={() => router.push("/work")}
                      className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 mr-2">
                          <Text className="text-white font-medium mb-1">
                            {task.title}
                          </Text>
                          <View className="flex-row items-center gap-2">
                            <View
                              className={`w-2 h-2 rounded-full ${priorityColor}`}
                            />
                            <Text className="text-slate-400 text-xs capitalize">
                              {task.function}
                            </Text>
                            {task.dueDate && (
                              <Text className="text-slate-500 text-xs">
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
                <Text className="text-white text-lg font-semibold">
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
                    className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-medium mb-1">
                          Task awaiting review
                        </Text>
                        <Text className="text-slate-400 text-xs">
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
          <Text className="text-white text-lg font-semibold mb-3">
            Quick Actions
          </Text>
          <View className="gap-3">
            <Pressable
              onPress={() => router.push("/(tabs)/okrs")}
              className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-80"
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
                <Text className="text-white font-semibold ml-3">View OKRs</Text>
              </View>
              <ArrowRight size={20} color="white" />
            </Pressable>

            <Pressable
              onPress={() => router.push("/work")}
              className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-4 flex-row items-center justify-between active:opacity-80"
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
                <Text className="text-white font-semibold ml-3">Work Hub</Text>
              </View>
              <ArrowRight size={20} color="white" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Budget Setting Modal */}
      <Modal visible={showBudgetModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-slate-900 rounded-t-3xl"
            style={{ maxHeight: "90%" }}
          >
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-slate-800">
              <Text className="text-white text-xl font-bold">
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
                <Text className="text-slate-400 text-sm mb-2">
                  Monthly Revenue Target
                </Text>
                <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-white mr-2">£</Text>
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
                    className="text-white flex-1"
                  />
                </View>
              </View>

              {/* Max Team Cost */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">
                  Max Team Cost
                </Text>
                <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-white mr-2">£</Text>
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
                    className="text-white flex-1"
                  />
                </View>
              </View>

              {/* Max AI Cost */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Max AI Cost</Text>
                <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-white mr-2">£</Text>
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
                    className="text-white flex-1"
                  />
                </View>
              </View>

              {/* Max COGS */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Max COGS</Text>
                <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-white mr-2">£</Text>
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
                    className="text-white flex-1"
                  />
                </View>
              </View>

              {/* Max Other Costs */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">
                  Max Other Costs
                </Text>
                <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-white mr-2">£</Text>
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
                    className="text-white flex-1"
                  />
                </View>
              </View>

              {/* Target Burn Rate */}
              <View className="mb-6">
                <Text className="text-slate-400 text-sm mb-2">
                  Target Burn Rate
                </Text>
                <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
                  <Text className="text-white mr-2">£</Text>
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
                    className="text-white flex-1"
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
                className="active:opacity-80"
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
                  <Text className="text-white font-bold text-base">
                    Save Budget
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Financial Details Modal */}
      <Modal visible={showDetailsModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-slate-900 rounded-t-3xl"
            style={{ maxHeight: "90%" }}
          >
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-slate-800">
              <Text className="text-white text-xl font-bold">
                {detailsType === "revenue" && "Revenue Breakdown"}
                {detailsType === "profit" && "Profit Breakdown"}
                {detailsType === "burn" && "Burn Rate Breakdown"}
                {detailsType === "runway" && "Runway Details"}
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
                    <Text className="text-slate-400 text-sm mb-4">
                      Monthly Revenue Sources
                    </Text>

                    {/* Product Sales */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-white font-medium">
                          Product Sales
                        </Text>
                        <Text className="text-white font-bold">
                          £
                          {(
                            financials.revenue.breakdown.productSales / 1000
                          ).toFixed(1)}
                          k
                        </Text>
                      </View>
                      <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${(financials.revenue.breakdown.productSales / financials.revenue.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-slate-500 text-xs mt-1">
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
                        <Text className="text-white font-medium">Services</Text>
                        <Text className="text-white font-bold">
                          £
                          {(
                            financials.revenue.breakdown.services / 1000
                          ).toFixed(1)}
                          k
                        </Text>
                      </View>
                      <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-blue-500 h-full rounded-full"
                          style={{
                            width: `${(financials.revenue.breakdown.services / financials.revenue.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-slate-500 text-xs mt-1">
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
                        <Text className="text-white font-medium">
                          Recurring
                        </Text>
                        <Text className="text-white font-bold">
                          £
                          {(
                            financials.revenue.breakdown.recurring / 1000
                          ).toFixed(1)}
                          k
                        </Text>
                      </View>
                      <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-purple-500 h-full rounded-full"
                          style={{
                            width: `${(financials.revenue.breakdown.recurring / financials.revenue.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-slate-500 text-xs mt-1">
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
                        <Text className="text-white font-medium">Other</Text>
                        <Text className="text-white font-bold">
                          £
                          {(financials.revenue.breakdown.other / 1000).toFixed(
                            1,
                          )}
                          k
                        </Text>
                      </View>
                      <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-amber-500 h-full rounded-full"
                          style={{
                            width: `${(financials.revenue.breakdown.other / financials.revenue.total) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-slate-500 text-xs mt-1">
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
                    <Text className="text-slate-400 text-sm mb-4">
                      Monthly Profit Calculation
                    </Text>

                    {/* Revenue */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-white font-medium">Revenue</Text>
                        <Text className="text-emerald-400 font-bold">
                          £{(financials.revenue.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                    </View>

                    {/* COGS/BOM */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-white font-medium">
                          COGS (Bill of Materials)
                        </Text>
                        <Text className="text-red-400 font-bold">
                          -£{(financials.cogs.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="ml-4 mt-2">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">
                            Materials
                          </Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.cogs.breakdown.materials / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">
                            Manufacturing
                          </Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.cogs.breakdown.manufacturing / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">
                            Shipping
                          </Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.cogs.breakdown.shipping / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-slate-400 text-sm">Other</Text>
                          <Text className="text-slate-300 text-sm">
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
                    <Text className="text-slate-400 text-sm mb-4">
                      Monthly Burn Rate by Category
                    </Text>

                    {/* Sales/Revenue (shown as COGS) */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-white font-medium">
                          Bill of Materials (BOM)
                        </Text>
                        <Text className="text-white font-bold">
                          £{(financials.cogs.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-purple-500 h-full rounded-full"
                          style={{
                            width: `${(financials.cogs.total / financials.burnRate) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-slate-500 text-xs mt-1">
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
                        <Text className="text-white font-medium">People</Text>
                        <Text className="text-white font-bold">
                          £{(financials.teamCosts.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${ratios.teamBurnPercentage}%` }}
                        />
                      </View>
                      <Text className="text-slate-500 text-xs mt-1">
                        {ratios.teamBurnPercentage.toFixed(1)}% of burn
                      </Text>
                      <View className="ml-4 mt-2">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">
                            Founders
                          </Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.teamCosts.breakdown.founders / 1000
                            ).toFixed(1)}
                            k ({financials.teamCosts.headcount.founders})
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">
                            Fractional Execs
                          </Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.teamCosts.breakdown.fractionalExecs /
                              1000
                            ).toFixed(1)}
                            k ({financials.teamCosts.headcount.fractionalExecs})
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-slate-400 text-sm">
                            Apprentices
                          </Text>
                          <Text className="text-slate-300 text-sm">
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
                        <Text className="text-white font-medium">
                          AI Services
                        </Text>
                        <Text className="text-white font-bold">
                          £{(financials.aiCosts.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${ratios.aiBurnPercentage}%` }}
                        />
                      </View>
                      <Text className="text-slate-500 text-xs mt-1">
                        {ratios.aiBurnPercentage.toFixed(1)}% of burn
                      </Text>
                      <View className="ml-4 mt-2">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">OpenAI</Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.aiCosts.breakdown.openai / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">
                            Anthropic
                          </Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.aiCosts.breakdown.anthropic / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">Google</Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.aiCosts.breakdown.google / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">
                            ElevenLabs
                          </Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.aiCosts.breakdown.elevenlabs / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-slate-400 text-sm">Other</Text>
                          <Text className="text-slate-300 text-sm">
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
                        <Text className="text-white font-medium">
                          Other Costs
                        </Text>
                        <Text className="text-white font-bold">
                          £{(financials.otherCosts.total / 1000).toFixed(1)}k
                        </Text>
                      </View>
                      <View className="bg-slate-800 h-2 rounded-full overflow-hidden">
                        <View
                          className="bg-amber-500 h-full rounded-full"
                          style={{
                            width: `${(financials.otherCosts.total / financials.burnRate) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-slate-500 text-xs mt-1">
                        {(
                          (financials.otherCosts.total / financials.burnRate) *
                          100
                        ).toFixed(1)}
                        % of burn
                      </Text>
                      <View className="ml-4 mt-2">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">Office</Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.otherCosts.breakdown.office / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">
                            Software
                          </Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.otherCosts.breakdown.software / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">
                            Marketing
                          </Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.otherCosts.breakdown.marketing / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-400 text-sm">Legal</Text>
                          <Text className="text-slate-300 text-sm">
                            £
                            {(
                              financials.otherCosts.breakdown.legal / 1000
                            ).toFixed(1)}
                            k
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-slate-400 text-sm">Other</Text>
                          <Text className="text-slate-300 text-sm">
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
                    <Text className="text-slate-400 text-sm mb-4">
                      Runway Calculation
                    </Text>

                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-white font-medium">
                          Cash Balance
                        </Text>
                        <Text className="text-white font-bold">
                          £{(financials.cashBalance / 1000).toFixed(0)}k
                        </Text>
                      </View>
                    </View>

                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-white font-medium">
                          Monthly Burn Rate
                        </Text>
                        <Text className="text-white font-bold">
                          £{(financials.burnRate / 1000).toFixed(1)}k
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Runway Result */}
                  <View className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 mb-4">
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

                  <View className="bg-slate-800 rounded-xl p-4">
                    <Text className="text-slate-300 text-sm">
                      💡 To extend runway, reduce monthly burn or increase
                      revenue. Use the Budget settings to set targets.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Scenario Planning Modal */}
      <Modal visible={showScenarioPlanningModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-900 rounded-t-3xl" style={{ maxHeight: "90%" }}>
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-slate-800">
              <View className="flex-row items-center gap-2">
                <Lightbulb size={24} color="#3b82f6" />
                <Text className="text-white text-xl font-bold">Scenario Planning</Text>
              </View>
              <Pressable
                onPress={() => setShowScenarioPlanningModal(false)}
                className="active:opacity-70"
              >
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView
              className="px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              {/* Current Situation */}
              <View className="mb-6">
                <Text className="text-white text-lg font-semibold mb-3">Current Situation</Text>
                <View className="bg-slate-800 rounded-xl p-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-400">Monthly Revenue</Text>
                    <Text className="text-white font-semibold">£{(financials.revenue.total / 1000).toFixed(0)}k</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-400">Monthly Burn Rate</Text>
                    <Text className="text-white font-semibold">£{(financials.burnRate / 1000).toFixed(1)}k</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-400">Cash Balance</Text>
                    <Text className="text-white font-semibold">£{(financials.cashBalance / 1000).toFixed(0)}k</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-400">Current Runway</Text>
                    <Text className="text-amber-400 font-bold">{financials.runway.toFixed(1)} months</Text>
                  </View>
                </View>
              </View>

              {/* Scenario 1: Increase Revenue */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center">
                    <Text className="text-emerald-400 font-bold">1</Text>
                  </View>
                  <Text className="text-white text-lg font-semibold">Increase Revenue by 30%</Text>
                </View>
                <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <View className="mb-3">
                    <Text className="text-emerald-400 font-semibold mb-2">Target: £{((financials.revenue.total * 1.3) / 1000).toFixed(0)}k/month</Text>
                    <Text className="text-slate-300 text-sm mb-3">
                      Increase from £{(financials.revenue.total / 1000).toFixed(0)}k to £{((financials.revenue.total * 1.3) / 1000).toFixed(0)}k per month
                    </Text>
                  </View>

                  <View className="bg-slate-900 rounded-lg p-3 mb-3">
                    <Text className="text-white font-semibold mb-2">Impact:</Text>
                    <View className="flex-row items-center gap-2 mb-1">
                      <Zap size={14} color="#10b981" />
                      <Text className="text-slate-300 text-sm">New Runway: {((financials.cashBalance + (financials.revenue.total * 1.3 - financials.revenue.total)) / financials.burnRate).toFixed(1)} months (+{(((financials.cashBalance + (financials.revenue.total * 1.3 - financials.revenue.total)) / financials.burnRate) - financials.runway).toFixed(1)} months)</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <DollarSign size={14} color="#10b981" />
                      <Text className="text-slate-300 text-sm">Additional £{((financials.revenue.total * 0.3) / 1000).toFixed(1)}k/month</Text>
                    </View>
                  </View>

                  <Text className="text-slate-400 text-sm font-semibold mb-2">How to achieve:</Text>
                  <View className="gap-2">
                    <View className="flex-row items-start gap-2">
                      <Text className="text-emerald-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Increase sales team capacity (hire 2 more sales reps)</Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-emerald-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Launch new product line with higher margins</Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-emerald-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Increase prices by 10-15% for existing customers</Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-emerald-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Expand into 2 new geographic markets</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Scenario 2: Reduce Burn Rate */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center">
                    <Text className="text-blue-400 font-bold">2</Text>
                  </View>
                  <Text className="text-white text-lg font-semibold">Reduce Burn Rate by 20%</Text>
                </View>
                <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <View className="mb-3">
                    <Text className="text-blue-400 font-semibold mb-2">Target: £{((financials.burnRate * 0.8) / 1000).toFixed(1)}k/month</Text>
                    <Text className="text-slate-300 text-sm mb-3">
                      Reduce from £{(financials.burnRate / 1000).toFixed(1)}k to £{((financials.burnRate * 0.8) / 1000).toFixed(1)}k per month
                    </Text>
                  </View>

                  <View className="bg-slate-900 rounded-lg p-3 mb-3">
                    <Text className="text-white font-semibold mb-2">Impact:</Text>
                    <View className="flex-row items-center gap-2 mb-1">
                      <Zap size={14} color="#3b82f6" />
                      <Text className="text-slate-300 text-sm">New Runway: {(financials.cashBalance / (financials.burnRate * 0.8)).toFixed(1)} months (+{((financials.cashBalance / (financials.burnRate * 0.8)) - financials.runway).toFixed(1)} months)</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <DollarSign size={14} color="#3b82f6" />
                      <Text className="text-slate-300 text-sm">Save £{((financials.burnRate * 0.2) / 1000).toFixed(1)}k/month</Text>
                    </View>
                  </View>

                  <Text className="text-slate-400 text-sm font-semibold mb-2">How to achieve:</Text>
                  <View className="gap-2">
                    <View className="flex-row items-start gap-2">
                      <Text className="text-blue-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Negotiate better rates with suppliers (-£5k/month)</Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-blue-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Reduce AI agent costs by consolidating tools (-£1.5k/month)</Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-blue-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Optimize team structure (move 1 exec to part-time) (-£4k/month)</Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-blue-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Reduce office/software expenses (-£2k/month)</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Scenario 3: Combined Approach */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center">
                    <Text className="text-purple-400 font-bold">3</Text>
                  </View>
                  <Text className="text-white text-lg font-semibold">Combined: +15% Revenue, -10% Burn</Text>
                </View>
                <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <View className="mb-3">
                    <Text className="text-purple-400 font-semibold mb-2">Balanced Growth Strategy</Text>
                    <Text className="text-slate-300 text-sm mb-3">
                      Revenue: £{((financials.revenue.total * 1.15) / 1000).toFixed(0)}k/month | Burn: £{((financials.burnRate * 0.9) / 1000).toFixed(1)}k/month
                    </Text>
                  </View>

                  <View className="bg-slate-900 rounded-lg p-3 mb-3">
                    <Text className="text-white font-semibold mb-2">Impact:</Text>
                    <View className="flex-row items-center gap-2 mb-1">
                      <Zap size={14} color="#a855f7" />
                      <Text className="text-slate-300 text-sm">New Runway: {((financials.cashBalance + (financials.revenue.total * 0.15)) / (financials.burnRate * 0.9)).toFixed(1)} months (+{(((financials.cashBalance + (financials.revenue.total * 0.15)) / (financials.burnRate * 0.9)) - financials.runway).toFixed(1)} months)</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <DollarSign size={14} color="#a855f7" />
                      <Text className="text-slate-300 text-sm">Net improvement: £{(((financials.revenue.total * 0.15) + (financials.burnRate * 0.1)) / 1000).toFixed(1)}k/month</Text>
                    </View>
                  </View>

                  <Text className="text-slate-400 text-sm font-semibold mb-2">Recommended actions:</Text>
                  <View className="gap-2">
                    <View className="flex-row items-start gap-2">
                      <Text className="text-purple-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Focus on existing customers for upsells (quick wins)</Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-purple-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Optimize supplier contracts and AI tools</Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-purple-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Hire 1 sales rep instead of 2 (balanced growth)</Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-purple-400 mt-0.5">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">Implement cost controls while maintaining quality</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Break-even Analysis */}
              <View className="mb-4">
                <Text className="text-white text-lg font-semibold mb-3">Break-even Target</Text>
                <View className="bg-slate-800 rounded-xl p-4">
                  <Text className="text-slate-300 text-sm mb-3">
                    To reach break-even (£0 net burn), you need:
                  </Text>
                  <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-2">
                    <Text className="text-emerald-400 font-bold text-lg mb-1">
                      £{((financials.burnRate) / 1000).toFixed(1)}k/month revenue
                    </Text>
                    <Text className="text-slate-300 text-xs">
                      This is {((financials.burnRate / financials.revenue.total - 1) * 100).toFixed(0)}% more than current revenue
                    </Text>
                  </View>
                  <Text className="text-slate-400 text-xs mt-2">
                    💡 Tip: Most hardware startups reach break-even 18-24 months after product launch. Focus on unit economics and customer acquisition cost.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
