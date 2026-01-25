/**
 * SupplierSpendDashboard
 * Financial dashboard showing supplier/vendor spending with charts
 */

import { View, Text, Pressable } from 'react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PoundSterling,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Building2,
  PieChart,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { useSupplierStore } from '@/lib/state/supplier-store';
import { useFinanceStore } from '@/lib/state/finance-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';

interface PieSlice {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface SimplePieChartProps {
  data: PieSlice[];
  size?: number;
}

function SimplePieChart({ data, size = 120 }: SimplePieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <Text className="text-slate-400 dark:text-slate-500 text-xs">No data</Text>
      </View>
    );
  }

  const radius = size / 2 - 10;
  const center = size / 2;

  let currentAngle = -90; // Start from top

  const slices = data.map((slice) => {
    const angle = (slice.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Convert to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate arc points
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      ...slice,
      path: d,
    };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {slices.map((slice, index) => (
            <Path key={index} d={slice.path} fill={slice.color} />
          ))}
          {/* Center hole for donut effect */}
          <Circle cx={center} cy={center} r={radius * 0.5} fill="white" />
        </G>
      </Svg>
    </View>
  );
}

interface SpendTrendBarProps {
  months: { name: string; spend: number; budget: number }[];
}

function SpendTrendBar({ months }: SpendTrendBarProps) {
  const maxValue = Math.max(...months.map((m) => Math.max(m.spend, m.budget)));

  return (
    <View className="flex-row items-end justify-between gap-2 h-16">
      {months.map((month, index) => {
        const spendHeight = maxValue > 0 ? (month.spend / maxValue) * 100 : 0;
        const budgetHeight = maxValue > 0 ? (month.budget / maxValue) * 100 : 0;
        const isOverBudget = month.spend > month.budget;

        return (
          <View key={month.name} className="flex-1 items-center">
            <View className="flex-row gap-0.5 h-12 items-end">
              {/* Spend bar */}
              <View
                className="w-3 rounded-t"
                style={{
                  height: `${spendHeight}%`,
                  backgroundColor: isOverBudget ? '#ef4444' : '#3b82f6',
                  minHeight: 4,
                }}
              />
              {/* Budget line marker */}
              <View
                className="w-1.5 rounded-t bg-slate-300 dark:bg-slate-600"
                style={{
                  height: `${budgetHeight}%`,
                  minHeight: 2,
                }}
              />
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-[9px] mt-1">{month.name}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function SupplierSpendDashboard() {
  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();
  const suppliers = useSupplierStore((s) => s.suppliers);
  const getFavoriteSupplierIds = useSupplierStore((s) => s.getFavoriteSupplierIds);

  // Get financial data from Supabase
  const getCashBalance = useFinanceStore((s) => s.getCashBalance);
  const getWeeklyBurn = useFinanceStore((s) => s.getWeeklyBurn);
  const getBurnBreakdown = useFinanceStore((s) => s.getBurnBreakdown);
  const getCostsByCategory = useFinanceStore((s) => s.getCostsByCategory);
  const transactions = useFinanceStore((s) => s.transactions);

  // Get supplier engagements from organization store (for reference only)
  const getEngagementsByWorkspace = useOrganizationStore((s) => s.getEngagementsByWorkspace);

  // Calculate supplier spending from financial transactions (Supabase data)
  const spendData = useMemo(() => {
    if (!currentWorkspace) {
      return {
        activeSuppliers: [],
        totalSpend: 0,
        monthlyBudget: 0,
        budgetUsed: 0,
        budgetRemaining: 0,
        pieData: [],
        monthlyTrend: [],
        isOverBudget: false,
        engagements: [],
      };
    }

    const workspaceId = currentWorkspace.id;
    const favoriteIds = getFavoriteSupplierIds(workspaceId);
    const activeSuppliers = suppliers.filter((s) => favoriteIds.includes(s.id));

    // Get burn breakdown from financial transactions
    const burnBreakdown = getBurnBreakdown(workspaceId);
    const costsByCategory = getCostsByCategory(workspaceId);

    // Calculate total supplier and manufacturing costs
    const supplierCost = costsByCategory['supplier'] || 0;
    const manufacturingCost = costsByCategory['manufacturing'] || 0;
    const totalSpend = supplierCost + manufacturingCost;

    // Set budget as 3x monthly burn for suppliers (reasonable estimate)
    const monthlyBurn = getWeeklyBurn(workspaceId) * 4.33;
    const monthlyBudget = monthlyBurn * 3; // Budget for next 3 months

    // Category colors for pie chart
    const categoryColors: Record<string, string> = {
      supplier: '#3b82f6',
      manufacturing: '#10b981',
      infrastructure: '#8b5cf6',
      other: '#64748b',
    };

    // Create pie data from cost categories
    const pieData: PieSlice[] = [];
    if (supplierCost > 0) {
      pieData.push({
        name: 'Suppliers',
        value: supplierCost,
        color: categoryColors.supplier,
        percentage: totalSpend > 0 ? (supplierCost / totalSpend) * 100 : 0,
      });
    }
    if (manufacturingCost > 0) {
      pieData.push({
        name: 'Manufacturing',
        value: manufacturingCost,
        color: categoryColors.manufacturing,
        percentage: totalSpend > 0 ? (manufacturingCost / totalSpend) * 100 : 0,
      });
    }

    // Calculate monthly trend from transactions (last 3 months)
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend: { name: string; spend: number; budget: number }[] = [];

    // Filter transactions for this workspace
    const workspaceTransactions = transactions.filter(
      (t) => t.workspace_id === workspaceId && t.type === 'cost' && (t.category === 'supplier' || t.category === 'manufacturing')
    );

    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Sum spend for this month
      const monthSpend = workspaceTransactions.reduce((sum, t) => {
        const transactionDate = new Date(t.transaction_date);
        if (transactionDate >= monthStart && transactionDate <= monthEnd) {
          return sum + t.amount;
        }
        return sum;
      }, 0);

      monthlyTrend.push({
        name: monthName,
        spend: Math.round(monthSpend),
        budget: Math.round(monthlyBudget / 3), // Divide by 3 for monthly budget
      });
    }

    const budgetUsed = monthlyBudget > 0 ? (totalSpend / monthlyBudget) * 100 : 0;
    const budgetRemaining = Math.max(0, monthlyBudget - totalSpend);

    // Get engagements for reference
    const engagements = getEngagementsByWorkspace(workspaceId);

    return {
      activeSuppliers,
      totalSpend,
      monthlyBudget,
      budgetUsed,
      budgetRemaining,
      pieData,
      monthlyTrend,
      isOverBudget: totalSpend > monthlyBudget && monthlyBudget > 0,
      engagements,
    };
  }, [suppliers, currentWorkspace, getFavoriteSupplierIds, getWeeklyBurn, getBurnBreakdown, getCostsByCategory, transactions, getEngagementsByWorkspace]);

  return (
    <View className="px-5 mb-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="bg-blue-500 p-1.5 rounded-lg">
            <PoundSterling size={16} color="white" />
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            Supplier & Vendor Spend
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/financial-dashboard')}
          className="flex-row items-center gap-1"
        >
          <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
            View Details
          </Text>
          <ChevronRight size={14} color="#3b82f6" />
        </Pressable>
      </View>

      {/* Main Dashboard Card */}
      <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
        <View className="flex-row gap-4 mb-4">
          {/* Pie Chart */}
          <View className="items-center">
            <SimplePieChart data={spendData.pieData} size={100} />
            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">By Category</Text>
          </View>

          {/* Summary Stats */}
          <View className="flex-1">
            <View className="mb-3">
              <Text className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">
                Total Spend (This Month)
              </Text>
              <Text className="text-slate-900 dark:text-white text-2xl font-bold">
                £{(spendData.totalSpend / 1000).toFixed(1)}K
              </Text>
            </View>

            <View className="flex-row gap-3">
              <View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">Budget</Text>
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  £{(spendData.monthlyBudget / 1000).toFixed(1)}K
                </Text>
              </View>
              <View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">Remaining</Text>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: spendData.isOverBudget ? '#ef4444' : '#10b981' }}
                >
                  £{(spendData.budgetRemaining / 1000).toFixed(1)}K
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Budget Progress Bar */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-slate-500 dark:text-slate-400 text-xs">Budget Used</Text>
            <Text
              className="text-xs font-bold"
              style={{ color: spendData.budgetUsed >= 100 ? '#ef4444' : spendData.budgetUsed >= 80 ? '#f59e0b' : '#10b981' }}
            >
              {Math.round(spendData.budgetUsed)}%
            </Text>
          </View>
          <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(spendData.budgetUsed, 100)}%`,
                backgroundColor:
                  spendData.budgetUsed >= 100 ? '#ef4444' : spendData.budgetUsed >= 80 ? '#f59e0b' : '#10b981',
              }}
            />
          </View>
        </View>

        {/* Monthly Trend */}
        <View className="mb-4">
          <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase mb-2">
            3-Month Trend
          </Text>
          <SpendTrendBar months={spendData.monthlyTrend} />
          <View className="flex-row items-center gap-3 mt-2">
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded bg-blue-500" />
              <Text className="text-slate-500 dark:text-slate-400 text-[10px]">Spend</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded bg-slate-300 dark:bg-slate-600" />
              <Text className="text-slate-500 dark:text-slate-400 text-[10px]">Budget</Text>
            </View>
          </View>
        </View>

        {/* Category Legend */}
        <View className="border-t border-slate-100 dark:border-slate-700 pt-3">
          <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase mb-2">
            Spend by Category
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {spendData.pieData.map((item) => (
              <View
                key={item.name}
                className="flex-row items-center gap-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1"
              >
                <View
                  className="w-2 h-2 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <Text className="text-slate-700 dark:text-slate-300 text-xs">
                  {item.name}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs">
                  £{(item.value / 1000).toFixed(1)}K
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Budget Alert */}
        {spendData.isOverBudget && (
          <View className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 flex-row items-center gap-2">
            <AlertTriangle size={14} color="#ef4444" />
            <Text className="text-red-700 dark:text-red-400 text-xs flex-1">
              Supplier spending is over budget. Review active engagements.
            </Text>
          </View>
        )}

        {/* Active Engagements Summary */}
        {spendData.engagements.length > 0 && (
          <View className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Building2 size={14} color="#3b82f6" />
              <Text className="text-blue-700 dark:text-blue-400 font-semibold text-sm">
                {spendData.engagements.filter(e => e.status === 'in_progress' || e.status === 'planning').length} Active Engagements
              </Text>
            </View>
            <Text className="text-blue-600 dark:text-blue-400 text-xs">
              {spendData.engagements
                .filter(e => e.status === 'in_progress' || e.status === 'planning')
                .map((e) => e.supplierName)
                .slice(0, 3)
                .join(', ')}
              {spendData.engagements.filter(e => e.status === 'in_progress' || e.status === 'planning').length > 3 &&
                ` +${spendData.engagements.filter(e => e.status === 'in_progress' || e.status === 'planning').length - 3} more`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
