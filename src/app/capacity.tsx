import { View, Text, ScrollView, Pressable } from 'react-native';
import { useMemo } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  AlertTriangle,
  Target,
  Activity,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Stores
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useOKRPlannerStore } from '@/lib/state/okr-planner-store';
import { useOKRStore } from '@/lib/state/okr-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';

// Capacity engine
import {
  calculateTeamCapacity,
  calculateCapacityByFunction,
  getCapacitySummary,
  type PersonCapacity,
  type TeamCapacity,
  type CapacityByFunction,
} from '@/lib/okr/capacity-engine';

const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

export default function CapacityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();
  const workspaceId = currentWorkspace?.id ?? DEFAULT_WORKSPACE_ID;

  // Stores
  const members = useOrganizationStore((s) => s.members);
  const plans = useOKRPlannerStore((s) => s.plans);
  const okrs = useOKRStore((s) => s.okrs);

  // Build OKR title map
  const okrTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const okr of okrs) {
      map.set(okr.id, okr.title);
    }
    return map;
  }, [okrs]);

  // Calculate capacity
  const teamCapacity = useMemo<TeamCapacity>(() => {
    const workspaceMembers = members.filter((m) => m.workspaceId === workspaceId);
    const workspacePlans = plans.filter((p) => p.workspaceId === workspaceId);

    return calculateTeamCapacity({
      members: workspaceMembers,
      plans: workspacePlans,
      okrTitles,
    });
  }, [members, plans, workspaceId, okrTitles]);

  // Capacity by function
  const capacityByFunction = useMemo<CapacityByFunction[]>(() => {
    return calculateCapacityByFunction(teamCapacity);
  }, [teamCapacity]);

  // Summary
  const summary = useMemo(() => {
    return getCapacitySummary(teamCapacity);
  }, [teamCapacity]);

  const getUtilizationColor = (pct: number) => {
    if (pct > 100) return '#ef4444'; // Red - overloaded
    if (pct > 85) return '#f59e0b'; // Amber - high
    if (pct > 50) return '#22c55e'; // Green - healthy
    return '#64748b'; // Gray - underutilized
  };

  const getBurnoutRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder':
        return '#3b82f6';
      case 'FractionalExec':
        return '#8b5cf6';
      case 'Apprentice':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">RESOURCE UTILIZATION</Text>
            <Text className="text-white text-xl font-bold">Capacity</Text>
          </View>
          <View
            className={`px-3 py-1.5 rounded-lg ${
              summary.healthStatus === 'critical'
                ? 'bg-red-500/30'
                : summary.healthStatus === 'warning'
                ? 'bg-amber-500/30'
                : 'bg-white/20'
            }`}
          >
            <Text className="text-white font-semibold text-sm capitalize">
              {summary.healthStatus}
            </Text>
          </View>
        </View>

        {/* Summary Bar */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          <View className="items-center">
            <Text className="text-white/70 text-xs">Utilization</Text>
            <Text className="text-white font-bold text-lg">{summary.totalUtilization}</Text>
          </View>
          <View className="items-center">
            <Text className="text-white/70 text-xs">Team Size</Text>
            <Text className="text-white font-bold text-lg">{teamCapacity.members.length}</Text>
          </View>
          <View className="items-center">
            <Text className="text-white/70 text-xs">Overloaded</Text>
            <Text className={`font-bold text-lg ${teamCapacity.overloadedCount > 0 ? 'text-red-400' : 'text-white'}`}>
              {teamCapacity.overloadedCount}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-white/70 text-xs">Weekly Cost</Text>
            <Text className="text-white font-bold text-lg">
              £{(teamCapacity.totalCostPerWeekGBP / 1000).toFixed(1)}K
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Overload Warning */}
        {teamCapacity.overloadedCount > 0 && (
          <View className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <AlertTriangle size={18} color="#ef4444" />
              <Text className="text-red-400 font-bold">Capacity Overload</Text>
            </View>
            <Text className="text-red-200 text-sm">
              {summary.overloadedNames.join(', ')} {teamCapacity.overloadedCount > 1 ? 'are' : 'is'} over 100% allocated.
              This increases coordination overhead across all projects.
            </Text>
          </View>
        )}

        {/* Capacity by Function */}
        <View className="mb-6">
          <Text className="text-white font-bold text-lg mb-3">By Function</Text>
          <View className="gap-3">
            {capacityByFunction.map((func) => (
              <View key={func.function} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-lg bg-slate-800 items-center justify-center">
                      <Target size={16} color="#64748b" />
                    </View>
                    <View>
                      <Text className="text-white font-semibold">{func.function}</Text>
                      <Text className="text-slate-400 text-xs">{func.memberCount} members</Text>
                    </View>
                  </View>
                  <Text
                    className="font-bold text-lg"
                    style={{ color: getUtilizationColor(func.utilizationPct) }}
                  >
                    {func.utilizationPct}%
                  </Text>
                </View>

                {/* Utilization Bar */}
                <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(func.utilizationPct, 100)}%`,
                      backgroundColor: getUtilizationColor(func.utilizationPct),
                    }}
                  />
                </View>

                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-slate-500 text-xs">
                    {func.allocatedHours.toFixed(0)}h / {func.totalHours.toFixed(0)}h capacity
                  </Text>
                  {func.utilizationPct > 100 && (
                    <Text className="text-red-400 text-xs font-semibold">
                      +{(func.utilizationPct - 100).toFixed(0)}% overload
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Individual Members */}
        <View>
          <Text className="text-white font-bold text-lg mb-3">Team Members</Text>
          <View className="gap-3">
            {teamCapacity.members.map((member) => (
              <Pressable
                key={member.memberId}
                className={`bg-slate-900 border rounded-xl p-4 active:opacity-70 ${
                  member.isOverloaded ? 'border-red-500/50' : 'border-slate-800'
                }`}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: getRoleColor(member.role) + '30' }}
                    >
                      <Text className="text-lg">
                        {member.role === 'Founder' ? '👤' : member.role === 'FractionalExec' ? '👔' : '🎓'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{member.name}</Text>
                      <Text className="text-slate-400 text-sm">
                        {member.role === 'FractionalExec' ? 'Executive' : member.role} • {member.function}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text
                      className="font-bold text-lg"
                      style={{ color: getUtilizationColor(member.utilizationPct) }}
                    >
                      {member.utilizationPct}%
                    </Text>
                    <View className={`px-2 py-0.5 rounded border ${getBurnoutRiskColor(member.burnoutRisk)}`}>
                      <Text className="text-xs font-medium capitalize">
                        {member.burnoutRisk === 'low' ? 'healthy' : member.burnoutRisk}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Utilization Bar */}
                <View className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(member.utilizationPct, 100)}%`,
                      backgroundColor: getUtilizationColor(member.utilizationPct),
                    }}
                  />
                </View>

                {/* Allocations */}
                {member.allocations.length > 0 ? (
                  <View className="gap-2">
                    <Text className="text-slate-500 text-xs font-medium">ALLOCATIONS</Text>
                    {member.allocations.map((alloc) => (
                      <View
                        key={alloc.okrId}
                        className="flex-row items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2"
                      >
                        <Text className="text-slate-300 text-sm flex-1" numberOfLines={1}>
                          {alloc.okrTitle}
                        </Text>
                        <Text className="text-slate-400 text-sm font-medium ml-2">
                          {alloc.allocationPct}%
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="bg-slate-800/30 rounded-lg px-3 py-2">
                    <Text className="text-slate-500 text-sm text-center">
                      No active allocations
                    </Text>
                  </View>
                )}

                {/* Cost */}
                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-800">
                  <Text className="text-slate-500 text-xs">
                    {member.baseHoursPerWeek}h/week base capacity
                  </Text>
                  <Text className="text-slate-400 text-sm font-medium">
                    £{member.costPerWeekGBP.toFixed(0)}/week
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Underutilized Notice */}
        {teamCapacity.underutilizedCount > 0 && (
          <View className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mt-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Activity size={18} color="#3b82f6" />
              <Text className="text-blue-400 font-semibold">Underutilized Capacity</Text>
            </View>
            <Text className="text-blue-200 text-sm">
              {summary.underutilizedNames.join(', ')} {teamCapacity.underutilizedCount > 1 ? 'have' : 'has'} less than 50% allocation.
              Consider assigning more work or reducing team costs.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
