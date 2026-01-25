/**
 * RecommendResourceModal Component
 *
 * Modal for executives and apprentices to recommend resources to founders
 */

import { View, Text, Modal, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { X, Send, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useRecommendationStore,
  type RecommendationType,
  createRecommendationReviewTask,
  createRecommendationMessage,
} from '@/lib/state/recommendation-store';
import { useCurrentWorkspace, useCurrentUser, useCurrentMembership } from '@/lib/state/app-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useMessagesStore } from '@/lib/state/messages-store';

interface RecommendResourceModalProps {
  visible: boolean;
  onClose: () => void;
  resourceType: RecommendationType;
  resourceId: string;
  resourceName: string;
  resourceDetails: any;
}

export function RecommendResourceModal({
  visible,
  onClose,
  resourceType,
  resourceId,
  resourceName,
  resourceDetails,
}: RecommendResourceModalProps) {
  const currentWorkspace = useCurrentWorkspace();
  const currentUser = useCurrentUser();
  const currentMembership = useCurrentMembership();
  const createRecommendation = useRecommendationStore(s => s.createRecommendation);
  const linkTaskToRecommendation = useRecommendationStore(s => s.linkTaskToRecommendation);
  const linkMessageToRecommendation = useRecommendationStore(s => s.linkMessageToRecommendation);
  const addWorkPlan = useWorkPlanStore(s => s.addWorkPlan);
  const addMessage = useMessagesStore(s => s.addMessage);

  const [reason, setReason] = useState('');
  const [expectedBenefit, setExpectedBenefit] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [suggestedRate, setSuggestedRate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [estimatedROI, setEstimatedROI] = useState('');

  const resetForm = () => {
    setReason('');
    setExpectedBenefit('');
    setUrgency('medium');
    setSuggestedRate('');
    setEstimatedCost('');
    setEstimatedROI('');
  };

  const handleRecommend = () => {
    if (!currentWorkspace || !currentUser || !currentMembership) return;

    // Validate
    if (!reason || !expectedBenefit) {
      alert('Please fill in the reason and expected benefit');
      return;
    }

    // Only executives and apprentices can recommend
    if (currentMembership.role !== 'FractionalExec' && currentMembership.role !== 'Apprentice') {
      alert('Only executives and apprentices can make recommendations');
      return;
    }

    // Create the recommendation
    const recommendation = createRecommendation({
      workspaceId: currentWorkspace.id,
      type: resourceType,
      resourceId,
      resourceName,
      resourceDetails,
      recommendedBy: currentUser.id,
      recommendedByName: currentUser.name,
      recommendedByRole: currentMembership.role,
      reason,
      expectedBenefit,
      urgency,
      suggestedRate: suggestedRate ? parseFloat(suggestedRate) : undefined,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      estimatedROI: estimatedROI || undefined,
    });

    // Create a task for founder to review
    const taskData = createRecommendationReviewTask(recommendation);
    const newTaskId = `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task: any = {
      id: newTaskId,
      workspaceId: currentWorkspace.id,
      linkedOKRTitle: '',
      function: 'Admin' as const,
      title: taskData.title,
      description: taskData.description,
      assignedBy: currentUser.id,
      dueDate: taskData.dueDate,
      status: 'not-started' as const,
      progress: 0,
      estimatedTimeUnits: 1,
      needsSubmission: false,
    };
    addWorkPlan(task);

    // Link task to recommendation
    linkTaskToRecommendation(recommendation.id, newTaskId);

    // Create a message/notification for founder
    const messageData = createRecommendationMessage(recommendation);
    // TODO: Integrate with actual messaging system
    // For now, we'll use the messages store
    const conversationId = `conv-founder-${currentUser.id}`;
    const message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentMembership.role,
      content: messageData.content,
      timestamp: new Date(),
      read: false,
    };
    addMessage(message);

    resetForm();
    onClose();
    alert(`Recommendation sent! The founder will be notified to review "${resourceName}"`);
  };

  const getResourceTypeLabel = () => {
    switch (resourceType) {
      case 'executive':
        return 'Fractional Executive';
      case 'apprentice':
        return 'Apprentice';
      case 'ai_tool':
        return 'AI Tool';
      case 'supplier':
        return 'Supplier';
    }
  };

  const getResourceIcon = () => {
    return Lightbulb;
  };

  const ResourceIcon = getResourceIcon();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-950 rounded-t-3xl max-h-[85%]">
            {/* Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-bold text-xl">
                  Recommend to Founder
                </Text>
                <Text className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                  Suggest {getResourceTypeLabel().toLowerCase()}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-9 h-9 bg-gray-100 dark:bg-slate-900 rounded-full items-center justify-center active:opacity-70"
              >
                <X size={20} color="#64748b" />
              </Pressable>
            </View>

            {/* Form */}
            <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
              {/* Resource Info */}
              <View className="py-4 border-b border-gray-200 dark:border-slate-700">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-emerald-500 rounded-full items-center justify-center">
                    <ResourceIcon size={24} color="#fff" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-500 dark:text-slate-400 text-xs">
                      {getResourceTypeLabel()}
                    </Text>
                    <Text className="text-gray-900 dark:text-white font-semibold text-base">
                      {resourceName}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Urgency */}
              <View className="pt-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                  Urgency Level
                </Text>
                <View className="flex-row gap-2">
                  {[
                    { value: 'low' as const, label: 'Low', color: '#64748b' },
                    { value: 'medium' as const, label: 'Medium', color: '#f59e0b' },
                    { value: 'high' as const, label: 'High', color: '#ef4444' },
                  ].map(option => (
                    <Pressable
                      key={option.value}
                      onPress={() => setUrgency(option.value)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                        urgency === option.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <View className="flex-row items-center justify-center">
                        {urgency === option.value && (
                          <View
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        <Text
                          className={`text-center font-semibold text-sm ${
                            urgency === option.value
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-gray-700 dark:text-slate-300'
                          }`}
                        >
                          {option.label}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Reason */}
              <View className="pt-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                  Why recommend this? *
                </Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Explain why this resource would be valuable..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white min-h-[80px]"
                  textAlignVertical="top"
                />
              </View>

              {/* Expected Benefit */}
              <View className="pt-4">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                  Expected Benefit *
                </Text>
                <TextInput
                  value={expectedBenefit}
                  onChangeText={setExpectedBenefit}
                  placeholder="What impact will this have? (e.g., time saved, revenue increase)"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white min-h-[80px]"
                  textAlignVertical="top"
                />
              </View>

              {/* Conditional fields based on type */}
              {(resourceType === 'executive' || resourceType === 'apprentice') && (
                <View className="pt-4">
                  <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                    Suggested Rate (£/day)
                  </Text>
                  <TextInput
                    value={suggestedRate}
                    onChangeText={setSuggestedRate}
                    placeholder="e.g., 350"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white"
                  />
                </View>
              )}

              {(resourceType === 'ai_tool' || resourceType === 'supplier') && (
                <>
                  <View className="pt-4">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                      Estimated Cost (£/month)
                    </Text>
                    <TextInput
                      value={estimatedCost}
                      onChangeText={setEstimatedCost}
                      placeholder="e.g., 30"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white"
                    />
                  </View>

                  <View className="pt-4 pb-6">
                    <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                      Estimated ROI
                    </Text>
                    <TextInput
                      value={estimatedROI}
                      onChangeText={setEstimatedROI}
                      placeholder="e.g., 10 hours saved per week"
                      placeholderTextColor="#9ca3af"
                      className="bg-gray-100 dark:bg-slate-900 rounded-xl p-4 text-gray-900 dark:text-white"
                    />
                  </View>
                </>
              )}

              {/* Info box */}
              <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 mt-2">
                <View className="flex-row items-start">
                  <AlertCircle size={16} color="#3b82f6" className="mt-0.5" />
                  <Text className="text-blue-700 dark:text-blue-300 text-xs ml-2 flex-1">
                    The founder will receive a task to review your recommendation and can approve or reject it with feedback.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Footer with Send Button */}
            <View className="p-5 border-t border-gray-200 dark:border-slate-700">
              <Pressable onPress={handleRecommend} className="active:opacity-70">
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, padding: 16 }}
                >
                  <View className="flex-row items-center justify-center">
                    <Send size={20} color="#fff" />
                    <Text className="text-white font-bold text-base ml-2">
                      Send Recommendation
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
