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

import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
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
} from 'lucide-react-native';
import { useDraftStore } from '@/lib/state/draft-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { THIRD_PARTY_AI_TOOLS, type ThirdPartyAITool } from '@/lib/third-party-ai-tools';
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

  // Filter AI tools by search
  const filteredAITools = useMemo(() => {
    if (!searchQuery.trim()) return THIRD_PARTY_AI_TOOLS.slice(0, 6);
    const query = searchQuery.toLowerCase();
    return THIRD_PARTY_AI_TOOLS.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.purpose.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [searchQuery]);

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
        <View className="flex-row items-center bg-white/20 rounded-xl px-4 py-3">
          <Search size={18} color="white" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search people, suppliers, tools..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            className="flex-1 ml-3 text-white"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color="white" />
            </Pressable>
          )}
        </View>

        {/* AI Hint */}
        <View className="flex-row items-center gap-2 mt-2 px-1">
          <Sparkles size={14} color="rgba(255,255,255,0.7)" />
          <Text className="text-white/70 text-xs">
            Try: "fractional COO for fintech" or "PCB manufacturer"
          </Text>
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
                    : 'bg-slate-100 dark:bg-slate-800'
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
                onPress={() => {
                  setActionType('contact');
                  setSelectedTargetType('person');
                  setSelectedCategory('Fractional Executives');
                  setShowActionConfirm(true);
                }}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 active:opacity-80"
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
                onPress={() => {
                  setActionType('invite');
                  setSelectedTargetType('person');
                  setSelectedCategory('Apprentices');
                  setShowActionConfirm(true);
                }}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 active:opacity-80"
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
                    onPress={() => {
                      setActionType('quote');
                      setSelectedTargetType('supplier');
                      setSelectedCategory(cat.name);
                      setShowActionConfirm(true);
                    }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 active:opacity-80"
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

        {/* AI Tools Discovery */}
        {(activeCategory === 'all' || activeCategory === 'ai-tools') && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-900 dark:text-white font-bold text-lg">AI Tools</Text>
              <Pressable className="flex-row items-center gap-1 active:opacity-70">
                <Text className="text-purple-600 dark:text-purple-400 text-sm font-medium">View all</Text>
                <ChevronRight size={16} color="#8b5cf6" />
              </Pressable>
            </View>

            <View className="gap-3">
              {filteredAITools.slice(0, 4).map((tool, index) => (
                <Animated.View key={tool.id} entering={FadeInDown.delay(index * 30).springify()}>
                  <Pressable
                    onPress={() => setSelectedItem(tool)}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 active:opacity-80"
                  >
                    <View className="flex-row items-start">
                      <View className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                        <Zap size={20} color="#10b981" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                          {tool.name}
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5" numberOfLines={1}>
                          {tool.purpose}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Text className="text-amber-500 text-xs font-medium">
                            {tool.efficiencyMultiplier || 1}x speed
                          </Text>
                          <Text className="text-slate-400 text-xs">•</Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-xs">
                            £{tool.costPerMonth}/mo
                          </Text>
                        </View>
                      </View>
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
                    onPress={() => {
                      setActionType('contact');
                      setSelectedTargetType('advisor');
                      setSelectedCategory(cat.name);
                      setShowActionConfirm(true);
                    }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 active:opacity-80"
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
