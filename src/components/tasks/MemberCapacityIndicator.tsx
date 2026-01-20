/**
 * MemberCapacityIndicator
 * Shows capacity status with icon and text
 */

import { View, Text } from 'react-native';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react-native';
import { calculateMemberCapacity, type MemberCapacity } from '@/lib/task-calculations';

interface MemberCapacityIndicatorProps {
  allocatedTU: number;
  totalCapacity: number;
  showDetails?: boolean;
}

export function MemberCapacityIndicator({
  allocatedTU,
  totalCapacity,
  showDetails = true,
}: MemberCapacityIndicatorProps) {
  const capacity = calculateMemberCapacity(allocatedTU, totalCapacity);

  const Icon = capacity.status === 'available'
    ? CheckCircle2
    : capacity.status === 'warning'
    ? AlertTriangle
    : XCircle;

  const iconColor = capacity.status === 'available'
    ? '#10B981'
    : capacity.status === 'warning'
    ? '#F59E0B'
    : '#EF4444';

  const textColor = capacity.status === 'available'
    ? 'text-green-600 dark:text-green-400'
    : capacity.status === 'warning'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';

  if (!showDetails) {
    return <Icon size={16} color={iconColor} />;
  }

  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={14} color={iconColor} />
      <Text className={`text-[11px] ${textColor}`}>
        {capacity.status === 'overallocated'
          ? `Capacity: ${capacity.available}/${capacity.total} TU available (overallocated!)`
          : `Capacity: ${capacity.available}/${capacity.total} TU available`}
      </Text>
    </View>
  );
}
