/**
 * Task Detail Modal
 *
 * Full task view with:
 * - Effort estimation (original vs AI-adjusted)
 * - AI mode settings
 * - Person assignment (drag-drop style)
 * - Timeline prediction
 * - Quality/QA settings
 */

import { View, Text, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Users,
  Zap,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Target,
  Plus,
  Minus,
  Shield,
  TrendingUp,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useBuildQueueStore,
  type BuildQueueTask,
  type PersonCapacity,
  type AIMode,
  type Cadence,
} from '@/lib/state/build-queue-store';

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  taskId: string | null;
  workspaceId: string;
}

export function TaskDetailModal({ visible, onClose, taskId, workspaceId }: TaskDetailModalProps) {
  const getTaskById = useBuildQueueStore(s => s.getTaskById);
  const people = useBuildQueueStore(s => s.people);
  const updateTask = useBuildQueueStore(s => s.updateTask);
  const assignPerson = useBuildQueueStore(s => s.assignPerson);
  const unassignPerson = useBuildQueueStore(s => s.unassignPerson);
  const updateAssignment = useBuildQueueStore(s => s.updateAssignment);
  const predictEndDate = useBuildQueueStore(s => s.predictEndDate);
  const getDailyBurnRate = useBuildQueueStore(s => s.getDailyBurnRate);

  const task = taskId ? getTaskById(taskId) : null;

  const [selectedAIMode, setSelectedAIMode] = useState<AIMode>('none');
  const [selectedCadence, setSelectedCadence] = useState<Cadence>('normal');
  const [selectedQAReviewer, setSelectedQAReviewer] = useState<string | undefined>();

  useEffect(() => {
    if (task) {
      setSelectedAIMode(task.aiMode);
      setSelectedCadence(task.cadence);
      setSelectedQAReviewer(task.qaReviewerId);
    }
  }, [task]);

  if (!task) return null;

  const assignedPeople = task.assignments.map(a =>
    people.find(p => p.id === a.personId)
  ).filter(Boolean) as PersonCapacity[];

  const unassignedPeople = people.filter(p =>
    !task.assignments.some(a => a.personId === p.id)
  );

  const dailyBurnRate = getDailyBurnRate(task);
  const remainingSquares = task.aiAdjustedSquares - task.completedSquares;
  const daysRemaining = dailyBurnRate > 0 ? Math.ceil(remainingSquares / dailyBurnRate) : null;
  const predictedEnd = daysRemaining ? predictEndDate(task) : null;

  const seniorPeople = people.filter(p =>
    p.role === 'Founder' || p.role === 'FractionalExec'
  );

  const handleAIModeChange = (mode: AIMode) => {
    setSelectedAIMode(mode);
    updateTask(task.id, { aiMode: mode });
  };

  const handleCadenceChange = (cadence: Cadence) => {
    setSelectedCadence(cadence);
    updateTask(task.id, { cadence });
  };

  const handleQAReviewerChange = (personId: string | undefined) => {
    setSelectedQAReviewer(personId);
    updateTask(task.id, { qaReviewerId: personId });
  };

  const handleAssignPerson = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (person) {
      assignPerson(task.id, personId, person.baseSquaresPerDay);
    }
  };

  const handleUnassignPerson = (personId: string) => {
    unassignPerson(task.id, personId);
  };

  const handleUpdateSquares = (personId: string, delta: number) => {
    const assignment = task.assignments.find(a => a.personId === personId);
    if (assignment) {
      const newSquares = Math.max(0.5, Math.min(4, assignment.squaresPerDay + delta));
      updateAssignment(task.id, personId, newSquares);
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Founder': return '#8b5cf6';
      case 'FractionalExec': return '#3b82f6';
      case 'Apprentice': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 bg-white dark:bg-slate-950 mt-12 rounded-t-3xl">
          {/* Header */}
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <View className="p-5">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-white/70 text-xs font-medium mb-1">
                    {task.function.toUpperCase()} TASK
                  </Text>
                  <Text className="text-white text-xl font-bold" numberOfLines={2}>
                    {task.title}
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  className="w-9 h-9 bg-white/20 rounded-full items-center justify-center active:opacity-70"
                >
                  <X size={20} color="#ffffff" />
                </Pressable>
              </View>

              {/* Quick Stats */}
              <View className="flex-row gap-3 mt-4">
                <View className="flex-1 bg-white/10 rounded-lg p-2">
                  <Text className="text-white/70 text-xs">Effort</Text>
                  <Text className="text-white font-bold">
                    {task.aiAdjustedSquares} □
                  </Text>
                </View>
                <View className="flex-1 bg-white/10 rounded-lg p-2">
                  <Text className="text-white/70 text-xs">Progress</Text>
                  <Text className="text-white font-bold">
                    {Math.round((task.completedSquares / task.aiAdjustedSquares) * 100)}%
                  </Text>
                </View>
                <View className="flex-1 bg-white/10 rounded-lg p-2">
                  <Text className="text-white/70 text-xs">ETA</Text>
                  <Text className="text-white font-bold">
                    {daysRemaining !== null ? `${daysRemaining}d` : '—'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {/* AI Mode Selection */}
            <View className="mb-6">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-3 tracking-wide">
                AI ACCELERATION
              </Text>

              <View className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
                {/* Original vs Adjusted */}
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-gray-500 dark:text-slate-400 text-xs">Original Effort</Text>
                    <Text className="text-gray-400 dark:text-slate-500 font-bold text-lg line-through">
                      {task.originalSquares} squares
                    </Text>
                  </View>
                  <Bot size={24} color={getAIModeColor(selectedAIMode)} />
                  <View className="items-end">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs">AI-Adjusted</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg">
                      {task.aiAdjustedSquares} squares
                    </Text>
                  </View>
                </View>

                {/* Mode Selection */}
                <View className="flex-row gap-2">
                  {(['none', 'assist', 'heavy', 'autonomous'] as AIMode[]).map(mode => (
                    <Pressable
                      key={mode}
                      onPress={() => handleAIModeChange(mode)}
                      className={`flex-1 rounded-lg p-3 border-2 ${
                        selectedAIMode === mode
                          ? 'border-purple-500'
                          : 'border-transparent bg-gray-100 dark:bg-slate-800'
                      }`}
                      style={selectedAIMode === mode ? { backgroundColor: getAIModeColor(mode) + '20' } : {}}
                    >
                      <Text
                        className={`text-center text-xs font-bold ${
                          selectedAIMode === mode
                            ? ''
                            : 'text-gray-600 dark:text-slate-400'
                        }`}
                        style={selectedAIMode === mode ? { color: getAIModeColor(mode) } : {}}
                      >
                        {mode === 'none' ? 'None' :
                         mode === 'assist' ? 'Assist' :
                         mode === 'heavy' ? 'Heavy' : 'Auto'}
                      </Text>
                      <Text className="text-gray-500 dark:text-slate-400 text-center text-xs mt-0.5">
                        {mode === 'none' ? '0%' :
                         mode === 'assist' ? '-20%' :
                         mode === 'heavy' ? '-40%' : '-60%'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* AI Warning */}
                {selectedAIMode === 'autonomous' && !selectedQAReviewer && (
                  <View className="flex-row items-center mt-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-2">
                    <AlertTriangle size={16} color="#f59e0b" />
                    <Text className="text-amber-700 dark:text-amber-300 text-xs ml-2 flex-1">
                      Autonomous mode requires QA review for quality assurance
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Staffing / Assignments */}
            <View className="mb-6">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-3 tracking-wide">
                STAFFING ({dailyBurnRate.toFixed(1)} □/day burn rate)
              </Text>

              {/* Assigned People */}
              {assignedPeople.length > 0 && (
                <View className="gap-2 mb-3">
                  {task.assignments.map(assignment => {
                    const person = people.find(p => p.id === assignment.personId);
                    if (!person) return null;

                    return (
                      <View
                        key={person.id}
                        className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3 flex-row items-center"
                      >
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{ backgroundColor: getRoleColor(person.role) }}
                        >
                          <Text className="text-white font-bold">{person.name.charAt(0)}</Text>
                        </View>
                        <View className="flex-1 ml-3">
                          <Text className="text-gray-900 dark:text-white font-semibold">
                            {person.name}
                          </Text>
                          <Text className="text-gray-500 dark:text-slate-400 text-xs">
                            {person.role} • {person.function}
                          </Text>
                        </View>

                        {/* Squares per day adjuster */}
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => handleUpdateSquares(person.id, -0.5)}
                            className="w-8 h-8 bg-gray-200 dark:bg-slate-800 rounded-full items-center justify-center"
                          >
                            <Minus size={16} color="#6b7280" />
                          </Pressable>
                          <Text className="text-gray-900 dark:text-white font-bold text-lg w-10 text-center">
                            {assignment.squaresPerDay}□
                          </Text>
                          <Pressable
                            onPress={() => handleUpdateSquares(person.id, 0.5)}
                            className="w-8 h-8 bg-gray-200 dark:bg-slate-800 rounded-full items-center justify-center"
                          >
                            <Plus size={16} color="#6b7280" />
                          </Pressable>
                        </View>

                        {/* Remove */}
                        <Pressable
                          onPress={() => handleUnassignPerson(person.id)}
                          className="ml-2"
                        >
                          <X size={20} color="#ef4444" />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Available to Assign */}
              {unassignedPeople.length > 0 && (
                <View>
                  <Text className="text-gray-400 dark:text-slate-500 text-xs mb-2">
                    Available to assign:
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {unassignedPeople.map(person => (
                      <Pressable
                        key={person.id}
                        onPress={() => handleAssignPerson(person.id)}
                        className="flex-row items-center bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-2 active:opacity-70"
                      >
                        <View
                          className="w-6 h-6 rounded-full items-center justify-center mr-2"
                          style={{ backgroundColor: getRoleColor(person.role) }}
                        >
                          <Text className="text-white text-xs font-bold">{person.name.charAt(0)}</Text>
                        </View>
                        <Text className="text-gray-700 dark:text-slate-300 text-sm font-semibold">
                          {person.name}
                        </Text>
                        <Plus size={14} color="#10b981" style={{ marginLeft: 8 }} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Cadence Selection */}
            <View className="mb-6">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-3 tracking-wide">
                CADENCE
              </Text>

              <View className="flex-row gap-2">
                {([
                  { id: 'slow', label: 'Slow', desc: '0.5x', color: '#6b7280' },
                  { id: 'normal', label: 'Normal', desc: '1x', color: '#3b82f6' },
                  { id: 'fast', label: 'Fast', desc: '1.5x', color: '#f59e0b' },
                  { id: 'crash', label: 'Crash', desc: '2x', color: '#ef4444' },
                ] as const).map(cadence => (
                  <Pressable
                    key={cadence.id}
                    onPress={() => handleCadenceChange(cadence.id)}
                    className={`flex-1 rounded-xl p-3 border-2 ${
                      selectedCadence === cadence.id
                        ? 'border-purple-500'
                        : 'border-gray-200 dark:border-slate-800'
                    }`}
                    style={selectedCadence === cadence.id ? { backgroundColor: cadence.color + '20' } : {}}
                  >
                    <Text
                      className={`text-center font-bold text-sm ${
                        selectedCadence === cadence.id
                          ? ''
                          : 'text-gray-600 dark:text-slate-400'
                      }`}
                      style={selectedCadence === cadence.id ? { color: cadence.color } : {}}
                    >
                      {cadence.label}
                    </Text>
                    <Text className="text-gray-500 text-center text-xs">{cadence.desc}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Quality / QA */}
            <View className="mb-6">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-3 tracking-wide">
                QUALITY ASSURANCE
              </Text>

              <View className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
                {/* Confidence & Risk */}
                <View className="flex-row gap-4 mb-4">
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Confidence</Text>
                    <View className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <View
                        className="h-full"
                        style={{
                          width: `${task.qualityConfidence}%`,
                          backgroundColor: task.qualityConfidence > 70 ? '#10b981' :
                                          task.qualityConfidence > 50 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </View>
                    <Text className="text-gray-900 dark:text-white text-xs font-semibold mt-1">
                      {task.qualityConfidence}%
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Rework Risk</Text>
                    <View className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <View
                        className="h-full"
                        style={{
                          width: `${task.reworkRisk}%`,
                          backgroundColor: task.reworkRisk < 20 ? '#10b981' :
                                          task.reworkRisk < 35 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </View>
                    <Text className="text-gray-900 dark:text-white text-xs font-semibold mt-1">
                      {task.reworkRisk}%
                    </Text>
                  </View>
                </View>

                {/* QA Reviewer Selection */}
                <Text className="text-gray-500 dark:text-slate-400 text-xs mb-2">
                  QA Reviewer (Exec/Founder):
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <Pressable
                    onPress={() => handleQAReviewerChange(undefined)}
                    className={`px-3 py-2 rounded-lg ${
                      !selectedQAReviewer
                        ? 'bg-gray-300 dark:bg-slate-700'
                        : 'bg-gray-100 dark:bg-slate-800'
                    }`}
                  >
                    <Text className={`text-sm ${!selectedQAReviewer ? 'font-bold' : ''} text-gray-700 dark:text-slate-300`}>
                      None
                    </Text>
                  </Pressable>
                  {seniorPeople.map(person => (
                    <Pressable
                      key={person.id}
                      onPress={() => handleQAReviewerChange(person.id)}
                      className={`flex-row items-center px-3 py-2 rounded-lg ${
                        selectedQAReviewer === person.id
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : 'bg-gray-100 dark:bg-slate-800'
                      }`}
                    >
                      <Shield size={14} color={selectedQAReviewer === person.id ? '#8b5cf6' : '#6b7280'} />
                      <Text
                        className={`text-sm ml-1.5 ${
                          selectedQAReviewer === person.id
                            ? 'text-purple-700 dark:text-purple-300 font-bold'
                            : 'text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        {person.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Timeline Prediction */}
            <View className="mb-6">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-3 tracking-wide">
                TIMELINE PREDICTION
              </Text>

              <View className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-500 dark:text-slate-400 text-xs">Remaining</Text>
                    <Text className="text-gray-900 dark:text-white font-bold text-2xl">
                      {remainingSquares} squares
                    </Text>
                  </View>
                  <View className="items-center">
                    <TrendingUp size={24} color="#8b5cf6" />
                    <Text className="text-gray-500 dark:text-slate-400 text-xs mt-1">
                      {dailyBurnRate.toFixed(1)} □/day
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs">Predicted</Text>
                    <Text className="text-purple-700 dark:text-purple-300 font-bold text-2xl">
                      {daysRemaining !== null ? `${daysRemaining}d` : '—'}
                    </Text>
                  </View>
                </View>

                {predictedEnd && (
                  <View className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                    <Text className="text-gray-600 dark:text-slate-400 text-sm">
                      Estimated completion:{' '}
                      <Text className="text-purple-700 dark:text-purple-300 font-bold">
                        {new Date(predictedEnd).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-5 border-t border-gray-200 dark:border-slate-800">
            <Pressable
              onPress={onClose}
              className="bg-purple-600 rounded-xl py-4 items-center active:opacity-70"
            >
              <Text className="text-white font-bold text-base">Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
