/**
 * Marketplace Tab - Discovery
 * People, Suppliers, AI Tools, Advisors discovery
 *
 * MIGRATION: Discovery features from 'tools' marketplace + 'community'
 * Anti-bloat: Actions create DRAFTS ONLY - never auto-execute or create real tasks
 *
 * IMPORTANT: This tab uses the Draft store, NOT the WorkPlan store.
 * Drafts are separate entities that must be confirmed in the Tasks tab
 * before becoming real tasks.
 */

import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Store,
  Search,
  X,
  Users,
  Factory,
  Zap,
  Briefcase,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Scale,
  Calculator,
  Lightbulb,
  Package,
  UserPlus,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import { useDraftStore } from '@/lib/state/draft-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { loadAITools } from '@/lib/ai-tools-service';
import type { ThirdPartyAITool } from '@/lib/third-party-ai-tools';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';

const MARKETPLACE_HELP: HelpContent = {
  title: 'Marketplace',
  subtitle: 'Discover resources',
  description: 'The Marketplace is where you discover new resources: people, suppliers, AI tools, and advisors. All actions create task drafts that require confirmation.',
  tips: [
    'Browse talent: fractional executives, apprentices, contractors',
    'Find suppliers: manufacturing, logistics, professional services',
    'Discover AI tools to boost team productivity',
    'Connect with advisors: VCs, lawyers, accountants, domain experts',
    'All outreach actions create task drafts - never auto-execute',
  ],
  quickActions: [
    { label: 'People', description: 'Find fractional execs and apprentices' },
    { label: 'Suppliers', description: 'Browse manufacturing and services' },
    { label: 'AI Tools', description: 'Discover productivity tools' },
    { label: 'Advisors', description: 'Connect with experts and VCs' },
  ],
};

type MarketplaceCategory = 'all' | 'people' | 'suppliers' | 'ai-tools' | 'advisors';

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  // Use Draft store - NOT WorkPlan store
  const addDraft = useDraftStore(s => s.addDraft);
  const draftCount = useDraftStore(s => s.getDraftCount());

  // State
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory>('all');
  const [selectedItem, setSelectedItem] = useState<ThirdPartyAITool | null>(null);
  const [showActionConfirm, setShowActionConfirm] = useState(false);
  const [actionType, setActionType] = useState<'contact' | 'quote' | 'invite'>('contact');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTargetType, setSelectedTargetType] = useState<'person' | 'supplier' | 'tool' | 'advisor'>('person');

  // Expanded state for AI tool categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Fallback for demo mode
  const effectiveWorkspace = currentWorkspace || {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Demo Workspace'
  };
  const effectiveMembership = currentMembership || {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'Founder' as const,
    function: 'Engineering' as const
  };

  // Load AI tools from Supabase
  const { data: aiTools = [], isLoading: aiToolsLoading, error: aiToolsError } = useQuery({
    queryKey: ['ai-tools'],
    queryFn: loadAITools,
  });

  // Filter AI tools by search
  const filteredAITools = useMemo(() => {
    if (!searchQuery.trim()) return aiTools.slice(0, 6);
    const query = searchQuery.toLowerCase();
    return aiTools.filter((tool: ThirdPartyAITool) =>
      tool.name.toLowerCase().includes(query) ||
      tool.purpose.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [searchQuery, aiTools]);

  // Handle creating a DRAFT (not a task) for outreach
  // This uses the Draft store - drafts must be confirmed in Tasks tab to become real tasks
  const handleCreateOutreachDraft = (title: string, description: string, targetType: 'person' | 'supplier' | 'tool' | 'advisor') => {
    addDraft({
      workspaceId: effectiveWorkspace.id,
      title: title, // NO [DRAFT] prefix - drafts are a separate entity
      description: description,
      createdBy: effectiveMembership.id,
      units: 2,
      source: 'marketplace',
      sourceMetadata: {
        marketplaceCategory: selectedCategory,
        outreachType: actionType,
        targetType: targetType,
      },
    });

    setShowActionConfirm(false);
    setSelectedItem(null);
    setSelectedCategory('');

    // Navigate to Tasks tab to show the draft
    router.push('/(tabs)/tasks');
  };

  const categories = [
    { key: 'all', label: 'All', icon: Store, color: '#8b5cf6' },
    { key: 'people', label: 'People', icon: Users, color: '#3b82f6' },
    { key: 'suppliers', label: 'Suppliers', icon: Factory, color: '#f59e0b' },
    { key: 'ai-tools', label: 'AI Tools', icon: Zap, color: '#10b981' },
    { key: 'advisors', label: 'Advisors', icon: Briefcase, color: '#ec4899' },
  ];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={MARKETPLACE_HELP}
        gradientColors={['#8b5cf6', '#7c3aed']}
      />

      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Discover</Text>
            <Text className="text-white text-2xl font-bold">Marketplace</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-white/20 rounded-xl px-4 py-3 mb-3">
          <Search size={18} color="white" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Use smart search for people, suppliers, and tools"
            placeholderTextColor="rgba(255,255,255,0.6)"
            className="flex-1 ml-3 text-white"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color="white" />
            </Pressable>
          )}
        </View>

        {/* Stats - Consistent with other tabs */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          <View className="items-center flex-1">
            <Text className="text-white/70 text-xs">AI Tools</Text>
            <Text className="text-white font-bold text-lg">{aiTools.length}</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Drafts</Text>
            <Text className="text-amber-300 font-bold text-lg">{draftCount}</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Categories</Text>
            <Text className="text-white font-bold text-lg">5</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Category Filters */}
      <View className="px-5 py-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {categories.map(cat => (
              <Pressable
                key={cat.key}
                onPress={() => setActiveCategory(cat.key as MarketplaceCategory)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full ${
                  activeCategory === cat.key
                    ? 'bg-purple-600'
                    : 'bg-slate-100 dark:bg-slate-900'
                }`}
              >
                <cat.icon
                  size={16}
                  color={activeCategory === cat.key ? 'white' : cat.color}
                />
                <Text
                  className={`text-sm font-medium ${
                    activeCategory === cat.key
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: insets.bottom + 100 }}
      >
        {/* People Discovery */}
        {(activeCategory === 'all' || activeCategory === 'people') && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-900 dark:text-white font-bold text-lg">People</Text>
              <Pressable className="flex-row items-center gap-1 active:opacity-70">
                <Text className="text-purple-600 dark:text-purple-400 text-sm font-medium">View all</Text>
                <ChevronRight size={16} color="#8b5cf6" />
              </Pressable>
            </View>

            <View className="gap-3">
              {/* Fractional Executives */}
              <Pressable
                className="bg-white dark:bg-slate-900 rounded-xl p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                    <Briefcase size={24} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">Fractional Executives</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      COO, CFO, CTO, CMO available part-time
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#64748b" />
                </View>
              </Pressable>

              {/* Apprentices */}
              <Pressable
                className="bg-white dark:bg-slate-900 rounded-xl p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl">
                    <UserPlus size={24} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">Apprentices</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      Trainable talent for growth
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#64748b" />
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* AI Tools Discovery */}
        {(activeCategory === 'all' || activeCategory === 'ai-tools') && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-900 dark:text-white font-bold text-lg">AI Tools ({aiTools.length})</Text>
              <Pressable className="flex-row items-center gap-1 active:opacity-70">
                <Text className="text-purple-600 dark:text-purple-400 text-sm font-medium">View all</Text>
                <ChevronRight size={16} color="#8b5cf6" />
              </Pressable>
            </View>

            <View className="gap-3">
              {/* Manufacturing & Design - Collapsible */}
              <Pressable
                onPress={() => toggleCategory('manufacturing')}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                    <Factory size={24} color="#f97316" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">Manufacturing & Design</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      {aiTools.filter((t: ThirdPartyAITool) => t.category === 'manufacturing').length} tools for production
                    </Text>
                  </View>
                  <ChevronRight
                    size={20}
                    color="#64748b"
                    style={{ transform: [{ rotate: expandedCategories.has('manufacturing') ? '90deg' : '0deg' }] }}
                  />
                </View>
              </Pressable>

              {/* Manufacturing tools - shown when expanded */}
              {expandedCategories.has('manufacturing') && aiTools.filter((t: ThirdPartyAITool) => t.category === 'manufacturing').map((tool: ThirdPartyAITool, index: number) => (
                <Animated.View key={tool.id} entering={FadeInDown.delay(index * 50).springify()}>
                  <Pressable
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 ml-4 active:opacity-80 border border-orange-200 dark:border-orange-800"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                        <Factory size={18} color="#f97316" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold">{tool.name}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={1}>
                          {tool.purpose}
                        </Text>
                        <Text className="text-orange-600 dark:text-orange-400 text-xs font-medium mt-1">
                          £{tool.costPerMonth}/mo
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#64748b" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              {/* Sales - Collapsible */}
              <Pressable
                onPress={() => toggleCategory('sales')}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl">
                    <TrendingUp size={24} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">Sales</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      {aiTools.filter((t: ThirdPartyAITool) => t.category === 'sales').length} tools for revenue
                    </Text>
                  </View>
                  <ChevronRight
                    size={20}
                    color="#64748b"
                    style={{ transform: [{ rotate: expandedCategories.has('sales') ? '90deg' : '0deg' }] }}
                  />
                </View>
              </Pressable>

              {/* Sales tools - shown when expanded */}
              {expandedCategories.has('sales') && aiTools.filter((t: ThirdPartyAITool) => t.category === 'sales').map((tool: ThirdPartyAITool, index: number) => (
                <Animated.View key={tool.id} entering={FadeInDown.delay(index * 50).springify()}>
                  <Pressable
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 ml-4 active:opacity-80 border border-emerald-200 dark:border-emerald-800"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                        <TrendingUp size={18} color="#10b981" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold">{tool.name}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={1}>
                          {tool.purpose}
                        </Text>
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-medium mt-1">
                          £{tool.costPerMonth}/mo
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#64748b" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              {/* Marketing - Collapsible */}
              <Pressable
                onPress={() => toggleCategory('marketing')}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-pink-100 dark:bg-pink-900/30 p-3 rounded-xl">
                    <Sparkles size={24} color="#ec4899" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">Marketing</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      {aiTools.filter((t: ThirdPartyAITool) => t.category === 'marketing').length} tools for growth
                    </Text>
                  </View>
                  <ChevronRight
                    size={20}
                    color="#64748b"
                    style={{ transform: [{ rotate: expandedCategories.has('marketing') ? '90deg' : '0deg' }] }}
                  />
                </View>
              </Pressable>

              {/* Marketing tools - shown when expanded */}
              {expandedCategories.has('marketing') && aiTools.filter((t: ThirdPartyAITool) => t.category === 'marketing').map((tool: ThirdPartyAITool, index: number) => (
                <Animated.View key={tool.id} entering={FadeInDown.delay(index * 50).springify()}>
                  <Pressable
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 ml-4 active:opacity-80 border border-pink-200 dark:border-pink-800"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg">
                        <Sparkles size={18} color="#ec4899" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold">{tool.name}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={1}>
                          {tool.purpose}
                        </Text>
                        <Text className="text-pink-600 dark:text-pink-400 text-xs font-medium mt-1">
                          £{tool.costPerMonth}/mo
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#64748b" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              {/* Finance - Collapsible */}
              <Pressable
                onPress={() => toggleCategory('finance')}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                    <Calculator size={24} color="#a855f7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">Finance</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      {aiTools.filter((t: ThirdPartyAITool) => t.category === 'finance').length} tools for money
                    </Text>
                  </View>
                  <ChevronRight
                    size={20}
                    color="#64748b"
                    style={{ transform: [{ rotate: expandedCategories.has('finance') ? '90deg' : '0deg' }] }}
                  />
                </View>
              </Pressable>

              {/* Finance tools - shown when expanded */}
              {expandedCategories.has('finance') && aiTools.filter((t: ThirdPartyAITool) => t.category === 'finance').map((tool: ThirdPartyAITool, index: number) => (
                <Animated.View key={tool.id} entering={FadeInDown.delay(index * 50).springify()}>
                  <Pressable
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 ml-4 active:opacity-80 border border-purple-200 dark:border-purple-800"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                        <Calculator size={18} color="#a855f7" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold">{tool.name}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={1}>
                          {tool.purpose}
                        </Text>
                        <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium mt-1">
                          £{tool.costPerMonth}/mo
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#64748b" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              {/* Operations - Collapsible */}
              <Pressable
                onPress={() => toggleCategory('operations')}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl">
                    <Package size={24} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">Operations</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      {aiTools.filter((t: ThirdPartyAITool) => t.category === 'operations').length} tools for efficiency
                    </Text>
                  </View>
                  <ChevronRight
                    size={20}
                    color="#64748b"
                    style={{ transform: [{ rotate: expandedCategories.has('operations') ? '90deg' : '0deg' }] }}
                  />
                </View>
              </Pressable>

              {/* Operations tools - shown when expanded */}
              {expandedCategories.has('operations') && aiTools.filter((t: ThirdPartyAITool) => t.category === 'operations').map((tool: ThirdPartyAITool, index: number) => (
                <Animated.View key={tool.id} entering={FadeInDown.delay(index * 50).springify()}>
                  <Pressable
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 ml-4 active:opacity-80 border border-amber-200 dark:border-amber-800"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                        <Package size={18} color="#f59e0b" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold">{tool.name}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={1}>
                          {tool.purpose}
                        </Text>
                        <Text className="text-amber-600 dark:text-amber-400 text-xs font-medium mt-1">
                          £{tool.costPerMonth}/mo
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#64748b" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              {/* Admin & Productivity - Collapsible */}
              <Pressable
                onPress={() => toggleCategory('productivity')}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                    <Zap size={24} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">Admin & Productivity</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      {aiTools.filter((t: ThirdPartyAITool) => t.category === 'productivity').length} tools for workflow
                    </Text>
                  </View>
                  <ChevronRight
                    size={20}
                    color="#64748b"
                    style={{ transform: [{ rotate: expandedCategories.has('productivity') ? '90deg' : '0deg' }] }}
                  />
                </View>
              </Pressable>

              {/* Productivity tools - shown when expanded */}
              {expandedCategories.has('productivity') && aiTools.filter((t: ThirdPartyAITool) => t.category === 'productivity').map((tool: ThirdPartyAITool, index: number) => (
                <Animated.View key={tool.id} entering={FadeInDown.delay(index * 50).springify()}>
                  <Pressable
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 ml-4 active:opacity-80 border border-blue-200 dark:border-blue-800"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                        <Zap size={18} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold">{tool.name}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={1}>
                          {tool.purpose}
                        </Text>
                        <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium mt-1">
                          £{tool.costPerMonth}/mo
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#64748b" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Suppliers Discovery */}
        {(activeCategory === 'all' || activeCategory === 'suppliers') && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-900 dark:text-white font-bold text-lg">Suppliers</Text>
              <Pressable className="flex-row items-center gap-1 active:opacity-70">
                <Text className="text-purple-600 dark:text-purple-400 text-sm font-medium">View all</Text>
                <ChevronRight size={16} color="#8b5cf6" />
              </Pressable>
            </View>

            <View className="gap-3">
              {[
                { name: 'Manufacturing', desc: 'Production & assembly', icon: Factory },
                { name: 'Logistics', desc: 'Shipping & distribution', icon: Package },
                { name: 'Professional Services', desc: 'Consulting & legal', icon: Briefcase },
              ].map((cat, index) => (
                <Animated.View key={cat.name} entering={FadeInDown.delay(index * 50).springify()}>
                  <Pressable
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 active:opacity-80"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl">
                        <cat.icon size={24} color="#f59e0b" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold">{cat.name}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm">{cat.desc}</Text>
                      </View>
                      <ChevronRight size={20} color="#64748b" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Advisors Discovery */}
        {(activeCategory === 'all' || activeCategory === 'advisors') && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-900 dark:text-white font-bold text-lg">Advisors</Text>
              <Pressable className="flex-row items-center gap-1 active:opacity-70">
                <Text className="text-purple-600 dark:text-purple-400 text-sm font-medium">View all</Text>
                <ChevronRight size={16} color="#8b5cf6" />
              </Pressable>
            </View>

            <View className="gap-3">
              {[
                { name: 'Venture Capital', desc: 'Funding & growth advice', icon: TrendingUp, color: '#3b82f6' },
                { name: 'Legal', desc: 'IP, contracts, compliance', icon: Scale, color: '#8b5cf6' },
                { name: 'Accounting', desc: 'Financial reporting & tax', icon: Calculator, color: '#10b981' },
                { name: 'Domain Experts', desc: 'Industry-specific guidance', icon: Lightbulb, color: '#f59e0b' },
              ].map((cat, index) => (
                <Animated.View key={cat.name} entering={FadeInDown.delay(index * 50).springify()}>
                  <Pressable
                    className="bg-white dark:bg-slate-900 rounded-xl p-4 active:opacity-80"
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: cat.color + '20' }}
                      >
                        <cat.icon size={24} color={cat.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold">{cat.name}</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm">{cat.desc}</Text>
                      </View>
                      <ChevronRight size={20} color="#64748b" />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Confirmation Modal */}
      <Modal
        visible={showActionConfirm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionConfirm(false)}
      >
        <Pressable className="flex-1 bg-black/70" onPress={() => setShowActionConfirm(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '60%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-slate-900 dark:text-white">
                  {actionType === 'contact' ? 'Create Contact Draft' :
                   actionType === 'quote' ? 'Request Quote Draft' :
                   'Create Invite Draft'}
                </Text>
                <Pressable onPress={() => setShowActionConfirm(false)} className="p-2">
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>

              <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4">
                <Text className="text-amber-800 dark:text-amber-300 font-medium mb-1">
                  Draft Only - No Auto-Execute
                </Text>
                <Text className="text-amber-700 dark:text-amber-400 text-sm">
                  This will create a draft in your Tasks tab. You must review and confirm before any action is taken.
                </Text>
              </View>

              <Pressable
                onPress={() => handleCreateOutreachDraft(
                  actionType === 'contact' ? `Contact ${selectedCategory}` :
                  actionType === 'quote' ? `Request quote from ${selectedCategory}` :
                  `Invite from ${selectedCategory}`,
                  'Created from Marketplace discovery',
                  selectedTargetType
                )}
                className="bg-purple-600 py-4 rounded-xl items-center active:opacity-80"
              >
                <Text className="text-white font-bold text-base">Create Draft</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowActionConfirm(false)}
                className="py-4 items-center active:opacity-70"
              >
                <Text className="text-slate-500 dark:text-slate-400 font-medium">Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
