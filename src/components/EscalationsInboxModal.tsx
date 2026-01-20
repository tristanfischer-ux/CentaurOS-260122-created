/**
 * Escalations Inbox Modal
 * Shows all pending escalations for Founders to review
 * Similar pattern to PendingAssignmentsModal
 */

import { View, Text, Modal, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { X, CheckCircle, UserPlus, XCircle, Calendar, AlertTriangle } from 'lucide-react-native';
import { useEscalationStore } from '@/lib/state/escalation-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { format } from 'date-fns';

interface EscalationsInboxModalProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
  currentMemberId: string;  // To check if Founder
}

export function EscalationsInboxModal({
  visible,
  onClose,
  workspaceId,
  currentMemberId,
}: EscalationsInboxModalProps) {
  const getPendingEscalations = useEscalationStore(s => s.getPendingEscalations);
  const acceptEscalation = useEscalationStore(s => s.acceptEscalation);
  const delegateEscalation = useEscalationStore(s => s.delegateEscalation);
  const rejectEscalation = useEscalationStore(s => s.rejectEscalation);
  const members = useOrganizationStore(s => s.members);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [additionalTUs, setAdditionalTUs] = useState('');
  const [selectedDelegate, setSelectedDelegate] = useState<string | null>(null);

  // Get pending escalations
  const pendingEscalations = getPendingEscalations(workspaceId);

  // Check if current user is a Founder
  const currentMember = members.find(m => m.id === currentMemberId);
  const isFounder = currentMember?.role === 'Founder';

  if (!isFounder) {
    return null; // Only Founders can access escalations inbox
  }

  const handleAccept = (escalationId: string) => {
    if (!actionNotes.trim()) {
      Alert.alert('Notes Required', 'Please provide notes for the team.');
      return;
    }

    const esc = pendingEscalations.find(e => e.id === escalationId);
    if (!esc) return;

    const changes: { newDueDate?: string; additionalTUs?: number; additionalMembers?: string[] } = {};

    if (newDueDate) changes.newDueDate = newDueDate;
    if (additionalTUs) changes.additionalTUs = parseInt(additionalTUs);

    acceptEscalation(escalationId, currentMemberId, actionNotes, changes);

    // Apply changes to task
    const task = workPlans.find(wp => wp.id === esc.workPlanId);
    if (task) {
      updateWorkPlan(esc.workPlanId, {
        dueDate: changes.newDueDate || task.dueDate,
        estimatedTimeUnits: task.estimatedTimeUnits + (changes.additionalTUs || 0),
        isEscalated: false,
        escalationHistory: [...(task.escalationHistory || []), escalationId],
      });
    }

    setExpandedId(null);
    setActionNotes('');
    setNewDueDate('');
    setAdditionalTUs('');
    Alert.alert('Escalation Accepted', 'The team has been notified of your decision.');
  };

  const handleDelegate = (escalationId: string) => {
    if (!selectedDelegate) {
      Alert.alert('Select Member', 'Please select who to delegate this to.');
      return;
    }

    if (!actionNotes.trim()) {
      Alert.alert('Notes Required', 'Please provide delegation notes.');
      return;
    }

    const member = members.find(m => m.id === selectedDelegate);
    if (!member) return;

    delegateEscalation(escalationId, currentMemberId, selectedDelegate, member.name, actionNotes);

    const esc = pendingEscalations.find(e => e.id === escalationId);
    if (esc) {
      const task = workPlans.find(wp => wp.id === esc.workPlanId);
      if (task) {
        updateWorkPlan(esc.workPlanId, {
          isEscalated: false,
          escalationHistory: [...(task.escalationHistory || []), escalationId],
        });
      }
    }

    setExpandedId(null);
    setActionNotes('');
    setSelectedDelegate(null);
    Alert.alert('Escalation Delegated', `Task has been assigned to ${member.name}.`);
  };

  const handleReject = (escalationId: string) => {
    if (!actionNotes.trim()) {
      Alert.alert('Feedback Required', 'Please provide guidance for why this was rejected.');
      return;
    }

    rejectEscalation(escalationId, currentMemberId, actionNotes);

    const esc = pendingEscalations.find(e => e.id === escalationId);
    if (esc) {
      const task = workPlans.find(wp => wp.id === esc.workPlanId);
      if (task) {
        updateWorkPlan(esc.workPlanId, {
          isEscalated: false,
          escalationHistory: [...(task.escalationHistory || []), escalationId],
        });
      }
    }

    setExpandedId(null);
    setActionNotes('');
    Alert.alert('Escalation Rejected', 'The team member has been notified with your feedback.');
  };

  const availableDelegates = members.filter(
    m => m.role === 'FractionalExec' && m.status === 'active'
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                  Escalations Inbox
                </Text>
                <Text className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {pendingEscalations.length} pending review{pendingEscalations.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            {/* Escalations List */}
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
              {pendingEscalations.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <AlertTriangle size={48} color="#94a3b8" />
                  <Text className="text-slate-500 dark:text-slate-400 text-center mt-4">
                    No pending escalations
                  </Text>
                  <Text className="text-slate-400 dark:text-slate-500 text-center text-sm mt-2">
                    All clear! Tasks are running smoothly.
                  </Text>
                </View>
              ) : (
                pendingEscalations.map((esc) => (
                  <View
                    key={esc.id}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-3"
                  >
                    {/* Escalation Summary */}
                    <Pressable onPress={() => setExpandedId(expandedId === esc.id ? null : esc.id)}>
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                            {esc.taskTitle}
                          </Text>
                          <Text className="text-sm text-slate-600 dark:text-slate-400">
                            Escalated by {esc.escalatedByName} • {esc.reasonLabel}
                          </Text>
                        </View>
                        <View className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                          <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
                            {format(new Date(esc.escalatedAt), 'MMM d')}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                        {esc.details}
                      </Text>

                      {/* Task Metadata */}
                      <View className="flex-row items-center gap-4 mt-3">
                        <View className="flex-row items-center gap-1">
                          <Calendar size={14} color="#64748b" />
                          <Text className="text-xs text-slate-600 dark:text-slate-400">
                            Due {format(new Date(esc.taskDueDate), 'MMM d')}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <AlertTriangle size={14} color="#64748b" />
                          <Text className="text-xs text-slate-600 dark:text-slate-400">
                            {esc.currentAllocations.length} assigned
                          </Text>
                        </View>
                      </View>
                    </Pressable>

                    {/* Expanded Actions */}
                    {expandedId === esc.id && (
                      <View className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <Text className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                          Your Response
                        </Text>

                        <TextInput
                          placeholder="Add notes for the team..."
                          value={actionNotes}
                          onChangeText={setActionNotes}
                          multiline
                          numberOfLines={3}
                          className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600"
                          placeholderTextColor="#94a3b8"
                        />

                        {/* Optional Changes */}
                        <View className="flex-row gap-2 mb-3">
                          <View className="flex-1">
                            <Text className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                              New Due Date (optional)
                            </Text>
                            <TextInput
                              placeholder="YYYY-MM-DD"
                              value={newDueDate}
                              onChangeText={setNewDueDate}
                              className="bg-white dark:bg-slate-800 rounded-lg p-2 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 text-sm"
                              placeholderTextColor="#94a3b8"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                              Additional TUs
                            </Text>
                            <TextInput
                              placeholder="0"
                              value={additionalTUs}
                              onChangeText={setAdditionalTUs}
                              keyboardType="number-pad"
                              className="bg-white dark:bg-slate-800 rounded-lg p-2 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 text-sm"
                              placeholderTextColor="#94a3b8"
                            />
                          </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row gap-2 mb-3">
                          <Pressable
                            onPress={() => handleAccept(esc.id)}
                            className="flex-1 bg-green-500 py-3 rounded-lg flex-row items-center justify-center gap-2 active:opacity-80"
                          >
                            <CheckCircle size={18} color="white" />
                            <Text className="text-white font-bold">Accept</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleReject(esc.id)}
                            className="flex-1 bg-red-500 py-3 rounded-lg flex-row items-center justify-center gap-2 active:opacity-80"
                          >
                            <XCircle size={18} color="white" />
                            <Text className="text-white font-bold">Reject</Text>
                          </Pressable>
                        </View>

                        {/* Delegate Option */}
                        <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <Text className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                            Or Delegate To:
                          </Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                            {availableDelegates.map((member) => (
                              <Pressable
                                key={member.id}
                                onPress={() => setSelectedDelegate(member.id)}
                                className={`mr-2 px-3 py-2 rounded-lg border ${
                                  selectedDelegate === member.id
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                                }`}
                              >
                                <Text
                                  className={`text-sm ${
                                    selectedDelegate === member.id
                                      ? 'text-white font-bold'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {member.name}
                                </Text>
                              </Pressable>
                            ))}
                          </ScrollView>
                          {selectedDelegate && (
                            <Pressable
                              onPress={() => handleDelegate(esc.id)}
                              className="mt-3 bg-blue-500 py-2.5 rounded-lg flex-row items-center justify-center gap-2 active:opacity-80"
                            >
                              <UserPlus size={16} color="white" />
                              <Text className="text-white font-bold text-sm">
                                Delegate to {members.find(m => m.id === selectedDelegate)?.name}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
