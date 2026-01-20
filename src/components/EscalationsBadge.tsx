/**
 * Escalations Badge
 * Shows count of pending escalations for Founders
 * Similar to PendingAssignmentsBadge
 */

import { View, Text, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useEscalationStore } from '@/lib/state/escalation-store';

interface EscalationsBadgeProps {
  workspaceId: string;
  onPress: () => void;
  style?: 'default' | 'compact' | 'icon-only';
}

export function EscalationsBadge({
  workspaceId,
  onPress,
  style = 'default',
}: EscalationsBadgeProps) {
  const pendingCount = useEscalationStore(s => s.getPendingCount(workspaceId));

  if (pendingCount === 0) return null;

  if (style === 'icon-only') {
    return (
      <Pressable
        onPress={onPress}
        className="relative bg-red-500/20 p-2 rounded-full active:opacity-70"
      >
        <AlertTriangle size={20} color="#ef4444" />
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
          <Text className="text-white text-xs font-bold">
            {pendingCount > 9 ? '9+' : pendingCount}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (style === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        className="bg-red-500 px-3 py-1 rounded-full flex-row items-center gap-1.5 active:opacity-80"
      >
        <AlertTriangle size={14} color="white" />
        <Text className="text-white text-xs font-bold">{pendingCount}</Text>
      </Pressable>
    );
  }

  // Default style
  return (
    <Pressable
      onPress={onPress}
      className="bg-red-500 px-4 py-2 rounded-xl flex-row items-center gap-2 active:opacity-80"
    >
      <AlertTriangle size={18} color="white" />
      <View>
        <Text className="text-white font-bold text-sm">
          {pendingCount} Escalation{pendingCount !== 1 ? 's' : ''}
        </Text>
        <Text className="text-white/80 text-xs">Tap to review</Text>
      </View>
    </Pressable>
  );
}
