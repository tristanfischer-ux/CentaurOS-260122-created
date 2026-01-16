/**
 * Why Tab - Strategic Planning
 * Company objectives, OKRs, and business improvements
 */

import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Target,
  Compass,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Zap,
  Star,
  Flag,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { useOKRStore, type OKR } from '@/lib/state/okr-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useCompanyAimStore } from '@/lib/state/company-aim-store';
import { useBusinessImprovementsStore } from '@/lib/state/business-improvements-store';
import type { Function as BusinessFunction } from '@/types';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { CompanyAimModal } from '@/components/CompanyAimModal';
import { BusinessImprovements } from '@/components/BusinessImprovements';

const WHY_HELP: HelpContent = {
  title: 'Strategic Planning',
  subtitle: 'Define your mission and objectives',
  description: 'The Why tab helps you articulate your company mission, set strategic objectives (OKRs), and review AI-generated improvement recommendations. This is where strategy meets execution.',
  tips: [
    'Start with your Company Aim - a clear statement of what you\'re building and why',
    'OKRs (Objectives & Key Results) translate your aim into measurable goals',
    'Business Improvements are AI-generated suggestions based on your current data',
    'Link tasks to OKRs to track how execution connects to strategy',
    'Review and update your strategy quarterly to stay aligned',
  ],
  quickActions: [
    { label: 'Company Aim', description: 'Define your mission statement and company purpose' },
    { label: 'Objectives', description: 'Set high-level goals by business function' },
    { label: 'Improvements', description: 'Review AI-generated recommendations for your business' },
  ],
};

const STATUS_COLORS = {
  'on-track': '#10b981',
  'at-risk': '#f59e0b',
  'off-track': '#ef4444',
};

const FUNCTION_COLORS: Record<string, string> = {
  Marketing: '#ec4899',
  Sales: '#f59e0b',
  Finance: '#10b981',
  Engineering: '#3b82f6',
  Ops: '#8b5cf6',
  Admin: '#64748b',
};

export default function WhyScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();

  // Stores
  const okrs = useOKRStore(s => s.okrs);
  const addOKR = useOKRStore(s => s.addOKR);
  const getAimByWorkspace = useCompanyAimStore(s => s.getAimByWorkspace);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // Get company aim for current workspace
  const companyAimData = currentWorkspace ? getAimByWorkspace(currentWorkspace.id) : undefined;
  const companyAim = companyAimData?.aim;

  // State
  const [showHelp, setShowHelp] = useState(false);
  const [showAimModal, setShowAimModal] = useState(false);
  const [showCreateOKRModal, setShowCreateOKRModal] = useState(false);
  const [expandedOKRs, setExpandedOKRs] = useState<Set<string>>(new Set());
  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');

  // OKR form state
  const [newOKRTitle, setNewOKRTitle] = useState('');
  const [newOKRFunction, setNewOKRFunction] = useState<BusinessFunction>('Engineering');

  const isFounder = currentMembership?.role === 'Founder';

  // Filter OKRs by workspace and function
  const filteredOKRs = useMemo(() => {
    return okrs.filter(okr => {
      const matchesWorkspace = !currentWorkspace || okr.workspaceId === currentWorkspace.id;
      const matchesFunction = selectedFunction === 'all' || okr.function === selectedFunction;
      return matchesWorkspace && matchesFunction;
    });
  }, [okrs, currentWorkspace, selectedFunction]);

  // Group OKRs by status
  const okrsByStatus = useMemo(() => {
    const grouped = {
      'on-track': [] as OKR[],
      'at-risk': [] as OKR[],
      'off-track': [] as OKR[],
    };
    filteredOKRs.forEach(okr => {
      if (grouped[okr.status]) {
        grouped[okr.status].push(okr);
      }
    });
    return grouped;
  }, [filteredOKRs]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (filteredOKRs.length === 0) return 0;
    const totalProgress = filteredOKRs.reduce((sum, okr) => {
      const okrProgress = okr.objectives.reduce((objSum, obj) => objSum + (obj.progress || 0), 0) / Math.max(okr.objectives.length, 1);
      return sum + okrProgress;
    }, 0);
    return Math.round(totalProgress / filteredOKRs.length);
  }, [filteredOKRs]);

  // Count linked tasks per OKR
  const getLinkedTaskCount = (okr: OKR) => {
    return workPlans.filter(wp => wp.linkedOKRTitle === okr.title).length;
  };

  const toggleOKRExpanded = (id: string) => {
    setExpandedOKRs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle OKR creation
  const handleCreateOKR = () => {
    if (!newOKRTitle.trim() || !currentWorkspace) return;

    const newOKR: OKR = {
      id: `okr-${Date.now()}`,
      workspaceId: currentWorkspace.id,
      title: newOKRTitle.trim(),
      description: '',
      function: newOKRFunction,
      owner: currentMembership?.id || 'founder',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'on-track',
      queueStatus: 'not_queued',
      objectives: [],
      isExpanded: false,
    };

    addOKR(newOKR);
    setNewOKRTitle('');
    setShowCreateOKRModal(false);
  };

  // OKR Card component
  const OKRCard = ({ okr, index }: { okr: OKR; index: number }) => {
    const isExpanded = expandedOKRs.has(okr.id);
    const statusColor = STATUS_COLORS[okr.status];
    const functionColor = FUNCTION_COLORS[okr.function] || '#64748b';
    const linkedTasks = getLinkedTaskCount(okr);
    const progress = okr.objectives.length > 0
      ? Math.round(okr.objectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / okr.objectives.length)
      : 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <Pressable
          onPress={() => toggleOKRExpanded(okr.id)}
          className="bg-white dark:bg-slate-800 rounded-xl mb-3 overflow-hidden"
        >
          {/* Header */}
          <View className="p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColor }}
                  />
                  <View
                    className="px-2 py-0.5 rounded"
                    style={{ backgroundColor: functionColor + '20' }}
                  >
                    <Text style={{ color: functionColor }} className="text-xs font-medium">
                      {okr.function}
                    </Text>
                  </View>
                </View>
                <Text className="text-slate-900 dark:text-white font-semibold text-base">
                  {okr.title}
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-slate-900 dark:text-white font-bold text-lg">
                  {progress}%
                </Text>
                {isExpanded ? (
                  <ChevronUp size={18} color="#64748b" />
                ) : (
                  <ChevronDown size={18} color="#64748b" />
                )}
              </View>
            </View>

            {/* Progress bar */}
            <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${progress}%`, backgroundColor: statusColor }}
              />
            </View>

            {/* Meta */}
            <View className="flex-row items-center gap-4 mt-3">
              <View className="flex-row items-center gap-1">
                <Target size={12} color="#64748b" />
                <Text className="text-slate-500 dark:text-slate-400 text-xs">
                  {okr.objectives.length} key results
                </Text>
              </View>
              {linkedTasks > 0 && (
                <View className="flex-row items-center gap-1">
                  <CheckCircle2 size={12} color="#64748b" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    {linkedTasks} linked tasks
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Expanded content */}
          {isExpanded && okr.objectives.length > 0 && (
            <View className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700">
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 uppercase">
                Key Results
              </Text>
              {okr.objectives.map((obj, i) => (
                <View key={obj.id} className="flex-row items-center gap-3 py-2">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: (obj.progress || 0) >= 100 ? '#10b98120' :
                        (obj.progress || 0) >= 50 ? '#f59e0b20' : '#64748b20',
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color: (obj.progress || 0) >= 100 ? '#10b981' :
                          (obj.progress || 0) >= 50 ? '#f59e0b' : '#64748b',
                      }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-700 dark:text-slate-300 text-sm">
                      {obj.title}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${obj.progress || 0}%` }}
                        />
                      </View>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs w-10 text-right">
                        {obj.progress || 0}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={WHY_HELP}
        gradientColors={['#8b5cf6', '#6d28d9']}
      />

      {/* Company Aim Modal */}
      <CompanyAimModal
        visible={showAimModal}
        onClose={() => setShowAimModal(false)}
        workspaceId={currentWorkspace?.id || ''}
      />

      {/* Create OKR Modal */}
      <Modal
        visible={showCreateOKRModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateOKRModal(false)}
      >
        <Pressable className="flex-1 bg-black/70" onPress={() => setShowCreateOKRModal(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '70%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-slate-900 dark:text-white font-bold text-xl">New Objective</Text>
                <Pressable onPress={() => setShowCreateOKRModal(false)} className="p-2">
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>

              {/* Title */}
              <View className="mb-4">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Objective Title</Text>
                <TextInput
                  value={newOKRTitle}
                  onChangeText={setNewOKRTitle}
                  placeholder="What do you want to achieve?"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                />
              </View>

              {/* Function */}
              <View className="mb-6">
                <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">Business Function</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {(['Marketing', 'Sales', 'Finance', 'Engineering', 'Ops', 'Admin'] as BusinessFunction[]).map(func => (
                      <Pressable
                        key={func}
                        onPress={() => setNewOKRFunction(func)}
                        className={`px-4 py-2 rounded-lg ${newOKRFunction === func ? 'bg-purple-500' : 'bg-slate-100 dark:bg-slate-800'}`}
                      >
                        <Text className={`font-medium ${newOKRFunction === func ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          {func}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Create Button */}
              <Pressable
                onPress={handleCreateOKR}
                className="bg-purple-500 py-4 rounded-xl items-center"
                disabled={!newOKRTitle.trim()}
              >
                <Text className="text-white font-bold text-base">Create Objective</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
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
            <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">Strategy</Text>
            <Text className="text-white text-2xl font-bold">Why</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {isFounder && (
              <Pressable
                onPress={() => setShowCreateOKRModal(true)}
                className="bg-white/20 p-2 rounded-full"
              >
                <Plus size={20} color="white" />
              </Pressable>
            )}
            <SettingsGearButton style="glass" />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>
        </View>

        {/* Overall Progress */}
        <View className="bg-white/10 rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white/70 text-sm">Overall Progress</Text>
            <Text className="text-white font-bold text-xl">{overallProgress}%</Text>
          </View>
          <View className="h-2 bg-white/20 rounded-full overflow-hidden">
            <View
              className="h-full bg-white rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </View>
          <View className="flex-row justify-between mt-3">
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-emerald-400" />
              <Text className="text-white/70 text-xs">{okrsByStatus['on-track'].length} on track</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-amber-400" />
              <Text className="text-white/70 text-xs">{okrsByStatus['at-risk'].length} at risk</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-red-400" />
              <Text className="text-white/70 text-xs">{okrsByStatus['off-track'].length} off track</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
      >
        {/* Company Aim */}
        <Pressable
          onPress={() => setShowAimModal(true)}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-4 mb-6"
        >
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 12, padding: 16 }}
          >
            <View className="flex-row items-center gap-3 mb-2">
              <Compass size={24} color="white" />
              <Text className="text-white font-bold text-lg">Company Aim</Text>
            </View>
            {companyAim ? (
              <Text className="text-white/90 text-sm leading-relaxed">
                {companyAim}
              </Text>
            ) : (
              <Text className="text-white/70 text-sm italic">
                Tap to define your company's mission and purpose...
              </Text>
            )}
            <View className="flex-row items-center gap-1 mt-3">
              <Text className="text-white/70 text-xs">Tap to edit</Text>
              <ArrowRight size={12} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Function Filter */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {['all', 'Marketing', 'Sales', 'Finance', 'Engineering', 'Ops', 'Admin'].map(func => (
                <Pressable
                  key={func}
                  onPress={() => setSelectedFunction(func as BusinessFunction | 'all')}
                  className={`px-3 py-1.5 rounded-full ${
                    selectedFunction === func ? 'bg-purple-500' : 'bg-white dark:bg-slate-800'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedFunction === func ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {func === 'all' ? 'All' : func}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* OKRs */}
        {filteredOKRs.length > 0 ? (
          <View className="mb-6">
            <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">
              Objectives ({filteredOKRs.length})
            </Text>
            {filteredOKRs.map((okr, index) => (
              <OKRCard key={okr.id} okr={okr} index={index} />
            ))}
          </View>
        ) : (
          <View className="items-center py-8 mb-6">
            <Target size={48} color="#94a3b8" />
            <Text className="text-slate-500 dark:text-slate-400 text-center mt-4">
              No objectives yet
            </Text>
            {isFounder && (
              <Pressable
                onPress={() => setShowCreateOKRModal(true)}
                className="mt-4 bg-purple-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Create First Objective</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Business Improvements */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Sparkles size={18} color="#f59e0b" />
            <Text className="text-slate-900 dark:text-white font-semibold text-base">
              AI Recommendations
            </Text>
          </View>
          <BusinessImprovements />
        </View>
      </ScrollView>
    </View>
  );
}
