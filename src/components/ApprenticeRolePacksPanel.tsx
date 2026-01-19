/**
 * ApprenticeRolePacksPanel - Browse and apply apprentice role packs
 *
 * Shows available role packs and allows generating task drafts
 */

import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  GraduationCap,
  Clock,
  Target,
  Briefcase,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  PlayCircle,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { HapticPressable } from './HapticPressable';
import { lightImpact } from '@/lib/haptics';
import type { ApprenticeRolePack, RoleArchetype } from '@/lib/people/types';
import { ROLE_ARCHETYPES } from '@/lib/people/types';

interface ApprenticeRolePacksPanelProps {
  workspaceId: string;
  userId: string;
  relationshipId?: string; // Optional - if applying to specific candidate
  onPackApplied?: (packName: string, draftCount: number) => void;
}

export function ApprenticeRolePacksPanel({
  workspaceId,
  userId,
  relationshipId,
  onPackApplied,
}: ApprenticeRolePacksPanelProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  const [packs, setPacks] = useState<ApprenticeRolePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyingPack, setApplyingPack] = useState<string | null>(null);
  const [appliedPacks, setAppliedPacks] = useState<Set<string>>(new Set());
  const [expandedPack, setExpandedPack] = useState<string | null>(null);

  // Theme colors
  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';

  // Fetch packs
  const fetchPacks = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/people/apprentice-packs');
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load packs');
      }

      setPacks(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  // Handle refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPacks(false);
  };

  // Apply pack
  const handleApplyPack = async (packId: string) => {
    setApplyingPack(packId);
    lightImpact();

    try {
      const res = await fetch('/api/people/apprentice-packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: userId,
          pack_id: packId,
          relationship_id: relationshipId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to apply pack');
      }

      setAppliedPacks((prev) => new Set([...prev, packId]));
      onPackApplied?.(data.data.pack_name, data.data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply pack');
    } finally {
      setApplyingPack(null);
    }
  };

  // Toggle pack expansion
  const togglePack = (packId: string) => {
    lightImpact();
    setExpandedPack(expandedPack === packId ? null : packId);
  };

  // Get icon for role archetype
  const getRoleIcon = (role: RoleArchetype) => {
    if (role.includes('finance')) return <DollarSign size={20} color="#10b981" />;
    if (role.includes('ops')) return <Target size={20} color="#3b82f6" />;
    if (role.includes('engineering')) return <Briefcase size={20} color="#8b5cf6" />;
    if (role.includes('cad')) return <Briefcase size={20} color="#f59e0b" />;
    if (role.includes('sales')) return <Target size={20} color="#ec4899" />;
    if (role.includes('marketing')) return <Target size={20} color="#06b6d4" />;
    if (role.includes('data')) return <Briefcase size={20} color="#6366f1" />;
    return <GraduationCap size={20} color="#10b981" />;
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`${textSecondary} mt-4`}>Loading role packs...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="mb-4">
        <View className="flex-row items-center mb-1">
          <GraduationCap size={22} color={isDark ? '#34d399' : '#10b981'} />
          <Text className={`${textPrimary} text-lg font-bold ml-2`}>Apprentice Role Packs</Text>
        </View>
        <Text className={textSecondary}>
          Pre-configured hiring workflows for common apprentice roles
        </Text>
      </View>

      {/* Error */}
      {error && (
        <View className="flex-row items-center bg-red-100 dark:bg-red-900/30 rounded-xl p-3 mb-4">
          <AlertCircle size={18} color="#ef4444" />
          <Text className="text-red-600 dark:text-red-400 ml-2 flex-1">{error}</Text>
        </View>
      )}

      {/* Packs List */}
      <View className="gap-3">
        {packs.map((pack, idx) => {
          const isExpanded = expandedPack === pack.id;
          const isApplied = appliedPacks.has(pack.id);
          const isApplying = applyingPack === pack.id;

          return (
            <Animated.View
              key={pack.id}
              entering={FadeInDown.delay(idx * 50)}
            >
              <Pressable
                onPress={() => togglePack(pack.id)}
                className={`${cardBg} rounded-2xl p-4 border ${borderColor}`}
              >
                {/* Pack Header */}
                <View className="flex-row items-start">
                  <View
                    className={`w-12 h-12 rounded-xl items-center justify-center ${
                      isDark ? 'bg-slate-700' : 'bg-gray-200'
                    }`}
                  >
                    {getRoleIcon(pack.role_archetype)}
                  </View>

                  <View className="flex-1 ml-3">
                    <Text className={`${textPrimary} font-semibold text-lg`}>{pack.name}</Text>
                    {pack.description && (
                      <Text className={`${textSecondary} text-sm`}>{pack.description}</Text>
                    )}
                  </View>

                  {isApplied ? (
                    <View className="flex-row items-center bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-full">
                      <CheckCircle2 size={14} color="#10b981" />
                      <Text className="text-green-600 dark:text-green-400 text-xs ml-1">Applied</Text>
                    </View>
                  ) : (
                    <ChevronRight
                      size={20}
                      color={isDark ? '#64748b' : '#9ca3af'}
                      style={{
                        transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                      }}
                    />
                  )}
                </View>

                {/* Pack Details */}
                <View className="flex-row flex-wrap gap-3 mt-3">
                  <View className="flex-row items-center">
                    <Clock size={14} color={isDark ? '#64748b' : '#9ca3af'} />
                    <Text className={`${textSecondary} text-sm ml-1`}>
                      {pack.typical_hours_per_week} hrs/week typical
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <FileText size={14} color={isDark ? '#64748b' : '#9ca3af'} />
                    <Text className={`${textSecondary} text-sm ml-1`}>
                      {pack.task_templates_json.length} tasks
                    </Text>
                  </View>
                </View>

                {/* Skill Requirements */}
                {pack.skill_requirements && pack.skill_requirements.length > 0 && (
                  <View className="flex-row flex-wrap gap-1.5 mt-3">
                    {pack.skill_requirements.slice(0, 4).map((skill) => (
                      <View
                        key={skill}
                        className={`px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-slate-700' : 'bg-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-xs capitalize ${
                            isDark ? 'text-slate-300' : 'text-gray-600'
                          }`}
                        >
                          {skill.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                  <Animated.View entering={FadeInDown} className="mt-4 pt-4 border-t border-slate-700/50">
                    <Text className={`${textSecondary} text-sm mb-2`}>Task templates included:</Text>

                    {pack.task_templates_json.map((task, taskIdx) => (
                      <View
                        key={taskIdx}
                        className="flex-row items-center py-2 border-b border-slate-700/30 last:border-b-0"
                      >
                        <View
                          className={`w-6 h-6 rounded-full items-center justify-center ${
                            isDark ? 'bg-slate-700' : 'bg-gray-200'
                          }`}
                        >
                          <Text className={`${textSecondary} text-xs`}>{taskIdx + 1}</Text>
                        </View>
                        <Text className={`${textPrimary} ml-2 flex-1`}>{task.title}</Text>
                      </View>
                    ))}

                    {/* Apply Button */}
                    {!isApplied && (
                      <HapticPressable
                        onPress={() => handleApplyPack(pack.id)}
                        disabled={isApplying}
                        className="flex-row items-center justify-center py-3 rounded-xl bg-green-600 mt-4"
                      >
                        {isApplying ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <PlayCircle size={18} color="white" />
                            <Text className="text-white font-semibold ml-2">
                              Apply Pack
                            </Text>
                          </>
                        )}
                      </HapticPressable>
                    )}
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Empty State */}
      {packs.length === 0 && !error && (
        <View className={`${cardBg} rounded-2xl p-8 items-center`}>
          <GraduationCap size={40} color={isDark ? '#64748b' : '#9ca3af'} />
          <Text className={`${textPrimary} font-semibold mt-3`}>No role packs available</Text>
          <Text className={`${textSecondary} text-center mt-1`}>
            Role packs help you quickly set up hiring workflows
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
