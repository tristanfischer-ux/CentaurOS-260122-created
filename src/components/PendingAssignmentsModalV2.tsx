/**
 * Pending Assignments Modal v2
 *
 * Improved assignment inbox with:
 * - SLA countdown timers
 * - Capacity holds visualization
 * - Smart rejection with alternatives
 * - Assignment history per task
 * - Early response encouragement
 *
 * Follows STYLE_GUIDE.md modal standards
 */

import { View, Text, Pressable, ScrollView, Modal, TextInput } from 'react-native';
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
  ASSIGNMENT_SLA,
} from '@/lib/state/task-assignment-store-v2';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useTheme } from '@/lib/ThemeContext';
import { HapticPressable } from '@/components/HapticPressable';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/cn';

interface PendingAssignmentsModalV2Props {
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
  const [timeRemaining, setTimeRemaining] = useState(0);

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
        'flex-row items-center gap-1 px-2 py-1 rounded-full',
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
        size={12}
        color={isExpired ? '#dc2626' : isUrgent ? '#f59e0b' : isSlowResponse ? '#ea580c' : '#64748b'}
      />
      <Text
        className={cn(
          'text-xs font-bold',
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

export function PendingAssignmentsModalV2({
  visible,
  onClose,
  memberId,
}: PendingAssignmentsModalV2Props) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

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
    const success = acceptAssignment(assignmentId, 'Accepted');
    if (success) {
      // Show success feedback
    }
  };

  const handleReject = () => {
    if (!selectedAssignment) return;
    if (!rejectionReason.trim()) return;

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

  if (!visible) return null;

  const bgColor = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-100' : 'bg-white';
  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-50' : 'bg-slate-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-slate-600';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className={cn('rounded-t-3xl', bgColor)}>
            {/* Header with gradient */}
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 24,
                paddingTop: 24,
                paddingBottom: 16,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-3">
                  <View className="bg-white/20 p-2 rounded-full">
                    <Clock size={20} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-xl font-bold">Pending Assignments</Text>
                    <Text className="text-white/70 text-sm">
                      {pendingAssignments.length} awaiting response
                    </Text>
                  </View>
                </View>
                <HapticPressable onPress={onClose} className="bg-white/20 p-2 rounded-full">
                  <X size={20} color="white" />
                </HapticPressable>
              </View>

              {/* Capacity Summary */}
              <View className="bg-white/10 rounded-xl p-3 mt-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white/80 text-sm">Your Capacity</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-bold">
                      {capacityInfo.allocated}/{capacityInfo.total} TU
                    </Text>
                    {capacityInfo.held > 0 && (
                      <View className="bg-amber-500/30 px-2 py-0.5 rounded-full">
                        <Text className="text-amber-200 text-xs font-medium">
                          +{capacityInfo.held} pending
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                {/* Progress bar */}
                <View className="h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <View
                    className="h-full bg-white/80 rounded-full"
                    style={{
                      width: `${Math.min(100, (capacityInfo.allocated / capacityInfo.total) * 100)}%`,
                    }}
                  />
                  {capacityInfo.held > 0 && (
                    <View
                      className="h-full bg-amber-400/60 absolute top-0"
                      style={{
                        left: `${(capacityInfo.allocated / capacityInfo.total) * 100}%`,
                        width: `${Math.min(100 - (capacityInfo.allocated / capacityInfo.total) * 100, (capacityInfo.held / capacityInfo.total) * 100)}%`,
                      }}
                    />
                  )}
                </View>
              </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView className="max-h-[500px]" showsVerticalScrollIndicator>
              {pendingAssignments.length === 0 ? (
                <View className="items-center py-12 px-6">
                  <CheckCircle size={48} color="#10b981" />
                  <Text className={cn('font-semibold text-lg mt-4', textPrimary)}>All Caught Up!</Text>
                  <Text className={cn('text-center mt-2', textSecondary)}>
                    You have no pending task assignments
                  </Text>
                </View>
              ) : (
                <View className="p-4 gap-3">
                  {pendingAssignments.map((assignment) => {
                    const impact = getCapacityImpact(assignment);
                    const history = getAssignmentHistory(assignment.workPlanId);
                    const pastRejections = history.filter((h) => h.status === 'rejected');
                    const isHistoryExpanded = expandedHistoryId === assignment.id;

                    return (
                      <View
                        key={assignment.id}
                        className={cn(
                          'rounded-xl p-4 border-l-4',
                          assignment.isSlowResponse ? 'border-orange-500' : 'border-blue-500',
                          cardBg
                        )}
                      >
                        {/* Header row with SLA */}
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1 mr-3">
                            <Text className={cn('font-bold text-base', textPrimary)} numberOfLines={2}>
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
                          <Text className={cn('text-sm mb-3', textSecondary)} numberOfLines={2}>
                            {assignment.taskSnapshot.description}
                          </Text>
                        )}

                        {/* Metadata */}
                        <View className="gap-1.5 mb-3">
                          <View className="flex-row items-center gap-2">
                            <User size={14} color="#64748b" />
                            <Text className={cn('text-sm', textSecondary)}>
                              From: <Text className="font-medium">{assignment.assignedByName}</Text>
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <Target size={14} color="#64748b" />
                            <Text className={cn('text-sm', textSecondary)}>
                              {assignment.proposedAllocation.squaresPerWeek} TU/week ×{' '}
                              {assignment.proposedAllocation.estimatedWeeks} weeks
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <Calendar size={14} color="#64748b" />
                            <Text className={cn('text-sm', textSecondary)}>
                              Due: {new Date(assignment.taskSnapshot.dueDate).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>

                        {/* Capacity Impact */}
                        <View
                          className={cn(
                            'rounded-lg p-3 mb-3 border',
                            impact.status === 'overallocated'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : impact.status === 'warning'
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                          )}
                        >
                          <View className="flex-row items-center gap-2 mb-1">
                            {impact.status === 'overallocated' ? (
                              <AlertTriangle size={14} color="#ef4444" />
                            ) : impact.status === 'warning' ? (
                              <AlertTriangle size={14} color="#f59e0b" />
                            ) : (
                              <TrendingUp size={14} color="#10b981" />
                            )}
                            <Text
                              className={cn(
                                'font-bold text-xs',
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
                              'text-xs',
                              impact.status === 'overallocated'
                                ? 'text-red-600 dark:text-red-400'
                                : impact.status === 'warning'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            )}
                          >
                            After accepting: {impact.newAllocated}/{capacityInfo.total} TU (
                            {impact.utilizationPercent}%)
                          </Text>
                          {impact.isOverallocated ? (
                            <Text className="text-xs text-red-600 dark:text-red-400 font-bold mt-1">
                              This would overallocate you by {Math.abs(impact.available)} TU
                            </Text>
                          ) : (
                            <Text className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                              {impact.available} TU would remain available
                            </Text>
                          )}
                        </View>

                        {/* Past Rejections Warning */}
                        {pastRejections.length > 0 && (
                          <HapticPressable
                            onPress={() =>
                              setExpandedHistoryId(isHistoryExpanded ? null : assignment.id)
                            }
                            className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 mb-3 flex-row items-center justify-between"
                          >
                            <View className="flex-row items-center gap-2">
                              <History size={14} color="#f59e0b" />
                              <Text className="text-amber-700 dark:text-amber-300 text-xs font-medium">
                                {pastRejections.length} previous rejection
                                {pastRejections.length !== 1 ? 's' : ''}
                              </Text>
                            </View>
                            {isHistoryExpanded ? (
                              <ChevronUp size={14} color="#f59e0b" />
                            ) : (
                              <ChevronDown size={14} color="#f59e0b" />
                            )}
                          </HapticPressable>
                        )}

                        {/* Expanded History */}
                        {isHistoryExpanded && pastRejections.length > 0 && (
                          <View className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 mb-3 gap-2">
                            {pastRejections.slice(0, 3).map((rejection, idx) => (
                              <View key={rejection.id} className="border-b border-slate-200 dark:border-slate-700 pb-2 last:border-b-0 last:pb-0">
                                <Text className={cn('text-xs font-medium', textPrimary)}>
                                  {rejection.assignedToName} rejected
                                </Text>
                                <Text className={cn('text-xs', textSecondary)}>
                                  {rejection.response?.rejectionReason}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Quick Response Badge */}
                        {!assignment.isSlowResponse && (
                          <View className="flex-row items-center gap-1 mb-3">
                            <Zap size={12} color="#10b981" />
                            <Text className="text-emerald-600 dark:text-emerald-400 text-xs">
                              Quick response builds trust
                            </Text>
                          </View>
                        )}

                        {/* Actions */}
                        <View className="flex-row items-center gap-2">
                          <HapticPressable
                            onPress={() => handleAccept(assignment.id)}
                            className="flex-1 bg-emerald-500 py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
                          >
                            <CheckCircle size={18} color="white" />
                            <Text className="text-white font-bold">Accept</Text>
                          </HapticPressable>
                          <HapticPressable
                            onPress={() => {
                              setSelectedAssignment(assignment);
                              setShowRejectModal(true);
                            }}
                            className="flex-1 bg-red-500 py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
                          >
                            <XCircle size={18} color="white" />
                            <Text className="text-white font-bold">Reject</Text>
                          </HapticPressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>

      {/* Reject Modal with Smart Suggestions */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/70 justify-center items-center p-6"
          onPress={() => setShowRejectModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className={cn('rounded-2xl p-6 w-full max-w-md', bgColor)}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className={cn('font-bold text-lg', textPrimary)}>Reject Assignment</Text>
              <HapticPressable onPress={() => setShowRejectModal(false)}>
                <X size={24} color="#64748b" />
              </HapticPressable>
            </View>

            <Text className={cn('text-sm mb-4', textSecondary)}>
              {selectedAssignment?.taskSnapshot.title}
            </Text>

            {/* Rejection Reason */}
            <Text className={cn('font-medium mb-2', textPrimary)}>Reason for Rejection *</Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="e.g., No capacity, Wrong skillset, Conflicting deadline..."
              placeholderTextColor="#94a3b8"
              className={cn(
                'rounded-lg px-4 py-3 mb-4',
                isDark ? 'bg-slate-800 text-white' : isOffWhite ? 'bg-stone-200 text-stone-900' : 'bg-slate-100 text-slate-900'
              )}
            />

            {/* Optional Message */}
            <Text className={cn('font-medium mb-2', textPrimary)}>Message (Optional)</Text>
            <TextInput
              value={rejectionMessage}
              onChangeText={setRejectionMessage}
              placeholder="Additional context or suggestions..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={2}
              className={cn(
                'rounded-lg px-4 py-3 mb-4',
                isDark ? 'bg-slate-800 text-white' : isOffWhite ? 'bg-stone-200 text-stone-900' : 'bg-slate-100 text-slate-900'
              )}
              style={{ textAlignVertical: 'top', minHeight: 60 }}
            />

            {/* Suggest Alternative */}
            {availableAlternatives.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <UserPlus size={16} color="#3b82f6" />
                  <Text className={cn('font-medium', textPrimary)}>Suggest Someone Else</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  <View className="flex-row gap-2">
                    {availableAlternatives.map((alt) => (
                      <HapticPressable
                        key={alt.id}
                        onPress={() =>
                          setSuggestedAlternativeId(
                            suggestedAlternativeId === alt.id ? null : alt.id
                          )
                        }
                        className={cn(
                          'px-3 py-2 rounded-lg border',
                          suggestedAlternativeId === alt.id
                            ? 'bg-blue-500 border-blue-500'
                            : isDark
                            ? 'bg-slate-800 border-slate-700'
                            : 'bg-white border-slate-200'
                        )}
                      >
                        <Text
                          className={cn(
                            'text-sm font-medium',
                            suggestedAlternativeId === alt.id
                              ? 'text-white'
                              : textPrimary
                          )}
                        >
                          {alt.name}
                        </Text>
                        <Text
                          className={cn(
                            'text-xs',
                            suggestedAlternativeId === alt.id
                              ? 'text-white/70'
                              : textSecondary
                          )}
                        >
                          {alt.available} TU free
                        </Text>
                      </HapticPressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Actions */}
            <View className="flex-row gap-3">
              <HapticPressable
                onPress={() => setShowRejectModal(false)}
                className={cn(
                  'flex-1 py-3 rounded-xl',
                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                )}
              >
                <Text className={cn('font-semibold text-center', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  Cancel
                </Text>
              </HapticPressable>
              <HapticPressable
                onPress={handleReject}
                disabled={!rejectionReason.trim()}
                className={cn(
                  'flex-1 py-3 rounded-xl',
                  rejectionReason.trim() ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'
                )}
              >
                <Text
                  className={cn(
                    'font-semibold text-center',
                    rejectionReason.trim() ? 'text-white' : 'text-slate-400'
                  )}
                >
                  Reject Task
                </Text>
              </HapticPressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}
