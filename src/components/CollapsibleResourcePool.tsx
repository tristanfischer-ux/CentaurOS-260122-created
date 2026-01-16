import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { ChevronUp, ChevronDown, Users } from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useFinanceStore } from '@/lib/state/finance-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { PersonDetailsModal } from './PersonDetailsModal';

interface CollapsibleResourcePoolProps {
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

export function CollapsibleResourcePool({ selectedPersonId, onPersonSelect }: CollapsibleResourcePoolProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const screenHeight = Dimensions.get('window').height;

  // Select raw arrays, then filter with useMemo to avoid infinite loop
  const allMembers = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const currentWorkspace = useCurrentWorkspace();
  const getCashBalance = useFinanceStore(s => s.getCashBalance);

  // Modal state
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  // Calculate heights
  const COLLAPSED_HEIGHT = 52; // Just the tab
  const EXPANDED_HEIGHT = screenHeight * 0.5; // 50% of screen

  // Animated height
  const height = useSharedValue(COLLAPSED_HEIGHT);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(height.value, {
        damping: 20,
        stiffness: 90,
      }),
    };
  });

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    height.value = newExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
  };

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
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderBottomWidth: 2,
          borderBottomColor: '#e5e7eb',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
          zIndex: 100,
        }
      ]}
      className="dark:bg-slate-900 dark:border-slate-700"
    >
      {/* Tab Header - Always Visible */}
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-800"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full items-center justify-center">
            <Users size={18} color="#8b5cf6" />
          </View>
          <View>
            <Text className="text-gray-900 dark:text-white text-sm font-bold">
              Weekly Resource Pool
            </Text>
            <Text className="text-gray-500 dark:text-slate-400 text-xs">
              {members.length} team member{members.length !== 1 ? 's' : ''} • {totalUnallocated} TU available
            </Text>
          </View>
        </View>

        {/* Expand/Collapse Indicator */}
        <View className="flex-row items-center gap-2">
          {!isExpanded && (
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-sm bg-emerald-400" />
              <View className="w-2 h-2 rounded-sm bg-red-400" />
              <View className="w-2 h-2 rounded-sm bg-amber-300" />
            </View>
          )}
          <View className="w-6 h-6 bg-gray-100 dark:bg-slate-800 rounded-full items-center justify-center">
            {isExpanded ? (
              <ChevronUp size={16} color="#6b7280" />
            ) : (
              <ChevronDown size={16} color="#6b7280" />
            )}
          </View>
        </View>
      </Pressable>

      {/* Resource Pool Content - Only visible when expanded */}
      {isExpanded && (
        <View className="flex-1">
          {/* Financial Summary Header */}
          <View className="px-4 py-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <View className="flex-row items-center justify-between">
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
            <View className="flex-row items-center gap-3 mt-2">
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

          {/* Resource List - Vertical scroll */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={true}
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
                  onLongPress={() => {
                    setSelectedMember(member);
                    setShowPersonModal(true);
                  }}
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
              <View className="w-2.5 h-2.5 rounded-sm border bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700" />
              <Text className="text-gray-600 dark:text-slate-400 text-[9px]">Avail</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2.5 h-2.5 rounded-sm border bg-red-500 border-red-600" />
              <Text className="text-gray-600 dark:text-slate-400 text-[9px]">Alloc</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2.5 h-2.5 rounded-sm border bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700" />
              <Text className="text-gray-600 dark:text-slate-400 text-[9px]">OT</Text>
            </View>
          </View>
        </View>
      )}

      {/* Collapsed State Hint */}
      {!isExpanded && (
        <View className="absolute top-full mt-1 left-0 right-0 items-center">
          <View className="w-12 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
        </View>
      )}

      {/* Person Details Modal */}
      <PersonDetailsModal
        visible={showPersonModal}
        onClose={() => {
          setShowPersonModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
      />
    </Animated.View>
  );
}
