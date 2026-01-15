import { View, Text, Pressable, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useFinanceStore } from '@/lib/state/finance-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';

interface ResourcePoolHeaderProps {
  selectedPersonId: string | null;
  onPersonSelect: (personId: string) => void;
}

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',     // Purple
  FractionalExec: '#3b82f6', // Blue
  Apprentice: '#10b981',  // Green
};

// Calculate TU capacity per week based on role
const getCapacityPerWeek = (member: OrganizationMember): { normal: number; overtime: number } => {
  if (member.role === 'Founder' || member.role === 'Apprentice') {
    return { normal: 10, overtime: 5 }; // 10 normal + 5 overtime = 15 max
  }
  // Fractional exec: days per week * 2 squares per day
  const daysPerWeek = member.daysPerWeek || 2;
  const normalSquares = daysPerWeek * 2; // 2 squares per day
  const overtimeSquares = Math.min((5 - daysPerWeek) * 2, 10); // Can increase up to 5 days max
  return { normal: normalSquares, overtime: overtimeSquares };
};

// Calculate allocated TUs for a person across all tasks
const getAllocatedTUs = (memberId: string, workPlans: WorkPlan[]): number => {
  return workPlans
    .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
    .reduce((total, wp) => {
      const allocation = wp.allocations.find(a => a.memberId === memberId);
      return total + (allocation?.squaresPerWeek || 0);
    }, 0);
};

// Get cost per TU for a member
const getCostPerTU = (member: OrganizationMember): number => {
  if (member.role === 'Founder') {
    // Founders: assume company annual cost divided by working hours
    // Default: £500k annual / 2080 hours * 4 hours per TU ≈ £960 per TU
    return 960;
  } else if (member.role === 'FractionalExec') {
    // Execs: cost per day / 2 TUs per day
    const costPerDay = member.costPerDay || 800;
    return Math.round(costPerDay / 2);
  } else {
    // Apprentices: assume £140/day / 2 TUs per day = £70 per TU
    return 70;
  }
};

export function ResourcePoolHeader({ selectedPersonId, onPersonSelect }: ResourcePoolHeaderProps) {
  // Select raw arrays, then filter with useMemo to avoid infinite loop
  const allMembers = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const currentWorkspace = useCurrentWorkspace();
  const getCashBalance = useFinanceStore(s => s.getCashBalance);

  // Memoize the filtered members to avoid creating new array each render
  const members = useMemo(() =>
    allMembers.filter(m => m.status === 'active'),
    [allMembers]
  );

  // Calculate total allocated and unallocated squares across all members
  const { totalAllocated, totalUnallocated } = useMemo(() => {
    let allocated = 0;
    let total = 0;

    members.forEach((member) => {
      const capacity = getCapacityPerWeek(member);
      const totalCapacity = capacity.normal + capacity.overtime;
      const memberAllocated = getAllocatedTUs(member.id, workPlans);

      allocated += memberAllocated;
      total += totalCapacity;
    });

    return {
      totalAllocated: allocated,
      totalUnallocated: total - allocated,
    };
  }, [members, workPlans]);

  // Calculate weekly cost based on allocated tasks
  const weeklyCost = useMemo(() => {
    let cost = 0;

    members.forEach((member) => {
      const memberAllocated = getAllocatedTUs(member.id, workPlans);
      const costPerTU = getCostPerTU(member);
      cost += memberAllocated * costPerTU;
    });

    return Math.round(cost);
  }, [members, workPlans]);

  // Get cash balance
  const cashBalance = currentWorkspace ? getCashBalance(currentWorkspace.id) : 0;
  const remainingCash = cashBalance - weeklyCost;

  return (
    <View className="bg-white dark:bg-slate-900 border-b-2 border-gray-200 dark:border-slate-700">
      {/* Header */}
      <View className="px-4 pt-2 pb-1.5 border-b border-gray-200 dark:border-slate-700">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-900 dark:text-white text-xs font-bold">
            WEEKLY RESOURCE POOL
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-red-500 mr-1" />
              <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-semibold">
                {totalAllocated} allocated
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
              <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-semibold">
                {totalUnallocated} available
              </Text>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View className="flex-row items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <Text className="text-gray-500 dark:text-slate-500 text-[9px] mr-1">Bank:</Text>
              <Text className="text-gray-900 dark:text-white text-[10px] font-bold">
                £{(cashBalance / 1000).toFixed(0)}k
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-500 dark:text-slate-500 text-[9px] mr-1">Weekly Cost:</Text>
              <Text className="text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                £{(weeklyCost / 1000).toFixed(1)}k
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-500 dark:text-slate-500 text-[9px] mr-1">After Week:</Text>
              <Text className={`text-[10px] font-bold ${remainingCash > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                £{(remainingCash / 1000).toFixed(0)}k
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Resource List - Vertical scroll */}
      <ScrollView
        className="max-h-[280px]"
        showsVerticalScrollIndicator={false}
      >
        {members.map((member) => {
          const capacity = getCapacityPerWeek(member);
          const totalCapacity = capacity.normal + capacity.overtime;
          const allocated = getAllocatedTUs(member.id, workPlans);
          const available = totalCapacity - allocated;
          const isSelected = selectedPersonId === member.id;
          const roleColor = ROLE_COLORS[member.role];
          const costPerTU = getCostPerTU(member);

          // Render 15 squares (capacity.normal + capacity.overtime)
          const squares = [];
          for (let i = 0; i < 15; i++) {
            let squareState: 'hidden' | 'available' | 'overtime-available' | 'allocated' | 'overtime-allocated' = 'hidden';

            if (i < capacity.normal) {
              // Normal capacity squares
              squareState = i < allocated ? 'allocated' : 'available';
            } else if (i < totalCapacity) {
              // Overtime squares
              squareState = i < allocated ? 'overtime-allocated' : 'overtime-available';
            }

            squares.push({
              index: i,
              state: squareState,
            });
          }

          return (
            <Pressable
              key={member.id}
              onPress={() => onPersonSelect(isSelected ? '' : member.id)}
              className={`flex-row items-center px-3 py-1.5 border-b border-gray-100 dark:border-slate-800 active:bg-gray-50 dark:active:bg-slate-800 ${
                isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
              }`}
            >
              {/* Left: Name, Role, and Cost */}
              <View className="w-24 mr-2">
                <View className="flex-row items-center gap-1.5">
                  {/* Initials circle - smaller */}
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: roleColor + '20' }}
                  >
                    <Text className="font-bold text-[9px]" style={{ color: roleColor }}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>

                  {/* Name - compact */}
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-[11px] font-semibold" numberOfLines={1}>
                      {member.name.split(' ')[0]}
                    </Text>
                    {/* Role and cost on same line */}
                    <Text className="text-[8px] text-gray-500 dark:text-slate-500">
                      {member.role === 'FractionalExec' ? 'Exec' : member.role.slice(0, 4)} • £{costPerTU}/TU
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right: TU Squares Grid - more compact */}
              <View className="flex-1 flex-row items-center">
                {squares.map((square) => {
                  if (square.state === 'hidden') {
                    return <View key={square.index} className="w-4 h-4 mr-0.5" />;
                  }

                  let bgColor = 'bg-gray-200 dark:bg-slate-700'; // available
                  let borderColor = 'border-gray-300 dark:border-slate-600';

                  if (square.state === 'allocated') {
                    bgColor = 'bg-red-500';
                    borderColor = 'border-red-600';
                  } else if (square.state === 'overtime-available') {
                    bgColor = 'bg-amber-100 dark:bg-amber-900/30';
                    borderColor = 'border-amber-300 dark:border-amber-700';
                  } else if (square.state === 'overtime-allocated') {
                    bgColor = 'bg-orange-500';
                    borderColor = 'border-orange-600';
                  } else if (square.state === 'available') {
                    bgColor = 'bg-emerald-100 dark:bg-emerald-900/30';
                    borderColor = 'border-emerald-300 dark:border-emerald-700';
                  }

                  return (
                    <View
                      key={square.index}
                      className={`w-4 h-4 rounded-sm border mr-0.5 ${bgColor} ${borderColor}`}
                    />
                  );
                })}

                {/* Available count - compact */}
                <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-semibold ml-1">
                  {available}/{totalCapacity}
                </Text>
              </View>

              {/* Selection indicator */}
              {isSelected && (
                <View className="w-1.5 h-1.5 rounded-full bg-purple-500 ml-1" />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Legend - compact */}
      <View className="px-4 py-1.5 border-t border-gray-200 dark:border-slate-700 flex-row items-center justify-end gap-3">
        <View className="flex-row items-center gap-1">
          <View className="w-2.5 h-2.5 rounded-sm border bg-emerald-100 border-emerald-300" />
          <Text className="text-gray-600 dark:text-slate-400 text-[9px]">Avail</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-2.5 h-2.5 rounded-sm border bg-red-500 border-red-600" />
          <Text className="text-gray-600 dark:text-slate-400 text-[9px]">Alloc</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-2.5 h-2.5 rounded-sm border bg-amber-100 border-amber-300" />
          <Text className="text-gray-600 dark:text-slate-400 text-[9px]">OT</Text>
        </View>
      </View>
    </View>
  );
}
