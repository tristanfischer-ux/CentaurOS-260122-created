/**
 * Onboarding Library - Public API
 */

// Types
export * from './types';

// Store
export { useOnboardingStore } from './store';

// Program Data
export {
  FOUNDER_ZERO_TO_ONE_PROGRAM,
  MODULES,
  STEPS_BY_MODULE,
  getAllSteps,
  getStepByKey,
} from './program-data';

// Stage Rules
export {
  mapCompanyStageToOrgStage,
  mapFundingToFinanceStage,
  isApplicableForStage,
  shouldAutoSkip,
  filterModulesForStage,
  filterStepsForStage,
  canUnlockStep,
  canCompleteStep,
  canSkipStep,
  calculateProgress,
  getModulePriorityForStage,
} from './stage-rules';
