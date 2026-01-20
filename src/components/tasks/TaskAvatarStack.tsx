/**
 * TaskAvatarStack
 * Displays team member avatars with overflow count
 * Shows up to maxVisible avatars, then "+N" for overflow
 */

import { View, Text } from 'react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';

interface TaskAvatarStackProps {
  memberIds: string[];
  maxVisible?: number;
  size?: number;
}

// Colors for dummy avatars when member not found
const AVATAR_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
];

export function TaskAvatarStack({ memberIds, maxVisible = 3, size = 24 }: TaskAvatarStackProps) {
  const members = useOrganizationStore((s) => s.members);

  const visibleIds = memberIds.slice(0, maxVisible);
  const overflowCount = memberIds.length - maxVisible;

  return (
    <View className="flex-row items-center">
      {visibleIds.map((memberId, index) => {
        const member = members.find((m) => m.id === memberId);

        // Generate initials: use member name if found, otherwise generate dummy initials
        const initials = member
          ? member.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : `U${index + 1}`; // Fallback: U1, U2, U3, etc.

        // Use different colors for variety
        const bgColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

        return (
          <View
            key={memberId}
            className="rounded-full items-center justify-center border-2 border-white dark:border-slate-900"
            style={{
              width: size,
              height: size,
              marginLeft: index > 0 ? -size / 3 : 0,
              zIndex: visibleIds.length - index,
              backgroundColor: bgColor,
            }}
          >
            <Text
              className="text-white font-bold"
              style={{ fontSize: size / 2.5 }}
            >
              {initials}
            </Text>
          </View>
        );
      })}
      {overflowCount > 0 && (
        <View
          className="rounded-full bg-slate-300 dark:bg-slate-600 items-center justify-center border-2 border-white dark:border-slate-900"
          style={{
            width: size,
            height: size,
            marginLeft: -size / 3,
            zIndex: 0,
          }}
        >
          <Text
            className="text-slate-700 dark:text-slate-200 font-bold"
            style={{ fontSize: size / 2.8 }}
          >
            +{overflowCount}
          </Text>
        </View>
      )}
    </View>
  );
}
