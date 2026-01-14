/**
 * OKR Planner Types
 * Data structures for the strategy + resource planning system
 */

import type { PlanConfidence, PlanArchetype, Function as BusinessFunction } from '@/types';

export interface ToolEffect {
  toolId: string;
  slot: 'weapon' | 'armor' | 'utility' | 'support';
  speedMult: number; // e.g., 1.2 = +20% speed
  qualityMult: number; // e.g., 1.1 = +10% quality
  overheadDeltaPct: number; // e.g., -2 means reduces overhead by 2%
  reworkRiskDeltaPct: number; // e.g., -10 means reduces rework risk by 10%
  weeklyCostGBP: number;
}

export interface MemberAllocation {
  memberId: string;
  allocationPct: number; // 0-100
}

export interface SquadAllocation {
  squadId: string;
  allocationPct: number; // 0-100
}

export interface ToolAttachment {
  memberId: string;
  toolIds: string[]; // Up to 4 tools per person
}

export interface OKRPlanSnapshot {
  allocations: {
    members: MemberAllocation[];
    squads?: SquadAllocation[];
  };
  toolAttachments: ToolAttachment[];
  timestamp: string;
}

export interface OKRPlan {
  id: string;
  workspaceId: string;
  okrId: string;
  targetWeeks: number;
  costOfDelayPerWeekGBP: number;
  allocations: {
    members: MemberAllocation[];
    squads?: SquadAllocation[];
  };
  toolAttachments: ToolAttachment[];
  createdAt: string;
  updatedAt: string;
  lastAppliedPresetId?: string;
  undoStack?: OKRPlanSnapshot[];
}

export interface ForecastComparison {
  baselineEtaWeeks: number;
  baselineCostGBP: number;
  weeksSaved: number;
  extraCostGBP: number;
  costPerWeekSaved: number;
  netAccelerationValuePerWeek: number; // CoD/week - cost/week saved
}

export interface ForecastMetrics {
  burnPerWeekGBP: number;
  etaWeeksP50: number;
  etaWeeksP90: number;
  totalCostP50: number;
  overheadPct: number;
  wastedHoursPerWeek: number;
  wastedCostPerWeekGBP: number;
  reworkRiskPct: number;
  expectedReworkCostGBP: number;
  confidence: PlanConfidence;
  comparison?: ForecastComparison;
}

export interface AllocationRule {
  minApprentices?: number;
  maxApprentices?: number;
  minExecs?: number;
  maxExecs?: number;
  requiresFounder?: boolean;
  allocationPct: number; // Default allocation percentage
}

export interface PlanPreset {
  id: string;
  name: string;
  description: string;
  archetype: PlanArchetype;
  defaultAllocations: {
    apprenticeCount: number;
    execCount: number;
    founderInvolved: boolean;
    allocationPct: number;
  };
  defaultToolTags: {
    role: 'Founder' | 'FractionalExec' | 'Apprentice';
    tags: string[]; // e.g., ['weapon', 'verification', 'automation']
  }[];
  intendedFor: {
    functions: BusinessFunction[];
    urgencyRange: [number, number]; // [min costOfDelay, max costOfDelay]
    runwayRange?: [number, number]; // [min weeks, max weeks]
  };
  notes: string;
  risks: string[];
  mitigationTips: string[];
}

export interface CalibrationData {
  throughputMultiplier: number; // 1.0 = accurate, >1 = faster than expected, <1 = slower
  overheadMultiplier: number; // 1.0 = accurate
  reworkMultiplier: number; // 1.0 = accurate
}

export interface PlanActuals {
  tasksDoneCount: number;
  hoursLogged: number;
  approvalsCount: number;
  reopenedCount: number;
  supplierDelaysCount: number;
  completedWorkHours: number;
}

export interface PlannerHistoryWeek {
  id: string;
  workspaceId: string;
  weekStartISO: string; // YYYY-MM-DD format
  okrId: string;
  forecastAtPlanning: ForecastMetrics;
  actuals: PlanActuals;
  calibration: CalibrationData;
}

export interface BottleneckDiagnostic {
  id: string;
  type: 'coordination' | 'span-of-control' | 'skill-mismatch' | 'review-bottleneck' | 'supplier-lead-time';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metrics: Record<string, number>;
  recommendations: {
    action: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }[];
}

export interface RecommendedPlan {
  preset: PlanPreset;
  score: number; // 0-100
  reasoning: string;
  forecast: ForecastMetrics;
}

export interface EfficientFrontier {
  cheapest: {
    preset: PlanPreset;
    forecast: ForecastMetrics;
  };
  balanced: {
    preset: PlanPreset;
    forecast: ForecastMetrics;
  };
  fastest: {
    preset: PlanPreset;
    forecast: ForecastMetrics;
  };
}
