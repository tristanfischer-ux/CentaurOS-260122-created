/**
 * PendingAssignmentsModalImproved - Full-screen, readable assignment inbox
 *
 * Improvements over V2:
 * - Full-screen modal for better focus
 * - 3xl headers (32px) and larger text throughout
 * - Clearer commitment visualization
 * - Larger action buttons (py-5)
 * - Better spacing and contrast
 * - Simplified layout for mobile readability
 */

import { View, Text, Pressable, ScrollView, Modal, TextInput, SafeAreaView, Platform } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Target,
  AlertTriangle,
  TrendingUp,
  History,
  ChevronDown,
  ChevronUp,
  Zap,
  UserPlus,
} from 'lucide-react-native';
import {
  useTaskAssignmentStoreV2,
  type TaskAssignmentV2,
} from '@/lib/state/task-assignment-store-v2';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { cn } from '@/lib/cn';
import { lightImpact, heavyImpact } from '@/lib/haptics';

interface PendingAssignmentsModalImprovedProps {
  visible: boolean;
  onClose: () => void;
  memberId: string;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function SLATimer({ expiresAt, isSlowResponse }: { expiresAt: string; isSlowResponse: boolean }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      setTimeRemaining(remaining);
    };

    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isUrgent = timeRemaining < 4 * 60 * 60 * 1000; // < 4 hours
  const isExpired = timeRemaining <= 0;

  return (
    <View
      className={cn(
        'flex-row items-center gap-2 px-4 py-2 rounded-xl',
        isExpired
          ? 'bg-red-100 dark:bg-red-900/30'
          : isUrgent
          ? 'bg-amber-100 dark:bg-amber-900/30'
          : isSlowResponse
          ? 'bg-orange-100 dark:bg-orange-900/30'
          : 'bg-slate-100 dark:bg-slate-800'
      )}
    >
      <Clock
        size={20}
        color={isExpired ? '#dc2626' : isUrgent ? '#f59e0b' : isSlowResponse ? '#ea580c' : '#64748b'}
      />
      <Text
        className={cn(
          'text-base font-bold',
          isExpired
            ? 'text-red-600 dark:text-red-400'
            : isUrgent
            ? 'text-amber-600 dark:text-amber-400'
            : isSlowResponse
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-slate-600 dark:text-slate-400'
        )}
      >
        {formatTimeRemaining(timeRemaining)}
      </Text>
    </View>
  );
}

export function PendingAssignmentsModalImproved({
  visible,
  onClose,
  memberId,
}: PendingAssignmentsModalImprovedProps) {
  // Store selectors
  const assignments = useTaskAssignmentStoreV2((s) => s.assignments);
  const acceptAssignment = useTaskAssignmentStoreV2((s) => s.acceptAssignment);
  const rejectAssignment = useTaskAssignmentStoreV2((s) => s.rejectAssignment);
  const getAssignmentHistory = useTaskAssignmentStoreV2((s) => s.getAssignmentHistory);
  const getEffectiveCapacity = useTaskAssignmentStoreV2((s) => s.getEffectiveCapacity);
  const members = useOrganizationStore((s) => s.members);
  const workPlans = useWorkPlanStore((s) => s.workPlans);

  // Local state
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignmentV2 | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [suggestedAlternativeId, setSuggestedAlternativeId] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Computed values
  const currentMember = useMemo(() => members.find((m) => m.id === memberId), [members, memberId]);

  const pendingAssignments = useMemo(
    () => assignments.filter((a) => a.assignedTo === memberId && a.status === 'pending'),
    [assignments, memberId]
  );

  // Calculate capacity (including holds)
  const capacityInfo = useMemo(() => {
    if (!currentMember) return { allocated: 0, held: 0, available: 0, total: 0 };

    const totalCapacity =
      currentMember.role === 'Founder' || currentMember.role === 'Apprentice'
        ? 15
        : (currentMember.daysPerWeek || 2) * 2;

    const allocatedTUs = workPlans
      .filter((wp) => wp.status !== 'completed' && wp.status !== 'abandoned')
      .reduce((sum, wp) => {
        const allocation = wp.allocations?.find((a) => a.memberId === memberId);
        return sum + (allocation?.squaresPerWeek || 0);
      }, 0);

    return getEffectiveCapacity(memberId, totalCapacity, allocatedTUs);
  }, [currentMember, workPlans, memberId, getEffectiveCapacity]);

  // Available alternatives for rejection suggestion
  const availableAlternatives = useMemo(() => {
    return members
      .filter((m) => m.id !== memberId && m.status === 'active' && m.role !== 'Founder')
      .map((m) => {
        const memberCapacity =
          m.role === 'Apprentice' ? 15 : (m.daysPerWeek || 2) * 2;
        const allocated = workPlans
          .filter((wp) => wp.status !== 'completed' && wp.status !== 'abandoned')
          .reduce((sum, wp) => {
            const alloc = wp.allocations?.find((a) => a.memberId === m.id);
            return sum + (alloc?.squaresPerWeek || 0);
          }, 0);
        const available = memberCapacity - allocated;
        const utilizationPercent = Math.round((allocated / memberCapacity) * 100);

        return {
          id: m.id,
          name: m.name,
          available,
          total: memberCapacity,
          utilizationPercent,
          function: m.function,
        };
      })
      .filter((m) => m.available > 0)
      .sort((a, b) => b.available - a.available)
      .slice(0, 5);
  }, [members, memberId, workPlans]);

  const getCapacityImpact = (assignment: TaskAssignmentV2) => {
    const newAllocated =
      capacityInfo.allocated + capacityInfo.held + assignment.proposedAllocation.squaresPerWeek;
    const utilizationPercent = Math.round((newAllocated / capacityInfo.total) * 100);
    const isOverallocated = newAllocated > capacityInfo.total;
    const available = capacityInfo.total - newAllocated;

    return {
      newAllocated,
      utilizationPercent,
      isOverallocated,
      available,
      status: isOverallocated ? 'overallocated' : utilizationPercent >= 85 ? 'warning' : 'good',
    };
  };

  const handleAccept = (assignmentId: string) => {
    heavyImpact();
    const success = acceptAssignment(assignmentId, 'Accepted');
    if (success) {
      // Assignment accepted successfully
    }
  };

  const handleReject = () => {
    if (!selectedAssignment) return;
    if (!rejectionReason.trim()) return;

    heavyImpact();

    const alternative = suggestedAlternativeId
      ? {
          id: suggestedAlternativeId,
          name: members.find((m) => m.id === suggestedAlternativeId)?.name || '',
        }
      : undefined;

    const success = rejectAssignment(
      selectedAssignment.id,
      rejectionReason,
      rejectionMessage || undefined,
      alternative
    );

    if (success) {
      setShowRejectModal(false);
      setSelectedAssignment(null);
      setRejectionReason('');
      setRejectionMessage('');
      setSuggestedAlternativeId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
        {/* Header */}
        <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                Pending Tasks
              </Text>
              <Text className="text-lg text-slate-600 dark:text-slate-400 mt-1">
                {pendingAssignments.length} awaiting your response
              </Text>
            </View>
            <Pressable
              onPress={() => {
                lightImpact();
                onClose();
              }}
              className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center active:opacity-70"
            >
              <X size={28} color="#64748b" />
            </Pressable>
          </View>

          {/* Capacity Summary */}
          <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 mt-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base text-slate-600 dark:text-slate-400">
                Your Capacity
              </Text>
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                  {capacityInfo.allocated}/{capacityInfo.total} TU
                </Text>
                {capacityInfo.held > 0 && (
                  <View className="bg-amber-500 px-3 py-1 rounded-full">
                    <Text className="text-white text-sm font-bold">
                      +{capacityInfo.held} held
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Progress bar */}
            <View className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${Math.min(100, (capacityInfo.allocated / capacityInfo.total) * 100)}%`,
                }}
              />
              {capacityInfo.held > 0 && (
                <View
                  className="h-full bg-amber-500 absolute top-0"
                  style={{
                    left: `${(capacityInfo.allocated / capacityInfo.total) * 100}%`,
                    width: `${Math.min(100 - (capacityInfo.allocated / capacityInfo.total) * 100, (capacityInfo.held / capacityInfo.total) * 100)}%`,
                  }}
                />
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4">
          {pendingAssignments.length === 0 ? (
            <View className="items-center justify-center py-20">
              <CheckCircle size={64} color="#10b981" />
              <Text className="text-2xl font-bold text-slate-900 dark:text-white mt-4">
                All Caught Up!
              </Text>
              <Text className="text-lg text-slate-600 dark:text-slate-400 text-center mt-2">
                You have no pending task assignments
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {pendingAssignments.map((assignment) => {
                const impact = getCapacityImpact(assignment);
                const history = getAssignmentHistory(assignment.workPlanId);
                const pastRejections = history.filter((h) => h.status === 'rejected');
                const isHistoryExpanded = expandedHistoryId === assignment.id;

                return (
                  <View
                    key={assignment.id}
                    className={cn(
                      'rounded-2xl p-6 border-l-8',
                      assignment.isSlowResponse
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                    )}
                  >
                    {/* Header with SLA */}
                    <View className="flex-row items-start justify-between mb-4">
                      <View className="flex-1 mr-3">
                        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                          {assignment.taskSnapshot.title}
                        </Text>
                      </View>
                      <SLATimer
                        expiresAt={assignment.expiresAt}
                        isSlowResponse={assignment.isSlowResponse}
                      />
                    </View>

                    {/* Description */}
                    {assignment.taskSnapshot.description && (
                      <Text className="text-base text-slate-700 dark:text-slate-300 mb-4">
                        {assignment.taskSnapshot.description}
                      </Text>
                    )}

                    {/* Metadata */}
                    <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4">
                      <View className="gap-3">
                        <View className="flex-row items-center gap-3">
                          <User size={20} color="#64748b" />
                          <Text className="text-base text-slate-600 dark:text-slate-400">
                            From: <Text className="font-bold text-slate-900 dark:text-white">{assignment.assignedByName}</Text>
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                          <Target size={20} color="#64748b" />
                          <Text className="text-base text-slate-600 dark:text-slate-400">
                            <Text className="font-bold text-slate-900 dark:text-white">
                              {assignment.proposedAllocation.squaresPerWeek} TU/week
                            </Text>{' '}
                            × {assignment.proposedAllocation.estimatedWeeks} weeks
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                          <Calendar size={20} color="#64748b" />
                          <Text className="text-base text-slate-600 dark:text-slate-400">
                            Due: <Text className="font-bold text-slate-900 dark:text-white">
                              {new Date(assignment.taskSnapshot.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Capacity Impact */}
                    <View
                      className={cn(
                        'rounded-xl p-4 mb-4 border-2',
                        impact.status === 'overallocated'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                          : impact.status === 'warning'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                      )}
                    >
                      <View className="flex-row items-center gap-2 mb-2">
                        {impact.status === 'overallocated' ? (
                          <AlertTriangle size={20} color="#ef4444" />
                        ) : impact.status === 'warning' ? (
                          <AlertTriangle size={20} color="#f59e0b" />
                        ) : (
                          <TrendingUp size={20} color="#10b981" />
                        )}
                        <Text
                          className={cn(
                            'font-bold text-base',
                            impact.status === 'overallocated'
                              ? 'text-red-700 dark:text-red-300'
                              : impact.status === 'warning'
                              ? 'text-amber-700 dark:text-amber-300'
                              : 'text-emerald-700 dark:text-emerald-300'
                          )}
                        >
                          Capacity Impact
                        </Text>
                      </View>
                      <Text
                        className={cn(
                          'text-base mb-1',
                          impact.status === 'overallocated'
                            ? 'text-red-600 dark:text-red-400'
                            : impact.status === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        After accepting: {impact.newAllocated}/{capacityInfo.total} TU ({impact.utilizationPercent}%)
                      </Text>
                      {impact.isOverallocated ? (
                        <Text className="text-base text-red-600 dark:text-red-400 font-bold">
                          ⚠️ This would overallocate you by {Math.abs(impact.available)} TU
                        </Text>
                      ) : (
                        <Text className="text-base text-emerald-600 dark:text-emerald-400">
                          ✓ {impact.available} TU would remain available
                        </Text>
                      )}
                    </View>

                    {/* Past Rejections Warning */}
                    {pastRejections.length > 0 && (
                      <Pressable
                        onPress={() => {
                          lightImpact();
                          setExpandedHistoryId(isHistoryExpanded ? null : assignment.id);
                        }}
                        className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4 flex-row items-center justify-between active:opacity-70"
                      >
                        <View className="flex-row items-center gap-3">
                          <History size={20} color="#f59e0b" />
                          <Text className="text-amber-700 dark:text-amber-300 text-base font-bold">
                            {pastRejections.length} previous rejection{pastRejections.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        {isHistoryExpanded ? (
                          <ChevronUp size={20} color="#f59e0b" />
                        ) : (
                          <ChevronDown size={20} color="#f59e0b" />
                        )}
                      </Pressable>
                    )}

                    {/* Expanded History */}
                    {isHistoryExpanded && pastRejections.length > 0 && (
                      <View className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-4 gap-3">
                        {pastRejections.slice(0, 3).map((rejection) => (
                          <View
                            key={rejection.id}
                            className="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-b-0 last:pb-0"
                          >
                            <Text className="text-base font-bold text-slate-900 dark:text-white">
                              {rejection.assignedToName} rejected
                            </Text>
                            <Text className="text-base text-slate-600 dark:text-slate-400">
                              {rejection.response?.rejectionReason}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Quick Response Badge */}
                    {!assignment.isSlowResponse && (
                      <View className="flex-row items-center gap-2 mb-4">
                        <Zap size={18} color="#10b981" />
                        <Text className="text-emerald-600 dark:text-emerald-400 text-base font-medium">
                          Quick response builds trust
                        </Text>
                      </View>
                    )}

                    {/* Actions */}
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => handleAccept(assignment.id)}
                        className="flex-1 bg-emerald-500 py-5 rounded-xl flex-row items-center justify-center gap-3 active:opacity-80"
                      >
                        <CheckCircle size={24} color="white" />
                        <Text className="text-white font-bold text-xl">Accept</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          lightImpact();
                          setSelectedAssignment(assignment);
                          setShowRejectModal(true);
                        }}
                        className="flex-1 bg-red-500 py-5 rounded-xl flex-row items-center justify-center gap-3 active:opacity-80"
                      >
                        <XCircle size={24} color="white" />
                        <Text className="text-white font-bold text-xl">Reject</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Reject Modal with Smart Suggestions */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/70"
          onPress={() => {
            lightImpact();
            setShowRejectModal(false);
          }}
        >
          <View className="flex-1" />
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ maxHeight: '90%' }}
          >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <View className="bg-white dark:bg-slate-900 rounded-t-2xl p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="font-bold text-2xl text-slate-900 dark:text-white">
                    Reject Assignment
                  </Text>
                  <Pressable
                    onPress={() => {
                      lightImpact();
                      setShowRejectModal(false);
                    }}
                    className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full"
                  >
                    <X size={20} color="#64748b" />
                  </Pressable>
                </View>

                <Text className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                  {selectedAssignment?.taskSnapshot.title}
                </Text>

                {/* Rejection Reason */}
                <Text className="font-bold text-base text-slate-900 dark:text-white mb-3">
                  Reason for Rejection *
                </Text>
                <TextInput
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  placeholder="e.g., No capacity, Wrong skillset, Conflicting deadline..."
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-4 mb-4 text-base text-slate-900 dark:text-white"
                />

                {/* Optional Message */}
                <Text className="font-bold text-base text-slate-900 dark:text-white mb-3">
                  Message (Optional)
                </Text>
                <TextInput
                  value={rejectionMessage}
                  onChangeText={setRejectionMessage}
                  placeholder="Additional context or suggestions..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-4 mb-4 text-base text-slate-900 dark:text-white"
                  style={{ textAlignVertical: 'top', minHeight: 100 }}
                />

                {/* Suggest Alternative */}
                {availableAlternatives.length > 0 && (
                  <View className="mb-6">
                    <View className="flex-row items-center gap-3 mb-3">
                      <UserPlus size={20} color="#3b82f6" />
                      <Text className="font-bold text-base text-slate-900 dark:text-white">
                        Suggest Someone Else
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      <View className="flex-row gap-3">
                        {availableAlternatives.map((alt) => (
                          <Pressable
                            key={alt.id}
                            onPress={() => {
                              lightImpact();
                              setSuggestedAlternativeId(
                                suggestedAlternativeId === alt.id ? null : alt.id
                              );
                            }}
                            className={cn(
                              'px-4 py-3 rounded-xl border-2',
                              suggestedAlternativeId === alt.id
                                ? 'bg-blue-500 border-blue-500'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            )}
                          >
                            <Text
                              className={cn(
                                'text-base font-bold',
                                suggestedAlternativeId === alt.id
                                  ? 'text-white'
                                  : 'text-slate-900 dark:text-white'
                              )}
                            >
                              {alt.name}
                            </Text>
                            <Text
                              className={cn(
                                'text-sm',
                                suggestedAlternativeId === alt.id
                                  ? 'text-white/80'
                                  : 'text-slate-600 dark:text-slate-400'
                              )}
                            >
                              {alt.available} TU free
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Actions */}
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      lightImpact();
                      setShowRejectModal(false);
                    }}
                    className="flex-1 bg-slate-200 dark:bg-slate-700 py-4 rounded-xl"
                  >
                    <Text className="font-bold text-lg text-center text-slate-700 dark:text-slate-300">
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleReject}
                    disabled={!rejectionReason.trim()}
                    className={cn(
                      'flex-1 py-4 rounded-xl',
                      rejectionReason.trim() ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'
                    )}
                  >
                    <Text
                      className={cn(
                        'font-bold text-lg text-center',
                        rejectionReason.trim() ? 'text-white' : 'text-slate-400'
                      )}
                    >
                      Reject Task
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}
