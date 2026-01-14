import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { Target, Plus, X, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Users, DollarSign, Lightbulb, ChevronUp, UserPlus, Zap } from 'lucide-react-native';
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

// Initialize OKR store once
if (useOKRStore.getState().okrs.length === 0) {
  useOKRStore.getState().initializeOKRs();
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

  // Marketplace requests
  const allRequests = useMarketplaceRequestsStore((s) => s.requests);
  const approveRequest = useMarketplaceRequestsStore((s) => s.approveRequest);
  const rejectRequest = useMarketplaceRequestsStore((s) => s.rejectRequest);
  const addMember = useOrganizationStore((s) => s.addMember);

  // Filter pending requests with useMemo
  const pendingRequests = useMemo(() => {
    return allRequests.filter((req) => req.status === 'pending');
  }, [allRequests]);

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
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">Decide</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              OKRs requiring decisions and pending approvals
            </Text>
          </View>
          <Pressable
            onPress={() => setShowIdeasModal(true)}
            className="bg-violet-500 rounded-xl p-3 active:opacity-70"
          >
            <Lightbulb size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Summary Stats */}
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <Text className="text-purple-700 dark:text-purple-300 text-xs mb-1">Approvals</Text>
            <Text className="text-purple-600 dark:text-purple-400 text-2xl font-bold">{approvalQueueCount}</Text>
          </View>
          <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <Text className="text-amber-700 dark:text-amber-300 text-xs mb-1">At Risk</Text>
            <Text className="text-amber-600 dark:text-amber-400 text-2xl font-bold">{atRiskOKRs}</Text>
          </View>
          <View className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800">
            <Text className="text-red-700 dark:text-red-300 text-xs mb-1">Off Track</Text>
            <Text className="text-red-600 dark:text-red-400 text-2xl font-bold">{offTrackOKRs}</Text>
          </View>
        </View>

        {/* Function Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          <Pressable
            onPress={() => setSelectedFunction('all')}
            className={`px-4 py-2 rounded-lg ${selectedFunction === 'all' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-800'}`}
          >
            <Text className={`text-sm font-semibold ${selectedFunction === 'all' ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
              All Functions
            </Text>
          </Pressable>
          {functions.map((func) => (
            <Pressable
              key={func}
              onPress={() => setSelectedFunction(func)}
              className={`px-4 py-2 rounded-lg ${selectedFunction === func ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-800'}`}
            >
              <Text className={`text-sm font-semibold ${selectedFunction === func ? 'text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                {func}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Approval Queue Button */}
        {currentMembership?.role === 'Founder' && approvalQueueCount > 0 && (
          <Pressable
            onPress={() => setShowApprovalQueue(true)}
            className="mt-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 flex-row items-center justify-between active:opacity-70"
          >
            <View className="flex-row items-center">
              <Target size={18} color="#a855f7" />
              <Text className="text-purple-700 dark:text-purple-300 font-semibold ml-2">
                Approval Queue ({approvalQueueCount})
              </Text>
            </View>
            <ChevronRight size={18} color="#a855f7" />
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {filteredOKRs.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Target size={48} color="#64748b" />
            <Text className="text-gray-600 dark:text-slate-400 text-center font-semibold text-lg mt-4">
              No OKRs Found
            </Text>
            <Text className="text-gray-500 dark:text-slate-400 text-center mt-2">
              {selectedFunction === 'all' ? 'No OKRs created yet' : `No OKRs for ${selectedFunction}`}
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">
              All OKRs ({filteredOKRs.length})
            </Text>
            {filteredOKRs.map((okr: OKR) => {
            const isExpanded = okr.isExpanded || false;
            const functionColor = getFunctionColor(okr.function);

            return (
              <View key={okr.id} className="mb-3">
                {/* OKR Card */}
                <Pressable
                  onPress={() => toggleOKR(okr.id)}
                  className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      {/* Function Badge */}
                      <View
                        className="self-start px-2 py-1 rounded mb-2"
                        style={{ backgroundColor: functionColor + '20' }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: functionColor }}>
                          {okr.function}
                        </Text>
                      </View>

                      <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                        {okr.title}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                        {okr.description}
                      </Text>

                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center">
                          <Users size={12} color="#64748b" />
                          <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                            {okr.owner}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Clock size={12} color="#64748b" />
                          <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                            {okr.startDate} - {okr.endDate}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="items-end ml-2">
                      <View className={`px-2 py-1 rounded mb-2 ${getStatusColor(okr.status)}`}>
                        <Text className="text-xs font-semibold">{getStatusText(okr.status)}</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronDown size={20} color="#64748b" />
                      ) : (
                        <ChevronRight size={20} color="#64748b" />
                      )}
                    </View>
                  </View>

                  {/* Quick Stats */}
                  <View className="flex-row items-center gap-2 pt-2 border-t border-gray-300 dark:border-slate-800">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">
                      {okr.objectives.length} Key Results
                    </Text>
                    <Text className="text-gray-400 dark:text-slate-600 text-xs">•</Text>
                    <Text className="text-emerald-500 text-xs font-semibold">
                      {okr.objectives.filter((o: Objective) => o.status === 'on-track').length} on track
                    </Text>
                    {okr.objectives.filter((o: Objective) => o.status === 'at-risk').length > 0 && (
                      <>
                        <Text className="text-gray-400 dark:text-slate-600 text-xs">•</Text>
                        <Text className="text-amber-500 text-xs font-semibold">
                          {okr.objectives.filter((o: Objective) => o.status === 'at-risk').length} at risk
                        </Text>
                      </>
                    )}
                  </View>
                </Pressable>

                {/* Expanded Objectives */}
                {isExpanded && (
                  <View className="mt-2 ml-4 space-y-2">
                    {okr.objectives.map((objective: Objective) => (
                      <View
                        key={objective.id}
                        className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-xl p-3"
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1">
                            <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                              {objective.title}
                            </Text>
                            <Text className="text-gray-600 dark:text-slate-400 text-xs">
                              Target: {objective.target} • Current: {objective.current}
                            </Text>
                          </View>
                          <View className={`px-2 py-1 rounded ${getStatusColor(objective.status)}`}>
                            <Text className="text-xs font-semibold">{objective.progress}%</Text>
                          </View>
                        </View>

                        {/* Progress Bar */}
                        <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <View
                            className={`h-full ${objective.status === 'on-track' ? 'bg-emerald-500' : objective.status === 'at-risk' ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${objective.progress}%` }}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Plan OKR Button */}
                {isExpanded && (
                  <View className="mt-3">
                    <Pressable
                      onPress={() => router.push(`/okr-planner?okrId=${okr.id}`)}
                      className="bg-blue-500 rounded-xl py-3 flex-row items-center justify-center gap-2"
                    >
                      <Zap size={18} color="#fff" />
                      <Text className="text-white text-sm font-semibold">
                        Plan Resources
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
          </>
        )}
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
