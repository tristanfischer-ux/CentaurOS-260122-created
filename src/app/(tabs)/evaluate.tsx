import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { Briefcase, Plus, X, Clock, Users, Target, ChevronDown, ChevronRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Function as BusinessFunction } from '@/types';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useOrganizationStore } from '@/lib/state/organization-store';

// Submission type for evaluation workflow
interface WorkSubmission {
  id: string;
  workPlanId: string;
  apprenticeName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'changes-requested';
  notes?: string;
}

// Extended work plan type with submissions for evaluation
interface EvaluationWorkPlan extends WorkPlan {
  submissions: WorkSubmission[];
  owner: string;
  assignedTo: string[];
}

// Initialize stores once
if (useWorkPlanStore.getState().workPlans.length === 0) {
  useWorkPlanStore.getState().initializeWorkPlans();
}
if (useOrganizationStore.getState().members.length === 0) {
  useOrganizationStore.getState().initializeOrganization();
}

export default function EvaluateScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  // Use centralized work plan store - SINGLE SOURCE OF TRUTH
  const workPlans = useWorkPlanStore(s => s.workPlans);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const members = useOrganizationStore(s => s.members);

  // Local state for submissions (would be part of store in production)
  const [submissions, setSubmissions] = useState<WorkSubmission[]>(() => {
    // Generate submissions from work plans that need submission
    const initialSubmissions: WorkSubmission[] = [];
    workPlans.forEach(wp => {
      if (wp.needsSubmission && wp.status === 'in-progress') {
        initialSubmissions.push({
          id: `sub-${wp.id}`,
          workPlanId: wp.id,
          apprenticeName: wp.assignedBy, // Using assignedBy as proxy for who submitted
          submittedAt: wp.lastSubmittedAt || new Date().toISOString(),
          status: 'pending',
          notes: wp.feedback,
        });
      }
    });
    return initialSubmissions;
  });

  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<{ plan: EvaluationWorkPlan; submission: WorkSubmission } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const functions: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Ops', 'Finance', 'Admin'];
  const isFounder = currentMembership?.role === 'Founder';
  const isExecutive = currentMembership?.role === 'FractionalExec';
  const canCreatePlans = isFounder || isExecutive;

  // Enrich work plans with submission data and assignee info
  const enrichedWorkPlans = useMemo((): EvaluationWorkPlan[] => {
    return workPlans.map(wp => {
      // Get submissions for this work plan
      const wpSubmissions = submissions.filter(s => s.workPlanId === wp.id);

      // Find apprentices assigned to this function
      const assignedApprentices = members
        .filter(m => m.role === 'Apprentice' && m.function === wp.function && m.status === 'active')
        .map(m => m.name);

      // Find owner (executive for this function)
      const owner = members.find(m =>
        m.role === 'FractionalExec' && m.function === wp.function && m.status === 'active'
      )?.name || wp.assignedBy;

      return {
        ...wp,
        submissions: wpSubmissions,
        owner,
        assignedTo: assignedApprentices.length > 0 ? assignedApprentices : [wp.assignedBy],
      };
    });
  }, [workPlans, submissions, members]);

  // Filter work plans to show only those needing evaluation (with pending submissions)
  const workPlansNeedingEvaluation = useMemo(() => {
    let filtered = enrichedWorkPlans.filter((plan: EvaluationWorkPlan) =>
      plan.submissions.some((s: WorkSubmission) => s.status === 'pending') || plan.needsSubmission
    );

    // Filter by function
    if (selectedFunction !== 'all') {
      filtered = filtered.filter((plan: EvaluationWorkPlan) => plan.function === selectedFunction);
    }

    // Filter by role permissions (executives only see their function's work plans)
    if (isExecutive && !isFounder && currentUser) {
      const currentMember = members.find(m => m.name === currentUser.name);
      if (currentMember?.function) {
        filtered = filtered.filter((plan: EvaluationWorkPlan) => plan.function === currentMember.function);
      }
    }

    return filtered;
  }, [enrichedWorkPlans, selectedFunction, isExecutive, isFounder, currentUser, members]);

  const togglePlan = (planId: string) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedPlans(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'text-gray-500 bg-gray-500/20';
      case 'in-progress':
        return 'text-blue-500 bg-blue-500/20';
      case 'completed':
        return 'text-emerald-500 bg-emerald-500/20';
      case 'blocked':
        return 'text-red-500 bg-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'Not Started';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'blocked':
        return 'Blocked';
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

  const handleReviewSubmission = (action: 'approve' | 'request-changes') => {
    if (!selectedSubmission) return;

    Alert.alert(
      action === 'approve' ? 'Submission Approved' : 'Changes Requested',
      action === 'approve'
        ? `${selectedSubmission.submission.apprenticeName}'s work has been approved.`
        : `Feedback sent to ${selectedSubmission.submission.apprenticeName}.`,
      [{ text: 'OK' }]
    );

    setShowSubmissionModal(false);
    setSelectedSubmission(null);
    setReviewNotes('');
  };

  // Calculate summary stats for items needing evaluation
  const totalPlans = workPlansNeedingEvaluation.length;
  const pendingSubmissions = workPlansNeedingEvaluation.reduce((total: number, plan: EvaluationWorkPlan) =>
    total + plan.submissions.filter((s: WorkSubmission) => s.status === 'pending').length, 0
  );
  const totalSubmissions = workPlansNeedingEvaluation.reduce((total: number, plan: EvaluationWorkPlan) =>
    total + plan.submissions.length, 0
  );

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">Evaluate</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              Work submissions that need evaluation
            </Text>
          </View>
          {canCreatePlans && (
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="bg-blue-500 rounded-xl p-2 active:opacity-70"
            >
              <Plus size={24} color="#fff" />
            </Pressable>
          )}
        </View>

        {/* Summary Stats */}
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <Text className="text-purple-700 dark:text-purple-300 text-xs mb-1">Pending</Text>
            <Text className="text-purple-600 dark:text-purple-400 text-2xl font-bold">{pendingSubmissions}</Text>
          </View>
          <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
            <Text className="text-blue-700 dark:text-blue-300 text-xs mb-1">Total Submissions</Text>
            <Text className="text-blue-600 dark:text-blue-400 text-2xl font-bold">{totalSubmissions}</Text>
          </View>
          <View className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-gray-300 dark:border-slate-800">
            <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Work Plans</Text>
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">{totalPlans}</Text>
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
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {workPlansNeedingEvaluation.length === 0 ? (
          <View className="items-center justify-center py-12">
            <CheckCircle2 size={48} color="#10b981" />
            <Text className="text-emerald-600 dark:text-emerald-400 text-center font-semibold text-lg mt-4">
              All Caught Up!
            </Text>
            <Text className="text-gray-500 dark:text-slate-400 text-center mt-2">
              No submissions waiting for evaluation
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">
              Work Plans with Pending Submissions ({workPlansNeedingEvaluation.length})
            </Text>
            {workPlansNeedingEvaluation.map((plan: EvaluationWorkPlan) => {
              const isExpanded = expandedPlans.has(plan.id);
              const functionColor = getFunctionColor(plan.function);
              const pendingSubmissionsForPlan = plan.submissions.filter((s: WorkSubmission) => s.status === 'pending');

              return (
                <View key={plan.id} className="mb-3">
                  {/* Work Plan Card */}
                  <Pressable
                    onPress={() => togglePlan(plan.id)}
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
                            {plan.function}
                          </Text>
                        </View>

                        <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                          {plan.title}
                        </Text>
                        <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2" numberOfLines={2}>
                          {plan.description}
                        </Text>

                        {/* Linked OKR */}
                        <View className="flex-row items-center mb-2">
                          <Target size={12} color="#8b5cf6" />
                          <Text className="text-purple-600 dark:text-purple-400 text-xs ml-1">
                            {plan.linkedOKRTitle}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-3">
                          <View className="flex-row items-center">
                            <Users size={12} color="#64748b" />
                            <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                              {plan.assignedTo.length} assigned
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <Clock size={12} color="#64748b" />
                            <Text className="text-gray-600 dark:text-slate-400 text-xs ml-1">
                              Due {new Date(plan.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="items-end ml-2">
                        <View className={`px-2 py-1 rounded mb-2 ${getStatusColor(plan.status)}`}>
                          <Text className="text-xs font-semibold">{getStatusText(plan.status)}</Text>
                        </View>
                        {isExpanded ? (
                          <ChevronDown size={20} color="#64748b" />
                        ) : (
                          <ChevronRight size={20} color="#64748b" />
                        )}
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mb-2">
                      <View
                        className={`h-full ${
                          plan.status === 'completed' ? 'bg-emerald-500' :
                          plan.status === 'blocked' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${plan.progress}%` }}
                      />
                    </View>

                    {/* Quick Stats */}
                    <View className="flex-row items-center gap-2 pt-2 border-t border-gray-300 dark:border-slate-700">
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">
                        {plan.progress}% complete
                      </Text>
                      {pendingSubmissionsForPlan.length > 0 && (
                        <>
                          <Text className="text-gray-400 dark:text-slate-600 text-xs">•</Text>
                          <Text className="text-purple-500 text-xs font-semibold">
                            {pendingSubmissionsForPlan.length} pending review
                          </Text>
                        </>
                      )}
                    </View>
                  </Pressable>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View className="mt-2 ml-4">
                      {/* Assigned Apprentices */}
                      <View className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-xl p-3 mb-2">
                        <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-2">
                          Assigned Apprentices
                        </Text>
                        <View className="gap-1">
                          {plan.assignedTo.map((name: string, idx: number) => (
                            <View key={idx} className="flex-row items-center">
                              <Circle size={8} color="#64748b" />
                              <Text className="text-gray-700 dark:text-slate-300 text-sm ml-2">{name}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Submissions */}
                      {plan.submissions.length > 0 && (
                        <View className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-xl p-3">
                          <Text className="text-gray-900 dark:text-white font-semibold text-sm mb-2">
                            Work Submissions ({plan.submissions.length})
                          </Text>
                          <View className="gap-2">
                            {plan.submissions.map((submission: WorkSubmission) => (
                              <Pressable
                                key={submission.id}
                                onPress={() => {
                                  if (canCreatePlans && submission.status === 'pending') {
                                    setSelectedSubmission({ plan, submission });
                                    setShowSubmissionModal(true);
                                  }
                                }}
                                className={`bg-white dark:bg-slate-900 rounded-lg p-2 border ${
                                  submission.status === 'pending'
                                    ? 'border-purple-300 dark:border-purple-700'
                                    : submission.status === 'approved'
                                    ? 'border-emerald-300 dark:border-emerald-700'
                                    : 'border-red-300 dark:border-red-700'
                                } ${submission.status === 'pending' && canCreatePlans ? 'active:opacity-70' : ''}`}
                              >
                                <View className="flex-row items-center justify-between">
                                  <View className="flex-1">
                                    <Text className="text-gray-900 dark:text-white text-sm font-medium">
                                      {submission.apprenticeName}
                                    </Text>
                                    <Text className="text-gray-600 dark:text-slate-400 text-xs">
                                      {submission.submittedAt}
                                    </Text>
                                  </View>
                                  {submission.status === 'pending' && <AlertCircle size={16} color="#a855f7" />}
                                  {submission.status === 'approved' && <CheckCircle2 size={16} color="#10b981" />}
                                  {submission.status === 'changes-requested' && <AlertCircle size={16} color="#ef4444" />}
                                </View>
                                {submission.notes && (
                                  <Text className="text-gray-600 dark:text-slate-400 text-xs mt-1">
                                    {submission.notes}
                                  </Text>
                                )}
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Create Work Plan Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl flex-1" style={{ maxHeight: '90%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">Create Work Plan</Text>
                  <Pressable
                    onPress={() => setShowCreateModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                  >
                    <X size={24} color="#64748b" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
                <Text className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                  Create a work plan linked to an OKR and assign it to apprentices. You'll monitor progress and evaluate submissions here.
                </Text>

                <Pressable
                  onPress={() => {
                    setShowCreateModal(false);
                    Alert.alert('Success', 'Work plan created successfully!');
                  }}
                  className="bg-blue-500 py-4 rounded-xl active:opacity-70"
                >
                  <Text className="text-white text-center font-bold">Create Work Plan</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Submission Review Modal */}
      <Modal
        visible={showSubmissionModal}
        transparent
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubmissionModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">Review Submission</Text>
                <Pressable
                  onPress={() => setShowSubmissionModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800 active:opacity-70"
                >
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
              {selectedSubmission && (
                <>
                  <View className="mb-4">
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                      {selectedSubmission.plan.title}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                      Submitted by {selectedSubmission.submission.apprenticeName}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">
                      {selectedSubmission.submission.submittedAt}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Feedback Notes</Text>
                    <TextInput
                      className="bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[100px]"
                      value={reviewNotes}
                      onChangeText={setReviewNotes}
                      placeholder="Add feedback for the apprentice..."
                      placeholderTextColor="#475569"
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  <View className="flex-row gap-2 mb-4">
                    <Pressable
                      onPress={() => handleReviewSubmission('approve')}
                      className="flex-1 bg-emerald-500 py-3 rounded-xl active:opacity-70"
                    >
                      <Text className="text-white text-center font-bold">Approve</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleReviewSubmission('request-changes')}
                      className="flex-1 bg-red-500 py-3 rounded-xl active:opacity-70"
                    >
                      <Text className="text-white text-center font-bold">Request Changes</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
