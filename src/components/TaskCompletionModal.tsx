/**
 * TaskCompletionModal - Submit task for review
 *
 * Workflow:
 * 1. Team member marks task as ready for review
 * 2. Complete checklist items
 * 3. Add completion notes
 * 4. Submit for leadership review
 * 5. Leadership approves or requests revisions (CompletionReviewModal)
 *
 * Features:
 * - Full-screen, clear interface
 * - Completion checklist
 * - Required fields validation
 * - Clear submission notes
 */

import { View, Text, Modal, Pressable, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { X, CheckCircle, Circle, FileText, Send, AlertCircle } from 'lucide-react-native';
import { useWorkPlanStore, type WorkPlan, type CompletionChecklistItem } from '@/lib/state/work-plan-store';
import { useAppStore } from '@/lib/state/app-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { cn } from '@/lib/cn';
import { lightImpact, heavyImpact } from '@/lib/haptics';

interface TaskCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  workPlan: WorkPlan;
}

const DEFAULT_CHECKLIST: CompletionChecklistItem[] = [
  { id: 'tested', label: 'Tested and verified working', completed: false, required: true },
  { id: 'documented', label: 'Documentation updated', completed: false, required: false },
  { id: 'reviewed', label: 'Code/work reviewed', completed: false, required: false },
  { id: 'deliverables', label: 'All deliverables complete', completed: false, required: true },
];

export function TaskCompletionModal({
  visible,
  onClose,
  workPlan,
}: TaskCompletionModalProps) {
  const submitForReview = useWorkPlanStore(s => s.submitForReview);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);
  const currentMembership = useAppStore(s => s.currentMembership);
  const members = useOrganizationStore(s => s.members);

  // Get current member name from organization members
  const currentMember = members.find(m => m.userId === currentMembership?.userId);

  const [checklist, setChecklist] = useState<CompletionChecklistItem[]>(
    workPlan.completionChecklist || DEFAULT_CHECKLIST
  );
  const [submissionNotes, setSubmissionNotes] = useState('');

  const allRequiredComplete = checklist
    .filter(item => item.required)
    .every(item => item.completed);

  const canSubmit = allRequiredComplete && submissionNotes.trim().length > 0;

  const toggleChecklistItem = (id: string) => {
    lightImpact();
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit || !currentMembership || !currentMember) return;

    heavyImpact();

    // Save checklist to work plan
    updateWorkPlan(workPlan.id, { completionChecklist: checklist });

    // Submit for review
    const success = await submitForReview(
      workPlan.id,
      currentMembership.id,
      currentMember.name,
      submissionNotes
    );

    if (success) {
      onClose();
      setSubmissionNotes('');
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
                Submit for Review
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
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Completion Checklist */}
          <View className="mb-6">
            <View className="flex-row items-center gap-3 mb-4">
              <CheckCircle size={24} color="#3b82f6" />
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                Completion Checklist
              </Text>
            </View>

            <View className="gap-3">
              {checklist.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleChecklistItem(item.id)}
                  className={cn(
                    'rounded-xl p-5 border-2 flex-row items-start gap-4 active:opacity-70',
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
                </Pressable>
              ))}
            </View>
          </View>

          {/* Submission Notes */}
          <View className="mb-6">
            <View className="flex-row items-center gap-3 mb-4">
              <FileText size={24} color="#3b82f6" />
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                Completion Notes
              </Text>
            </View>

            <TextInput
              value={submissionNotes}
              onChangeText={setSubmissionNotes}
              placeholder="Describe what you completed, any challenges faced, and anything the reviewer should know..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={8}
              className="bg-slate-50 dark:bg-slate-800 rounded-xl px-5 py-4 text-base text-slate-900 dark:text-white"
              style={{ minHeight: 160, textAlignVertical: 'top' }}
            />

            {submissionNotes.trim().length === 0 && (
              <View className="flex-row items-center gap-2 mt-3">
                <AlertCircle size={16} color="#f59e0b" />
                <Text className="text-amber-600 dark:text-amber-400 text-sm">
                  Completion notes are required
                </Text>
              </View>
            )}
          </View>

          {/* Requirements Summary */}
          <View
            className={cn(
              'rounded-xl p-5 border-2',
              canSubmit
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
            )}
          >
            <View className="flex-row items-center gap-3 mb-2">
              {canSubmit ? (
                <CheckCircle size={24} color="#10b981" />
              ) : (
                <AlertCircle size={24} color="#f59e0b" />
              )}
              <Text
                className={cn(
                  'text-lg font-bold',
                  canSubmit
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-amber-700 dark:text-amber-300'
                )}
              >
                {canSubmit ? 'Ready to Submit' : 'Complete Requirements'}
              </Text>
            </View>

            {!canSubmit && (
              <View className="gap-1">
                {!allRequiredComplete && (
                  <Text className="text-base text-amber-600 dark:text-amber-400">
                    • Complete all required checklist items
                  </Text>
                )}
                {submissionNotes.trim().length === 0 && (
                  <Text className="text-base text-amber-600 dark:text-amber-400">
                    • Add completion notes
                  </Text>
                )}
              </View>
            )}

            {canSubmit && (
              <Text className="text-base text-emerald-600 dark:text-emerald-400">
                Your submission will be sent to leadership for review
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Actions */}
        <View className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => {
                lightImpact();
                onClose();
              }}
              className="flex-1 bg-slate-200 dark:bg-slate-700 py-5 rounded-xl"
            >
              <Text className="text-slate-700 dark:text-slate-300 font-bold text-xl text-center">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'flex-1 py-5 rounded-xl flex-row items-center justify-center gap-3',
                canSubmit
                  ? 'bg-blue-500 active:opacity-80'
                  : 'bg-slate-300 dark:bg-slate-700'
              )}
            >
              <Send size={24} color={canSubmit ? 'white' : '#94a3b8'} />
              <Text
                className={cn(
                  'font-bold text-xl',
                  canSubmit ? 'text-white' : 'text-slate-400'
                )}
              >
                Submit for Review
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
