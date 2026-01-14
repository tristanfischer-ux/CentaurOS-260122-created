import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Target,
  Users,
  Zap,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Clock,
  BarChart3,
  Sparkles,
  X,
  Plus,
  Minus,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';

// Stores and data
import { useOKRStore } from '@/lib/state/okr-store';
import { useOKRPlannerStore } from '@/lib/state/okr-planner-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';

// OKR Planner logic
import { computeForecast } from '@/lib/okr/forecast-engine';
import { getTopRecommendations, getEfficientFrontier } from '@/lib/okr/recommendation-engine';
import { detectBottlenecks, getPrimaryBottleneck } from '@/lib/okr/bottleneck-detector';
import { PLAN_ARCHETYPES, getPresetById } from '@/lib/okr/plan-library';
import type { OKRPlan, RecommendedPlan, ForecastMetrics, PlanPreset, MemberAllocation } from '@/lib/okr/planner-types';

export default function OKRPlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ okrId: string }>();

  // Stores
  const getOKRById = useOKRStore((s) => s.getOKRById);
  const members = useOrganizationStore((s) => s.members);
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const currentWorkspace = useCurrentWorkspace();

  // Planner store
  const createPlan = useOKRPlannerStore((s) => s.createPlan);
  const updatePlan = useOKRPlannerStore((s) => s.updatePlan);
  const getActivePlan = useOKRPlannerStore((s) => s.getActivePlan);
  const setActivePlan = useOKRPlannerStore((s) => s.setActivePlan);
  const savePlanSnapshot = useOKRPlannerStore((s) => s.savePlanSnapshot);
  const undoPlanChange = useOKRPlannerStore((s) => s.undoPlanChange);

  // State
  const [costOfDelay, setCostOfDelay] = useState<string>('5000');
  const [targetWeeks, setTargetWeeks] = useState<string>('8');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [planAllocations, setPlanAllocations] = useState<MemberAllocation[]>([]);

  const okr = params.okrId ? getOKRById(params.okrId) : undefined;

  // Initialize or load plan
  useEffect(() => {
    if (!okr || !currentWorkspace) return;

    const existingPlan = getActivePlan();
    if (existingPlan && existingPlan.okrId === okr.id) {
      // Load existing plan
      setPlanAllocations(existingPlan.allocations.members);
      setCostOfDelay(existingPlan.costOfDelayPerWeekGBP.toString());
      setTargetWeeks(existingPlan.targetWeeks.toString());
    } else {
      // Create new plan with empty allocations
      const planId = createPlan({
        workspaceId: currentWorkspace.id,
        okrId: okr.id,
        targetWeeks: 8,
        costOfDelayPerWeekGBP: 5000,
        allocations: { members: [] },
        toolAttachments: [],
      });
      setActivePlan(planId);
    }
  }, [okr?.id, currentWorkspace?.id]);

  // Filter members by function
  const relevantMembers = useMemo(() => {
    if (!okr) return [];
    return members.filter((m) => m.function === okr.function || m.role === 'Founder');
  }, [members, okr?.function]);

  // Build current plan for forecast
  const currentPlan = useMemo<OKRPlan | null>(() => {
    const activePlan = getActivePlan();
    if (!activePlan || !okr || !currentWorkspace) return null;

    return {
      ...activePlan,
      allocations: { members: planAllocations },
      costOfDelayPerWeekGBP: parseFloat(costOfDelay) || 5000,
      targetWeeks: parseFloat(targetWeeks) || 8,
    };
  }, [planAllocations, costOfDelay, targetWeeks, okr, currentWorkspace]);

  // Compute forecast
  const forecast = useMemo<ForecastMetrics | null>(() => {
    if (!currentPlan || !okr) return null;

    try {
      return computeForecast({
        okr,
        plan: currentPlan,
        workPlans: workPlans.filter((wp) => wp.linkedOKRTitle === okr.title),
        members,
        aiAgents: [],
      });
    } catch (error) {
      console.error('Forecast error:', error);
      return null;
    }
  }, [currentPlan, okr, workPlans, members]);

  // Get recommendations
  const recommendations = useMemo<RecommendedPlan[]>(() => {
    if (!okr) return [];

    try {
      return getTopRecommendations({
        okr,
        workPlans: workPlans.filter((wp) => wp.linkedOKRTitle === okr.title),
        members,
        aiAgents: [],
        costOfDelayPerWeekGBP: parseFloat(costOfDelay) || 5000,
        targetWeeks: parseFloat(targetWeeks) || 8,
      });
    } catch (error) {
      console.error('Recommendations error:', error);
      return [];
    }
  }, [okr, workPlans, members, costOfDelay, targetWeeks]);

  // Detect bottlenecks
  const bottlenecks = useMemo(() => {
    if (!currentPlan || !forecast || !okr) return [];

    try {
      return detectBottlenecks({
        plan: currentPlan,
        forecast,
        members: members.filter((m) =>
          planAllocations.some((a) => a.memberId === m.id)
        ),
        okrFunction: okr.function,
      });
    } catch (error) {
      console.error('Bottleneck detection error:', error);
      return [];
    }
  }, [currentPlan, forecast, okr, planAllocations, members]);

  // Handle allocation change
  const handleAllocationChange = (memberId: string, allocationPct: number) => {
    const activePlan = getActivePlan();
    if (activePlan) {
      savePlanSnapshot(activePlan.id);
    }

    setPlanAllocations((prev) => {
      const existing = prev.find((a) => a.memberId === memberId);
      if (existing) {
        if (allocationPct === 0) {
          // Remove member
          return prev.filter((a) => a.memberId !== memberId);
        } else {
          // Update allocation
          return prev.map((a) =>
            a.memberId === memberId ? { ...a, allocationPct } : a
          );
        }
      } else {
        // Add member
        return [...prev, { memberId, allocationPct }];
      }
    });
  };

  // Apply preset
  const handleApplyPreset = (preset: PlanPreset) => {
    const activePlan = getActivePlan();
    if (activePlan) {
      savePlanSnapshot(activePlan.id);
    }

    // Select members based on preset
    const { defaultAllocations } = preset;
    const apprentices = relevantMembers
      .filter((m) => m.role === 'Apprentice')
      .slice(0, defaultAllocations.apprenticeCount);
    const execs = relevantMembers
      .filter((m) => m.role === 'FractionalExec')
      .slice(0, defaultAllocations.execCount);
    const founder = defaultAllocations.founderInvolved
      ? relevantMembers.filter((m) => m.role === 'Founder').slice(0, 1)
      : [];

    const newAllocations: MemberAllocation[] = [...founder, ...execs, ...apprentices].map(
      (m) => ({
        memberId: m.id,
        allocationPct: defaultAllocations.allocationPct,
      })
    );

    setPlanAllocations(newAllocations);
    setSelectedPresetId(preset.id);
    setShowRecommendations(false);

    if (activePlan) {
      updatePlan(activePlan.id, {
        allocations: { members: newAllocations },
        lastAppliedPresetId: preset.id,
      });
    }
  };

  // Save plan
  const handleSavePlan = () => {
    const activePlan = getActivePlan();
    if (!activePlan) return;

    updatePlan(activePlan.id, {
      allocations: { members: planAllocations },
      costOfDelayPerWeekGBP: parseFloat(costOfDelay) || 5000,
      targetWeeks: parseFloat(targetWeeks) || 8,
    });

    Alert.alert('Success', 'Plan saved successfully!');
  };

  if (!okr) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center">
        <Text className="text-white text-lg">OKR not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-950">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Plan OKR',
          headerStyle: { backgroundColor: '#030712' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* OKR Header */}
        <View className="px-5 pt-6 pb-4 border-b border-gray-800">
          <View className="flex-row items-center gap-2 mb-2">
            <Target size={20} color="#3b82f6" />
            <Text className="text-gray-400 text-sm font-medium">
              {okr.function}
            </Text>
          </View>
          <Text className="text-white text-xl font-semibold mb-2">
            {okr.title}
          </Text>
          <Text className="text-gray-400 text-sm">{okr.description}</Text>
        </View>

        {/* Planning Inputs */}
        <View className="px-5 pt-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Planning Parameters
          </Text>

          <View className="gap-4">
            {/* Cost of Delay */}
            <View>
              <Text className="text-gray-400 text-sm mb-2">
                Cost of Delay (£/week)
              </Text>
              <TextInput
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white"
                value={costOfDelay}
                onChangeText={setCostOfDelay}
                keyboardType="numeric"
                placeholder="5000"
                placeholderTextColor="#6b7280"
              />
              <Text className="text-gray-500 text-xs mt-1">
                How much revenue/value is lost per week of delay
              </Text>
            </View>

            {/* Target Weeks */}
            <View>
              <Text className="text-gray-400 text-sm mb-2">
                Target Timeline (weeks)
              </Text>
              <TextInput
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white"
                value={targetWeeks}
                onChangeText={setTargetWeeks}
                keyboardType="numeric"
                placeholder="8"
                placeholderTextColor="#6b7280"
              />
              <Text className="text-gray-500 text-xs mt-1">
                Ideal delivery timeframe
              </Text>
            </View>
          </View>
        </View>

        {/* Recommended Plans */}
        <View className="px-5 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Sparkles size={20} color="#f59e0b" />
              <Text className="text-white text-lg font-semibold">
                Recommended Plans
              </Text>
            </View>
            <Text className="text-gray-400 text-sm">
              Top {recommendations.length}
            </Text>
          </View>

          {recommendations.length === 0 ? (
            <View className="bg-gray-900 border border-gray-800 rounded-xl p-6 items-center">
              <Sparkles size={32} color="#6b7280" />
              <Text className="text-gray-400 text-center mt-3">
                No recommendations available. Adjust your planning parameters or ensure team members are available.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
              {recommendations.map((rec, idx) => (
                <Pressable
                  key={rec.preset.id}
                  onPress={() => handleApplyPreset(rec.preset)}
                  className={`bg-gray-900 border ${
                    selectedPresetId === rec.preset.id
                      ? 'border-blue-500'
                      : 'border-gray-800'
                  } rounded-xl p-4 w-72`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white text-base font-semibold">
                      {rec.preset.name}
                    </Text>
                    <View className="bg-blue-500/20 px-2 py-1 rounded-lg">
                      <Text className="text-blue-400 text-xs font-medium">
                        {rec.score.toFixed(0)}% match
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-400 text-sm mb-3">
                    {rec.preset.description}
                  </Text>

                  <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-500 text-xs">ETA:</Text>
                      <Text className="text-white text-sm font-medium">
                        {rec.forecast.etaWeeksP50.toFixed(1)} weeks
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-500 text-xs">Weekly Cost:</Text>
                      <Text className="text-white text-sm font-medium">
                        £{(rec.forecast.burnPerWeekGBP / 1000).toFixed(1)}K
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-500 text-xs">Overhead:</Text>
                      <Text className="text-white text-sm font-medium">
                        {(rec.forecast.overheadPct * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-400 text-xs mt-3 leading-5">
                    {rec.reasoning}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Resource Deployment */}
        <View className="px-5 pt-6">
          <View className="flex-row items-center gap-2 mb-4">
            <Users size={20} color="#8b5cf6" />
            <Text className="text-white text-lg font-semibold">
              Resource Deployment
            </Text>
          </View>

          {relevantMembers.length === 0 ? (
            <View className="bg-gray-900 border border-gray-800 rounded-xl p-6 items-center">
              <Users size={32} color="#6b7280" />
              <Text className="text-gray-400 text-center mt-3">
                No team members available for {okr.function} function.
              </Text>
              <Text className="text-gray-500 text-center text-xs mt-2">
                Add team members in the Team Management screen.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {relevantMembers.map((member) => {
                const allocation = planAllocations.find(
                  (a) => a.memberId === member.id
                );
                const allocationPct = allocation?.allocationPct || 0;

                return (
                  <View
                    key={member.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-white text-base font-medium">
                          {member.name}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {member.role} • {member.function}
                        </Text>
                      </View>
                      {allocationPct > 0 && (
                        <View className="bg-blue-500/20 px-3 py-1 rounded-lg">
                          <Text className="text-blue-400 text-sm font-medium">
                            {allocationPct}%
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() =>
                          handleAllocationChange(
                            member.id,
                            Math.max(0, allocationPct - 25)
                          )
                        }
                        className="bg-gray-800 w-10 h-10 rounded-lg items-center justify-center"
                      >
                        <Minus size={16} color="#fff" />
                      </Pressable>

                      <View className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-blue-500"
                          style={{ width: `${allocationPct}%` }}
                        />
                      </View>

                      <Pressable
                        onPress={() =>
                          handleAllocationChange(
                            member.id,
                            Math.min(100, allocationPct + 25)
                          )
                        }
                        className="bg-gray-800 w-10 h-10 rounded-lg items-center justify-center"
                      >
                        <Plus size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottlenecks */}
        {bottlenecks.length > 0 && (
          <View className="px-5 pt-6">
            <View className="flex-row items-center gap-2 mb-4">
              <AlertTriangle size={20} color="#f59e0b" />
              <Text className="text-white text-lg font-semibold">
                Bottlenecks Detected
              </Text>
            </View>

            <View className="gap-3">
              {bottlenecks.map((bottleneck) => (
                <View
                  key={bottleneck.id}
                  className={`border rounded-xl p-4 ${
                    bottleneck.severity === 'high'
                      ? 'bg-red-950/30 border-red-500/50'
                      : bottleneck.severity === 'medium'
                      ? 'bg-amber-950/30 border-amber-500/50'
                      : 'bg-gray-900 border-gray-800'
                  }`}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <Text className="text-white text-base font-semibold flex-1">
                      {bottleneck.title}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded-lg ${
                        bottleneck.severity === 'high'
                          ? 'bg-red-500/20'
                          : bottleneck.severity === 'medium'
                          ? 'bg-amber-500/20'
                          : 'bg-gray-700'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          bottleneck.severity === 'high'
                            ? 'text-red-400'
                            : bottleneck.severity === 'medium'
                            ? 'text-amber-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {bottleneck.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-400 text-sm mb-3">
                    {bottleneck.description}
                  </Text>

                  {bottleneck.recommendations.length > 0 && (
                    <View className="gap-2">
                      <Text className="text-gray-300 text-xs font-medium">
                        Recommendations:
                      </Text>
                      {bottleneck.recommendations.slice(0, 2).map((rec, idx) => (
                        <View key={idx} className="flex-row gap-2">
                          <Text className="text-blue-400">•</Text>
                          <Text className="text-gray-400 text-xs flex-1">
                            {rec.action}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>

      {/* Sticky Forecast Panel */}
      {forecast && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-5 py-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-base font-semibold">
              Forecast
            </Text>
            <View
              className={`px-2 py-1 rounded-lg ${
                forecast.confidence === 'high'
                  ? 'bg-emerald-500/20'
                  : forecast.confidence === 'medium'
                  ? 'bg-amber-500/20'
                  : 'bg-red-500/20'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  forecast.confidence === 'high'
                    ? 'text-emerald-400'
                    : forecast.confidence === 'medium'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {forecast.confidence} confidence
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Clock size={16} color="#6b7280" />
                <Text className="text-gray-400 text-xs">Delivery Time</Text>
              </View>
              <Text className="text-white text-lg font-bold">
                {forecast.etaWeeksP50.toFixed(1)} weeks
              </Text>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <DollarSign size={16} color="#6b7280" />
                <Text className="text-gray-400 text-xs">Total Cost</Text>
              </View>
              <Text className="text-white text-lg font-bold">
                £{(forecast.totalCostP50 / 1000).toFixed(1)}K
              </Text>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <TrendingUp size={16} color="#6b7280" />
                <Text className="text-gray-400 text-xs">Overhead</Text>
              </View>
              <Text className="text-white text-lg font-bold">
                {(forecast.overheadPct * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleSavePlan}
            className="bg-blue-500 rounded-xl py-3 items-center"
          >
            <Text className="text-white text-base font-semibold">
              Save Plan
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
