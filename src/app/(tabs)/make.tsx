import { View, Text, ScrollView, Pressable, Modal, Linking, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Star,
  Target,
  FileText,
  RefreshCw,
  HelpCircle,
  User,
  Trash2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCurrentMembership, useCurrentWorkspace, useCurrentUser } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useArmoryStore } from '@/lib/state/armory-store';
import type { SupplierEngagement, AIAgent } from '@/lib/organization-seed';
import { TabDescription } from '@/components/TabDescription';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { useResourceOwnershipStore, initializeDemoOwnerships, type ResourceOwnership } from '@/lib/state/resource-ownership-store';
import { ApprovalHistoryModal } from '@/components/ApprovalHistoryModal';

const MAKE_HELP: HelpContent = {
  title: 'Orchestration Center',
  subtitle: 'Supply chain & engagements',
  description: 'The Make tab is your supply chain orchestration command center. You do NOT manufacture—you orchestrate outsourced work with suppliers. Track engagements from Quote → PO → Production → QC → Shipment → Delivery → ACCEPTANCE. "Done" means Accepted with evidence, NOT just shipped. Goods may ship to other suppliers or customers (multi-hop logistics).',
  tips: [
    'CRITICAL: An engagement is only complete when Accepted with evidence (POD, photos, inspection reports)—not when shipped',
    'Track milestone progress with weights—Production Complete (20%), QC Passed (15%), Delivered (3%), Accepted (2%)',
    'Monitor Cash at Risk: value that\'s late, disputed, blocked, or at-risk and not yet accepted',
    'Multi-hop shipments are common: Supplier A → Supplier B → Customer. Track each leg separately.',
    'Use AI agents to save TU: RFQ Bot, Quote Normaliser, Expeditor, QC Gatekeeper, Invoice Matcher',
    'Review acceptance gates: ensure required evidence is collected before marking engagements complete',
    'Disputed or Blocked engagements need immediate attention—they tie up cash and delay downstream work',
  ],
  quickActions: [
    { label: 'Value Delivered', description: '£ of engagements Accepted this month—the true "done" metric, not shipped value' },
    { label: 'Value In Flight', description: '£ issued via PO but not yet accepted—track progress via milestones' },
    { label: 'Cash at Risk', description: '£ in late, disputed, blocked, or at-risk engagements—requires urgent action' },
    { label: 'Engagement Details', description: 'Tap engagement to view milestones, shipment legs, acceptance status, and evidence' },
    { label: 'AI Agents', description: 'Activate orchestration AI agents to automate RFQs, normalize quotes, expedite, gate QC, and match invoices' },
    { label: 'Supplier Scorecard', description: 'View supplier quality %, on-time %, acceptance pass rate, and dispute rate to inform future sourcing' },
  ],
};

// Initialize organization store once
if (useOrganizationStore.getState().members.length === 0) {
  useOrganizationStore.getState().initializeOrganization();
}

type MakeTab = 'suppliers' | 'ai';

export default function MakeScreen() {
  const insets = useSafeAreaInsets();
  const currentMembership = useCurrentMembership();
  const currentWorkspace = useCurrentWorkspace();
  const currentUser = useCurrentUser();
  const params = useLocalSearchParams();

  // Use centralized organization store
  const aiAgents = useOrganizationStore((s) => s.aiAgents);
  const supplierEngagements = useOrganizationStore((s) => s.supplierEngagements);
  const members = useOrganizationStore((s) => s.members);
  const getTotalAISpend = useOrganizationStore((s) => s.getTotalAISpend);
  const getTotalSupplierSpend = useOrganizationStore((s) => s.getTotalSupplierSpend);
  const updateSupplierEngagement = useOrganizationStore((s) => s.updateSupplierEngagement);
  const deleteAIAgent = useOrganizationStore((s) => s.deleteAIAgent);

  // Work plan store for task linkage
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // Armory store for AI tool usage
  const getMembersUsingAITool = useArmoryStore(s => s.getMembersUsingAITool);
  const removeAIToolFromAllLoadouts = useArmoryStore(s => s.removeAIToolFromAllLoadouts);

  // Ownership store
  const getOwnershipsForUser = useResourceOwnershipStore(s => s.getOwnershipsForUser);
  const getOwnershipByResource = useResourceOwnershipStore(s => s.getOwnershipByResource);

  const [activeTab, setActiveTab] = useState<MakeTab>('suppliers');
  const [showHelp, setShowHelp] = useState(false);

  // Initialize ownership data once
  useEffect(() => {
    if (currentWorkspace) {
      initializeDemoOwnerships(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  // Handle tab parameter from navigation
  useEffect(() => {
    if (params.tab === 'ai') {
      setActiveTab('ai');
    }
  }, [params.tab]);

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierEngagement | null>(null);
  const [selectedAI, setSelectedAI] = useState<AIAgent | null>(null);
  const [selectedOwnership, setSelectedOwnership] = useState<ResourceOwnership | null>(null);
  const [showApprovalHistory, setShowApprovalHistory] = useState(false);
  const [showPersonPicker, setShowPersonPicker] = useState(false);

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

  // Filter resources based on role (founder sees all, others see only their items)
  const visibleSuppliers = currentWorkspace && currentUser && currentMembership
    ? supplierEngagements.filter(supplier => {
        const ownership = getOwnershipByResource(currentWorkspace.id, supplier.id);
        if (currentMembership.role === 'Founder') {
          return true; // Founder sees everything
        }
        // Others only see what they own
        return ownership && ownership.ownerId === currentUser.id;
      })
    : supplierEngagements;

  const visibleAIAgents = currentWorkspace && currentUser && currentMembership
    ? aiAgents.filter(agent => {
        const ownership = getOwnershipByResource(currentWorkspace.id, agent.id);
        if (currentMembership.role === 'Founder') {
          return true; // Founder sees everything
        }
        // Others only see what they own
        return ownership && ownership.ownerId === currentUser.id;
      })
    : aiAgents;

  // Helper to get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder':
        return 'bg-purple-500';
      case 'FractionalExec':
        return 'bg-blue-500';
      case 'Apprentice':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Handle owner click
  const handleOwnerClick = (ownership: ResourceOwnership) => {
    setSelectedOwnership(ownership);
    setShowApprovalHistory(true);
  };

  const handleDeleteAIAgent = async (aiAgentId: string, aiAgentName: string) => {
    Alert.alert(
      'Delete AI Agent',
      `Are you sure you want to delete "${aiAgentName}"? This will remove it from all team members who are currently using it.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Remove from all loadouts first
            await removeAIToolFromAllLoadouts(aiAgentId);
            // Then delete the agent
            deleteAIAgent(aiAgentId);
            // Close modal
            setSelectedAI(null);
          },
        },
      ]
    );
  };

  const tabs: { value: MakeTab; label: string; icon: any }[] = [
    { value: 'suppliers', label: 'Suppliers', icon: Package },
    { value: 'ai', label: 'AI Tools', icon: Cpu },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Approval History Modal */}
      <ApprovalHistoryModal
        visible={showApprovalHistory}
        onClose={() => {
          setShowApprovalHistory(false);
          setSelectedOwnership(null);
        }}
        ownership={selectedOwnership}
      />

      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={MAKE_HELP}
        gradientColors={['#10b981', '#059669']}
      />

      {/* Header - Matching Home Tab Style */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">OPERATIONS CENTER</Text>
            <Text className="text-white text-xl font-bold">Make</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <HelpButton onPress={() => setShowHelp(true)} />
            <Pressable
              onPress={() => setActiveTab('ai')}
              className="bg-white/20 px-3 py-2 rounded-xl active:opacity-70"
            >
              <Text className="text-white/80 text-xs font-medium">AI/MONTH</Text>
              <Text className="text-white text-lg font-bold">£{aiSpend.toLocaleString()}</Text>
            </Pressable>
          </View>
        </View>
        {/* Quick Health Indicators */}
        <View className="flex-row gap-4">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-1.5 bg-emerald-300" />
            <Text className="text-white/90 text-xs">£{(supplierSpend.total / 1000).toFixed(0)}k contracted</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-1.5 bg-white" />
            <Text className="text-white/90 text-xs">{aiAgents.filter(a => a.status === 'active').length} AI tools active</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Selector - Below Header */}
      <View className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <View className="flex-row bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setActiveTab(tab.value)}
                className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center active:opacity-70 ${
                  isActive ? 'bg-emerald-500' : ''
                }`}
              >
                <Icon
                  size={16}
                  color={isActive ? '#ffffff' : '#64748b'}
                  strokeWidth={2}
                />
                <Text
                  className={`text-sm ml-2 font-semibold ${
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
              Active Engagements ({visibleSuppliers.length})
            </Text>

            {visibleSuppliers.map((engagement) => {
              const statusColors: Record<string, string> = {
                active: 'bg-emerald-500 text-white',
                negotiating: 'bg-blue-500 text-white',
                completed: 'bg-gray-500 text-white',
                onHold: 'bg-orange-500 text-white',
              };

              const statusColor = statusColors[engagement.status] || statusColors.active;

              // Get ownership info for this supplier
              const ownership = currentWorkspace
                ? getOwnershipByResource(currentWorkspace.id, engagement.id)
                : null;

              // Get linked work plans
              const linkedWorkPlanIds = engagement.linkedWorkPlanIds || [];
              const linkedWorkPlans = workPlans.filter(wp => linkedWorkPlanIds.includes(wp.id));
              const linkedWorkPlan = linkedWorkPlans[0]; // Show first task for summary

              // Get team members from linked task
              const teamMembers = linkedWorkPlan?.assignedMemberIds
                ?.map(memberId => members.find(m => m.id === memberId))
                .filter(Boolean) || [];

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

                  {/* Linked Task Info */}
                  {linkedWorkPlan && (
                    <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs mb-0.5">
                            Linked Task
                          </Text>
                          <Text className="text-gray-900 dark:text-white text-sm font-semibold">
                            {linkedWorkPlan.title}
                          </Text>
                        </View>
                        <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                          <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                            {linkedWorkPlan.progress}%
                          </Text>
                        </View>
                      </View>

                      {/* Team Avatars */}
                      {teamMembers.length > 0 && (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs mr-1">
                            Team:
                          </Text>
                          {teamMembers.slice(0, 5).map((member: any) => (
                            <View
                              key={member.id}
                              className="w-5 h-5 rounded-full items-center justify-center"
                              style={{ backgroundColor: getRoleColor(member.role) === 'bg-purple-500' ? '#8b5cf6' : getRoleColor(member.role) === 'bg-blue-500' ? '#3b82f6' : '#10b981' }}
                            >
                              <Text className="text-white text-[8px] font-bold">
                                {member.name.split(' ').map((n: string) => n[0]).join('')}
                              </Text>
                            </View>
                          ))}
                          {teamMembers.length > 5 && (
                            <View className="w-5 h-5 rounded-full items-center justify-center bg-gray-400 dark:bg-slate-600">
                              <Text className="text-white text-[8px] font-bold">
                                +{teamMembers.length - 5}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Owner Badge */}
                  {ownership && (
                    <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800">
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOwnerClick(ownership);
                        }}
                        className="flex-row items-center active:opacity-70"
                      >
                        <View className={`w-6 h-6 ${getRoleColor(ownership.ownerRole)} rounded-full items-center justify-center`}>
                          <User size={14} color="#fff" />
                        </View>
                        <View className="ml-2 flex-1">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">
                            Managed by
                          </Text>
                          <Text className="text-gray-900 dark:text-white text-sm font-semibold">
                            {ownership.ownerName}
                          </Text>
                        </View>
                        <ChevronRight size={14} color="#9ca3af" />
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* AI Tools Tab */}
        {activeTab === 'ai' && (
          <View className="px-6 pb-6">
            <View className="rounded-xl overflow-hidden mb-4 border border-purple-200 dark:border-purple-800">
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center mb-2">
                  <Sparkles size={20} color="#fff" />
                  <Text className="text-white font-bold ml-2 text-base">AI Infrastructure</Text>
                </View>
                <Text className="text-white/90 text-sm mb-3">
                  {aiAgents.filter(a => a.status === 'active').length} active agents costing £
                  {aiSpend}/month
                </Text>
                <View className="flex-row gap-2 flex-wrap">
                  <View className="bg-white/20 px-3 py-1.5 rounded-lg">
                    <Text className="text-white text-xs font-semibold">
                      {aiAgents.filter(a => a.provider === 'OpenAI').length} OpenAI
                    </Text>
                  </View>
                  <View className="bg-white/20 px-3 py-1.5 rounded-lg">
                    <Text className="text-white text-xs font-semibold">
                      {aiAgents.filter(a => a.provider === 'Anthropic').length} Anthropic
                    </Text>
                  </View>
                  <View className="bg-white/20 px-3 py-1.5 rounded-lg">
                    <Text className="text-white text-xs font-semibold">
                      {aiAgents.filter(a => a.provider === 'Google').length} Google
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">
              AI Agents Directory ({visibleAIAgents.length})
            </Text>

            {visibleAIAgents.sort((a, b) => b.costPerMonth - a.costPerMonth).map(agent => {
              const providerColors: Record<string, string> = {
                OpenAI: 'bg-blue-500 text-white',
                Anthropic: 'bg-purple-500 text-white',
                Google: 'bg-emerald-500 text-white',
                ElevenLabs: 'bg-orange-500 text-white',
                Vibecode: 'bg-pink-500 text-white',
                Other: 'bg-slate-500 text-white',
              };

              const providerColor = providerColors[agent.provider] || providerColors.Other;
              const statusColor = agent.status === 'active' ? 'text-emerald-400' : 'text-gray-600 dark:text-slate-400';

              // Get members using this AI tool
              const memberIdsUsingTool = getMembersUsingAITool(agent.id);
              const membersUsingTool = memberIdsUsingTool
                .map(memberId => members.find(m => m.id === memberId))
                .filter(Boolean);

              // Get ownership info for this AI tool
              const ownership = currentWorkspace
                ? getOwnershipByResource(currentWorkspace.id, agent.id)
                : null;

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
                      <Text className="text-purple-500 dark:text-purple-400 text-lg font-bold">
                        £{agent.costPerMonth}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">/month</Text>
                    </View>
                  </View>

                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                    {agent.purpose}
                  </Text>

                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">
                      {agent.model}
                    </Text>
                    <ChevronRight size={16} color="#64748b" />
                  </View>

                  {/* Users using this AI tool - NEW */}
                  {membersUsingTool.length > 0 && (
                    <View className="flex-row items-center gap-1.5 flex-wrap mt-2">
                      <Text className="text-gray-500 dark:text-slate-400 text-xs mr-1">
                        Used by:
                      </Text>
                      {membersUsingTool.slice(0, 8).map((member: any) => (
                        <View
                          key={member.id}
                          className="w-6 h-6 rounded-full items-center justify-center"
                          style={{
                            backgroundColor:
                              member.role === 'Founder' ? '#8b5cf6' :
                              member.role === 'FractionalExec' ? '#3b82f6' : '#10b981'
                          }}
                        >
                          <Text className="text-white text-[9px] font-bold">
                            {member.name.split(' ').map((n: string) => n[0]).join('')}
                          </Text>
                        </View>
                      ))}
                      {membersUsingTool.length > 8 && (
                        <View className="w-6 h-6 rounded-full bg-gray-300 dark:bg-slate-700 items-center justify-center">
                          <Text className="text-gray-600 dark:text-slate-300 text-[9px] font-bold">
                            +{membersUsingTool.length - 8}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Owner Badge */}
                  {ownership && (
                    <View className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800">
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOwnerClick(ownership);
                        }}
                        className="flex-row items-center active:opacity-70"
                      >
                        <View className={`w-6 h-6 ${getRoleColor(ownership.ownerRole)} rounded-full items-center justify-center`}>
                          <User size={14} color="#fff" />
                        </View>
                        <View className="ml-2 flex-1">
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">
                            Managed by
                          </Text>
                          <Text className="text-gray-900 dark:text-white text-sm font-semibold">
                            {ownership.ownerName}
                          </Text>
                        </View>
                        <ChevronRight size={14} color="#9ca3af" />
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Supplier Detail Modal - Enhanced (BCG Supply Chain Excellence) */}
      <Modal
        visible={selectedSupplier !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSupplier(null)}
      >
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setSelectedSupplier(null)}
        >
          <View className="flex-1" />
          {selectedSupplier && (
            <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
              <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl">
              {/* Fixed Header */}
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">{selectedSupplier.supplierName}</Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">{selectedSupplier.projectName}</Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedSupplier(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
              </View>

              {/* Scrollable Content */}
              <ScrollView showsVerticalScrollIndicator={true} bounces={false} contentContainerStyle={{ flexGrow: 1 }}>
                <View className="px-6 py-4">
                  {/* Performance KPIs (BCG Supplier Scorecard) */}
                  <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                      <BarChart3 size={18} color="#3b82f6" />
                      <Text className="text-blue-900 dark:text-blue-100 font-bold ml-2">Performance Scorecard</Text>
                    </View>
                    <View className="flex-row gap-2 mb-3">
                      <View className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-3 items-center">
                        <Text className="text-gray-500 dark:text-slate-400 text-xs">Quality</Text>
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xl font-bold">94%</Text>
                        <View className="flex-row items-center">
                          <TrendingUp size={10} color="#10b981" />
                          <Text className="text-emerald-600 text-xs ml-1">+2%</Text>
                        </View>
                      </View>
                      <View className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-3 items-center">
                        <Text className="text-gray-500 dark:text-slate-400 text-xs">On-Time</Text>
                        <Text className="text-amber-600 dark:text-amber-400 text-xl font-bold">87%</Text>
                        <View className="flex-row items-center">
                          <TrendingDown size={10} color="#f59e0b" />
                          <Text className="text-amber-600 text-xs ml-1">-3%</Text>
                        </View>
                      </View>
                      <View className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-3 items-center">
                        <Text className="text-gray-500 dark:text-slate-400 text-xs">Response</Text>
                        <Text className="text-blue-600 dark:text-blue-400 text-xl font-bold">4h</Text>
                        <Text className="text-gray-500 text-xs">avg</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3">
                      <View className="flex-row items-center">
                        <Star size={16} color="#f59e0b" fill="#f59e0b" />
                        <Text className="text-gray-900 dark:text-white font-bold ml-2">Overall Rating</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-amber-600 dark:text-amber-400 text-lg font-bold">4.2</Text>
                        <Text className="text-gray-500 dark:text-slate-500 text-sm">/5.0</Text>
                      </View>
                    </View>
                  </View>

                  {/* Financial Summary */}
                  <View className="bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                      <DollarSign size={18} color="#10b981" />
                      <Text className="text-gray-900 dark:text-white font-bold ml-2">Financial Summary</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600 dark:text-slate-400">Total Cost:</Text>
                      <Text className="text-emerald-500 text-xl font-bold">
                        £{selectedSupplier.totalCost.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600 dark:text-slate-400">Paid to Date:</Text>
                      <Text className="text-blue-500 text-lg font-bold">
                        £{selectedSupplier.paidToDate.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-gray-600 dark:text-slate-400">Outstanding:</Text>
                      <Text className="text-orange-500 text-lg font-bold">
                        £{(selectedSupplier.totalCost - selectedSupplier.paidToDate).toLocaleString()}
                      </Text>
                    </View>
                    {/* Payment Progress Bar */}
                    <View className="bg-gray-300 dark:bg-slate-700 rounded-full h-2 mb-2">
                      <View
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${(selectedSupplier.paidToDate / selectedSupplier.totalCost) * 100}%` }}
                      />
                    </View>
                    <Text className="text-gray-500 dark:text-slate-500 text-xs text-center">
                      {((selectedSupplier.paidToDate / selectedSupplier.totalCost) * 100).toFixed(0)}% paid
                    </Text>
                  </View>

                  {/* Risk Assessment (Deloitte Supply Chain Risk) */}
                  <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                      <Shield size={18} color="#f59e0b" />
                      <Text className="text-amber-900 dark:text-amber-100 font-bold ml-2">Risk Assessment</Text>
                    </View>
                    <View className="space-y-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-amber-800 dark:text-amber-200 text-sm">Single-source dependency:</Text>
                        <View className="bg-amber-200 dark:bg-amber-800 px-2 py-1 rounded">
                          <Text className="text-amber-800 dark:text-amber-200 text-xs font-bold">MEDIUM</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-amber-800 dark:text-amber-200 text-sm">Geographic concentration:</Text>
                        <View className="bg-emerald-200 dark:bg-emerald-800 px-2 py-1 rounded">
                          <Text className="text-emerald-800 dark:text-emerald-200 text-xs font-bold">LOW</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-amber-800 dark:text-amber-200 text-sm">Financial stability:</Text>
                        <View className="bg-emerald-200 dark:bg-emerald-800 px-2 py-1 rounded">
                          <Text className="text-emerald-800 dark:text-emerald-200 text-xs font-bold">LOW</Text>
                        </View>
                      </View>
                    </View>
                    <View className="mt-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg p-2">
                      <Text className="text-amber-700 dark:text-amber-300 text-xs">
                        Recommendation: Consider qualifying backup supplier for critical components
                      </Text>
                    </View>
                  </View>

                  {/* Timeline & Milestones */}
                  <View className="bg-gray-100 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                      <Calendar size={18} color="#64748b" />
                      <Text className="text-gray-900 dark:text-white font-bold ml-2">Timeline & Milestones</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">Start Date:</Text>
                      <Text className="text-gray-900 dark:text-white font-medium">
                        {new Date(selectedSupplier.startDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">Delivery Date:</Text>
                      <Text className="text-gray-900 dark:text-white font-medium">
                        {new Date(selectedSupplier.deliveryDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">Days Remaining:</Text>
                      <Text className={`font-bold ${
                        Math.ceil((new Date(selectedSupplier.deliveryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) < 14
                          ? 'text-red-600'
                          : 'text-emerald-600'
                      }`}>
                        {Math.max(0, Math.ceil((new Date(selectedSupplier.deliveryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <FileText size={16} color="#64748b" />
                      <Text className="text-gray-700 dark:text-slate-300 font-semibold ml-2">Description</Text>
                    </View>
                    <Text className="text-gray-900 dark:text-white">{selectedSupplier.description}</Text>
                  </View>

                  {/* Contract Renewal (KPMG Contract Management) */}
                  <View className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                      <RefreshCw size={18} color="#8b5cf6" />
                      <Text className="text-violet-900 dark:text-violet-100 font-bold ml-2">Contract & Renewal</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-violet-800 dark:text-violet-200 text-sm">Contract Type:</Text>
                      <Text className="text-violet-900 dark:text-violet-100 font-medium">Fixed Price</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-violet-800 dark:text-violet-200 text-sm">Renewal Date:</Text>
                      <Text className="text-violet-900 dark:text-violet-100 font-medium">
                        {new Date(new Date(selectedSupplier.deliveryDate).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-violet-800 dark:text-violet-200 text-sm">Exit Notice Period:</Text>
                      <Text className="text-violet-900 dark:text-violet-100 font-medium">30 days</Text>
                    </View>
                    <View className="mt-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg p-2">
                      <View className="flex-row items-center">
                        <Target size={12} color="#8b5cf6" />
                        <Text className="text-violet-700 dark:text-violet-300 text-xs ml-1">
                          Action: Review renewal terms 2 weeks before deadline
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Linked Tasks & Team Members - NEW */}
                  {(() => {
                    const linkedWorkPlanIds = selectedSupplier.linkedWorkPlanIds || [];
                    if (linkedWorkPlanIds.length === 0) return null;

                    // Get work plans from the store
                    const { useWorkPlanStore } = require('@/lib/state/work-plan-store');
                    const workPlans = useWorkPlanStore.getState().workPlans;
                    const linkedWorkPlans = workPlans.filter((wp: any) => linkedWorkPlanIds.includes(wp.id));

                    if (linkedWorkPlans.length === 0) return null;

                    return (
                      <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                        <View className="flex-row items-center mb-3">
                          <Target size={18} color="#3b82f6" />
                          <Text className="text-blue-900 dark:text-blue-100 font-bold ml-2">Linked Tasks</Text>
                        </View>

                        {linkedWorkPlans.map((workPlan: any) => {
                          // Get people working on this task
                          const peopleOnTask = workPlan.allocations?.map((alloc: any) => {
                            return members.find(m => m.id === alloc.memberId);
                          }).filter(Boolean) || [];

                          return (
                            <View key={workPlan.id} className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-2">
                              <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-1">
                                  <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                                    {workPlan.title}
                                  </Text>
                                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                                    {workPlan.function} • {workPlan.status.replace(/-/g, ' ')}
                                  </Text>
                                  {workPlan.componentBeingMade && (
                                    <View className="mt-1 flex-row items-center">
                                      <Package size={12} color="#3b82f6" />
                                      <Text className="text-blue-600 dark:text-blue-400 text-xs ml-1">
                                        Making: {workPlan.componentBeingMade}
                                      </Text>
                                    </View>
                                  )}
                                  {workPlan.manufacturingProcess && (
                                    <Text className="text-gray-500 dark:text-slate-500 text-xs mt-1">
                                      {workPlan.manufacturingProcess}
                                    </Text>
                                  )}
                                </View>
                                <View className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-bold">
                                    {workPlan.progress}%
                                  </Text>
                                </View>
                              </View>

                              {/* People working on this task */}
                              {peopleOnTask.length > 0 && (
                                <View className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                  <Text className="text-gray-600 dark:text-slate-400 text-xs font-semibold mb-1.5">
                                    Team Members:
                                  </Text>
                                  <View className="flex-row flex-wrap gap-2">
                                    {peopleOnTask.map((person: any) => {
                                      if (!person) return null;
                                      const allocation = workPlan.allocations?.find((a: any) => a.memberId === person.id);
                                      return (
                                        <View
                                          key={person.id}
                                          className="flex-row items-center bg-gray-100 dark:bg-slate-700 rounded-lg px-2 py-1"
                                        >
                                          <View
                                            className="w-5 h-5 rounded-full items-center justify-center mr-1.5"
                                            style={{
                                              backgroundColor:
                                                person.role === 'Founder' ? '#8b5cf6' :
                                                person.role === 'FractionalExec' ? '#3b82f6' : '#10b981'
                                            }}
                                          >
                                            <Text className="text-white text-[10px] font-bold">
                                              {person.name.split(' ').map((n: string) => n[0]).join('')}
                                            </Text>
                                          </View>
                                          <Text className="text-gray-900 dark:text-white text-xs font-medium">
                                            {person.name}
                                          </Text>
                                          {allocation && (
                                            <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1">
                                              ({allocation.squaresPerWeek} TU/wk)
                                            </Text>
                                          )}
                                        </View>
                                      );
                                    })}
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })}

                        {selectedSupplier.componentName && (
                          <View className="mt-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg p-2">
                            <Text className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                              Component: {selectedSupplier.componentName}
                            </Text>
                            {selectedSupplier.processDescription && (
                              <Text className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                                {selectedSupplier.processDescription}
                              </Text>
                            )}
                            {selectedSupplier.estimatedDuration && (
                              <Text className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                                Duration: {selectedSupplier.estimatedDuration} days
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })()}

                  {/* Contact Information */}
                  <View className="bg-gray-100 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                    <Text className="text-gray-900 dark:text-white font-bold mb-3">Contact Information</Text>
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mr-3">
                        <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                          {selectedSupplier.contactPerson.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <Text className="text-gray-900 dark:text-white font-medium">{selectedSupplier.contactPerson}</Text>
                    </View>
                    <Pressable className="flex-row items-center mb-2 active:opacity-70">
                      <Mail size={14} color="#3b82f6" />
                      <Text className="text-blue-500 text-sm ml-2">{selectedSupplier.contactEmail}</Text>
                    </Pressable>
                    <View className="flex-row items-center">
                      <Phone size={14} color="#64748b" />
                      <Text className="text-gray-600 dark:text-slate-400 text-sm ml-2">{selectedSupplier.contactPhone}</Text>
                    </View>
                  </View>

                  {/* Assigned Person Section */}
                  <View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <User size={18} color="#8b5cf6" />
                        <Text className="text-purple-900 dark:text-purple-100 font-bold ml-2">Assigned Owner</Text>
                      </View>
                      <Pressable
                        onPress={() => setShowPersonPicker(true)}
                        className="bg-purple-500 px-3 py-1.5 rounded-lg active:opacity-70"
                      >
                        <Text className="text-white text-xs font-bold">Change</Text>
                      </Pressable>
                    </View>
                    {(() => {
                      const assignedMember = members.find(m => m.id === selectedSupplier.assignedTo || m.name === selectedSupplier.assignedTo);
                      if (assignedMember) {
                        return (
                          <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-lg p-3">
                            <View
                              className="w-10 h-10 rounded-full items-center justify-center mr-3"
                              style={{
                                backgroundColor:
                                  assignedMember.role === 'Founder' ? '#8b5cf6' :
                                  assignedMember.role === 'FractionalExec' ? '#3b82f6' : '#10b981'
                              }}
                            >
                              <Text className="text-white font-bold text-sm">
                                {assignedMember.name.split(' ').map(n => n[0]).join('')}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-gray-900 dark:text-white font-semibold">{assignedMember.name}</Text>
                              <View className="flex-row items-center gap-2 mt-0.5">
                                <View
                                  className="px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor:
                                      assignedMember.role === 'Founder' ? '#8b5cf620' :
                                      assignedMember.role === 'FractionalExec' ? '#3b82f620' : '#10b98120'
                                  }}
                                >
                                  <Text
                                    className="text-[10px] font-semibold"
                                    style={{
                                      color:
                                        assignedMember.role === 'Founder' ? '#8b5cf6' :
                                        assignedMember.role === 'FractionalExec' ? '#3b82f6' : '#10b981'
                                    }}
                                  >
                                    {assignedMember.role === 'FractionalExec' ? 'Executive' : assignedMember.role}
                                  </Text>
                                </View>
                                <Text className="text-gray-500 dark:text-slate-400 text-xs">{assignedMember.function}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      } else {
                        return (
                          <Pressable
                            onPress={() => setShowPersonPicker(true)}
                            className="flex-row items-center justify-center bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-dashed border-purple-300 dark:border-purple-700"
                          >
                            <User size={20} color="#8b5cf6" />
                            <Text className="text-purple-600 dark:text-purple-400 font-semibold ml-2">
                              Assign someone to this engagement
                            </Text>
                          </Pressable>
                        );
                      }
                    })()}
                  </View>

                  {/* Notes */}
                  {selectedSupplier.notes && (
                    <View className="mb-4">
                      <Text className="text-gray-700 dark:text-slate-300 font-semibold mb-2">Internal Notes</Text>
                      <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-3">
                        <Text className="text-gray-900 dark:text-white">{selectedSupplier.notes}</Text>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="flex-row gap-3 mb-6">
                    <Pressable
                      onPress={() => Linking.openURL(`mailto:${selectedSupplier.contactEmail}`)}
                      className="flex-1 bg-blue-500 py-3 rounded-xl items-center active:opacity-70"
                    >
                      <View className="flex-row items-center">
                        <Mail size={16} color="#fff" />
                        <Text className="text-white font-bold ml-2">Contact</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => Alert.alert(
                        'Contract',
                        `Contract documents for ${selectedSupplier.supplierName} would be displayed here. Upload contracts in your document management system.`,
                        [{ text: 'OK', style: 'default' }]
                      )}
                      className="flex-1 bg-gray-300 dark:bg-slate-700 py-3 rounded-xl items-center active:opacity-70"
                    >
                      <View className="flex-row items-center">
                        <FileText size={16} color="#64748b" />
                        <Text className="text-gray-700 dark:text-slate-300 font-bold ml-2">View Contract</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>

      {/* AI Agent Detail Modal */}
      <Modal
        visible={selectedAI !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAI(null)}
      >
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setSelectedAI(null)}
        >
          <View className="flex-1" />
          {selectedAI && (
            <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
              <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl">
              {/* Fixed Header */}
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold flex-1">{selectedAI.name}</Text>
                  <Pressable
                    onPress={() => setSelectedAI(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-purple-500 dark:text-purple-400 text-sm font-semibold">{selectedAI.provider}</Text>
                  <Text className="text-gray-600 dark:text-slate-500">•</Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">{selectedAI.model}</Text>
                </View>
              </View>

              {/* Scrollable Content */}
              <ScrollView showsVerticalScrollIndicator={true} bounces={false} contentContainerStyle={{ flexGrow: 1 }}>
                <View className="px-6 py-4">
                  <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 dark:text-slate-400">Monthly Cost:</Text>
                      <Text className="text-purple-500 dark:text-purple-400 text-xl font-bold">
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

                  {/* Used By Team - Live from Armory Store */}
                  {(() => {
                    const memberIdsUsingTool = getMembersUsingAITool(selectedAI.id);
                    const membersUsingTool = memberIdsUsingTool
                      .map(memberId => members.find(m => m.id === memberId))
                      .filter(Boolean);

                    if (membersUsingTool.length === 0) return null;

                    return (
                      <View className="mb-4">
                        <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                          Used By Team ({membersUsingTool.length})
                        </Text>
                        <View className="bg-gray-200 dark:bg-slate-800 rounded-xl p-3">
                          <View className="gap-3">
                            {membersUsingTool.map((member: any) => {
                              const getRoleColor = (role: string) => {
                                switch (role) {
                                  case 'Founder': return '#8b5cf6';
                                  case 'FractionalExec': return '#3b82f6';
                                  case 'Apprentice': return '#10b981';
                                  default: return '#64748b';
                                }
                              };

                              const getRoleLabel = (role: string) => {
                                switch (role) {
                                  case 'Founder': return 'Founder';
                                  case 'FractionalExec': return 'Executive';
                                  case 'Apprentice': return 'Apprentice';
                                  default: return role;
                                }
                              };

                              return (
                                <View key={member.id} className="flex-row items-center justify-between">
                                  <View className="flex-row items-center flex-1">
                                    <View
                                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                                      style={{ backgroundColor: getRoleColor(member.role) }}
                                    >
                                      <Text className="text-white text-xs font-bold">
                                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                                      </Text>
                                    </View>
                                    <View>
                                      <Text className="text-gray-900 dark:text-white font-medium">
                                        {member.name}
                                      </Text>
                                      <Text className="text-gray-600 dark:text-slate-400 text-xs">
                                        {member.function}
                                      </Text>
                                    </View>
                                  </View>
                                  <View className="bg-gray-300 dark:bg-slate-700 px-2 py-1 rounded">
                                    <Text className="text-gray-700 dark:text-slate-300 text-xs font-semibold">
                                      {getRoleLabel(member.role)}
                                    </Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    );
                  })()}

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

                  {/* Delete Button */}
                  <Pressable
                    onPress={() => handleDeleteAIAgent(selectedAI.id, selectedAI.name)}
                    className="flex-row items-center justify-center bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 active:opacity-70"
                  >
                    <Trash2 size={20} color="#ef4444" />
                    <Text className="text-red-600 dark:text-red-400 font-bold ml-2">
                      Delete AI Agent
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>

      {/* Person Picker Modal */}
      <Modal
        visible={showPersonPicker && selectedSupplier !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPersonPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/70 justify-end"
          onPress={() => setShowPersonPicker(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '70%' }}>
              {/* Header */}
              <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">Assign Person</Text>
                  <Pressable
                    onPress={() => setShowPersonPicker(false)}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
                <Text className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                  Select a team member to own this engagement
                </Text>
              </View>

              {/* Person List */}
              <ScrollView className="px-6 py-4">
                {/* Founders */}
                {members.filter(m => m.role === 'Founder' && m.status === 'active').length > 0 && (
                  <View className="mb-4">
                    <Text className="text-purple-600 dark:text-purple-400 text-xs font-bold mb-2">FOUNDERS</Text>
                    {members.filter(m => m.role === 'Founder' && m.status === 'active').map(member => (
                      <Pressable
                        key={member.id}
                        onPress={() => {
                          if (selectedSupplier) {
                            updateSupplierEngagement(selectedSupplier.id, { assignedTo: member.id });
                            setSelectedSupplier({ ...selectedSupplier, assignedTo: member.id });
                            setShowPersonPicker(false);
                          }
                        }}
                        className={`flex-row items-center p-3 rounded-xl mb-2 ${
                          selectedSupplier?.assignedTo === member.id || selectedSupplier?.assignedTo === member.name
                            ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                            : 'bg-gray-50 dark:bg-slate-800'
                        } active:opacity-70`}
                      >
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-purple-500">
                          <Text className="text-white font-bold text-sm">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-semibold">{member.name}</Text>
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">{member.function}</Text>
                        </View>
                        {(selectedSupplier?.assignedTo === member.id || selectedSupplier?.assignedTo === member.name) && (
                          <CheckCircle2 size={20} color="#8b5cf6" />
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Executives */}
                {members.filter(m => m.role === 'FractionalExec' && m.status === 'active').length > 0 && (
                  <View className="mb-4">
                    <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">EXECUTIVES</Text>
                    {members.filter(m => m.role === 'FractionalExec' && m.status === 'active').map(member => (
                      <Pressable
                        key={member.id}
                        onPress={() => {
                          if (selectedSupplier) {
                            updateSupplierEngagement(selectedSupplier.id, { assignedTo: member.id });
                            setSelectedSupplier({ ...selectedSupplier, assignedTo: member.id });
                            setShowPersonPicker(false);
                          }
                        }}
                        className={`flex-row items-center p-3 rounded-xl mb-2 ${
                          selectedSupplier?.assignedTo === member.id || selectedSupplier?.assignedTo === member.name
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                            : 'bg-gray-50 dark:bg-slate-800'
                        } active:opacity-70`}
                      >
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-blue-500">
                          <Text className="text-white font-bold text-sm">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-semibold">{member.name}</Text>
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">{member.function}</Text>
                        </View>
                        {(selectedSupplier?.assignedTo === member.id || selectedSupplier?.assignedTo === member.name) && (
                          <CheckCircle2 size={20} color="#3b82f6" />
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Apprentices */}
                {members.filter(m => m.role === 'Apprentice' && m.status === 'active').length > 0 && (
                  <View className="mb-4">
                    <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2">APPRENTICES</Text>
                    {members.filter(m => m.role === 'Apprentice' && m.status === 'active').map(member => (
                      <Pressable
                        key={member.id}
                        onPress={() => {
                          if (selectedSupplier) {
                            updateSupplierEngagement(selectedSupplier.id, { assignedTo: member.id });
                            setSelectedSupplier({ ...selectedSupplier, assignedTo: member.id });
                            setShowPersonPicker(false);
                          }
                        }}
                        className={`flex-row items-center p-3 rounded-xl mb-2 ${
                          selectedSupplier?.assignedTo === member.id || selectedSupplier?.assignedTo === member.name
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500'
                            : 'bg-gray-50 dark:bg-slate-800'
                        } active:opacity-70`}
                      >
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-emerald-500">
                          <Text className="text-white font-bold text-sm">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 dark:text-white font-semibold">{member.name}</Text>
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">{member.function}</Text>
                        </View>
                        {(selectedSupplier?.assignedTo === member.id || selectedSupplier?.assignedTo === member.name) && (
                          <CheckCircle2 size={20} color="#10b981" />
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Clear Assignment */}
                <Pressable
                  onPress={() => {
                    if (selectedSupplier) {
                      updateSupplierEngagement(selectedSupplier.id, { assignedTo: '' });
                      setSelectedSupplier({ ...selectedSupplier, assignedTo: '' });
                      setShowPersonPicker(false);
                    }
                  }}
                  className="flex-row items-center justify-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-6 active:opacity-70"
                >
                  <X size={16} color="#ef4444" />
                  <Text className="text-red-600 dark:text-red-400 font-semibold ml-2">Remove Assignment</Text>
                </Pressable>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
