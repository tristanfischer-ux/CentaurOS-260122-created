/**
 * AddCandidateModal - Create stub candidates or search marketplace
 *
 * Used to add new candidates to the hiring pipeline
 */

import { View, Text, TextInput, ScrollView, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import {
  X,
  UserPlus,
  Search,
  Link2,
  Briefcase,
  GraduationCap,
  Star,
  Wrench,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { HapticPressable } from './HapticPressable';
import { lightImpact } from '@/lib/haptics';
import type {
  CreateStubRequest,
  PersonType,
  RoleArchetype,
  SourceType,
} from '@/lib/people/types';
import { ROLE_ARCHETYPES, SECTOR_TAGS } from '@/lib/people/types';

interface AddCandidateModalProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
  userId: string;
  onCandidateAdded?: (relationshipId: string) => void;
  onOpenWizard?: () => void;
}

// Source type options
const SOURCE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'referral', label: 'Referral' },
  { value: 'manual', label: 'Manual entry' },
  { value: 'event', label: 'Event/Conference' },
  { value: 'platform', label: 'Platform' },
];

// Person type options
const PERSON_TYPE_OPTIONS: { value: PersonType; label: string; icon: React.ReactNode }[] = [
  { value: 'fractional_exec', label: 'Fractional Exec', icon: <Briefcase size={16} color="#8b5cf6" /> },
  { value: 'apprentice', label: 'Apprentice', icon: <GraduationCap size={16} color="#10b981" /> },
  { value: 'advisor', label: 'Advisor', icon: <Star size={16} color="#f59e0b" /> },
  { value: 'contractor', label: 'Contractor', icon: <Wrench size={16} color="#3b82f6" /> },
];

// Common role archetypes by person type
const ROLE_OPTIONS_BY_TYPE: Record<PersonType, RoleArchetype[]> = {
  fractional_exec: [
    'fractional_ceo',
    'fractional_coo',
    'fractional_cfo',
    'fractional_cto',
    'fractional_cmo',
    'fractional_cpo',
    'fractional_cro',
    'fractional_chro',
  ],
  apprentice: [
    'apprentice_finance',
    'apprentice_ops',
    'apprentice_engineering',
    'apprentice_cad',
    'apprentice_sales',
    'apprentice_marketing',
    'apprentice_data',
  ],
  advisor: [
    'advisor_board',
    'advisor_strategic',
    'advisor_technical',
    'advisor_industry',
    'advisor_investor',
  ],
  contractor: [
    'contractor_engineering',
    'contractor_design',
    'contractor_marketing',
    'contractor_sales',
    'contractor_ops',
    'contractor_finance',
  ],
  other: [],
};

export function AddCandidateModal({
  visible,
  onClose,
  workspaceId,
  userId,
  onCandidateAdded,
  onOpenWizard,
}: AddCandidateModalProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [personType, setPersonType] = useState<PersonType>('fractional_exec');
  const [targetRole, setTargetRole] = useState<RoleArchetype | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>('referral');
  const [sourceNotes, setSourceNotes] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [targetHours, setTargetHours] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);

  // Theme colors
  const bgColor = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';
  const inputBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-100';

  // Reset form
  const resetForm = () => {
    setDisplayName('');
    setLinkedinUrl('');
    setPersonType('fractional_exec');
    setTargetRole(null);
    setSourceType('referral');
    setSourceNotes('');
    setPrivateNotes('');
    setTargetHours('');
    setError(null);
    setSuccess(false);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Submit stub
  const handleSubmit = useCallback(async () => {
    if (!displayName.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    lightImpact();

    try {
      const stub: CreateStubRequest = {
        display_name: displayName.trim(),
        person_type: personType,
        source_type: sourceType,
        source_notes: sourceNotes.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        target_role_archetype: targetRole || undefined,
        target_hours_per_week: targetHours ? parseInt(targetHours, 10) : undefined,
        notes_private: privateNotes.trim() || undefined,
      };

      const res = await fetch('/api/people/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: userId,
          stub,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add candidate');
      }

      setSuccess(true);
      onCandidateAdded?.(data.data.id);

      // Close after brief success state
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add candidate');
    } finally {
      setIsLoading(false);
    }
  }, [displayName, personType, sourceType, sourceNotes, linkedinUrl, targetRole, targetHours, privateNotes, workspaceId, userId, onCandidateAdded]);

  // Available roles for selected person type
  const availableRoles = ROLE_OPTIONS_BY_TYPE[personType] || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/70" onPress={handleClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <Animated.View
            entering={SlideInUp}
            className={`${bgColor} rounded-t-3xl`}
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* Header */}
            <View className={`flex-row items-center justify-between px-5 py-4 border-b ${borderColor}`}>
              <Text className={`${textPrimary} text-xl font-bold`}>Add Candidate</Text>
              <Pressable onPress={handleClose} className="p-2 -mr-2">
                <X size={24} color={isDark ? '#94a3b8' : '#6b7280'} />
              </Pressable>
            </View>

            <ScrollView
              className="px-5 py-4"
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Success State */}
              {success && (
                <Animated.View
                  entering={FadeInDown}
                  className="items-center py-8"
                >
                  <CheckCircle2 size={48} color="#10b981" />
                  <Text className={`${textPrimary} text-lg font-semibold mt-3`}>
                    Candidate Added!
                  </Text>
                  <Text className={textSecondary}>
                    Added to your pipeline
                  </Text>
                </Animated.View>
              )}

              {!success && (
                <>
                  {/* Quick Search Option */}
                  <HapticPressable
                    onPress={() => {
                      handleClose();
                      onOpenWizard?.();
                    }}
                    className={`flex-row items-center justify-center p-4 rounded-xl ${cardBg} mb-6`}
                  >
                    <Search size={20} color="#3b82f6" />
                    <Text className="text-blue-600 font-semibold ml-2">
                      Search Marketplace Instead
                    </Text>
                  </HapticPressable>

                  <View className="flex-row items-center mb-4">
                    <View className="flex-1 h-px bg-slate-700" />
                    <Text className={`${textSecondary} mx-4`}>or create stub</Text>
                    <View className="flex-1 h-px bg-slate-700" />
                  </View>

                  {/* Error */}
                  {error && (
                    <Animated.View
                      entering={FadeIn}
                      className="flex-row items-center bg-red-100 dark:bg-red-900/30 rounded-xl p-3 mb-4"
                    >
                      <AlertCircle size={18} color="#ef4444" />
                      <Text className="text-red-600 dark:text-red-400 ml-2 flex-1">{error}</Text>
                    </Animated.View>
                  )}

                  {/* Name Input */}
                  <View className="mb-4">
                    <Text className={`${textSecondary} text-sm mb-1.5`}>Name *</Text>
                    <TextInput
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="Enter candidate name"
                      placeholderTextColor={isDark ? '#64748b' : isOffWhite ? '#78716c' : '#9ca3af'}
                      className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl`}
                    />
                  </View>

                  {/* LinkedIn URL */}
                  <View className="mb-4">
                    <Text className={`${textSecondary} text-sm mb-1.5`}>LinkedIn URL (optional)</Text>
                    <View className="flex-row items-center">
                      <Link2 size={18} color={isDark ? '#64748b' : '#9ca3af'} />
                      <TextInput
                        value={linkedinUrl}
                        onChangeText={setLinkedinUrl}
                        placeholder="https://linkedin.com/in/..."
                        placeholderTextColor={isDark ? '#64748b' : isOffWhite ? '#78716c' : '#9ca3af'}
                        autoCapitalize="none"
                        keyboardType="url"
                        className={`flex-1 ${inputBg} ${textPrimary} px-4 py-3 rounded-xl ml-2`}
                      />
                    </View>
                  </View>

                  {/* Person Type */}
                  <View className="mb-4">
                    <Text className={`${textSecondary} text-sm mb-1.5`}>Type</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {PERSON_TYPE_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.value}
                          onPress={() => {
                            setPersonType(opt.value);
                            setTargetRole(null);
                            lightImpact();
                          }}
                          className={`flex-row items-center px-3 py-2 rounded-lg border ${
                            personType === opt.value
                              ? 'bg-blue-600 border-blue-600'
                              : `${cardBg} ${borderColor}`
                          }`}
                        >
                          {opt.icon}
                          <Text
                            className={`ml-1.5 ${
                              personType === opt.value ? 'text-white font-medium' : textSecondary
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Target Role */}
                  <View className="mb-4">
                    <Text className={`${textSecondary} text-sm mb-1.5`}>Target Role (optional)</Text>
                    <Pressable
                      onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                      className={`flex-row items-center justify-between px-4 py-3 rounded-xl ${inputBg}`}
                    >
                      <Text className={targetRole ? textPrimary : textSecondary}>
                        {targetRole ? ROLE_ARCHETYPES[targetRole] : 'Select role...'}
                      </Text>
                      <ChevronDown size={18} color={isDark ? '#64748b' : '#9ca3af'} />
                    </Pressable>

                    {showRoleDropdown && (
                      <Animated.View
                        entering={FadeInDown}
                        className={`mt-2 rounded-xl ${cardBg} border ${borderColor} p-2 max-h-40`}
                      >
                        <ScrollView nestedScrollEnabled>
                          {availableRoles.map((role) => (
                            <Pressable
                              key={role}
                              onPress={() => {
                                setTargetRole(role);
                                setShowRoleDropdown(false);
                                lightImpact();
                              }}
                              className={`px-3 py-2 rounded-lg ${
                                targetRole === role ? 'bg-blue-600' : ''
                              }`}
                            >
                              <Text
                                className={targetRole === role ? 'text-white' : textPrimary}
                              >
                                {ROLE_ARCHETYPES[role]}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </Animated.View>
                    )}
                  </View>

                  {/* Target Hours */}
                  <View className="mb-4">
                    <Text className={`${textSecondary} text-sm mb-1.5`}>Target Hours/Week (optional)</Text>
                    <TextInput
                      value={targetHours}
                      onChangeText={setTargetHours}
                      placeholder="e.g., 12"
                      placeholderTextColor={isDark ? '#64748b' : isOffWhite ? '#78716c' : '#9ca3af'}
                      keyboardType="number-pad"
                      className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl`}
                    />
                  </View>

                  {/* Source Type */}
                  <View className="mb-4">
                    <Text className={`${textSecondary} text-sm mb-1.5`}>Source</Text>
                    <Pressable
                      onPress={() => setShowSourceDropdown(!showSourceDropdown)}
                      className={`flex-row items-center justify-between px-4 py-3 rounded-xl ${inputBg}`}
                    >
                      <Text className={textPrimary}>
                        {SOURCE_OPTIONS.find((s) => s.value === sourceType)?.label || sourceType}
                      </Text>
                      <ChevronDown size={18} color={isDark ? '#64748b' : '#9ca3af'} />
                    </Pressable>

                    {showSourceDropdown && (
                      <Animated.View
                        entering={FadeInDown}
                        className={`mt-2 rounded-xl ${cardBg} border ${borderColor} p-2`}
                      >
                        {SOURCE_OPTIONS.map((src) => (
                          <Pressable
                            key={src.value}
                            onPress={() => {
                              setSourceType(src.value);
                              setShowSourceDropdown(false);
                              lightImpact();
                            }}
                            className={`px-3 py-2 rounded-lg ${
                              sourceType === src.value ? 'bg-blue-600' : ''
                            }`}
                          >
                            <Text
                              className={sourceType === src.value ? 'text-white' : textPrimary}
                            >
                              {src.label}
                            </Text>
                          </Pressable>
                        ))}
                      </Animated.View>
                    )}
                  </View>

                  {/* Source Notes */}
                  <View className="mb-4">
                    <Text className={`${textSecondary} text-sm mb-1.5`}>Source Notes (optional)</Text>
                    <TextInput
                      value={sourceNotes}
                      onChangeText={setSourceNotes}
                      placeholder="e.g., Referred by John Smith"
                      placeholderTextColor={isDark ? '#64748b' : isOffWhite ? '#78716c' : '#9ca3af'}
                      className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl`}
                    />
                  </View>

                  {/* Private Notes */}
                  <View className="mb-6">
                    <Text className={`${textSecondary} text-sm mb-1.5`}>Private Notes (optional)</Text>
                    <TextInput
                      value={privateNotes}
                      onChangeText={setPrivateNotes}
                      placeholder="Internal notes about this candidate..."
                      placeholderTextColor={isDark ? '#64748b' : isOffWhite ? '#78716c' : '#9ca3af'}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      className={`${inputBg} ${textPrimary} px-4 py-3 rounded-xl min-h-[80px]`}
                    />
                  </View>

                  {/* Submit Button */}
                  <HapticPressable
                    onPress={handleSubmit}
                    disabled={isLoading || !displayName.trim()}
                    className={`flex-row items-center justify-center py-4 rounded-xl ${
                      !displayName.trim() ? 'bg-gray-400' : 'bg-blue-600'
                    }`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <UserPlus size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Add as Stub</Text>
                      </>
                    )}
                  </HapticPressable>

                  <Text className={`${textSecondary} text-xs text-center mt-3`}>
                    Stubs are private and only visible to your workspace
                  </Text>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
