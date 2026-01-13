import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { useState } from 'react';
import {
  Users,
  Building2,
  Bot,
  MapPin,
  Search,
  X,
  Star,
  GraduationCap,
  ChevronRight,
  Heart,
  TrendingUp
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

type MarketplaceCategory = 'executives' | 'apprentices' | 'suppliers' | 'ai-agents' | 'locations';

export default function MarketplaceScreen() {
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory>('executives');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'executives' as MarketplaceCategory, label: 'Executives', icon: Users, color: '#3b82f6' },
    { id: 'apprentices' as MarketplaceCategory, label: 'Apprentices', icon: GraduationCap, color: '#10b981' },
    { id: 'suppliers' as MarketplaceCategory, label: 'Suppliers', icon: Building2, color: '#f59e0b' },
    { id: 'ai-agents' as MarketplaceCategory, label: 'AI Agents', icon: Bot, color: '#8b5cf6' },
    { id: 'locations' as MarketplaceCategory, label: 'Locations', icon: MapPin, color: '#ec4899' },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Header */}
      <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
        <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2">Marketplace</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-sm">
          Discover executives, apprentices, suppliers, AI tools, and spaces
        </Text>
      </View>

      {/* Discover Button */}
      <View className="px-6 pt-4 pb-2">
        <Pressable
          onPress={() => router.push('/swipe')}
          className="active:opacity-70"
        >
          <LinearGradient
            colors={['#ec4899', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Heart size={20} color="#fff" fill="#fff" />
            <Text className="text-gray-900 dark:text-white font-bold text-base">
              Swipe to Discover
            </Text>
            <TrendingUp size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-gray-200 dark:border-slate-800"
        style={{ flexGrow: 0 }}
      >
        <View className="flex-row px-4 py-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => setActiveCategory(category.id)}
                className={`mr-3 px-4 py-2.5 rounded-xl flex-row items-center gap-2 ${
                  isActive ? 'bg-blue-500' : 'bg-gray-100 dark:bg-slate-900'
                }`}
                style={isActive ? { borderWidth: 2, borderColor: category.color } : {}}
              >
                <Icon
                  size={18}
                  color={isActive ? '#fff' : '#64748b'}
                  strokeWidth={2}
                />
                <Text
                  className={`font-semibold text-sm ${
                    isActive ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Search Bar */}
      <View className="px-6 pt-4 pb-2">
        <View className="bg-gray-100 dark:bg-slate-900 rounded-xl flex-row items-center px-4 py-3 border border-gray-200 dark:border-slate-800">
          <Search size={20} color="#64748b" />
          <TextInput
            className="flex-1 text-gray-900 dark:text-white ml-3 text-base"
            placeholder={`Search ${activeCategory}...`}
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} className="ml-2">
              <X size={20} color="#64748b" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1">
        {activeCategory === 'executives' && <ExecutivesTab searchQuery={searchQuery} />}
        {activeCategory === 'apprentices' && <ApprenticesTab searchQuery={searchQuery} />}
        {activeCategory === 'suppliers' && <SuppliersTab searchQuery={searchQuery} />}
        {activeCategory === 'ai-agents' && <AIAgentsTab searchQuery={searchQuery} />}
        {activeCategory === 'locations' && <LocationsTab searchQuery={searchQuery} />}
      </ScrollView>
    </View>
  );
}

// Executives Marketplace Tab
function ExecutivesTab({ searchQuery }: { searchQuery: string }) {
  return (
    <View className="p-6">
      <View className="mb-4">
        <Text className="text-gray-900 dark:text-white text-xl font-bold mb-2">Fractional Executives</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-sm">
          Experienced leaders available for fractional engagements
        </Text>
      </View>

      {/* Featured Executive */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <Star size={16} color="#fbbf24" fill="#fbbf24" />
          <Text className="text-white text-xs font-bold uppercase tracking-wide">Featured Executive</Text>
        </View>
        <View className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white text-lg font-bold mb-1">Sarah Chen</Text>
              <Text className="text-blue-100 text-sm mb-2">Chief Operating Officer</Text>
              <View className="flex-row items-center gap-2 mb-2">
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">Ops</Text>
                </View>
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">Engineering</Text>
                </View>
              </View>
              <Text className="text-blue-100 text-xs">15 years experience • Available 3 days/week</Text>
            </View>
            <View className="items-end">
              <Text className="text-white text-2xl font-bold">£850</Text>
              <Text className="text-blue-100 text-xs">/day</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/community')}
            className="bg-white rounded-xl py-3 flex-row items-center justify-center gap-2"
          >
            <Text className="text-blue-600 font-bold">View Profile</Text>
            <ChevronRight size={16} color="#2563eb" />
          </Pressable>
        </View>
      </View>

      {/* Call to Action */}
      <Pressable
        onPress={() => router.push('/network')}
        className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 items-center"
      >
        <Users size={48} color="#64748b" />
        <Text className="text-gray-900 dark:text-white text-lg font-bold mt-4 mb-2">Browse All Executives</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-center text-sm mb-4">
          View 30+ fractional executives across all business functions
        </Text>
        <View className="bg-blue-500 rounded-xl px-6 py-3 flex-row items-center gap-2">
          <Text className="text-white font-bold">View Network</Text>
          <ChevronRight size={16} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

// Apprentices Marketplace Tab
function ApprenticesTab({ searchQuery }: { searchQuery: string }) {
  return (
    <View className="p-6">
      <View className="mb-4">
        <Text className="text-gray-900 dark:text-white text-xl font-bold mb-2">Apprentice Talent</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-sm">
          Skilled apprentices ready to contribute to your team
        </Text>
      </View>

      {/* Featured Apprentice */}
      <View className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <Star size={16} color="#fbbf24" fill="#fbbf24" />
          <Text className="text-white text-xs font-bold uppercase tracking-wide">Rising Star</Text>
        </View>
        <View className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white text-lg font-bold mb-1">Alex Thompson</Text>
              <Text className="text-emerald-100 text-sm mb-2">Engineering Apprentice</Text>
              <View className="flex-row items-center gap-2 mb-2">
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">React Native</Text>
                </View>
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">TypeScript</Text>
                </View>
              </View>
              <Text className="text-emerald-100 text-xs">2 years experience • Full-time available</Text>
            </View>
            <View className="items-end">
              <Text className="text-white text-2xl font-bold">£250</Text>
              <Text className="text-emerald-100 text-xs">/day</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/community')}
            className="bg-white rounded-xl py-3 flex-row items-center justify-center gap-2"
          >
            <Text className="text-emerald-600 font-bold">View Profile</Text>
            <ChevronRight size={16} color="#059669" />
          </Pressable>
        </View>
      </View>

      {/* Call to Action */}
      <Pressable
        onPress={() => router.push('/network')}
        className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 items-center"
      >
        <GraduationCap size={48} color="#64748b" />
        <Text className="text-gray-900 dark:text-white text-lg font-bold mt-4 mb-2">Browse All Apprentices</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-center text-sm mb-4">
          Discover 30+ talented apprentices across all specializations
        </Text>
        <View className="bg-emerald-500 rounded-xl px-6 py-3 flex-row items-center gap-2">
          <Text className="text-white font-bold">View Network</Text>
          <ChevronRight size={16} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

// Suppliers Marketplace Tab
function SuppliersTab({ searchQuery }: { searchQuery: string }) {
  return (
    <View className="p-6">
      <View className="mb-4">
        <Text className="text-gray-900 dark:text-white text-xl font-bold mb-2">Hardware Suppliers</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-sm">
          Manufacturing capabilities across the UK - additive, PCB, assembly & more
        </Text>
      </View>

      {/* Featured Supplier */}
      <View className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <Star size={16} color="#fbbf24" fill="#fbbf24" />
          <Text className="text-white text-xs font-bold uppercase tracking-wide">Verified Supplier</Text>
        </View>
        <View className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white text-lg font-bold mb-1">TechForge Manufacturing</Text>
              <Text className="text-amber-100 text-sm mb-2">London, UK</Text>
              <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">3D Printing</Text>
                </View>
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">PCB Assembly</Text>
                </View>
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">Laser Cutting</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text className="text-amber-100 text-xs">4.8 rating • 127 reviews</Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/community')}
            className="bg-white rounded-xl py-3 flex-row items-center justify-center gap-2"
          >
            <Text className="text-amber-600 font-bold">View Details</Text>
            <ChevronRight size={16} color="#d97706" />
          </Pressable>
        </View>
      </View>

      {/* Call to Action */}
      <Pressable
        onPress={() => router.push('/network')}
        className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 items-center"
      >
        <Building2 size={48} color="#64748b" />
        <Text className="text-gray-900 dark:text-white text-lg font-bold mt-4 mb-2">Browse All Suppliers</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-center text-sm mb-4">
          Explore UK supplier network with full manufacturing capabilities
        </Text>
        <View className="bg-amber-500 rounded-xl px-6 py-3 flex-row items-center gap-2">
          <Text className="text-white font-bold">View Network</Text>
          <ChevronRight size={16} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

// AI Agents Marketplace Tab
function AIAgentsTab({ searchQuery }: { searchQuery: string }) {
  return (
    <View className="p-6">
      <View className="mb-4">
        <Text className="text-gray-900 dark:text-white text-xl font-bold mb-2">AI Agents Directory</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-sm">
          Discover AI tools across Finance, Sales, Marketing, Ops, Engineering & Admin
        </Text>
      </View>

      {/* Featured AI Agent */}
      <View className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <Star size={16} color="#fbbf24" fill="#fbbf24" />
          <Text className="text-white text-xs font-bold uppercase tracking-wide">Popular Agent</Text>
        </View>
        <View className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white text-lg font-bold mb-1">Claude Sonnet 4.5</Text>
              <Text className="text-purple-100 text-sm mb-2">Anthropic</Text>
              <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">All Functions</Text>
                </View>
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">API Available</Text>
                </View>
              </View>
              <Text className="text-purple-100 text-xs">General-purpose AI for analysis & automation</Text>
            </View>
            <View className="items-end">
              <Text className="text-white text-2xl font-bold">£15</Text>
              <Text className="text-purple-100 text-xs">/month</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/community')}
            className="bg-white rounded-xl py-3 flex-row items-center justify-center gap-2"
          >
            <Text className="text-purple-600 font-bold">View Details</Text>
            <ChevronRight size={16} color="#9333ea" />
          </Pressable>
        </View>
      </View>

      {/* Call to Action */}
      <Pressable
        onPress={() => router.push('/network')}
        className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 items-center"
      >
        <Bot size={48} color="#64748b" />
        <Text className="text-gray-900 dark:text-white text-lg font-bold mt-4 mb-2">Browse All AI Agents</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-center text-sm mb-4">
          Discover 50+ AI agents organized by business function
        </Text>
        <View className="bg-purple-500 rounded-xl px-6 py-3 flex-row items-center gap-2">
          <Text className="text-white font-bold">View Network</Text>
          <ChevronRight size={16} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

// Locations Marketplace Tab
function LocationsTab({ searchQuery }: { searchQuery: string }) {
  return (
    <View className="p-6">
      <View className="mb-4">
        <Text className="text-gray-900 dark:text-white text-xl font-bold mb-2">Physical Spaces</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-sm">
          Offices, co-working spaces, and maker spaces for your team
        </Text>
      </View>

      {/* Featured Location */}
      <View className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <Star size={16} color="#fbbf24" fill="#fbbf24" />
          <Text className="text-white text-xs font-bold uppercase tracking-wide">Premium Space</Text>
        </View>
        <View className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white text-lg font-bold mb-1">Tech Hub Shoreditch</Text>
              <Text className="text-pink-100 text-sm mb-2">London, UK</Text>
              <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">Co-working</Text>
                </View>
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">Meeting Rooms</Text>
                </View>
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-semibold">3D Printers</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text className="text-pink-100 text-xs">4.9 rating • Capacity: 50 people</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-white text-2xl font-bold">£250</Text>
              <Text className="text-pink-100 text-xs">/day</Text>
            </View>
          </View>
          <Pressable className="bg-white rounded-xl py-3 flex-row items-center justify-center gap-2">
            <Text className="text-pink-600 font-bold">View Space</Text>
            <ChevronRight size={16} color="#db2777" />
          </Pressable>
        </View>
      </View>

      {/* Coming Soon */}
      <View className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 items-center">
        <MapPin size={48} color="#64748b" />
        <Text className="text-gray-900 dark:text-white text-lg font-bold mt-4 mb-2">More Locations Coming Soon</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-center text-sm">
          We're building a comprehensive directory of workspaces and maker spaces
        </Text>
      </View>
    </View>
  );
}
