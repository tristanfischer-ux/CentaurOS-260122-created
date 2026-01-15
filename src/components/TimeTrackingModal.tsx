// Time Tracking Modal for logging hours on tasks
// Deloitte Time & Expense Management Best Practices

import { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timeEntryApi } from '@/lib/api/operations';
import { useAppStore } from '@/lib/state/app-store';
import { useTheme } from '@/lib/ThemeContext';
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
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const bgPrimary = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-gray-50';
  const bgCard = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-100';
  const bgInput = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-white' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-300' : 'border-gray-300';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-gray-600';
  const iconColor = isDark ? '#94a3b8' : isOffWhite ? '#78716c' : '#6b7280';

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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-black/50">
          <View className={`flex-1 mt-16 ${bgPrimary} rounded-t-3xl`}>
          {/* Header */}
          <View className={`flex-row items-center justify-between px-6 py-4 border-b ${borderColor}`}>
            <View className="flex-1">
              <Text className={`${textPrimary} text-lg font-semibold`}>Time Tracking</Text>
              <Text className={`${textSecondary} text-sm`} numberOfLines={1}>
                {task.title}
              </Text>
            </View>
            <Pressable onPress={onClose} className="ml-4 active:opacity-70">
              <X size={24} color={iconColor} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-6 py-4">
            {/* Total Hours - Accenture KPI Card */}
            <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Clock size={20} color="#3B82F6" />
                  <Text className="text-blue-400 text-sm font-medium ml-2">Total Hours Logged</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className={`${textPrimary} text-3xl font-bold`}>{totalHours.toFixed(1)}</Text>
                  <Text className={`${textSecondary} text-sm ml-1`}>hours</Text>
                </View>
              </View>
              {/* Utilization Insight */}
              {totalHours > 0 && (
                <View className={`mt-3 pt-3 border-t border-blue-500/20`}>
                  <Text className={`${textSecondary} text-xs`}>
                    {timeEntries.length} {timeEntries.length === 1 ? 'entry' : 'entries'} logged
                  </Text>
                </View>
              )}
            </View>

            {/* Log Time Form - Deloitte Expense Entry Pattern */}
            <View className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-6`}>
              <View className="flex-row items-center mb-4">
                <CheckCircle2 size={18} color="#10b981" />
                <Text className={`${textPrimary} text-base font-semibold ml-2`}>Log Time Entry</Text>
              </View>

              {/* Hours Input */}
              <View className="mb-4">
                <Text className={`${textSecondary} text-sm font-medium mb-2`}>Hours Spent *</Text>
                <TextInput
                  value={hours}
                  onChangeText={setHours}
                  placeholder="e.g., 2.5"
                  placeholderTextColor={iconColor}
                  keyboardType="decimal-pad"
                  className={`${bgInput} border ${borderColor} rounded-xl px-4 py-3 ${textPrimary} text-base`}
                />
                <Text className={`${textSecondary} text-xs mt-1`}>Enter time in decimal hours (e.g., 1.5 = 1h 30m)</Text>
              </View>

              {/* Date Input */}
              <View className="mb-4">
                <Text className={`${textSecondary} text-sm font-medium mb-2`}>Date</Text>
                <View className={`${bgInput} border ${borderColor} rounded-xl px-4 py-3 flex-row items-center`}>
                  <Calendar size={18} color={iconColor} />
                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={iconColor}
                    className={`flex-1 ml-3 ${textPrimary} text-base`}
                  />
                </View>
              </View>

              {/* Note Input */}
              <View className="mb-4">
                <Text className={`${textSecondary} text-sm font-medium mb-2`}>Work Description (optional)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="What did you work on?"
                  placeholderTextColor={iconColor}
                  multiline
                  numberOfLines={3}
                  className={`${bgInput} border ${borderColor} rounded-xl px-4 py-3 ${textPrimary} text-base`}
                  style={{ textAlignVertical: 'top', minHeight: 80 }}
                />
              </View>

              {/* Log Button */}
              <Pressable
                onPress={() => logTimeMutation.mutate()}
                disabled={logTimeMutation.isPending || !hours}
                className={`rounded-xl py-4 ${
                  logTimeMutation.isPending || !hours ? 'bg-gray-400' : 'bg-blue-600'
                } active:opacity-70`}
              >
                <Text className="text-white text-center font-bold text-base">
                  {logTimeMutation.isPending ? 'Logging...' : 'Log Time Entry'}
                </Text>
              </Pressable>
            </View>

            {/* Time Entries List - Historical Record */}
            {timeEntries.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Clock size={18} color={iconColor} />
                  <Text className={`${textPrimary} text-base font-semibold ml-2`}>Time Log History</Text>
                </View>
                {timeEntries.map((entry) => (
                  <View
                    key={entry.id}
                    className={`${bgCard} border ${borderColor} rounded-xl p-4 mb-2`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text className={`${textPrimary} text-lg font-bold`}>
                            {entry.hours}h
                          </Text>
                          <View className={`ml-2 px-2 py-0.5 rounded ${isDark ? 'bg-slate-700' : isOffWhite ? 'bg-stone-200' : 'bg-gray-200'}`}>
                            <Text className={`${textSecondary} text-xs`}>
                              {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Text>
                          </View>
                        </View>
                        {entry.note && (
                          <Text className={`${textSecondary} text-sm mt-1`}>{entry.note}</Text>
                        )}
                      </View>
                      {currentUser?.id === entry.userId && (
                        <Pressable
                          onPress={() => deleteEntryMutation.mutate(entry.id)}
                          disabled={deleteEntryMutation.isPending}
                          className="ml-3 px-3 py-2 bg-red-500/20 rounded-lg active:opacity-70"
                        >
                          <Text className="text-red-400 text-xs font-semibold">Delete</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Empty State */}
            {timeEntries.length === 0 && (
              <View className={`${bgCard} border ${borderColor} rounded-xl p-6 items-center`}>
                <AlertCircle size={32} color={iconColor} />
                <Text className={`${textPrimary} font-semibold mt-3`}>No Time Logged Yet</Text>
                <Text className={`${textSecondary} text-sm text-center mt-1`}>
                  Log your first time entry above to track progress on this task.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
