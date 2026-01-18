/**
 * VisibilitySelector Component
 * Allows users to select visibility level for tasks/work plans
 */

import { View, Text, Pressable, ScrollView } from 'react-native';
import { Lock, Users, Building2, Globe, Shield } from 'lucide-react-native';
import type { TaskVisibility, RestrictedCategory } from '@/types/privacy';
import { useTheme } from '@/lib/ThemeContext';
import { cn } from '@/lib/cn';

interface VisibilitySelectorProps {
  value: TaskVisibility;
  onChange: (visibility: TaskVisibility) => void;
  onRestrictedCategoryChange?: (category: RestrictedCategory) => void;
  restrictedCategory?: RestrictedCategory;
  disabled?: boolean;
  showRestrictedOptions?: boolean; // Only show for Founders
}

const VISIBILITY_OPTIONS: {
  value: TaskVisibility;
  label: string;
  description: string;
  icon: typeof Lock;
  color: string;
}[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see this task',
    icon: Lock,
    color: '#ef4444',
  },
  {
    value: 'shared',
    label: 'Shared',
    description: 'Share with specific people',
    icon: Users,
    color: '#3b82f6',
  },
  {
    value: 'function',
    label: 'Function',
    description: 'Visible to your team function',
    icon: Building2,
    color: '#8b5cf6',
  },
  {
    value: 'company',
    label: 'Company',
    description: 'Everyone in workspace can see',
    icon: Globe,
    color: '#10b981',
  },
  {
    value: 'restricted',
    label: 'Restricted',
    description: 'Requires special access',
    icon: Shield,
    color: '#f59e0b',
  },
];

const RESTRICTED_CATEGORIES: {
  value: RestrictedCategory;
  label: string;
  description: string;
  emoji: string;
}[] = [
  {
    value: 'hr',
    label: 'HR Confidential',
    description: 'Performance reviews, PIPs, terminations',
    emoji: '⚠️',
  },
  {
    value: 'legal',
    label: 'Legal',
    description: 'Litigation, IP matters, compliance',
    emoji: '⚖️',
  },
  {
    value: 'executive',
    label: 'Executive Only',
    description: 'Board discussions, fundraising',
    emoji: '👔',
  },
  {
    value: 'finance',
    label: 'Financial',
    description: 'M&A discussions, sensitive finances',
    emoji: '💰',
  },
  {
    value: 'confidential',
    label: 'Confidential',
    description: 'General confidential matters',
    emoji: '🔐',
  },
];

export function VisibilitySelector({
  value,
  onChange,
  onRestrictedCategoryChange,
  restrictedCategory,
  disabled = false,
  showRestrictedOptions = false,
}: VisibilitySelectorProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const bgCardAlt = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';

  const visibleOptions = showRestrictedOptions
    ? VISIBILITY_OPTIONS
    : VISIBILITY_OPTIONS.filter((opt) => opt.value !== 'restricted');

  return (
    <View>
      {/* Visibility Options */}
      <Text className={cn('text-xs font-semibold mb-3', textSecondary)}>
        VISIBILITY LEVEL
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          {visibleOptions.map((option) => {
            const isSelected = value === option.value;
            const Icon = option.icon;

            return (
              <Pressable
                key={option.value}
                onPress={() => !disabled && onChange(option.value)}
                disabled={disabled}
                className={cn(
                  'rounded-xl p-3 border-2 min-w-[140px]',
                  isSelected
                    ? 'border-blue-500'
                    : isDark
                      ? 'border-slate-700 bg-slate-800'
                      : isOffWhite
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-gray-200 bg-gray-50',
                  disabled && 'opacity-50'
                )}
              >
                <View className="flex-row items-center mb-2">
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                    style={{ backgroundColor: `${option.color}20` }}
                  >
                    <Icon size={16} color={isSelected ? option.color : isDark ? '#94a3b8' : '#6b7280'} />
                  </View>
                  {isSelected && (
                    <View className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </View>
                <Text
                  className={cn(
                    'font-semibold text-sm mb-1',
                    isSelected ? 'text-blue-500' : textPrimary
                  )}
                >
                  {option.label}
                </Text>
                <Text className={cn('text-xs', textSecondary)} numberOfLines={2}>
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Restricted Category Selector (only shown when 'restricted' is selected) */}
      {value === 'restricted' && onRestrictedCategoryChange && (
        <View className={cn('rounded-xl p-4 border', bgCardAlt, borderColor)}>
          <Text className={cn('text-xs font-semibold mb-3', textSecondary)}>
            RESTRICTED CATEGORY
          </Text>

          <View className="gap-2">
            {RESTRICTED_CATEGORIES.map((category) => {
              const isSelected = restrictedCategory === category.value;

              return (
                <Pressable
                  key={category.value}
                  onPress={() => !disabled && onRestrictedCategoryChange(category.value)}
                  disabled={disabled}
                  className={cn(
                    'flex-row items-center p-3 rounded-lg border',
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500'
                      : isDark
                        ? 'bg-slate-900 border-slate-700'
                        : isOffWhite
                          ? 'bg-white border-orange-200'
                          : 'bg-white border-gray-200',
                    disabled && 'opacity-50'
                  )}
                >
                  <Text className="text-2xl mr-3">{category.emoji}</Text>
                  <View className="flex-1">
                    <Text
                      className={cn(
                        'font-semibold text-sm mb-0.5',
                        isSelected ? 'text-blue-500' : textPrimary
                      )}
                    >
                      {category.label}
                    </Text>
                    <Text className={cn('text-xs', textSecondary)}>
                      {category.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center">
                      <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Help Text */}
      {value === 'private' && (
        <View className={cn('mt-3 p-3 rounded-lg', bgCardAlt)}>
          <Text className={cn('text-xs', textSecondary)}>
            💡 Private tasks are only visible to you. Perfect for personal planning, sensitive research, or confidential notes.
          </Text>
        </View>
      )}

      {value === 'shared' && (
        <View className={cn('mt-3 p-3 rounded-lg', bgCardAlt)}>
          <Text className={cn('text-xs', textSecondary)}>
            💡 You can share this task with specific people after creating it. Use the share button to manage access.
          </Text>
        </View>
      )}
    </View>
  );
}
