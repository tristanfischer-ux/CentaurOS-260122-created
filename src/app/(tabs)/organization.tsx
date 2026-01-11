import { View, Text, ScrollView, Pressable, Modal, Linking } from 'react-native';
import { useState } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
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
  ChevronDown,
  ChevronRight,
  Sparkles,
  MapPin,
  Map,
} from 'lucide-react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import {
  ORGANIZATION_MEMBERS,
  SUPPLIER_ENGAGEMENTS,
  AI_AGENTS,
  getTotalAISpend,
  getTotalSupplierSpend,
  type OrganizationMember,
  type SupplierEngagement,
  type AIAgent,
} from '@/lib/organization-seed';

type OrgTab = 'structure' | 'suppliers' | 'ai';

export default function OrganizationScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  const [activeTab, setActiveTab] = useState<OrgTab>('structure');
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierEngagement | null>(null);
  const [selectedAI, setSelectedAI] = useState<AIAgent | null>(null);
  const [expandedExecs, setExpandedExecs] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);

  // Only founders can view this
  const canView = currentMembership?.role === 'Founder';

  if (!canView) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <Building2 size={64} color="#475569" />
        <Text className="text-white text-xl font-semibold mt-4 mb-2">
          Founder Access Only
        </Text>
        <Text className="text-slate-400 text-center">
          Organization structure is only visible to founders
        </Text>
      </View>
    );
  }

  const toggleExecExpansion = (execId: string) => {
    setExpandedExecs(prev =>
      prev.includes(execId) ? prev.filter(id => id !== execId) : [...prev, execId]
    );
  };

  const founders = ORGANIZATION_MEMBERS.filter(m => m.role === 'Founder');
  const execs = ORGANIZATION_MEMBERS.filter(m => m.role === 'FractionalExec');
  const apprentices = ORGANIZATION_MEMBERS.filter(m => m.role === 'Apprentice');

  const getReports = (managerId: string) => {
    return ORGANIZATION_MEMBERS.filter(m => m.reportsTo === managerId);
  };

  const supplierSpend = getTotalSupplierSpend();
  const aiSpend = getTotalAISpend();

  const tabs: { value: OrgTab; label: string; icon: any }[] = [
    { value: 'structure', label: 'Structure', icon: Users },
    { value: 'suppliers', label: 'Suppliers', icon: Package },
    { value: 'ai', label: 'AI Agents', icon: Cpu },
  ];

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header with stats */}
      <View className="p-6 pb-4">
        <Text className="text-white text-2xl font-bold mb-1">Organization</Text>
        <Text className="text-slate-400 text-sm mb-4">
          Complete operational overview
        </Text>

        {/* Key Metrics */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-slate-900 rounded-xl p-3 border border-slate-800">
            <Text className="text-slate-400 text-xs mb-1">Team</Text>
            <Text className="text-white text-xl font-bold">{ORGANIZATION_MEMBERS.length}</Text>
            <Text className="text-slate-500 text-[10px] mt-0.5">
              {founders.length}F • {execs.length}E • {apprentices.length}A
            </Text>
          </View>

          <View className="flex-1 bg-slate-900 rounded-xl p-3 border border-slate-800">
            <Text className="text-slate-400 text-xs mb-1">Suppliers</Text>
            <Text className="text-emerald-400 text-xl font-bold">
              £{(supplierSpend.total / 1000).toFixed(0)}k
            </Text>
            <Text className="text-slate-500 text-[10px] mt-0.5">
              £{(supplierSpend.paid / 1000).toFixed(0)}k paid
            </Text>
          </View>

          <View className="flex-1 bg-slate-900 rounded-xl p-3 border border-slate-800">
            <Text className="text-slate-400 text-xs mb-1">AI/Month</Text>
            <Text className="text-blue-400 text-xl font-bold">
              £{aiSpend.toLocaleString()}
            </Text>
            <Text className="text-slate-500 text-[10px] mt-0.5">
              {AI_AGENTS.filter(a => a.status === 'active').length} active
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-6 pb-3">
        <View className="flex-row gap-2">
          {tabs.map(tab => (
            <Pressable
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              className={`flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2 ${
                activeTab === tab.value ? 'bg-blue-500' : 'bg-slate-900 border border-slate-800'
              }`}
            >
              <tab.icon
                size={16}
                color={activeTab === tab.value ? '#fff' : '#94a3b8'}
              />
              <Text
                className={`font-semibold text-sm ${
                  activeTab === tab.value ? 'text-white' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Organization Structure Tab */}
        {activeTab === 'structure' && (
          <View className="px-6 pb-6">
            {/* Founders Level */}
            <Text className="text-white text-base font-semibold mb-3">Founders</Text>
            {founders.map(founder => (
              <View key={founder.id} className="mb-4">
                <Pressable
                  onPress={() => setSelectedMember(founder)}
                  className="bg-gradient-to-r from-purple-900/40 to-purple-800/40 rounded-2xl p-4 border border-purple-700/50 mb-2 active:opacity-80"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base mb-1">
                        {founder.name}
                      </Text>
                      <Text className="text-purple-300 text-xs">{founder.function}</Text>
                    </View>
                    <View className="bg-purple-500/30 px-3 py-1 rounded-lg">
                      <Text className="text-purple-200 text-xs font-semibold">FOUNDER</Text>
                    </View>
                  </View>
                </Pressable>

                {/* Executives reporting to this founder */}
                {getReports(founder.id).filter(m => m.role === 'FractionalExec').map(exec => (
                  <View key={exec.id} className="ml-4 mb-2">
                    <View className="flex-row items-start">
                      <View className="w-8 h-8 items-center mt-2">
                        <View className="w-px h-4 bg-slate-700 mb-1" />
                        <View className="w-4 h-px bg-slate-700" />
                      </View>

                      <View className="flex-1">
                        <Pressable
                          onPress={() => toggleExecExpansion(exec.id)}
                          className="bg-slate-900 rounded-xl p-3 border border-slate-800 mb-2 active:opacity-80"
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <Text className="text-white font-semibold text-sm mb-1">
                                {exec.name}
                              </Text>
                              <Text className="text-blue-400 text-xs mb-1">
                                {exec.function} • £{exec.costPerDay}/day
                              </Text>
                              <Text className="text-slate-500 text-[10px]">
                                Managing {getReports(exec.id).length} apprentices
                              </Text>
                            </View>
                            {expandedExecs.includes(exec.id) ? (
                              <ChevronDown size={20} color="#94a3b8" />
                            ) : (
                              <ChevronRight size={20} color="#94a3b8" />
                            )}
                          </View>
                        </Pressable>

                        {/* Apprentices reporting to this exec */}
                        {expandedExecs.includes(exec.id) &&
                          getReports(exec.id).map(apprentice => (
                            <View key={apprentice.id} className="ml-4 mb-2">
                              <View className="flex-row items-start">
                                <View className="w-6 h-6 items-center mt-1.5">
                                  <View className="w-px h-3 bg-slate-700 mb-0.5" />
                                  <View className="w-3 h-px bg-slate-700" />
                                </View>

                                <Pressable
                                  onPress={() => setSelectedMember(apprentice)}
                                  className="flex-1 bg-slate-800 rounded-lg p-3 border border-slate-700 active:opacity-80"
                                >
                                  <Text className="text-white text-sm font-medium mb-0.5">
                                    {apprentice.name}
                                  </Text>
                                  <Text className="text-emerald-400 text-xs">
                                    {apprentice.function} • £{apprentice.costPerDay}/day
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <View className="px-6 pb-6">
            <View className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-4">
              <Text className="text-white font-semibold mb-2">Financial Summary</Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400 text-sm">Total Committed:</Text>
                <Text className="text-white font-semibold">
                  £{supplierSpend.total.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400 text-sm">Paid to Date:</Text>
                <Text className="text-emerald-400 font-semibold">
                  £{supplierSpend.paid.toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-sm">Remaining:</Text>
                <Text className="text-orange-400 font-semibold">
                  £{supplierSpend.remaining.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Map View Button */}
            <Pressable
              onPress={() => setShowMap(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 mb-4 flex-row items-center justify-between active:opacity-80"
            >
              <View className="flex-row items-center gap-2">
                <Map size={20} color="#fff" />
                <Text className="text-white font-semibold">View Supplier Locations</Text>
              </View>
              <ChevronRight size={20} color="#fff" />
            </Pressable>

            <Text className="text-white text-base font-semibold mb-3">
              Active Engagements ({SUPPLIER_ENGAGEMENTS.length})
            </Text>

            {SUPPLIER_ENGAGEMENTS.map(engagement => {
              const assignedPerson = ORGANIZATION_MEMBERS.find(
                m => m.id === engagement.assignedTo
              );
              const statusColors = {
                planning: 'bg-slate-500',
                in_progress: 'bg-blue-500',
                delivered: 'bg-emerald-500',
                cancelled: 'bg-red-500',
              };
              const statusIcons = {
                planning: Clock,
                in_progress: TrendingUp,
                delivered: CheckCircle2,
                cancelled: AlertCircle,
              };
              const StatusIcon = statusIcons[engagement.status];

              return (
                <Pressable
                  key={engagement.id}
                  onPress={() => setSelectedSupplier(engagement)}
                  className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-3 active:opacity-80"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base mb-1">
                        {engagement.projectName}
                      </Text>
                      <Text className="text-slate-400 text-sm mb-2">
                        {engagement.supplierName}
                      </Text>
                    </View>
                    <View
                      className={`${statusColors[engagement.status]} px-2 py-1 rounded-lg flex-row items-center gap-1`}
                    >
                      <StatusIcon size={12} color="#fff" />
                      <Text className="text-white text-[10px] font-semibold uppercase">
                        {engagement.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-slate-300 text-sm mb-3" numberOfLines={2}>
                    {engagement.description}
                  </Text>

                  <View className="flex-row gap-3 mb-3">
                    <View className="flex-1 bg-slate-800 rounded-lg p-2">
                      <Text className="text-slate-400 text-[10px] mb-0.5">Cost</Text>
                      <Text className="text-white text-sm font-semibold">
                        £{engagement.totalCost.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-1 bg-slate-800 rounded-lg p-2">
                      <Text className="text-slate-400 text-[10px] mb-0.5">Paid</Text>
                      <Text className="text-emerald-400 text-sm font-semibold">
                        £{engagement.paidToDate.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-1 bg-slate-800 rounded-lg p-2">
                      <Text className="text-slate-400 text-[10px] mb-0.5">Delivery</Text>
                      <Text className="text-blue-400 text-sm font-semibold">
                        {new Date(engagement.deliveryDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-slate-400 text-xs">Managed by: </Text>
                      <Text className="text-blue-400 text-xs font-medium">
                        {assignedPerson?.name}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#64748b" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* AI Agents Tab */}
        {activeTab === 'ai' && (
          <View className="px-6 pb-6">
            <View className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-4 border border-blue-700/50 mb-4">
              <View className="flex-row items-center mb-2">
                <Sparkles size={20} color="#60a5fa" />
                <Text className="text-white font-semibold ml-2">AI Infrastructure</Text>
              </View>
              <Text className="text-slate-300 text-sm mb-3">
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

            <Text className="text-white text-base font-semibold mb-3">
              AI Agents Directory ({AI_AGENTS.length})
            </Text>

            {AI_AGENTS.sort((a, b) => b.costPerMonth - a.costPerMonth).map(agent => {
              const providerColors: Record<string, string> = {
                OpenAI: 'bg-blue-500/20 text-blue-400',
                Anthropic: 'bg-purple-500/20 text-purple-400',
                Google: 'bg-emerald-500/20 text-emerald-400',
                ElevenLabs: 'bg-orange-500/20 text-orange-400',
                Vibecode: 'bg-pink-500/20 text-pink-400',
                Other: 'bg-slate-500/20 text-slate-400',
              };
              const statusColors = {
                active: 'bg-emerald-500',
                trial: 'bg-yellow-500',
                inactive: 'bg-slate-500',
              };

              return (
                <Pressable
                  key={agent.id}
                  onPress={() => setSelectedAI(agent)}
                  className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-3 active:opacity-80"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base mb-1">{agent.name}</Text>
                      <View className="flex-row items-center gap-2 mb-2">
                        <View className={`${providerColors[agent.provider]} px-2 py-1 rounded`}>
                          <Text className="text-xs font-medium">{agent.provider}</Text>
                        </View>
                        <View className={`${statusColors[agent.status]} w-2 h-2 rounded-full`} />
                      </View>
                    </View>
                    <View className="bg-slate-800 px-3 py-1 rounded-lg">
                      <Text className="text-blue-400 text-sm font-bold">
                        £{agent.costPerMonth}/mo
                      </Text>
                    </View>
                  </View>

                  <Text className="text-slate-300 text-sm mb-3">{agent.purpose}</Text>

                  <View className="flex-row flex-wrap gap-1 mb-3">
                    {agent.functions.slice(0, 3).map((func, idx) => (
                      <View key={idx} className="bg-slate-800 px-2 py-1 rounded">
                        <Text className="text-slate-400 text-[10px]">{func}</Text>
                      </View>
                    ))}
                  </View>

                  {agent.usageStats && (
                    <View className="flex-row gap-2 mb-3">
                      <View className="flex-1 bg-slate-800 rounded-lg p-2">
                        <Text className="text-slate-400 text-[10px] mb-0.5">Requests</Text>
                        <Text className="text-white text-xs font-semibold">
                          {agent.usageStats.requestsThisMonth.toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-1 bg-slate-800 rounded-lg p-2">
                        <Text className="text-slate-400 text-[10px] mb-0.5">Avg Time</Text>
                        <Text className="text-white text-xs font-semibold">
                          {agent.usageStats.averageResponseTime}
                        </Text>
                      </View>
                      <View className="flex-1 bg-slate-800 rounded-lg p-2">
                        <Text className="text-slate-400 text-[10px] mb-0.5">Success</Text>
                        <Text className="text-emerald-400 text-xs font-semibold">
                          {agent.usageStats.successRate}%
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-400 text-xs">
                      Used by {Array.isArray(agent.usedBy) ? agent.usedBy.length : 'all'} team{' '}
                      members
                    </Text>
                    <ChevronRight size={16} color="#64748b" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Member Detail Modal */}
      <Modal visible={selectedMember !== null} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center px-6">
          {selectedMember && (
            <View className="bg-slate-900 rounded-3xl p-6" style={{ maxHeight: '80%' }}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">{selectedMember.name}</Text>
                  <Pressable onPress={() => setSelectedMember(null)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>

                <View className="bg-slate-800 rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-400 text-sm">Role:</Text>
                    <Text className="text-white font-semibold">{selectedMember.role}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-400 text-sm">Function:</Text>
                    <Text className="text-white font-semibold">{selectedMember.function}</Text>
                  </View>
                  {selectedMember.costPerDay && (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-slate-400 text-sm">Cost:</Text>
                      <Text className="text-emerald-400 font-semibold">
                        £{selectedMember.costPerDay}/day
                      </Text>
                    </View>
                  )}
                  <View className="flex-row justify-between">
                    <Text className="text-slate-400 text-sm">Started:</Text>
                    <Text className="text-white font-semibold">
                      {new Date(selectedMember.startDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {selectedMember.reportsTo && (
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Reports To:</Text>
                    <Text className="text-blue-400 font-semibold">
                      {ORGANIZATION_MEMBERS.find(m => m.id === selectedMember.reportsTo)?.name}
                    </Text>
                  </View>
                )}

                {selectedMember.manages && selectedMember.manages.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Manages:</Text>
                    {selectedMember.manages.map(managedId => {
                      const managed = ORGANIZATION_MEMBERS.find(m => m.id === managedId);
                      return (
                        <Text key={managedId} className="text-white mb-1">
                          • {managed?.name} ({managed?.function})
                        </Text>
                      );
                    })}
                  </View>
                )}

                <View className="gap-3">
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${selectedMember.email}`)}
                    className="bg-blue-500 py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
                  >
                    <Mail size={18} color="#fff" />
                    <Text className="text-white font-semibold">Email</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${selectedMember.phone}`)}
                    className="bg-emerald-500 py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
                  >
                    <Phone size={18} color="#fff" />
                    <Text className="text-white font-semibold">Call</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Supplier Detail Modal */}
      <Modal visible={selectedSupplier !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
            {selectedSupplier && (
              <>
                <View className="p-6 border-b border-slate-800">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white text-xl font-bold flex-1">
                      {selectedSupplier.projectName}
                    </Text>
                    <Pressable onPress={() => setSelectedSupplier(null)}>
                      <X size={24} color="#94a3b8" />
                    </Pressable>
                  </View>
                  <Text className="text-blue-400 text-sm">{selectedSupplier.supplierName}</Text>
                </View>

                <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-1">Description</Text>
                    <Text className="text-white">{selectedSupplier.description}</Text>
                  </View>

                  <View className="bg-slate-800 rounded-xl p-4 mb-4">
                    <Text className="text-white font-semibold mb-3">Financial Details</Text>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-slate-400">Total Cost:</Text>
                      <Text className="text-white font-semibold">
                        £{selectedSupplier.totalCost.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-slate-400">Paid to Date:</Text>
                      <Text className="text-emerald-400 font-semibold">
                        £{selectedSupplier.paidToDate.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-400">Remaining:</Text>
                      <Text className="text-orange-400 font-semibold">
                        £{(selectedSupplier.totalCost - selectedSupplier.paidToDate).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-white font-semibold mb-2">Timeline</Text>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-slate-400">Start Date:</Text>
                      <Text className="text-white">
                        {new Date(selectedSupplier.startDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-slate-400">Delivery Date:</Text>
                      <Text className="text-white">
                        {new Date(selectedSupplier.deliveryDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-white font-semibold mb-2">Tasks</Text>
                    {selectedSupplier.tasks.map((task, idx) => (
                      <View key={idx} className="flex-row items-start mb-2">
                        <View className="w-5 h-5 bg-slate-700 rounded-full items-center justify-center mr-2 mt-0.5">
                          <Text className="text-slate-400 text-xs">{idx + 1}</Text>
                        </View>
                        <Text className="text-slate-300 flex-1">{task}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="mb-4">
                    <Text className="text-white font-semibold mb-2">Contact</Text>
                    <Text className="text-slate-300 mb-1">{selectedSupplier.contactPerson}</Text>
                    <Pressable
                      onPress={() => Linking.openURL(`mailto:${selectedSupplier.contactEmail}`)}
                    >
                      <Text className="text-blue-400 mb-1">{selectedSupplier.contactEmail}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${selectedSupplier.contactPhone}`)}
                    >
                      <Text className="text-blue-400">{selectedSupplier.contactPhone}</Text>
                    </Pressable>
                  </View>

                  {selectedSupplier.notes && (
                    <View className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4 mb-4">
                      <Text className="text-blue-300 text-sm">{selectedSupplier.notes}</Text>
                    </View>
                  )}

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm">Managed by:</Text>
                    <Text className="text-white font-semibold">
                      {
                        ORGANIZATION_MEMBERS.find(m => m.id === selectedSupplier.assignedTo)
                          ?.name
                      }
                    </Text>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* AI Agent Detail Modal */}
      <Modal visible={selectedAI !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
            {selectedAI && (
              <>
                <View className="p-6 border-b border-slate-800">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white text-xl font-bold flex-1">{selectedAI.name}</Text>
                    <Pressable onPress={() => setSelectedAI(null)}>
                      <X size={24} color="#94a3b8" />
                    </Pressable>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-blue-400 text-sm">{selectedAI.provider}</Text>
                    <Text className="text-slate-500">•</Text>
                    <Text className="text-slate-400 text-sm">{selectedAI.model}</Text>
                  </View>
                </View>

                <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
                  <View className="bg-slate-800 rounded-xl p-4 mb-4">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-slate-400">Monthly Cost:</Text>
                      <Text className="text-blue-400 text-xl font-bold">
                        £{selectedAI.costPerMonth}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-1">Purpose</Text>
                    <Text className="text-white">{selectedAI.purpose}</Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-white font-semibold mb-2">Capabilities</Text>
                    {selectedAI.capabilities.map((cap, idx) => (
                      <View key={idx} className="flex-row items-start mb-2">
                        <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 2 }} />
                        <Text className="text-slate-300 ml-2 flex-1">{cap}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="mb-4">
                    <Text className="text-white font-semibold mb-2">Functions</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAI.functions.map((func, idx) => (
                        <View key={idx} className="bg-blue-500/20 px-3 py-1.5 rounded-lg">
                          <Text className="text-blue-400 text-sm">{func}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-white font-semibold mb-2">Integrations</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedAI.integrations.map((integration, idx) => (
                        <View key={idx} className="bg-slate-800 px-3 py-1.5 rounded-lg">
                          <Text className="text-slate-300 text-sm">{integration}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {selectedAI.usageStats && (
                    <View className="bg-slate-800 rounded-xl p-4 mb-4">
                      <Text className="text-white font-semibold mb-3">Usage Statistics</Text>
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-400">Requests This Month:</Text>
                        <Text className="text-white font-semibold">
                          {selectedAI.usageStats.requestsThisMonth.toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-400">Avg Response Time:</Text>
                        <Text className="text-white font-semibold">
                          {selectedAI.usageStats.averageResponseTime}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-slate-400">Success Rate:</Text>
                        <Text className="text-emerald-400 font-semibold">
                          {selectedAI.usageStats.successRate}%
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm">
                      Added: {new Date(selectedAI.addedDate).toLocaleDateString()}
                    </Text>
                    {selectedAI.lastUsed && (
                      <Text className="text-slate-400 text-sm">
                        Last used: {new Date(selectedAI.lastUsed).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Supplier Map Modal */}
      <Modal visible={showMap} transparent animationType="slide">
        <View className="flex-1 bg-slate-950">
          {/* Map Header */}
          <View className="p-6 pb-4 border-b border-slate-800">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-xl font-bold mb-1">Supplier Locations</Text>
                <Text className="text-slate-400 text-sm">{SUPPLIER_ENGAGEMENTS.length} active engagements across UK</Text>
              </View>
              <Pressable onPress={() => setShowMap(false)} className="w-10 h-10 items-center justify-center">
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>
          </View>

          {/* Map View */}
          <MapView
            provider={PROVIDER_DEFAULT}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: 52.5,
              longitude: -1.5,
              latitudeDelta: 4,
              longitudeDelta: 4,
            }}
          >
            {SUPPLIER_ENGAGEMENTS.map(engagement => (
              <Marker
                key={engagement.id}
                coordinate={{
                  latitude: engagement.location.latitude,
                  longitude: engagement.location.longitude,
                }}
                title={engagement.supplierName}
                description={`${engagement.projectName} - £${(engagement.totalCost / 1000).toFixed(0)}k`}
                onCalloutPress={() => {
                  setShowMap(false);
                  setSelectedSupplier(engagement);
                }}
              >
                <View className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center border-2 border-white">
                  <Package size={20} color="white" />
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Map Legend */}
          <View className="absolute bottom-6 left-6 right-6 bg-slate-900/95 rounded-2xl p-4 border border-slate-800">
            <Text className="text-white font-semibold mb-2">Locations</Text>
            {SUPPLIER_ENGAGEMENTS.map((engagement, idx) => (
              <Pressable
                key={engagement.id}
                onPress={() => {
                  setShowMap(false);
                  setSelectedSupplier(engagement);
                }}
                className="flex-row items-center justify-between py-2 active:opacity-70"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  <Text className="text-white text-sm flex-1" numberOfLines={1}>
                    {engagement.supplierName}
                  </Text>
                </View>
                <Text className="text-slate-400 text-xs">{engagement.location.city}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}
