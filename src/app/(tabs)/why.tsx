/**
 * Why Tab - LEGACY (now Home drilldown)
 * Company objectives, OKRs, and business improvements
 *
 * MIGRATION NOTE: This tab content is now accessible via Home → Plan/Strategy
 * Keeping the original code for backward compatibility during transition.
 */

import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
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
  Users,
  BarChart3,
  Clock,
  Activity,
  Award,
  AlertTriangle,
  Link as LinkIcon,
  Rocket,
  ClipboardList,
} from 'lucide-react-native';
import { useOKRStore, type OKR } from '@/lib/state/okr-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useCompanyAimStore } from '@/lib/state/company-aim-store';
import { useBusinessImprovementsStore } from '@/lib/state/business-improvements-store';
import { useDecisionsStore } from '@/lib/state/decisions-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import type { Function as BusinessFunction } from '@/types';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { CompanyAimModal } from '@/components/CompanyAimModal';
import { BusinessImprovements } from '@/components/BusinessImprovements';
import { filterOKRsByRole } from '@/lib/role-utils';
import { RoleIndicator } from '@/components/RoleIndicator';
import { UnifiedBottomDrawer } from '@/components/UnifiedBottomDrawer';
import { BrainstormConversationModal } from '@/components/BrainstormConversationModal';
import { SynthesisReviewModal } from '@/components/SynthesisReviewModal';
import { supabase } from '@/lib/supabase';

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
  const decisions = useDecisionsStore(s => s.decisions);
  const members = useOrganizationStore(s => s.members);

  // Fallback: Use first member as current user if currentMembership is null (for demo/dev)
  const effectiveMembership = currentMembership ||
    (members.length > 0
      ? { id: members[0].id, role: members[0].role, function: members[0].function }
      : {
          id: '00000000-0000-0000-0000-000000000001', // Valid UUID for demo
          role: 'Founder' as const,
          function: 'Engineering' as const
        });

  // Fallback: Use demo workspace if currentWorkspace is null
  const effectiveWorkspace = currentWorkspace || {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Demo Workspace',
    ownerId: effectiveMembership.id,
    createdAt: new Date().toISOString(),
  };

  // Get company aim for current workspace
  const companyAimData = effectiveWorkspace ? getAimByWorkspace(effectiveWorkspace.id) : undefined;
  const companyAim = companyAimData?.aim;

  // State
  const [showHelp, setShowHelp] = useState(false);
  const [showAimModal, setShowAimModal] = useState(false);
  const [showCreateOKRModal, setShowCreateOKRModal] = useState(false);
  const [expandedOKRs, setExpandedOKRs] = useState<Set<string>>(new Set());
  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | 'all'>('all');
  const [showVoiceBrainstorm, setShowVoiceBrainstorm] = useState(false);
  const [voiceBrainstormText, setVoiceBrainstormText] = useState('');
  const [showConversation, setShowConversation] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSynthesisReview, setShowSynthesisReview] = useState(false);
  const [synthesizedObjectives, setSynthesizedObjectives] = useState<any[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // OKR form state
  const [newOKRTitle, setNewOKRTitle] = useState('');
  const [newOKRFunction, setNewOKRFunction] = useState<BusinessFunction>('Engineering');

  const isFounder = effectiveMembership?.role === 'Founder';

  // Get user's work plans for role-based filtering
  const userWorkPlans = useMemo(() => {
    if (!effectiveMembership?.id) return [];
    return workPlans.filter(wp =>
      wp.assignedMemberIds?.includes(effectiveMembership.id) ||
      wp.allocations?.some(a => a.memberId === effectiveMembership.id)
    );
  }, [workPlans, effectiveMembership]);

  // Apply role-based filtering first
  const roleFilteredOKRs = useMemo(() => {
    if (!effectiveMembership?.role) return okrs;
    return filterOKRsByRole(
      okrs,
      effectiveMembership.role,
      effectiveMembership.function as BusinessFunction | undefined,
      userWorkPlans
    );
  }, [okrs, effectiveMembership, userWorkPlans]);

  // Filter OKRs by workspace and function (UI filters)
  const filteredOKRs = useMemo(() => {
    return roleFilteredOKRs.filter(okr => {
      const matchesWorkspace = !effectiveWorkspace || okr.workspaceId === effectiveWorkspace.id;
      const matchesFunction = selectedFunction === 'all' || okr.function === selectedFunction;
      return matchesWorkspace && matchesFunction;
    });
  }, [roleFilteredOKRs, effectiveWorkspace, selectedFunction]);

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

  // Strategic Insights Calculations
  const strategicInsights = useMemo(() => {
    // Task-to-OKR Linkage
    const totalTasks = workPlans.filter(wp => wp.workspaceId === currentWorkspace?.id).length;
    const linkedTasks = workPlans.filter(wp => wp.linkedOKRTitle && wp.workspaceId === currentWorkspace?.id).length;
    const linkageRate = totalTasks > 0 ? Math.round((linkedTasks / totalTasks) * 100) : 0;

    // Recent Decisions
    const recentDecisions = decisions
      .filter(d => d.workspaceId === currentWorkspace?.id && d.status === 'decided')
      .sort((a, b) => new Date(b.decidedAt || 0).getTime() - new Date(a.decidedAt || 0).getTime())
      .slice(0, 3);

    // Active Team Members
    const activeMembers = members.filter(m =>
      m.workspaceId === currentWorkspace?.id &&
      m.status === 'active'
    ).length;

    // Function Distribution
    const functionDistribution: Record<string, number> = {};
    filteredOKRs.forEach(okr => {
      functionDistribution[okr.function] = (functionDistribution[okr.function] || 0) + 1;
    });

    // At-Risk Items
    const atRiskCount = okrsByStatus['at-risk'].length + okrsByStatus['off-track'].length;

    // Completion Velocity (tasks completed in last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentlyCompleted = workPlans.filter(wp =>
      wp.status === 'completed' &&
      wp.workspaceId === currentWorkspace?.id &&
      wp.auditRecord?.completedAt &&
      new Date(wp.auditRecord.completedAt).getTime() > thirtyDaysAgo
    ).length;

    return {
      totalTasks,
      linkedTasks,
      linkageRate,
      recentDecisions,
      activeMembers,
      functionDistribution,
      atRiskCount,
      recentlyCompleted,
    };
  }, [workPlans, decisions, members, filteredOKRs, okrsByStatus, currentWorkspace]);

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
    if (!newOKRTitle.trim() || !effectiveWorkspace) return;

    const newOKR: OKR = {
      id: `okr-${Date.now()}`,
      workspaceId: effectiveWorkspace.id,
      title: newOKRTitle.trim(),
      description: '',
      function: newOKRFunction,
      owner: effectiveMembership?.id || 'founder',
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

  // Handle voice brainstorming
  const handleVoiceBrainstorm = (transcript: string) => {
    console.log('[Why Tab] Voice brainstorm received:', transcript);
    setVoiceBrainstormText(transcript);
    setShowVoiceBrainstorm(true);
  };

  const handleStartBrainstorm = async () => {
    console.log('[Why Tab] handleStartBrainstorm called');
    console.log('[Why Tab] State check:', {
      hasVoiceBrainstormText: !!voiceBrainstormText?.trim(),
      voiceBrainstormText: voiceBrainstormText,
      hasWorkspace: !!effectiveWorkspace,
      workspaceId: effectiveWorkspace?.id,
      hasMembership: !!effectiveMembership,
      membershipId: effectiveMembership?.id,
    });

    if (!voiceBrainstormText.trim() || !effectiveWorkspace || !effectiveMembership) {
      console.log('[Why Tab] Missing required data, aborting');
      alert('Missing required data. Please try recording again.');
      return;
    }

    console.log('[Why Tab] Starting brainstorm session with:', voiceBrainstormText);
    setIsCreatingSession(true);

    try {
      // Create brainstorm session directly with Supabase
      console.log('[Why Tab] Creating session in Supabase...');
      const { data: session, error: sessionError } = await supabase
        .from('brainstorm_sessions')
        .insert({
          workspace_id: effectiveWorkspace.id,
          user_id: effectiveMembership.id,
          status: 'active',
          initial_prompt: voiceBrainstormText,
        })
        .select()
        .single();

      if (sessionError) {
        console.log('[Why Tab] Failed to create session:', sessionError);
        console.log('[Why Tab] Supabase error details:', {
          code: sessionError.code,
          message: sessionError.message,
          details: sessionError.details,
        });
        throw new Error(sessionError.message);
      }

      console.log('[Why Tab] Session created successfully:', session.id);

      // Create initial message
      if (voiceBrainstormText) {
        console.log('[Why Tab] Creating initial message...');
        const { error: messageError } = await supabase
          .from('brainstorm_messages')
          .insert({
            session_id: session.id,
            role: 'user',
            content: voiceBrainstormText,
          });

        if (messageError) {
          console.log('[Why Tab] Failed to save initial message:', messageError);
          // Don't fail the request, just log the error
        } else {
          console.log('[Why Tab] Initial message created');
        }
      }

      // Open conversation modal
      console.log('[Why Tab] Opening conversation modal with session:', session.id);
      setCurrentSessionId(session.id);
      setShowVoiceBrainstorm(false);
      setShowConversation(true);
    } catch (error) {
      console.log('[Why Tab] Failed to create session:', error);
      console.log('[Why Tab] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert(`Failed to start brainstorming session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSynthesize = async () => {
    if (!currentSessionId || !effectiveWorkspace || !effectiveMembership) return;

    console.log('[Why Tab] Synthesizing session:', currentSessionId);
    setIsSynthesizing(true);

    try {
      // Call the synthesize API
      const response = await fetch('/api/why/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          workspaceId: effectiveWorkspace.id,
          userId: effectiveMembership.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Why Tab] Synthesis complete:', data);

      // Close conversation and show synthesis review modal
      setShowConversation(false);
      setSynthesizedObjectives(data.objectives || []);
      setShowSynthesisReview(true);
    } catch (error) {
      console.log('[Why Tab] Failed to synthesize:', error);
      alert('Failed to generate objectives. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleConfirmSynthesis = async () => {
    if (!currentWorkspace || !currentMembership) return;

    console.log('[Why Tab] Confirming synthesis with objectives:', synthesizedObjectives);

    try {
      // Create OKRs and tasks from synthesized data
      for (const objective of synthesizedObjectives) {
        // Generate unique ID for OKR
        const okrId = `okr-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Get current quarter for dates
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
        const startDate = `Q${currentQuarter} ${now.getFullYear()}`;
        const endDate = `Q${currentQuarter === 4 ? 1 : currentQuarter + 1} ${currentQuarter === 4 ? now.getFullYear() + 1 : now.getFullYear()}`;

        // Get owner name from members
        const currentUser = members.find(m => m.id === currentMembership.userId);
        const ownerName = currentUser?.name || 'Unassigned';

        // Create OKR
        addOKR({
          id: okrId,
          title: objective.title,
          description: objective.description || '',
          function: 'Engineering', // Default function, could be extracted from AI
          status: 'on-track',
          workspaceId: currentWorkspace.id,
          owner: ownerName,
          startDate,
          endDate,
          objectives: [],
        });

        console.log('[Why Tab] Created OKR:', okrId, objective.title);

        // Create tasks for this objective
        // Note: Tasks are created via the work plan store, but for now we'll just log them
        // In a real implementation, we'd call the task creation API
        for (const task of objective.tasks || []) {
          console.log('[Why Tab] Task to create:', task.title, task.units, 'TU');
          // TODO: Call task creation API
        }
      }

      // Close modal and reset state
      setShowSynthesisReview(false);
      setSynthesizedObjectives([]);
      setCurrentSessionId(null);
      setVoiceBrainstormText('');

      console.log('[Why Tab] Synthesis confirmation complete');
    } catch (error) {
      console.log('[Why Tab] Failed to confirm synthesis:', error);
      alert('Failed to create objectives. Please try again.');
    }
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

        {/* Strategic Health Dashboard */}
        <View className="mb-6">
          <Text className="text-slate-900 dark:text-white font-semibold text-base mb-3">
            Strategic Health
          </Text>
          <View className="flex-row gap-3 mb-3">
            {/* Task-to-OKR Linkage */}
            <View className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <LinkIcon size={16} color="#8b5cf6" />
                <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                  Task Linkage
                </Text>
              </View>
              <Text className="text-slate-900 dark:text-white font-bold text-2xl">
                {strategicInsights.linkageRate}%
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                {strategicInsights.linkedTasks}/{strategicInsights.totalTasks} tasks linked
              </Text>
            </View>

            {/* Completion Velocity */}
            <View className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Activity size={16} color="#10b981" />
                <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                  Velocity
                </Text>
              </View>
              <Text className="text-slate-900 dark:text-white font-bold text-2xl">
                {strategicInsights.recentlyCompleted}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                tasks in 30 days
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            {/* Team Size */}
            <View className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Users size={16} color="#3b82f6" />
                <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                  Team Size
                </Text>
              </View>
              <Text className="text-slate-900 dark:text-white font-bold text-2xl">
                {strategicInsights.activeMembers}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                active members
              </Text>
            </View>

            {/* At-Risk Items */}
            <View className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <AlertTriangle size={16} color="#ef4444" />
                <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                  At Risk
                </Text>
              </View>
              <Text className="text-slate-900 dark:text-white font-bold text-2xl">
                {strategicInsights.atRiskCount}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                needs attention
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Strategic Decisions */}
        {strategicInsights.recentDecisions.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Flag size={18} color="#8b5cf6" />
              <Text className="text-slate-900 dark:text-white font-semibold text-base">
                Recent Decisions
              </Text>
            </View>
            {strategicInsights.recentDecisions.map((decision) => (
              <View
                key={decision.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-2 border-l-4 border-purple-500"
              >
                <Text className="text-slate-900 dark:text-white font-semibold mb-1">
                  {decision.title}
                </Text>
                <Text className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                  Decision: {decision.options?.find(o => o.id === decision.decidedOption)?.label || 'Unknown'}
                </Text>
                <View className="flex-row items-center gap-2">
                  <CheckCircle2 size={12} color="#10b981" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                    Decided {decision.decidedAt ? new Date(decision.decidedAt).toLocaleDateString() : 'recently'}
                  </Text>
                  {decision.relatedTaskIds && decision.relatedTaskIds.length > 0 && (
                    <View className="flex-row items-center gap-2">
                      <Text className="text-slate-400 dark:text-slate-600">•</Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">
                        {decision.relatedTaskIds.length} {decision.relatedTaskIds.length === 1 ? 'task' : 'tasks'} created
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Strategic Recommendations */}
        {strategicInsights.linkageRate < 50 && (
          <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6 border-l-4 border-amber-500">
            <View className="flex-row items-center gap-2 mb-2">
              <Lightbulb size={18} color="#f59e0b" />
              <Text className="text-amber-900 dark:text-amber-200 font-semibold">
                Recommendation
              </Text>
            </View>
            <Text className="text-amber-800 dark:text-amber-300 text-sm">
              Only {strategicInsights.linkageRate}% of your tasks are linked to OKRs. Consider linking tasks to objectives to improve strategic alignment and track progress more effectively.
            </Text>
          </View>
        )}

        {strategicInsights.atRiskCount > 0 && filteredOKRs.length > 0 && (
          <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 border-l-4 border-red-500">
            <View className="flex-row items-center gap-2 mb-2">
              <AlertCircle size={18} color="#ef4444" />
              <Text className="text-red-900 dark:text-red-200 font-semibold">
                Action Required
              </Text>
            </View>
            <Text className="text-red-800 dark:text-red-300 text-sm">
              {strategicInsights.atRiskCount} {strategicInsights.atRiskCount === 1 ? 'objective is' : 'objectives are'} at risk or off track. Review these objectives and consider reallocating resources or adjusting timelines.
            </Text>
          </View>
        )}

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

        {/* Founder Onboarding - Zero to One */}
        {currentMembership?.role === 'Founder' && (
          <Pressable
            onPress={() => router.push('/founder-onboarding')}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl overflow-hidden active:opacity-90 mb-6"
          >
            <LinearGradient
              colors={['#8b5cf6', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16 }}
            >
              <View className="flex-row items-start gap-3">
                <View className="bg-white/20 rounded-xl p-3">
                  <ClipboardList size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg mb-1">
                    Founder Onboarding
                  </Text>
                  <Text className="text-white/90 text-sm leading-5 mb-3">
                    Zero-to-One checklist: define mission, market, product, go-to-market, finance, people, and ops.
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-white/20 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-medium">7 Modules</Text>
                    </View>
                    <View className="bg-white/20 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-medium">21 Steps</Text>
                    </View>
                    <View className="bg-white/20 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-medium">Task Drafts</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color="#fff" />
              </View>
            </LinearGradient>
          </Pressable>
        )}

        {/* Startup Pack - UK Company Setup */}
        {currentMembership?.role === 'Founder' && (
          <Pressable
            onPress={() => router.push('/startup-pack')}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl overflow-hidden active:opacity-90 mb-6"
          >
            <LinearGradient
              colors={['#10b981', '#14b8a6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16 }}
            >
              <View className="flex-row items-start gap-3">
                <View className="bg-white/20 rounded-xl p-3">
                  <Rocket size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg mb-1">
                    UK Startup Pack
                  </Text>
                  <Text className="text-white/90 text-sm leading-5 mb-3">
                    Everything you need to set up your UK hardware startup: company registration, SEIS/EIS, bank accounts, and founder agreements.
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-white/20 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-medium">📋 Guides</Text>
                    </View>
                    <View className="bg-white/20 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-medium">📄 Templates</Text>
                    </View>
                    <View className="bg-white/20 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-medium">🔗 Resources</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color="#fff" />
              </View>
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>

      {/* Voice Brainstorm Modal */}
      <Modal
        visible={showVoiceBrainstorm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVoiceBrainstorm(false)}
      >
        <Pressable className="flex-1 bg-black/70" onPress={() => setShowVoiceBrainstorm(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '70%' }}>
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <Text className="text-slate-900 dark:text-white font-bold text-xl">Start Brainstorming</Text>
                <Pressable onPress={() => setShowVoiceBrainstorm(false)} className="p-2">
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView
                className="px-6 py-4"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
              >
                <View className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-4">
                  <Text className="text-slate-900 dark:text-white text-base leading-relaxed">
                    {voiceBrainstormText}
                  </Text>
                </View>

                <View className="flex-row items-start gap-3 mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <Lightbulb size={20} color="#8b5cf6" />
                  <Text className="flex-1 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    The AI will start a strategic brainstorming conversation with you based on this input.
                    It will ask clarifying questions to help define objectives and create actionable tasks.
                  </Text>
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowVoiceBrainstorm(false)}
                    disabled={isCreatingSession}
                    className="flex-1 bg-slate-200 dark:bg-slate-700 py-4 rounded-xl items-center"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleStartBrainstorm}
                    disabled={isCreatingSession}
                    className="flex-1 bg-purple-500 py-4 rounded-xl items-center flex-row justify-center gap-2"
                    style={{ opacity: isCreatingSession ? 0.6 : 1 }}
                  >
                    {isCreatingSession && <Activity size={18} color="white" />}
                    <Text className="text-white font-semibold">
                      {isCreatingSession ? 'Starting...' : 'Start Session'}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Brainstorm Conversation Modal */}
      <BrainstormConversationModal
        visible={showConversation}
        onClose={() => {
          setShowConversation(false);
          setCurrentSessionId(null);
        }}
        sessionId={currentSessionId || ''}
        initialMessage={voiceBrainstormText}
        onSynthesize={handleSynthesize}
      />

      {/* Synthesis Review Modal */}
      <SynthesisReviewModal
        visible={showSynthesisReview}
        onClose={() => {
          setShowSynthesisReview(false);
          setSynthesizedObjectives([]);
        }}
        objectives={synthesizedObjectives}
        onConfirm={handleConfirmSynthesis}
      />

      {/* Unified Bottom Drawer - for brainstorming */}
      <UnifiedBottomDrawer
        selectedPersonId={null}
        onPersonSelect={() => {}} // Resources tab not used on WHY tab
        onVoiceTranscript={handleVoiceBrainstorm}
        onTextSubmit={handleVoiceBrainstorm}
        pendingDraftsCount={0} // Could track active brainstorm sessions here
        accentColor="#8b5cf6" // Purple for WHY tab
        newTaskTabLabel="New Aim" // WHY tab creates aims, not tasks
      />
    </View>
  );
}
