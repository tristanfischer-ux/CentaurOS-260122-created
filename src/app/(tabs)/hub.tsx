/**
 * Intelligence Hub - Smart business recommendations
 * Context-aware insights surfacing bottlenecks, capacity issues, and opportunities
 */

import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  Target,
  DollarSign,
  Clock,
  Sparkles,
  ChevronRight,
  Activity,
  CheckCircle2,
  Package,
  Briefcase,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Stores
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOKRStore } from '@/lib/state/okr-store';
import { useFinanceStore } from '@/lib/state/finance-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useBusinessImprovementsStore } from '@/lib/state/business-improvements-store';

interface SmartRecommendation {
  id: string;
  type: 'critical' | 'important' | 'opportunity';
  category: 'capacity' | 'okr' | 'finance' | 'team' | 'process';
  title: string;
  description: string;
  impact: string;
  action: {
    label: string;
    route: string;
  };
  metrics?: {
    label: string;
    value: string;
    isNegative?: boolean;
  }[];
}

export default function IntelligenceHub() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const [refreshing, setRefreshing] = useState(false);

  // Data sources
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const okrs = useOKRStore(s => s.okrs);
  const getCashBalance = useFinanceStore(s => s.getCashBalance);
  const getWeeklyBurn = useFinanceStore(s => s.getWeeklyBurn);
  const allImprovements = useBusinessImprovementsStore(s => s.improvements);

  // Memoize filtered improvements to prevent infinite re-renders
  const improvements = useMemo(() => {
    return allImprovements.filter(imp => !imp.convertedToTask);
  }, [allImprovements]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Calculate smart recommendations
  const recommendations = useMemo((): SmartRecommendation[] => {
    const recs: SmartRecommendation[] = [];
    const activeMembers = members.filter(m => m.status === 'active');

    // Calculate resource capacity
    const totalCapacity = activeMembers.reduce((sum, member) => {
      if (member.role === 'Founder' || member.role === 'Apprentice') {
        return sum + 15; // 10 normal + 5 overtime
      }
      const daysPerWeek = member.daysPerWeek || 2;
      const normalSquares = daysPerWeek * 2;
      const overtimeSquares = Math.min((5 - daysPerWeek) * 2, 10);
      return sum + normalSquares + overtimeSquares;
    }, 0);

    const allocated = workPlans
      .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
      .reduce((sum, wp) => {
        return sum + (wp.allocations?.reduce((s, a) => s + a.squaresPerWeek, 0) || 0);
      }, 0);

    const available = totalCapacity - allocated;
    const utilizationPercent = totalCapacity > 0 ? (allocated / totalCapacity) * 100 : 0;

    // CRITICAL: No capacity
    if (available <= 0 && totalCapacity > 0) {
      recs.push({
        id: 'no-capacity',
        type: 'critical',
        category: 'capacity',
        title: 'Team at 100% Capacity',
        description: 'Your team is fully allocated. You cannot start new work without hiring or pausing tasks.',
        impact: 'Blocks all new initiatives',
        action: {
          label: 'Hire Team Member',
          route: '/community',
        },
        metrics: [
          { label: 'Allocated', value: `${allocated} TU`, isNegative: true },
          { label: 'Total', value: `${totalCapacity} TU` },
        ],
      });
    }

    // IMPORTANT: Low capacity
    if (available > 0 && available < 10 && totalCapacity > 0) {
      recs.push({
        id: 'low-capacity',
        type: 'important',
        category: 'capacity',
        title: 'Low Team Capacity',
        description: `Only ${available} TU available this week. Consider hiring or reallocating resources before capacity runs out.`,
        impact: 'May block upcoming work',
        action: {
          label: 'View Team',
          route: '/(tabs)/',
        },
        metrics: [
          { label: 'Available', value: `${available} TU`, isNegative: true },
          { label: 'Utilization', value: `${Math.round(utilizationPercent)}%` },
        ],
      });
    }

    // OKR at risk
    const atRiskOKRs = okrs.filter(okr => {
      // Calculate average progress across objectives
      const avgProgress = okr.objectives.length > 0
        ? okr.objectives.reduce((sum, obj) => sum + obj.progress, 0) / okr.objectives.length
        : 0;

      return okr.status === 'at-risk' ||
        okr.status === 'off-track' ||
        (avgProgress < 30 && okr.status === 'on-track');
    });

    if (atRiskOKRs.length > 0) {
      recs.push({
        id: 'okr-risk',
        type: atRiskOKRs.some(o => o.status === 'at-risk') ? 'critical' : 'important',
        category: 'okr',
        title: `${atRiskOKRs.length} OKR${atRiskOKRs.length > 1 ? 's' : ''} At Risk`,
        description: `${atRiskOKRs.map(o => o.title).join(', ')} ${atRiskOKRs.length > 1 ? 'are' : 'is'} behind schedule or blocked.`,
        impact: 'Strategic goals may not be met',
        action: {
          label: 'Review OKRs',
          route: '/okrs',
        },
        metrics: [
          { label: 'At Risk', value: atRiskOKRs.length.toString(), isNegative: true },
          { label: 'Total OKRs', value: okrs.length.toString() },
        ],
      });
    }

    // Blocked tasks
    const blockedTasks = workPlans.filter(wp => wp.status === 'blocked' || wp.status === 'abandoned');
    if (blockedTasks.length > 0) {
      recs.push({
        id: 'blocked-tasks',
        type: 'important',
        category: 'process',
        title: `${blockedTasks.length} Task${blockedTasks.length > 1 ? 's' : ''} Blocked`,
        description: 'These tasks are stuck and need attention to unblock progress.',
        impact: 'Delays delivery and wastes allocated capacity',
        action: {
          label: 'View Blocked',
          route: '/(tabs)/do',
        },
        metrics: [
          { label: 'Blocked', value: blockedTasks.length.toString(), isNegative: true },
        ],
      });
    }

    // Financial health
    if (currentWorkspace) {
      const cash = getCashBalance(currentWorkspace.id);
      const weeklyBurn = getWeeklyBurn(currentWorkspace.id);
      const runway = weeklyBurn > 0 ? cash / weeklyBurn / 4.33 : 999;

      if (runway < 6) {
        recs.push({
          id: 'runway-critical',
          type: 'critical',
          category: 'finance',
          title: 'Runway Critical',
          description: `Only ${runway.toFixed(1)} months of runway remaining. Immediate action required to extend cash runway.`,
          impact: 'Business survival at risk',
          action: {
            label: 'View Financials',
            route: '/finance-dashboard',
          },
          metrics: [
            { label: 'Runway', value: `${runway.toFixed(1)}mo`, isNegative: true },
            { label: 'Burn', value: `£${Math.round(weeklyBurn * 4.33)}/mo` },
          ],
        });
      } else if (runway < 12) {
        recs.push({
          id: 'runway-low',
          type: 'important',
          category: 'finance',
          title: 'Runway Below Target',
          description: `${runway.toFixed(1)} months of runway. Industry best practice is 12+ months for fundraising.`,
          impact: 'Limits strategic options',
          action: {
            label: 'View Financials',
            route: '/finance-dashboard',
          },
          metrics: [
            { label: 'Runway', value: `${runway.toFixed(1)}mo` },
            { label: 'Target', value: '12mo' },
          ],
        });
      }
    }

    // Team composition opportunities
    const founders = activeMembers.filter(m => m.role === 'Founder').length;
    const execs = activeMembers.filter(m => m.role === 'FractionalExec').length;
    const apprentices = activeMembers.filter(m => m.role === 'Apprentice').length;

    if (apprentices === 0 && execs > 0) {
      recs.push({
        id: 'hire-apprentices',
        type: 'opportunity',
        category: 'team',
        title: 'Consider Hiring Apprentices',
        description: 'You have executives but no apprentices. Apprentices with AI tools can be 2-3x more cost-effective than executives for execution work.',
        impact: 'Potential 40-60% cost savings',
        action: {
          label: 'Browse Apprentices',
          route: '/community',
        },
        metrics: [
          { label: 'Execs', value: execs.toString() },
          { label: 'Apprentices', value: '0', isNegative: true },
        ],
      });
    }

    if (execs === 0 && apprentices > 2) {
      recs.push({
        id: 'hire-executive',
        type: 'important',
        category: 'team',
        title: 'Need Executive Leadership',
        description: `You have ${apprentices} apprentices but no executives to guide them. Executive oversight is critical for quality and direction.`,
        impact: 'Risk of low-quality output',
        action: {
          label: 'Browse Executives',
          route: '/community',
        },
        metrics: [
          { label: 'Apprentices', value: apprentices.toString() },
          { label: 'Execs', value: '0', isNegative: true },
        ],
      });
    }

    // High utilization on specific people
    activeMembers.forEach(member => {
      const memberAllocated = workPlans
        .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
        .reduce((sum, wp) => {
          const allocation = wp.allocations?.find(a => a.memberId === member.id);
          return sum + (allocation?.squaresPerWeek || 0);
        }, 0);

      const maxCapacity = member.role === 'Founder' || member.role === 'Apprentice' ? 15 :
        (() => {
          const daysPerWeek = member.daysPerWeek || 2;
          return daysPerWeek * 2 + Math.min((5 - daysPerWeek) * 2, 10);
        })();

      const util = maxCapacity > 0 ? (memberAllocated / maxCapacity) * 100 : 0;

      if (util >= 100) {
        recs.push({
          id: `overload-${member.id}`,
          type: 'important',
          category: 'capacity',
          title: `${member.name} at 100% Capacity`,
          description: `${member.name} (${member.function}) is fully allocated. Consider redistributing work or hiring support.`,
          impact: 'Bottleneck for their function',
          action: {
            label: 'View Allocations',
            route: '/(tabs)/decide',
          },
          metrics: [
            { label: 'Allocated', value: `${memberAllocated}/${maxCapacity} TU`, isNegative: true },
          ],
        });
      }
    });

    // Consulting insights available
    if (improvements.length > 0) {
      const criticalImprovements = improvements.filter(i => i.priority === 1);
      if (criticalImprovements.length > 0) {
        recs.push({
          id: 'consulting-insights',
          type: 'important',
          category: 'process',
          title: `${criticalImprovements.length} Strategic Recommendation${criticalImprovements.length > 1 ? 's' : ''}`,
          description: 'Elite consulting insights from McKinsey, BCG, and Bain are available on your Home tab.',
          impact: 'Strategic improvements identified',
          action: {
            label: 'View Insights',
            route: '/(tabs)/',
          },
        });
      }
    }

    // Sort by priority
    return recs.sort((a, b) => {
      const priorityOrder = { critical: 0, important: 1, opportunity: 2 };
      return priorityOrder[a.type] - priorityOrder[b.type];
    });
  }, [members, workPlans, okrs, currentWorkspace, getCashBalance, getWeeklyBurn, improvements]);

  const criticalCount = recommendations.filter(r => r.type === 'critical').length;
  const importantCount = recommendations.filter(r => r.type === 'important').length;
  const opportunityCount = recommendations.filter(r => r.type === 'opportunity').length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'capacity': return Users;
      case 'okr': return Target;
      case 'finance': return DollarSign;
      case 'team': return Briefcase;
      case 'process': return Activity;
      default: return Sparkles;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'capacity': return '#3b82f6';
      case 'okr': return '#8b5cf6';
      case 'finance': return '#10b981';
      case 'team': return '#f59e0b';
      case 'process': return '#ec4899';
      default: return '#64748b';
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingBottom: 20 }}
      >
        <View className="px-5 pt-4">
          <Text className="text-white text-2xl font-black">Intelligence Hub</Text>
          <Text className="text-white/80 text-sm mt-1">
            Smart recommendations based on your business data
          </Text>

          {/* Stats */}
          <View className="flex-row gap-2 mt-4">
            {criticalCount > 0 && (
              <View className="bg-red-500/30 border border-red-400/50 px-3 py-1.5 rounded-lg">
                <Text className="text-white text-xs font-bold">
                  {criticalCount} Critical
                </Text>
              </View>
            )}
            {importantCount > 0 && (
              <View className="bg-amber-500/30 border border-amber-400/50 px-3 py-1.5 rounded-lg">
                <Text className="text-white text-xs font-bold">
                  {importantCount} Important
                </Text>
              </View>
            )}
            {opportunityCount > 0 && (
              <View className="bg-emerald-500/30 border border-emerald-400/50 px-3 py-1.5 rounded-lg">
                <Text className="text-white text-xs font-bold">
                  {opportunityCount} Opportunities
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {recommendations.length === 0 ? (
          <View className="px-5 py-12 items-center">
            <View className="bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-full items-center justify-center mb-4">
              <CheckCircle2 size={32} color="#10b981" />
            </View>
            <Text className="text-gray-900 dark:text-white text-lg font-bold mb-2 text-center">
              All Systems Go!
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm text-center">
              No critical issues detected. Your business is running smoothly.
            </Text>
          </View>
        ) : (
          <View className="px-5 py-4">
            {recommendations.map((rec, index) => {
              const Icon = getCategoryIcon(rec.category);
              const categoryColor = getCategoryColor(rec.category);
              const bgColor =
                rec.type === 'critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                rec.type === 'important' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' :
                'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800';

              return (
                <Pressable
                  key={rec.id}
                  onPress={() => router.push(rec.action.route as any)}
                  className={`${bgColor} border rounded-xl p-4 mb-3 active:opacity-70`}
                >
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-start flex-1">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: categoryColor }}
                      >
                        <Icon size={20} color="#fff" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                          {rec.title}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">
                          {rec.description}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#64748b" />
                  </View>

                  {/* Metrics */}
                  {rec.metrics && rec.metrics.length > 0 && (
                    <View className="flex-row gap-3 mt-2 mb-2">
                      {rec.metrics.map((metric, idx) => (
                        <View key={idx} className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">
                            {metric.label}
                          </Text>
                          <Text className={`text-sm font-bold ${
                            metric.isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            {metric.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Impact */}
                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                    <View className="flex-1">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs mb-0.5">
                        Impact
                      </Text>
                      <Text className="text-gray-700 dark:text-slate-300 text-xs font-medium">
                        {rec.impact}
                      </Text>
                    </View>
                    <View className="bg-gray-900 dark:bg-white px-3 py-1.5 rounded-lg">
                      <Text className="text-white dark:text-gray-900 text-xs font-bold">
                        {rec.action.label}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-5 pt-2">
          <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">
            Quick Actions
          </Text>
          <View className="gap-3">
            <Pressable
              onPress={() => router.push('/community')}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <Users size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white font-semibold ml-3">
                  Browse Marketplace
                </Text>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/reports')}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <Activity size={20} color="#3b82f6" />
                <Text className="text-gray-900 dark:text-white font-semibold ml-3">
                  Generate Report
                </Text>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/armory')}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <Zap size={20} color="#f59e0b" />
                <Text className="text-gray-900 dark:text-white font-semibold ml-3">
                  Equip AI Tools
                </Text>
              </View>
              <ChevronRight size={20} color="#64748b" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
