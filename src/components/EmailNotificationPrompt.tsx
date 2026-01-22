/**
 * EmailNotificationPrompt
 *
 * Modal that prompts user to send email notifications after task assignments.
 * Shows list of newly assigned members with checkboxes.
 */

import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { Mail, X, Check, AlertCircle, Send } from 'lucide-react-native';
import { composeTaskAssignmentEmail, isEmailAvailable, type EmailSendResult } from '@/lib/email-service';
import type { OrganizationMember } from '@/lib/organization-seed';

interface AssignedMember {
  member: OrganizationMember;
  tuPerWeek: number;
}

interface EmailNotificationPromptProps {
  visible: boolean;
  onClose: () => void;
  taskTitle: string;
  taskDescription?: string;
  dueDate: string;
  assignedBy: string;
  assignedMembers: AssignedMember[];
}

export function EmailNotificationPrompt({
  visible,
  onClose,
  taskTitle,
  taskDescription,
  dueDate,
  assignedBy,
  assignedMembers,
}: EmailNotificationPromptProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(assignedMembers.map(a => a.member.id))
  );
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Map<string, EmailSendResult>>(new Map());
  const [emailUnavailable, setEmailUnavailable] = useState(false);

  const toggleMember = (memberId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleSendEmails = useCallback(async () => {
    // Check if email is available
    const available = await isEmailAvailable();
    if (!available) {
      setEmailUnavailable(true);
      return;
    }

    setSending(true);
    const newResults = new Map<string, EmailSendResult>();

    for (const { member, tuPerWeek } of assignedMembers) {
      if (!selectedIds.has(member.id) || !member.email) continue;

      const result = await composeTaskAssignmentEmail(member.email, {
        recipientName: member.name,
        taskTitle,
        taskDescription,
        dueDate,
        assignedBy,
        tuPerWeek,
      });

      newResults.set(member.id, result);

      // If user cancelled, stop sending more
      if (result.status === 'cancelled') {
        break;
      }
    }

    setResults(newResults);
    setSending(false);

    // If all emails were sent/handled, close after a delay
    if (newResults.size === selectedIds.size) {
      setTimeout(onClose, 1500);
    }
  }, [assignedMembers, selectedIds, taskTitle, taskDescription, dueDate, assignedBy, onClose]);

  const selectedCount = selectedIds.size;
  const membersWithEmail = assignedMembers.filter(a => a.member.email);
  const membersWithoutEmail = assignedMembers.filter(a => !a.member.email);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '70%' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <View className="flex-row items-center gap-3">
                <View className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                  <Mail size={20} color="#3b82f6" />
                </View>
                <View>
                  <Text className="text-slate-900 dark:text-white font-bold text-lg">
                    Send Email Notifications?
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm">
                    Notify assigned team members
                  </Text>
                </View>
              </View>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            {/* Email Unavailable Warning */}
            {emailUnavailable && (
              <View className="mx-6 mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <View className="flex-row items-start gap-3">
                  <AlertCircle size={20} color="#f59e0b" />
                  <View className="flex-1">
                    <Text className="text-amber-800 dark:text-amber-300 font-semibold">
                      Email Not Available
                    </Text>
                    <Text className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                      No email account is configured on this device. Please set up email in your device settings.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Content */}
            <ScrollView className="px-6 py-4" contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Task Info */}
              <View className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                <Text className="text-slate-900 dark:text-white font-semibold mb-1">
                  {taskTitle}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm">
                  Due: {new Date(dueDate).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>

              {/* Members with email */}
              {membersWithEmail.length > 0 && (
                <>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2 uppercase">
                    Select Recipients
                  </Text>
                  {membersWithEmail.map(({ member, tuPerWeek }) => {
                    const isSelected = selectedIds.has(member.id);
                    const result = results.get(member.id);

                    return (
                      <Pressable
                        key={member.id}
                        onPress={() => !result && toggleMember(member.id)}
                        className={`flex-row items-center p-3 mb-2 rounded-xl border-2 ${
                          result?.status === 'sent'
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                            : result?.status === 'cancelled'
                            ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                            : isSelected
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                        disabled={!!result}
                      >
                        {/* Checkbox */}
                        <View
                          className={`w-6 h-6 rounded-lg items-center justify-center mr-3 ${
                            result?.status === 'sent'
                              ? 'bg-green-500'
                              : isSelected
                              ? 'bg-blue-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          {(isSelected || result?.status === 'sent') && (
                            <Check size={14} color="white" />
                          )}
                        </View>

                        {/* Member Info */}
                        <View className="flex-1">
                          <Text className="text-slate-900 dark:text-white font-medium">
                            {member.name}
                          </Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-xs">
                            {member.email}
                          </Text>
                        </View>

                        {/* Status */}
                        {result?.status === 'sent' && (
                          <Text className="text-green-600 dark:text-green-400 text-xs font-semibold">
                            Sent
                          </Text>
                        )}
                        {result?.status === 'cancelled' && (
                          <Text className="text-slate-500 dark:text-slate-400 text-xs">
                            Skipped
                          </Text>
                        )}
                        {!result && (
                          <Text className="text-slate-400 dark:text-slate-500 text-xs">
                            {tuPerWeek} TU/wk
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </>
              )}

              {/* Members without email */}
              {membersWithoutEmail.length > 0 && (
                <View className="mt-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <AlertCircle size={16} color="#94a3b8" />
                    <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      No email address
                    </Text>
                  </View>
                  <Text className="text-slate-400 dark:text-slate-500 text-xs">
                    {membersWithoutEmail.map(m => m.member.name).join(', ')}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View className="flex-row gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
              <Pressable
                onPress={onClose}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-3 rounded-xl items-center"
              >
                <Text className="text-slate-700 dark:text-slate-300 font-semibold">
                  Skip
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSendEmails}
                disabled={selectedCount === 0 || sending}
                className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2 ${
                  selectedCount === 0 || sending
                    ? 'bg-blue-300 dark:bg-blue-800'
                    : 'bg-blue-500'
                }`}
              >
                <Send size={18} color="white" />
                <Text className="text-white font-semibold">
                  {sending ? 'Opening Mail...' : `Send (${selectedCount})`}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default EmailNotificationPrompt;
