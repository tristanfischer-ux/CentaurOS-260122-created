/**
 * CapacityHeatMap Component
 *
 * Visual grid showing 10-day rolling capacity for team members
 * - 10 columns (days) with stacked bars per person
 * - Each bar: 0-3 squares high (time units per day)
 * - Different colors per person/role
 * - Red tint for stretched (3 TU) slots
 */

import { View, Text, Pressable } from 'react-native';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/ThemeContext';
import type { MemberCapacityView } from '@/lib/state/capacity-store';

interface CapacityHeatMapProps {
  memberCapacities: MemberCapacityView[];
  compact?: boolean;  // Mini version for Home tab
  onMemberPress?: (memberId: string) => void;
  showLegend?: boolean;
}

// Color palette for different roles and members
const ROLE_COLORS = {
  Founder: '#8b5cf6',      // Purple
  FractionalExec: '#3b82f6', // Blue
  Apprentice: ['#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#84cc16', '#ec4899'], // Emerald, Amber, Rose, Cyan, Lime, Pink
};

const getApprenticeColor = (index: number): string => {
  return ROLE_COLORS.Apprentice[index % ROLE_COLORS.Apprentice.length];
};

const getMemberColor = (member: MemberCapacityView, apprenticeIndex: number): string => {
  if (member.role === 'Founder') return ROLE_COLORS.Founder;
  if (member.role === 'FractionalExec') return ROLE_COLORS.FractionalExec;
  return getApprenticeColor(apprenticeIndex);
};

export function CapacityHeatMap({
  memberCapacities,
  compact = false,
  onMemberPress,
  showLegend = true,
}: CapacityHeatMapProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Theme colors
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';

  // Group members by role for stacking
  const { founders, executives, apprentices } = useMemo(() => {
    const founders = memberCapacities.filter(m => m.role === 'Founder');
    const executives = memberCapacities.filter(m => m.role === 'FractionalExec');
    const apprentices = memberCapacities.filter(m => m.role === 'Apprentice');
    return { founders, executives, apprentices };
  }, [memberCapacities]);

  // Get unique dates from first member (all should have same dates)
  const dates = useMemo(() => {
    if (memberCapacities.length === 0) return [];
    return memberCapacities[0].dailyAllocation.map(d => ({
      date: d.date,
      dayOfWeek: d.dayOfWeek,
    }));
  }, [memberCapacities]);

  const handleMemberPress = (memberId: string) => {
    setSelectedMember(selectedMember === memberId ? null : memberId);
    onMemberPress?.(memberId);
  };

  // Render a single capacity cell (stack of boxes)
  const renderCapacityCell = (
    member: MemberCapacityView,
    dayIndex: number,
    color: string
  ) => {
    const dayAlloc = member.dailyAllocation[dayIndex];
    if (!dayAlloc) return null;

    const totalSlots = dayAlloc.totalSlots;
    const isStretched = dayAlloc.stretchSlots > 0;
    const isSelected = selectedMember === member.memberId;
    const cellHeight = compact ? 8 : 12;

    return (
      <Pressable
        key={`${member.memberId}-${dayIndex}`}
        onPress={() => handleMemberPress(member.memberId)}
        className="items-center justify-end"
        style={{ width: compact ? 20 : 28 }}
      >
        {/* Stack of boxes representing time units */}
        {Array.from({ length: totalSlots }).map((_, slotIdx) => {
          const isStretchSlot = slotIdx === totalSlots - 1 && isStretched;
          return (
            <View
              key={slotIdx}
              className={cn(
                'rounded-sm mb-0.5',
                isSelected && 'opacity-100',
                !isSelected && selectedMember && 'opacity-40'
              )}
              style={{
                width: compact ? 16 : 24,
                height: cellHeight,
                backgroundColor: color,
                borderWidth: isStretchSlot ? 2 : 0,
                borderColor: isStretchSlot ? '#ef4444' : 'transparent',
                opacity: isStretchSlot ? 0.9 : 1,
              }}
            />
          );
        })}
        {/* Empty space if no allocation */}
        {totalSlots === 0 && (
          <View
            className="rounded-sm"
            style={{
              width: compact ? 16 : 24,
              height: cellHeight / 2,
              backgroundColor: isDark ? '#334155' : '#e2e8f0',
              opacity: 0.3,
            }}
          />
        )}
      </Pressable>
    );
  };

  // Render a row for a member
  const renderMemberRow = (
    member: MemberCapacityView,
    color: string,
    showName: boolean = true
  ) => (
    <View
      key={member.memberId}
      className={cn(
        'flex-row items-end',
        compact ? 'mb-1' : 'mb-2'
      )}
    >
      {/* Member name (optional) */}
      {showName && !compact && (
        <View className="w-20 mr-2 justify-end">
          <Text
            className={cn(
              'text-xs font-medium',
              selectedMember === member.memberId ? textPrimary : textSecondary
            )}
            numberOfLines={1}
          >
            {member.name.split(' ')[0]}
          </Text>
        </View>
      )}

      {/* Daily capacity cells */}
      <View className="flex-row gap-1">
        {dates.map((_, dayIndex) => renderCapacityCell(member, dayIndex, color))}
      </View>

      {/* Utilization indicator */}
      {!compact && (
        <View className="ml-2 w-12 items-end">
          <Text
            className={cn(
              'text-xs font-bold',
              member.isStretched ? 'text-red-500' :
              member.utilizationPct >= 85 ? 'text-amber-500' :
              member.utilizationPct >= 50 ? 'text-emerald-500' :
              textSecondary
            )}
          >
            {member.utilizationPct}%
          </Text>
        </View>
      )}
    </View>
  );

  if (memberCapacities.length === 0) {
    return (
      <View className={cn(bgCard, 'rounded-xl p-4 border', borderColor)}>
        <Text className={textSecondary}>No capacity data available</Text>
      </View>
    );
  }

  return (
    <View className={cn(bgCard, 'rounded-xl border', borderColor, compact ? 'p-2' : 'p-4')}>
      {/* Header with day labels */}
      <View className={cn('flex-row', compact ? 'mb-1' : 'mb-3')}>
        {!compact && <View className="w-20 mr-2" />}
        <View className="flex-row gap-1">
          {dates.map((d, i) => (
            <View
              key={i}
              className="items-center"
              style={{ width: compact ? 20 : 28 }}
            >
              <Text className={cn('text-xs font-medium', textSecondary)}>
                {d.dayOfWeek[0]}
              </Text>
            </View>
          ))}
        </View>
        {!compact && <View className="ml-2 w-12" />}
      </View>

      {/* Stacked capacity rows - Founders on top */}
      {founders.map(member => renderMemberRow(member, ROLE_COLORS.Founder))}

      {/* Executives */}
      {executives.map(member => renderMemberRow(member, ROLE_COLORS.FractionalExec))}

      {/* Apprentices - each with unique color */}
      {apprentices.map((member, index) =>
        renderMemberRow(member, getApprenticeColor(index))
      )}

      {/* Legend */}
      {showLegend && !compact && (
        <View className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-row items-center">
              <View
                className="w-3 h-3 rounded-sm mr-1.5"
                style={{ backgroundColor: ROLE_COLORS.Founder }}
              />
              <Text className={cn('text-xs', textSecondary)}>Founder</Text>
            </View>
            <View className="flex-row items-center">
              <View
                className="w-3 h-3 rounded-sm mr-1.5"
                style={{ backgroundColor: ROLE_COLORS.FractionalExec }}
              />
              <Text className={cn('text-xs', textSecondary)}>Executive</Text>
            </View>
            <View className="flex-row items-center">
              <View
                className="w-3 h-3 rounded-sm mr-1.5"
                style={{ backgroundColor: ROLE_COLORS.Apprentice[0] }}
              />
              <Text className={cn('text-xs', textSecondary)}>Apprentice</Text>
            </View>
            <View className="flex-row items-center">
              <View
                className="w-3 h-3 rounded-sm mr-1.5 border-2 border-red-500"
                style={{ backgroundColor: '#fee2e2' }}
              />
              <Text className={cn('text-xs', textSecondary)}>Stretched</Text>
            </View>
          </View>
        </View>
      )}

      {/* Selected member details */}
      {selectedMember && !compact && (
        <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
          {(() => {
            const member = memberCapacities.find(m => m.memberId === selectedMember);
            if (!member) return null;
            return (
              <View>
                <Text className={cn('font-bold mb-1', textPrimary)}>
                  {member.name}
                </Text>
                <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                  <Text className={cn('text-xs', textSecondary)}>
                    Role: {member.role === 'FractionalExec' ? 'Executive' : member.role}
                  </Text>
                  <Text className={cn('text-xs', textSecondary)}>
                    Function: {member.function}
                  </Text>
                  <Text className={cn('text-xs', textSecondary)}>
                    Capacity: {member.allocatedTimeUnits}/{member.baseTimeUnitsPerWeek} TU
                  </Text>
                  {member.aiMultiplier > 1 && (
                    <Text className="text-xs text-blue-500 font-medium">
                      AI Boost: {member.aiMultiplier}x
                    </Text>
                  )}
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </View>
  );
}

export default CapacityHeatMap;
