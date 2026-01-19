# People Taxonomy

**Version:** 1.0
**Created:** 2026-01-19

## Role Archetypes

### Fractional Executives

| Archetype | Code | Description | Typical Hours/Week |
|-----------|------|-------------|-------------------|
| Fractional CEO | `fractional_ceo` | Strategic leadership, board management | 8-16 |
| Fractional COO | `fractional_coo` | Operations, process optimization | 8-20 |
| Fractional CFO | `fractional_cfo` | Finance, fundraising, compliance | 4-12 |
| Fractional CTO | `fractional_cto` | Technology strategy, architecture | 8-16 |
| Fractional CMO | `fractional_cmo` | Marketing strategy, brand | 8-16 |
| Fractional CPO | `fractional_cpo` | Product strategy, roadmap | 8-16 |
| Fractional CRO | `fractional_cro` | Revenue, sales strategy | 8-16 |
| Fractional CHRO | `fractional_chro` | People ops, culture, hiring | 4-12 |
| Fractional CSO | `fractional_cso` | Sales leadership | 8-16 |
| Fractional CDO | `fractional_cdo` | Data strategy, analytics | 4-12 |

### Advisors

| Archetype | Code | Description |
|-----------|------|-------------|
| Board Advisor | `advisor_board` | Formal board seat or observer |
| Strategic Advisor | `advisor_strategic` | Business strategy guidance |
| Technical Advisor | `advisor_technical` | Technology guidance |
| Industry Advisor | `advisor_industry` | Sector-specific expertise |
| Investor Advisor | `advisor_investor` | Fundraising guidance |

### Contractors

| Archetype | Code | Description |
|-----------|------|-------------|
| Engineering Contractor | `contractor_engineering` | Software development |
| Design Contractor | `contractor_design` | UI/UX, product design |
| Marketing Contractor | `contractor_marketing` | Campaign execution |
| Sales Contractor | `contractor_sales` | Business development |
| Ops Contractor | `contractor_ops` | Operations support |
| Finance Contractor | `contractor_finance` | Bookkeeping, FP&A |

### Apprentices

| Archetype | Code | Description | Typical Hours/Week |
|-----------|------|-------------|-------------------|
| Finance Apprentice | `apprentice_finance` | FP&A, bookkeeping support | 16-40 |
| Ops Apprentice | `apprentice_ops` | Process, admin support | 16-40 |
| Engineering Apprentice | `apprentice_engineering` | Junior development | 16-40 |
| CAD/Design Apprentice | `apprentice_cad` | Mechanical/product design | 16-40 |
| Sales Apprentice | `apprentice_sales` | SDR, lead generation | 16-40 |
| Marketing Apprentice | `apprentice_marketing` | Content, campaigns | 16-40 |
| Data Apprentice | `apprentice_data` | Analytics, reporting | 16-40 |

## Seniority Bands

| Band | Code | Years Experience | Typical Day Rate (UK) |
|------|------|------------------|----------------------|
| Junior | `junior` | 0-2 | £150-300 |
| Mid | `mid` | 3-5 | £300-500 |
| Senior | `senior` | 6-10 | £500-800 |
| Executive | `exec` | 10+ | £800-1500+ |

## Sector Tags

### Primary Sectors

```typescript
const SECTOR_TAGS = [
  // Technology
  'saas',
  'fintech',
  'healthtech',
  'edtech',
  'proptech',
  'legaltech',
  'insurtech',
  'regtech',
  'martech',
  'hrtech',
  'cleantech',
  'agritech',
  'foodtech',
  'biotech',
  'medtech',
  'deeptech',
  'spacetech',
  'climatetech',

  // Hardware
  'hardware',
  'robotics',
  'iot',
  'semiconductors',
  'electronics',
  'manufacturing',
  'automotive',
  'aerospace',
  'defence',
  'energy',

  // Consumer
  'consumer',
  'ecommerce',
  'marketplace',
  'retail',
  'd2c',
  'cpg',
  'fashion',
  'beauty',
  'food_beverage',
  'travel',
  'hospitality',

  // B2B
  'b2b',
  'enterprise',
  'smb',
  'infrastructure',
  'developer_tools',
  'data_analytics',
  'cybersecurity',
  'ai_ml',

  // Other
  'media',
  'entertainment',
  'gaming',
  'sports',
  'social',
  'education',
  'nonprofit',
  'government',
] as const;
```

## Skill Tags

### Functional Skills

```typescript
const SKILL_TAGS = {
  // Leadership & Strategy
  leadership: [
    'strategic_planning',
    'board_management',
    'executive_coaching',
    'change_management',
    'crisis_management',
    'turnaround',
    'scaling',
    'exit_planning',
    'm_and_a',
  ],

  // Finance
  finance: [
    'financial_modeling',
    'fundraising',
    'investor_relations',
    'budgeting',
    'fp_and_a',
    'cash_flow_management',
    'unit_economics',
    'due_diligence',
    'cap_table',
    'r_and_d_tax_credits',
    'seis_eis',
    'grant_applications',
  ],

  // Operations
  operations: [
    'process_optimization',
    'supply_chain',
    'procurement',
    'inventory_management',
    'quality_management',
    'lean_manufacturing',
    'six_sigma',
    'project_management',
    'vendor_management',
    'office_management',
  ],

  // Technology
  technology: [
    'software_architecture',
    'system_design',
    'cloud_infrastructure',
    'data_engineering',
    'machine_learning',
    'security',
    'devops',
    'technical_due_diligence',
    'build_vs_buy',
    'technical_hiring',
  ],

  // Product
  product: [
    'product_strategy',
    'product_roadmap',
    'user_research',
    'product_analytics',
    'product_market_fit',
    'pricing_strategy',
    'competitive_analysis',
    'feature_prioritization',
  ],

  // Sales & Revenue
  sales: [
    'sales_strategy',
    'sales_ops',
    'sales_enablement',
    'enterprise_sales',
    'smb_sales',
    'channel_partnerships',
    'account_management',
    'revenue_operations',
    'pricing',
    'contracts',
  ],

  // Marketing
  marketing: [
    'brand_strategy',
    'content_marketing',
    'performance_marketing',
    'seo',
    'social_media',
    'pr',
    'demand_gen',
    'marketing_automation',
    'product_marketing',
    'events',
  ],

  // People
  people: [
    'talent_acquisition',
    'employer_branding',
    'compensation_benefits',
    'performance_management',
    'culture_building',
    'org_design',
    'dei',
    'hr_compliance',
    'employee_engagement',
  ],

  // Legal & Compliance
  legal: [
    'contracts',
    'ip_protection',
    'data_privacy',
    'gdpr',
    'employment_law',
    'company_secretarial',
    'regulatory_compliance',
  ],

  // Industry-Specific
  industry: [
    'hardware_development',
    'manufacturing_ops',
    'regulatory_affairs',
    'clinical_trials',
    'fda_approval',
    'ce_marking',
    'iso_certification',
    'automotive_tier1',
    'aerospace_as9100',
  ],
} as const;
```

## Stage Fit Tags

Indicates which company stages the person is best suited for:

```typescript
const STAGE_FIT_TAGS = [
  'idea',           // Pre-product
  'mvp',            // Building first product
  'pre_seed',       // Early traction
  'seed',           // Product-market fit
  'series_a',       // Scaling
  'series_b',       // Growth
  'series_c_plus',  // Late stage
  'growth',         // Revenue scaling
  'scale',          // Large org
  'turnaround',     // Distressed
  'exit',           // M&A/IPO prep
] as const;
```

## Education Status (Apprentices)

```typescript
const EDUCATION_STATUS = [
  'degree_apprentice',  // Currently on degree apprenticeship
  'final_year',         // Final year of degree
  'graduate',           // Recent graduate (<2 years)
  'career_changer',     // Transitioning from another field
  'self_taught',        // No formal education in field
  'other',
] as const;
```

## Availability Preferences

```typescript
interface AvailabilityPreferences {
  hours_per_week_min: number;
  hours_per_week_max: number;
  start_date: string | null;      // ISO date, null = immediately
  notice_period_weeks: number;    // Default 0
  contract_length_preference: 'short_term' | 'medium_term' | 'long_term' | 'ongoing';
  remote_preference: 'remote_only' | 'hybrid' | 'onsite_preferred' | 'flexible';
}
```

## Compensation Preferences

```typescript
interface CompensationPreferences {
  day_rate_min: number | null;
  day_rate_max: number | null;
  equity_interest: boolean;
  retainer_preferred: boolean;
  currency: 'GBP' | 'USD' | 'EUR';
}
```

## Apprentice Role Packs

Pre-configured templates for common apprentice needs:

### Finance Apprentice Pack

```typescript
const FINANCE_APPRENTICE_PACK = {
  name: 'Finance Apprentice',
  role_archetype: 'apprentice_finance',
  skill_requirements: [
    'financial_modeling',
    'budgeting',
    'fp_and_a',
  ],
  typical_hours: 24,
  task_templates: [
    'Draft finance apprentice job posting',
    'Set up screening criteria for finance apprentice',
    'Prepare interview scorecard for finance skills',
    'Create finance onboarding checklist',
  ],
};
```

### Ops Apprentice Pack

```typescript
const OPS_APPRENTICE_PACK = {
  name: 'Ops Apprentice',
  role_archetype: 'apprentice_ops',
  skill_requirements: [
    'process_optimization',
    'project_management',
    'vendor_management',
  ],
  typical_hours: 32,
  task_templates: [
    'Draft ops apprentice job posting',
    'Set up screening criteria for ops apprentice',
    'Prepare interview scorecard for ops skills',
    'Create ops onboarding checklist',
  ],
};
```

### CAD/Engineering Apprentice Pack

```typescript
const CAD_APPRENTICE_PACK = {
  name: 'CAD/Engineering Apprentice',
  role_archetype: 'apprentice_cad',
  skill_requirements: [
    'hardware_development',
    'manufacturing_ops',
  ],
  typical_hours: 32,
  task_templates: [
    'Draft CAD apprentice job posting',
    'Set up screening criteria for CAD skills',
    'Prepare practical CAD assessment task',
    'Create engineering onboarding checklist',
  ],
};
```

### Sales Apprentice Pack

```typescript
const SALES_APPRENTICE_PACK = {
  name: 'Sales Apprentice',
  role_archetype: 'apprentice_sales',
  skill_requirements: [
    'sales_enablement',
    'demand_gen',
  ],
  typical_hours: 40,
  task_templates: [
    'Draft sales apprentice job posting',
    'Set up screening criteria for sales aptitude',
    'Prepare sales roleplay assessment',
    'Create sales onboarding checklist',
  ],
};
```

## Matching Weights

Used by the talent matching wizard:

```typescript
const MATCHING_WEIGHTS = {
  role_archetype_exact: 20,
  role_archetype_similar: 10,
  sector_match_first: 15,
  sector_match_additional: 5, // max 3
  stage_fit_exact: 15,
  stage_fit_adjacent: 7,
  availability_fit: 10,
  location_exact: 10,
  location_remote_ok: 5,
  verification_verified: 10,
  verification_opted_in: 5,
  verification_stub: 0,
  confidence_score_factor: 0.1, // multiplied by score
  recency_30_days: 10,
  recency_90_days: 5,
  recency_older: 0,
} as const;
```
