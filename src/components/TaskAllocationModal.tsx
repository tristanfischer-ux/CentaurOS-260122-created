/**
 * Task Allocation Modal
 *
 * Full TU (Time Unit/Squares) allocation interface for a task.
 *
 * Flow:
 * 1. View task details and default TU expectation
 * 2. Adjust total TUs required (up/down)
 * 3. Add TUs from team members by tapping their squares
 * 4. Select AI tools for productivity multiplier
 * 5. View cost breakdown and time estimates
 *
 * Key calculations:
 * - Effective TUs = Total TUs / AI Multiplier
 * - Weeks to complete = Effective TUs remaining / TUs allocated per week
 * - Total cost = (Person TUs × Cost/TU) + (AI cost × Effective TUs)
 */

import { View, Text, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Zap,
  Clock,
  DollarSign,
  Users,
  Bot,
  CheckCircle,
  AlertTriangle,
  Minus,
  Plus,
  Target,
  TrendingUp,
  AlertCircle,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  useResourceStore,
  type PersonResource,
  type TaskResource,
  type AITool,
  PERSON_CLASS_COLORS,
  DEFAULT_AI_TOOLS,
} from '@/lib/state/resource-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import type { Function as BusinessFunction } from '@/types';

interface TaskAllocationModalProps {
  visible: boolean;
  onClose: () => void;
  workPlan: WorkPlan | null;
  workspaceId: string;
  onComplete?: (workPlanId: string) => void;
  onAbandon?: (workPlanId: string, reason: string) => void;
}

// Skill type mapping for tasks
const FUNCTION_SKILLS: Record<BusinessFunction, string[]> = {
  Marketing: ['Marketing', 'General'],
  Sales: ['Sales', 'General'],
  Engineering: ['Engineering', 'Product', 'General'],
  Ops: ['Operations', 'General'],
  Finance: ['Finance', 'General'],
  Admin: ['Admin', 'General'],
};

// TU adjustment button
function TUAdjustButton({
  direction,
  onPress,
  disabled,
}: {
  direction: 'up' | 'down';
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={disabled}
      className={`w-10 h-10 rounded-lg items-center justify-center ${
        disabled ? 'bg-slate-800/50' : 'bg-slate-700 active:bg-slate-600'
      }`}
    >
      {direction === 'up' ? (
        <Plus size={20} color={disabled ? '#475569' : '#fff'} />
      ) : (
        <Minus size={20} color={disabled ? '#475569' : '#fff'} />
      )}
    </Pressable>
  );
}

// Person allocation row
function PersonAllocationRow({
  member,
  currentAllocation,
  maxAvailable,
  costPerSquare,
  onAllocationChange,
  isRecommended,
}: {
  member: OrganizationMember;
  currentAllocation: number;
  maxAvailable: number;
  costPerSquare: number;
  onAllocationChange: (squares: number) => void;
  isRecommended: boolean;
}) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder':
        return '#8b5cf6';
      case 'FractionalExec':
        return '#3b82f6';
      case 'Apprentice':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const totalSquares = maxAvailable + currentAllocation;
  const baseSquares = member.role === 'FractionalExec' ? (member.daysPerWeek || 2) * 2 : 10;

  return (
    <View className="flex-row items-center py-3 border-b border-slate-700/50">
      {/* Person Info */}
      <View className="flex-row items-center w-28">
        <View
          className={`w-9 h-9 rounded-full items-center justify-center mr-2 ${
            isRecommended ? 'border-2 border-amber-400' : ''
          }`}
          style={{ backgroundColor: getRoleColor(member.role) }}
        >
          <Text className="text-white font-bold text-xs">{getInitials(member.name)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-medium text-xs" numberOfLines={1}>
            {member.name.split(' ')[0]}
          </Text>
          <View className="flex-row items-center">
            {isRecommended && (
              <View className="bg-amber-500/20 px-1 rounded mr-1">
                <Text className="text-amber-400 text-[8px] font-bold">FIT</Text>
              </View>
            )}
            <Text className="text-slate-400 text-[10px]">{member.function}</Text>
          </View>
        </View>
      </View>

      {/* Squares Grid */}
      <View className="flex-1 flex-row items-center gap-1 px-2">
        {Array.from({ length: Math.min(baseSquares, 10) }).map((_, i) => {
          const isAllocatedToThis = i < currentAllocation;
          const isAllocatedToOther = i >= currentAllocation && i < totalSquares - maxAvailable;
          const isAvailable = i >= totalSquares - maxAvailable && i < totalSquares;

          return (
            <Pressable
              key={i}
              onPress={() => {
                if (isAllocatedToThis) {
                  // Remove this square
                  onAllocationChange(currentAllocation - 1);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else if (isAvailable) {
                  // Add this square
                  onAllocationChange(currentAllocation + 1);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              }}
              disabled={isAllocatedToOther}
            >
              <View
                className={`w-4 h-4 rounded-sm ${
                  isAllocatedToThis
                    ? 'bg-purple-500 border border-purple-400'
                    : isAllocatedToOther
                      ? 'bg-emerald-500/60'
                      : 'bg-slate-700 border border-slate-600'
                }`}
              >
                {isAllocatedToThis && <Text className="text-white text-[8px] text-center">✓</Text>}
              </View>
            </Pressable>
          );
        })}
        {baseSquares > 10 && <Text className="text-slate-500 text-[10px]">+{baseSquares - 10}</Text>}
      </View>

      {/* Cost */}
      <View className="w-16 items-end">
        <Text className="text-white font-bold text-sm">£{Math.round(costPerSquare)}</Text>
        <Text className="text-slate-400 text-[10px]">per TU</Text>
      </View>
    </View>
  );
}

// AI Tool selector
function AIToolSelector({
  tools,
  selectedToolIds,
  onToggle,
}: {
  tools: AITool[];
  selectedToolIds: string[];
  onToggle: (toolId: string) => void;
}) {
  // Calculate combined multiplier
  const combinedMultiplier = useMemo(() => {
    if (selectedToolIds.length === 0) return 1;
    // Use highest multiplier, not product
    const selectedTools = tools.filter((t) => selectedToolIds.includes(t.id));
    return Math.max(...selectedTools.map((t) => t.multiplier), 1);
  }, [selectedToolIds, tools]);

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Bot size={16} color="#a855f7" />
          <Text className="text-white font-semibold text-sm ml-2">AI Productivity Boost</Text>
        </View>
        {combinedMultiplier > 1 && (
          <View className="bg-purple-500/20 px-2 py-1 rounded-lg flex-row items-center">
            <Zap size={12} color="#a855f7" />
            <Text className="text-purple-400 font-bold text-sm ml-1">{combinedMultiplier}x</Text>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {tools
            .filter((t) => t.id !== 'none')
            .map((tool) => {
              const isSelected = selectedToolIds.includes(tool.id);
              return (
                <Pressable
                  key={tool.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onToggle(tool.id);
                  }}
                  className={`px-4 py-3 rounded-xl min-w-[120px] ${
                    isSelected
                      ? 'bg-purple-600 border-2 border-purple-400'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {tool.name}
                    </Text>
                    <View className="bg-slate-900/50 px-1.5 py-0.5 rounded">
                      <Text className={`text-xs font-bold ${isSelected ? 'text-purple-300' : 'text-slate-400'}`}>
                        {tool.multiplier}x
                      </Text>
                    </View>
                  </View>
                  <Text className={`text-xs ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                    £{tool.costPerSquare}/TU
                  </Text>
                </Pressable>
              );
            })}
        </View>
      </ScrollView>
    </View>
  );
}

export function TaskAllocationModal({
  visible,
  onClose,
  workPlan,
  workspaceId,
  onComplete,
  onAbandon,
}: TaskAllocationModalProps) {
  const updateWorkPlan = useWorkPlanStore((s) => s.updateWorkPlan);
  const orgMembers = useOrganizationStore((s) => s.members);

  // Local state for editing
  const [totalTUs, setTotalTUs] = useState(workPlan?.estimatedTimeUnits || 10);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [selectedAITools, setSelectedAITools] = useState<string[]>([]);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [abandonReason, setAbandonReason] = useState('');

  // Reset state when workPlan changes
  useMemo(() => {
    if (workPlan) {
      setTotalTUs(workPlan.estimatedTimeUnits);
      // Initialize allocations from workPlan
      const initialAllocations: Record<string, number> = {};
      (workPlan.assignedMemberIds || []).forEach((memberId) => {
        initialAllocations[memberId] = workPlan.allocatedTimeUnitsPerWeek
          ? Math.ceil(workPlan.allocatedTimeUnitsPerWeek / (workPlan.assignedMemberIds?.length || 1))
          : 2;
      });
      setAllocations(initialAllocations);
      setSelectedAITools([]);
    }
  }, [workPlan?.id]);

  // Get active team members
  const activeMembers = useMemo(() => {
    return orgMembers.filter((m) => m.status === 'active');
  }, [orgMembers]);

  // Group members by role
  const groupedMembers = useMemo(() => {
    const founders = activeMembers.filter((m) => m.role === 'Founder');
    const executives = activeMembers.filter((m) => m.role === 'FractionalExec');
    const apprentices = activeMembers.filter((m) => m.role === 'Apprentice');
    return { founders, executives, apprentices };
  }, [activeMembers]);

  // Check if member is recommended for this task
  const isRecommendedMember = useCallback(
    (member: OrganizationMember) => {
      if (!workPlan) return false;
      const taskFunction = workPlan.function;
      const memberFunction = member.function;
      // Recommended if function matches or member is general purpose
      return memberFunction === taskFunction || memberFunction === 'General' || memberFunction === 'Admin';
    },
    [workPlan]
  );

  // Calculate AI multiplier
  const aiMultiplier = useMemo(() => {
    if (selectedAITools.length === 0) return 1;
    const tools = DEFAULT_AI_TOOLS.filter((t) => selectedAITools.includes(t.id));
    return Math.max(...tools.map((t) => t.multiplier), 1);
  }, [selectedAITools]);

  // Calculate effective TUs
  const effectiveTUs = Math.ceil(totalTUs / aiMultiplier);

  // Calculate total allocated TUs per week
  const totalAllocatedPerWeek = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  // Calculate costs
  const costCalculation = useMemo(() => {
    let personCostPerWeek = 0;
    let totalPersonCost = 0;

    Object.entries(allocations).forEach(([memberId, squares]) => {
      const member = activeMembers.find((m) => m.id === memberId);
      if (member && squares > 0) {
        const costPerSquare = (member.costPerDay || 0) / 2;
        personCostPerWeek += squares * costPerSquare;
      }
    });

    // AI cost
    const aiCostPerSquare = selectedAITools.reduce((sum, toolId) => {
      const tool = DEFAULT_AI_TOOLS.find((t) => t.id === toolId);
      return sum + (tool?.costPerSquare || 0);
    }, 0);
    const totalAICost = effectiveTUs * aiCostPerSquare;

    // Weeks to complete
    const remainingTUs = effectiveTUs - Math.round((workPlan?.progress || 0 / 100) * effectiveTUs);
    const weeksToComplete = totalAllocatedPerWeek > 0 ? Math.ceil(remainingTUs / totalAllocatedPerWeek) : Infinity;

    // Total cost
    totalPersonCost = personCostPerWeek * weeksToComplete;
    const totalCost = totalPersonCost + totalAICost;

    // Days to complete (assuming TUs per day based on allocation)
    const daysToComplete =
      weeksToComplete !== Infinity ? weeksToComplete * 5 : 0; // 5 working days per week

    return {
      personCostPerWeek: Math.round(personCostPerWeek),
      aiCostPerSquare,
      totalAICost: Math.round(totalAICost),
      totalCost: Math.round(totalCost),
      weeksToComplete,
      daysToComplete,
      remainingTUs,
    };
  }, [allocations, selectedAITools, effectiveTUs, totalAllocatedPerWeek, workPlan, activeMembers]);

  // Calculate spent TUs and cost so far
  const spentCalculation = useMemo(() => {
    if (!workPlan) return { tusSpent: 0, costSpent: 0 };
    const tusSpent = Math.round((workPlan.progress / 100) * totalTUs);
    // Estimate cost spent based on progress
    const costSpent = Math.round((workPlan.progress / 100) * costCalculation.totalCost);
    return { tusSpent, costSpent };
  }, [workPlan, totalTUs, costCalculation.totalCost]);

  // Handle allocation change
  const handleAllocationChange = (memberId: string, squares: number) => {
    setAllocations((prev) => {
      if (squares <= 0) {
        const { [memberId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [memberId]: squares };
    });
  };

  // Handle AI tool toggle
  const handleAIToggle = (toolId: string) => {
    setSelectedAITools((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId);
      }
      return [...prev, toolId];
    });
  };

  // Save changes
  const handleSave = () => {
    if (!workPlan) return;

    const assignedMemberIds = Object.keys(allocations).filter((id) => allocations[id] > 0);

    updateWorkPlan(workPlan.id, {
      estimatedTimeUnits: totalTUs,
      allocatedTimeUnitsPerWeek: totalAllocatedPerWeek,
      assignedMemberIds,
      status: assignedMemberIds.length > 0 ? 'in-progress' : 'not-started',
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  // Handle complete
  const handleComplete = () => {
    if (!workPlan || !onComplete) return;
    onComplete(workPlan.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  // Handle abandon
  const handleAbandon = () => {
    if (!workPlan || !onAbandon) return;
    onAbandon(workPlan.id, abandonReason);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowAbandonConfirm(false);
    onClose();
  };

  // Get member's available squares
  const getMemberAvailability = (member: OrganizationMember) => {
    const baseSquares = member.role === 'FractionalExec' ? (member.daysPerWeek || 2) * 2 : 10;
    // In reality, subtract squares allocated to other tasks
    // For now, use baseSquares as max
    return baseSquares - (allocations[member.id] || 0);
  };

  if (!visible || !workPlan) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/80">
        <Animated.View entering={SlideInDown.springify()} className="flex-1 bg-slate-900 mt-12 rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-start justify-between px-5 py-4 border-b border-slate-800">
            <View className="flex-1 mr-4">
              <View className="flex-row items-center mb-1">
                <View className="bg-purple-500/20 px-2 py-0.5 rounded mr-2">
                  <Text className="text-purple-400 text-xs font-semibold">{workPlan.function}</Text>
                </View>
                <View
                  className={`px-2 py-0.5 rounded ${
                    workPlan.status === 'completed'
                      ? 'bg-emerald-500/20'
                      : workPlan.status === 'in-progress'
                        ? 'bg-blue-500/20'
                        : 'bg-slate-700'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      workPlan.status === 'completed'
                        ? 'text-emerald-400'
                        : workPlan.status === 'in-progress'
                          ? 'text-blue-400'
                          : 'text-slate-400'
                    }`}
                  >
                    {workPlan.status}
                  </Text>
                </View>
              </View>
              <Text className="text-white font-bold text-lg" numberOfLines={2}>
                {workPlan.title}
              </Text>
              {workPlan.description && (
                <Text className="text-slate-400 text-sm mt-1" numberOfLines={2}>
                  {workPlan.description}
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center">
              <X size={20} color="#fff" />
            </Pressable>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* TU Estimation Section */}
            <View className="px-5 py-4 border-b border-slate-800">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Target size={16} color="#f59e0b" />
                  <Text className="text-white font-semibold text-sm ml-2">Total Time Units Required</Text>
                </View>
                <Text className="text-slate-400 text-xs">1 TU = 4 hours</Text>
              </View>

              <View className="flex-row items-center justify-center gap-4">
                <TUAdjustButton direction="down" onPress={() => setTotalTUs(Math.max(1, totalTUs - 1))} disabled={totalTUs <= 1} />

                <View className="bg-slate-800 px-6 py-3 rounded-xl items-center min-w-[120px]">
                  <Text className="text-white font-bold text-3xl">{totalTUs}</Text>
                  <Text className="text-slate-400 text-xs">TUs total</Text>
                </View>

                <TUAdjustButton direction="up" onPress={() => setTotalTUs(totalTUs + 1)} />
              </View>

              {aiMultiplier > 1 && (
                <View className="mt-3 bg-purple-500/10 rounded-lg p-3 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Zap size={14} color="#a855f7" />
                    <Text className="text-purple-400 text-sm ml-2">With {aiMultiplier}x AI boost:</Text>
                  </View>
                  <Text className="text-white font-bold">{effectiveTUs} effective TUs</Text>
                </View>
              )}
            </View>

            {/* AI Tools Section */}
            <View className="px-5 py-4 border-b border-slate-800">
              <AIToolSelector tools={DEFAULT_AI_TOOLS} selectedToolIds={selectedAITools} onToggle={handleAIToggle} />
            </View>

            {/* Team Allocation Section */}
            <View className="px-5 py-4 border-b border-slate-800">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Users size={16} color="#3b82f6" />
                  <Text className="text-white font-semibold text-sm ml-2">Allocate Team TUs</Text>
                </View>
                <View className="bg-blue-500/20 px-2 py-1 rounded">
                  <Text className="text-blue-400 font-bold text-sm">{totalAllocatedPerWeek} TU/wk</Text>
                </View>
              </View>

              <Text className="text-slate-400 text-xs mb-3">
                Tap squares to allocate. Members with matching skills are marked with FIT.
              </Text>

              {/* Founders */}
              {groupedMembers.founders.length > 0 && (
                <View className="mb-2">
                  <Text className="text-purple-400 text-xs font-bold mb-2">FOUNDERS</Text>
                  {groupedMembers.founders.map((member) => (
                    <PersonAllocationRow
                      key={member.id}
                      member={member}
                      currentAllocation={allocations[member.id] || 0}
                      maxAvailable={getMemberAvailability(member)}
                      costPerSquare={(member.costPerDay || 0) / 2}
                      onAllocationChange={(squares) => handleAllocationChange(member.id, squares)}
                      isRecommended={isRecommendedMember(member)}
                    />
                  ))}
                </View>
              )}

              {/* Executives */}
              {groupedMembers.executives.length > 0 && (
                <View className="mb-2">
                  <Text className="text-blue-400 text-xs font-bold mb-2">EXECUTIVES</Text>
                  {groupedMembers.executives.map((member) => (
                    <PersonAllocationRow
                      key={member.id}
                      member={member}
                      currentAllocation={allocations[member.id] || 0}
                      maxAvailable={getMemberAvailability(member)}
                      costPerSquare={(member.costPerDay || 0) / 2}
                      onAllocationChange={(squares) => handleAllocationChange(member.id, squares)}
                      isRecommended={isRecommendedMember(member)}
                    />
                  ))}
                </View>
              )}

              {/* Apprentices */}
              {groupedMembers.apprentices.length > 0 && (
                <View className="mb-2">
                  <Text className="text-emerald-400 text-xs font-bold mb-2">APPRENTICES</Text>
                  {groupedMembers.apprentices.map((member) => (
                    <PersonAllocationRow
                      key={member.id}
                      member={member}
                      currentAllocation={allocations[member.id] || 0}
                      maxAvailable={getMemberAvailability(member)}
                      costPerSquare={(member.costPerDay || 0) / 2}
                      onAllocationChange={(squares) => handleAllocationChange(member.id, squares)}
                      isRecommended={isRecommendedMember(member)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Cost & Timeline Summary */}
            <View className="px-5 py-4 border-b border-slate-800">
              <Text className="text-white font-semibold text-sm mb-3">Cost & Timeline Summary</Text>

              <View className="bg-slate-800 rounded-xl p-4">
                {/* Cumulative Cost */}
                <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-slate-700">
                  <View className="flex-row items-center">
                    <DollarSign size={16} color="#10b981" />
                    <Text className="text-slate-300 text-sm ml-2">Total Estimated Cost</Text>
                  </View>
                  <Text className="text-white font-bold text-lg">£{costCalculation.totalCost.toLocaleString()}</Text>
                </View>

                {/* Weekly Cost */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-400 text-sm">Cost per week</Text>
                  <Text className="text-slate-200 font-semibold">£{costCalculation.personCostPerWeek.toLocaleString()}/wk</Text>
                </View>

                {/* AI Cost */}
                {costCalculation.totalAICost > 0 && (
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-slate-400 text-sm">AI cost (total)</Text>
                    <Text className="text-purple-400 font-semibold">£{costCalculation.totalAICost.toLocaleString()}</Text>
                  </View>
                )}

                {/* Time to Complete */}
                <View className="flex-row items-center justify-between mb-3 pt-3 border-t border-slate-700">
                  <View className="flex-row items-center">
                    <Clock size={16} color="#f59e0b" />
                    <Text className="text-slate-300 text-sm ml-2">Time to Complete</Text>
                  </View>
                  <Text className="text-white font-bold">
                    {costCalculation.weeksToComplete === Infinity
                      ? 'No allocation'
                      : `${costCalculation.weeksToComplete} week${costCalculation.weeksToComplete !== 1 ? 's' : ''}`}
                  </Text>
                </View>

                {/* TUs Remaining */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-400 text-sm">TUs remaining</Text>
                  <Text className="text-slate-200 font-semibold">
                    {costCalculation.remainingTUs} of {effectiveTUs} TUs
                  </Text>
                </View>

                {/* Progress (if any) */}
                {workPlan.progress > 0 && (
                  <View className="mt-3 pt-3 border-t border-slate-700">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-slate-400 text-sm">TUs Spent</Text>
                      <Text className="text-emerald-400 font-semibold">{spentCalculation.tusSpent} TUs</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-slate-400 text-sm">Cost to Date</Text>
                      <Text className="text-emerald-400 font-semibold">~£{spentCalculation.costSpent.toLocaleString()}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Warning if no allocation */}
              {totalAllocatedPerWeek === 0 && (
                <View className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex-row items-center">
                  <AlertTriangle size={16} color="#f59e0b" />
                  <Text className="text-amber-400 text-sm ml-2 flex-1">
                    No TUs allocated. This task won't progress until team members are assigned.
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="px-5 py-4 gap-3">
              {/* Save Button */}
              <Pressable
                onPress={handleSave}
                className="bg-purple-600 rounded-xl py-4 flex-row items-center justify-center active:bg-purple-700"
              >
                <CheckCircle size={18} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">Save Allocation</Text>
              </Pressable>

              {/* Complete / Abandon row */}
              <View className="flex-row gap-3">
                {workPlan.progress > 0 && onComplete && (
                  <Pressable
                    onPress={handleComplete}
                    className="flex-1 bg-emerald-600 rounded-xl py-3 flex-row items-center justify-center active:bg-emerald-700"
                  >
                    <CheckCircle size={16} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Mark Complete</Text>
                  </Pressable>
                )}

                {onAbandon && (
                  <Pressable
                    onPress={() => setShowAbandonConfirm(true)}
                    className={`${workPlan.progress > 0 && onComplete ? 'flex-1' : 'flex-1'} bg-slate-700 rounded-xl py-3 flex-row items-center justify-center active:bg-slate-600`}
                  >
                    <X size={16} color="#ef4444" />
                    <Text className="text-red-400 font-semibold ml-2">Abandon Task</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Bottom padding */}
            <View className="h-10" />
          </ScrollView>

          {/* Abandon Confirmation Modal */}
          <Modal visible={showAbandonConfirm} transparent animationType="fade" onRequestClose={() => setShowAbandonConfirm(false)}>
            <Pressable className="flex-1 bg-black/70 items-center justify-center" onPress={() => setShowAbandonConfirm(false)}>
              <Pressable
                onPress={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-2xl p-5 mx-6 w-[90%] max-w-[400px]"
              >
                <View className="flex-row items-center mb-4">
                  <AlertCircle size={24} color="#ef4444" />
                  <Text className="text-white font-bold text-lg ml-2">Abandon Task?</Text>
                </View>

                <Text className="text-slate-300 text-sm mb-4">
                  This will move the task to the incomplete list.
                  {spentCalculation.tusSpent > 0 && (
                    <Text className="text-red-400">
                      {' '}
                      {spentCalculation.tusSpent} TUs (~£{spentCalculation.costSpent.toLocaleString()}) have already been spent.
                    </Text>
                  )}
                </Text>

                <TextInput
                  value={abandonReason}
                  onChangeText={setAbandonReason}
                  placeholder="Reason for abandoning (optional)"
                  placeholderTextColor="#64748b"
                  className="bg-slate-700 text-white rounded-lg px-4 py-3 mb-4"
                  multiline
                />

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowAbandonConfirm(false)}
                    className="flex-1 bg-slate-700 rounded-lg py-3 items-center active:bg-slate-600"
                  >
                    <Text className="text-white font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleAbandon} className="flex-1 bg-red-600 rounded-lg py-3 items-center active:bg-red-700">
                    <Text className="text-white font-semibold">Abandon</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </Animated.View>
      </View>
    </Modal>
  );
}
