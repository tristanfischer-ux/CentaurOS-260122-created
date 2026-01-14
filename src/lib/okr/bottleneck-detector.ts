/**
 * Bottleneck Detector
 * Diagnoses coordination, skill, review, and supplier bottlenecks
 * Provides actionable recommendations to improve plan efficiency
 */

import type { OKRPlan, ForecastMetrics, BottleneckDiagnostic } from './planner-types';
import type { OrganizationMember } from '@/lib/organization-seed';
import type { Function as BusinessFunction } from '@/types';

interface BottleneckInputs {
  plan: OKRPlan;
  forecast: ForecastMetrics;
  members: OrganizationMember[];
  okrFunction: BusinessFunction;
}

/**
 * Detect all bottlenecks in a plan
 */
export function detectBottlenecks(inputs: BottleneckInputs): BottleneckDiagnostic[] {
  const { plan, forecast, members, okrFunction } = inputs;

  const bottlenecks: BottleneckDiagnostic[] = [];

  // Get allocated members
  const allocatedMemberIds = plan.allocations.members.map(a => a.memberId);
  const allocatedMembers = members.filter(m => allocatedMemberIds.includes(m.id));

  // 1. Coordination overhead bottleneck
  if (forecast.overheadPct > 0.40) {
    bottlenecks.push(detectCoordinationBottleneck(forecast, allocatedMembers));
  }

  // 2. Span of control bottleneck
  const spanOfControlIssue = detectSpanOfControlBottleneck(allocatedMembers);
  if (spanOfControlIssue) {
    bottlenecks.push(spanOfControlIssue);
  }

  // 3. Skill mismatch bottleneck
  const skillMismatch = detectSkillMismatch(allocatedMembers, okrFunction);
  if (skillMismatch) {
    bottlenecks.push(skillMismatch);
  }

  // 4. Review bottleneck
  const reviewBottleneck = detectReviewBottleneck(allocatedMembers, forecast);
  if (reviewBottleneck) {
    bottlenecks.push(reviewBottleneck);
  }

  // 5. Rework risk bottleneck
  if (forecast.reworkRiskPct > 30) {
    bottlenecks.push(detectReworkBottleneck(forecast));
  }

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  return bottlenecks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Detect coordination overhead bottleneck
 */
function detectCoordinationBottleneck(
  forecast: ForecastMetrics,
  members: OrganizationMember[]
): BottleneckDiagnostic {
  const overheadPct = forecast.overheadPct;
  const teamSize = members.length;

  const severity: 'high' | 'medium' | 'low' =
    overheadPct > 0.50 ? 'high' : overheadPct > 0.40 ? 'medium' : 'low';

  return {
    id: `bottleneck-coordination-${Date.now()}`,
    type: 'coordination',
    severity,
    title: 'High Coordination Overhead',
    description: `Team coordination is consuming ${(overheadPct * 100).toFixed(0)}% of available capacity. With ${teamSize} people, communication and alignment are slowing down delivery.`,
    metrics: {
      overheadPct: overheadPct * 100,
      teamSize,
      wastedHoursPerWeek: forecast.wastedHoursPerWeek,
      wastedCostPerWeek: forecast.wastedCostPerWeekGBP,
    },
    recommendations: [
      {
        action: 'Split team into 2 smaller, focused work streams with clear boundaries',
        impact: `Could reduce overhead to ~${((overheadPct - 0.15) * 100).toFixed(0)}% and save £${(forecast.wastedCostPerWeekGBP * 0.3 / 1000).toFixed(1)}K/week`,
        effort: 'medium',
      },
      {
        action: 'Add Ops Summarizer AI tool to exec to automate status updates',
        impact: 'Reduces reporting overhead by 2-3% (saves ~£1-2K/week)',
        effort: 'low',
      },
      {
        action: 'Establish clear work streams with minimal dependencies',
        impact: 'Reduces cross-function coordination by 3-5%',
        effort: 'low',
      },
      {
        action: 'Move to async standups instead of daily meetings',
        impact: 'Saves 2-3 hours/week of synchronous meeting time',
        effort: 'low',
      },
    ],
  };
}

/**
 * Detect span of control bottleneck
 */
function detectSpanOfControlBottleneck(
  members: OrganizationMember[]
): BottleneckDiagnostic | null {
  const apprentices = members.filter(m => m.role === 'Apprentice');
  const execs = members.filter(m => m.role === 'FractionalExec');
  const founders = members.filter(m => m.role === 'Founder');

  const apprenticeCount = apprentices.length;
  const execCount = execs.length;
  const founderCount = founders.length;

  // Command capacity limits
  const APPRENTICES_PER_EXEC = 3;
  const APPRENTICES_PER_FOUNDER = 2;

  const maxCapacity = (execCount * APPRENTICES_PER_EXEC) + (founderCount * APPRENTICES_PER_FOUNDER);
  const overloadCount = Math.max(0, apprenticeCount - maxCapacity);

  if (overloadCount > 0) {
    return {
      id: `bottleneck-span-${Date.now()}`,
      type: 'span-of-control',
      severity: overloadCount > 2 ? 'high' : 'medium',
      title: 'Command Capacity Overload',
      description: `${apprenticeCount} apprentices exceed command capacity of ${execCount} exec(s) and ${founderCount} founder(s). ${overloadCount} apprentice(s) lack proper review and guidance.`,
      metrics: {
        apprenticeCount,
        execCount,
        founderCount,
        maxCapacity,
        overloadCount,
      },
      recommendations: [
        {
          action: 'Add 1 more fractional executive to provide review capacity',
          impact: `Increases command capacity by 3 apprentices, reducing overhead by ~6%`,
          effort: 'medium',
        },
        {
          action: 'Reduce team to match current command capacity',
          impact: `Remove ${overloadCount} apprentice(s) to eliminate overload`,
          effort: 'low',
        },
        {
          action: 'Equip execs with verification tools to scale review capacity',
          impact: 'Can partially offset overload by automating quality checks',
          effort: 'low',
        },
      ],
    };
  }

  return null;
}

/**
 * Detect skill mismatch bottleneck
 */
function detectSkillMismatch(
  members: OrganizationMember[],
  okrFunction: BusinessFunction
): BottleneckDiagnostic | null {
  // Count members with matching business function
  const matchingMembers = members.filter(m => m.function === okrFunction);
  const mismatchCount = members.length - matchingMembers.length;

  if (mismatchCount > 0 && members.length > 0) {
    const mismatchPct = (mismatchCount / members.length) * 100;

    if (mismatchPct > 50) {
      return {
        id: `bottleneck-skill-${Date.now()}`,
        type: 'skill-mismatch',
        severity: mismatchPct > 70 ? 'high' : 'medium',
        title: 'Skill-Function Mismatch',
        description: `${mismatchCount} of ${members.length} team members (${mismatchPct.toFixed(0)}%) are working outside their primary function (${okrFunction}). This reduces throughput by 20-40%.`,
        metrics: {
          totalMembers: members.length,
          matchingMembers: matchingMembers.length,
          mismatchCount,
          mismatchPct,
        },
        recommendations: [
          {
            action: `Reassign team to include more ${okrFunction}-specialized members`,
            impact: 'Could increase throughput by 20-40% with proper skill match',
            effort: 'medium',
          },
          {
            action: 'Provide training or documentation to bridge skill gaps',
            impact: 'Reduces skill mismatch penalty from 40% to ~20%',
            effort: 'high',
          },
          {
            action: 'Pair mismatched members with function experts for knowledge transfer',
            impact: 'Gradual improvement over 2-3 weeks',
            effort: 'low',
          },
        ],
      };
    }
  }

  return null;
}

/**
 * Detect review bottleneck
 */
function detectReviewBottleneck(
  members: OrganizationMember[],
  forecast: ForecastMetrics
): BottleneckDiagnostic | null {
  const apprentices = members.filter(m => m.role === 'Apprentice');
  const reviewers = members.filter(m => m.role === 'FractionalExec' || m.role === 'Founder');

  const apprenticeCount = apprentices.length;
  const reviewerCount = reviewers.length;

  // If high apprentice-to-reviewer ratio
  if (apprenticeCount >= 3 && reviewerCount === 1) {
    return {
      id: `bottleneck-review-${Date.now()}`,
      type: 'review-bottleneck',
      severity: 'medium',
      title: 'Review Queue Bottleneck',
      description: `${reviewerCount} reviewer(s) managing output from ${apprenticeCount} apprentices. Review queue may become a bottleneck as work accumulates.`,
      metrics: {
        apprenticeCount,
        reviewerCount,
        ratio: apprenticeCount / reviewerCount,
      },
      recommendations: [
        {
          action: 'Add verification/quality AI tools to automate initial reviews',
          impact: 'Can reduce review time by 30-40% and rework risk by 10%',
          effort: 'low',
        },
        {
          action: 'Implement async review workflow with clear approval criteria',
          impact: 'Reduces review latency and allows parallel reviews',
          effort: 'low',
        },
        {
          action: 'Add 1 more reviewer to distribute review load',
          impact: 'Cuts review time in half, prevents queue backup',
          effort: 'medium',
        },
      ],
    };
  }

  return null;
}

/**
 * Detect rework bottleneck
 */
function detectReworkBottleneck(forecast: ForecastMetrics): BottleneckDiagnostic {
  const reworkRiskPct = forecast.reworkRiskPct;
  const expectedReworkCostGBP = forecast.expectedReworkCostGBP;

  const severity: 'high' | 'medium' | 'low' =
    reworkRiskPct > 40 ? 'high' : reworkRiskPct > 30 ? 'medium' : 'low';

  return {
    id: `bottleneck-rework-${Date.now()}`,
    type: 'review-bottleneck',
    severity,
    title: 'High Rework Risk',
    description: `${reworkRiskPct.toFixed(0)}% expected rework rate could cost £${(expectedReworkCostGBP / 1000).toFixed(1)}K extra. Quality issues or unclear requirements are causing waste.`,
    metrics: {
      reworkRiskPct,
      expectedReworkCostGBP,
    },
    recommendations: [
      {
        action: 'Add verification tools (linters, quality checkers) to catch issues early',
        impact: 'Reduces rework risk by 10-15%, saves £3-5K',
        effort: 'low',
      },
      {
        action: 'Implement "definition of done" checklist for all tasks',
        impact: 'Reduces ambiguity and prevents incomplete work',
        effort: 'low',
      },
      {
        action: 'Add 1 exec as dedicated reviewer (Quality Shield approach)',
        impact: 'Catches issues before they cascade, reduces rework by 50%',
        effort: 'medium',
      },
      {
        action: 'Run planning session to clarify requirements and acceptance criteria',
        impact: 'Prevents rework from misunderstood requirements',
        effort: 'low',
      },
    ],
  };
}

/**
 * Get highest priority bottleneck
 */
export function getPrimaryBottleneck(inputs: BottleneckInputs): BottleneckDiagnostic | null {
  const bottlenecks = detectBottlenecks(inputs);
  return bottlenecks.length > 0 ? bottlenecks[0] : null;
}

/**
 * Get bottleneck summary count
 */
export function getBottleneckSummary(inputs: BottleneckInputs): {
  total: number;
  high: number;
  medium: number;
  low: number;
} {
  const bottlenecks = detectBottlenecks(inputs);

  return {
    total: bottlenecks.length,
    high: bottlenecks.filter(b => b.severity === 'high').length,
    medium: bottlenecks.filter(b => b.severity === 'medium').length,
    low: bottlenecks.filter(b => b.severity === 'low').length,
  };
}
