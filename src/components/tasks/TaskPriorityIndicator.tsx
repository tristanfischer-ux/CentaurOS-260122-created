/**
 * TaskPriorityIndicator
 * Shows priority icon (only for high/critical - doesn't show for normal/low)
 */

import { Flame, AlertTriangle } from 'lucide-react-native';

interface TaskPriorityIndicatorProps {
  priority?: 'low' | 'normal' | 'high' | 'critical';
  size?: number;
}

export function TaskPriorityIndicator({ priority, size = 16 }: TaskPriorityIndicatorProps) {
  if (!priority || priority === 'low' || priority === 'normal') {
    return null; // Don't show anything for low/normal priority
  }

  if (priority === 'high') {
    return <Flame size={size} color="#F59E0B" />;
  }

  if (priority === 'critical') {
    return <AlertTriangle size={size} color="#EF4444" />;
  }

  return null;
}
