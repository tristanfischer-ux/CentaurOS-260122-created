/**
 * Objectives Tab - Business Objectives Management
 * View, create, and track strategic business objectives with metrics and milestones
 *
 * Features:
 * - Create new objectives with title, description, period, category
 * - Track progress with metrics and milestones
 * - Link tasks to objectives for execution tracking
 * - Filter by status: On Track, At Risk, Behind, Completed
 */

import { View, Text, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Target, Plus, X, CheckCircle2, AlertTriangle, TrendingDown, Trophy,
  ChevronDown, Sparkles, Search
} from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { useObjectivesStore, type BusinessObjective } from '@/lib/state/objectives-store';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { suggestTasksForObjective, getObjectiveCoaching, calculateTotalEffort } from '@/lib/objective-tasks';
import { ObjectiveCard } from '@/components/ObjectiveCard';
import { ObjectiveDetailModal } from '@/components/ObjectiveDetailModal';
import { LinkToObjectiveModal } from '@/components/LinkToObjectiveModal';
import { HelpModal, HelpButton, type HelpContent } from '@/components/HelpModal';
import { SettingsGearButton } from '@/components/SettingsGearButton';
import { lightImpact, mediumImpact } from '@/lib/haptics';

const OBJECTIVES_HELP: HelpContent = {
  title: 'Objectives',
  subtitle: 'Strategic Goal Tracking',
  description: 'Set business objectives and track progress with metrics, milestones, and linked tasks. Connect your daily work to company goals.',
  tips: [
    '🎯 Set clear objectives with measurable targets',
    '📊 Add metrics to track progress quantitatively',
    '✅ Break objectives into milestones for incremental progress',
    '🔗 Link tasks to objectives to connect execution to strategy',
    '📅 Organize by quarter or half-year periods',
    '🏷️ Categorize: Growth, Product, Financial, Operations, Team',
  ],
  quickActions: [
    { label: 'Create Objective', description: 'Add a new strategic objective' },
    { label: 'Link Tasks', description: 'Connect tasks to objectives' },
    { label: 'Update Progress', description: 'Track milestone completion' },
  ],
};

const STATUS_CONFIG = {
  'on-track': { label: 'On Track', color: '#10b981', bgColor: '#ecfdf5', icon: CheckCircle2 },
  'at-risk': { label: 'At Risk', color: '#f59e0b', bgColor: '#fef3c7', icon: AlertTriangle },
  'behind': { label: 'Behind', color: '#ef4444', bgColor: '#fef2f2', icon: TrendingDown },
  'completed': { label: 'Completed', color: '#8b5cf6', bgColor: '#faf5ff', icon: Trophy },
};

const CATEGORY_OPTIONS: { value: BusinessObjective['category']; label: string }[] = [
  { value: 'growth', label: 'Growth' },
  { value: 'product', label: 'Product' },
  { value: 'financial', label: 'Financial' },
  { value: 'operations', label: 'Operations' },
  { value: 'team', label: 'Team' },
];

const PERIOD_OPTIONS = [
  'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026',
  'H1 2026', 'H2 2026',
  '2026',
];

type StatusFilter = 'all' | 'on-track' | 'at-risk' | 'behind' | 'completed';

/**
 * LinkTasksToObjectiveModal
 * Modal for selecting tasks to link to an objective
 */
interface LinkTasksToObjectiveModalProps {
  visible: boolean;
  objective: BusinessObjective;
  onClose: () => void;
}

function LinkTasksToObjectiveModal({ visible, objective, onClose }: LinkTasksToObjectiveModalProps) {
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  const workPlans = useWorkPlanStore(s => s.workPlans);
  const linkTask = useObjectivesStore(s => s.linkTask);
  const unlinkTask = useObjectivesStore(s => s.unlinkTask);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(objective.linkedTaskIds));

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const activeTasks = workPlans.filter(wp => wp.status !== 'abandoned');
    if (!searchQuery.trim()) return activeTasks;
    const query = searchQuery.toLowerCase();
    return activeTasks.filter(wp =>
      wp.title.toLowerCase().includes(query) ||
      wp.description?.toLowerCase().includes(query)
    );
  }, [workPlans, searchQuery]);

  const handleToggle = (taskId: string) => {
    lightImpact();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    mediumImpact();
    // Unlink removed tasks
    objective.linkedTaskIds.forEach(taskId => {
      if (!selectedIds.has(taskId)) {
        unlinkTask(objective.id, taskId);
      }
    });
    // Link new tasks
    selectedIds.forEach(taskId => {
      if (!objective.linkedTaskIds.includes(taskId)) {
        linkTask(objective.id, taskId);
      }
    });
    onClose();
  };

  const cardBg = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-stone-400' : 'text-gray-400';
  const inputBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-100';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '85%' }}>
          <View className={`${cardBg} rounded-t-3xl`} style={{ paddingBottom: insets.bottom + 16 }}>
            {/* Header */}
            <View className={`flex-row items-center justify-between px-5 py-4 border-b ${borderColor}`}>
              <View>
                <Text className={`text-lg font-bold ${textPrimary}`}>Link Tasks</Text>
                <Text className={`${textMuted} text-xs`} numberOfLines={1}>
                  {objective.title}
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-2 -mr-2 active:opacity-70">
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {/* Search */}
            <View className="px-5 py-3">
              <View className={`flex-row items-center ${inputBg} rounded-xl px-3 py-2.5`}>
                <Search size={18} color="#94a3b8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search tasks..."
                  placeholderTextColor="#94a3b8"
                  className={`flex-1 ml-2 text-sm ${textPrimary}`}
                />
              </View>
              <Text className={`${textSecondary} text-xs mt-2`}>
                {selectedIds.size} task{selectedIds.size !== 1 ? 's' : ''} selected
              </Text>
            </View>

            {/* Tasks List */}
            <ScrollView className="px-5" style={{ maxHeight: 350 }}>
              {filteredTasks.length === 0 ? (
                <View className={`p-6 rounded-xl ${inputBg} items-center`}>
                  <Text className={textPrimary}>No tasks found</Text>
                </View>
              ) : (
                <View className="gap-2 pb-4">
                  {filteredTasks.map((task) => {
                    const isSelected = selectedIds.has(task.id);
                    return (
                      <Pressable
                        key={task.id}
                        onPress={() => handleToggle(task.id)}
                        className={`p-3 rounded-xl border-2 active:opacity-80 ${
                          isSelected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : `${borderColor} ${inputBg}`
                        }`}
                      >
                        <View className="flex-row items-center">
                          <View
                            className={`w-5 h-5 rounded-full items-center justify-center mr-3 ${
                              isSelected ? 'bg-purple-500' : isDark ? 'bg-slate-700' : 'bg-gray-200'
                            }`}
                          >
                            {isSelected && <CheckCircle2 size={12} color="#fff" />}
                          </View>
                          <View className="flex-1">
                            <Text className={`${textPrimary} text-sm font-medium`} numberOfLines={1}>
                              {task.title}
                            </Text>
                            <Text className={`${textMuted} text-xs`}>
                              {task.function} • {task.status} • {task.progress}%
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View className={`flex-row gap-3 px-5 pt-4 border-t ${borderColor}`}>
              <Pressable
                onPress={onClose}
                className={`flex-1 py-3.5 rounded-xl items-center ${inputBg} active:opacity-80`}
              >
                <Text className={`font-semibold ${textPrimary}`}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                className="flex-1 py-3.5 rounded-xl items-center bg-purple-600 active:opacity-80"
              >
                <Text className="text-white font-semibold">Save</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ObjectivesScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Stores
  const objectives = useObjectivesStore(s => s.objectives);
  const initialized = useObjectivesStore(s => s.initialized);
  const initialize = useObjectivesStore(s => s.initialize);
  const addObjective = useObjectivesStore(s => s.addObjective);

  // State
  const [showHelp, setShowHelp] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<BusinessObjective | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLinkTasksModal, setShowLinkTasksModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create modal state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<BusinessObjective['category']>('product');
  const [newPeriod, setNewPeriod] = useState('Q1 2026');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  // Initialize store on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // Filter and search objectives
  const filteredObjectives = useMemo(() => {
    let result = objectives;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(obj => obj.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(obj =>
        obj.title.toLowerCase().includes(query) ||
        obj.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [objectives, statusFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: objectives.length,
      onTrack: objectives.filter(o => o.status === 'on-track').length,
      atRisk: objectives.filter(o => o.status === 'at-risk').length,
      behind: objectives.filter(o => o.status === 'behind').length,
      completed: objectives.filter(o => o.status === 'completed').length,
    };
  }, [objectives]);

  // Create new objective
  const handleCreateObjective = () => {
    if (!newTitle.trim()) return;

    mediumImpact();
    addObjective({
      title: newTitle.trim(),
      description: newDescription.trim(),
      period: newPeriod,
      category: newCategory,
      progress: 0,
      status: 'on-track',
      metrics: [],
      milestones: [],
      linkedTaskIds: [],
    });

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewCategory('product');
    setNewPeriod('Q1 2026');
    setShowCreateModal(false);
  };

  // Get AI task suggestions
  const taskSuggestions = useMemo(() => {
    if (!newTitle.trim()) return [];
    return suggestTasksForObjective(newTitle, newDescription).slice(0, 3);
  }, [newTitle, newDescription]);

  // Theme colors
  const bgColor = isDark ? 'bg-slate-950' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : isOffWhite ? 'border-stone-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-stone-400' : 'text-gray-400';
  const inputBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-100';

  return (
    <View className={`flex-1 ${bgColor}`}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1e293b', '#0f172a'] : isOffWhite ? ['#fafaf9', '#f5f5f4'] : ['#ffffff', '#f8fafc']}
        style={{ paddingTop: insets.top }}
      >
        <View className="px-5 py-4">
          {/* Top Row */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-purple-600 items-center justify-center">
                <Target size={22} color="#fff" />
              </View>
              <View>
                <Text className={`text-xl font-bold ${textPrimary}`}>Objectives</Text>
                <Text className={`text-xs ${textSecondary}`}>
                  {stats.total} objective{stats.total !== 1 ? 's' : ''} • {stats.onTrack} on track
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <HelpButton onPress={() => setShowHelp(true)} />
              <SettingsGearButton />
            </View>
          </View>

          {/* Status Stats Row */}
          <View className="flex-row gap-2 mb-4">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = stats[status === 'on-track' ? 'onTrack' : status === 'at-risk' ? 'atRisk' : status as keyof typeof stats] || 0;
              const isActive = statusFilter === status;
              const Icon = config.icon;

              return (
                <Pressable
                  key={status}
                  onPress={() => {
                    lightImpact();
                    setStatusFilter(isActive ? 'all' : status as StatusFilter);
                  }}
                  className={`flex-1 rounded-xl p-2.5 border ${isActive ? 'border-transparent' : borderColor}`}
                  style={isActive ? { backgroundColor: config.bgColor } : { backgroundColor: isDark ? '#1e293b' : isOffWhite ? '#fafaf9' : '#ffffff' }}
                >
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Icon size={12} color={isActive ? config.color : '#94a3b8'} />
                    <Text className={`text-[10px] font-medium ${isActive ? '' : textMuted}`} style={isActive ? { color: config.color } : undefined}>
                      {config.label}
                    </Text>
                  </View>
                  <Text className={`text-lg font-bold ${isActive ? '' : textPrimary}`} style={isActive ? { color: config.color } : undefined}>
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Search */}
          <View className={`flex-row items-center ${inputBg} rounded-xl px-3 py-2.5`}>
            <Search size={18} color="#94a3b8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search objectives..."
              placeholderTextColor="#94a3b8"
              className={`flex-1 ml-2 text-sm ${textPrimary}`}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color="#94a3b8" />
              </Pressable>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredObjectives.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(100)} className={`${cardBg} rounded-2xl p-6 items-center`}>
            <Target size={48} color="#94a3b8" />
            <Text className={`${textPrimary} font-semibold text-lg mt-4`}>
              {statusFilter !== 'all' ? 'No objectives with this status' :
               searchQuery ? 'No matching objectives' : 'No objectives yet'}
            </Text>
            <Text className={`${textSecondary} text-sm text-center mt-2`}>
              {statusFilter !== 'all' ? 'Try changing the filter to see more objectives' :
               searchQuery ? 'Try a different search term' :
               'Create your first objective to start tracking strategic goals'}
            </Text>
            {!searchQuery && statusFilter === 'all' && (
              <Pressable
                onPress={() => {
                  lightImpact();
                  setShowCreateModal(true);
                }}
                className="mt-4 bg-purple-600 rounded-xl px-6 py-3 active:opacity-80"
              >
                <Text className="text-white font-semibold">Create Objective</Text>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          filteredObjectives.map((objective, index) => (
            <Animated.View key={objective.id} entering={FadeInDown.delay(index * 50)}>
              <ObjectiveCard
                objective={objective}
                onPress={() => {
                  setSelectedObjective(objective);
                  setShowDetailModal(true);
                }}
                onLinkTasks={() => {
                  setSelectedObjective(objective);
                  setShowLinkTasksModal(true);
                }}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* FAB - Create Objective */}
      <Pressable
        onPress={() => {
          mediumImpact();
          setShowCreateModal(true);
        }}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 80,
          right: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        className="w-14 h-14 bg-purple-600 rounded-full items-center justify-center active:opacity-80"
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>

      {/* Create Objective Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <Pressable className="flex-1 bg-black/70" onPress={() => setShowCreateModal(false)}>
            <View className="flex-1" />
            <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
              <View className={`${cardBg} rounded-t-3xl`} style={{ paddingBottom: insets.bottom + 16 }}>
                {/* Modal Header */}
                <View className={`flex-row items-center justify-between px-5 py-4 border-b ${borderColor}`}>
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-purple-600 items-center justify-center">
                      <Target size={20} color="#fff" />
                    </View>
                    <Text className={`text-lg font-bold ${textPrimary}`}>New Objective</Text>
                  </View>
                  <Pressable onPress={() => setShowCreateModal(false)} className="p-2 -mr-2 active:opacity-70">
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>

                <ScrollView className="px-5 py-4" contentContainerStyle={{ paddingBottom: 24 }}>
                  {/* Title */}
                  <View className="mb-4">
                    <Text className={`text-sm font-medium ${textSecondary} mb-2`}>Title *</Text>
                    <TextInput
                      value={newTitle}
                      onChangeText={setNewTitle}
                      placeholder="e.g., Achieve £50K MRR"
                      placeholderTextColor="#94a3b8"
                      className={`${inputBg} rounded-xl px-4 py-3 text-base ${textPrimary}`}
                    />
                  </View>

                  {/* Description */}
                  <View className="mb-4">
                    <Text className={`text-sm font-medium ${textSecondary} mb-2`}>Description</Text>
                    <TextInput
                      value={newDescription}
                      onChangeText={setNewDescription}
                      placeholder="What does success look like?"
                      placeholderTextColor="#94a3b8"
                      multiline
                      numberOfLines={3}
                      className={`${inputBg} rounded-xl px-4 py-3 text-base ${textPrimary}`}
                      style={{ minHeight: 80, textAlignVertical: 'top' }}
                    />
                  </View>

                  {/* Category & Period Row */}
                  <View className="flex-row gap-3 mb-4">
                    {/* Category */}
                    <View className="flex-1">
                      <Text className={`text-sm font-medium ${textSecondary} mb-2`}>Category</Text>
                      <Pressable
                        onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                        className={`${inputBg} rounded-xl px-4 py-3 flex-row items-center justify-between`}
                      >
                        <Text className={`text-base ${textPrimary} capitalize`}>{newCategory}</Text>
                        <ChevronDown size={18} color="#94a3b8" />
                      </Pressable>
                      {showCategoryPicker && (
                        <View className={`${cardBg} rounded-xl border ${borderColor} mt-2 overflow-hidden`}>
                          {CATEGORY_OPTIONS.map((opt) => (
                            <Pressable
                              key={opt.value}
                              onPress={() => {
                                setNewCategory(opt.value);
                                setShowCategoryPicker(false);
                              }}
                              className={`px-4 py-3 border-b ${borderColor} ${newCategory === opt.value ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                            >
                              <Text className={`text-sm ${newCategory === opt.value ? 'text-purple-600 font-semibold' : textPrimary}`}>
                                {opt.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Period */}
                    <View className="flex-1">
                      <Text className={`text-sm font-medium ${textSecondary} mb-2`}>Period</Text>
                      <Pressable
                        onPress={() => setShowPeriodPicker(!showPeriodPicker)}
                        className={`${inputBg} rounded-xl px-4 py-3 flex-row items-center justify-between`}
                      >
                        <Text className={`text-base ${textPrimary}`}>{newPeriod}</Text>
                        <ChevronDown size={18} color="#94a3b8" />
                      </Pressable>
                      {showPeriodPicker && (
                        <View className={`${cardBg} rounded-xl border ${borderColor} mt-2 overflow-hidden`}>
                          {PERIOD_OPTIONS.map((period) => (
                            <Pressable
                              key={period}
                              onPress={() => {
                                setNewPeriod(period);
                                setShowPeriodPicker(false);
                              }}
                              className={`px-4 py-3 border-b ${borderColor} ${newPeriod === period ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                            >
                              <Text className={`text-sm ${newPeriod === period ? 'text-purple-600 font-semibold' : textPrimary}`}>
                                {period}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* AI Suggested Tasks Preview */}
                  {taskSuggestions.length > 0 && (
                    <View className={`${inputBg} rounded-xl p-4 mb-4`}>
                      <View className="flex-row items-center gap-2 mb-3">
                        <Sparkles size={16} color="#8b5cf6" />
                        <Text className={`text-sm font-semibold ${textPrimary}`}>AI-Suggested Tasks</Text>
                      </View>
                      <Text className={`text-xs ${textSecondary} mb-3`}>
                        These tasks will help you achieve this objective:
                      </Text>
                      {taskSuggestions.map((task, idx) => (
                        <View key={task.id} className="flex-row items-start gap-2 mb-2">
                          <Text className="text-purple-600 text-xs font-bold">{idx + 1}.</Text>
                          <View className="flex-1">
                            <Text className={`text-xs font-medium ${textPrimary}`}>{task.title}</Text>
                            <Text className={`text-[10px] ${textMuted}`}>{task.why.slice(0, 80)}...</Text>
                          </View>
                        </View>
                      ))}
                      <Text className={`text-[10px] ${textMuted} text-center mt-2`}>
                        You can add these tasks after creating the objective
                      </Text>
                    </View>
                  )}

                  {/* Create Button */}
                  <Pressable
                    onPress={handleCreateObjective}
                    disabled={!newTitle.trim()}
                    className={`rounded-xl py-4 items-center ${newTitle.trim() ? 'bg-purple-600 active:opacity-80' : 'bg-gray-300'}`}
                  >
                    <Text className={`font-bold text-base ${newTitle.trim() ? 'text-white' : 'text-gray-500'}`}>
                      Create Objective
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Help Modal */}
      <HelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        content={OBJECTIVES_HELP}
      />

      {/* Objective Detail Modal */}
      <ObjectiveDetailModal
        visible={showDetailModal}
        objective={selectedObjective}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedObjective(null);
        }}
        onLinkTasks={() => {
          setShowDetailModal(false);
          setShowLinkTasksModal(true);
        }}
      />

      {/* Link Tasks Modal - Uses tasks that can be linked TO this objective */}
      {selectedObjective && (
        <LinkTasksToObjectiveModal
          visible={showLinkTasksModal}
          objective={selectedObjective}
          onClose={() => {
            setShowLinkTasksModal(false);
            setSelectedObjective(null);
          }}
        />
      )}
    </View>
  );
}
