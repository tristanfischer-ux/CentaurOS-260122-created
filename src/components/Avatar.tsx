/**
 * Avatar Component
 * Reusable avatar with consistent two-letter initials display
 * First letter of first name + First letter of last name
 */

import { View, Text } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  showBorder?: boolean;
}

/**
 * Extract proper initials from a name
 * Returns first letter of first name + first letter of last name
 * Falls back to first two letters if only one name provided
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '??';

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '??';
  if (parts.length === 1) {
    // Single name: use first two letters
    const singleName = parts[0];
    return singleName.length >= 2
      ? (singleName[0] + singleName[1]).toUpperCase()
      : singleName[0].toUpperCase();
  }

  // Multiple names: first letter of first name + first letter of last name
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return (firstName[0] + lastName[0]).toUpperCase();
}

const SIZE_CONFIG = {
  xs: { container: 20, text: 8, border: 1 },
  sm: { container: 24, text: 9, border: 1 },
  md: { container: 32, text: 11, border: 1.5 },
  lg: { container: 40, text: 14, border: 2 },
  xl: { container: 56, text: 18, border: 2 },
};

export function Avatar({ name, size = 'md', color, showBorder = false }: AvatarProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const initials = getInitials(name);
  const sizeConfig = SIZE_CONFIG[size];

  // Default color based on name hash for consistency
  const defaultColor = color || getColorFromName(name);
  const bgColor = defaultColor + '20'; // 20% opacity
  const borderColor = defaultColor + '40'; // 40% opacity

  return (
    <View
      style={{
        width: sizeConfig.container,
        height: sizeConfig.container,
        borderRadius: sizeConfig.container / 2,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: showBorder ? sizeConfig.border : 0,
        borderColor: showBorder ? borderColor : 'transparent',
      }}
    >
      <Text
        style={{
          fontSize: sizeConfig.text,
          fontWeight: '700',
          color: defaultColor,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

/**
 * Generate a consistent color based on name
 */
function getColorFromName(name: string): string {
  const colors = [
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f97316', // Orange
  ];

  if (!name) return colors[0];

  // Simple hash based on name characters
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % colors.length;
  }

  return colors[hash];
}

// Role-specific colors for organizational avatars
export const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  CoFounder: '#7c3aed',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

/**
 * Avatar with role-based coloring
 */
export function RoleAvatar({
  name,
  role,
  size = 'md',
  showBorder = false,
}: AvatarProps & { role?: string }) {
  const color = role && ROLE_COLORS[role] ? ROLE_COLORS[role] : undefined;
  return <Avatar name={name} size={size} color={color} showBorder={showBorder} />;
}
