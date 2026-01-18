/**
 * Synthesis Review Modal
 * Modal for reviewing synthesized objectives and tasks from brainstorming session
 */

import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { X, Target, CheckSquare, ChevronRight, Clock, Lightbulb } from 'lucide-react-native';

interface SynthesizedTask {
  title: string;
  notes?: string;
  units: number;
}

interface SynthesizedObjective {
  title: string;
  description?: string;
  tasks: SynthesizedTask[];
}

interface SynthesisReviewModalProps {
  visible: boolean;
  onClose: () => void;
  objectives: SynthesizedObjective[];
  onConfirm: () => void;
}

export function SynthesisReviewModal({
  visible,
  onClose,
  objectives,
  onConfirm,
}: SynthesisReviewModalProps) {
  const totalTasks = objectives.reduce((sum, obj) => sum + obj.tasks.length, 0);

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
                  Strategic Plan
                </Text>
                <Text className="text-slate-600 dark:text-slate-400 text-sm">
                  {objectives.length} objective{objectives.length !== 1 ? 's' : ''} • {totalTasks} task{totalTasks !== 1 ? 's' : ''}
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView
              className="px-6 py-4"
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {objectives.length === 0 ? (
                <View className="items-center py-12">
                  <Text className="text-slate-500 dark:text-slate-400 text-center">
                    No objectives were generated.{'\n'}Try continuing the conversation.
                  </Text>
                </View>
              ) : (
                <View className="gap-4">
                  {/* Info Banner */}
                  <View className="flex-row items-start gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                    <Lightbulb size={20} color="#8b5cf6" />
                    <View className="flex-1">
                      <Text className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        Review the strategic objectives and tasks generated from your brainstorming session.
                        Confirm to add them to your workspace.
                      </Text>
                    </View>
                  </View>

                  {/* Objectives List */}
                  {objectives.map((objective, objIndex) => (
                    <View
                      key={objIndex}
                      className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border-l-4 border-purple-500"
                    >
                      {/* Objective Header */}
                      <View className="flex-row items-start gap-3 mb-3">
                        <View className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full items-center justify-center">
                          <Target size={16} color="#8b5cf6" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-900 dark:text-white font-bold text-base mb-1">
                            {objective.title}
                          </Text>
                          {objective.description && (
                            <Text className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                              {objective.description}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Tasks */}
                      {objective.tasks.length > 0 && (
                        <View className="ml-11 gap-2">
                          <View className="flex-row items-center gap-2 mb-1">
                            <CheckSquare size={14} color="#64748b" />
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                              Tasks ({objective.tasks.length})
                            </Text>
                          </View>
                          {objective.tasks.map((task, taskIndex) => (
                            <View
                              key={taskIndex}
                              className="bg-white dark:bg-slate-900 rounded-lg p-3 flex-row items-start gap-2"
                            >
                              <ChevronRight size={16} color="#64748b" className="mt-0.5" />
                              <View className="flex-1">
                                <Text className="text-slate-900 dark:text-white font-medium text-sm mb-1">
                                  {task.title}
                                </Text>
                                {task.notes && (
                                  <Text className="text-slate-600 dark:text-slate-400 text-xs mb-2">
                                    {task.notes}
                                  </Text>
                                )}
                                <View className="flex-row items-center gap-1">
                                  <Clock size={12} color="#64748b" />
                                  <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                    {task.units} TU
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Footer Actions */}
            {objectives.length > 0 && (
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
                    onPress={onConfirm}
                    className="flex-1 bg-purple-500 py-4 rounded-xl items-center flex-row justify-center gap-2"
                  >
                    <Target size={20} color="white" />
                    <Text className="text-white font-semibold">
                      Create All
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
