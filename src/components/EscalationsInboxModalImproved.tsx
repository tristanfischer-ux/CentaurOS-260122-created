/**
 * EscalationsInboxModalImproved - Full-screen, readable escalation management
 *
 * Improvements:
 * - Full-screen modal instead of bottom sheet
 * - 3xl headers (32px) and large body text (lg/xl/2xl)
 * - Color-coded urgency badges
 * - Native DateTimePicker instead of text input
 * - TU stepper instead of number pad
 * - Clear delegation UI
 * - Large, readable action buttons
 */

import { View, Text, Modal, Pressable, SafeAreaView, ScrollView, TextInput, Platform } from 'react-native';
import { useState } from 'react';
import {
  X, CheckCircle, XCircle, UserPlus, Calendar, Clock,
  AlertTriangle, Users, TrendingUp, Minus, Plus
} from 'lucide-react-native';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { cn } from '@/lib/cn';
import { useEscalationStore } from '@/lib/state/escalation-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import type { EscalationRequest } from '@/lib/state/escalation-store';

interface EscalationsInboxModalImprovedProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
  currentMemberId: string;
}

export function EscalationsInboxModalImproved({
  visible,
  onClose,
  workspaceId,
  currentMemberId,
}: EscalationsInboxModalImprovedProps) {
  const getPendingEscalations = useEscalationStore(s => s.getPendingEscalations);
  const acceptEscalation = useEscalationStore(s => s.acceptEscalation);
  const delegateEscalation = useEscalationStore(s => s.delegateEscalation);
  const rejectEscalation = useEscalationStore(s => s.rejectEscalation);
  const members = useOrganizationStore(s => s.members);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const workPlans = useWorkPlanStore(s => s.workPlans);

  const [selectedEscalation, setSelectedEscalation] = useState<EscalationRequest | null>(null);
  const [actionMode, setActionMode] = useState<'none' | 'accept' | 'delegate' | 'reject'>('none');
  const [responseNotes, setResponseNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date());
  const [additionalTUs, setAdditionalTUs] = useState(0);
  const [selectedDelegate, setSelectedDelegate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pendingEscalations = getPendingEscalations(workspaceId);
  const currentMember = members.find(m => m.id === currentMemberId);
  const isFounder = currentMember?.role === 'Founder';

  if (!isFounder) return null;

  const availableDelegates = members.filter(
    m => m.role === 'FractionalExec' && m.status === 'active'
  );

  const handleAccept = () => {
    if (!selectedEscalation || !responseNotes.trim()) {
      alert('Please provide notes for the team');
      return;
    }

    const esc = pendingEscalations.find(e => e.id === selectedEscalation.id);
    if (!esc) return;

    const changes: any = {};
    if (newDueDate) changes.newDueDate = format(newDueDate, 'yyyy-MM-dd');
    if (additionalTUs > 0) changes.additionalTUs = additionalTUs;

    acceptEscalation(selectedEscalation.id, currentMemberId, responseNotes, changes);

    // Apply changes to task
    const task = workPlans.find(wp => wp.id === esc.workPlanId);
    if (task) {
      updateWorkPlan(esc.workPlanId, {
        dueDate: changes.newDueDate || task.dueDate,
        estimatedTimeUnits: task.estimatedTimeUnits + (changes.additionalTUs || 0),
        isEscalated: false,
        escalationHistory: [...(task.escalationHistory || []), selectedEscalation.id],
      });
    }

    resetForm();
    alert('Escalation accepted! The team has been notified.');
  };

  const handleDelegate = () => {
    if (!selectedEscalation || !selectedDelegate || !responseNotes.trim()) {
      alert('Please select a delegate and provide notes');
      return;
    }

    const member = members.find(m => m.id === selectedDelegate);
    if (!member) return;

    delegateEscalation(
      selectedEscalation.id,
      currentMemberId,
      selectedDelegate,
      member.name,
      responseNotes
    );

    const esc = pendingEscalations.find(e => e.id === selectedEscalation.id);
    if (esc) {
      const task = workPlans.find(wp => wp.id === esc.workPlanId);
      if (task) {
        updateWorkPlan(esc.workPlanId, {
          isEscalated: false,
          escalationHistory: [...(task.escalationHistory || []), selectedEscalation.id],
        });
      }
    }

    resetForm();
    alert(`Escalation delegated to ${member.name}`);
  };

  const handleReject = () => {
    if (!selectedEscalation || !responseNotes.trim()) {
      alert('Please provide feedback for why this was rejected');
      return;
    }

    rejectEscalation(selectedEscalation.id, currentMemberId, responseNotes);

    const esc = pendingEscalations.find(e => e.id === selectedEscalation.id);
    if (esc) {
      const task = workPlans.find(wp => wp.id === esc.workPlanId);
      if (task) {
        updateWorkPlan(esc.workPlanId, {
          isEscalated: false,
          escalationHistory: [...(task.escalationHistory || []), selectedEscalation.id],
        });
      }
    }

    resetForm();
    alert('Escalation rejected. The team member has been notified with your feedback.');
  };

  const resetForm = () => {
    setSelectedEscalation(null);
    setActionMode('none');
    setResponseNotes('');
    setAdditionalTUs(0);
    setSelectedDelegate(null);
  };

  // Map escalation reason to urgency level
  const getUrgency = (esc: EscalationRequest): 'critical' | 'high' | 'medium' => {
    // Critical: blocked or timeline issues
    if (esc.reason === 'blocked' || esc.reason === 'timeline_issue') {
      return 'critical';
    }
    // High: resource constraints or complexity
    if (esc.reason === 'resource_constraint' || esc.reason === 'complexity') {
      return 'high';
    }
    // Medium: scope unclear or other
    return 'medium';
  };

  // Calculate task progress from work plan
  const getTaskProgress = (esc: EscalationRequest): number => {
    const task = workPlans.find(wp => wp.id === esc.workPlanId);
    if (!task) return 0;

    // Calculate based on status
    switch (task.status) {
      case 'not-started': return 0;
      case 'in-progress': return 50; // Estimate
      case 'completed': return 100;
      default: return 25;
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
        <View className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                Escalations
              </Text>
              <Text className="text-lg text-slate-600 dark:text-slate-400 mt-1">
                {pendingEscalations.length} need your attention
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center active:opacity-70"
            >
              <X size={28} color="#64748b" />
            </Pressable>
          </View>
        </View>

        {/* Escalation Cards */}
        <ScrollView className="flex-1 px-6 py-4">
          {pendingEscalations.length === 0 ? (
            <View className="items-center justify-center py-20">
              <CheckCircle size={64} color="#10b981" />
              <Text className="text-2xl font-bold text-slate-900 dark:text-white mt-4">
                All Clear!
              </Text>
              <Text className="text-lg text-slate-600 dark:text-slate-400 text-center mt-2">
                No escalations need your review
              </Text>
            </View>
          ) : (
            pendingEscalations.map((esc) => {
              const urgency = getUrgency(esc);
              const taskProgress = getTaskProgress(esc);

              return (
              <View
                key={esc.id}
                className={cn(
                  'rounded-2xl p-6 mb-4 border-l-8',
                  urgency === 'critical'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                    : urgency === 'high'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                )}
              >
                {/* Urgency Badge */}
                <View className="flex-row items-center justify-between mb-4">
                  <View
                    className={cn(
                      'px-4 py-2 rounded-xl',
                      urgency === 'critical'
                        ? 'bg-red-500'
                        : urgency === 'high'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    )}
                  >
                    <Text className="text-white font-bold text-base">
                      {urgency.toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Clock size={18} color="#64748b" />
                    <Text className="text-slate-600 dark:text-slate-400 text-base ml-2">
                      {format(new Date(esc.escalatedAt), 'MMM d, h:mm a')}
                    </Text>
                  </View>
                </View>

                {/* Task Title */}
                <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  {esc.taskTitle}
                </Text>

                {/* Reason */}
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
                    REASON FOR ESCALATION
                  </Text>
                  <Text className="text-lg text-slate-900 dark:text-white font-semibold mb-2">
                    {esc.reasonLabel}
                  </Text>
                  <Text className="text-base text-slate-700 dark:text-slate-300">
                    {esc.details}
                  </Text>
                </View>

                {/* Who Escalated */}
                <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-xl p-4 mb-4">
                  <View className="w-12 h-12 bg-purple-500 rounded-full items-center justify-center">
                    <Text className="text-white font-bold text-lg">
                      {esc.escalatedByName.charAt(0)}
                    </Text>
                  </View>
                  <View className="ml-4">
                    <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                      {esc.escalatedByName}
                    </Text>
                    <Text className="text-base text-slate-600 dark:text-slate-400">
                      Escalated this task
                    </Text>
                  </View>
                </View>

                {/* Task Context */}
                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4">
                  <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">
                    TASK DETAILS
                  </Text>
                  <View className="flex-row justify-between">
                    <View className="items-center">
                      <Calendar size={20} color="#64748b" />
                      <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Due Date
                      </Text>
                      <Text className="text-lg font-bold text-slate-900 dark:text-white">
                        {format(new Date(esc.taskDueDate), 'MMM d')}
                      </Text>
                    </View>
                    <View className="items-center">
                      <Users size={20} color="#64748b" />
                      <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Team Size
                      </Text>
                      <Text className="text-lg font-bold text-slate-900 dark:text-white">
                        {esc.currentAllocations.length}
                      </Text>
                    </View>
                    <View className="items-center">
                      <TrendingUp size={20} color="#64748b" />
                      <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Progress
                      </Text>
                      <Text className="text-lg font-bold text-slate-900 dark:text-white">
                        {taskProgress}%
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                {selectedEscalation?.id === esc.id ? (
                  <View className="bg-white dark:bg-slate-800 rounded-xl p-5">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                      Your Response
                    </Text>

                    {/* Response Notes */}
                    <TextInput
                      placeholder="Add your notes for the team..."
                      placeholderTextColor="#94a3b8"
                      value={responseNotes}
                      onChangeText={setResponseNotes}
                      multiline
                      numberOfLines={6}
                      className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 text-base text-slate-900 dark:text-white mb-4"
                      style={{ minHeight: 120, textAlignVertical: 'top' }}
                    />

                    {/* Accept Mode */}
                    {actionMode === 'accept' && (
                      <View className="gap-3 mb-4">
                        {/* Date Picker */}
                        <View>
                          <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                            Extend Due Date (Optional)
                          </Text>
                          <Pressable
                            onPress={() => setShowDatePicker(true)}
                            className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 flex-row items-center justify-between"
                          >
                            <Text className="text-base text-slate-900 dark:text-white">
                              {format(newDueDate, 'MMMM d, yyyy')}
                            </Text>
                            <Calendar size={20} color="#64748b" />
                          </Pressable>
                        </View>

                        {/* TU Stepper */}
                        <View>
                          <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                            Add Extra Time Units
                          </Text>
                          <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <Pressable
                              onPress={() => setAdditionalTUs(Math.max(0, additionalTUs - 1))}
                              className="p-4 active:opacity-50"
                            >
                              <Minus size={24} color="#64748b" />
                            </Pressable>
                            <View className="flex-1 items-center">
                              <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                                +{additionalTUs} TU
                              </Text>
                            </View>
                            <Pressable
                              onPress={() => setAdditionalTUs(additionalTUs + 1)}
                              className="p-4 active:opacity-50"
                            >
                              <Plus size={24} color="#64748b" />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Delegate Mode */}
                    {actionMode === 'delegate' && (
                      <View className="mb-4">
                        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                          Delegate To
                        </Text>
                        <View className="gap-2">
                          {availableDelegates.map((member) => (
                            <Pressable
                              key={member.id}
                              onPress={() => setSelectedDelegate(member.id)}
                              className={cn(
                                'flex-row items-center p-4 rounded-xl border-2',
                                selectedDelegate === member.id
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                  : 'bg-slate-50 dark:bg-slate-900 border-transparent'
                              )}
                            >
                              <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center">
                                <Text className="text-white font-bold">
                                  {member.name.charAt(0)}
                                </Text>
                              </View>
                              <View className="ml-3">
                                <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                                  {member.name}
                                </Text>
                                <Text className="text-sm text-slate-600 dark:text-slate-400">
                                  {member.function} • {member.role}
                                </Text>
                              </View>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={resetForm}
                        className="flex-1 bg-slate-200 dark:bg-slate-700 py-4 rounded-xl items-center active:opacity-70"
                      >
                        <Text className="text-slate-700 dark:text-slate-300 font-bold text-lg">
                          Cancel
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={
                          actionMode === 'accept' ? handleAccept :
                          actionMode === 'delegate' ? handleDelegate :
                          handleReject
                        }
                        disabled={!responseNotes.trim() || (actionMode === 'delegate' && !selectedDelegate)}
                        className={cn(
                          'flex-1 py-4 rounded-xl items-center',
                          actionMode === 'accept' ? 'bg-emerald-500' :
                          actionMode === 'delegate' ? 'bg-blue-500' :
                          'bg-red-500'
                        )}
                      >
                        <Text className="text-white font-bold text-lg">
                          {actionMode === 'accept' ? 'Approve' :
                           actionMode === 'delegate' ? 'Delegate' :
                           'Reject'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="gap-3">
                    <Pressable
                      onPress={() => {
                        setSelectedEscalation(esc);
                        setActionMode('accept');
                        setNewDueDate(new Date(esc.taskDueDate));
                      }}
                      className="bg-emerald-500 py-5 rounded-xl flex-row items-center justify-center active:opacity-80"
                    >
                      <CheckCircle size={28} color="white" />
                      <Text className="text-white font-bold text-xl ml-3">
                        Approve & Extend
                      </Text>
                    </Pressable>

                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => {
                          setSelectedEscalation(esc);
                          setActionMode('delegate');
                        }}
                        className="flex-1 bg-blue-500 py-5 rounded-xl items-center active:opacity-80"
                      >
                        <UserPlus size={24} color="white" />
                        <Text className="text-white font-bold text-lg mt-1">
                          Delegate
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setSelectedEscalation(esc);
                          setActionMode('reject');
                        }}
                        className="flex-1 bg-red-500 py-5 rounded-xl items-center active:opacity-80"
                      >
                        <XCircle size={24} color="white" />
                        <Text className="text-white font-bold text-lg mt-1">
                          Reject
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
            })
          )}
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={newDueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setNewDueDate(selectedDate);
              if (Platform.OS !== 'ios') {
                setShowDatePicker(false);
              }
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
