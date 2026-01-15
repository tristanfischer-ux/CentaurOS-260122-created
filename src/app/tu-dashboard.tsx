/**
 * Time Unit (TU) Analytics Dashboard
 *
 * Elite consulting-grade TU performance tracking and analysis
 * Frameworks: McKinsey Operational Excellence, BCG Performance Analytics,
 * Bain Results Delivery, Deloitte Cost Management, Accenture Efficiency
 */

import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  ArrowLeft, Download, TrendingUp, TrendingDown, Zap, AlertTriangle,
  CheckCircle2, Target, DollarSign, Users, Clock, Activity, BarChart3,
  Award, Lightbulb, ChevronRight, AlertCircle, TrendingUpDown
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useTheme } from '@/lib/ThemeContext';
import { cn } from '@/lib/cn';
import {
  calculateTUMetrics,
  forecastTUs,
  identifyTUOpportunities,
  generateTULeaderboard,
  analyzeTaskTU,
} from '@/lib/reports/tu-analytics';
import {
  exportAndShareTUReport,
} from '@/lib/reports/export-tu-reports';

type PeriodFilter = 'week' | 'month' | 'quarter' | 'all';
type ViewMode = 'overview' | 'team' | 'tasks' | 'forecast' | 'opportunities';

export default function TUDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // State
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isExporting, setIsExporting] = useState(false);

  // Data
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const members = useOrganizationStore(s => s.members.filter(m => m.status === 'active'));

  // Calculations
  const metrics = useMemo(() =>
    calculateTUMetrics(workPlans, members, period),
    [workPlans, members, period]
  );

  const forecast = useMemo(() =>
    forecastTUs(workPlans, members),
    [workPlans, members]
  );

  const opportunities = useMemo(() =>
    identifyTUOpportunities(workPlans, members),
    [workPlans, members]
  );

  const leaderboard = useMemo(() =>
    generateTULeaderboard(workPlans, members),
    [workPlans, members]
  );

  const activeTasks = useMemo(() =>
    workPlans.filter(wp => wp.status === 'in-progress' || wp.status === 'not-started'),
    [workPlans]
  );

  const taskAnalyses = useMemo(() =>
    activeTasks.map(task => analyzeTaskTU(task, members)),
    [activeTasks, members]
  );

  // Theme styles
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';

  // Export handler
  const handleExport = async (format: 'markdown' | 'csv-metrics' | 'csv-tasks' | 'csv-team' | 'json') => {
    try {
      setIsExporting(true);
      await exportAndShareTUReport(workPlans, members, format, period);
    } catch (error) {
      Alert.alert('Export Failed', `Could not export report: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const showExportMenu = () => {
    Alert.alert(
      'Export TU Report',
      'Choose export format',
      [
        { text: 'Markdown (Board Pack)', onPress: () => handleExport('markdown') },
        { text: 'CSV - Metrics', onPress: () => handleExport('csv-metrics') },
        { text: 'CSV - Task Analysis', onPress: () => handleExport('csv-tasks') },
        { text: 'CSV - Team Performance', onPress: () => handleExport('csv-team') },
        { text: 'JSON (API)', onPress: () => handleExport('json') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const periodLabel = period === 'week' ? 'This Week' :
                      period === 'month' ? 'This Month' :
                      period === 'quarter' ? 'This Quarter' : 'All Time';

  return (
    <View className={cn('flex-1', bgPrimary)}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={isDark ? ['#1e293b', '#0f172a'] : isOffWhite ? ['#fff7ed', '#ffedd5'] : ['#3b82f6', '#2563eb']}
        style={{ paddingTop: insets.top }}
      >
        <View className="px-4 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
            >
              <ArrowLeft size={20} color={isDark || isOffWhite ? '#94a3b8' : '#fff'} />
            </Pressable>

            <Pressable
              onPress={showExportMenu}
              disabled={isExporting}
              className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-white/10 active:opacity-70"
            >
              <Download size={16} color={isDark || isOffWhite ? '#94a3b8' : '#fff'} />
              <Text className={cn('text-sm font-semibold', isDark || isOffWhite ? 'text-slate-400' : 'text-white')}>
                {isExporting ? 'Exporting...' : 'Export'}
              </Text>
            </Pressable>
          </View>

          <Text className={cn('text-2xl font-bold mb-1', isDark || isOffWhite ? textPrimary : 'text-white')}>
            Time Unit Analytics
          </Text>
          <Text className={cn('text-sm', isDark || isOffWhite ? textSecondary : 'text-blue-100')}>
            Elite consulting-grade TU performance tracking
          </Text>
        </View>
      </LinearGradient>

      {/* Period Filter */}
      <View className={cn('px-4 py-3 border-b', borderColor)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {(['week', 'month', 'quarter', 'all'] as PeriodFilter[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              className={cn(
                'px-4 py-2 rounded-full',
                period === p
                  ? 'bg-blue-500'
                  : isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100'
              )}
            >
              <Text className={cn(
                'text-sm font-semibold',
                period === p ? 'text-white' : textSecondary
              )}>
                {p === 'week' ? 'Week' : p === 'month' ? 'Month' : p === 'quarter' ? 'Quarter' : 'All Time'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* View Mode Tabs */}
      <View className={cn('px-4 py-3 border-b', borderColor)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {([
            { mode: 'overview' as ViewMode, label: 'Overview', icon: BarChart3 },
            { mode: 'team' as ViewMode, label: 'Team', icon: Users },
            { mode: 'tasks' as ViewMode, label: 'Tasks', icon: Target },
            { mode: 'forecast' as ViewMode, label: 'Forecast', icon: TrendingUp },
            { mode: 'opportunities' as ViewMode, label: 'Opportunities', icon: Lightbulb },
          ]).map(({ mode, label, icon: Icon }) => (
            <Pressable
              key={mode}
              onPress={() => setViewMode(mode)}
              className={cn(
                'flex-row items-center gap-2 px-4 py-2 rounded-full',
                viewMode === mode
                  ? 'bg-blue-500'
                  : isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100'
              )}
            >
              <Icon size={16} color={viewMode === mode ? '#fff' : isDark ? '#94a3b8' : '#6b7280'} />
              <Text className={cn(
                'text-sm font-semibold',
                viewMode === mode ? 'text-white' : textSecondary
              )}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <View className="py-4">
            {/* Key Metrics Grid */}
            <View className="flex-row flex-wrap gap-3 mb-4">
              {/* TU Efficiency */}
              <Animated.View
                entering={FadeInDown.delay(0)}
                className={cn('flex-1 min-w-[48%] rounded-xl p-4 border', bgCard, borderColor)}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Activity size={20} color="#3b82f6" />
                  <Text className={cn('text-xs', textMuted)}>
                    {metrics.velocityTrend === 'improving' ? '📈' : metrics.velocityTrend === 'declining' ? '📉' : '➡️'}
                  </Text>
                </View>
                <Text className={cn('text-2xl font-bold', textPrimary)}>{(metrics.tuEfficiency * 100).toFixed(0)}%</Text>
                <Text className={cn('text-xs', textSecondary)}>TU Efficiency</Text>
                <Text className={cn('text-xs mt-1', metrics.tuEfficiency < 1.0 ? 'text-emerald-600' : 'text-orange-600')}>
                  {metrics.tuEfficiency < 1.0 ? '✅ Under budget' : '⚠️ Over budget'}
                </Text>
              </Animated.View>

              {/* Weekly Burn */}
              <Animated.View
                entering={FadeInDown.delay(100)}
                className={cn('flex-1 min-w-[48%] rounded-xl p-4 border', bgCard, borderColor)}
              >
                <Clock size={20} color="#8b5cf6" className="mb-2" />
                <Text className={cn('text-2xl font-bold', textPrimary)}>{metrics.tuPerWeek}□</Text>
                <Text className={cn('text-xs', textSecondary)}>Weekly Burn Rate</Text>
                <Text className={cn('text-xs mt-1', textMuted)}>
                  {metrics.totalTUsAllocated}□ total allocated
                </Text>
              </Animated.View>

              {/* Cost Variance */}
              <Animated.View
                entering={FadeInDown.delay(200)}
                className={cn('flex-1 min-w-[48%] rounded-xl p-4 border', bgCard, borderColor)}
              >
                <DollarSign size={20} color="#10b981" className="mb-2" />
                <Text className={cn('text-2xl font-bold', textPrimary)}>
                  £{(Math.abs(metrics.totalSavings) / 1000).toFixed(1)}k
                </Text>
                <Text className={cn('text-xs', textSecondary)}>
                  {metrics.totalSavings > 0 ? 'Under Budget' : 'Over Budget'}
                </Text>
                <Text className={cn('text-xs mt-1', metrics.totalSavings > 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {metrics.costVariancePercent >= 0 ? '+' : ''}{metrics.costVariancePercent.toFixed(1)}% variance
                </Text>
              </Animated.View>

              {/* AI ROI */}
              <Animated.View
                entering={FadeInDown.delay(300)}
                className={cn('flex-1 min-w-[48%] rounded-xl p-4 border', bgCard, borderColor)}
              >
                <Zap size={20} color="#f59e0b" className="mb-2" />
                <Text className={cn('text-2xl font-bold', textPrimary)}>{(metrics.aiROI * 100).toFixed(0)}%</Text>
                <Text className={cn('text-xs', textSecondary)}>AI ROI</Text>
                <Text className={cn('text-xs mt-1', textMuted)}>
                  £{(metrics.aiMultiplierSavings / 1000).toFixed(1)}k saved
                </Text>
              </Animated.View>
            </View>

            {/* Summary Card */}
            <Animated.View
              entering={FadeInDown.delay(400)}
              className={cn('rounded-xl p-4 border mb-4', bgCard, borderColor)}
            >
              <Text className={cn('text-lg font-bold mb-3', textPrimary)}>Summary ({periodLabel})</Text>

              <View className="space-y-2">
                <View className="flex-row justify-between items-center">
                  <Text className={cn('text-sm', textSecondary)}>Total TUs Allocated</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>{metrics.totalTUsAllocated}□</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className={cn('text-sm', textSecondary)}>TUs Expended</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>{metrics.totalTUsExpended}□</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className={cn('text-sm', textSecondary)}>TUs Remaining</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>{metrics.totalTUsRemaining}□</Text>
                </View>

                <View className={cn('my-2 border-t', borderColor)} />

                <View className="flex-row justify-between items-center">
                  <Text className={cn('text-sm', textSecondary)}>Budgeted Cost</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>
                    £{(metrics.totalBudgeted / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className={cn('text-sm', textSecondary)}>Actual Cost</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>
                    £{(metrics.totalActual / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className={cn('text-sm', textSecondary)}>Cost per TU</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>
                    £{Math.round(metrics.totalActual / Math.max(1, metrics.totalTUsExpended))}
                  </Text>
                </View>

                <View className={cn('my-2 border-t', borderColor)} />

                <View className="flex-row justify-between items-center">
                  <Text className={cn('text-sm', textSecondary)}>AI Cost</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>
                    £{(metrics.aiCostSpend / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className={cn('text-sm', textSecondary)}>Human Cost Savings</Text>
                  <Text className={cn('text-sm font-semibold text-emerald-600')}>
                    £{(metrics.aiMultiplierSavings / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className={cn('text-sm', textSecondary)}>Net AI Benefit</Text>
                  <Text className={cn('text-sm font-semibold', metrics.aiMultiplierSavings > metrics.aiCostSpend ? 'text-emerald-600' : 'text-orange-600')}>
                    £{((metrics.aiMultiplierSavings - metrics.aiCostSpend) / 1000).toFixed(1)}k
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Quick Stats */}
            <Animated.View
              entering={FadeInDown.delay(500)}
              className={cn('rounded-xl p-4 border', bgCard, borderColor)}
            >
              <Text className={cn('text-lg font-bold mb-3', textPrimary)}>Quick Stats</Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className={cn('text-2xl font-bold', textPrimary)}>{activeTasks.length}</Text>
                  <Text className={cn('text-xs', textSecondary)}>Active Tasks</Text>
                </View>
                <View>
                  <Text className={cn('text-2xl font-bold', textPrimary)}>{members.length}</Text>
                  <Text className={cn('text-xs', textSecondary)}>Team Members</Text>
                </View>
                <View>
                  <Text className={cn('text-2xl font-bold', textPrimary)}>{metrics.tasksPerTU.toFixed(2)}</Text>
                  <Text className={cn('text-xs', textSecondary)}>Tasks/TU</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        )}

        {/* Team Mode */}
        {viewMode === 'team' && (
          <View className="py-4">
            <Text className={cn('text-lg font-bold mb-3', textPrimary)}>Team Performance Leaderboard</Text>
            {leaderboard.map((perf, i) => (
              <Animated.View
                key={perf.memberId}
                entering={FadeInDown.delay(i * 50)}
                className={cn('rounded-xl p-4 border mb-3', bgCard, borderColor)}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-3">
                    <View className={cn('w-8 h-8 rounded-full items-center justify-center', i < 3 ? 'bg-yellow-500/20' : 'bg-gray-500/20')}>
                      <Text className={cn('text-sm font-bold', i < 3 ? 'text-yellow-600' : textMuted)}>#{i + 1}</Text>
                    </View>
                    <View>
                      <Text className={cn('text-base font-bold', textPrimary)}>{perf.memberName}</Text>
                      <Text className={cn('text-xs', textSecondary)}>{perf.role} · {perf.function}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className={cn('text-lg font-bold', textPrimary)}>{perf.efficiencyScore}</Text>
                    <Text className={cn('text-xs', textMuted)}>Score</Text>
                  </View>
                </View>

                <View className="space-y-1.5">
                  <View className="flex-row justify-between">
                    <Text className={cn('text-sm', textSecondary)}>Utilization</Text>
                    <Text className={cn('text-sm font-semibold', textPrimary)}>
                      {perf.utilizationPercent}% ({perf.allocatedTUs}/{perf.totalCapacity}□)
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={cn('text-sm', textSecondary)}>Active Tasks</Text>
                    <Text className={cn('text-sm font-semibold', textPrimary)}>{perf.tasksWorking}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={cn('text-sm', textSecondary)}>Skill Match</Text>
                    <Text className={cn('text-sm font-semibold', textPrimary)}>{perf.skillMatchRate}%</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={cn('text-sm', textSecondary)}>Weekly Cost</Text>
                    <Text className={cn('text-sm font-semibold', textPrimary)}>
                      £{(perf.weeklyCost / 1000).toFixed(1)}k
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Tasks Mode */}
        {viewMode === 'tasks' && (
          <View className="py-4">
            <Text className={cn('text-lg font-bold mb-3', textPrimary)}>Active Task Analysis</Text>
            {taskAnalyses.slice(0, 20).map((analysis, i) => (
              <Animated.View
                key={analysis.taskId}
                entering={FadeInDown.delay(i * 30)}
                className={cn('rounded-xl p-4 border mb-3', bgCard, borderColor)}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className={cn('text-base font-bold', textPrimary)}>{analysis.taskTitle}</Text>
                    <Text className={cn('text-xs', textSecondary)}>{analysis.function} · {analysis.status}</Text>
                  </View>
                  <View className={cn(
                    'px-2 py-1 rounded',
                    analysis.efficiencyRating === 'excellent' ? 'bg-emerald-500/20' :
                    analysis.efficiencyRating === 'good' ? 'bg-blue-500/20' :
                    analysis.efficiencyRating === 'fair' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                  )}>
                    <Text className={cn(
                      'text-xs font-bold',
                      analysis.efficiencyRating === 'excellent' ? 'text-emerald-600' :
                      analysis.efficiencyRating === 'good' ? 'text-blue-600' :
                      analysis.efficiencyRating === 'fair' ? 'text-yellow-600' : 'text-red-600'
                    )}>
                      {analysis.efficiencyRating}
                    </Text>
                  </View>
                </View>

                <View className="space-y-1.5">
                  <View className="flex-row justify-between">
                    <Text className={cn('text-sm', textSecondary)}>TUs: Estimated / Allocated / Expended</Text>
                    <Text className={cn('text-sm font-semibold', textPrimary)}>
                      {analysis.estimatedTUs} / {analysis.allocatedTUs} / {analysis.expendedTUs}□
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={cn('text-sm', textSecondary)}>Days to Completion</Text>
                    <Text className={cn('text-sm font-semibold', textPrimary)}>{analysis.daysToCompletion}d</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={cn('text-sm', textSecondary)}>Budget / Projected</Text>
                    <Text className={cn('text-sm font-semibold', textPrimary)}>
                      £{(analysis.budgetedCost / 1000).toFixed(1)}k / £{(analysis.projectedCost / 1000).toFixed(1)}k
                    </Text>
                  </View>
                  {analysis.aiMultiplier > 1 && (
                    <View className="flex-row justify-between">
                      <Text className={cn('text-sm', textSecondary)}>AI Multiplier</Text>
                      <Text className={cn('text-sm font-semibold text-purple-600')}>
                        {analysis.aiMultiplier}x (saved {analysis.tuSavings}□)
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Forecast Mode */}
        {viewMode === 'forecast' && (
          <View className="py-4">
            <Text className={cn('text-lg font-bold mb-3', textPrimary)}>Capacity Forecast</Text>

            {/* Next Week */}
            <Animated.View
              entering={FadeInDown.delay(0)}
              className={cn('rounded-xl p-4 border mb-3', bgCard, borderColor)}
            >
              <Text className={cn('text-base font-bold mb-3', textPrimary)}>Next Week</Text>
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className={cn('text-sm', textSecondary)}>Planned TUs</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>{forecast.nextWeek.tusPlanned}□</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className={cn('text-sm', textSecondary)}>Expected Output</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>{forecast.nextWeek.tusExpected}□</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className={cn('text-sm', textSecondary)}>Cost</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>
                    £{(forecast.nextWeek.cost / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className={cn('text-sm', textSecondary)}>Tasks Completing</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>{forecast.nextWeek.tasksToComplete}</Text>
                </View>
              </View>
            </Animated.View>

            {/* Next Month */}
            <Animated.View
              entering={FadeInDown.delay(100)}
              className={cn('rounded-xl p-4 border mb-3', bgCard, borderColor)}
            >
              <Text className={cn('text-base font-bold mb-3', textPrimary)}>Next Month</Text>
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className={cn('text-sm', textSecondary)}>Planned TUs</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>{forecast.nextMonth.tusPlanned}□</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className={cn('text-sm', textSecondary)}>Expected Output</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>{forecast.nextMonth.tusExpected}□</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className={cn('text-sm', textSecondary)}>Cost</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>
                    £{(forecast.nextMonth.cost / 1000).toFixed(1)}k
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className={cn('text-sm', textSecondary)}>Tasks Completing</Text>
                  <Text className={cn('text-sm font-semibold', textPrimary)}>{forecast.nextMonth.tasksToComplete}</Text>
                </View>
              </View>
            </Animated.View>

            {/* Capacity Bottlenecks */}
            {forecast.capacityBottlenecks.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(200)}
                className={cn('rounded-xl p-4 border', 'bg-red-500/10', 'border-red-500/30')}
              >
                <View className="flex-row items-center gap-2 mb-3">
                  <AlertTriangle size={20} color="#ef4444" />
                  <Text className={cn('text-base font-bold text-red-600')}>Capacity Bottlenecks</Text>
                </View>
                {forecast.capacityBottlenecks.map((bottleneck, i) => (
                  <View key={i} className="mb-3 last:mb-0">
                    <Text className={cn('text-sm font-bold', textPrimary)}>{bottleneck.function}</Text>
                    <Text className={cn('text-sm text-red-600')}>
                      Shortfall: {bottleneck.shortfall}□/week
                    </Text>
                    <Text className={cn('text-xs mt-1', textMuted)}>
                      {bottleneck.impactedTasks.length} impacted tasks
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        )}

        {/* Opportunities Mode */}
        {viewMode === 'opportunities' && (
          <View className="py-4">
            <Text className={cn('text-lg font-bold mb-3', textPrimary)}>Improvement Opportunities</Text>

            {opportunities.length === 0 ? (
              <Animated.View
                entering={FadeInDown}
                className={cn('rounded-xl p-6 border items-center', bgCard, borderColor)}
              >
                <CheckCircle2 size={48} color="#10b981" className="mb-3" />
                <Text className={cn('text-lg font-bold text-emerald-600 mb-2')}>All optimized!</Text>
                <Text className={cn('text-sm text-center', textSecondary)}>
                  No major optimization opportunities identified. Your TU allocation is efficient.
                </Text>
              </Animated.View>
            ) : (
              opportunities.map((opp, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(i * 50)}
                  className={cn(
                    'rounded-xl p-4 border mb-3',
                    opp.priority === 'high' ? 'bg-red-500/10 border-red-500/30' :
                    opp.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-blue-500/10 border-blue-500/30'
                  )}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-2 mb-1">
                        {opp.type === 'skill_mismatch' ? <Users size={16} color="#ef4444" /> :
                         opp.type === 'underutilization' ? <Clock size={16} color="#f59e0b" /> :
                         opp.type === 'ai_adoption' ? <Zap size={16} color="#8b5cf6" /> :
                         <Target size={16} color="#3b82f6" />}
                        <Text className={cn(
                          'text-base font-bold',
                          opp.priority === 'high' ? 'text-red-600' :
                          opp.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                        )}>
                          {opp.title}
                        </Text>
                      </View>
                      <Text className={cn('text-sm mb-2', textSecondary)}>{opp.description}</Text>
                      <Text className={cn('text-sm font-semibold mb-1', textPrimary)}>
                        Impact: {opp.impact}
                      </Text>
                    </View>
                  </View>

                  <View className={cn('pt-2 border-t', borderColor)}>
                    <Text className={cn('text-lg font-bold text-emerald-600')}>
                      £{(opp.savings / 1000).toFixed(1)}k potential savings
                    </Text>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        )}

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
