/**
 * Pending Assignments Badge
 * Shows a count of pending task assignments for the current user
 */

import { View, Text, Pressable } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTaskAssignmentStore } from '@/lib/state/task-assignment-store';

interface PendingAssignmentsBadgeProps {
  memberId: string;
  onPress: () => void;
  style?: 'default' | 'compact' | 'icon-only';
}

export function PendingAssignmentsBadge({
  memberId,
  onPress,
  style = 'default',
}: PendingAssignmentsBadgeProps) {
  const pendingCount = useTaskAssignmentStore(s => s.getPendingForMember(memberId).length);

  if (pendingCount === 0) return null;

  if (style === 'icon-only') {
    return (
      <Pressable
        onPress={onPress}
        className="relative bg-white/20 p-2 rounded-full active:opacity-70"
      >
        <Bell size={20} color="white" />
        {pendingCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
            <Text className="text-white text-xs font-bold">
              {pendingCount > 9 ? '9+' : pendingCount}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  if (style === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        className="bg-amber-500 px-3 py-1 rounded-full flex-row items-center gap-1.5 active:opacity-80"
      >
        <Bell size={14} color="white" />
        <Text className="text-white text-xs font-bold">{pendingCount}</Text>
      </Pressable>
    );
  }

  // Default style
  return (
    <Pressable
      onPress={onPress}
      className="bg-amber-500 px-4 py-2 rounded-xl flex-row items-center gap-2 active:opacity-80"
    >
      <Bell size={18} color="white" />
      <View>
        <Text className="text-white font-bold text-sm">
          {pendingCount} Pending Assignment{pendingCount !== 1 ? 's' : ''}
        </Text>
        <Text className="text-white/80 text-xs">Tap to review</Text>
      </View>
    </Pressable>
  );
}
