import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Plus,
  Users,
  Bot,
  Check,
  Search,
  ChevronRight,
  Briefcase,
  UserPlus,
  Sparkles,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import type { OrganizationMember, AIAgent } from '@/lib/organization-seed';
import { cn } from '@/lib/cn';

// Mock marketplace data for recommended people
const RECOMMENDED_PEOPLE = [
  {
    id: 'rec-exec-1',
    name: 'Michael Chen',
    role: 'FractionalExec' as const,
    function: 'Engineering',
    specialty: 'Hardware & IoT',
    costPerDay: 950,
    daysPerWeek: 3,
    rating: 4.9,
    experience: '15 years',
    avatar: '👨‍💻',
    status: 'pending' as const,
  },
  {
    id: 'rec-app-1',
    name: 'Jessica Lee',
    role: 'Apprentice' as const,
    function: 'Marketing',
    specialty: 'Social Media',
    costPerDay: 150,
    daysPerWeek: 5,
    rating: 4.7,
    experience: '2 years',
    avatar: '👩',
    status: 'pending' as const,
  },
  {
    id: 'rec-app-2',
    name: 'Tom Wilson',
    role: 'Apprentice' as const,
    function: 'Engineering',
    specialty: 'CAD Design',
    costPerDay: 160,
    daysPerWeek: 5,
    rating: 4.8,
    experience: '3 years',
    avatar: '👨',
    status: 'pending' as const,
  },
];

export default function CreateTeamScreen() {
  const [selectedTab, setSelectedTab] = useState<'marketplace' | 'recommended' | 'myteam'>('recommended');
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [showEquipAI, setShowEquipAI] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const members = useOrganizationStore((s) => s.members);
  const aiAgents = useOrganizationStore((s) => s.aiAgents);
  const updateMember = useOrganizationStore((s) => s.updateMember);
  const personLoadouts = useArmoryStore((s) => s.personLoadouts);

  // Filter current team members
  const currentTeam = useMemo(() => {
    return members.filter(m => m.status === 'active');
  }, [members]);

  const handleApprovePerson = (personId: string) => {
    // In real app, this would add person to organization
    console.log('Approved person:', personId);
    // For now, just add to selected
    setSelectedPeople(prev => [...prev, personId]);
  };

  const handleRejectPerson = (personId: string) => {
    console.log('Rejected person:', personId);
  };

  const togglePersonSelection = (personId: string) => {
    setSelectedPeople(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <LinearGradient
        colors={['#1e40af', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 24, paddingVertical: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white text-2xl font-black">Build Your Team</Text>
            <Text className="text-white/80 text-sm mt-1">
              Select people, organize teams, and equip with AI
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
          >
            <X size={24} color="white" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View className="flex-row px-6 py-4 gap-2">
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
          onPress={() => setSelectedTab('marketplace')}
          className={cn(
            'flex-1 rounded-xl py-3 border',
            selectedTab === 'marketplace'
              ? 'bg-blue-500 border-blue-500'
              : 'bg-white/5 border-white/20'
          )}
        >
          <View className="flex-row items-center justify-center">
            <UserPlus size={16} color={selectedTab === 'marketplace' ? '#fff' : '#94a3b8'} />
            <Text
              className={cn(
                'ml-2 font-bold text-sm',
                selectedTab === 'marketplace' ? 'text-white' : 'text-white/60'
              )}
            >
              Marketplace
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setSelectedTab('myteam')}
          className={cn(
            'flex-1 rounded-xl py-3 border',
            selectedTab === 'myteam'
              ? 'bg-blue-500 border-blue-500'
              : 'bg-white/5 border-white/20'
          )}
        >
          <View className="flex-row items-center justify-center">
            <Users size={16} color={selectedTab === 'myteam' ? '#fff' : '#94a3b8'} />
            <Text
              className={cn(
                'ml-2 font-bold text-sm',
                selectedTab === 'myteam' ? 'text-white' : 'text-white/60'
              )}
            >
              My Team
            </Text>
          </View>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Recommended Tab */}
        {selectedTab === 'recommended' && (
          <View>
            <View className="mb-4">
              <Text className="text-white/60 text-sm mb-3">
                These people match your needs and are waiting for approval
              </Text>
            </View>

            {RECOMMENDED_PEOPLE.map((person) => (
              <View
                key={person.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-start flex-1">
                    <View className="bg-blue-500/20 rounded-full w-12 h-12 items-center justify-center mr-3">
                      <Text className="text-2xl">{person.avatar}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-black text-base">{person.name}</Text>
                      <Text className="text-white/60 text-sm">{person.function}</Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <View className="bg-amber-500/20 px-2 py-0.5 rounded">
                          <Text className="text-amber-300 text-xs font-bold">⭐ {person.rating}</Text>
                        </View>
                        <View className="bg-blue-500/20 px-2 py-0.5 rounded">
                          <Text className="text-blue-300 text-xs font-bold">{person.specialty}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-blue-300 font-black text-lg">
                      £{person.costPerDay}
                    </Text>
                    <Text className="text-white/40 text-xs">/day</Text>
                    <Text className="text-white/40 text-xs">{person.daysPerWeek} days/wk</Text>
                  </View>
                </View>

                <View className="bg-white/5 rounded-xl p-3 mb-3">
                  <Text className="text-white/60 text-xs font-bold mb-1">EXPERIENCE</Text>
                  <Text className="text-white text-sm">{person.experience}</Text>
                </View>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleRejectPerson(person.id)}
                    className="flex-1 bg-red-500/20 border border-red-500/30 rounded-xl py-3 active:opacity-70"
                  >
                    <Text className="text-red-400 font-bold text-center">Reject</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleApprovePerson(person.id)}
                    className="flex-1 bg-emerald-500 rounded-xl py-3 active:opacity-80"
                  >
                    <View className="flex-row items-center justify-center">
                      <Check size={16} color="white" />
                      <Text className="text-white font-bold ml-1">Approve</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Marketplace Tab */}
        {selectedTab === 'marketplace' && (
          <View>
            <View className="mb-4">
              <Text className="text-white/60 text-sm mb-3">
                Browse and select people from the marketplace
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/community')}
                className="bg-blue-500 rounded-xl py-3 active:opacity-80"
              >
                <View className="flex-row items-center justify-center">
                  <UserPlus size={18} color="white" />
                  <Text className="text-white font-bold ml-2">Browse Marketplace</Text>
                  <ChevronRight size={18} color="white" className="ml-1" />
                </View>
              </Pressable>
            </View>

            <View className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
              <Text className="text-blue-300 font-bold mb-2">How it works:</Text>
              <Text className="text-white/60 text-sm mb-2">
                1. Browse executives and apprentices in the Community tab
              </Text>
              <Text className="text-white/60 text-sm mb-2">
                2. Request to hire them (they'll appear in Recommended)
              </Text>
              <Text className="text-white/60 text-sm">
                3. Approve and equip them with AI tools
              </Text>
            </View>
          </View>
        )}

        {/* My Team Tab */}
        {selectedTab === 'myteam' && (
          <View>
            <View className="mb-4">
              <Text className="text-white/60 text-sm mb-3">
                Your current team • {currentTeam.length} members
              </Text>
            </View>

            {/* Executives */}
            <View className="mb-6">
              <Text className="text-white font-black text-lg mb-3">
                Executives ({currentTeam.filter(m => m.role === 'FractionalExec').length})
              </Text>
              {currentTeam
                .filter(m => m.role === 'FractionalExec')
                .map((member) => {
                  const loadout = personLoadouts.find(l => l.memberId === member.id);
                  const aiToolCount = loadout?.aiToolIds?.length || 0;

                  return (
                    <View
                      key={member.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-white font-black text-base">{member.name}</Text>
                          <Text className="text-white/60 text-sm">{member.function}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-purple-300 font-bold">
                            £{member.costPerDay && member.daysPerWeek
                              ? Math.round(member.costPerDay * member.daysPerWeek * 4.33)
                              : 0}
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
                        <Pressable
                          onPress={() => router.push('/armory')}
                          className="bg-blue-500/20 px-3 py-1.5 rounded-lg active:opacity-70"
                        >
                          <Text className="text-blue-300 text-xs font-bold">Equip AI</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
            </View>

            {/* Apprentices */}
            <View className="mb-6">
              <Text className="text-white font-black text-lg mb-3">
                Apprentices ({currentTeam.filter(m => m.role === 'Apprentice').length})
              </Text>
              {currentTeam
                .filter(m => m.role === 'Apprentice')
                .map((member) => {
                  const loadout = personLoadouts.find(l => l.memberId === member.id);
                  const aiToolCount = loadout?.aiToolIds?.length || 0;

                  return (
                    <View
                      key={member.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-white font-black text-base">{member.name}</Text>
                          <Text className="text-white/60 text-sm">{member.function}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-emerald-300 font-bold">
                            £{member.costPerDay && member.daysPerWeek
                              ? Math.round(member.costPerDay * (member.daysPerWeek || 5) * 4.33)
                              : 0}
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
                        <Pressable
                          onPress={() => router.push('/armory')}
                          className="bg-blue-500/20 px-3 py-1.5 rounded-lg active:opacity-70"
                        >
                          <Text className="text-blue-300 text-xs font-bold">Equip AI</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
