/**
 * Tech Tree Screen
 * RPG-style progression with constellation map
 */

import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Star,
  Lock,
  CheckCircle2,
  Zap,
  Trophy,
  ArrowLeft,
  Sparkles,
} from 'lucide-react-native';
import { useTechTreeStore } from '@/lib/state/tech-tree-store';
import { TECH_TREE_NODES } from '@/lib/data/tech-tree-nodes';
import type { TechNode, NodeState } from '@/lib/types/tech-tree-types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NODE_SIZE = 80;

export default function TechTreeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedAct, setSelectedAct] = useState<1 | 2 | 3>(1);

  // Store
  const initialize = useTechTreeStore((s) => s.initialize);
  const currentLevel = useTechTreeStore((s) => s.currentLevel);
  const currentXP = useTechTreeStore((s) => s.currentXP);
  const xpToNextLevel = useTechTreeStore((s) => s.xpToNextLevel);
  const totalNodesCompleted = useTechTreeStore((s) => s.totalNodesCompleted);
  const getNodeState = useTechTreeStore((s) => s.getNodeState);
  const activeBuffs = useTechTreeStore((s) => s.activeBuffs);

  useEffect(() => {
    initialize();
  }, []);

  const actNodes = TECH_TREE_NODES.filter((node) => node.actId === selectedAct);

  const getNodeStateColor = (state: NodeState) => {
    switch (state) {
      case 'completed':
        return { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-400' };
      case 'in-progress':
        return { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-400' };
      case 'available':
        return { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-400' };
      case 'locked':
      default:
        return { bg: 'bg-gray-300 dark:bg-slate-700', border: 'border-gray-400 dark:border-slate-600', text: 'text-gray-500 dark:text-slate-400' };
    }
  };

  const getNodeStateIcon = (state: NodeState, isBoss: boolean) => {
    if (isBoss && state === 'completed') {
      return <Trophy size={32} color="#10b981" />;
    }

    switch (state) {
      case 'completed':
        return <CheckCircle2 size={32} color="#10b981" />;
      case 'in-progress':
        return <Zap size={32} color="#3b82f6" />;
      case 'available':
        return <Star size={32} color="#a855f7" />;
      case 'locked':
      default:
        return <Lock size={32} color="#6b7280" />;
    }
  };

  const handleNodePress = (node: TechNode) => {
    const state = getNodeState(node.id);
    if (state === 'locked') return;

    // Navigate to node detail screen
    router.push(`/tech-tree/${node.id}` as any);
  };

  const xpPercent = (currentXP / xpToNextLevel) * 100;

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Tech Tree',
          headerStyle: { backgroundColor: '#030712' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      {/* Header: XP & Level */}
      <View className="px-5 py-4 border-b border-gray-200 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <View className="flex-row items-center gap-2 mb-1">
              <Sparkles size={20} color="#f59e0b" />
              <Text className="text-gray-900 dark:text-white text-2xl font-bold">Level {currentLevel}</Text>
            </View>
            <Text className="text-gray-600 dark:text-slate-400 text-sm">
              {totalNodesCompleted} nodes completed
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-gray-600 dark:text-slate-400 text-xs mb-1">
              {currentXP} / {xpToNextLevel} XP
            </Text>
            <View className="w-32 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                style={{ width: `${xpPercent}%` }}
              />
            </View>
          </View>
        </View>

        {/* Active Buffs */}
        {activeBuffs.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-2">
            {activeBuffs.map((buff) => (
              <View
                key={buff.id}
                className="bg-purple-500/20 border border-purple-500 px-3 py-1 rounded-full"
              >
                <Text className="text-purple-300 text-xs font-medium">
                  ⚡ {buff.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Act Selector */}
      <View className="flex-row px-5 py-4 gap-3">
        {[1, 2, 3].map((act) => (
          <Pressable
            key={act}
            onPress={() => setSelectedAct(act as 1 | 2 | 3)}
            className={`flex-1 py-3 rounded-xl border-2 ${
              selectedAct === act
                ? 'bg-purple-500/20 border-purple-500'
                : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                selectedAct === act ? 'text-purple-400' : 'text-gray-600 dark:text-slate-400'
              }`}
            >
              ACT {act}
            </Text>
            <Text className="text-center text-xs text-gray-500 dark:text-slate-400 mt-1">
              {act === 1
                ? 'Foundations'
                : act === 2
                ? 'Scaling'
                : 'Mastery'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Constellation Map */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="px-5 py-6">
          <View className="relative" style={{ minHeight: 600 }}>
            {/* Render connection lines first (behind nodes) */}
            {actNodes.map((node) => {
              const nodeState = getNodeState(node.id);
              const nodeColors = getNodeStateColor(nodeState);

              return node.prerequisiteNodeIds.map((prereqId) => {
                const prereqNode = actNodes.find((n) => n.id === prereqId);
                if (!prereqNode) return null;

                return (
                  <View
                    key={`${prereqId}-${node.id}`}
                    className={`absolute border-t-2 ${nodeColors.border} opacity-30`}
                    style={{
                      top: prereqNode.position.y + NODE_SIZE / 2,
                      left: prereqNode.position.x + NODE_SIZE,
                      width: node.position.x - prereqNode.position.x - NODE_SIZE,
                      height: node.position.y - prereqNode.position.y,
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            node.position.y - prereqNode.position.y,
                            node.position.x - prereqNode.position.x
                          ) * (180 / Math.PI)}deg`,
                        },
                      ],
                    }}
                  />
                );
              });
            })}

            {/* Render nodes */}
            {actNodes.map((node) => {
              const nodeState = getNodeState(node.id);
              const nodeColors = getNodeStateColor(nodeState);
              const isLocked = nodeState === 'locked';

              return (
                <Pressable
                  key={node.id}
                  onPress={() => handleNodePress(node)}
                  disabled={isLocked}
                  className={`absolute`}
                  style={{
                    top: node.position.y,
                    left: node.position.x,
                    width: NODE_SIZE * 2,
                  }}
                >
                  {/* Node Circle */}
                  <View
                    className={`w-20 h-20 rounded-full border-4 ${nodeColors.border} ${nodeColors.bg} items-center justify-center mb-2 ${
                      isLocked ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    {getNodeStateIcon(nodeState, node.isBossGate)}
                  </View>

                  {/* Node Title */}
                  <Text
                    className={`text-center font-semibold text-xs ${nodeColors.text} ${
                      isLocked ? 'opacity-50' : 'opacity-100'
                    }`}
                    numberOfLines={2}
                  >
                    {node.title}
                  </Text>

                  {/* Type Badge */}
                  {node.type === 'side-quest' && (
                    <View className="absolute -top-2 -right-2 bg-purple-500 px-2 py-0.5 rounded-full">
                      <Text className="text-white text-[10px] font-bold">SQ</Text>
                    </View>
                  )}

                  {node.isBossGate && (
                    <View className="absolute -top-2 -right-2 bg-red-500 px-2 py-0.5 rounded-full">
                      <Text className="text-white text-[10px] font-bold">BOSS</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View className="px-5 pb-6">
          <Text className="text-gray-900 dark:text-white text-sm font-semibold mb-3">Legend</Text>
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-row items-center gap-2">
              <Lock size={16} color="#6b7280" />
              <Text className="text-gray-600 dark:text-slate-400 text-xs">Locked</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Star size={16} color="#a855f7" />
              <Text className="text-gray-600 dark:text-slate-400 text-xs">Available</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Zap size={16} color="#3b82f6" />
              <Text className="text-gray-600 dark:text-slate-400 text-xs">In Progress</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={16} color="#10b981" />
              <Text className="text-gray-600 dark:text-slate-400 text-xs">Completed</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Trophy size={16} color="#10b981" />
              <Text className="text-gray-600 dark:text-slate-400 text-xs">Boss Gate</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
