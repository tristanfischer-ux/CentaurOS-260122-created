/**
 * Pending Assignments Inbox
 * Shows tasks that have been assigned to the current user and are awaiting acceptance
 */

import { View, Text, Pressable, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { useState, useMemo } from 'react';
import { X, CheckCircle, XCircle, Clock, User, Calendar, Target, MessageSquare, CheckCheck, XCircleIcon, AlertTriangle, TrendingUp } from 'lucide-react-native';
import { useTaskAssignmentStore, type TaskAssignment } from '@/lib/state/task-assignment-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { LinearGradient } from 'expo-linear-gradient';

interface PendingAssignmentsModalProps {
  visible: boolean;
  onClose: () => void;
  memberId: string;
}

export function PendingAssignmentsModal({ visible, onClose, memberId }: PendingAssignmentsModalProps) {
  // Select the raw assignments array (stable reference)
  const assignments = useTaskAssignmentStore(s => s.assignments);
  const acceptAssignment = useTaskAssignmentStore(s => s.acceptAssignment);
  const rejectAssignment = useTaskAssignmentStore(s => s.rejectAssignment);
  const bulkAccept = useTaskAssignmentStore(s => s.bulkAccept);
  const bulkReject = useTaskAssignmentStore(s => s.bulkReject);
  const members = useOrganizationStore(s => s.members);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  // Get current member
  const currentMember = useMemo(() => members.find(m => m.id === memberId), [members, memberId]);

  // Calculate current capacity
  const currentCapacity = useMemo(() => {
    if (!currentMember) return { allocated: 0, total: 0 };

    const totalAllocated = workPlans
      .filter(wp => wp.status !== 'completed' && wp.status !== 'abandoned')
      .reduce((sum, wp) => {
        const allocation = wp.allocations?.find(a => a.memberId === memberId);
        return sum + (allocation?.squaresPerWeek || 0);
      }, 0);

    const totalCapacity = currentMember.role === 'Founder' || currentMember.role === 'Apprentice'
      ? 15
      : (currentMember.daysPerWeek || 2) * 2;

    return { allocated: totalAllocated, total: totalCapacity };
  }, [currentMember, workPlans, memberId]);

  // Calculate capacity impact for an assignment
  const getCapacityImpact = (assignment: TaskAssignment) => {
    const newAllocated = currentCapacity.allocated + assignment.proposedAllocation.squaresPerWeek;
    const utilizationPercent = Math.round((newAllocated / currentCapacity.total) * 100);
    const isOverallocated = newAllocated > currentCapacity.total;
    const available = currentCapacity.total - newAllocated;

    return {
      newAllocated,
      utilizationPercent,
      isOverallocated,
      available,
      status: isOverallocated ? 'overallocated' : utilizationPercent >= 85 ? 'warning' : 'good',
    };
  };

  // Filter pending assignments with useMemo to avoid creating new array on every render
  const pendingAssignments = useMemo(() =>
    assignments.filter(a => a.assignedTo === memberId && a.status === 'pending'),
    [assignments, memberId]
  );

  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignment | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getAssignerName = (assignerId: string) => {
    const member = members.find(m => m.id === assignerId);
    return member?.name || 'Unknown';
  };

  const handleAccept = async (assignmentId: string) => {
    try {
      await acceptAssignment(assignmentId, 'Accepted');
      Alert.alert('Success', 'Task accepted! It will now appear in your task list.');
    } catch (err) {
      Alert.alert('Error', 'Failed to accept task. Please try again.');
    }
  };

  const handleReject = async () => {
    if (!selectedAssignment) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await rejectAssignment(selectedAssignment.id, rejectionReason, rejectionMessage);
      setShowRejectModal(false);
      setSelectedAssignment(null);
      setRejectionReason('');
      setRejectionMessage('');
      Alert.alert('Task Rejected', 'The task creator has been notified of your rejection.');
    } catch (err) {
      Alert.alert('Error', 'Failed to reject task. Please try again.');
    }
  };

  const handleBulkAccept = async () => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      'Accept Tasks',
      `Accept ${selectedIds.size} task(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept All',
          onPress: async () => {
            try {
              await bulkAccept(Array.from(selectedIds));
              setSelectedIds(new Set());
              Alert.alert('Success', `${selectedIds.size} task(s) accepted!`);
            } catch (err) {
              Alert.alert('Error', 'Failed to accept tasks. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBulkReject = () => {
    if (selectedIds.size === 0) return;

    Alert.prompt(
      'Reject Tasks',
      `Provide a reason for rejecting ${selectedIds.size} task(s):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject All',
          onPress: async (reason) => {
            if (!reason?.trim()) {
              Alert.alert('Error', 'Please provide a reason for rejection');
              return;
            }

            try {
              await bulkReject(Array.from(selectedIds), reason);
              setSelectedIds(new Set());
              Alert.alert('Tasks Rejected', 'Task creators have been notified.');
            } catch (err) {
              Alert.alert('Error', 'Failed to reject tasks. Please try again.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const toggleSelection = (assignmentId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(pendingAssignments.map(a => a.id)));
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Clock size={24} color="white" />
                  <Text className="text-white text-xl font-bold">Pending Assignments</Text>
                </View>
                <Pressable onPress={onClose} className="bg-white/20 p-2 rounded-full">
                  <X size={20} color="white" />
                </Pressable>
              </View>
              <Text className="text-white/80 text-sm">
                {pendingAssignments.length} task{pendingAssignments.length !== 1 ? 's' : ''} awaiting your response
              </Text>
            </LinearGradient>

            {/* Bulk Actions */}
            {pendingAssignments.length > 0 && (
              <View className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  {selectedIds.size > 0 && (
                    <Text className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                      {selectedIds.size} selected
                    </Text>
                  )}
                  {selectedIds.size !== pendingAssignments.length && (
                    <Pressable onPress={selectAll} className="px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-full">
                      <Text className="text-slate-700 dark:text-slate-300 text-xs font-medium">Select All</Text>
                    </Pressable>
                  )}
                </View>
                {selectedIds.size > 0 && (
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={handleBulkAccept}
                      className="px-3 py-1.5 bg-emerald-500 rounded-full flex-row items-center gap-1"
                    >
                      <CheckCheck size={14} color="white" />
                      <Text className="text-white text-xs font-semibold">Accept All</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleBulkReject}
                      className="px-3 py-1.5 bg-red-500 rounded-full flex-row items-center gap-1"
                    >
                      <XCircleIcon size={14} color="white" />
                      <Text className="text-white text-xs font-semibold">Reject All</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* Content */}
            <ScrollView className="max-h-[600px]" showsVerticalScrollIndicator={true}>
              {pendingAssignments.length === 0 ? (
                <View className="items-center py-12 px-6">
                  <CheckCircle size={48} color="#10b981" />
                  <Text className="text-slate-900 dark:text-white font-semibold text-lg mt-4">
                    All Caught Up!
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-center mt-2">
                    You have no pending task assignments
                  </Text>
                </View>
              ) : (
                <View className="p-4 space-y-3">
                  {pendingAssignments.map((assignment) => (
                    <View
                      key={assignment.id}
                      className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border-l-4 border-amber-500"
                    >
                      {/* Selection Checkbox */}
                      <Pressable
                        onPress={() => toggleSelection(assignment.id)}
                        className="flex-row items-start gap-3 mb-3"
                      >
                        <View
                          className={`w-5 h-5 rounded border-2 items-center justify-center ${
                            selectedIds.has(assignment.id)
                              ? 'bg-amber-500 border-amber-500'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {selectedIds.has(assignment.id) && <CheckCircle size={12} color="white" />}
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-900 dark:text-white font-semibold text-base">
                            {assignment.taskTitle}
                          </Text>
                          {assignment.taskDescription && (
                            <Text className="text-slate-600 dark:text-slate-400 text-sm mt-1" numberOfLines={2}>
                              {assignment.taskDescription}
                            </Text>
                          )}
                        </View>
                      </Pressable>

                      {/* Assignment Details */}
                      <View className="space-y-2 mb-3">
                        <View className="flex-row items-center gap-2">
                          <User size={14} color="#64748b" />
                          <Text className="text-slate-600 dark:text-slate-400 text-sm">
                            Assigned by: <Text className="font-medium">{getAssignerName(assignment.assignedBy)}</Text>
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Target size={14} color="#64748b" />
                          <Text className="text-slate-600 dark:text-slate-400 text-sm">
                            {assignment.proposedAllocation.squaresPerWeek} TU/week × {assignment.proposedAllocation.estimatedWeeks} weeks
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Calendar size={14} color="#64748b" />
                          <Text className="text-slate-600 dark:text-slate-400 text-sm">
                            Due: {new Date(assignment.taskDueDate).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      {/* Capacity Impact */}
                      {(() => {
                        const impact = getCapacityImpact(assignment);
                        const bgColor = impact.status === 'overallocated'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : impact.status === 'warning'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';

                        const textColor = impact.status === 'overallocated'
                          ? 'text-red-700 dark:text-red-300'
                          : impact.status === 'warning'
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-emerald-700 dark:text-emerald-300';

                        const iconColor = impact.status === 'overallocated'
                          ? '#ef4444'
                          : impact.status === 'warning'
                          ? '#f59e0b'
                          : '#10b981';

                        return (
                          <View className={`rounded-lg p-3 mb-3 border ${bgColor}`}>
                            <View className="flex-row items-center gap-2 mb-1.5">
                              {impact.status === 'overallocated' ? (
                                <AlertTriangle size={14} color={iconColor} />
                              ) : impact.status === 'warning' ? (
                                <AlertTriangle size={14} color={iconColor} />
                              ) : (
                                <TrendingUp size={14} color={iconColor} />
                              )}
                              <Text className={`font-bold text-xs ${textColor}`}>
                                Capacity Impact
                              </Text>
                            </View>
                            <Text className={`text-xs ${textColor}`}>
                              Current: {currentCapacity.allocated}/{currentCapacity.total} TU ({Math.round((currentCapacity.allocated / currentCapacity.total) * 100)}%)
                            </Text>
                            <Text className={`text-xs font-bold ${textColor}`}>
                              After accepting: {impact.newAllocated}/{currentCapacity.total} TU ({impact.utilizationPercent}%)
                            </Text>
                            {impact.isOverallocated ? (
                              <Text className="text-xs text-red-600 dark:text-red-400 font-bold mt-1">
                                ⚠️ This would overallocate you by {Math.abs(impact.available)} TU
                              </Text>
                            ) : (
                              <Text className={`text-xs ${textColor} mt-1`}>
                                ✓ {impact.available} TU would remain available
                              </Text>
                            )}
                          </View>
                        );
                      })()}

                      {/* Actions */}
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => handleAccept(assignment.id)}
                          className="flex-1 bg-emerald-500 py-2.5 rounded-lg flex-row items-center justify-center gap-1"
                        >
                          <CheckCircle size={16} color="white" />
                          <Text className="text-white font-semibold">Accept</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setSelectedAssignment(assignment);
                            setShowRejectModal(true);
                          }}
                          className="flex-1 bg-red-500 py-2.5 rounded-lg flex-row items-center justify-center gap-1"
                        >
                          <XCircle size={16} color="white" />
                          <Text className="text-white font-semibold">Reject</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <Pressable className="flex-1 bg-black/70 justify-center items-center p-6" onPress={() => setShowRejectModal(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-900 dark:text-white font-bold text-lg">Reject Task</Text>
              <Pressable onPress={() => setShowRejectModal(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <Text className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              {selectedAssignment?.taskTitle}
            </Text>

            <Text className="text-slate-900 dark:text-white font-medium mb-2">Reason for Rejection *</Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="e.g., No capacity this week, Wrong skillset, etc."
              placeholderTextColor="#94a3b8"
              className="bg-slate-100 dark:bg-slate-900 rounded-lg px-4 py-3 text-slate-900 dark:text-white mb-4"
            />

            <Text className="text-slate-900 dark:text-white font-medium mb-2">Message to Task Creator (Optional)</Text>
            <TextInput
              value={rejectionMessage}
              onChangeText={setRejectionMessage}
              placeholder="Provide additional context or suggestions..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              className="bg-slate-100 dark:bg-slate-900 rounded-lg px-4 py-3 text-slate-900 dark:text-white mb-4"
              style={{ textAlignVertical: 'top' }}
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowRejectModal(false)}
                className="flex-1 bg-slate-200 dark:bg-slate-700 py-3 rounded-lg"
              >
                <Text className="text-slate-700 dark:text-slate-300 font-semibold text-center">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleReject}
                className="flex-1 bg-red-500 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold text-center">Reject Task</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}
