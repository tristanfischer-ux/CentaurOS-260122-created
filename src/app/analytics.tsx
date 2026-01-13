/**
 * Analytics Dashboard
 * Real-time insights on team performance and metrics
 */

import { View, Text, Dimensions } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, TrendingUp, Users, Target, Zap, Award } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticPressable } from '@/components/HapticPressable';
import { RefreshableScrollView } from '@/components/RefreshableScrollView';
import {
  generateTeamVelocityData,
  generateOKRHealthData,
  generateResourceUtilizationData,
  generateAIToolUsageData,
  generateFunctionPerformanceData,
  calculateTotalTasksCompleted,
  calculateAverageCompletionRate,
  calculateTeamUtilization,
  getOKRsByStatus,
  calculateAIToolUsage,
  type TeamVelocityData,
  type OKRHealthData,
  type ResourceUtilizationData,
  type AIToolUsageData,
  type FunctionPerformanceData,
} from '@/lib/analytics';

const { width } = Dimensions.get('window');
const chartWidth = width - 48;

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [velocityData, setVelocityData] = useState<TeamVelocityData[]>(generateTeamVelocityData());
  const [okrData, setOkrData] = useState<OKRHealthData[]>(generateOKRHealthData());
  const [utilizationData, setUtilizationData] = useState<ResourceUtilizationData[]>(
    generateResourceUtilizationData()
  );
  const [aiUsageData, setAiUsageData] = useState<AIToolUsageData[]>(generateAIToolUsageData());
  const [functionData, setFunctionData] = useState<FunctionPerformanceData[]>(
    generateFunctionPerformanceData()
  );

  const totalTasks = calculateTotalTasksCompleted(velocityData);
  const avgCompletionRate = calculateAverageCompletionRate(velocityData);
  const teamUtilization = calculateTeamUtilization(utilizationData);
  const totalAIUses = calculateAIToolUsage(aiUsageData);
  const onTrackOKRs = getOKRsByStatus(okrData, 'on-track').length;
  const atRiskOKRs = getOKRsByStatus(okrData, 'at-risk').length;
  const offTrackOKRs = getOKRsByStatus(okrData, 'off-track').length;

  const handleRefresh = async () => {
    // Simulate data refresh
    setVelocityData(generateTeamVelocityData());
    setOkrData(generateOKRHealthData());
    setUtilizationData(generateResourceUtilizationData());
    setAiUsageData(generateAIToolUsageData());
    setFunctionData(generateFunctionPerformanceData());
  };

  const getStatusColor = (status: OKRHealthData['status']) => {
    switch (status) {
      case 'on-track':
        return '#10b981';
      case 'at-risk':
        return '#f59e0b';
      case 'off-track':
        return '#ef4444';
    }
  };

  // Simple line chart component
  const LineChart = ({ data }: { data: number[] }) => {
    const max = Math.max(...data);
    const chartHeight = 120;
    const points = data.map((value, idx) => {
      const x = (idx / (data.length - 1)) * chartWidth;
      const y = chartHeight - (value / max) * chartHeight;
      return { x, y };
    });

    return (
      <View style={{ height: chartHeight, width: chartWidth }}>
        <View className="flex-row items-end justify-between h-full">
          {data.map((value, idx) => (
            <View key={idx} className="flex-1 items-center justify-end px-1">
              <View
                className="w-full bg-blue-500 rounded-t"
                style={{ height: `${(value / max) * 100}%` }}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Simple bar chart component
  const BarChart = ({ data }: { data: { label: string; value: number }[] }) => {
    const max = Math.max(...data.map((d) => d.value));
    const chartHeight = 150;

    return (
      <View style={{ height: chartHeight + 30 }}>
        <View className="flex-row items-end justify-between" style={{ height: chartHeight }}>
          {data.map((item, idx) => (
            <View key={idx} className="flex-1 items-center justify-end px-1">
              <View
                className="w-full bg-purple-500 rounded-t"
                style={{ height: `${(item.value / max) * 100}%` }}
              />
            </View>
          ))}
        </View>
        <View className="flex-row items-center justify-between mt-2">
          {data.map((item, idx) => (
            <Text
              key={idx}
              className="text-gray-600 dark:text-slate-400 text-xs flex-1 text-center"
            >
              {item.label}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800 flex-row items-center">
        <HapticPressable
          onPress={() => router.back()}
          className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900 active:opacity-70"
        >
          <ArrowLeft size={20} color="#64748b" />
        </HapticPressable>
        <View className="flex-row items-center gap-2">
          <TrendingUp size={24} color="#3b82f6" />
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Analytics</Text>
        </View>
      </View>

      <RefreshableScrollView onRefresh={handleRefresh}>
        {/* Key Metrics */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
            Key Metrics
          </Text>
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
              <Target size={24} color="#3b82f6" />
              <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-2">
                {totalTasks}
              </Text>
              <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
                Tasks Completed
              </Text>
            </View>
            <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
              <Award size={24} color="#10b981" />
              <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-2">
                {avgCompletionRate}%
              </Text>
              <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
                Completion Rate
              </Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
              <Users size={24} color="#8b5cf6" />
              <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-2">
                {teamUtilization}%
              </Text>
              <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
                Team Utilization
              </Text>
            </View>
            <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
              <Zap size={24} color="#f59e0b" />
              <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-2">
                {totalAIUses}
              </Text>
              <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">AI Tool Uses</Text>
            </View>
          </View>
        </View>

        {/* Team Velocity Chart */}
        <View className="px-6 pb-4">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
            Team Velocity (6 Weeks)
          </Text>
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800">
            <LineChart data={velocityData.map((d) => d.tasksCompleted)} />
            <View className="flex-row items-center justify-between mt-2">
              {velocityData.map((d, idx) => (
                <Text
                  key={idx}
                  className="text-gray-600 dark:text-slate-400 text-xs flex-1 text-center"
                >
                  W{idx + 1}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* OKR Health */}
        <View className="px-6 pb-4">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">OKR Health</Text>
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 mb-3">
            <View className="flex-row items-center justify-around mb-4">
              <View className="items-center">
                <View className="w-16 h-16 rounded-full bg-emerald-500 items-center justify-center mb-2">
                  <Text className="text-white text-2xl font-bold">{onTrackOKRs}</Text>
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">On Track</Text>
              </View>
              <View className="items-center">
                <View className="w-16 h-16 rounded-full bg-amber-500 items-center justify-center mb-2">
                  <Text className="text-white text-2xl font-bold">{atRiskOKRs}</Text>
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">At Risk</Text>
              </View>
              <View className="items-center">
                <View className="w-16 h-16 rounded-full bg-red-500 items-center justify-center mb-2">
                  <Text className="text-white text-2xl font-bold">{offTrackOKRs}</Text>
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-xs">Off Track</Text>
              </View>
            </View>
          </View>

          {/* OKR List */}
          <View className="gap-2">
            {okrData.map((okr, idx) => (
              <View
                key={idx}
                className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-gray-300 dark:border-slate-800"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-900 dark:text-white font-bold text-base flex-1">
                    {okr.okrName}
                  </Text>
                  <View
                    className="w-2 h-2 rounded-full ml-2"
                    style={{ backgroundColor: getStatusColor(okr.status) }}
                  />
                </View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">{okr.function}</Text>
                  <Text className="text-gray-900 dark:text-white text-sm font-semibold">
                    {okr.progress}%
                  </Text>
                </View>
                <View className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${okr.progress}%`,
                      backgroundColor: getStatusColor(okr.status),
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Resource Utilization */}
        <View className="px-6 pb-4">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
            Resource Utilization
          </Text>
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800">
            <BarChart
              data={utilizationData.map((d) => ({
                label: d.name.split(' ')[0],
                value: d.utilizationRate,
              }))}
            />
          </View>
        </View>

        {/* AI Tool Usage */}
        <View className="px-6 pb-4">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
            AI Tool Usage
          </Text>
          <View className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800">
            <View className="gap-2">
              {aiUsageData
                .sort((a, b) => b.uses - a.uses)
                .map((tool, idx) => {
                  const maxUses = Math.max(...aiUsageData.map((t) => t.uses));
                  const percentage = (tool.uses / maxUses) * 100;
                  const colors = [
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899',
                    '#f59e0b',
                    '#10b981',
                    '#14b8a6',
                  ];

                  return (
                    <View key={idx} className="mb-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                          {tool.toolName}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          {tool.uses} uses
                        </Text>
                      </View>
                      <View className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: colors[idx % colors.length],
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        </View>

        {/* Function Performance */}
        <View className="px-6 pb-8">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
            Function Performance
          </Text>
          <View className="gap-3">
            {functionData
              .sort((a, b) => b.score - a.score)
              .map((func, idx) => (
                <View
                  key={idx}
                  className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-gray-300 dark:border-slate-800"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">
                      {func.function}
                    </Text>
                    <View className="bg-blue-500 px-3 py-1 rounded-full">
                      <Text className="text-white font-bold text-sm">{func.score}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">
                        OKRs Completed
                      </Text>
                      <Text className="text-gray-900 dark:text-white font-semibold">
                        {func.okrsCompleted}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">
                        Tasks Completed
                      </Text>
                      <Text className="text-gray-900 dark:text-white font-semibold">
                        {func.tasksCompleted}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">
                        Avg Time (days)
                      </Text>
                      <Text className="text-gray-900 dark:text-white font-semibold">
                        {func.avgCompletionTime}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        </View>
      </RefreshableScrollView>
    </View>
  );
}
