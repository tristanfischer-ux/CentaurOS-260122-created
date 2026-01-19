/**
 * Onboarding Stage Rules
 * Handles stage-aware filtering and step unlocking logic
 */

import type {
  OrgStage,
  FinanceStage,
  StageApplicability,
  OnboardingModule,
  OnboardingStep,
  SkipCondition,
} from './types';

// =============================================================================
// STAGE MAPPING
// =============================================================================

/**
 * Map company profile stages to onboarding stage codes
 */
export function mapCompanyStageToOrgStage(
  stage?: 'idea' | 'pre-seed' | 'seed' | 'series-a' | 'series-b+' | 'revenue' | 'growth'
): OrgStage {
  switch (stage) {
    case 'idea':
      return 'S0';
    case 'pre-seed':
      return 'S1';
    case 'seed':
      return 'S2';
    case 'series-a':
      return 'S3';
    case 'series-b+':
    case 'growth':
      return 'S4';
    case 'revenue':
      return 'S2'; // Revenue stage maps to seed-equivalent
    default:
      return 'S0';
  }
}

/**
 * Map funding status to finance stage
 */
export function mapFundingToFinanceStage(
  hasRaised: boolean,
  hasRevenue: boolean,
  isProfitable: boolean
): FinanceStage {
  if (isProfitable) return 'F3';
  if (hasRevenue) return 'F2';
  if (hasRaised) return 'F1';
  return 'F0';
}

// =============================================================================
// STAGE APPLICABILITY CHECKING
// =============================================================================

/**
 * Check if a module/step is applicable for the given stages
 */
export function isApplicableForStage(
  applicability: StageApplicability | undefined,
  orgStage: OrgStage,
  financeStage: FinanceStage
): boolean {
  if (!applicability) return true;

  // Check org stage
  if (applicability.org_stages && applicability.org_stages.length > 0) {
    if (!applicability.org_stages.includes(orgStage)) {
      return false;
    }
  }

  // Check finance stage
  if (applicability.finance_stages && applicability.finance_stages.length > 0) {
    if (!applicability.finance_stages.includes(financeStage)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a step should be auto-skipped based on conditions
 */
export function shouldAutoSkip(
  applicability: StageApplicability | undefined,
  context: Record<string, unknown>
): { skip: boolean; reason?: string } {
  if (!applicability?.auto_skip_if) {
    return { skip: false };
  }

  for (const condition of applicability.auto_skip_if) {
    if (evaluateSkipCondition(condition, context)) {
      return {
        skip: true,
        reason: `Auto-skipped: ${condition.field} ${condition.operator} ${condition.value ?? ''}`,
      };
    }
  }

  return { skip: false };
}

/**
 * Evaluate a single skip condition
 */
function evaluateSkipCondition(
  condition: SkipCondition,
  context: Record<string, unknown>
): boolean {
  const fieldValue = getNestedValue(context, condition.field);

  switch (condition.operator) {
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';

    case 'equals':
      return fieldValue === condition.value;

    case 'not_equals':
      return fieldValue !== condition.value;

    case 'gt':
      return typeof fieldValue === 'number' &&
        typeof condition.value === 'number' &&
        fieldValue > condition.value;

    case 'lt':
      return typeof fieldValue === 'number' &&
        typeof condition.value === 'number' &&
        fieldValue < condition.value;

    default:
      return false;
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

// =============================================================================
// MODULE/STEP FILTERING
// =============================================================================

/**
 * Filter modules based on stage applicability
 */
export function filterModulesForStage(
  modules: OnboardingModule[],
  orgStage: OrgStage,
  financeStage: FinanceStage
): OnboardingModule[] {
  return modules.filter((module) =>
    isApplicableForStage(module.stage_applicability, orgStage, financeStage)
  );
}

/**
 * Filter steps based on stage applicability
 */
export function filterStepsForStage(
  steps: OnboardingStep[],
  orgStage: OrgStage,
  financeStage: FinanceStage
): OnboardingStep[] {
  return steps.filter((step) =>
    isApplicableForStage(step.stage_applicability, orgStage, financeStage)
  );
}

// =============================================================================
// GATING LOGIC
// =============================================================================

/**
 * Check if a step can be unlocked
 */
export function canUnlockStep(
  step: OnboardingStep,
  completedStepIds: Set<string>,
  stepIdMap: Map<string, string> // step_key -> step_id
): boolean {
  const gating = step.gating_rules;
  if (!gating?.requires_step_ids || gating.requires_step_ids.length === 0) {
    return true;
  }

  // All required steps must be completed
  for (const requiredKey of gating.requires_step_ids) {
    const requiredId = stepIdMap.get(requiredKey);
    if (!requiredId || !completedStepIds.has(requiredId)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if step can be marked complete
 */
export function canCompleteStep(
  step: OnboardingStep,
  evidence: Record<string, { satisfied: boolean }>
): { canComplete: boolean; missingEvidence: string[] } {
  const missingEvidence: string[] = [];

  for (const req of step.evidence_requirements) {
    const evidenceItem = evidence[req.key];
    if (!evidenceItem?.satisfied) {
      missingEvidence.push(req.label);
    }
  }

  const minRequired = step.gating_rules?.min_evidence_count ?? step.evidence_requirements.length;
  const satisfiedCount = step.evidence_requirements.filter(
    (req) => evidence[req.key]?.satisfied
  ).length;

  return {
    canComplete: satisfiedCount >= minRequired,
    missingEvidence,
  };
}

/**
 * Check if a step can be skipped
 */
export function canSkipStep(step: OnboardingStep): boolean {
  return step.gating_rules?.allow_skip ?? true;
}

// =============================================================================
// PROGRESS CALCULATION
// =============================================================================

export interface ProgressStats {
  modulesCompleted: number;
  modulesTotal: number;
  stepsCompleted: number;
  stepsTotal: number;
  percent: number;
  currentModuleIndex: number;
  currentStepIndex: number;
}

/**
 * Calculate onboarding progress
 */
export function calculateProgress(
  modules: OnboardingModule[],
  steps: OnboardingStep[],
  completedStepIds: Set<string>,
  skippedStepIds: Set<string>
): ProgressStats {
  const doneStepIds = new Set([...completedStepIds, ...skippedStepIds]);
  const requiredSteps = steps.filter((s) => s.is_required);

  // Count completed steps
  const stepsCompleted = requiredSteps.filter((s) => doneStepIds.has(s.id)).length;
  const stepsTotal = requiredSteps.length;

  // Count completed modules (all required steps done)
  let modulesCompleted = 0;
  for (const module of modules) {
    const moduleSteps = requiredSteps.filter((s) => s.module_id === module.id);
    if (moduleSteps.length > 0 && moduleSteps.every((s) => doneStepIds.has(s.id))) {
      modulesCompleted++;
    }
  }

  // Find current position
  let currentModuleIndex = 0;
  let currentStepIndex = 0;

  for (let mi = 0; mi < modules.length; mi++) {
    const moduleSteps = steps.filter((s) => s.module_id === modules[mi].id);
    for (let si = 0; si < moduleSteps.length; si++) {
      if (!doneStepIds.has(moduleSteps[si].id)) {
        currentModuleIndex = mi;
        currentStepIndex = si;
        break;
      }
    }
    if (currentModuleIndex === mi) break;
  }

  return {
    modulesCompleted,
    modulesTotal: modules.length,
    stepsCompleted,
    stepsTotal,
    percent: stepsTotal > 0 ? Math.round((stepsCompleted / stepsTotal) * 100) : 0,
    currentModuleIndex,
    currentStepIndex,
  };
}

// =============================================================================
// STAGE-BASED PRIORITIZATION
// =============================================================================

interface ModulePriority {
  module_key: string;
  priority: number;
}

/**
 * Get module priority order based on stage
 */
export function getModulePriorityForStage(
  orgStage: OrgStage,
  financeStage: FinanceStage
): ModulePriority[] {
  // Default order
  const defaultOrder: ModulePriority[] = [
    { module_key: 'foundation', priority: 1 },
    { module_key: 'market', priority: 2 },
    { module_key: 'product', priority: 3 },
    { module_key: 'go_to_market', priority: 4 },
    { module_key: 'finance', priority: 5 },
    { module_key: 'people', priority: 6 },
    { module_key: 'ops', priority: 7 },
  ];

  // Adjust based on stage
  if (orgStage === 'S3' || orgStage === 'S4') {
    // Later stage: prioritize ops and finance
    return [
      { module_key: 'ops', priority: 1 },
      { module_key: 'finance', priority: 2 },
      { module_key: 'people', priority: 3 },
      { module_key: 'market', priority: 4 },
      { module_key: 'go_to_market', priority: 5 },
      { module_key: 'product', priority: 6 },
      { module_key: 'foundation', priority: 7 },
    ];
  }

  if (financeStage === 'F2' || financeStage === 'F3') {
    // Revenue stage: prioritize go-to-market and ops
    return [
      { module_key: 'foundation', priority: 1 },
      { module_key: 'market', priority: 2 },
      { module_key: 'go_to_market', priority: 3 },
      { module_key: 'ops', priority: 4 },
      { module_key: 'finance', priority: 5 },
      { module_key: 'people', priority: 6 },
      { module_key: 'product', priority: 7 },
    ];
  }

  return defaultOrder;
}
