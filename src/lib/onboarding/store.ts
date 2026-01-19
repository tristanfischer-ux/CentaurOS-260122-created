/**
 * Onboarding Store
 * Manages founder onboarding state with Zustand
 */

import { create } from 'zustand';
import type {
  CompanyOnboardingState,
  CompanyOnboardingStepState,
  OnboardingModule,
  OnboardingStep,
  OnboardingProgress,
  OnboardingStatus,
  StepStatus,
  OrgStage,
  FinanceStage,
  InputValue,
  EvidenceValue,
  GeneratedOutputs,
  OnboardingView,
  OnboardingModuleWithSteps,
  OnboardingStepWithState,
} from './types';
import { FOUNDER_ZERO_TO_ONE_PROGRAM, MODULES, STEPS_BY_MODULE, getAllSteps } from './program-data';
import {
  filterModulesForStage,
  canCompleteStep,
  canSkipStep,
  calculateProgress,
  mapCompanyStageToOrgStage,
} from './stage-rules';

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingStoreState {
  // Program data (loaded once)
  modules: OnboardingModule[];
  steps: OnboardingStep[];

  // Company-specific state
  onboardingState: CompanyOnboardingState | null;
  stepStates: Map<string, CompanyOnboardingStepState>;

  // UI state
  currentStepId: string | null;
  isLoading: boolean;
  error: string | null;

  // Initialization
  initializeProgram: () => void;

  // State management
  startOnboarding: (
    companyId: string,
    orgStage?: OrgStage,
    financeStage?: FinanceStage
  ) => void;
  loadOnboardingState: (state: CompanyOnboardingState, stepStates: CompanyOnboardingStepState[]) => void;

  // Step navigation
  setCurrentStep: (stepId: string) => void;
  getNextStep: () => OnboardingStep | null;
  getPreviousStep: () => OnboardingStep | null;

  // Step state updates
  updateStepInputs: (stepId: string, inputs: Record<string, InputValue>) => void;
  updateStepEvidence: (stepId: string, evidence: Record<string, EvidenceValue>) => void;
  setGeneratedOutputs: (stepId: string, outputs: GeneratedOutputs) => void;

  // Step completion
  completeStep: (stepId: string) => { success: boolean; error?: string };
  skipStep: (stepId: string, reason: string) => { success: boolean; error?: string };
  unlockNextStep: () => string | null;

  // Progress
  getProgress: () => OnboardingProgress;
  isComplete: () => boolean;
  finishOnboarding: () => void;

  // View helpers
  getOnboardingView: () => OnboardingView | null;
  getCurrentStepWithState: () => OnboardingStepWithState | null;
  getModulesWithSteps: () => OnboardingModuleWithSteps[];
}

// =============================================================================
// HELPER: Create module/step IDs
// =============================================================================

function createModuleId(index: number): string {
  return `module-${FOUNDER_ZERO_TO_ONE_PROGRAM.id}-${index}`;
}

function createStepId(moduleIndex: number, stepIndex: number): string {
  return `step-${FOUNDER_ZERO_TO_ONE_PROGRAM.id}-${moduleIndex}-${stepIndex}`;
}

// =============================================================================
// STORE
// =============================================================================

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => ({
  // Initial state
  modules: [],
  steps: [],
  onboardingState: null,
  stepStates: new Map(),
  currentStepId: null,
  isLoading: false,
  error: null,

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  initializeProgram: () => {
    // Convert program data to typed modules and steps
    const modules: OnboardingModule[] = MODULES.map((m, i) => ({
      ...m,
      id: createModuleId(i),
      program_id: FOUNDER_ZERO_TO_ONE_PROGRAM.id,
      stage_applicability: m.stage_applicability as OnboardingModule['stage_applicability'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const steps: OnboardingStep[] = [];
    let stepGlobalIndex = 0;

    Object.entries(STEPS_BY_MODULE).forEach(([moduleKey, moduleSteps], moduleIndex) => {
      const moduleId = createModuleId(moduleIndex);

      moduleSteps.forEach((stepDef, stepIndex) => {
        steps.push({
          ...stepDef,
          id: createStepId(moduleIndex, stepIndex),
          module_id: moduleId,
          required_inputs: stepDef.required_inputs as OnboardingStep['required_inputs'],
          evidence_requirements: stepDef.evidence_requirements as OnboardingStep['evidence_requirements'],
          outputs_templates: stepDef.outputs_templates as OnboardingStep['outputs_templates'],
          gating_rules: stepDef.gating_rules as OnboardingStep['gating_rules'],
          stage_applicability: stepDef.stage_applicability as OnboardingStep['stage_applicability'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        stepGlobalIndex++;
      });
    });

    set({ modules, steps });
  },

  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------

  startOnboarding: (companyId, orgStage = 'S0', financeStage = 'F0') => {
    const { modules, steps } = get();

    if (modules.length === 0) {
      get().initializeProgram();
    }

    const currentModules = get().modules;
    const currentSteps = get().steps;

    // Filter modules/steps for stage
    const applicableModules = filterModulesForStage(currentModules, orgStage, financeStage);
    const applicableSteps = currentSteps.filter((s) =>
      applicableModules.some((m) => m.id === s.module_id)
    );

    // Find first step
    const firstStep = applicableSteps.find((s) =>
      s.module_id === applicableModules[0]?.id && s.order_index === 0
    );

    // Create initial state
    const onboardingState: CompanyOnboardingState = {
      id: `onboarding-${companyId}-${Date.now()}`,
      company_id: companyId,
      program_id: FOUNDER_ZERO_TO_ONE_PROGRAM.id,
      current_module_id: applicableModules[0]?.id,
      current_step_id: firstStep?.id,
      progress: {
        modules_completed: 0,
        modules_total: applicableModules.length,
        steps_completed: 0,
        steps_total: applicableSteps.filter((s) => s.is_required).length,
        percent: 0,
      },
      status: 'active',
      org_stage: orgStage,
      finance_stage: financeStage,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create step states (first step unlocked, rest locked)
    const stepStates = new Map<string, CompanyOnboardingStepState>();

    applicableSteps.forEach((step, index) => {
      const state: CompanyOnboardingStepState = {
        id: `stepstate-${companyId}-${step.id}`,
        company_id: companyId,
        step_id: step.id,
        onboarding_state_id: onboardingState.id,
        status: index === 0 ? 'unlocked' : 'locked',
        inputs: {},
        evidence: {},
        updated_at: new Date().toISOString(),
      };
      stepStates.set(step.id, state);
    });

    set({
      onboardingState,
      stepStates,
      currentStepId: firstStep?.id ?? null,
    });
  },

  loadOnboardingState: (state, stepStatesArray) => {
    const stepStates = new Map<string, CompanyOnboardingStepState>();
    stepStatesArray.forEach((ss) => stepStates.set(ss.step_id, ss));

    set({
      onboardingState: state,
      stepStates,
      currentStepId: state.current_step_id ?? null,
    });
  },

  // --------------------------------------------------------------------------
  // STEP NAVIGATION
  // --------------------------------------------------------------------------

  setCurrentStep: (stepId) => {
    const { stepStates } = get();
    const stepState = stepStates.get(stepId);

    // Only allow navigating to unlocked/in_progress/completed/skipped steps
    if (stepState && stepState.status !== 'locked') {
      // If unlocked, mark as in_progress
      if (stepState.status === 'unlocked') {
        stepState.status = 'in_progress';
        stepState.started_at = new Date().toISOString();
        stepStates.set(stepId, { ...stepState });
      }

      set({
        currentStepId: stepId,
        stepStates: new Map(stepStates),
      });
    }
  },

  getNextStep: () => {
    const { steps, currentStepId, stepStates } = get();
    if (!currentStepId) return null;

    const currentIndex = steps.findIndex((s) => s.id === currentStepId);
    if (currentIndex === -1 || currentIndex >= steps.length - 1) return null;

    // Find next step that isn't locked
    for (let i = currentIndex + 1; i < steps.length; i++) {
      const stepState = stepStates.get(steps[i].id);
      if (stepState && stepState.status !== 'locked') {
        return steps[i];
      }
    }

    return null;
  },

  getPreviousStep: () => {
    const { steps, currentStepId, stepStates } = get();
    if (!currentStepId) return null;

    const currentIndex = steps.findIndex((s) => s.id === currentStepId);
    if (currentIndex <= 0) return null;

    // Find previous step
    for (let i = currentIndex - 1; i >= 0; i--) {
      const stepState = stepStates.get(steps[i].id);
      if (stepState && stepState.status !== 'locked') {
        return steps[i];
      }
    }

    return null;
  },

  // --------------------------------------------------------------------------
  // STEP STATE UPDATES
  // --------------------------------------------------------------------------

  updateStepInputs: (stepId, inputs) => {
    const { stepStates } = get();
    const stepState = stepStates.get(stepId);

    if (stepState) {
      stepState.inputs = { ...stepState.inputs, ...inputs };
      stepState.updated_at = new Date().toISOString();
      stepStates.set(stepId, { ...stepState });
      set({ stepStates: new Map(stepStates) });
    }
  },

  updateStepEvidence: (stepId, evidence) => {
    const { stepStates } = get();
    const stepState = stepStates.get(stepId);

    if (stepState) {
      stepState.evidence = { ...stepState.evidence, ...evidence };
      stepState.updated_at = new Date().toISOString();
      stepStates.set(stepId, { ...stepState });
      set({ stepStates: new Map(stepStates) });
    }
  },

  setGeneratedOutputs: (stepId, outputs) => {
    const { stepStates } = get();
    const stepState = stepStates.get(stepId);

    if (stepState) {
      stepState.generated_outputs = outputs;
      stepState.updated_at = new Date().toISOString();
      stepStates.set(stepId, { ...stepState });
      set({ stepStates: new Map(stepStates) });
    }
  },

  // --------------------------------------------------------------------------
  // STEP COMPLETION
  // --------------------------------------------------------------------------

  completeStep: (stepId) => {
    const { steps, stepStates, onboardingState } = get();
    const step = steps.find((s) => s.id === stepId);
    const stepState = stepStates.get(stepId);

    if (!step || !stepState) {
      return { success: false, error: 'Step not found' };
    }

    // Check evidence requirements
    const { canComplete, missingEvidence } = canCompleteStep(step, stepState.evidence);

    if (!canComplete) {
      return {
        success: false,
        error: `Missing evidence: ${missingEvidence.join(', ')}`,
      };
    }

    // Mark as completed
    stepState.status = 'completed';
    stepState.completed_at = new Date().toISOString();
    stepState.updated_at = new Date().toISOString();
    stepStates.set(stepId, { ...stepState });

    // Unlock next step
    const nextStepId = get().unlockNextStep();

    // Update progress
    const progress = get().getProgress();
    if (onboardingState) {
      onboardingState.progress = progress;
      onboardingState.current_step_id = nextStepId ?? undefined;
      onboardingState.updated_at = new Date().toISOString();
    }

    set({
      stepStates: new Map(stepStates),
      onboardingState: onboardingState ? { ...onboardingState } : null,
      currentStepId: nextStepId,
    });

    return { success: true };
  },

  skipStep: (stepId, reason) => {
    const { steps, stepStates, onboardingState } = get();
    const step = steps.find((s) => s.id === stepId);
    const stepState = stepStates.get(stepId);

    if (!step || !stepState) {
      return { success: false, error: 'Step not found' };
    }

    if (!canSkipStep(step)) {
      return { success: false, error: 'This step cannot be skipped' };
    }

    if (reason.length < 20) {
      return { success: false, error: 'Skip reason must be at least 20 characters' };
    }

    // Mark as skipped
    stepState.status = 'skipped';
    stepState.skip_reason = reason;
    stepState.skipped_at = new Date().toISOString();
    stepState.updated_at = new Date().toISOString();
    stepStates.set(stepId, { ...stepState });

    // Unlock next step
    const nextStepId = get().unlockNextStep();

    // Update progress
    const progress = get().getProgress();
    if (onboardingState) {
      onboardingState.progress = progress;
      onboardingState.current_step_id = nextStepId ?? undefined;
      onboardingState.updated_at = new Date().toISOString();
    }

    set({
      stepStates: new Map(stepStates),
      onboardingState: onboardingState ? { ...onboardingState } : null,
      currentStepId: nextStepId,
    });

    return { success: true };
  },

  unlockNextStep: () => {
    const { steps, stepStates, currentStepId } = get();
    if (!currentStepId) return null;

    const currentIndex = steps.findIndex((s) => s.id === currentStepId);
    if (currentIndex === -1 || currentIndex >= steps.length - 1) return null;

    const nextStep = steps[currentIndex + 1];
    const nextStepState = stepStates.get(nextStep.id);

    if (nextStepState && nextStepState.status === 'locked') {
      nextStepState.status = 'unlocked';
      nextStepState.updated_at = new Date().toISOString();
      stepStates.set(nextStep.id, { ...nextStepState });
      set({ stepStates: new Map(stepStates) });
      return nextStep.id;
    }

    return nextStep.id;
  },

  // --------------------------------------------------------------------------
  // PROGRESS
  // --------------------------------------------------------------------------

  getProgress: () => {
    const { modules, steps, stepStates } = get();

    const completedIds = new Set<string>();
    const skippedIds = new Set<string>();

    stepStates.forEach((state) => {
      if (state.status === 'completed') completedIds.add(state.step_id);
      if (state.status === 'skipped') skippedIds.add(state.step_id);
    });

    const stats = calculateProgress(modules, steps, completedIds, skippedIds);

    return {
      modules_completed: stats.modulesCompleted,
      modules_total: stats.modulesTotal,
      steps_completed: stats.stepsCompleted,
      steps_total: stats.stepsTotal,
      percent: stats.percent,
    };
  },

  isComplete: () => {
    const progress = get().getProgress();
    return progress.steps_completed >= progress.steps_total;
  },

  finishOnboarding: () => {
    const { onboardingState } = get();

    if (onboardingState) {
      onboardingState.status = 'completed';
      onboardingState.completed_at = new Date().toISOString();
      onboardingState.updated_at = new Date().toISOString();
      set({ onboardingState: { ...onboardingState } });
    }
  },

  // --------------------------------------------------------------------------
  // VIEW HELPERS
  // --------------------------------------------------------------------------

  getOnboardingView: () => {
    const { modules, steps, onboardingState, stepStates, currentStepId } = get();

    if (!onboardingState) return null;

    const modulesWithSteps = get().getModulesWithSteps();
    const currentStep = get().getCurrentStepWithState();

    return {
      program: FOUNDER_ZERO_TO_ONE_PROGRAM,
      modules: modulesWithSteps,
      state: onboardingState,
      current_step: currentStep ?? undefined,
    };
  },

  getCurrentStepWithState: () => {
    const { steps, modules, stepStates, currentStepId } = get();
    if (!currentStepId) return null;

    const step = steps.find((s) => s.id === currentStepId);
    if (!step) return null;

    const module = modules.find((m) => m.id === step.module_id);
    if (!module) return null;

    const state = stepStates.get(currentStepId);

    return {
      ...step,
      state,
      module,
    };
  },

  getModulesWithSteps: () => {
    const { modules, steps, stepStates } = get();

    return modules.map((module) => {
      const moduleSteps = steps
        .filter((s) => s.module_id === module.id)
        .map((step) => ({
          ...step,
          state: stepStates.get(step.id),
          module,
        }));

      const completionCount = moduleSteps.filter(
        (s) => s.state?.status === 'completed' || s.state?.status === 'skipped'
      ).length;

      return {
        ...module,
        steps: moduleSteps,
        completion_count: completionCount,
        total_count: moduleSteps.filter((s) => s.is_required).length,
      };
    });
  },
}));
