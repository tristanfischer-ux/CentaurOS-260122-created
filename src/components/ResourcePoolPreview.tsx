/**
 * ResourcePoolPreview
 *
 * Lightweight preview showing weekly team capacity at a glance
 * Designed to answer: "Are we overloaded this week or not?"
 */

import { View, Text, Pressable } from 'react-native';
import { useMemo } from 'react';
import { Users, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';

interface ResourcePoolPreviewProps {
  onPress: () => void;
}

export function ResourcePoolPreview({ onPress }: ResourcePoolPreviewProps) {
  const members = useOrganizationStore((s) => s.members);
  const workPlans = useWorkPlanStore((s) => s.workPlans);

  const capacityData = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active');

    // Calculate total capacity
    const totalCapacity = activeMembers.reduce((sum, member) => {
      if (member.role === 'Founder' || member.role === 'Apprentice') {
        return sum + 15; // 10 normal + 5 overtime
      }
      const daysPerWeek = member.daysPerWeek || 2;
      const normalSquares = daysPerWeek * 2;
      const overtimeSquares = Math.min((5 - daysPerWeek) * 2, 10);
      return sum + normalSquares + overtimeSquares;
    }, 0);

    // Calculate used capacity
    const usedCapacity = workPlans
      .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
      .reduce((sum, wp) => {
        const totalAllocated = wp.allocations?.reduce((acc, alloc) => acc + (alloc.squaresPerWeek || 0), 0) || 0;
        return sum + totalAllocated;
      }, 0);

    const remaining = totalCapacity - usedCapacity;
    const utilizationPercent = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

    // Determine status
    let status: 'healthy' | 'high' | 'overloaded' = 'healthy';
    let statusColor = '#10b981';
    let statusLabel = 'Capacity Available';
    let statusIcon = CheckCircle2;

    if (utilizationPercent >= 100) {
      status = 'overloaded';
      statusColor = '#ef4444';
      statusLabel = 'Overloaded';
      statusIcon = AlertTriangle;
    } else if (utilizationPercent >= 80) {
      status = 'high';
      statusColor = '#f59e0b';
      statusLabel = 'High Utilization';
      statusIcon = TrendingUp;
    }

    return {
      totalCapacity,
      usedCapacity,
      remaining,
      utilizationPercent,
      status,
      statusColor,
      statusLabel,
      statusIcon,
      teamSize: activeMembers.length,
    };
  }, [members, workPlans]);

  const StatusIcon = capacityData.statusIcon;

  return (
    <Pressable
      onPress={onPress}
      className="mx-5 mb-4 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border-2 active:opacity-90"
      style={{ borderColor: capacityData.statusColor }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <View className="flex-row items-center gap-2">
          <Users size={18} color={capacityData.statusColor} />
          <Text className="text-gray-900 dark:text-white font-bold text-sm">
            Weekly Resource Pool
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: capacityData.statusColor + '20' }}
          >
            <Text className="text-xs font-bold" style={{ color: capacityData.statusColor }}>
              {Math.round(capacityData.utilizationPercent)}%
            </Text>
          </View>
          <ChevronRight size={16} color="#64748b" />
        </View>
      </View>

      {/* Content */}
      <View className="px-4 py-3">
        {/* Status Banner */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <StatusIcon size={16} color={capacityData.statusColor} />
            <Text className="font-bold text-sm" style={{ color: capacityData.statusColor }}>
              {capacityData.statusLabel}
            </Text>
          </View>
          <Text className="text-gray-500 dark:text-slate-400 text-xs">
            {capacityData.teamSize} people
          </Text>
        </View>

        {/* Capacity Bar */}
        <View className="mb-3">
          <View className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(capacityData.utilizationPercent, 100)}%`,
                backgroundColor: capacityData.statusColor,
              }}
            />
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between">
          <View>
            <Text className="text-gray-500 dark:text-slate-400 text-xs">Total Capacity</Text>
            <Text className="text-gray-900 dark:text-white font-bold text-base">
              {capacityData.totalCapacity} TU
            </Text>
          </View>
          <View>
            <Text className="text-gray-500 dark:text-slate-400 text-xs">Used</Text>
            <Text className="font-bold text-base" style={{ color: capacityData.statusColor }}>
              {capacityData.usedCapacity} TU
            </Text>
          </View>
          <View>
            <Text className="text-gray-500 dark:text-slate-400 text-xs">Remaining</Text>
            <Text className="text-gray-900 dark:text-white font-bold text-base">
              {capacityData.remaining} TU
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
