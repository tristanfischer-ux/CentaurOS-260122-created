/**
 * CreateOutreachModal - Generate outreach task drafts
 *
 * Allows users to create task drafts for outreach activities
 */

import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import {
  X,
  Mail,
  Calendar,
  FileText,
  Users,
  MessageSquare,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react-native';
import { useTheme } from '@/lib/ThemeContext';
import { HapticPressable } from './HapticPressable';
import { lightImpact } from '@/lib/haptics';
import type { OutreachTemplate } from '@/lib/people/types';

interface CreateOutreachModalProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
  userId: string;
  relationshipId: string;
  personName?: string;
  onDraftsCreated?: (count: number) => void;
}

// Template options
const TEMPLATE_OPTIONS: {
  template: OutreachTemplate;
  label: string;
  description: string;
  icon: React.ReactNode;
  stage: string;
}[] = [
  {
    template: 'email_introduction',
    label: 'Email Introduction',
    description: 'Draft and send an introduction email',
    icon: <Mail size={20} color="#3b82f6" />,
    stage: 'identified',
  },
  {
    template: 'schedule_call',
    label: 'Schedule Call',
    description: 'Book an introductory call',
    icon: <Calendar size={20} color="#8b5cf6" />,
    stage: 'contacted',
  },
  {
    template: 'send_nda',
    label: 'Send NDA',
    description: 'Send mutual NDA for signature',
    icon: <FileText size={20} color="#f59e0b" />,
    stage: 'intro_call',
  },
  {
    template: 'prepare_interview',
    label: 'Prepare Interview',
    description: 'Set up interview session',
    icon: <Users size={20} color="#10b981" />,
    stage: 'intro_call',
  },
  {
    template: 'check_references',
    label: 'Check References',
    description: 'Conduct reference checks',
    icon: <MessageSquare size={20} color="#06b6d4" />,
    stage: 'trial',
  },
  {
    template: 'send_offer',
    label: 'Send Offer',
    description: 'Prepare and send offer letter',
    icon: <Send size={20} color="#ec4899" />,
    stage: 'trial',
  },
  {
    template: 'onboarding_checklist',
    label: 'Onboarding Checklist',
    description: 'Complete onboarding tasks',
    icon: <ClipboardList size={20} color="#10b981" />,
    stage: 'engaged',
  },
];

export function CreateOutreachModal({
  visible,
  onClose,
  workspaceId,
  userId,
  relationshipId,
  personName,
  onDraftsCreated,
}: CreateOutreachModalProps) {
  const { theme, isOffWhite } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [selectedTemplates, setSelectedTemplates] = useState<Set<OutreachTemplate>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  // Theme colors
  const bgColor = isDark ? 'bg-slate-900' : isOffWhite ? 'bg-stone-50' : 'bg-white';
  const cardBg = isDark ? 'bg-slate-800' : isOffWhite ? 'bg-stone-100' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : isOffWhite ? 'text-stone-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-400' : isOffWhite ? 'text-stone-500' : 'text-gray-500';
  const borderColor = isDark ? 'border-slate-700' : isOffWhite ? 'border-stone-200' : 'border-gray-200';

  // Toggle template selection
  const toggleTemplate = (template: OutreachTemplate) => {
    lightImpact();
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(template)) {
        next.delete(template);
      } else {
        next.add(template);
      }
      return next;
    });
  };

  // Reset state
  const resetState = () => {
    setSelectedTemplates(new Set());
    setError(null);
    setSuccess(null);
  };

  // Handle close
  const handleClose = () => {
    resetState();
    onClose();
  };

  // Submit drafts
  const handleSubmit = useCallback(async () => {
    if (selectedTemplates.size === 0) {
      setError('Please select at least one template');
      return;
    }

    setIsLoading(true);
    setError(null);
    lightImpact();

    try {
      const res = await fetch('/api/people/pipeline/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: userId,
          relationship_id: relationshipId,
          templates: Array.from(selectedTemplates),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create drafts');
      }

      setSuccess(data.data.count);
      onDraftsCreated?.(data.data.count);

      // Close after brief success state
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create drafts');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplates, workspaceId, userId, relationshipId, onDraftsCreated]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/70" onPress={handleClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '85%' }}>
          <Animated.View
            entering={SlideInUp}
            className={`${bgColor} rounded-t-3xl`}
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* Header */}
            <View className={`flex-row items-center justify-between px-5 py-4 border-b ${borderColor}`}>
              <View>
                <Text className={`${textPrimary} text-xl font-bold`}>Create Outreach Tasks</Text>
                {personName && (
                  <Text className={textSecondary}>for {personName}</Text>
                )}
              </View>
              <Pressable onPress={handleClose} className="p-2 -mr-2">
                <X size={24} color={isDark ? '#94a3b8' : '#6b7280'} />
              </Pressable>
            </View>

            <ScrollView
              className="px-5 py-4"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Success State */}
              {success !== null && (
                <Animated.View
                  entering={FadeInDown}
                  className="items-center py-8"
                >
                  <CheckCircle2 size={48} color="#10b981" />
                  <Text className={`${textPrimary} text-lg font-semibold mt-3`}>
                    {success} Task Draft{success !== 1 ? 's' : ''} Created!
                  </Text>
                  <Text className={textSecondary}>
                    Check your WHAT tab to confirm
                  </Text>
                </Animated.View>
              )}

              {success === null && (
                <>
                  {/* Info Banner */}
                  <View className={`${cardBg} rounded-xl p-3 mb-4 flex-row items-start`}>
                    <AlertCircle size={18} color="#3b82f6" className="mt-0.5" />
                    <Text className={`${textSecondary} text-sm ml-2 flex-1`}>
                      Task drafts will be created for confirmation. You'll find them in the WHAT tab.
                    </Text>
                  </View>

                  {/* Error */}
                  {error && (
                    <Animated.View
                      entering={FadeIn}
                      className="flex-row items-center bg-red-100 dark:bg-red-900/30 rounded-xl p-3 mb-4"
                    >
                      <AlertCircle size={18} color="#ef4444" />
                      <Text className="text-red-600 dark:text-red-400 ml-2 flex-1">{error}</Text>
                    </Animated.View>
                  )}

                  {/* Template Options */}
                  <Text className={`${textSecondary} text-sm mb-3`}>Select templates:</Text>
                  <View className="gap-2 mb-6">
                    {TEMPLATE_OPTIONS.map((opt) => {
                      const isSelected = selectedTemplates.has(opt.template);

                      return (
                        <Pressable
                          key={opt.template}
                          onPress={() => toggleTemplate(opt.template)}
                          className={`flex-row items-center p-3 rounded-xl border ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : `${cardBg} ${borderColor}`
                          }`}
                        >
                          <View
                            className={`w-10 h-10 rounded-full items-center justify-center ${
                              isSelected ? 'bg-white/20' : isDark ? 'bg-slate-700' : 'bg-gray-200'
                            }`}
                          >
                            {opt.icon}
                          </View>

                          <View className="flex-1 ml-3">
                            <Text
                              className={`font-semibold ${
                                isSelected ? 'text-white' : textPrimary
                              }`}
                            >
                              {opt.label}
                            </Text>
                            <Text
                              className={`text-sm ${
                                isSelected ? 'text-white/70' : textSecondary
                              }`}
                            >
                              {opt.description}
                            </Text>
                          </View>

                          {isSelected && (
                            <CheckCircle2 size={20} color="white" />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Selected Count */}
                  {selectedTemplates.size > 0 && (
                    <Text className={`${textSecondary} text-sm text-center mb-4`}>
                      {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} selected
                    </Text>
                  )}

                  {/* Submit Button */}
                  <HapticPressable
                    onPress={handleSubmit}
                    disabled={isLoading || selectedTemplates.size === 0}
                    className={`flex-row items-center justify-center py-4 rounded-xl ${
                      selectedTemplates.size === 0 ? 'bg-gray-400' : 'bg-blue-600'
                    }`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Send size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">
                          Create {selectedTemplates.size > 0 ? selectedTemplates.size : ''} Draft{selectedTemplates.size !== 1 ? 's' : ''}
                        </Text>
                      </>
                    )}
                  </HapticPressable>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
