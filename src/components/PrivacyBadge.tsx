/**
 * PrivacyBadge Component
 * Visual indicator for task visibility level
 */

import { View, Text } from 'react-native';
import { Lock, Users, Building2, Globe, Shield } from 'lucide-react-native';
import type { TaskVisibility, RestrictedCategory } from '@/types/privacy';
import { cn } from '@/lib/cn';

interface PrivacyBadgeProps {
  visibility: TaskVisibility;
  restrictedCategory?: RestrictedCategory;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const VISIBILITY_CONFIG: Record<
  TaskVisibility,
  {
    icon: typeof Lock;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  private: {
    icon: Lock,
    label: 'Private',
    color: '#ef4444',
    bgColor: '#fef2f2',
  },
  shared: {
    icon: Users,
    label: 'Shared',
    color: '#3b82f6',
    bgColor: '#eff6ff',
  },
  function: {
    icon: Building2,
    label: 'Function',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
  },
  company: {
    icon: Globe,
    label: 'Company',
    color: '#10b981',
    bgColor: '#f0fdf4',
  },
  restricted: {
    icon: Shield,
    label: 'Restricted',
    color: '#f59e0b',
    bgColor: '#fffbeb',
  },
};

const RESTRICTED_CATEGORY_CONFIG: Record<
  RestrictedCategory,
  {
    emoji: string;
    label: string;
  }
> = {
  hr: { emoji: '⚠️', label: 'HR' },
  legal: { emoji: '⚖️', label: 'Legal' },
  executive: { emoji: '👔', label: 'Executive' },
  finance: { emoji: '💰', label: 'Finance' },
  confidential: { emoji: '🔐', label: 'Confidential' },
};

export function PrivacyBadge({
  visibility,
  restrictedCategory,
  size = 'medium',
  showLabel = true,
}: PrivacyBadgeProps) {
  const config = VISIBILITY_CONFIG[visibility];
  const Icon = config.icon;

  // Size mappings
  const sizeConfig = {
    small: {
      container: 'px-2 py-1',
      icon: 12,
      text: 'text-xs',
      emojiSize: 'text-xs',
    },
    medium: {
      container: 'px-2.5 py-1.5',
      icon: 14,
      text: 'text-xs',
      emojiSize: 'text-sm',
    },
    large: {
      container: 'px-3 py-2',
      icon: 16,
      text: 'text-sm',
      emojiSize: 'text-base',
    },
  };

  const currentSize = sizeConfig[size];

  // For restricted categories, show the category-specific label
  const displayLabel =
    visibility === 'restricted' && restrictedCategory
      ? RESTRICTED_CATEGORY_CONFIG[restrictedCategory].label
      : config.label;

  const displayEmoji =
    visibility === 'restricted' && restrictedCategory
      ? RESTRICTED_CATEGORY_CONFIG[restrictedCategory].emoji
      : null;

  return (
    <View
      className={cn(
        'flex-row items-center rounded-full border',
        currentSize.container
      )}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.color,
      }}
    >
      {/* Icon or Emoji */}
      {displayEmoji ? (
        <Text className={cn('mr-1', currentSize.emojiSize)}>{displayEmoji}</Text>
      ) : (
        <Icon size={currentSize.icon} color={config.color} style={{ marginRight: showLabel ? 4 : 0 }} />
      )}

      {/* Label */}
      {showLabel && (
        <Text
          className={cn('font-semibold', currentSize.text)}
          style={{ color: config.color }}
        >
          {displayLabel}
        </Text>
      )}
    </View>
  );
}

/**
 * Compact version that only shows an icon
 */
export function PrivacyIconBadge({
  visibility,
  restrictedCategory,
}: {
  visibility: TaskVisibility;
  restrictedCategory?: RestrictedCategory;
}) {
  return (
    <PrivacyBadge
      visibility={visibility}
      restrictedCategory={restrictedCategory}
      size="small"
      showLabel={false}
    />
  );
}
