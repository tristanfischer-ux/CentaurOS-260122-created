/**
 * Getting Started Checklist Screen
 * Simple linear checklist for onboarding
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  X,
  RotateCcw,
} from 'lucide-react-native';
import { useTechTreeStore } from '@/lib/state/tech-tree-store';
import { TECH_TREE_NODES } from '@/lib/data/tech-tree-nodes';
import type { TechNode, NodeState } from '@/lib/types/tech-tree-types';

export default function GettingStartedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Store
  const initialize = useTechTreeStore((s) => s.initialize);
  const totalNodesCompleted = useTechTreeStore((s) => s.totalNodesCompleted);
  const getNodeState = useTechTreeStore((s) => s.getNodeState);
  const resetProgress = useTechTreeStore((s) => s.resetProgress);

  useEffect(() => {
    console.log('[GettingStarted] Screen mounted, calling initialize');
    initialize();
  }, []);

  const handleReset = () => {
    console.log('[GettingStarted] Resetting progress');
    resetProgress();
    setShowResetConfirm(false);
  };

  const handleNodePress = (node: TechNode) => {
    const state = getNodeState(node.id);
    if (state === 'locked') return;

    // Navigate to node detail screen
    router.push(`/tech-tree/${node.id}` as any);
  };

  const handleDismiss = () => {
    router.back();
  };

  const totalSteps = TECH_TREE_NODES.length;
  const completionPercent = (totalNodesCompleted / totalSteps) * 100;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Getting Started',
          headerStyle: { backgroundColor: '#030712' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
          ),
          headerRight: () => (
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => setShowResetConfirm(true)}>
                <RotateCcw size={20} color="#fff" />
              </Pressable>
              <Pressable onPress={handleDismiss}>
                <X size={24} color="#fff" />
              </Pressable>
            </View>
          ),
        }}
      />

      {/* Progress Header */}
      <View className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-gray-900 dark:text-white text-2xl font-bold">
              {totalNodesCompleted} of {totalSteps} complete
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mt-1">
              Learn the basics of managing your business
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="w-full h-2.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <View
            className="h-full bg-purple-500"
            style={{ width: `${completionPercent}%` }}
          />
        </View>
      </View>

      {/* Checklist */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="px-5 py-6 gap-3">
          {TECH_TREE_NODES.map((node, index) => {
            const nodeState = getNodeState(node.id);
            const isCompleted = nodeState === 'completed';
            const isAvailable = nodeState === 'available' || nodeState === 'in-progress';
            const isLocked = nodeState === 'locked';

            // Debug logging
            if (index === 0) {
              console.log('[GettingStarted] First node state:', { nodeId: node.id, nodeState, isAvailable, isLocked });
            }

            return (
              <Pressable
                key={node.id}
                onPress={() => handleNodePress(node)}
                disabled={isLocked}
                className={`border rounded-xl p-4 shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : isAvailable
                    ? 'bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-800'
                    : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-50'
                }`}
              >
                <View className="flex-row items-start gap-3">
                  {/* Step Number / Checkmark */}
                  <View className="items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 dark:border-slate-600 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 size={28} color="#10b981" />
                    ) : (
                      <Text className="text-gray-600 dark:text-slate-400 text-sm font-bold">
                        {index + 1}
                      </Text>
                    )}
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <Text
                      className={`text-base font-semibold mb-1 ${
                        isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isAvailable
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-slate-500'
                      }`}
                    >
                      {node.title}
                    </Text>
                    <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                      {node.subtitle}
                    </Text>

                    {/* Status Badge */}
                    {isCompleted && (
                      <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded self-start">
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          ✓ Complete
                        </Text>
                      </View>
                    )}
                    {isAvailable && !isCompleted && (
                      <View className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded self-start">
                        <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                          Tap to start →
                        </Text>
                      </View>
                    )}
                    {isLocked && (
                      <View className="bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded self-start">
                        <Text className="text-gray-500 dark:text-slate-500 text-xs font-medium">
                          Complete previous step first
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Completion Message */}
        {totalNodesCompleted === totalSteps && (
          <View className="px-5 pb-6">
            <View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <Text className="text-purple-900 dark:text-purple-100 text-xl font-bold mb-2 text-center">
                Congratulations! 🎉
              </Text>
              <Text className="text-purple-700 dark:text-purple-300 text-sm text-center mb-4">
                You've completed the getting started guide. You're ready to build your business!
              </Text>
              <Pressable
                onPress={handleDismiss}
                className="bg-purple-500 rounded-xl py-3 items-center"
              >
                <Text className="text-white text-base font-semibold">
                  Close Checklist
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <Pressable
          className="absolute inset-0 bg-black/70 items-center justify-center"
          onPress={() => setShowResetConfirm(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 mx-5 w-80 max-w-full"
          >
            <Text className="text-gray-900 dark:text-white text-xl font-bold mb-3">
              Reset Progress?
            </Text>
            <Text className="text-gray-600 dark:text-slate-400 text-sm mb-6">
              This will reset all your progress in the Getting Started checklist. This action cannot be undone.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowResetConfirm(false)}
                className="flex-1 bg-gray-200 dark:bg-slate-800 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-900 dark:text-white text-base font-semibold">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleReset}
                className="flex-1 bg-red-500 rounded-xl py-3 items-center"
              >
                <Text className="text-white text-base font-semibold">
                  Reset
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}
