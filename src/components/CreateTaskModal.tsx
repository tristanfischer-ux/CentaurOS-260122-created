/**
 * Create Task Modal
 *
 * Modal for creating new tasks with:
 * - Effort estimation in squares
 * - AI mode selection
 * - Initial staffing suggestions
 */

import { View, Text, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import {
  X,
  Target,
  Bot,
  Users,
  Clock,
  Zap,
  Plus,
  Minus,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBuildQueueStore, type AIMode, type Cadence } from '@/lib/state/build-queue-store';
import type { Function as BusinessFunction } from '@/types';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
}

const FUNCTIONS: BusinessFunction[] = ['Marketing', 'Sales', 'Engineering', 'Finance', 'Ops', 'Admin'];

export function CreateTaskModal({ visible, onClose, workspaceId }: CreateTaskModalProps) {
  const addTask = useBuildQueueStore(s => s.addTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction>('Marketing');
  const [originalSquares, setOriginalSquares] = useState(10);
  const [aiMode, setAIMode] = useState<AIMode>('assist');
  const [cadence, setCadence] = useState<Cadence>('normal');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const getAIReduction = (mode: AIMode): number => {
    switch (mode) {
      case 'none': return 0;
      case 'assist': return 0.2;
      case 'heavy': return 0.4;
      case 'autonomous': return 0.6;
      default: return 0;
    }
  };

  const aiAdjustedSquares = Math.ceil(originalSquares * (1 - getAIReduction(aiMode)));

  const handleCreate = () => {
    if (!title.trim()) return;

    addTask({
      workspaceId,
      title: title.trim(),
      description: description.trim(),
      function: selectedFunction,
      originalSquares,
      completedSquares: 0,
      aiMode,
      aiEffortReduction: getAIReduction(aiMode),
      aiThroughputBoost: aiMode === 'none' ? 1.0 : aiMode === 'assist' ? 1.2 : aiMode === 'heavy' ? 1.5 : 2.0,
      assignments: [],
      cadence,
      requiresQA: aiMode === 'heavy' || aiMode === 'autonomous',
      status: 'queued',
      urgency,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSelectedFunction('Marketing');
    setOriginalSquares(10);
    setAIMode('assist');
    setCadence('normal');
    setUrgency('medium');

    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  const getFunctionColor = (func: BusinessFunction) => {
    switch (func) {
      case 'Marketing': return '#f59e0b';
      case 'Sales': return '#ec4899';
      case 'Engineering': return '#3b82f6';
      case 'Finance': return '#10b981';
      case 'Ops': return '#8b5cf6';
      case 'Admin': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getAIModeColor = (mode: AIMode) => {
    switch (mode) {
      case 'none': return '#6b7280';
      case 'assist': return '#3b82f6';
      case 'heavy': return '#8b5cf6';
      case 'autonomous': return '#ec4899';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 bg-white dark:bg-slate-950 mt-16 rounded-t-3xl">
          {/* Header */}
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <View className="p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-medium">NEW TASK</Text>
                  <Text className="text-white text-xl font-bold">Create Task</Text>
                </View>
                <Pressable
                  onPress={handleClose}
                  className="w-9 h-9 bg-white/20 rounded-full items-center justify-center active:opacity-70"
                >
                  <X size={20} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          </LinearGradient>

          <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide">
                TASK TITLE
              </Text>
              <TextInput
                className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                placeholder="e.g., Launch Marketing Campaign"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide">
                DESCRIPTION (Optional)
              </Text>
              <TextInput
                className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base min-h-[80px]"
                placeholder="Describe the task..."
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Function Selection */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide">
                FUNCTION
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {FUNCTIONS.map(func => (
                  <Pressable
                    key={func}
                    onPress={() => setSelectedFunction(func)}
                    className={`px-4 py-2 rounded-lg border-2 ${
                      selectedFunction === func
                        ? 'border-purple-500'
                        : 'border-gray-200 dark:border-slate-800'
                    }`}
                    style={selectedFunction === func ? { backgroundColor: getFunctionColor(func) + '20' } : {}}
                  >
                    <Text
                      className={`font-semibold text-sm ${
                        selectedFunction === func
                          ? ''
                          : 'text-gray-600 dark:text-slate-400'
                      }`}
                      style={selectedFunction === func ? { color: getFunctionColor(func) } : {}}
                    >
                      {func}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Effort Estimation */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide">
                EFFORT ESTIMATION
              </Text>
              <View className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm">Base Effort</Text>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      onPress={() => setOriginalSquares(Math.max(1, originalSquares - 1))}
                      className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-full items-center justify-center"
                    >
                      <Minus size={18} color="#6b7280" />
                    </Pressable>
                    <Text className="text-gray-900 dark:text-white font-bold text-2xl w-16 text-center">
                      {originalSquares}
                    </Text>
                    <Pressable
                      onPress={() => setOriginalSquares(Math.min(100, originalSquares + 1))}
                      className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-full items-center justify-center"
                    >
                      <Plus size={18} color="#6b7280" />
                    </Pressable>
                  </View>
                </View>

                {/* Visual squares */}
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {Array.from({ length: Math.min(originalSquares, 30) }).map((_, i) => (
                    <View
                      key={i}
                      className="w-4 h-4 rounded-sm bg-gray-300 dark:bg-slate-700"
                    />
                  ))}
                  {originalSquares > 30 && (
                    <Text className="text-gray-500 text-xs ml-1">+{originalSquares - 30}</Text>
                  )}
                </View>

                <Text className="text-gray-500 dark:text-slate-400 text-xs">
                  1 square = 4 hours of focused work
                </Text>
              </View>
            </View>

            {/* AI Mode */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide">
                AI ACCELERATION
              </Text>
              <View className="flex-row gap-2">
                {(['none', 'assist', 'heavy', 'autonomous'] as AIMode[]).map(mode => (
                  <Pressable
                    key={mode}
                    onPress={() => setAIMode(mode)}
                    className={`flex-1 rounded-lg p-3 border-2 ${
                      aiMode === mode
                        ? 'border-purple-500'
                        : 'border-gray-200 dark:border-slate-800'
                    }`}
                    style={aiMode === mode ? { backgroundColor: getAIModeColor(mode) + '20' } : {}}
                  >
                    <Text
                      className={`text-center text-xs font-bold ${
                        aiMode === mode ? '' : 'text-gray-600 dark:text-slate-400'
                      }`}
                      style={aiMode === mode ? { color: getAIModeColor(mode) } : {}}
                    >
                      {mode === 'none' ? 'None' :
                       mode === 'assist' ? 'Assist' :
                       mode === 'heavy' ? 'Heavy' : 'Auto'}
                    </Text>
                    <Text className="text-gray-500 text-center text-xs mt-0.5">
                      {mode === 'none' ? '0%' :
                       mode === 'assist' ? '-20%' :
                       mode === 'heavy' ? '-40%' : '-60%'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* AI Adjusted Result */}
              {aiMode !== 'none' && (
                <View className="flex-row items-center justify-center mt-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                  <Bot size={16} color="#8b5cf6" />
                  <Text className="text-purple-700 dark:text-purple-300 text-sm font-semibold ml-2">
                    {originalSquares} → {aiAdjustedSquares} squares with AI
                  </Text>
                </View>
              )}
            </View>

            {/* Urgency */}
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide">
                URGENCY
              </Text>
              <View className="flex-row gap-2">
                {([
                  { id: 'low', label: 'Low', color: '#6b7280' },
                  { id: 'medium', label: 'Medium', color: '#3b82f6' },
                  { id: 'high', label: 'High', color: '#f59e0b' },
                  { id: 'critical', label: 'Critical', color: '#ef4444' },
                ] as const).map(u => (
                  <Pressable
                    key={u.id}
                    onPress={() => setUrgency(u.id)}
                    className={`flex-1 rounded-lg py-2 border-2 ${
                      urgency === u.id
                        ? 'border-purple-500'
                        : 'border-gray-200 dark:border-slate-800'
                    }`}
                    style={urgency === u.id ? { backgroundColor: u.color + '20' } : {}}
                  >
                    <Text
                      className={`text-center text-sm font-semibold ${
                        urgency === u.id ? '' : 'text-gray-600 dark:text-slate-400'
                      }`}
                      style={urgency === u.id ? { color: u.color } : {}}
                    >
                      {u.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Staffing Scenarios */}
            <View className="mb-6">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-wide">
                STAFFING SCENARIOS
              </Text>
              <View className="gap-2">
                {[
                  { label: 'Lean (1 person, slow)', squares: 2, days: Math.ceil(aiAdjustedSquares / 2) },
                  { label: 'Standard (2 people)', squares: 4, days: Math.ceil(aiAdjustedSquares / 4) },
                  { label: 'Crash (4 people, fast)', squares: 8, days: Math.ceil(aiAdjustedSquares / 8) },
                ].map((scenario, i) => (
                  <View
                    key={i}
                    className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 flex-row items-center justify-between"
                  >
                    <View>
                      <Text className="text-gray-900 dark:text-white font-semibold text-sm">
                        {scenario.label}
                      </Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-xs">
                        {scenario.squares} □/day
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                        {scenario.days} days
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-5 border-t border-gray-200 dark:border-slate-800">
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleClose}
                className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl py-4 items-center active:opacity-70"
              >
                <Text className="text-gray-700 dark:text-slate-300 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={!title.trim()}
                className={`flex-1 rounded-xl py-4 items-center active:opacity-70 ${
                  title.trim() ? 'bg-purple-600' : 'bg-gray-300 dark:bg-slate-700'
                }`}
              >
                <Text className={`font-bold ${title.trim() ? 'text-white' : 'text-gray-500'}`}>
                  Create Task
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
