/**
 * PerformanceDashboardGrid
 * Collection of mini KPI dashboards displayed in a scrollable grid
 */

import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
  PoundSterling,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Building2,
  PieChart,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useCurrentMembership } from '@/lib/state/app-store';
import { filterWorkPlansByRole } from '@/lib/role-utils';
import { useOKRStore } from '@/lib/state/okr-store';
import { useFinanceStore } from '@/lib/state/finance-store';
import { useSupplierStore } from '@/lib/state/supplier-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';

type TrendDirection = 'up' | 'down' | 'stable';
type HealthStatus = 'healthy' | 'warning' | 'critical';

interface KPICardData {
  id: string;
  title: string;
  primaryValue: string;
  primaryLabel?: string;
  secondaryValue?: string;
  secondaryLabel?: string;
  trend: TrendDirection;
  trendValue?: string;
  health: HealthStatus;
  icon: React.ComponentType<any>;
  iconColor: string;
  onPress?: () => void;
}

const TrendIcon = ({ trend, size = 12 }: { trend: TrendDirection; size?: number }) => {
  if (trend === 'up') return <TrendingUp size={size} color="#10b981" />;
  if (trend === 'down') return <TrendingDown size={size} color="#ef4444" />;
  return <Minus size={size} color="#64748b" />;
};

const HEALTH_COLORS: Record<HealthStatus, { bg: string; border: string }> = {
  healthy: { bg: '#f0fdf4', border: '#86efac' },
  warning: { bg: '#fffbeb', border: '#fde047' },
  critical: { bg: '#fef2f2', border: '#fecaca' },
};

interface KPICardProps {
  data: KPICardData;
  index: number;
}

function KPICard({ data, index }: KPICardProps) {
  const Icon = data.icon;
  const healthColors = HEALTH_COLORS[data.health];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={{ width: '32%' }}
    >
      <Pressable
        onPress={data.onPress}
        className="rounded-xl p-2.5 mb-3 active:opacity-90"
        style={{
          backgroundColor: healthColors.bg,
          borderWidth: 1,
          borderColor: healthColors.border,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-1.5">
          <View
            className="w-6 h-6 rounded-lg items-center justify-center"
            style={{ backgroundColor: data.iconColor + '20' }}
          >
            <Icon size={12} color={data.iconColor} />
          </View>
          <View className="flex-row items-center gap-0.5">
            <TrendIcon trend={data.trend} size={10} />
            {data.trendValue && (
              <Text
                className="text-[10px] font-medium"
                style={{
                  color: data.trend === 'up' ? '#10b981' : data.trend === 'down' ? '#ef4444' : '#64748b',
                }}
              >
                {data.trendValue}
              </Text>
            )}
          </View>
        </View>

        {/* Title */}
        <Text className="text-slate-600 dark:text-slate-400 text-[10px] mb-1" numberOfLines={1}>
          {data.title}
        </Text>

        {/* Primary Value */}
        <Text className="text-slate-900 text-lg font-bold" numberOfLines={1}>
          {data.primaryValue}
        </Text>
        {data.primaryLabel && (
          <Text className="text-slate-500 text-[9px]">{data.primaryLabel}</Text>
        )}

        {/* Secondary Value */}
        {data.secondaryValue && (
          <View className="mt-1 pt-1 border-t border-slate-200/50">
            <Text className="text-slate-600 text-[10px]">
              {data.secondaryLabel}: <Text className="font-semibold">{data.secondaryValue}</Text>
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function PerformanceDashboardGrid() {
  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();

  // Data from stores
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const members = useOrganizationStore((s) => s.members);
  const supplierEngagements = useOrganizationStore((s) => s.supplierEngagements);
  const okrs = useOKRStore((s) => s.okrs);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const getCashBalance = useFinanceStore((s) => s.getCashBalance);
  const getWeeklyBurn = useFinanceStore((s) => s.getWeeklyBurn);
  const getMonthlyRevenue = useFinanceStore((s) => s.getMonthlyRevenue);
  const isFinanceLoaded = useFinanceStore((s) => s.isLoaded);
  const currentMembership = useCurrentMembership();

  // Apply role-based filtering
  const roleFilteredWorkPlans = useMemo(() => {
    if (!currentMembership?.role) return workPlans;
    return filterWorkPlansByRole(
      workPlans,
      currentMembership.role,
      currentMembership.function,
      currentMembership.id
    );
  }, [workPlans, currentMembership]);

  // Calculate KPI data from role-filtered workplans
  const kpiCards = useMemo<KPICardData[]>(() => {
    // Use test workspace if no current workspace selected
    const TEST_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
    const workspaceId = currentWorkspace?.id || TEST_WORKSPACE_ID;

    // 1. Project Health
    const completedTasks = roleFilteredWorkPlans.filter((wp) => wp.status === 'completed').length;
    const inProgressTasks = roleFilteredWorkPlans.filter((wp) => wp.status === 'in-progress').length;
    const blockedTasks = roleFilteredWorkPlans.filter((wp) => wp.status === 'blocked').length;
    const delayedTasks = roleFilteredWorkPlans.filter(
      (wp) => wp.status === 'in-progress' && wp.progress < 50
    ).length;
    const onTimeTasks = inProgressTasks - delayedTasks;
    const onTimePercent = inProgressTasks > 0 ? Math.round((onTimeTasks / inProgressTasks) * 100) : 100;

    const projectHealth: HealthStatus =
      blockedTasks > 2 ? 'critical' : blockedTasks > 0 || onTimePercent < 70 ? 'warning' : 'healthy';

    // 2. Team Productivity - calculate from actual completed tasks
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedThisWeek = roleFilteredWorkPlans.filter((wp) => {
      if (wp.status !== 'completed' || !wp.auditRecord?.completedAt) return false;
      const completedDate = new Date(wp.auditRecord.completedAt);
      return completedDate >= oneWeekAgo;
    }).length;

    // Calculate average cycle time from recently completed tasks
    const recentlyCompleted = roleFilteredWorkPlans
      .filter((wp) => wp.status === 'completed' && wp.auditRecord?.completedAt && wp.startDate)
      .slice(0, 10); // Last 10 completed tasks

    const avgCycleTime = recentlyCompleted.length > 0
      ? Math.round(
          recentlyCompleted.reduce((sum, wp) => {
            const start = new Date(wp.startDate);
            const end = new Date(wp.auditRecord!.completedAt!);
            const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
            return sum + days;
          }, 0) / recentlyCompleted.length
        )
      : 0;

    const productivityTrend: TrendDirection = completedThisWeek >= 3 ? 'up' : completedThisWeek >= 2 ? 'stable' : 'down';

    // 3. Resource Efficiency
    const activeMembers = members.filter((m) => m.status === 'active');
    const totalCapacity = activeMembers.reduce((sum, m) => {
      return sum + (m.role === 'Founder' || m.role === 'Apprentice' ? 10 : (m.daysPerWeek || 2) * 2);
    }, 0);

    const totalAllocated = activeMembers.reduce((sum, member) => {
      const memberAllocated = workPlans
        .filter((wp) => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((wpSum, wp) => {
          const allocation = wp.allocations?.find((a) => a.memberId === member.id);
          return wpSum + (allocation?.squaresPerWeek || 0);
        }, 0);
      return sum + memberAllocated;
    }, 0);

    const utilizationPercent = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;
    const spareCapacity = Math.max(0, totalCapacity - totalAllocated);
    const resourceHealth: HealthStatus =
      utilizationPercent >= 100 ? 'critical' : utilizationPercent >= 85 ? 'warning' : 'healthy';

    // 4. Supplier Performance - using actual engagement data
    const workspaceEngagements = supplierEngagements.filter(e => e.workspaceId === workspaceId);
    const activeEngagementCount = workspaceEngagements.filter(
      (e) => e.status === 'in_progress' || e.status === 'planning'
    ).length;
    const totalSupplierSpend = workspaceEngagements.reduce((sum: number, eng) => sum + (eng.paidToDate || 0), 0);
    const supplierHealth: HealthStatus = activeEngagementCount > 5 ? 'warning' : 'healthy';

    // 5. OKR Progress
    const activeOKRs = okrs.filter((okr) => okr.status !== 'off-track');
    const onTrackOKRs = activeOKRs.filter((okr) => {
      const avgProgress = okr.objectives.reduce((sum: number, obj: { progress: number }) => sum + obj.progress, 0) / (okr.objectives.length || 1);
      return avgProgress >= 60;
    }).length;
    const okrPercent = activeOKRs.length > 0 ? Math.round((onTrackOKRs / activeOKRs.length) * 100) : 0;
    const okrHealth: HealthStatus =
      okrPercent < 50 ? 'critical' : okrPercent < 75 ? 'warning' : 'healthy';

    // 6. Cash Flow / Budget
    const cashBalance = getCashBalance(workspaceId);
    const weeklyBurn = getWeeklyBurn(workspaceId);
    const monthlyBurn = weeklyBurn * 4.33;
    const monthlyRevenue = getMonthlyRevenue(workspaceId);
    const netCashFlow = monthlyRevenue - monthlyBurn;

    // Fix runway calculation: use weekly burn for weeks of runway
    // If finance data hasn't loaded yet, don't show misleading infinite runway
    let runwayMonths = 0;
    let cashHealth: HealthStatus = 'warning';

    if (!isFinanceLoaded) {
      // Data not loaded yet - show neutral state
      runwayMonths = 0;
      cashHealth = 'warning';
    } else if (weeklyBurn === 0) {
      // No burn rate - infinite runway (show as very high number)
      runwayMonths = 999;
      cashHealth = 'healthy';
    } else if (cashBalance <= 0) {
      // Out of cash
      runwayMonths = 0;
      cashHealth = 'critical';
    } else {
      // Calculate actual runway
      const runwayWeeks = cashBalance / weeklyBurn;
      runwayMonths = runwayWeeks / 4.33;
      cashHealth = runwayMonths < 6 ? 'critical' : runwayMonths < 12 ? 'warning' : 'healthy';
    }

    return [
      {
        id: 'project-health',
        title: 'Project Health',
        primaryValue: `${onTimePercent}%`,
        primaryLabel: 'tasks on-time',
        secondaryValue: blockedTasks.toString(),
        secondaryLabel: 'Blocked',
        trend: blockedTasks === 0 ? 'up' : 'down',
        health: projectHealth,
        icon: Activity,
        iconColor: '#3b82f6',
        onPress: () => router.push('/(tabs)/tasks'),
      },
      {
        id: 'team-productivity',
        title: 'Team Productivity',
        primaryValue: completedThisWeek.toString(),
        primaryLabel: 'tasks this week',
        secondaryValue: `${avgCycleTime}d`,
        secondaryLabel: 'Avg cycle',
        trend: productivityTrend,
        health: completedThisWeek >= 2 ? 'healthy' : 'warning',
        icon: Zap,
        iconColor: '#f59e0b',
        onPress: () => router.push('/(tabs)/people'),
      },
      {
        id: 'cash-flow',
        title: 'Cash Flow',
        primaryValue: !isFinanceLoaded ? '—' : runwayMonths >= 999 ? '∞' : `${Math.round(runwayMonths)}mo`,
        primaryLabel: 'runway',
        secondaryValue: `£${(cashBalance / 1000).toFixed(1)}K`,
        secondaryLabel: 'Balance',
        trend: netCashFlow >= 0 ? 'up' : 'down',
        health: cashHealth,
        icon: PoundSterling,
        iconColor: '#14b8a6',
        onPress: () => {
          Alert.alert('Coming Soon', 'Financial dashboard is coming soon!');
        },
      },
    ];
  }, [roleFilteredWorkPlans, members, okrs, suppliers, currentWorkspace, getCashBalance, getWeeklyBurn, getMonthlyRevenue, isFinanceLoaded, router]);

  return (
    <View className="px-5 mb-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="bg-indigo-500 p-1.5 rounded-lg">
            <PieChart size={16} color="white" />
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            Performance Dashboards
          </Text>
        </View>
      </View>

      {/* KPI Grid */}
      <View className="flex-row flex-wrap justify-between">
        {kpiCards.map((card, index) => (
          <KPICard key={card.id} data={card} index={index} />
        ))}
      </View>

      {/* Legend */}
      <View className="flex-row items-center justify-center gap-4 mt-2">
        <View className="flex-row items-center gap-1">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: HEALTH_COLORS.healthy.border }} />
          <Text className="text-slate-500 dark:text-slate-400 text-[10px]">Healthy</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: HEALTH_COLORS.warning.border }} />
          <Text className="text-slate-500 dark:text-slate-400 text-[10px]">Warning</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: HEALTH_COLORS.critical.border }} />
          <Text className="text-slate-500 dark:text-slate-400 text-[10px]">Critical</Text>
        </View>
      </View>
    </View>
  );
}
