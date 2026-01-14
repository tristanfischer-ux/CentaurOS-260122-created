import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { useState, useMemo } from 'react';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Plus,
  Rocket,
  X,
  Check,
  Circle,
  User,
  Calendar,
} from 'lucide-react-native';
import { useStartupPackStore, generateSetupOKRData } from '@/lib/startup-pack';
import { useCurrentWorkspace, useCurrentMembership } from '@/lib/state/app-store';
import { useOKRStore } from '@/lib/state/okr-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useTheme } from '@/lib/ThemeContext';
import type { StartupChecklistItem, StartupChecklistStatus } from '@/types';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#3b82f6',
  low: '#6b7280',
};

const STATUS_ICONS = {
  not_started: Circle,
  in_progress: Clock,
  done: Check,
};

export default function SetupPlanScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const workspace = useCurrentWorkspace();
  const membership = useCurrentMembership();
  const workspaceId = workspace?.id ?? '';
  const userRole = membership?.role ?? 'Founder';

  // Stores
  const getSections = useStartupPackStore(s => s.getSections);
  const checklistItems = useStartupPackStore(s => s.checklistItems);
  const getChecklistItemState = useStartupPackStore(s => s.getChecklistItemState);
  const updateChecklistItemState = useStartupPackStore(s => s.updateChecklistItemState);
  const getProgress = useStartupPackStore(s => s.getProgress);
  const getPlan = useStartupPackStore(s => s.getPlan);
  const canEdit = useStartupPackStore(s => s.canEdit);

  const addOKR = useOKRStore(s => s.addOKR);
  const addWorkPlan = useWorkPlanStore(s => s.addWorkPlan);

  // Local state
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showCreateOKRModal, setShowCreateOKRModal] = useState(false);
  const [isCreatingOKR, setIsCreatingOKR] = useState(false);

  // Data
  const sections = getSections();
  const progress = getProgress(workspaceId);
  const plan = getPlan(workspaceId);

  // Filtered and sorted checklist items
  const filteredItems = useMemo(() => {
    let items = [...checklistItems];

    // Apply priority filter
    if (filterPriority) {
      items = items.filter(item => item.priority === filterPriority);
    }

    // Apply status filter
    if (filterStatus) {
      items = items.filter(item => {
        const state = getChecklistItemState(workspaceId, item.id);
        const status = state?.status ?? 'not_started';
        return status === filterStatus;
      });
    }

    // Sort by priority, then by section order
    items.sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.order - b.order;
    });

    return items;
  }, [checklistItems, filterPriority, filterStatus, getChecklistItemState, workspaceId]);

  // Theme colors
  const bgPrimary = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-orange-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-orange-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-orange-700' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-orange-600' : 'text-gray-500';

  const handleChecklistToggle = (item: StartupChecklistItem) => {
    if (!canEdit(userRole)) return;

    const currentState = getChecklistItemState(workspaceId, item.id);
    const currentStatus = currentState?.status ?? 'not_started';

    let newStatus: StartupChecklistStatus;
    if (currentStatus === 'not_started') {
      newStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      newStatus = 'done';
    } else {
      newStatus = 'not_started';
    }

    updateChecklistItemState(workspaceId, item.id, { status: newStatus });
  };

  const handleCreateOKR = async () => {
    if (!canEdit(userRole)) {
      Alert.alert('Permission Denied', 'Only Founders can create OKRs from the Startup Pack.');
      return;
    }

    setIsCreatingOKR(true);

    try {
      const okrData = generateSetupOKRData(workspaceId);

      // Create the OKR (matching OKR interface from okr-store)
      const okrId = `okr-startup-${Date.now()}`;
      addOKR({
        id: okrId,
        workspaceId,
        title: okrData.okrTitle,
        description: okrData.okrDescription,
        function: 'Admin',
        status: 'on-track',
        owner: membership?.userId ?? 'Founder',
        startDate: 'Q1 2026',
        endDate: 'Q2 2026',
        objectives: okrData.keyResults.map((kr, index) => ({
          id: `obj-startup-${Date.now()}-${index}`,
          title: kr.title,
          target: String(kr.targetValue),
          current: String(kr.currentValue),
          progress: Math.round((Number(kr.currentValue) / Number(kr.targetValue)) * 100) || 0,
          status: 'on-track' as const,
        })),
      });

      // Create work plans for each section (matching WorkPlan interface from work-plan-store)
      let workPlansCreated = 0;
      for (const wpData of okrData.workPlans) {
        if (wpData.tasks.length === 0) continue;

        // Create a work plan for each task in the section
        for (const taskData of wpData.tasks) {
          const workPlanId = `wp-startup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          // Estimate squares: 1 square = 4 hours, so estimatedHours / 4, minimum 1
          const estimatedTimeUnits = Math.max(1, Math.ceil((taskData.estimatedHours ?? 8) / 4));
          addWorkPlan({
            id: workPlanId,
            workspaceId,
            title: taskData.title,
            description: taskData.description,
            function: wpData.function,
            linkedOKRTitle: okrData.okrTitle,
            dueDate: new Date(Date.now() + (taskData.estimatedHours ?? 8) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'not-started',
            progress: 0,
            assignedBy: 'Startup Pack',
            needsSubmission: false,
            estimatedTimeUnits,
            sprintMode: true,
          });
          workPlansCreated++;
        }
      }

      setShowCreateOKRModal(false);
      Alert.alert(
        'OKR Created!',
        `Created "${okrData.okrTitle}" with ${workPlansCreated} work plans. View in the Decide tab.`,
        [
          { text: 'View OKRs', onPress: () => router.push('/(tabs)/decide') },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create OKR. Please try again.');
    } finally {
      setIsCreatingOKR(false);
    }
  };

  const getSectionName = (sectionId: string) => {
    return sections.find(s => s.id === sectionId)?.title ?? sectionId;
  };

  const renderFilterBar = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4"
      contentContainerStyle={{ paddingHorizontal: 20 }}
    >
      {/* Priority filters */}
      {['critical', 'high', 'medium', 'low'].map(priority => (
        <Pressable
          key={priority}
          onPress={() => setFilterPriority(filterPriority === priority ? null : priority)}
          className={`mr-2 px-3 py-1.5 rounded-full ${filterPriority === priority ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-700'}`}
        >
          <Text className={filterPriority === priority ? 'text-white font-semibold' : textMuted}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Text>
        </Pressable>
      ))}

      <View className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-2 self-center" />

      {/* Status filters */}
      {[
        { id: 'not_started', label: 'To Do' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'done', label: 'Done' },
      ].map(status => (
        <Pressable
          key={status.id}
          onPress={() => setFilterStatus(filterStatus === status.id ? null : status.id)}
          className={`mr-2 px-3 py-1.5 rounded-full ${filterStatus === status.id ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'}`}
        >
          <Text className={filterStatus === status.id ? 'text-white font-semibold' : textMuted}>
            {status.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderChecklistItem = (item: StartupChecklistItem, index: number) => {
    const state = getChecklistItemState(workspaceId, item.id);
    const status = state?.status ?? 'not_started';
    const StatusIcon = STATUS_ICONS[status];

    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.delay(index * 20).duration(200)}
      >
        <Pressable
          onPress={() => handleChecklistToggle(item)}
          className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-2 mx-5 active:opacity-70`}
          disabled={!canEdit(userRole)}
        >
          <View className="flex-row items-start">
            <View
              className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${status === 'done'
                  ? 'bg-emerald-500'
                  : status === 'in_progress'
                    ? 'bg-amber-500'
                    : 'bg-gray-300 dark:bg-slate-600'
                }`}
            >
              <StatusIcon size={14} color="#fff" />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className={`font-semibold flex-1 ${status === 'done' ? 'text-gray-400 line-through' : textPrimary
                    }`}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <View
                  className="w-2 h-2 rounded-full ml-2"
                  style={{ backgroundColor: PRIORITY_COLORS[item.priority] }}
                />
              </View>

              <Text className={`${textMuted} text-xs`}>
                {getSectionName(item.sectionId)}
              </Text>

              {/* Meta row */}
              <View className="flex-row items-center mt-2 flex-wrap gap-2">
                {item.estimatedHours && (
                  <View className="flex-row items-center bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                    <Clock size={10} color="#64748b" />
                    <Text className={`${textMuted} text-xs ml-1`}>~{item.estimatedHours}h</Text>
                  </View>
                )}
                {item.ownerRoleHint && (
                  <View className="flex-row items-center bg-blue-500/10 px-2 py-0.5 rounded">
                    <User size={10} color="#3b82f6" />
                    <Text className="text-blue-500 text-xs ml-1">{item.ownerRoleHint}</Text>
                  </View>
                )}
              </View>
            </View>

            <ChevronRight size={16} color="#9ca3af" />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderCreateOKRModal = () => (
    <Modal
      visible={showCreateOKRModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCreateOKRModal(false)}
    >
      <View className="flex-1 bg-black/60 items-center justify-center p-5">
        <View className={`${bgCard} rounded-2xl p-6 w-full max-w-sm`}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`${textPrimary} font-bold text-lg`}>Create Setup OKR</Text>
            <Pressable
              onPress={() => setShowCreateOKRModal(false)}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 items-center justify-center"
            >
              <X size={18} color="#64748b" />
            </Pressable>
          </View>

          <Text className={`${textSecondary} mb-4`}>
            This will create an OKR called "Company Setup & Investor Readiness" with work plans and tasks for each section of the Startup Pack.
          </Text>

          <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
            <Text className="text-blue-400 text-sm">
              <Text className="font-bold">{checklistItems.length}</Text> tasks will be created across{' '}
              <Text className="font-bold">{sections.length}</Text> work plans.
            </Text>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setShowCreateOKRModal(false)}
              className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-xl py-3 items-center"
            >
              <Text className={`${textPrimary} font-semibold`}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreateOKR}
              disabled={isCreatingOKR}
              className={`flex-1 bg-blue-500 rounded-xl py-3 items-center ${isCreatingOKR ? 'opacity-50' : ''}`}
            >
              <Text className="text-white font-semibold">
                {isCreatingOKR ? 'Creating...' : 'Create OKR'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View className={`flex-1 ${bgPrimary}`}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1e40af', '#3730a3'] : ['#3b82f6', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 20 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">STARTUP PACK</Text>
            <Text className="text-white text-2xl font-bold">My Setup Plan</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View className="bg-white/10 rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white font-semibold">Overall Progress</Text>
            <Text className="text-white font-bold text-xl">{progress.percentComplete}%</Text>
          </View>
          <View className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
            <View
              className="h-full bg-white rounded-full"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </View>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-white font-bold">{progress.completedItems}</Text>
              <Text className="text-white/70 text-xs">Done</Text>
            </View>
            <View className="items-center">
              <Text className="text-white font-bold">{progress.inProgressItems}</Text>
              <Text className="text-white/70 text-xs">In Progress</Text>
            </View>
            <View className="items-center">
              <Text className="text-amber-300 font-bold">{progress.criticalRemaining}</Text>
              <Text className="text-white/70 text-xs">Critical</Text>
            </View>
            <View className="items-center">
              <Text className="text-white font-bold">{progress.totalItems - progress.completedItems - progress.inProgressItems}</Text>
              <Text className="text-white/70 text-xs">Remaining</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Create OKR Button */}
      {canEdit(userRole) && (
        <View className="px-5 py-3">
          <Pressable
            onPress={() => setShowCreateOKRModal(true)}
            className="bg-emerald-500 rounded-xl py-3 flex-row items-center justify-center active:opacity-70"
          >
            <Rocket size={20} color="#fff" />
            <Text className="text-white font-bold ml-2">Create Setup OKR & Tasks</Text>
          </Pressable>
        </View>
      )}

      {/* Filter Bar */}
      {renderFilterBar()}

      {/* Checklist */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View className="items-center py-12 px-5">
            <CheckCircle2 size={48} color="#10b981" />
            <Text className={`${textPrimary} font-bold text-lg mt-4`}>
              {filterStatus === 'done' ? 'Great progress!' : 'No items match filters'}
            </Text>
            <Text className={`${textSecondary} text-center mt-2`}>
              {filterStatus === 'done'
                ? `You've completed ${progress.completedItems} items.`
                : 'Try adjusting your filters to see more items.'}
            </Text>
          </View>
        ) : (
          filteredItems.map((item, index) => renderChecklistItem(item, index))
        )}
      </ScrollView>

      {/* Create OKR Modal */}
      {renderCreateOKRModal()}
    </View>
  );
}
