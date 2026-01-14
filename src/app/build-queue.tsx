/**
 * Build Queue Screen
 *
 * Homeworld-style task queue with:
 * - Resource pot at top
 * - Draggable task queue
 * - AI acceleration settings
 * - Timeline predictions
 */

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Clock,
  Zap,
  Bot,
  Users,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  CheckCircle2,
  ListOrdered,
  LayoutGrid,
} from 'lucide-react-native';
import { useCurrentWorkspace } from '@/lib/state/app-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useBuildQueueStore, type BuildQueueTask } from '@/lib/state/build-queue-store';
import { ResourcePot } from '@/components/ResourcePot';
import { BuildQueueCard } from '@/components/BuildQueueCard';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { CreateTaskModal } from '@/components/CreateTaskModal';

type FilterStatus = 'all' | 'in_progress' | 'queued' | 'completed';

export default function BuildQueueScreen() {
  const insets = useSafeAreaInsets();
  const currentWorkspace = useCurrentWorkspace();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getTasksByWorkspace = useBuildQueueStore(s => s.getTasksByWorkspace);
  const people = useBuildQueueStore(s => s.people);
  const moveTaskUp = useBuildQueueStore(s => s.moveTaskUp);
  const moveTaskDown = useBuildQueueStore(s => s.moveTaskDown);
  const seedDemoData = useBuildQueueStore(s => s.seedDemoData);

  // Initialize demo data
  useEffect(() => {
    console.log('[BuildQueue] Screen mounted, workspace:', currentWorkspace?.id);
    if (currentWorkspace) {
      const tasks = getTasksByWorkspace(currentWorkspace.id);
      console.log('[BuildQueue] Current tasks:', tasks.length);
      if (tasks.length === 0) {
        console.log('[BuildQueue] Seeding demo data...');
        seedDemoData(currentWorkspace.id);
      }
    }
  }, [currentWorkspace]);

  if (!currentWorkspace) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <Text className="text-gray-500">No workspace selected</Text>
      </View>
    );
  }

  const allTasks = getTasksByWorkspace(currentWorkspace.id);

  const filteredTasks = allTasks.filter(task => {
    if (filterStatus === 'all') return task.status !== 'completed';
    return task.status === filterStatus;
  });

  // Calculate totals
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
  const queuedTasks = allTasks.filter(t => t.status === 'queued');
  const completedTasks = allTasks.filter(t => t.status === 'completed');

  const totalSquaresInProgress = inProgressTasks.reduce(
    (sum, t) => sum + (t.aiAdjustedSquares - t.completedSquares),
    0
  );
  const totalSquaresQueued = queuedTasks.reduce(
    (sum, t) => sum + t.aiAdjustedSquares,
    0
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 12 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">BUILD QUEUE</Text>
            <Text className="text-white text-xl font-bold">Task Pipeline</Text>
          </View>
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center active:opacity-70"
          >
            <Plus size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-white/10 rounded-lg p-2">
            <Text className="text-white/70 text-xs">In Progress</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white font-bold text-lg">{inProgressTasks.length}</Text>
              <Text className="text-white/70 text-xs ml-1">tasks</Text>
            </View>
          </View>
          <View className="flex-1 bg-white/10 rounded-lg p-2">
            <Text className="text-white/70 text-xs">Queued</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white font-bold text-lg">{queuedTasks.length}</Text>
              <Text className="text-white/70 text-xs ml-1">tasks</Text>
            </View>
          </View>
          <View className="flex-1 bg-white/10 rounded-lg p-2">
            <Text className="text-white/70 text-xs">Total Squares</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white font-bold text-lg">
                {totalSquaresInProgress + totalSquaresQueued}
              </Text>
              <Text className="text-white/70 text-xs ml-1">□</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4">
          {/* Resource Pot */}
          <ResourcePot workspaceId={currentWorkspace.id} />

          {/* Filter Tabs */}
          <View className="flex-row gap-2 mt-4 mb-4">
            {([
              { id: 'all', label: 'Active', count: inProgressTasks.length + queuedTasks.length },
              { id: 'in_progress', label: 'In Progress', count: inProgressTasks.length },
              { id: 'queued', label: 'Queued', count: queuedTasks.length },
              { id: 'completed', label: 'Done', count: completedTasks.length },
            ] as const).map(filter => (
              <Pressable
                key={filter.id}
                onPress={() => setFilterStatus(filter.id)}
                className={`flex-1 rounded-xl py-2 px-2 ${
                  filterStatus === filter.id
                    ? 'bg-purple-500'
                    : 'bg-white dark:bg-slate-900'
                }`}
              >
                <Text
                  className={`text-center text-xs font-semibold ${
                    filterStatus === filter.id
                      ? 'text-white'
                      : 'text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {filter.label}
                </Text>
                <Text
                  className={`text-center text-lg font-bold ${
                    filterStatus === filter.id
                      ? 'text-white'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {filter.count}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Section: In Progress */}
          {(filterStatus === 'all' || filterStatus === 'in_progress') && inProgressTasks.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Play size={16} color="#10b981" />
                <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold ml-1.5 tracking-wide">
                  IN PROGRESS
                </Text>
                <View className="flex-1 h-px bg-emerald-200 dark:bg-emerald-800 ml-3" />
              </View>

              <View className="gap-3">
                {inProgressTasks.map((task, index) => (
                  <View key={task.id}>
                    <BuildQueueCard
                      task={task}
                      people={people}
                      onPress={() => setSelectedTaskId(task.id)}
                      isActive={selectedTaskId === task.id}
                    />

                    {/* Queue Position Controls */}
                    {filteredTasks.length > 1 && (
                      <View className="flex-row justify-end gap-2 mt-1">
                        <Pressable
                          onPress={() => moveTaskUp(task.id)}
                          disabled={index === 0}
                          className={`flex-row items-center px-2 py-1 rounded ${
                            index === 0 ? 'opacity-30' : 'bg-gray-100 dark:bg-slate-800'
                          }`}
                        >
                          <ArrowUp size={14} color="#6b7280" />
                          <Text className="text-gray-500 text-xs ml-1">Up</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => moveTaskDown(task.id)}
                          disabled={index === inProgressTasks.length - 1}
                          className={`flex-row items-center px-2 py-1 rounded ${
                            index === inProgressTasks.length - 1 ? 'opacity-30' : 'bg-gray-100 dark:bg-slate-800'
                          }`}
                        >
                          <ArrowDown size={14} color="#6b7280" />
                          <Text className="text-gray-500 text-xs ml-1">Down</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Section: Queued */}
          {(filterStatus === 'all' || filterStatus === 'queued') && queuedTasks.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Clock size={16} color="#f59e0b" />
                <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold ml-1.5 tracking-wide">
                  QUEUED
                </Text>
                <View className="flex-1 h-px bg-amber-200 dark:bg-amber-800 ml-3" />
              </View>

              <View className="gap-3">
                {queuedTasks.map((task, index) => (
                  <View key={task.id}>
                    <BuildQueueCard
                      task={task}
                      people={people}
                      onPress={() => setSelectedTaskId(task.id)}
                      isActive={selectedTaskId === task.id}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Section: Completed */}
          {filterStatus === 'completed' && completedTasks.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <CheckCircle2 size={16} color="#3b82f6" />
                <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold ml-1.5 tracking-wide">
                  COMPLETED
                </Text>
                <View className="flex-1 h-px bg-blue-200 dark:bg-blue-800 ml-3" />
              </View>

              <View className="gap-3">
                {completedTasks.map(task => (
                  <BuildQueueCard
                    key={task.id}
                    task={task}
                    people={people}
                    onPress={() => setSelectedTaskId(task.id)}
                    isActive={selectedTaskId === task.id}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <View className="items-center py-12">
              <View className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full items-center justify-center mb-4">
                <ListOrdered size={32} color="#9ca3af" />
              </View>
              <Text className="text-gray-900 dark:text-white font-bold text-lg mb-1">
                {filterStatus === 'completed' ? 'No completed tasks' : 'No tasks in queue'}
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-sm text-center">
                {filterStatus === 'completed'
                  ? 'Completed tasks will appear here'
                  : 'Add tasks to start building your pipeline'}
              </Text>
              {filterStatus !== 'completed' && (
                <Pressable
                  onPress={() => setShowCreateModal(true)}
                  className="bg-purple-500 rounded-xl px-6 py-3 mt-4 active:opacity-70"
                >
                  <Text className="text-white font-bold">Create Task</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Info Banner */}
          <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-4">
            <View className="flex-row items-start">
              <Bot size={16} color="#3b82f6" style={{ marginTop: 2 }} />
              <Text className="text-blue-900 dark:text-blue-100 text-xs ml-2 flex-1">
                <Text className="font-bold">Pro tip: </Text>
                Tap any task to adjust AI acceleration, staffing, and cadence. Use "Crash" mode for urgent deadlines.
              </Text>
            </View>
          </View>

          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        workspaceId={currentWorkspace.id}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        workspaceId={currentWorkspace.id}
      />
    </View>
  );
}
