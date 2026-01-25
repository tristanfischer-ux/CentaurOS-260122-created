/**
 * Strategy Results Modal
 *
 * Displays AI-generated next steps and OKR recommendations
 * based on the founder's goal questionnaire responses
 */

import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { X, Target, CheckCircle2, Sparkles, TrendingUp, AlertCircle, Calendar, Users, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';

interface NextStep {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
}

interface OKRRecommendation {
  title: string;
  objective: string;
  keyResults: string[];
  function: string;
  quarter: string;
}

interface StrategyResultsModalProps {
  visible: boolean;
  onClose: () => void;
  responses: Record<string, string>;
  onCreateOKRs: (okrs: OKRRecommendation[]) => void;
}

export function StrategyResultsModal({
  visible,
  onClose,
  responses,
  onCreateOKRs,
}: StrategyResultsModalProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [okrRecommendations, setOkrRecommendations] = useState<OKRRecommendation[]>([]);

  useEffect(() => {
    if (visible && Object.keys(responses).length > 0) {
      generateStrategy();
    }
  }, [visible, responses]);

  const generateStrategy = async () => {
    setIsGenerating(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate next steps based on responses
    const steps: NextStep[] = [
      {
        title: 'Validate Product-Market Fit',
        description: 'Conduct customer interviews and gather feedback to ensure your solution addresses the core pain points identified in your vision.',
        priority: 'high',
        timeframe: 'Next 4 weeks',
      },
      {
        title: 'Build Core Team',
        description: 'Hire or onboard fractional executives and apprentices in key functions to execute your 90-day priorities.',
        priority: 'high',
        timeframe: 'Next 6 weeks',
      },
      {
        title: 'Define Success Metrics',
        description: 'Establish clear KPIs and tracking mechanisms for the success metrics you outlined.',
        priority: 'medium',
        timeframe: 'Next 2 weeks',
      },
      {
        title: 'Address Key Challenges',
        description: 'Create action plans to overcome the major blockers you identified, starting with the most critical.',
        priority: 'medium',
        timeframe: 'Ongoing',
      },
      {
        title: 'Set Quarterly Milestones',
        description: 'Break down your vision into achievable quarterly objectives that ladder up to your long-term goals.',
        priority: 'high',
        timeframe: 'Next 2 weeks',
      },
    ];

    // Generate OKR recommendations
    const okrs: OKRRecommendation[] = [
      {
        title: 'Achieve Product-Market Fit',
        objective: 'Validate product-market fit with target customers',
        keyResults: [
          'Conduct 50 customer interviews',
          'Achieve 40% customer satisfaction score',
          'Generate 10 qualified leads from initial customers',
        ],
        function: 'Marketing',
        quarter: 'Q1 2026',
      },
      {
        title: 'Build Foundation Team',
        objective: 'Assemble core team to execute strategy',
        keyResults: [
          'Hire 2 fractional executives in key functions',
          'Onboard 3 apprentices across functions',
          'Achieve 80% team capacity utilization',
        ],
        function: 'Ops',
        quarter: 'Q1 2026',
      },
      {
        title: 'Establish Revenue Pipeline',
        objective: 'Create sustainable revenue generation system',
        keyResults: [
          'Close first 10 paying customers',
          'Achieve £50K MRR',
          'Build pipeline of 50 qualified prospects',
        ],
        function: 'Sales',
        quarter: 'Q1 2026',
      },
    ];

    setNextSteps(steps);
    setOkrRecommendations(okrs);
    setIsGenerating(false);
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: '#ef4444' };
      case 'medium':
        return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: '#f59e0b' };
      case 'low':
        return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: '#3b82f6' };
    }
  };

  const handleCreateOKRs = () => {
    onCreateOKRs(okrRecommendations);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 bg-white dark:bg-slate-950 mt-16 rounded-t-3xl">
          {/* Header */}
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <View className="p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-medium">AI-POWERED INSIGHTS</Text>
                  <Text className="text-white text-xl font-bold">Your Strategic Plan</Text>
                </View>
                <Pressable
                  onPress={onClose}
                  className="w-9 h-9 bg-white/20 rounded-full items-center justify-center active:opacity-70"
                >
                  <X size={20} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          </LinearGradient>

          {/* Content */}
          {isGenerating ? (
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full items-center justify-center mb-4">
                <Sparkles size={32} color="#8b5cf6" />
              </View>
              <ActivityIndicator size="large" color="#8b5cf6" className="mb-4" />
              <Text className="text-gray-900 dark:text-white font-bold text-lg text-center mb-2">
                Generating Your Strategy
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-sm text-center">
                Analyzing your responses and creating actionable next steps...
              </Text>
            </View>
          ) : (
            <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
              {/* Summary */}
              <View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 mb-6">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 bg-purple-500 rounded-lg items-center justify-center">
                    <Sparkles size={20} color="#fff" />
                  </View>
                  <Text className="text-purple-900 dark:text-purple-100 font-bold text-base ml-3">
                    Strategic Summary
                  </Text>
                </View>
                <Text className="text-purple-900 dark:text-purple-100 text-sm leading-relaxed">
                  Based on your responses, we've identified {nextSteps.length} key action items and created {okrRecommendations.length} OKR recommendations to help you achieve your vision.
                </Text>
              </View>

              {/* Next Steps */}
              <View className="mb-6">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold tracking-wide mb-3">
                  RECOMMENDED NEXT STEPS
                </Text>
                <View className="gap-3">
                  {nextSteps.map((step, index) => {
                    const priorityStyle = getPriorityColor(step.priority);
                    return (
                      <View
                        key={index}
                        className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4"
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1">
                            <View className="flex-row items-center mb-2">
                              <View className="w-6 h-6 rounded-full items-center justify-center bg-gray-200 dark:bg-slate-900">
                                <Text className="text-gray-700 dark:text-slate-300 font-bold text-xs">
                                  {index + 1}
                                </Text>
                              </View>
                              <Text className="text-gray-900 dark:text-white font-bold text-sm ml-2 flex-1">
                                {step.title}
                              </Text>
                            </View>
                            <Text className="text-gray-600 dark:text-slate-400 text-xs leading-relaxed mb-3">
                              {step.description}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <View className={`px-2.5 py-1 rounded-full ${priorityStyle.bg}`}>
                            <Text className={`text-xs font-semibold uppercase ${priorityStyle.text}`}>
                              {step.priority} Priority
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <Calendar size={12} color="#9ca3af" />
                            <Text className="text-gray-500 dark:text-slate-400 text-xs ml-1.5">
                              {step.timeframe}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* OKR Recommendations */}
              <View className="mb-6">
                <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold tracking-wide mb-3">
                  RECOMMENDED OKRs
                </Text>
                <View className="gap-3">
                  {okrRecommendations.map((okr, index) => (
                    <View
                      key={index}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4"
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <Target size={16} color="#8b5cf6" />
                            <Text className="text-purple-900 dark:text-purple-100 font-bold text-sm ml-2">
                              {okr.title}
                            </Text>
                          </View>
                          <Text className="text-purple-800 dark:text-purple-200 text-xs mb-3">
                            {okr.objective}
                          </Text>
                        </View>
                      </View>

                      <View className="gap-2 mb-3">
                        {okr.keyResults.map((kr, krIndex) => (
                          <View key={krIndex} className="flex-row items-start">
                            <CheckCircle2 size={14} color="#10b981" style={{ marginTop: 2 }} />
                            <Text className="text-gray-700 dark:text-slate-300 text-xs ml-2 flex-1">
                              {kr}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View className="flex-row items-center justify-between pt-3 border-t border-purple-200 dark:border-purple-800">
                        <Text className="text-purple-700 dark:text-purple-300 text-xs font-semibold">
                          {okr.function}
                        </Text>
                        <Text className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                          {okr.quarter}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Info Banner */}
              <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                <View className="flex-row items-start">
                  <AlertCircle size={16} color="#3b82f6" style={{ marginTop: 2 }} />
                  <Text className="text-blue-900 dark:text-blue-100 text-xs ml-2 flex-1">
                    These recommendations are generated based on your responses. You can review and customize them in the Decide tab after creation.
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Footer Actions */}
          {!isGenerating && (
            <View className="p-5 border-t border-gray-200 dark:border-slate-700">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={onClose}
                  className="bg-gray-100 dark:bg-slate-900 rounded-xl px-5 py-4 active:opacity-70 flex-row items-center justify-center"
                  style={{ flex: 1 }}
                >
                  <Text className="text-gray-700 dark:text-slate-300 font-semibold text-base">
                    Review Later
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleCreateOKRs}
                  className="bg-purple-600 rounded-xl px-5 py-4 active:opacity-70 flex-row items-center justify-center"
                  style={{ flex: 2 }}
                >
                  <Target size={18} color="#fff" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Create OKRs
                  </Text>
                  <ArrowRight size={18} color="#fff" style={{ marginLeft: 8 }} />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
