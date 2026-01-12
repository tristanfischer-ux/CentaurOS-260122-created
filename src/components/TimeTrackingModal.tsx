// Time Tracking Modal for logging hours on tasks

import { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { X, Clock, Calendar } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timeEntryApi } from '@/lib/api/operations';
import { useAppStore } from '@/lib/state/app-store';
import type { Task, TimeEntry } from '@/types';

interface TimeTrackingModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
}

export function TimeTrackingModal({ visible, task, onClose }: TimeTrackingModalProps) {
  const queryClient = useQueryClient();
  const currentUser = useAppStore((s) => s.currentUser);
  const currentMembership = useAppStore((s) => s.currentMembership);
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);

  const [hours, setHours] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  // Load existing time entries for this task
  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', task?.id],
    queryFn: () => timeEntryApi.getByTask(task!.id),
    enabled: !!task && visible,
  });

  const logTimeMutation = useMutation({
    mutationFn: async () => {
      if (!task || !currentUser || !currentMembership || !currentWorkspace) {
        throw new Error('Missing required data');
      }

      const hoursNum = parseFloat(hours);
      if (isNaN(hoursNum) || hoursNum <= 0) {
        throw new Error('Please enter a valid number of hours');
      }

      return await timeEntryApi.create(
        {
          taskId: task.id,
          workspaceId: currentWorkspace.id,
          hours: hoursNum,
          date,
          note: note.trim() || undefined,
        },
        currentUser.id,
        currentMembership.role
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries', task?.id] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries', 'user', currentUser?.id] });
      setHours('');
      setNote('');
      Alert.alert('Success', 'Time logged successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to log time');
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      if (!currentUser || !currentMembership) throw new Error('Not authenticated');
      await timeEntryApi.delete(entryId, currentUser.id, currentMembership.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries', task?.id] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries', 'user', currentUser?.id] });
      Alert.alert('Success', 'Time entry deleted');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete entry');
    },
  });

  if (!task) return null;

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-16 bg-gray-900 rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800">
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">Time Tracking</Text>
              <Text className="text-gray-400 text-sm" numberOfLines={1}>
                {task.title}
              </Text>
            </View>
            <Pressable onPress={onClose} className="ml-4">
              <X size={24} color="#9CA3AF" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-6 py-4">
            {/* Total Hours */}
            <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <View className="flex-row items-center">
                <Clock size={20} color="#3B82F6" />
                <Text className="text-blue-400 text-sm font-medium ml-2">Total Hours</Text>
              </View>
              <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-1">{totalHours.toFixed(1)}h</Text>
            </View>

            {/* Log Time Form */}
            <View className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
              <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">Log Time</Text>

              {/* Hours Input */}
              <View className="mb-3">
                <Text className="text-gray-400 text-sm mb-1">Hours</Text>
                <TextInput
                  value={hours}
                  onChangeText={setHours}
                  placeholder="e.g., 2.5"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                />
              </View>

              {/* Date Input */}
              <View className="mb-3">
                <Text className="text-gray-400 text-sm mb-1">Date</Text>
                <View className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 flex-row items-center">
                  <Calendar size={16} color="#6B7280" />
                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#6B7280"
                    className="flex-1 ml-2 text-gray-900 dark:text-white"
                  />
                </View>
              </View>

              {/* Note Input */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-1">Note (optional)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="What did you work on?"
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={2}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                />
              </View>

              {/* Log Button */}
              <Pressable
                onPress={() => logTimeMutation.mutate()}
                disabled={logTimeMutation.isPending || !hours}
                className={`rounded-lg py-3 ${
                  logTimeMutation.isPending || !hours ? 'bg-gray-700' : 'bg-blue-600'
                }`}
              >
                <Text className="text-gray-900 dark:text-white text-center font-semibold">
                  {logTimeMutation.isPending ? 'Logging...' : 'Log Time'}
                </Text>
              </Pressable>
            </View>

            {/* Time Entries List */}
            {timeEntries.length > 0 && (
              <View>
                <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">Time Log</Text>
                {timeEntries.map((entry) => (
                  <View
                    key={entry.id}
                    className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 mb-2"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white text-base font-medium">
                          {entry.hours}h
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {new Date(entry.date).toLocaleDateString()}
                        </Text>
                        {entry.note && (
                          <Text className="text-gray-400 text-sm mt-1">{entry.note}</Text>
                        )}
                      </View>
                      {currentUser?.id === entry.userId && (
                        <Pressable
                          onPress={() => deleteEntryMutation.mutate(entry.id)}
                          disabled={deleteEntryMutation.isPending}
                          className="ml-2 px-3 py-1 bg-red-500/20 rounded"
                        >
                          <Text className="text-red-400 text-xs font-medium">Delete</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
