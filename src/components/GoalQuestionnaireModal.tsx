/**
 * Goal Questionnaire Modal
 *
 * Interactive questionnaire for founders to define their goals and objectives
 * Generates AI-powered next steps and OKR recommendations
 */

import { View, Text, Modal, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { X, ChevronRight, Target, Lightbulb, Sparkles, CheckCircle2, ArrowLeft, Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface Question {
  id: string;
  question: string;
  placeholder: string;
  icon: any;
}

const QUESTIONS: Question[] = [
  {
    id: 'vision',
    question: 'What is your ultimate vision for this company?',
    placeholder: 'e.g., Become the leading provider of sustainable packaging in Europe',
    icon: Target,
  },
  {
    id: 'timeframe',
    question: 'What timeframe are you targeting for this vision?',
    placeholder: 'e.g., 3-5 years, by end of 2027',
    icon: Calendar,
  },
  {
    id: 'metrics',
    question: 'How will you measure success?',
    placeholder: 'e.g., £10M ARR, 50,000 customers, market leadership',
    icon: CheckCircle2,
  },
  {
    id: 'challenges',
    question: 'What are the biggest challenges blocking your path?',
    placeholder: 'e.g., Limited capital, market awareness, team scaling',
    icon: Lightbulb,
  },
  {
    id: 'priorities',
    question: 'What should you focus on in the next 90 days?',
    placeholder: 'e.g., Product-market fit, first 100 customers, Series A fundraising',
    icon: Sparkles,
  },
];

interface GoalQuestionnaireModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (responses: Record<string, string>) => void;
}

export function GoalQuestionnaireModal({ visible, onClose, onComplete }: GoalQuestionnaireModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const isLastQuestion = currentStep === QUESTIONS.length - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      // Process responses and generate OKRs
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    onComplete(responses);
    handleReset();
  };

  const handleReset = () => {
    setCurrentStep(0);
    setResponses({});
    setIsProcessing(false);
  };

  const canProceed = responses[currentQuestion?.id]?.trim().length > 0;

  const Icon = currentQuestion?.icon;

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
            <View className="p-5 pb-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-medium">STRATEGIC PLANNING</Text>
                  <Text className="text-white text-xl font-bold">Define Your Goals</Text>
                </View>
                <Pressable
                  onPress={onClose}
                  className="w-9 h-9 bg-white/20 rounded-full items-center justify-center active:opacity-70"
                >
                  <X size={20} color="#ffffff" />
                </Pressable>
              </View>

              {/* Progress Bar */}
              <View className="bg-white/20 rounded-full h-2 overflow-hidden">
                <View
                  className="bg-white h-full rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-white/70 text-xs mt-2">
                Question {currentStep + 1} of {QUESTIONS.length}
              </Text>
            </View>
          </LinearGradient>

          {/* Content */}
          {isProcessing ? (
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full items-center justify-center mb-4">
                <Sparkles size={32} color="#8b5cf6" />
              </View>
              <ActivityIndicator size="large" color="#8b5cf6" className="mb-4" />
              <Text className="text-gray-900 dark:text-white font-bold text-lg text-center mb-2">
                Analyzing Your Responses
              </Text>
              <Text className="text-gray-500 dark:text-slate-400 text-sm text-center">
                Creating a strategic plan and OKR recommendations...
              </Text>
            </View>
          ) : (
            <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
              {/* Question */}
              <View className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-5 mb-6">
                <View className="flex-row items-start mb-4">
                  <View className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl items-center justify-center">
                    <Icon size={24} color="#8b5cf6" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-900 dark:text-white font-bold text-lg leading-tight">
                      {currentQuestion?.question}
                    </Text>
                  </View>
                </View>

                <TextInput
                  className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-base min-h-[120px]"
                  placeholder={currentQuestion?.placeholder}
                  placeholderTextColor="#9ca3af"
                  value={responses[currentQuestion?.id] || ''}
                  onChangeText={(text) =>
                    setResponses({ ...responses, [currentQuestion?.id]: text })
                  }
                  multiline
                  textAlignVertical="top"
                  style={{ fontFamily: 'System' }}
                />
              </View>

              {/* Previous Responses Preview */}
              {currentStep > 0 && (
                <View className="mb-6">
                  <Text className="text-gray-500 dark:text-slate-400 text-xs font-bold tracking-wide mb-3">
                    YOUR RESPONSES
                  </Text>
                  <View className="gap-2">
                    {QUESTIONS.slice(0, currentStep).map((q) => {
                      const response = responses[q.id];
                      if (!response) return null;

                      return (
                        <View
                          key={q.id}
                          className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3"
                        >
                          <Text className="text-gray-900 dark:text-white font-semibold text-xs mb-1">
                            {q.question}
                          </Text>
                          <Text className="text-gray-600 dark:text-slate-400 text-xs" numberOfLines={2}>
                            {response}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Helper Text */}
              <View className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-6">
                <View className="flex-row items-start">
                  <Lightbulb size={16} color="#8b5cf6" style={{ marginTop: 2 }} />
                  <Text className="text-purple-900 dark:text-purple-100 text-xs ml-2 flex-1">
                    Be specific and ambitious. The more detail you provide, the better we can help you create actionable OKRs.
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Footer Actions */}
          {!isProcessing && (
            <View className="p-5 border-t border-gray-200 dark:border-slate-800">
              <View className="flex-row gap-3">
                {currentStep > 0 && (
                  <Pressable
                    onPress={handleBack}
                    className="bg-gray-100 dark:bg-slate-900 rounded-xl px-5 py-4 active:opacity-70 flex-row items-center justify-center"
                    style={{ flex: 1 }}
                  >
                    <ArrowLeft size={18} color="#64748b" />
                    <Text className="text-gray-700 dark:text-slate-300 font-semibold text-base ml-2">
                      Back
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={handleNext}
                  disabled={!canProceed}
                  className={`rounded-xl px-5 py-4 active:opacity-70 flex-row items-center justify-center ${
                    canProceed ? 'bg-purple-600' : 'bg-gray-200 dark:bg-slate-800'
                  }`}
                  style={{ flex: currentStep > 0 ? 2 : 1 }}
                >
                  <Text
                    className={`font-semibold text-base ${
                      canProceed ? 'text-white' : 'text-gray-400 dark:text-slate-600'
                    }`}
                  >
                    {isLastQuestion ? 'Generate Strategy' : 'Next'}
                  </Text>
                  {!isLastQuestion && canProceed && (
                    <ChevronRight size={18} color="#fff" style={{ marginLeft: 8 }} />
                  )}
                  {isLastQuestion && canProceed && (
                    <Sparkles size={18} color="#fff" style={{ marginLeft: 8 }} />
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
