import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Target, Plus, X, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Users, DollarSign } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import type { Function as BusinessFunction } from '@/types';
import { useOKRStore, type OKR, type Objective } from '@/lib/state/okr-store';

// Initialize OKR store once
if (useOKRStore.getState().okrs.length === 0) {
  useOKRStore.getState().initializeOKRs();
}

export default function DecideScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const params = useLocalSearchParams<{ function?: string }>();

  // Use centralized OKR store
  const okrs = useOKRStore(s => s.okrs);
  const toggleOKRExpanded = useOKRStore(s => s.toggleOKRExpanded);

  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);

  // Set initial function from params if provided
  useEffect(() => {
    if (params.function && params.function !== 'all') {
      setSelectedFunction(params.function as BusinessFunction);
    }
  }, [params.function]);

  const functions: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Ops', 'Finance', 'Admin'];

  // DECIDE tab should show items that require decision-making:
  // For now, we'll show the approval queue prominently and keep at-risk items
  // that may need strategic decisions or resource reallocation
  const okrsNeedingDecisions = selectedFunction === 'all'
    ? okrs.filter(okr => okr.status === 'at-risk' || okr.status === 'off-track')
    : okrs.filter(okr =>
        (okr.status === 'at-risk' || okr.status === 'off-track') &&
        okr.function === selectedFunction
      );

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

  // Calculate summary stats for items needing decisions
  const totalOKRs = okrsNeedingDecisions.length;
  const atRiskOKRs = okrsNeedingDecisions.filter(okr => okr.status === 'at-risk').length;
  const offTrackOKRs = okrsNeedingDecisions.filter(okr => okr.status === 'off-track').length;
  const approvalQueueCount = 3; // In real app, this would be dynamic

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
            onPress={() => setShowCreateModal(true)}
            className="bg-blue-500 rounded-xl p-2 active:opacity-70"
          >
            <Plus size={24} color="#fff" />
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
        {currentMembership?.role === 'Founder' && (
          <Pressable
            onPress={() => setShowApprovalQueue(true)}
            className="mt-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 flex-row items-center justify-between active:opacity-70"
          >
            <View className="flex-row items-center">
              <Target size={18} color="#a855f7" />
              <Text className="text-purple-700 dark:text-purple-300 font-semibold ml-2">
                Approval Queue (3)
              </Text>
            </View>
            <ChevronRight size={18} color="#a855f7" />
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {okrsNeedingDecisions.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Target size={48} color="#10b981" />
            <Text className="text-emerald-600 dark:text-emerald-400 text-center font-semibold text-lg mt-4">
              All OKRs on Track!
            </Text>
            <Text className="text-gray-500 dark:text-slate-400 text-center mt-2">
              No decisions needed for {selectedFunction === 'all' ? 'any function' : selectedFunction}
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">
              OKRs Requiring Attention ({okrsNeedingDecisions.length})
            </Text>
            {okrsNeedingDecisions.map((okr) => {
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
                  <View className="flex-row items-center gap-2 pt-2 border-t border-gray-300 dark:border-slate-700">
                    <Text className="text-gray-600 dark:text-slate-400 text-xs">
                      {okr.objectives.length} Key Results
                    </Text>
                    <Text className="text-gray-400 dark:text-slate-600 text-xs">•</Text>
                    <Text className="text-emerald-500 text-xs font-semibold">
                      {okr.objectives.filter(o => o.status === 'on-track').length} on track
                    </Text>
                    {okr.objectives.filter(o => o.status === 'at-risk').length > 0 && (
                      <>
                        <Text className="text-gray-400 dark:text-slate-600 text-xs">•</Text>
                        <Text className="text-amber-500 text-xs font-semibold">
                          {okr.objectives.filter(o => o.status === 'at-risk').length} at risk
                        </Text>
                      </>
                    )}
                  </View>
                </Pressable>

                {/* Expanded Objectives */}
                {isExpanded && (
                  <View className="mt-2 ml-4 space-y-2">
                    {okr.objectives.map((objective) => (
                      <View
                        key={objective.id}
                        className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3"
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
              </View>
            );
          })}
          </>
        )}
      </ScrollView>

      {/* Create OKR Modal (Simplified) */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="w-full">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '80%' }}>
              <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 dark:text-white text-xl font-bold">Create OKR</Text>
                  <Pressable onPress={() => setShowCreateModal(false)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
                <Text className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                  Create a new OKR and assign it to a function. Executives will create work plans based on these OKRs.
                </Text>

                <Text className="text-gray-900 dark:text-white font-semibold mb-2">Function</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {functions.map((func) => (
                    <Pressable
                      key={func}
                      className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-slate-800"
                    >
                      <Text className="text-gray-700 dark:text-slate-300 text-sm">{func}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={() => {
                    setShowCreateModal(false);
                    Alert.alert('Success', 'OKR created successfully!');
                  }}
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
      <Modal visible={showApprovalQueue} transparent animationType="fade" onRequestClose={() => setShowApprovalQueue(false)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-3xl w-full" style={{ maxHeight: '85%' }}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-300 dark:border-slate-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">Approval Queue</Text>
                <Pressable onPress={() => setShowApprovalQueue(false)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={true} className="px-6 py-4">
              <Text className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                Review and approve resource allocation requests from executives and apprentices.
              </Text>

              {/* Demo approval items */}
              <View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-3">
                <Text className="text-purple-900 dark:text-purple-100 font-semibold mb-2">
                  Request: Add Apprentice to Marketing OKR
                </Text>
                <Text className="text-purple-700 dark:text-purple-300 text-sm mb-3">
                  Priya Sharma requests to add Emily Carter (Marketing Apprentice) to "Build Brand Awareness" work package.
                </Text>
                <View className="flex-row gap-2">
                  <Pressable className="flex-1 bg-emerald-500 py-2 rounded-lg active:opacity-70">
                    <Text className="text-white text-center font-semibold text-sm">Approve</Text>
                  </Pressable>
                  <Pressable className="flex-1 bg-gray-300 dark:bg-slate-700 py-2 rounded-lg active:opacity-70">
                    <Text className="text-gray-700 dark:text-slate-300 text-center font-semibold text-sm">Reject</Text>
                  </Pressable>
                </View>
              </View>

              <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <Text className="text-blue-900 dark:text-blue-100 text-sm">
                  Approval requests from the Community tab will appear here for founder review.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
