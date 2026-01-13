import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Users, BookOpen, MessageSquare, Award, Search, Plus, X, ExternalLink } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Function as BusinessFunction } from '@/types';

interface Guild {
  id: string;
  name: string;
  description: string;
  function?: BusinessFunction;
  isPublic: boolean;
  memberCount: number;
  resourceCount: number;
  postCount: number;
  coverColor: string;
  isMember: boolean;
}

// Demo guilds
const DEMO_GUILDS: Guild[] = [
  {
    id: 'guild-1',
    name: 'Hardware Design Guild',
    description: 'Share best practices for hardware product design, CAD workflows, and manufacturing considerations.',
    function: 'Engineering',
    isPublic: true,
    memberCount: 127,
    resourceCount: 45,
    postCount: 89,
    coverColor: '#3b82f6',
    isMember: true,
  },
  {
    id: 'guild-2',
    name: 'Fundraising Guild',
    description: 'Connect with founders and fractional CFOs to share pitch decks, term sheets, and fundraising strategies.',
    function: 'Finance',
    isPublic: true,
    memberCount: 203,
    resourceCount: 78,
    postCount: 156,
    coverColor: '#10b981',
    isMember: true,
  },
  {
    id: 'guild-3',
    name: 'Go-to-Market Guild',
    description: 'Strategies for launching hardware products, from pre-orders to retail partnerships.',
    function: 'Marketing',
    isPublic: true,
    memberCount: 184,
    resourceCount: 92,
    postCount: 234,
    coverColor: '#f59e0b',
    isMember: false,
  },
  {
    id: 'guild-4',
    name: 'Supply Chain Guild',
    description: 'Navigate UK and international suppliers, logistics, and inventory management.',
    function: 'Ops',
    isPublic: true,
    memberCount: 95,
    resourceCount: 67,
    postCount: 112,
    coverColor: '#8b5cf6',
    isMember: false,
  },
  {
    id: 'guild-5',
    name: 'Sales Strategy Guild',
    description: 'B2B and B2C sales tactics for hardware products, from enterprise deals to e-commerce.',
    function: 'Sales',
    isPublic: true,
    memberCount: 156,
    resourceCount: 54,
    postCount: 178,
    coverColor: '#ec4899',
    isMember: false,
  },
  {
    id: 'guild-6',
    name: 'Lean Manufacturing Guild',
    description: 'Learn lean principles, waste reduction, and operational efficiency for hardware startups.',
    function: 'Ops',
    isPublic: true,
    memberCount: 89,
    resourceCount: 41,
    postCount: 67,
    coverColor: '#06b6d4',
    isMember: false,
  },
  {
    id: 'guild-7',
    name: 'Startup Finance Guild',
    description: 'Financial modeling, burn rate management, and unit economics for early-stage companies.',
    function: 'Finance',
    isPublic: true,
    memberCount: 167,
    resourceCount: 83,
    postCount: 145,
    coverColor: '#14b8a6',
    isMember: false,
  },
  {
    id: 'guild-8',
    name: 'Product-Led Growth Guild',
    description: 'Growth hacking, PLG strategies, and customer acquisition for hardware-software hybrid products.',
    function: 'Marketing',
    isPublic: true,
    memberCount: 142,
    resourceCount: 58,
    postCount: 201,
    coverColor: '#f97316',
    isMember: false,
  },
];

export default function GuildsScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);

  const filteredGuilds = DEMO_GUILDS.filter((guild) => {
    const matchesSearch = searchQuery === '' ||
      guild.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guild.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFunction = selectedFunction === 'all' || guild.function === selectedFunction;

    return matchesSearch && matchesFunction;
  });

  const myGuilds = filteredGuilds.filter(g => g.isMember);
  const availableGuilds = filteredGuilds.filter(g => !g.isMember);

  const handleJoinGuild = (guild: Guild) => {
    setSelectedGuild(null);
    // In real app, this would send request to backend
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center mb-3">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 active:opacity-70"
          >
            <ArrowLeft size={24} color="#3b82f6" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-xl font-bold">
              Guilds
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              Cross-company communities of practice
            </Text>
          </View>
          <Pressable
            onPress={() => Alert.alert('Coming Soon', 'Guild creation will be available in a future update.')}
            className="bg-blue-500 p-2 rounded-lg active:opacity-70"
          >
            <Plus size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="mb-3">
          <View className="flex-row items-center bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3">
            <Search size={18} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search guilds..."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 text-gray-900 dark:text-white"
            />
          </View>
        </View>

        {/* Filters */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            className={`flex-row items-center px-3 py-2 rounded-lg border ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-gray-100 dark:bg-slate-900 border-gray-300 dark:border-slate-800'}`}
          >
            <Text className={`text-sm font-medium ${showFilters ? 'text-blue-500' : 'text-gray-600 dark:text-slate-400'}`}>
              Function
            </Text>
          </Pressable>

          {selectedFunction !== 'all' && (
            <Pressable
              onPress={() => setSelectedFunction('all')}
              className="px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30"
            >
              <Text className="text-purple-500 text-sm font-medium">Clear</Text>
            </Pressable>
          )}
        </View>

        {/* Filter Options */}
        {showFilters && (
          <View className="mt-3 bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl p-3">
            <View className="flex-row flex-wrap gap-2">
              {['all', 'Sales', 'Marketing', 'Finance', 'Engineering', 'Ops'].map((func) => (
                <Pressable
                  key={func}
                  onPress={() => setSelectedFunction(func)}
                  className={`px-3 py-1.5 rounded-lg ${selectedFunction === func ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-800'}`}
                >
                  <Text className={`text-sm font-medium ${selectedFunction === func ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                    {func === 'all' ? 'All' : func}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* My Guilds */}
        {myGuilds.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 dark:text-white text-base font-semibold">
                My Guilds ({myGuilds.length})
              </Text>
            </View>

            {myGuilds.map((guild) => (
              <Pressable
                key={guild.id}
                onPress={() => setSelectedGuild(guild)}
                className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-2xl p-4 mb-3 active:opacity-70"
              >
                <View className="flex-row items-start mb-3">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: guild.coverColor + '20' }}
                  >
                    <Award size={24} color={guild.coverColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                      {guild.name}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm" numberOfLines={2}>
                      {guild.description}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-gray-300 dark:border-slate-700">
                  <View className="flex-row items-center">
                    <Users size={14} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                      {guild.memberCount} members
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <BookOpen size={14} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                      {guild.resourceCount} resources
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <MessageSquare size={14} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                      {guild.postCount} posts
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {/* Discover Guilds */}
        {availableGuilds.length > 0 && (
          <>
            <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3 mt-4">
              Discover Guilds ({availableGuilds.length})
            </Text>

            {availableGuilds.map((guild) => (
              <Pressable
                key={guild.id}
                onPress={() => setSelectedGuild(guild)}
                className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-2xl p-4 mb-3 active:opacity-70"
              >
                <View className="flex-row items-start mb-3">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: guild.coverColor + '20' }}
                  >
                    <Award size={24} color={guild.coverColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                      {guild.name}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm" numberOfLines={2}>
                      {guild.description}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-gray-300 dark:border-slate-700">
                  <View className="flex-row items-center">
                    <Users size={14} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                      {guild.memberCount}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <BookOpen size={14} color="#64748b" />
                    <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                      {guild.resourceCount}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleJoinGuild(guild);
                    }}
                    className="bg-blue-500 px-4 py-1.5 rounded-lg active:opacity-70"
                  >
                    <Text className="text-white text-xs font-semibold">Join</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {filteredGuilds.length === 0 && (
          <View className="items-center justify-center py-12">
            <Award size={48} color="#94a3b8" />
            <Text className="text-gray-500 dark:text-slate-400 text-center mt-4">
              No guilds found matching your criteria
            </Text>
          </View>
        )}

        {/* Info Card */}
        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-4 mb-6">
          <Text className="text-blue-900 dark:text-blue-100 font-semibold mb-2">
            💡 What are Guilds?
          </Text>
          <Text className="text-blue-800 dark:text-blue-200 text-sm leading-5">
            Guilds are cross-company communities where founders, executives, and apprentices share knowledge, resources, and best practices. Join guilds to learn from others facing similar challenges.
          </Text>
        </View>
      </ScrollView>

      {/* Guild Detail Modal */}
      <Modal visible={selectedGuild !== null} transparent animationType="fade" onRequestClose={() => setSelectedGuild(null)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          {selectedGuild && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '85%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">
                      {selectedGuild.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Users size={14} color="#64748b" />
                      <Text className="text-gray-600 dark:text-slate-400 text-sm ml-1">
                        {selectedGuild.memberCount} members
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setSelectedGuild(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="flex-1 px-6 py-4">
                <Text className="text-gray-700 dark:text-slate-300 mb-4 leading-5">
                  {selectedGuild.description}
                </Text>

                {/* Stats Grid */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl p-3">
                    <BookOpen size={20} color={selectedGuild.coverColor} />
                    <Text className="text-gray-900 dark:text-white text-lg font-bold mt-2">
                      {selectedGuild.resourceCount}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">Resources</Text>
                  </View>
                  <View className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl p-3">
                    <MessageSquare size={20} color={selectedGuild.coverColor} />
                    <Text className="text-gray-900 dark:text-white text-lg font-bold mt-2">
                      {selectedGuild.postCount}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">Discussions</Text>
                  </View>
                </View>

                {/* Recent Activity Preview */}
                <Text className="text-gray-900 dark:text-white font-semibold mb-3">Recent Activity</Text>
                <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-3">
                  <Text className="text-gray-900 dark:text-white font-semibold mb-1">
                    Best Practices: PCB Design Review Checklist
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">
                    Shared by Marcus Rodriguez • 2 days ago
                  </Text>
                </View>
                <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-3">
                  <Text className="text-gray-900 dark:text-white font-semibold mb-1">
                    Discussion: Sourcing UK vs China Manufacturers
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">
                    Started by Sarah Mitchell • 5 days ago • 23 replies
                  </Text>
                </View>

                {selectedGuild.isMember ? (
                  <Pressable
                    onPress={() => {
                      setSelectedGuild(null);
                      Alert.alert('Coming Soon', 'Full guild access will be available in a future update.');
                    }}
                    className="bg-blue-500 py-4 rounded-xl active:opacity-70 flex-row items-center justify-center"
                  >
                    <ExternalLink size={18} color="#fff" />
                    <Text className="text-white font-bold ml-2">Open Guild</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handleJoinGuild(selectedGuild)}
                    className="bg-blue-500 py-4 rounded-xl active:opacity-70"
                  >
                    <Text className="text-white text-center font-bold">Join Guild</Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
