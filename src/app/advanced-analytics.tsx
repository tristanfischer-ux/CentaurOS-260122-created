/**
 * Advanced Analytics Screen
 * Custom dashboards with KPI tracking and deep insights
 */

import { View, Text, ScrollView, Dimensions } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  Download,
  LayoutGrid,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticPressable } from '@/components/HapticPressable';
import { RefreshableScrollView } from '@/components/RefreshableScrollView';
import {
  DEFAULT_DASHBOARDS,
  getAllKPIs,
  getKPIById,
  generateTimeSeriesData,
  calculateKPIHealth,
  type CustomDashboard,
  type KPI,
} from '@/lib/advanced-analytics';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2 - 8;

export default function AdvancedAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDashboard, setSelectedDashboard] = useState<CustomDashboard>(
    DEFAULT_DASHBOARDS[0]
  );
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const allKPIs = getAllKPIs();

  const handleRefresh = async () => {
    // Simulate data refresh
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const getTrendIcon = (trend: KPI['trend']) => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return null;
  };

  const getTrendColor = (trend: KPI['trend'], isPositive: boolean = true) => {
    if (trend === 'stable') return '#64748b';
    const shouldBeGreen = (trend === 'up' && isPositive) || (trend === 'down' && !isPositive);
    return shouldBeGreen ? '#10b981' : '#ef4444';
  };

  const getHealthColor = (health: 'healthy' | 'warning' | 'critical') => {
    switch (health) {
      case 'healthy':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '$') {
      return `$${value.toLocaleString()}`;
    }
    if (unit === '%') {
      return `${value}%`;
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  const renderKPICard = (kpi: KPI) => {
    const TrendIcon = getTrendIcon(kpi.trend);
    const health = calculateKPIHealth(kpi);
    const isPositiveTrend = ['revenue-mrr', 'team-velocity', 'dau', 'leads'].includes(kpi.id);
    const trendColor = getTrendColor(kpi.trend, isPositiveTrend);

    return (
      <View
        key={kpi.id}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 mb-3"
        style={{ width: cardWidth }}
      >
        {/* Category badge */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
            <Text className="text-gray-700 dark:text-slate-300 text-xs font-semibold">
              {kpi.category}
            </Text>
          </View>
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getHealthColor(health) }}
          />
        </View>

        {/* KPI Name */}
        <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">{kpi.name}</Text>

        {/* Value */}
        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-2">
          {formatValue(kpi.value, kpi.unit)}
        </Text>

        {/* Trend */}
        {TrendIcon && (
          <View className="flex-row items-center">
            <TrendIcon size={14} color={trendColor} />
            <Text className="text-xs font-semibold ml-1" style={{ color: trendColor }}>
              {kpi.changePercentage > 0 ? '+' : ''}
              {kpi.changePercentage.toFixed(1)}%
            </Text>
            <Text className="text-gray-500 dark:text-slate-500 text-xs ml-2">
              vs last {kpi.timeframe}
            </Text>
          </View>
        )}

        {/* Target progress */}
        {kpi.target && (
          <View className="mt-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-gray-500 dark:text-slate-500 text-xs">Target</Text>
              <Text className="text-gray-700 dark:text-slate-300 text-xs font-semibold">
                {formatValue(kpi.target, kpi.unit)}
              </Text>
            </View>
            <View className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%`,
                  backgroundColor: getHealthColor(health),
                }}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderMiniChart = (kpiId: string) => {
    const data = generateTimeSeriesData(kpiId, 7);
    const max = Math.max(...data.map((d) => d.value));
    const min = Math.min(...data.map((d) => d.value));
    const range = max - min || 1;

    return (
      <View className="flex-row items-end h-16 gap-1">
        {data.map((point, idx) => {
          const heightPercent = ((point.value - min) / range) * 100;
          return (
            <View
              key={idx}
              className="flex-1 bg-blue-500 rounded-t"
              style={{ height: `${Math.max(heightPercent, 10)}%` }}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <HapticPressable
              onPress={() => router.back()}
              className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
            >
              <ArrowLeft size={20} color="#64748b" />
            </HapticPressable>
            <View className="flex-row items-center gap-2">
              <LayoutGrid size={24} color="#3b82f6" />
              <Text className="text-gray-900 dark:text-white text-2xl font-bold">
                Advanced Analytics
              </Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <HapticPressable className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900">
              <Download size={20} color="#64748b" />
            </HapticPressable>
            <HapticPressable className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900">
              <Settings size={20} color="#64748b" />
            </HapticPressable>
          </View>
        </View>

        {/* Dashboard Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          {DEFAULT_DASHBOARDS.map((dashboard) => (
            <HapticPressable
              key={dashboard.id}
              onPress={() => setSelectedDashboard(dashboard)}
              className={`px-4 py-2 rounded-lg mr-2 ${
                selectedDashboard.id === dashboard.id
                  ? 'bg-blue-500'
                  : 'bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800'
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  selectedDashboard.id === dashboard.id
                    ? 'text-white'
                    : 'text-gray-700 dark:text-slate-300'
                }`}
              >
                {dashboard.name}
              </Text>
            </HapticPressable>
          ))}
          <HapticPressable className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 flex-row items-center">
            <Plus size={16} color="#64748b" />
            <Text className="text-gray-700 dark:text-slate-300 font-semibold text-sm ml-1">
              New
            </Text>
          </HapticPressable>
        </ScrollView>
      </View>

      <RefreshableScrollView onRefresh={handleRefresh}>
        {/* Dashboard Description */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-gray-600 dark:text-slate-400 text-sm">
            {selectedDashboard.description}
          </Text>
        </View>

        {/* KPI Grid */}
        <View className="px-6 pb-4">
          <View className="flex-row flex-wrap justify-between">
            {allKPIs.slice(0, 6).map((kpi) => renderKPICard(kpi))}
          </View>
        </View>

        {/* Featured Chart - Revenue Trend */}
        <View className="px-6 pb-4">
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-300 dark:border-slate-800">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 dark:text-white text-lg font-bold">
                Revenue Trend
              </Text>
              <View className="flex-row gap-2">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <HapticPressable
                    key={range}
                    onPress={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded ${
                      timeRange === range
                        ? 'bg-blue-500'
                        : 'bg-gray-100 dark:bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        timeRange === range
                          ? 'text-white'
                          : 'text-gray-600 dark:text-slate-400'
                      }`}
                    >
                      {range}
                    </Text>
                  </HapticPressable>
                ))}
              </View>
            </View>
            {renderMiniChart('revenue-mrr')}
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-gray-500 dark:text-slate-500 text-xs">
                Last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
              </Text>
              <Text className="text-gray-900 dark:text-white text-sm font-bold">
                $45,000 MRR
              </Text>
            </View>
          </View>
        </View>

        {/* Comparison Section */}
        <View className="px-6 pb-4">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
            Performance Comparison
          </Text>
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-300 dark:border-slate-800">
            {['Team Velocity', 'Task Completion', 'OKR Progress'].map((metric, idx) => {
              const values = [21, 87, 68];
              const targets = [25, 90, 75];
              const percentage = (values[idx] / targets[idx]) * 100;

              return (
                <View key={idx} className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {metric}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">
                      {values[idx]} / {targets[idx]}
                    </Text>
                  </View>
                  <View className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* All KPIs List */}
        <View className="px-6 pb-8">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
            All Metrics
          </Text>
          {Object.entries({
            Financial: allKPIs.filter((k) => k.category === 'Financial'),
            Operational: allKPIs.filter((k) => k.category === 'Operational'),
            Team: allKPIs.filter((k) => k.category === 'Team'),
          }).map(([category, kpis]) => (
            <View key={category} className="mb-4">
              <Text className="text-gray-700 dark:text-slate-300 font-bold mb-2">
                {category}
              </Text>
              {kpis.map((kpi) => {
                const TrendIcon = getTrendIcon(kpi.trend);
                const isPositiveTrend = [
                  'revenue-mrr',
                  'team-velocity',
                  'dau',
                  'leads',
                ].includes(kpi.id);
                const trendColor = getTrendColor(kpi.trend, isPositiveTrend);

                return (
                  <View
                    key={kpi.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-2 border border-gray-300 dark:border-slate-800"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-semibold mb-1">
                          {kpi.name}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          {kpi.timeframe}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-gray-900 dark:text-white text-xl font-bold">
                          {formatValue(kpi.value, kpi.unit)}
                        </Text>
                        {TrendIcon && (
                          <View className="flex-row items-center mt-1">
                            <TrendIcon size={12} color={trendColor} />
                            <Text className="text-xs font-semibold ml-1" style={{ color: trendColor }}>
                              {kpi.changePercentage > 0 ? '+' : ''}
                              {kpi.changePercentage.toFixed(1)}%
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </RefreshableScrollView>
    </View>
  );
}
