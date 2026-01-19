/**
 * Founder Onboarding Screen
 * Guided checklist for founders to set up their company operating cadence
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Lock,
  Circle,
  Play,
  Slash,
  Compass,
  Users,
  Package,
  Rocket,
  DollarSign,
  UserPlus,
  Settings,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Trash2,
  X,
  Mic,
  FileText,
} from 'lucide-react-native';
import { useOnboardingStore } from '@/lib/onboarding/store';
import { useCurrentWorkspace, useCurrentUser } from '@/lib/state/app-store';
import type {
  OnboardingModuleWithSteps,
  OnboardingStepWithState,
  StepStatus,
  GeneratedOutputs,
  GeneratedObjective,
  GeneratedTaskDraft,
  EvidenceValue,
} from '@/lib/onboarding/types';
import { mapCompanyStageToOrgStage } from '@/lib/onboarding/stage-rules';
import { mediumImpact, lightImpact } from '@/lib/haptics';

// =============================================================================
// ICONS MAP
// =============================================================================

const MODULE_ICONS: Record<string, React.ReactNode> = {
  foundation: <Compass size={18} color="white" />,
  market: <Users size={18} color="white" />,
  product: <Package size={18} color="white" />,
  go_to_market: <Rocket size={18} color="white" />,
  finance: <DollarSign size={18} color="white" />,
  people: <UserPlus size={18} color="white" />,
  ops: <Settings size={18} color="white" />,
};

// =============================================================================
// MAIN SCREEN
// =============================================================================

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const workspace = useCurrentWorkspace();
  const user = useCurrentUser();

  // Store
  const {
    onboardingState,
    initializeProgram,
    startOnboarding,
    getModulesWithSteps,
    getCurrentStepWithState,
    getProgress,
    setCurrentStep,
    updateStepInputs,
    updateStepEvidence,
    setGeneratedOutputs,
    completeStep,
    skipStep,
    isComplete,
    finishOnboarding,
  } = useOnboardingStore();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [showSkipInput, setShowSkipInput] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  // Initialize on mount
  useEffect(() => {
    initializeProgram();
  }, [initializeProgram]);

  // Start onboarding if not already started
  useEffect(() => {
    if (!onboardingState && workspace?.id) {
      const orgStage = workspace.companyProfile?.stage
        ? mapCompanyStageToOrgStage(workspace.companyProfile.stage)
        : 'S0';
      startOnboarding(workspace.id, orgStage, 'F0');
    }
  }, [onboardingState, workspace, startOnboarding]);

  // Get current data
  const modules = getModulesWithSteps();
  const currentStep = getCurrentStepWithState();
  const progress = getProgress();
  const completed = isComplete();

  // Load existing input when step changes
  useEffect(() => {
    if (currentStep?.state?.inputs?.transcript) {
      setInputText(currentStep.state.inputs.transcript.value as string);
    } else {
      setInputText('');
    }
    setShowSkipInput(false);
    setSkipReason('');
  }, [currentStep?.id]);

  // Handlers
  const handleStepSelect = useCallback(
    (stepId: string) => {
      lightImpact();
      setCurrentStep(stepId);
    },
    [setCurrentStep]
  );

  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);
      if (currentStep) {
        updateStepInputs(currentStep.id, {
          transcript: { value: text, timestamp: new Date().toISOString() },
        });
      }
    },
    [currentStep, updateStepInputs]
  );

  const handleGenerateDrafts = useCallback(async () => {
    if (!currentStep || !inputText.trim()) {
      setError('Please enter some text first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    mediumImpact();

    try {
      const response = await fetch('/api/onboarding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: workspace?.id,
          step_id: currentStep.step_key,
          inputs: {
            transcript: { value: inputText, timestamp: new Date().toISOString() },
          },
          use_llm: !!process.env.EXPO_PUBLIC_OPENAI_API_KEY,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate');
      }

      setGeneratedOutputs(currentStep.id, data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [currentStep, inputText, workspace, setGeneratedOutputs]);

  const handleSendToWhat = useCallback(async () => {
    if (!currentStep?.state?.generated_outputs) return;

    setIsSending(true);
    mediumImpact();

    try {
      const response = await fetch('/api/onboarding/send-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: workspace?.id,
          step_state_id: currentStep.state.id,
          objectives: currentStep.state.generated_outputs.objectives,
          task_drafts: currentStep.state.generated_outputs.task_drafts,
          user_id: user?.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send');
      }

      // Success feedback
      lightImpact();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setIsSending(false);
    }
  }, [currentStep, workspace, user]);

  const handleUpdateEvidence = useCallback(
    (key: string, value: string) => {
      if (!currentStep) return;

      const evidenceValue: EvidenceValue = {
        value,
        type: 'text',
        satisfied: value.length >= 10,
        timestamp: new Date().toISOString(),
      };

      updateStepEvidence(currentStep.id, { [key]: evidenceValue });
    },
    [currentStep, updateStepEvidence]
  );

  const handleCompleteStep = useCallback(() => {
    if (!currentStep) return;

    mediumImpact();
    const result = completeStep(currentStep.id);

    if (!result.success) {
      setError(result.error || 'Cannot complete step');
    }
  }, [currentStep, completeStep]);

  const handleSkipStep = useCallback(() => {
    if (!currentStep || skipReason.length < 20) return;

    mediumImpact();
    const result = skipStep(currentStep.id, skipReason);

    if (!result.success) {
      setError(result.error || 'Cannot skip step');
    } else {
      setShowSkipInput(false);
      setSkipReason('');
    }
  }, [currentStep, skipReason, skipStep]);

  const handleFinish = useCallback(() => {
    mediumImpact();
    finishOnboarding();
    router.back();
  }, [finishOnboarding]);

  // Check if can complete
  const canComplete = currentStep
    ? currentStep.evidence_requirements.every((req) => {
        const evidence = currentStep.state?.evidence?.[req.key];
        return evidence?.satisfied;
      })
    : false;

  // Render
  if (!onboardingState) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (completed) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <CompletionScreen progress={progress} onFinish={handleFinish} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Founder Onboarding',
          headerShown: true,
          headerStyle: { backgroundColor: '#8b5cf6' },
          headerTintColor: '#ffffff',
        }}
      />

      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        {/* Progress Header */}
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 20, paddingVertical: 16 }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white/70 text-sm">Progress</Text>
              <Text className="text-white text-xl font-bold">
                {progress.steps_completed}/{progress.steps_total} steps
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-white text-3xl font-bold">{progress.percent}%</Text>
            </View>
          </View>

          <View className="h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
            <View
              className="h-full bg-white rounded-full"
              style={{ width: `${progress.percent}%` }}
            />
          </View>
        </LinearGradient>

        <View className="flex-1 flex-row">
          {/* Progress Rail (Left) */}
          <ScrollView
            className="w-20 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800"
            showsVerticalScrollIndicator={false}
          >
            {modules.map((module, mi) => (
              <ModuleRailItem
                key={module.id}
                module={module}
                isActive={currentStep?.module_id === module.id}
                onStepSelect={handleStepSelect}
              />
            ))}
          </ScrollView>

          {/* Main Content */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          >
            {/* Error Banner */}
            {error && (
              <Animated.View
                entering={FadeInDown}
                className="flex-row items-center bg-red-100 dark:bg-red-900/30 px-4 py-3 rounded-xl mb-4"
              >
                <AlertCircle size={18} color="#ef4444" />
                <Text className="text-red-600 dark:text-red-400 flex-1 ml-2">{error}</Text>
                <Pressable onPress={() => setError(null)}>
                  <X size={18} color="#ef4444" />
                </Pressable>
              </Animated.View>
            )}

            {/* Current Step Panel */}
            {currentStep && (
              <Animated.View entering={FadeInUp}>
                <StepPanel
                  step={currentStep}
                  inputText={inputText}
                  isGenerating={isGenerating}
                  isSending={isSending}
                  onInputChange={handleInputChange}
                  onGenerateDrafts={handleGenerateDrafts}
                  onSendToWhat={handleSendToWhat}
                  onUpdateEvidence={handleUpdateEvidence}
                />

                {/* Completion Actions */}
                <View className="mt-6">
                  <Pressable
                    onPress={handleCompleteStep}
                    disabled={!canComplete}
                    className={`py-4 rounded-xl items-center ${
                      canComplete ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <Text
                      className={`font-bold text-base ${
                        canComplete ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      Mark Step Complete
                    </Text>
                  </Pressable>

                  {currentStep.gating_rules?.allow_skip !== false && (
                    <>
                      {!showSkipInput ? (
                        <Pressable
                          onPress={() => {
                            lightImpact();
                            setShowSkipInput(true);
                          }}
                          className="py-3 mt-3"
                        >
                          <Text className="text-slate-500 dark:text-slate-400 text-center">
                            Skip this step...
                          </Text>
                        </Pressable>
                      ) : (
                        <Animated.View
                          entering={FadeInDown}
                          className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl mt-3"
                        >
                          <Text className="text-slate-700 dark:text-slate-300 font-medium mb-2">
                            Why are you skipping?
                          </Text>
                          <TextInput
                            value={skipReason}
                            onChangeText={setSkipReason}
                            placeholder="Explain briefly (min 20 chars)..."
                            placeholderTextColor="#94a3b8"
                            className="bg-white dark:bg-slate-800 px-4 py-3 rounded-lg text-slate-900 dark:text-white"
                          />
                          <View className="flex-row gap-3 mt-3">
                            <Pressable
                              onPress={() => setShowSkipInput(false)}
                              className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg items-center"
                            >
                              <Text className="text-slate-600 dark:text-slate-300">Cancel</Text>
                            </Pressable>
                            <Pressable
                              onPress={handleSkipStep}
                              disabled={skipReason.length < 20}
                              className={`flex-1 py-3 rounded-lg items-center ${
                                skipReason.length >= 20
                                  ? 'bg-yellow-500'
                                  : 'bg-yellow-200 dark:bg-yellow-900/50'
                              }`}
                            >
                              <Text
                                className={`font-medium ${
                                  skipReason.length >= 20
                                    ? 'text-white'
                                    : 'text-yellow-600 dark:text-yellow-400'
                                }`}
                              >
                                Confirm Skip
                              </Text>
                            </Pressable>
                          </View>
                        </Animated.View>
                      )}
                    </>
                  )}
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

// =============================================================================
// MODULE RAIL ITEM
// =============================================================================

function ModuleRailItem({
  module,
  isActive,
  onStepSelect,
}: {
  module: OnboardingModuleWithSteps;
  isActive: boolean;
  onStepSelect: (stepId: string) => void;
}) {
  const [expanded, setExpanded] = useState(isActive);

  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  const isComplete = module.completion_count >= module.total_count && module.total_count > 0;

  return (
    <View className="border-b border-slate-200 dark:border-slate-800">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className={`p-3 items-center ${isActive ? 'bg-purple-100 dark:bg-purple-900/30' : ''}`}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: isComplete ? '#10b981' : module.color || '#8b5cf6' }}
        >
          {isComplete ? (
            <Check size={20} color="white" />
          ) : (
            MODULE_ICONS[module.module_key] || <Circle size={18} color="white" />
          )}
        </View>
        <Text
          className={`text-xs mt-1 text-center ${
            isActive ? 'text-purple-700 dark:text-purple-300 font-medium' : 'text-slate-500'
          }`}
          numberOfLines={1}
        >
          {module.title.split(' ')[0]}
        </Text>
        <Text className="text-xs text-slate-400">
          {module.completion_count}/{module.total_count}
        </Text>
      </Pressable>

      {expanded && (
        <View className="pb-2">
          {module.steps.map((step) => (
            <StepRailItem
              key={step.id}
              step={step}
              onSelect={() => onStepSelect(step.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// STEP RAIL ITEM
// =============================================================================

function StepRailItem({
  step,
  onSelect,
}: {
  step: OnboardingStepWithState;
  onSelect: () => void;
}) {
  const status = step.state?.status || 'locked';

  const getStatusIcon = () => {
    switch (status) {
      case 'locked':
        return <Lock size={12} color="#94a3b8" />;
      case 'unlocked':
        return <Circle size={12} color="#64748b" />;
      case 'in_progress':
        return <Play size={12} color="#3b82f6" />;
      case 'completed':
        return <Check size={12} color="#10b981" />;
      case 'skipped':
        return <Slash size={12} color="#94a3b8" />;
      default:
        return <Circle size={12} color="#64748b" />;
    }
  };

  const isClickable = status !== 'locked';

  return (
    <Pressable
      onPress={isClickable ? onSelect : undefined}
      disabled={!isClickable}
      className={`px-3 py-2 flex-row items-center ${
        status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      style={{ opacity: isClickable ? 1 : 0.5 }}
    >
      {getStatusIcon()}
    </Pressable>
  );
}

// =============================================================================
// STEP PANEL
// =============================================================================

function StepPanel({
  step,
  inputText,
  isGenerating,
  isSending,
  onInputChange,
  onGenerateDrafts,
  onSendToWhat,
  onUpdateEvidence,
}: {
  step: OnboardingStepWithState;
  inputText: string;
  isGenerating: boolean;
  isSending: boolean;
  onInputChange: (text: string) => void;
  onGenerateDrafts: () => void;
  onSendToWhat: () => void;
  onUpdateEvidence: (key: string, value: string) => void;
}) {
  const outputs = step.state?.generated_outputs;

  return (
    <View>
      {/* Header */}
      <View className="mb-4">
        <Text className="text-purple-600 dark:text-purple-400 text-sm font-medium">
          {step.module.title} • Step {step.order_index + 1}
        </Text>
        <Text className="text-slate-900 dark:text-white text-xl font-bold mt-1">
          {step.title}
        </Text>
        <Text className="text-slate-600 dark:text-slate-400 mt-2">
          {step.description_short}
        </Text>
      </View>

      {/* Input Section */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <FileText size={18} color="#8b5cf6" />
          <Text className="text-slate-900 dark:text-white font-semibold">Your Input</Text>
        </View>

        <TextInput
          value={inputText}
          onChangeText={onInputChange}
          placeholder="Type or paste transcript here..."
          placeholderTextColor="#94a3b8"
          multiline
          textAlignVertical="top"
          className="bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-xl text-slate-900 dark:text-white min-h-[120px]"
        />

        <Pressable
          onPress={onGenerateDrafts}
          disabled={isGenerating || !inputText.trim()}
          className={`flex-row items-center justify-center py-3 rounded-xl mt-3 ${
            inputText.trim() ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          {isGenerating ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Sparkles size={18} color="white" />
              <Text className="text-white font-medium ml-2">Generate Drafts</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Outputs Section */}
      {outputs && (outputs.objectives?.length > 0 || outputs.task_drafts?.length > 0) && (
        <Animated.View
          entering={FadeInDown}
          className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-4"
        >
          <Text className="text-slate-900 dark:text-white font-semibold mb-3">
            Generated Outputs
          </Text>

          {/* Objectives */}
          {outputs.objectives?.length > 0 && (
            <View className="mb-4">
              <Text className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                Objectives ({outputs.objectives.length})
              </Text>
              {outputs.objectives.map((obj) => (
                <View
                  key={obj.id}
                  className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg mb-2"
                >
                  <Text className="text-slate-900 dark:text-white font-medium">
                    {obj.title}
                  </Text>
                  {obj.description && (
                    <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      {obj.description}
                    </Text>
                  )}
                  <View
                    className="self-start px-2 py-0.5 rounded mt-2"
                    style={{ backgroundColor: '#8b5cf620' }}
                  >
                    <Text className="text-purple-600 dark:text-purple-400 text-xs capitalize">
                      {obj.category}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Task Drafts */}
          {outputs.task_drafts?.length > 0 && (
            <View className="mb-4">
              <Text className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                Task Drafts ({outputs.task_drafts.length})
              </Text>
              {outputs.task_drafts.map((task) => (
                <View
                  key={task.id}
                  className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg mb-2 border-l-4 border-green-500"
                >
                  <Text className="text-slate-900 dark:text-white font-medium">
                    {task.title}
                  </Text>
                  <View className="flex-row items-center gap-3 mt-2">
                    <Text className="text-slate-500 text-xs">{task.units} TU</Text>
                    <Text className="text-slate-500 text-xs capitalize">
                      → {task.assignee_hint}
                    </Text>
                    {task.due_offset_days && (
                      <Text className="text-slate-500 text-xs">
                        Due in {task.due_offset_days}d
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Send Button */}
          <Pressable
            onPress={onSendToWhat}
            disabled={isSending}
            className="flex-row items-center justify-center py-3 rounded-xl bg-green-600"
          >
            {isSending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Send size={18} color="white" />
                <Text className="text-white font-medium ml-2">Send to WHAT</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      )}

      {/* Evidence Section */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-4">
        <Text className="text-slate-900 dark:text-white font-semibold mb-3">
          Evidence Required
        </Text>

        {step.evidence_requirements.map((req) => {
          const evidence = step.state?.evidence?.[req.key];
          const satisfied = evidence?.satisfied || false;

          return (
            <View key={req.key} className="mb-3">
              <View className="flex-row items-center gap-2 mb-2">
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    satisfied
                      ? 'bg-green-500 border-green-500'
                      : 'border-slate-400 dark:border-slate-600'
                  }`}
                >
                  {satisfied && <Check size={12} color="white" />}
                </View>
                <Text className="text-slate-700 dark:text-slate-300 flex-1">{req.label}</Text>
              </View>

              {req.type === 'text' && (
                <TextInput
                  value={(evidence?.value as string) || ''}
                  onChangeText={(text) => onUpdateEvidence(req.key, text)}
                  placeholder={req.description || 'Enter evidence...'}
                  placeholderTextColor="#94a3b8"
                  multiline={req.type === 'text'}
                  className="bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-lg text-slate-900 dark:text-white"
                />
              )}

              {req.type === 'link' && (
                <TextInput
                  value={(evidence?.value as string) || ''}
                  onChangeText={(text) => onUpdateEvidence(req.key, text)}
                  placeholder="https://..."
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="url"
                  className="bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-lg text-slate-900 dark:text-white"
                />
              )}

              {req.type === 'list' && (
                <TextInput
                  value={(evidence?.value as string) || ''}
                  onChangeText={(text) => onUpdateEvidence(req.key, text)}
                  placeholder={`Enter ${req.min_items || 3}+ items, one per line...`}
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                  className="bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-lg text-slate-900 dark:text-white min-h-[80px]"
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// =============================================================================
// COMPLETION SCREEN
// =============================================================================

function CompletionScreen({
  progress,
  onFinish,
}: {
  progress: { steps_completed: number; steps_total: number };
  onFinish: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View entering={FadeInDown} className="items-center">
          <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-6">
            <CheckCircle2 size={60} color="white" />
          </View>

          <Text className="text-white text-3xl font-bold text-center mb-2">
            Onboarding Complete!
          </Text>

          <Text className="text-white/80 text-center text-lg mb-8">
            You've completed {progress.steps_completed} steps and set up your company operating
            cadence.
          </Text>

          <View className="bg-white/10 rounded-2xl p-6 w-full mb-8">
            <Text className="text-white text-center text-lg font-semibold mb-4">
              What's Next?
            </Text>
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                  <Text className="text-white font-bold">1</Text>
                </View>
                <Text className="text-white/90 flex-1">
                  Review and confirm task drafts in WHAT tab
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                  <Text className="text-white font-bold">2</Text>
                </View>
                <Text className="text-white/90 flex-1">
                  Track objectives in WHY tab
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                  <Text className="text-white font-bold">3</Text>
                </View>
                <Text className="text-white/90 flex-1">
                  Start your weekly cadence
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={onFinish}
            className="bg-white py-4 px-8 rounded-xl"
          >
            <Text className="text-emerald-600 font-bold text-lg">Finish</Text>
          </Pressable>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
