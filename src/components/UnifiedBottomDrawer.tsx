/**
 * Unified Bottom Drawer
 * Combines Resource Pool and Task Creator in a tabbed interface
 * Prevents z-index collisions and provides consistent UX
 */

import { View, Text, Pressable, ScrollView, Dimensions, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { ChevronUp, ChevronDown, Users, Plus, Mic, Type, Lightbulb } from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { type OrganizationMember } from '@/lib/organization-seed';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useFinanceStore } from '@/lib/state/finance-store';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { PersonDetailsModal } from './PersonDetailsModal';
import { VoiceInputButton } from './VoiceInputButton';

interface UnifiedBottomDrawerProps {
  // Resource Pool props
  selectedPersonId: string | null;
  onPersonSelect: (personId: string) => void;

  // Task Creator props
  onVoiceTranscript: (transcript: string) => void;
  onTextSubmit: (text: string) => void;
  pendingDraftsCount?: number;

  // Styling
  accentColor?: string; // Green for WHAT, Purple for WHY
}

type Tab = 'resources' | 'new-task';
type InputMode = 'voice' | 'text' | null;

const ROLE_COLORS: Record<string, string> = {
  Founder: '#8b5cf6',
  FractionalExec: '#3b82f6',
  Apprentice: '#10b981',
};

// Calculate TU capacity per week
const getCapacityPerWeek = (member: OrganizationMember): { normal: number; overtime: number } => {
  if (member.role === 'Founder' || member.role === 'Apprentice') {
    return { normal: 10, overtime: 5 };
  }
  const daysPerWeek = member.daysPerWeek || 2;
  const normalSquares = daysPerWeek * 2;
  const overtimeSquares = Math.min((5 - daysPerWeek) * 2, 10);
  return { normal: normalSquares, overtime: overtimeSquares };
};

// Calculate allocated TUs
const getAllocatedTUs = (memberId: string, workPlans: WorkPlan[]): number => {
  return workPlans
    .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
    .reduce((total, wp) => {
      const allocation = wp.allocations.find(a => a.memberId === memberId);
      return total + (allocation?.squaresPerWeek || 0);
    }, 0);
};

// Get cost per TU
const getCostPerTU = (member: OrganizationMember): number => {
  if (member.role === 'Founder') return 960;
  if (member.role === 'FractionalExec') {
    const costPerDay = member.costPerDay || 800;
    return Math.round(costPerDay / 2);
  }
  return 70;
};

export function UnifiedBottomDrawer({
  selectedPersonId,
  onPersonSelect,
  onVoiceTranscript,
  onTextSubmit,
  pendingDraftsCount = 0,
  accentColor = '#10b981', // Green by default
}: UnifiedBottomDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('new-task');
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [textInput, setTextInput] = useState('');
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);

  const screenHeight = Dimensions.get('window').height;

  // Stores
  const allMembers = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const currentWorkspace = useCurrentWorkspace();
  const getCashBalance = useFinanceStore(s => s.getCashBalance);

  // Calculate heights
  const COLLAPSED_HEIGHT = 60;
  const EXPANDED_HEIGHT = screenHeight * 0.6;

  // Animated height
  const height = useSharedValue(COLLAPSED_HEIGHT);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(height.value, {
        damping: 20,
        stiffness: 90,
      }),
    };
  });

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    height.value = newExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;

    if (!newExpanded) {
      setInputMode(null);
      setTextInput('');
    }
  };

  // Filter active members
  const members = useMemo(() =>
    allMembers.filter(m => m.status === 'active'),
    [allMembers]
  );

  // Calculate resource stats
  const { totalAllocated, totalUnallocated } = useMemo(() => {
    let allocated = 0;
    let total = 0;

    members.forEach((member) => {
      const capacity = getCapacityPerWeek(member);
      const totalCapacity = capacity.normal + capacity.overtime;
      const memberAllocated = getAllocatedTUs(member.id, workPlans);
      allocated += memberAllocated;
      total += totalCapacity;
    });

    return {
      totalAllocated: allocated,
      totalUnallocated: total - allocated,
    };
  }, [members, workPlans]);

  // Calculate costs
  const weeklyCost = useMemo(() => {
    let cost = 0;
    members.forEach((member) => {
      const memberAllocated = getAllocatedTUs(member.id, workPlans);
      const costPerTU = getCostPerTU(member);
      cost += memberAllocated * costPerTU;
    });
    return Math.round(cost);
  }, [members, workPlans]);

  const cashBalance = currentWorkspace ? getCashBalance(currentWorkspace.id) : 0;
  const remainingCash = cashBalance - weeklyCost;

  // Text input handlers
  const handleTextSubmit = () => {
    console.log('[UnifiedDrawer] handleTextSubmit called, textInput:', textInput);
    if (textInput.trim()) {
      console.log('[UnifiedDrawer] Submitting text:', textInput.trim());
      onTextSubmit(textInput.trim());
      setTextInput('');
      setInputMode(null);
      // Don't toggle expanded - let the parent component handle it
      // toggleExpanded();
    } else {
      console.log('[UnifiedDrawer] Text input is empty, not submitting');
    }
  };

  const handleVoiceComplete = (transcript: string) => {
    onVoiceTranscript(transcript);
    setInputMode(null);
    // Don't toggle expanded - let the parent component handle it
    // toggleExpanded();
  };

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
      {/* Tab Header - Always Visible */}
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800"
      >
        <View className="flex-row items-center gap-4">
          {/* Resources Tab Indicator */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              if (!isExpanded) toggleExpanded();
              setActiveTab('resources');
            }}
            className={`flex-row items-center gap-2 ${activeTab === 'resources' && isExpanded ? 'opacity-100' : 'opacity-60'}`}
          >
            <View className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full items-center justify-center">
              <Users size={16} color="#8b5cf6" />
            </View>
            <View>
              <Text className="text-slate-900 dark:text-white text-xs font-bold">
                Resources
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-[10px]">
                {totalUnallocated} TU free
              </Text>
            </View>
          </Pressable>

          {/* Divider */}
          <View className="w-px h-8 bg-slate-300 dark:bg-slate-700" />

          {/* New Task Tab Indicator */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              if (!isExpanded) toggleExpanded();
              setActiveTab('new-task');
            }}
            className={`flex-row items-center gap-2 ${activeTab === 'new-task' && isExpanded ? 'opacity-100' : 'opacity-60'}`}
          >
            <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: accentColor + '30' }}>
              <Plus size={16} color={accentColor} />
            </View>
            <View>
              <Text className="text-slate-900 dark:text-white text-xs font-bold">
                New Task
              </Text>
              {pendingDraftsCount > 0 ? (
                <Text className="text-xs font-medium" style={{ color: accentColor }}>
                  {pendingDraftsCount} draft{pendingDraftsCount !== 1 ? 's' : ''}
                </Text>
              ) : (
                <Text className="text-slate-500 dark:text-slate-400 text-[10px]">
                  Voice or type
                </Text>
              )}
            </View>
          </Pressable>
        </View>

        {/* Expand/Collapse Indicator */}
        <View className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center">
          {isExpanded ? (
            <ChevronDown size={18} color="#64748b" />
          ) : (
            <ChevronUp size={18} color="#64748b" />
          )}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View className="flex-1">
          {activeTab === 'resources' ? (
            // RESOURCES TAB CONTENT
            <>
              {/* Financial Summary Header */}
              <View className="px-4 py-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-red-500 mr-1" />
                      <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-semibold">
                        {totalAllocated} allocated
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                      <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-semibold">
                        {totalUnallocated} available
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center gap-3 mt-2">
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 dark:text-slate-500 text-[9px] mr-1">Bank:</Text>
                    <Text className="text-gray-900 dark:text-white text-[10px] font-bold">
                      £{(cashBalance / 1000).toFixed(0)}k
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 dark:text-slate-500 text-[9px] mr-1">Weekly Cost:</Text>
                    <Text className="text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                      £{(weeklyCost / 1000).toFixed(1)}k
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 dark:text-slate-500 text-[9px] mr-1">After Week:</Text>
                    <Text className={`text-[10px] font-bold ${remainingCash > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      £{(remainingCash / 1000).toFixed(0)}k
                    </Text>
                  </View>
                </View>
              </View>

              {/* Resource List */}
              <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>
                {members.map((member) => {
                  const capacity = getCapacityPerWeek(member);
                  const totalCapacity = capacity.normal + capacity.overtime;
                  const allocated = getAllocatedTUs(member.id, workPlans);
                  const available = totalCapacity - allocated;
                  const isSelected = selectedPersonId === member.id;
                  const roleColor = ROLE_COLORS[member.role];
                  const costPerTU = getCostPerTU(member);

                  const squares = [];
                  for (let i = 0; i < 15; i++) {
                    let squareState: 'hidden' | 'available' | 'overtime-available' | 'allocated' | 'overtime-allocated' = 'hidden';

                    if (i < capacity.normal) {
                      squareState = i < allocated ? 'allocated' : 'available';
                    } else if (i < totalCapacity) {
                      squareState = i < allocated ? 'overtime-allocated' : 'overtime-available';
                    }

                    squares.push({ index: i, state: squareState });
                  }

                  return (
                    <Pressable
                      key={member.id}
                      onPress={() => onPersonSelect(isSelected ? '' : member.id)}
                      onLongPress={() => {
                        setSelectedMember(member);
                        setShowPersonModal(true);
                      }}
                      className={`flex-row items-center px-3 py-1.5 border-b border-gray-100 dark:border-slate-800 active:bg-gray-50 dark:active:bg-slate-800 ${
                        isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                      }`}
                    >
                      <View className="w-24 mr-2">
                        <View className="flex-row items-center gap-1.5">
                          <View
                            className="w-6 h-6 rounded-full items-center justify-center"
                            style={{ backgroundColor: roleColor + '20' }}
                          >
                            <Text className="font-bold text-[9px]" style={{ color: roleColor }}>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </Text>
                          </View>

                          <View className="flex-1">
                            <Text className="text-gray-900 dark:text-white text-[11px] font-semibold" numberOfLines={1}>
                              {member.name.split(' ')[0]}
                            </Text>
                            <Text className="text-[8px] text-gray-500 dark:text-slate-500">
                              {member.role === 'FractionalExec' ? 'Exec' : member.role.slice(0, 4)} • £{costPerTU}/TU
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="flex-1 flex-row items-center">
                        {squares.map((square) => {
                          if (square.state === 'hidden') {
                            return <View key={square.index} className="w-4 h-4 mr-0.5" />;
                          }

                          let bgColor = 'bg-gray-200 dark:bg-slate-700';
                          let borderColor = 'border-gray-300 dark:border-slate-600';

                          if (square.state === 'allocated') {
                            bgColor = 'bg-red-500';
                            borderColor = 'border-red-600';
                          } else if (square.state === 'overtime-available') {
                            bgColor = 'bg-amber-100 dark:bg-amber-900/30';
                            borderColor = 'border-amber-300 dark:border-amber-700';
                          } else if (square.state === 'overtime-allocated') {
                            bgColor = 'bg-orange-500';
                            borderColor = 'border-orange-600';
                          } else if (square.state === 'available') {
                            bgColor = 'bg-emerald-100 dark:bg-emerald-900/30';
                            borderColor = 'border-emerald-300 dark:border-emerald-700';
                          }

                          return (
                            <View
                              key={square.index}
                              className={`w-4 h-4 rounded-sm border mr-0.5 ${bgColor} ${borderColor}`}
                            />
                          );
                        })}

                        <Text className="text-gray-600 dark:text-slate-400 text-[10px] font-semibold ml-1">
                          {available}/{totalCapacity}
                        </Text>
                      </View>

                      {isSelected && (
                        <View className="w-1.5 h-1.5 rounded-full bg-purple-500 ml-1" />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Legend */}
              <View className="px-4 py-1.5 border-t border-gray-200 dark:border-slate-700 flex-row items-center justify-end gap-3">
                <View className="flex-row items-center gap-1">
                  <View className="w-2.5 h-2.5 rounded-sm border bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700" />
                  <Text className="text-gray-600 dark:text-slate-400 text-[9px]">Avail</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="w-2.5 h-2.5 rounded-sm border bg-red-500 border-red-600" />
                  <Text className="text-gray-600 dark:text-slate-400 text-[9px]">Alloc</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="w-2.5 h-2.5 rounded-sm border bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700" />
                  <Text className="text-gray-600 dark:text-slate-400 text-[9px]">OT</Text>
                </View>
              </View>
            </>
          ) : (
            // NEW TASK TAB CONTENT
            <View className="flex-1 px-5 pb-6">
              {inputMode === null ? (
                // Mode selection
                <View>
                  <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-3">
                    Choose input method:
                  </Text>

                  <View className="flex-row gap-3 mb-4">
                    <Pressable
                      onPress={() => setInputMode('voice')}
                      className="flex-1 border-2 rounded-xl p-4 items-center active:opacity-70"
                      style={{
                        backgroundColor: accentColor + '10',
                        borderColor: accentColor + '30',
                      }}
                    >
                      <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: accentColor + '20' }}>
                        <Mic size={24} color={accentColor} />
                      </View>
                      <Text className="text-slate-900 dark:text-white font-semibold">Voice</Text>
                      <Text className="text-slate-600 dark:text-slate-400 text-xs text-center mt-1">
                        Speak naturally
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setInputMode('text')}
                      className="flex-1 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 items-center active:opacity-70"
                    >
                      <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full items-center justify-center mb-2">
                        <Type size={24} color="#3b82f6" />
                      </View>
                      <Text className="text-slate-900 dark:text-white font-semibold">Type</Text>
                      <Text className="text-slate-600 dark:text-slate-400 text-xs text-center mt-1">
                        Describe tasks
                      </Text>
                    </Pressable>
                  </View>

                  <View className="flex-row items-start gap-2 rounded-xl p-3" style={{ backgroundColor: accentColor + '10' }}>
                    <Lightbulb size={16} color={accentColor} />
                    <View className="flex-1">
                      <Text className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                        <Text className="font-semibold">What to include:</Text> Who should do it, when it's due, and estimated time (TUs).
                      </Text>
                    </View>
                  </View>
                </View>
              ) : inputMode === 'voice' ? (
                // Voice input mode
                <View className="flex-1 items-center justify-center">
                  <Text className="text-slate-900 dark:text-white font-semibold text-lg mb-2 text-center">
                    Tap to record your tasks
                  </Text>

                  <View className="rounded-xl p-3 mb-6 max-w-[280px]" style={{ backgroundColor: accentColor + '10' }}>
                    <Text className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                      <Text className="font-bold">Remember to mention:</Text>
                      {'\n'}• Who? (Sarah, Mike, etc.)
                      {'\n'}• When? (Friday, next week, etc.)
                      {'\n'}• How long? (2 TUs, 10 hours, etc.)
                    </Text>
                  </View>

                  <VoiceInputButton
                    onTranscriptComplete={handleVoiceComplete}
                    onError={(error) => console.error('[UnifiedDrawer] Voice error:', error)}
                    color={accentColor}
                    size={80}
                  />

                  <Pressable
                    onPress={() => setInputMode(null)}
                    className="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 font-medium">Back</Text>
                  </Pressable>
                </View>
              ) : (
                // Text input mode
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-semibold text-lg mb-3">
                    Describe your tasks
                  </Text>

                  <TextInput
                    value={textInput}
                    onChangeText={setTextInput}
                    placeholder="Example: Create a task to fix the login bug, assign it to Sarah, and set it for next Friday. Estimated 2 time units."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={6}
                    className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white mb-3 min-h-[150px]"
                    style={{ textAlignVertical: 'top' }}
                  />

                  <View className="flex-row items-start gap-2 rounded-xl p-3 mb-4" style={{ backgroundColor: accentColor + '10' }}>
                    <Lightbulb size={16} color={accentColor} />
                    <Text className="flex-1 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                      <Text className="font-semibold">Tip:</Text> Mention who should do it, when it's due, and how long it will take for best results.
                    </Text>
                  </View>

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => setInputMode(null)}
                      className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-xl items-center"
                    >
                      <Text className="text-slate-700 dark:text-slate-300 font-semibold">Back</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleTextSubmit}
                      disabled={!textInput.trim()}
                      className="flex-1 py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: accentColor,
                        opacity: textInput.trim() ? 1 : 0.5
                      }}
                    >
                      <Text className="text-white font-semibold">Extract Tasks</Text>
                    </Pressable>
                  </View>
                </View>
              )}
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
      />
    </Animated.View>
  );
}
