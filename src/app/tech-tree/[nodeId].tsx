/**
 * Getting Started Step Detail Screen
 * Shows task details for a single onboarding step
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
} from 'lucide-react-native';
import { useTechTreeStore } from '@/lib/state/tech-tree-store';
import { TECH_TREE_NODES } from '@/lib/data/tech-tree-nodes';

export default function StepDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ nodeId: string }>();

  // Store
  const getNodeState = useTechTreeStore((s) => s.getNodeState);
  const getNodeProgress = useTechTreeStore((s) => s.getNodeProgress);
  const startTaskPack = useTechTreeStore((s) => s.startTaskPack);
  const completeTask = useTechTreeStore((s) => s.completeTask);
  const completeNode = useTechTreeStore((s) => s.completeNode);

  const node = TECH_TREE_NODES.find((n) => n.id === params.nodeId);
  const nodeState = node ? getNodeState(node.id) : 'locked';
  const nodeProgress = node ? getNodeProgress(node.id) : undefined;

  if (!node) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-slate-950 items-center justify-center">
        <Text className="text-gray-900 dark:text-white text-lg">Step not found</Text>
      </View>
    );
  }

  const completedTasksCount = nodeProgress?.completedTaskIds.length || 0;
  const totalTasksCount = node.taskPack.tasks.length;
  const allTasksCompleted = completedTasksCount === totalTasksCount;

  const handleStartNode = () => {
    if (nodeState === 'available') {
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

    completeNode(node.id);
    router.back();
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
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
        {/* Step Header */}
        <View className="px-5 pt-6 pb-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
          <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-2">
            {node.title}
          </Text>
          <Text className="text-gray-600 dark:text-slate-400 text-sm mb-3">
            {node.subtitle}
          </Text>
          <Text className="text-gray-700 dark:text-slate-300 text-base leading-6">
            {node.description}
          </Text>
        </View>

        {/* Tasks */}
        <View className="px-5 pt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 dark:text-white text-lg font-semibold">
              Steps to Complete
            </Text>
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
                  className={`border rounded-xl p-4 shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
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
                          isCompleted ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </Text>
                      <Text className="text-gray-600 dark:text-slate-400 text-sm">
                        {task.description}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

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
              Complete previous steps first
            </Text>
          </View>
        )}

        {nodeState === 'available' && (
          <Pressable
            onPress={handleStartNode}
            className="bg-purple-500 rounded-xl py-3 items-center"
          >
            <Text className="text-white text-base font-semibold">Start Step</Text>
          </Pressable>
        )}

        {nodeState === 'in-progress' && !allTasksCompleted && (
          <View className="bg-purple-500/20 border border-purple-500 rounded-xl py-3 items-center">
            <Text className="text-purple-600 dark:text-purple-400 text-base font-semibold">
              Complete All Steps ({completedTasksCount}/{totalTasksCount})
            </Text>
          </View>
        )}

        {nodeState === 'in-progress' && allTasksCompleted && (
          <Pressable
            onPress={handleCompleteNode}
            className="bg-emerald-500 rounded-xl py-3 items-center"
          >
            <Text className="text-white text-base font-semibold">Mark as Complete</Text>
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
    </View>
  );
}
