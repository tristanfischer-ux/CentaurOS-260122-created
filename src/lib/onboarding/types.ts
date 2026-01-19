/**
 * Founder Onboarding Types
 * Types for the onboarding checklist system
 */

// =============================================================================
// PROGRAM STRUCTURE
// =============================================================================

export interface OnboardingProgram {
  id: string;
  name: string;
  description?: string;
  version: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingModule {
  id: string;
  program_id: string;
  module_key: ModuleKey;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  order_index: number;
  stage_applicability: StageApplicability;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStep {
  id: string;
  module_id: string;
  step_key: string;
  title: string;
  description_short: string;
  description_long?: string;
  order_index: number;
  required_inputs: InputField[];
  evidence_requirements: EvidenceRequirement[];
  outputs_templates: OutputTemplates;
  gating_rules: GatingRules;
  stage_applicability?: StageApplicability;
  llm_prompt_template?: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// COMPANY STATE
// =============================================================================

export interface CompanyOnboardingState {
  id: string;
  company_id: string;
  program_id: string;
  current_module_id?: string;
  current_step_id?: string;
  progress: OnboardingProgress;
  status: OnboardingStatus;
  org_stage?: OrgStage;
  finance_stage?: FinanceStage;
  started_at: string;
  completed_at?: string;
  updated_at: string;
}

export interface CompanyOnboardingStepState {
  id: string;
  company_id: string;
  step_id: string;
  onboarding_state_id: string;
  status: StepStatus;
  inputs: Record<string, InputValue>;
  evidence: Record<string, EvidenceValue>;
  skip_reason?: string;
  generated_outputs?: GeneratedOutputs;
  started_at?: string;
  completed_at?: string;
  skipped_at?: string;
  updated_at: string;
}

export interface OnboardingOutputLink {
  id: string;
  company_id: string;
  step_id: string;
  step_state_id: string;
  objective_id?: string;
  task_draft_id?: string;
  task_id?: string;
  output_type: 'objective' | 'task_draft' | 'task';
  created_at: string;
}

// =============================================================================
// TASK DRAFTS
// =============================================================================

export interface OnboardingTaskDraft {
  id: string;
  company_id: string;
  title: string;
  notes?: string;
  units: number;
  assignee_hint: AssigneeHint;
  assignee_id?: string;
  due_iso?: string;
  start_iso?: string;
  source_type: DraftSourceType;
  source_step_id?: string;
  source_objective_id?: string;
  status: DraftStatus;
  confidence_score: number;
  created_at: string;
  confirmed_at?: string;
  created_by: string;
  confirmed_task_id?: string;
}

// =============================================================================
// ENUMS & LITERALS
// =============================================================================

export type ModuleKey =
  | 'foundation'
  | 'market'
  | 'product'
  | 'go_to_market'
  | 'finance'
  | 'people'
  | 'ops';

export type OnboardingStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export type StepStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed' | 'skipped';

export type OrgStage = 'S0' | 'S1' | 'S2' | 'S3' | 'S4';

export type FinanceStage = 'F0' | 'F1' | 'F2' | 'F3';

export type AssigneeHint = 'founder' | 'exec' | 'apprentice' | 'unassigned';

export type DraftSourceType = 'onboarding' | 'brainstorm' | 'voice' | 'import' | 'manual';

export type DraftStatus = 'pending' | 'confirmed' | 'rejected' | 'expired';

export type EvidenceType = 'text' | 'list' | 'link' | 'file' | 'transcript';

export type InputType = 'text' | 'textarea' | 'transcript' | 'select' | 'multiselect' | 'number';

// =============================================================================
// SUB-TYPES
// =============================================================================

export interface StageApplicability {
  org_stages?: OrgStage[];
  finance_stages?: FinanceStage[];
  required?: boolean;
  auto_skip_if?: SkipCondition[];
}

export interface SkipCondition {
  field: string;
  operator: 'exists' | 'equals' | 'not_equals' | 'gt' | 'lt';
  value?: string | number | boolean;
}

export interface InputField {
  key: string;
  type: InputType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  options?: { label: string; value: string }[];
}

export interface EvidenceRequirement {
  key: string;
  label: string;
  type: EvidenceType;
  description?: string;
  min_length?: number;
  min_items?: number;
  url_pattern?: string;
}

export interface OutputTemplates {
  objectives?: ObjectiveTemplate[];
  task_drafts?: TaskDraftTemplate[];
}

export interface ObjectiveTemplate {
  title_template: string;
  description_template?: string;
  category: 'growth' | 'product' | 'operations' | 'financial' | 'team';
  period?: string;
}

export interface TaskDraftTemplate {
  title_template: string;
  notes_template?: string;
  units: number;
  assignee_hint: AssigneeHint;
  due_offset_days?: number;
}

export interface GatingRules {
  requires_step_ids?: string[];
  min_evidence_count?: number;
  allow_skip: boolean;
}

export interface OnboardingProgress {
  modules_completed: number;
  modules_total: number;
  steps_completed: number;
  steps_total: number;
  percent: number;
}

export interface InputValue {
  value: string | string[] | number;
  timestamp: string;
}

export interface EvidenceValue {
  value: string | string[];
  type: EvidenceType;
  satisfied: boolean;
  timestamp: string;
}

export interface GeneratedOutputs {
  objectives: GeneratedObjective[];
  task_drafts: GeneratedTaskDraft[];
  missing_info?: string[];
  suggested_evidence?: string[];
}

export interface GeneratedObjective {
  id: string;
  title: string;
  description?: string;
  category: 'growth' | 'product' | 'operations' | 'financial' | 'team';
  period?: string;
  is_editable: boolean;
}

export interface GeneratedTaskDraft {
  id: string;
  title: string;
  notes?: string;
  units: number;
  assignee_hint: AssigneeHint;
  due_offset_days?: number;
  is_editable: boolean;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface StartOnboardingRequest {
  company_id: string;
  user_id: string;
  program_id?: string; // Uses default if not specified
  org_stage?: OrgStage;
  finance_stage?: FinanceStage;
}

export interface StartOnboardingResponse {
  success: boolean;
  data?: {
    onboarding_state: CompanyOnboardingState;
    current_step: OnboardingStep;
    step_state: CompanyOnboardingStepState;
  };
  error?: string;
}

export interface UpdateStepRequest {
  company_id: string;
  step_state_id: string;
  inputs?: Record<string, InputValue>;
  evidence?: Record<string, EvidenceValue>;
}

export interface GenerateOutputsRequest {
  company_id: string;
  step_id: string;
  inputs: Record<string, InputValue>;
  use_llm?: boolean;
}

export interface GenerateOutputsResponse {
  success: boolean;
  data?: GeneratedOutputs;
  error?: string;
}

export interface CompleteStepRequest {
  company_id: string;
  step_state_id: string;
}

export interface SkipStepRequest {
  company_id: string;
  step_state_id: string;
  reason: string;
}

export interface SendDraftsToWhatRequest {
  company_id: string;
  step_state_id: string;
  objectives: GeneratedObjective[];
  task_drafts: GeneratedTaskDraft[];
  user_id: string;
}

// =============================================================================
// VIEW MODELS
// =============================================================================

export interface OnboardingStepWithState extends OnboardingStep {
  state?: CompanyOnboardingStepState;
  module: OnboardingModule;
}

export interface OnboardingModuleWithSteps extends OnboardingModule {
  steps: OnboardingStepWithState[];
  completion_count: number;
  total_count: number;
}

export interface OnboardingView {
  program: OnboardingProgram;
  modules: OnboardingModuleWithSteps[];
  state: CompanyOnboardingState;
  current_step?: OnboardingStepWithState;
}
