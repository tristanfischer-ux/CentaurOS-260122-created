/**
 * Unified Bottom Drawer
 * Instructions + Team Availability at top
 * Mic button (above People) and Type button (above Market) at bottom
 */

import { View, Text, Pressable, ScrollView, Dimensions, TextInput } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { ChevronUp, ChevronDown, Plus, Mic, Type, Lightbulb, Send } from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useFinanceStore } from '@/lib/state/finance-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { PersonDetailsModal } from './PersonDetailsModal';
import { VoiceInputButton } from './VoiceInputButton';

interface UnifiedBottomDrawerProps {
  selectedPersonId: string | null;
  onPersonSelect: (personId: string) => void;
  onVoiceTranscript: (transcript: string) => void;
  onTextSubmit: (text: string) => void;
  pendingDraftsCount?: number;
  openToNewTask?: boolean;
  accentColor?: string;
  newTaskTabLabel?: string;
}

type InputMode = 'voice' | 'text' | null;

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

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

export function UnifiedBottomDrawer({
  selectedPersonId,
  onPersonSelect,
  onVoiceTranscript,
  onTextSubmit,
  pendingDraftsCount = 0,
  openToNewTask = false,
  accentColor = '#10b981',
  newTaskTabLabel = 'New Task',
}: UnifiedBottomDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [textInput, setTextInput] = useState('');
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  const screenHeight = Dimensions.get('window').height;

  const allMembers = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const currentWorkspace = useCurrentWorkspace();
  const getCashBalance = useFinanceStore(s => s.getCashBalance);

  const members = useMemo(() =>
    allMembers.filter((m: OrganizationMember) => m.status === 'active'),
    [allMembers]
  );

  const COLLAPSED_HEIGHT = 60;
  const EXPANDED_HEIGHT = screenHeight * 0.55;

  const height = useSharedValue(COLLAPSED_HEIGHT);

  useEffect(() => {
    if (openToNewTask && !isExpanded) {
      setIsExpanded(true);
      setInputMode(null);
      height.value = EXPANDED_HEIGHT;
    }
  }, [openToNewTask, isExpanded, EXPANDED_HEIGHT, height]);

  useEffect(() => {
    if (isExpanded) {
      height.value = EXPANDED_HEIGHT;
    }
  }, [isExpanded, EXPANDED_HEIGHT, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withSpring(height.value, { damping: 20, stiffness: 90 }),
  }));

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    height.value = newExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
    if (!newExpanded) {
      setInputMode(null);
      setTextInput('');
    }
  };

  // Calculate team stats
  const { totalAllocated, totalAvailable } = useMemo(() => {
    let allocated = 0;
    let totalCapacity = 0;
    members.forEach((member: OrganizationMember) => {
      const capacity = getCapacityPerWeek(member);
      allocated += getAllocatedTUs(member.id, workPlans);
      totalCapacity += capacity.normal + capacity.overtime;
    });
    return { totalAllocated: allocated, totalAvailable: totalCapacity - allocated };
  }, [members, workPlans]);

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onTextSubmit(textInput.trim());
      setTextInput('');
      setInputMode(null);
    }
  };

  const handleVoiceComplete = (transcript: string) => {
    onVoiceTranscript(transcript);
    setInputMode(null);
  };

  const isAimMode = newTaskTabLabel === 'New Aim';

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 2,
          borderTopColor: accentColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
      ]}
      className="dark:bg-slate-900"
    >
      {/* Collapsed Header */}
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: accentColor + '30' }}>
            <Plus size={16} color={accentColor} />
          </View>
          <View>
            <Text className="text-slate-900 dark:text-white text-xs font-bold">{newTaskTabLabel}</Text>
            {pendingDraftsCount > 0 ? (
              <Text className="text-xs font-medium" style={{ color: accentColor }}>
                {pendingDraftsCount} draft{pendingDraftsCount !== 1 ? 's' : ''}
              </Text>
            ) : (
              <Text className="text-slate-500 dark:text-slate-400 text-[10px]">Voice or type</Text>
            )}
          </View>
        </View>
        <View className="w-8 h-8 bg-slate-100 dark:bg-slate-900 rounded-full items-center justify-center">
          {isExpanded ? <ChevronDown size={18} color="#64748b" /> : <ChevronUp size={18} color="#64748b" />}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View className="flex-1">
          {inputMode === null ? (
            // Default view: Instructions + Team + Input buttons
            <View className="flex-1 px-4">
              {/* Instructions Section */}
              <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: accentColor + '10' }}>
                <View className="flex-row items-start gap-2">
                  <Lightbulb size={16} color={accentColor} />
                  <View className="flex-1">
                    <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold mb-1">
                      {isAimMode ? 'What to include in your aim:' : 'What to include in your task:'}
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-400 text-[11px] leading-4">
                      {isAimMode ? (
                        '• Specific outcome you want to achieve\n• Target metrics or numbers\n• Timeframe (this quarter, 6 months, etc.)\n• Key actions or focus areas'
                      ) : (
                        '• What needs to be done\n• Who should do it (Sarah, Mike, etc.)\n• Due date (Friday, next week, etc.)\n• Time estimate (2 hours, 1 TU, etc.)'
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Team Availability Section */}
              <View className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">
                    Team Availability This Week
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                      <Text className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        {totalAvailable} TU free
                      </Text>
                    </View>
                    <View className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                      <Text className="text-red-700 dark:text-red-400 text-[10px] font-bold">
                        {totalAllocated} TU used
                      </Text>
                    </View>
                  </View>
                </View>

                <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
                  {members.map((member: OrganizationMember) => {
                    const capacity = getCapacityPerWeek(member);
                    const totalCapacity = capacity.normal + capacity.overtime;
                    const allocated = getAllocatedTUs(member.id, workPlans);
                    const available = Math.max(0, totalCapacity - allocated);
                    const roleColor = ROLE_COLORS[member.role] || '#64748b';
                    const utilizationPercent = Math.round((allocated / totalCapacity) * 100);
                    const isOverAllocated = allocated > totalCapacity;

                    return (
                      <Pressable
                        key={member.id}
                        onPress={() => {
                          setSelectedMember(member);
                          setShowPersonModal(true);
                        }}
                        className="flex-row items-center py-2 border-b border-slate-200 dark:border-slate-700 active:opacity-70"
                      >
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center mr-2"
                          style={{ backgroundColor: roleColor }}
                        >
                          <Text className="text-white font-bold text-[10px]">
                            {member.name.split(' ').map((n: string) => n[0]).join('')}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-900 dark:text-white text-xs font-medium" numberOfLines={1}>
                            {member.name}
                          </Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-[10px]">
                            {member.role === 'FractionalExec' ? 'Executive' : member.role}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className={`text-xs font-bold ${isOverAllocated ? 'text-red-600' : available > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {available} TU free
                          </Text>
                          <View className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                            <View
                              className={`h-full rounded-full ${isOverAllocated ? 'bg-red-500' : utilizationPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                            />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Bottom Action Buttons - Positioned for thumb access */}
              <View className="flex-row items-center justify-between px-4 pb-2">
                {/* Mic Button - Left side (above People tab) */}
                <View className="items-center">
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-1"
                    style={{ backgroundColor: accentColor + '20' }}
                  >
                    <VoiceInputButton
                      onTranscriptComplete={handleVoiceComplete}
                      onError={(error) => console.log('[UnifiedDrawer] Voice error:', error)}
                      color={accentColor}
                      size={56}
                      inline={true}
                    />
                  </View>
                  <Text className="text-slate-600 dark:text-slate-400 text-[10px] font-medium">Voice</Text>
                </View>

                {/* Spacer for center (where + button is) */}
                <View style={{ width: 60 }} />

                {/* Type Button - Right side (above Market tab) */}
                <Pressable
                  onPress={() => setInputMode('text')}
                  className="items-center active:opacity-70"
                >
                  <View className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-1">
                    <Type size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-slate-600 dark:text-slate-400 text-[10px] font-medium">Type</Text>
                </Pressable>
              </View>
            </View>
          ) : inputMode === 'voice' ? (
            // Voice Recording Mode
            <View className="flex-1 px-4 items-center justify-center">
              <Text className="text-slate-900 dark:text-white font-semibold text-lg mb-3 text-center">
                Recording...
              </Text>
              <Text className="text-slate-600 dark:text-slate-400 text-sm mb-6 text-center">
                Describe your {isAimMode ? 'aims' : 'tasks'}
              </Text>

              <VoiceInputButton
                onTranscriptComplete={handleVoiceComplete}
                onError={(error) => console.log('[UnifiedDrawer] Voice error:', error)}
                color={accentColor}
                size={80}
              />

              <Pressable
                onPress={() => setInputMode(null)}
                className="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              >
                <Text className="text-slate-700 dark:text-slate-300 font-medium">Cancel</Text>
              </Pressable>
            </View>
          ) : (
            // Text Input Mode
            <View className="flex-1 px-4">
              {/* Instructions at top */}
              <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: accentColor + '10' }}>
                <View className="flex-row items-start gap-2">
                  <Lightbulb size={16} color={accentColor} />
                  <View className="flex-1">
                    <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold mb-1">
                      {isAimMode ? 'Describe your aims:' : 'Describe your tasks:'}
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-400 text-[11px] leading-4">
                      {isAimMode ? (
                        'Example: "Increase revenue to $50K by Q3 through enterprise sales"'
                      ) : (
                        'Example: "Fix the login bug, assign to Sarah, due Friday, 2 hours"'
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Text Input Area */}
              <View className="flex-1 mb-3">
                <TextInput
                  value={textInput}
                  onChangeText={setTextInput}
                  placeholder={isAimMode
                    ? "Describe what you want to achieve..."
                    : "Describe your tasks here..."
                  }
                  placeholderTextColor="#94a3b8"
                  multiline
                  className="flex-1 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm"
                  style={{ textAlignVertical: 'top', minHeight: 120 }}
                  autoFocus
                />
              </View>

              {/* Bottom Action Buttons */}
              <View className="flex-row items-center justify-between px-4 pb-2">
                {/* Back Button - Left side */}
                <Pressable
                  onPress={() => {
                    setInputMode(null);
                    setTextInput('');
                  }}
                  className="items-center active:opacity-70"
                >
                  <View className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-full items-center justify-center mb-1">
                    <Mic size={24} color="#64748b" />
                  </View>
                  <Text className="text-slate-600 dark:text-slate-400 text-[10px] font-medium">Voice</Text>
                </Pressable>

                {/* Spacer for center */}
                <View style={{ width: 60 }} />

                {/* Submit Button - Right side */}
                <Pressable
                  onPress={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className="items-center active:opacity-70"
                  style={{ opacity: textInput.trim() ? 1 : 0.5 }}
                >
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-1"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Send size={24} color="white" />
                  </View>
                  <Text className="text-slate-600 dark:text-slate-400 text-[10px] font-medium">Send</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Person Details Modal */}
      <PersonDetailsModal
        visible={showPersonModal}
        onClose={() => {
          setShowPersonModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        allMembers={members}
        onMemberChange={(newMember) => setSelectedMember(newMember)}
      />
    </Animated.View>
  );
}
