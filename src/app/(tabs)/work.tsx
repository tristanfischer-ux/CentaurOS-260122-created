import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { Briefcase, Plus, Filter, CheckCircle2, Clock, AlertCircle, Circle, X, User, Calendar as CalendarIcon } from 'lucide-react-native';
import { useCurrentWorkspace, useCurrentMembership, useCurrentUser } from '@/lib/state/app-store';
import { useTasks, useUpdateTask, useRequestReview, useCreateTask, useWorkspaceMembers } from '@/lib/hooks/queries';
import { TimeTrackingModal } from '@/components/TimeTrackingModal';
import type { TaskStatus, TaskPriority, Function as TaskFunction, Task } from '@/types';

export default function WorkScreen() {
  const currentWorkspace = useCurrentWorkspace();
  const currentMembership = useCurrentMembership();
  const currentUser = useCurrentUser();

  const { data: tasks, isLoading } = useTasks(currentWorkspace?.id ?? null);
  const { data: members } = useWorkspaceMembers(currentWorkspace?.id ?? null);
  const updateTaskMutation = useUpdateTask();
  const requestReviewMutation = useRequestReview();
  const createTaskMutation = useCreateTask();

  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeTrackingTask, setTimeTrackingTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskFunction, setNewTaskFunction] = useState<TaskFunction>('Ops');

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

  const handleCreateTask = async () => {
    if (!currentWorkspace || !newTaskTitle.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        assigneeId: newTaskAssignee || undefined,
        priority: newTaskPriority,
        function: newTaskFunction,
      });

      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssignee('');
      setNewTaskPriority('medium');
      setNewTaskFunction('Ops');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleAssignTask = async (assigneeId: string) => {
    if (!selectedTask || !currentWorkspace) return;

    try {
      await updateTaskMutation.mutateAsync({
        taskId: selectedTask.id,
        workspaceId: currentWorkspace.id,
        updates: { assigneeId: assigneeId || null },
      });
      setShowAssignModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to assign task:', error);
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
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="bg-blue-500 rounded-xl px-4 py-2 active:opacity-80"
          >
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

                    <View className="flex-row items-center gap-2">
                      {/* Assign Button */}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                          setShowAssignModal(true);
                        }}
                        className="bg-slate-800 px-3 py-1 rounded-lg active:opacity-70"
                      >
                        <User size={14} color="#94a3b8" />
                      </Pressable>

                      {/* Time Tracking Button */}
                      {isOwn && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setTimeTrackingTask(task);
                            setShowTimeModal(true);
                          }}
                          className="bg-slate-800 px-3 py-1 rounded-lg active:opacity-70"
                        >
                          <Clock size={14} color="#94a3b8" />
                        </Pressable>
                      )}

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

      {/* Assign Task Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-slate-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Assign Task</Text>
              <Pressable onPress={() => setShowAssignModal(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            {selectedTask && (
              <>
                <Text className="text-slate-400 mb-6">{selectedTask.title}</Text>

                <ScrollView className="max-h-96 mb-6" showsVerticalScrollIndicator={false}>
                  <View className="gap-3">
                    {/* Unassigned Option */}
                    <Pressable
                      onPress={() => handleAssignTask('')}
                      disabled={updateTaskMutation.isPending}
                      className={`p-4 rounded-xl border-2 ${
                        !selectedTask.assigneeId
                          ? 'bg-blue-500/10 border-blue-500'
                          : 'bg-slate-800 border-slate-700'
                      } active:opacity-70`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <View className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center">
                            <User size={20} color="#94a3b8" />
                          </View>
                          <Text className={`font-semibold ${
                            !selectedTask.assigneeId ? 'text-blue-400' : 'text-white'
                          }`}>
                            Unassigned
                          </Text>
                        </View>
                        {!selectedTask.assigneeId && (
                          <View className="w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                            <CheckCircle2 size={16} color="white" />
                          </View>
                        )}
                      </View>
                    </Pressable>

                    {/* Team Members */}
                    {members?.map((member) => (
                      <Pressable
                        key={member.userId}
                        onPress={() => handleAssignTask(member.userId)}
                        disabled={updateTaskMutation.isPending}
                        className={`p-4 rounded-xl border-2 ${
                          selectedTask.assigneeId === member.userId
                            ? 'bg-blue-500/10 border-blue-500'
                            : 'bg-slate-800 border-slate-700'
                        } active:opacity-70`}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center">
                              <Text className="text-white font-bold">
                                {member.user?.name.charAt(0) || '?'}
                              </Text>
                            </View>
                            <View>
                              <Text className={`font-semibold ${
                                selectedTask.assigneeId === member.userId ? 'text-blue-400' : 'text-white'
                              }`}>
                                {member.user?.name || 'Unknown'}
                              </Text>
                              <Text className="text-slate-500 text-xs">{member.role}</Text>
                            </View>
                          </View>
                          {selectedTask.assigneeId === member.userId && (
                            <View className="w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                              <CheckCircle2 size={16} color="white" />
                            </View>
                          )}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                <Pressable
                  onPress={() => setShowAssignModal(false)}
                  className="bg-slate-800 rounded-xl py-3 items-center active:opacity-80"
                >
                  <Text className="text-slate-400 font-semibold">Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Task Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => setShowCreateModal(false)}
          >
            <Pressable
              className="mt-auto"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="bg-slate-900 rounded-t-3xl p-6 max-h-[90%]">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-2xl font-bold">Create Task</Text>
                  <Pressable onPress={() => setShowCreateModal(false)}>
                    <X size={24} color="#94a3b8" />
                  </Pressable>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {/* Title */}
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm font-medium mb-2">Title *</Text>
                    <TextInput
                      value={newTaskTitle}
                      onChangeText={setNewTaskTitle}
                      placeholder="Enter task title"
                      placeholderTextColor="#64748b"
                      className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                      autoFocus
                    />
                  </View>

                  {/* Description */}
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm font-medium mb-2">Description</Text>
                    <TextInput
                      value={newTaskDescription}
                      onChangeText={setNewTaskDescription}
                      placeholder="Enter task description"
                      placeholderTextColor="#64748b"
                      multiline
                      numberOfLines={3}
                      className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
                      style={{ minHeight: 80, textAlignVertical: 'top' }}
                    />
                  </View>

                  {/* Assignee */}
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm font-medium mb-2">Assign To</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => setNewTaskAssignee('')}
                          className={`px-4 py-2 rounded-xl border ${
                            newTaskAssignee === ''
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-slate-800 border-slate-700'
                          }`}
                        >
                          <Text className={`text-sm font-medium ${
                            newTaskAssignee === '' ? 'text-white' : 'text-slate-400'
                          }`}>
                            Unassigned
                          </Text>
                        </Pressable>
                        {members?.map((member) => (
                          <Pressable
                            key={member.userId}
                            onPress={() => setNewTaskAssignee(member.userId)}
                            className={`px-4 py-2 rounded-xl border ${
                              newTaskAssignee === member.userId
                                ? 'bg-blue-500 border-blue-500'
                                : 'bg-slate-800 border-slate-700'
                            }`}
                          >
                            <Text className={`text-sm font-medium ${
                              newTaskAssignee === member.userId ? 'text-white' : 'text-slate-400'
                            }`}>
                              {member.user?.name || 'Unknown'}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Function */}
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm font-medium mb-2">Function</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      <View className="flex-row gap-2">
                        {(['Finance', 'Sales', 'Marketing', 'Ops', 'Engineering', 'Admin'] as TaskFunction[]).map((func) => (
                          <Pressable
                            key={func}
                            onPress={() => setNewTaskFunction(func)}
                            className={`px-4 py-2 rounded-xl border ${
                              newTaskFunction === func
                                ? 'bg-blue-500 border-blue-500'
                                : 'bg-slate-800 border-slate-700'
                            }`}
                          >
                            <Text className={`text-sm font-medium ${
                              newTaskFunction === func ? 'text-white' : 'text-slate-400'
                            }`}>
                              {func}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Priority */}
                  <View className="mb-6">
                    <Text className="text-slate-400 text-sm font-medium mb-2">Priority</Text>
                    <View className="flex-row gap-2">
                      {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((priority) => (
                        <Pressable
                          key={priority}
                          onPress={() => setNewTaskPriority(priority)}
                          className={`flex-1 px-4 py-3 rounded-xl border ${
                            newTaskPriority === priority
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-slate-800 border-slate-700'
                          }`}
                        >
                          <Text className={`text-sm font-medium text-center capitalize ${
                            newTaskPriority === priority ? 'text-white' : 'text-slate-400'
                          }`}>
                            {priority}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View className="gap-3 mt-4">
                  <Pressable
                    onPress={handleCreateTask}
                    disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                    className={`py-4 rounded-xl items-center ${
                      !newTaskTitle.trim() || createTaskMutation.isPending
                        ? 'bg-slate-700'
                        : 'bg-blue-500'
                    } active:opacity-80`}
                  >
                    {createTaskMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white font-bold text-base">Create Task</Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => setShowCreateModal(false)}
                    className="bg-slate-800 rounded-xl py-3 items-center active:opacity-80"
                  >
                    <Text className="text-slate-400 font-semibold">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Time Tracking Modal */}
      <TimeTrackingModal
        visible={showTimeModal}
        task={timeTrackingTask}
        onClose={() => {
          setShowTimeModal(false);
          setTimeTrackingTask(null);
        }}
      />
    </View>
  );
}
