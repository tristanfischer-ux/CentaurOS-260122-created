/**
 * CommentaryInput Component
 *
 * A reusable component for adding commentary when approving or rejecting requests.
 * Commentary is OPTIONAL for approvals but REQUIRED for rejections.
 *
 * Used in:
 * - Marketplace hiring requests (who.tsx)
 * - Allocation requests (FounderApprovalPanel)
 * - Task/OKR requests (decide.tsx)
 */

import { View, Text, TextInput, Pressable, Modal } from 'react-native';
import { useState } from 'react';
import { X, CheckCircle2, XCircle, MessageSquare, AlertTriangle } from 'lucide-react-native';

interface CommentaryInputProps {
  visible: boolean;
  action: 'approve' | 'reject';
  requestType: string; // e.g., "hiring request", "allocation request", "task proposal"
  requestName: string; // The name/title of what's being approved/rejected
  onSubmit: (commentary: string) => void;
  onCancel: () => void;
}

export function CommentaryInput({
  visible,
  action,
  requestType,
  requestName,
  onSubmit,
  onCancel,
}: CommentaryInputProps) {
  const [commentary, setCommentary] = useState('');

  const isReject = action === 'reject';
  const isRequired = isReject; // Commentary required for rejections
  const canSubmit = !isRequired || commentary.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(commentary.trim());
    setCommentary('');
  };

  const handleCancel = () => {
    setCommentary('');
    onCancel();
  };

  const actionColor = isReject ? '#ef4444' : '#10b981';
  const ActionIcon = isReject ? XCircle : CheckCircle2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable className="flex-1 bg-black/70 justify-center px-5" onPress={handleCancel}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            {/* Header */}
            <View
              className="px-5 py-4 flex-row items-center justify-between"
              style={{ backgroundColor: actionColor + '15' }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: actionColor + '20' }}
                >
                  <ActionIcon size={22} color={actionColor} />
                </View>
                <View>
                  <Text className="text-slate-900 dark:text-white font-bold text-lg">
                    {isReject ? 'Reject' : 'Approve'} {requestType}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm" numberOfLines={1}>
                    {requestName}
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleCancel} className="p-2">
                <X size={20} color="#64748b" />
              </Pressable>
            </View>

            {/* Content */}
            <View className="px-5 py-4">
              {/* Commentary Input */}
              <View className="mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <MessageSquare size={16} color="#64748b" />
                  <Text className="text-slate-700 dark:text-slate-300 font-medium">
                    {isReject ? 'Reason for Rejection' : 'Add a Note'}{' '}
                    {isRequired ? (
                      <Text className="text-red-500">*</Text>
                    ) : (
                      <Text className="text-slate-400">(optional)</Text>
                    )}
                  </Text>
                </View>
                <TextInput
                  value={commentary}
                  onChangeText={setCommentary}
                  placeholder={
                    isReject
                      ? 'Please explain why this request is being rejected...'
                      : 'Add any notes or instructions (optional)...'
                  }
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white min-h-[100px]"
                />
              </View>

              {/* Required Warning for Rejections */}
              {isRequired && !commentary.trim() && (
                <View className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-4 flex-row items-start gap-2">
                  <AlertTriangle size={16} color="#f59e0b" />
                  <Text className="text-amber-700 dark:text-amber-300 text-sm flex-1">
                    A reason is required when rejecting a {requestType}. This helps the requester understand why and improve future requests.
                  </Text>
                </View>
              )}

              {/* Suggestion chips for rejections */}
              {isReject && (
                <View className="mb-4">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                    QUICK RESPONSES
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      'Not within budget',
                      'Not a priority right now',
                      'Need more information',
                      'Already covered',
                      'Timing not right',
                    ].map((suggestion) => (
                      <Pressable
                        key={suggestion}
                        onPress={() => setCommentary(suggestion)}
                        className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full active:opacity-70"
                      >
                        <Text className="text-slate-600 dark:text-slate-400 text-xs">
                          {suggestion}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleCancel}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 py-3 rounded-xl items-center active:opacity-70"
                >
                  <Text className="text-slate-600 dark:text-slate-400 font-semibold">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  className={`flex-1 py-3 rounded-xl items-center active:opacity-70 ${
                    canSubmit
                      ? isReject
                        ? 'bg-red-500'
                        : 'bg-emerald-500'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <ActionIcon size={18} color={canSubmit ? 'white' : '#94a3b8'} />
                    <Text
                      className={`font-semibold ${
                        canSubmit ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {isReject ? 'Reject' : 'Approve'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
