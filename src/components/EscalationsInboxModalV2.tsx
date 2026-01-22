/**
 * Escalations Inbox Modal v2
 *
 * Improved escalation management with:
 * - Urgency-based prioritization and visual indicators
 * - SLA countdown timers
 * - Auto-escalation tracking
 * - One-click resolution with smart defaults
 * - Date picker for due date changes
 *
 * Follows STYLE_GUIDE.md modal standards
 */

import { View, Text, Modal, ScrollView, Pressable, TextInput } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import {
  X,
  CheckCircle,
  UserPlus,
  XCircle,
  Calendar,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Info,
} from 'lucide-react-native';
import {
  useEscalationStoreV2,
  type EscalationRequestV2,
  type EscalationUrgency,
  URGENCY_LABELS,
  REASON_LABELS,
} from '@/lib/state/escalation-store-v2';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useTheme } from '@/lib/ThemeContext';
import { HapticPressable } from '@/components/HapticPressable';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/cn';
import { format, addDays, addWeeks } from 'date-fns';

interface EscalationsInboxModalV2Props {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
  currentMemberId: string;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Overdue';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function UrgencyBadge({ urgency }: { urgency: EscalationUrgency }) {
  const config = URGENCY_LABELS[urgency];
  const bgColors: Record<EscalationUrgency, string> = {
    critical: 'bg-red-100 dark:bg-red-900/30',
    high: 'bg-orange-100 dark:bg-orange-900/30',
    medium: 'bg-amber-100 dark:bg-amber-900/30',
    low: 'bg-slate-100 dark:bg-slate-800',
  };
  const textColors: Record<EscalationUrgency, string> = {
    critical: 'text-red-700 dark:text-red-300',
    high: 'text-orange-700 dark:text-orange-300',
    medium: 'text-amber-700 dark:text-amber-300',
    low: 'text-slate-700 dark:text-slate-300',
  };

  return (
    <View className={cn('px-2 py-1 rounded-full flex-row items-center gap-1', bgColors[urgency])}>
      {urgency === 'critical' && <AlertOctagon size={12} color={config.color} />}
      {urgency === 'high' && <AlertTriangle size={12} color={config.color} />}
      <Text className={cn('text-xs font-bold', textColors[urgency])}>{config.label}</Text>
    </View>
  );
}

function SLACountdown({ escalation }: { escalation: EscalationRequestV2 }) {
  const getSLAStatus = useEscalationStoreV2((s) => s.getSLAStatus);
  const [status, setStatus] = useState(getSLAStatus(escalation.id));

  useEffect(() => {
    const update = () => setStatus(getSLAStatus(escalation.id));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [escalation.id, getSLAStatus]);

  if (!status) return null;

  const urgencyColors: Record<EscalationUrgency, { bg: string; text: string }> = {
    critical: { bg: 'bg-red-500', text: 'text-red-100' },
    high: { bg: 'bg-orange-500', text: 'text-orange-100' },
    medium: { bg: 'bg-amber-500', text: 'text-amber-100' },
    low: { bg: 'bg-slate-500', text: 'text-slate-100' },
  };

  const colors = urgencyColors[escalation.urgency];

  return (
    <View className={cn('rounded-lg p-2', colors.bg)}>
      <View className="flex-row items-center justify-between mb-1">
        <Text className={cn('text-xs font-medium', colors.text)}>
          {status.breached ? 'SLA Breached' : 'Response Due'}
        </Text>
        <Text className={cn('text-xs font-bold', colors.text)}>
          {formatTimeRemaining(status.timeRemaining)}
        </Text>
      </View>
      <View className="h-1.5 bg-white/30 rounded-full overflow-hidden">
        <View
          className={cn('h-full rounded-full', status.breached ? 'bg-white/50' : 'bg-white')}
          style={{ width: `${status.percentRemaining}%` }}
        />
      </View>
    </View>
  );
}

export function EscalationsInboxModalV2({
  visible,
  onClose,
  workspaceId,
  currentMemberId,
}: EscalationsInboxModalV2Props) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';

  // Store selectors
  const getPendingEscalations = useEscalationStoreV2((s) => s.getPendingEscalations);
  const getUrgencyBreakdown = useEscalationStoreV2((s) => s.getUrgencyBreakdown);
  const acceptEscalation = useEscalationStoreV2((s) => s.acceptEscalation);
  const delegateEscalation = useEscalationStoreV2((s) => s.delegateEscalation);
  const rejectEscalation = useEscalationStoreV2((s) => s.rejectEscalation);
  const markViewed = useEscalationStoreV2((s) => s.markViewed);
  const members = useOrganizationStore((s) => s.members);
  const updateWorkPlan = useWorkPlanStore((s) => s.updateWorkPlan);
  const workPlans = useWorkPlanStore((s) => s.workPlans);

  // Local state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [selectedDueDateOption, setSelectedDueDateOption] = useState<string | null>(null);
  const [additionalTUs, setAdditionalTUs] = useState('');
  const [selectedDelegate, setSelectedDelegate] = useState<string | null>(null);

  // Check if Founder
  const currentMember = members.find((m) => m.id === currentMemberId);
  const isFounder = currentMember?.role === 'Founder';

  // Computed
  const pendingEscalations = useMemo(
    () => getPendingEscalations(workspaceId),
    [getPendingEscalations, workspaceId]
  );

  const urgencyBreakdown = useMemo(
    () => getUrgencyBreakdown(workspaceId),
    [getUrgencyBreakdown, workspaceId]
  );

  const availableDelegates = useMemo(
    () =>
      members.filter(
        (m) =>
          (m.role === 'FractionalExec' || m.role === 'Apprentice') &&
          m.status === 'active' &&
          m.id !== currentMemberId
      ),
    [members, currentMemberId]
  );

  // Quick date options
  const dateOptions = useMemo(() => {
    const today = new Date();
    return [
      { label: '+1 week', value: format(addWeeks(today, 1), 'yyyy-MM-dd') },
      { label: '+2 weeks', value: format(addWeeks(today, 2), 'yyyy-MM-dd') },
      { label: '+1 month', value: format(addWeeks(today, 4), 'yyyy-MM-dd') },
      { label: '+3 days', value: format(addDays(today, 3), 'yyyy-MM-dd') },
    ];
  }, []);

  if (!isFounder) return null;

  const handleExpand = (id: string) => {
    const newExpanded = expandedId === id ? null : id;
    setExpandedId(newExpanded);

    if (newExpanded) {
      // Mark as viewed
      markViewed(id, currentMemberId, currentMember?.name || '');
      // Reset form
      setActionNotes('');
      setSelectedDueDateOption(null);
      setAdditionalTUs('');
      setSelectedDelegate(null);
    }
  };

  const handleAccept = (escalationId: string) => {
    if (!actionNotes.trim()) return;

    const escalation = pendingEscalations.find((e) => e.id === escalationId);
    if (!escalation) return;

    const proposedChanges: { newDueDate?: string; additionalTUs?: number } = {};
    if (selectedDueDateOption) proposedChanges.newDueDate = selectedDueDateOption;
    if (additionalTUs) proposedChanges.additionalTUs = parseInt(additionalTUs);

    const success = acceptEscalation({
      id: escalationId,
      founderId: currentMemberId,
      founderName: currentMember?.name || '',
      notes: actionNotes,
      proposedChanges: Object.keys(proposedChanges).length > 0 ? proposedChanges : undefined,
    });

    if (success) {
      // Apply to work plan
      const task = workPlans.find((wp) => wp.id === escalation.workPlanId);
      if (task) {
        updateWorkPlan(escalation.workPlanId, {
          dueDate: proposedChanges.newDueDate || task.dueDate,
          estimatedTimeUnits: task.estimatedTimeUnits + (proposedChanges.additionalTUs || 0),
          isEscalated: false,
          escalationHistory: [...(task.escalationHistory || []), escalationId],
        });
      }
      setExpandedId(null);
    }
  };

  const handleDelegate = (escalationId: string) => {
    if (!selectedDelegate || !actionNotes.trim()) return;

    const delegate = members.find((m) => m.id === selectedDelegate);
    if (!delegate) return;

    const escalation = pendingEscalations.find((e) => e.id === escalationId);
    if (!escalation) return;

    const success = delegateEscalation({
      id: escalationId,
      founderId: currentMemberId,
      founderName: currentMember?.name || '',
      delegateToId: selectedDelegate,
      delegateToName: delegate.name,
      notes: actionNotes,
    });

    if (success) {
      const task = workPlans.find((wp) => wp.id === escalation.workPlanId);
      if (task) {
        updateWorkPlan(escalation.workPlanId, {
          isEscalated: false,
          escalationHistory: [...(task.escalationHistory || []), escalationId],
        });
      }
      setExpandedId(null);
    }
  };

  const handleReject = (escalationId: string) => {
    if (!actionNotes.trim()) return;

    const escalation = pendingEscalations.find((e) => e.id === escalationId);
    if (!escalation) return;

    const success = rejectEscalation({
      id: escalationId,
      founderId: currentMemberId,
      founderName: currentMember?.name || '',
      notes: actionNotes,
    });

    if (success) {
      const task = workPlans.find((wp) => wp.id === escalation.workPlanId);
      if (task) {
        updateWorkPlan(escalation.workPlanId, {
          isEscalated: false,
          escalationHistory: [...(task.escalationHistory || []), escalationId],
        });
      }
      setExpandedId(null);
    }
  };

  const bgColor = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-100' : 'bg-white';
  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-50' : 'bg-slate-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-600' : 'text-slate-600';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '92%' }}>
          <View className={cn('rounded-t-3xl', bgColor)}>
            {/* Header */}
            <LinearGradient
              colors={
                urgencyBreakdown.critical > 0
                  ? ['#dc2626', '#b91c1c']
                  : urgencyBreakdown.high > 0
                  ? ['#ea580c', '#c2410c']
                  : ['#3b82f6', '#2563eb']
              }
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
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3">
                  <View className="bg-white/20 p-2 rounded-full">
                    <AlertTriangle size={20} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-xl font-bold">Escalations</Text>
                    <Text className="text-white/70 text-sm">
                      {pendingEscalations.length} requiring attention
                    </Text>
                  </View>
                </View>
                <HapticPressable onPress={onClose} className="bg-white/20 p-2 rounded-full">
                  <X size={20} color="white" />
                </HapticPressable>
              </View>

              {/* Urgency Breakdown */}
              <View className="flex-row gap-2">
                {urgencyBreakdown.critical > 0 && (
                  <View className="bg-red-600/50 px-2 py-1 rounded-full flex-row items-center gap-1">
                    <AlertOctagon size={12} color="white" />
                    <Text className="text-white text-xs font-bold">
                      {urgencyBreakdown.critical} Critical
                    </Text>
                  </View>
                )}
                {urgencyBreakdown.high > 0 && (
                  <View className="bg-orange-600/50 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">{urgencyBreakdown.high} High</Text>
                  </View>
                )}
                {urgencyBreakdown.medium > 0 && (
                  <View className="bg-amber-600/50 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">
                      {urgencyBreakdown.medium} Medium
                    </Text>
                  </View>
                )}
                {urgencyBreakdown.low > 0 && (
                  <View className="bg-white/20 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">{urgencyBreakdown.low} Low</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView
              className="max-h-[600px]"
              showsVerticalScrollIndicator
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {pendingEscalations.length === 0 ? (
                <View className="items-center justify-center py-12 px-6">
                  <CheckCircle size={48} color="#10b981" />
                  <Text className={cn('font-semibold text-lg mt-4', textPrimary)}>All Clear!</Text>
                  <Text className={cn('text-center mt-2', textSecondary)}>
                    No pending escalations. Tasks are running smoothly.
                  </Text>
                </View>
              ) : (
                <View className="p-4 gap-3">
                  {pendingEscalations.map((escalation) => {
                    const isExpanded = expandedId === escalation.id;

                    return (
                      <View
                        key={escalation.id}
                        className={cn(
                          'rounded-xl overflow-hidden border-l-4',
                          escalation.urgency === 'critical'
                            ? 'border-red-500'
                            : escalation.urgency === 'high'
                            ? 'border-orange-500'
                            : escalation.urgency === 'medium'
                            ? 'border-amber-500'
                            : 'border-slate-400',
                          cardBg
                        )}
                      >
                        {/* Header - Always visible */}
                        <HapticPressable
                          onPress={() => handleExpand(escalation.id)}
                          className="p-4"
                        >
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-1 mr-3">
                              <Text className={cn('font-bold text-base', textPrimary)} numberOfLines={2}>
                                {escalation.taskSnapshot.title}
                              </Text>
                              <Text className={cn('text-sm mt-1', textSecondary)}>
                                {escalation.escalatedByName} • {REASON_LABELS[escalation.reason]}
                              </Text>
                            </View>
                            <View className="items-end gap-1">
                              <UrgencyBadge urgency={escalation.urgency} />
                              {isExpanded ? (
                                <ChevronUp size={16} color="#64748b" />
                              ) : (
                                <ChevronDown size={16} color="#64748b" />
                              )}
                            </View>
                          </View>

                          {/* SLA Timer */}
                          <SLACountdown escalation={escalation} />

                          {/* Auto-escalated badge */}
                          {escalation.autoEscalatedToBackup && (
                            <View className="mt-2 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full flex-row items-center gap-1 self-start">
                              <Zap size={12} color="#9333ea" />
                              <Text className="text-purple-700 dark:text-purple-300 text-xs font-medium">
                                Auto-escalated from {escalation.assignedToFounderName}
                              </Text>
                            </View>
                          )}

                          {/* Details preview */}
                          {!isExpanded && (
                            <Text className={cn('text-sm mt-2', textSecondary)} numberOfLines={2}>
                              {escalation.details}
                            </Text>
                          )}
                        </HapticPressable>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <View className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                            {/* Full details */}
                            <View className="mt-4 mb-4">
                              <Text className={cn('font-medium mb-1', textPrimary)}>Issue Details</Text>
                              <Text className={textSecondary}>{escalation.details}</Text>
                              {escalation.impactDescription && (
                                <View className="mt-2 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                                  <Text className="text-red-700 dark:text-red-300 text-sm">
                                    <Text className="font-bold">Impact: </Text>
                                    {escalation.impactDescription}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Task info */}
                            <View className="flex-row gap-4 mb-4">
                              <View className="flex-row items-center gap-1">
                                <Calendar size={14} color="#64748b" />
                                <Text className={cn('text-sm', textSecondary)}>
                                  Due {format(new Date(escalation.taskSnapshot.dueDate), 'MMM d')}
                                </Text>
                              </View>
                              <View className="flex-row items-center gap-1">
                                <Users size={14} color="#64748b" />
                                <Text className={cn('text-sm', textSecondary)}>
                                  {escalation.taskSnapshot.currentAllocations.length} assigned
                                </Text>
                              </View>
                            </View>

                            {/* Response form */}
                            <Text className={cn('font-medium mb-2', textPrimary)}>Your Response *</Text>
                            <TextInput
                              placeholder="Guidance for the team..."
                              value={actionNotes}
                              onChangeText={setActionNotes}
                              multiline
                              numberOfLines={3}
                              className={cn(
                                'rounded-lg p-3 mb-3 border',
                                isDark
                                  ? 'bg-slate-900 text-white border-slate-700'
                                  : 'bg-white text-slate-900 border-slate-200'
                              )}
                              placeholderTextColor="#94a3b8"
                              style={{ textAlignVertical: 'top', minHeight: 80 }}
                            />

                            {/* Quick date options */}
                            <View className="mb-3">
                              <Text className={cn('text-sm font-medium mb-2', textPrimary)}>
                                Extend Due Date (Optional)
                              </Text>
                              <View className="flex-row flex-wrap gap-2">
                                {dateOptions.map((opt) => (
                                  <HapticPressable
                                    key={opt.value}
                                    onPress={() =>
                                      setSelectedDueDateOption(
                                        selectedDueDateOption === opt.value ? null : opt.value
                                      )
                                    }
                                    className={cn(
                                      'px-3 py-1.5 rounded-lg border',
                                      selectedDueDateOption === opt.value
                                        ? 'bg-blue-500 border-blue-500'
                                        : isDark
                                        ? 'bg-slate-800 border-slate-700'
                                        : 'bg-white border-slate-200'
                                    )}
                                  >
                                    <Text
                                      className={cn(
                                        'text-sm font-medium',
                                        selectedDueDateOption === opt.value
                                          ? 'text-white'
                                          : textPrimary
                                      )}
                                    >
                                      {opt.label}
                                    </Text>
                                  </HapticPressable>
                                ))}
                              </View>
                            </View>

                            {/* Additional TUs */}
                            <View className="mb-4">
                              <Text className={cn('text-sm font-medium mb-2', textPrimary)}>
                                Add Time Units (Optional)
                              </Text>
                              <View className="flex-row gap-2">
                                {[2, 4, 6, 8].map((tu) => (
                                  <HapticPressable
                                    key={tu}
                                    onPress={() =>
                                      setAdditionalTUs(additionalTUs === String(tu) ? '' : String(tu))
                                    }
                                    className={cn(
                                      'px-4 py-2 rounded-lg border',
                                      additionalTUs === String(tu)
                                        ? 'bg-blue-500 border-blue-500'
                                        : isDark
                                        ? 'bg-slate-800 border-slate-700'
                                        : 'bg-white border-slate-200'
                                    )}
                                  >
                                    <Text
                                      className={cn(
                                        'font-bold',
                                        additionalTUs === String(tu) ? 'text-white' : textPrimary
                                      )}
                                    >
                                      +{tu}
                                    </Text>
                                  </HapticPressable>
                                ))}
                              </View>
                            </View>

                            {/* Action buttons */}
                            <View className="flex-row gap-2 mb-4">
                              <HapticPressable
                                onPress={() => handleAccept(escalation.id)}
                                disabled={!actionNotes.trim()}
                                className={cn(
                                  'flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2',
                                  actionNotes.trim()
                                    ? 'bg-emerald-500 active:opacity-80'
                                    : 'bg-slate-300 dark:bg-slate-700'
                                )}
                              >
                                <CheckCircle size={18} color="white" />
                                <Text className="text-white font-bold">Accept</Text>
                              </HapticPressable>

                              <HapticPressable
                                onPress={() => handleReject(escalation.id)}
                                disabled={!actionNotes.trim()}
                                className={cn(
                                  'flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2',
                                  actionNotes.trim()
                                    ? 'bg-red-500 active:opacity-80'
                                    : 'bg-slate-300 dark:bg-slate-700'
                                )}
                              >
                                <XCircle size={18} color="white" />
                                <Text className="text-white font-bold">Reject</Text>
                              </HapticPressable>
                            </View>

                            {/* Delegate option */}
                            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                              <Text className={cn('text-sm font-bold mb-2', 'text-blue-900 dark:text-blue-200')}>
                                Or Delegate To:
                              </Text>
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ flexGrow: 0 }}
                              >
                                <View className="flex-row gap-2">
                                  {availableDelegates.map((member) => (
                                    <HapticPressable
                                      key={member.id}
                                      onPress={() =>
                                        setSelectedDelegate(
                                          selectedDelegate === member.id ? null : member.id
                                        )
                                      }
                                      className={cn(
                                        'px-3 py-2 rounded-lg border',
                                        selectedDelegate === member.id
                                          ? 'bg-blue-500 border-blue-500'
                                          : isDark
                                          ? 'bg-slate-800 border-slate-700'
                                          : 'bg-white border-slate-200'
                                      )}
                                    >
                                      <Text
                                        className={cn(
                                          'text-sm font-medium',
                                          selectedDelegate === member.id
                                            ? 'text-white'
                                            : textPrimary
                                        )}
                                      >
                                        {member.name}
                                      </Text>
                                      <Text
                                        className={cn(
                                          'text-xs',
                                          selectedDelegate === member.id
                                            ? 'text-white/70'
                                            : textSecondary
                                        )}
                                      >
                                        {member.function}
                                      </Text>
                                    </HapticPressable>
                                  ))}
                                </View>
                              </ScrollView>
                              {selectedDelegate && (
                                <HapticPressable
                                  onPress={() => handleDelegate(escalation.id)}
                                  disabled={!actionNotes.trim()}
                                  className={cn(
                                    'mt-3 py-2.5 rounded-lg flex-row items-center justify-center gap-2',
                                    actionNotes.trim()
                                      ? 'bg-blue-500 active:opacity-80'
                                      : 'bg-blue-300 dark:bg-blue-800'
                                  )}
                                >
                                  <UserPlus size={16} color="white" />
                                  <Text className="text-white font-bold text-sm">
                                    Delegate to{' '}
                                    {members.find((m) => m.id === selectedDelegate)?.name}
                                  </Text>
                                </HapticPressable>
                              )}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
