import { View, Text, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  DollarSign,
  Trash2,
  Plus,
  Zap,
  Star,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react-native';
import { useAppStore } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import type { OrganizationMember, AIAgent, Skill } from '@/lib/organization-seed';
import { DEFAULT_SKILLS_BY_FUNCTION, getSkillSpeedMultiplier, getMemberSpeedMultiplier } from '@/lib/organization-seed';
import { getRecommendedToolsForMember } from '@/lib/armory/recommendations';
import { getToolEffects } from '@/lib/armory/tool-effects';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/ThemeContext';

export default function ArmoryScreen() {
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  const currentUser = useAppStore((s) => s.currentUser);
  const currentMembership = useAppStore((s) => s.currentMembership);
  const members = useOrganizationStore((s) => s.members);
  const aiAgents = useOrganizationStore((s) => s.aiAgents);

  const initializeArmory = useArmoryStore((s) => s.initializeArmory);
  const isInitialized = useArmoryStore((s) => s.isInitialized);

  // Theme colors
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized && currentMembership?.workspaceId) {
      initializeArmory(currentMembership.workspaceId, members, aiAgents);
    }
  }, [isInitialized, currentMembership?.workspaceId, members, aiAgents]);

  const canManage = currentMembership?.role === 'Founder';

  const handleMemberPress = (member: OrganizationMember) => {
    // Allow everyone to view cards - editing is controlled in the modal
    setSelectedMember(member);
    setShowCharacterSheet(true);
  };

  return (
    <View className={`flex-1 ${bgPrimary}`}>
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e1b4b', '#312e81'] : isOffWhite ? ['#f97316', '#ea580c', '#c2410c'] : ['#3b82f6', '#2563eb', '#1d4ed8']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-6 pt-3 pb-4 border-b border-white/10">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Text className="text-white text-3xl font-black">Armory</Text>
                <Text className="text-white/60 text-sm mt-1">
                  Equip your team with AI tools
                </Text>
              </View>
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
              >
                <X size={24} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <LoadoutsTab
            members={members}
            aiAgents={aiAgents}
            onMemberPress={handleMemberPress}
            canManage={canManage}
            currentUserId={currentUser?.id}
          />
        </SafeAreaView>

        {/* Character Sheet Modal */}
        {selectedMember && (
          <CharacterSheetModal
            visible={showCharacterSheet}
            member={selectedMember}
            aiAgents={aiAgents}
            canManage={canManage}
            onClose={() => {
              setShowCharacterSheet(false);
              setSelectedMember(null);
            }}
          />
        )}
      </LinearGradient>
    </View>
  );
}

// ========== LOADOUTS TAB ==========

function LoadoutsTab({
  members,
  aiAgents,
  onMemberPress,
  canManage,
  currentUserId,
}: {
  members: OrganizationMember[];
  aiAgents: AIAgent[];
  onMemberPress: (member: OrganizationMember) => void;
  canManage: boolean;
  currentUserId?: string;
}) {
  const loadouts = useArmoryStore((s) => s.personLoadouts);

  const activeMembers = members.filter((m) => m.status === 'active');

  // Group by role
  const founders = activeMembers.filter((m) => m.role === 'Founder');
  const execs = activeMembers.filter((m) => m.role === 'FractionalExec');
  const apprentices = activeMembers.filter((m) => m.role === 'Apprentice');

  const renderMember = (member: OrganizationMember) => {
    const loadout = loadouts.find((l) => l.memberId === member.id);
    const equippedCount = loadout ? loadout.aiToolIds.length : 0;

    const equippedTools = loadout
      ? loadout.aiToolIds
          .map((id) => aiAgents.find((a) => a.id === id))
          .filter((t): t is AIAgent => t !== undefined)
      : [];

    const aiToolsCost = equippedTools.reduce((sum, tool) => sum + tool.costPerMonth, 0);
    const daysPerWeek = member.daysPerWeek || 5; // Default to 5 days/week for full-time
    const personCostPerMonth = member.costPerDay ? member.costPerDay * daysPerWeek * 4.33 : 0; // 4.33 weeks/month average
    const totalCost = personCostPerMonth + aiToolsCost;

    const roleColor = member.role === 'Founder' ? '#3b82f6' : member.role === 'FractionalExec' ? '#8b5cf6' : '#10b981';

    const isCurrentUser = member.id === currentUserId;

    return (
      <Pressable
        key={member.id}
        onPress={() => onMemberPress(member)}
        className={cn('bg-white/5 border border-white/10 rounded-2xl p-4 mb-3', 'active:opacity-70')}
      >
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: roleColor }}
          >
            <Text className="text-white text-lg font-black">
              {member.name.split(' ').map((n) => n[0]).join('')}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-white font-black text-base">{member.name}</Text>
              {isCurrentUser && (
                <View className="bg-blue-500/20 px-2 py-0.5 rounded">
                  <Text className="text-blue-300 text-xs font-bold">YOU</Text>
                </View>
              )}
            </View>
            <Text className="text-white/60 text-sm">{member.function}</Text>
          </View>
          <View className="items-end">
            <View className="flex-row items-center gap-1 mb-1">
              <DollarSign size={14} color="#60a5fa" />
              <Text className="text-blue-300 font-black">£{totalCost.toLocaleString()}</Text>
            </View>
            <Text className="text-white/40 text-xs">
              {personCostPerMonth > 0 && `£${personCostPerMonth.toLocaleString()} + `}
              £{aiToolsCost} AI
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
      {/* Founders */}
      {founders.length > 0 && (
        <View className="mb-6">
          <Text className="text-white text-lg font-black mb-3">Founders</Text>
          {founders.map(renderMember)}
        </View>
      )}

      {/* Executives */}
      {execs.length > 0 && (
        <View className="mb-6">
          <Text className="text-white text-lg font-black mb-3">Executives</Text>
          {execs.map(renderMember)}
        </View>
      )}

      {/* Apprentices */}
      {apprentices.length > 0 && (
        <View className="mb-6">
          <Text className="text-white text-lg font-black mb-3">Apprentices</Text>
          {apprentices.map(renderMember)}
        </View>
      )}

      <View className="h-20" />
    </ScrollView>
  );
}

// ========== CHARACTER SHEET MODAL ==========

function CharacterSheetModal({
  visible,
  member: initialMember,
  aiAgents,
  canManage,
  onClose,
}: {
  visible: boolean;
  member: OrganizationMember;
  aiAgents: AIAgent[];
  canManage: boolean;
  onClose: () => void;
}) {
  const [showAddTool, setShowAddTool] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showPersonDetail, setShowPersonDetail] = useState(false);

  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Get the fresh member data from the store to reflect updates
  const getMemberById = useOrganizationStore((s) => s.getMemberById);
  const member = getMemberById(initialMember.id) || initialMember;

  const loadout = useArmoryStore((s) => s.getLoadoutForMember(member.id));
  const addAITool = useArmoryStore((s) => s.addAITool);
  const removeAITool = useArmoryStore((s) => s.removeAITool);
  const autoEquipStarterKit = useArmoryStore((s) => s.autoEquipStarterKit);
  const clearLoadout = useArmoryStore((s) => s.clearLoadout);
  const removePersonLoadout = useArmoryStore((s) => s.removePersonLoadout);
  const updateMember = useOrganizationStore((s) => s.updateMember);

  // Theme colors
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const bgSecondary = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';

  // Get all equipped tools
  const equippedTools = loadout
    ? loadout.aiToolIds
        .map((id) => aiAgents.find((a) => a.id === id))
        .filter((t): t is AIAgent => t !== undefined)
    : [];

  const aiToolsCost = equippedTools.reduce((sum, tool) => sum + tool.costPerMonth, 0);
  const daysPerWeek = member.daysPerWeek || 5; // Default to 5 days/week for full-time
  const personCostPerMonth = member.costPerDay ? member.costPerDay * daysPerWeek * 4.33 : 0; // 4.33 weeks/month average
  const totalCost = personCostPerMonth + aiToolsCost;
  const roleColor = member.role === 'Founder' ? '#3b82f6' : member.role === 'FractionalExec' ? '#8b5cf6' : '#10b981';

  const handleAddTool = async (toolId: string) => {
    await addAITool(member.id, toolId);
    setShowAddTool(false);
  };

  const handleRemoveTool = async (toolId: string) => {
    await removeAITool(member.id, toolId);
  };

  const handleAutoEquip = async () => {
    await autoEquipStarterKit(member.id, member, aiAgents);
  };

  const handleClear = async () => {
    await clearLoadout(member.id);
  };

  const handleRemovePerson = async () => {
    await removePersonLoadout(member.id);
    setShowRemoveConfirm(false);
    onClose();
  };

  const handleDaysPerWeekChange = (days: number) => {
    updateMember(member.id, { daysPerWeek: days });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-black/80 justify-end">
        <View className={`${bgCard} rounded-t-3xl max-h-[90%]`}>
          {/* Header */}
          <View className={`px-6 py-5 border-b ${borderColor} flex-row items-center justify-between`}>
            <Text className={`${textPrimary} text-xl font-black`}>AI Tools</Text>
            <Pressable onPress={onClose} className={`w-10 h-10 items-center justify-center rounded-full ${bgSecondary} active:opacity-70`}>
              <X size={24} color={isDark ? '#fff' : '#374151'} />
            </Pressable>
          </View>

          <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
            {/* Avatar & Stats */}
            <View className="items-center mb-6">
              <Pressable onPress={() => setShowPersonDetail(true)} className="items-center active:opacity-70">
                <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: roleColor }}>
                  <Text className="text-white text-2xl font-black">{member.name.split(' ').map((n) => n[0]).join('')}</Text>
                </View>
                <Text className={`${textPrimary} text-xl font-black mb-1`}>{member.name}</Text>
                <Text className={`${textSecondary} text-sm mb-2`}>
                  {member.role === 'FractionalExec' ? 'Fractional Executive' : member.role} • {member.function}
                </Text>
                <View className="bg-blue-500/20 px-3 py-1.5 rounded-lg mb-4">
                  <Text className="text-blue-300 text-xs font-bold">Tap to view full profile</Text>
                </View>
              </Pressable>

              {/* Total Cost */}
              <View className="bg-blue-500/20 border border-blue-500/30 rounded-2xl px-6 py-4">
                <View className="flex-row items-center justify-center gap-2 mb-3">
                  <DollarSign size={24} color="#60a5fa" />
                  <Text className="text-blue-300 text-3xl font-black">£{totalCost.toLocaleString()}</Text>
                  <Text className={`${textMuted} text-sm`}>/month</Text>
                </View>

                {/* Cost Breakdown */}
                <View className="border-t border-blue-500/20 pt-3 space-y-1">
                  {personCostPerMonth > 0 && (
                    <View className="flex-row justify-between">
                      <Text className={`${textSecondary} text-sm`}>Person Cost:</Text>
                      <Text className={`${textPrimary} text-sm font-bold`}>£{personCostPerMonth.toLocaleString()}</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between">
                    <Text className={`${textSecondary} text-sm`}>AI Tools Cost:</Text>
                    <Text className={`${textPrimary} text-sm font-bold`}>£{aiToolsCost.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Days Per Week Selector (for executives only) */}
            {member.role === 'FractionalExec' && canManage && (
              <View className="mb-6">
                <Text className={`${textPrimary} text-sm font-bold mb-2`}>Days Per Week</Text>
                <View className="flex-row gap-2">
                  {[1, 2, 3, 4, 5].map((days) => (
                    <Pressable
                      key={days}
                      onPress={() => handleDaysPerWeekChange(days)}
                      className={cn(
                        'flex-1 rounded-xl py-3 border active:opacity-70',
                        daysPerWeek === days
                          ? 'bg-blue-500 border-blue-500'
                          : `${bgSecondary} ${borderColor}`
                      )}
                    >
                      <Text
                        className={cn(
                          'text-center font-bold text-base',
                          daysPerWeek === days ? 'text-white' : textSecondary
                        )}
                      >
                        {days}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text className={`${textMuted} text-xs mt-2`}>
                  Cost: {member.costPerDay && `£${Math.round(member.costPerDay / 2)}/TU × ${daysPerWeek * 2} TU/week × 4.33 weeks = £${Math.round(personCostPerMonth).toLocaleString()}/month`}
                </Text>
              </View>
            )}

            {/* Quick Actions */}
            {canManage && (
              <View className="flex-row gap-2 mb-6">
                <Pressable onPress={handleAutoEquip} className="flex-1 bg-blue-500 rounded-xl py-3 active:opacity-80">
                  <Text className="text-white font-bold text-center">Auto-Equip</Text>
                </Pressable>
                {equippedTools.length > 0 && (
                  <Pressable onPress={handleClear} className="bg-red-500/20 rounded-xl px-4 py-3 active:opacity-80">
                    <Text className="text-red-400 font-bold">Clear All</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* AI Tools Slots */}
            <View className="mb-3">
              <Text className={`${textPrimary} text-lg font-black mb-3`}>AI Tools ({equippedTools.length})</Text>

              {/* Render slots - always show at least 4, expand as tools are added */}
              {[0, 1, 2, 3].map((index) => {
                const tool = equippedTools[index];
                const toolEffects = tool ? getToolEffects(tool.id) : null;

                return (
                  <View key={index} className={`${bgSecondary} border ${borderColor} rounded-2xl p-4 mb-3`}>
                    {tool ? (
                      // Filled slot
                      <>
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1 mr-3">
                            <Text className={`${textPrimary} font-black text-base`}>{tool.name}</Text>
                            <Text className={`${textSecondary} text-sm mt-1`}>{tool.purpose}</Text>
                          </View>
                          <View className="items-end">
                            <View className="bg-blue-500/20 px-3 py-1 rounded-lg mb-2">
                              <Text className="text-blue-300 text-xs font-bold">£{tool.costPerMonth}/mo</Text>
                            </View>
                            {canManage && (
                              <Pressable
                                onPress={() => handleRemoveTool(tool.id)}
                                className="bg-red-500/20 p-2 rounded-lg active:opacity-70"
                              >
                                <Trash2 size={16} color="#f87171" />
                              </Pressable>
                            )}
                          </View>
                        </View>
                        {toolEffects && (
                          <View className="flex-row flex-wrap gap-1 mt-2">
                            {toolEffects.effectTags.map((tag, idx) => (
                              <View key={idx} className="bg-emerald-500 px-2 py-1 rounded">
                                <Text className="text-white text-xs font-bold">{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </>
                    ) : (
                      // Empty slot
                      <Pressable
                        onPress={() => canManage && setShowAddTool(true)}
                        disabled={!canManage}
                        className="items-center py-4 active:opacity-70"
                      >
                        <View className={`w-12 h-12 rounded-full ${bgSecondary} border-2 border-dashed ${borderColor} items-center justify-center mb-2`}>
                          <Plus size={24} color={isDark ? '#94a3b8' : '#6b7280'} />
                        </View>
                        <Text className={`${textMuted} text-sm`}>
                          {canManage ? 'Add AI Tool' : 'Empty Slot'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}

              {/* Show additional slots if more than 4 tools are equipped */}
              {equippedTools.slice(4).map((tool, index) => {
                const toolEffects = getToolEffects(tool.id);
                return (
                  <View key={`extra-${index}`} className={`${bgSecondary} border ${borderColor} rounded-2xl p-4 mb-3`}>
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 mr-3">
                        <Text className={`${textPrimary} font-black text-base`}>{tool.name}</Text>
                        <Text className={`${textSecondary} text-sm mt-1`}>{tool.purpose}</Text>
                      </View>
                      <View className="items-end">
                        <View className="bg-blue-500/20 px-3 py-1 rounded-lg mb-2">
                          <Text className="text-blue-300 text-xs font-bold">£{tool.costPerMonth}/mo</Text>
                        </View>
                        {canManage && (
                          <Pressable
                            onPress={() => handleRemoveTool(tool.id)}
                            className="bg-red-500/20 p-2 rounded-lg active:opacity-70"
                          >
                            <Trash2 size={16} color="#f87171" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                    {toolEffects && (
                      <View className="flex-row flex-wrap gap-1 mt-2">
                        {toolEffects.effectTags.map((tag, idx) => (
                          <View key={idx} className="bg-emerald-500 px-2 py-1 rounded">
                            <Text className="text-white text-xs font-bold">{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Add new slot button if all current slots are filled */}
              {equippedTools.length >= 4 && canManage && (
                <Pressable
                  onPress={() => setShowAddTool(true)}
                  className={`${bgSecondary} border-2 border-dashed ${borderColor} rounded-2xl p-4 mb-3 items-center active:opacity-70`}
                >
                  <View className="flex-row items-center gap-2">
                    <Plus size={20} color={isDark ? '#fff' : '#374151'} />
                    <Text className={`${textPrimary} font-bold`}>Add Another Tool</Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Remove from Armory */}
            {canManage && (
              <View className={`mt-8 pt-6 border-t ${borderColor}`}>
                <Pressable
                  onPress={() => setShowRemoveConfirm(true)}
                  className="bg-red-500/20 border border-red-500/30 rounded-xl py-3 px-4 active:opacity-70"
                >
                  <Text className="text-red-400 font-bold text-center">Remove from Armory</Text>
                </Pressable>
                <Text className={`${textMuted} text-xs text-center mt-2`}>
                  This will remove this person from the Armory. They will still exist in your organization.
                </Text>
              </View>
            )}

            <View className="h-20" />
          </ScrollView>
        </View>

        {/* Add Tool Modal */}
        {showAddTool && (
          <AddToolModal
            visible={showAddTool}
            member={member}
            aiAgents={aiAgents}
            equippedToolIds={equippedTools.map((t) => t.id)}
            onAdd={handleAddTool}
            onClose={() => setShowAddTool(false)}
          />
        )}

        {/* Remove Confirmation Modal */}
        {showRemoveConfirm && (
          <Modal visible={showRemoveConfirm} transparent animationType="fade" onRequestClose={() => setShowRemoveConfirm(false)}>
            <View className="flex-1 bg-black/90 items-center justify-center px-6">
              <View className={`${bgCard} rounded-2xl p-6 w-full max-w-sm border border-red-500/30`}>
                <Text className={`${textPrimary} text-xl font-black mb-3`}>Remove from Armory?</Text>
                <Text className={`${textSecondary} text-sm mb-6`}>
                  This will remove {member.name} from the Armory. All equipped AI tools will be unassigned. This person will still exist in your organization chart.
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowRemoveConfirm(false)}
                    className={`flex-1 ${bgSecondary} rounded-xl py-3 active:opacity-70`}
                  >
                    <Text className={`${textPrimary} font-bold text-center`}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleRemovePerson}
                    className="flex-1 bg-red-500 rounded-xl py-3 active:opacity-70"
                  >
                    <Text className="text-white font-bold text-center">Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Person Detail Modal */}
        {showPersonDetail && (
          <PersonDetailModal
            visible={showPersonDetail}
            member={member}
            canManage={canManage}
            onClose={() => setShowPersonDetail(false)}
          />
        )}
      </View>
    </Modal>
  );
}

// ========== ADD TOOL MODAL ==========

function AddToolModal({
  visible,
  member,
  aiAgents,
  equippedToolIds,
  onAdd,
  onClose,
}: {
  visible: boolean;
  member: OrganizationMember;
  aiAgents: AIAgent[];
  equippedToolIds: string[];
  onAdd: (toolId: string) => void;
  onClose: () => void;
}) {
  const [showAllTools, setShowAllTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AIAgent | null>(null);

  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Theme colors
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const bgSecondary = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';

  const recommended = getRecommendedToolsForMember(member, aiAgents);
  const availableTools = aiAgents.filter((t) => t.status === 'active' && !equippedToolIds.includes(t.id));

  const recommendedAvailable = recommended
    .map((r) => r.tool)
    .filter((t) => !equippedToolIds.includes(t.id))
    .slice(0, 5);

  const toolsToShow = showAllTools ? availableTools : recommendedAvailable;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
        <View className="flex-1 bg-black/90 justify-end">
          <View className={`${bgCard} rounded-t-3xl max-h-[80%]`}>
            <View className={`px-6 py-5 border-b ${borderColor} flex-row items-center justify-between`}>
              <Text className={`${textPrimary} text-xl font-black`}>Add AI Tool</Text>
              <Pressable onPress={onClose} className={`w-10 h-10 items-center justify-center rounded-full ${bgSecondary} active:opacity-70`}>
                <X size={24} color={isDark ? '#fff' : '#374151'} />
              </Pressable>
            </View>

            <View className="px-6 pt-4 pb-2">
              <Pressable onPress={() => setShowAllTools(!showAllTools)} className={`${bgSecondary} rounded-xl py-3 px-4 active:opacity-70`}>
                <Text className={`${textPrimary} font-bold text-center`}>{showAllTools ? 'Show Recommended' : 'Show All Tools'}</Text>
              </Pressable>
            </View>

            <ScrollView className="px-6 py-2" showsVerticalScrollIndicator={false}>
              {toolsToShow.length === 0 ? (
                <View className="py-12 items-center">
                  <Text className={`${textMuted} text-center`}>No more tools available</Text>
                </View>
              ) : (
                toolsToShow.map((tool) => {
                  const toolEffects = getToolEffects(tool.id);
                  return (
                    <Pressable
                      key={tool.id}
                      onPress={() => setSelectedTool(tool)}
                      className={`${bgSecondary} border ${borderColor} rounded-2xl p-4 mb-3 active:opacity-70`}
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className={`${textPrimary} font-black text-base`}>{tool.name}</Text>
                          <Text className={`${textSecondary} text-sm mt-1`}>{tool.purpose}</Text>
                        </View>
                        <View className="bg-blue-500/20 px-3 py-1 rounded-lg">
                          <Text className="text-blue-300 text-xs font-bold">£{tool.costPerMonth}/mo</Text>
                        </View>
                      </View>
                      {toolEffects && (
                        <View className="flex-row flex-wrap gap-1 mt-2">
                          {toolEffects.effectTags.map((tag, idx) => (
                            <View key={idx} className="bg-emerald-500 px-2 py-1 rounded">
                              <Text className="text-white text-xs font-bold">{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </Pressable>
                  );
                })
              )}
              <View className="h-20" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Tool Detail Modal */}
      {selectedTool && (
        <AIToolDetailModal
          visible={selectedTool !== null}
          tool={selectedTool}
          onAdd={() => {
            onAdd(selectedTool.id);
            setSelectedTool(null);
          }}
          onClose={() => setSelectedTool(null)}
        />
      )}
    </>
  );
}

// ========== AI TOOL DETAIL MODAL ==========

function AIToolDetailModal({
  visible,
  tool,
  onAdd,
  onClose,
}: {
  visible: boolean;
  tool: AIAgent;
  onAdd: () => void;
  onClose: () => void;
}) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Theme colors
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const bgSecondary = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-black/90 justify-center items-center px-4">
        <View className={`${bgCard} rounded-3xl w-full`} style={{ maxHeight: '95%', height: '95%' }}>
          {/* Header */}
          <View className={`px-6 pt-6 pb-4 border-b ${borderColor}`}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className={`${textPrimary} text-2xl font-black flex-1`} numberOfLines={2}>{tool.name}</Text>
              <Pressable onPress={onClose} className="ml-2">
                <X size={28} color={isDark ? '#94a3b8' : '#6b7280'} />
              </Pressable>
            </View>
            <View className="flex-row items-center gap-2 mb-3">
              <View className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                <Text className="text-blue-500 text-sm font-semibold">
                  {tool.provider}
                </Text>
              </View>
              {tool.category && (
                <View className="bg-purple-500/20 px-3 py-1.5 rounded-lg">
                  <Text className="text-purple-500 text-sm font-semibold capitalize">
                    {tool.category.replace('-', ' ')}
                  </Text>
                </View>
              )}
            </View>
            <View className="bg-blue-500/10 rounded-lg px-3 py-2">
              <Text className="text-blue-500 text-xs text-center font-semibold">
                ⬇️ Scroll down - 10+ sections of detailed info below
              </Text>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={true}
            bounces={true}
            className="flex-1"
            persistentScrollbar={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="px-6 py-4">
              {/* Cost and Rating Section */}
              <View className="flex-row gap-3 mb-4">
                <View className={`flex-1 ${bgSecondary} rounded-xl p-4`}>
                  <Text className={`${textSecondary} text-xs mb-1`}>Monthly Cost</Text>
                  <Text className="text-emerald-500 text-2xl font-bold">
                    £{tool.costPerMonth}
                  </Text>
                  <Text className={`${textMuted} text-xs`}>/month</Text>
                </View>
                {tool.reviews && (
                  <View className={`flex-1 ${bgSecondary} rounded-xl p-4`}>
                    <Text className={`${textSecondary} text-xs mb-1`}>User Rating</Text>
                    <View className="flex-row items-center">
                      <Text className="text-amber-500 text-2xl font-bold">
                        {tool.reviews.rating}
                      </Text>
                      <Text className={`${textMuted} text-sm ml-1`}>/5</Text>
                    </View>
                    <Text className={`${textMuted} text-xs`}>
                      {tool.reviews.totalReviews} reviews
                    </Text>
                  </View>
                )}
              </View>

              {/* Description */}
              {tool.description && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>📝 Description</Text>
                  <Text className={`${textPrimary} text-base leading-6`}>
                    {tool.description}
                  </Text>
                </View>
              )}

              {/* Purpose (if no description) */}
              {!tool.description && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>📝 Purpose</Text>
                  <Text className={`${textPrimary} text-base leading-6`}>
                    {tool.purpose}
                  </Text>
                </View>
              )}

              {/* Business Functions */}
              <View className="mb-6">
                <Text className={`${textPrimary} text-lg font-bold mb-3`}>🎯 Business Functions</Text>
                <View className="flex-row flex-wrap gap-2">
                  {tool.functions.map((func, idx) => (
                    <View key={idx} className="bg-blue-500/20 px-3 py-2 rounded-lg border border-blue-500/30">
                      <Text className="text-blue-500 font-semibold">{func}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Key Features */}
              {tool.keyFeatures && tool.keyFeatures.length > 0 && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>✨ Key Features</Text>
                  <View className={`bg-blue-500/10 border border-blue-500/30 rounded-xl p-4`}>
                    {tool.keyFeatures.map((feature, idx) => (
                      <View key={idx} className="flex-row items-start mb-2">
                        <Text className="text-blue-500 mr-2">✓</Text>
                        <Text className={`${textPrimary} flex-1 font-medium`}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Use Cases */}
              {tool.useCases && tool.useCases.length > 0 && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>💡 Use Cases</Text>
                  <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    {tool.useCases.map((useCase, idx) => (
                      <View key={idx} className="flex-row items-start mb-2">
                        <Text className="text-emerald-500 mr-2">→</Text>
                        <Text className={`${textPrimary} flex-1`}>{useCase}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Capabilities */}
              {tool.capabilities.length > 0 && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>⚡ Capabilities</Text>
                  <View className={`${bgSecondary} rounded-xl p-4`}>
                    {tool.capabilities.map((capability, idx) => (
                      <View key={idx} className="flex-row items-start mb-2">
                        <Text className={`${textMuted} mr-2`}>•</Text>
                        <Text className={`${textSecondary} flex-1`}>{capability}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Integrations */}
              {tool.integrations.length > 0 && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>🔗 Integrations</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {tool.integrations.map((integration, idx) => (
                      <View key={idx} className={`${bgSecondary} px-3 py-2 rounded-lg`}>
                        <Text className={`${textSecondary}`}>{integration}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Pricing Details */}
              {tool.pricing && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>💰 Pricing Plans</Text>
                  <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    {tool.pricing.starter && (
                      <View className="mb-2">
                        <Text className="text-purple-500 font-semibold">Starter</Text>
                        <Text className={textSecondary}>{tool.pricing.starter}</Text>
                      </View>
                    )}
                    {tool.pricing.professional && (
                      <View className="mb-2">
                        <Text className="text-purple-500 font-semibold">Professional</Text>
                        <Text className={textSecondary}>{tool.pricing.professional}</Text>
                      </View>
                    )}
                    {tool.pricing.enterprise && (
                      <View className="mb-2">
                        <Text className="text-purple-500 font-semibold">Enterprise</Text>
                        <Text className={textSecondary}>{tool.pricing.enterprise}</Text>
                      </View>
                    )}
                    {tool.pricing.notes && (
                      <Text className={`${textSecondary} text-sm mt-2 italic`}>
                        {tool.pricing.notes}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Setup Information */}
              {tool.setup && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>⚙️ Setup & Requirements</Text>
                  <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    {tool.setup.difficulty && (
                      <View className="mb-2">
                        <Text className="text-amber-500 font-semibold">Difficulty</Text>
                        <Text className={textSecondary}>{tool.setup.difficulty}</Text>
                      </View>
                    )}
                    {tool.setup.timeToValue && (
                      <View className="mb-2">
                        <Text className="text-amber-500 font-semibold">Time to Value</Text>
                        <Text className={textSecondary}>{tool.setup.timeToValue}</Text>
                      </View>
                    )}
                    {tool.setup.requirements && tool.setup.requirements.length > 0 && (
                      <View>
                        <Text className="text-amber-500 font-semibold mb-1">Requirements</Text>
                        {tool.setup.requirements.map((req, idx) => (
                          <Text key={idx} className={`${textSecondary} text-sm`}>• {req}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Support */}
              {tool.support && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>📞 Support</Text>
                  <View className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <View className="flex-row justify-between mb-2">
                      <Text className={textSecondary}>Email Support</Text>
                      <Text className="text-cyan-500 font-semibold">
                        {tool.support.email ? '✓ Yes' : '✗ No'}
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text className={textSecondary}>Phone Support</Text>
                      <Text className="text-cyan-500 font-semibold">
                        {tool.support.phone ? '✓ Yes' : '✗ No'}
                      </Text>
                    </View>
                    {tool.support.documentation && (
                      <View className="mb-2">
                        <Text className="text-cyan-500 font-semibold">Documentation</Text>
                        <Text className={`${textSecondary} text-sm`}>{tool.support.documentation}</Text>
                      </View>
                    )}
                    {tool.support.community && (
                      <View>
                        <Text className="text-cyan-500 font-semibold">Community</Text>
                        <Text className={`${textSecondary} text-sm`}>{tool.support.community}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* User Reviews */}
              {tool.reviews && (tool.reviews.pros || tool.reviews.cons) && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>⭐ User Feedback</Text>
                  <View className={`${bgSecondary} rounded-xl p-4`}>
                    {tool.reviews.pros && tool.reviews.pros.length > 0 && (
                      <View className="mb-3">
                        <Text className="text-emerald-500 font-semibold mb-2">👍 Pros</Text>
                        {tool.reviews.pros.map((pro, idx) => (
                          <Text key={idx} className={`${textSecondary} text-sm mb-1`}>• {pro}</Text>
                        ))}
                      </View>
                    )}
                    {tool.reviews.cons && tool.reviews.cons.length > 0 && (
                      <View>
                        <Text className="text-red-500 font-semibold mb-2">👎 Cons</Text>
                        {tool.reviews.cons.map((con, idx) => (
                          <Text key={idx} className={`${textSecondary} text-sm mb-1`}>• {con}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Website Link */}
              {tool.website && (
                <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <Text className="text-blue-500 text-sm font-semibold mb-2">🌐 Website</Text>
                  <Text className="text-blue-500 text-sm">
                    {tool.website}
                  </Text>
                </View>
              )}

              {/* Usage Stats */}
              {tool.usageStats && (
                <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <Text className="text-emerald-500 text-sm font-semibold mb-2">📊 Usage Stats</Text>
                  <View className="space-y-1">
                    <View className="flex-row justify-between">
                      <Text className={`${textSecondary} text-sm`}>Requests This Month:</Text>
                      <Text className={`${textPrimary} font-bold text-sm`}>{tool.usageStats.requestsThisMonth}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className={`${textSecondary} text-sm`}>Avg Response Time:</Text>
                      <Text className={`${textPrimary} font-bold text-sm`}>{tool.usageStats.averageResponseTime}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className={`${textSecondary} text-sm`}>Success Rate:</Text>
                      <Text className={`${textPrimary} font-bold text-sm`}>{tool.usageStats.successRate}%</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className={`px-6 py-4 border-t ${borderColor} flex-row gap-3`}>
            <Pressable
              onPress={onClose}
              className={`flex-1 ${bgSecondary} rounded-xl py-4 items-center active:opacity-70`}
            >
              <Text className={`${textPrimary} font-bold text-base`}>Close</Text>
            </Pressable>
            <Pressable
              onPress={onAdd}
              className="flex-1 bg-blue-500 rounded-xl py-4 items-center active:opacity-70"
            >
              <Text className="text-white font-bold text-base">Add Tool</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ========== PERSON DETAIL MODAL ==========

const SKILL_LEVEL_NAMES = ['', 'Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
const SKILL_LEVEL_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

function PersonDetailModal({
  visible,
  member: initialMember,
  canManage,
  onClose,
}: {
  visible: boolean;
  member: OrganizationMember;
  canManage: boolean;
  onClose: () => void;
}) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Get fresh member data from store
  const getMemberById = useOrganizationStore((s) => s.getMemberById);
  const updateMember = useOrganizationStore((s) => s.updateMember);
  const member = getMemberById(initialMember.id) || initialMember;

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');

  // Theme colors
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const bgSecondary = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-orange-100' : 'bg-gray-100';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';

  const roleColor = member.role === 'Founder' ? '#3b82f6' : member.role === 'FractionalExec' ? '#8b5cf6' : '#10b981';

  // Get skills - use member's skills or default based on function
  const skills = useMemo(() => {
    if (member.skills && member.skills.length > 0) {
      return member.skills;
    }
    return DEFAULT_SKILLS_BY_FUNCTION[member.function] || [];
  }, [member.skills, member.function]);

  // Calculate overall speed multiplier
  const speedMultiplier = useMemo(() => getMemberSpeedMultiplier({
    ...member,
    skills: skills,
  }), [member, skills]);

  const handleUpdateSkillLevel = (skillId: string, newLevel: number) => {
    const updatedSkills = skills.map(skill =>
      skill.id === skillId
        ? { ...skill, level: newLevel, speedMultiplier: getSkillSpeedMultiplier(newLevel) }
        : skill
    );
    updateMember(member.id, { skills: updatedSkills });
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;

    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: newSkillName.trim(),
      level: 2, // Start at Beginner
      category: 'domain',
      speedMultiplier: 1.0,
    };

    const updatedSkills = [...skills, newSkill];
    updateMember(member.id, { skills: updatedSkills });
    setNewSkillName('');
    setShowAddSkill(false);
  };

  const handleRemoveSkill = (skillId: string) => {
    const updatedSkills = skills.filter(s => s.id !== skillId);
    updateMember(member.id, { skills: updatedSkills });
  };

  const handleInitializeDefaultSkills = () => {
    const defaultSkills = DEFAULT_SKILLS_BY_FUNCTION[member.function] || [];
    if (defaultSkills.length > 0) {
      updateMember(member.id, { skills: defaultSkills });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-black/90 justify-center items-center px-4">
        <View className={`${bgCard} rounded-3xl w-full`} style={{ maxHeight: '95%', height: '95%' }}>
          {/* Header */}
          <View className={`px-6 pt-6 pb-4 border-b ${borderColor}`}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className={`${textPrimary} text-2xl font-black flex-1`} numberOfLines={2}>{member.name}</Text>
              <Pressable onPress={onClose} className="ml-2">
                <X size={28} color={isDark ? '#94a3b8' : '#6b7280'} />
              </Pressable>
            </View>
            <View className="flex-row items-center gap-2 mb-3">
              <View className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                <Text className="text-blue-500 text-sm font-semibold">
                  {member.role === 'FractionalExec' ? 'Fractional Executive' : member.role}
                </Text>
              </View>
              <View className="bg-purple-500/20 px-3 py-1.5 rounded-lg">
                <Text className="text-purple-500 text-sm font-semibold">
                  {member.function}
                </Text>
              </View>
            </View>

            {/* Speed Multiplier Banner */}
            <View className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Zap size={20} color="#10b981" />
                <Text className="text-emerald-500 font-bold">Speed Multiplier</Text>
              </View>
              <Text className="text-emerald-400 text-2xl font-black">
                {speedMultiplier.toFixed(2)}x
              </Text>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={true}
            bounces={true}
            className="flex-1"
            persistentScrollbar={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="px-6 py-4">
              {/* Avatar */}
              <View className="items-center mb-6">
                <View className="w-24 h-24 rounded-full items-center justify-center mb-3" style={{ backgroundColor: roleColor }}>
                  <Text className="text-white text-3xl font-black">{member.name.split(' ').map((n) => n[0]).join('')}</Text>
                </View>
              </View>

              {/* Skills Section */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <Sparkles size={20} color={isDark ? '#fff' : '#374151'} />
                    <Text className={`${textPrimary} text-lg font-bold`}>Skills & Abilities</Text>
                  </View>
                  {canManage && (
                    <Pressable
                      onPress={() => setShowAddSkill(true)}
                      className="bg-blue-500 px-3 py-1.5 rounded-lg flex-row items-center gap-1 active:opacity-70"
                    >
                      <Plus size={14} color="white" />
                      <Text className="text-white text-xs font-bold">Add</Text>
                    </Pressable>
                  )}
                </View>

                {skills.length === 0 ? (
                  <View className={`${bgSecondary} rounded-xl p-6 items-center`}>
                    <Text className={`${textMuted} text-center mb-3`}>No skills defined yet</Text>
                    {canManage && (
                      <Pressable
                        onPress={handleInitializeDefaultSkills}
                        className="bg-blue-500 px-4 py-2 rounded-lg active:opacity-70"
                      >
                        <Text className="text-white font-bold text-sm">Add Default Skills</Text>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <View className="gap-3">
                    {skills.map((skill) => (
                      <View key={skill.id} className={`${bgSecondary} rounded-xl p-4 border ${borderColor}`}>
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className={`${textPrimary} font-bold text-base`}>{skill.name}</Text>
                          <View className="flex-row items-center gap-2">
                            <View
                              className="px-2 py-1 rounded"
                              style={{ backgroundColor: SKILL_LEVEL_COLORS[skill.level] + '30' }}
                            >
                              <Text style={{ color: SKILL_LEVEL_COLORS[skill.level] }} className="text-xs font-bold">
                                {SKILL_LEVEL_NAMES[skill.level]}
                              </Text>
                            </View>
                            {canManage && (
                              <Pressable
                                onPress={() => handleRemoveSkill(skill.id)}
                                className="p-1 active:opacity-70"
                              >
                                <Trash2 size={14} color="#ef4444" />
                              </Pressable>
                            )}
                          </View>
                        </View>

                        {/* Skill Level Adjuster */}
                        {canManage && (
                          <View className="flex-row items-center gap-2 mt-2">
                            <Pressable
                              onPress={() => skill.level > 1 && handleUpdateSkillLevel(skill.id, skill.level - 1)}
                              disabled={skill.level <= 1}
                              className={cn(
                                'w-8 h-8 rounded-lg items-center justify-center',
                                skill.level <= 1 ? 'bg-gray-300/30' : 'bg-red-500/20 active:opacity-70'
                              )}
                            >
                              <ChevronDown size={18} color={skill.level <= 1 ? '#9ca3af' : '#ef4444'} />
                            </Pressable>

                            <View className="flex-1 flex-row gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <Pressable
                                  key={level}
                                  onPress={() => handleUpdateSkillLevel(skill.id, level)}
                                  className="flex-1 h-3 rounded-full active:opacity-70"
                                  style={{
                                    backgroundColor: level <= skill.level
                                      ? SKILL_LEVEL_COLORS[skill.level]
                                      : isDark ? '#374151' : '#e5e7eb'
                                  }}
                                />
                              ))}
                            </View>

                            <Pressable
                              onPress={() => skill.level < 5 && handleUpdateSkillLevel(skill.id, skill.level + 1)}
                              disabled={skill.level >= 5}
                              className={cn(
                                'w-8 h-8 rounded-lg items-center justify-center',
                                skill.level >= 5 ? 'bg-gray-300/30' : 'bg-green-500/20 active:opacity-70'
                              )}
                            >
                              <ChevronUp size={18} color={skill.level >= 5 ? '#9ca3af' : '#22c55e'} />
                            </Pressable>
                          </View>
                        )}

                        {/* Speed impact */}
                        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-200/30">
                          <Text className={`${textMuted} text-xs`}>Speed Impact</Text>
                          <Text
                            className="text-xs font-bold"
                            style={{ color: skill.speedMultiplier >= 1 ? '#10b981' : '#ef4444' }}
                          >
                            {skill.speedMultiplier >= 1 ? '+' : ''}{Math.round((skill.speedMultiplier - 1) * 100)}%
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* AI Proficiency */}
              <View className="mb-6">
                <Text className={`${textPrimary} text-lg font-bold mb-3`}>🤖 AI Proficiency</Text>
                <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className={textSecondary}>AI Tool Effectiveness</Text>
                    <Text className="text-amber-500 font-bold text-lg">
                      {((member.aiProficiencyMultiplier || 1.0) * 100).toFixed(0)}%
                    </Text>
                  </View>
                  {canManage && (
                    <View className="flex-row gap-2 mt-2">
                      {[0.7, 0.85, 1.0, 1.25, 1.5].map((mult) => (
                        <Pressable
                          key={mult}
                          onPress={() => updateMember(member.id, { aiProficiencyMultiplier: mult })}
                          className={cn(
                            'flex-1 py-2 rounded-lg items-center',
                            (member.aiProficiencyMultiplier || 1.0) === mult
                              ? 'bg-amber-500'
                              : `${bgSecondary}`
                          )}
                        >
                          <Text
                            className={cn(
                              'text-xs font-bold',
                              (member.aiProficiencyMultiplier || 1.0) === mult ? 'text-white' : textSecondary
                            )}
                          >
                            {(mult * 100).toFixed(0)}%
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Bio */}
              {member.bio && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>👤 About</Text>
                  <Text className={`${textPrimary} text-base leading-6`}>
                    {member.bio}
                  </Text>
                </View>
              )}

              {/* Contact Information */}
              <View className="mb-6">
                <Text className={`${textPrimary} text-lg font-bold mb-3`}>📧 Contact</Text>
                <View className={`${bgSecondary} rounded-xl p-4`}>
                  {member.email && (
                    <View className="mb-3">
                      <Text className={`${textSecondary} text-xs mb-1`}>Email</Text>
                      <Text className={`${textPrimary} text-sm`}>{member.email}</Text>
                    </View>
                  )}
                  {member.phone && (
                    <View className="mb-3">
                      <Text className={`${textSecondary} text-xs mb-1`}>Phone</Text>
                      <Text className={`${textPrimary} text-sm`}>{member.phone}</Text>
                    </View>
                  )}
                  {member.linkedIn && (
                    <View>
                      <Text className={`${textSecondary} text-xs mb-1`}>LinkedIn</Text>
                      <Text className="text-blue-500 text-sm">{member.linkedIn}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Cost Information */}
              {member.costPerDay && (
                <View className="mb-6">
                  <Text className={`${textPrimary} text-lg font-bold mb-3`}>💰 Cost</Text>
                  <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <View className="flex-row justify-between mb-2">
                      <Text className={textSecondary}>Cost per □</Text>
                      <Text className="text-emerald-500 font-bold text-xl">£{Math.round(member.costPerDay / 2)}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text className={textSecondary}>Day Rate (2□)</Text>
                      <Text className={`${textPrimary} font-semibold`}>£{member.costPerDay}</Text>
                    </View>
                    {member.daysPerWeek && (
                      <>
                        <View className="flex-row justify-between mb-2">
                          <Text className={textSecondary}>Days Per Week</Text>
                          <Text className={`${textPrimary} font-bold`}>{member.daysPerWeek} days ({member.daysPerWeek * 2}□)</Text>
                        </View>
                        <View className="flex-row justify-between border-t border-emerald-500/30 pt-2 mt-2">
                          <Text className={textSecondary}>Monthly Cost</Text>
                          <Text className="text-emerald-500 font-bold text-lg">
                            £{Math.round(member.costPerDay * member.daysPerWeek * 4.33).toLocaleString()}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}

              {/* Start Date */}
              {member.startDate && (
                <View className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                  <Text className="text-cyan-500 text-sm font-semibold mb-2">📅 Start Date</Text>
                  <Text className="text-cyan-500 font-semibold">
                    {new Date(member.startDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Button */}
          <View className={`px-6 py-4 border-t ${borderColor}`}>
            <Pressable
              onPress={onClose}
              className="bg-blue-500 rounded-xl py-4 items-center active:opacity-70"
            >
              <Text className="text-white font-bold text-base">Close</Text>
            </Pressable>
          </View>
        </View>

        {/* Add Skill Modal */}
        <Modal visible={showAddSkill} transparent animationType="fade" onRequestClose={() => setShowAddSkill(false)}>
          <Pressable
            className="flex-1 bg-black/80 justify-center items-center px-6"
            onPress={() => setShowAddSkill(false)}
          >
            <Pressable onPress={(e) => e.stopPropagation()} className={`${bgCard} rounded-2xl p-6 w-full max-w-sm`}>
              <Text className={`${textPrimary} text-xl font-black mb-4`}>Add New Skill</Text>
              <TextInput
                value={newSkillName}
                onChangeText={setNewSkillName}
                placeholder="Skill name..."
                placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                className={`${bgSecondary} ${textPrimary} rounded-xl px-4 py-3 mb-4`}
              />
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowAddSkill(false)}
                  className={`flex-1 ${bgSecondary} rounded-xl py-3 active:opacity-70`}
                >
                  <Text className={`${textPrimary} font-bold text-center`}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddSkill}
                  className="flex-1 bg-blue-500 rounded-xl py-3 active:opacity-70"
                >
                  <Text className="text-white font-bold text-center">Add Skill</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}
