import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { Target, Plus, TrendingUp, AlertTriangle, XCircle, X, Download, Briefcase, CheckCircle2, Edit3, Trash2, GripVertical, Sparkles, Lightbulb, Clock, ArrowRight, CheckSquare } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useObjectives, useTasks } from '@/lib/hooks/queries';
import { objectiveApi, keyResultApi } from '@/lib/api';
import { taskApi } from '@/lib/api/operations';
import { useQueryClient } from '@tanstack/react-query';
import { exportToCSV, formatOKRsForExport } from '@/lib/export';
import type { KeyResult, Objective } from '@/types';
import { router } from 'expo-router';
import { suggestTasksForObjective, getObjectiveCoaching, calculateTotalEffort, type SuggestedTask } from '@/lib/objective-tasks';
import { LinearGradient } from 'expo-linear-gradient';

export default function OKRsScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: objectives, isLoading } = useObjectives(currentWorkspace?.id ?? null);
  const { data: tasks } = useTasks(currentWorkspace?.id ?? null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditKRModal, setShowEditKRModal] = useState(false);
  const [showEditObjectiveModal, setShowEditObjectiveModal] = useState(false);
  const [showSuggestTasksModal, setShowSuggestTasksModal] = useState(false);
  const [selectedKR, setSelectedKR] = useState<KeyResult | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [selectedObjectiveForTasks, setSelectedObjectiveForTasks] = useState<Objective | null>(null);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [newKRValue, setNewKRValue] = useState('');

  // Create objective form state
  const [newObjectiveTitle, setNewObjectiveTitle] = useState('');
  const [newObjectiveDescription, setNewObjectiveDescription] = useState('');
  const [newObjectiveStartDate, setNewObjectiveStartDate] = useState('');
  const [newObjectiveEndDate, setNewObjectiveEndDate] = useState('');
  const [newObjectiveTarget, setNewObjectiveTarget] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit objective form state
  const [editObjectiveTitle, setEditObjectiveTitle] = useState('');
  const [editObjectiveDescription, setEditObjectiveDescription] = useState('');
  const [editObjectiveStartDate, setEditObjectiveStartDate] = useState('');
  const [editObjectiveEndDate, setEditObjectiveEndDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!objectives || objectives.length === 0) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-6">
        <Target size={64} color="#475569" />
        <Text className="text-gray-900 dark:text-white text-xl font-semibold mt-4 mb-2">No Objectives Yet</Text>
        <Text className="text-gray-600 dark:text-slate-400 text-center mb-6">
          Create your first objective to start tracking progress
        </Text>
        <Pressable
          onPress={() => setShowCreateModal(true)}
          className="bg-blue-500 rounded-xl px-6 py-3 active:opacity-70"
        >
          <Text className="text-gray-900 dark:text-white font-semibold">Create Objective</Text>
        </Pressable>
      </View>
    );
  }

  const handleUpdateKR = async () => {
    if (!selectedKR || !currentUser || !currentMembership) return;

    const value = parseFloat(newKRValue);
    if (isNaN(value)) return;

    try {
      await keyResultApi.update(
        selectedKR.id,
        { currentValue: value },
        currentUser.id,
        currentMembership.role
      );

      queryClient.invalidateQueries({ queryKey: ['objectives', currentWorkspace?.id] });
      setShowEditKRModal(false);
      setSelectedKR(null);
      setNewKRValue('');
    } catch (error) {
      console.error('Failed to update KR:', error);
    }
  };

  const handleCreateObjective = async () => {
    if (!newObjectiveTitle.trim() || !currentUser || !currentMembership || !currentWorkspace) {
      return;
    }

    const startDate = newObjectiveStartDate ? new Date(newObjectiveStartDate).toISOString() : new Date().toISOString();
    const endDate = newObjectiveEndDate
      ? new Date(newObjectiveEndDate).toISOString()
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days from now

    setIsCreating(true);
    try {
      await objectiveApi.create(
        {
          title: newObjectiveTitle.trim(),
          description: newObjectiveDescription.trim() || undefined,
          workspaceId: currentWorkspace.id,
          ownerId: currentUser.id,
          startDate,
          endDate,
        },
        currentUser.id,
        currentMembership.role
      );

      queryClient.invalidateQueries({ queryKey: ['objectives', currentWorkspace.id] });
      setShowCreateModal(false);
      setNewObjectiveTitle('');
      setNewObjectiveDescription('');
      setNewObjectiveStartDate('');
      setNewObjectiveEndDate('');
      setNewObjectiveTarget('');
      Alert.alert('Success', 'Objective created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create objective');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditObjective = async () => {
    if (!selectedObjective || !editObjectiveTitle.trim() || !currentUser || !currentMembership) {
      return;
    }

    setIsEditing(true);
    try {
      await objectiveApi.update(
        selectedObjective.id,
        {
          title: editObjectiveTitle.trim(),
          description: editObjectiveDescription.trim() || undefined,
          startDate: editObjectiveStartDate ? new Date(editObjectiveStartDate).toISOString() : selectedObjective.startDate,
          endDate: editObjectiveEndDate ? new Date(editObjectiveEndDate).toISOString() : selectedObjective.endDate,
        },
        currentUser.id,
        currentMembership.role
      );

      queryClient.invalidateQueries({ queryKey: ['objectives', currentWorkspace?.id] });
      setShowEditObjectiveModal(false);
      setSelectedObjective(null);
      setEditObjectiveTitle('');
      setEditObjectiveDescription('');
      setEditObjectiveStartDate('');
      setEditObjectiveEndDate('');
      Alert.alert('Success', 'Objective updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update objective');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteObjective = async (objective: Objective) => {
    if (!currentUser || !currentMembership) return;

    Alert.alert(
      'Delete Objective',
      `Are you sure you want to delete "${objective.title}"? This will also delete all associated key results.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await objectiveApi.delete(
                objective.id,
                currentUser.id,
                currentMembership.role
              );
              queryClient.invalidateQueries({ queryKey: ['objectives', currentWorkspace?.id] });
              Alert.alert('Success', 'Objective deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete objective');
            }
          },
        },
      ]
    );
  };

  const openEditObjectiveModal = (objective: Objective) => {
    setSelectedObjective(objective);
    setEditObjectiveTitle(objective.title);
    setEditObjectiveDescription(objective.description || '');
    setEditObjectiveStartDate(new Date(objective.startDate).toISOString().split('T')[0]);
    setEditObjectiveEndDate(new Date(objective.endDate).toISOString().split('T')[0]);
    setShowEditObjectiveModal(true);
  };

  const openSuggestTasksModal = (objective: Objective) => {
    setSelectedObjectiveForTasks(objective);
    const suggestions = suggestTasksForObjective(objective.title, objective.description);
    setSuggestedTasks(suggestions);
    setSelectedTaskIds(new Set());
    setShowSuggestTasksModal(true);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleCreateSuggestedTasks = async () => {
    if (!selectedObjectiveForTasks || !currentUser || !currentMembership || !currentWorkspace || selectedTaskIds.size === 0) {
      return;
    }

    setIsCreatingTasks(true);
    try {
      const tasksToCreate = suggestedTasks.filter(t => selectedTaskIds.has(t.id));

      for (const task of tasksToCreate) {
        await taskApi.create(
          {
            title: task.title,
            description: `${task.description}\n\n**Why This Matters:**\n${task.why}\n\n**Impact:**\n${task.impact}`,
            status: 'todo',
            priority: task.priority,
            function: task.function,
            objectiveId: selectedObjectiveForTasks.id,
            workspaceId: currentWorkspace.id,
          },
          currentUser.id,
          currentMembership.role
        );
      }

      queryClient.invalidateQueries({ queryKey: ['tasks', currentWorkspace.id] });
      queryClient.invalidateQueries({ queryKey: ['objectives', currentWorkspace.id] });

      setShowSuggestTasksModal(false);
      setSelectedObjectiveForTasks(null);
      setSuggestedTasks([]);
      setSelectedTaskIds(new Set());

      Alert.alert(
        'Tasks Created!',
        `${tasksToCreate.length} task${tasksToCreate.length !== 1 ? 's' : ''} created successfully. View them in the Work tab.`,
        [
          { text: 'View Tasks', onPress: () => router.push('/(tabs)/work') },
          { text: 'Stay Here', style: 'cancel' }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create tasks');
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const handleExportOKRs = async () => {
    if (!objectives || objectives.length === 0) {
      Alert.alert('No Data', 'There are no OKRs to export');
      return;
    }

    try {
      const allKeyResults = objectives.flatMap((obj) => obj.keyResults);
      const exportData = formatOKRsForExport(objectives, allKeyResults);
      await exportToCSV(exportData, `okrs-${currentWorkspace?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Failed to export OKRs');
    }
  };

  return (
    <>
    <ScrollView className="flex-1 bg-white dark:bg-slate-950">
      {/* Header */}
      <View className="p-6 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">Objectives & Key Results</Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
              {objectives.length} active objective{objectives.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleExportOKRs}
              className="bg-slate-800 rounded-xl px-4 py-2 active:opacity-70"
            >
              <Download size={20} color="#94a3b8" />
            </Pressable>
            {currentMembership?.role === 'Founder' && (
              <Pressable
                onPress={() => setShowCreateModal(true)}
                className="bg-blue-500 rounded-xl px-4 py-2 active:opacity-70"
              >
                <Plus size={20} color="white" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Objectives List */}
      <View className="px-6 pb-6">
        <View className="gap-6">
          {objectives.map((objective) => {
            const totalKRs = objective.keyResults.length;
            const onTrackKRs = objective.keyResults.filter((kr) => kr.healthStatus === 'on_track').length;
            const atRiskKRs = objective.keyResults.filter((kr) => kr.healthStatus === 'at_risk').length;
            const offTrackKRs = objective.keyResults.filter((kr) => kr.healthStatus === 'off_track').length;

            return (
              <View key={objective.id} className="bg-gray-100 dark:bg-slate-900 rounded-3xl p-5 border border-slate-800">
                {/* Objective Header */}
                <View className="mb-4">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-3">
                      <Text className="text-gray-900 dark:text-white text-lg font-bold mb-1">{objective.title}</Text>
                      {objective.description && (
                        <Text className="text-gray-600 dark:text-slate-400 text-sm">{objective.description}</Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className={`px-3 py-1 rounded-full ${
                        onTrackKRs === totalKRs ? 'bg-green-500/20' :
                        offTrackKRs > totalKRs / 2 ? 'bg-red-500/20' : 'bg-yellow-500/20'
                      }`}>
                        <Text className={`text-xs font-semibold ${
                          onTrackKRs === totalKRs ? 'text-green-400' :
                          offTrackKRs > totalKRs / 2 ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {onTrackKRs === totalKRs ? 'On Track' :
                           offTrackKRs > totalKRs / 2 ? 'At Risk' : 'Mixed'}
                        </Text>
                      </View>
                      {currentMembership?.role === 'Founder' && (
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => openEditObjectiveModal(objective)}
                            className="w-8 h-8 bg-slate-800 rounded-lg items-center justify-center active:opacity-70"
                          >
                            <Edit3 size={16} color="#3b82f6" />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteObjective(objective)}
                            className="w-8 h-8 bg-slate-800 rounded-lg items-center justify-center active:opacity-70"
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Text className="text-slate-500 text-xs">
                      {new Date(objective.startDate).toLocaleDateString()} - {new Date(objective.endDate).toLocaleDateString()}
                    </Text>
                    <Text className="text-slate-600">•</Text>
                    <Text className="text-slate-500 text-xs">{objective.owner?.name}</Text>
                  </View>

                  {/* KR Health Summary */}
                  <View className="flex-row gap-2 mt-3">
                    {onTrackKRs > 0 && (
                      <View className="flex-row items-center bg-green-500/10 px-2 py-1 rounded-lg">
                        <TrendingUp size={12} color="#10b981" />
                        <Text className="text-green-400 text-xs ml-1">{onTrackKRs} on track</Text>
                      </View>
                    )}
                    {atRiskKRs > 0 && (
                      <View className="flex-row items-center bg-yellow-500/10 px-2 py-1 rounded-lg">
                        <AlertTriangle size={12} color="#eab308" />
                        <Text className="text-yellow-400 text-xs ml-1">{atRiskKRs} at risk</Text>
                      </View>
                    )}
                    {offTrackKRs > 0 && (
                      <View className="flex-row items-center bg-red-500/10 px-2 py-1 rounded-lg">
                        <XCircle size={12} color="#ef4444" />
                        <Text className="text-red-400 text-xs ml-1">{offTrackKRs} off track</Text>
                      </View>
                    )}
                  </View>

                  {/* AI Task Suggestions Button */}
                  {currentMembership?.role === 'Founder' && (
                    <Pressable
                      onPress={() => openSuggestTasksModal(objective)}
                      className="mt-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-3 active:opacity-70"
                    >
                      <LinearGradient
                        colors={['#7c3aed', '#2563eb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          borderRadius: 12,
                        }}
                      />
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2 flex-1">
                          <Sparkles size={18} color="#fff" />
                          <Text className="text-gray-900 dark:text-white font-semibold">Get AI Task Suggestions</Text>
                        </View>
                        <ArrowRight size={18} color="#fff" />
                      </View>
                    </Pressable>
                  )}
                </View>

                {/* Key Results */}
                <View className="gap-3">
                  {objective.keyResults.map((kr) => {
                    const progress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
                    const healthColor =
                      kr.healthStatus === 'on_track' ? '#10b981' :
                      kr.healthStatus === 'at_risk' ? '#eab308' : '#ef4444';

                    return (
                      <Pressable
                        key={kr.id}
                        onPress={() => {
                          setSelectedKR(kr);
                          setNewKRValue(kr.currentValue.toString());
                          setShowEditKRModal(true);
                        }}
                        className="bg-slate-800 rounded-xl p-3 active:opacity-70"
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <Text className="text-gray-900 dark:text-white font-medium flex-1 mr-2">{kr.title}</Text>
                          <View className="flex-row items-center">
                            <Text className="text-gray-900 dark:text-white font-bold mr-1">
                              {kr.currentValue}{kr.unit}
                            </Text>
                            <Text className="text-gray-600 dark:text-slate-400 text-sm">/ {kr.targetValue}{kr.unit}</Text>
                          </View>
                        </View>

                        <View className="bg-slate-700 h-2 rounded-full overflow-hidden">
                          <View
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                              height: '100%',
                              backgroundColor: healthColor,
                              borderRadius: 9999,
                            }}
                          />
                        </View>

                        <View className="flex-row items-center justify-between mt-2">
                          <Text className="text-gray-600 dark:text-slate-400 text-xs">{Math.round(progress)}% complete</Text>
                          <View className="flex-row items-center">
                            <View
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: healthColor,
                                marginRight: 4,
                              }}
                            />
                            <Text className="text-gray-600 dark:text-slate-400 text-xs capitalize">
                              {kr.healthStatus.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Related Tasks */}
                {(() => {
                  const relatedTasks = tasks?.filter(t => t.objectiveId === objective.id) || [];
                  const completedTasks = relatedTasks.filter(t => t.status === 'done').length;

                  if (relatedTasks.length > 0) {
                    return (
                      <View className="mt-4 pt-4 border-t border-slate-800">
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center gap-2">
                            <Briefcase size={16} color="#3b82f6" />
                            <Text className="text-gray-900 dark:text-white font-semibold text-sm">Related Tasks</Text>
                            <View className="bg-slate-800 px-2 py-0.5 rounded-full">
                              <Text className="text-gray-600 dark:text-slate-400 text-xs">{completedTasks}/{relatedTasks.length}</Text>
                            </View>
                          </View>
                          <Pressable
                            onPress={() => router.push('/(tabs)/work')}
                            className="active:opacity-70"
                          >
                            <Text className="text-blue-400 text-xs font-medium">View All</Text>
                          </Pressable>
                        </View>

                        <View className="gap-2">
                          {relatedTasks.slice(0, 3).map((task) => (
                            <View
                              key={task.id}
                              className="bg-slate-800 rounded-lg p-3 flex-row items-center justify-between"
                            >
                              <View className="flex-1">
                                <Text className="text-gray-900 dark:text-white text-sm font-medium mb-1">
                                  {task.title}
                                </Text>
                                <View className="flex-row items-center gap-2">
                                  <Text className="text-slate-500 text-xs capitalize">
                                    {task.status.replace('_', ' ')}
                                  </Text>
                                  {task.assignee && (
                                    <>
                                      <Text className="text-slate-600">•</Text>
                                      <Text className="text-slate-500 text-xs">
                                        {task.assignee.name}
                                      </Text>
                                    </>
                                  )}
                                </View>
                              </View>
                              {task.status === 'done' && (
                                <CheckCircle2 size={16} color="#10b981" />
                              )}
                            </View>
                          ))}
                        </View>

                        {relatedTasks.length > 3 && (
                          <Text className="text-slate-500 text-xs mt-2 text-center">
                            +{relatedTasks.length - 3} more tasks
                          </Text>
                        )}
                      </View>
                    );
                  }
                  return null;
                })()}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>

    {/* Modals - Outside ScrollView */}
    {/* Update KR Modal */}
    <Modal visible={showEditKRModal} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 dark:text-white text-xl font-bold">Update Key Result</Text>
              <Pressable onPress={() => setShowEditKRModal(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {selectedKR && (
              <>
                <Text className="text-gray-600 dark:text-slate-400 mb-4">{selectedKR.title}</Text>

                <View className="mb-6">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Current Value</Text>
                  <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                    <TextInput
                      className="flex-1 text-gray-900 dark:text-white text-lg font-semibold"
                      value={newKRValue}
                      onChangeText={setNewKRValue}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#475569"
                    />
                    <Text className="text-gray-600 dark:text-slate-400 ml-2">{selectedKR.unit}</Text>
                  </View>
                  <Text className="text-slate-500 text-xs mt-2">
                    Target: {selectedKR.targetValue}{selectedKR.unit}
                  </Text>
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowEditKRModal(false)}
                    className="flex-1 bg-slate-800 rounded-xl py-3 items-center active:opacity-70"
                  >
                    <Text className="text-gray-600 dark:text-slate-400 font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUpdateKR}
                    className="flex-1 bg-blue-500 rounded-xl py-3 items-center active:opacity-70"
                  >
                    <Text className="text-gray-900 dark:text-white font-semibold">Update</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Objective Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/70 justify-end">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">Create Objective</Text>
                <Pressable onPress={() => setShowCreateModal(false)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Title *</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={newObjectiveTitle}
                  onChangeText={setNewObjectiveTitle}
                  placeholder="Enter objective title"
                  placeholderTextColor="#475569"
                  editable={!isCreating}
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Description (Optional)</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={newObjectiveDescription}
                  onChangeText={setNewObjectiveDescription}
                  placeholder="Add details about this objective"
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isCreating}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Start Date (Optional)</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={newObjectiveStartDate}
                  onChangeText={setNewObjectiveStartDate}
                  placeholder="YYYY-MM-DD (defaults to today)"
                  placeholderTextColor="#475569"
                  editable={!isCreating}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">End Date (Optional)</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={newObjectiveEndDate}
                  onChangeText={setNewObjectiveEndDate}
                  placeholder="YYYY-MM-DD (defaults to 90 days)"
                  placeholderTextColor="#475569"
                  editable={!isCreating}
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Target (Optional)</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={newObjectiveTarget}
                  onChangeText={setNewObjectiveTarget}
                  placeholder="e.g., 100 units, £50k revenue"
                  placeholderTextColor="#475569"
                  editable={!isCreating}
                />
                <Text className="text-slate-500 text-xs mt-1">
                  Add specific numbers or metrics to track (for reference only)
                </Text>
              </View>

              <Text className="text-slate-500 text-xs mb-4">
                Dates default to today (start) and 90 days from today (end) if not specified.
              </Text>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-800 rounded-xl py-3 items-center active:opacity-70"
                  disabled={isCreating}
                >
                  <Text className="text-gray-600 dark:text-slate-400 font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateObjective}
                  className="flex-1 bg-blue-500 rounded-xl py-3 items-center active:opacity-70"
                  disabled={isCreating || !newObjectiveTitle.trim()}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-gray-900 dark:text-white font-semibold">Create</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Objective Modal */}
      <Modal visible={showEditObjectiveModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/70 justify-end">
            <View className="bg-gray-100 dark:bg-slate-900 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">Edit Objective</Text>
                <Pressable onPress={() => setShowEditObjectiveModal(false)}>
                  <X size={24} color="#94a3b8" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Title *</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={editObjectiveTitle}
                  onChangeText={setEditObjectiveTitle}
                  placeholder="Enter objective title"
                  placeholderTextColor="#475569"
                  editable={!isEditing}
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Description (Optional)</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={editObjectiveDescription}
                  onChangeText={setEditObjectiveDescription}
                  placeholder="Add details about this objective"
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isEditing}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">Start Date</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={editObjectiveStartDate}
                  onChangeText={setEditObjectiveStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#475569"
                  editable={!isEditing}
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">End Date</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                  value={editObjectiveEndDate}
                  onChangeText={setEditObjectiveEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#475569"
                  editable={!isEditing}
                />
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowEditObjectiveModal(false)}
                  className="flex-1 bg-slate-800 rounded-xl py-3 items-center active:opacity-70"
                  disabled={isEditing}
                >
                  <Text className="text-gray-600 dark:text-slate-400 font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleEditObjective}
                  className="flex-1 bg-blue-500 rounded-xl py-3 items-center active:opacity-70"
                  disabled={isEditing || !editObjectiveTitle.trim()}
                >
                  {isEditing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-gray-900 dark:text-white font-semibold">Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Suggest Tasks Modal */}
      <Modal visible={showSuggestTasksModal} transparent animationType="slide">
        <View className="flex-1 bg-black/70">
          {selectedObjectiveForTasks && (
            <View className="mt-auto bg-gray-100 dark:bg-slate-900 rounded-t-3xl" style={{ maxHeight: '90%' }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                  colors={['#7c3aed', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ padding: 24, paddingTop: 32 }}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 mr-4">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Lightbulb size={28} color="#fff" />
                        <Text className="text-gray-900 dark:text-white text-2xl font-bold">AI Task Advisor</Text>
                      </View>
                      <Text className="text-purple-100 text-sm">
                        Proven tasks that lead to: {selectedObjectiveForTasks.title}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setShowSuggestTasksModal(false)}
                      className="bg-white/20 p-2 rounded-full active:opacity-70"
                    >
                      <X size={24} color="#fff" />
                    </Pressable>
                  </View>
                </LinearGradient>

                {suggestedTasks.length === 0 ? (
                  <View className="p-6">
                    <View className="bg-slate-800 rounded-2xl p-6 items-center">
                      <Target size={64} color="#64748b" />
                      <Text className="text-gray-900 dark:text-white text-lg font-bold mt-4 mb-2">No Specific Suggestions Yet</Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-center text-sm">
                        Try adding keywords like "revenue", "customer acquisition", "product market fit", "hire team", or "fundraising" to your objective title.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    {/* Coaching Section */}
                    {(() => {
                      // Determine category based on the matched pattern
                      const firstTask = suggestedTasks[0];
                      let category: 'revenue' | 'product' | 'customer' | 'team' | 'operations' | 'fundraising' = 'operations';

                      if (firstTask) {
                        // Match based on task ID prefix
                        const idPrefix = firstTask.id.split('-')[0];
                        switch (idPrefix) {
                          case 'rev':
                            category = 'revenue';
                            break;
                          case 'pmf':
                            category = 'product';
                            break;
                          case 'acq':
                            category = 'customer';
                            break;
                          case 'team':
                            category = 'team';
                            break;
                          case 'ops':
                            category = 'operations';
                            break;
                          case 'fund':
                            category = 'fundraising';
                            break;
                        }
                      }

                      const coaching = getObjectiveCoaching(category);
                      const effort = calculateTotalEffort(suggestedTasks);

                      return (
                        <View className="p-6 border-b border-slate-800">
                          <View className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 mb-4">
                            <View className="flex-row items-start gap-3">
                              <Lightbulb size={20} color="#a855f7" />
                              <View className="flex-1">
                                <Text className="text-purple-300 font-semibold mb-1">Founder Coaching</Text>
                                <Text className="text-purple-100 text-sm leading-5">{coaching}</Text>
                              </View>
                            </View>
                          </View>

                          <View className="flex-row gap-3">
                            <View className="flex-1 bg-slate-800 rounded-xl p-3">
                              <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Total Tasks</Text>
                              <Text className="text-gray-900 dark:text-white text-xl font-bold">{suggestedTasks.length}</Text>
                            </View>
                            <View className="flex-1 bg-slate-800 rounded-xl p-3">
                              <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Est. Effort</Text>
                              <Text className="text-gray-900 dark:text-white text-xl font-bold">{effort.totalHours}h</Text>
                            </View>
                            <View className="flex-1 bg-slate-800 rounded-xl p-3">
                              <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">Selected</Text>
                              <Text className="text-gray-900 dark:text-white text-xl font-bold">{selectedTaskIds.size}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })()}

                    {/* Task List */}
                    <View className="px-6 pb-6">
                      <View className="flex-row items-center justify-between mb-4 mt-2">
                        <Text className="text-gray-900 dark:text-white font-bold text-lg">Suggested Tasks</Text>
                        <Pressable
                          onPress={() => {
                            if (selectedTaskIds.size === suggestedTasks.length) {
                              setSelectedTaskIds(new Set());
                            } else {
                              setSelectedTaskIds(new Set(suggestedTasks.map(t => t.id)));
                            }
                          }}
                          className="active:opacity-70"
                        >
                          <Text className="text-blue-400 text-sm font-medium">
                            {selectedTaskIds.size === suggestedTasks.length ? 'Deselect All' : 'Select All'}
                          </Text>
                        </Pressable>
                      </View>

                      <View className="gap-3">
                        {suggestedTasks.map((task, index) => {
                          const isSelected = selectedTaskIds.has(task.id);
                          const priorityColors = {
                            urgent: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
                            high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
                            medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
                            low: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
                          };
                          const colors = priorityColors[task.priority];

                          return (
                            <Pressable
                              key={task.id}
                              onPress={() => toggleTaskSelection(task.id)}
                              className={`rounded-2xl p-4 border-2 ${
                                isSelected ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-800 border-slate-700'
                              } active:opacity-70`}
                            >
                              {/* Task Header */}
                              <View className="flex-row items-start gap-3 mb-3">
                                <View className={`w-6 h-6 rounded-lg border-2 ${
                                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'
                                } items-center justify-center mt-0.5`}>
                                  {isSelected && <CheckSquare size={16} color="#fff" />}
                                </View>
                                <View className="flex-1">
                                  <View className="flex-row items-center gap-2 mb-1">
                                    <View className={`px-2 py-0.5 rounded ${colors.bg} ${colors.border} border`}>
                                      <Text className={`${colors.text} text-xs font-semibold uppercase`}>
                                        {task.priority}
                                      </Text>
                                    </View>
                                    <View className="bg-slate-700 px-2 py-0.5 rounded">
                                      <Text className="text-slate-300 text-xs">{task.function}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-1">
                                      <Clock size={12} color="#64748b" />
                                      <Text className="text-gray-600 dark:text-slate-400 text-xs">{task.estimatedHours}h</Text>
                                    </View>
                                  </View>
                                  <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">{task.title}</Text>
                                  <Text className="text-slate-300 text-sm leading-5 mb-3">
                                    {task.description}
                                  </Text>

                                  {/* Why This Matters */}
                                  <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3 mb-2">
                                    <Text className="text-purple-400 font-semibold text-xs mb-1">
                                      💡 Why This Matters
                                    </Text>
                                    <Text className="text-slate-300 text-xs leading-4">
                                      {task.why}
                                    </Text>
                                  </View>

                                  {/* Impact */}
                                  <View className="bg-gray-100 dark:bg-slate-900 rounded-xl p-3">
                                    <Text className="text-emerald-400 font-semibold text-xs mb-1">
                                      🎯 Expected Impact
                                    </Text>
                                    <Text className="text-slate-300 text-xs leading-4">
                                      {task.impact}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </>
                )}

                {/* Action Buttons */}
                {suggestedTasks.length > 0 && (
                  <View className="p-6 pt-0 pb-8 border-t border-slate-800">
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => setShowSuggestTasksModal(false)}
                        className="flex-1 bg-slate-800 rounded-xl py-4 items-center active:opacity-70"
                        disabled={isCreatingTasks}
                      >
                        <Text className="text-gray-600 dark:text-slate-400 font-semibold">Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCreateSuggestedTasks}
                        className="flex-[2] bg-blue-500 rounded-xl py-4 items-center active:opacity-70"
                        disabled={isCreatingTasks || selectedTaskIds.size === 0}
                      >
                        {isCreatingTasks ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <View className="flex-row items-center gap-2">
                            <CheckCircle2 size={20} color="#fff" />
                            <Text className="text-gray-900 dark:text-white font-bold">
                              Create {selectedTaskIds.size} Task{selectedTaskIds.size !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                    <Text className="text-slate-500 text-xs text-center mt-3">
                      Tasks will be added to the Work tab and linked to this objective
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
