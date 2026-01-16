/**
 * TeamCapacityDashboard
 * Visual dashboard showing team utilization with gauge, individual capacity cards, and spare capacity
 */

import { View, Text, Pressable, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  ChevronRight,
  User,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useCurrentMembership } from '@/lib/state/app-store';
import { filterTeamMembersByRole } from '@/lib/role-utils';

interface GaugeProps {
  percentage: number;
  size?: number;
}

function UtilizationGauge({ percentage, size = 120 }: GaugeProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on utilization
  const getColor = () => {
    if (percentage >= 90) return '#ef4444'; // Red - overallocated
    if (percentage >= 70) return '#f59e0b'; // Yellow - busy
    return '#10b981'; // Green - healthy
  };

  const getLabel = () => {
    if (percentage >= 90) return 'Overallocated';
    if (percentage >= 70) return 'Busy';
    return 'Healthy';
  };

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Percentage text */}
        <SvgText
          x={size / 2}
          y={size / 2 - 5}
          fontSize="28"
          fontWeight="bold"
          fill={getColor()}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {Math.round(percentage)}%
        </SvgText>
        <SvgText
          x={size / 2}
          y={size / 2 + 18}
          fontSize="10"
          fill="#64748b"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {getLabel()}
        </SvgText>
      </Svg>
    </View>
  );
}

interface MemberCapacityCardProps {
  member: {
    id: string;
    name: string;
    role: string;
    allocated: number;
    capacity: number;
    utilization: number;
    available: number;
  };
  index: number;
}

function MemberCapacityCard({ member, index }: MemberCapacityCardProps) {
  const getUtilColor = () => {
    if (member.utilization >= 100) return '#ef4444';
    if (member.utilization >= 80) return '#f59e0b';
    return '#10b981';
  };

  const getRoleColor = () => {
    switch (member.role) {
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

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      className="bg-white dark:bg-slate-800 rounded-xl p-3 mr-3 border border-slate-200 dark:border-slate-700"
      style={{ width: 140 }}
    >
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-2">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: getRoleColor() + '20' }}
        >
          <Text style={{ color: getRoleColor() }} className="font-bold text-xs">
            {member.name.split(' ').map((n) => n[0]).join('')}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-slate-900 dark:text-white font-semibold text-xs" numberOfLines={1}>
            {member.name.split(' ')[0]}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-[10px]">
            {member.role === 'FractionalExec' ? 'Executive' : member.role}
          </Text>
        </View>
      </View>

      {/* Utilization Bar */}
      <View className="mb-2">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-slate-500 dark:text-slate-400 text-[10px]">Utilization</Text>
          <Text className="font-bold text-xs" style={{ color: getUtilColor() }}>
            {Math.round(member.utilization)}%
          </Text>
        </View>
        <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(member.utilization, 100)}%`,
              backgroundColor: getUtilColor(),
            }}
          />
        </View>
      </View>

      {/* Capacity Info */}
      <View className="flex-row justify-between">
        <View>
          <Text className="text-slate-500 dark:text-slate-400 text-[10px]">Allocated</Text>
          <Text className="text-slate-900 dark:text-white font-bold text-xs">
            {member.allocated} TU
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-slate-500 dark:text-slate-400 text-[10px]">Available</Text>
          <Text
            className="font-bold text-xs"
            style={{ color: member.available > 0 ? '#10b981' : '#ef4444' }}
          >
            {member.available} TU
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export function TeamCapacityDashboard() {
  const router = useRouter();
  const members = useOrganizationStore((s) => s.members);
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const currentMembership = useCurrentMembership();

  // Apply role-based filtering for team members
  const roleFilteredMembers = useMemo(() => {
    const activeMembers = members.filter((m) => m.status === 'active');
    if (!currentMembership?.role) return activeMembers;
    return filterTeamMembersByRole(
      activeMembers,
      currentMembership.role,
      currentMembership.function,
      currentMembership.id
    );
  }, [members, currentMembership]);

  // Calculate team capacity metrics from role-filtered members
  const capacityData = useMemo(() => {
    const memberData = roleFilteredMembers.map((member) => {
      // Calculate capacity
      const capacity =
        member.role === 'Founder' || member.role === 'Apprentice'
          ? 10 // Base capacity (excluding overtime for cleaner display)
          : (member.daysPerWeek || 2) * 2;

      // Calculate allocated from work plans
      const allocated = workPlans
        .filter(
          (wp) =>
            wp.status !== 'completed' &&
            wp.status !== 'abandoned' &&
            wp.assignedMemberIds?.includes(member.id)
        )
        .reduce((sum, wp) => {
          const allocation = wp.allocations?.find((a) => a.memberId === member.id);
          return sum + (allocation?.squaresPerWeek || 0);
        }, 0);

      const utilization = capacity > 0 ? (allocated / capacity) * 100 : 0;
      const available = Math.max(0, capacity - allocated);

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        allocated,
        capacity,
        utilization,
        available,
      };
    });

    // Calculate totals
    const totalCapacity = memberData.reduce((sum, m) => sum + m.capacity, 0);
    const totalAllocated = memberData.reduce((sum, m) => sum + m.allocated, 0);
    const totalAvailable = memberData.reduce((sum, m) => sum + m.available, 0);
    const overallUtilization = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

    // Sort by availability (most available first) for recommendations
    const sortedByAvailability = [...memberData].sort((a, b) => b.available - a.available);
    const mostAvailable = sortedByAvailability.filter((m) => m.available > 0).slice(0, 3);

    return {
      members: memberData,
      totalCapacity,
      totalAllocated,
      totalAvailable,
      overallUtilization,
      mostAvailable,
    };
  }, [roleFilteredMembers, workPlans]);

  if (capacityData.members.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3 px-5">
        <View className="flex-row items-center gap-2">
          <View className="bg-emerald-500 p-1.5 rounded-lg">
            <Users size={16} color="white" />
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            Team Capacity
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/who')}
          className="flex-row items-center gap-1"
        >
          <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            View Team
          </Text>
          <ChevronRight size={14} color="#10b981" />
        </Pressable>
      </View>

      {/* Main Dashboard Card */}
      <View className="mx-5 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 mb-3">
        <View className="flex-row items-center justify-between">
          {/* Gauge */}
          <UtilizationGauge percentage={capacityData.overallUtilization} />

          {/* Stats */}
          <View className="flex-1 ml-4">
            <View className="mb-3">
              <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">
                Total Capacity
              </Text>
              <Text className="text-slate-900 dark:text-white text-xl font-bold">
                {capacityData.totalCapacity} TU/week
              </Text>
            </View>

            <View className="flex-row gap-4">
              <View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">Allocated</Text>
                <Text className="text-slate-900 dark:text-white font-bold">
                  {capacityData.totalAllocated} TU
                </Text>
              </View>
              <View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">Available</Text>
                <Text className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {capacityData.totalAvailable} TU
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Alert if overallocated */}
        {capacityData.overallUtilization >= 90 && (
          <View className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 flex-row items-center gap-2">
            <AlertTriangle size={14} color="#ef4444" />
            <Text className="text-red-700 dark:text-red-400 text-xs flex-1">
              Team is overallocated. Consider hiring or reallocating work.
            </Text>
          </View>
        )}
      </View>

      {/* Member Cards - Horizontal Scroll */}
      <View className="mb-3">
        <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase mb-2 px-5">
          Capacity by Person
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          style={{ flexGrow: 0 }}
        >
          {capacityData.members.map((member, index) => (
            <MemberCapacityCard key={member.id} member={member} index={index} />
          ))}
        </ScrollView>
      </View>

      {/* Spare Capacity Recommendations */}
      {capacityData.mostAvailable.length > 0 && capacityData.totalAvailable > 0 && (
        <View className="mx-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
          <View className="flex-row items-center gap-2 mb-2">
            <Zap size={14} color="#10b981" />
            <Text className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
              Spare Capacity Available
            </Text>
          </View>
          <Text className="text-emerald-600 dark:text-emerald-400 text-xs mb-2">
            {capacityData.totalAvailable} TU available this week. Recommended for new tasks:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {capacityData.mostAvailable.map((member) => (
              <View
                key={member.id}
                className="bg-white dark:bg-slate-800 rounded-lg px-2 py-1 flex-row items-center gap-1"
              >
                <User size={10} color="#10b981" />
                <Text className="text-slate-700 dark:text-slate-300 text-xs">
                  {member.name.split(' ')[0]}
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  ({member.available} TU)
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
