/**
 * Benchmarking Screen
 * Compare your metrics against industry standards
 */

import { View, Text, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Award,
  Info,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticPressable } from '@/components/HapticPressable';
import { RefreshableScrollView } from '@/components/RefreshableScrollView';
import {
  BENCHMARK_DATA,
  INDUSTRY_INSIGHTS,
  COMPARISON_GROUPS,
  calculatePerformanceScore,
  getPerformanceLevel,
  getOverallScore,
  getBenchmarksByCategory,
  type BenchmarkData,
} from '@/lib/benchmarking';

export default function BenchmarkingScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<BenchmarkData['category'] | 'All'>(
    'All'
  );

  const overallScore = getOverallScore();
  const overallPerformance = getPerformanceLevel(overallScore);

  const categories: Array<BenchmarkData['category'] | 'All'> = [
    'All',
    'Financial',
    'Operational',
    'Team',
    'Product',
    'Sales',
    'Marketing',
  ];

  const filteredBenchmarks =
    selectedCategory === 'All'
      ? BENCHMARK_DATA
      : getBenchmarksByCategory(selectedCategory);

  const handleRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '$') return `$${value.toLocaleString()}`;
    if (unit.includes('%')) return `${value}${unit}`;
    return `${value} ${unit}`;
  };

  const renderBenchmarkCard = (benchmark: BenchmarkData) => {
    const score = calculatePerformanceScore(benchmark);
    const performance = getPerformanceLevel(score);

    return (
      <View
        key={benchmark.metric}
        className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-300 dark:border-slate-800 mb-3"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-lg font-bold mb-1">
              {benchmark.metric}
            </Text>
            <View className="flex-row items-center">
              <View
                className="px-2 py-1 rounded"
                style={{ backgroundColor: performance.color + '20' }}
              >
                <Text className="text-xs font-semibold" style={{ color: performance.color }}>
                  {performance.level}
                </Text>
              </View>
              <Text className="text-gray-500 dark:text-slate-500 text-xs ml-2">
                {performance.description}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-gray-500 dark:text-slate-500 text-xs mb-1">Score</Text>
            <Text className="text-3xl font-bold" style={{ color: performance.color }}>
              {score}
            </Text>
          </View>
        </View>

        {/* Visual Comparison */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-600 dark:text-slate-400 text-sm">Your Value</Text>
            <Text className="text-gray-900 dark:text-white font-bold">
              {formatValue(benchmark.yourValue, benchmark.unit)}
            </Text>
          </View>

          {/* Range Visualization */}
          <View className="relative h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
            {/* Industry Average Marker */}
            <View
              className="absolute top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-white"
              style={{
                left: `${((benchmark.industryAverage - benchmark.bottomQuartile) / (benchmark.topQuartile - benchmark.bottomQuartile)) * 100}%`,
              }}
            />
            {/* Your Position */}
            <View
              className="absolute top-0 bottom-0 rounded-full"
              style={{
                left: 0,
                width: `${score}%`,
                backgroundColor: performance.color,
              }}
            />
          </View>

          {/* Reference Points */}
          <View className="flex-row justify-between">
            <View>
              <Text className="text-gray-500 dark:text-slate-500 text-xs">Bottom 25%</Text>
              <Text className="text-gray-700 dark:text-slate-300 text-xs font-semibold">
                {formatValue(benchmark.bottomQuartile, benchmark.unit)}
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 dark:text-slate-500 text-xs">Average</Text>
              <Text className="text-gray-700 dark:text-slate-300 text-xs font-semibold">
                {formatValue(benchmark.industryAverage, benchmark.unit)}
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 dark:text-slate-500 text-xs">Top 25%</Text>
              <Text className="text-gray-700 dark:text-slate-300 text-xs font-semibold">
                {formatValue(benchmark.topQuartile, benchmark.unit)}
              </Text>
            </View>
          </View>
        </View>

        {/* Gap Analysis */}
        {score < 90 && (
          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
            <Text className="text-blue-700 dark:text-blue-400 text-xs">
              To reach top 25%: {' '}
              {benchmark.betterWhenHigher
                ? `Increase by ${formatValue(benchmark.topQuartile - benchmark.yourValue, benchmark.unit)}`
                : `Decrease by ${formatValue(benchmark.yourValue - benchmark.topQuartile, benchmark.unit)}`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center mb-4">
          <HapticPressable
            onPress={() => router.back()}
            className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
          >
            <ArrowLeft size={20} color="#64748b" />
          </HapticPressable>
          <View className="flex-row items-center gap-2">
            <BarChart3 size={24} color="#3b82f6" />
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">
              Benchmarking
            </Text>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          {categories.map((category) => (
            <HapticPressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg mr-2 ${
                selectedCategory === category
                  ? 'bg-blue-500'
                  : 'bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800'
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  selectedCategory === category
                    ? 'text-white'
                    : 'text-gray-700 dark:text-slate-300'
                }`}
              >
                {category}
              </Text>
            </HapticPressable>
          ))}
        </ScrollView>
      </View>

      <RefreshableScrollView onRefresh={handleRefresh}>
        {/* Overall Score */}
        <View className="px-6 pt-6 pb-4">
          <View className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-sm mb-1">Overall Performance Score</Text>
                <Text className="text-white text-4xl font-bold mb-2">{overallScore}</Text>
                <Text className="text-white/80 text-sm">{overallPerformance.description}</Text>
              </View>
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
                <Award size={32} color="#ffffff" />
              </View>
            </View>
          </View>
        </View>

        {/* Comparison Groups */}
        <View className="px-6 pb-4">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
            Comparison Groups
          </Text>
          {COMPARISON_GROUPS.map((group) => (
            <HapticPressable
              key={group.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 border border-gray-300 dark:border-slate-800 flex-row items-center"
            >
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-bold mb-1">
                  {group.name}
                </Text>
                <Text className="text-gray-600 dark:text-slate-400 text-xs mb-2">
                  {group.description}
                </Text>
                <View className="flex-row gap-4">
                  <Text className="text-gray-500 dark:text-slate-500 text-xs">
                    {group.companyCount} companies
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-500 text-xs">
                    {group.averageRevenue}
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-500 text-xs">
                    ~{group.averageTeamSize} employees
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </HapticPressable>
          ))}
        </View>

        {/* Industry Insights */}
        <View className="px-6 pb-4">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
            Industry Insights
          </Text>
          {INDUSTRY_INSIGHTS.map((insight) => {
            const impactColors = {
              high: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
              medium: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
              low: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
            };

            return (
              <View
                key={insight.id}
                className={`rounded-xl p-4 mb-3 border-l-4 ${impactColors[insight.impact]}`}
              >
                <View className="flex-row items-start mb-2">
                  <Info size={16} color="#64748b" />
                  <Text className="text-gray-900 dark:text-white font-bold text-sm ml-2 flex-1">
                    {insight.title}
                  </Text>
                  <View className="bg-gray-900 dark:bg-white px-2 py-1 rounded">
                    <Text className="text-white dark:text-gray-900 text-xs font-bold uppercase">
                      {insight.impact}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-700 dark:text-slate-300 text-sm mb-2">
                  {insight.description}
                </Text>
                <View className="bg-white dark:bg-slate-950 rounded-lg p-3 mb-2">
                  <Text className="text-gray-900 dark:text-white text-xs font-semibold mb-1">
                    Recommendation:
                  </Text>
                  <Text className="text-gray-700 dark:text-slate-300 text-xs">
                    {insight.recommendation}
                  </Text>
                </View>
                <Text className="text-gray-500 dark:text-slate-500 text-xs">
                  Source: {insight.source}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Benchmarks */}
        <View className="px-6 pb-8">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
            Detailed Metrics
          </Text>
          {filteredBenchmarks.map((benchmark) => renderBenchmarkCard(benchmark))}
        </View>
      </RefreshableScrollView>
    </View>
  );
}
