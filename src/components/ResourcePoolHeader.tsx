import { View, Text, Pressable, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { User, Zap } from 'lucide-react-native';
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
const getCapacityPerWeek = (member: OrganizationMember): number => {
  if (member.role === 'Founder' || member.role === 'Apprentice') {
    return 10; // 10 squares per week (40 hours)
  }
  // Fractional exec: days per week * 2 squares per day
  return (member.daysPerWeek || 2) * 2;
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
    <View className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-900 dark:text-white text-sm font-bold">
            RESOURCE POOL
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-emerald-400" />
            <Text className="text-gray-600 dark:text-slate-400 text-xs">
              Available
            </Text>
            <View className="w-2 h-2 rounded-full bg-red-400" />
            <Text className="text-gray-600 dark:text-slate-400 text-xs">
              Allocated
            </Text>
          </View>
        </View>
        <Text className="text-gray-500 dark:text-slate-400 text-xs mb-3">
          Tap a person to select, then tap a task to allocate their TUs
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 pb-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {members.map((member) => {
          const totalCapacity = getCapacityPerWeek(member);
          const allocated = getAllocatedTUs(member.id, workPlans);
          const available = totalCapacity - allocated;
          const isSelected = selectedPersonId === member.id;
          const roleColor = ROLE_COLORS[member.role];

          // Calculate percentage bars
          const allocatedPercent = (allocated / totalCapacity) * 100;
          const availablePercent = (available / totalCapacity) * 100;

          return (
            <Pressable
              key={member.id}
              onPress={() => onPersonSelect(isSelected ? '' : member.id)}
              className={`bg-white dark:bg-slate-800 rounded-xl border-2 p-3 min-w-[140px] active:opacity-70 ${
                isSelected
                  ? 'border-purple-500 dark:border-purple-400 shadow-lg'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            >
              {/* Header with initials */}
              <View className="flex-row items-center justify-between mb-2">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: roleColor + '20' }}
                >
                  <Text className="font-bold text-sm" style={{ color: roleColor }}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                {isSelected && (
                  <View className="w-3 h-3 rounded-full bg-purple-500" />
                )}
              </View>

              {/* Name */}
              <Text className="text-gray-900 dark:text-white text-xs font-semibold mb-1" numberOfLines={1}>
                {member.name.split(' ')[0]}
              </Text>

              {/* Role badge */}
              <View
                className="px-2 py-0.5 rounded-full mb-2 self-start"
                style={{ backgroundColor: roleColor + '20' }}
              >
                <Text className="text-[10px] font-semibold" style={{ color: roleColor }}>
                  {member.role === 'FractionalExec' ? 'Exec' : member.role}
                </Text>
              </View>

              {/* TU Capacity Bar */}
              <View className="mb-1">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-600 dark:text-slate-400 text-[10px]">
                    TUs/week
                  </Text>
                  <Text className="text-gray-900 dark:text-white text-[10px] font-bold">
                    {available}/{totalCapacity}
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden flex-row">
                  {/* Allocated portion (red) */}
                  {allocated > 0 && (
                    <View
                      className="bg-red-500"
                      style={{ width: `${allocatedPercent}%` }}
                    />
                  )}
                  {/* Available portion (green) */}
                  {available > 0 && (
                    <View
                      className="bg-emerald-500"
                      style={{ width: `${availablePercent}%` }}
                    />
                  )}
                </View>
              </View>

              {/* Available count */}
              {available > 0 ? (
                <View className="flex-row items-center gap-1 mt-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                    {available} available
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-1 mt-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <Text className="text-red-600 dark:text-red-400 text-[10px] font-semibold">
                    Fully allocated
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
