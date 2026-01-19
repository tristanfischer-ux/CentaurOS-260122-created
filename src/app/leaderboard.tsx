/**
 * Leaderboard Screen
 *
 * Competitive rankings showing how companies compare on key startup metrics
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { Trophy, TrendingUp, Zap, Users, Clock, Target, ChevronUp, ChevronDown, Award, Minus } from 'lucide-react-native';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLeaderboardStore, type LeaderboardMetric } from '@/lib/state/leaderboard-store';

const METRICS = [
  {
    id: 'time-to-market' as LeaderboardMetric,
    label: 'Time to Market',
    icon: Clock,
    description: 'Fastest to launch (fewer days)',
    color: '#3b82f6',
    format: (value: number) => value === 9999 ? 'Not launched' : `${value} days`,
  },
  {
    id: 'revenue-velocity' as LeaderboardMetric,
    label: 'Revenue Velocity',
    icon: TrendingUp,
    description: '£ revenue per day since founding',
    color: '#10b981',
    format: (value: number) => `£${value.toFixed(0)}/day`,
  },
  {
    id: 'capital-efficiency' as LeaderboardMetric,
    label: 'Capital Efficiency',
    icon: Zap,
    description: '£ revenue / £ spent',
    color: '#f59e0b',
    format: (value: number) => `${(value * 100).toFixed(1)}%`,
  },
  {
    id: 'team-efficiency' as LeaderboardMetric,
    label: 'Team Efficiency',
    icon: Users,
    description: '£ revenue per team member',
    color: '#8b5cf6',
    format: (value: number) => `£${value.toFixed(0)}`,
  },
];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const [selectedMetric, setSelectedMetric] = useState<LeaderboardMetric>('revenue-velocity');

  const getLeaderboard = useLeaderboardStore(s => s.getLeaderboard);
  const getCompanyMetrics = useLeaderboardStore(s => s.getCompanyMetrics);

  const leaderboard = getLeaderboard(selectedMetric);
  const currentCompany = currentWorkspace ? getCompanyMetrics(currentWorkspace.id) : null;
  const currentEntry = leaderboard.find(e => e.company.workspaceId === currentWorkspace?.id);

  const selectedMetricInfo = METRICS.find(m => m.id === selectedMetric)!;
  const Icon = selectedMetricInfo.icon;

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#fbbf24'; // Gold
    if (rank === 2) return '#9ca3af'; // Silver
    if (rank === 3) return '#cd7f32'; // Bronze
    return '#64748b'; // Default gray
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} color="#fbbf24" />;
    if (rank === 2) return <Award size={20} color="#9ca3af" />;
    if (rank === 3) return <Award size={20} color="#cd7f32" />;
    return <Text className="text-gray-500 dark:text-slate-400 font-bold text-sm">{rank}</Text>;
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">COMPETITIVE BENCHMARKS</Text>
            <Text className="text-white text-2xl font-bold">Leaderboard</Text>
          </View>
          <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
            <Trophy size={24} color="#fff" />
          </View>
        </View>
        <Text className="text-white/90 text-sm">
          See how you compare to other startups on the platform
        </Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-5 py-4">
        {/* Your Position Card */}
        {currentEntry && (
          <View className="mb-4">
            <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide">
              YOUR POSITION
            </Text>
            <LinearGradient
              colors={['#8b5cf6', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-3">
                    <Text className="text-white font-black text-xl">#{currentEntry.rank}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">
                      {currentCompany?.companyName}
                    </Text>
                    <Text className="text-white/70 text-xs">{currentCompany?.industry}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-white font-bold text-xl">
                    {selectedMetricInfo.format(currentEntry.score)}
                  </Text>
                  <Text className="text-white/70 text-xs">{selectedMetricInfo.label}</Text>
                </View>
              </View>

              {/* Mini Stats */}
              <View className="flex-row gap-2">
                <View className="flex-1 bg-white/10 rounded-lg p-2">
                  <Text className="text-white/70 text-xs">Revenue</Text>
                  <Text className="text-white font-bold text-sm">
                    £{(currentCompany?.monthlyRevenue || 0).toLocaleString()}/mo
                  </Text>
                </View>
                <View className="flex-1 bg-white/10 rounded-lg p-2">
                  <Text className="text-white/70 text-xs">Team Size</Text>
                  <Text className="text-white font-bold text-sm">{currentCompany?.teamSize}</Text>
                </View>
                <View className="flex-1 bg-white/10 rounded-lg p-2">
                  <Text className="text-white/70 text-xs">Days Live</Text>
                  <Text className="text-white font-bold text-sm">
                    {currentCompany?.daysToLaunch || 'N/A'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Metric Selector */}
        <View className="mb-4">
          <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide">
            RANK BY METRIC
          </Text>
          <View className="gap-2">
            {METRICS.map((metric) => {
              const MetricIcon = metric.icon;
              const isSelected = selectedMetric === metric.id;

              return (
                <Pressable
                  key={metric.id}
                  onPress={() => setSelectedMetric(metric.id)}
                  className={`rounded-xl p-4 active:opacity-70 ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
                      : 'bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-10 h-10 rounded-lg items-center justify-center"
                      style={{ backgroundColor: metric.color + '20' }}
                    >
                      <MetricIcon size={20} color={metric.color} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text
                        className={`font-bold text-base ${
                          isSelected
                            ? 'text-purple-900 dark:text-purple-100'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {metric.label}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">
                        {metric.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center">
                        <Target size={14} color="#fff" />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Leaderboard Rankings */}
        <View className="mb-4">
          <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide">
            TOP COMPANIES
          </Text>
          <View className="gap-2">
            {leaderboard.map((entry) => {
              const isCurrentCompany = entry.company.workspaceId === currentWorkspace?.id;
              const rankColor = getRankColor(entry.rank);

              return (
                <View
                  key={entry.company.id}
                  className={`rounded-xl p-4 ${
                    isCurrentCompany
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
                      : 'bg-gray-50 dark:bg-slate-900'
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      {/* Rank */}
                      <View
                        className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: rankColor + '20' }}
                      >
                        {getRankIcon(entry.rank)}
                      </View>

                      {/* Company Info */}
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text
                            className={`font-bold text-base ${
                              isCurrentCompany
                                ? 'text-purple-900 dark:text-purple-100'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {entry.company.companyName}
                          </Text>
                          {isCurrentCompany && (
                            <View className="ml-2 bg-purple-500 px-2 py-0.5 rounded-full">
                              <Text className="text-white text-xs font-bold">YOU</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          {entry.company.industry}
                        </Text>
                      </View>
                    </View>

                    {/* Score */}
                    <View className="items-end">
                      <Text
                        className={`font-bold text-lg ${
                          isCurrentCompany
                            ? 'text-purple-900 dark:text-purple-100'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {selectedMetricInfo.format(entry.score)}
                      </Text>
                      {entry.change !== 0 && (
                        <View className="flex-row items-center">
                          {entry.change > 0 ? (
                            <ChevronUp size={12} color="#10b981" />
                          ) : entry.change < 0 ? (
                            <ChevronDown size={12} color="#ef4444" />
                          ) : (
                            <Minus size={12} color="#9ca3af" />
                          )}
                          <Text
                            className={`text-xs font-semibold ml-0.5 ${
                              entry.change > 0
                                ? 'text-emerald-600'
                                : entry.change < 0
                                ? 'text-red-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {Math.abs(entry.change)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Company Stats */}
                  <View className="flex-row gap-3 mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                    <View className="flex-1">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">
                        Monthly Revenue
                      </Text>
                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                        £{entry.company.monthlyRevenue.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">Team</Text>
                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                        {entry.company.teamSize} people
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">
                        Launched
                      </Text>
                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                        {entry.company.daysToLaunch ? `Day ${entry.company.daysToLaunch}` : 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Info Banner */}
        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <Text className="text-blue-900 dark:text-blue-100 text-xs">
            <Text className="font-bold">How rankings work: </Text>
            Rankings are based on real data from companies using the platform. Your metrics are
            automatically calculated from your workspace data.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
