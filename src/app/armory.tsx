import { View, Text, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Users,
  Plus,
  Crown,
  ChevronRight,
  DollarSign,
  Trash2,
} from 'lucide-react-native';
import { useAppStore } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import type { OrganizationMember, AIAgent } from '@/lib/organization-seed';
import type { EquipmentSlot } from '@/types';
import { getRecommendedToolsForMember } from '@/lib/armory/recommendations';
import { getToolEffects } from '@/lib/armory/tool-effects';
import { cn } from '@/lib/cn';

type TabType = 'loadouts' | 'squads';

export default function ArmoryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('loadouts');
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
            <View className="flex-row items-center justify-between mb-4">
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

            {/* Tab Selector */}
            <View className="flex-row bg-white/5 rounded-2xl p-1">
              <Pressable
                onPress={() => setActiveTab('loadouts')}
                className={cn(
                  'flex-1 py-3 rounded-xl items-center',
                  activeTab === 'loadouts' && 'bg-blue-500'
                )}
              >
                <Text className={cn('font-bold', activeTab === 'loadouts' ? 'text-white' : 'text-white/60')}>
                  Loadouts
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('squads')}
                className={cn(
                  'flex-1 py-3 rounded-xl items-center',
                  activeTab === 'squads' && 'bg-violet-500'
                )}
              >
                <Text className={cn('font-bold', activeTab === 'squads' ? 'text-white' : 'text-white/60')}>
                  Squads
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Content */}
          {activeTab === 'loadouts' ? (
            <LoadoutsTab members={members} aiAgents={aiAgents} onMemberPress={handleMemberPress} canManage={canManage} currentUserId={currentUser?.id} />
          ) : (
            <SquadsTab members={members} aiAgents={aiAgents} canManage={canManage} />
          )}
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

    const totalCost = equippedTools.reduce((sum, tool) => sum + tool.costPerMonth, 0);

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
              <Text className="text-blue-300 font-black">£{totalCost}</Text>
            </View>
            <Text className="text-white/40 text-xs">{equippedCount} {equippedCount === 1 ? 'tool' : 'tools'}</Text>
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

  const loadout = useArmoryStore((s) => s.getLoadoutForMember(member.id));
  const addAITool = useArmoryStore((s) => s.addAITool);
  const removeAITool = useArmoryStore((s) => s.removeAITool);
  const autoEquipStarterKit = useArmoryStore((s) => s.autoEquipStarterKit);
  const clearLoadout = useArmoryStore((s) => s.clearLoadout);

  // Get all equipped tools
  const equippedTools = loadout
    ? loadout.aiToolIds
        .map((id) => aiAgents.find((a) => a.id === id))
        .filter((t): t is AIAgent => t !== undefined)
    : [];

  const totalCost = equippedTools.reduce((sum, tool) => sum + tool.costPerMonth, 0);
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
              <View className="bg-blue-500/20 border border-blue-500/30 rounded-2xl px-6 py-3">
                <View className="flex-row items-center gap-2">
                  <DollarSign size={20} color="#60a5fa" />
                  <Text className="text-blue-300 text-2xl font-black">£{totalCost}</Text>
                  <Text className="text-white/40 text-sm">/month</Text>
                </View>
              </View>
            </View>

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

// ========== SQUADS TAB ==========

function SquadsTab({
  members,
  aiAgents,
  canManage,
}: {
  members: OrganizationMember[];
  aiAgents: AIAgent[];
  canManage: boolean;
}) {
  const [showCreateSquad, setShowCreateSquad] = useState(false);

  const currentMembership = useAppStore((s) => s.currentMembership);
  const allSquads = useArmoryStore((s) => s.squads);

  // Memoize the filtered squads to prevent infinite re-renders
  const squads = useMemo(() => {
    return allSquads.filter((squad) => squad.workspaceId === (currentMembership?.workspaceId || ''));
  }, [allSquads, currentMembership?.workspaceId]);

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
        {canManage && (
          <Pressable
            onPress={() => setShowCreateSquad(true)}
            className="bg-violet-500 rounded-2xl py-4 px-6 mb-6 flex-row items-center justify-center active:opacity-80"
          >
            <Plus size={20} color="white" strokeWidth={3} />
            <Text className="text-white font-black text-base ml-2">Create Squad</Text>
          </Pressable>
        )}

        {squads.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Users size={48} color="rgba(255,255,255,0.2)" />
            <Text className="text-white/40 text-center mt-4">
              No squads yet.{canManage && '\nCreate your first squad!'}
            </Text>
          </View>
        ) : (
          squads.map((squad) => {
            const leader = members.find((m) => m.id === squad.leaderMemberId);
            const apprenticeMembers = squad.apprenticeMemberIds
              .map((id) => members.find((m) => m.id === id))
              .filter((m): m is OrganizationMember => m !== undefined);

            const capacity = 3; // Base capacity for execs
            const isOverCapacity = apprenticeMembers.length > capacity;

            return (
              <View key={squad.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-white text-xl font-black mb-1">{squad.name}</Text>
                    <View className="flex-row items-center gap-2">
                      <View className="bg-violet-500/20 px-2 py-1 rounded">
                        <Text className="text-violet-300 text-xs font-bold">{squad.function}</Text>
                      </View>
                      {isOverCapacity && (
                        <View className="bg-red-500/20 px-2 py-1 rounded">
                          <Text className="text-red-300 text-xs font-bold">Over Capacity</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {leader && (
                  <View className="flex-row items-center mb-3">
                    <Crown size={16} color="#fbbf24" />
                    <Text className="text-white/60 text-sm ml-2">
                      Leader: <Text className="text-white font-bold">{leader.name}</Text>
                    </Text>
                  </View>
                )}

                <View className="mb-3">
                  <Text className="text-white/60 text-sm mb-2">
                    Capacity: {apprenticeMembers.length}/{capacity}
                  </Text>
                  <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <View
                      className={cn('h-full rounded-full', isOverCapacity ? 'bg-red-500' : 'bg-emerald-500')}
                      style={{ width: `${Math.min((apprenticeMembers.length / capacity) * 100, 100)}%` }}
                    />
                  </View>
                </View>

                {apprenticeMembers.length > 0 && (
                  <View className="bg-white/5 rounded-xl p-3">
                    <Text className="text-white/60 text-xs font-bold mb-2">TEAM MEMBERS</Text>
                    {apprenticeMembers.map((apprentice) => (
                      <Text key={apprentice.id} className="text-white text-sm mb-1">
                        • {apprentice.name}
                      </Text>
                    ))}
                  </View>
                )}

                {squad.deployedOKRId && (
                  <View className="bg-blue-500/20 rounded-xl p-3 mt-3">
                    <Text className="text-blue-300 text-sm font-bold">Deployed to OKR</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View className="h-20" />
      </ScrollView>

      {/* Create Squad Modal */}
      {showCreateSquad && (
        <CreateSquadModal
          visible={showCreateSquad}
          members={members}
          onClose={() => setShowCreateSquad(false)}
        />
      )}
    </View>
  );
}

// ========== CREATE SQUAD MODAL ==========

function CreateSquadModal({
  visible,
  members,
  onClose,
}: {
  visible: boolean;
  members: OrganizationMember[];
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string>('Engineering');
  const [selectedLeader, setSelectedLeader] = useState<string>('');

  const currentMembership = useAppStore((s) => s.currentMembership);
  const createSquad = useArmoryStore((s) => s.createSquad);

  const execs = members.filter((m) => m.role === 'FractionalExec' && m.status === 'active');

  const handleCreate = async () => {
    if (!name.trim() || !selectedLeader || !currentMembership?.workspaceId) return;

    await createSquad({
      workspaceId: currentMembership.workspaceId,
      name: name.trim(),
      function: selectedFunction as any,
      leaderMemberId: selectedLeader,
      apprenticeMemberIds: [],
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black/90 justify-end">
        <View className="bg-slate-900 rounded-t-3xl">
          <View className="px-6 py-5 border-b border-white/10 flex-row items-center justify-between">
            <Text className="text-white text-xl font-black">Create Squad</Text>
            <Pressable onPress={onClose} className="w-10 h-10 items-center justify-center rounded-full bg-white/10 active:opacity-70">
              <X size={24} color="white" />
            </Pressable>
          </View>

          <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-white font-bold mb-2">Squad Name</Text>
              <TextInput
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                placeholder="Engineering Team Alpha"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="mb-4">
              <Text className="text-white font-bold mb-2">Function</Text>
              <View className="flex-row flex-wrap gap-2">
                {['Engineering', 'Sales', 'Marketing', 'Finance', 'Ops'].map((func) => (
                  <Pressable
                    key={func}
                    onPress={() => setSelectedFunction(func)}
                    className={cn(
                      'px-4 py-2 rounded-xl border',
                      selectedFunction === func ? 'bg-violet-500 border-violet-500' : 'bg-white/5 border-white/20'
                    )}
                  >
                    <Text className={cn('font-bold', selectedFunction === func ? 'text-white' : 'text-white/60')}>
                      {func}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-white font-bold mb-2">Select Leader (Executive)</Text>
              {execs.map((exec) => (
                <Pressable
                  key={exec.id}
                  onPress={() => setSelectedLeader(exec.id)}
                  className={cn(
                    'bg-white/5 border rounded-xl p-4 mb-2',
                    selectedLeader === exec.id ? 'border-violet-500' : 'border-white/10'
                  )}
                >
                  <Text className="text-white font-bold">{exec.name}</Text>
                  <Text className="text-white/60 text-sm">{exec.function}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleCreate}
              disabled={!name.trim() || !selectedLeader}
              className={cn(
                'rounded-2xl py-4 items-center',
                name.trim() && selectedLeader ? 'bg-violet-500' : 'bg-white/10'
              )}
            >
              <Text className="text-white font-black">Create Squad</Text>
            </Pressable>

            <View className="h-40" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
