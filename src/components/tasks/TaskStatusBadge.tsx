/**
 * TaskStatusBadge
 * Displays task status with consistent coloring across all tiers
 */

import { View, Text } from 'react-native';
import type { WorkPlan } from '@/lib/state/work-plan-store';

interface TaskStatusBadgeProps {
  status: WorkPlan['status'];
  size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG = {
  'not-started': {
    label: 'Queued',
    color: '#6B7280',
    bg: '#F3F4F6',
    bgDark: '#374151',
  },
  'in-progress': {
    label: 'In Progress',
    color: '#3B82F6',
    bg: '#EFF6FF',
    bgDark: '#1E3A8A',
  },
  blocked: {
    label: 'Blocked',
    color: '#EF4444',
    bg: '#FEF2F2',
    bgDark: '#7F1D1D',
  },
  completed: {
    label: 'Done',
    color: '#10B981',
    bg: '#ECFDF5',
    bgDark: '#064E3B',
  },
  abandoned: {
    label: 'Abandoned',
    color: '#94A3B8',
    bg: '#F8FAFC',
    bgDark: '#1E293B',
  },
};

export function TaskStatusBadge({ status, size = 'medium' }: TaskStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  const sizeStyles = {
    small: 'px-1.5 py-0.5',
    medium: 'px-2 py-1',
    large: 'px-3 py-1.5',
  };

  const textSizeStyles = {
    small: 'text-[9px]',
    medium: 'text-[10px]',
    large: 'text-xs',
  };

  return (
    <View
      className={`rounded-full ${sizeStyles[size]}`}
      style={{ backgroundColor: config.bg }}
    >
      <Text
        className={`${textSizeStyles[size]} font-semibold`}
        style={{ color: config.color }}
      >
        {config.label}
      </Text>
    </View>
  );
}

/**
 * TaskStatusDot
 * Compact colored dot for status in very small spaces
 */
interface TaskStatusDotProps {
  status: WorkPlan['status'];
  size?: number;
}

export function TaskStatusDot({ status, size = 8 }: TaskStatusDotProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: config.color,
      }}
    />
  );
}
