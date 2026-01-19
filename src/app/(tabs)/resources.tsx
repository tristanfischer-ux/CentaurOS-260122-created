/**
 * Resources Tab - Current Usage Only
 * AI tools currently configured + Active supplier engagements
 *
 * MIGRATION: This tab shows CURRENT resources from 'tools' tab
 * Anti-bloat: No discovery - that's in Marketplace
 */

import { View, Text, ScrollView, Pressable, Modal, Linking } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  Wrench,
  Bot,
  Factory,
  Zap,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MessageSquare,
  UserCircle,
  Link,
} from 'lucide-react-native';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import type { SupplierEngagement, AIAgent } from '@/lib/organization-seed';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';

const RESOURCES_HELP: HelpContent = {
  title: 'Resources',
  subtitle: 'What you\'re using now',
  description: 'The Resources tab shows your currently configured AI tools and active supplier engagements. This is your "equipment" view.',
  tips: [
    'AI tools shows what\'s currently equipped and active',
    'Supplier engagements shows active work with external partners',
    'Tap a supplier to see contact details and linked tasks',
    'To discover new tools or suppliers, go to Marketplace',
  ],
  quickActions: [
    { label: 'AI Tools', description: 'View your active AI tool subscriptions' },
    { label: 'Suppliers', description: 'Track active supplier engagements' },
    { label: 'Find More', description: 'Go to Marketplace to discover new resources' },
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

export default function ResourcesScreen() {
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
  const [showHelp, setShowHelp] = useState(false);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

  // Calculate totals
  const supplierSpend = getTotalSupplierSpend();
  const aiSpend = getTotalAISpend();

  // Active supplier stats
  const supplierStats = useMemo(() => {
    const active = supplierEngagements.filter(s => s.status === 'in_progress').length;
    const planning = supplierEngagements.filter(s => s.status === 'planning').length;
    const delivered = supplierEngagements.filter(s => s.status === 'delivered').length;
    const totalValue = supplierEngagements.reduce((sum, s) => sum + s.totalCost, 0);
    const paidValue = supplierEngagements.reduce((sum, s) => sum + s.paidToDate, 0);
    return { active, planning, delivered, totalValue, paidValue };
  }, [supplierEngagements]);

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

  const getLinkedTask = (engagement: SupplierEngagement) => {
    if (!engagement.linkedWorkPlanIds || engagement.linkedWorkPlanIds.length === 0) return null;
    return workPlans.find(wp => engagement.linkedWorkPlanIds?.includes(wp.id));
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={RESOURCES_HELP}
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
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Current</Text>
            <Text className="text-white text-2xl font-bold">Resources</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between bg-white/10 rounded-xl p-3">
          <View className="items-center flex-1">
            <Text className="text-white/70 text-xs">AI Tools</Text>
            <Text className="text-white font-bold text-lg">{aiAgents.length}</Text>
            <Text className="text-white/50 text-xs">active</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Suppliers</Text>
            <Text className="text-white font-bold text-lg">{supplierStats.active}</Text>
            <Text className="text-white/50 text-xs">in progress</Text>
          </View>
          <View className="items-center flex-1 border-l border-white/20">
            <Text className="text-white/70 text-xs">Spend</Text>
            <Text className="text-white font-bold text-lg">£{((supplierSpend.total + aiSpend) / 1000).toFixed(0)}k</Text>
            <Text className="text-white/50 text-xs">total</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
      >
        {/* AI Tools Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-slate-900 dark:text-white font-bold text-lg">AI Tools</Text>
            <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
              <Text className="text-amber-700 dark:text-amber-400 text-xs font-bold">{aiAgents.length} active</Text>
            </View>
          </View>

          {aiAgents.length > 0 ? (
            <View className="gap-3">
              {aiAgents.map((agent, index) => (
                <Animated.View key={agent.id} entering={FadeInDown.delay(index * 50).springify()}>
                  <View className="bg-white dark:bg-slate-800 rounded-xl p-4">
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
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 items-center">
              <Bot size={32} color="#64748b" />
              <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2">No AI tools configured</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/marketplace')}
                className="mt-3 bg-purple-500 rounded-lg px-4 py-2 active:opacity-80"
              >
                <Text className="text-white font-medium text-sm">Browse Marketplace</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Supplier Engagements Section */}
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-slate-900 dark:text-white font-bold text-lg">Supplier Engagements</Text>
            <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
              <Text className="text-amber-700 dark:text-amber-400 text-xs font-bold">
                {supplierEngagements.length} total
              </Text>
            </View>
          </View>

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

              {supplierEngagements.map((engagement, index) => {
                const isExpanded = expandedSuppliers.has(engagement.id);
                const statusColor = STATUS_COLORS[engagement.status];
                const statusLabel = STATUS_LABELS[engagement.status];
                const linkedTask = getLinkedTask(engagement);
                const assignedMember = members.find(m => m.id === engagement.assignedTo);
                const progress = engagement.totalCost > 0
                  ? Math.round((engagement.paidToDate / engagement.totalCost) * 100)
                  : 0;

                return (
                  <Animated.View key={engagement.id} entering={FadeInDown.delay(index * 50).springify()}>
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

                        <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{ width: `${progress}%`, backgroundColor: statusColor }}
                          />
                        </View>

                        {linkedTask && (
                          <Pressable
                            onPress={() => router.push('/(tabs)/tasks')}
                            className="flex-row items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 active:opacity-70"
                          >
                            <Link size={14} color="#3b82f6" />
                            <Text className="text-blue-500 dark:text-blue-400 text-sm flex-1 font-medium" numberOfLines={1}>
                              {linkedTask.title}
                            </Text>
                            <ChevronRight size={14} color="#3b82f6" />
                          </Pressable>
                        )}
                      </View>

                      {isExpanded && (
                        <View className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                          <Text className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                            {engagement.description}
                          </Text>

                          <View className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
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
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </>
          ) : (
            <View className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 items-center">
              <Factory size={32} color="#64748b" />
              <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
                No supplier engagements yet
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/marketplace')}
                className="mt-3 bg-amber-500 rounded-lg px-4 py-2 active:opacity-80"
              >
                <Text className="text-white font-medium text-sm">Find Suppliers</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
