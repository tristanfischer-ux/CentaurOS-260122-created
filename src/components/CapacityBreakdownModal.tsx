/**
 * CapacityBreakdownModal Component
 *
 * Shows detailed breakdown of team capacity units:
 * - List of all team members
 * - Their capacity utilization
 * - Which units have spare capacity
 * - Which individuals are stretched
 */

import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { X, User, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react-native';
import { cn } from '@/lib/cn';
import type { MemberCapacityView } from '@/lib/state/capacity-store';

interface CapacityBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  memberCapacities: MemberCapacityView[];
  totalAvailableTU: number;
}

export function CapacityBreakdownModal({
  visible,
  onClose,
  memberCapacities,
  totalAvailableTU,
}: CapacityBreakdownModalProps) {
  // Sort members: stretched first, then by utilization (high to low)
  const sortedMembers = [...memberCapacities].sort((a, b) => {
    if (a.isStretched && !b.isStretched) return -1;
    if (!a.isStretched && b.isStretched) return 1;
    return b.utilizationPct - a.utilizationPct;
  });

  // Group members by status
  const stretchedMembers = sortedMembers.filter(m => m.isStretched);
  const fullyAllocated = sortedMembers.filter(m => !m.isStretched && m.utilizationPct >= 85);
  const available = sortedMembers.filter(m => m.utilizationPct < 85);

  const getMemberStatusColor = (member: MemberCapacityView) => {
    if (member.isStretched) return '#ef4444'; // Red
    if (member.utilizationPct >= 85) return '#f59e0b'; // Amber
    if (member.utilizationPct >= 50) return '#10b981'; // Emerald
    return '#64748b'; // Gray
  };

  const getMemberStatusIcon = (member: MemberCapacityView) => {
    if (member.isStretched) return AlertTriangle;
    if (member.utilizationPct >= 85) return TrendingUp;
    return CheckCircle2;
  };

  const getRoleColor = (role: string) => {
    if (role === 'Founder') return '#8b5cf6';
    if (role === 'FractionalExec') return '#3b82f6';
    return '#10b981';
  };

  const renderMemberCard = (member: MemberCapacityView) => {
    const statusColor = getMemberStatusColor(member);
    const StatusIcon = getMemberStatusIcon(member);
    const roleColor = getRoleColor(member.role);

    return (
      <View
        key={member.memberId}
        className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 mb-3"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: roleColor + '20' }}
            >
              <User size={18} color={roleColor} />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                {member.name}
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-xs">
                {member.function} • {member.role === 'FractionalExec' ? 'Executive' : member.role}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <View className="flex-row items-center">
              <StatusIcon size={14} color={statusColor} />
              <Text
                className="font-bold text-base ml-1"
                style={{ color: statusColor }}
              >
                {member.utilizationPct}%
              </Text>
            </View>
          </View>
        </View>

        {/* Capacity bar */}
        <View className="mb-2">
          <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, member.utilizationPct)}%`,
                backgroundColor: statusColor,
              }}
            />
          </View>
        </View>

        {/* Stats row */}
        <View className="flex-row justify-between">
          <View>
            <Text className="text-gray-500 dark:text-slate-400 text-xs">Allocated</Text>
            <Text className="text-gray-900 dark:text-white font-semibold text-sm">
              {member.allocatedTimeUnits}□
            </Text>
          </View>
          <View>
            <Text className="text-gray-500 dark:text-slate-400 text-xs">Available</Text>
            <Text className="text-gray-900 dark:text-white font-semibold text-sm">
              {member.availableTimeUnits}□
            </Text>
          </View>
          <View>
            <Text className="text-gray-500 dark:text-slate-400 text-xs">Capacity</Text>
            <Text className="text-gray-900 dark:text-white font-semibold text-sm">
              {member.baseTimeUnitsPerWeek}□/wk
            </Text>
          </View>
          {member.aiMultiplier > 1 && (
            <View>
              <Text className="text-gray-500 dark:text-slate-400 text-xs">AI Boost</Text>
              <Text className="text-blue-500 font-semibold text-sm">
                {member.aiMultiplier.toFixed(1)}x
              </Text>
            </View>
          )}
        </View>

        {/* Warning message if stretched */}
        {member.isStretched && (
          <View className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
            <Text className="text-red-500 text-xs font-medium">
              ⚠️ Stretched beyond normal capacity
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-slate-950 rounded-t-3xl max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
            <View>
              <Text className="text-gray-900 dark:text-white font-bold text-xl">
                Team Capacity Breakdown
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                {totalAvailableTU}□ available across {memberCapacities.length} team members
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-9 h-9 bg-gray-100 dark:bg-slate-900 rounded-full items-center justify-center active:opacity-70"
            >
              <X size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            {/* Summary stats */}
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                <Text className="text-red-600 dark:text-red-400 text-xs font-medium">
                  Stretched
                </Text>
                <Text className="text-red-600 dark:text-red-400 font-bold text-2xl mt-1">
                  {stretchedMembers.length}
                </Text>
              </View>
              <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                <Text className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                  Fully Allocated
                </Text>
                <Text className="text-amber-600 dark:text-amber-400 font-bold text-2xl mt-1">
                  {fullyAllocated.length}
                </Text>
              </View>
              <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  Available
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-2xl mt-1">
                  {available.length}
                </Text>
              </View>
            </View>

            {/* Stretched members section */}
            {stretchedMembers.length > 0 && (
              <View className="mb-5">
                <View className="flex-row items-center mb-3">
                  <AlertTriangle size={16} color="#ef4444" />
                  <Text className="text-gray-900 dark:text-white font-bold text-sm ml-2">
                    Stretched Beyond Capacity
                  </Text>
                </View>
                {stretchedMembers.map(renderMemberCard)}
              </View>
            )}

            {/* Fully allocated members */}
            {fullyAllocated.length > 0 && (
              <View className="mb-5">
                <Text className="text-gray-900 dark:text-white font-bold text-sm mb-3">
                  Fully Allocated (85%+)
                </Text>
                {fullyAllocated.map(renderMemberCard)}
              </View>
            )}

            {/* Available members */}
            {available.length > 0 && (
              <View className="mb-5">
                <Text className="text-gray-900 dark:text-white font-bold text-sm mb-3">
                  Available Capacity
                </Text>
                {available.map(renderMemberCard)}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
