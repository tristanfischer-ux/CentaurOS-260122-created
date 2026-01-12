import { View, Text, ScrollView, Pressable, Modal, Linking } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import {
  Package,
  Cpu,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Mail,
  Phone,
  ChevronRight,
  Sparkles,
  MapPin,
  Globe,
  BarChart3,
  ShoppingCart,
} from 'lucide-react-native';
import { useCurrentMembership } from '@/lib/state/app-store';
import {
  ORGANIZATION_MEMBERS,
  SUPPLIER_ENGAGEMENTS,
  AI_AGENTS,
  getTotalAISpend,
  getTotalSupplierSpend,
  type SupplierEngagement,
  type AIAgent,
} from '@/lib/organization-seed';
import { TabDescription } from '@/components/TabDescription';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MakeTab = 'suppliers' | 'ai';

export default function MakeScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();

  const [activeTab, setActiveTab] = useState<MakeTab>('suppliers');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierEngagement | null>(null);
  const [selectedAI, setSelectedAI] = useState<AIAgent | null>(null);

  // All roles can view this tab (Founder, FractionalExec, Apprentice)
  const canView = true; // Everyone has access now

  if (!canView) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-6">
        <Package size={64} color="#475569" />
        <Text className="text-gray-900 dark:text-white text-xl font-bold mt-4 mb-2">
          Access Restricted
        </Text>
        <Text className="text-gray-600 dark:text-slate-400 text-center">
          Only founders can access manufacturing operations.
        </Text>
      </View>
    );
  }

  const supplierSpend = getTotalSupplierSpend();
  const aiSpend = getTotalAISpend();

  const tabs: { value: MakeTab; label: string; icon: any }[] = [
    { value: 'suppliers', label: 'Suppliers', icon: Package },
    { value: 'ai', label: 'AI Tools', icon: Cpu },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">Make</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              AI tools, suppliers, manufacturers, and BOM tracking
            </Text>
          </View>
        </View>

        {/* Summary Stats */}
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-gray-300 dark:border-slate-800">
            <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Suppliers</Text>
            <Text className="text-emerald-400 text-xl font-bold">
              £{(supplierSpend.total / 1000).toFixed(0)}k
            </Text>
            <Text className="text-gray-600 dark:text-slate-500 text-[10px] mt-0.5">
              £{(supplierSpend.paid / 1000).toFixed(0)}k paid
            </Text>
          </View>

          <View className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-gray-300 dark:border-slate-800">
            <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">AI/Month</Text>
            <Text className="text-blue-400 text-xl font-bold">
              £{aiSpend.toLocaleString()}
            </Text>
            <Text className="text-gray-600 dark:text-slate-500 text-[10px] mt-0.5">
              {AI_AGENTS.filter(a => a.status === 'active').length} active
            </Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-gray-100 dark:bg-slate-900 rounded-xl p-1 border border-gray-300 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setActiveTab(tab.value)}
                className={`flex-1 py-2 rounded-lg items-center active:opacity-70 ${
                  isActive ? 'bg-blue-500' : ''
                }`}
              >
                <Icon
                  size={18}
                  color={isActive ? '#ffffff' : '#64748b'}
                  strokeWidth={2}
                />
                <Text
                  className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <View className="px-6 pb-6">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-300 dark:border-slate-800 mb-4">
              <Text className="text-gray-900 dark:text-white font-semibold mb-2">Financial Summary</Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600 dark:text-slate-400 text-sm">Total Contracted:</Text>
                <Text className="text-gray-900 dark:text-white font-semibold">
                  £{supplierSpend.total.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600 dark:text-slate-400 text-sm">Paid to Date:</Text>
                <Text className="text-emerald-400 font-semibold">
                  £{supplierSpend.paid.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600 dark:text-slate-400 text-sm">Outstanding:</Text>
                <Text className="text-orange-400 font-semibold">
                  £{supplierSpend.remaining.toLocaleString()}
                </Text>
              </View>
            </View>

            <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">
              Active Engagements ({SUPPLIER_ENGAGEMENTS.length})
            </Text>

            {SUPPLIER_ENGAGEMENTS.map((engagement) => {
              const statusColors: Record<string, string> = {
                active: 'bg-emerald-500/20 text-emerald-400',
                negotiating: 'bg-blue-500/20 text-blue-400',
                completed: 'bg-gray-500/20 text-gray-600 dark:text-slate-400',
                onHold: 'bg-orange-500/20 text-orange-400',
              };

              const statusColor = statusColors[engagement.status] || statusColors.active;

              return (
                <Pressable
                  key={engagement.id}
                  onPress={() => setSelectedSupplier(engagement)}
                  className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 mb-3 active:opacity-70"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">{engagement.supplierName}</Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">{engagement.projectName}</Text>
                      <View className={`self-start px-2 py-0.5 rounded ${statusColor}`}>
                        <Text className={`text-xs font-semibold capitalize ${statusColor}`}>
                          {engagement.status.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-emerald-400 text-lg font-bold">
                        £{(engagement.totalCost / 1000).toFixed(0)}k
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">
                        £{(engagement.paidToDate / 1000).toFixed(0)}k paid
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                    {engagement.description}
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Calendar size={12} color="#64748b" />
                      <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                        {new Date(engagement.startDate).toLocaleDateString()} - {new Date(engagement.deliveryDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#64748b" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* AI Tools Tab */}
        {activeTab === 'ai' && (
          <View className="px-6 pb-6">
            <View className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-4 border border-blue-700/50 mb-4">
              <View className="flex-row items-center mb-2">
                <Sparkles size={20} color="#60a5fa" />
                <Text className="text-gray-900 dark:text-white font-semibold ml-2">AI Infrastructure</Text>
              </View>
              <Text className="text-gray-700 dark:text-slate-300 text-sm mb-3">
                {AI_AGENTS.filter(a => a.status === 'active').length} active agents costing £
                {aiSpend}/month
              </Text>
              <View className="flex-row gap-2">
                <View className="bg-blue-500/20 px-3 py-1 rounded-lg">
                  <Text className="text-blue-300 text-xs">
                    {AI_AGENTS.filter(a => a.provider === 'OpenAI').length} OpenAI
                  </Text>
                </View>
                <View className="bg-purple-500/20 px-3 py-1 rounded-lg">
                  <Text className="text-purple-300 text-xs">
                    {AI_AGENTS.filter(a => a.provider === 'Anthropic').length} Anthropic
                  </Text>
                </View>
                <View className="bg-emerald-500/20 px-3 py-1 rounded-lg">
                  <Text className="text-emerald-300 text-xs">
                    {AI_AGENTS.filter(a => a.provider === 'Google').length} Google
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">
              AI Agents Directory ({AI_AGENTS.length})
            </Text>

            {AI_AGENTS.sort((a, b) => b.costPerMonth - a.costPerMonth).map(agent => {
              const providerColors: Record<string, string> = {
                OpenAI: 'bg-blue-500/20 text-blue-400',
                Anthropic: 'bg-purple-500/20 text-purple-400',
                Google: 'bg-emerald-500/20 text-emerald-400',
                ElevenLabs: 'bg-orange-500/20 text-orange-400',
                Vibecode: 'bg-pink-500/20 text-pink-400',
                Other: 'bg-slate-500/20 text-gray-600 dark:text-slate-400',
              };

              const providerColor = providerColors[agent.provider] || providerColors.Other;

              const statusColor = agent.status === 'active' ? 'text-emerald-400' : 'text-gray-600 dark:text-slate-400';

              return (
                <Pressable
                  key={agent.id}
                  onPress={() => setSelectedAI(agent)}
                  className="bg-gray-100 dark:bg-slate-900 rounded-2xl p-4 border border-gray-300 dark:border-slate-800 mb-3 active:opacity-70"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">{agent.name}</Text>
                      <View className="flex-row items-center gap-2">
                        <View className={`px-2 py-0.5 rounded ${providerColor}`}>
                          <Text className={`text-xs font-semibold ${providerColor}`}>{agent.provider}</Text>
                        </View>
                        <Text className={`text-xs font-semibold capitalize ${statusColor}`}>
                          {agent.status}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-blue-400 text-lg font-bold">
                        £{agent.costPerMonth}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">/month</Text>
                    </View>
                  </View>

                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                    {agent.purpose}
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">
                      {agent.model}
                    </Text>
                    <ChevronRight size={16} color="#64748b" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Supplier Detail Modal */}
      <Modal visible={selectedSupplier !== null} transparent animationType="slide" onRequestClose={() => setSelectedSupplier(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          {selectedSupplier && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%', minHeight: '60%' }}>
              {/* Fixed Header */}
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">{selectedSupplier.supplierName}</Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">{selectedSupplier.projectName}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedSupplier(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              {/* Scrollable Content */}
              <ScrollView showsVerticalScrollIndicator={true} bounces={false} className="flex-1">
                <View className="px-6 py-4">
                  <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600 dark:text-slate-400">Total Cost:</Text>
                      <Text className="text-emerald-400 text-xl font-bold">
                        £{selectedSupplier.totalCost.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600 dark:text-slate-400">Paid to Date:</Text>
                      <Text className="text-blue-400 text-lg font-bold">
                        £{selectedSupplier.paidToDate.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 dark:text-slate-400">Outstanding:</Text>
                      <Text className="text-orange-400 text-lg font-bold">
                        £{(selectedSupplier.totalCost - selectedSupplier.paidToDate).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Description</Text>
                    <Text className="text-gray-900 dark:text-white">{selectedSupplier.description}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Timeline</Text>
                    <Text className="text-gray-900 dark:text-white">
                      Start: {new Date(selectedSupplier.startDate).toLocaleDateString()}
                    </Text>
                    <Text className="text-gray-900 dark:text-white">
                      Delivery: {new Date(selectedSupplier.deliveryDate).toLocaleDateString()}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Contact</Text>
                    <Text className="text-gray-900 dark:text-white">{selectedSupplier.contactPerson}</Text>
                    <Text className="text-blue-400 text-sm">{selectedSupplier.contactEmail}</Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">{selectedSupplier.contactPhone}</Text>
                  </View>

                  {selectedSupplier.notes && (
                    <View className="mb-4">
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Notes</Text>
                      <Text className="text-gray-900 dark:text-white">{selectedSupplier.notes}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* AI Agent Detail Modal */}
      <Modal visible={selectedAI !== null} transparent animationType="slide" onRequestClose={() => setSelectedAI(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          {selectedAI && (
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%', minHeight: '60%' }}>
              {/* Fixed Header */}
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold flex-1">{selectedAI.name}</Text>
                  <Pressable onPress={() => setSelectedAI(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-blue-400 text-sm">{selectedAI.provider}</Text>
                  <Text className="text-gray-600 dark:text-slate-500">•</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">{selectedAI.model}</Text>
                </View>
              </View>

              {/* Scrollable Content */}
              <ScrollView showsVerticalScrollIndicator={true} bounces={false} className="flex-1">
                <View className="px-6 py-4">
                  <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 dark:text-slate-400">Monthly Cost:</Text>
                      <Text className="text-blue-400 text-xl font-bold">
                        £{selectedAI.costPerMonth}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-1">Purpose</Text>
                    <Text className="text-gray-900 dark:text-white">{selectedAI.purpose}</Text>
                  </View>

                  {selectedAI.website && (
                    <View className="mb-4">
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Website</Text>
                      <Pressable
                        onPress={() => Linking.openURL(selectedAI.website!)}
                        className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex-row items-center active:opacity-70"
                      >
                        <Globe size={18} color="#3b82f6" />
                        <Text className="text-blue-400 ml-2 flex-1" numberOfLines={1}>
                          {selectedAI.website}
                        </Text>
                        <ChevronRight size={18} color="#3b82f6" />
                      </Pressable>
                    </View>
                  )}

                  {selectedAI.usedBy && selectedAI.usedBy.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-2">Used By Team</Text>
                      <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-3">
                        <View className="gap-2">
                          {selectedAI.usedBy.map((userId, idx) => {
                            const member = ORGANIZATION_MEMBERS.find(m => m.id === userId);
                            if (!member) return null;

                            const getRoleColor = (role: string) => {
                              switch (role) {
                                case 'Founder': return 'text-blue-400';
                                case 'FractionalExec': return 'text-purple-400';
                                case 'Apprentice': return 'text-emerald-400';
                                default: return 'text-gray-600 dark:text-slate-400';
                              }
                            };

                            return (
                              <View key={idx} className="flex-row items-center justify-between">
                                <Text className="text-gray-900 dark:text-white">{member.name}</Text>
                                <Text className={`text-xs ${getRoleColor(member.role)}`}>
                                  {member.role === 'FractionalExec' ? 'Executive' : member.role}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  )}

                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Capabilities</Text>
                    {selectedAI.capabilities.map((cap, idx) => (
                      <View key={idx} className="flex-row items-start mb-2">
                        <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 2 }} />
                        <Text className="text-gray-700 dark:text-slate-300 ml-2 flex-1">{cap}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Functions</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAI.functions.map((func, idx) => (
                        <View key={idx} className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                          <Text className="text-blue-400 text-sm">{func}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">Integrations</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAI.integrations.map((integration, idx) => (
                        <View key={idx} className="bg-gray-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                          <Text className="text-gray-700 dark:text-slate-300 text-sm">{integration}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {selectedAI.usageStats && (
                    <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <Text className="text-gray-900 dark:text-white font-semibold mb-3">Usage Statistics</Text>
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-600 dark:text-slate-400">Requests This Month:</Text>
                        <Text className="text-gray-900 dark:text-white font-semibold">
                          {selectedAI.usageStats.requestsThisMonth.toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-600 dark:text-slate-400">Avg Response Time:</Text>
                        <Text className="text-gray-900 dark:text-white font-semibold">
                          {selectedAI.usageStats.averageResponseTime}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600 dark:text-slate-400">Success Rate:</Text>
                        <Text className="text-emerald-400 font-semibold">
                          {selectedAI.usageStats.successRate}%
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">
                      Added: {new Date(selectedAI.addedDate).toLocaleDateString()}
                    </Text>
                    {selectedAI.lastUsed && (
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">
                        Last used: {new Date(selectedAI.lastUsed).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
