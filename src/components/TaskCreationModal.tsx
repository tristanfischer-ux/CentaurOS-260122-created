/**
 * TaskCreationModal - V4 Implementation
 *
 * 75% height bottom sheet with:
 * - Drafts displayed at TOP (visible immediately)
 * - Checkbox selection for bulk confirm
 * - Inline edit expansion (not nested sheets)
 * - Team availability with horizontal capacity bars
 * - Voice/Text input at bottom
 * - Keyboard-aware height (75% idle, 95% with keyboard)
 * - Standard swipe-to-close when scroll at top
 */

import { View, Text, Pressable, ScrollView, Dimensions, TextInput, Keyboard, Alert } from 'react-native';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Check,
  ChevronDown,
  Mic,
  Type,
  Trash2,
  Clock,
  User,
  Briefcase,
  Calendar,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  Target,
  Paperclip,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useDraftStore, type Draft } from '@/lib/state/draft-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { VoiceInputButton } from './VoiceInputButton';
import { useTheme } from '@/lib/ThemeContext';
import { useObjectivesStore } from '@/lib/state/objectives-store';

interface TaskCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onVoiceTranscript: (transcript: string) => void;
  onTextSubmit: (text: string) => void;
  onConfirmDrafts: (draftIds: string[]) => void;
  accentColor?: string;
}

type InputMode = 'idle' | 'voice' | 'text';

// Constants
const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

const FUNCTION_OPTIONS = ['Ops', 'Marketing', 'Sales', 'Finance', 'Engineering', 'Admin'] as const;

const getCapacityPerWeek = (member: OrganizationMember): { normal: number; overtime: number } => {
  if (member.role === 'Founder' || member.role === 'Apprentice') {
    return { normal: 10, overtime: 5 };
  }
  const daysPerWeek = member.daysPerWeek || 2;
  const normalSquares = daysPerWeek * 2;
  const overtimeSquares = Math.min((5 - daysPerWeek) * 2, 10);
  return { normal: normalSquares, overtime: overtimeSquares };
};

const getAllocatedTUs = (memberId: string, workPlans: WorkPlan[]): number => {
  return workPlans
    .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
    .reduce((total, wp) => {
      const allocation = wp.allocations.find(a => a.memberId === memberId);
      return total + (allocation?.squaresPerWeek || 0);
    }, 0);
};

export function TaskCreationModal({
  visible,
  onClose,
  onVoiceTranscript,
  onTextSubmit,
  onConfirmDrafts,
  accentColor = '#10b981',
}: TaskCreationModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const screenHeight = Dimensions.get('window').height;

  // Stores
  const allMembers = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const drafts = useDraftStore(s => s.drafts);
  const updateDraft = useDraftStore(s => s.updateDraft);
  const removeDraft = useDraftStore(s => s.removeDraft);
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  const effectiveWorkspace = currentWorkspace || {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Demo Workspace'
  };

  const effectiveMembership = currentMembership ||
    (allMembers.length > 0
      ? { id: allMembers[0].id, role: allMembers[0].role, function: allMembers[0].function }
      : { id: '00000000-0000-0000-0000-000000000001', role: 'Founder' as const, function: 'Engineering' as const });

  const members = useMemo(() =>
    allMembers.filter((m: OrganizationMember) => m.status === 'active'),
    [allMembers]
  );

  // Filter drafts by workspace
  const workspaceDrafts = useMemo(() => {
    return drafts.filter(d => d.workspaceId === effectiveWorkspace.id);
  }, [drafts, effectiveWorkspace.id]);

  // Limit displayed drafts to 10
  const displayedDrafts = useMemo(() => workspaceDrafts.slice(0, 10), [workspaceDrafts]);
  const hasMoreDrafts = workspaceDrafts.length > 10;

  // State
  const [inputMode, setInputMode] = useState<InputMode>('idle');
  const [textInput, setTextInput] = useState('');
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ draftId: string; field: string } | null>(null);
  const [showAllDrafts, setShowAllDrafts] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [deletedDraft, setDeletedDraft] = useState<{ draft: Draft; timeout: ReturnType<typeof setTimeout> } | null>(null);
  const objectives = useObjectivesStore(s => s.objectives);
  const initializeObjectives = useObjectivesStore(s => s.initialize);

  useEffect(() => {
    initializeObjectives();
  }, []);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);

  // Animation values
  const COLLAPSED_HEIGHT = 0;
  const IDLE_HEIGHT = screenHeight * 0.75;
  const KEYBOARD_HEIGHT = screenHeight * 0.95;

  const translateY = useSharedValue(screenHeight);
  const currentHeight = useSharedValue(IDLE_HEIGHT);

  // Keyboard handling
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      currentHeight.value = withTiming(KEYBOARD_HEIGHT, { duration: 250 });
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      currentHeight.value = withTiming(IDLE_HEIGHT, { duration: 250 });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [IDLE_HEIGHT, KEYBOARD_HEIGHT, currentHeight]);

  // Open/close animation
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    } else {
      translateY.value = withSpring(screenHeight, { damping: 20, stiffness: 90 });
      // Reset state when closing
      setInputMode('idle');
      setTextInput('');
      setExpandedDraftId(null);
      setEditingField(null);
    }
  }, [visible, screenHeight, translateY]);

  // Swipe to close gesture handler
  const closeModal = useCallback(() => {
    onClose();
  }, [onClose]);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startY: number }>({
    onStart: (_, ctx) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      // Only allow swipe down when scroll is at top
      if (scrollOffset.current <= 0 && event.translationY > 0) {
        translateY.value = ctx.startY + event.translationY;
      }
    },
    onEnd: (event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withSpring(screenHeight, { damping: 20, stiffness: 90 });
        runOnJS(closeModal)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: currentHeight.value,
  }));

  // Team stats
  const teamStats = useMemo(() => {
    return members.map((member: OrganizationMember) => {
      const capacity = getCapacityPerWeek(member);
      const totalCapacity = capacity.normal + capacity.overtime;
      const allocated = getAllocatedTUs(member.id, workPlans);
      const available = Math.max(0, totalCapacity - allocated);
      const utilizationPercent = Math.round((allocated / totalCapacity) * 100);
      const isOverAllocated = allocated > totalCapacity;

      return {
        member,
        capacity,
        totalCapacity,
        allocated,
        available,
        utilizationPercent,
        isOverAllocated,
      };
    });
  }, [members, workPlans]);

  // Draft selection handlers
  const toggleDraftSelection = (draftId: string) => {
    setSelectedDraftIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(draftId)) {
        newSet.delete(draftId);
      } else {
        newSet.add(draftId);
      }
      return newSet;
    });
  };

  const selectAllDrafts = () => {
    const draftsToSelect = showAllDrafts ? workspaceDrafts : displayedDrafts;
    setSelectedDraftIds(new Set(draftsToSelect.map(d => d.id)));
  };

  const clearSelection = () => {
    setSelectedDraftIds(new Set());
  };

  // Confirm handler with warning
  const handleConfirm = () => {
    if (selectedDraftIds.size === 0) return;

    const selectedDrafts = workspaceDrafts.filter(d => selectedDraftIds.has(d.id));
    const lowConfidenceDrafts = selectedDrafts.filter(d =>
      (d.sourceMetadata?.confidence ?? 0.8) < 0.7
    );
    const hasProblems = selectedDrafts.some(d => !d.title.trim());

    if (hasProblems) {
      Alert.alert(
        'Cannot Confirm',
        'Some drafts have missing titles. Please fix them before confirming.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (lowConfidenceDrafts.length > 0) {
      Alert.alert(
        'Review Recommended',
        `${lowConfidenceDrafts.length} draft(s) have low AI confidence. Confirm anyway?`,
        [
          { text: 'Review First', style: 'cancel' },
          {
            text: 'Confirm Anyway', onPress: () => {
              onConfirmDrafts(Array.from(selectedDraftIds));
              setSelectedDraftIds(new Set());
            }
          }
        ]
      );
    } else {
      onConfirmDrafts(Array.from(selectedDraftIds));
      setSelectedDraftIds(new Set());
    }
  };

  // Delete with undo
  const handleDeleteDraft = (draft: Draft) => {
    // Clear any existing undo
    if (deletedDraft?.timeout) {
      clearTimeout(deletedDraft.timeout);
      removeDraft(deletedDraft.draft.id);
    }

    // Remove from selection
    setSelectedDraftIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(draft.id);
      return newSet;
    });

    // Store draft and set timeout for permanent delete
    const timeout = setTimeout(() => {
      removeDraft(draft.id);
      setDeletedDraft(null);
    }, 5000);

    setDeletedDraft({ draft, timeout });
  };

  const undoDelete = () => {
    if (deletedDraft) {
      clearTimeout(deletedDraft.timeout);
      setDeletedDraft(null);
    }
  };

  // Text submit handler
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onTextSubmit(textInput.trim());
      setTextInput('');
      setInputMode('idle');
    }
  };

  // Voice complete handler
  const handleVoiceComplete = (transcript: string) => {
    onVoiceTranscript(transcript);
    setInputMode('idle');
  };

  // Update draft field
  const handleUpdateDraft = (draftId: string, field: string, value: string | number) => {
    updateDraft(draftId, { [field]: value });
    setEditingField(null);
  };

  // Get assignee picker options with capacity
  const getAssigneeOptions = () => {
    return teamStats.map(({ member, available }) => ({
      id: member.id,
      name: member.name,
      label: `${member.name} (${available} TU free)`,
      available,
    }));
  };

  if (!visible) return null;

  const draftsToShow = showAllDrafts ? workspaceDrafts : displayedDrafts;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <Pressable style={{ flex: 1 }} onPress={onClose} />

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={[
            animatedStyle,
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 20,
            },
          ]}
        >
          {/* Handle Bar */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-3 border-b border-slate-200 dark:border-slate-700">
            <Text className="text-slate-900 dark:text-white text-lg font-bold">
              New Task
            </Text>
            <Pressable onPress={onClose} className="p-2 -mr-2">
              <X size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>

          {/* Undo Toast */}
          {deletedDraft && (
            <View
              className="mx-4 mt-2 flex-row items-center justify-between bg-slate-800 rounded-xl px-4 py-3"
              style={{ position: 'absolute', top: 60, left: 0, right: 0, zIndex: 100 }}
            >
              <Text className="text-white text-sm">Draft deleted</Text>
              <Pressable onPress={undoDelete}>
                <Text className="text-blue-400 font-semibold text-sm">Undo</Text>
              </Pressable>
            </View>
          )}

          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={true}
            onScroll={(e) => {
              scrollOffset.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            {/* Drafts Section */}
            {workspaceDrafts.length > 0 && (
              <View className="px-4 pt-3">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-900 dark:text-white font-semibold">
                    Drafts ({workspaceDrafts.length})
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {selectedDraftIds.size > 0 && (
                      <>
                        <Pressable onPress={clearSelection} className="px-2 py-1">
                          <Text className="text-slate-500 text-xs">Clear</Text>
                        </Pressable>
                        <Pressable
                          onPress={handleConfirm}
                          className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Check size={14} color="white" />
                          <Text className="text-white text-xs font-semibold">
                            Confirm ({selectedDraftIds.size})
                          </Text>
                        </Pressable>
                      </>
                    )}
                    {draftsToShow.length > 1 && selectedDraftIds.size !== draftsToShow.length && (
                      <Pressable onPress={selectAllDrafts} className="px-2 py-1">
                        <Text className="text-blue-500 text-xs font-medium">Select All</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Draft Cards */}
                {draftsToShow.filter(d => d.id !== deletedDraft?.draft.id).map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    isSelected={selectedDraftIds.has(draft.id)}
                    isExpanded={expandedDraftId === draft.id}
                    onToggleSelect={() => toggleDraftSelection(draft.id)}
                    onToggleExpand={() => setExpandedDraftId(
                      expandedDraftId === draft.id ? null : draft.id
                    )}
                    onDelete={() => handleDeleteDraft(draft)}
                    onUpdate={(field, value) => handleUpdateDraft(draft.id, field, value)}
                    members={members}
                    teamStats={teamStats}
                    isDark={isDark}
                  />
                ))}

                {/* Show More */}
                {hasMoreDrafts && !showAllDrafts && (
                  <Pressable
                    onPress={() => setShowAllDrafts(true)}
                    className="py-3 items-center"
                  >
                    <Text className="text-blue-500 font-medium text-sm">
                      View {workspaceDrafts.length - 10} more drafts
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Team Availability Section */}
            <View className="px-4 pt-4 pb-4">
              <Text className="text-slate-900 dark:text-white font-semibold mb-3">
                Team Availability
              </Text>
              <View className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 mb-4">
                {teamStats.map(({ member, available, totalCapacity, utilizationPercent, isOverAllocated }) => {
                  const roleColor = ROLE_COLORS[member.role] || '#64748b';
                  const initials = member.name.split(' ').map((n: string) => n[0]).join('');

                  return (
                    <View
                      key={member.id}
                      className="flex-row items-center py-2 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                    >
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: roleColor }}
                      >
                        <Text className="text-white font-bold text-[10px]">{initials}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-900 dark:text-white text-sm font-medium" numberOfLines={1}>
                            {member.name}
                          </Text>
                          <Text
                            className="text-xs font-semibold"
                            style={{
                              color: isOverAllocated
                                ? '#ef4444'
                                : available > 0
                                  ? '#10b981'
                                  : '#f59e0b'
                            }}
                          >
                            {available} TU free
                          </Text>
                        </View>
                        <View className="h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, utilizationPercent)}%`,
                              backgroundColor: isOverAllocated
                                ? '#ef4444'
                                : utilizationPercent > 80
                                  ? '#f59e0b'
                                  : '#10b981'
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Instructions Card */}
              <View
                className="rounded-xl p-4 mb-4 border"
                style={{
                  backgroundColor: isDark ? `${accentColor}15` : `${accentColor}08`,
                  borderColor: isDark ? `${accentColor}30` : `${accentColor}20`,
                }}
              >
                <View className="flex-row items-start gap-3">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${accentColor}30` }}
                  >
                    <Lightbulb size={16} color={accentColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white text-sm font-bold mb-2">
                      How to describe your task:
                    </Text>
                    <Text className="text-slate-700 dark:text-slate-300 text-xs leading-5">
                      • <Text className="font-semibold">What</Text> needs to be done{'\n'}
                      • <Text className="font-semibold">Who</Text> should do it (name or leave blank){'\n'}
                      • <Text className="font-semibold">When</Text> it's due (date or "by Friday"){'\n'}
                      • <Text className="font-semibold">How long</Text> it'll take (hours or TU)
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-2 italic">
                      Example: "Sarah needs to review the marketing deck by Friday, should take 2 hours"
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Fixed Bottom Input Section */}
          <View
            className="border-t"
            style={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderTopColor: isDark ? '#334155' : '#e2e8f0',
              paddingBottom: insets.bottom,
            }}
          >
            {inputMode === 'text' ? (
              <View className="px-4 pt-3 pb-3">
                <TextInput
                  value={textInput}
                  onChangeText={setTextInput}
                  placeholder="Describe your tasks..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  multiline
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm mb-3"
                  style={{ textAlignVertical: 'top', minHeight: 100 }}
                  autoFocus
                />
                <View className="flex-row items-center justify-end gap-3">
                  <Pressable
                    onPress={() => {
                      setInputMode('idle');
                      setTextInput('');
                      Keyboard.dismiss();
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 font-medium">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleTextSubmit}
                    disabled={!textInput.trim()}
                    className="px-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: textInput.trim() ? accentColor : (isDark ? '#334155' : '#e2e8f0'),
                    }}
                  >
                    <Text
                      className="font-medium"
                      style={{ color: textInput.trim() ? 'white' : (isDark ? '#64748b' : '#94a3b8') }}
                    >
                      Extract Tasks
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="px-4 py-3">
                <View className="flex-row items-center justify-center gap-8">
                  <View className="items-center">
                    <View
                      className="w-16 h-16 rounded-2xl items-center justify-center mb-1.5"
                      style={{ backgroundColor: isDark ? `${accentColor}30` : `${accentColor}15` }}
                    >
                      <VoiceInputButton
                        onTranscriptComplete={handleVoiceComplete}
                        onError={(error) => console.log('[TaskCreationModal] Voice error:', error)}
                        color={accentColor}
                        size={56}
                        inline={true}
                      />
                    </View>
                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">Voice</Text>
                  </View>
                  <Pressable
                    onPress={() => setInputMode('text')}
                    className="items-center"
                  >
                    <View
                      className="w-16 h-16 rounded-2xl items-center justify-center mb-1.5"
                      style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.12)' }}
                    >
                      <Type size={26} color="#3b82f6" />
                    </View>
                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">Type</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

// Draft Card Component
interface DraftCardProps {
  draft: Draft;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onDelete: () => void;
  onUpdate: (field: string, value: string | number) => void;
  members: OrganizationMember[];
  teamStats: Array<{
    member: OrganizationMember;
    available: number;
  }>;
  isDark: boolean;
}

function DraftCard({
  draft,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onDelete,
  onUpdate,
  members,
  teamStats,
  isDark,
}: DraftCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(draft.title);
  // Single picker state - only one can be open at a time
  const [activePicker, setActivePicker] = useState<'assignee' | 'tu' | 'function' | 'objective' | null>(null);
  const objectives = useObjectivesStore(s => s.objectives);

  const confidence = draft.sourceMetadata?.confidence ?? 0.8;
  const confidenceColor = confidence >= 0.9
    ? '#10b981'
    : confidence >= 0.7
      ? '#f59e0b'
      : '#ef4444';

  const assignee = draft.assigneeId
    ? members.find(m => m.id === draft.assigneeId)
    : null;

  const initials = assignee?.name
    ? assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ME';

  const roleColor = assignee ? (ROLE_COLORS[assignee.role] || '#64748b') : '#3b82f6';

  const linkedObjective = draft.linkedObjectiveId
    ? objectives.find(o => o.id === draft.linkedObjectiveId)
    : null;

  // Handle picker toggle with haptic feedback
  const handlePickerToggle = (picker: 'assignee' | 'tu' | 'function' | 'objective') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Auto-expand card if not already expanded
    if (!isExpanded) {
      onToggleExpand();
    }
    setActivePicker(activePicker === picker ? null : picker);
  };

  // Handle confirm for this specific draft
  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleSelect(); // Select this draft
    // Trigger parent confirm logic via selection
  };

  return (
    <View
      className="bg-white dark:bg-slate-900 rounded-xl mb-2 border"
      style={{
        borderColor: isSelected
          ? '#10b981'
          : isDark ? '#334155' : '#e2e8f0',
        borderWidth: isSelected ? 2 : 1,
      }}
    >
      {/* Main Row */}
      <View className="flex-row items-center p-3">
        {/* Checkbox */}
        <Pressable
          onPress={onToggleSelect}
          className="mr-3"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View
            className="w-5 h-5 rounded-full border-2 items-center justify-center"
            style={{
              backgroundColor: isSelected ? '#10b981' : 'transparent',
              borderColor: isSelected ? '#10b981' : (isDark ? '#64748b' : '#cbd5e1'),
            }}
          >
            {isSelected && <Check size={12} color="white" />}
          </View>
        </Pressable>

        {/* Confidence Dot */}
        <View
          className="w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: confidenceColor }}
        />

        {/* Title */}
        <Pressable
          onPress={() => setEditingTitle(true)}
          className="flex-1 mr-2"
        >
          {editingTitle ? (
            <TextInput
              value={titleValue}
              onChangeText={setTitleValue}
              onBlur={() => {
                if (titleValue.trim()) {
                  onUpdate('title', titleValue.trim());
                }
                setEditingTitle(false);
              }}
              autoFocus
              className="text-slate-900 dark:text-white font-medium"
              style={{ padding: 0 }}
            />
          ) : (
            <Text className="text-slate-900 dark:text-white font-medium" numberOfLines={1}>
              {draft.title}
            </Text>
          )}
        </Pressable>

        {/* Expand/Collapse */}
        <Pressable
          onPress={onToggleExpand}
          className="p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isExpanded
            ? <ChevronUp size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            : <ChevronDown size={18} color={isDark ? '#94a3b8' : '#64748b'} />
          }
        </Pressable>
      </View>

      {/* Chips Row (always visible) */}
      <View className="flex-row items-center gap-2 px-3 pb-3 flex-wrap">
        {/* Assignee Chip */}
        <Pressable
          onPress={() => handlePickerToggle('assignee')}
          className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
          style={{
            backgroundColor: activePicker === 'assignee'
              ? (isDark ? '#1e3a5f' : '#dbeafe')
              : (isDark ? '#1e293b' : '#f1f5f9'),
            borderColor: activePicker === 'assignee'
              ? '#3b82f6'
              : (isDark ? '#334155' : '#e5e7eb'),
          }}
        >
          <View
            className="w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: roleColor }}
          >
            <Text className="text-white text-[8px] font-bold">{initials}</Text>
          </View>
          <Text className="text-slate-700 dark:text-slate-300 text-xs font-medium">
            {assignee?.name || 'You'}
          </Text>
          <ChevronDown
            size={14}
            color={isDark ? '#94a3b8' : '#64748b'}
            style={{ marginLeft: 2 }}
          />
        </Pressable>

        {/* TU Chip */}
        <Pressable
          onPress={() => handlePickerToggle('tu')}
          className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
          style={{
            backgroundColor: activePicker === 'tu'
              ? (isDark ? '#1e3a5f' : '#dbeafe')
              : (isDark ? '#1e293b' : '#f1f5f9'),
            borderColor: activePicker === 'tu'
              ? '#3b82f6'
              : (isDark ? '#334155' : '#e5e7eb'),
          }}
        >
          <Clock size={12} color={isDark ? '#94a3b8' : '#64748b'} />
          <Text className="text-slate-700 dark:text-slate-300 text-xs font-medium">
            {draft.units || 1} TU
          </Text>
          <ChevronDown
            size={14}
            color={isDark ? '#94a3b8' : '#64748b'}
            style={{ marginLeft: 2 }}
          />
        </Pressable>

        {/* Function Chip */}
        <Pressable
          onPress={() => handlePickerToggle('function')}
          className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
          style={{
            backgroundColor: activePicker === 'function'
              ? (isDark ? '#1e3a5f' : '#dbeafe')
              : (isDark ? '#1e293b' : '#f1f5f9'),
            borderColor: activePicker === 'function'
              ? '#3b82f6'
              : (isDark ? '#334155' : '#e5e7eb'),
          }}
        >
          <Briefcase size={12} color={isDark ? '#94a3b8' : '#64748b'} />
          <Text className="text-slate-700 dark:text-slate-300 text-xs font-medium">
            {draft.function || 'Ops'}
          </Text>
          <ChevronDown
            size={14}
            color={isDark ? '#94a3b8' : '#64748b'}
            style={{ marginLeft: 2 }}
          />
        </Pressable>

        {/* Objective Chip (MANDATORY) */}
        <Pressable
          onPress={() => handlePickerToggle('objective')}
          className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
          style={{
            backgroundColor: activePicker === 'objective'
              ? (isDark ? '#3b0764' : '#f5f3ff')
              : (isDark ? '#1e293b' : '#f1f5f9'),
            borderColor: activePicker === 'objective'
              ? '#8b5cf6'
              : !draft.linkedObjectiveId ? '#ef4444' : (isDark ? '#334155' : '#e5e7eb'),
          }}
        >
          <Target size={12} color={!draft.linkedObjectiveId ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')} />
          <Text className={`${!draft.linkedObjectiveId ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'} text-xs font-medium`}>
            {linkedObjective?.title || 'Relate to Objective'}
          </Text>
          <ChevronDown
            size={14}
            color={!draft.linkedObjectiveId ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')}
            style={{ marginLeft: 2 }}
          />
        </Pressable>

        {/* Attachment Count Chip */}
        {draft.attachments && draft.attachments.length > 0 && (
          <View className="flex-row items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
            <Paperclip size={10} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">
              {draft.attachments.length}
            </Text>
          </View>
        )}

        {/* Low Confidence Warning */}
        {confidence < 0.7 && (
          <View className="flex-row items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle size={12} color="#ef4444" />
            <Text className="text-red-600 dark:text-red-400 text-xs">Review</Text>
          </View>
        )}
      </View>

      {/* Expanded Content - Inline Pickers */}
      {isExpanded && (
        <View className="px-3 pb-3 border-t border-slate-200 dark:border-slate-700 pt-3">
          {/* Description */}
          {draft.description && (
            <Text className="text-slate-500 dark:text-slate-400 text-sm mb-3">
              {draft.description}
            </Text>
          )}

          {/* Assignee Picker */}
          {activePicker === 'assignee' && (
            <View className="mb-3">
              <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">Assign to:</Text>
              <View className="flex-row flex-wrap gap-2">
                {teamStats.map(({ member, available }) => (
                  <Pressable
                    key={member.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onUpdate('assigneeId', member.id);
                      onUpdate('assigneeName', member.name);
                      setActivePicker(null);
                    }}
                    className="flex-row items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: draft.assigneeId === member.id
                        ? (isDark ? '#1e3a5f' : '#dbeafe')
                        : (isDark ? '#1e293b' : '#f1f5f9'),
                    }}
                  >
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center"
                      style={{ backgroundColor: ROLE_COLORS[member.role] || '#64748b' }}
                    >
                      <Text className="text-white text-[9px] font-bold">
                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                      </Text>
                    </View>
                    <Text className="text-slate-700 dark:text-slate-300 text-sm">
                      {member.name}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: available > 0 ? '#10b981' : '#f59e0b' }}
                    >
                      ({available} TU)
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* TU Picker */}
          {activePicker === 'tu' && (
            <View className="mb-3">
              <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">Time Units:</Text>
              <View className="flex-row flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map(tu => (
                  <Pressable
                    key={tu}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onUpdate('units', tu);
                      setActivePicker(null);
                    }}
                    className="px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: draft.units === tu
                        ? (isDark ? '#1e3a5f' : '#dbeafe')
                        : (isDark ? '#1e293b' : '#f1f5f9'),
                    }}
                  >
                    <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                      {tu} TU
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Function Picker */}
          {activePicker === 'function' && (
            <View className="mb-3">
              <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">Function:</Text>
              <View className="flex-row flex-wrap gap-2">
                {FUNCTION_OPTIONS.map(func => (
                  <Pressable
                    key={func}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onUpdate('function', func);
                      setActivePicker(null);
                    }}
                    className="px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: draft.function === func
                        ? (isDark ? '#1e3a5f' : '#dbeafe')
                        : (isDark ? '#1e293b' : '#f1f5f9'),
                    }}
                  >
                    <Text className="text-slate-700 dark:text-slate-300 text-sm">
                      {func}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Objective Picker */}
          {activePicker === 'objective' && (
            <View className="mb-3">
              <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">Target Objective:</Text>
              <View className="gap-2">
                {objectives.map(obj => (
                  <Pressable
                    key={obj.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onUpdate('linkedObjectiveId', obj.id);
                      setActivePicker(null);
                    }}
                    className="flex-row items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{
                      backgroundColor: draft.linkedObjectiveId === obj.id
                        ? (isDark ? '#3b0764' : '#f5f3ff')
                        : (isDark ? '#1e293b' : '#f1f5f9'),
                      borderColor: draft.linkedObjectiveId === obj.id
                        ? '#8b5cf6'
                        : 'transparent',
                    }}
                  >
                    <Target size={14} color={draft.linkedObjectiveId === obj.id ? '#8b5cf6' : '#94a3b8'} />
                    <View className="flex-1">
                      <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium" numberOfLines={1}>
                        {obj.title}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-[10px]">{obj.category} • {obj.progress}%</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons Row */}
          <View className="flex-row items-center justify-between gap-3 mt-3">
            {/* Delete Button - Left */}
            <Pressable
              onPress={onDelete}
              className="flex-row items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
            >
              <Trash2 size={14} color="#ef4444" />
              <Text className="text-red-500 font-medium text-xs">Delete</Text>
            </Pressable>

            {/* Confirm Button - Right */}
            <Pressable
              onPress={handleConfirm}
              className="flex-row items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#10b981' }}
            >
              <Check size={14} color="white" />
              <Text className="text-white font-semibold text-sm">Confirm</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
