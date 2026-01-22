/**
 * ObjectiveDetailModal
 * Full-screen modal for viewing and editing an objective
 * Shows metrics, milestones, and linked tasks with full editing capabilities
 */

import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Target, X, Edit3, Save, Trash2, Plus, CheckCircle2, Circle,
  TrendingUp, TrendingDown, Minus, Link2, Calendar, ChevronRight,
  AlertTriangle, Trophy
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/lib/ThemeContext';
import { useObjectivesStore, type BusinessObjective, type ObjectiveMilestone, type ObjectiveMetric } from '@/lib/state/objectives-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { lightImpact, mediumImpact, heavyImpact } from '@/lib/haptics';

interface ObjectiveDetailModalProps {
  visible: boolean;
  objective: BusinessObjective | null;
  onClose: () => void;
  onLinkTasks?: () => void;
}

// Status config
const STATUS_CONFIG = {
  'on-track': { label: 'On Track', color: '#10b981', bgColor: '#ecfdf5' },
  'at-risk': { label: 'At Risk', color: '#f59e0b', bgColor: '#fef3c7' },
  'behind': { label: 'Behind', color: '#ef4444', bgColor: '#fef2f2' },
  'completed': { label: 'Completed', color: '#8b5cf6', bgColor: '#faf5ff' },
};

// Category config
const CATEGORY_CONFIG = {
  growth: { color: '#059669', bgColor: '#ecfdf5' },
  product: { color: '#2563eb', bgColor: '#eff6ff' },
  operations: { color: '#d97706', bgColor: '#fef3c7' },
  financial: { color: '#16a34a', bgColor: '#f0fdf4' },
  team: { color: '#7c3aed', bgColor: '#faf5ff' },
};

// Trend icon
function TrendIcon({ trend, size = 14 }: { trend: 'up' | 'down' | 'stable'; size?: number }) {
  if (trend === 'up') return <TrendingUp size={size} color="#10b981" />;
  if (trend === 'down') return <TrendingDown size={size} color="#ef4444" />;
  return <Minus size={size} color="#94a3b8" />;
}

export function ObjectiveDetailModal({ visible, objective, onClose, onLinkTasks }: ObjectiveDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Stores
  const updateObjective = useObjectivesStore(s => s.updateObjective);
  const updateProgress = useObjectivesStore(s => s.updateProgress);
  const completeMilestone = useObjectivesStore(s => s.completeMilestone);
  const removeObjective = useObjectivesStore(s => s.removeObjective);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  // Get linked tasks
  const linkedTasks = useMemo(() => {
    if (!objective) return [];
    return workPlans.filter(wp => objective.linkedTaskIds.includes(wp.id));
  }, [workPlans, objective]);

  // Start editing
  const handleStartEdit = () => {
    if (!objective) return;
    setEditTitle(objective.title);
    setEditDescription(objective.description);
    setIsEditing(true);
    lightImpact();
  };

  // Save edits
  const handleSaveEdit = () => {
    if (!objective || !editTitle.trim()) return;
    mediumImpact();
    updateObjective(objective.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
    });
    setIsEditing(false);
  };

  // Toggle milestone completion
  const handleToggleMilestone = (milestoneId: string) => {
    if (!objective) return;
    lightImpact();
    completeMilestone(objective.id, milestoneId);
  };

  // Add milestone
  const handleAddMilestone = () => {
    if (!objective || !newMilestoneTitle.trim()) return;
    mediumImpact();

    const newMilestone: ObjectiveMilestone = {
      id: `ms-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      completed: false,
    };

    updateObjective(objective.id, {
      milestones: [...objective.milestones, newMilestone],
    });

    setNewMilestoneTitle('');
    setShowAddMilestone(false);
  };

  // Delete objective
  const handleDelete = () => {
    if (!objective) return;
    heavyImpact();
    Alert.alert(
      'Delete Objective',
      `Are you sure you want to delete "${objective.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeObjective(objective.id);
            onClose();
          },
        },
      ]
    );
  };

  // Theme colors
  const cardBg = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const textMuted = isDark ? 'text-slate-500' : isOffWhite ? 'text-stone-400' : 'text-gray-400';
  const inputBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-100';
  const sectionBg = isDark ? 'bg-slate-800/50' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';

  if (!objective) return null;

  const statusStyle = STATUS_CONFIG[objective.status];
  const categoryStyle = CATEGORY_CONFIG[objective.category];
  const milestonesCompleted = objective.milestones.filter(m => m.completed).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className={`flex-1 ${cardBg}`} style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className={`flex-row items-center justify-between px-5 py-4 border-b ${borderColor}`}>
          <Pressable onPress={onClose} className="p-2 -ml-2 active:opacity-70">
            <X size={24} color="#94a3b8" />
          </Pressable>
          <View className="flex-row items-center gap-3">
            {isEditing ? (
              <Pressable onPress={handleSaveEdit} className="p-2 active:opacity-70">
                <Save size={22} color="#10b981" />
              </Pressable>
            ) : (
              <Pressable onPress={handleStartEdit} className="p-2 active:opacity-70">
                <Edit3 size={22} color="#3b82f6" />
              </Pressable>
            )}
            <Pressable onPress={handleDelete} className="p-2 -mr-2 active:opacity-70">
              <Trash2 size={22} color="#ef4444" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Title Section */}
          <View className="px-5 py-6">
            <View className="flex-row items-center gap-3 mb-3">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: categoryStyle.bgColor }}
              >
                <Target size={24} color={categoryStyle.color} />
              </View>
              <View className="flex-row items-center gap-2">
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: categoryStyle.bgColor }}
                >
                  <Text style={{ color: categoryStyle.color }} className="text-xs font-semibold capitalize">
                    {objective.category}
                  </Text>
                </View>
                <Text className={textMuted}>•</Text>
                <Text className={`${textMuted} text-xs`}>{objective.period}</Text>
              </View>
            </View>

            {isEditing ? (
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                className={`text-2xl font-bold ${textPrimary} ${inputBg} rounded-xl px-4 py-3 mb-3`}
                multiline
              />
            ) : (
              <Text className={`text-2xl font-bold ${textPrimary} mb-3`}>
                {objective.title}
              </Text>
            )}

            {isEditing ? (
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Add description..."
                placeholderTextColor="#94a3b8"
                multiline
                className={`text-base ${textSecondary} ${inputBg} rounded-xl px-4 py-3`}
                style={{ minHeight: 80 }}
              />
            ) : objective.description ? (
              <Text className={`text-base ${textSecondary} leading-6`}>
                {objective.description}
              </Text>
            ) : null}
          </View>

          {/* Status & Progress */}
          <View className={`mx-5 mb-6 p-4 rounded-2xl ${sectionBg}`}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: statusStyle.bgColor }}
                >
                  <Text style={{ color: statusStyle.color }} className="text-sm font-bold">
                    {statusStyle.label}
                  </Text>
                </View>
              </View>
              <Text className={`text-xl font-bold ${textPrimary}`}>{objective.progress}%</Text>
            </View>
            <View className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200'}`}>
              <View
                className="h-full rounded-full"
                style={{ width: `${objective.progress}%`, backgroundColor: statusStyle.color }}
              />
            </View>
          </View>

          {/* Key Metrics */}
          {objective.metrics.length > 0 && (
            <View className="px-5 mb-6">
              <Text className={`text-sm font-bold ${textPrimary} mb-3`}>Key Metrics</Text>
              <View className="gap-3">
                {objective.metrics.map((metric) => (
                  <MetricCard key={metric.id} metric={metric} isDark={isDark} isOffWhite={isOffWhite} />
                ))}
              </View>
            </View>
          )}

          {/* Milestones */}
          <View className="px-5 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`text-sm font-bold ${textPrimary}`}>
                Milestones ({milestonesCompleted}/{objective.milestones.length})
              </Text>
              <Pressable
                onPress={() => setShowAddMilestone(!showAddMilestone)}
                className="flex-row items-center gap-1 active:opacity-70"
              >
                <Plus size={16} color="#3b82f6" />
                <Text className="text-blue-500 text-sm font-semibold">Add</Text>
              </Pressable>
            </View>

            {showAddMilestone && (
              <View className={`flex-row items-center gap-2 mb-3 p-3 rounded-xl ${sectionBg}`}>
                <TextInput
                  value={newMilestoneTitle}
                  onChangeText={setNewMilestoneTitle}
                  placeholder="Milestone title..."
                  placeholderTextColor="#94a3b8"
                  className={`flex-1 ${textPrimary}`}
                  autoFocus
                />
                <Pressable
                  onPress={handleAddMilestone}
                  disabled={!newMilestoneTitle.trim()}
                  className={`px-3 py-2 rounded-lg ${newMilestoneTitle.trim() ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <Text className="text-white text-sm font-semibold">Add</Text>
                </Pressable>
              </View>
            )}

            {objective.milestones.length > 0 ? (
              <View className="gap-2">
                {objective.milestones.map((milestone) => (
                  <Pressable
                    key={milestone.id}
                    onPress={() => handleToggleMilestone(milestone.id)}
                    className={`flex-row items-center p-3 rounded-xl ${sectionBg} active:opacity-80`}
                  >
                    {milestone.completed ? (
                      <CheckCircle2 size={20} color="#10b981" />
                    ) : (
                      <Circle size={20} color="#94a3b8" />
                    )}
                    <Text
                      className={`flex-1 ml-3 text-sm ${milestone.completed ? textMuted : textPrimary}`}
                      style={milestone.completed ? { textDecorationLine: 'line-through' } : undefined}
                    >
                      {milestone.title}
                    </Text>
                    {milestone.dueDate && !milestone.completed && (
                      <View className="flex-row items-center gap-1.5 ml-2">
                        <Calendar size={12} color="#94a3b8" />
                        <Text className={`${textMuted} text-xs`}>
                          {new Date(milestone.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    )}
                    {milestone.completedAt && (
                      <View className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded">
                        <Text className="text-emerald-600 text-[10px] font-medium">Done</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            ) : (
              <View className={`p-4 rounded-xl ${sectionBg} items-center`}>
                <Text className={textMuted}>No milestones yet</Text>
              </View>
            )}
          </View>

          {/* Linked Tasks */}
          <View className="px-5 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`text-sm font-bold ${textPrimary}`}>
                Linked Tasks ({linkedTasks.length})
              </Text>
              {onLinkTasks && (
                <Pressable
                  onPress={() => {
                    lightImpact();
                    onLinkTasks();
                  }}
                  className="flex-row items-center gap-1 active:opacity-70"
                >
                  <Link2 size={16} color="#3b82f6" />
                  <Text className="text-blue-500 text-sm font-semibold">Link</Text>
                </Pressable>
              )}
            </View>

            {linkedTasks.length > 0 ? (
              <View className="gap-2">
                {linkedTasks.map((task) => (
                  <Pressable
                    key={task.id}
                    onPress={() => {
                      lightImpact();
                      router.push('/(tabs)/tasks');
                    }}
                    className={`flex-row items-center p-3 rounded-xl ${sectionBg} active:opacity-80`}
                  >
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-3"
                      style={{
                        backgroundColor:
                          task.status === 'completed' ? '#10b981' :
                          task.status === 'in-progress' ? '#3b82f6' :
                          task.status === 'blocked' ? '#ef4444' : '#94a3b8',
                      }}
                    />
                    <View className="flex-1">
                      <Text className={`text-sm ${textPrimary}`} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text className={`${textMuted} text-xs mt-0.5`}>
                        {task.function} • {task.progress}% complete
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#94a3b8" />
                  </Pressable>
                ))}
              </View>
            ) : (
              <Pressable
                onPress={onLinkTasks}
                className={`p-4 rounded-xl ${sectionBg} items-center border-2 border-dashed ${borderColor} active:opacity-80`}
              >
                <Link2 size={24} color="#94a3b8" />
                <Text className={`${textSecondary} mt-2`}>Link tasks to this objective</Text>
                <Text className={`${textMuted} text-xs mt-1`}>Connect your work to strategic goals</Text>
              </Pressable>
            )}
          </View>

          {/* Owner */}
          {objective.owner && (
            <View className="px-5 mb-6">
              <Text className={`text-sm font-bold ${textPrimary} mb-2`}>Owner</Text>
              <View className={`p-3 rounded-xl ${sectionBg}`}>
                <Text className={textPrimary}>{objective.owner}</Text>
              </View>
            </View>
          )}

          {/* Metadata */}
          <View className="px-5">
            <Text className={`${textMuted} text-xs`}>
              Created: {new Date(objective.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            <Text className={`${textMuted} text-xs mt-1`}>
              Updated: {new Date(objective.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Metric Card Component
function MetricCard({ metric, isDark, isOffWhite }: { metric: ObjectiveMetric; isDark: boolean; isOffWhite: boolean }) {
  const progress = Math.min(100, Math.round((metric.currentValue / metric.targetValue) * 100));
  const progressColor = progress >= 80 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444';

  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const cardBg = isDark ? 'bg-slate-800/50' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';

  const formatValue = (value: number, unit: string) => {
    if (unit === '£') return `£${value.toLocaleString()}`;
    if (unit === '%') return `${value}%`;
    return `${value.toLocaleString()} ${unit}`;
  };

  return (
    <View className={`p-4 rounded-xl ${cardBg}`}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text className={`text-sm font-semibold ${textPrimary}`}>{metric.name}</Text>
          <TrendIcon trend={metric.trend} />
        </View>
        <Text className={`text-lg font-bold ${textPrimary}`}>
          {formatValue(metric.currentValue, metric.unit)}
        </Text>
      </View>
      <View className={`h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200'}`}>
        <View
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: progressColor }}
        />
      </View>
      <View className="flex-row items-center justify-between">
        <Text className={`text-xs ${textSecondary}`}>{progress}% of target</Text>
        <Text className={`text-xs ${textSecondary}`}>
          Target: {formatValue(metric.targetValue, metric.unit)}
        </Text>
      </View>
    </View>
  );
}
