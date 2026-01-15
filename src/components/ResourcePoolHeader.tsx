import { View, Text, Pressable, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';

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

export function ResourcePoolHeader({ selectedPersonId, onPersonSelect }: ResourcePoolHeaderProps) {
  // Select raw arrays, then filter with useMemo to avoid infinite loop
  const allMembers = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // Memoize the filtered members to avoid creating new array each render
  const members = useMemo(() =>
    allMembers.filter(m => m.status === 'active'),
    [allMembers]
  );

  return (
    <View className="bg-white dark:bg-slate-900 border-b-2 border-gray-200 dark:border-slate-700">
      {/* Header */}
      <View className="px-4 pt-3 pb-2 border-b border-gray-200 dark:border-slate-700">
        <Text className="text-gray-900 dark:text-white text-sm font-bold mb-1">
          RESOURCE POOL
        </Text>
        <Text className="text-gray-500 dark:text-slate-400 text-xs">
          Tap a person, then tap a task to allocate their TUs
        </Text>
      </View>

      {/* Resource List - Vertical scroll */}
      <ScrollView
        className="max-h-[300px]"
        showsVerticalScrollIndicator={false}
      >
        {members.map((member) => {
          const capacity = getCapacityPerWeek(member);
          const totalCapacity = capacity.normal + capacity.overtime;
          const allocated = getAllocatedTUs(member.id, workPlans);
          const available = totalCapacity - allocated;
          const isSelected = selectedPersonId === member.id;
          const roleColor = ROLE_COLORS[member.role];

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
              className={`flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-slate-800 active:bg-gray-50 dark:active:bg-slate-800 ${
                isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
              }`}
            >
              {/* Left: Name and Role */}
              <View className="w-32 mr-3">
                <View className="flex-row items-center gap-2 mb-0.5">
                  {/* Initials circle */}
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: roleColor + '20' }}
                  >
                    <Text className="font-bold text-[10px]" style={{ color: roleColor }}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>

                  {/* Name */}
                  <Text className="text-gray-900 dark:text-white text-sm font-semibold flex-1" numberOfLines={1}>
                    {member.name}
                  </Text>
                </View>

                {/* Role badge */}
                <View
                  className="px-2 py-0.5 rounded-full self-start ml-10"
                  style={{ backgroundColor: roleColor + '15' }}
                >
                  <Text className="text-[9px] font-semibold" style={{ color: roleColor }}>
                    {member.role === 'FractionalExec'
                      ? `Exec (${member.daysPerWeek || 2}d/wk)`
                      : member.role}
                  </Text>
                </View>
              </View>

              {/* Right: TU Squares Grid */}
              <View className="flex-1 flex-row items-center gap-1">
                {squares.map((square) => {
                  if (square.state === 'hidden') {
                    return <View key={square.index} className="w-5 h-5" />;
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
                      className={`w-5 h-5 rounded border ${bgColor} ${borderColor}`}
                    />
                  );
                })}

                {/* Available count */}
                <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold ml-2">
                  {available}/{totalCapacity}
                </Text>
              </View>

              {/* Selection indicator */}
              {isSelected && (
                <View className="w-2 h-2 rounded-full bg-purple-500 ml-2" />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View className="px-4 py-2 border-t border-gray-200 dark:border-slate-700 flex-row items-center justify-end gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded border bg-emerald-100 border-emerald-300" />
          <Text className="text-gray-600 dark:text-slate-400 text-[10px]">Available</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded border bg-red-500 border-red-600" />
          <Text className="text-gray-600 dark:text-slate-400 text-[10px]">Allocated</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded border bg-amber-100 border-amber-300" />
          <Text className="text-gray-600 dark:text-slate-400 text-[10px]">Overtime</Text>
        </View>
      </View>
    </View>
  );
}
