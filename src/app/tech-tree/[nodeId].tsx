/**
 * Tech Tree Node Detail Screen
 * Shows task pack, progress, and allows completing tasks
 */

import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Star,
  CheckCircle2,
  Circle,
  Trophy,
  Zap,
  Clock,
  Gift,
  Target,
  ArrowLeft,
  Upload,
  AlertCircle,
} from 'lucide-react-native';
import { useTechTreeStore } from '@/lib/state/tech-tree-store';
import { TECH_TREE_NODES } from '@/lib/data/tech-tree-nodes';

export default function TechTreeNodeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ nodeId: string }>();

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [proofText, setProofText] = useState('');

  // Store
  const getNodeState = useTechTreeStore((s) => s.getNodeState);
  const getNodeProgress = useTechTreeStore((s) => s.getNodeProgress);
  const startResearch = useTechTreeStore((s) => s.startResearch);
  const startTaskPack = useTechTreeStore((s) => s.startTaskPack);
  const completeTask = useTechTreeStore((s) => s.completeTask);
  const completeNode = useTechTreeStore((s) => s.completeNode);
  const submitProof = useTechTreeStore((s) => s.submitProof);

  const node = TECH_TREE_NODES.find((n) => n.id === params.nodeId);
  const nodeState = node ? getNodeState(node.id) : 'locked';
  const nodeProgress = node ? getNodeProgress(node.id) : undefined;

  if (!node) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <Text className="text-gray-900 dark:text-white text-lg">Node not found</Text>
      </View>
    );
  }

  const completedTasksCount = nodeProgress?.completedTaskIds.length || 0;
  const totalTasksCount = node.taskPack.tasks.length;
  const allTasksCompleted = completedTasksCount === totalTasksCount;

  const handleStartNode = () => {
    if (nodeState === 'available') {
      startResearch(node.id);
      startTaskPack(node.id);
    }
  };

  const handleToggleTask = (taskId: string) => {
    if (nodeState !== 'in-progress' && nodeState !== 'available') return;

    if (!nodeProgress?.taskPackStartedAt) {
      startTaskPack(node.id);
    }

    completeTask(node.id, taskId);
  };

  const handleCompleteNode = () => {
    if (!allTasksCompleted) return;

    if (node.isBossGate && !proofText.trim()) {
      alert('Boss gates require proof of completion');
      return;
    }

    if (node.isBossGate && proofText.trim()) {
      submitProof(node.id, 'text', proofText);
    }

    completeNode(node.id);
    setShowCompleteModal(false);
    router.back();
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: node.title,
          headerStyle: { backgroundColor: '#030712' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Node Header */}
        <View className="px-5 pt-6 pb-4 border-b border-gray-200 dark:border-slate-800">
          <View className="flex-row items-center gap-3 mb-3">
            <View
              className={`w-16 h-16 rounded-full border-4 items-center justify-center ${
                nodeState === 'completed'
                  ? 'bg-emerald-500 border-emerald-400'
                  : nodeState === 'in-progress'
                  ? 'bg-blue-500 border-blue-400'
                  : nodeState === 'available'
                  ? 'bg-purple-500 border-purple-400'
                  : 'bg-gray-300 dark:bg-slate-700 border-gray-600'
              }`}
            >
              {node.isBossGate ? (
                <Trophy size={28} color="#fff" />
              ) : (
                <Star size={28} color="#fff" />
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-2 flex-wrap mb-1">
                <Text className="text-gray-900 dark:text-white text-xl font-bold">{node.title}</Text>
                {node.type === 'side-quest' && (
                  <View className="bg-purple-500/20 border border-purple-500 px-2 py-0.5 rounded">
                    <Text className="text-purple-400 text-[10px] font-bold">
                      SIDE QUEST
                    </Text>
                  </View>
                )}
                {node.isBossGate && (
                  <View className="bg-red-500/20 border border-red-500 px-2 py-0.5 rounded">
                    <Text className="text-red-400 text-[10px] font-bold">BOSS GATE</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-600 dark:text-slate-400 text-sm">{node.subtitle}</Text>
            </View>
          </View>

          <Text className="text-gray-700 dark:text-slate-300 text-base leading-6">{node.description}</Text>

          {/* Rewards */}
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 bg-blue-900/20 border border-blue-500 rounded-xl p-3">
              <View className="flex-row items-center gap-2 mb-1">
                <Zap size={16} color="#3b82f6" />
                <Text className="text-blue-400 text-xs font-medium">XP Reward</Text>
              </View>
              <Text className="text-gray-900 dark:text-white text-lg font-bold">+{node.xpReward} XP</Text>
            </View>

            <View className="flex-1 bg-purple-900/20 border border-purple-500 rounded-xl p-3">
              <View className="flex-row items-center gap-2 mb-1">
                <Clock size={16} color="#a855f7" />
                <Text className="text-purple-400 text-xs font-medium">Time Estimate</Text>
              </View>
              <Text className="text-gray-900 dark:text-white text-lg font-bold">
                {node.taskPack.totalTUEstimate} TU
              </Text>
            </View>
          </View>
        </View>

        {/* Unlocks */}
        {node.unlocks.length > 0 && (
          <View className="px-5 pt-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Gift size={20} color="#f59e0b" />
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">Unlocks</Text>
            </View>

            <View className="gap-3">
              {node.unlocks.map((unlock, idx) => (
                <View
                  key={idx}
                  className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4"
                >
                  <Text className="text-gray-900 dark:text-white text-base font-semibold mb-1">
                    {unlock.title}
                  </Text>
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">{unlock.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Buff (for side quests) */}
        {node.buff && (
          <View className="px-5 pt-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Zap size={20} color="#a855f7" />
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">Permanent Buff</Text>
            </View>

            <View className="bg-purple-900/20 border border-purple-500 rounded-xl p-4">
              <Text className="text-purple-300 text-base font-semibold mb-2">
                ⚡ {node.buff.name}
              </Text>
              <Text className="text-gray-700 dark:text-slate-300 text-sm mb-3">{node.buff.description}</Text>
              <View className="bg-purple-500/20 px-3 py-2 rounded-lg">
                <Text className="text-purple-200 text-sm font-medium">
                  Effect: {node.buff.effect.type} ×{node.buff.effect.value}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Task Pack */}
        <View className="px-5 pt-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Target size={20} color="#3b82f6" />
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">Task Pack</Text>
            </View>
            <Text className="text-gray-600 dark:text-slate-400 text-sm">
              {completedTasksCount} / {totalTasksCount}
            </Text>
          </View>

          <View className="gap-3">
            {node.taskPack.tasks.map((task) => {
              const isCompleted = nodeProgress?.completedTaskIds.includes(task.id) || false;

              return (
                <Pressable
                  key={task.id}
                  onPress={() => handleToggleTask(task.id)}
                  disabled={nodeState === 'completed' || nodeState === 'locked'}
                  className={`border-2 rounded-xl p-4 ${
                    isCompleted
                      ? 'bg-emerald-900/20 border-emerald-500'
                      : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800'
                  }`}
                >
                  <View className="flex-row items-start gap-3">
                    <View className="pt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 size={24} color="#10b981" />
                      ) : (
                        <Circle size={24} color="#6b7280" />
                      )}
                    </View>

                    <View className="flex-1">
                      <Text
                        className={`text-base font-semibold mb-2 ${
                          isCompleted ? 'text-emerald-400 line-through' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                        {task.description}
                      </Text>
                      <View className="bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded self-start">
                        <Text className="text-gray-600 dark:text-slate-400 text-xs">
                          {task.tuEstimate} TU
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Boss Gate Proof Requirements */}
        {node.isBossGate && node.proofRequired && (
          <View className="px-5 pt-6">
            <View className="flex-row items-center gap-2 mb-3">
              <AlertCircle size={20} color="#f59e0b" />
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">Proof Required</Text>
            </View>

            <View className="bg-amber-900/20 border border-amber-500 rounded-xl p-4">
              {node.proofRequired.map((proof, idx) => (
                <View key={idx} className="flex-row items-start gap-2 mb-2">
                  <Text className="text-amber-400">•</Text>
                  <Text className="text-gray-700 dark:text-slate-300 text-sm flex-1">
                    {proof.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>

      {/* Action Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-5 py-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {nodeState === 'locked' && (
          <View className="bg-gray-200 dark:bg-slate-800 rounded-xl py-3 items-center">
            <Text className="text-gray-600 dark:text-slate-400 text-base font-semibold">
              Locked - Complete Prerequisites
            </Text>
          </View>
        )}

        {nodeState === 'available' && (
          <Pressable
            onPress={handleStartNode}
            className="bg-purple-500 rounded-xl py-3 items-center"
          >
            <Text className="text-white text-base font-semibold">Start Node</Text>
          </Pressable>
        )}

        {nodeState === 'in-progress' && !allTasksCompleted && (
          <View className="bg-blue-500/20 border border-blue-500 rounded-xl py-3 items-center">
            <Text className="text-blue-400 text-base font-semibold">
              Complete All Tasks ({completedTasksCount}/{totalTasksCount})
            </Text>
          </View>
        )}

        {nodeState === 'in-progress' && allTasksCompleted && (
          <Pressable
            onPress={() => setShowCompleteModal(true)}
            className="bg-emerald-500 rounded-xl py-3 items-center"
          >
            <Text className="text-white text-base font-semibold">Complete Node</Text>
          </Pressable>
        )}

        {nodeState === 'completed' && (
          <View className="bg-emerald-900/20 border border-emerald-500 rounded-xl py-3 items-center">
            <Text className="text-emerald-400 text-base font-semibold">
              ✓ Completed
            </Text>
          </View>
        )}
      </View>

      {/* Completion Modal (for boss gates with proof) */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => setShowCompleteModal(false)}
        >
          <View className="flex-1" />
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ maxHeight: '90%' }}
          >
            <View className="bg-gray-50 dark:bg-slate-900 rounded-t-3xl">
              <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="p-6">
                  <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-4">
                    Complete Node
                  </Text>

                  {node.isBossGate && (
                    <>
                      <View className="bg-amber-900/20 border border-amber-500 rounded-xl p-4 mb-4">
                        <View className="flex-row items-center gap-2 mb-2">
                          <Upload size={20} color="#f59e0b" />
                          <Text className="text-amber-400 font-semibold">
                            Boss Gate - Proof Required
                          </Text>
                        </View>
                        <Text className="text-gray-700 dark:text-slate-300 text-sm">
                          Submit proof of completion (screenshot URL, metrics, etc.)
                        </Text>
                      </View>

                      <TextInput
                        className="bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white mb-4"
                        placeholder="Enter proof URL or description..."
                        placeholderTextColor="#6b7280"
                        value={proofText}
                        onChangeText={setProofText}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </>
                  )}

                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-6">
                    Complete this node to earn {node.xpReward} XP and unlock rewards.
                  </Text>

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => setShowCompleteModal(false)}
                      className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl py-3 items-center"
                    >
                      <Text className="text-gray-700 dark:text-slate-300 text-base font-semibold">
                        Cancel
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleCompleteNode}
                      className="flex-1 bg-emerald-500 rounded-xl py-3 items-center"
                    >
                      <Text className="text-white text-base font-semibold">
                        Complete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
