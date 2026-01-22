/**
 * CompletionReviewModal - Review and approve task completions
 *
 * Workflow:
 * 1. Leadership views submitted task
 * 2. Reviews completion checklist
 * 3. Reads submission notes
 * 4. Either approves or requests revisions
 * 5. Task returns to submitter if revisions needed
 *
 * Features:
 * - Full-screen, clear interface
 * - View completion checklist
 * - Review submission notes
 * - Add feedback
 * - Approve or request revisions
 */

import { View, Text, Modal, Pressable, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { X, CheckCircle, Circle, FileText, ThumbsUp, AlertCircle, User, Calendar } from 'lucide-react-native';
import { useWorkPlanStore, type WorkPlan } from '@/lib/state/work-plan-store';
import { useAppStore } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { cn } from '@/lib/cn';
import { lightImpact, heavyImpact } from '@/lib/haptics';
import { format } from 'date-fns';

interface CompletionReviewModalProps {
  visible: boolean;
  onClose: () => void;
  workPlan: WorkPlan;
}

export function CompletionReviewModal({
  visible,
  onClose,
  workPlan,
}: CompletionReviewModalProps) {
  const approveCompletion = useWorkPlanStore(s => s.approveCompletion);
  const requestRevisions = useWorkPlanStore(s => s.requestRevisions);
  const currentMembership = useAppStore(s => s.currentMembership);
  const members = useOrganizationStore(s => s.members);

  const [reviewFeedback, setReviewFeedback] = useState('');
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRevisionsForm, setShowRevisionsForm] = useState(false);

  const currentMember = members.find(m => m.userId === currentMembership?.userId);
  const submitter = members.find(m => m.id === workPlan.submittedBy);

  const handleApprove = async () => {
    if (!currentMembership || !currentMember) return;

    heavyImpact();

    const success = await approveCompletion(
      workPlan.id,
      currentMembership.id,
      currentMember.name,
      reviewFeedback || undefined
    );

    if (success) {
      onClose();
      setReviewFeedback('');
      setShowApproveConfirm(false);
    }
  };

  const handleRequestRevisions = async () => {
    if (!currentMembership || !currentMember || !reviewFeedback.trim()) return;

    heavyImpact();

    const success = await requestRevisions(
      workPlan.id,
      currentMembership.id,
      currentMember.name,
      reviewFeedback
    );

    if (success) {
      onClose();
      setReviewFeedback('');
      setShowRevisionsForm(false);
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
            <View className="flex-1 mr-4">
              <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                Review Completion
              </Text>
              <Text className="text-lg text-slate-600 dark:text-slate-400 mt-1" numberOfLines={2}>
                {workPlan.title}
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

          {/* Submission Info */}
          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 mt-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3">
                <User size={20} color="#3b82f6" />
                <Text className="text-base text-slate-600 dark:text-slate-400">
                  Submitted by
                </Text>
              </View>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                {submitter?.name || 'Unknown'}
              </Text>
            </View>
            {workPlan.submittedForReviewAt && (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Calendar size={20} color="#3b82f6" />
                  <Text className="text-base text-slate-600 dark:text-slate-400">
                    Submitted on
                  </Text>
                </View>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">
                  {format(new Date(workPlan.submittedForReviewAt), 'MMM d, yyyy h:mm a')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Completion Checklist */}
          {workPlan.completionChecklist && workPlan.completionChecklist.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center gap-3 mb-4">
                <CheckCircle size={24} color="#3b82f6" />
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                  Completion Checklist
                </Text>
              </View>

              <View className="gap-3">
                {workPlan.completionChecklist.map(item => (
                  <View
                    key={item.id}
                    className={cn(
                      'rounded-xl p-5 border-2 flex-row items-start gap-4',
                      item.completed
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    <View className="mt-1">
                      {item.completed ? (
                        <CheckCircle size={28} color="#10b981" />
                      ) : (
                        <Circle size={28} color="#94a3b8" />
                      )}
                    </View>

                    <View className="flex-1">
                      <Text
                        className={cn(
                          'text-lg font-semibold',
                          item.completed
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-900 dark:text-white'
                        )}
                      >
                        {item.label}
                      </Text>
                      {item.required && (
                        <View className="bg-red-500 px-2 py-1 rounded-full mt-2 self-start">
                          <Text className="text-white text-xs font-bold">
                            REQUIRED
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Submission Notes */}
          {workPlan.submissionNotes && (
            <View className="mb-6">
              <View className="flex-row items-center gap-3 mb-4">
                <FileText size={24} color="#3b82f6" />
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                  Completion Notes
                </Text>
              </View>

              <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5">
                <Text className="text-base text-slate-900 dark:text-white leading-relaxed">
                  {workPlan.submissionNotes}
                </Text>
              </View>
            </View>
          )}

          {/* Review Actions */}
          {!showApproveConfirm && !showRevisionsForm && (
            <View className="gap-3">
              <Pressable
                onPress={() => {
                  lightImpact();
                  setShowApproveConfirm(true);
                }}
                className="bg-emerald-500 py-6 rounded-xl flex-row items-center justify-center gap-3 active:opacity-80"
              >
                <ThumbsUp size={28} color="white" />
                <Text className="text-white font-bold text-2xl">
                  Approve Completion
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  lightImpact();
                  setShowRevisionsForm(true);
                }}
                className="bg-amber-500 py-6 rounded-xl flex-row items-center justify-center gap-3 active:opacity-80"
              >
                <AlertCircle size={28} color="white" />
                <Text className="text-white font-bold text-2xl">
                  Request Revisions
                </Text>
              </Pressable>
            </View>
          )}

          {/* Approve Confirmation */}
          {showApproveConfirm && (
            <View className="gap-4">
              <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 border-2 border-emerald-500">
                <View className="flex-row items-center gap-3 mb-3">
                  <CheckCircle size={24} color="#10b981" />
                  <Text className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    Approve Task Completion
                  </Text>
                </View>
                <Text className="text-base text-emerald-600 dark:text-emerald-400">
                  This will mark the task as completed and notify the team member
                </Text>
              </View>

              <View>
                <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">
                  Approval Feedback (Optional)
                </Text>
                <TextInput
                  value={reviewFeedback}
                  onChangeText={setReviewFeedback}
                  placeholder="Add any feedback or acknowledgment..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl px-5 py-4 text-base text-slate-900 dark:text-white"
                  style={{ minHeight: 100, textAlignVertical: 'top' }}
                />
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    lightImpact();
                    setShowApproveConfirm(false);
                    setReviewFeedback('');
                  }}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 py-4 rounded-xl"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-bold text-lg text-center">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleApprove}
                  className="flex-1 bg-emerald-500 py-4 rounded-xl active:opacity-80"
                >
                  <Text className="text-white font-bold text-lg text-center">
                    Confirm Approval
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Request Revisions Form */}
          {showRevisionsForm && (
            <View className="gap-4">
              <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border-2 border-amber-500">
                <View className="flex-row items-center gap-3 mb-3">
                  <AlertCircle size={24} color="#f59e0b" />
                  <Text className="text-xl font-bold text-amber-700 dark:text-amber-300">
                    Request Revisions
                  </Text>
                </View>
                <Text className="text-base text-amber-600 dark:text-amber-400">
                  The task will be returned to the team member with your feedback
                </Text>
              </View>

              <View>
                <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">
                  Revision Feedback *
                </Text>
                <TextInput
                  value={reviewFeedback}
                  onChangeText={setReviewFeedback}
                  placeholder="Explain what needs to be revised or improved..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={6}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl px-5 py-4 text-base text-slate-900 dark:text-white"
                  style={{ minHeight: 140, textAlignVertical: 'top' }}
                />
                {reviewFeedback.trim().length === 0 && (
                  <View className="flex-row items-center gap-2 mt-3">
                    <AlertCircle size={16} color="#f59e0b" />
                    <Text className="text-amber-600 dark:text-amber-400 text-sm">
                      Feedback is required to request revisions
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    lightImpact();
                    setShowRevisionsForm(false);
                    setReviewFeedback('');
                  }}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 py-4 rounded-xl"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-bold text-lg text-center">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleRequestRevisions}
                  disabled={!reviewFeedback.trim()}
                  className={cn(
                    'flex-1 py-4 rounded-xl',
                    reviewFeedback.trim()
                      ? 'bg-amber-500 active:opacity-80'
                      : 'bg-slate-300 dark:bg-slate-700'
                  )}
                >
                  <Text
                    className={cn(
                      'font-bold text-lg text-center',
                      reviewFeedback.trim() ? 'text-white' : 'text-slate-400'
                    )}
                  >
                    Send Feedback
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
