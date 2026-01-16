/**
 * Performance Tab - Reports & Metrics
 * Team performance, task completion, and financial reports
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Target,
  Zap,
  Calendar,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOKRStore } from '@/lib/state/okr-store';
import { useFinanceStore } from '@/lib/state/finance-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';

const PERFORMANCE_HELP: HelpContent = {
  title: 'Performance & Reports',
  subtitle: 'Measure what matters',
  description: 'The Performance tab provides insights into team productivity, task completion rates, and financial health. Track metrics over time and identify areas for improvement.',
  tips: [
    'Team utilization shows how much capacity is being used vs available',
    'Task velocity measures how many tasks are completed per week',
    'Financial metrics track burn rate, runway, and cost per function',
    'Individual performance shows each team member\'s output and efficiency',
    'Use these insights to optimize resource allocation and identify bottlenecks',
  ],
  quickActions: [
    { label: 'Team Overview', description: 'High-level team productivity metrics' },
    { label: 'Task Analytics', description: 'Completion rates, velocity, and blocked time' },
    { label: 'Financial Reports', description: 'Burn rate, runway, and cost breakdown' },
    { label: 'Individual Performance', description: 'Per-person metrics and trends' },
  ],
};

type PerformanceTab = 'overview' | 'tasks' | 'financial' | 'team';

export default function PerformanceScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  // Stores
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const okrs = useOKRStore(s => s.okrs);
  const getCashBalance = useFinanceStore(s => s.getCashBalance);
  const getWeeklyBurn = useFinanceStore(s => s.getWeeklyBurn);
  const getMonthlyRevenue = useFinanceStore(s => s.getMonthlyRevenue);

  // State
  const [activeTab, setActiveTab] = useState<PerformanceTab>('overview');
  const [showHelp, setShowHelp] = useState(false);

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active');

    // Team capacity
    const totalCapacity = activeMembers.reduce((sum, m) => {
      if (m.role === 'Founder' || m.role === 'Apprentice') return sum + 15;
      return sum + ((m.daysPerWeek || 2) * 2) + Math.min((5 - (m.daysPerWeek || 2)) * 2, 10);
    }, 0);

    const allocatedCapacity = activeMembers.reduce((sum, member) => {
      return sum + workPlans
        .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((wpSum, wp) => {
          const allocation = wp.allocations?.find(a => a.memberId === member.id);
          return wpSum + (allocation?.squaresPerWeek || 0);
        }, 0);
    }, 0);

    // Task metrics
    const completedTasks = workPlans.filter(t => t.status === 'completed').length;
    const activeTasks = workPlans.filter(t => t.status === 'in-progress').length;
    const blockedTasks = workPlans.filter(t => t.status === 'blocked').length;
    const queuedTasks = workPlans.filter(t => t.status === 'not-started').length;
    const totalTasks = workPlans.length;

    // Financial
    const cashBalance = currentWorkspace ? getCashBalance(currentWorkspace.id) : 0;
    const weeklyBurn = currentWorkspace ? getWeeklyBurn(currentWorkspace.id) : 0;
    const monthlyRevenue = currentWorkspace ? getMonthlyRevenue(currentWorkspace.id) : 0;
    const monthlyBurn = weeklyBurn * 4.33;
    const netCashFlow = monthlyRevenue - monthlyBurn;
    const runway = netCashFlow >= 0 ? 999 : cashBalance / Math.abs(netCashFlow);

    // OKR progress
    const okrProgress = okrs.length > 0
      ? Math.round(okrs.reduce((sum, okr) => {
          const progress = okr.objectives.length > 0
            ? okr.objectives.reduce((objSum, obj) => objSum + (obj.progress || 0), 0) / okr.objectives.length
            : 0;
          return sum + progress;
        }, 0) / okrs.length)
      : 0;

    return {
      teamSize: activeMembers.length,
      totalCapacity,
      allocatedCapacity,
      availableCapacity: totalCapacity - allocatedCapacity,
      utilizationPercent: totalCapacity > 0 ? Math.round((allocatedCapacity / totalCapacity) * 100) : 0,
      completedTasks,
      activeTasks,
      blockedTasks,
      queuedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      cashBalance,
      weeklyBurn,
      monthlyBurn,
      monthlyRevenue,
      netCashFlow,
      runway: runway > 99 ? '∞' : `${runway.toFixed(1)}mo`,
      okrProgress,
    };
  }, [members, workPlans, okrs, currentWorkspace, getCashBalance, getWeeklyBurn, getMonthlyRevenue]);

  // Per-member metrics
  const memberMetrics = useMemo(() => {
    return members.filter(m => m.status === 'active').map(member => {
      const memberTasks = workPlans.filter(wp =>
        wp.assignedMemberIds?.includes(member.id) ||
        wp.allocations?.some(a => a.memberId === member.id)
      );
      const completedByMember = memberTasks.filter(t => t.status === 'completed').length;
      const activeByMember = memberTasks.filter(t => t.status === 'in-progress').length;

      const capacity = member.role === 'Founder' || member.role === 'Apprentice'
        ? 15
        : ((member.daysPerWeek || 2) * 2) + Math.min((5 - (member.daysPerWeek || 2)) * 2, 10);

      const allocated = workPlans
        .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((sum, wp) => {
          const allocation = wp.allocations?.find(a => a.memberId === member.id);
          return sum + (allocation?.squaresPerWeek || 0);
        }, 0);

      return {
        ...member,
        totalTasks: memberTasks.length,
        completedTasks: completedByMember,
        activeTasks: activeByMember,
        capacity,
        allocated,
        utilizationPercent: capacity > 0 ? Math.round((allocated / capacity) * 100) : 0,
      };
    });
  }, [members, workPlans]);

  // Metric Card component
  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    trend
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <View className="bg-white dark:bg-slate-800 rounded-xl p-4 flex-1">
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="w-8 h-8 rounded-lg items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <Icon size={18} color={color} />
        </View>
        {trend && trend !== 'neutral' && (
          <View className="flex-row items-center">
            {trend === 'up' ? (
              <ArrowUpRight size={14} color="#10b981" />
            ) : (
              <ArrowDownRight size={14} color="#ef4444" />
            )}
          </View>
        )}
      </View>
      <Text className="text-slate-900 dark:text-white font-bold text-xl">
        {value}
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-slate-400 dark:text-slate-500 text-xs">
          {subtitle}
        </Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={PERFORMANCE_HELP}
        gradientColors={['#ec4899', '#be185d']}
      />

      {/* Header */}
      <LinearGradient
        colors={['#ec4899', '#db2777', '#be185d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Analytics</Text>
            <Text className="text-white text-2xl font-bold">Performance</Text>
          </View>
          <HelpButton onPress={() => setShowHelp(true)} />
        </View>

        {/* Key Stats */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          <View className="items-center flex-1">
            <Text className="text-white/70 text-xs">Utilization</Text>
            <Text className="text-white font-bold text-lg">{metrics.utilizationPercent}%</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Completion</Text>
            <Text className="text-white font-bold text-lg">{metrics.completionRate}%</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">OKR Progress</Text>
            <Text className="text-white font-bold text-lg">{metrics.okrProgress}%</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Runway</Text>
            <Text className="text-white font-bold text-lg">{metrics.runway}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Switcher */}
      <View className="px-5 pt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'tasks', label: 'Tasks' },
              { key: 'financial', label: 'Financial' },
              { key: 'team', label: 'Team' },
            ].map(tab => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as PerformanceTab)}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === tab.key ? 'bg-pink-500' : 'bg-white dark:bg-slate-800'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    activeTab === tab.key ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View>
            {/* Team Capacity */}
            <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">
              Team Capacity
            </Text>
            <View className="flex-row gap-3 mb-6">
              <MetricCard
                title="Team Size"
                value={metrics.teamSize}
                subtitle="active members"
                icon={Users}
                color="#3b82f6"
              />
              <MetricCard
                title="Total TU"
                value={metrics.totalCapacity}
                subtitle="per week"
                icon={Clock}
                color="#8b5cf6"
              />
            </View>
            <View className="flex-row gap-3 mb-6">
              <MetricCard
                title="Allocated"
                value={metrics.allocatedCapacity}
                subtitle="TU assigned"
                icon={Target}
                color="#f59e0b"
              />
              <MetricCard
                title="Available"
                value={metrics.availableCapacity}
                subtitle="TU free"
                icon={Zap}
                color="#10b981"
              />
            </View>

            {/* Task Summary */}
            <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">
              Task Summary
            </Text>
            <View className="flex-row gap-3 mb-6">
              <MetricCard
                title="Active"
                value={metrics.activeTasks}
                icon={Activity}
                color="#3b82f6"
              />
              <MetricCard
                title="Completed"
                value={metrics.completedTasks}
                icon={CheckCircle2}
                color="#10b981"
              />
            </View>
            <View className="flex-row gap-3 mb-6">
              <MetricCard
                title="Blocked"
                value={metrics.blockedTasks}
                icon={AlertTriangle}
                color="#ef4444"
              />
              <MetricCard
                title="Queued"
                value={metrics.queuedTasks}
                icon={Clock}
                color="#64748b"
              />
            </View>
          </View>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <View>
            <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">
              Task Analytics
            </Text>

            {/* Completion funnel */}
            <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4">
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-3 uppercase">
                Task Funnel
              </Text>
              {[
                { label: 'Total Tasks', value: metrics.totalTasks, color: '#64748b' },
                { label: 'In Progress', value: metrics.activeTasks, color: '#3b82f6' },
                { label: 'Completed', value: metrics.completedTasks, color: '#10b981' },
              ].map((item, i) => (
                <View key={item.label} className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-slate-700 dark:text-slate-300 text-sm">{item.label}</Text>
                    <Text className="text-slate-900 dark:text-white font-semibold">{item.value}</Text>
                  </View>
                  <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${metrics.totalTasks > 0 ? (item.value / metrics.totalTasks) * 100 : 0}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Blocked analysis */}
            {metrics.blockedTasks > 0 && (
              <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <AlertTriangle size={18} color="#ef4444" />
                  <Text className="text-red-700 dark:text-red-300 font-semibold">
                    {metrics.blockedTasks} Blocked Tasks
                  </Text>
                </View>
                <Text className="text-red-600 dark:text-red-400 text-sm">
                  Review blocked tasks to unblock team progress
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <View>
            <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">
              Financial Health
            </Text>

            <View className="flex-row gap-3 mb-4">
              <MetricCard
                title="Cash Balance"
                value={`£${(metrics.cashBalance / 1000).toFixed(0)}k`}
                icon={DollarSign}
                color="#10b981"
              />
              <MetricCard
                title="Monthly Burn"
                value={`£${(metrics.monthlyBurn / 1000).toFixed(0)}k`}
                icon={TrendingDown}
                color="#ef4444"
              />
            </View>

            <View className="flex-row gap-3 mb-4">
              <MetricCard
                title="Monthly Revenue"
                value={`£${(metrics.monthlyRevenue / 1000).toFixed(0)}k`}
                icon={TrendingUp}
                color="#3b82f6"
              />
              <MetricCard
                title="Net Cash Flow"
                value={`£${(metrics.netCashFlow / 1000).toFixed(0)}k`}
                icon={Activity}
                color={metrics.netCashFlow >= 0 ? '#10b981' : '#ef4444'}
                trend={metrics.netCashFlow >= 0 ? 'up' : 'down'}
              />
            </View>

            {/* Runway visualization */}
            <View className="bg-white dark:bg-slate-800 rounded-xl p-4">
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 uppercase">
                Runway
              </Text>
              <Text className="text-slate-900 dark:text-white font-bold text-3xl mb-2">
                {metrics.runway}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm">
                {metrics.netCashFlow >= 0
                  ? 'Cash flow positive - runway is unlimited'
                  : 'Time until cash runs out at current burn rate'
                }
              </Text>
            </View>
          </View>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <View>
            <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">
              Individual Performance
            </Text>

            {memberMetrics.map((member, index) => (
              <Animated.View
                key={member.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3">
                  <View className="flex-row items-center mb-3">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor: member.role === 'Founder' ? '#8b5cf620' :
                          member.role === 'FractionalExec' ? '#3b82f620' : '#10b98120',
                      }}
                    >
                      <Text
                        className="font-bold"
                        style={{
                          color: member.role === 'Founder' ? '#8b5cf6' :
                            member.role === 'FractionalExec' ? '#3b82f6' : '#10b981',
                        }}
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 dark:text-white font-semibold">
                        {member.name}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">
                        {member.role === 'FractionalExec' ? 'Executive' : member.role} • {member.function}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-900 dark:text-white font-bold">
                        {member.utilizationPercent}%
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">
                        utilized
                      </Text>
                    </View>
                  </View>

                  {/* Utilization bar */}
                  <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(member.utilizationPercent, 100)}%`,
                        backgroundColor: member.utilizationPercent > 100 ? '#ef4444' :
                          member.utilizationPercent > 80 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">
                      {member.allocated}/{member.capacity} TU allocated
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs">
                      {member.completedTasks} tasks completed
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
