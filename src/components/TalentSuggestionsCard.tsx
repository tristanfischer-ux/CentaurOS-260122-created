/**
 * TalentSuggestionsCard - Shows talent recommendations based on stage analysis
 *
 * Integrates with WHY tab to suggest when hiring help is needed
 */

import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  Users,
  Briefcase,
  GraduationCap,
  Star,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { HapticPressable } from './HapticPressable';
import { lightImpact } from '@/lib/haptics';
import type { RoleArchetype, StageFitTag, PersonType } from '@/lib/people/types';
import { ROLE_ARCHETYPES } from '@/lib/people/types';

interface TalentSuggestion {
  id: string;
  title: string;
  description: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  person_type: PersonType;
  suggested_role?: RoleArchetype;
  suggested_hours?: number;
  stage_fit?: StageFitTag;
  prefill_query?: string; // Pre-filled wizard query
}

interface TalentSuggestionsCardProps {
  companyStage?: StageFitTag;
  currentCapacityIssues?: string[];
  businessFunctions?: string[];
  onOpenWizard?: (prefillQuery?: string) => void;
  onDismiss?: (suggestionId: string) => void;
}

// Generate suggestions based on company context
function generateSuggestions(
  stage?: StageFitTag,
  capacityIssues?: string[],
  functions?: string[]
): TalentSuggestion[] {
  const suggestions: TalentSuggestion[] = [];

  // Stage-based suggestions
  if (stage === 'seed' || stage === 'pre_seed' || stage === 'mvp') {
    suggestions.push({
      id: 'early-ops',
      title: 'Operations Support',
      description: 'Early-stage companies often benefit from fractional ops help',
      reason: 'At your stage, founders typically spend 30%+ time on admin tasks',
      urgency: 'medium',
      person_type: 'fractional_exec',
      suggested_role: 'fractional_coo',
      suggested_hours: 8,
      stage_fit: stage,
      prefill_query: `Looking for a fractional COO for a ${stage.replace('_', ' ')} startup, 8-12 hours per week, experienced with early-stage operations`,
    });
  }

  if (stage === 'series_a' || stage === 'series_b') {
    suggestions.push({
      id: 'growth-finance',
      title: 'Finance Leadership',
      description: 'Professional finance leadership for growth stage',
      reason: 'Series A+ companies need proper financial controls and investor reporting',
      urgency: 'high',
      person_type: 'fractional_exec',
      suggested_role: 'fractional_cfo',
      suggested_hours: 12,
      stage_fit: stage,
      prefill_query: `Need a fractional CFO for ${stage.replace('_', ' ')} company, experience with fundraising and investor relations, 12-16 hours per week`,
    });
  }

  // Capacity-based suggestions
  if (capacityIssues?.includes('finance') || capacityIssues?.includes('accounting')) {
    suggestions.push({
      id: 'finance-apprentice',
      title: 'Finance Apprentice',
      description: 'Support for day-to-day finance tasks',
      reason: 'Your team has flagged capacity issues in finance',
      urgency: 'medium',
      person_type: 'apprentice',
      suggested_role: 'apprentice_finance',
      suggested_hours: 24,
      prefill_query: 'Looking for a finance apprentice to help with bookkeeping, FP&A support, and financial modeling, 20-30 hours per week',
    });
  }

  if (capacityIssues?.includes('ops') || capacityIssues?.includes('admin')) {
    suggestions.push({
      id: 'ops-apprentice',
      title: 'Ops Apprentice',
      description: 'Administrative and process support',
      reason: 'Your team has flagged capacity issues in operations',
      urgency: 'medium',
      person_type: 'apprentice',
      suggested_role: 'apprentice_ops',
      suggested_hours: 32,
      prefill_query: 'Looking for an ops apprentice to help with process documentation, vendor management, and admin tasks, 24-32 hours per week',
    });
  }

  // Function-based suggestions
  if (functions?.includes('Engineering') && stage && ['series_a', 'series_b', 'growth'].includes(stage)) {
    suggestions.push({
      id: 'tech-advisor',
      title: 'Technical Advisor',
      description: 'Strategic technology guidance',
      reason: 'Engineering function could benefit from external technical perspective',
      urgency: 'low',
      person_type: 'advisor',
      suggested_role: 'advisor_technical',
      prefill_query: 'Looking for a technical advisor with experience in scaling engineering teams, architecture reviews, remote OK',
    });
  }

  // Default suggestion if no specific ones apply
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'explore-talent',
      title: 'Explore Talent Pool',
      description: 'Browse our marketplace of fractional executives and apprentices',
      reason: 'Find the right talent for your current needs',
      urgency: 'low',
      person_type: 'other',
      prefill_query: undefined,
    });
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}

export function TalentSuggestionsCard({
  companyStage,
  currentCapacityIssues,
  businessFunctions,
  onOpenWizard,
  onDismiss,
}: TalentSuggestionsCardProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Theme colors
  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';

  // Generate suggestions
  const suggestions = generateSuggestions(companyStage, currentCapacityIssues, businessFunctions)
    .filter((s) => !dismissedIds.has(s.id));

  if (suggestions.length === 0) {
    return null;
  }

  // Handle dismiss
  const handleDismiss = (id: string) => {
    lightImpact();
    setDismissedIds((prev) => new Set([...prev, id]));
    onDismiss?.(id);
  };

  // Get urgency color
  const getUrgencyColor = (urgency: TalentSuggestion['urgency']) => {
    switch (urgency) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  // Get person type icon
  const getPersonTypeIcon = (type: PersonType) => {
    switch (type) {
      case 'fractional_exec':
        return <Briefcase size={16} color={isDark ? '#a78bfa' : '#8b5cf6'} />;
      case 'apprentice':
        return <GraduationCap size={16} color={isDark ? '#34d399' : '#10b981'} />;
      case 'advisor':
        return <Star size={16} color={isDark ? '#fbbf24' : '#f59e0b'} />;
      default:
        return <Users size={16} color={isDark ? '#94a3b8' : '#6b7280'} />;
    }
  };

  return (
    <Animated.View entering={FadeInDown} className={`${cardBg} rounded-2xl p-4 border ${borderColor}`}>
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <View
          className={`w-8 h-8 rounded-full items-center justify-center ${
            isDark ? 'bg-purple-900/50' : 'bg-purple-100'
          }`}
        >
          <Sparkles size={16} color={isDark ? '#c4b5fd' : '#8b5cf6'} />
        </View>
        <View className="ml-2 flex-1">
          <Text className={`${textPrimary} font-semibold`}>Talent Suggestions</Text>
          <Text className={`${textSecondary} text-xs`}>Based on your company stage and needs</Text>
        </View>
      </View>

      {/* Suggestions */}
      <View className="gap-2">
        {suggestions.map((suggestion, idx) => (
          <Animated.View key={suggestion.id} entering={FadeInRight.delay(idx * 50)}>
            <Pressable
              onPress={() => {
                lightImpact();
                onOpenWizard?.(suggestion.prefill_query);
              }}
              className={`p-3 rounded-xl ${
                isDark ? 'bg-slate-700/50' : isOffWhite ? 'bg-stone-200/50' : 'bg-gray-100'
              }`}
            >
              <View className="flex-row items-start">
                {/* Icon */}
                <View
                  className={`w-10 h-10 rounded-lg items-center justify-center ${
                    isDark ? 'bg-slate-600' : 'bg-gray-200'
                  }`}
                >
                  {getPersonTypeIcon(suggestion.person_type)}
                </View>

                {/* Content */}
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text className={`${textPrimary} font-semibold`}>{suggestion.title}</Text>
                    {suggestion.urgency !== 'low' && (
                      <View
                        className="ml-2 px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${getUrgencyColor(suggestion.urgency)}20` }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: getUrgencyColor(suggestion.urgency) }}
                        >
                          {suggestion.urgency === 'high' ? 'Urgent' : 'Recommended'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className={`${textSecondary} text-sm`}>{suggestion.description}</Text>

                  {/* Details */}
                  <View className="flex-row flex-wrap items-center gap-2 mt-2">
                    {suggestion.suggested_role && (
                      <View
                        className={`px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-slate-600' : 'bg-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            isDark ? 'text-slate-300' : 'text-gray-600'
                          }`}
                        >
                          {ROLE_ARCHETYPES[suggestion.suggested_role]}
                        </Text>
                      </View>
                    )}

                    {suggestion.suggested_hours && (
                      <View className="flex-row items-center">
                        <Clock size={12} color={isDark ? '#64748b' : '#9ca3af'} />
                        <Text className={`${textSecondary} text-xs ml-0.5`}>
                          {suggestion.suggested_hours} hrs/wk
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Reason */}
                  <View className="flex-row items-start mt-2">
                    <TrendingUp size={12} color={isDark ? '#64748b' : '#9ca3af'} className="mt-0.5" />
                    <Text className={`${textSecondary} text-xs ml-1 flex-1`}>
                      {suggestion.reason}
                    </Text>
                  </View>
                </View>

                {/* Arrow */}
                <ChevronRight size={18} color={isDark ? '#64748b' : '#9ca3af'} />
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* View All Button */}
      <HapticPressable
        onPress={() => onOpenWizard?.()}
        className={`flex-row items-center justify-center py-2.5 rounded-xl mt-3 ${
          isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200'
        }`}
      >
        <Users size={16} color={isDark ? '#94a3b8' : '#6b7280'} />
        <Text
          className={`font-medium ml-2 ${
            isDark ? 'text-slate-300' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
          }`}
        >
          Explore Full Talent Marketplace
        </Text>
      </HapticPressable>
    </Animated.View>
  );
}
