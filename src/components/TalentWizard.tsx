/**
 * TalentWizard - Natural Language Talent Search
 *
 * Accepts voice transcript or typed input to find matching candidates
 * Uses Claude API to interpret requests into structured filters
 */

import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  Mic,
  Search,
  Sparkles,
  UserPlus,
  ChevronRight,
  MapPin,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Building2,
  GraduationCap,
  Star,
} from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { HapticPressable } from './HapticPressable';
import { lightImpact } from '@/lib/haptics';
import type {
  WizardInterpretation,
  WizardResponse,
  PeopleSearchResult,
  RoleArchetype,
  SectorTag,
  StageFitTag,
} from '@/lib/people/types';
import { ROLE_ARCHETYPES } from '@/lib/people/types';

interface TalentWizardProps {
  workspaceId: string;
  userId: string;
  onAddToPipeline?: (personId: string) => void;
  onViewPerson?: (personId: string) => void;
  prefillQuery?: string;
}

// Example prompts for users
const EXAMPLE_PROMPTS = [
  'I need a fractional COO for a Series A fintech startup, 12 hours per week',
  'Looking for a finance apprentice with Excel skills, can start immediately',
  'We need a CTO advisor for hardware company, remote OK',
  'Find a fractional CFO experienced with fundraising, based in UK',
];

export function TalentWizard({
  workspaceId,
  userId,
  onAddToPipeline,
  onViewPerson,
  prefillQuery,
}: TalentWizardProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState(prefillQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<WizardResponse | null>(null);
  const [addingToPipeline, setAddingToPipeline] = useState<string | null>(null);

  // Theme colors
  const bgColor = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';

  // Execute wizard search
  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.length < 10) {
      setError('Please provide more details about who you are looking for');
      return;
    }

    setIsLoading(true);
    setError(null);
    lightImpact();

    try {
      const res = await fetch('/api/people/wizard/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      setResponse(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  // Add candidate to pipeline
  const handleAddToPipeline = useCallback(
    async (personId: string) => {
      setAddingToPipeline(personId);
      lightImpact();

      try {
        const res = await fetch('/api/people/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspaceId,
            user_id: userId,
            person_id: personId,
            relationship_type: 'candidate',
          }),
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to add to pipeline');
        }

        onAddToPipeline?.(personId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to pipeline');
      } finally {
        setAddingToPipeline(null);
      }
    },
    [workspaceId, userId, onAddToPipeline]
  );

  // Use example prompt
  const handleExampleClick = (example: string) => {
    setQuery(example);
    lightImpact();
  };

  return (
    <ScrollView
      className={`flex-1 ${bgColor}`}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      <View className="px-5 py-6">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <Sparkles size={24} color={isDark ? '#a78bfa' : '#8b5cf6'} />
            <Text className={`text-2xl font-bold ml-2 ${textPrimary}`}>Talent Wizard</Text>
          </View>
          <Text className={textSecondary}>
            Describe who you need and we'll find matching candidates
          </Text>
        </View>

        {/* Input Section */}
        <Animated.View entering={FadeInDown.delay(100)} className={`${cardBg} rounded-2xl p-4 mb-4`}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Describe the role you're looking to fill..."
            placeholderTextColor={isDark ? '#64748b' : isOffWhite ? '#78716c' : '#9ca3af'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className={`${textPrimary} text-base min-h-[100px] mb-4`}
            style={{ fontSize: 16 }}
          />

          <View className="flex-row items-center">
            <HapticPressable
              onPress={handleSearch}
              disabled={isLoading || query.length < 10}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                query.length < 10 ? 'bg-gray-300' : 'bg-blue-600'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Search size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Find Matches</Text>
                </>
              )}
            </HapticPressable>
          </View>
        </Animated.View>

        {/* Example Prompts */}
        {!response && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text className={`${textSecondary} text-sm mb-3`}>Try an example:</Text>
            <View className="flex-row flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleExampleClick(example)}
                  className={`${cardBg} rounded-lg px-3 py-2 border ${borderColor}`}
                  style={{ maxWidth: '100%' }}
                >
                  <Text className={`${textSecondary} text-sm`} numberOfLines={2}>
                    {example}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Error Display */}
        {error && (
          <Animated.View
            entering={FadeInDown}
            className="flex-row items-center bg-red-100 dark:bg-red-900/30 rounded-xl p-4 mb-4"
          >
            <AlertCircle size={20} color="#ef4444" />
            <Text className="text-red-600 dark:text-red-400 ml-2 flex-1">{error}</Text>
          </Animated.View>
        )}

        {/* Interpretation Display */}
        {response?.interpretation && (
          <Animated.View entering={FadeInDown} className={`${cardBg} rounded-2xl p-4 mb-4`}>
            <View className="flex-row items-center mb-3">
              <TrendingUp size={18} color={isDark ? '#60a5fa' : '#3b82f6'} />
              <Text className={`${textPrimary} font-semibold ml-2`}>Interpreted Request</Text>
              <View className="ml-auto bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-full">
                <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                  {response.interpretation.confidence}% confidence
                </Text>
              </View>
            </View>

            {response.interpretation.raw_intent && (
              <Text className={`${textSecondary} mb-3`}>{response.interpretation.raw_intent}</Text>
            )}

            <View className="flex-row flex-wrap gap-2">
              {response.interpretation.role && (
                <InterpretationTag
                  icon={<Briefcase size={14} color="#8b5cf6" />}
                  label={ROLE_ARCHETYPES[response.interpretation.role] || response.interpretation.role}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                />
              )}
              {response.interpretation.sectors?.map((sector) => (
                <InterpretationTag
                  key={sector}
                  icon={<Building2 size={14} color="#10b981" />}
                  label={sector.replace('_', ' ')}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                />
              ))}
              {response.interpretation.stages?.map((stage) => (
                <InterpretationTag
                  key={stage}
                  icon={<TrendingUp size={14} color="#f59e0b" />}
                  label={stage.replace('_', ' ')}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                />
              ))}
              {response.interpretation.hours_per_week && (
                <InterpretationTag
                  icon={<Clock size={14} color="#3b82f6" />}
                  label={`${response.interpretation.hours_per_week} hrs/week`}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                />
              )}
              {response.interpretation.remote_ok && (
                <InterpretationTag
                  icon={<MapPin size={14} color="#06b6d4" />}
                  label="Remote OK"
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                />
              )}
            </View>
          </Animated.View>
        )}

        {/* Results */}
        {response?.search_results && response.search_results.length > 0 && (
          <View className="mt-2">
            <Text className={`${textPrimary} font-semibold text-lg mb-3`}>
              {response.search_results.length} Matches Found
            </Text>

            {response.search_results.map((person, idx) => (
              <Animated.View
                key={person.id}
                entering={FadeInRight.delay(idx * 50)}
                className="mb-3"
              >
                <CandidateCard
                  person={person}
                  isDark={isDark}
                  isOffWhite={isOffWhite}
                  onView={() => onViewPerson?.(person.id)}
                  onAddToPipeline={() => handleAddToPipeline(person.id)}
                  isAdding={addingToPipeline === person.id}
                />
              </Animated.View>
            ))}
          </View>
        )}

        {/* No Results */}
        {response?.search_results && response.search_results.length === 0 && (
          <Animated.View entering={FadeInDown} className={`${cardBg} rounded-2xl p-6 items-center`}>
            <Search size={40} color={isDark ? '#64748b' : '#9ca3af'} />
            <Text className={`${textPrimary} font-semibold text-lg mt-3`}>No matches found</Text>
            <Text className={`${textSecondary} text-center mt-2`}>
              Try adjusting your search criteria or broadening your requirements
            </Text>

            {response.suggestions && response.suggestions.length > 0 && (
              <View className="mt-4 w-full">
                <Text className={`${textSecondary} text-sm mb-2`}>Suggestions:</Text>
                {response.suggestions.map((suggestion, idx) => (
                  <View key={idx} className="flex-row items-center mt-1">
                    <CheckCircle2 size={14} color="#10b981" />
                    <Text className={`${textSecondary} ml-2 text-sm`}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
}

// Interpretation tag component
function InterpretationTag({
  icon,
  label,
  isDark,
  isOffWhite,
}: {
  icon: React.ReactNode;
  label: string;
  isDark: boolean;
  isOffWhite: boolean;
}) {
  return (
    <View
      className={`flex-row items-center px-2 py-1 rounded-full ${
        isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200'
      }`}
    >
      {icon}
      <Text
        className={`ml-1 text-xs capitalize ${
          isDark ? 'text-slate-300' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

// Candidate result card
function CandidateCard({
  person,
  isDark,
  isOffWhite,
  onView,
  onAddToPipeline,
  isAdding,
}: {
  person: PeopleSearchResult;
  isDark: boolean;
  isOffWhite: boolean;
  onView: () => void;
  onAddToPipeline: () => void;
  isAdding: boolean;
}) {
  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';

  // Verification badge
  const getVerificationBadge = () => {
    if (person.verification_status === 'verified') {
      return (
        <View className="flex-row items-center bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
          <CheckCircle2 size={12} color="#10b981" />
          <Text className="text-green-600 dark:text-green-400 text-xs ml-1">Verified</Text>
        </View>
      );
    }
    if (person.verification_status === 'opted_in') {
      return (
        <View className="flex-row items-center bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
          <Star size={12} color="#3b82f6" />
          <Text className="text-blue-600 dark:text-blue-400 text-xs ml-1">Opted In</Text>
        </View>
      );
    }
    return null;
  };

  // Person type icon
  const getPersonTypeIcon = () => {
    switch (person.person_type) {
      case 'fractional_exec':
        return <Briefcase size={16} color={isDark ? '#a78bfa' : '#8b5cf6'} />;
      case 'apprentice':
        return <GraduationCap size={16} color={isDark ? '#34d399' : '#10b981'} />;
      case 'advisor':
        return <Star size={16} color={isDark ? '#fbbf24' : '#f59e0b'} />;
      default:
        return <Briefcase size={16} color={isDark ? '#94a3b8' : '#6b7280'} />;
    }
  };

  return (
    <View className={`${cardBg} rounded-2xl p-4 border ${borderColor}`}>
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            {getPersonTypeIcon()}
            <Text className={`${textPrimary} font-semibold text-lg ml-2`} numberOfLines={1}>
              {person.display_name}
            </Text>
          </View>
          {person.headline && (
            <Text className={textSecondary} numberOfLines={2}>
              {person.headline}
            </Text>
          )}
        </View>

        <View className="items-end">
          {getVerificationBadge()}
          <View className="mt-1 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
            <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">
              {person.match_score}% match
            </Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View className="flex-row flex-wrap gap-3 mb-3">
        {person.location_country && (
          <View className="flex-row items-center">
            <MapPin size={14} color={isDark ? '#64748b' : '#9ca3af'} />
            <Text className={`${textSecondary} text-sm ml-1`}>
              {person.location_city ? `${person.location_city}, ` : ''}
              {person.location_country}
            </Text>
          </View>
        )}
        {person.availability_hours_per_week && (
          <View className="flex-row items-center">
            <Clock size={14} color={isDark ? '#64748b' : '#9ca3af'} />
            <Text className={`${textSecondary} text-sm ml-1`}>
              {person.availability_hours_per_week} hrs/week
            </Text>
          </View>
        )}
        {person.remote_ok && (
          <View className="flex-row items-center">
            <CheckCircle2 size={14} color="#10b981" />
            <Text className={`${textSecondary} text-sm ml-1`}>Remote OK</Text>
          </View>
        )}
      </View>

      {/* Role Tags */}
      {person.role_archetypes && person.role_archetypes.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {person.role_archetypes.slice(0, 3).map((role) => (
            <View
              key={role}
              className={`px-2 py-0.5 rounded-full ${
                isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-xs ${
                  isDark ? 'text-slate-300' : isOffWhite ? 'text-stone-600' : 'text-gray-600'
                }`}
              >
                {ROLE_ARCHETYPES[role] || role}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={onView}
          className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl border ${borderColor}`}
        >
          <Text className={textSecondary}>View Profile</Text>
          <ChevronRight size={16} color={isDark ? '#64748b' : '#9ca3af'} />
        </Pressable>

        <HapticPressable
          onPress={onAddToPipeline}
          disabled={isAdding}
          className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl bg-blue-600"
        >
          {isAdding ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <UserPlus size={16} color="white" />
              <Text className="text-white font-semibold ml-1.5">Add to Pipeline</Text>
            </>
          )}
        </HapticPressable>
      </View>
    </View>
  );
}
