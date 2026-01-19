/**
 * Role Indicator Component
 * Persistent visual indicator showing the current active role
 * Appears in the top-right of screens to maintain role awareness
 */

import { View, Text } from 'react-native';
import { Building2, Briefcase, GraduationCap } from 'lucide-react-native';
import { useActiveRole } from '@/lib/state/role-store';
import { useCurrentMembership } from '@/lib/state/app-store';

interface RoleIndicatorProps {
  compact?: boolean;
}

export function RoleIndicator({ compact = false }: RoleIndicatorProps) {
  const activeRole = useActiveRole();
  const currentMembership = useCurrentMembership();

  const config = {
    Founder: {
      color: '#3b82f6',
      label: 'Command',
      icon: Building2,
      dotColor: '#3b82f6',
    },
    CoFounder: {
      color: '#3b82f6',
      label: 'Command',
      icon: Building2,
      dotColor: '#3b82f6',
    },
    FractionalExec: {
      color: '#8b5cf6',
      label: currentMembership?.function ? `${currentMembership.function} Lead` : 'Executive',
      icon: Briefcase,
      dotColor: '#8b5cf6',
    },
    Apprentice: {
      color: '#10b981',
      label: 'Learning',
      icon: GraduationCap,
      dotColor: '#10b981',
    },
  };

  const roleConfig = config[activeRole];
  const Icon = roleConfig.icon;

  if (compact) {
    return (
      <View className="flex-row items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
        <View
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: roleConfig.dotColor }}
        />
        <Icon size={12} color="white" />
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-full">
      <View
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: roleConfig.color }}
      />
      <Icon size={12} color={roleConfig.color} />
      <Text className="text-xs font-semibold" style={{ color: roleConfig.color }}>
        {roleConfig.label}
      </Text>
    </View>
  );
}
