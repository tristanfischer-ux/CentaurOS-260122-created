/**
 * Tools Tab - Suppliers & AI
 * Supplier engagements and AI agent management
 */

import { View, Text, ScrollView, Pressable, Modal, Linking, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  Wrench,
  Package,
  Bot,
  Factory,
  Zap,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  HelpCircle,
  Users,
  ExternalLink,
  MessageSquare,
  Send,
  Search,
  Link,
  UserCircle,
  Sparkles,
  Briefcase,
  Building2,
  Scale,
  Calculator,
  Lightbulb,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import type { SupplierEngagement, AIAgent, OrganizationMember, Advisor } from '@/lib/organization-seed';
// ADVISORS is now an empty array - import but it will return []
import { ADVISORS } from '@/lib/organization-seed';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { THIRD_PARTY_AI_TOOLS, type ThirdPartyAITool } from '@/lib/third-party-ai-tools';

const TOOLS_HELP: HelpContent = {
  title: 'Tools & Suppliers',
  subtitle: 'Your external resources',
  description: 'The Tools tab manages your external resources: supplier engagements for manufacturing/services and AI agents that boost team productivity. Track supplier progress and equip your team with AI tools.',
  tips: [
    'Supplier engagements track progress from Quote → PO → Production → Delivery → Acceptance',
    'AI agents automate orchestration tasks like RFQs, quote normalization, and QC gating',
    'Each AI tool has a productivity multiplier (2x, 5x, 10x, 20x) that speeds up work',
    'Track value delivered, in-flight, and at-risk across all supplier engagements',
    'Team members can equip AI tools in 5 slots: Think, Create, Verify, Execute, Ops',
  ],
  quickActions: [
    { label: 'Supplier Engagements', description: 'Track active supplier work and deliveries' },
    { label: 'AI Agents', description: 'Manage AI agents that automate orchestration tasks' },
    { label: 'AI Tools Marketplace', description: 'Browse and equip AI productivity tools' },
  ],
};

const STATUS_COLORS = {
  planning: '#64748b',
  in_progress: '#3b82f6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const STATUS_LABELS = {
  planning: 'Planning',
  in_progress: 'In Progress',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

type ToolsTab = 'our-tools' | 'marketplace';

export default function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  // Stores
  const aiAgents = useOrganizationStore(s => s.aiAgents);
  const supplierEngagements = useOrganizationStore(s => s.supplierEngagements);
  const members = useOrganizationStore(s => s.members);
  const getTotalAISpend = useOrganizationStore(s => s.getTotalAISpend);
  const getTotalSupplierSpend = useOrganizationStore(s => s.getTotalSupplierSpend);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // State
  const [activeTab, setActiveTab] = useState<ToolsTab>('our-tools');
  const [showHelp, setShowHelp] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierEngagement | null>(null);
  const [selectedAIAgent, setSelectedAIAgent] = useState<AIAgent | null>(null);
  const [selectedAITool, setSelectedAITool] = useState<ThirdPartyAITool | null>(null);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [selectedPerson, setSelectedPerson] = useState<OrganizationMember | null>(null);
  const [showPersonCard, setShowPersonCard] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);
  const [reachOutType, setReachOutType] = useState<'ai' | 'supplier'>('supplier');
  const [selectedSupplierCategory, setSelectedSupplierCategory] = useState<string | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [selectedAdvisorCategory, setSelectedAdvisorCategory] = useState<string | null>(null);

  const isFounder = currentMembership?.role === 'Founder';

  // Calculate totals
  const supplierSpend = getTotalSupplierSpend();
  const aiSpend = getTotalAISpend();

  // Supplier stats
  const supplierStats = useMemo(() => {
    const active = supplierEngagements.filter(s => s.status === 'in_progress').length;
    const planning = supplierEngagements.filter(s => s.status === 'planning').length;
    const delivered = supplierEngagements.filter(s => s.status === 'delivered').length;
    const totalValue = supplierEngagements.reduce((sum, s) => sum + s.totalCost, 0);
    const paidValue = supplierEngagements.reduce((sum, s) => sum + s.paidToDate, 0);
    return { active, planning, delivered, totalValue, paidValue };
  }, [supplierEngagements]);

  // Get linked task for supplier engagement
  const getLinkedTask = (engagement: SupplierEngagement) => {
    if (!engagement.linkedWorkPlanIds || engagement.linkedWorkPlanIds.length === 0) return null;
    return workPlans.find(wp => engagement.linkedWorkPlanIds?.includes(wp.id));
  };

  const toggleSupplierExpanded = (id: string) => {
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Supplier Card component
  const SupplierCard = ({ engagement, index }: { engagement: SupplierEngagement; index: number }) => {
    const isExpanded = expandedSuppliers.has(engagement.id);
    const statusColor = STATUS_COLORS[engagement.status];
    const statusLabel = STATUS_LABELS[engagement.status];
    const linkedTask = getLinkedTask(engagement);
    const assignedMember = members.find(m => m.id === engagement.assignedTo);
    const progress = engagement.totalCost > 0
      ? Math.round((engagement.paidToDate / engagement.totalCost) * 100)
      : 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <Pressable
          onPress={() => toggleSupplierExpanded(engagement.id)}
          className="bg-white dark:bg-slate-800 rounded-xl mb-3 overflow-hidden"
        >
          <View className="p-4">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-2">
                  <Factory size={16} color="#f59e0b" />
                  <Text className="text-slate-900 dark:text-white font-semibold text-base">
                    {engagement.supplierName}
                  </Text>
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  {engagement.projectName}
                </Text>
              </View>
              <View className="items-end">
                <View
                  className="px-2 py-0.5 rounded"
                  style={{ backgroundColor: statusColor + '20' }}
                >
                  <Text style={{ color: statusColor }} className="text-xs font-medium">
                    {statusLabel}
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={18} color="#64748b" className="mt-1" />
                ) : (
                  <ChevronDown size={18} color="#64748b" className="mt-1" />
                )}
              </View>
            </View>

            {/* Cost info */}
            <View className="flex-row items-center gap-4 mt-2">
              <View className="flex-row items-center gap-1">
                <DollarSign size={14} color="#64748b" />
                <Text className="text-slate-600 dark:text-slate-300 text-sm">
                  £{engagement.paidToDate.toLocaleString()} / £{engagement.totalCost.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Clock size={14} color="#64748b" />
                <Text className="text-slate-500 dark:text-slate-400 text-xs">
                  Due {new Date(engagement.deliveryDate).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${progress}%`, backgroundColor: statusColor }}
              />
            </View>

            {/* Linked task - tappable */}
            {linkedTask && (
              <Pressable
                onPress={() => router.push('/(tabs)/what')}
                className="flex-row items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 active:opacity-70"
              >
                <Link size={14} color="#3b82f6" />
                <Text className="text-blue-500 dark:text-blue-400 text-sm flex-1 font-medium" numberOfLines={1}>
                  {linkedTask.title}
                </Text>
                <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                    {linkedTask.progress}%
                  </Text>
                </View>
                <ChevronRight size={14} color="#3b82f6" />
              </Pressable>
            )}

            {/* Assigned person - tappable */}
            {assignedMember && (
              <Pressable
                onPress={() => {
                  setSelectedPerson(assignedMember);
                  setShowPersonCard(true);
                }}
                className="flex-row items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 active:opacity-70"
              >
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: assignedMember.role === 'Founder' ? '#3b82f620' : assignedMember.role === 'FractionalExec' ? '#8b5cf620' : '#10b98120' }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: assignedMember.role === 'Founder' ? '#3b82f6' : assignedMember.role === 'FractionalExec' ? '#8b5cf6' : '#10b981' }}
                  >
                    {assignedMember.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <Text className="text-slate-600 dark:text-slate-300 text-sm flex-1">
                  {assignedMember.name}
                </Text>
                <Text className="text-slate-400 text-xs">{assignedMember.role}</Text>
              </Pressable>
            )}
          </View>

          {/* Expanded content */}
          {isExpanded && (
            <View className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700">
              <Text className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                {engagement.description}
              </Text>

              {/* Supplier Contact info */}
              <View className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 uppercase">
                  Supplier Contact
                </Text>
                <View className="flex-row items-center gap-2 mb-2">
                  <UserCircle size={14} color="#64748b" />
                  <Text className="text-slate-700 dark:text-slate-300 text-sm flex-1">
                    {engagement.contactPerson}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${engagement.contactPhone}`)}
                    className="flex-1 bg-green-500/10 rounded-lg py-2 flex-row items-center justify-center gap-2 active:opacity-70"
                  >
                    <Phone size={14} color="#22c55e" />
                    <Text className="text-green-600 dark:text-green-400 text-xs font-medium">Call</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${engagement.contactEmail}`)}
                    className="flex-1 bg-blue-500/10 rounded-lg py-2 flex-row items-center justify-center gap-2 active:opacity-70"
                  >
                    <Mail size={14} color="#3b82f6" />
                    <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">Email</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`sms:${engagement.contactPhone}`)}
                    className="flex-1 bg-purple-500/10 rounded-lg py-2 flex-row items-center justify-center gap-2 active:opacity-70"
                  >
                    <MessageSquare size={14} color="#a855f7" />
                    <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">SMS</Text>
                  </Pressable>
                </View>
              </View>

              {/* Tasks linked to this supplier */}
              {engagement.linkedWorkPlanIds && engagement.linkedWorkPlanIds.length > 0 && (
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium mb-2 uppercase">
                    Linked Tasks ({engagement.linkedWorkPlanIds.length})
                  </Text>
                  {engagement.linkedWorkPlanIds.map((wpId, idx) => {
                    const wp = workPlans.find(w => w.id === wpId);
                    if (!wp) return null;
                    return (
                      <Pressable
                        key={wpId}
                        onPress={() => router.push('/(tabs)/what')}
                        className="flex-row items-center gap-2 py-1.5 active:opacity-70"
                      >
                        <CheckCircle2 size={12} color="#3b82f6" />
                        <Text className="text-slate-700 dark:text-slate-300 text-sm flex-1" numberOfLines={1}>
                          {wp.title}
                        </Text>
                        <Text className="text-blue-500 text-xs">{wp.progress}%</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  // AI Agent Card component
  const AIAgentCard = ({ agent, index }: { agent: AIAgent; index: number }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <Pressable
          onPress={() => setSelectedAIAgent(agent)}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 active:opacity-80"
        >
          <View className="flex-row items-start">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: '#8b5cf620' }}
            >
              <Bot size={24} color="#8b5cf6" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white font-semibold text-base">
                {agent.name}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5" numberOfLines={2}>
                {agent.purpose}
              </Text>
              <View className="flex-row items-center gap-3 mt-2">
                <View className="flex-row items-center gap-1">
                  <Zap size={12} color="#f59e0b" />
                  <Text className="text-slate-600 dark:text-slate-300 text-xs">
                    {agent.status}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <DollarSign size={12} color="#64748b" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    £{agent.costPerMonth}/mo
                  </Text>
                </View>
              </View>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // AI Tool Card component
  const AIToolCard = ({ tool, index }: { tool: ThirdPartyAITool; index: number }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
        <Pressable
          onPress={() => setSelectedAITool(tool)}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 active:opacity-80"
        >
          <View className="flex-row items-start">
            <View
              className="w-10 h-10 rounded-lg items-center justify-center mr-3"
              style={{ backgroundColor: '#3b82f620' }}
            >
              <Zap size={20} color="#3b82f6" />
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
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={TOOLS_HELP}
        gradientColors={['#f59e0b', '#d97706']}
      />

      {/* Header */}
      <LinearGradient
        colors={['#f59e0b', '#d97706', '#b45309']}
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
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Resources</Text>
            <Text className="text-white text-2xl font-bold">Tools</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          <View className="items-center flex-1">
            <Text className="text-white/70 text-xs">Suppliers</Text>
            <Text className="text-white font-bold text-lg">{supplierStats.active}</Text>
            <Text className="text-white/50 text-xs">active</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">AI Agents</Text>
            <Text className="text-white font-bold text-lg">{aiAgents.length}</Text>
            <Text className="text-white/50 text-xs">deployed</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Total Spend</Text>
            <Text className="text-white font-bold text-lg">£{((supplierSpend.total + aiSpend) / 1000).toFixed(0)}k</Text>
            <Text className="text-white/50 text-xs">this period</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Switcher */}
      <View className="px-5 pt-4">
        <View className="flex-row bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {[
            { key: 'our-tools', label: 'Our Tools', icon: Wrench },
            { key: 'marketplace', label: 'Marketplace', icon: Package },
          ].map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key as ToolsTab)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg ${
                activeTab === tab.key ? 'bg-white dark:bg-slate-700' : ''
              }`}
            >
              <tab.icon
                size={16}
                color={activeTab === tab.key ? '#f59e0b' : '#64748b'}
              />
              <Text
                className={`text-sm font-medium ${
                  activeTab === tab.key ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
      >
        {/* Our Tools Tab - Active Tools & Suppliers */}
        {activeTab === 'our-tools' && (
          <View>
            {/* Reach Out Button */}
            <Pressable
              onPress={() => {
                setReachOutType('supplier');
                setShowReachOut(true);
              }}
              className="bg-amber-500 rounded-xl p-4 mb-4 flex-row items-center justify-center gap-2 active:opacity-80"
            >
              <Search size={18} color="#fff" />
              <Text className="text-white font-semibold">Find New Suppliers</Text>
            </Pressable>

            {supplierEngagements.length > 0 ? (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">
                    {supplierEngagements.length} engagements
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">
                    £{supplierStats.paidValue.toLocaleString()} paid
                  </Text>
                </View>
                {supplierEngagements.map((engagement, index) => (
                  <SupplierCard key={engagement.id} engagement={engagement} index={index} />
                ))}
              </>
            ) : (
              <View className="items-center py-12">
                <Factory size={48} color="#94a3b8" />
                <Text className="text-slate-500 dark:text-slate-400 text-center mt-4">
                  No supplier engagements yet
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Marketplace Tab - Browse Available Tools */}
        {activeTab === 'marketplace' && (
          <View>
            <Text className="text-slate-900 dark:text-white font-bold text-xl mb-4">
              Marketplace
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 mb-6">
              Browse and add suppliers, AI tools, and advisors to your organization
            </Text>

            {/* Categories */}
            <View className="gap-4">
              {/* Suppliers Category */}
              <Pressable
                onPress={() => {
                  setReachOutType('supplier');
                  setShowReachOut(true);
                }}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                    <Factory size={24} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold text-lg">Suppliers</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      Manufacturing, logistics, and professional services
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#64748b" />
                </View>
              </Pressable>

              {/* AI Tools Category */}
              <Pressable
                onPress={() => {
                  setReachOutType('ai');
                  setShowReachOut(true);
                }}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <View className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                    <Zap size={24} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold text-lg">AI Tools</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      Productivity boosters for your team
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#64748b" />
                </View>
              </Pressable>

              {/* Advisors Category */}
              <View className="bg-white dark:bg-slate-800 rounded-xl p-4">
                <View className="flex-row items-center gap-3">
                  <View className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                    <Briefcase size={24} color="#8b5cf6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold text-lg">Advisors</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      Expert guidance and mentorship (Coming Soon)
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Person Card Modal */}
      <Modal
        visible={showPersonCard}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPersonCard(false)}
      >
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setShowPersonCard(false)}
        >
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '85%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
              {/* Handle */}
              <View className="items-center py-3">
                <View className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </View>

              {selectedPerson && (
                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}>
                  {/* Person Header */}
                  <View className="px-5 pb-5">
                    <View className="items-center mb-4">
                      <View
                        className="w-20 h-20 rounded-full items-center justify-center mb-3"
                        style={{
                          backgroundColor: selectedPerson.role === 'Founder'
                            ? '#3b82f620'
                            : selectedPerson.role === 'FractionalExec'
                            ? '#8b5cf620'
                            : '#10b98120'
                        }}
                      >
                        <Text
                          className="text-2xl font-bold"
                          style={{
                            color: selectedPerson.role === 'Founder'
                              ? '#3b82f6'
                              : selectedPerson.role === 'FractionalExec'
                              ? '#8b5cf6'
                              : '#10b981'
                          }}
                        >
                          {selectedPerson.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <Text className="text-slate-900 dark:text-white text-xl font-bold">
                        {selectedPerson.name}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {selectedPerson.function}
                      </Text>
                      <View
                        className="mt-2 px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: selectedPerson.role === 'Founder'
                            ? '#3b82f620'
                            : selectedPerson.role === 'FractionalExec'
                            ? '#8b5cf620'
                            : '#10b98120'
                        }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{
                            color: selectedPerson.role === 'Founder'
                              ? '#3b82f6'
                              : selectedPerson.role === 'FractionalExec'
                              ? '#8b5cf6'
                              : '#10b981'
                          }}
                        >
                          {selectedPerson.role === 'FractionalExec' ? 'Executive' : selectedPerson.role}
                        </Text>
                      </View>
                    </View>

                    {/* Contact Buttons */}
                    <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-3">
                        Contact
                      </Text>
                      <View className="flex-row gap-3">
                        <Pressable
                          onPress={() => Linking.openURL(`tel:${selectedPerson.phone || '+1234567890'}`)}
                          className="flex-1 bg-green-500 rounded-xl py-3 flex-row items-center justify-center gap-2 active:opacity-80"
                        >
                          <Phone size={18} color="#fff" />
                          <Text className="text-white font-semibold">Call</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => Linking.openURL(`mailto:${selectedPerson.email}`)}
                          className="flex-1 bg-blue-500 rounded-xl py-3 flex-row items-center justify-center gap-2 active:opacity-80"
                        >
                          <Mail size={18} color="#fff" />
                          <Text className="text-white font-semibold">Email</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => Linking.openURL(`sms:${selectedPerson.phone || '+1234567890'}`)}
                          className="flex-1 bg-purple-500 rounded-xl py-3 flex-row items-center justify-center gap-2 active:opacity-80"
                        >
                          <MessageSquare size={18} color="#fff" />
                          <Text className="text-white font-semibold">SMS</Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Info */}
                    <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-3">
                        Details
                      </Text>
                      <View className="flex-row items-center gap-3 mb-3">
                        <Mail size={16} color="#64748b" />
                        <Text className="text-slate-700 dark:text-slate-300 text-sm flex-1">
                          {selectedPerson.email}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-3 mb-3">
                        <Package size={16} color="#64748b" />
                        <Text className="text-slate-700 dark:text-slate-300 text-sm flex-1">
                          {selectedPerson.function} Team
                        </Text>
                      </View>
                      {selectedPerson.startDate && (
                        <View className="flex-row items-center gap-3">
                          <Clock size={16} color="#64748b" />
                          <Text className="text-slate-700 dark:text-slate-300 text-sm flex-1">
                            Joined {new Date(selectedPerson.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Skills */}
                    {selectedPerson.skills && selectedPerson.skills.length > 0 && (
                      <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-3">
                          Skills
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {selectedPerson.skills.map((skill, idx) => (
                            <View
                              key={`skill-${idx}`}
                              className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg flex-row items-center gap-2"
                            >
                              <Star size={12} color="#f59e0b" />
                              <Text className="text-amber-700 dark:text-amber-400 text-sm">
                                {skill.name}
                              </Text>
                              <Text className="text-amber-500 text-xs">
                                Lv.{skill.level}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reach Out Modal */}
      <Modal
        visible={showReachOut}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowReachOut(false);
          setSelectedSupplierCategory(null);
        }}
      >
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => {
            setShowReachOut(false);
            setSelectedSupplierCategory(null);
          }}
        >
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '80%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
              {/* Handle */}
              <View className="items-center py-3">
                <View className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </View>

              <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}>
                <View className="px-5 pb-5">
                  <Text className="text-slate-900 dark:text-white text-xl font-bold mb-1">
                    Find New {reachOutType === 'ai' ? 'AI Tools' : 'Suppliers'}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    {reachOutType === 'ai'
                      ? 'Discover AI tools to boost your team productivity'
                      : 'Connect with suppliers for your projects'}
                  </Text>

                  {/* Search */}
                  <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 mb-4">
                    <Search size={18} color="#64748b" />
                    <TextInput
                      placeholder={`Search ${reachOutType === 'ai' ? 'AI tools' : 'suppliers'}...`}
                      placeholderTextColor="#94a3b8"
                      className="flex-1 ml-3 text-slate-900 dark:text-white text-base"
                    />
                  </View>

                  {reachOutType === 'ai' ? (
                    <>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-3">
                        Recommended AI Tools
                      </Text>
                      {THIRD_PARTY_AI_TOOLS.slice(0, 5).map((tool, index) => (
                        <Pressable
                          key={tool.id}
                          onPress={() => {
                            setShowReachOut(false);
                            setActiveTab('marketplace');
                            setSelectedAITool(tool);
                          }}
                          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-3 flex-row items-center active:opacity-80"
                        >
                          <View className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                            <Sparkles size={20} color="#3b82f6" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-slate-900 dark:text-white font-semibold">
                              {tool.name}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5" numberOfLines={1}>
                              {tool.purpose}
                            </Text>
                          </View>
                          <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                            <Text className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                              {tool.efficiencyMultiplier}x
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </>
                  ) : (
                    <>
                      {/* If no category selected, show categories */}
                      {!selectedSupplierCategory ? (
                        <>
                          <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-3">
                            Supplier Categories
                          </Text>
                          {[
                            { name: 'Manufacturing', icon: Factory, desc: 'Production & assembly partners' },
                            { name: 'Materials', icon: Package, desc: 'Raw materials & components' },
                            { name: 'Logistics', icon: TrendingUp, desc: 'Shipping & distribution' },
                            { name: 'Professional Services', icon: Users, desc: 'Consulting & specialized services' },
                          ].map((category, index) => (
                            <Pressable
                              key={category.name}
                              onPress={() => setSelectedSupplierCategory(category.name)}
                              className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-3 flex-row items-center active:opacity-80"
                            >
                              <View className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 items-center justify-center mr-3">
                                <category.icon size={20} color="#f59e0b" />
                              </View>
                              <View className="flex-1">
                                <Text className="text-slate-900 dark:text-white font-semibold">
                                  {category.name}
                                </Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                  {category.desc}
                                </Text>
                              </View>
                              <ChevronRight size={18} color="#64748b" />
                            </Pressable>
                          ))}
                        </>
                      ) : (
                        <>
                          {/* Show filtered suppliers by category */}
                          <Pressable
                            onPress={() => setSelectedSupplierCategory(null)}
                            className="flex-row items-center gap-2 mb-4"
                          >
                            <ChevronRight size={18} color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
                            <Text className="text-purple-600 dark:text-purple-400 font-medium">
                              Back to categories
                            </Text>
                          </Pressable>
                          <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-3">
                            {selectedSupplierCategory} Suppliers
                          </Text>
                          {supplierEngagements.filter(s => s.category === selectedSupplierCategory).length > 0 ? (
                            supplierEngagements
                              .filter(s => s.category === selectedSupplierCategory)
                              .map((supplier, index) => (
                                <Pressable
                                  key={supplier.id}
                                  onPress={() => {
                                    setShowReachOut(false);
                                    setSelectedSupplier(supplier);
                                  }}
                                  className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-3 active:opacity-80"
                                >
                                  <View className="flex-row items-start justify-between">
                                    <View className="flex-1">
                                      <Text className="text-slate-900 dark:text-white font-semibold">
                                        {supplier.supplierName}
                                      </Text>
                                      <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                        {supplier.projectName}
                                      </Text>
                                      <View className="flex-row items-center gap-2 mt-2">
                                        <View
                                          className="px-2 py-0.5 rounded"
                                          style={{ backgroundColor: STATUS_COLORS[supplier.status] + '20' }}
                                        >
                                          <Text style={{ color: STATUS_COLORS[supplier.status] }} className="text-xs font-medium">
                                            {STATUS_LABELS[supplier.status]}
                                          </Text>
                                        </View>
                                        <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                          £{supplier.totalCost.toLocaleString()}
                                        </Text>
                                      </View>
                                    </View>
                                    <ChevronRight size={18} color="#64748b" />
                                  </View>
                                </Pressable>
                              ))
                          ) : (
                            <View className="items-center py-12">
                              <Package size={48} color="#94a3b8" />
                              <Text className="text-slate-500 dark:text-slate-400 text-center mt-4">
                                No {selectedSupplierCategory.toLowerCase()} suppliers yet
                              </Text>
                            </View>
                          )}
                        </>
                      )}

                      <View className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <Text className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
                          Need a specific supplier?
                        </Text>
                        <Text className="text-amber-600 dark:text-amber-400 text-xs mb-3">
                          Contact our team to help you find the right supplier for your project needs.
                        </Text>
                        <Pressable className="bg-amber-500 rounded-lg py-2.5 items-center active:opacity-80">
                          <Text className="text-white font-semibold">Request Supplier</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Advisor Detail Modal */}
      <Modal
        visible={!!selectedAdvisor}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAdvisor(null)}
      >
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setSelectedAdvisor(null)}
        >
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '85%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
              {/* Handle */}
              <View className="items-center py-3">
                <View className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </View>

              {selectedAdvisor && (
                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}>
                  <View className="px-5 pb-5">
                    {/* Header */}
                    <View className="mb-4">
                      <View
                        className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
                        style={{
                          backgroundColor:
                            selectedAdvisor.category === 'VC' ? '#3b82f620' :
                            selectedAdvisor.category === 'Lawyer' ? '#8b5cf620' :
                            selectedAdvisor.category === 'Accountant' ? '#10b98120' : '#f59e0b20'
                        }}
                      >
                        {selectedAdvisor.category === 'VC' && <TrendingUp size={32} color="#3b82f6" />}
                        {selectedAdvisor.category === 'Lawyer' && <Scale size={32} color="#8b5cf6" />}
                        {selectedAdvisor.category === 'Accountant' && <Calculator size={32} color="#10b981" />}
                        {selectedAdvisor.category === 'Domain Expert' && <Lightbulb size={32} color="#f59e0b" />}
                      </View>
                      <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-1">
                        {selectedAdvisor.name}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                        {selectedAdvisor.specialty}
                      </Text>
                      <View
                        className="self-start px-3 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            selectedAdvisor.category === 'VC' ? '#3b82f620' :
                            selectedAdvisor.category === 'Lawyer' ? '#8b5cf620' :
                            selectedAdvisor.category === 'Accountant' ? '#10b98120' : '#f59e0b20'
                        }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{
                            color:
                              selectedAdvisor.category === 'VC' ? '#3b82f6' :
                              selectedAdvisor.category === 'Lawyer' ? '#8b5cf6' :
                              selectedAdvisor.category === 'Accountant' ? '#10b981' : '#f59e0b'
                          }}
                        >
                          {selectedAdvisor.category}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <Text className="text-slate-700 dark:text-slate-300 text-sm leading-5">
                        {selectedAdvisor.description}
                      </Text>
                    </View>

                    {/* Contact Info */}
                    <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-3">
                        Contact
                      </Text>

                      <View className="flex-row items-center gap-3 mb-3">
                        <MapPin size={16} color="#64748b" />
                        <Text className="text-slate-700 dark:text-slate-300 text-sm flex-1">
                          {selectedAdvisor.location}
                        </Text>
                      </View>

                      {selectedAdvisor.contact.website && (
                        <Pressable
                          onPress={() => selectedAdvisor.contact.website && Linking.openURL(selectedAdvisor.contact.website)}
                          className="flex-row items-center gap-3 mb-3 active:opacity-70"
                        >
                          <ExternalLink size={16} color="#3b82f6" />
                          <Text className="text-blue-500 text-sm flex-1">
                            {selectedAdvisor.contact.website.replace('https://', '')}
                          </Text>
                        </Pressable>
                      )}

                      {selectedAdvisor.contact.email && (
                        <View className="flex-row items-center gap-3 mb-3">
                          <Mail size={16} color="#64748b" />
                          <Text className="text-slate-700 dark:text-slate-300 text-sm flex-1">
                            {selectedAdvisor.contact.email}
                          </Text>
                        </View>
                      )}

                      {selectedAdvisor.contact.phone && (
                        <View className="flex-row items-center gap-3">
                          <Phone size={16} color="#64748b" />
                          <Text className="text-slate-700 dark:text-slate-300 text-sm flex-1">
                            {selectedAdvisor.contact.phone}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Focus Areas */}
                    {selectedAdvisor.focusAreas && selectedAdvisor.focusAreas.length > 0 && (
                      <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-3">
                          Focus Areas
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {selectedAdvisor.focusAreas.map((area, idx) => (
                            <View
                              key={`focus-${idx}`}
                              className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg"
                            >
                              <Text className="text-amber-700 dark:text-amber-400 text-sm">
                                {area}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Notable Clients */}
                    {selectedAdvisor.notableClients && selectedAdvisor.notableClients.length > 0 && (
                      <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-3">
                          Notable Clients
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {selectedAdvisor.notableClients.map((client, idx) => (
                            <View
                              key={`client-${idx}`}
                              className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg flex-row items-center gap-2"
                            >
                              <Building2 size={12} color="#3b82f6" />
                              <Text className="text-blue-700 dark:text-blue-400 text-sm">
                                {client}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Notes */}
                    {selectedAdvisor.notes && (
                      <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-2">
                          Notes
                        </Text>
                        <Text className="text-slate-700 dark:text-slate-300 text-sm leading-5">
                          {selectedAdvisor.notes}
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
