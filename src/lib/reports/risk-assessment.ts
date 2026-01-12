// Enhanced Risk Identification & Mitigation
// McKinsey-grade risk assessment with impact × probability scoring

export interface EnhancedRisk {
  id: string;
  message: string;
  affectedArea: 'financial' | 'execution' | 'team' | 'strategic';
  severity: 'high' | 'medium' | 'low';
  impactScore: number; // 1-10 (10 = catastrophic)
  probabilityScore: number; // 1-10 (10 = certain)
  overallRiskScore: number; // impact × probability (max 100)
  mitigation: string; // What we're doing about it
  alternativeMitigation?: string; // Alternative approach
  owner: string; // Who owns this
  timeline: string; // When will it be resolved
  status: 'identified' | 'mitigating' | 'resolved';
  dependencies?: string[]; // What's needed to resolve
  costToMitigate?: string; // Financial impact of mitigation
}

export interface RiskAssessmentData {
  // Financial
  revenue: number;
  burn: number;
  runway: number;
  previousRunway?: number;
  burnToRevenue: number; // burn / revenue ratio

  // Execution
  okrProgress: number;
  atRiskOKRs: number;
  totalOKRs: number;
  completionRate: number;
  tasksCompleted: number;
  previousTasksCompleted?: number;

  // Team
  teamSize: number;
  utilization: number;
  overutilizedMembers: number; // > 90%
  underutilizedMembers: number; // < 60%
  executives: number;
  apprentices: number;

  // Context
  monthlyRevenue: number;
  monthlyBurn: number;
  cashBalance: number;
}

export function identifyRisks(data: RiskAssessmentData): EnhancedRisk[] {
  const risks: EnhancedRisk[] = [];

  // ============================================================================
  // FINANCIAL RISKS
  // ============================================================================

  // Critical Runway Risk
  if (data.runway < 6) {
    risks.push({
      id: 'runway-critical',
      message: `Cash runway critically low: ${data.runway.toFixed(1)} months remaining`,
      affectedArea: 'financial',
      severity: 'high',
      impactScore: 10,
      probabilityScore: 10,
      overallRiskScore: 100,
      mitigation: `Immediate action required: (1) Reduce burn by 25% to extend runway by 2 months, OR (2) Raise £${(data.monthlyBurn * 12).toFixed(0)}k to reach 12-month runway`,
      alternativeMitigation: `Accelerate revenue to £${(data.monthlyBurn * 1.2).toFixed(0)}k/mo through sales push or price increase`,
      owner: 'Founder',
      timeline: '30 days',
      status: 'identified',
      dependencies: ['Board approval for cuts', 'Fundraising materials', 'Customer impact analysis'],
      costToMitigate: `£0 (cost reduction) OR £${(data.monthlyBurn * 12).toFixed(0)}k (fundraising)`,
    });
  } else if (data.runway < 9) {
    risks.push({
      id: 'runway-low',
      message: `Cash runway below target: ${data.runway.toFixed(1)} months (target: 12+ months)`,
      affectedArea: 'financial',
      severity: 'high',
      impactScore: 8,
      probabilityScore: 8,
      overallRiskScore: 64,
      mitigation: `Extend runway to 12+ months by: (1) Reducing burn £${((data.monthlyBurn * 0.15)).toFixed(0)}k/mo (15% reduction), OR (2) Increasing revenue by £${((data.monthlyBurn - data.monthlyRevenue) * 0.5).toFixed(0)}k/mo`,
      alternativeMitigation: `Raise bridge round to extend runway while optimizing unit economics`,
      owner: 'Founder',
      timeline: '60 days',
      status: 'identified',
      dependencies: ['Financial model scenarios', 'Sales pipeline review'],
      costToMitigate: `£0-${((data.monthlyBurn * 3)).toFixed(0)}k`,
    });
  }

  // Burn Efficiency Risk
  if (data.burnToRevenue > 2.0) {
    const excessBurn = data.monthlyBurn - (data.monthlyRevenue * 1.5);
    risks.push({
      id: 'burn-efficiency',
      message: `Burn rate ${data.burnToRevenue.toFixed(1)}x revenue - significantly above sustainable ratio`,
      affectedArea: 'financial',
      severity: data.burnToRevenue > 3 ? 'high' : 'medium',
      impactScore: 7,
      probabilityScore: 9,
      overallRiskScore: 63,
      mitigation: `Target 1.5x burn-to-revenue ratio: Reduce burn by £${excessBurn.toFixed(0)}k/mo OR grow revenue by £${(excessBurn / 0.5).toFixed(0)}k/mo`,
      owner: 'Founder + Finance Executive',
      timeline: '90 days',
      status: 'identified',
      dependencies: ['Cost audit', 'Revenue growth plan'],
      costToMitigate: `£0 (operational efficiency)`,
    });
  }

  // Revenue Decline Risk
  if (data.previousTasksCompleted && data.tasksCompleted < data.previousTasksCompleted * 0.9) {
    risks.push({
      id: 'revenue-decline',
      message: `Activity declining: ${((1 - data.tasksCompleted / data.previousTasksCompleted) * 100).toFixed(0)}% drop in completed tasks may signal revenue risk`,
      affectedArea: 'financial',
      severity: 'medium',
      impactScore: 7,
      probabilityScore: 6,
      overallRiskScore: 42,
      mitigation: `Investigate root cause: (1) Pipeline issues, (2) Team capacity constraints, or (3) Process inefficiency. Implement corrective action within 2 weeks.`,
      owner: 'Sales/Ops Executive',
      timeline: '14 days',
      status: 'identified',
      dependencies: ['Pipeline review', 'Team capacity analysis'],
    });
  }

  // ============================================================================
  // EXECUTION RISKS
  // ============================================================================

  // OKR At-Risk
  const okrRiskPercentage = (data.atRiskOKRs / data.totalOKRs) * 100;
  if (data.atRiskOKRs > 0 && okrRiskPercentage >= 30) {
    risks.push({
      id: 'okr-at-risk',
      message: `${data.atRiskOKRs} of ${data.totalOKRs} OKRs at risk (${okrRiskPercentage.toFixed(0)}%) - quarterly goals in jeopardy`,
      affectedArea: 'execution',
      severity: okrRiskPercentage >= 50 ? 'high' : 'medium',
      impactScore: 8,
      probabilityScore: 7,
      overallRiskScore: 56,
      mitigation: `Emergency OKR review: (1) Reallocate resources to at-risk objectives, (2) Adjust targets if goals unrealistic, OR (3) Extend timeline with board approval`,
      alternativeMitigation: `Focus on 1-2 critical OKRs and deprioritize others to ensure key wins`,
      owner: 'Founder + Executives',
      timeline: '7 days',
      status: 'identified',
      dependencies: ['OKR review meeting', 'Resource availability'],
    });
  }

  // Low Completion Rate
  if (data.completionRate < 65) {
    risks.push({
      id: 'completion-rate-low',
      message: `Task completion rate critically low: ${data.completionRate.toFixed(0)}% (target: 75%+)`,
      affectedArea: 'execution',
      severity: 'high',
      impactScore: 7,
      probabilityScore: 8,
      overallRiskScore: 56,
      mitigation: `Root cause analysis needed: (1) Scope creep - tasks too large, (2) Capacity constraints - team overloaded, OR (3) Process issues - blockers/dependencies`,
      owner: 'Executives',
      timeline: '14 days',
      status: 'identified',
      dependencies: ['Task audit', 'Team interviews'],
    });
  }

  // ============================================================================
  // TEAM RISKS
  // ============================================================================

  // Over-Capacity (Burnout Risk)
  if (data.overutilizedMembers > 0) {
    const burnoutRisk = (data.overutilizedMembers / data.teamSize) * 100;
    risks.push({
      id: 'team-overcapacity',
      message: `${data.overutilizedMembers} team members over-capacity (>90% utilization) - burnout risk`,
      affectedArea: 'team',
      severity: burnoutRisk > 30 ? 'high' : 'medium',
      impactScore: 8,
      probabilityScore: 7,
      overallRiskScore: 56,
      mitigation: `Redistribute ${(data.overutilizedMembers * 10).toFixed(0)} hours/week to under-utilized members OR hire ${Math.ceil(data.overutilizedMembers / 2)} additional ${data.overutilizedMembers > 2 ? 'apprentices' : 'apprentice'}`,
      alternativeMitigation: `Implement strict 40-hour week caps and reprioritize roadmap to reduce scope`,
      owner: 'Executives',
      timeline: '7 days',
      status: 'identified',
      dependencies: ['Workload audit', 'Hiring budget (if needed)'],
      costToMitigate: `£0 (rebalance) OR £${(data.overutilizedMembers * 200 * 20).toFixed(0)} (hire)`,
    });
  }

  // Under-Utilization (Waste)
  if (data.underutilizedMembers > 0) {
    const wastePercentage = (data.underutilizedMembers / data.teamSize) * 100;
    const wastedCapacity = data.underutilizedMembers * 20; // ~20 hours/week wasted
    risks.push({
      id: 'team-underutilized',
      message: `${data.underutilizedMembers} team members under-utilized (<60%) - ${wastedCapacity}hrs/week wasted capacity`,
      affectedArea: 'team',
      severity: wastePercentage > 30 ? 'medium' : 'low',
      impactScore: 5,
      probabilityScore: 9,
      overallRiskScore: 45,
      mitigation: `Improve task allocation: (1) Assign more work from over-utilized members, (2) Train on new skills to expand capabilities, OR (3) Redeploy to higher-priority work`,
      alternativeMitigation: `Consider reducing team size if sustained underutilization (>4 weeks)`,
      owner: 'Executives',
      timeline: '14 days',
      status: 'identified',
      dependencies: ['Task backlog review', 'Skills assessment'],
      costToMitigate: `£0 (reallocation) OR -£${(data.underutilizedMembers * 200 * 20).toFixed(0)}/mo (downsize)`,
    });
  }

  // Team Structure Imbalance
  const execToApprenticeRatio = data.executives / data.apprentices;
  if (execToApprenticeRatio < 0.25) {
    // Less than 1:4 ratio
    risks.push({
      id: 'exec-coverage',
      message: `Executive coverage thin: ${data.executives} executives managing ${data.apprentices} apprentices (1:${(data.apprentices / data.executives).toFixed(1)} ratio)`,
      affectedArea: 'team',
      severity: 'medium',
      impactScore: 6,
      probabilityScore: 7,
      overallRiskScore: 42,
      mitigation: `Hire 1 additional fractional executive to improve coverage to 1:${((data.apprentices / (data.executives + 1)).toFixed(1))} ratio`,
      owner: 'Founder',
      timeline: '30 days',
      status: 'identified',
      dependencies: ['Executive hiring budget', 'Role definition'],
      costToMitigate: `£${(800 * 20).toFixed(0)}/mo`,
    });
  }

  // ============================================================================
  // STRATEGIC RISKS
  // ============================================================================

  // Velocity Decline
  if (data.previousTasksCompleted && data.tasksCompleted < data.previousTasksCompleted * 0.85) {
    const velocityDrop = ((1 - data.tasksCompleted / data.previousTasksCompleted) * 100);
    risks.push({
      id: 'velocity-decline',
      message: `Team velocity declining: ${velocityDrop.toFixed(0)}% drop in output vs. last period`,
      affectedArea: 'strategic',
      severity: 'high',
      impactScore: 7,
      probabilityScore: 8,
      overallRiskScore: 56,
      mitigation: `Diagnose cause: (1) Team morale issues, (2) Process bottlenecks, (3) Increased complexity, or (4) Capacity constraints. Address root cause within 2 weeks.`,
      owner: 'Founder + Executives',
      timeline: '14 days',
      status: 'identified',
      dependencies: ['Retrospective meeting', 'Process audit'],
    });
  }

  // Sort by overall risk score (highest first)
  return risks.sort((a, b) => b.overallRiskScore - a.overallRiskScore);
}

// Helper to get risks by severity
export function getRisksBySeverity(risks: EnhancedRisk[]): {
  high: EnhancedRisk[];
  medium: EnhancedRisk[];
  low: EnhancedRisk[];
} {
  return {
    high: risks.filter((r) => r.severity === 'high'),
    medium: risks.filter((r) => r.severity === 'medium'),
    low: risks.filter((r) => r.severity === 'low'),
  };
}

// Helper to get top N risks
export function getTopRisks(risks: EnhancedRisk[], count: number = 3): EnhancedRisk[] {
  return risks.slice(0, count);
}

// Helper to format risk for display
export function formatRiskForDisplay(risk: EnhancedRisk): string {
  const severityEmoji = risk.severity === 'high' ? '🔴' : risk.severity === 'medium' ? '🟡' : '🟢';
  return `${severityEmoji} ${risk.message}\n└─ Mitigation: ${risk.mitigation}\n└─ Owner: ${risk.owner} | Timeline: ${risk.timeline}`;
}
