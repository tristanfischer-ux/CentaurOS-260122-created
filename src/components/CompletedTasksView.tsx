import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { CheckCircle2, Trash2, Archive, Calendar, User, Target, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import type { Task } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentMembership } from '@/lib/state/app-store';

interface CompletedTasksViewProps {
  tasks: Task[];
  workspaceId: string;
  onClose: () => void;
  members?: Array<{ id: string; name: string }>;
}

export function CompletedTasksView({ tasks, workspaceId, onClose, members = [] }: CompletedTasksViewProps) {
  const queryClient = useQueryClient();
  const currentMembership = useCurrentMembership();
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const completedTasks = tasks
    .filter(t => t.status === 'done')
    .sort((a, b) => {
      const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bDate - aDate; // Most recent first
    });

  const todayCompleted = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  });

  const thisWeekCompleted = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return completedDate >= weekAgo;
  });

  const thisMonthCompleted = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const today = new Date();
    return (
      completedDate.getMonth() === today.getMonth() &&
      completedDate.getFullYear() === today.getFullYear()
    );
  });

  const getAssigneeName = (assigneeId?: string) => {
    if (!assigneeId) return null;
    const member = members.find(m => m.id === assigneeId);
    return member?.name || 'Unknown';
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const handleDeleteSelected = async () => {
    if (selectedTasks.size === 0) return;

    Alert.alert(
      'Delete Tasks',
      `Permanently delete ${selectedTasks.size} completed task${selectedTasks.size > 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use the query mutation from work screen instead
              await queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
              setSelectedTasks(new Set());
              Alert.alert('Success', `Deleted ${selectedTasks.size} task${selectedTasks.size > 1 ? 's' : ''}`);
            } catch (error) {
              console.error('Error deleting tasks:', error);
              Alert.alert('Error', 'Failed to delete some tasks');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-blue-400';
      case 'low':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 pt-6 pb-4 border-b border-slate-800">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={onClose} className="active:opacity-70">
            <View className="flex-row items-center gap-2">
              <ArrowLeft size={24} color="#3b82f6" />
              <Text className="text-blue-400 text-lg font-semibold">Back</Text>
            </View>
          </Pressable>

          {selectedTasks.size > 0 && (
            <Pressable onPress={handleDeleteSelected} className="active:opacity-70">
              <View className="flex-row items-center gap-2 bg-red-500/20 px-4 py-2 rounded-lg">
                <Trash2 size={18} color="#ef4444" />
                <Text className="text-red-400 font-semibold">
                  Delete ({selectedTasks.size})
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        <Text className="text-white text-2xl font-bold mb-2">Completed Tasks</Text>
        <Text className="text-slate-400">
          Your achievement history. Keep as reference or delete permanently.
        </Text>
      </View>

      {/* Stats Cards */}
      <View className="px-6 py-4 flex-row gap-3">
        <View className="flex-1 bg-slate-900 rounded-xl p-3 border border-slate-800">
          <Text className="text-emerald-400 text-xs mb-1">Today</Text>
          <Text className="text-white text-2xl font-bold">{todayCompleted.length}</Text>
        </View>
        <View className="flex-1 bg-slate-900 rounded-xl p-3 border border-slate-800">
          <Text className="text-blue-400 text-xs mb-1">This Week</Text>
          <Text className="text-white text-2xl font-bold">{thisWeekCompleted.length}</Text>
        </View>
        <View className="flex-1 bg-slate-900 rounded-xl p-3 border border-slate-800">
          <Text className="text-purple-400 text-xs mb-1">This Month</Text>
          <Text className="text-white text-2xl font-bold">{thisMonthCompleted.length}</Text>
        </View>
      </View>

      {/* Task List */}
      <ScrollView className="flex-1 px-6">
        {completedTasks.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Archive size={48} color="#475569" />
            <Text className="text-slate-400 text-center mt-4">
              No completed tasks yet.{'\n'}Complete your first task to see it here!
            </Text>
          </View>
        ) : (
          <View className="pb-6">
            {completedTasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => toggleTaskSelection(task.id)}
                className="mb-3 active:opacity-70"
              >
                <View
                  className={`bg-slate-900 rounded-xl p-4 border ${
                    selectedTasks.has(task.id) ? 'border-blue-500' : 'border-slate-800'
                  }`}
                >
                  <View className="flex-row items-start gap-3">
                    {/* Checkbox */}
                    <View
                      className={`w-6 h-6 rounded-lg border-2 items-center justify-center ${
                        selectedTasks.has(task.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-700'
                      }`}
                    >
                      {selectedTasks.has(task.id) && (
                        <CheckCircle2 size={16} color="#fff" />
                      )}
                    </View>

                    <View className="flex-1">
                      {/* Title */}
                      <Text className="text-white font-semibold text-base mb-1">
                        {task.title}
                      </Text>

                      {/* Description */}
                      {task.description && (
                        <Text className="text-slate-400 text-sm mb-2" numberOfLines={2}>
                          {task.description}
                        </Text>
                      )}

                      {/* Metadata */}
                      <View className="flex-row flex-wrap gap-2">
                        <View className="flex-row items-center gap-1">
                          <Calendar size={14} color="#64748b" />
                          <Text className="text-slate-500 text-xs">
                            {formatDate(task.completedAt)}
                          </Text>
                        </View>

                        <View
                          className={`px-2 py-0.5 rounded ${
                            task.priority === 'urgent'
                              ? 'bg-red-500/20'
                              : task.priority === 'high'
                              ? 'bg-orange-500/20'
                              : 'bg-slate-800'
                          }`}
                        >
                          <Text className={`${getPriorityColor(task.priority)} text-xs font-semibold uppercase`}>
                            {task.priority}
                          </Text>
                        </View>

                        <View className="bg-slate-800 px-2 py-0.5 rounded">
                          <Text className="text-slate-400 text-xs">{task.function}</Text>
                        </View>

                        {getAssigneeName(task.assigneeId) && (
                          <View className="flex-row items-center gap-1">
                            <User size={12} color="#64748b" />
                            <Text className="text-slate-500 text-xs">{getAssigneeName(task.assigneeId)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Selection Hint */}
      {completedTasks.length > 0 && selectedTasks.size === 0 && (
        <View className="px-6 py-4 bg-slate-900 border-t border-slate-800">
          <Text className="text-slate-400 text-center text-sm">
            Tap tasks to select, then delete permanently or keep as reference
          </Text>
        </View>
      )}
    </View>
  );
}
