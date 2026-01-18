/**
 * Privacy Settings Screen
 * Manage privacy preferences and restricted access grants (Founders only)
 */

import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Shield, Eye, EyeOff, Users, Lock } from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePrivacyStore } from '@/lib/state/privacy-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import type { TaskVisibility, RestrictedCategory } from '@/types/privacy';
import { cn } from '@/lib/cn';
import { useState } from 'react';

const VISIBILITY_OPTIONS: {
  value: TaskVisibility;
  label: string;
  description: string;
}[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see your tasks',
  },
  {
    value: 'function',
    label: 'Function',
    description: 'Your team function can see',
  },
  {
    value: 'company',
    label: 'Company',
    description: 'Everyone in workspace (default)',
  },
];

const RESTRICTED_CATEGORIES: {
  value: RestrictedCategory;
  label: string;
  emoji: string;
  description: string;
}[] = [
  { value: 'hr', label: 'HR Confidential', emoji: '⚠️', description: 'Performance, PIPs, terminations' },
  { value: 'legal', label: 'Legal', emoji: '⚖️', description: 'Litigation, IP, compliance' },
  { value: 'executive', label: 'Executive', emoji: '👔', description: 'Board, fundraising' },
  { value: 'finance', label: 'Finance', emoji: '💰', description: 'M&A, sensitive finances' },
  { value: 'confidential', label: 'Confidential', emoji: '🔐', description: 'General confidential' },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const isFounder = currentMembership?.role === 'Founder';

  const preferences = usePrivacyStore((s) => s.preferences);
  const setDefaultVisibility = usePrivacyStore((s) => s.setDefaultVisibility);
  const setFounderOverride = usePrivacyStore((s) => s.setFounderOverride);
  const setShowPrivacyBadges = usePrivacyStore((s) => s.setShowPrivacyBadges);
  const grantRestrictedAccess = usePrivacyStore((s) => s.grantRestrictedAccess);
  const revokeRestrictedAccess = usePrivacyStore((s) => s.revokeRestrictedAccess);
  const hasRestrictedAccess = usePrivacyStore((s) => s.hasRestrictedAccess);
  const getUsersWithRestrictedAccess = usePrivacyStore((s) => s.getUsersWithRestrictedAccess);

  const members = useOrganizationStore((s) =>
    s.members.filter((m) => m.workspaceId === currentWorkspace?.id && m.status === 'active')
  );

  const [expandedCategory, setExpandedCategory] = useState<RestrictedCategory | null>(null);

  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const bgCardAlt = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const iconColor = isDark ? '#94a3b8' : isOffWhite ? '#c2410c' : '#6b7280';

  const handleGrantAccess = (category: RestrictedCategory, userId: string) => {
    if (!currentWorkspace || !currentMembership) return;

    Alert.alert(
      'Grant Restricted Access',
      `Grant ${RESTRICTED_CATEGORIES.find((c) => c.value === category)?.label} access to this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Grant Access',
          onPress: () => {
            grantRestrictedAccess(
              currentWorkspace.id,
              userId,
              category,
              currentMembership.userId
            );
          },
        },
      ]
    );
  };

  const handleRevokeAccess = (category: RestrictedCategory, userId: string) => {
    if (!currentWorkspace) return;

    Alert.alert(
      'Revoke Restricted Access',
      `Remove ${RESTRICTED_CATEGORIES.find((c) => c.value === category)?.label} access from this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => {
            revokeRestrictedAccess(currentWorkspace.id, userId, category);
          },
        },
      ]
    );
  };

  return (
    <View className={cn('flex-1', bgPrimary)}>
      {/* Header */}
      <View className={cn('border-b', bgCard, borderColor)} style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-6 py-4">
          <Pressable onPress={() => router.back()} className="mr-4">
            <ChevronLeft size={24} color={iconColor} />
          </Pressable>
          <View className="flex-1">
            <Text className={cn('text-2xl font-bold', textPrimary)}>Privacy Settings</Text>
            <Text className={cn('text-xs', textSecondary)}>Manage visibility and access</Text>
          </View>
          <Shield size={24} color="#8b5cf6" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Default Visibility */}
        <View className="px-6 pt-6">
          <Text className={cn('text-lg font-bold mb-1', textPrimary)}>Default Visibility</Text>
          <Text className={cn('text-sm mb-4', textSecondary)}>
            New tasks will use this visibility level by default
          </Text>

          <View className="gap-2">
            {VISIBILITY_OPTIONS.map((option) => {
              const isSelected = preferences.defaultVisibility === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setDefaultVisibility(option.value)}
                  className={cn(
                    'p-4 rounded-xl border',
                    isSelected ? 'bg-blue-500/10 border-blue-500' : cn(bgCard, borderColor)
                  )}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text
                        className={cn(
                          'font-semibold text-sm mb-1',
                          isSelected ? 'text-blue-500' : textPrimary
                        )}
                      >
                        {option.label}
                      </Text>
                      <Text className={cn('text-xs', textSecondary)}>{option.description}</Text>
                    </View>
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                        <Text className="text-white text-xs font-bold">✓</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Privacy Preferences */}
        <View className="px-6 pt-6">
          <Text className={cn('text-lg font-bold mb-4', textPrimary)}>Privacy Preferences</Text>

          <View className={cn('rounded-xl p-4 border mb-3', bgCard, borderColor)}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className={cn('font-semibold text-sm mb-1', textPrimary)}>
                  Show Privacy Badges
                </Text>
                <Text className={cn('text-xs', textSecondary)}>
                  Display visibility indicators on tasks
                </Text>
              </View>
              <Pressable onPress={() => setShowPrivacyBadges(!preferences.showPrivacyBadges)}>
                <View
                  className={cn(
                    'w-12 h-6 rounded-full',
                    preferences.showPrivacyBadges ? 'bg-blue-500' : bgCardAlt
                  )}
                >
                  <View
                    className={cn(
                      'w-5 h-5 rounded-full bg-white absolute top-0.5',
                      preferences.showPrivacyBadges ? 'right-0.5' : 'left-0.5'
                    )}
                  />
                </View>
              </Pressable>
            </View>
          </View>

          {isFounder && (
            <View className={cn('rounded-xl p-4 border', bgCard, borderColor)}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={cn('font-semibold text-sm mb-1', textPrimary)}>
                    {preferences.allowFounderOverride ? '👁️ ' : '🚫 '}
                    Founder Override
                  </Text>
                  <Text className={cn('text-xs', textSecondary)}>
                    {preferences.allowFounderOverride
                      ? 'You can see all private tasks (audit/compliance)'
                      : 'Respect privacy - you cannot see private tasks'}
                  </Text>
                </View>
                <Pressable onPress={() => setFounderOverride(!preferences.allowFounderOverride)}>
                  <View
                    className={cn(
                      'w-12 h-6 rounded-full',
                      preferences.allowFounderOverride ? 'bg-blue-500' : bgCardAlt
                    )}
                  >
                    <View
                      className={cn(
                        'w-5 h-5 rounded-full bg-white absolute top-0.5',
                        preferences.allowFounderOverride ? 'right-0.5' : 'left-0.5'
                      )}
                    />
                  </View>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Restricted Access Management (Founders Only) */}
        {isFounder && (
          <View className="px-6 pt-6 pb-8">
            <Text className={cn('text-lg font-bold mb-1', textPrimary)}>
              Restricted Access Management
            </Text>
            <Text className={cn('text-sm mb-4', textSecondary)}>
              Grant team members access to sensitive categories
            </Text>

            <View className="gap-3">
              {RESTRICTED_CATEGORIES.map((category) => {
                const usersWithAccess = currentWorkspace
                  ? getUsersWithRestrictedAccess(currentWorkspace.id, category.value)
                  : [];
                const isExpanded = expandedCategory === category.value;

                return (
                  <View key={category.value} className={cn('rounded-xl border', bgCard, borderColor)}>
                    <Pressable
                      onPress={() =>
                        setExpandedCategory(isExpanded ? null : category.value)
                      }
                      className="p-4"
                    >
                      <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">{category.emoji}</Text>
                        <View className="flex-1">
                          <Text className={cn('font-semibold text-sm mb-0.5', textPrimary)}>
                            {category.label}
                          </Text>
                          <Text className={cn('text-xs', textSecondary)}>
                            {usersWithAccess.length} users with access
                          </Text>
                        </View>
                        <View
                          className={cn(
                            'w-6 h-6 rounded-full items-center justify-center',
                            bgCardAlt
                          )}
                        >
                          <Text className={cn('text-xs font-bold', textSecondary)}>
                            {isExpanded ? '−' : '+'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>

                    {isExpanded && (
                      <View className={cn('px-4 pb-4 pt-2 border-t', borderColor)}>
                        {members.map((member) => {
                          const hasAccess = currentWorkspace
                            ? hasRestrictedAccess(currentWorkspace.id, member.id, category.value)
                            : false;

                          return (
                            <Pressable
                              key={member.id}
                              onPress={() =>
                                hasAccess
                                  ? handleRevokeAccess(category.value, member.id)
                                  : handleGrantAccess(category.value, member.id)
                              }
                              className={cn(
                                'flex-row items-center p-3 rounded-lg mb-2',
                                hasAccess ? 'bg-emerald-500/10' : bgCardAlt
                              )}
                            >
                              <View className="flex-1">
                                <Text className={cn('font-semibold text-sm', textPrimary)}>
                                  {member.name}
                                </Text>
                                <Text className={cn('text-xs', textSecondary)}>
                                  {member.role} • {member.function}
                                </Text>
                              </View>
                              {hasAccess ? (
                                <Lock size={16} color="#10b981" />
                              ) : (
                                <Users size={16} color={iconColor} />
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
