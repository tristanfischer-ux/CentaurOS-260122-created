/**
 * PeoplePipeline - Kanban-style Hiring Pipeline View
 *
 * Shows candidates organized by pipeline stage:
 * identified → contacted → intro_call → trial → engaged | rejected
 */

import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import {
  Users,
  UserPlus,
  Phone,
  Video,
  PlayCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  Clock,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  AlertCircle,
  MoreVertical,
  Plus,
  MessageSquare,
  FileText,
  Send,
} from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { HapticPressable } from './HapticPressable';
import { lightImpact, mediumImpact } from '@/lib/haptics';
import type {
  CompanyPeopleRelationship,
  PipelineStage,
  PipelineStats,
  PersonType,
} from '@/lib/people/types';
import { ROLE_ARCHETYPES } from '@/lib/people/types';

interface PeoplePipelineProps {
  workspaceId: string;
  userId: string;
  onAddCandidate?: () => void;
  onViewCandidate?: (relationshipId: string) => void;
  onCreateOutreach?: (relationshipId: string) => void;
}

// Pipeline stage configuration
const PIPELINE_STAGES: {
  stage: PipelineStage;
  label: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    stage: 'identified',
    label: 'Identified',
    color: '#6366f1',
    icon: <Users size={16} color="#6366f1" />,
  },
  {
    stage: 'contacted',
    label: 'Contacted',
    color: '#8b5cf6',
    icon: <Send size={16} color="#8b5cf6" />,
  },
  {
    stage: 'intro_call',
    label: 'Intro Call',
    color: '#3b82f6',
    icon: <Video size={16} color="#3b82f6" />,
  },
  {
    stage: 'trial',
    label: 'Trial',
    color: '#06b6d4',
    icon: <PlayCircle size={16} color="#06b6d4" />,
  },
  {
    stage: 'engaged',
    label: 'Engaged',
    color: '#10b981',
    icon: <CheckCircle2 size={16} color="#10b981" />,
  },
  {
    stage: 'rejected',
    label: 'Rejected',
    color: '#ef4444',
    icon: <XCircle size={16} color="#ef4444" />,
  },
];

export function PeoplePipeline({
  workspaceId,
  userId,
  onAddCandidate,
  onViewCandidate,
  onCreateOutreach,
}: PeoplePipelineProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [relationships, setRelationships] = useState<CompanyPeopleRelationship[]>([]);
  const [stats, setStats] = useState<PipelineStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<PersonType | 'all'>('all');
  const [expandedStages, setExpandedStages] = useState<Set<PipelineStage>>(
    new Set(['identified', 'contacted', 'intro_call', 'trial'])
  );

  // Theme colors
  const bgColor = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';

  // Fetch pipeline data
  const fetchPipeline = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        include_stats: 'true',
      });

      if (selectedType !== 'all') {
        params.append('person_type', selectedType);
      }

      const res = await fetch(`/api/people/pipeline?${params}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load pipeline');
      }

      setRelationships(data.data.relationships);
      setStats(data.data.stats || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [workspaceId, selectedType]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Handle refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPipeline(false);
  };

  // Move candidate to different stage
  const moveToStage = async (relationshipId: string, newStage: PipelineStage) => {
    mediumImpact();

    try {
      const res = await fetch(`/api/people/pipeline/${relationshipId}?workspace_id=${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_stage: newStage }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to move candidate');
      }

      // Update local state
      setRelationships((prev) =>
        prev.map((r) => (r.id === relationshipId ? { ...r, pipeline_stage: newStage } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move candidate');
    }
  };

  // Toggle stage expansion
  const toggleStage = (stage: PipelineStage) => {
    lightImpact();
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  };

  // Get relationships for a stage
  const getRelationshipsForStage = (stage: PipelineStage) =>
    relationships.filter((r) => r.pipeline_stage === stage);

  // Get count for stage
  const getStageCount = (stage: PipelineStage) =>
    stats.find((s) => s.pipeline_stage === stage)?.count ||
    getRelationshipsForStage(stage).length;

  if (isLoading) {
    return (
      <View className={`flex-1 ${bgColor} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`${textSecondary} mt-4`}>Loading pipeline...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className={`flex-1 ${bgColor}`}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <View className="px-5 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className={`text-2xl font-bold ${textPrimary}`}>Hiring Pipeline</Text>
            <Text className={textSecondary}>
              {relationships.length} candidates in pipeline
            </Text>
          </View>

          <HapticPressable
            onPress={onAddCandidate}
            className="flex-row items-center px-4 py-2 bg-blue-600 rounded-xl"
          >
            <Plus size={18} color="white" />
            <Text className="text-white font-semibold ml-1.5">Add</Text>
          </HapticPressable>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ gap: 8 }}
          style={{ flexGrow: 0 }}
        >
          {(['all', 'fractional_exec', 'apprentice', 'advisor', 'contractor'] as const).map(
            (type) => (
              <Pressable
                key={type}
                onPress={() => {
                  setSelectedType(type);
                  lightImpact();
                }}
                className={`px-4 py-2 rounded-full ${
                  selectedType === type
                    ? 'bg-blue-600'
                    : isDark
                    ? 'bg-slate-800'
                    : isOffWhite
                    ? 'bg-stone-200'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedType === type
                      ? 'text-white'
                      : isDark
                      ? 'text-slate-300'
                      : isOffWhite
                      ? 'text-stone-600'
                      : 'text-gray-600'
                  }`}
                >
                  {type === 'all'
                    ? 'All'
                    : type === 'fractional_exec'
                    ? 'Fractional'
                    : type === 'apprentice'
                    ? 'Apprentice'
                    : type === 'advisor'
                    ? 'Advisor'
                    : 'Contractor'}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>

        {/* Error */}
        {error && (
          <View className="flex-row items-center bg-red-100 dark:bg-red-900/30 rounded-xl p-3 mb-4">
            <AlertCircle size={18} color="#ef4444" />
            <Text className="text-red-600 dark:text-red-400 ml-2 flex-1">{error}</Text>
          </View>
        )}

        {/* Pipeline Stages */}
        {PIPELINE_STAGES.map((stageConfig, idx) => {
          const stageRelationships = getRelationshipsForStage(stageConfig.stage);
          const count = getStageCount(stageConfig.stage);
          const isExpanded = expandedStages.has(stageConfig.stage);

          return (
            <Animated.View
              key={stageConfig.stage}
              entering={FadeInDown.delay(idx * 50)}
              layout={Layout}
              className="mb-3"
            >
              {/* Stage Header */}
              <Pressable
                onPress={() => toggleStage(stageConfig.stage)}
                className={`flex-row items-center justify-between p-3 rounded-xl ${cardBg}`}
              >
                <View className="flex-row items-center">
                  {stageConfig.icon}
                  <Text className={`${textPrimary} font-semibold ml-2`}>
                    {stageConfig.label}
                  </Text>
                  <View
                    className="ml-2 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${stageConfig.color}20` }}
                  >
                    <Text style={{ color: stageConfig.color }} className="text-sm font-medium">
                      {count}
                    </Text>
                  </View>
                </View>

                {isExpanded ? (
                  <ChevronDown size={20} color={isDark ? '#64748b' : '#9ca3af'} />
                ) : (
                  <ChevronRight size={20} color={isDark ? '#64748b' : '#9ca3af'} />
                )}
              </Pressable>

              {/* Stage Candidates */}
              {isExpanded && stageRelationships.length > 0 && (
                <View className="mt-2 pl-4 border-l-2" style={{ borderLeftColor: stageConfig.color }}>
                  {stageRelationships.map((rel, relIdx) => (
                    <Animated.View
                      key={rel.id}
                      entering={FadeInRight.delay(relIdx * 30)}
                      className="mb-2"
                    >
                      <PipelineCandidateCard
                        relationship={rel}
                        isDark={isDark}
                        isOffWhite={isOffWhite}
                        currentStage={stageConfig.stage}
                        onView={() => onViewCandidate?.(rel.id)}
                        onMoveStage={(newStage) => moveToStage(rel.id, newStage)}
                        onCreateOutreach={() => onCreateOutreach?.(rel.id)}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* Empty State */}
              {isExpanded && stageRelationships.length === 0 && (
                <View className={`mt-2 p-4 rounded-xl ${cardBg} opacity-60`}>
                  <Text className={`${textSecondary} text-center text-sm`}>
                    No candidates in this stage
                  </Text>
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// Pipeline candidate card
function PipelineCandidateCard({
  relationship,
  isDark,
  isOffWhite,
  currentStage,
  onView,
  onMoveStage,
  onCreateOutreach,
}: {
  relationship: CompanyPeopleRelationship;
  isDark: boolean;
  isOffWhite: boolean;
  currentStage: PipelineStage;
  onView: () => void;
  onMoveStage: (stage: PipelineStage) => void;
  onCreateOutreach: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const cardBg = isDark ? 'bg-slate-800/50' : isOffWhite ? 'bg-stone-100/80' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';

  const person = relationship.person;
  if (!person) return null;

  // Person type icon
  const getPersonTypeIcon = () => {
    switch (person.person_type) {
      case 'fractional_exec':
        return <Briefcase size={14} color={isDark ? '#a78bfa' : '#8b5cf6'} />;
      case 'apprentice':
        return <GraduationCap size={14} color={isDark ? '#34d399' : '#10b981'} />;
      case 'advisor':
        return <Star size={14} color={isDark ? '#fbbf24' : '#f59e0b'} />;
      default:
        return <Briefcase size={14} color={isDark ? '#94a3b8' : '#6b7280'} />;
    }
  };

  // Priority indicator
  const getPriorityColor = () => {
    switch (relationship.priority) {
      case 'urgent':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'med':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  // Next stage options
  const getNextStages = (): PipelineStage[] => {
    const stageOrder: PipelineStage[] = [
      'identified',
      'contacted',
      'intro_call',
      'trial',
      'engaged',
    ];
    const currentIdx = stageOrder.indexOf(currentStage);

    const options: PipelineStage[] = [];
    if (currentIdx > 0) options.push(stageOrder[currentIdx - 1]); // Previous
    if (currentIdx < stageOrder.length - 1) options.push(stageOrder[currentIdx + 1]); // Next
    if (currentStage !== 'rejected' && currentStage !== 'engaged') {
      options.push('rejected');
    }

    return options;
  };

  return (
    <Pressable
      onPress={onView}
      onLongPress={() => {
        setShowActions(!showActions);
        lightImpact();
      }}
      className={`${cardBg} rounded-xl p-3 border ${borderColor}`}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center">
            {getPersonTypeIcon()}
            <Text className={`${textPrimary} font-semibold ml-1.5`} numberOfLines={1}>
              {person.display_name}
            </Text>
          </View>

          {person.headline && (
            <Text className={`${textSecondary} text-sm mt-0.5`} numberOfLines={1}>
              {person.headline}
            </Text>
          )}
        </View>

        {/* Priority indicator */}
        <View
          className="w-2 h-2 rounded-full ml-2"
          style={{ backgroundColor: getPriorityColor() }}
        />
      </View>

      {/* Quick Info */}
      <View className="flex-row flex-wrap gap-2 mt-2">
        {relationship.target_role_archetype && (
          <View
            className={`px-2 py-0.5 rounded-full ${
              isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`text-xs ${
                isDark ? 'text-slate-300' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
              }`}
            >
              {ROLE_ARCHETYPES[relationship.target_role_archetype] ||
                relationship.target_role_archetype}
            </Text>
          </View>
        )}

        {relationship.target_hours_per_week && (
          <View className="flex-row items-center">
            <Clock size={12} color={isDark ? '#64748b' : '#9ca3af'} />
            <Text className={`${textSecondary} text-xs ml-0.5`}>
              {relationship.target_hours_per_week} hrs
            </Text>
          </View>
        )}

        {person.remote_ok && (
          <View className="flex-row items-center">
            <MapPin size={12} color={isDark ? '#64748b' : '#9ca3af'} />
            <Text className={`${textSecondary} text-xs ml-0.5`}>Remote</Text>
          </View>
        )}
      </View>

      {/* Actions (on long press) */}
      {showActions && (
        <Animated.View entering={FadeInDown} className="mt-3 pt-3 border-t border-slate-700/50">
          <View className="flex-row flex-wrap gap-2">
            {/* Stage move buttons */}
            {getNextStages().map((stage) => {
              const stageConfig = PIPELINE_STAGES.find((s) => s.stage === stage);
              return (
                <HapticPressable
                  key={stage}
                  onPress={() => {
                    onMoveStage(stage);
                    setShowActions(false);
                  }}
                  className={`flex-row items-center px-3 py-1.5 rounded-lg ${
                    isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200'
                  }`}
                >
                  {stageConfig?.icon}
                  <Text
                    className={`text-xs ml-1 ${
                      isDark ? 'text-slate-300' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                    }`}
                  >
                    {stageConfig?.label}
                  </Text>
                </HapticPressable>
              );
            })}

            {/* Create outreach button */}
            <HapticPressable
              onPress={() => {
                onCreateOutreach();
                setShowActions(false);
              }}
              className="flex-row items-center px-3 py-1.5 rounded-lg bg-blue-600"
            >
              <Send size={12} color="white" />
              <Text className="text-white text-xs font-medium ml-1">Outreach</Text>
            </HapticPressable>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}
