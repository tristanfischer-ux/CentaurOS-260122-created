import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { Target, Plus, X, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Users, DollarSign, Lightbulb, ChevronUp, UserPlus, Zap, AlertTriangle, AlertCircle, TrendingDown, CalendarClock, ArrowRight } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Function as BusinessFunction } from '@/types';
import { useOKRStore, type OKR, type Objective } from '@/lib/state/okr-store';
import { OKR_CATEGORIES, OKR_SUGGESTIONS, type OKRSuggestion, type OKRCategory } from '@/lib/okr-suggestions';
import { fractionalExecutives, apprentices, type Candidate } from '@/lib/candidates-seed';
import { useMarketplaceRequestsStore, type MarketplaceRequest } from '@/lib/state/marketplace-requests-store';
import { MARKETPLACE_EXECUTIVES } from '@/lib/marketplace-executives';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';

// Initialize OKR store once
if (useOKRStore.getState().okrs.length === 0) {
  useOKRStore.getState().initializeOKRs();
}
if (useWorkPlanStore.getState().workPlans.length === 0) {
  useWorkPlanStore.getState().initializeWorkPlans();
}

interface WorkPlanItem {
  id: string;
  title: string;
  assignedTo: string;
  assignedRole: 'Founder' | 'FractionalExec' | 'Apprentice';
}

export default function DecideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const params = useLocalSearchParams<{ function?: string }>();

  // Use centralized OKR store
  const okrs = useOKRStore(s => s.okrs);
  const toggleOKRExpanded = useOKRStore(s => s.toggleOKRExpanded);
  const addOKR = useOKRStore(s => s.addOKR);

  // Work plans for decision context
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // Marketplace requests
  const allRequests = useMarketplaceRequestsStore((s) => s.requests);
  const approveRequest = useMarketplaceRequestsStore((s) => s.approveRequest);
  const rejectRequest = useMarketplaceRequestsStore((s) => s.rejectRequest);
  const addMember = useOrganizationStore((s) => s.addMember);

  // Filter pending requests with useMemo
  const pendingRequests = useMemo(() => {
    return allRequests.filter((req) => req.status === 'pending');
  }, [allRequests]);

  // Calculate items that NEED DECISIONS - this is the core of the Decide tab
  const decisionItems = useMemo(() => {
    // Off-track OKRs need immediate intervention
    const offTrackOKRs = okrs.filter(o => o.status === 'off-track');

    // At-risk OKRs need monitoring/decisions
    const atRiskOKRs = okrs.filter(o => o.status === 'at-risk');

    // OKRs without any linked work plans (need resource allocation)
    const okrsWithoutPlans = okrs.filter(okr => {
      const linkedPlans = workPlans.filter(wp => wp.linkedOKRTitle === okr.title);
      return linkedPlans.length === 0;
    });

    // Blocked work plans need founder escalation
    const blockedWorkPlans = workPlans.filter(wp => wp.status === 'blocked');

    // Work plans with no progress in 7+ days (stalled) - simplified check
    const stalledWorkPlans = workPlans.filter(wp =>
      wp.status === 'in-progress' && wp.progress < 10
    );

    return {
      offTrackOKRs,
      atRiskOKRs,
      okrsWithoutPlans,
      blockedWorkPlans,
      stalledWorkPlans,
      pendingApprovals: pendingRequests.length,
      totalCritical: offTrackOKRs.length + blockedWorkPlans.length + pendingRequests.length,
      totalWarning: atRiskOKRs.length + okrsWithoutPlans.length + stalledWorkPlans.length,
    };
  }, [okrs, workPlans, pendingRequests]);

  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<OKRCategory | 'all'>('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<OKRSuggestion | null>(null);

  // Dropdown states
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);

  // Form state for creating OKR
  const [newOKRTitle, setNewOKRTitle] = useState('');
  const [newOKRDescription, setNewOKRDescription] = useState('');
  const [newOKRFunction, setNewOKRFunction] = useState<BusinessFunction>('Marketing');
  const [newOKROwner, setNewOKROwner] = useState('');
  const [newOKROwnerRole, setNewOKROwnerRole] = useState<'Founder' | 'FractionalExec' | 'Apprentice'>('Founder');

  // Work plan state
  const [workPlanItems, setWorkPlanItems] = useState<WorkPlanItem[]>([]);
  const [showWorkPlanSection, setShowWorkPlanSection] = useState(false);

  // Set initial function from params if provided
  useEffect(() => {
    if (params.function && params.function !== 'all') {
      setSelectedFunction(params.function as BusinessFunction);
    }
  }, [params.function]);

  const functions: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Ops', 'Finance', 'Admin'];

  // Get all available team members
  const allTeamMembers: Array<{ name: string; role: 'Founder' | 'FractionalExec' | 'Apprentice'; info?: string }> = [
    { name: 'Founder', role: 'Founder' },
    ...fractionalExecutives.slice(0, 10).map(exec => ({
      name: exec.name,
      role: 'FractionalExec' as const,
      info: exec.specialization.join(', ')
    })),
    ...apprentices.slice(0, 10).map(app => ({
      name: app.name,
      role: 'Apprentice' as const,
      info: app.specialization.join(', ')
    })),
  ];

  // DECIDE tab shows all OKRs for strategic decision-making
  // Filter by selected function only (workspace filtering handled by store initialization)
  const filteredOKRs = selectedFunction === 'all'
    ? okrs
    : okrs.filter(okr => okr.function === selectedFunction);

  const toggleOKR = (okrId: string) => {
    toggleOKRExpanded(okrId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-emerald-500 bg-emerald-500/20';
      case 'at-risk':
        return 'text-amber-500 bg-amber-500/20';
      case 'off-track':
        return 'text-red-500 bg-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'On Track';
      case 'at-risk':
        return 'At Risk';
      case 'off-track':
        return 'Off Track';
      default:
        return 'Unknown';
    }
  };

  const getFunctionColor = (func: BusinessFunction) => {
    switch (func) {
      case 'Marketing':
        return '#f59e0b';
      case 'Sales':
        return '#ec4899';
      case 'Engineering':
        return '#3b82f6';
      case 'Ops':
        return '#8b5cf6';
      case 'Finance':
        return '#10b981';
      case 'Admin':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  // Calculate summary stats
  const totalOKRs = filteredOKRs.length;
  const atRiskOKRs = filteredOKRs.filter((okr: OKR) => okr.status === 'at-risk').length;
  const offTrackOKRs = filteredOKRs.filter((okr: OKR) => okr.status === 'off-track').length;
  const approvalQueueCount = pendingRequests.length;

  const handleApproveMarketplaceRequest = (requestId: string, candidateId: string) => {
    // Find the candidate
    const candidate = MARKETPLACE_EXECUTIVES.find(e => e.id === candidateId);
    const request = pendingRequests.find((r: MarketplaceRequest) => r.id === requestId);

    if (!candidate || !request) return;

    // Add to organization
    addMember({
      id: `member-${Date.now()}`,
      workspaceId: 'workspace-demo-company',
      name: candidate.name,
      role: candidate.role as 'FractionalExec' | 'Apprentice',
      function: candidate.function,
      email: `${candidate.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: undefined,
      linkedIn: candidate.linkedIn,
      bio: candidate.bio,
      costPerDay: request.proposedDayRate,
      daysPerWeek: request.proposedDaysPerWeek,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
    });

    // Approve the request
    approveRequest(requestId, currentMembership?.role || 'Founder');
    Alert.alert('Success', `${candidate.name} has been added to your team!`);
  };

  const handleRejectMarketplaceRequest = (requestId: string) => {
    rejectRequest(requestId, currentMembership?.role || 'Founder');
    Alert.alert('Rejected', 'The hiring request has been rejected.');
  };

  // Filter suggestions by category
  const filteredSuggestions = selectedCategory === 'all'
    ? OKR_SUGGESTIONS
    : OKR_SUGGESTIONS.filter(s => s.category === selectedCategory);

  const handleSelectSuggestion = (suggestion: OKRSuggestion) => {
    setNewOKRTitle(suggestion.title);
    setNewOKRDescription(suggestion.description);
    setSelectedSuggestion(suggestion);
    setShowIdeasModal(false);
    setShowCreateModal(true);
  };

  const handleAddWorkPlanItem = () => {
    const newItem: WorkPlanItem = {
      id: `wpi-${Date.now()}`,
      title: '',
      assignedTo: 'Founder',
      assignedRole: 'Founder',
    };
    setWorkPlanItems([...workPlanItems, newItem]);
  };

  const handleUpdateWorkPlanItem = (id: string, field: keyof WorkPlanItem, value: string) => {
    setWorkPlanItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveWorkPlanItem = (id: string) => {
    setWorkPlanItems(items => items.filter(item => item.id !== id));
  };

  const handleCreateOKR = () => {
    if (!newOKRTitle.trim()) {
      Alert.alert('Error', 'Please enter an OKR title');
      return;
    }
    if (!newOKRDescription.trim()) {
      Alert.alert('Error', 'Please enter an OKR description');
      return;
    }
    if (!newOKROwner.trim()) {
      Alert.alert('Error', 'Please select an owner');
      return;
    }

    // Create objectives from key results if using suggestion
    const objectives: Objective[] = selectedSuggestion
      ? selectedSuggestion.keyResults.map((kr, index) => ({
          id: `kr-${Date.now()}-${index}`,
          title: kr.title,
          target: `${kr.targetValue} ${kr.unit}`,
          current: '0',
          progress: 0,
          status: 'on-track' as const,
        }))
      : [];

    const newOKR: OKR = {
      id: `okr-${Date.now()}`,
      workspaceId: currentWorkspace?.id || 'workspace-demo-company',
      function: newOKRFunction,
      title: newOKRTitle,
      description: newOKRDescription,
      owner: newOKROwner,
      startDate: 'Q1 2026',
      endDate: 'Q4 2026',
      status: 'on-track',
      objectives,
      isExpanded: false,
    };

    addOKR(newOKR);

    // Show work plan success message
    const workPlanMessage = workPlanItems.length > 0
      ? `\n\n${workPlanItems.length} work items have been created and assigned to the team.`
      : '';

    // Reset form
    setNewOKRTitle('');
    setNewOKRDescription('');
    setNewOKRFunction('Marketing');
    setNewOKROwner('');
    setNewOKROwnerRole('Founder');
    setWorkPlanItems([]);
    setShowWorkPlanSection(false);
    setSelectedSuggestion(null);
    setShowCreateModal(false);

    Alert.alert('Success', `OKR created successfully!${workPlanMessage}`);
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Compact Header */}
      <View className="px-5 py-3 border-b border-gray-200 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-xl font-bold">Decide</Text>
            <Text className="text-gray-500 dark:text-slate-500 text-xs">
              Strategic decisions & approvals
            </Text>
          </View>
          {/* Quick Action Buttons */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="bg-purple-500 rounded-xl p-2.5 active:opacity-70"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => setShowIdeasModal(true)}
              className="bg-violet-100 dark:bg-violet-900/30 rounded-xl p-2.5 active:opacity-70"
            >
              <Lightbulb size={20} color="#8b5cf6" />
            </Pressable>
          </View>
        </View>

        {/* Decision Summary Bar */}
        {(decisionItems.totalCritical > 0 || decisionItems.totalWarning > 0) && (
          <View className="flex-row gap-2">
            {decisionItems.totalCritical > 0 && (
              <View className="flex-row items-center bg-red-100 dark:bg-red-900/20 px-2.5 py-1.5 rounded-lg">
                <AlertTriangle size={14} color="#ef4444" />
                <Text className="text-red-700 dark:text-red-300 text-xs font-bold ml-1">
                  {decisionItems.totalCritical} critical
                </Text>
              </View>
            )}
            {decisionItems.totalWarning > 0 && (
              <View className="flex-row items-center bg-amber-100 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg">
                <AlertCircle size={14} color="#f59e0b" />
                <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold ml-1">
                  {decisionItems.totalWarning} needs review
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-5 py-4">
        {/* SECTION 1: NEEDS YOUR DECISION (Critical) */}
        {decisionItems.totalCritical > 0 && (
          <View className="mb-5">
            <Text className="text-red-600 dark:text-red-400 text-xs font-bold mb-2 tracking-wide">
              NEEDS YOUR DECISION
            </Text>
            <View className="gap-2">
              {/* Off-Track OKRs */}
              {decisionItems.offTrackOKRs.map((okr: OKR) => (
                <Pressable
                  key={okr.id}
                  onPress={() => router.push(`/okr-planner?okrId=${okr.id}`)}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-red-500 rounded-lg items-center justify-center">
                      <TrendingDown size={18} color="#fff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-red-900 dark:text-red-100 font-bold text-sm" numberOfLines={1}>
                        {okr.title}
                      </Text>
                      <Text className="text-red-700 dark:text-red-300 text-xs">
                        {okr.function} • Off-track • Needs intervention
                      </Text>
                    </View>
                    <ArrowRight size={16} color="#ef4444" />
                  </View>
                </Pressable>
              ))}

              {/* Blocked Work Plans */}
              {decisionItems.blockedWorkPlans.map((wp) => (
                <Pressable
                  key={wp.id}
                  onPress={() => router.push('/(tabs)/do')}
                  className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-amber-500 rounded-lg items-center justify-center">
                      <AlertCircle size={18} color="#fff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-amber-900 dark:text-amber-100 font-bold text-sm" numberOfLines={1}>
                        {wp.title}
                      </Text>
                      <Text className="text-amber-700 dark:text-amber-300 text-xs">
                        {wp.function} • Blocked • Team waiting
                      </Text>
                    </View>
                    <ArrowRight size={16} color="#f59e0b" />
                  </View>
                </Pressable>
              ))}

              {/* Pending Approvals */}
              {pendingRequests.length > 0 && (
                <Pressable
                  onPress={() => setShowApprovalQueue(true)}
                  className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-purple-500 rounded-lg items-center justify-center">
                      <UserPlus size={18} color="#fff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-purple-900 dark:text-purple-100 font-bold text-sm">
                        {pendingRequests.length} Hiring Request{pendingRequests.length > 1 ? 's' : ''}
                      </Text>
                      <Text className="text-purple-700 dark:text-purple-300 text-xs">
                        Marketplace candidates awaiting approval
                      </Text>
                    </View>
                    <ArrowRight size={16} color="#a855f7" />
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* SECTION 2: NEEDS REVIEW (Warning) */}
        {decisionItems.totalWarning > 0 && (
          <View className="mb-5">
            <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold mb-2 tracking-wide">
              NEEDS REVIEW
            </Text>
            <View className="gap-2">
              {/* At-Risk OKRs */}
              {decisionItems.atRiskOKRs.slice(0, 3).map((okr: OKR) => (
                <Pressable
                  key={okr.id}
                  onPress={() => {
                    toggleOKR(okr.id);
                  }}
                  className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-yellow-500 rounded-lg items-center justify-center">
                      <AlertTriangle size={16} color="#fff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-yellow-900 dark:text-yellow-100 font-semibold text-sm" numberOfLines={1}>
                        {okr.title}
                      </Text>
                      <Text className="text-yellow-700 dark:text-yellow-300 text-xs">
                        {okr.function} • At risk
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#eab308" />
                  </View>
                </Pressable>
              ))}

              {/* OKRs Without Resource Plans */}
              {decisionItems.okrsWithoutPlans.slice(0, 2).map((okr: OKR) => (
                <Pressable
                  key={okr.id}
                  onPress={() => router.push(`/okr-planner?okrId=${okr.id}`)}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-blue-500 rounded-lg items-center justify-center">
                      <CalendarClock size={16} color="#fff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-blue-900 dark:text-blue-100 font-semibold text-sm" numberOfLines={1}>
                        {okr.title}
                      </Text>
                      <Text className="text-blue-700 dark:text-blue-300 text-xs">
                        {okr.function} • No resource plan
                      </Text>
                    </View>
                    <Text className="text-blue-500 text-xs font-semibold">Plan →</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 3: Function Filter */}
        <View className="mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setSelectedFunction('all')}
                className={`px-3 py-1.5 rounded-lg ${selectedFunction === 'all' ? 'bg-purple-500' : 'bg-gray-200 dark:bg-slate-800'}`}
              >
                <Text className={`text-xs font-semibold ${selectedFunction === 'all' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                  All ({okrs.length})
                </Text>
              </Pressable>
              {functions.map((func) => {
                const count = okrs.filter(o => o.function === func).length;
                if (count === 0) return null;
                return (
                  <Pressable
                    key={func}
                    onPress={() => setSelectedFunction(func)}
                    className={`px-3 py-1.5 rounded-lg ${selectedFunction === func ? 'bg-purple-500' : 'bg-gray-200 dark:bg-slate-800'}`}
                  >
                    <Text className={`text-xs font-semibold ${selectedFunction === func ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                      {func} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* SECTION 4: All OKRs */}
        <View className="mb-4">
          <Text className="text-gray-500 dark:text-slate-500 text-xs font-bold mb-2 tracking-wide">
            ALL OKRs
          </Text>

          {filteredOKRs.length === 0 ? (
            <View className="items-center justify-center py-8 bg-gray-100 dark:bg-slate-900 rounded-xl">
              <Target size={32} color="#64748b" />
              <Text className="text-gray-600 dark:text-slate-400 text-center font-semibold mt-3">
                No OKRs Found
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-center text-sm mt-1">
                {selectedFunction === 'all' ? 'Create your first OKR' : `No OKRs for ${selectedFunction}`}
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                className="bg-purple-500 rounded-lg px-4 py-2 mt-3 active:opacity-70"
              >
                <Text className="text-white text-sm font-semibold">Create OKR</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-2">
              {filteredOKRs.map((okr: OKR) => {
                const isExpanded = okr.isExpanded || false;
                const functionColor = getFunctionColor(okr.function);
                const linkedPlans = workPlans.filter(wp => wp.linkedOKRTitle === okr.title);

                return (
                  <View key={okr.id}>
                    {/* OKR Card - Compact */}
                    <Pressable
                      onPress={() => toggleOKR(okr.id)}
                      className={`bg-gray-100 dark:bg-slate-900 border rounded-xl p-3 active:opacity-70 ${
                        okr.status === 'off-track'
                          ? 'border-red-300 dark:border-red-800'
                          : okr.status === 'at-risk'
                          ? 'border-amber-300 dark:border-amber-800'
                          : 'border-gray-200 dark:border-slate-800'
                      }`}
                    >
                      <View className="flex-row items-center">
                        {/* Status Indicator */}
                        <View
                          className="w-1.5 h-12 rounded-full mr-3"
                          style={{
                            backgroundColor:
                              okr.status === 'off-track' ? '#ef4444' :
                              okr.status === 'at-risk' ? '#f59e0b' : '#10b981'
                          }}
                        />

                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <View
                              className="px-1.5 py-0.5 rounded mr-2"
                              style={{ backgroundColor: functionColor + '20' }}
                            >
                              <Text className="text-xs font-semibold" style={{ color: functionColor }}>
                                {okr.function}
                              </Text>
                            </View>
                            <View className={`px-1.5 py-0.5 rounded ${getStatusColor(okr.status)}`}>
                              <Text className="text-xs font-semibold">{getStatusText(okr.status)}</Text>
                            </View>
                          </View>

                          <Text className="text-gray-900 dark:text-white font-semibold text-sm" numberOfLines={1}>
                            {okr.title}
                          </Text>

                          <View className="flex-row items-center mt-1 gap-3">
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">
                              {okr.objectives.length} KRs
                            </Text>
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">
                              {linkedPlans.length} work plan{linkedPlans.length !== 1 ? 's' : ''}
                            </Text>
                            <Text className="text-gray-500 dark:text-slate-400 text-xs">
                              {okr.owner}
                            </Text>
                          </View>
                        </View>

                        {isExpanded ? (
                          <ChevronDown size={18} color="#64748b" />
                        ) : (
                          <ChevronRight size={18} color="#64748b" />
                        )}
                      </View>
                    </Pressable>

                    {/* Expanded View */}
                    {isExpanded && (
                      <View className="mt-2 ml-4 gap-2">
                        {/* Key Results */}
                        {okr.objectives.map((objective: Objective) => (
                          <View
                            key={objective.id}
                            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-2.5"
                          >
                            <View className="flex-row items-center justify-between mb-1.5">
                              <Text className="text-gray-900 dark:text-white font-medium text-sm flex-1" numberOfLines={1}>
                                {objective.title}
                              </Text>
                              <View className={`px-1.5 py-0.5 rounded ml-2 ${getStatusColor(objective.status)}`}>
                                <Text className="text-xs font-semibold">{objective.progress}%</Text>
                              </View>
                            </View>
                            <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <View
                                className={`h-full ${
                                  objective.status === 'on-track' ? 'bg-emerald-500' :
                                  objective.status === 'at-risk' ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${objective.progress}%` }}
                              />
                            </View>
                          </View>
                        ))}

                        {/* Action Button */}
                        <Pressable
                          onPress={() => router.push(`/okr-planner?okrId=${okr.id}`)}
                          className="bg-purple-500 rounded-lg py-2.5 flex-row items-center justify-center gap-2 active:opacity-70"
                        >
                          <Zap size={16} color="#fff" />
                          <Text className="text-white text-sm font-semibold">
                            {linkedPlans.length === 0 ? 'Create Resource Plan' : 'View Resource Plan'}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* OKR Ideas Modal */}
      <Modal
        visible={showIdeasModal}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowIdeasModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl flex-1" style={{ maxHeight: '90%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Lightbulb size={24} color="#8b5cf6" />
                    <Text className="text-gray-900 dark:text-white text-xl font-bold ml-2">OKR Ideas</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowIdeasModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
                <Text className="text-gray-600 dark:text-slate-400 text-sm mt-2">
                  Browse proven OKR templates for startups across different business functions
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
                {/* Category Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setSelectedCategory('all')}
                      className={`px-3 py-2 rounded-lg ${selectedCategory === 'all' ? 'bg-violet-500' : 'bg-gray-200 dark:bg-slate-800'}`}
                    >
                      <Text className={`text-xs font-semibold ${selectedCategory === 'all' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                        All
                      </Text>
                    </Pressable>
                    {OKR_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedCategory(cat.id as OKRCategory)}
                        className={`px-3 py-2 rounded-lg ${selectedCategory === cat.id ? 'bg-violet-500' : 'bg-gray-200 dark:bg-slate-800'}`}
                      >
                        <Text className={`text-xs font-semibold ${selectedCategory === cat.id ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                          {cat.icon} {cat.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Suggestion Cards */}
                {filteredSuggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion.id}
                    onPress={() => handleSelectSuggestion(suggestion)}
                    className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-2xl p-4 mb-3 active:opacity-70"
                  >
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-2">
                      {suggestion.title}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-3">
                      {suggestion.description}
                    </Text>
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className="bg-violet-100 dark:bg-violet-900/30 px-2 py-1 rounded">
                        <Text className="text-violet-700 dark:text-violet-300 text-xs font-semibold">
                          {suggestion.keyResults.length} Key Results
                        </Text>
                      </View>
                      <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                        <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold">
                          {suggestion.suggestedDuration} days
                        </Text>
                      </View>
                    </View>
                    <Text className="text-violet-600 dark:text-violet-400 text-xs font-semibold">
                      Tap to use this template →
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Create OKR Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateModal(false);
          setSelectedSuggestion(null);
          setWorkPlanItems([]);
          setShowWorkPlanSection(false);
        }}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl flex-1" style={{ maxHeight: '90%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">Create OKR</Text>
                  <Pressable
                    onPress={() => {
                      setShowCreateModal(false);
                      setSelectedSuggestion(null);
                      setWorkPlanItems([]);
                      setShowWorkPlanSection(false);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
                {selectedSuggestion && (
                  <View className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-4">
                    <Text className="text-violet-900 dark:text-violet-100 font-semibold mb-1">
                      Using template: {selectedSuggestion.title}
                    </Text>
                    <Text className="text-violet-700 dark:text-violet-300 text-xs">
                      {selectedSuggestion.keyResults.length} key results will be auto-generated
                    </Text>
                  </View>
                )}

                <Text className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                  Create a new OKR and assign it to a team member. You can also create initial work items.
                </Text>

                {/* Title Input */}
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Title</Text>
                <TextInput
                  value={newOKRTitle}
                  onChangeText={setNewOKRTitle}
                  placeholder="e.g., Achieve Product-Market Fit"
                  placeholderTextColor="#94a3b8"
                  className="bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white mb-4"
                />

                {/* Description Input */}
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Description</Text>
                <TextInput
                  value={newOKRDescription}
                  onChangeText={setNewOKRDescription}
                  placeholder="Describe the objective and why it matters"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white mb-4"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />

                {/* Owner Selection with Dropdown */}
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Owner</Text>
                <Pressable
                  onPress={() => setShowOwnerDropdown(!showOwnerDropdown)}
                  className="bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-3 flex-row items-center justify-between mb-2"
                >
                  <Text className={`text-base ${newOKROwner ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                    {newOKROwner || 'Select an owner...'}
                  </Text>
                  {showOwnerDropdown ? (
                    <ChevronUp size={20} color="#94a3b8" />
                  ) : (
                    <ChevronDown size={20} color="#94a3b8" />
                  )}
                </Pressable>

                {/* Dropdown */}
                {showOwnerDropdown && (
                  <View className="bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-800 rounded-xl mb-4 max-h-60">
                    <ScrollView>
                      {allTeamMembers.map((member, index) => (
                        <Pressable
                          key={index}
                          onPress={() => {
                            setNewOKROwner(member.name);
                            setNewOKROwnerRole(member.role);
                            setShowOwnerDropdown(false);
                          }}
                          className="px-4 py-3 border-b border-gray-300 dark:border-slate-800 active:bg-gray-300 dark:active:bg-slate-700"
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                                {member.name}
                              </Text>
                              {member.info && (
                                <Text className="text-gray-600 dark:text-slate-400 text-xs mt-0.5">
                                  {member.info}
                                </Text>
                              )}
                            </View>
                            <View
                              className={`px-2 py-1 rounded ${
                                member.role === 'Founder'
                                  ? 'bg-blue-100 dark:bg-blue-900/30'
                                  : member.role === 'FractionalExec'
                                  ? 'bg-violet-100 dark:bg-violet-900/30'
                                  : 'bg-emerald-100 dark:bg-emerald-900/30'
                              }`}
                            >
                              <Text
                                className={`text-xs font-semibold ${
                                  member.role === 'Founder'
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : member.role === 'FractionalExec'
                                    ? 'text-violet-700 dark:text-violet-300'
                                    : 'text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {member.role === 'FractionalExec' ? 'Executive' : member.role}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Function Selection */}
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Function</Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                  {functions.map((func) => (
                    <Pressable
                      key={func}
                      onPress={() => setNewOKRFunction(func)}
                      className={`px-3 py-2 rounded-lg ${
                        newOKRFunction === func
                          ? 'bg-blue-500'
                          : 'bg-gray-200 dark:bg-slate-800'
                      }`}
                    >
                      <Text className={`text-sm font-semibold ${
                        newOKRFunction === func
                          ? 'text-white'
                          : 'text-gray-700 dark:text-slate-300'
                      }`}>
                        {func}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Work Plan Section */}
                <Pressable
                  onPress={() => setShowWorkPlanSection(!showWorkPlanSection)}
                  className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="text-amber-900 dark:text-amber-100 font-semibold mb-1">
                      Create Initial Work Plan (Optional)
                    </Text>
                    <Text className="text-amber-700 dark:text-amber-300 text-xs">
                      Add tasks and assign them to team members
                    </Text>
                  </View>
                  {showWorkPlanSection ? (
                    <ChevronUp size={20} color="#d97706" />
                  ) : (
                    <ChevronDown size={20} color="#d97706" />
                  )}
                </Pressable>

                {showWorkPlanSection && (
                  <View className="mb-4">
                    {workPlanItems.map((item, index) => (
                      <View key={item.id} className="bg-gray-200 dark:bg-slate-800 rounded-xl p-3 mb-2">
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                            Work Item {index + 1}
                          </Text>
                          <Pressable onPress={() => handleRemoveWorkPlanItem(item.id)}>
                            <X size={18} color="#ef4444" />
                          </Pressable>
                        </View>
                        <TextInput
                          value={item.title}
                          onChangeText={(val) => handleUpdateWorkPlanItem(item.id, 'title', val)}
                          placeholder="e.g., Create social media strategy"
                          placeholderTextColor="#94a3b8"
                          className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-lg px-3 py-2 text-gray-900 dark:text-white mb-2 text-sm"
                        />
                        <Text className="text-gray-700 dark:text-slate-300 text-xs mb-1">Assign to:</Text>
                        <View className="flex-row flex-wrap gap-2">
                          {allTeamMembers.slice(0, 5).map((member) => (
                            <Pressable
                              key={member.name}
                              onPress={() => {
                                handleUpdateWorkPlanItem(item.id, 'assignedTo', member.name);
                                handleUpdateWorkPlanItem(item.id, 'assignedRole', member.role);
                              }}
                              className={`px-2 py-1 rounded ${
                                item.assignedTo === member.name
                                  ? 'bg-blue-500'
                                  : 'bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800'
                              }`}
                            >
                              <Text className={`text-xs ${item.assignedTo === member.name ? 'text-white font-semibold' : 'text-gray-700 dark:text-slate-300'}`}>
                                {member.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ))}
                    <Pressable
                      onPress={handleAddWorkPlanItem}
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex-row items-center justify-center active:opacity-70"
                    >
                      <Plus size={18} color="#3b82f6" />
                      <Text className="text-blue-700 dark:text-blue-300 font-semibold ml-2 text-sm">
                        Add Work Item
                      </Text>
                    </Pressable>
                  </View>
                )}

                <Pressable
                  onPress={handleCreateOKR}
                  className="bg-blue-500 py-4 rounded-xl active:opacity-70"
                >
                  <Text className="text-white text-center font-bold">Create OKR</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Approval Queue Modal */}
      <Modal
        visible={showApprovalQueue}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApprovalQueue(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">Approval Queue</Text>
                <Pressable
                  onPress={() => setShowApprovalQueue(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                >
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
              <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                Review and approve hiring requests from the marketplace.
              </Text>

              {/* Marketplace hiring requests */}
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request: MarketplaceRequest) => {
                  const candidate = MARKETPLACE_EXECUTIVES.find(e => e.id === request.candidateId);
                  if (!candidate) return null;

                  return (
                    <View key={request.id} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-3">
                      <View className="flex-row items-center mb-3">
                        <UserPlus size={16} color="#a855f7" />
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold ml-1">HIRING REQUEST</Text>
                      </View>

                      {/* Candidate Info Header */}
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-row items-start flex-1">
                          <View className="bg-purple-500/20 rounded-full w-12 h-12 items-center justify-center mr-3">
                            <Text className="text-2xl">
                              {candidate.role === 'FractionalExec' ? '👔' : '🎓'}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-purple-900 dark:text-purple-100 font-black text-base">{candidate.name}</Text>
                            <Text className="text-purple-700 dark:text-purple-300 text-sm">{candidate.function}</Text>
                            <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                              <View className="bg-amber-500/20 px-2 py-0.5 rounded">
                                <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold">⭐ {candidate.rating}</Text>
                              </View>
                              <View className={candidate.role === 'FractionalExec' ? 'bg-violet-500/20 px-2 py-0.5 rounded' : 'bg-emerald-500/20 px-2 py-0.5 rounded'}>
                                <Text className={candidate.role === 'FractionalExec' ? 'text-violet-700 dark:text-violet-300 text-xs font-bold' : 'text-emerald-700 dark:text-emerald-300 text-xs font-bold'}>
                                  {candidate.role === 'FractionalExec' ? 'Executive' : 'Apprentice'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View className="items-end ml-2">
                          <Text className="text-purple-700 dark:text-purple-300 font-black text-lg">
                            £{request.proposedDayRate}
                          </Text>
                          <Text className="text-purple-600 dark:text-purple-400 text-xs">/day</Text>
                        </View>
                      </View>

                      {/* Experience */}
                      <View className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 mb-3">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">EXPERIENCE</Text>
                        <Text className="text-gray-900 dark:text-white text-sm">{candidate.experience}</Text>
                      </View>

                      {/* Specialties */}
                      <View className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 mb-3">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">SPECIALTIES</Text>
                        <Text className="text-gray-900 dark:text-white text-sm">{candidate.specialties.join(', ')}</Text>
                      </View>

                      {/* Location */}
                      <View className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 mb-3">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">LOCATION</Text>
                        <Text className="text-gray-900 dark:text-white text-sm">
                          {candidate.location.city}, {candidate.location.country}
                          {candidate.location.remote && ' • Remote'}
                        </Text>
                      </View>

                      {/* Proposed Terms */}
                      <View className="bg-purple-100 dark:bg-purple-900/40 rounded-xl p-3 mb-3">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">PROPOSED TERMS</Text>
                        <Text className="text-purple-900 dark:text-purple-100 text-sm font-semibold">
                          {request.proposedDaysPerWeek} days/week • £{Math.round(request.proposedDayRate * request.proposedDaysPerWeek * 4.33)}/month
                        </Text>
                      </View>

                      {/* Request Notes */}
                      {request.notes && (
                        <View className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 mb-3">
                          <Text className="text-purple-700 dark:text-purple-300 text-xs font-bold mb-1">NOTES</Text>
                          <Text className="text-gray-900 dark:text-white text-sm italic">{request.notes}</Text>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => {
                            handleRejectMarketplaceRequest(request.id);
                            setShowApprovalQueue(false);
                          }}
                          className="flex-1 bg-red-500/20 border border-red-500/30 py-3 rounded-xl active:opacity-70"
                        >
                          <Text className="text-red-700 dark:text-red-400 text-center font-bold text-sm">Reject</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            handleApproveMarketplaceRequest(request.id, request.candidateId);
                            setShowApprovalQueue(false);
                          }}
                          className="flex-1 bg-emerald-500 py-3 rounded-xl active:opacity-70"
                        >
                          <Text className="text-white text-center font-bold text-sm">Approve & Add to Team</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <Text className="text-blue-900 dark:text-blue-100 text-sm">
                    No pending approvals. Hiring requests from the Team Management tab will appear here for founder review.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
