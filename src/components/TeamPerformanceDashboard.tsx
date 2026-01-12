import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Target,
  Zap,
  CheckCircle2,
  Clock,
  Activity,
  Users,
  BarChart3,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { TeamMemberPerformance, TeamPerformanceSummary, PerformanceComparison } from '@/lib/performance-analytics';

interface TeamPerformanceDashboardProps {
  performances: TeamMemberPerformance[];
  summary: TeamPerformanceSummary;
  comparisons: PerformanceComparison[];
}

export function TeamPerformanceDashboard({
  performances,
  summary,
  comparisons,
}: TeamPerformanceDashboardProps) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'all' | 'FractionalExec' | 'Apprentice'>('all');

  const filteredPerformances = selectedRole === 'all'
    ? performances
    : performances.filter(p => p.role === selectedRole);

  // Calculate derived stats from performances
  const executivesCount = performances.filter(p => p.role === 'FractionalExec').length;
  const apprenticesCount = performances.filter(p => p.role === 'Apprentice').length;
  const averageContributionScore = performances.length > 0
    ? performances.reduce((sum, p) => sum + p.contributionScore, 0) / performances.length
    : 0;
  const highPerformersCount = summary.topPerformers.length;
  const totalTasksCompletedThisWeek = performances.reduce((sum, p) => sum + p.tasksCompletedThisWeek, 0);
  const averageTasksPerWeek = performances.length > 0
    ? performances.reduce((sum, p) => sum + p.avgTasksPerWeek, 0) / performances.length
    : 0;

  // Extract specific comparisons
  const contributionComparison = comparisons.find(c => c.metric === 'completion_rate');
  const qualityComparison = comparisons.find(c => c.metric === 'quality_score');

  const getTrendIcon = (trend: 'improving' | 'steady' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp size={16} color="#10b981" />;
      case 'declining':
        return <TrendingDown size={16} color="#ef4444" />;
      default:
        return <Minus size={16} color="#64748b" />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'steady' | 'declining') => {
    switch (trend) {
      case 'improving':
        return 'text-emerald-400';
      case 'declining':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number): [string, string] => {
    if (score >= 80) return ['#10b981', '#059669'];
    if (score >= 60) return ['#3b82f6', '#2563eb'];
    if (score >= 40) return ['#f59e0b', '#d97706'];
    return ['#ef4444', '#dc2626'];
  };

  const ProgressBar = ({ value, max = 100, color }: { value: number; max?: number; color: string }) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
      <View className="h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </View>
    );
  };

  const toggleMemberExpansion = (userId: string) => {
    setExpandedMember(expandedMember === userId ? null : userId);
  };

  return (
    <View className="flex-1">
      {/* Team Summary Header */}
      <View className="px-6 pt-4 pb-4">
        <Text className="text-gray-900 dark:text-white text-lg font-bold mb-3">Team Overview</Text>

        {/* Summary Stats */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-gray-300 dark:border-slate-800">
            <View className="flex-row items-center mb-1">
              <Users size={14} color="#64748b" />
              <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">Team Size</Text>
            </View>
            <Text className="text-gray-900 dark:text-white text-xl font-bold">{summary.totalMembers}</Text>
            <Text className="text-gray-600 dark:text-slate-500 text-[10px] mt-0.5">
              {executivesCount} execs, {apprenticesCount} apprentices
            </Text>
          </View>

          <View className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-gray-300 dark:border-slate-800">
            <View className="flex-row items-center mb-1">
              <Target size={14} color="#64748b" />
              <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">Avg Score</Text>
            </View>
            <Text className={`${getScoreColor(averageContributionScore)} text-xl font-bold`}>
              {averageContributionScore.toFixed(0)}
            </Text>
            <Text className="text-gray-600 dark:text-slate-500 text-[10px] mt-0.5">
              {highPerformersCount} top performers
            </Text>
          </View>

          <View className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-gray-300 dark:border-slate-800">
            <View className="flex-row items-center mb-1">
              <CheckCircle2 size={14} color="#64748b" />
              <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">Tasks/Week</Text>
            </View>
            <Text className="text-blue-400 text-xl font-bold">
              {totalTasksCompletedThisWeek}
            </Text>
            <Text className="text-gray-600 dark:text-slate-500 text-[10px] mt-0.5">
              {averageTasksPerWeek.toFixed(1)} avg/person
            </Text>
          </View>
        </View>

        {/* Comparison Card */}
        <View className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-800/40">
          <View className="flex-row items-center mb-3">
            <BarChart3 size={18} color="#60a5fa" />
            <Text className="text-gray-900 dark:text-white font-semibold ml-2">Executive vs Apprentice</Text>
          </View>

          <View className="gap-3">
            {/* Contribution Score Comparison */}
            {contributionComparison && (
              <View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-700 dark:text-slate-300 text-xs">Contribution Score</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-blue-400 text-xs font-semibold">
                      Exec: {contributionComparison.executives.toFixed(0)}
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-600">|</Text>
                    <Text className="text-emerald-400 text-xs font-semibold">
                      App: {contributionComparison.apprentices.toFixed(0)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-1">
                  <View className="flex-1">
                    <ProgressBar value={contributionComparison.executives} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <ProgressBar value={contributionComparison.apprentices} color="#10b981" />
                  </View>
                </View>
              </View>
            )}

            {/* Quality Comparison */}
            {qualityComparison && (
              <View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-700 dark:text-slate-300 text-xs">Quality Score</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-blue-400 text-xs font-semibold">
                      {qualityComparison.executives.toFixed(1)}/5
                    </Text>
                    <Text className="text-gray-700 dark:text-slate-600">|</Text>
                    <Text className="text-emerald-400 text-xs font-semibold">
                      {qualityComparison.apprentices.toFixed(1)}/5
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-1">
                  <View className="flex-1">
                    <ProgressBar value={(qualityComparison.executives / 5) * 100} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <ProgressBar value={(qualityComparison.apprentices / 5) * 100} color="#10b981" />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Insights */}
          {comparisons.length > 0 && (
            <View className="mt-4 pt-4 border-t border-blue-800/40">
              <Text className="text-blue-300 text-xs font-semibold mb-2">Key Insights:</Text>
              {comparisons.slice(0, 3).map((comp: PerformanceComparison, idx: number) => (
                <View key={idx} className="flex-row items-start mb-1">
                  <Text className="text-blue-400 text-xs mr-1">•</Text>
                  <Text className="text-gray-700 dark:text-slate-300 text-xs flex-1">{comp.insight}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Top Performers & Needs Attention */}
      <View className="px-6 pb-4">
        <View className="flex-row gap-3">
          {/* Top Performers */}
          <View className="flex-1 bg-emerald-900/20 rounded-xl p-3 border border-emerald-700/40">
            <View className="flex-row items-center mb-2">
              <Award size={16} color="#10b981" />
              <Text className="text-emerald-400 font-semibold text-sm ml-2">Top Performers</Text>
            </View>
            {summary.topPerformers.slice(0, 3).map((performer: TeamMemberPerformance, idx: number) => (
              <View key={performer.userId} className="flex-row items-center justify-between mb-1.5">
                <Text className="text-gray-900 dark:text-white text-xs" numberOfLines={1}>
                  {idx + 1}. {performer.name}
                </Text>
                <Text className="text-emerald-400 text-xs font-bold ml-2">
                  {performer.contributionScore.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>

          {/* Needs Attention */}
          {summary.needsAttention.length > 0 && (
            <View className="flex-1 bg-orange-900/20 rounded-xl p-3 border border-orange-700/40">
              <View className="flex-row items-center mb-2">
                <AlertTriangle size={16} color="#f59e0b" />
                <Text className="text-orange-400 font-semibold text-sm ml-2">Needs Support</Text>
              </View>
              {summary.needsAttention.map((member: TeamMemberPerformance, idx: number) => (
                <View key={member.userId} className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-gray-900 dark:text-white text-xs" numberOfLines={1}>
                    {member.name}
                  </Text>
                  <Text className="text-orange-400 text-xs font-bold ml-2">
                    {member.contributionScore.toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Role Filter */}
      <View className="px-6 pb-3">
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setSelectedRole('all')}
            className={`flex-1 py-2 rounded-lg ${
              selectedRole === 'all' ? 'bg-blue-500' : 'bg-slate-900 border border-slate-800'
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                selectedRole === 'all' ? 'text-white' : 'text-slate-400'
              }`}
            >
              All ({performances.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedRole('FractionalExec')}
            className={`flex-1 py-2 rounded-lg ${
              selectedRole === 'FractionalExec' ? 'bg-blue-500' : 'bg-slate-900 border border-slate-800'
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                selectedRole === 'FractionalExec' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Executives ({performances.filter(p => p.role === 'FractionalExec').length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedRole('Apprentice')}
            className={`flex-1 py-2 rounded-lg ${
              selectedRole === 'Apprentice' ? 'bg-blue-500' : 'bg-slate-900 border border-slate-800'
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                selectedRole === 'Apprentice' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Apprentices ({performances.filter(p => p.role === 'Apprentice').length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Individual Performance Cards */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-900 dark:text-white font-semibold mb-3">Individual Performance</Text>

        {filteredPerformances.length === 0 ? (
          <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-6 border border-gray-300 dark:border-slate-800 items-center">
            <Users size={32} color="#475569" />
            <Text className="text-gray-600 dark:text-slate-400 text-center mt-2">
              No team members in this category
            </Text>
          </View>
        ) : (
          filteredPerformances
            .sort((a, b) => b.contributionScore - a.contributionScore)
            .map((member) => {
              const isExpanded = expandedMember === member.userId;
              const scoreColors = getScoreGradient(member.contributionScore);

              return (
                <View key={member.userId} className="mb-3">
                  <Pressable
                    onPress={() => toggleMemberExpansion(member.userId)}
                    className="active:opacity-80"
                  >
                    <View className="bg-gray-100 dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-800 overflow-hidden">
                      {/* Header with Gradient Score */}
                      <LinearGradient
                        colors={scoreColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ padding: 16 }}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                              {member.name}
                            </Text>
                            <Text className="text-gray-900 dark:text-white/80 text-xs mb-1">
                              {member.role === 'FractionalExec' ? 'Executive' : 'Apprentice'} • {member.function}
                            </Text>
                            <View className="flex-row items-center gap-2">
                              {getTrendIcon(member.trend)}
                              <Text className="text-gray-900 dark:text-white/90 text-xs font-medium">
                                {member.trend === 'improving' ? 'Improving' : member.trend === 'declining' ? 'Declining' : 'Steady'}
                              </Text>
                            </View>
                          </View>

                          <View className="items-end">
                            <View className="bg-white/20 px-3 py-1 rounded-lg mb-2">
                              <Text className="text-gray-900 dark:text-white font-bold text-xl">
                                {member.contributionScore.toFixed(0)}
                              </Text>
                            </View>
                            <View className="flex-row items-center">
                              <Text className="text-gray-900 dark:text-white/80 text-xs mr-1">Details</Text>
                              {isExpanded ? (
                                <ChevronDown size={16} color="rgba(255,255,255,0.8)" />
                              ) : (
                                <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
                              )}
                            </View>
                          </View>
                        </View>
                      </LinearGradient>

                      {/* Quick Stats Bar */}
                      <View className="bg-slate-800/50 px-4 py-2 flex-row justify-between">
                        <View className="items-center">
                          <Text className="text-gray-600 dark:text-slate-400 text-[10px] mb-0.5">Tasks</Text>
                          <Text className="text-gray-900 dark:text-white text-sm font-semibold">
                            {member.tasksCompletedThisWeek}
                          </Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-gray-600 dark:text-slate-400 text-[10px] mb-0.5">Completion</Text>
                          <Text className="text-blue-400 text-sm font-semibold">
                            {(member.taskCompletionRate * 100).toFixed(0)}%
                          </Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-gray-600 dark:text-slate-400 text-[10px] mb-0.5">Quality</Text>
                          <Text className="text-emerald-400 text-sm font-semibold">
                            {member.avgReviewScore.toFixed(1)}/5
                          </Text>
                        </View>
                        <View className="items-center">
                          <Text className="text-gray-600 dark:text-slate-400 text-[10px] mb-0.5">On-Time</Text>
                          <Text className="text-purple-400 text-sm font-semibold">
                            {(member.onTimeDeliveryRate * 100).toFixed(0)}%
                          </Text>
                        </View>
                      </View>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <View className="p-4 bg-gray-100 dark:bg-slate-900">
                          {/* Productivity Metrics */}
                          <View className="mb-4">
                            <View className="flex-row items-center mb-2">
                              <Zap size={14} color="#3b82f6" />
                              <Text className="text-blue-400 font-semibold text-sm ml-1">
                                Productivity
                              </Text>
                            </View>
                            <View className="bg-gray-200 dark:bg-slate-800 rounded-lg p-3 gap-2">
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Tasks Completed (Total):</Text>
                                <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                                  {member.tasksCompleted}
                                </Text>
                              </View>
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">This Month:</Text>
                                <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                                  {member.tasksCompletedThisMonth}
                                </Text>
                              </View>
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Avg per Week:</Text>
                                <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                                  {member.avgTasksPerWeek.toFixed(1)}
                                </Text>
                              </View>
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Velocity Trend:</Text>
                                <View className="flex-row items-center">
                                  <Text className="text-gray-900 dark:text-white text-xs font-semibold mr-1">
                                    {member.velocity.toFixed(1)} tasks/week
                                  </Text>
                                  {getTrendIcon(member.trend)}
                                </View>
                              </View>
                            </View>
                          </View>

                          {/* Quality Metrics */}
                          <View className="mb-4">
                            <View className="flex-row items-center mb-2">
                              <CheckCircle2 size={14} color="#10b981" />
                              <Text className="text-emerald-400 font-semibold text-sm ml-1">
                                Quality
                              </Text>
                            </View>
                            <View className="bg-gray-200 dark:bg-slate-800 rounded-lg p-3 gap-2">
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Review Approval Rate:</Text>
                                <Text className="text-emerald-400 text-xs font-semibold">
                                  {(member.reviewApprovalRate * 100).toFixed(0)}%
                                </Text>
                              </View>
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Tasks Requiring Rework:</Text>
                                <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                                  {member.tasksRequiringRework}
                                </Text>
                              </View>
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Avg Review Score:</Text>
                                <Text className="text-emerald-400 text-xs font-semibold">
                                  {member.avgReviewScore.toFixed(2)}/5.00
                                </Text>
                              </View>
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Priority Tasks:</Text>
                                <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                                  {member.urgentTaskCompletion} urgent, {member.highPriorityCompletion} high
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Efficiency Metrics */}
                          <View className="mb-4">
                            <View className="flex-row items-center mb-2">
                              <Clock size={14} color="#f59e0b" />
                              <Text className="text-orange-400 font-semibold text-sm ml-1">
                                Efficiency
                              </Text>
                            </View>
                            <View className="bg-gray-200 dark:bg-slate-800 rounded-lg p-3 gap-2">
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Avg Time to Complete:</Text>
                                <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                                  {member.avgTimeToComplete.toFixed(1)} hours
                                </Text>
                              </View>
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">On-Time Delivery:</Text>
                                <Text className="text-purple-400 text-xs font-semibold">
                                  {(member.onTimeDeliveryRate * 100).toFixed(0)}%
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Engagement Metrics */}
                          <View>
                            <View className="flex-row items-center mb-2">
                              <Activity size={14} color="#8b5cf6" />
                              <Text className="text-purple-400 font-semibold text-sm ml-1">
                                Engagement
                              </Text>
                            </View>
                            <View className="bg-gray-200 dark:bg-slate-800 rounded-lg p-3 gap-2">
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Days Active:</Text>
                                <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                                  {member.daysActive}
                                </Text>
                              </View>
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Consistency Score:</Text>
                                <Text className="text-blue-400 text-xs font-semibold">
                                  {member.consistencyScore.toFixed(0)}/100
                                </Text>
                              </View>
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 dark:text-slate-400 text-xs">Responsiveness:</Text>
                                <Text className="text-gray-900 dark:text-white text-xs font-semibold">
                                  {member.responsiveness.toFixed(1)} hours
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </View>
              );
            })
        )}

        {/* Bottom Padding */}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
