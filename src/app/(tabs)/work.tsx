import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { Briefcase, Plus, Filter, CheckCircle2, Clock, AlertCircle, Circle, X } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useTasks, useUpdateTask, useRequestReview } from '@/lib/hooks/queries';
import type { TaskStatus, TaskPriority, Function as TaskFunction } from '@/types';

export default function WorkScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  const { data: tasks, isLoading } = useTasks(currentWorkspace?.id ?? null);
  const updateTaskMutation = useUpdateTask();
  const requestReviewMutation = useRequestReview();

  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const filteredTasks = tasks?.filter((task) => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  }) || [];

  const statuses: Array<{ value: TaskStatus | 'all'; label: string; count: number }> = [
    { value: 'all', label: 'All', count: tasks?.length || 0 },
    { value: 'todo', label: 'To Do', count: tasks?.filter(t => t.status === 'todo').length || 0 },
    { value: 'in_progress', label: 'In Progress', count: tasks?.filter(t => t.status === 'in_progress').length || 0 },
    { value: 'in_review', label: 'In Review', count: tasks?.filter(t => t.status === 'in_review').length || 0 },
    { value: 'done', label: 'Done', count: tasks?.filter(t => t.status === 'done').length || 0 },
  ];

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!selectedTask || !currentWorkspace) return;

    try {
      await updateTaskMutation.mutateAsync({
        taskId: selectedTask.id,
        workspaceId: currentWorkspace.id,
        updates: { status: newStatus },
      });
      setShowStatusModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleRequestReview = async (taskId: string) => {
    if (!currentWorkspace) return;

    try {
      await requestReviewMutation.mutateAsync({
        taskId,
        workspaceId: currentWorkspace.id,
      });
    } catch (error) {
      console.error('Failed to request review:', error);
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 size={18} color="#10b981" />;
      case 'in_progress':
        return <Clock size={18} color="#3b82f6" />;
      case 'in_review':
        return <AlertCircle size={18} color="#eab308" />;
      default:
        return <Circle size={18} color="#64748b" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header with Filters */}
      <View className="p-6 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white text-2xl font-bold">Work Hub</Text>
            <Text className="text-slate-400 text-sm mt-1">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Pressable className="bg-blue-500 rounded-xl px-4 py-2 active:opacity-80">
            <Plus size={20} color="white" />
          </Pressable>
        </View>

        {/* Status Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View className="flex-row gap-2">
            {statuses.map((status) => (
              <Pressable
                key={status.value}
                onPress={() => setFilterStatus(status.value)}
                className={`px-4 py-2 rounded-xl ${
                  filterStatus === status.value
                    ? 'bg-blue-500'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    filterStatus === status.value ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {status.label} ({status.count})
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Tasks List */}
      <ScrollView className="flex-1 px-6">
        {filteredTasks.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Briefcase size={64} color="#475569" />
            <Text className="text-white text-xl font-semibold mt-4 mb-2">No Tasks</Text>
            <Text className="text-slate-400 text-center">
              {filterStatus === 'all' ? 'No tasks yet' : `No ${filterStatus.replace('_', ' ')} tasks`}
            </Text>
          </View>
        ) : (
          <View className="gap-3 pb-6">
            {filteredTasks.map((task) => {
              const isOwn = task.assigneeId === currentUser?.id;
              const canRequestReview = isOwn && task.status === 'in_progress' && currentMembership?.role === 'Apprentice';

              return (
                <Pressable
                  key={task.id}
                  onPress={() => {
                    setSelectedTask(task);
                    setShowStatusModal(true);
                  }}
                  className="bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70"
                >
                  {/* Task Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-2">
                        {getStatusIcon(task.status)}
                        <View className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        <Text className="text-slate-400 text-xs uppercase tracking-wide">
                          {task.function}
                        </Text>
                      </View>
                      <Text className="text-white font-semibold text-base mb-1">{task.title}</Text>
                      {task.description && (
                        <Text className="text-slate-400 text-sm" numberOfLines={2}>
                          {task.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Task Meta */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      {task.assignee && (
                        <View className="flex-row items-center">
                          <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center mr-2">
                            <Text className="text-white text-xs font-semibold">
                              {task.assignee.name.charAt(0)}
                            </Text>
                          </View>
                          <Text className="text-slate-400 text-xs">{task.assignee.name}</Text>
                        </View>
                      )}
                      {task.dueDate && (
                        <>
                          <Text className="text-slate-600">•</Text>
                          <Text className="text-slate-400 text-xs">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Text>
                        </>
                      )}
                    </View>

                    {canRequestReview && (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRequestReview(task.id);
                        }}
                        className="bg-blue-500/20 px-3 py-1 rounded-lg active:opacity-70"
                      >
                        <Text className="text-blue-400 text-xs font-semibold">Request Review</Text>
                      </Pressable>
                    )}
                  </View>

                  {task.project && (
                    <View className="mt-2 pt-2 border-t border-slate-800">
                      <Text className="text-slate-500 text-xs">
                        Project: {task.project.title}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Change Status Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Change Status</Text>
              <Pressable onPress={() => setShowStatusModal(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {selectedTask && (
              <>
                <Text className="text-slate-400 mb-6">{selectedTask.title}</Text>

                <View className="gap-3 mb-6">
                  {(['todo', 'in_progress', 'in_review', 'done'] as TaskStatus[]).map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => handleStatusChange(status)}
                      disabled={updateTaskMutation.isPending}
                      className={`p-4 rounded-xl border-2 ${
                        selectedTask.status === status
                          ? 'bg-blue-500/10 border-blue-500'
                          : 'bg-slate-800 border-slate-700'
                      } active:opacity-70`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          {getStatusIcon(status)}
                          <Text className={`font-semibold ${
                            selectedTask.status === status ? 'text-blue-400' : 'text-white'
                          }`}>
                            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Text>
                        </View>
                        {selectedTask.status === status && (
                          <View className="w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                            <CheckCircle2 size={16} color="white" />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={() => setShowStatusModal(false)}
                  className="bg-slate-800 rounded-xl py-3 items-center active:opacity-80"
                >
                  <Text className="text-slate-400 font-semibold">Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
