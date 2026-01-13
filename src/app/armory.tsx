import { View, Text, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  DollarSign,
  Trash2,
} from 'lucide-react-native';
import { useAppStore } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import type { OrganizationMember, AIAgent } from '@/lib/organization-seed';
import { getRecommendedToolsForMember } from '@/lib/armory/recommendations';
import { getToolEffects } from '@/lib/armory/tool-effects';
import { cn } from '@/lib/cn';

export default function ArmoryScreen() {
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);

  const currentUser = useAppStore((s) => s.currentUser);
  const currentMembership = useAppStore((s) => s.currentMembership);
  const members = useOrganizationStore((s) => s.members);
  const aiAgents = useOrganizationStore((s) => s.aiAgents);

  const initializeArmory = useArmoryStore((s) => s.initializeArmory);
  const isInitialized = useArmoryStore((s) => s.isInitialized);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized && currentMembership?.workspaceId) {
      initializeArmory(currentMembership.workspaceId, members, aiAgents);
    }
  }, [isInitialized, currentMembership?.workspaceId, members, aiAgents]);

  const canManage = currentMembership?.role === 'Founder';

  const handleMemberPress = (member: OrganizationMember) => {
    // RBAC: Founders can view/edit anyone, Execs/Apprentices only themselves
    if (canManage || member.id === currentUser?.id) {
      setSelectedMember(member);
      setShowCharacterSheet(true);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#312e81']}
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
    const canView = canManage || isCurrentUser;

    return (
      <Pressable
        key={member.id}
        onPress={() => canView && onMemberPress(member)}
        disabled={!canView}
        className={cn('bg-white/5 border border-white/10 rounded-2xl p-4 mb-3', canView && 'active:opacity-70')}
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
  member,
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

  const loadout = useArmoryStore((s) => s.getLoadoutForMember(member.id));
  const addAITool = useArmoryStore((s) => s.addAITool);
  const removeAITool = useArmoryStore((s) => s.removeAITool);
  const autoEquipStarterKit = useArmoryStore((s) => s.autoEquipStarterKit);
  const clearLoadout = useArmoryStore((s) => s.clearLoadout);
  const removePersonLoadout = useArmoryStore((s) => s.removePersonLoadout);
  const updateMember = useOrganizationStore((s) => s.updateMember);

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
        <View className="bg-slate-900 rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="px-6 py-5 border-b border-white/10 flex-row items-center justify-between">
            <Text className="text-white text-xl font-black">AI Tools</Text>
            <Pressable onPress={onClose} className="w-10 h-10 items-center justify-center rounded-full bg-white/10 active:opacity-70">
              <X size={24} color="white" />
            </Pressable>
          </View>

          <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
            {/* Avatar & Stats */}
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: roleColor }}>
                <Text className="text-white text-2xl font-black">{member.name.split(' ').map((n) => n[0]).join('')}</Text>
              </View>
              <Text className="text-white text-xl font-black mb-1">{member.name}</Text>
              <Text className="text-white/60 text-sm mb-4">
                {member.role === 'FractionalExec' ? 'Fractional Executive' : member.role} • {member.function}
              </Text>

              {/* Total Cost */}
              <View className="bg-blue-500/20 border border-blue-500/30 rounded-2xl px-6 py-4">
                <View className="flex-row items-center justify-center gap-2 mb-3">
                  <DollarSign size={24} color="#60a5fa" />
                  <Text className="text-blue-300 text-3xl font-black">£{totalCost.toLocaleString()}</Text>
                  <Text className="text-white/40 text-sm">/month</Text>
                </View>

                {/* Cost Breakdown */}
                <View className="border-t border-blue-500/20 pt-3 space-y-1">
                  {personCostPerMonth > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-white/60 text-sm">Person Cost:</Text>
                      <Text className="text-white/80 text-sm font-bold">£{personCostPerMonth.toLocaleString()}</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between">
                    <Text className="text-white/60 text-sm">AI Tools Cost:</Text>
                    <Text className="text-white/80 text-sm font-bold">£{aiToolsCost.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Days Per Week Selector (for executives only) */}
            {member.role === 'FractionalExec' && canManage && (
              <View className="mb-6">
                <Text className="text-white text-sm font-bold mb-2">Days Per Week</Text>
                <View className="flex-row gap-2">
                  {[1, 2, 3, 4, 5].map((days) => (
                    <Pressable
                      key={days}
                      onPress={() => handleDaysPerWeekChange(days)}
                      className={cn(
                        'flex-1 rounded-xl py-3 border',
                        daysPerWeek === days
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white/5 border-white/20'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-center font-bold',
                          daysPerWeek === days ? 'text-white' : 'text-white/60'
                        )}
                      >
                        {days}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text className="text-white/40 text-xs mt-2">
                  {member.costPerDay && `£${member.costPerDay}/day × ${daysPerWeek} days × 4.33 weeks = £${Math.round(personCostPerMonth).toLocaleString()}/month`}
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

            {/* AI Tools List */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-black">AI Tools ({equippedTools.length})</Text>
              {canManage && (
                <Pressable onPress={() => setShowAddTool(true)} className="bg-blue-500 rounded-lg px-3 py-2 active:opacity-80">
                  <Text className="text-white font-bold text-sm">+ Add</Text>
                </Pressable>
              )}
            </View>

            {equippedTools.length === 0 ? (
              <View className="bg-white/5 rounded-2xl p-8 items-center">
                <Text className="text-white/40 text-center">No AI tools equipped yet</Text>
                {canManage && (
                  <Pressable onPress={() => setShowAddTool(true)} className="bg-blue-500 rounded-xl px-6 py-3 mt-4 active:opacity-80">
                    <Text className="text-white font-bold">Add First Tool</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              equippedTools.map((tool) => {
                const toolEffects = getToolEffects(tool.id);
                return (
                  <View key={tool.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 mr-3">
                        <Text className="text-white font-black text-base">{tool.name}</Text>
                        <Text className="text-white/60 text-sm mt-1">{tool.purpose}</Text>
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
                          <View key={idx} className="bg-emerald-500/20 px-2 py-1 rounded">
                            <Text className="text-emerald-300 text-xs font-bold">{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {/* Remove from Armory */}
            {canManage && (
              <View className="mt-8 pt-6 border-t border-white/10">
                <Pressable
                  onPress={() => setShowRemoveConfirm(true)}
                  className="bg-red-500/20 border border-red-500/30 rounded-xl py-3 px-4 active:opacity-70"
                >
                  <Text className="text-red-400 font-bold text-center">Remove from Armory</Text>
                </Pressable>
                <Text className="text-white/40 text-xs text-center mt-2">
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
              <View className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-red-500/30">
                <Text className="text-white text-xl font-black mb-3">Remove from Armory?</Text>
                <Text className="text-white/60 text-sm mb-6">
                  This will remove {member.name} from the Armory. All equipped AI tools will be unassigned. This person will still exist in your organization chart.
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowRemoveConfirm(false)}
                    className="flex-1 bg-white/10 rounded-xl py-3 active:opacity-70"
                  >
                    <Text className="text-white font-bold text-center">Cancel</Text>
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

  const recommended = getRecommendedToolsForMember(member, aiAgents);
  const availableTools = aiAgents.filter((t) => t.status === 'active' && !equippedToolIds.includes(t.id));

  const recommendedAvailable = recommended
    .map((r) => r.tool)
    .filter((t) => !equippedToolIds.includes(t.id))
    .slice(0, 5);

  const toolsToShow = showAllTools ? availableTools : recommendedAvailable;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black/90 justify-end">
        <View className="bg-slate-900 rounded-t-3xl max-h-[80%]">
          <View className="px-6 py-5 border-b border-white/10 flex-row items-center justify-between">
            <Text className="text-white text-xl font-black">Add AI Tool</Text>
            <Pressable onPress={onClose} className="w-10 h-10 items-center justify-center rounded-full bg-white/10 active:opacity-70">
              <X size={24} color="white" />
            </Pressable>
          </View>

          <View className="px-6 pt-4 pb-2">
            <Pressable onPress={() => setShowAllTools(!showAllTools)} className="bg-white/5 rounded-xl py-3 px-4 active:opacity-70">
              <Text className="text-white font-bold text-center">{showAllTools ? 'Show Recommended' : 'Show All Tools'}</Text>
            </Pressable>
          </View>

          <ScrollView className="px-6 py-2" showsVerticalScrollIndicator={false}>
            {toolsToShow.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-white/40 text-center">No more tools available</Text>
              </View>
            ) : (
              toolsToShow.map((tool) => {
                const toolEffects = getToolEffects(tool.id);
                return (
                  <Pressable
                    key={tool.id}
                    onPress={() => onAdd(tool.id)}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3 active:bg-white/10"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-white font-black text-base">{tool.name}</Text>
                        <Text className="text-white/60 text-sm mt-1">{tool.purpose}</Text>
                      </View>
                      <View className="bg-blue-500/20 px-3 py-1 rounded-lg">
                        <Text className="text-blue-300 text-xs font-bold">£{tool.costPerMonth}/mo</Text>
                      </View>
                    </View>
                    {toolEffects && (
                      <View className="flex-row flex-wrap gap-1 mt-2">
                        {toolEffects.effectTags.map((tag, idx) => (
                          <View key={idx} className="bg-emerald-500/20 px-2 py-1 rounded">
                            <Text className="text-emerald-300 text-xs font-bold">{tag}</Text>
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
  );
}
