import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Target, Plus, X, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Users, DollarSign } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import type { Function as BusinessFunction } from '@/types';

interface OKR {
  id: string;
  function: BusinessFunction;
  title: string;
  description: string;
  owner: string;
  startDate: string;
  endDate: string;
  status: 'on-track' | 'at-risk' | 'off-track';
  objectives: Objective[];
  isExpanded?: boolean;
}

interface Objective {
  id: string;
  title: string;
  target: string;
  current: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'off-track';
}

// Demo OKRs organized by function
const FUNCTION_OKRS: OKR[] = [
  {
    id: 'okr-marketing-1',
    function: 'Marketing',
    title: 'Build Brand Awareness & Generate Leads',
    description: 'Establish market presence and create demand for our hardware product',
    owner: 'Priya Sharma',
    startDate: 'Q1 2026',
    endDate: 'Q4 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-m1', title: 'Achieve 50K website visitors/month', target: '50,000', current: '32,000', progress: 64, status: 'on-track' },
      { id: 'kr-m2', title: 'Generate 500 qualified leads', target: '500', current: '287', progress: 57, status: 'on-track' },
      { id: 'kr-m3', title: 'Reach 10K social media followers', target: '10,000', current: '6,200', progress: 62, status: 'on-track' },
    ],
  },
  {
    id: 'okr-sales-1',
    function: 'Sales',
    title: 'Achieve Product-Market Fit with 100 Customers',
    description: 'Validate product-market fit through customer acquisition and revenue',
    owner: 'Sarah Mitchell',
    startDate: 'Q1 2026',
    endDate: 'Q4 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-s1', title: 'Close 100 customers', target: '100', current: '67', progress: 67, status: 'on-track' },
      { id: 'kr-s2', title: 'Reach £500K ARR', target: '£500,000', current: '£312,000', progress: 62, status: 'on-track' },
      { id: 'kr-s3', title: 'Achieve 85% customer satisfaction', target: '85%', current: '91%', progress: 100, status: 'on-track' },
    ],
  },
  {
    id: 'okr-bom-1',
    function: 'Engineering',
    title: 'Finalize Bill of Materials & Reduce COGS by 20%',
    description: 'Optimize product design and supply chain to hit target unit economics',
    owner: 'Marcus Rodriguez',
    startDate: 'Q1 2026',
    endDate: 'Q2 2026',
    status: 'at-risk',
    objectives: [
      { id: 'kr-b1', title: 'Reduce COGS from £80 to £64/unit', target: '£64', current: '£72', progress: 50, status: 'at-risk' },
      { id: 'kr-b2', title: 'Finalize BOM with 95% component sourcing', target: '95%', current: '88%', progress: 93, status: 'on-track' },
      { id: 'kr-b3', title: 'Complete 3 design iterations', target: '3', current: '2', progress: 67, status: 'on-track' },
    ],
  },
  {
    id: 'okr-engineering-1',
    function: 'Engineering',
    title: 'Ship Production-Ready Hardware v1.0',
    description: 'Complete product development and pass all quality certifications',
    owner: 'Marcus Rodriguez',
    startDate: 'Q1 2026',
    endDate: 'Q3 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-e1', title: 'Pass CE & FCC certifications', target: '2', current: '1', progress: 50, status: 'on-track' },
      { id: 'kr-e2', title: 'Achieve <2% defect rate in production', target: '<2%', current: '3.1%', progress: 60, status: 'at-risk' },
      { id: 'kr-e3', title: 'Complete 100 unit pilot run', target: '100', current: '100', progress: 100, status: 'on-track' },
    ],
  },
  {
    id: 'okr-ops-1',
    function: 'Ops',
    title: 'Scale Manufacturing to 1000 Units/Month',
    description: 'Build operational capacity to meet initial market demand',
    owner: 'Thomas Anderson',
    startDate: 'Q2 2026',
    endDate: 'Q4 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-o1', title: 'Onboard 3 contract manufacturers', target: '3', current: '2', progress: 67, status: 'on-track' },
      { id: 'kr-o2', title: 'Achieve 95% on-time delivery rate', target: '95%', current: '89%', progress: 94, status: 'on-track' },
      { id: 'kr-o3', title: 'Reduce lead time to 4 weeks', target: '4 weeks', current: '6 weeks', progress: 50, status: 'at-risk' },
    ],
  },
  {
    id: 'okr-finance-1',
    function: 'Finance',
    title: 'Raise £2M Seed Round & Extend Runway to 18 Months',
    description: 'Secure funding and manage burn rate to reach profitability',
    owner: 'James Chen',
    startDate: 'Q1 2026',
    endDate: 'Q2 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-f1', title: 'Close £2M seed round', target: '£2,000,000', current: '£1,500,000', progress: 75, status: 'on-track' },
      { id: 'kr-f2', title: 'Reduce monthly burn to £80K', target: '£80,000', current: '£95,000', progress: 70, status: 'at-risk' },
      { id: 'kr-f3', title: 'Reach 18-month runway', target: '18', current: '14', progress: 78, status: 'on-track' },
    ],
  },
  {
    id: 'okr-finance-2',
    function: 'Finance',
    title: 'Achieve Unit Economics Profitability',
    description: 'Ensure positive unit economics before scaling production',
    owner: 'James Chen',
    startDate: 'Q2 2026',
    endDate: 'Q3 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-f4', title: 'Reach 40% gross margin', target: '40%', current: '35%', progress: 88, status: 'on-track' },
      { id: 'kr-f5', title: 'Reduce CAC to <£200', target: '£200', current: '£245', progress: 70, status: 'at-risk' },
      { id: 'kr-f6', title: 'Achieve LTV:CAC ratio of 3:1', target: '3:1', current: '2.4:1', progress: 80, status: 'on-track' },
    ],
  },
  {
    id: 'okr-legal-1',
    function: 'Admin',
    title: 'Complete Legal & Compliance Foundation',
    description: 'Establish legal structure and protect intellectual property',
    owner: 'Founder',
    startDate: 'Q1 2026',
    endDate: 'Q2 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-l1', title: 'File 2 patent applications', target: '2', current: '1', progress: 50, status: 'on-track' },
      { id: 'kr-l2', title: 'Complete supplier contracts', target: '5', current: '4', progress: 80, status: 'on-track' },
      { id: 'kr-l3', title: 'Finalize customer T&Cs and privacy policy', target: '2', current: '2', progress: 100, status: 'on-track' },
    ],
  },
];

export default function DecideScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const params = useLocalSearchParams<{ function?: string }>();

  const [expandedOKRs, setExpandedOKRs] = useState<Set<string>>(new Set());
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

  const filteredOKRs = selectedFunction === 'all'
    ? FUNCTION_OKRS
    : FUNCTION_OKRS.filter(okr => okr.function === selectedFunction);

  const toggleOKR = (okrId: string) => {
    const newExpanded = new Set(expandedOKRs);
    if (newExpanded.has(okrId)) {
      newExpanded.delete(okrId);
    } else {
      newExpanded.add(okrId);
    }
    setExpandedOKRs(newExpanded);
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
  const onTrackOKRs = filteredOKRs.filter(okr => okr.status === 'on-track').length;
  const atRiskOKRs = filteredOKRs.filter(okr => okr.status === 'at-risk').length;

  return (
    <View className="flex-1 bg-white dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-300 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">Decide</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-0.5">
              Strategic objectives and key results by function
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
          <View className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl p-3 border border-gray-300 dark:border-slate-800">
            <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Total OKRs</Text>
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">{totalOKRs}</Text>
          </View>
          <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
            <Text className="text-emerald-700 dark:text-emerald-300 text-xs mb-1">On Track</Text>
            <Text className="text-emerald-600 dark:text-emerald-400 text-2xl font-bold">{onTrackOKRs}</Text>
          </View>
          <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <Text className="text-amber-700 dark:text-amber-300 text-xs mb-1">At Risk</Text>
            <Text className="text-amber-600 dark:text-amber-400 text-2xl font-bold">{atRiskOKRs}</Text>
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
        {filteredOKRs.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Target size={48} color="#94a3b8" />
            <Text className="text-gray-500 dark:text-slate-400 text-center mt-4">
              No OKRs for {selectedFunction === 'all' ? 'any function' : selectedFunction}
            </Text>
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-500 px-6 py-3 rounded-xl active:opacity-70"
            >
              <Text className="text-white font-semibold">Create First OKR</Text>
            </Pressable>
          </View>
        ) : (
          filteredOKRs.map((okr) => {
            const isExpanded = expandedOKRs.has(okr.id);
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
          })
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
