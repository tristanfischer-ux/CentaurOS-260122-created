import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { Briefcase, Plus, X, Clock, Target, CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Function as BusinessFunction } from '@/types';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';

// Initialize work plan store once
if (useWorkPlanStore.getState().workPlans.length === 0) {
  useWorkPlanStore.getState().initializeWorkPlans();
}

export default function DoScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  // Use centralized work plan store
  const getApprenticeWorkPlans = useWorkPlanStore(s => s.getApprenticeWorkPlans);
  const getFounderWorkPlansByFunction = useWorkPlanStore(s => s.getFounderWorkPlansByFunction);
  const getExecutiveWorkPlans = useWorkPlanStore(s => s.getExecutiveWorkPlans);

  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WorkPlan | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');

  const functions: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Ops', 'Finance', 'Admin'];
  const isFounder = currentMembership?.role === 'Founder';
  const isExecutive = currentMembership?.role === 'FractionalExec';
  const isApprentice = currentMembership?.role === 'Apprentice';

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

  const handleSubmitWork = () => {
    if (!selectedPlan) return;

    Alert.alert(
      'Work Submitted',
      `Your work for "${selectedPlan.title}" has been submitted for review.`,
      [{ text: 'OK' }]
    );

    setShowSubmitModal(false);
    setSelectedPlan(null);
    setSubmissionNotes('');
  };

  const handleReportProgress = (plan: WorkPlan) => {
    Alert.alert(
      'Report Progress',
      'Progress update recorded. Your executive will be notified.',
      [{ text: 'OK' }]
    );
  };

  // Render for Apprentices - only show active work that needs to be done
  if (isApprentice) {
    const myWorkPlans = getApprenticeWorkPlans();
    const activePlans = myWorkPlans.filter(p => p.status === 'in-progress' || p.status === 'not-started' || p.status === 'blocked');
    const completedPlans = myWorkPlans.filter(p => p.status === 'completed');

    return (
      <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Do</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
            Active work plans requiring your attention
          </Text>

          {/* Summary Stats */}
          <View className="flex-row gap-3 mt-3">
            <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
              <Text className="text-blue-700 dark:text-blue-300 text-xs mb-1">Active</Text>
              <Text className="text-blue-600 dark:text-blue-400 text-2xl font-bold">{activePlans.length}</Text>
            </View>
            <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
              <Text className="text-emerald-700 dark:text-emerald-300 text-xs mb-1">Completed</Text>
              <Text className="text-emerald-600 dark:text-emerald-400 text-2xl font-bold">{completedPlans.length}</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          {activePlans.length === 0 ? (
            <View className="items-center justify-center py-12">
              <CheckCircle2 size={48} color="#10b981" />
              <Text className="text-emerald-600 dark:text-emerald-400 text-center font-semibold text-lg mt-4">
                All Work Complete!
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-center mt-2">
                No active work plans at the moment
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">
                Work That Needs Doing ({activePlans.length})
              </Text>

              {activePlans.map((plan) => {
                const isExpanded = expandedPlans.has(plan.id);
                const functionColor = getFunctionColor(plan.function);

                return (
                  <View key={plan.id} className="mb-3">
                    <Pressable
                      onPress={() => togglePlan(plan.id)}
                      className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-2xl p-4 active:opacity-70"
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
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

                          <View className="flex-row items-center mb-2">
                            <Target size={12} color="#8b5cf6" />
                            <Text className="text-purple-600 dark:text-purple-400 text-xs ml-1">
                              {plan.linkedOKRTitle}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-3">
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

                      <Text className="text-gray-600 dark:text-slate-400 text-xs">
                        {plan.progress}% complete • Assigned by {plan.assignedBy}
                      </Text>
                    </Pressable>

                    {/* Expanded Actions */}
                    {isExpanded && (
                      <View className="mt-2 ml-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3">
                        <Text className="text-gray-900 dark:text-white text-sm mb-2">{plan.description}</Text>

                        <View className="flex-row gap-2 mt-3">
                          <Pressable
                            onPress={() => handleReportProgress(plan)}
                            className="flex-1 bg-blue-500 py-2 rounded-lg active:opacity-70"
                          >
                            <Text className="text-white text-center font-semibold text-sm">Report Progress</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setSelectedPlan(plan);
                              setShowSubmitModal(true);
                            }}
                            className="flex-1 bg-emerald-500 py-2 rounded-lg active:opacity-70"
                          >
                            <Text className="text-white text-center font-semibold text-sm">Submit Work</Text>
                          </Pressable>
                        </View>

                        {plan.needsSubmission && plan.lastSubmittedAt && (
                          <View className="mt-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2">
                            <Text className="text-purple-700 dark:text-purple-300 text-xs">
                              Last submitted: {plan.lastSubmittedAt}
                            </Text>
                          </View>
                        )}

                        {plan.feedback && (
                          <View className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                            <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
                              Feedback:
                            </Text>
                            <Text className="text-blue-600 dark:text-blue-400 text-xs">
                              {plan.feedback}
                            </Text>
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

        {/* Submit Work Modal */}
        <Modal visible={showSubmitModal} transparent animationType="fade" onRequestClose={() => setShowSubmitModal(false)}>
          <View className="flex-1 bg-black/70 justify-center items-center px-6">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="w-full">
              <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '70%' }}>
                <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">Submit Work</Text>
                    <Pressable onPress={() => setShowSubmitModal(false)}>
                      <X size={24} color="#94a3b8" />
                    </Pressable>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
                  {selectedPlan && (
                    <>
                      <Text className="text-gray-900 dark:text-white font-bold text-base mb-2">
                        {selectedPlan.title}
                      </Text>

                      <View className="mb-4">
                        <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                          Submission Notes (Optional)
                        </Text>
                        <TextInput
                          className="bg-gray-200 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[100px]"
                          value={submissionNotes}
                          onChangeText={setSubmissionNotes}
                          placeholder="Add notes about your work..."
                          placeholderTextColor="#475569"
                          multiline
                          textAlignVertical="top"
                        />
                      </View>

                      <Pressable
                        onPress={handleSubmitWork}
                        className="bg-emerald-500 py-4 rounded-xl active:opacity-70"
                      >
                        <Text className="text-white text-center font-bold">Submit for Review</Text>
                      </Pressable>
                    </>
                  )}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    );
  }

  // Render for Founders - organized by function, showing only active work
  if (isFounder) {
    const filteredFunctions = selectedFunction === 'all'
      ? functions
      : [selectedFunction];

    // Filter to show only active work plans (not completed)
    const activeWorkPlansByFunction: Record<BusinessFunction, WorkPlan[]> = {
      Marketing: getFounderWorkPlansByFunction('Marketing').filter(p => p.status !== 'completed'),
      Sales: getFounderWorkPlansByFunction('Sales').filter(p => p.status !== 'completed'),
      Engineering: getFounderWorkPlansByFunction('Engineering').filter(p => p.status !== 'completed'),
      Ops: getFounderWorkPlansByFunction('Ops').filter(p => p.status !== 'completed'),
      Finance: getFounderWorkPlansByFunction('Finance').filter(p => p.status !== 'completed'),
      Admin: getFounderWorkPlansByFunction('Admin').filter(p => p.status !== 'completed'),
    };

    return (
      <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Do</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
            Active work plans that need to be done
          </Text>

          {/* Function Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mt-3">
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
          {filteredFunctions.map((func) => {
            const plansForFunction = activeWorkPlansByFunction[func] || [];
            if (plansForFunction.length === 0) return null;

            const functionColor = getFunctionColor(func);

            return (
              <View key={func} className="mb-4">
                <View
                  className="px-3 py-2 rounded-lg mb-2"
                  style={{ backgroundColor: functionColor + '20' }}
                >
                  <Text className="font-bold text-base" style={{ color: functionColor }}>
                    {func} ({plansForFunction.length})
                  </Text>
                </View>

                {plansForFunction.map((plan) => (
                  <View
                    key={plan.id}
                    className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-2xl p-4 mb-2"
                  >
                    <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                      {plan.title}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2" numberOfLines={2}>
                      {plan.description}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <View className={`px-2 py-1 rounded ${getStatusColor(plan.status)}`}>
                        <Text className="text-xs font-semibold">{getStatusText(plan.status)}</Text>
                      </View>
                      <Text className="text-gray-600 dark:text-slate-400 text-xs">
                        {plan.progress}% complete
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // Render for Executives - only their active work plans
  if (isExecutive) {
    const execFunction = currentMembership?.function || 'Marketing';
    const myWorkPlans = getExecutiveWorkPlans(execFunction as BusinessFunction).filter(p => p.status !== 'completed');

    return (
      <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold">Do</Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
            Active work plans you're responsible for
          </Text>
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          {myWorkPlans.map((plan) => {
            const functionColor = getFunctionColor(plan.function);

            return (
              <View
                key={plan.id}
                className="bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-2xl p-4 mb-3"
              >
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
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                  {plan.description}
                </Text>

                <View className="flex-row items-center justify-between">
                  <View className={`px-2 py-1 rounded ${getStatusColor(plan.status)}`}>
                    <Text className="text-xs font-semibold">{getStatusText(plan.status)}</Text>
                  </View>
                  <Text className="text-gray-600 dark:text-slate-400 text-xs">
                    {plan.progress}% complete
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return null;
}
