/**
 * People Component - Type Definitions
 *
 * Three-layer data model for talent management:
 * 1. Universal Marketplace (global, opt-in)
 * 2. Company People Layer (per workspace)
 * 3. Personal Contacts Layer (per user)
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type PersonType = 'fractional_exec' | 'apprentice' | 'advisor' | 'contractor' | 'other';

export type SeniorityBand = 'junior' | 'mid' | 'senior' | 'exec';

export type VerificationStatus = 'stub' | 'invited' | 'opted_in' | 'verified';

export type ProfileVisibility = 'private' | 'marketplace';

export type ContactType = 'email' | 'linkedin' | 'website' | 'contact_form' | 'phone' | 'twitter' | 'github' | 'calendly';

export type ContactVisibility = 'private' | 'marketplace';

export type SourceType = 'referral' | 'manual' | 'import' | 'event' | 'platform';

export type EducationStatus = 'degree_apprentice' | 'final_year' | 'graduate' | 'career_changer' | 'self_taught' | 'other';

export type EvidenceType = 'cv' | 'portfolio' | 'reference' | 'certification' | 'press' | 'linkedin' | 'website' | 'other';

export type RelationshipType = 'candidate' | 'advisor' | 'fractional_exec' | 'apprentice' | 'employee' | 'contractor' | 'other';

export type PipelineStage = 'identified' | 'contacted' | 'intro_call' | 'trial' | 'engaged' | 'rejected' | 'archived';

export type Priority = 'low' | 'med' | 'high' | 'urgent';

export type InteractionType = 'email' | 'call' | 'meeting' | 'message' | 'note' | 'interview' | 'reference_check';

export type DocType = 'nda' | 'contract' | 'sow' | 'invoice' | 'cv' | 'reference' | 'other';

export type RelationshipStrength = 'weak' | 'medium' | 'strong';

export type InviteStatus = 'pending' | 'sent' | 'opened' | 'completed' | 'expired' | 'cancelled';

// ============================================================================
// TAXONOMY CONSTANTS
// ============================================================================

export const ROLE_ARCHETYPES = {
  // Fractional Executives
  fractional_ceo: 'Fractional CEO',
  fractional_coo: 'Fractional COO',
  fractional_cfo: 'Fractional CFO',
  fractional_cto: 'Fractional CTO',
  fractional_cmo: 'Fractional CMO',
  fractional_cpo: 'Fractional CPO',
  fractional_cro: 'Fractional CRO',
  fractional_chro: 'Fractional CHRO',
  fractional_cso: 'Fractional CSO',
  fractional_cdo: 'Fractional CDO',
  // Advisors
  advisor_board: 'Board Advisor',
  advisor_strategic: 'Strategic Advisor',
  advisor_technical: 'Technical Advisor',
  advisor_industry: 'Industry Advisor',
  advisor_investor: 'Investor Advisor',
  // Contractors
  contractor_engineering: 'Engineering Contractor',
  contractor_design: 'Design Contractor',
  contractor_marketing: 'Marketing Contractor',
  contractor_sales: 'Sales Contractor',
  contractor_ops: 'Ops Contractor',
  contractor_finance: 'Finance Contractor',
  // Apprentices
  apprentice_finance: 'Finance Apprentice',
  apprentice_ops: 'Ops Apprentice',
  apprentice_engineering: 'Engineering Apprentice',
  apprentice_cad: 'CAD/Design Apprentice',
  apprentice_sales: 'Sales Apprentice',
  apprentice_marketing: 'Marketing Apprentice',
  apprentice_data: 'Data Apprentice',
} as const;

export type RoleArchetype = keyof typeof ROLE_ARCHETYPES;

export const SECTOR_TAGS = [
  // Technology
  'saas', 'fintech', 'healthtech', 'edtech', 'proptech', 'legaltech',
  'insurtech', 'regtech', 'martech', 'hrtech', 'cleantech', 'agritech',
  'foodtech', 'biotech', 'medtech', 'deeptech', 'spacetech', 'climatetech',
  // Hardware
  'hardware', 'robotics', 'iot', 'semiconductors', 'electronics',
  'manufacturing', 'automotive', 'aerospace', 'defence', 'energy',
  // Consumer
  'consumer', 'ecommerce', 'marketplace', 'retail', 'd2c', 'cpg',
  'fashion', 'beauty', 'food_beverage', 'travel', 'hospitality',
  // B2B
  'b2b', 'enterprise', 'smb', 'infrastructure', 'developer_tools',
  'data_analytics', 'cybersecurity', 'ai_ml',
  // Other
  'media', 'entertainment', 'gaming', 'sports', 'social', 'education',
  'nonprofit', 'government',
] as const;

export type SectorTag = typeof SECTOR_TAGS[number];

export const STAGE_FIT_TAGS = [
  'idea', 'mvp', 'pre_seed', 'seed', 'series_a', 'series_b',
  'series_c_plus', 'growth', 'scale', 'turnaround', 'exit',
] as const;

export type StageFitTag = typeof STAGE_FIT_TAGS[number];

// ============================================================================
// LAYER 1: UNIVERSAL MARKETPLACE TYPES
// ============================================================================

export interface CompensationPreferences {
  day_rate_min?: number;
  day_rate_max?: number;
  equity_interest?: boolean;
  retainer_preferred?: boolean;
  currency?: 'GBP' | 'USD' | 'EUR';
}

export interface UniversalPerson {
  id: string;
  display_name: string;
  headline?: string;
  bio?: string;
  person_type: PersonType;
  location_city?: string;
  location_country: string;
  timezone: string;
  remote_ok: boolean;
  availability_hours_per_week?: number;
  availability_start_date?: string;
  notice_period_weeks: number;
  seniority_band: SeniorityBand;
  role_archetypes: RoleArchetype[];
  sector_tags: SectorTag[];
  skill_tags: string[];
  stage_fit_tags: StageFitTag[];
  education_status?: EducationStatus;
  compensation_preferences_json?: CompensationPreferences;
  verification_status: VerificationStatus;
  profile_visibility: ProfileVisibility;
  confidence_score: number;
  source_type: SourceType;
  source_notes?: string;
  opted_in_at?: string;
  consent_version?: string;
  current_org_id?: string;
  current_org_name?: string;
  created_at: string;
  updated_at: string;
  last_verified_at?: string;
  last_active_at?: string;
}

export interface UniversalPersonContact {
  id: string;
  person_id: string;
  contact_type: ContactType;
  contact_value: string;
  visibility: ContactVisibility;
  is_public: boolean;
  is_primary: boolean;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UniversalPersonEvidence {
  id: string;
  person_id: string;
  evidence_type: EvidenceType;
  title?: string;
  url: string;
  notes?: string;
  last_verified_at?: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface PeopleInvite {
  id: string;
  email: string;
  token: string;
  invited_by_user_id?: string;
  invited_by_workspace_id?: string;
  prefill_name?: string;
  prefill_role_archetypes?: RoleArchetype[];
  prefill_source_notes?: string;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
  sent_at?: string;
  opened_at?: string;
  completed_at?: string;
  person_id?: string;
}

// ============================================================================
// LAYER 2: COMPANY PEOPLE LAYER TYPES
// ============================================================================

export interface CompanyPeopleRelationship {
  id: string;
  workspace_id: string;
  person_id: string;
  relationship_type: RelationshipType;
  pipeline_stage: PipelineStage;
  owner_user_id?: string;
  warm_intro_available: boolean;
  priority: Priority;
  notes_private?: string;
  target_role_archetype?: RoleArchetype;
  target_hours_per_week?: number;
  target_start_date?: string;
  created_at: string;
  updated_at: string;
  stage_changed_at: string;
  // Joined data
  person?: UniversalPerson;
}

export interface CompanyPeopleInteraction {
  id: string;
  relationship_id: string;
  interaction_type: InteractionType;
  occurred_at: string;
  summary: string;
  next_steps?: string;
  logged_by_user_id?: string;
  created_at: string;
}

export interface CompanyPeopleDoc {
  id: string;
  relationship_id: string;
  doc_type: DocType;
  title?: string;
  url: string;
  notes?: string;
  uploaded_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LAYER 3: PERSONAL CONTACTS LAYER TYPES
// ============================================================================

export interface PersonalContact {
  id: string;
  user_id: string;
  person_id?: string;
  org_id?: string;
  contact_name?: string;
  contact_org_name?: string;
  label?: string;
  relationship_strength: RelationshipStrength;
  warm_intro_notes?: string;
  last_contacted_at?: string;
  do_not_contact: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  person?: UniversalPerson;
}

// ============================================================================
// APPRENTICE ROLE PACKS
// ============================================================================

export interface ApprenticeRolePack {
  id: string;
  name: string;
  description?: string;
  role_archetype: RoleArchetype;
  skill_requirements: string[];
  typical_hours_per_week: number;
  task_templates_json: TaskTemplate[];
  created_at: string;
}

export interface TaskTemplate {
  title: string;
  notes: string;
  source: string;
}

// ============================================================================
// SEARCH & WIZARD TYPES
// ============================================================================

export interface PeopleSearchFilters {
  query?: string;
  person_type?: PersonType;
  seniority_band?: SeniorityBand;
  role_archetypes?: RoleArchetype[];
  sector_tags?: SectorTag[];
  skill_tags?: string[];
  stage_fit_tags?: StageFitTag[];
  location_country?: string;
  remote_ok?: boolean;
  min_hours?: number;
  max_hours?: number;
  verification_status?: VerificationStatus[];
  limit?: number;
  offset?: number;
}

export interface PeopleSearchResult extends UniversalPerson {
  match_score: number;
  match_explanation?: string[];
  contacts?: UniversalPersonContact[]; // Only public contacts
}

export interface WizardInterpretation {
  role?: RoleArchetype;
  role_alternatives?: RoleArchetype[];
  sectors?: SectorTag[];
  stages?: StageFitTag[];
  location?: string;
  remote_ok?: boolean;
  hours_per_week?: number;
  urgency?: 'low' | 'medium' | 'high';
  additional_requirements?: string[];
  raw_intent?: string;
  confidence: number;
}

export interface WizardRequest {
  transcript?: string;
  text?: string;
}

export interface WizardResponse {
  interpretation: WizardInterpretation;
  search_results: PeopleSearchResult[];
  suggestions?: string[];
}

// ============================================================================
// PIPELINE TYPES
// ============================================================================

export interface PipelineStats {
  pipeline_stage: PipelineStage;
  relationship_type: RelationshipType;
  count: number;
}

export interface PipelineColumn {
  stage: PipelineStage;
  label: string;
  color: string;
  candidates: CompanyPeopleRelationship[];
}

// ============================================================================
// OUTREACH DRAFT TYPES
// ============================================================================

export interface OutreachDraftRequest {
  relationship_id: string;
  templates: OutreachTemplate[];
}

export type OutreachTemplate =
  | 'email_introduction'
  | 'schedule_call'
  | 'send_nda'
  | 'prepare_interview'
  | 'check_references'
  | 'send_offer'
  | 'onboarding_checklist';

export interface OutreachDraft {
  id: string;
  workspace_id: string;
  created_by_user_id: string;
  assignee_user_id: string;
  title: string;
  notes: string;
  start_iso: string;
  due_iso: string;
  units: number;
  source: 'people_outreach' | 'people_scheduling' | 'people_docs' | 'people_onboarding' | 'people_apprentice_pack';
  status: 'pending_confirmation' | 'confirmed' | 'discarded';
  confidence_assignee: number;
  confidence_due: number;
  // Metadata
  relationship_id?: string;
  person_id?: string;
  person_name?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PeopleApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OnboardingRequest {
  token: string;
  display_name: string;
  person_type: PersonType;
  headline?: string;
  bio?: string;
  role_archetypes: RoleArchetype[];
  sector_tags: SectorTag[];
  skill_tags: string[];
  stage_fit_tags: StageFitTag[];
  seniority_band: SeniorityBand;
  location_city?: string;
  location_country: string;
  remote_ok: boolean;
  availability_hours_per_week?: number;
  availability_start_date?: string;
  education_status?: EducationStatus;
  profile_visibility: ProfileVisibility;
  contacts?: Array<{
    contact_type: ContactType;
    contact_value: string;
    is_public: boolean;
  }>;
  consent_agreed: boolean;
}

export interface CreateStubRequest {
  display_name: string;
  person_type?: PersonType;
  linkedin_url?: string;
  source_type: SourceType;
  source_notes?: string;
  role_archetypes?: RoleArchetype[];
  sector_tags?: SectorTag[];
  target_role_archetype?: RoleArchetype;
  target_hours_per_week?: number;
  notes_private?: string;
}

export interface UpdateRelationshipRequest {
  pipeline_stage?: PipelineStage;
  relationship_type?: RelationshipType;
  priority?: Priority;
  notes_private?: string;
  target_role_archetype?: RoleArchetype;
  target_hours_per_week?: number;
  target_start_date?: string;
  owner_user_id?: string;
  warm_intro_available?: boolean;
}

// ============================================================================
// WARM INTRO TYPES
// ============================================================================

export interface WarmIntroOpportunity {
  contact_user_id: string;
  contact_user_name: string;
  person_id: string;
  person_name: string;
  relationship_strength: RelationshipStrength;
  warm_intro_notes?: string;
}

// ============================================================================
// SEEDING & PARTNERSHIPS TYPES
// ============================================================================

export type PartnerOrgType = 'university' | 'bootcamp' | 'provider' | 'community' | 'other';

export type PartnerStatus = 'not_contacted' | 'contacted' | 'in_conversation' | 'active' | 'paused' | 'declined';

export interface PartnerOrg {
  id: string;
  name: string;
  org_type: PartnerOrgType;
  region: string;
  contact_name?: string;
  contact_email?: string;
  contact_url?: string;
  status: PartnerStatus;
  volume_estimate?: number;
  quality_score?: number;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  last_contacted_at?: string;
  next_followup_at?: string;
  workspace_id?: string;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

export type SeedSourceType = 'network' | 'event' | 'import' | 'manual';

export interface SeedBatch {
  id: string;
  source_type: SeedSourceType;
  source_name?: string;
  total_rows: number;
  created_count: number;
  duplicate_count: number;
  error_count: number;
  raw_data_json?: unknown;
  error_details_json?: unknown;
  workspace_id?: string;
  created_by_user_id?: string;
  created_at: string;
}

export interface SeedRow {
  name: string;
  linkedin_url?: string;
  role_archetype?: RoleArchetype;
  sector_tags?: string;
  notes?: string;
  email?: string;
}

export interface SeedUploadResult {
  batch_id: string;
  total_rows: number;
  created: number;
  duplicates: number;
  errors: number;
  created_person_ids: string[];
  duplicate_matches: Array<{
    row_index: number;
    input_name: string;
    match_id: string;
    match_name: string;
    match_type: string;
  }>;
  error_details: Array<{
    row_index: number;
    error: string;
  }>;
}

export type ApprenticeAppStatus = 'new' | 'screening' | 'interview' | 'offer' | 'accepted' | 'rejected' | 'withdrawn';

export interface ApprenticeApplication {
  id: string;
  name: string;
  email: string;
  linkedin_url?: string;
  education_status?: EducationStatus;
  interests_json?: RoleArchetype[];
  availability_hours_per_week?: number;
  availability_start_date?: string;
  location_city?: string;
  location_country: string;
  remote_ok: boolean;
  bio?: string;
  portfolio_url?: string;
  referral_source?: string;
  status: ApprenticeAppStatus;
  converted_person_id?: string;
  workspace_id?: string;
  processed_by_user_id?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export interface VerificationChecklist {
  linkedin_confirmed: boolean;
  role_history_checked: boolean;
  evidence_count: number;
  references_checked: boolean;
  notes?: string;
}

export interface VerificationAuditEntry {
  id: string;
  person_id: string;
  action: 'verify' | 'unverify' | 'flag' | 'update_visibility';
  previous_status?: string;
  new_status?: string;
  previous_visibility?: string;
  new_visibility?: string;
  checklist_json?: VerificationChecklist;
  verified_by_user_id?: string;
  created_at: string;
}

export interface SeedingStats {
  verification_status: Record<VerificationStatus, number>;
  person_type: Record<PersonType, number>;
  invite_status: Record<InviteStatus, number>;
  partner_status: Record<PartnerStatus, number>;
  apprentice_app_status: Record<ApprenticeAppStatus, number>;
  stale_invites_count: number;
}

export interface StaleInvite {
  invite_id: string;
  person_id?: string;
  person_name: string;
  email: string;
  linkedin_url?: string;
  invited_at: string;
  days_since_invite: number;
  followup_count: number;
}

export interface InviteTemplateData {
  person_name: string;
  role?: string;
  sector?: string;
  event_name?: string;
  referrer_name?: string;
  invite_link: string;
  your_name: string;
}

export type InviteChannel = 'email' | 'linkedin' | 'other';

export interface BulkInviteRequest {
  person_ids: string[];
  channel: InviteChannel;
  template_type?: 'warm' | 'cold' | 'event' | 'referral';
}
