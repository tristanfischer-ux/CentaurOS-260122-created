import { View, Text, ScrollView, Pressable, Modal, TextInput, Switch } from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Plus,
  Minus,
  Users,
  Bot,
  Check,
  ChevronRight,
  UserPlus,
  Sparkles,
  Trash2,
  Settings,
  Building2,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Shield,
  Linkedin,
  Clock,
  Target,
  BarChart3,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import { useMarketplaceRequestsStore } from '@/lib/state/marketplace-requests-store';
import type { OrganizationMember, AIAgent } from '@/lib/organization-seed';
import { THIRD_PARTY_AI_TOOLS } from '@/lib/third-party-ai-tools';
import { MARKETPLACE_EXECUTIVES } from '@/lib/marketplace-executives';
import { cn } from '@/lib/cn';
import { useCurrentRole, useCurrentUser } from '@/lib/state/app-store';

export default function TeamManagementScreen() {
  const currentRole = useCurrentRole();
  const currentUser = useCurrentUser();
  const isApprentice = currentRole === 'Apprentice';

  const [selectedTab, setSelectedTab] = useState<'organization' | 'recommended' | 'squads'>('organization');
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [showAddMemberToSquad, setShowAddMemberToSquad] = useState<string | null>(null);
  const [showEquipAI, setShowEquipAI] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<OrganizationMember | null>(null);

  const members = useOrganizationStore((s) => s.members);
  const aiAgents = useOrganizationStore((s) => s.aiAgents);
  const updateMember = useOrganizationStore((s) => s.updateMember);
  const addMember = useOrganizationStore((s) => s.addMember);
  const personLoadouts = useArmoryStore((s) => s.personLoadouts);
  const addAITool = useArmoryStore((s) => s.addAITool);
  const removeAITool = useArmoryStore((s) => s.removeAITool);
  const squads = useArmoryStore((s) => s.squads);
  const createSquad = useArmoryStore((s) => s.createSquad);
  const assignApprentice = useArmoryStore((s) => s.assignApprentice);
  const removeApprentice = useArmoryStore((s) => s.removeApprentice);
  const deleteSquad = useArmoryStore((s) => s.deleteSquad);

  // Marketplace requests store
  const allRequests = useMarketplaceRequestsStore((s) => s.requests);
  const createRequest = useMarketplaceRequestsStore((s) => s.createRequest);
  const approveRequest = useMarketplaceRequestsStore((s) => s.approveRequest);
  const rejectRequest = useMarketplaceRequestsStore((s) => s.rejectRequest);
  const getRequestByCandidate = useMarketplaceRequestsStore((s) => s.getRequestByCandidate);

  // Filter pending requests with useMemo
  const pendingRequests = useMemo(() => {
    return allRequests.filter((req) => req.status === 'pending');
  }, [allRequests]);

  // Filter current team members
  const currentTeam = useMemo(() => {
    return members.filter(m => m.status === 'active');
  }, [members]);

  // For Apprentice: only show their assigned executive and founders
  // For others: show all executives
  const executives = useMemo(() => {
    const allExecs = currentTeam.filter(m => m.role === 'FractionalExec');
    if (isApprentice) {
      // Apprentice can only see executives assigned to them (by squad) and founders
      const apprenticeSquads = squads.filter(s => s.apprenticeMemberIds?.includes(currentUser?.id ?? ''));
      const assignedExecIds = apprenticeSquads.map(s => s.leaderMemberId);
      return allExecs.filter(e => assignedExecIds.includes(e.id));
    }
    return allExecs;
  }, [currentTeam, isApprentice, squads, currentUser?.id]);

  // Founders - everyone can see founders
  const founders = useMemo(() => {
    return currentTeam.filter(m => m.role === 'Founder');
  }, [currentTeam]);

  // Apprentices - only show for non-apprentice users (apprentices shouldn't see other apprentices)
  const apprentices = useMemo(() => {
    if (isApprentice) {
      return []; // Apprentices don't see other apprentices
    }
    return currentTeam.filter(m => m.role === 'Apprentice');
  }, [currentTeam, isApprentice]);

  const activeAI = useMemo(() => {
    return (aiAgents || []).filter(a => a.status === 'active');
  }, [aiAgents]);

  // Get recommended people from marketplace
  // Show pending requests first, then available people
  const recommendedPeople = useMemo(() => {
    const available = MARKETPLACE_EXECUTIVES
      .filter(exec => exec.availability === 'available')
      .slice(0, 10);
    return available;
  }, []);

  // Split recommendations into pending requests and available people
  const pendingRecommendations = useMemo(() => {
    return pendingRequests.map(req => {
      const candidate = MARKETPLACE_EXECUTIVES.find(e => e.id === req.candidateId);
      return { request: req, candidate };
    }).filter(item => item.candidate);
  }, [pendingRequests]);

  const availableRecommendations = useMemo(() => {
    const requestedIds = pendingRequests.map(r => r.candidateId);
    return recommendedPeople.filter(p => !requestedIds.includes(p.id));
  }, [recommendedPeople, pendingRequests]);

  const handleRequestPerson = (person: typeof MARKETPLACE_EXECUTIVES[0]) => {
    // Create a marketplace request
    createRequest({
      workspaceId: 'workspace-demo-company',
      candidateId: person.id,
      candidateName: person.name,
      candidateRole: person.role as 'FractionalExec' | 'Apprentice',
      candidateFunction: person.function,
      requestedBy: 'Founder',
      proposedDaysPerWeek: 3, // Default 3 days per week
      proposedDayRate: person.costPerDay,
      notes: `Requested from marketplace - ${person.experience}`,
    });
  };

  const handleApprovePerson = (requestId: string, candidateId: string) => {
    // Find the candidate
    const candidate = MARKETPLACE_EXECUTIVES.find(e => e.id === candidateId);
    const request = pendingRequests.find(r => r.id === requestId);

    if (!candidate || !request) return;

    // Add to organization
    addMember({
      id: `member-${Date.now()}`,
      workspaceId: 'workspace-demo-company',
      name: candidate.name,
      role: candidate.role as 'FractionalExec' | 'Apprentice',
      function: candidate.function,
      email: `${candidate.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: undefined,
      linkedIn: candidate.linkedIn,
      bio: candidate.bio,
      costPerDay: request.proposedDayRate,
      daysPerWeek: request.proposedDaysPerWeek,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
    });

    // Approve the request
    approveRequest(requestId, 'Founder');
  };

  const handleRejectPerson = (requestId: string) => {
    rejectRequest(requestId, 'Founder');
  };

  const handleRemovePerson = (memberId: string) => {
    // Apprentices cannot remove team members
    if (isApprentice) return;
    updateMember(memberId, { status: 'inactive' });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <LinearGradient
        colors={isApprentice ? ['#10b981', '#059669'] : ['#1e40af', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 24, paddingVertical: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white text-2xl font-black">
              {isApprentice ? 'My Team' : 'Team Management'}
            </Text>
            <Text className="text-white/80 text-sm mt-1">
              {isApprentice
                ? 'Your executive and founders'
                : 'View team, hire people, organize squads, equip AI'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
          >
            <X size={24} color="white" />
          </Pressable>
        </View>

        {/* Summary Stats - Different for Apprentice */}
        {isApprentice ? (
          <View className="flex-row gap-2 mt-4">
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-white/60 text-xs mb-1">Your Executive</Text>
              <Text className="text-white text-2xl font-black">{executives.length}</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-white/60 text-xs mb-1">Founders</Text>
              <Text className="text-white text-2xl font-black">{founders.length}</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-white/60 text-xs mb-1">AI Agents</Text>
              <Text className="text-white text-2xl font-black">{activeAI.length}</Text>
            </View>
          </View>
        ) : (
          <View className="flex-row gap-2 mt-4">
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-white/60 text-xs mb-1">Executives</Text>
              <Text className="text-white text-2xl font-black">{executives.length}</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-white/60 text-xs mb-1">Apprentices</Text>
              <Text className="text-white text-2xl font-black">{apprentices.length}</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-white/60 text-xs mb-1">AI Agents</Text>
              <Text className="text-white text-2xl font-black">{activeAI.length}</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-white/60 text-xs mb-1">Squads</Text>
              <Text className="text-white text-2xl font-black">{squads.length}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Tab Selector - Apprentice only sees Organization tab */}
      {!isApprentice && (
        <View className="flex-row px-6 py-4 gap-2">
          <Pressable
            onPress={() => setSelectedTab('organization')}
            className={cn(
              'flex-1 rounded-xl py-3 border',
              selectedTab === 'organization'
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white/5 border-white/20'
            )}
          >
            <View className="flex-row items-center justify-center">
              <Building2 size={16} color={selectedTab === 'organization' ? '#fff' : '#94a3b8'} />
              <Text
                className={cn(
                  'ml-2 font-bold text-sm',
                  selectedTab === 'organization' ? 'text-white' : 'text-white/60'
                )}
              >
                Organization
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('recommended')}
            className={cn(
              'flex-1 rounded-xl py-3 border',
              selectedTab === 'recommended'
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white/5 border-white/20'
            )}
          >
            <View className="flex-row items-center justify-center">
              <Sparkles size={16} color={selectedTab === 'recommended' ? '#fff' : '#94a3b8'} />
              <Text
                className={cn(
                  'ml-2 font-bold text-sm',
                  selectedTab === 'recommended' ? 'text-white' : 'text-white/60'
                )}
              >
                Recommended
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('squads')}
            className={cn(
              'flex-1 rounded-xl py-3 border',
              selectedTab === 'squads'
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white/5 border-white/20'
            )}
          >
            <View className="flex-row items-center justify-center">
              <Users size={16} color={selectedTab === 'squads' ? '#fff' : '#94a3b8'} />
              <Text
                className={cn(
                  'ml-2 font-bold text-sm',
                  selectedTab === 'squads' ? 'text-white' : 'text-white/60'
                )}
              >
                Squads
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Organization Tab - View Current Team */}
        {selectedTab === 'organization' && (
          <View>
            {/* Quick Actions - Only for non-Apprentices */}
            {!isApprentice && (
              <View className="flex-row gap-2 mb-4">
                <Pressable
                  onPress={() => setSelectedTab('recommended')}
                  className="flex-1 bg-emerald-500 rounded-xl py-3 active:opacity-80"
                >
                  <View className="flex-row items-center justify-center">
                    <UserPlus size={16} color="white" />
                    <Text className="text-white font-bold ml-2 text-sm">Add People</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/armory')}
                  className="flex-1 bg-purple-500 rounded-xl py-3 active:opacity-80"
                >
                  <View className="flex-row items-center justify-center">
                    <Bot size={16} color="white" />
                    <Text className="text-white font-bold ml-2 text-sm">Equip AI</Text>
                  </View>
                </Pressable>
              </View>
            )}

            {/* AI Assistant Button for Apprentices */}
            {isApprentice && (
              <Pressable
                onPress={() => router.push('/(tabs)/make')}
                className="mb-4"
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-white/20 w-12 h-12 rounded-full items-center justify-center">
                        <Bot size={24} color="#fff" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-white font-black text-base">Ask AI for Help</Text>
                        <Text className="text-white/80 text-sm">Get assistance with your work</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#fff" />
                  </View>
                </LinearGradient>
              </Pressable>
            )}

            {/* Founders Section - Visible to Everyone */}
            {founders.length > 0 && (
              <View className="mb-6">
                <Text className="text-white font-black text-lg mb-3">
                  Founders ({founders.length})
                </Text>
                {founders.map((member) => {
                  const loadout = personLoadouts.find(l => l.memberId === member.id);
                  const aiToolCount = loadout?.aiToolIds?.length || 0;
                  const monthlyCost = member.costPerDay && member.daysPerWeek
                    ? Math.round(member.costPerDay * member.daysPerWeek * 4.33)
                    : 0;

                  return (
                    <Pressable
                      key={member.id}
                      onPress={() => !isApprentice && setSelectedPerson(member)}
                      disabled={isApprentice}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3 active:opacity-70"
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-white font-black text-base">{member.name}</Text>
                          <Text className="text-white/60 text-sm">{member.function}</Text>
                          <View className="flex-row items-center gap-2 mt-1">
                            <View className="bg-amber-500/20 px-2 py-0.5 rounded">
                              <Text className="text-amber-300 text-xs font-bold">Founder</Text>
                            </View>
                          </View>
                        </View>
                        {/* Hide salary for Apprentices */}
                        {!isApprentice && monthlyCost > 0 && (
                          <View className="items-end">
                            <Text className="text-amber-300 font-black text-lg">
                              £{monthlyCost.toLocaleString()}
                            </Text>
                            <Text className="text-white/40 text-xs">/month</Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Bot size={16} color="#f59e0b" />
                          <Text className="text-white/60 text-sm ml-1">
                            {aiToolCount} AI {aiToolCount === 1 ? 'tool' : 'tools'}
                          </Text>
                        </View>
                        {!isApprentice && <ChevronRight size={20} color="#94a3b8" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Executives */}
            <View className="mb-6">
              <Text className="text-white font-black text-lg mb-3">
                {isApprentice ? 'My Executive' : `Executives (${executives.length})`}
              </Text>
              {executives.length === 0 && isApprentice && (
                <View className="bg-white/5 border border-white/10 rounded-2xl p-6 items-center">
                  <Users size={32} color="rgba(255,255,255,0.3)" />
                  <Text className="text-white/60 text-center mt-3">
                    You haven't been assigned to an executive yet
                  </Text>
                </View>
              )}
              {executives.map((member) => {
                const loadout = personLoadouts.find(l => l.memberId === member.id);
                const aiToolCount = loadout?.aiToolIds?.length || 0;
                const monthlyCost = member.costPerDay && member.daysPerWeek
                  ? Math.round(member.costPerDay * member.daysPerWeek * 4.33)
                  : 0;

                return (
                  <Pressable
                    key={member.id}
                    onPress={() => !isApprentice && setSelectedPerson(member)}
                    disabled={isApprentice}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3 active:opacity-70"
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-white font-black text-base">{member.name}</Text>
                        <Text className="text-white/60 text-sm">{member.function}</Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <View className="bg-purple-500/20 px-2 py-0.5 rounded">
                            <Text className="text-purple-300 text-xs font-bold">Executive</Text>
                          </View>
                          {member.daysPerWeek && (
                            <View className="bg-blue-500/20 px-2 py-0.5 rounded">
                              <Text className="text-blue-300 text-xs font-bold">
                                {member.daysPerWeek} days/wk
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {/* Hide salary for Apprentices */}
                      {!isApprentice && (
                        <View className="items-end">
                          <Text className="text-purple-300 font-black text-lg">
                            £{monthlyCost.toLocaleString()}
                          </Text>
                          <Text className="text-white/40 text-xs">/month</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Bot size={16} color="#8b5cf6" />
                        <Text className="text-white/60 text-sm ml-1">
                          {aiToolCount} AI {aiToolCount === 1 ? 'tool' : 'tools'}
                        </Text>
                      </View>
                      {!isApprentice && <ChevronRight size={20} color="#94a3b8" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Apprentices - Only visible to non-Apprentices */}
            {!isApprentice && (
              <View className="mb-6">
                <Text className="text-white font-black text-lg mb-3">
                  Apprentices ({apprentices.length})
                </Text>
                {apprentices.map((member) => {
                  const loadout = personLoadouts.find(l => l.memberId === member.id);
                  const aiToolCount = loadout?.aiToolIds?.length || 0;
                  const monthlyCost = member.costPerDay && member.daysPerWeek
                    ? Math.round(member.costPerDay * (member.daysPerWeek || 5) * 4.33)
                    : 0;

                  return (
                    <Pressable
                      key={member.id}
                      onPress={() => setSelectedPerson(member)}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3 active:opacity-70"
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-white font-black text-base">{member.name}</Text>
                          <Text className="text-white/60 text-sm">{member.function}</Text>
                          <View className="bg-emerald-500/20 px-2 py-0.5 rounded mt-1 self-start">
                            <Text className="text-emerald-300 text-xs font-bold">Apprentice</Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-emerald-300 font-black text-lg">
                            £{monthlyCost.toLocaleString()}
                          </Text>
                          <Text className="text-white/40 text-xs">/month</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Bot size={16} color="#8b5cf6" />
                          <Text className="text-white/60 text-sm ml-1">
                            {aiToolCount} AI {aiToolCount === 1 ? 'tool' : 'tools'}
                          </Text>
                        </View>
                        <ChevronRight size={20} color="#94a3b8" />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Recommended Tab - Marketplace Hiring (Hidden from Apprentices) */}
        {selectedTab === 'recommended' && !isApprentice && (
          <View>
            {/* Pending Requests Section */}
            {pendingRecommendations.length > 0 && (
              <View className="mb-6">
                <Text className="text-white font-black text-lg mb-3">
                  Pending Approvals ({pendingRecommendations.length})
                </Text>
                <Text className="text-amber-400 text-sm mb-3">
                  Review and approve these hiring requests
                </Text>

                {pendingRecommendations.map(({ request, candidate }) => {
                  if (!candidate) return null;
                  return (
                    <View
                      key={request.id}
                      className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-3"
                    >
                      <View className="flex-row items-center mb-2">
                        <Clock size={16} color="#fbbf24" />
                        <Text className="text-amber-400 text-xs font-bold ml-1">PENDING APPROVAL</Text>
                      </View>

                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-row items-start flex-1">
                          <View className="bg-blue-500/20 rounded-full w-12 h-12 items-center justify-center mr-3">
                            <Text className="text-2xl">
                              {candidate.role === 'FractionalExec' ? '👔' : '🎓'}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-white font-black text-base">{candidate.name}</Text>
                            <Text className="text-white/60 text-sm">{candidate.function}</Text>
                            <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                              <View className="bg-amber-500/20 px-2 py-0.5 rounded">
                                <Text className="text-amber-300 text-xs font-bold">⭐ {candidate.rating}</Text>
                              </View>
                              <View className={candidate.role === 'FractionalExec' ? 'bg-purple-500/20 px-2 py-0.5 rounded' : 'bg-emerald-500/20 px-2 py-0.5 rounded'}>
                                <Text className={candidate.role === 'FractionalExec' ? 'text-purple-300 text-xs font-bold' : 'text-emerald-300 text-xs font-bold'}>
                                  {candidate.role === 'FractionalExec' ? 'Executive' : 'Apprentice'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View className="items-end ml-2">
                          <Text className="text-blue-300 font-black text-lg">
                            £{request.proposedDayRate}
                          </Text>
                          <Text className="text-white/40 text-xs">/day × {request.proposedDaysPerWeek}d</Text>
                        </View>
                      </View>

                      <View className="bg-white/5 rounded-xl p-3 mb-3">
                        <Text className="text-white/60 text-xs font-bold mb-1">PROPOSED TERMS</Text>
                        <Text className="text-white text-sm">
                          {request.proposedDaysPerWeek} days/week • £{Math.round(request.proposedDayRate * request.proposedDaysPerWeek * 4.33)}/month
                        </Text>
                      </View>

                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => handleRejectPerson(request.id)}
                          className="flex-1 bg-red-500/20 border border-red-500/30 rounded-xl py-3 active:opacity-70"
                        >
                          <Text className="text-red-400 font-bold text-center">Reject</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleApprovePerson(request.id, candidate.id)}
                          className="flex-1 bg-emerald-500 rounded-xl py-3 active:opacity-80"
                        >
                          <View className="flex-row items-center justify-center">
                            <Check size={16} color="white" />
                            <Text className="text-white font-bold ml-1">Approve & Add</Text>
                          </View>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Available People Section */}
            <View>
              <Text className="text-white font-black text-lg mb-3">
                Available from Marketplace ({availableRecommendations.length})
              </Text>
              <Text className="text-white/60 text-sm mb-3">
                Top talent available to hire immediately
              </Text>

              {availableRecommendations.map((person) => {
                const existingRequest = getRequestByCandidate(person.id);
                const isRequested = existingRequest?.status === 'pending';

                return (
                  <View
                    key={person.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3"
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-start flex-1">
                        <View className="bg-blue-500/20 rounded-full w-12 h-12 items-center justify-center mr-3">
                          <Text className="text-2xl">
                            {person.role === 'FractionalExec' ? '👔' : '🎓'}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-black text-base">{person.name}</Text>
                          <Text className="text-white/60 text-sm">{person.function}</Text>
                          <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                            <View className="bg-amber-500/20 px-2 py-0.5 rounded">
                              <Text className="text-amber-300 text-xs font-bold">⭐ {person.rating}</Text>
                            </View>
                            <View className="bg-blue-500/20 px-2 py-0.5 rounded">
                              <Text className="text-blue-300 text-xs font-bold">
                                {person.specialties[0]}
                              </Text>
                            </View>
                            <View className={person.role === 'FractionalExec' ? 'bg-purple-500/20 px-2 py-0.5 rounded' : 'bg-emerald-500/20 px-2 py-0.5 rounded'}>
                              <Text className={person.role === 'FractionalExec' ? 'text-purple-300 text-xs font-bold' : 'text-emerald-300 text-xs font-bold'}>
                                {person.role === 'FractionalExec' ? 'Executive' : 'Apprentice'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <View className="items-end ml-2">
                        <Text className="text-blue-300 font-black text-lg">
                          £{person.costPerDay}
                        </Text>
                        <Text className="text-white/40 text-xs">/day</Text>
                      </View>
                    </View>

                    <View className="bg-white/5 rounded-xl p-3 mb-3">
                      <Text className="text-white/60 text-xs font-bold mb-1">EXPERIENCE</Text>
                      <Text className="text-white text-sm">{person.experience}</Text>
                    </View>

                    <View className="bg-white/5 rounded-xl p-3 mb-3">
                      <Text className="text-white/60 text-xs font-bold mb-1">LOCATION</Text>
                      <Text className="text-white text-sm">
                        {person.location.city}, {person.location.country}
                        {person.location.remote && ' • Remote'}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handleRequestPerson(person)}
                      disabled={isRequested}
                      className={cn(
                        'rounded-xl py-3 active:opacity-80',
                        isRequested ? 'bg-gray-500/20' : 'bg-emerald-500'
                      )}
                    >
                      <View className="flex-row items-center justify-center">
                        {isRequested ? (
                          <>
                            <Clock size={16} color="#94a3b8" />
                            <Text className="text-gray-400 font-bold ml-1">Request Pending</Text>
                          </>
                        ) : (
                          <>
                            <UserPlus size={16} color="white" />
                            <Text className="text-white font-bold ml-1">Request to Hire</Text>
                          </>
                        )}
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={() => router.push('/(tabs)/community')}
              className="bg-blue-500/20 border border-blue-500/30 rounded-xl py-4 mt-4 active:opacity-70"
            >
              <View className="flex-row items-center justify-center">
                <UserPlus size={18} color="#60a5fa" />
                <Text className="text-blue-300 font-bold ml-2">Browse More in Marketplace</Text>
                <ChevronRight size={18} color="#60a5fa" className="ml-1" />
              </View>
            </Pressable>
          </View>
        )}

        {/* Squads Tab - Team Organization (Hidden from Apprentices) */}
        {selectedTab === 'squads' && !isApprentice && (
          <View>
            <Pressable
              onPress={() => setShowCreateSquad(true)}
              className="bg-emerald-500 rounded-xl py-3 mb-4 active:opacity-80"
            >
              <View className="flex-row items-center justify-center">
                <Plus size={18} color="white" />
                <Text className="text-white font-bold ml-2">Create Squad</Text>
              </View>
            </Pressable>

            {squads.length === 0 ? (
              <View className="bg-white/5 rounded-2xl p-8 items-center">
                <Users size={48} color="rgba(255,255,255,0.2)" />
                <Text className="text-white/40 text-center mt-4">
                  No squads yet. Create your first squad to organize your team!
                </Text>
              </View>
            ) : (
              squads.map((squad) => {
                const leader = members.find(m => m.id === squad.leaderMemberId);
                const squadMembers = squad.apprenticeMemberIds
                  .map(id => members.find(m => m.id === id))
                  .filter((m): m is OrganizationMember => m !== undefined);

                return (
                  <View key={squad.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-white text-xl font-black mb-1">{squad.name}</Text>
                        <View className="flex-row items-center gap-2">
                          <View className="bg-violet-500/20 px-2 py-1 rounded">
                            <Text className="text-violet-300 text-xs font-bold">{squad.function}</Text>
                          </View>
                          <Text className="text-white/60 text-xs">
                            {squadMembers.length} members
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => deleteSquad(squad.id)}
                        className="bg-red-500/20 p-2 rounded-lg active:opacity-70"
                      >
                        <Trash2 size={16} color="#f87171" />
                      </Pressable>
                    </View>

                    {leader && (
                      <View className="bg-white/5 rounded-xl p-3 mb-2">
                        <Text className="text-white/60 text-xs font-bold mb-1">LEADER</Text>
                        <Text className="text-white font-bold">{leader.name}</Text>
                      </View>
                    )}

                    {squadMembers.length > 0 && (
                      <View className="bg-white/5 rounded-xl p-3 mb-3">
                        <Text className="text-white/60 text-xs font-bold mb-2">MEMBERS</Text>
                        {squadMembers.map((member) => (
                          <View key={member.id} className="flex-row items-center justify-between mb-1">
                            <Text className="text-white text-sm">• {member.name}</Text>
                            <Pressable
                              onPress={() => removeApprentice(squad.id, member.id)}
                              className="bg-red-500/20 px-2 py-1 rounded active:opacity-70"
                            >
                              <Text className="text-red-400 text-xs font-bold">Remove</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}

                    <Pressable
                      onPress={() => setShowAddMemberToSquad(squad.id)}
                      className="bg-blue-500/20 border border-blue-500/30 rounded-xl py-2 active:opacity-70"
                    >
                      <View className="flex-row items-center justify-center">
                        <Plus size={14} color="#60a5fa" />
                        <Text className="text-blue-300 font-bold text-sm ml-1">Add Member</Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View className="h-32" />
      </ScrollView>

      {/* Create Squad Modal */}
      <CreateSquadModal
        visible={showCreateSquad}
        members={members}
        onClose={() => setShowCreateSquad(false)}
        onCreate={createSquad}
      />

      {/* Add Member to Squad Modal */}
      {showAddMemberToSquad && (
        <AddMemberToSquadModal
          visible={!!showAddMemberToSquad}
          squadId={showAddMemberToSquad}
          members={apprentices}
          squads={squads}
          onClose={() => setShowAddMemberToSquad(null)}
          onAdd={assignApprentice}
        />
      )}

      {/* Person Detail Modal */}
      {selectedPerson && (
        <PersonDetailModal
          person={selectedPerson}
          loadout={personLoadouts.find(l => l.memberId === selectedPerson.id)}
          squads={squads}
          aiAgents={aiAgents}
          onClose={() => setSelectedPerson(null)}
          onAddAI={addAITool}
          onRemoveAI={removeAITool}
          onRemovePerson={handleRemovePerson}
          onAssignToSquad={assignApprentice}
          onUpdateMember={updateMember}
        />
      )}
    </SafeAreaView>
  );
}

// Create Squad Modal Component - Enhanced (BCG/McKinsey Org Design)
function CreateSquadModal({
  visible,
  members,
  onClose,
  onCreate,
}: {
  visible: boolean;
  members: OrganizationMember[];
  onClose: () => void;
  onCreate: (payload: any) => Promise<any>;
}) {
  const [name, setName] = useState('');
  const [selectedFunction, setSelectedFunction] = useState('Engineering');
  const [selectedLeader, setSelectedLeader] = useState('');
  // Enhanced fields (BCG/McKinsey org design)
  const [purpose, setPurpose] = useState('');
  const [linkedOKR, setLinkedOKR] = useState('');
  const [successMetrics, setSuccessMetrics] = useState<string[]>([]);
  const [targetCapacity, setTargetCapacity] = useState('3');

  const execs = members.filter(m => m.role === 'FractionalExec' && m.status === 'active');

  // Mock OKRs for linking
  const availableOKRs = [
    'Achieve Product-Market Fit',
    'Scale Revenue to £1M ARR',
    'Launch MVP by Q2',
    'Reduce Customer Churn to <5%',
    'Build World-Class Engineering Team',
  ];

  // Suggested success metrics based on function
  const suggestedMetrics: Record<string, string[]> = {
    Engineering: ['Sprint velocity', 'Code quality score', 'Bug resolution time', 'Feature delivery rate'],
    Sales: ['Pipeline generated', 'Conversion rate', 'Average deal size', 'Time to close'],
    Marketing: ['MQL generation', 'CAC reduction', 'Brand awareness', 'Content engagement'],
    Finance: ['Forecast accuracy', 'Days to close', 'Audit readiness', 'Cost savings identified'],
    Ops: ['Process efficiency', 'SLA compliance', 'Customer satisfaction', 'Incident response time'],
  };

  const handleCreate = async () => {
    if (!name.trim() || !selectedLeader) return;

    await onCreate({
      workspaceId: 'workspace-demo-company',
      name: name.trim(),
      function: selectedFunction,
      leaderMemberId: selectedLeader,
      apprenticeMemberIds: [],
      // Enhanced data
      purpose: purpose.trim(),
      linkedOKR,
      successMetrics,
      targetCapacity: parseInt(targetCapacity) || 3,
    });

    // Reset form
    setName('');
    setSelectedFunction('Engineering');
    setSelectedLeader('');
    setPurpose('');
    setLinkedOKR('');
    setSuccessMetrics([]);
    setTargetCapacity('3');
    onClose();
  };

  const toggleMetric = (metric: string) => {
    setSuccessMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black/50 dark:bg-black/90 justify-end">
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[95%]">
          <View className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex-row items-center justify-between">
            <View>
              <Text className="text-gray-900 dark:text-white text-xl font-black">Create Squad</Text>
              <Text className="text-gray-500 dark:text-white/50 text-xs mt-1">Define purpose, ownership & success criteria</Text>
            </View>
            <Pressable onPress={onClose} className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 active:opacity-70">
              <X size={24} className="text-gray-700 dark:text-white" />
            </Pressable>
          </View>

          <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
            {/* Squad Name */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white font-bold mb-2">Squad Name <Text className="text-red-400 dark:text-red-400">*</Text></Text>
              <TextInput
                className="bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                placeholder="Engineering Team Alpha"
                placeholderTextColor="rgba(156,163,175,0.6)"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Purpose/Charter (BCG best practice) */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Target size={16} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white font-bold ml-2">Squad Purpose</Text>
              </View>
              <TextInput
                className="bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl px-4 py-3 text-gray-900 dark:text-white min-h-[80px]"
                placeholder="What is this squad responsible for? What outcomes will they drive?"
                placeholderTextColor="rgba(156,163,175,0.6)"
                value={purpose}
                onChangeText={setPurpose}
                multiline
                textAlignVertical="top"
              />
              <Text className="text-gray-500 dark:text-white/40 text-xs mt-1">A clear purpose increases squad effectiveness by 40% (BCG research)</Text>
            </View>

            {/* OKR Alignment */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <ChevronRight size={16} color="#10b981" />
                <Text className="text-gray-900 dark:text-white font-bold ml-2">Link to OKR</Text>
              </View>
              <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-2">
                <Text className="text-emerald-700 dark:text-emerald-300 text-xs">Squads linked to OKRs are 2.3x more likely to hit targets</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                <View className="flex-row gap-2">
                  {availableOKRs.map((okr) => (
                    <Pressable
                      key={okr}
                      onPress={() => setLinkedOKR(linkedOKR === okr ? '' : okr)}
                      className={cn(
                        'px-3 py-2 rounded-xl border',
                        linkedOKR === okr ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-200 dark:bg-white/5 border-gray-300 dark:border-white/20'
                      )}
                    >
                      <Text className={cn('text-sm', linkedOKR === okr ? 'text-white font-bold' : 'text-gray-500 dark:text-white/60')} numberOfLines={1}>
                        {okr}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Function */}
            <View className="mb-4">
              <Text className="text-gray-900 dark:text-white font-bold mb-2">Function <Text className="text-red-400">*</Text></Text>
              <View className="flex-row flex-wrap gap-2">
                {['Engineering', 'Sales', 'Marketing', 'Finance', 'Ops'].map((func) => (
                  <Pressable
                    key={func}
                    onPress={() => {
                      setSelectedFunction(func);
                      setSuccessMetrics([]); // Reset metrics when function changes
                    }}
                    className={cn(
                      'px-4 py-2 rounded-xl border',
                      selectedFunction === func ? 'bg-violet-500 border-violet-500' : 'bg-gray-200 dark:bg-white/5 border-gray-300 dark:border-white/20'
                    )}
                  >
                    <Text className={cn('font-bold', selectedFunction === func ? 'text-white' : 'text-gray-600 dark:text-white/60')}>
                      {func}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Success Metrics (McKinsey OKR methodology) */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <BarChart3 size={16} color="#f59e0b" />
                <Text className="text-gray-900 dark:text-white font-bold ml-2">Success Metrics</Text>
              </View>
              <Text className="text-gray-500 dark:text-white/50 text-xs mb-2">Select 2-4 metrics to track squad performance</Text>
              <View className="flex-row flex-wrap gap-2">
                {suggestedMetrics[selectedFunction]?.map((metric) => (
                  <Pressable
                    key={metric}
                    onPress={() => toggleMetric(metric)}
                    className={cn(
                      'px-3 py-2 rounded-xl border',
                      successMetrics.includes(metric) ? 'bg-amber-500 border-amber-500' : 'bg-gray-200 dark:bg-white/5 border-gray-300 dark:border-white/20'
                    )}
                  >
                    <Text className={cn('text-sm', successMetrics.includes(metric) ? 'text-white font-bold' : 'text-gray-600 dark:text-white/60')}>
                      {metric}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {successMetrics.length > 0 && (
                <Text className="text-amber-600 dark:text-amber-400 text-xs mt-2">{successMetrics.length} metric{successMetrics.length > 1 ? 's' : ''} selected</Text>
              )}
            </View>

            {/* Target Capacity */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Users size={16} color="#3b82f6" />
                <Text className="text-gray-900 dark:text-white font-bold ml-2">Target Team Size</Text>
              </View>
              <View className="flex-row gap-2">
                {['2', '3', '4', '5', '6+'].map((size) => (
                  <Pressable
                    key={size}
                    onPress={() => setTargetCapacity(size.replace('+', ''))}
                    className={cn(
                      'flex-1 py-3 rounded-xl border items-center',
                      targetCapacity === size.replace('+', '') ? 'bg-blue-500 border-blue-500' : 'bg-gray-200 dark:bg-white/5 border-gray-300 dark:border-white/20'
                    )}
                  >
                    <Text className={cn('font-bold', targetCapacity === size.replace('+', '') ? 'text-white' : 'text-gray-600 dark:text-white/60')}>
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-gray-500 dark:text-white/40 text-xs mt-1">Optimal squad size is 3-5 members (Amazon two-pizza rule)</Text>
            </View>

            {/* Select Leader */}
            <View className="mb-6">
              <Text className="text-gray-900 dark:text-white font-bold mb-2">Select Leader (Executive) <Text className="text-red-400">*</Text></Text>
              {execs.length === 0 ? (
                <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <Text className="text-red-600 dark:text-red-300 text-sm">No executives available. Add executives to your team first.</Text>
                </View>
              ) : (
                execs.map((exec) => (
                  <Pressable
                    key={exec.id}
                    onPress={() => setSelectedLeader(exec.id)}
                    className={cn(
                      'border rounded-xl p-4 mb-2',
                      selectedLeader === exec.id ? 'border-violet-500 bg-violet-500/10' : 'bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/10'
                    )}
                  >
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-gray-900 dark:text-white font-bold">{exec.name}</Text>
                        <Text className="text-gray-600 dark:text-white/60 text-sm">{exec.function}</Text>
                      </View>
                      {selectedLeader === exec.id && (
                        <View className="bg-violet-500 px-2 py-1 rounded-lg">
                          <Text className="text-white text-xs font-bold">Selected</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))
              )}
            </View>

            {/* Summary Card */}
            {name.trim() && selectedLeader && (
              <View className="bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl p-4 mb-4">
                <Text className="text-gray-900 dark:text-white font-bold mb-2">Squad Summary</Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-600 dark:text-white/60 text-sm">Name:</Text>
                  <Text className="text-gray-900 dark:text-white font-medium text-sm">{name}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-600 dark:text-white/60 text-sm">Function:</Text>
                  <Text className="text-gray-900 dark:text-white font-medium text-sm">{selectedFunction}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-600 dark:text-white/60 text-sm">OKR Linked:</Text>
                  <Text className="text-gray-900 dark:text-white font-medium text-sm" numberOfLines={1}>{linkedOKR || 'None'}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-600 dark:text-white/60 text-sm">Success Metrics:</Text>
                  <Text className="text-gray-900 dark:text-white font-medium text-sm">{successMetrics.length} defined</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600 dark:text-white/60 text-sm">Target Size:</Text>
                  <Text className="text-gray-900 dark:text-white font-medium text-sm">{targetCapacity} members</Text>
                </View>
              </View>
            )}

            {/* Create Button */}
            <Pressable
              onPress={handleCreate}
              disabled={!name.trim() || !selectedLeader}
              className={cn(
                'rounded-2xl py-4 items-center',
                name.trim() && selectedLeader ? 'bg-violet-500' : 'bg-gray-200 dark:bg-white/10'
              )}
            >
              <Text className={cn('font-black', name.trim() && selectedLeader ? 'text-white' : 'text-gray-400 dark:text-white/40')}>
                Create Squad
              </Text>
            </Pressable>

            <View className="h-40" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Add Member to Squad Modal Component
function AddMemberToSquadModal({
  visible,
  squadId,
  members,
  squads,
  onClose,
  onAdd,
}: {
  visible: boolean;
  squadId: string;
  members: OrganizationMember[];
  squads: any[];
  onClose: () => void;
  onAdd: (squadId: string, memberId: string) => Promise<void>;
}) {
  const squad = squads.find(s => s.id === squadId);
  if (!squad) return null;

  const availableMembers = members.filter(
    m => !squad.apprenticeMemberIds.includes(m.id) && m.status === 'active'
  );

  const handleAdd = async (memberId: string) => {
    await onAdd(squadId, memberId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black/50 dark:bg-black/90 justify-end">
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[70%]">
          <View className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex-row items-center justify-between">
            <Text className="text-gray-900 dark:text-white text-xl font-black">Add to {squad.name}</Text>
            <Pressable onPress={onClose} className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 active:opacity-70">
              <X size={24} className="text-gray-700 dark:text-white" />
            </Pressable>
          </View>

          <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
            {availableMembers.length === 0 ? (
              <View className="py-12 items-center">
                <Users size={48} color="rgba(156,163,175,0.4)" />
                <Text className="text-gray-500 dark:text-white/40 text-center mt-4">
                  No available apprentices to add
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-gray-600 dark:text-white/60 text-sm mb-4">
                  Select an apprentice to add to the squad:
                </Text>
                {availableMembers.map((member) => (
                  <Pressable
                    key={member.id}
                    onPress={() => handleAdd(member.id)}
                    className="bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl p-4 mb-3 active:opacity-70"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-bold text-base">{member.name}</Text>
                        <Text className="text-gray-600 dark:text-white/60 text-sm mt-1">{member.function}</Text>
                      </View>
                      <View className="bg-emerald-500/20 px-3 py-1 rounded-lg">
                        <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-bold">{member.role}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </>
            )}

            <View className="h-20" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Person Detail Modal Component
function PersonDetailModal({
  person,
  loadout,
  squads,
  aiAgents,
  onClose,
  onAddAI,
  onRemoveAI,
  onRemovePerson,
  onAssignToSquad,
  onUpdateMember,
}: {
  person: OrganizationMember;
  loadout: any;
  squads: any[];
  aiAgents: AIAgent[] | null;
  onClose: () => void;
  onAddAI: (memberId: string, toolId: string) => Promise<void>;
  onRemoveAI: (memberId: string, toolId: string) => Promise<void>;
  onRemovePerson: (memberId: string) => void;
  onAssignToSquad: (squadId: string, memberId: string) => Promise<void>;
  onUpdateMember: (memberId: string, updates: Partial<OrganizationMember>) => void;
}) {
  const [selectedTab, setSelectedTab] = useState<'info' | 'ai' | 'squads'>('info');
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const monthlyCost = person.costPerDay && person.daysPerWeek
    ? Math.round(person.costPerDay * person.daysPerWeek * 4.33)
    : person.costPerDay
    ? Math.round(person.costPerDay * 5 * 4.33)
    : 0;

  const equippedAITools = loadout?.aiToolIds || [];
  const availableAITools = THIRD_PARTY_AI_TOOLS.filter(
    tool => !equippedAITools.includes(tool.id) && tool.functions.includes(person.function as any)
  );

  const memberSquads = squads.filter(s =>
    s.leaderMemberId === person.id || s.apprenticeMemberIds?.includes(person.id)
  );

  const availableSquads = person.role === 'Apprentice'
    ? squads.filter(s => !s.apprenticeMemberIds?.includes(person.id))
    : [];

  const handleToggleAI = async (toolId: string) => {
    if (equippedAITools.includes(toolId)) {
      await onRemoveAI(person.id, toolId);
    } else {
      await onAddAI(person.id, toolId);
    }
  };

  const handleRemove = () => {
    onRemovePerson(person.id);
    onClose();
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={person.role === 'FractionalExec' ? ['#7c3aed', '#a855f7'] : ['#10b981', '#14b8a6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 24, paddingVertical: 20 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={onClose}
              className="w-10 h-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color="white" />
            </Pressable>
            <Pressable
              onPress={() => setShowConfirmRemove(true)}
              className="bg-red-500/30 px-4 py-2 rounded-xl active:opacity-70"
            >
              <View className="flex-row items-center">
                <Trash2 size={16} color="white" />
                <Text className="text-white font-bold ml-2 text-sm">Remove</Text>
              </View>
            </Pressable>
          </View>

          <View className="items-center">
            <View className={cn(
              'w-20 h-20 rounded-full items-center justify-center mb-3',
              person.role === 'FractionalExec' ? 'bg-purple-500/30' : 'bg-emerald-500/30'
            )}>
              <Text className="text-4xl">
                {person.role === 'FractionalExec' ? '👔' : '🎓'}
              </Text>
            </View>
            <Text className="text-white text-2xl font-black">{person.name}</Text>
            <Text className="text-white/80 text-base mt-1">{person.function}</Text>
            <View className="flex-row items-center gap-2 mt-2">
              <View className={cn(
                'px-3 py-1 rounded-lg',
                person.role === 'FractionalExec' ? 'bg-purple-500/20' : 'bg-emerald-500/20'
              )}>
                <Text className={cn(
                  'text-xs font-bold',
                  person.role === 'FractionalExec' ? 'text-purple-200' : 'text-emerald-200'
                )}>
                  {person.role === 'FractionalExec' ? 'Executive' : 'Apprentice'}
                </Text>
              </View>
              {person.daysPerWeek && (
                <View className="bg-white/20 px-3 py-1 rounded-lg">
                  <Text className="text-white text-xs font-bold">
                    {person.daysPerWeek} days/week
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-white text-xl font-black mt-3">
              £{monthlyCost.toLocaleString()}/month
            </Text>
          </View>
        </LinearGradient>

        {/* Tab Selector */}
        <View className="flex-row px-6 py-4 gap-2 border-b border-white/10">
          <Pressable
            onPress={() => setSelectedTab('info')}
            className={cn(
              'flex-1 rounded-xl py-2.5 border',
              selectedTab === 'info' ? 'bg-blue-500 border-blue-500' : 'bg-white/5 border-white/20'
            )}
          >
            <Text className={cn(
              'text-center font-bold text-sm',
              selectedTab === 'info' ? 'text-white' : 'text-white/60'
            )}>
              Info
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedTab('ai')}
            className={cn(
              'flex-1 rounded-xl py-2.5 border',
              selectedTab === 'ai' ? 'bg-blue-500 border-blue-500' : 'bg-white/5 border-white/20'
            )}
          >
            <Text className={cn(
              'text-center font-bold text-sm',
              selectedTab === 'ai' ? 'text-white' : 'text-white/60'
            )}>
              AI Tools ({equippedAITools.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedTab('squads')}
            className={cn(
              'flex-1 rounded-xl py-2.5 border',
              selectedTab === 'squads' ? 'bg-blue-500 border-blue-500' : 'bg-white/5 border-white/20'
            )}
          >
            <Text className={cn(
              'text-center font-bold text-sm',
              selectedTab === 'squads' ? 'text-white' : 'text-white/60'
            )}>
              Squads ({memberSquads.length})
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Info Tab */}
          {selectedTab === 'info' && (
            <View>
              {person.email && (
                <View className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                  <View className="flex-row items-center">
                    <Mail size={20} color="#8b5cf6" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white/60 text-xs mb-1">Email</Text>
                      <Text className="text-white font-semibold">{person.email}</Text>
                    </View>
                  </View>
                </View>
              )}

              {person.phone && (
                <View className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                  <View className="flex-row items-center">
                    <Phone size={20} color="#10b981" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white/60 text-xs mb-1">Phone</Text>
                      <Text className="text-white font-semibold">{person.phone}</Text>
                    </View>
                  </View>
                </View>
              )}

              {person.startDate && (
                <View className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                  <View className="flex-row items-center">
                    <Calendar size={20} color="#3b82f6" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white/60 text-xs mb-1">Start Date</Text>
                      <Text className="text-white font-semibold">
                        {new Date(person.startDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {person.costPerDay && (
                <View className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                  <View className="flex-row items-center">
                    <Briefcase size={20} color="#f59e0b" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white/60 text-xs mb-1">Cost per □</Text>
                      <Text className="text-emerald-400 font-bold text-lg">£{Math.round(person.costPerDay / 2)}</Text>
                      <Text className="text-white/40 text-xs">£{person.costPerDay}/day (2□)</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Days Per Week Editor */}
              <View className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                <View className="flex-row items-center mb-3">
                  <Clock size={20} color="#8b5cf6" />
                  <View className="ml-3 flex-1">
                    <Text className="text-white/60 text-xs mb-1">Days Per Week</Text>
                    <Text className="text-white font-semibold">{person.daysPerWeek || 5} days/week</Text>
                  </View>
                </View>

                {/* Days/Week Adjuster */}
                <View className="flex-row items-center justify-between bg-white/10 rounded-lg p-2">
                  <Pressable
                    onPress={() => {
                      const currentDays = person.daysPerWeek || 5;
                      if (currentDays > 1) {
                        onUpdateMember(person.id, { daysPerWeek: currentDays - 1 });
                      }
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="bg-white/10 rounded-lg px-4 py-2 active:opacity-60"
                  >
                    <Minus size={20} color="#fff" />
                  </Pressable>

                  <View className="flex-1 items-center">
                    <Text className="text-white font-bold text-2xl">{person.daysPerWeek || 5}</Text>
                    <Text className="text-white/60 text-xs">days</Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      const currentDays = person.daysPerWeek || 5;
                      if (currentDays < 5) {
                        onUpdateMember(person.id, { daysPerWeek: currentDays + 1 });
                      }
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="bg-white/10 rounded-lg px-4 py-2 active:opacity-60"
                  >
                    <Plus size={20} color="#fff" />
                  </Pressable>
                </View>

                {/* Monthly Cost Estimate */}
                {person.costPerDay && (
                  <View className="mt-3 pt-3 border-t border-white/10">
                    <Text className="text-white/60 text-xs mb-1">Monthly Cost Estimate</Text>
                    <Text className="text-white font-bold text-lg">
                      £{((person.costPerDay * (person.daysPerWeek || 5) * 4.33).toFixed(0))}
                      <Text className="text-white/60 text-xs font-normal">/month</Text>
                    </Text>
                  </View>
                )}
              </View>

              {person.linkedIn && (
                <View className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                  <View className="flex-row items-center">
                    <Linkedin size={20} color="#0077b5" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white/60 text-xs mb-1">LinkedIn</Text>
                      <Text className="text-blue-400 font-semibold" numberOfLines={1}>
                        {person.linkedIn}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {person.bio && (
                <View className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                  <Text className="text-white font-bold mb-2">Bio</Text>
                  <Text className="text-white/80 text-sm leading-5">{person.bio}</Text>
                </View>
              )}
            </View>
          )}

          {/* AI Tools Tab */}
          {selectedTab === 'ai' && (
            <View>
              {equippedAITools.length > 0 && (
                <View className="mb-6">
                  <Text className="text-white font-black text-base mb-3">
                    Equipped AI Tools ({equippedAITools.length})
                  </Text>
                  {equippedAITools.map((toolId: string) => {
                    const tool = THIRD_PARTY_AI_TOOLS.find(t => t.id === toolId);
                    if (!tool) return null;
                    return (
                      <View
                        key={tool.id}
                        className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-3"
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1">
                            <Text className="text-white font-bold text-base">{tool.name}</Text>
                            <Text className="text-white/60 text-sm mt-1">{tool.purpose}</Text>
                          </View>
                          <Pressable
                            onPress={() => handleToggleAI(tool.id)}
                            className="bg-red-500/20 px-3 py-1.5 rounded-lg active:opacity-70"
                          >
                            <Text className="text-red-400 text-xs font-bold">Remove</Text>
                          </Pressable>
                        </View>
                        <Text className="text-purple-300 font-bold text-sm">
                          £{tool.costPerMonth}/month
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <View>
                <Text className="text-white font-black text-base mb-3">
                  Available AI Tools for {person.function} ({availableAITools.length})
                </Text>
                {availableAITools.length === 0 ? (
                  <View className="py-12 items-center">
                    <Bot size={48} color="rgba(255,255,255,0.2)" />
                    <Text className="text-white/40 text-center mt-4">
                      All compatible AI tools are equipped
                    </Text>
                  </View>
                ) : (
                  availableAITools.map((tool) => (
                    <View
                      key={tool.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3"
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-white font-bold text-base">{tool.name}</Text>
                          <Text className="text-white/60 text-sm mt-1">{tool.purpose}</Text>
                        </View>
                        <Pressable
                          onPress={() => handleToggleAI(tool.id)}
                          className="bg-blue-500 px-3 py-1.5 rounded-lg active:opacity-70"
                        >
                          <Text className="text-white text-xs font-bold">Add</Text>
                        </Pressable>
                      </View>
                      <Text className="text-blue-300 font-bold text-sm">
                        £{tool.costPerMonth}/month
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* Squads Tab */}
          {selectedTab === 'squads' && (
            <View>
              {memberSquads.length > 0 && (
                <View className="mb-6">
                  <Text className="text-white font-black text-base mb-3">
                    Current Squads ({memberSquads.length})
                  </Text>
                  {memberSquads.map((squad) => (
                    <View
                      key={squad.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3"
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="text-white font-bold text-base">{squad.name}</Text>
                          <Text className="text-white/60 text-sm mt-1">{squad.function}</Text>
                          <View className="bg-blue-500/20 px-2 py-0.5 rounded mt-2 self-start">
                            <Text className="text-blue-300 text-xs font-bold">
                              {squad.leaderMemberId === person.id ? 'Leader' : 'Member'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {person.role === 'Apprentice' && availableSquads.length > 0 && (
                <View>
                  <Text className="text-white font-black text-base mb-3">
                    Join Squad ({availableSquads.length} available)
                  </Text>
                  {availableSquads.map((squad) => (
                    <View
                      key={squad.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3"
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="text-white font-bold text-base">{squad.name}</Text>
                          <Text className="text-white/60 text-sm mt-1">{squad.function}</Text>
                        </View>
                        <Pressable
                          onPress={() => onAssignToSquad(squad.id, person.id)}
                          className="bg-emerald-500 px-3 py-1.5 rounded-lg active:opacity-70"
                        >
                          <Text className="text-white text-xs font-bold">Join</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {memberSquads.length === 0 && person.role === 'Apprentice' && availableSquads.length === 0 && (
                <View className="py-12 items-center">
                  <Users size={48} color="rgba(255,255,255,0.2)" />
                  <Text className="text-white/40 text-center mt-4">
                    No squads available. Create a squad first.
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="h-40" />
        </ScrollView>

        {/* Confirm Remove Modal */}
        <Modal visible={showConfirmRemove} transparent animationType="fade" onRequestClose={() => setShowConfirmRemove(false)}>
          <View className="flex-1 bg-black/50 dark:bg-black/80 justify-center items-center px-6">
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm">
              <Text className="text-gray-900 dark:text-white text-xl font-black mb-3">Remove {person.name}?</Text>
              <Text className="text-gray-600 dark:text-white/60 text-sm mb-6">
                This will mark them as inactive. They won't be deleted and can be reactivated later.
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowConfirmRemove(false)}
                  className="flex-1 bg-gray-200 dark:bg-white/10 rounded-xl py-3 items-center active:opacity-70"
                >
                  <Text className="text-gray-700 dark:text-white font-bold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleRemove}
                  className="flex-1 bg-red-500 rounded-xl py-3 items-center active:opacity-70"
                >
                  <Text className="text-white font-bold">Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
