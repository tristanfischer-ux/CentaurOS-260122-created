/**
 * Role Empty State Component
 * Shows role-appropriate empty state messages
 */

import { View, Text, Pressable } from 'react-native';
import {
  CheckCircle2,
  Plus,
  Trophy,
  Target,
  Users,
  ListTodo,
  Rocket,
} from 'lucide-react-native';
import type { Role } from '@/types';
import { getRoleEmptyStateMessage } from '@/lib/role-utils';

interface RoleEmptyStateProps {
  role: Role;
  context: 'tasks' | 'okrs' | 'team' | 'workplans';
  onAction?: () => void;
}

const ICONS = {
  tasks: CheckCircle2,
  okrs: Target,
  team: Users,
  workplans: ListTodo,
};

const ACTION_ICONS = {
  tasks: Rocket,
  okrs: Plus,
  team: Plus,
  workplans: Plus,
};

export function RoleEmptyState({ role, context, onAction }: RoleEmptyStateProps) {
  const config = getRoleEmptyStateMessage(role, context);
  const Icon = ICONS[context];
  const ActionIcon = ACTION_ICONS[context];

  return (
    <View className="py-12 px-6 items-center">
      <View className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
        <Icon size={48} color="#94a3b8" />
      </View>

      <Text className="text-slate-900 dark:text-white text-xl font-bold text-center mb-2">
        {config.title}
      </Text>

      <Text className="text-slate-600 dark:text-slate-400 text-sm text-center mb-6 max-w-sm">
        {config.description}
      </Text>

      {config.actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="bg-purple-600 dark:bg-purple-700 px-6 py-3 rounded-xl flex-row items-center gap-2 active:opacity-80"
        >
          <ActionIcon size={18} color="white" />
          <Text className="text-white font-semibold">{config.actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Compact version for smaller spaces
 */
export function RoleEmptyStateCompact({ role, context }: Omit<RoleEmptyStateProps, 'onAction'>) {
  const config = getRoleEmptyStateMessage(role, context);
  const Icon = ICONS[context];

  return (
    <View className="py-8 px-4 items-center">
      <Icon size={32} color="#cbd5e1" />
      <Text className="text-slate-900 dark:text-white font-semibold text-center mt-3">
        {config.title}
      </Text>
      <Text className="text-slate-500 dark:text-slate-500 text-xs text-center mt-1">
        {config.description}
      </Text>
    </View>
  );
}
