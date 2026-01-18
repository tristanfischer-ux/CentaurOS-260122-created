/**
 * UnifiedTaskAllocationModal
 *
 * THE single source of truth for TU allocation across the entire app.
 *
 * Flow:
 * 1. Click on a task → see explanation and default TU estimate
 * 2. Adjust total TUs up/down
 * 3. TAP on people to add their TUs (all squares visible, tap-to-add interface)
 * 4. Select AI tools for productivity boost
 * 5. See cost breakdown, timeline, and team efficiency
 * 6. Complete or Abandon task
 *
 * Key Features:
 * - Tap-to-add TU allocation with full capacity visibility
 * - ALL team members shown with their complete capacity grid
 * - Skill mismatch warnings with 50% efficiency penalty
 * - AI productivity multipliers (2x, 5x, 10x, 20x)
 * - Team size efficiency (Brooks' Law)
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
  const workPlans = useWorkPlanStore(s => s.workPlans);
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

  // Calculate member capacity (squares per week)
  const getMemberCapacity = useCallback((member: OrganizationMember) => {
    if (member.role === 'Founder') return 10; // 10 squares/week normal
    if (member.role === 'FractionalExec') {
      return (member.daysPerWeek ?? 2) * 2; // 2 squares per day
    }
    return 10; // Apprentices: 10 squares/week normal
  }, []);

  // Get MAX capacity including overtime (50% more)
  const getMaxCapacity = useCallback((member: OrganizationMember) => {
    const normalCapacity = getMemberCapacity(member);
    return Math.floor(normalCapacity * 1.5); // 10 → 15, 4 → 6, etc.
  }, [getMemberCapacity]);

  // Get TUs allocated to OTHER projects (LOCKED capacity)
  const getOtherProjectAllocations = useCallback((memberId: string) => {
    if (!workPlan) return 0;

    // Sum up allocations from ALL OTHER in-progress work plans
    return workPlans
      .filter(wp => wp.id !== workPlan.id && wp.status === 'in-progress')
      .reduce((total, wp) => {
        const allocation = wp.allocations?.find(a => a.memberId === memberId);
        return total + (allocation?.squaresPerWeek ?? 0);
      }, 0);
  }, [workPlans, workPlan]);

  // Get actual remaining capacity (total - locked by other projects)
  const getRemainingCapacity = useCallback((memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return 0;

    const maxCapacity = getMaxCapacity(member);
    const lockedByOthers = getOtherProjectAllocations(memberId);
    const currentAllocation = allocations[memberId] ?? 0;

    // Remaining = max capacity - locked capacity + current allocation to THIS project
    // (We add back current allocation because it's not "locked" - user can remove it)
    return Math.max(0, maxCapacity - lockedByOthers);
  }, [members, getMaxCapacity, getOtherProjectAllocations, allocations]);

  // Check if member is in overtime (total allocation across ALL projects > normal capacity)
  const isOvertime = useCallback((memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return false;

    const currentAllocation = allocations[memberId] ?? 0;
    const lockedByOthers = getOtherProjectAllocations(memberId);
    const totalAllocation = currentAllocation + lockedByOthers;
    const normalCapacity = getMemberCapacity(member);

    return totalAllocation > normalCapacity;
  }, [members, allocations, getMemberCapacity, getOtherProjectAllocations]);

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

  // Check if member is mismatched for this task
  const isMismatch = useCallback((member: OrganizationMember) => {
    if (!workPlan) return false;
    // Founders and General can do anything - no mismatch
    if (member.role === 'Founder' || member.function === 'General') return false;
    // Mismatch if specialized function doesn't match task
    return member.function !== workPlan.function;
  }, [workPlan]);

  // Get AI tool by ID
  const getAITool = useCallback((toolId: string) => {
    return AI_PRODUCTIVITY_TOOLS.find(t => t.id === toolId) ?? AI_PRODUCTIVITY_TOOLS[0];
  }, []);

  // Calculate all derived values
  const calculations = useMemo(() => {
    const aiTool = getAITool(selectedAITool);
    const aiMultiplier = aiTool.multiplier;

    // Calculate skill mismatch penalty
    let skillMismatchPenalty = 1.0; // No penalty by default
    const mismatchedMembers = Object.keys(allocations).filter(memberId => {
      const member = members.find(m => m.id === memberId);
      return member && isMismatch(member) && allocations[memberId] > 0;
    });

    if (mismatchedMembers.length > 0) {
      skillMismatchPenalty = 0.5; // 50% efficiency penalty for skill mismatch
    }

    // Calculate overtime penalty (20% efficiency hit when working overtime)
    const overtimeMembers = Object.keys(allocations).filter(memberId => {
      return isOvertime(memberId);
    });
    let overtimePenalty = 1.0;
    if (overtimeMembers.length > 0) {
      overtimePenalty = 0.8; // 20% efficiency penalty for overtime
    }

    // Effective TUs needed (after AI boost, skill penalties, and overtime penalties)
    const effectiveTUs = Math.ceil(totalTUs / (aiMultiplier * skillMismatchPenalty * overtimePenalty));

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
      skillMismatchPenalty,
      mismatchedMembers,
      overtimePenalty,
      overtimeMembers,
    };
  }, [totalTUs, allocations, selectedAITool, workPlan, members, getAITool, getCostPerSquare, isMismatch, isOvertime]);

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
      'Delete Task & Free Resources',
      workPlan.tusExpended > 0
        ? `This task has ${workPlan.tusExpended}□ already spent. All allocated resources will be freed and the task will be moved to abandoned tasks.`
        : 'This task will be deleted and all allocated resources will be freed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Always use 'abandoned' status to properly free resources
            updateWorkPlan(workPlan.id, {
              status: 'abandoned',
              allocations: [],
              assignedMemberIds: [],
              allocatedTimeUnitsPerWeek: 0,
              auditRecord: {
                abandonedAt: new Date().toISOString(),
                totalTUsSpent: workPlan.tusExpended,
                totalCost: calculations.costToDate,
                totalWeeks: 0,
                reason: 'Deleted by user - resources freed',
              },
            });
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
    const remainingCapacity = getRemainingCapacity(memberId);

    // Can only allocate up to remaining capacity (respects locked TUs from other projects)
    const newValue = Math.min(remainingCapacity, currentAllocation + increment);
    if (newValue === currentAllocation) return; // No capacity left

    setAllocations(prev => ({ ...prev, [memberId]: newValue }));
  }, [members, allocations, getDefaultIncrement, getRemainingCapacity]);

  // Handle remove TUs (entire allocation)
  const handleRemoveTUs = useCallback((memberId: string, e: any) => {
    e?.stopPropagation(); // Prevent triggering the add tap
    setAllocations(prev => {
      const { [memberId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Clear all allocations
  const handleClearAll = useCallback(() => {
    setAllocations({});
  }, []);

  // Render member row
  const renderMemberRow = useCallback((member: OrganizationMember) => {
    const currentAllocation = allocations[member.id] ?? 0;
    const normalCapacity = getMemberCapacity(member);
    const maxCapacity = getMaxCapacity(member);
    const lockedByOthers = getOtherProjectAllocations(member.id);
    const remainingCapacity = getRemainingCapacity(member.id);
    const costPerSquare = getCostPerSquare(member);
    const isMatch = isFunctionMatch(member);
    const isMismatched = isMismatch(member);
    const defaultIncrement = getDefaultIncrement(member);
    const available = remainingCapacity - currentAllocation;
    const inOvertime = isOvertime(member.id);

    // DEBUG LOG
    console.log(`[UnifiedTaskAllocationModal] Rendering ${member.name} with normal ${normalCapacity}, max ${maxCapacity}, locked ${lockedByOthers}, current ${currentAllocation}, remaining ${remainingCapacity}`);

    return (
      <Pressable
        key={member.id}
        onPress={() => handleMemberTap(member.id)}
        className={`rounded-xl p-4 mb-3 border-2 active:bg-blue-50 dark:active:bg-blue-900/10 ${
          isMismatched && currentAllocation > 0
            ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700 active:border-red-400'
            : inOvertime
              ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-300 dark:border-orange-700 active:border-orange-400'
              : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 active:border-blue-400'
        }`}
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
                <View className="flex-row items-center gap-2 flex-wrap">
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
                  {isMismatched && currentAllocation > 0 && (
                    <View className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                      <Text className="text-red-700 dark:text-red-300 text-[10px] font-bold">
                        MISMATCH
                      </Text>
                    </View>
                  )}
                  {inOvertime && (
                    <View className="bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
                      <Text className="text-orange-700 dark:text-orange-300 text-[10px] font-bold">
                        OVERTIME
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-500 dark:text-slate-400 text-xs">
                  {member.function} • £{costPerSquare}/□
                </Text>
              </View>
            </View>

            {/* Current allocation badge and remove button */}
            <View className="flex-row items-center gap-2">
              {currentAllocation > 0 ? (
                <>
                  <View className={`px-3 py-1.5 rounded-lg ${
                    inOvertime ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
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

          {/* Visual squares showing ALL capacity with allocation */}
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-gray-600 dark:text-slate-400 text-xs font-medium">
                Capacity: {currentAllocation}□ here • {lockedByOthers}□ locked • {available}□ free
              </Text>
              {currentAllocation > 0 && (
                <Text className={`text-xs font-semibold ${
                  inOvertime ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  £{(currentAllocation * costPerSquare).toFixed(0)}/wk
                </Text>
              )}
            </View>
            <View className="flex-row flex-wrap gap-1">
              {Array.from({ length: maxCapacity }).map((_, idx) => {
                const isNormalRange = idx < normalCapacity;

                // Calculate cumulative allocations
                const totalAllocated = currentAllocation + lockedByOthers;
                const isAllocatedHere = idx < currentAllocation;
                const isLockedByOthers = !isAllocatedHere && idx < totalAllocated;
                const isFree = idx >= totalAllocated;

                return (
                  <View
                    key={idx}
                    className={`w-7 h-7 rounded border ${
                      isAllocatedHere
                        ? isMismatched
                          ? 'bg-red-500 border-red-600' // Skill mismatch
                          : !isNormalRange
                            ? 'bg-orange-500 border-orange-600' // Overtime
                            : 'bg-blue-500 border-blue-600' // Normal allocation here
                        : isLockedByOthers
                          ? 'bg-yellow-500 border-yellow-600' // LOCKED by other projects
                          : isFree
                            ? isNormalRange
                              ? 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600' // Free normal
                              : 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600' // Free overtime
                            : 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600'
                    }`}
                  />
                );
              })}
            </View>
          </View>

          {lockedByOthers > 0 && (
            <View className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 flex-row items-start mb-2">
              <AlertCircle size={14} color="#eab308" />
              <Text className="text-yellow-700 dark:text-yellow-300 text-xs ml-2 flex-1">
                <Text className="font-bold">Locked:</Text> {lockedByOthers}□ allocated to other projects. Remove from other tasks to free up capacity.
              </Text>
            </View>
          )}

          {inOvertime && (
            <View className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2 flex-row items-start mb-2">
              <AlertTriangle size={14} color="#f97316" />
              <Text className="text-orange-700 dark:text-orange-300 text-xs ml-2 flex-1">
                <Text className="font-bold">Overtime Mode:</Text> Working beyond normal capacity. 20% efficiency penalty applied.
              </Text>
            </View>
          )}

          {isMismatched && currentAllocation > 0 && (
            <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 flex-row items-start">
              <AlertTriangle size={14} color="#ef4444" />
              <Text className="text-red-700 dark:text-red-300 text-xs ml-2 flex-1">
                <Text className="font-bold">Skill Mismatch:</Text> {member.function} working on {workPlan?.function} task. 50% efficiency penalty applied.
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }, [allocations, getMemberCapacity, getMaxCapacity, getOtherProjectAllocations, getRemainingCapacity, getCostPerSquare, isFunctionMatch, isMismatch, getDefaultIncrement, handleMemberTap, handleRemoveTUs, workPlan, isOvertime]);

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
          <View className="bg-gray-50 dark:bg-slate-950 rounded-t-3xl" style={{ height: '100%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-800">
              <View className="flex-1">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-medium">
                  {workPlan.function}
                </Text>
                <Text className="text-gray-900 dark:text-white text-lg font-bold" numberOfLines={2}>
                  {workPlan.title}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-9 h-9 bg-gray-100 dark:bg-slate-800 rounded-full items-center justify-center ml-3"
              >
                <X size={18} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              className="px-5 py-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {/* Task Description */}
              <Animated.View entering={FadeIn.delay(100)} className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
                  {workPlan.description}
                </Text>
              </Animated.View>

              {/* Task Requirements - Display Only */}
              <Animated.View
                entering={FadeInDown.delay(150)}
                className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 mb-4 border-2 border-blue-200 dark:border-blue-800"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-blue-900 dark:text-blue-100 text-sm font-medium mb-1">
                      Task Requirement
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-blue-600 dark:text-blue-400 text-3xl font-bold">
                        {totalTUs}
                      </Text>
                      <Text className="text-blue-600 dark:text-blue-400 text-lg font-semibold ml-1">
                        TU
                      </Text>
                    </View>
                    <Text className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                      {totalTUs * 4} hours of work needed
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-blue-900 dark:text-blue-100 text-sm font-medium mb-1">
                      Allocated
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text className={`text-3xl font-bold ${
                        calculations.totalAllocatedPerWeek >= totalTUs
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {calculations.totalAllocatedPerWeek}
                      </Text>
                      <Text className={`text-lg font-semibold ml-1 ${
                        calculations.totalAllocatedPerWeek >= totalTUs
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        TU
                      </Text>
                    </View>
                    <Text className={`text-xs mt-1 font-semibold ${
                      calculations.totalAllocatedPerWeek >= totalTUs
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-orange-700 dark:text-orange-300'
                    }`}>
                      {calculations.totalAllocatedPerWeek >= totalTUs ? '✓ Fully allocated' : `Need ${totalTUs - calculations.totalAllocatedPerWeek} TU more`}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View className="mt-4">
                  <View className="h-3 bg-blue-100 dark:bg-blue-900/20 rounded-full overflow-hidden">
                    <View
                      className={`h-full rounded-full ${
                        calculations.totalAllocatedPerWeek >= totalTUs
                          ? 'bg-emerald-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.min(100, (calculations.totalAllocatedPerWeek / totalTUs) * 100)}%` }}
                    />
                  </View>
                  <Text className="text-blue-600 dark:text-blue-400 text-xs text-center mt-1">
                    {Math.round((calculations.totalAllocatedPerWeek / totalTUs) * 100)}% allocated
                  </Text>
                </View>

                {/* Progress indicator for in-progress tasks */}
                {workPlan.tusExpended > 0 && (
                  <View className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-blue-700 dark:text-blue-300 text-sm">
                        Already completed: {workPlan.tusExpended}□
                      </Text>
                      <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                        Remaining: {Math.max(0, totalTUs - workPlan.tusExpended)}□
                      </Text>
                    </View>
                  </View>
                )}
              </Animated.View>

              {/* People Allocation */}
              <Animated.View
                entering={FadeInDown.delay(250)}
                className="mb-4"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Pressable
                    onPress={() => setExpandedSection(expandedSection === 'people' ? null : 'people')}
                    className="flex-row items-center flex-1"
                  >
                    <Users size={20} color="#3b82f6" />
                    <Text className="text-gray-900 dark:text-white font-semibold ml-2">
                      Team Allocation ({calculations.totalAllocatedPerWeek}□/wk assigned)
                    </Text>
                    <ChevronRight
                      size={20}
                      color="#6b7280"
                      style={{ transform: [{ rotate: expandedSection === 'people' ? '90deg' : '0deg' }], marginLeft: 8 }}
                    />
                  </Pressable>

                  {/* Clear All button */}
                  {calculations.totalAllocatedPerWeek > 0 && (
                    <Pressable
                      onPress={handleClearAll}
                      className="bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg active:opacity-70"
                    >
                      <Text className="text-red-700 dark:text-red-300 text-xs font-bold">
                        Clear All
                      </Text>
                    </Pressable>
                  )}
                </View>

                {expandedSection === 'people' && (
                  <>
                    {/* Overtime Warning */}
                    {calculations.overtimeMembers.length > 0 && (
                      <View className="bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-4 mb-3">
                        <View className="flex-row items-start">
                          <AlertTriangle size={20} color="#f97316" />
                          <View className="ml-3 flex-1">
                            <Text className="text-orange-800 dark:text-orange-300 font-bold text-sm">
                              Overtime Mode Active
                            </Text>
                            <Text className="text-orange-700 dark:text-orange-400 text-xs mt-1">
                              {calculations.overtimeMembers.length} team member{calculations.overtimeMembers.length > 1 ? 's are' : ' is'} working overtime (sprint mode). This reduces efficiency by 20%.
                            </Text>
                            <View className="mt-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2">
                              <Text className="text-orange-800 dark:text-orange-300 text-xs font-semibold">
                                Normal: 10□/week • Sprint: up to 15□/week (50% increase)
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Skill Mismatch Warning */}
                    {calculations.mismatchedMembers.length > 0 && (
                      <View className="bg-red-50 dark:bg-red-900/10 border-2 border-red-300 dark:border-red-700 rounded-xl p-4 mb-3">
                        <View className="flex-row items-start">
                          <AlertTriangle size={20} color="#ef4444" />
                          <View className="ml-3 flex-1">
                            <Text className="text-red-800 dark:text-red-300 font-bold text-sm">
                              Skill Mismatch Detected
                            </Text>
                            <Text className="text-red-700 dark:text-red-400 text-xs mt-1">
                              {calculations.mismatchedMembers.length} team member{calculations.mismatchedMembers.length > 1 ? 's are' : ' is'} working outside their specialty on this {workPlan.function} task. This reduces efficiency by 50%.
                            </Text>
                            <View className="mt-2 bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                              <Text className="text-red-800 dark:text-red-300 text-xs font-semibold">
                                Effective TUs increased: {Math.round(totalTUs / calculations.aiMultiplier)}□ → {calculations.effectiveTUs}□
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}

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
                        <Text className="text-blue-700 dark:text-blue-300 text-xs ml-1 flex-1">
                          This is a <Text className="font-bold">{workPlan.function}</Text> task{'. '}
                          Tap any team member below to allocate their TUs{'. '}
                          Members with <Text className="font-bold">FIT</Text> badge work at full efficiency{'. '}
                          Others get 50% penalty.
                        </Text>
                      </View>
                    </View>

                    {/* All Team Members - Single List */}
                    <View className="mb-4">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold tracking-wide mb-3">
                        ALL TEAM MEMBERS • TAP TO ALLOCATE
                      </Text>
                      {members.filter(m => m.status === 'active').map(renderMemberRow)}
                    </View>
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
                    <Text className="text-red-600 dark:text-red-400 font-semibold ml-2 text-xs">
                      Delete & Free
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
                      Allocate Resources
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
