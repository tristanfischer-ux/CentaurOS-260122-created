/**
 * Tools Tab - Suppliers & AI
 * Supplier engagements and AI agent management
 */

import { View, Text, ScrollView, Pressable, Modal, Linking } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import type { SupplierEngagement, AIAgent } from '@/lib/organization-seed';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
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

type ToolsTab = 'suppliers' | 'ai-agents' | 'ai-tools';

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
  const [activeTab, setActiveTab] = useState<ToolsTab>('suppliers');
  const [showHelp, setShowHelp] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierEngagement | null>(null);
  const [selectedAIAgent, setSelectedAIAgent] = useState<AIAgent | null>(null);
  const [selectedAITool, setSelectedAITool] = useState<ThirdPartyAITool | null>(null);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

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
                <Text className="text-slate-900 dark:text-white font-semibold text-base">
                  {engagement.supplierName}
                </Text>
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

            {/* Linked task */}
            {linkedTask && (
              <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <CheckCircle2 size={14} color="#3b82f6" />
                <Text className="text-slate-600 dark:text-slate-300 text-sm flex-1" numberOfLines={1}>
                  {linkedTask.title}
                </Text>
                <Text className="text-blue-500 text-xs font-medium">
                  {linkedTask.progress}%
                </Text>
              </View>
            )}
          </View>

          {/* Expanded content */}
          {isExpanded && (
            <View className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700">
              <Text className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                {engagement.description}
              </Text>

              {/* Contact info */}
              <View className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 uppercase">
                  Contact
                </Text>
                <View className="flex-row items-center gap-2 mb-1">
                  <Users size={12} color="#64748b" />
                  <Text className="text-slate-700 dark:text-slate-300 text-sm">
                    {engagement.contactPerson}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2 mb-1">
                  <Mail size={12} color="#64748b" />
                  <Pressable onPress={() => Linking.openURL(`mailto:${engagement.contactEmail}`)}>
                    <Text className="text-blue-500 text-sm">{engagement.contactEmail}</Text>
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-2">
                  <Phone size={12} color="#64748b" />
                  <Pressable onPress={() => Linking.openURL(`tel:${engagement.contactPhone}`)}>
                    <Text className="text-blue-500 text-sm">{engagement.contactPhone}</Text>
                  </Pressable>
                </View>
              </View>
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
          <HelpButton onPress={() => setShowHelp(true)} />
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
            { key: 'suppliers', label: 'Suppliers', icon: Factory },
            { key: 'ai-agents', label: 'AI Agents', icon: Bot },
            { key: 'ai-tools', label: 'AI Tools', icon: Zap },
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
        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <View>
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

        {/* AI Agents Tab */}
        {activeTab === 'ai-agents' && (
          <View>
            {aiAgents.length > 0 ? (
              <>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  {aiAgents.length} agents deployed
                </Text>
                {aiAgents.map((agent, index) => (
                  <AIAgentCard key={agent.id} agent={agent} index={index} />
                ))}
              </>
            ) : (
              <View className="items-center py-12">
                <Bot size={48} color="#94a3b8" />
                <Text className="text-slate-500 dark:text-slate-400 text-center mt-4">
                  No AI agents deployed
                </Text>
              </View>
            )}
          </View>
        )}

        {/* AI Tools Tab */}
        {activeTab === 'ai-tools' && (
          <View>
            <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {THIRD_PARTY_AI_TOOLS.length} tools available
            </Text>
            {THIRD_PARTY_AI_TOOLS.map((tool, index) => (
              <AIToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
