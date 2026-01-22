/**
 * UrgentDecisionsSection
 * Displays critical decisions requiring immediate action at the top of the home screen
 */

import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  Clock,
  X,
  ChevronRight,
  CheckCircle2,
  User,
  DollarSign,
  Briefcase,
  Target,
  Scale,
  FileText,
  Users,
  Check,
  Link as LinkIcon,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useDecisionsStore, type Decision, type UrgencyLevel } from '@/lib/state/decisions-store';
import { useAllocationRequestStore, type AllocationRequest } from '@/lib/state/allocation-request-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useCurrentMembership } from '@/lib/state/app-store';

const URGENCY_COLORS: Record<UrgencyLevel, { bg: string; text: string; border: string; gradient: [string, string] }> = {
  critical: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', gradient: ['#ef4444', '#dc2626'] },
  high: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', gradient: ['#f97316', '#ea580c'] },
  normal: { bg: '#fefce8', text: '#ca8a04', border: '#fef08a', gradient: ['#eab308', '#ca8a04'] },
};

const CATEGORY_ICONS: Record<Decision['category'], React.ComponentType<any>> = {
  hiring: User,
  budget: DollarSign,
  strategy: Target,
  operations: Briefcase,
  product: Target,
  legal: Scale,
};

function getTimeRemaining(deadline?: string): string {
  if (!deadline) return '';
  const now = new Date();
  const due = new Date(deadline);
  const diffMs = due.getTime() - now.getTime();

  if (diffMs < 0) return 'Overdue';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  return 'Due soon';
}

interface DecisionCardProps {
  decision: Decision;
  onPress: () => void;
  index: number;
}

function DecisionCard({ decision, onPress, index }: DecisionCardProps) {
  const router = useRouter();
  const colors = URGENCY_COLORS[decision.urgency];
  const Icon = CATEGORY_ICONS[decision.category] || FileText;
  const timeRemaining = getTimeRemaining(decision.deadline);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={onPress}
        className="rounded-xl overflow-hidden mb-3 active:opacity-90"
        style={{ borderWidth: 2, borderColor: colors.border }}
      >
        <LinearGradient
          colors={[colors.bg, '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ padding: 16 }}
        >
          {/* Header */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-row items-center gap-2 flex-1">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.text + '20' }}
              >
                <Icon size={16} color={colors.text} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
                  {decision.title}
                </Text>
                <Text className="text-slate-500 text-xs capitalize">
                  {decision.category} • {decision.requiredDecisionMaker}
                </Text>
              </View>
            </View>

            {/* Urgency Badge */}
            <View
              className="px-2 py-1 rounded-full flex-row items-center gap-1"
              style={{ backgroundColor: colors.text + '20' }}
            >
              {decision.urgency === 'critical' && <AlertTriangle size={10} color={colors.text} />}
              <Text className="text-xs font-bold uppercase" style={{ color: colors.text }}>
                {decision.urgency}
              </Text>
            </View>
          </View>

          {/* Urgency Reason */}
          {decision.urgencyReason && (
            <View className="flex-row items-start gap-2 mb-2 p-2 rounded-lg" style={{ backgroundColor: colors.text + '10' }}>
              <AlertTriangle size={12} color={colors.text} style={{ marginTop: 2 }} />
              <Text className="text-slate-700 text-xs flex-1 font-medium">
                {decision.urgencyReason}
              </Text>
            </View>
          )}

          {/* Question */}
          <Text className="text-slate-700 text-sm mb-2" numberOfLines={2}>
            {decision.question}
          </Text>

          {/* Links to related items */}
          {(decision.linkedOKRId || decision.linkedTaskId) && (
            <View className="flex-row items-center gap-3 mb-2">
              {decision.linkedOKRId && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push('/(tabs)/why');
                  }}
                  className="flex-row items-center gap-1 bg-blue-100 px-2 py-1 rounded active:opacity-70"
                >
                  <Target size={10} color="#3b82f6" />
                  <Text className="text-blue-600 text-xs font-medium">View OKR</Text>
                  <ChevronRight size={10} color="#3b82f6" />
                </Pressable>
              )}
              {decision.linkedTaskId && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push('/(tabs)/what');
                  }}
                  className="flex-row items-center gap-1 bg-green-100 px-2 py-1 rounded active:opacity-70"
                >
                  <CheckCircle2 size={10} color="#10b981" />
                  <Text className="text-green-600 text-xs font-medium">View Task</Text>
                  <ChevronRight size={10} color="#10b981" />
                </Pressable>
              )}
            </View>
          )}

          {/* Footer */}
          <View className="flex-row items-center justify-between">
            {timeRemaining ? (
              <View className="flex-row items-center gap-1">
                <Clock size={12} color={colors.text} />
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  {timeRemaining}
                </Text>
              </View>
            ) : (
              <View />
            )}

            <View className="flex-row items-center gap-1">
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                View Details
              </Text>
              <ChevronRight size={14} color={colors.text} />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

interface AllocationRequestCardProps {
  request: AllocationRequest;
  onPress: () => void;
  index: number;
}

function AllocationRequestCard({ request, onPress, index }: AllocationRequestCardProps) {
  const colors = URGENCY_COLORS['critical']; // Allocation requests are always critical
  const daysSinceRequest = Math.floor(
    (Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={onPress}
        className="rounded-xl overflow-hidden mb-3 active:opacity-90"
        style={{ borderWidth: 2, borderColor: colors.border }}
      >
        <LinearGradient
          colors={[colors.bg, '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ padding: 16 }}
        >
          {/* Header */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-row items-center gap-2 flex-1">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.text + '20' }}
              >
                <Users size={16} color={colors.text} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
                  Allocation Request: {request.apprenticeName}
                </Text>
                <Text className="text-slate-500 text-xs">
                  hiring • {request.requesterName}
                </Text>
              </View>
            </View>

            {/* Urgency Badge */}
            <View
              className="px-2 py-1 rounded-full flex-row items-center gap-1"
              style={{ backgroundColor: colors.text + '20' }}
            >
              <AlertTriangle size={10} color={colors.text} />
              <Text className="text-xs font-bold uppercase" style={{ color: colors.text }}>
                CRITICAL
              </Text>
            </View>
          </View>

          {/* Question */}
          <Text className="text-slate-700 text-sm mb-2" numberOfLines={2}>
            Should we allocate {request.apprenticeName} ({request.timeUnitsPerWeek}□/wk
            {request.durationWeeks ? ` for ${request.durationWeeks} weeks` : ''}) to {request.taskTitle || request.objectiveTitle || 'this work'}?
          </Text>

          {/* Footer */}
          <View className="flex-row items-center justify-between">
            {daysSinceRequest === 0 ? (
              <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                <Text className="text-blue-600 text-xs font-bold">NEW</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                <Clock size={12} color={colors.text} />
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  {daysSinceRequest}d ago
                </Text>
              </View>
            )}

            <View className="flex-row items-center gap-1">
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                View Details
              </Text>
              <ChevronRight size={14} color={colors.text} />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

interface DecisionDetailModalProps {
  decision: Decision | null;
  visible: boolean;
  onClose: () => void;
  onDecide: (decisionId: string, optionId: string) => void;
}

function DecisionDetailModal({ decision, visible, onClose, onDecide }: DecisionDetailModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!decision) return null;

  const colors = URGENCY_COLORS[decision.urgency];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={20} color="white" />
                  <Text className="text-white/80 text-xs font-bold uppercase">
                    {decision.urgency} Decision
                  </Text>
                </View>
                <Pressable onPress={onClose} className="bg-white/20 p-2 rounded-full">
                  <X size={18} color="white" />
                </Pressable>
              </View>
              <Text className="text-white font-bold text-xl">{decision.title}</Text>
              {decision.deadline && (
                <View className="flex-row items-center gap-1 mt-2">
                  <Clock size={14} color="white" />
                  <Text className="text-white/90 text-sm">
                    {getTimeRemaining(decision.deadline)}
                  </Text>
                </View>
              )}
            </LinearGradient>

            <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Question */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">
                  Decision Required
                </Text>
                <Text className="text-slate-900 dark:text-white text-lg font-semibold">
                  {decision.question}
                </Text>
              </View>

              {/* Context */}
              <View className="mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">
                  Context
                </Text>
                <Text className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {decision.context}
                </Text>
              </View>

              {/* Options */}
              {decision.options && decision.options.length > 0 && (
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-3">
                    Options
                  </Text>
                  <View className="gap-2">
                    {decision.options.map((option) => (
                      <Pressable
                        key={option.id}
                        onPress={() => setSelectedOption(option.id)}
                        className={`rounded-xl p-4 border-2 ${
                          selectedOption === option.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-slate-900 dark:text-white font-bold text-sm">
                            {option.label}
                          </Text>
                          {option.recommended && (
                            <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                              <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                RECOMMENDED
                              </Text>
                            </View>
                          )}
                        </View>
                        {option.description && (
                          <Text className="text-slate-600 dark:text-slate-400 text-xs mb-1">
                            {option.description}
                          </Text>
                        )}
                        {option.impact && (
                          <Text className="text-slate-500 dark:text-slate-500 text-xs italic">
                            Impact: {option.impact}
                          </Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="gap-3 mt-4">
                <Pressable
                  onPress={() => {
                    if (selectedOption) {
                      onDecide(decision.id, selectedOption);
                      onClose();
                    }
                  }}
                  disabled={!selectedOption}
                  className={`py-4 rounded-xl items-center ${
                    selectedOption ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <CheckCircle2 size={18} color="white" />
                    <Text className="text-white font-bold text-base">
                      {selectedOption ? 'Confirm Decision' : 'Select an Option'}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  className="py-3 rounded-xl items-center border-2 border-slate-200 dark:border-slate-700"
                >
                  <Text className="text-slate-600 dark:text-slate-400 font-semibold text-sm">
                    Decide Later
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface AllocationRequestDetailModalProps {
  request: AllocationRequest | null;
  visible: boolean;
  onClose: () => void;
  onApprove: (note?: string) => void;
  onReject: (note?: string) => void;
}

function AllocationRequestDetailModal({
  request,
  visible,
  onClose,
  onApprove,
  onReject,
}: AllocationRequestDetailModalProps) {
  const [note, setNote] = useState('');
  const members = useOrganizationStore((s) => s.members);

  if (!request) return null;

  const requester = members.find((m) => m.id === request.requesterId);
  const apprentice = members.find((m) => m.id === request.apprenticeId);
  const colors = URGENCY_COLORS['critical'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Users size={20} color="white" />
                  <Text className="text-white/80 text-xs font-bold uppercase">
                    Allocation Request
                  </Text>
                </View>
                <Pressable onPress={onClose} className="bg-white/20 p-2 rounded-full">
                  <X size={18} color="white" />
                </Pressable>
              </View>
              <Text className="text-white font-bold text-xl">
                Allocate {request.apprenticeName}?
              </Text>
            </LinearGradient>

            <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Requester */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">
                  Requested By
                </Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                    <Text className="text-blue-600 dark:text-blue-400 font-bold">
                      {requester?.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-slate-900 dark:text-white font-semibold">
                      {requester?.name}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      {requester?.function} Executive
                    </Text>
                  </View>
                </View>
              </View>

              {/* Apprentice */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">
                  Requesting Allocation Of
                </Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {apprentice?.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-slate-900 dark:text-white font-semibold">
                      {apprentice?.name}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      {apprentice?.function} Apprentice
                    </Text>
                  </View>
                </View>
              </View>

              {/* Allocation Details */}
              <View className="mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-3">
                  Allocation Details
                </Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-600 dark:text-slate-400">Time Units</Text>
                  <Text className="text-slate-900 dark:text-white font-medium">
                    {request.timeUnitsPerWeek}□/week
                  </Text>
                </View>
                {request.durationWeeks && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-600 dark:text-slate-400">Duration</Text>
                    <Text className="text-slate-900 dark:text-white font-medium">
                      {request.durationWeeks} weeks
                    </Text>
                  </View>
                )}
                {request.taskTitle && (
                  <View className="flex-row justify-between">
                    <Text className="text-slate-600 dark:text-slate-400">For Task</Text>
                    <Text className="text-slate-900 dark:text-white font-medium">
                      {request.taskTitle}
                    </Text>
                  </View>
                )}
              </View>

              {/* Justification */}
              <View className="mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">
                  Justification
                </Text>
                <Text className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {request.justification}
                </Text>
              </View>

              {/* Response Note */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">
                  Add Note (Optional)
                </Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add feedback for the requester..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white min-h-[80px]"
                />
              </View>

              {/* Action Buttons */}
              <View className="gap-3 mt-4">
                <Pressable
                  onPress={() => {
                    onApprove(note || undefined);
                    onClose();
                    setNote('');
                  }}
                  className="py-4 rounded-xl items-center bg-emerald-500 active:opacity-80"
                >
                  <View className="flex-row items-center gap-2">
                    <Check size={18} color="white" />
                    <Text className="text-white font-bold text-base">
                      Approve Allocation
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => {
                    onReject(note || undefined);
                    onClose();
                    setNote('');
                  }}
                  className="py-3 rounded-xl items-center border-2 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                >
                  <View className="flex-row items-center gap-2">
                    <X size={18} color="#ef4444" />
                    <Text className="text-red-600 dark:text-red-400 font-semibold text-sm">
                      Reject Request
                    </Text>
                  </View>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function UrgentDecisionsSection() {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AllocationRequest | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const membership = useCurrentMembership();
  const currentMember = useOrganizationStore((s) =>
    s.members.find((m) => m.id === membership?.userId)
  );

  const initialize = useDecisionsStore((s) => s.initialize);
  const getUrgentDecisions = useDecisionsStore((s) => s.getUrgentDecisions);
  const makeDecision = useDecisionsStore((s) => s.makeDecision);

  // Get allocation requests
  const allRequests = useAllocationRequestStore((s) => s.requests);
  const approveRequest = useAllocationRequestStore((s) => s.approveRequest);
  const rejectRequest = useAllocationRequestStore((s) => s.rejectRequest);

  const pendingRequests = useMemo(
    () => allRequests.filter((req) => req.status === 'pending'),
    [allRequests]
  );

  // Initialize on mount
  useState(() => {
    initialize();
  });

  const urgentDecisions = getUrgentDecisions();

  // Combine allocation requests + urgent decisions
  const totalUrgentItems = pendingRequests.length + urgentDecisions.length;

  if (totalUrgentItems === 0) {
    return null;
  }

  const criticalCount = urgentDecisions.filter((d) => d.urgency === 'critical').length + pendingRequests.length; // All requests are critical
  const highCount = urgentDecisions.filter((d) => d.urgency === 'high').length;

  const handleApproveRequest = (request: AllocationRequest, note?: string) => {
    approveRequest(
      request.id,
      currentMember?.id ?? '',
      currentMember?.name ?? 'Founder',
      note
    );
  };

  const handleRejectRequest = (request: AllocationRequest, note?: string) => {
    rejectRequest(
      request.id,
      currentMember?.id ?? '',
      currentMember?.name ?? 'Founder',
      note
    );
  };

  return (
    <View className="mb-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="bg-red-500 p-1.5 rounded-lg">
            <AlertTriangle size={16} color="white" />
          </View>
          <Text className="text-slate-900 dark:text-white font-bold text-base">
            Urgent Decisions
          </Text>
          <View className="bg-red-500 px-2 py-0.5 rounded-full">
            <Text className="text-white text-xs font-bold">{totalUrgentItems}</Text>
          </View>
        </View>

        {/* Urgency Summary */}
        <View className="flex-row gap-1">
          {criticalCount > 0 && (
            <View className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
              <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
                {criticalCount} critical
              </Text>
            </View>
          )}
          {highCount > 0 && (
            <View className="bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
              <Text className="text-orange-600 dark:text-orange-400 text-xs font-bold">
                {highCount} high
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Cards - Allocation Requests FIRST (most urgent), then Decisions */}
      <View>
        {/* Allocation Request Cards */}
        {pendingRequests.slice(0, 3).map((request, index) => (
          <AllocationRequestCard
            key={request.id}
            request={request}
            index={index}
            onPress={() => {
              setSelectedRequest(request);
              setShowRequestModal(true);
            }}
          />
        ))}

        {/* Decision Cards */}
        {urgentDecisions.slice(0, Math.max(0, 3 - pendingRequests.length)).map((decision, index) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            index={pendingRequests.length + index}
            onPress={() => {
              setSelectedDecision(decision);
              setShowDecisionModal(true);
            }}
          />
        ))}

        {totalUrgentItems > 3 && (
          <Pressable className="py-2 items-center">
            <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
              View {totalUrgentItems - 3} more urgent items
            </Text>
          </Pressable>
        )}
      </View>

      {/* Allocation Request Detail Modal */}
      <AllocationRequestDetailModal
        request={selectedRequest}
        visible={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedRequest(null);
        }}
        onApprove={(note) => {
          if (selectedRequest) {
            handleApproveRequest(selectedRequest, note);
          }
        }}
        onReject={(note) => {
          if (selectedRequest) {
            handleRejectRequest(selectedRequest, note);
          }
        }}
      />

      {/* Decision Detail Modal */}
      <DecisionDetailModal
        decision={selectedDecision}
        visible={showDecisionModal}
        onClose={() => {
          setShowDecisionModal(false);
          setSelectedDecision(null);
        }}
        onDecide={(decisionId, optionId) => {
          makeDecision(decisionId, optionId, 'Founder');
        }}
      />
    </View>
  );
}
