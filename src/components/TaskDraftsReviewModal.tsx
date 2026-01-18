/**
 * Task Drafts Review Modal
 * Modal for reviewing and editing extracted task drafts before confirmation
 */

import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { X, Edit3, Trash2, CheckCircle2, Calendar, Users, Clock } from 'lucide-react-native';

interface TaskDraft {
  id: string;
  title: string;
  notes?: string;
  assignee_id?: string;
  start_iso?: string;
  due_iso?: string;
  units: number;
  confidence_assignee?: number;
  confidence_due?: number;
}

interface TaskDraftsReviewModalProps {
  visible: boolean;
  onClose: () => void;
  drafts: TaskDraft[];
  onConfirm: (draftIds: string[]) => void;
  onEdit?: (draftId: string, updates: Partial<TaskDraft>) => void;
  onRemove?: (draftId: string) => void;
}

export function TaskDraftsReviewModal({
  visible,
  onClose,
  drafts,
  onConfirm,
  onEdit,
  onRemove,
}: TaskDraftsReviewModalProps) {
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUnits, setEditUnits] = useState('');

  const handleStartEdit = (draft: TaskDraft) => {
    setEditingDraft(draft.id);
    setEditTitle(draft.title);
    setEditUnits(draft.units.toString());
  };

  const handleSaveEdit = (draftId: string) => {
    if (onEdit && editTitle.trim()) {
      onEdit(draftId, {
        title: editTitle.trim(),
        units: parseInt(editUnits) || 1,
      });
    }
    setEditingDraft(null);
  };

  const handleConfirmAll = () => {
    console.log('[TaskDraftsReviewModal] Confirm All clicked');
    console.log('[TaskDraftsReviewModal] drafts:', drafts);
    const allDraftIds = drafts.map(d => d.id);
    console.log('[TaskDraftsReviewModal] allDraftIds:', allDraftIds);
    onConfirm(allDraftIds);
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return '#64748b';
    if (confidence >= 80) return '#10b981';
    if (confidence >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <View>
                <Text className="text-slate-900 dark:text-white font-bold text-xl">
                  Review Task Drafts
                </Text>
                <Text className="text-slate-600 dark:text-slate-400 text-sm">
                  {drafts.length} task{drafts.length !== 1 ? 's' : ''} extracted
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            {/* Drafts List */}
            <ScrollView
              className="px-6 py-4"
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {drafts.length === 0 ? (
                <View className="items-center py-12">
                  <Text className="text-slate-500 dark:text-slate-400 text-center">
                    No tasks were extracted from your input.{'\n'}Try providing more details.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {drafts.map((draft, index) => (
                    <View
                      key={draft.id}
                      className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border-l-4 border-green-500"
                    >
                      {editingDraft === draft.id ? (
                        <View>
                          <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">
                            Edit Task
                          </Text>
                          <TextInput
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholder="Task title"
                            placeholderTextColor="#94a3b8"
                            className="bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-slate-900 dark:text-white mb-3"
                          />
                          <View className="flex-row items-center gap-2 mb-3">
                            <Text className="text-slate-700 dark:text-slate-300 text-sm">
                              Time Units:
                            </Text>
                            <TextInput
                              value={editUnits}
                              onChangeText={setEditUnits}
                              keyboardType="number-pad"
                              placeholder="1"
                              placeholderTextColor="#94a3b8"
                              className="bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-slate-900 dark:text-white w-20"
                            />
                          </View>
                          <View className="flex-row gap-2">
                            <Pressable
                              onPress={() => setEditingDraft(null)}
                              className="flex-1 bg-slate-200 dark:bg-slate-700 py-2 rounded-lg items-center"
                            >
                              <Text className="text-slate-700 dark:text-slate-300 font-medium">
                                Cancel
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleSaveEdit(draft.id)}
                              className="flex-1 bg-green-500 py-2 rounded-lg items-center"
                            >
                              <Text className="text-white font-medium">Save</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View>
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-1 mr-2">
                              <Text className="text-slate-900 dark:text-white font-semibold text-base mb-1">
                                {draft.title}
                              </Text>
                              {draft.notes && (
                                <Text className="text-slate-600 dark:text-slate-400 text-sm">
                                  {draft.notes}
                                </Text>
                              )}
                            </View>
                            <View className="flex-row gap-2">
                              <Pressable
                                onPress={() => handleStartEdit(draft)}
                                className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg"
                              >
                                <Edit3 size={16} color="#3b82f6" />
                              </Pressable>
                              {onRemove && (
                                <Pressable
                                  onPress={() => onRemove(draft.id)}
                                  className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg"
                                >
                                  <Trash2 size={16} color="#ef4444" />
                                </Pressable>
                              )}
                            </View>
                          </View>

                          {/* Meta info */}
                          <View className="flex-row flex-wrap gap-3 mt-2">
                            <View className="flex-row items-center gap-1">
                              <Clock size={14} color="#64748b" />
                              <Text className="text-slate-600 dark:text-slate-400 text-xs">
                                {draft.units} TU
                              </Text>
                            </View>
                            {draft.due_iso && (
                              <View className="flex-row items-center gap-1">
                                <Calendar size={14} color="#64748b" />
                                <Text className="text-slate-600 dark:text-slate-400 text-xs">
                                  {new Date(draft.due_iso).toLocaleDateString()}
                                </Text>
                                {draft.confidence_due && draft.confidence_due < 80 && (
                                  <View
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getConfidenceColor(draft.confidence_due) }}
                                  />
                                )}
                              </View>
                            )}
                            {draft.assignee_id && (
                              <View className="flex-row items-center gap-1">
                                <Users size={14} color="#64748b" />
                                <Text className="text-slate-600 dark:text-slate-400 text-xs">
                                  Assigned
                                </Text>
                                {draft.confidence_assignee && draft.confidence_assignee < 80 && (
                                  <View
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getConfidenceColor(draft.confidence_assignee) }}
                                  />
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {drafts.length > 0 && (
                <View className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                  <Text className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                    Note: Colored dots indicate low AI confidence. Review and edit those fields if needed.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer Actions */}
            {drafts.length > 0 && (
              <View className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={onClose}
                    className="flex-1 bg-slate-200 dark:bg-slate-700 py-4 rounded-xl items-center"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 font-semibold">
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirmAll}
                    className="flex-1 bg-green-500 py-4 rounded-xl items-center flex-row justify-center gap-2"
                  >
                    <CheckCircle2 size={20} color="white" />
                    <Text className="text-white font-semibold">
                      Confirm All
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
