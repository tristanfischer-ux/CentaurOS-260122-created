import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { Target, Plus, TrendingUp, AlertTriangle, XCircle, Edit2, Trash2, X, Download } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useObjectives } from '@/lib/hooks/queries';
import { LinearGradient } from 'expo-linear-gradient';
import { objectiveApi, keyResultApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { exportToCSV, formatOKRsForExport } from '@/lib/export';
import type { KeyResult } from '@/types';

export default function OKRsScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: objectives, isLoading } = useObjectives(currentWorkspace?.id ?? null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditKRModal, setShowEditKRModal] = useState(false);
  const [selectedKR, setSelectedKR] = useState<KeyResult | null>(null);
  const [newKRValue, setNewKRValue] = useState('');

  // Create objective form state
  const [newObjectiveTitle, setNewObjectiveTitle] = useState('');
  const [newObjectiveDescription, setNewObjectiveDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!objectives || objectives.length === 0) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <Target size={64} color="#475569" />
        <Text className="text-white text-xl font-semibold mt-4 mb-2">No Objectives Yet</Text>
        <Text className="text-slate-400 text-center mb-6">
          Create your first objective to start tracking progress
        </Text>
        <Pressable
          onPress={() => setShowCreateModal(true)}
          className="bg-blue-500 rounded-xl px-6 py-3 active:opacity-80"
        >
          <Text className="text-white font-semibold">Create Objective</Text>
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

    setIsCreating(true);
    try {
      await objectiveApi.create(
        {
          title: newObjectiveTitle.trim(),
          description: newObjectiveDescription.trim() || undefined,
          workspaceId: currentWorkspace.id,
          ownerId: currentUser.id,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        },
        currentUser.id,
        currentMembership.role
      );

      queryClient.invalidateQueries({ queryKey: ['objectives', currentWorkspace.id] });
      setShowCreateModal(false);
      setNewObjectiveTitle('');
      setNewObjectiveDescription('');
      Alert.alert('Success', 'Objective created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create objective');
    } finally {
      setIsCreating(false);
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
    <ScrollView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="p-6 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">Objectives & Key Results</Text>
            <Text className="text-slate-400 text-sm mt-1">
              {objectives.length} active objective{objectives.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleExportOKRs}
              className="bg-slate-800 rounded-xl px-4 py-2 active:opacity-80"
            >
              <Download size={20} color="#94a3b8" />
            </Pressable>
            {currentMembership?.role === 'Founder' && (
              <Pressable
                onPress={() => setShowCreateModal(true)}
                className="bg-blue-500 rounded-xl px-4 py-2 active:opacity-80"
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
              <View key={objective.id} className="bg-slate-900 rounded-3xl p-5 border border-slate-800">
                {/* Objective Header */}
                <View className="mb-4">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-3">
                      <Text className="text-white text-lg font-bold mb-1">{objective.title}</Text>
                      {objective.description && (
                        <Text className="text-slate-400 text-sm">{objective.description}</Text>
                      )}
                    </View>
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
                          <Text className="text-white font-medium flex-1 mr-2">{kr.title}</Text>
                          <View className="flex-row items-center">
                            <Text className="text-white font-bold mr-1">
                              {kr.currentValue}{kr.unit}
                            </Text>
                            <Text className="text-slate-400 text-sm">/ {kr.targetValue}{kr.unit}</Text>
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
                          <Text className="text-slate-400 text-xs">{Math.round(progress)}% complete</Text>
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
                            <Text className="text-slate-400 text-xs capitalize">
                              {kr.healthStatus.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Update KR Modal */}
      <Modal visible={showEditKRModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Update Key Result</Text>
              <Pressable onPress={() => setShowEditKRModal(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {selectedKR && (
              <>
                <Text className="text-slate-400 mb-4">{selectedKR.title}</Text>

                <View className="mb-6">
                  <Text className="text-slate-400 text-sm mb-2">Current Value</Text>
                  <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                    <TextInput
                      className="flex-1 text-white text-lg font-semibold"
                      value={newKRValue}
                      onChangeText={setNewKRValue}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#475569"
                    />
                    <Text className="text-slate-400 ml-2">{selectedKR.unit}</Text>
                  </View>
                  <Text className="text-slate-500 text-xs mt-2">
                    Target: {selectedKR.targetValue}{selectedKR.unit}
                  </Text>
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowEditKRModal(false)}
                    className="flex-1 bg-slate-800 rounded-xl py-3 items-center active:opacity-80"
                  >
                    <Text className="text-slate-400 font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUpdateKR}
                    className="flex-1 bg-blue-500 rounded-xl py-3 items-center active:opacity-80"
                  >
                    <Text className="text-white font-semibold">Update</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Objective Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Create Objective</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View className="mb-4">
              <Text className="text-slate-400 text-sm mb-2">Title *</Text>
              <TextInput
                className="bg-slate-800 rounded-xl px-4 py-3 text-white text-base"
                value={newObjectiveTitle}
                onChangeText={setNewObjectiveTitle}
                placeholder="Enter objective title"
                placeholderTextColor="#475569"
                editable={!isCreating}
              />
            </View>

            <View className="mb-6">
              <Text className="text-slate-400 text-sm mb-2">Description (Optional)</Text>
              <TextInput
                className="bg-slate-800 rounded-xl px-4 py-3 text-white text-base"
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

            <Text className="text-slate-500 text-xs mb-4">
              Objective will be set to 90 days from today by default.
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowCreateModal(false)}
                className="flex-1 bg-slate-800 rounded-xl py-3 items-center active:opacity-80"
                disabled={isCreating}
              >
                <Text className="text-slate-400 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateObjective}
                className="flex-1 bg-blue-500 rounded-xl py-3 items-center active:opacity-80"
                disabled={isCreating || !newObjectiveTitle.trim()}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold">Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
