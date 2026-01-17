import { View, Text, ScrollView, Pressable, Modal, TextInput, Image } from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import {
  ArrowLeft, Users, BookOpen, MessageSquare, Award, Search, Plus, X,
  ExternalLink, TrendingUp, Flame, Star, Trophy, Target, Zap, Crown,
  Clock, ChevronRight, Heart, MessageCircle, Share2, Bookmark, Bell,
  CheckCircle2, Gift, Sparkles, BarChart3, Calendar, Lock, Unlock,
  ThumbsUp, Eye, FileText, Video, Link2, Download
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { Function as BusinessFunction } from '@/types';
import { useCurrentUser, useCurrentMembership } from '@/lib/state/app-store';

// ============================================================================
// SENIOR EXECUTIVE CONSULTANT ENGAGEMENT FRAMEWORK
// Based on Community Building Best Practices + Gamification Psychology
// ============================================================================

interface GuildMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  level: number;
  xp: number;
  badges: string[];
  streak: number;
  contributions: number;
  joinedAt: string;
  isOnline: boolean;
}

interface GuildResource {
  id: string;
  title: string;
  type: 'document' | 'video' | 'template' | 'link' | 'discussion';
  author: string;
  createdAt: string;
  likes: number;
  views: number;
  downloads: number;
  isPinned: boolean;
  tags: string[];
}

interface GuildChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  deadline: string;
  participants: number;
  completed: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GuildDiscussion {
  id: string;
  title: string;
  author: string;
  authorRole: string;
  createdAt: string;
  replies: number;
  likes: number;
  isHot: boolean;
  isPinned: boolean;
  lastActivity: string;
}

interface Guild {
  id: string;
  name: string;
  tagline: string;
  description: string;
  function?: BusinessFunction;
  isPublic: boolean;
  memberCount: number;
  activeToday: number;
  resourceCount: number;
  postCount: number;
  coverGradient: [string, string];
  icon: string;
  isMember: boolean;
  userLevel?: number;
  userXp?: number;
  userRank?: number;
  weeklyChallenge?: GuildChallenge;
  topContributors: GuildMember[];
  recentDiscussions: GuildDiscussion[];
  featuredResources: GuildResource[];
  upcomingEvents: number;
  streak?: number;
  nextMilestone?: { level: number; xpNeeded: number };
}

// XP and Level System
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
const LEVEL_TITLES = ['Newcomer', 'Contributor', 'Active Member', 'Rising Star', 'Expert', 'Leader', 'Champion', 'Master', 'Grandmaster', 'Legend', 'Elite', 'Guru'];

const getLevel = (xp: number) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
};

const getLevelProgress = (xp: number) => {
  const level = getLevel(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level];
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level];
  return (xp - currentThreshold) / (nextThreshold - currentThreshold);
};

// DISABLED: Demo data removed for multi-tenant architecture
// Guilds should be loaded from Supabase
const DEMO_GUILDS: Guild[] = [];

/* REFERENCE: Original demo data (will be migrated to Supabase)
const DEMO_GUILDS_ORIGINAL: Guild[] = [
  {
    id: 'guild-1',
    name: 'Hardware Design Guild',
    tagline: 'Where great products begin',
    description: 'The premier community for hardware product designers. Share CAD workflows, manufacturing insights, and get feedback from 127+ experienced engineers.',
    function: 'Engineering',
    isPublic: true,
    memberCount: 127,
    activeToday: 23,
    resourceCount: 45,
    postCount: 89,
    coverGradient: ['#3b82f6', '#8b5cf6'],
    icon: '🔧',
    isMember: true,
    userLevel: 4,
    userXp: 850,
    userRank: 12,
    streak: 7,
    nextMilestone: { level: 5, xpNeeded: 150 },
    weeklyChallenge: {
      id: 'challenge-1',
      title: 'Share Your Best DFM Tip',
      description: 'Post a Design for Manufacturing tip that saved you time or money',
      xpReward: 150,
      deadline: '2025-01-22T23:59:59',
      participants: 34,
      completed: 12,
      difficulty: 'easy',
    },
    topContributors: [
      { id: 'member-1', name: 'Sarah Chen', role: 'Lead Engineer', level: 8, xp: 4200, badges: ['Top Contributor', 'Mentor'], streak: 45, contributions: 156, joinedAt: '2024-03-15', isOnline: true },
      { id: 'member-2', name: 'Marcus Rodriguez', role: 'Product Designer', level: 7, xp: 3100, badges: ['Rising Star', 'Helper'], streak: 23, contributions: 98, joinedAt: '2024-05-20', isOnline: true },
      { id: 'member-3', name: 'Emily Watson', role: 'Hardware Architect', level: 6, xp: 2400, badges: ['Early Adopter'], streak: 15, contributions: 67, joinedAt: '2024-06-10', isOnline: false },
    ],
    recentDiscussions: [
      { id: 'disc-1', title: 'Best practices for thermal management in compact enclosures', author: 'Sarah Chen', authorRole: 'Lead Engineer', createdAt: '2025-01-18T14:30:00', replies: 23, likes: 45, isHot: true, isPinned: false, lastActivity: '2 hours ago' },
      { id: 'disc-2', title: 'PCB stackup recommendations for high-speed designs', author: 'James Liu', authorRole: 'EE Lead', createdAt: '2025-01-17T09:15:00', replies: 18, likes: 32, isHot: false, isPinned: true, lastActivity: '5 hours ago' },
    ],
    featuredResources: [
      { id: 'res-1', title: 'Complete DFM Checklist 2025', type: 'template', author: 'Sarah Chen', createdAt: '2025-01-15', likes: 89, views: 456, downloads: 234, isPinned: true, tags: ['DFM', 'Manufacturing'] },
      { id: 'res-2', title: 'Thermal Simulation Tutorial', type: 'video', author: 'Marcus Rodriguez', createdAt: '2025-01-10', likes: 67, views: 312, downloads: 0, isPinned: false, tags: ['Thermal', 'Simulation'] },
    ],
    upcomingEvents: 2,
  },
  {
    id: 'guild-2',
    name: 'Fundraising Guild',
    tagline: 'Fuel your growth',
    description: 'Connect with founders and fractional CFOs to master pitch decks, term sheets, and fundraising strategies. 200+ members have raised £50M+ collectively.',
    function: 'Finance',
    isPublic: true,
    memberCount: 203,
    activeToday: 31,
    resourceCount: 78,
    postCount: 156,
    coverGradient: ['#10b981', '#06b6d4'],
    icon: '💰',
    isMember: true,
    userLevel: 2,
    userXp: 280,
    userRank: 45,
    streak: 3,
    nextMilestone: { level: 3, xpNeeded: 20 },
    weeklyChallenge: {
      id: 'challenge-2',
      title: 'Review a Pitch Deck',
      description: 'Provide constructive feedback on a member\'s pitch deck',
      xpReward: 200,
      deadline: '2025-01-24T23:59:59',
      participants: 28,
      completed: 8,
      difficulty: 'medium',
    },
    topContributors: [
      { id: 'member-4', name: 'Alexandra Foster', role: 'Fractional CFO', level: 9, xp: 5500, badges: ['Fundraising Expert', 'Mentor', 'Top 10'], streak: 67, contributions: 234, joinedAt: '2024-01-10', isOnline: true },
      { id: 'member-5', name: 'David Park', role: 'VC Partner', level: 8, xp: 4100, badges: ['Investor', 'Advisor'], streak: 34, contributions: 145, joinedAt: '2024-02-15', isOnline: false },
    ],
    recentDiscussions: [
      { id: 'disc-3', title: 'SAFE vs Convertible Note: Which is better for hardware startups?', author: 'Alexandra Foster', authorRole: 'Fractional CFO', createdAt: '2025-01-18T10:00:00', replies: 45, likes: 78, isHot: true, isPinned: true, lastActivity: '1 hour ago' },
    ],
    featuredResources: [
      { id: 'res-3', title: 'Hardware Startup Financial Model Template', type: 'template', author: 'Alexandra Foster', createdAt: '2025-01-12', likes: 156, views: 890, downloads: 567, isPinned: true, tags: ['Finance', 'Model'] },
    ],
    upcomingEvents: 3,
  },
  {
    id: 'guild-3',
    name: 'Go-to-Market Guild',
    tagline: 'Launch with impact',
    description: 'Master the art of launching hardware products. From pre-orders to retail, learn strategies that have generated £10M+ in first-week sales.',
    function: 'Marketing',
    isPublic: true,
    memberCount: 184,
    activeToday: 28,
    resourceCount: 92,
    postCount: 234,
    coverGradient: ['#f59e0b', '#ef4444'],
    icon: '🚀',
    isMember: false,
    topContributors: [
      { id: 'member-6', name: 'Rachel Kim', role: 'Growth Lead', level: 10, xp: 7800, badges: ['Launch Expert', 'Community Leader'], streak: 89, contributions: 312, joinedAt: '2023-11-01', isOnline: true },
    ],
    recentDiscussions: [],
    featuredResources: [],
    upcomingEvents: 4,
  },
  {
    id: 'guild-4',
    name: 'Supply Chain Guild',
    tagline: 'Build resilient operations',
    description: 'Navigate UK and international suppliers, logistics, and inventory. Members have collectively saved £2M+ through shared supplier insights.',
    function: 'Ops',
    isPublic: true,
    memberCount: 95,
    activeToday: 14,
    resourceCount: 67,
    postCount: 112,
    coverGradient: ['#8b5cf6', '#ec4899'],
    icon: '📦',
    isMember: false,
    topContributors: [],
    recentDiscussions: [],
    featuredResources: [],
    upcomingEvents: 1,
  },
  {
    id: 'guild-5',
    name: 'Sales Strategy Guild',
    tagline: 'Close deals, grow revenue',
    description: 'B2B and B2C sales tactics for hardware. Learn from founders who have closed £5M+ in enterprise deals and scaled e-commerce to 6 figures.',
    function: 'Sales',
    isPublic: true,
    memberCount: 156,
    activeToday: 19,
    resourceCount: 54,
    postCount: 178,
    coverGradient: ['#ec4899', '#f97316'],
    icon: '🎯',
    isMember: false,
    topContributors: [],
    recentDiscussions: [],
    featuredResources: [],
    upcomingEvents: 2,
  },
];
*/

// Badge definitions
const BADGES = {
  'Top Contributor': { icon: '🏆', color: '#f59e0b' },
  'Mentor': { icon: '🎓', color: '#8b5cf6' },
  'Rising Star': { icon: '⭐', color: '#3b82f6' },
  'Helper': { icon: '🤝', color: '#10b981' },
  'Early Adopter': { icon: '🚀', color: '#ef4444' },
  'Fundraising Expert': { icon: '💎', color: '#06b6d4' },
  'Top 10': { icon: '🥇', color: '#f59e0b' },
  'Investor': { icon: '💼', color: '#8b5cf6' },
  'Advisor': { icon: '📊', color: '#3b82f6' },
  'Launch Expert': { icon: '🎯', color: '#ef4444' },
  'Community Leader': { icon: '👑', color: '#f59e0b' },
};

type TabView = 'discover' | 'my-guilds' | 'leaderboard';
type GuildDetailTab = 'activity' | 'resources' | 'members' | 'challenges';

export default function GuildsScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentUser();
  const currentMembership = useCurrentMembership();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabView>('my-guilds');
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [guildDetailTab, setGuildDetailTab] = useState<GuildDetailTab>('activity');
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [joinedGuildName, setJoinedGuildName] = useState('');

  // Modal states for interactive features
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<GuildDiscussion | null>(null);
  const [selectedResource, setSelectedResource] = useState<GuildResource | null>(null);
  const [selectedMember, setSelectedMember] = useState<GuildMember | null>(null);

  // Form states
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionContent, setDiscussionContent] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState<GuildResource['type']>('document');
  const [resourceLink, setResourceLink] = useState('');
  const [challengeSubmission, setChallengeSubmission] = useState('');

  // Success states
  const [showChallengeSuccess, setShowChallengeSuccess] = useState(false);
  const [showDiscussionSuccess, setShowDiscussionSuccess] = useState(false);
  const [showResourceSuccess, setShowResourceSuccess] = useState(false);

  const myGuilds = useMemo(() => DEMO_GUILDS.filter(g => g.isMember), []);
  const discoverGuilds = useMemo(() => {
    return DEMO_GUILDS.filter(g => {
      if (activeTab === 'my-guilds') return g.isMember;
      if (activeTab === 'discover') return !g.isMember;
      return true;
    }).filter(g => {
      const matchesSearch = searchQuery === '' ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFunction = selectedFunction === 'all' || g.function === selectedFunction;
      return matchesSearch && matchesFunction;
    });
  }, [activeTab, searchQuery, selectedFunction]);

  // Calculate total XP and global rank
  const totalXp = useMemo(() => myGuilds.reduce((acc, g) => acc + (g.userXp || 0), 0), [myGuilds]);
  const totalStreak = useMemo(() => Math.max(...myGuilds.map(g => g.streak || 0)), [myGuilds]);

  const handleJoinGuild = (guild: Guild) => {
    setJoinedGuildName(guild.name);
    setShowJoinSuccess(true);
    setSelectedGuild(null);
    setTimeout(() => setShowJoinSuccess(false), 3000);
  };

  const handleTakeChallenge = () => {
    if (!challengeSubmission.trim()) return;
    setShowChallengeModal(false);
    setShowChallengeSuccess(true);
    setChallengeSubmission('');
    setTimeout(() => setShowChallengeSuccess(false), 3000);
  };

  const handleCreateDiscussion = () => {
    if (!discussionTitle.trim() || !discussionContent.trim()) return;
    setShowDiscussionModal(false);
    setShowDiscussionSuccess(true);
    setDiscussionTitle('');
    setDiscussionContent('');
    setTimeout(() => setShowDiscussionSuccess(false), 3000);
  };

  const handleShareResource = () => {
    if (!resourceTitle.trim() || !resourceLink.trim()) return;
    setShowResourceModal(false);
    setShowResourceSuccess(true);
    setResourceTitle('');
    setResourceLink('');
    setTimeout(() => setShowResourceSuccess(false), 3000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'medium': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
      case 'hard': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
      default: return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'video': return Video;
      case 'template': return Download;
      case 'link': return Link2;
      case 'discussion': return MessageSquare;
      default: return FileText;
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Success Toasts */}
      {showJoinSuccess && (
        <Animated.View
          entering={FadeInUp}
          className="absolute top-20 left-6 right-6 z-50 bg-emerald-500 rounded-2xl p-4 flex-row items-center"
        >
          <CheckCircle2 size={24} color="#ffffff" />
          <View className="ml-3 flex-1">
            <Text className="text-white font-bold">Welcome to {joinedGuildName}!</Text>
            <Text className="text-white/80 text-sm">You've earned +50 XP for joining</Text>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white font-bold">+50 XP</Text>
          </View>
        </Animated.View>
      )}

      {showChallengeSuccess && (
        <Animated.View
          entering={FadeInUp}
          className="absolute top-20 left-6 right-6 z-50 bg-amber-500 rounded-2xl p-4 flex-row items-center"
        >
          <Target size={24} color="#ffffff" />
          <View className="ml-3 flex-1">
            <Text className="text-white font-bold">Challenge Submitted!</Text>
            <Text className="text-white/80 text-sm">Under review - XP awarded on approval</Text>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white font-bold">Pending</Text>
          </View>
        </Animated.View>
      )}

      {showDiscussionSuccess && (
        <Animated.View
          entering={FadeInUp}
          className="absolute top-20 left-6 right-6 z-50 bg-blue-500 rounded-2xl p-4 flex-row items-center"
        >
          <MessageSquare size={24} color="#ffffff" />
          <View className="ml-3 flex-1">
            <Text className="text-white font-bold">Discussion Created!</Text>
            <Text className="text-white/80 text-sm">You've earned +15 XP for starting a discussion</Text>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white font-bold">+15 XP</Text>
          </View>
        </Animated.View>
      )}

      {showResourceSuccess && (
        <Animated.View
          entering={FadeInUp}
          className="absolute top-20 left-6 right-6 z-50 bg-purple-500 rounded-2xl p-4 flex-row items-center"
        >
          <BookOpen size={24} color="#ffffff" />
          <View className="ml-3 flex-1">
            <Text className="text-white font-bold">Resource Shared!</Text>
            <Text className="text-white/80 text-sm">You've earned +25 XP for sharing knowledge</Text>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white font-bold">+25 XP</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <View className="flex-row items-center mb-4">
            <Pressable onPress={() => router.back()} className="mr-3 active:opacity-70">
              <ArrowLeft size={24} color="#3b82f6" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">Guilds</Text>
              <Text className="text-slate-400 text-sm">Cross-company communities of practice</Text>
            </View>
          </View>

          {/* User Stats Card */}
          {myGuilds.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100)}>
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-white/70 text-sm">Your Guild Journey</Text>
                    <Text className="text-white text-3xl font-bold">{totalXp.toLocaleString()} XP</Text>
                  </View>
                  <View className="flex-row items-center bg-white/20 px-4 py-2 rounded-full">
                    <Flame size={20} color="#f97316" />
                    <Text className="text-white font-bold ml-2">{totalStreak} day streak</Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 bg-white/10 rounded-xl p-3">
                    <Text className="text-white/70 text-xs">Guilds Joined</Text>
                    <Text className="text-white text-xl font-bold">{myGuilds.length}</Text>
                  </View>
                  <View className="flex-1 bg-white/10 rounded-xl p-3">
                    <Text className="text-white/70 text-xs">Global Rank</Text>
                    <Text className="text-white text-xl font-bold">#42</Text>
                  </View>
                  <View className="flex-1 bg-white/10 rounded-xl p-3">
                    <Text className="text-white/70 text-xs">Badges</Text>
                    <Text className="text-white text-xl font-bold">5</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Tab Navigation */}
          <View className="flex-row bg-slate-900 rounded-xl p-1 mb-4">
            {[
              { id: 'my-guilds', label: 'My Guilds', count: myGuilds.length },
              { id: 'discover', label: 'Discover', count: DEMO_GUILDS.filter(g => !g.isMember).length },
              { id: 'leaderboard', label: 'Leaders', count: null },
            ].map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id as TabView)}
                className={`flex-1 py-3 rounded-lg ${activeTab === tab.id ? 'bg-blue-500' : ''}`}
              >
                <Text className={`text-center font-semibold ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}>
                  {tab.label}
                  {tab.count !== null && (
                    <Text className={activeTab === tab.id ? 'text-white/70' : 'text-slate-500'}> ({tab.count})</Text>
                  )}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Search */}
          {activeTab !== 'leaderboard' && (
            <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
              <Search size={18} color="#64748b" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search guilds..."
                placeholderTextColor="#64748b"
                className="flex-1 ml-2 text-white"
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="px-5 pb-8">
          {activeTab === 'leaderboard' ? (
            // Global Leaderboard
            <Animated.View entering={FadeInDown}>
              <View className="flex-row items-center mb-4">
                <Trophy size={20} color="#f59e0b" />
                <Text className="text-white font-bold text-lg ml-2">Top Contributors This Week</Text>
              </View>

              {/* Top 3 Podium */}
              <View className="flex-row items-end justify-center mb-6 gap-2">
                {/* 2nd Place */}
                <View className="items-center flex-1">
                  <View className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center mb-2 border-2 border-slate-500">
                    <Text className="text-2xl">🥈</Text>
                  </View>
                  <Text className="text-white font-semibold text-sm">David P.</Text>
                  <Text className="text-slate-400 text-xs">4,100 XP</Text>
                  <View className="bg-slate-800 rounded-lg px-3 py-6 mt-2 w-full items-center">
                    <Text className="text-slate-400 text-2xl font-bold">2</Text>
                  </View>
                </View>

                {/* 1st Place */}
                <View className="items-center flex-1">
                  <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-2 border-2 border-amber-500">
                    <Text className="text-3xl">👑</Text>
                  </View>
                  <Text className="text-white font-bold">Rachel K.</Text>
                  <Text className="text-amber-400 text-sm font-semibold">7,800 XP</Text>
                  <View className="bg-amber-500/20 rounded-lg px-3 py-8 mt-2 w-full items-center border border-amber-500/30">
                    <Text className="text-amber-400 text-3xl font-bold">1</Text>
                  </View>
                </View>

                {/* 3rd Place */}
                <View className="items-center flex-1">
                  <View className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center mb-2 border-2 border-amber-700">
                    <Text className="text-2xl">🥉</Text>
                  </View>
                  <Text className="text-white font-semibold text-sm">Sarah C.</Text>
                  <Text className="text-slate-400 text-xs">4,200 XP</Text>
                  <View className="bg-slate-800 rounded-lg px-3 py-4 mt-2 w-full items-center">
                    <Text className="text-slate-400 text-xl font-bold">3</Text>
                  </View>
                </View>
              </View>

              {/* Rest of leaderboard */}
              {[
                { rank: 4, name: 'Alexandra Foster', xp: 5500, guild: 'Fundraising' },
                { rank: 5, name: 'Marcus Rodriguez', xp: 3100, guild: 'Hardware Design' },
                { rank: 6, name: 'Emily Watson', xp: 2400, guild: 'Hardware Design' },
              ].map((user, index) => (
                <View
                  key={user.rank}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-2 flex-row items-center"
                >
                  <Text className="text-slate-400 font-bold w-8">#{user.rank}</Text>
                  <View className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center mr-3">
                    <Text className="text-white font-bold">{user.name.split(' ').map(n => n[0]).join('')}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{user.name}</Text>
                    <Text className="text-slate-400 text-xs">{user.guild} Guild</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white font-bold">{user.xp.toLocaleString()}</Text>
                    <Text className="text-slate-400 text-xs">XP</Text>
                  </View>
                </View>
              ))}

              {/* Your Position */}
              <View className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4 mt-4 flex-row items-center">
                <Text className="text-blue-400 font-bold w-8">#42</Text>
                <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                  <Text className="text-blue-400 font-bold">{currentUser?.name?.split(' ').map(n => n[0]).join('') || 'YO'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">{currentUser?.name || 'You'}</Text>
                  <Text className="text-blue-400 text-xs">Your Position</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white font-bold">{totalXp.toLocaleString()}</Text>
                  <Text className="text-slate-400 text-xs">XP</Text>
                </View>
              </View>
            </Animated.View>
          ) : activeTab === 'my-guilds' ? (
            // My Guilds with engagement features
            <>
              {myGuilds.map((guild, index) => (
                <Animated.View key={guild.id} entering={FadeInDown.delay(index * 100)}>
                  <Pressable
                    onPress={() => setSelectedGuild(guild)}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-4 active:opacity-70"
                  >
                    {/* Guild Header with Gradient */}
                    <LinearGradient
                      colors={guild.coverGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ padding: 16 }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Text className="text-3xl mr-3">{guild.icon}</Text>
                          <View>
                            <Text className="text-white font-bold text-lg">{guild.name}</Text>
                            <Text className="text-white/70 text-sm">{guild.tagline}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-full">
                          <Flame size={14} color="#f97316" />
                          <Text className="text-white font-semibold ml-1">{guild.streak}</Text>
                        </View>
                      </View>
                    </LinearGradient>

                    {/* User Progress */}
                    <View className="p-4">
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          <View className="bg-blue-500/20 px-3 py-1 rounded-full flex-row items-center">
                            <Star size={14} color="#3b82f6" />
                            <Text className="text-blue-400 font-semibold ml-1">Level {guild.userLevel}</Text>
                          </View>
                          <Text className="text-slate-400 ml-2 text-sm">{LEVEL_TITLES[guild.userLevel || 0]}</Text>
                        </View>
                        <Text className="text-slate-400 text-sm">Rank #{guild.userRank}</Text>
                      </View>

                      {/* XP Progress Bar */}
                      <View className="mb-4">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-slate-400 text-xs">{guild.userXp} XP</Text>
                          <Text className="text-slate-400 text-xs">{guild.nextMilestone?.xpNeeded} to Level {(guild.userLevel || 0) + 1}</Text>
                        </View>
                        <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${getLevelProgress(guild.userXp || 0) * 100}%` }}
                          />
                        </View>
                      </View>

                      {/* Weekly Challenge */}
                      {guild.weeklyChallenge && (
                        <View className={`${getDifficultyColor(guild.weeklyChallenge.difficulty).bg} ${getDifficultyColor(guild.weeklyChallenge.difficulty).border} border rounded-xl p-3 mb-4`}>
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                              <Target size={16} color="#f59e0b" />
                              <Text className="text-white font-semibold ml-2">Weekly Challenge</Text>
                            </View>
                            <View className="bg-amber-500/20 px-2 py-0.5 rounded-full">
                              <Text className="text-amber-400 text-xs font-semibold">+{guild.weeklyChallenge.xpReward} XP</Text>
                            </View>
                          </View>
                          <Text className="text-white text-sm mb-2">{guild.weeklyChallenge.title}</Text>
                          <View className="flex-row items-center justify-between">
                            <Text className="text-slate-400 text-xs">{guild.weeklyChallenge.completed}/{guild.weeklyChallenge.participants} completed</Text>
                            <View className="flex-row items-center">
                              <Clock size={12} color="#64748b" />
                              <Text className="text-slate-400 text-xs ml-1">3 days left</Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Stats Row */}
                      <View className="flex-row gap-3">
                        <View className="flex-1 bg-slate-800/50 rounded-xl p-3 items-center">
                          <Users size={18} color="#3b82f6" />
                          <Text className="text-white font-bold mt-1">{guild.memberCount}</Text>
                          <Text className="text-slate-400 text-xs">Members</Text>
                        </View>
                        <View className="flex-1 bg-slate-800/50 rounded-xl p-3 items-center">
                          <Zap size={18} color="#10b981" />
                          <Text className="text-white font-bold mt-1">{guild.activeToday}</Text>
                          <Text className="text-slate-400 text-xs">Active Today</Text>
                        </View>
                        <View className="flex-1 bg-slate-800/50 rounded-xl p-3 items-center">
                          <Calendar size={18} color="#f59e0b" />
                          <Text className="text-white font-bold mt-1">{guild.upcomingEvents}</Text>
                          <Text className="text-slate-400 text-xs">Events</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              {myGuilds.length === 0 && (
                <View className="bg-slate-900 border border-slate-800 rounded-2xl p-8 items-center">
                  <Award size={48} color="#64748b" />
                  <Text className="text-white font-bold text-lg mt-4">No Guilds Yet</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    Join a guild to connect with peers, earn XP, and level up your skills
                  </Text>
                  <Pressable
                    onPress={() => setActiveTab('discover')}
                    className="bg-blue-500 px-6 py-3 rounded-xl mt-4 active:opacity-70"
                  >
                    <Text className="text-white font-semibold">Discover Guilds</Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            // Discover Guilds
            <>
              {discoverGuilds.map((guild, index) => (
                <Animated.View key={guild.id} entering={FadeInDown.delay(index * 100)}>
                  <Pressable
                    onPress={() => setSelectedGuild(guild)}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-4 active:opacity-70"
                  >
                    <LinearGradient
                      colors={guild.coverGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ padding: 16 }}
                    >
                      <View className="flex-row items-center">
                        <Text className="text-3xl mr-3">{guild.icon}</Text>
                        <View className="flex-1">
                          <Text className="text-white font-bold text-lg">{guild.name}</Text>
                          <Text className="text-white/70 text-sm">{guild.tagline}</Text>
                        </View>
                        {!guild.isMember && (
                          <View className="bg-white/20 px-3 py-1.5 rounded-full">
                            <Text className="text-white font-semibold text-sm">Join</Text>
                          </View>
                        )}
                      </View>
                    </LinearGradient>

                    <View className="p-4">
                      <Text className="text-slate-300 text-sm mb-4" numberOfLines={2}>{guild.description}</Text>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Users size={14} color="#64748b" />
                          <Text className="text-slate-400 text-sm ml-1">{guild.memberCount} members</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Zap size={14} color="#10b981" />
                          <Text className="text-emerald-400 text-sm ml-1">{guild.activeToday} active now</Text>
                        </View>
                        <View className="flex-row items-center">
                          <BookOpen size={14} color="#64748b" />
                          <Text className="text-slate-400 text-sm ml-1">{guild.resourceCount} resources</Text>
                        </View>
                      </View>

                      {/* Social Proof */}
                      {guild.topContributors.length > 0 && (
                        <View className="flex-row items-center mt-4 pt-4 border-t border-slate-800">
                          <View className="flex-row -space-x-2">
                            {guild.topContributors.slice(0, 3).map((contributor, i) => (
                              <View
                                key={contributor.id}
                                className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 items-center justify-center"
                                style={{ marginLeft: i > 0 ? -8 : 0 }}
                              >
                                <Text className="text-white text-xs font-bold">
                                  {contributor.name.split(' ').map(n => n[0]).join('')}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <Text className="text-slate-400 text-xs ml-2">
                            {guild.topContributors[0]?.name} and {guild.memberCount - 1} others
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              {/* Empty State for Discover Tab */}
              {discoverGuilds.length === 0 && (
                <View className="bg-slate-900 border border-slate-800 rounded-2xl p-8 items-center">
                  <Award size={48} color="#64748b" />
                  <Text className="text-white font-bold text-lg mt-4">No Guilds Available</Text>
                  <Text className="text-slate-400 text-center mt-2">
                    Guilds will be added soon. Check back later to discover communities of practice!
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Guild Detail Modal */}
      <Modal visible={selectedGuild !== null} transparent animationType="slide" onRequestClose={() => setSelectedGuild(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          {selectedGuild && (
            <View className="bg-slate-900 rounded-t-3xl" style={{ height: '95%' }}>
              {/* Modal Header */}
              <LinearGradient
                colors={selectedGuild.coverGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Pressable onPress={() => setSelectedGuild(null)} className="p-2 bg-white/20 rounded-full">
                    <X size={20} color="#ffffff" />
                  </Pressable>
                  {selectedGuild.isMember && (
                    <View className="flex-row items-center bg-white/20 px-4 py-2 rounded-full">
                      <Bell size={16} color="#ffffff" />
                      <Text className="text-white font-semibold ml-2">Notifications</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center">
                  <Text className="text-4xl mr-4">{selectedGuild.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-white text-2xl font-bold">{selectedGuild.name}</Text>
                    <Text className="text-white/70">{selectedGuild.tagline}</Text>
                    <View className="flex-row items-center mt-2">
                      <Users size={14} color="rgba(255,255,255,0.7)" />
                      <Text className="text-white/70 ml-1">{selectedGuild.memberCount} members</Text>
                      <View className="w-1 h-1 bg-white/50 rounded-full mx-2" />
                      <Zap size={14} color="#10b981" />
                      <Text className="text-emerald-400 ml-1">{selectedGuild.activeToday} active</Text>
                    </View>
                  </View>
                </View>

                {/* User Progress (if member) */}
                {selectedGuild.isMember && (
                  <View className="bg-white/10 rounded-xl p-4 mt-4">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-white/70 text-sm">Your Progress</Text>
                        <View className="flex-row items-center mt-1">
                          <Star size={16} color="#f59e0b" />
                          <Text className="text-white font-bold ml-1">Level {selectedGuild.userLevel}</Text>
                          <Text className="text-white/50 ml-2">{LEVEL_TITLES[selectedGuild.userLevel || 0]}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-white font-bold">{selectedGuild.userXp} XP</Text>
                        <Text className="text-white/70 text-sm">Rank #{selectedGuild.userRank}</Text>
                      </View>
                    </View>
                    <View className="h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
                      <View
                        className="h-full bg-white rounded-full"
                        style={{ width: `${getLevelProgress(selectedGuild.userXp || 0) * 100}%` }}
                      />
                    </View>
                  </View>
                )}
              </LinearGradient>

              {/* Tab Navigation */}
              {selectedGuild.isMember && (
                <View className="flex-row bg-slate-800 mx-4 mt-4 rounded-xl p-1">
                  {[
                    { id: 'activity', label: 'Activity', icon: MessageSquare },
                    { id: 'resources', label: 'Resources', icon: BookOpen },
                    { id: 'members', label: 'Members', icon: Users },
                    { id: 'challenges', label: 'Challenges', icon: Target },
                  ].map((tab) => (
                    <Pressable
                      key={tab.id}
                      onPress={() => setGuildDetailTab(tab.id as GuildDetailTab)}
                      className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${guildDetailTab === tab.id ? 'bg-blue-500' : ''}`}
                    >
                      <tab.icon size={14} color={guildDetailTab === tab.id ? '#ffffff' : '#64748b'} />
                      <Text className={`text-xs font-medium ml-1 ${guildDetailTab === tab.id ? 'text-white' : 'text-slate-400'}`}>
                        {tab.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Content */}
              <ScrollView className="flex-1 px-4 py-4">
                {!selectedGuild.isMember ? (
                  // Non-member view
                  <View>
                    <Text className="text-slate-300 leading-6 mb-6">{selectedGuild.description}</Text>

                    {/* What you'll get */}
                    <View className="bg-slate-800 rounded-xl p-4 mb-4">
                      <Text className="text-white font-bold mb-3">What you'll get</Text>
                      {[
                        { icon: BookOpen, text: `${selectedGuild.resourceCount}+ exclusive resources` },
                        { icon: MessageSquare, text: `Access to ${selectedGuild.postCount}+ discussions` },
                        { icon: Users, text: `Connect with ${selectedGuild.memberCount} professionals` },
                        { icon: Trophy, text: 'Earn XP and climb the leaderboard' },
                        { icon: Target, text: 'Weekly challenges with rewards' },
                      ].map((item, i) => (
                        <View key={i} className="flex-row items-center py-2">
                          <item.icon size={18} color="#3b82f6" />
                          <Text className="text-slate-300 ml-3">{item.text}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Top Contributors Preview */}
                    {selectedGuild.topContributors.length > 0 && (
                      <View className="bg-slate-800 rounded-xl p-4 mb-6">
                        <Text className="text-white font-bold mb-3">Top Contributors</Text>
                        {selectedGuild.topContributors.slice(0, 3).map((member, i) => (
                          <View key={member.id} className="flex-row items-center py-2">
                            <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center">
                              <Text className="text-white font-bold">{member.name.split(' ').map(n => n[0]).join('')}</Text>
                            </View>
                            <View className="flex-1 ml-3">
                              <Text className="text-white font-semibold">{member.name}</Text>
                              <Text className="text-slate-400 text-xs">{member.role}</Text>
                            </View>
                            <View className="flex-row items-center">
                              <Star size={14} color="#f59e0b" />
                              <Text className="text-slate-400 text-sm ml-1">Lvl {member.level}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Join Button */}
                    <Pressable
                      onPress={() => handleJoinGuild(selectedGuild)}
                      className="bg-blue-500 py-4 rounded-xl flex-row items-center justify-center active:opacity-70"
                    >
                      <Plus size={20} color="#ffffff" />
                      <Text className="text-white font-bold text-lg ml-2">Join Guild</Text>
                      <View className="bg-white/20 px-3 py-1 rounded-full ml-3">
                        <Text className="text-white font-semibold">+50 XP</Text>
                      </View>
                    </Pressable>
                  </View>
                ) : guildDetailTab === 'activity' ? (
                  // Activity Feed
                  <View>
                    {/* Weekly Challenge */}
                    {selectedGuild.weeklyChallenge && (
                      <View className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 mb-4">
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center">
                            <Target size={18} color="#f59e0b" />
                            <Text className="text-white font-bold ml-2">Weekly Challenge</Text>
                          </View>
                          <View className="bg-amber-500/20 px-3 py-1 rounded-full">
                            <Text className="text-amber-400 font-semibold">+{selectedGuild.weeklyChallenge.xpReward} XP</Text>
                          </View>
                        </View>
                        <Text className="text-white mb-2">{selectedGuild.weeklyChallenge.title}</Text>
                        <Text className="text-slate-400 text-sm mb-3">{selectedGuild.weeklyChallenge.description}</Text>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <View className="h-2 bg-slate-700 rounded-full flex-1 mr-2" style={{ width: 100 }}>
                              <View
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${(selectedGuild.weeklyChallenge.completed / selectedGuild.weeklyChallenge.participants) * 100}%` }}
                              />
                            </View>
                            <Text className="text-slate-400 text-xs">{selectedGuild.weeklyChallenge.completed}/{selectedGuild.weeklyChallenge.participants}</Text>
                          </View>
                          <View className="flex-row items-center">
                            <Clock size={12} color="#64748b" />
                            <Text className="text-slate-400 text-xs ml-1">3 days left</Text>
                          </View>
                        </View>
                        <Pressable onPress={() => setShowChallengeModal(true)} className="bg-amber-500 py-3 rounded-xl mt-4 active:opacity-70">
                          <Text className="text-white text-center font-bold">Take Challenge</Text>
                        </Pressable>
                      </View>
                    )}

                    {/* Recent Discussions */}
                    <Text className="text-white font-bold text-lg mb-3">Recent Discussions</Text>
                    {selectedGuild.recentDiscussions.map((disc) => (
                      <Pressable key={disc.id} onPress={() => setSelectedDiscussion(disc)} className="bg-slate-800 rounded-xl p-4 mb-3 active:opacity-70">
                        <View className="flex-row items-start">
                          {disc.isHot && (
                            <View className="bg-red-500/20 p-1 rounded-md mr-2">
                              <Flame size={14} color="#ef4444" />
                            </View>
                          )}
                          {disc.isPinned && (
                            <View className="bg-blue-500/20 p-1 rounded-md mr-2">
                              <Bookmark size={14} color="#3b82f6" />
                            </View>
                          )}
                          <View className="flex-1">
                            <Text className="text-white font-semibold mb-1">{disc.title}</Text>
                            <Text className="text-slate-400 text-xs">{disc.author} • {disc.lastActivity}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center mt-3">
                          <View className="flex-row items-center mr-4">
                            <MessageCircle size={14} color="#64748b" />
                            <Text className="text-slate-400 text-sm ml-1">{disc.replies}</Text>
                          </View>
                          <View className="flex-row items-center">
                            <ThumbsUp size={14} color="#64748b" />
                            <Text className="text-slate-400 text-sm ml-1">{disc.likes}</Text>
                          </View>
                        </View>
                      </Pressable>
                    ))}

                    {/* New Discussion Button */}
                    <Pressable onPress={() => setShowDiscussionModal(true)} className="bg-blue-500 py-3 rounded-xl mt-2 flex-row items-center justify-center active:opacity-70">
                      <Plus size={18} color="#ffffff" />
                      <Text className="text-white font-semibold ml-2">Start Discussion</Text>
                    </Pressable>
                  </View>
                ) : guildDetailTab === 'resources' ? (
                  // Resources
                  <View>
                    <Text className="text-white font-bold text-lg mb-3">Featured Resources</Text>
                    {selectedGuild.featuredResources.map((resource) => {
                      const ResourceIcon = getResourceIcon(resource.type);
                      return (
                        <Pressable key={resource.id} onPress={() => setSelectedResource(resource)} className="bg-slate-800 rounded-xl p-4 mb-3 active:opacity-70">
                          <View className="flex-row items-start">
                            <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
                              <ResourceIcon size={20} color="#3b82f6" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-white font-semibold mb-1">{resource.title}</Text>
                              <Text className="text-slate-400 text-xs">By {resource.author}</Text>
                              <View className="flex-row flex-wrap gap-1 mt-2">
                                {resource.tags.map((tag) => (
                                  <View key={tag} className="bg-slate-700 px-2 py-0.5 rounded">
                                    <Text className="text-slate-300 text-xs">{tag}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          </View>
                          <View className="flex-row items-center mt-3 pt-3 border-t border-slate-700">
                            <View className="flex-row items-center mr-4">
                              <Eye size={14} color="#64748b" />
                              <Text className="text-slate-400 text-sm ml-1">{resource.views}</Text>
                            </View>
                            <View className="flex-row items-center mr-4">
                              <ThumbsUp size={14} color="#64748b" />
                              <Text className="text-slate-400 text-sm ml-1">{resource.likes}</Text>
                            </View>
                            {resource.downloads > 0 && (
                              <View className="flex-row items-center">
                                <Download size={14} color="#64748b" />
                                <Text className="text-slate-400 text-sm ml-1">{resource.downloads}</Text>
                              </View>
                            )}
                          </View>
                        </Pressable>
                      );
                    })}

                    <Pressable onPress={() => setShowResourceModal(true)} className="bg-blue-500 py-3 rounded-xl mt-2 flex-row items-center justify-center active:opacity-70">
                      <Plus size={18} color="#ffffff" />
                      <Text className="text-white font-semibold ml-2">Share Resource</Text>
                      <View className="bg-white/20 px-2 py-0.5 rounded-full ml-2">
                        <Text className="text-white text-xs font-semibold">+25 XP</Text>
                      </View>
                    </Pressable>
                  </View>
                ) : guildDetailTab === 'members' ? (
                  // Members & Leaderboard
                  <View>
                    <Text className="text-white font-bold text-lg mb-3">Top Contributors</Text>
                    {selectedGuild.topContributors.map((member, index) => (
                      <Pressable key={member.id} onPress={() => setSelectedMember(member)} className="bg-slate-800 rounded-xl p-4 mb-3 active:opacity-70">
                        <View className="flex-row items-center">
                          <Text className="text-slate-400 font-bold w-6">#{index + 1}</Text>
                          <View className="w-12 h-12 rounded-full bg-slate-700 items-center justify-center mr-3 relative">
                            <Text className="text-white font-bold">{member.name.split(' ').map(n => n[0]).join('')}</Text>
                            {member.isOnline && (
                              <View className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800" />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-white font-semibold">{member.name}</Text>
                            <Text className="text-slate-400 text-xs">{member.role}</Text>
                            <View className="flex-row items-center mt-1">
                              <Star size={12} color="#f59e0b" />
                              <Text className="text-slate-400 text-xs ml-1">Level {member.level} • {member.xp.toLocaleString()} XP</Text>
                            </View>
                          </View>
                          <View className="flex-row items-center">
                            <Flame size={14} color="#f97316" />
                            <Text className="text-slate-400 text-sm ml-1">{member.streak}</Text>
                          </View>
                        </View>
                        {member.badges.length > 0 && (
                          <View className="flex-row flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
                            {member.badges.map((badge) => (
                              <View
                                key={badge}
                                className="flex-row items-center px-2 py-1 rounded-full"
                                style={{ backgroundColor: `${BADGES[badge as keyof typeof BADGES]?.color}20` }}
                              >
                                <Text className="text-sm mr-1">{BADGES[badge as keyof typeof BADGES]?.icon}</Text>
                                <Text className="text-xs" style={{ color: BADGES[badge as keyof typeof BADGES]?.color }}>{badge}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  // Challenges
                  <View>
                    <Text className="text-white font-bold text-lg mb-3">Active Challenges</Text>
                    {selectedGuild.weeklyChallenge && (
                      <View className={`${getDifficultyColor(selectedGuild.weeklyChallenge.difficulty).bg} ${getDifficultyColor(selectedGuild.weeklyChallenge.difficulty).border} border rounded-xl p-4 mb-3`}>
                        <View className="flex-row items-center justify-between mb-2">
                          <View className={`px-2 py-0.5 rounded ${getDifficultyColor(selectedGuild.weeklyChallenge.difficulty).bg}`}>
                            <Text className={`text-xs font-bold uppercase ${getDifficultyColor(selectedGuild.weeklyChallenge.difficulty).text}`}>
                              {selectedGuild.weeklyChallenge.difficulty}
                            </Text>
                          </View>
                          <View className="bg-amber-500/20 px-3 py-1 rounded-full">
                            <Text className="text-amber-400 font-semibold">+{selectedGuild.weeklyChallenge.xpReward} XP</Text>
                          </View>
                        </View>
                        <Text className="text-white font-bold text-lg mb-1">{selectedGuild.weeklyChallenge.title}</Text>
                        <Text className="text-slate-300 mb-3">{selectedGuild.weeklyChallenge.description}</Text>
                        <Pressable onPress={() => setShowChallengeModal(true)} className="bg-amber-500 py-3 rounded-xl active:opacity-70">
                          <Text className="text-white text-center font-bold">Start Challenge</Text>
                        </Pressable>
                      </View>
                    )}

                    {/* Completed Challenges */}
                    <Text className="text-slate-400 font-semibold mb-2 mt-4">Your Completed Challenges</Text>
                    <View className="bg-slate-800 rounded-xl p-4 flex-row items-center">
                      <CheckCircle2 size={24} color="#10b981" />
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-semibold">Share Your First Resource</Text>
                        <Text className="text-slate-400 text-xs">Completed 5 days ago</Text>
                      </View>
                      <View className="bg-emerald-500/20 px-3 py-1 rounded-full">
                        <Text className="text-emerald-400 font-semibold">+100 XP</Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Take Challenge Modal */}
      <Modal visible={showChallengeModal} transparent animationType="slide" onRequestClose={() => setShowChallengeModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-slate-900 rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Take Challenge</Text>
              <Pressable onPress={() => setShowChallengeModal(false)} className="p-2 bg-slate-800 rounded-full">
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            {selectedGuild?.weeklyChallenge && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Challenge Info */}
                <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Target size={18} color="#f59e0b" />
                      <Text className="text-amber-400 font-bold ml-2">Weekly Challenge</Text>
                    </View>
                    <View className="bg-amber-500/20 px-3 py-1 rounded-full">
                      <Text className="text-amber-400 font-bold">+{selectedGuild.weeklyChallenge.xpReward} XP</Text>
                    </View>
                  </View>
                  <Text className="text-white font-bold text-lg mb-2">{selectedGuild.weeklyChallenge.title}</Text>
                  <Text className="text-slate-300">{selectedGuild.weeklyChallenge.description}</Text>
                </View>

                {/* Requirements */}
                <View className="bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-white font-bold mb-3">Requirements</Text>
                  <View className="flex-row items-center mb-2">
                    <CheckCircle2 size={16} color="#10b981" />
                    <Text className="text-slate-300 ml-2">Submit a relevant response</Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    <CheckCircle2 size={16} color="#10b981" />
                    <Text className="text-slate-300 ml-2">Include specific examples or details</Text>
                  </View>
                  <View className="flex-row items-center">
                    <CheckCircle2 size={16} color="#10b981" />
                    <Text className="text-slate-300 ml-2">Be helpful to other guild members</Text>
                  </View>
                </View>

                {/* Submission Input */}
                <Text className="text-white font-bold mb-2">Your Submission</Text>
                <TextInput
                  value={challengeSubmission}
                  onChangeText={setChallengeSubmission}
                  placeholder="Share your response to this challenge..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={6}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-white mb-4"
                  style={{ minHeight: 120, textAlignVertical: 'top' }}
                />

                {/* Stats */}
                <View className="flex-row gap-3 mb-6">
                  <View className="flex-1 bg-slate-800 rounded-xl p-3 items-center">
                    <Users size={18} color="#3b82f6" />
                    <Text className="text-white font-bold mt-1">{selectedGuild.weeklyChallenge.participants}</Text>
                    <Text className="text-slate-400 text-xs">Participating</Text>
                  </View>
                  <View className="flex-1 bg-slate-800 rounded-xl p-3 items-center">
                    <CheckCircle2 size={18} color="#10b981" />
                    <Text className="text-white font-bold mt-1">{selectedGuild.weeklyChallenge.completed}</Text>
                    <Text className="text-slate-400 text-xs">Completed</Text>
                  </View>
                  <View className="flex-1 bg-slate-800 rounded-xl p-3 items-center">
                    <Clock size={18} color="#f59e0b" />
                    <Text className="text-white font-bold mt-1">3</Text>
                    <Text className="text-slate-400 text-xs">Days Left</Text>
                  </View>
                </View>

                {/* Submit Button */}
                <Pressable
                  onPress={handleTakeChallenge}
                  className={`py-4 rounded-xl flex-row items-center justify-center ${challengeSubmission.trim() ? 'bg-amber-500 active:opacity-70' : 'bg-slate-700'}`}
                  disabled={!challengeSubmission.trim()}
                >
                  <Zap size={20} color="#ffffff" />
                  <Text className="text-white font-bold text-lg ml-2">Submit Challenge</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Start Discussion Modal */}
      <Modal visible={showDiscussionModal} transparent animationType="slide" onRequestClose={() => setShowDiscussionModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-slate-900 rounded-t-3xl p-6" style={{ maxHeight: '85%' }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Start Discussion</Text>
              <Pressable onPress={() => setShowDiscussionModal(false)} className="p-2 bg-slate-800 rounded-full">
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* XP Reward */}
              <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 flex-row items-center">
                <MessageSquare size={20} color="#3b82f6" />
                <Text className="text-slate-300 ml-3 flex-1">Starting discussions helps the community and earns you XP!</Text>
                <View className="bg-blue-500/20 px-3 py-1 rounded-full">
                  <Text className="text-blue-400 font-bold">+15 XP</Text>
                </View>
              </View>

              {/* Title Input */}
              <Text className="text-white font-bold mb-2">Discussion Title</Text>
              <TextInput
                value={discussionTitle}
                onChangeText={setDiscussionTitle}
                placeholder="What would you like to discuss?"
                placeholderTextColor="#64748b"
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-white mb-4"
              />

              {/* Content Input */}
              <Text className="text-white font-bold mb-2">Details</Text>
              <TextInput
                value={discussionContent}
                onChangeText={setDiscussionContent}
                placeholder="Provide context, ask specific questions, or share your thoughts..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={8}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-white mb-4"
                style={{ minHeight: 150, textAlignVertical: 'top' }}
              />

              {/* Tips */}
              <View className="bg-slate-800 rounded-xl p-4 mb-6">
                <Text className="text-white font-bold mb-2">Tips for great discussions</Text>
                <View className="flex-row items-center mb-2">
                  <Sparkles size={14} color="#f59e0b" />
                  <Text className="text-slate-300 text-sm ml-2">Be specific and provide context</Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Sparkles size={14} color="#f59e0b" />
                  <Text className="text-slate-300 text-sm ml-2">Ask open-ended questions</Text>
                </View>
                <View className="flex-row items-center">
                  <Sparkles size={14} color="#f59e0b" />
                  <Text className="text-slate-300 text-sm ml-2">Share your own experience first</Text>
                </View>
              </View>

              {/* Post Button */}
              <Pressable
                onPress={handleCreateDiscussion}
                className={`py-4 rounded-xl flex-row items-center justify-center ${discussionTitle.trim() && discussionContent.trim() ? 'bg-blue-500 active:opacity-70' : 'bg-slate-700'}`}
                disabled={!discussionTitle.trim() || !discussionContent.trim()}
              >
                <MessageSquare size={20} color="#ffffff" />
                <Text className="text-white font-bold text-lg ml-2">Post Discussion</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Share Resource Modal */}
      <Modal visible={showResourceModal} transparent animationType="slide" onRequestClose={() => setShowResourceModal(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-slate-900 rounded-t-3xl p-6" style={{ maxHeight: '85%' }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Share Resource</Text>
              <Pressable onPress={() => setShowResourceModal(false)} className="p-2 bg-slate-800 rounded-full">
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* XP Reward */}
              <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4 flex-row items-center">
                <BookOpen size={20} color="#a855f7" />
                <Text className="text-slate-300 ml-3 flex-1">Sharing valuable resources helps everyone grow!</Text>
                <View className="bg-purple-500/20 px-3 py-1 rounded-full">
                  <Text className="text-purple-400 font-bold">+25 XP</Text>
                </View>
              </View>

              {/* Resource Type */}
              <Text className="text-white font-bold mb-2">Resource Type</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {[
                  { id: 'document', label: 'Document', icon: FileText },
                  { id: 'video', label: 'Video', icon: Video },
                  { id: 'template', label: 'Template', icon: Download },
                  { id: 'link', label: 'Link', icon: Link2 },
                ].map((type) => (
                  <Pressable
                    key={type.id}
                    onPress={() => setResourceType(type.id as GuildResource['type'])}
                    className={`flex-row items-center px-4 py-2 rounded-xl ${resourceType === type.id ? 'bg-purple-500' : 'bg-slate-800'}`}
                  >
                    <type.icon size={16} color={resourceType === type.id ? '#ffffff' : '#94a3b8'} />
                    <Text className={`ml-2 font-medium ${resourceType === type.id ? 'text-white' : 'text-slate-400'}`}>{type.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Title Input */}
              <Text className="text-white font-bold mb-2">Resource Title</Text>
              <TextInput
                value={resourceTitle}
                onChangeText={setResourceTitle}
                placeholder="Give your resource a descriptive title"
                placeholderTextColor="#64748b"
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-white mb-4"
              />

              {/* Link Input */}
              <Text className="text-white font-bold mb-2">Link / URL</Text>
              <TextInput
                value={resourceLink}
                onChangeText={setResourceLink}
                placeholder="Paste the link to your resource"
                placeholderTextColor="#64748b"
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-white mb-6"
                keyboardType="url"
                autoCapitalize="none"
              />

              {/* Submit Button */}
              <Pressable
                onPress={handleShareResource}
                className={`py-4 rounded-xl flex-row items-center justify-center ${resourceTitle.trim() && resourceLink.trim() ? 'bg-purple-500 active:opacity-70' : 'bg-slate-700'}`}
                disabled={!resourceTitle.trim() || !resourceLink.trim()}
              >
                <Share2 size={20} color="#ffffff" />
                <Text className="text-white font-bold text-lg ml-2">Share Resource</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Discussion Detail Modal */}
      <Modal visible={selectedDiscussion !== null} transparent animationType="slide" onRequestClose={() => setSelectedDiscussion(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          {selectedDiscussion && (
            <View className="bg-slate-900 rounded-t-3xl" style={{ height: '90%' }}>
              {/* Header */}
              <View className="p-6 border-b border-slate-800">
                <View className="flex-row items-center justify-between mb-4">
                  <Pressable onPress={() => setSelectedDiscussion(null)} className="p-2 bg-slate-800 rounded-full">
                    <X size={20} color="#94a3b8" />
                  </Pressable>
                  <View className="flex-row items-center">
                    <Pressable className="p-2 bg-slate-800 rounded-full mr-2">
                      <Bookmark size={18} color="#94a3b8" />
                    </Pressable>
                    <Pressable className="p-2 bg-slate-800 rounded-full">
                      <Share2 size={18} color="#94a3b8" />
                    </Pressable>
                  </View>
                </View>

                <View className="flex-row items-center mb-3">
                  {selectedDiscussion.isHot && (
                    <View className="bg-red-500/20 px-2 py-1 rounded-md mr-2 flex-row items-center">
                      <Flame size={12} color="#ef4444" />
                      <Text className="text-red-400 text-xs font-bold ml-1">HOT</Text>
                    </View>
                  )}
                  {selectedDiscussion.isPinned && (
                    <View className="bg-blue-500/20 px-2 py-1 rounded-md flex-row items-center">
                      <Bookmark size={12} color="#3b82f6" />
                      <Text className="text-blue-400 text-xs font-bold ml-1">PINNED</Text>
                    </View>
                  )}
                </View>

                <Text className="text-white text-xl font-bold mb-2">{selectedDiscussion.title}</Text>
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center mr-2">
                    <Text className="text-white text-xs font-bold">{selectedDiscussion.author.split(' ').map(n => n[0]).join('')}</Text>
                  </View>
                  <View>
                    <Text className="text-white font-medium">{selectedDiscussion.author}</Text>
                    <Text className="text-slate-400 text-xs">{selectedDiscussion.authorRole} • {selectedDiscussion.lastActivity}</Text>
                  </View>
                </View>
              </View>

              {/* Content */}
              <ScrollView className="flex-1 p-6">
                {/* Original Post */}
                <View className="bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-slate-300 leading-6">
                    This is a great topic for discussion. I've been working on this problem for a while and have some insights to share with the community. What are your thoughts and experiences?
                  </Text>
                  <View className="flex-row items-center mt-4 pt-4 border-t border-slate-700">
                    <Pressable className="flex-row items-center mr-4 active:opacity-70">
                      <ThumbsUp size={16} color="#64748b" />
                      <Text className="text-slate-400 ml-1">{selectedDiscussion.likes}</Text>
                    </Pressable>
                    <Pressable className="flex-row items-center active:opacity-70">
                      <MessageCircle size={16} color="#64748b" />
                      <Text className="text-slate-400 ml-1">{selectedDiscussion.replies} replies</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Replies */}
                <Text className="text-white font-bold text-lg mb-3">Replies</Text>
                {[
                  { author: 'Marcus R.', time: '2 hours ago', content: 'Great question! In my experience, the key is to start with a solid foundation and iterate from there.', likes: 12 },
                  { author: 'Emily W.', time: '1 hour ago', content: 'I agree with Marcus. Also consider the trade-offs between different approaches before committing.', likes: 8 },
                  { author: 'James L.', time: '45 mins ago', content: 'Has anyone tried the new methodology? I heard it addresses some of these concerns.', likes: 5 },
                ].map((reply, index) => (
                  <View key={index} className="bg-slate-800/50 rounded-xl p-4 mb-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-6 h-6 rounded-full bg-slate-700 items-center justify-center mr-2">
                        <Text className="text-white text-xs font-bold">{reply.author.split(' ').map(n => n[0]).join('')}</Text>
                      </View>
                      <Text className="text-white font-medium">{reply.author}</Text>
                      <Text className="text-slate-500 text-xs ml-2">{reply.time}</Text>
                    </View>
                    <Text className="text-slate-300">{reply.content}</Text>
                    <Pressable className="flex-row items-center mt-2 active:opacity-70">
                      <ThumbsUp size={14} color="#64748b" />
                      <Text className="text-slate-400 text-sm ml-1">{reply.likes}</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>

              {/* Reply Input */}
              <View className="p-4 border-t border-slate-800">
                <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
                  <TextInput
                    placeholder="Add a reply..."
                    placeholderTextColor="#64748b"
                    className="flex-1 text-white"
                  />
                  <Pressable className="bg-blue-500 p-2 rounded-lg ml-2 active:opacity-70">
                    <ChevronRight size={20} color="#ffffff" />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Resource Detail Modal */}
      <Modal visible={selectedResource !== null} transparent animationType="slide" onRequestClose={() => setSelectedResource(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          {selectedResource && (
            <View className="bg-slate-900 rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Resource Details</Text>
                <Pressable onPress={() => setSelectedResource(null)} className="p-2 bg-slate-800 rounded-full">
                  <X size={20} color="#94a3b8" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Resource Icon & Title */}
                <View className="items-center mb-6">
                  <View className="w-20 h-20 rounded-2xl bg-blue-500/20 items-center justify-center mb-4">
                    {(() => {
                      const IconComponent = getResourceIcon(selectedResource.type);
                      return <IconComponent size={40} color="#3b82f6" />;
                    })()}
                  </View>
                  <Text className="text-white text-xl font-bold text-center mb-1">{selectedResource.title}</Text>
                  <Text className="text-slate-400">By {selectedResource.author}</Text>
                </View>

                {/* Tags */}
                <View className="flex-row flex-wrap justify-center gap-2 mb-6">
                  {selectedResource.tags.map((tag) => (
                    <View key={tag} className="bg-slate-800 px-3 py-1 rounded-full">
                      <Text className="text-slate-300">{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* Stats */}
                <View className="flex-row gap-3 mb-6">
                  <View className="flex-1 bg-slate-800 rounded-xl p-4 items-center">
                    <Eye size={20} color="#3b82f6" />
                    <Text className="text-white font-bold text-lg mt-1">{selectedResource.views}</Text>
                    <Text className="text-slate-400 text-xs">Views</Text>
                  </View>
                  <View className="flex-1 bg-slate-800 rounded-xl p-4 items-center">
                    <ThumbsUp size={20} color="#10b981" />
                    <Text className="text-white font-bold text-lg mt-1">{selectedResource.likes}</Text>
                    <Text className="text-slate-400 text-xs">Likes</Text>
                  </View>
                  {selectedResource.downloads > 0 && (
                    <View className="flex-1 bg-slate-800 rounded-xl p-4 items-center">
                      <Download size={20} color="#f59e0b" />
                      <Text className="text-white font-bold text-lg mt-1">{selectedResource.downloads}</Text>
                      <Text className="text-slate-400 text-xs">Downloads</Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View className="flex-row gap-3 mb-4">
                  <Pressable className="flex-1 bg-slate-800 py-3 rounded-xl flex-row items-center justify-center active:opacity-70">
                    <ThumbsUp size={18} color="#3b82f6" />
                    <Text className="text-blue-400 font-semibold ml-2">Like</Text>
                  </Pressable>
                  <Pressable className="flex-1 bg-slate-800 py-3 rounded-xl flex-row items-center justify-center active:opacity-70">
                    <Bookmark size={18} color="#f59e0b" />
                    <Text className="text-amber-400 font-semibold ml-2">Save</Text>
                  </Pressable>
                </View>

                {/* Download/Open Button */}
                <Pressable className="bg-blue-500 py-4 rounded-xl flex-row items-center justify-center active:opacity-70">
                  {selectedResource.type === 'video' ? (
                    <>
                      <Video size={20} color="#ffffff" />
                      <Text className="text-white font-bold text-lg ml-2">Watch Video</Text>
                    </>
                  ) : selectedResource.type === 'link' ? (
                    <>
                      <ExternalLink size={20} color="#ffffff" />
                      <Text className="text-white font-bold text-lg ml-2">Open Link</Text>
                    </>
                  ) : (
                    <>
                      <Download size={20} color="#ffffff" />
                      <Text className="text-white font-bold text-lg ml-2">Download Resource</Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Member Profile Modal */}
      <Modal visible={selectedMember !== null} transparent animationType="slide" onRequestClose={() => setSelectedMember(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          {selectedMember && (
            <View className="bg-slate-900 rounded-t-3xl p-6" style={{ maxHeight: '85%' }}>
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Member Profile</Text>
                <Pressable onPress={() => setSelectedMember(null)} className="p-2 bg-slate-800 rounded-full">
                  <X size={20} color="#94a3b8" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View className="items-center mb-6">
                  <View className="w-24 h-24 rounded-full bg-slate-700 items-center justify-center mb-4 relative">
                    <Text className="text-white text-2xl font-bold">{selectedMember.name.split(' ').map(n => n[0]).join('')}</Text>
                    {selectedMember.isOnline && (
                      <View className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-slate-900" />
                    )}
                  </View>
                  <Text className="text-white text-xl font-bold">{selectedMember.name}</Text>
                  <Text className="text-slate-400">{selectedMember.role}</Text>
                  <View className="flex-row items-center mt-2">
                    <Star size={16} color="#f59e0b" />
                    <Text className="text-amber-400 font-semibold ml-1">Level {selectedMember.level}</Text>
                    <Text className="text-slate-500 ml-2">•</Text>
                    <Text className="text-slate-400 ml-2">{LEVEL_TITLES[selectedMember.level]}</Text>
                  </View>
                </View>

                {/* Badges */}
                {selectedMember.badges.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-white font-bold mb-3">Badges</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedMember.badges.map((badge) => (
                        <View
                          key={badge}
                          className="flex-row items-center px-3 py-2 rounded-xl"
                          style={{ backgroundColor: `${BADGES[badge as keyof typeof BADGES]?.color}20` }}
                        >
                          <Text className="text-lg mr-2">{BADGES[badge as keyof typeof BADGES]?.icon}</Text>
                          <Text className="font-semibold" style={{ color: BADGES[badge as keyof typeof BADGES]?.color }}>{badge}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Stats */}
                <View className="flex-row gap-3 mb-6">
                  <View className="flex-1 bg-slate-800 rounded-xl p-4 items-center">
                    <Zap size={20} color="#3b82f6" />
                    <Text className="text-white font-bold text-lg mt-1">{selectedMember.xp.toLocaleString()}</Text>
                    <Text className="text-slate-400 text-xs">Total XP</Text>
                  </View>
                  <View className="flex-1 bg-slate-800 rounded-xl p-4 items-center">
                    <Flame size={20} color="#f97316" />
                    <Text className="text-white font-bold text-lg mt-1">{selectedMember.streak}</Text>
                    <Text className="text-slate-400 text-xs">Day Streak</Text>
                  </View>
                  <View className="flex-1 bg-slate-800 rounded-xl p-4 items-center">
                    <Trophy size={20} color="#f59e0b" />
                    <Text className="text-white font-bold text-lg mt-1">{selectedMember.contributions}</Text>
                    <Text className="text-slate-400 text-xs">Contributions</Text>
                  </View>
                </View>

                {/* Activity */}
                <View className="bg-slate-800 rounded-xl p-4 mb-6">
                  <Text className="text-white font-bold mb-3">Activity</Text>
                  <View className="flex-row items-center justify-between py-2 border-b border-slate-700">
                    <Text className="text-slate-400">Member since</Text>
                    <Text className="text-white">{new Date(selectedMember.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
                  </View>
                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-slate-400">Status</Text>
                    <View className="flex-row items-center">
                      <View className={`w-2 h-2 rounded-full mr-2 ${selectedMember.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                      <Text className={selectedMember.isOnline ? 'text-emerald-400' : 'text-slate-400'}>
                        {selectedMember.isOnline ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-3">
                  <Pressable className="flex-1 bg-blue-500 py-4 rounded-xl flex-row items-center justify-center active:opacity-70">
                    <MessageSquare size={18} color="#ffffff" />
                    <Text className="text-white font-bold ml-2">Message</Text>
                  </Pressable>
                  <Pressable className="flex-1 bg-slate-800 py-4 rounded-xl flex-row items-center justify-center active:opacity-70">
                    <Users size={18} color="#3b82f6" />
                    <Text className="text-blue-400 font-bold ml-2">Follow</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
