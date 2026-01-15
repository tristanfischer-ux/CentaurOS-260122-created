/**
 * UnifiedTaskAllocationModal
 *
 * THE single source of truth for TU allocation across the entire app.
 *
 * Flow:
 * 1. Click on a task → see explanation and default TU estimate
 * 2. Adjust total TUs up/down
 * 3. Tap on people to add their TUs (squares become allocated)
 * 4. Select AI tools for productivity boost
 * 5. See cost breakdown, timeline, and team efficiency
 * 6. Complete or Abandon task
 *
 * Key Features:
 * - Per-person TU allocation with visual squares
 * - AI productivity multipliers (2x, 5x, 10x, 20x)
 * - Team size efficiency (Brooks' Law)
 * - Skill-based recommendations
 * - Cost tracking and audit trail
 * - Unallocated TU warnings
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import {
  X, Clock, Users, DollarSign, Zap, AlertTriangle, CheckCircle2,
  Plus, Minus, Bot, Briefcase, GraduationCap, Crown, ChevronRight,
  TrendingUp, AlertCircle, Archive, Target
} from 'lucide-react-native';
import { useWorkPlanStore, type WorkPlan, type TUAllocation, type AppliedAITool } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { getTeamSizeEfficiency } from '@/lib/state/resource-store';
import type { Function as BusinessFunction } from '@/types';

// AI Tool definitions - single source of truth
export const AI_PRODUCTIVITY_TOOLS = [
  { id: 'ai-none', name: 'No AI', multiplier: 1, costPerSquare: 0, description: 'Manual work only' },
  { id: 'ai-assist', name: 'AI Assist', multiplier: 2, costPerSquare: 5, description: 'Basic AI help (2x)' },
  { id: 'ai-copilot', name: 'AI Copilot', multiplier: 5, costPerSquare: 15, description: 'AI handles routine (5x)' },
  { id: 'ai-heavy', name: 'AI Heavy', multiplier: 10, costPerSquare: 30, description: 'AI does most work (10x)' },
  { id: 'ai-autonomous', name: 'AI Autonomous', multiplier: 20, costPerSquare: 50, description: 'AI handles everything (20x)' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  workPlan: WorkPlan | null;
}

export function UnifiedTaskAllocationModal({ visible, onClose, workPlan }: Props) {
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const members = useOrganizationStore(s => s.members);

  // Local state for editing
  const [totalTUs, setTotalTUs] = useState(workPlan?.estimatedTimeUnits ?? 10);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [selectedAITool, setSelectedAITool] = useState<string>('ai-none');
  const [expandedSection, setExpandedSection] = useState<string | null>('people');

  // Reset state when workPlan changes
  useEffect(() => {
    if (workPlan) {
      setTotalTUs(workPlan.estimatedTimeUnits);
      // Convert allocations array to record
      const allocRecord: Record<string, number> = {};
      workPlan.allocations?.forEach(a => {
        allocRecord[a.memberId] = a.squaresPerWeek;
      });
      setAllocations(allocRecord);
      // Set AI tool from workPlan
      const aiTool = workPlan.appliedAITools?.[0];
      setSelectedAITool(aiTool?.toolId ?? 'ai-none');
    }
  }, [workPlan]);

  // Get active members grouped by role
  const membersByRole = useMemo(() => {
    const active = members.filter(m => m.status === 'active');
    return {
      founders: active.filter(m => m.role === 'Founder'),
      executives: active.filter(m => m.role === 'FractionalExec'),
      apprentices: active.filter(m => m.role === 'Apprentice'),
    };
  }, [members]);

  // Calculate member capacity (squares per week)
  const getMemberCapacity = useCallback((member: OrganizationMember) => {
    if (member.role === 'Founder') return 10; // 10 squares/week (+ up to 5 overtime)
    if (member.role === 'FractionalExec') {
      return (member.daysPerWeek ?? 2) * 2; // 2 squares per day
    }
    return 10; // Apprentices: 10 squares/week
  }, []);

  // Calculate cost per square for a member
  const getCostPerSquare = useCallback((member: OrganizationMember) => {
    const costPerDay = member.costPerDay ?? 0;
    return costPerDay / 2; // 1 day = 2 squares
  }, []);

  // Check if member's function matches task function
  const isFunctionMatch = useCallback((member: OrganizationMember) => {
    if (!workPlan) return false;
    // Founders can do anything
    if (member.role === 'Founder') return true;
    // Check function match
    return member.function === workPlan.function || member.function === 'General';
  }, [workPlan]);

  // Get AI tool by ID
  const getAITool = useCallback((toolId: string) => {
    return AI_PRODUCTIVITY_TOOLS.find(t => t.id === toolId) ?? AI_PRODUCTIVITY_TOOLS[0];
  }, []);

  // Calculate all derived values
  const calculations = useMemo(() => {
    const aiTool = getAITool(selectedAITool);
    const aiMultiplier = aiTool.multiplier;

    // Effective TUs needed (after AI boost)
    const effectiveTUs = Math.ceil(totalTUs / aiMultiplier);

    // Total allocated per week from all people
    const totalAllocatedPerWeek = Object.values(allocations).reduce((sum, sq) => sum + sq, 0);

    // Team size for efficiency calculation
    const teamSize = Object.keys(allocations).filter(k => allocations[k] > 0).length;
    const teamEfficiency = getTeamSizeEfficiency(teamSize);

    // Effective output per week (with team efficiency)
    const effectiveOutputPerWeek = totalAllocatedPerWeek * teamEfficiency.efficiencyMultiplier;

    // Weeks to complete
    const tusRemaining = Math.max(0, effectiveTUs - (workPlan?.tusExpended ?? 0));
    const weeksToComplete = effectiveOutputPerWeek > 0
      ? Math.ceil(tusRemaining / effectiveOutputPerWeek)
      : Infinity;

    // Cost calculations
    let personCostPerWeek = 0;
    Object.entries(allocations).forEach(([memberId, squares]) => {
      const member = members.find(m => m.id === memberId);
      if (member && squares > 0) {
        personCostPerWeek += squares * getCostPerSquare(member);
      }
    });

    const aiCostTotal = effectiveTUs * aiTool.costPerSquare;
    const totalCost = (personCostPerWeek * weeksToComplete) + aiCostTotal;
    const costToDate = (workPlan?.tusExpended ?? 0) * (personCostPerWeek / Math.max(1, totalAllocatedPerWeek));

    return {
      aiTool,
      aiMultiplier,
      effectiveTUs,
      totalAllocatedPerWeek,
      teamSize,
      teamEfficiency,
      effectiveOutputPerWeek,
      tusRemaining,
      weeksToComplete,
      personCostPerWeek,
      aiCostTotal,
      totalCost,
      costToDate,
    };
  }, [totalTUs, allocations, selectedAITool, workPlan, members, getAITool, getCostPerSquare]);

  // Save allocations
  const handleSave = useCallback(() => {
    if (!workPlan) return;

    // Convert record to array
    const allocationArray: TUAllocation[] = Object.entries(allocations)
      .filter(([_, squares]) => squares > 0)
      .map(([memberId, squares]) => {
        const member = members.find(m => m.id === memberId);
        return {
          memberId,
          memberName: member?.name ?? 'Unknown',
          squaresPerWeek: squares,
          costPerSquare: member ? getCostPerSquare(member) : 0,
        };
      });

    // AI tools array
    const aiTool = getAITool(selectedAITool);
    const appliedAITools: AppliedAITool[] = aiTool.multiplier > 1
      ? [{
          toolId: aiTool.id,
          toolName: aiTool.name,
          multiplier: aiTool.multiplier,
          costPerSquare: aiTool.costPerSquare,
        }]
      : [];

    updateWorkPlan(workPlan.id, {
      estimatedTimeUnits: totalTUs,
      allocations: allocationArray,
      appliedAITools,
      allocatedTimeUnitsPerWeek: calculations.totalAllocatedPerWeek,
      assignedMemberIds: allocationArray.map(a => a.memberId),
      status: allocationArray.length > 0 ? 'in-progress' : workPlan.status,
    });

    onClose();
  }, [workPlan, allocations, selectedAITool, totalTUs, calculations, members, updateWorkPlan, getCostPerSquare, getAITool, onClose]);

  // Complete task
  const handleComplete = useCallback(() => {
    if (!workPlan) return;

    Alert.alert(
      'Complete Task',
      'Mark this task as completed? This will create an audit record.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            updateWorkPlan(workPlan.id, {
              status: 'completed',
              progress: 100,
              allocations: [],
              assignedMemberIds: [],
              allocatedTimeUnitsPerWeek: 0,
              auditRecord: {
                completedAt: new Date().toISOString(),
                totalTUsSpent: workPlan.tusExpended + calculations.tusRemaining,
                totalCost: calculations.totalCost,
                totalWeeks: calculations.weeksToComplete,
              },
            });
            onClose();
          },
        },
      ]
    );
  }, [workPlan, calculations, updateWorkPlan, onClose]);

  // Abandon task
  const handleAbandon = useCallback(() => {
    if (!workPlan) return;

    Alert.alert(
      'Abandon Task',
      workPlan.tusExpended > 0
        ? `This task has ${workPlan.tusExpended}□ already spent. It will be moved to the incomplete list showing wasted resources.`
        : 'This task has no resources spent. It will be removed from the queue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: () => {
            if (workPlan.tusExpended > 0) {
              updateWorkPlan(workPlan.id, {
                status: 'blocked',
                allocations: [],
                assignedMemberIds: [],
                allocatedTimeUnitsPerWeek: 0,
                auditRecord: {
                  abandonedAt: new Date().toISOString(),
                  totalTUsSpent: workPlan.tusExpended,
                  totalCost: calculations.costToDate,
                  totalWeeks: 0,
                  reason: 'Abandoned by user',
                },
              });
            } else {
              // No resources spent - just remove
              updateWorkPlan(workPlan.id, {
                status: 'blocked',
                allocations: [],
                assignedMemberIds: [],
              });
            }
            onClose();
          },
        },
      ]
    );
  }, [workPlan, calculations, updateWorkPlan, onClose]);

  // Get default TU increment for each role
  const getDefaultIncrement = useCallback((member: OrganizationMember) => {
    if (member.role === 'Founder') return 2;
    if (member.role === 'FractionalExec') return 2;
    // Apprentices: use 2 TUs as default increment (was previously unclear from user example)
    return 2;
  }, []);

  // Handle tap on member to ADD their default TUs
  const handleMemberTap = useCallback((memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const increment = getDefaultIncrement(member);
    const currentAllocation = allocations[memberId] ?? 0;
    const capacity = getMemberCapacity(member);

    // Add default increment, capped at capacity
    const newValue = Math.min(capacity, currentAllocation + increment);
    if (newValue === currentAllocation) return; // Already at capacity

    setAllocations(prev => ({ ...prev, [memberId]: newValue }));
  }, [members, allocations, getDefaultIncrement, getMemberCapacity]);

  // Handle remove TUs (entire allocation)
  const handleRemoveTUs = useCallback((memberId: string, e: any) => {
    e?.stopPropagation(); // Prevent triggering the add tap
    setAllocations(prev => {
      const { [memberId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Render member row
  const renderMemberRow = useCallback((member: OrganizationMember) => {
    const currentAllocation = allocations[member.id] ?? 0;
    const capacity = getMemberCapacity(member);
    const costPerSquare = getCostPerSquare(member);
    const isMatch = isFunctionMatch(member);
    const defaultIncrement = getDefaultIncrement(member);
    const remaining = capacity - currentAllocation;

    return (
      <Pressable
        key={member.id}
        onPress={() => handleMemberTap(member.id)}
        className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 border-2 border-gray-200 dark:border-slate-700 active:border-blue-400 active:bg-blue-50 dark:active:bg-blue-900/10"
      >
        <Animated.View entering={FadeInDown.delay(50).duration(200)}>
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                member.role === 'Founder' ? 'bg-purple-500' :
                member.role === 'FractionalExec' ? 'bg-blue-500' : 'bg-emerald-500'
              }`}>
                {member.role === 'Founder' && <Crown size={18} color="white" />}
                {member.role === 'FractionalExec' && <Briefcase size={18} color="white" />}
                {member.role === 'Apprentice' && <GraduationCap size={18} color="white" />}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-gray-900 dark:text-white font-semibold">
                    {member.name}
                  </Text>
                  {isMatch && (
                    <View className="bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                      <Text className="text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        FIT
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-500 dark:text-slate-400 text-xs">
                  {member.function} • £{costPerSquare}/□ • {remaining}/{capacity}□ available
                </Text>
              </View>
            </View>

            {/* Current allocation badge and remove button */}
            <View className="flex-row items-center gap-2">
              {currentAllocation > 0 ? (
                <>
                  <View className="bg-blue-500 px-3 py-1.5 rounded-lg">
                    <Text className="text-white font-bold text-base">
                      {currentAllocation}□
                    </Text>
                  </View>
                  <Pressable
                    onPress={(e) => handleRemoveTUs(member.id, e)}
                    className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center active:opacity-70"
                  >
                    <X size={14} color="#ef4444" />
                  </Pressable>
                </>
              ) : (
                <View className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                  <Text className="text-gray-400 dark:text-slate-500 font-semibold text-sm">
                    Tap +{defaultIncrement}□
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Visual squares showing real-time allocation */}
          <View className="flex-row flex-wrap gap-1">
            {Array.from({ length: capacity }).map((_, idx) => (
              <View
                key={idx}
                className={`w-6 h-6 rounded border ${
                  idx < currentAllocation
                    ? 'bg-blue-500 border-blue-600'
                    : 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600'
                }`}
              />
            ))}
          </View>

          {currentAllocation > 0 && (
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                £{(currentAllocation * costPerSquare).toFixed(0)}/week allocated
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-xs">
                {currentAllocation}□ × £{costPerSquare}/□
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }, [allocations, getMemberCapacity, getCostPerSquare, isFunctionMatch, getDefaultIncrement, handleMemberTap, handleRemoveTUs]);

  if (!workPlan) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '92%' }}>
          <View className="bg-gray-50 dark:bg-slate-950 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-800">
              <View className="flex-1">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-medium">
                  {workPlan.function} • {workPlan.linkedOKRTitle}
                </Text>
                <Text className="text-gray-900 dark:text-white text-lg font-bold" numberOfLines={2}>
                  {workPlan.title}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full items-center justify-center ml-3"
              >
                <X size={18} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView
              className="px-5"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {/* Task Description */}
              <Animated.View entering={FadeIn.delay(100)} className="py-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
                  {workPlan.description}
                </Text>
              </Animated.View>

              {/* Total TUs Adjustment */}
              <Animated.View
                entering={FadeInDown.delay(150)}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 border border-gray-200 dark:border-slate-700"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Target size={20} color="#3b82f6" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      Total TUs Required
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      onPress={() => setTotalTUs(Math.max(1, totalTUs - 1))}
                      className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full items-center justify-center"
                    >
                      <Minus size={18} color="#374151" />
                    </Pressable>
                    <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 w-12 text-center">
                      {totalTUs}
                    </Text>
                    <Pressable
                      onPress={() => setTotalTUs(totalTUs + 1)}
                      className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center"
                    >
                      <Plus size={18} color="white" />
                    </Pressable>
                  </View>
                </View>
                <Text className="text-gray-500 dark:text-slate-400 text-xs">
                  1□ = 4 hours of work • {totalTUs}□ = {totalTUs * 4} hours total
                </Text>

                {/* Progress indicator */}
                {workPlan.tusExpended > 0 && (
                  <View className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">
                        Already spent: {workPlan.tusExpended}□
                      </Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                        Remaining: {calculations.tusRemaining}□
                      </Text>
                    </View>
                    <View className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <View
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(workPlan.tusExpended / totalTUs) * 100}%` }}
                      />
                    </View>
                  </View>
                )}
              </Animated.View>

              {/* AI Productivity Tools */}
              <Animated.View
                entering={FadeInDown.delay(200)}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 border border-gray-200 dark:border-slate-700"
              >
                <Pressable
                  onPress={() => setExpandedSection(expandedSection === 'ai' ? null : 'ai')}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Bot size={20} color="#8b5cf6" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      AI Productivity Boost
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    {calculations.aiMultiplier > 1 && (
                      <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded mr-2">
                        <Text className="text-purple-700 dark:text-purple-300 text-sm font-bold">
                          {calculations.aiMultiplier}x
                        </Text>
                      </View>
                    )}
                    <ChevronRight
                      size={20}
                      color="#6b7280"
                      style={{ transform: [{ rotate: expandedSection === 'ai' ? '90deg' : '0deg' }] }}
                    />
                  </View>
                </Pressable>

                {expandedSection === 'ai' && (
                  <View className="mt-4">
                    {AI_PRODUCTIVITY_TOOLS.map((tool) => (
                      <Pressable
                        key={tool.id}
                        onPress={() => setSelectedAITool(tool.id)}
                        className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                          selectedAITool === tool.id
                            ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                            : 'bg-gray-50 dark:bg-slate-800'
                        }`}
                      >
                        <View className="flex-1">
                          <Text className={`font-semibold ${
                            selectedAITool === tool.id
                              ? 'text-purple-700 dark:text-purple-300'
                              : 'text-gray-700 dark:text-slate-300'
                          }`}>
                            {tool.name}
                          </Text>
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">
                            {tool.description}
                          </Text>
                        </View>
                        {tool.costPerSquare > 0 && (
                          <Text className="text-gray-600 dark:text-slate-400 text-sm">
                            £{tool.costPerSquare}/□
                          </Text>
                        )}
                      </Pressable>
                    ))}

                    {calculations.aiMultiplier > 1 && (
                      <View className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 mt-2">
                        <Text className="text-purple-700 dark:text-purple-300 text-sm">
                          With {calculations.aiMultiplier}x AI boost: {totalTUs}□ → {calculations.effectiveTUs}□ effective
                        </Text>
                        <Text className="text-purple-600 dark:text-purple-400 text-xs mt-1">
                          AI cost: £{calculations.aiCostTotal} total
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>

              {/* People Allocation */}
              <Animated.View
                entering={FadeInDown.delay(250)}
                className="mb-4"
              >
                <Pressable
                  onPress={() => setExpandedSection(expandedSection === 'people' ? null : 'people')}
                  className="flex-row items-center justify-between mb-3"
                >
                  <View className="flex-row items-center">
                    <Users size={20} color="#3b82f6" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      Team Allocation
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded mr-2">
                      <Text className="text-blue-700 dark:text-blue-300 text-sm font-semibold">
                        {calculations.totalAllocatedPerWeek}□/wk
                      </Text>
                    </View>
                    <ChevronRight
                      size={20}
                      color="#6b7280"
                      style={{ transform: [{ rotate: expandedSection === 'people' ? '90deg' : '0deg' }] }}
                    />
                  </View>
                </Pressable>

                {expandedSection === 'people' && (
                  <>
                    {/* Team efficiency indicator */}
                    {calculations.teamSize > 0 && (
                      <View className={`rounded-lg p-3 mb-3 ${
                        calculations.teamEfficiency.efficiencyMultiplier >= 1
                          ? 'bg-emerald-50 dark:bg-emerald-900/10'
                          : calculations.teamEfficiency.efficiencyMultiplier >= 0.9
                            ? 'bg-amber-50 dark:bg-amber-900/10'
                            : 'bg-red-50 dark:bg-red-900/10'
                      }`}>
                        <View className="flex-row items-center justify-between">
                          <Text className={`font-semibold ${
                            calculations.teamEfficiency.efficiencyMultiplier >= 1
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : calculations.teamEfficiency.efficiencyMultiplier >= 0.9
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-red-700 dark:text-red-300'
                          }`}>
                            {calculations.teamEfficiency.label} ({calculations.teamSize} people)
                          </Text>
                          <Text className={`font-bold ${
                            calculations.teamEfficiency.efficiencyMultiplier >= 1
                              ? 'text-emerald-600'
                              : calculations.teamEfficiency.efficiencyMultiplier >= 0.9
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }`}>
                            {Math.round(calculations.teamEfficiency.efficiencyMultiplier * 100)}% efficiency
                          </Text>
                        </View>
                        <Text className="text-gray-600 dark:text-slate-400 text-xs mt-1">
                          {calculations.teamEfficiency.description}
                        </Text>
                      </View>
                    )}

                    {/* Skill match hint */}
                    <View className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 mb-3">
                      <View className="flex-row items-center">
                        <Zap size={14} color="#3b82f6" />
                        <Text className="text-blue-700 dark:text-blue-300 text-xs ml-1">
                          This is a <Text className="font-bold">{workPlan.function}</Text> task. Members with matching function are marked with FIT.
                        </Text>
                      </View>
                    </View>

                    {/* Founders */}
                    {membersByRole.founders.length > 0 && (
                      <View className="mb-4">
                        <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold tracking-wide mb-2">
                          FOUNDERS
                        </Text>
                        {membersByRole.founders.map(renderMemberRow)}
                      </View>
                    )}

                    {/* Executives */}
                    {membersByRole.executives.length > 0 && (
                      <View className="mb-4">
                        <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide mb-2">
                          EXECUTIVES
                        </Text>
                        {membersByRole.executives.map(renderMemberRow)}
                      </View>
                    )}

                    {/* Apprentices */}
                    {membersByRole.apprentices.length > 0 && (
                      <View className="mb-4">
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide mb-2">
                          APPRENTICES
                        </Text>
                        {membersByRole.apprentices.map(renderMemberRow)}
                      </View>
                    )}
                  </>
                )}
              </Animated.View>

              {/* Cost & Timeline Summary */}
              <Animated.View
                entering={FadeInDown.delay(300)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 mb-4"
              >
                <Text className="text-white/80 text-xs font-medium mb-2">
                  COST & TIMELINE SUMMARY
                </Text>

                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-white/70 text-xs">Total Cost</Text>
                    <Text className="text-white text-2xl font-bold">
                      £{Math.round(calculations.totalCost).toLocaleString()}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white/70 text-xs">Time to Complete</Text>
                    <Text className="text-white text-2xl font-bold">
                      {calculations.weeksToComplete === Infinity ? '∞' : `${calculations.weeksToComplete}w`}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between pt-3 border-t border-white/20">
                  <View>
                    <Text className="text-white/60 text-xs">Person cost/wk</Text>
                    <Text className="text-white font-semibold">£{Math.round(calculations.personCostPerWeek)}</Text>
                  </View>
                  <View>
                    <Text className="text-white/60 text-xs">AI cost</Text>
                    <Text className="text-white font-semibold">£{calculations.aiCostTotal}</Text>
                  </View>
                  <View>
                    <Text className="text-white/60 text-xs">Effective □/wk</Text>
                    <Text className="text-white font-semibold">{calculations.effectiveOutputPerWeek.toFixed(1)}□</Text>
                  </View>
                </View>

                {workPlan.tusExpended > 0 && (
                  <View className="mt-3 pt-3 border-t border-white/20">
                    <View className="flex-row justify-between">
                      <Text className="text-white/70 text-sm">Cost to date:</Text>
                      <Text className="text-white font-semibold">£{Math.round(calculations.costToDate)}</Text>
                    </View>
                  </View>
                )}
              </Animated.View>

              {/* Warnings */}
              {calculations.totalAllocatedPerWeek === 0 && (
                <Animated.View
                  entering={FadeInDown.delay(350)}
                  className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4"
                >
                  <View className="flex-row items-start">
                    <AlertTriangle size={20} color="#f59e0b" />
                    <View className="ml-3 flex-1">
                      <Text className="text-amber-800 dark:text-amber-300 font-semibold">
                        No TUs Allocated
                      </Text>
                      <Text className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                        This task won't progress without TU allocation. Tap on team members above to assign work.
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-5 py-4">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleAbandon}
                  className="flex-1 bg-red-100 dark:bg-red-900/30 py-3 rounded-xl items-center active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Archive size={18} color="#ef4444" />
                    <Text className="text-red-600 dark:text-red-400 font-semibold ml-2">
                      Abandon
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  className="flex-2 bg-blue-500 py-3 px-6 rounded-xl items-center active:opacity-70"
                  style={{ flex: 2 }}
                >
                  <View className="flex-row items-center">
                    <CheckCircle2 size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Save Allocation
                    </Text>
                  </View>
                </Pressable>

                {workPlan.progress >= 90 && (
                  <Pressable
                    onPress={handleComplete}
                    className="flex-1 bg-emerald-500 py-3 rounded-xl items-center active:opacity-70"
                  >
                    <View className="flex-row items-center">
                      <CheckCircle2 size={18} color="white" />
                      <Text className="text-white font-semibold ml-2">
                        Done
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default UnifiedTaskAllocationModal;
