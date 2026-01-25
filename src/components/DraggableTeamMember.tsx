/**
 * DraggableTeamMember Component
 *
 * Draggable avatar for founders, executives, and apprentices
 * Can be dropped onto OKRs and tasks to assign team members
 */

import { View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import type { OrganizationMember } from '@/lib/organization-seed';

interface DraggableTeamMemberProps {
  member: OrganizationMember;
  onDragStart?: (memberId: string) => void;
  onDragEnd?: (memberId: string, x: number, y: number) => void;
}

const getRoleColor = (role: 'Founder' | 'CoFounder' | 'FractionalExec' | 'Apprentice') => {
  switch (role) {
    case 'Founder':
    case 'CoFounder':
      return '#8b5cf6'; // Purple
    case 'FractionalExec':
      return '#3b82f6'; // Blue
    case 'Apprentice':
      return '#10b981'; // Green
  }
};

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export function DraggableTeamMember({
  member,
  onDragStart,
  onDragEnd,
}: DraggableTeamMemberProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const roleColor = getRoleColor(member.role);
  const initials = getInitials(member.name);

  const gesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.15);
      zIndex.value = 1000;
      if (onDragStart) {
        runOnJS(onDragStart)(member.id);
      }
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const finalX = event.absoluteX;
      const finalY = event.absoluteY;

      // Reset position and scale
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;

      if (onDragEnd) {
        runOnJS(onDragEnd)(member.id, finalX, finalY);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[animatedStyle]}>
        <View
          className="items-center"
          style={{ width: 48 }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center shadow-sm"
            style={{ backgroundColor: roleColor }}
          >
            <Text className="text-white font-bold text-sm">
              {initials}
            </Text>
          </View>
          <Text
            className="text-gray-700 dark:text-slate-300 text-xs mt-1 text-center"
            numberOfLines={1}
            style={{ width: 48 }}
          >
            {member.name.split(' ')[0]}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

interface TeamMemberAvatarProps {
  member: OrganizationMember;
  size?: 'small' | 'medium';
  onRemove?: () => void;
}

export function TeamMemberAvatar({
  member,
  size = 'small',
  onRemove,
}: TeamMemberAvatarProps) {
  const roleColor = getRoleColor(member.role);
  const initials = getInitials(member.name);
  const dimensions = size === 'small' ? 'w-7 h-7' : 'w-10 h-10';
  const textSize = size === 'small' ? 'text-xs' : 'text-sm';

  return (
    <View className="relative">
      <View
        className={`${dimensions} rounded-full items-center justify-center`}
        style={{ backgroundColor: roleColor }}
      >
        <Text className={`text-white font-bold ${textSize}`}>
          {initials}
        </Text>
      </View>
      {onRemove && (
        <View
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center"
          onTouchEnd={onRemove}
        >
          <Text className="text-white text-xs font-bold">×</Text>
        </View>
      )}
    </View>
  );
}
