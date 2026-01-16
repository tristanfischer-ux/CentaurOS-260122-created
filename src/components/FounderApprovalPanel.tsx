/**
 * Founder Approval Panel
 *
 * Shows pending allocation requests from executives.
 * Founders can approve or reject requests with optional notes.
 * Also includes delegation settings configuration.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Check,
  X,
  ChevronRight,
  Settings,
  Users,
  Clock,
  AlertCircle,
  Shield,
} from 'lucide-react-native';
import {
  useAllocationRequestStore,
  type AllocationRequest,
} from '@/lib/state/allocation-request-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useCurrentMembership } from '@/lib/state/app-store';
import { usePermissions } from '@/lib/permissions';

interface RequestCardProps {
  request: AllocationRequest;
  onApprove: () => void;
  onReject: () => void;
  onViewDetails: () => void;
}

function RequestCard({ request, onApprove, onReject, onViewDetails }: RequestCardProps) {
  const daysSinceRequest = Math.floor(
    (Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-3 border border-gray-200 dark:border-slate-700">
      <Pressable onPress={onViewDetails}>
        {/* Header */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-gray-900 dark:text-white font-semibold">
              {request.requesterName}
            </Text>
            <Text className="text-gray-500 dark:text-slate-400 text-sm">
              wants to allocate {request.apprenticeName}
            </Text>
          </View>
          {daysSinceRequest === 0 ? (
            <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">NEW</Text>
            </View>
          ) : (
            <Text className="text-gray-400 dark:text-slate-500 text-xs">
              {daysSinceRequest}d ago
            </Text>
          )}
        </View>

        {/* Details */}
        <View className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 mb-3">
          <View className="flex-row items-center gap-4 mb-2">
            <View className="flex-row items-center gap-1">
              <Clock size={12} color="#64748b" />
              <Text className="text-gray-600 dark:text-slate-400 text-sm">
                {request.timeUnitsPerWeek}□/week
              </Text>
            </View>
            {request.durationWeeks && (
              <Text className="text-gray-600 dark:text-slate-400 text-sm">
                for {request.durationWeeks} weeks
              </Text>
            )}
          </View>
          {request.taskTitle && (
            <Text className="text-gray-700 dark:text-slate-300 text-sm">
              Task: {request.taskTitle}
            </Text>
          )}
        </View>

        {/* Justification preview */}
        <Text className="text-gray-600 dark:text-slate-400 text-sm mb-3" numberOfLines={2}>
          "{request.justification}"
        </Text>
      </Pressable>

      {/* Actions */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={onReject}
          className="flex-1 flex-row items-center justify-center py-3 bg-gray-100 dark:bg-slate-700 rounded-xl active:opacity-80"
        >
          <X size={16} color="#ef4444" />
          <Text className="text-gray-700 dark:text-slate-300 font-medium ml-2">Reject</Text>
        </Pressable>
        <Pressable
          onPress={onApprove}
          className="flex-1 flex-row items-center justify-center py-3 bg-emerald-500 rounded-xl active:opacity-80"
        >
          <Check size={16} color="white" />
          <Text className="text-white font-medium ml-2">Approve</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface RequestDetailModalProps {
  visible: boolean;
  onClose: () => void;
  request: AllocationRequest | null;
  onApprove: (note?: string) => void;
  onReject: (note?: string) => void;
}

function RequestDetailModal({
  visible,
  onClose,
  request,
  onApprove,
  onReject,
}: RequestDetailModalProps) {
  const [note, setNote] = useState('');
  const members = useOrganizationStore((s) => s.members);

  const requester = members.find((m) => m.id === request?.requesterId);
  const apprentice = members.find((m) => m.id === request?.apprenticeId);

  if (!request) return null;

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
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <Text className="text-gray-900 dark:text-white font-bold text-lg">
                Allocation Request
              </Text>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="p-4">
              {/* Requester */}
              <View className="mb-4">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2">
                  REQUESTED BY
                </Text>
                <View className="flex-row items-center bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                    <Text className="text-blue-600 dark:text-blue-400 font-bold">
                      {requester?.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {requester?.name}
                    </Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-sm">
                      {requester?.function} Executive
                    </Text>
                  </View>
                </View>
              </View>

              {/* Apprentice */}
              <View className="mb-4">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2">
                  REQUESTING ALLOCATION OF
                </Text>
                <View className="flex-row items-center bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {apprentice?.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      {apprentice?.name}
                    </Text>
                    <Text className="text-gray-500 dark:text-slate-400 text-sm">
                      {apprentice?.function} Apprentice
                    </Text>
                  </View>
                </View>
              </View>

              {/* Allocation Details */}
              <View className="mb-4">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2">
                  ALLOCATION DETAILS
                </Text>
                <View className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 dark:text-slate-400">Time Units</Text>
                    <Text className="text-gray-900 dark:text-white font-medium">
                      {request.timeUnitsPerWeek}□/week
                    </Text>
                  </View>
                  {request.durationWeeks && (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-gray-600 dark:text-slate-400">Duration</Text>
                      <Text className="text-gray-900 dark:text-white font-medium">
                        {request.durationWeeks} weeks
                      </Text>
                    </View>
                  )}
                  {request.taskTitle && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600 dark:text-slate-400">For Task</Text>
                      <Text className="text-gray-900 dark:text-white font-medium">
                        {request.taskTitle}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Justification */}
              <View className="mb-4">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2">
                  JUSTIFICATION
                </Text>
                <View className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                  <Text className="text-gray-700 dark:text-slate-300">
                    {request.justification}
                  </Text>
                </View>
              </View>

              {/* Response Note */}
              <View className="mb-6">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold mb-2">
                  ADD A NOTE (OPTIONAL)
                </Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add feedback for the requester..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white min-h-[80px]"
                />
              </View>

              {/* Actions */}
              <View className="flex-row gap-3 mb-6">
                <Pressable
                  onPress={() => onReject(note || undefined)}
                  className="flex-1 flex-row items-center justify-center py-4 bg-red-50 dark:bg-red-900/20 rounded-xl active:opacity-80"
                >
                  <X size={18} color="#ef4444" />
                  <Text className="text-red-600 dark:text-red-400 font-bold ml-2">Reject</Text>
                </Pressable>
                <Pressable
                  onPress={() => onApprove(note || undefined)}
                  className="flex-1 flex-row items-center justify-center py-4 bg-emerald-500 rounded-xl active:opacity-80"
                >
                  <Check size={18} color="white" />
                  <Text className="text-white font-bold ml-2">Approve</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface DelegationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

function DelegationSettingsModal({ visible, onClose }: DelegationSettingsModalProps) {
  const delegationSettings = useAllocationRequestStore((s) => s.delegationSettings);
  const updateDelegationSettings = useAllocationRequestStore((s) => s.updateDelegationSettings);
  const membership = useCurrentMembership();

  const handleToggle = (key: 'directReportDelegation' | 'fullDelegation', value: boolean) => {
    updateDelegationSettings({ [key]: value }, membership?.userId ?? 'unknown');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <View className="flex-row items-center gap-2">
                <Shield size={20} color="#8b5cf6" />
                <Text className="text-gray-900 dark:text-white font-bold text-lg">
                  Delegation Settings
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <View className="p-4">
              <Text className="text-gray-500 dark:text-slate-400 text-sm mb-4">
                Control how much authority executives have to allocate apprentices without your approval.
              </Text>

              {/* Direct Report Delegation */}
              <View className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-slate-800">
                <View className="flex-1 mr-4">
                  <Text className="text-gray-900 dark:text-white font-medium">
                    Direct Report Delegation
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                    Allow executives to allocate their direct reports without approval
                  </Text>
                </View>
                <Switch
                  value={delegationSettings.directReportDelegation}
                  onValueChange={(v) => handleToggle('directReportDelegation', v)}
                  trackColor={{ false: '#cbd5e1', true: '#8b5cf6' }}
                  thumbColor="white"
                />
              </View>

              {/* Full Delegation */}
              <View className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-slate-800">
                <View className="flex-1 mr-4">
                  <Text className="text-gray-900 dark:text-white font-medium">
                    Full Delegation
                  </Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                    Allow executives to allocate ANY apprentice without approval
                  </Text>
                </View>
                <Switch
                  value={delegationSettings.fullDelegation}
                  onValueChange={(v) => handleToggle('fullDelegation', v)}
                  trackColor={{ false: '#cbd5e1', true: '#8b5cf6' }}
                  thumbColor="white"
                />
              </View>

              {/* Warning */}
              {delegationSettings.fullDelegation && (
                <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mt-4 flex-row items-start">
                  <AlertCircle size={16} color="#f59e0b" />
                  <Text className="text-amber-700 dark:text-amber-400 text-sm ml-2 flex-1">
                    Full delegation gives executives complete control over apprentice allocation. Use with caution.
                  </Text>
                </View>
              )}

              <Pressable
                onPress={onClose}
                className="bg-gray-100 dark:bg-slate-800 py-4 rounded-xl mt-6 items-center"
              >
                <Text className="text-gray-700 dark:text-slate-300 font-medium">Done</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function FounderApprovalPanel() {
  const [selectedRequest, setSelectedRequest] = useState<AllocationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const membership = useCurrentMembership();
  const { role } = usePermissions();
  const pendingRequests = useAllocationRequestStore((s) => s.getPendingRequests());
  const approveRequest = useAllocationRequestStore((s) => s.approveRequest);
  const rejectRequest = useAllocationRequestStore((s) => s.rejectRequest);

  const currentMember = useOrganizationStore((s) =>
    s.members.find((m) => m.id === membership?.userId)
  );

  const handleApprove = (request: AllocationRequest, note?: string) => {
    approveRequest(
      request.id,
      currentMember?.id ?? '',
      currentMember?.name ?? 'Founder',
      note
    );
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  const handleReject = (request: AllocationRequest, note?: string) => {
    rejectRequest(
      request.id,
      currentMember?.id ?? '',
      currentMember?.name ?? 'Founder',
      note
    );
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  // Only founders see this panel
  if (role !== 'Founder') return null;

  return (
    <View className="mb-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3 px-4">
        <View className="flex-row items-center gap-2">
          <Bell size={18} color="#8b5cf6" />
          <Text className="text-gray-900 dark:text-white font-semibold text-lg">
            Pending Approvals
          </Text>
          {pendingRequests.length > 0 && (
            <View className="bg-red-500 w-5 h-5 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">
                {pendingRequests.length}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => setShowSettingsModal(true)}
          className="p-2"
        >
          <Settings size={20} color="#64748b" />
        </Pressable>
      </View>

      {/* Requests */}
      <View className="px-4">
        {pendingRequests.length === 0 ? (
          <View className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 items-center">
            <Check size={32} color="#10b981" />
            <Text className="text-gray-600 dark:text-slate-400 mt-2 text-center">
              No pending requests
            </Text>
          </View>
        ) : (
          pendingRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={() => handleApprove(request)}
              onReject={() => handleReject(request)}
              onViewDetails={() => {
                setSelectedRequest(request);
                setShowDetailModal(true);
              }}
            />
          ))
        )}
      </View>

      {/* Detail Modal */}
      <RequestDetailModal
        visible={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onApprove={(note) => selectedRequest && handleApprove(selectedRequest, note)}
        onReject={(note) => selectedRequest && handleReject(selectedRequest, note)}
      />

      {/* Settings Modal */}
      <DelegationSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </View>
  );
}
