// Strategic Recommendations Engine - McKinsey Action-Oriented Output
// Generates prioritized, quantified recommendations with expected impact

export interface Recommendation {
  id: string;
  priority: 1 | 2 | 3; // 1 = must do, 2 = should do, 3 = nice to have
  priorityLabel: string; // "🔴 CRITICAL", "🟡 IMPORTANT", "🟢 NICE TO HAVE"
  title: string;
  rationale: string; // Why this matters
  expectedImpact: string; // Quantified (e.g., "Will extend runway by 2 months")
  impactMetrics?: {
    // Quantified impact
    runway?: number; // months added/subtracted
    revenue?: number; // £k added
    burn?: number; // £k saved
    productivity?: number; // % improvement
  };
  resourcesRequired: string; // What's needed
  owner: string;
  timeline: string;
  dependencies?: string[];
  alternatives?: string[]; // Alternative approaches
  successCriteria?: string; // How to measure success
  estimatedEffort?: string; // Time investment required
}

export interface RecommendationContext {
  // Financial
  revenue: number;
  burn: number;
  runway: number;
  burnToRevenue: number;
  cashBalance: number;

  // Execution
  okrProgress: number;
  atRiskOKRs: number;
  totalOKRs: number;
  completionRate: number;
  tasksCompleted: number;
  velocity: number; // tasks per week

  // Team
  teamSize: number;
  utilization: number;
  overutilizedMembers: number;
  underutilizedMembers: number;
  executives: number;
  apprentices: number;

  // Context
  previousRevenue?: number;
  previousBurn?: number;
  previousRunway?: number;
  quarterProgress: number; // % through quarter (0-100)
}

export function generateRecommendations(context: RecommendationContext): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // ============================================================================
  // PRIORITY 1: CRITICAL (Must Do - Board Level)
  // ============================================================================

  // Runway Extension (if critical)
  if (context.runway < 9) {
    const burnReduction = context.burn * 0.25; // 25% reduction
    const revenueIncrease = (context.burn - context.revenue) * 0.5; // 50% of gap
    const runwayExtension = (context.cashBalance / (context.burn - burnReduction)) - context.runway;

    recommendations.push({
      id: 'extend-runway',
      priority: context.runway < 6 ? 1 : 2,
      priorityLabel: context.runway < 6 ? '🔴 CRITICAL' : '🟡 IMPORTANT',
      title: `Extend runway to 12+ months (currently ${context.runway.toFixed(1)}mo)`,
      rationale: `Current ${context.runway.toFixed(1)}-month runway ${context.runway < 6 ? 'critically low' : 'below'} 12-month safety threshold for Series A fundraising`,
      expectedImpact: `Extends runway by ${runwayExtension.toFixed(1)} months to ${(context.runway + runwayExtension).toFixed(1)} months, providing breathing room for product-market fit`,
      impactMetrics: {
        runway: runwayExtension,
        burn: -burnReduction,
      },
      resourcesRequired: `Cost audit + difficult prioritization decisions on team/spend`,
      owner: 'Founder',
      timeline: context.runway < 6 ? '30 days' : '60 days',
      dependencies: ['Board approval', 'Team communication plan', 'Customer impact analysis'],
      alternatives: [
        `Raise £${(context.burn * 12).toFixed(0)}k bridge round to hit 12-month runway`,
        `Accelerate revenue to £${(context.burn * 1.1).toFixed(0)}k/mo (${(((context.burn * 1.1 / context.revenue) - 1) * 100).toFixed(0)}% increase) to reduce burn pressure`,
      ],
      successCriteria: `Runway reaches 12+ months within ${context.runway < 6 ? '30' : '60'} days`,
      estimatedEffort: '40 hours (financial modeling + execution)',
    });
  }

  // Burn Efficiency
  if (context.burnToRevenue > 2.0) {
    const targetBurn = context.revenue * 1.5;
    const burnReduction = context.burn - targetBurn;
    const monthlySavings = burnReduction;

    recommendations.push({
      id: 'improve-burn-efficiency',
      priority: 1,
      priorityLabel: '🔴 CRITICAL',
      title: `Improve burn efficiency to 1.5x revenue (currently ${context.burnToRevenue.toFixed(1)}x)`,
      rationale: `Burning £${context.burn.toFixed(0)}k/mo vs. £${context.revenue.toFixed(0)}k/mo revenue = unsustainable ${context.burnToRevenue.toFixed(1)}x ratio. Target: 1.5x for Series A viability`,
      expectedImpact: `Saves £${monthlySavings.toFixed(0)}k/mo, extends runway by ${(context.cashBalance / targetBurn - context.runway).toFixed(1)} months`,
      impactMetrics: {
        burn: -burnReduction,
        runway: context.cashBalance / targetBurn - context.runway,
      },
      resourcesRequired: `Cost audit across team, AI services, and other spend categories`,
      owner: 'Founder + Finance Executive',
      timeline: '90 days',
      dependencies: ['Cost breakdown by category', 'Impact analysis'],
      alternatives: [
        `Grow revenue by £${((context.burn / 1.5) - context.revenue).toFixed(0)}k/mo to ${((context.burn / 1.5)).toFixed(0)}k/mo instead of cutting costs`,
        `Hybrid: 15% cost reduction + 15% revenue growth`,
      ],
      successCriteria: `Burn-to-revenue ratio below 1.7x within 90 days`,
      estimatedEffort: '60 hours (audit + execution + monitoring)',
    });
  }

  // Critical OKR Recovery
  if (context.atRiskOKRs > 0 && (context.atRiskOKRs / context.totalOKRs) >= 0.5) {
    recommendations.push({
      id: 'okr-recovery',
      priority: 1,
      priorityLabel: '🔴 CRITICAL',
      title: `Recover ${context.atRiskOKRs} at-risk OKRs before quarter end`,
      rationale: `${context.atRiskOKRs} of ${context.totalOKRs} objectives at risk (${((context.atRiskOKRs / context.totalOKRs) * 100).toFixed(0)}%) - quarterly goals in jeopardy with ${(100 - context.quarterProgress).toFixed(0)}% of quarter remaining`,
      expectedImpact: `Salvages Q1 results, maintains team morale, demonstrates execution capability to board/investors`,
      resourcesRequired: `Emergency resource reallocation - dedicate 1 full-time apprentice per at-risk OKR`,
      owner: 'Founder + All Executives',
      timeline: '14 days',
      dependencies: ['OKR review meeting', 'Resource availability', 'Scope de-prioritization'],
      alternatives: [
        `Renegotiate targets with board - adjust down to realistic levels`,
        `Focus on 1-2 most critical OKRs, deprioritize others`,
      ],
      successCriteria: `At least ${Math.ceil(context.atRiskOKRs / 2)} OKRs back to "on track" status within 14 days`,
      estimatedEffort: '20 hours (planning) + team reallocation',
    });
  }

  // ============================================================================
  // PRIORITY 2: IMPORTANT (Should Do - Executive Level)
  // ============================================================================

  // Team Capacity Balancing
  if (context.overutilizedMembers > 0 || context.underutilizedMembers > 0) {
    const totalImbalance = context.overutilizedMembers + context.underutilizedMembers;
    const potentialGain = totalImbalance * 10; // ~10% productivity gain per rebalanced person

    recommendations.push({
      id: 'balance-capacity',
      priority: 2,
      priorityLabel: '🟡 IMPORTANT',
      title: `Balance team capacity (${context.overutilizedMembers} over, ${context.underutilizedMembers} under-utilized)`,
      rationale: `${context.overutilizedMembers} members at burnout risk (>90%), ${context.underutilizedMembers} members wasting capacity (<60%). Productivity loss: ~${(totalImbalance / context.teamSize * 20).toFixed(0)}%`,
      expectedImpact: `Prevents burnout, captures ${potentialGain}hrs/week wasted capacity, improves team morale and output quality`,
      impactMetrics: {
        productivity: (potentialGain / (context.teamSize * 40)) * 100,
      },
      resourcesRequired: `Task reallocation + weekly capacity monitoring dashboard`,
      owner: 'Executives',
      timeline: '14 days',
      dependencies: ['Workload audit', 'Skills matrix', 'Team consent'],
      alternatives: [
        context.overutilizedMembers > 2 ? `Hire ${Math.ceil(context.overutilizedMembers / 2)} additional apprentices` : 'Implement strict 40-hour week caps',
        context.underutilizedMembers > 2 ? `Reduce team size by ${context.underutilizedMembers} to improve efficiency` : 'Cross-train for new capabilities',
      ],
      successCriteria: `All team members within 60-90% utilization range within 14 days`,
      estimatedEffort: '15 hours (planning + redistribution + monitoring setup)',
    });
  }

  // Completion Rate Improvement
  if (context.completionRate < 70) {
    const currentWeeklyOutput = context.velocity;
    const targetWeeklyOutput = context.velocity * (75 / context.completionRate);
    const additionalOutput = targetWeeklyOutput - currentWeeklyOutput;

    recommendations.push({
      id: 'improve-completion',
      priority: 2,
      priorityLabel: '🟡 IMPORTANT',
      title: `Improve task completion rate from ${context.completionRate.toFixed(0)}% to 75%+`,
      rationale: `Low completion rate indicates scope creep, blockers, or capacity issues. ${context.completionRate.toFixed(0)}% vs. 75% target = ${(75 - context.completionRate).toFixed(0)}% productivity loss`,
      expectedImpact: `Increases weekly output from ${currentWeeklyOutput.toFixed(0)} to ${targetWeeklyOutput.toFixed(0)} tasks (+${additionalOutput.toFixed(0)} tasks/week)`,
      impactMetrics: {
        productivity: (75 / context.completionRate - 1) * 100,
      },
      resourcesRequired: `Process audit + task sizing guidelines + blocker removal protocol`,
      owner: 'Executives',
      timeline: '21 days',
      dependencies: ['Root cause analysis', 'Process documentation'],
      alternatives: [
        `Break down large tasks into smaller chunks (max 4 hours per task)`,
        `Implement daily standups to surface and unblock issues faster`,
        `Reduce concurrent tasks per person from N to 3 max`,
      ],
      successCriteria: `Completion rate above 72% for 2 consecutive weeks`,
      estimatedEffort: '25 hours (analysis + process changes + monitoring)',
    });
  }

  // Revenue Growth Acceleration
  if (context.previousRevenue && context.revenue <= context.previousRevenue * 1.05) {
    const monthlyGrowthTarget = context.revenue * 0.15; // 15% MoM growth
    const annualizedImpact = monthlyGrowthTarget * 12;

    recommendations.push({
      id: 'accelerate-revenue',
      priority: 2,
      priorityLabel: '🟡 IMPORTANT',
      title: `Accelerate revenue growth to 15% MoM (currently ${context.previousRevenue ? (((context.revenue / context.previousRevenue) - 1) * 100).toFixed(0) : '0'}% MoM)`,
      rationale: `Revenue growth stagnant. Need ${((context.burn / context.revenue) * 100).toFixed(0)}% growth to reach profitability. 15% MoM = sustainable SaaS/hardware growth rate`,
      expectedImpact: `Adds £${monthlyGrowthTarget.toFixed(0)}k/mo (£${annualizedImpact.toFixed(0)}k annualized), reduces burn-to-revenue ratio from ${context.burnToRevenue.toFixed(1)}x to ${(context.burn / (context.revenue * 1.15)).toFixed(1)}x`,
      impactMetrics: {
        revenue: monthlyGrowthTarget,
        runway: (context.cashBalance / (context.burn - monthlyGrowthTarget)) - context.runway,
      },
      resourcesRequired: `Sales/marketing investment: £${(monthlyGrowthTarget * 0.3).toFixed(0)}k (30% of incremental revenue for CAC)`,
      owner: 'Founder + Sales Executive',
      timeline: '90 days',
      dependencies: ['Sales pipeline build', 'Marketing campaigns', 'Pricing optimization'],
      alternatives: [
        `Price increase: 10-15% across all products (faster than new customer acquisition)`,
        `Upsell/cross-sell: Focus on expanding existing customer spend`,
      ],
      successCriteria: `Revenue reaches £${(context.revenue * 1.15).toFixed(0)}k/mo within 90 days`,
      estimatedEffort: '50 hours (strategy + execution + monitoring)',
    });
  }

  // ============================================================================
  // PRIORITY 3: NICE TO HAVE (Optimization - Future Quarters)
  // ============================================================================

  // OKR System Optimization
  if (context.okrProgress >= 70 && context.atRiskOKRs === 0) {
    recommendations.push({
      id: 'okr-excellence',
      priority: 3,
      priorityLabel: '🟢 NICE TO HAVE',
      title: `Optimize OKR system for A+ execution (currently ${context.okrProgress.toFixed(0)}%)`,
      rationale: `Solid OKR progress, but room for excellence. Best-in-class teams hit 80%+ consistently`,
      expectedImpact: `Improves strategic alignment, creates predictable execution cadence, builds board confidence`,
      resourcesRequired: `OKR training for team + quarterly planning workshop + progress tracking dashboard`,
      owner: 'Founder',
      timeline: '30 days',
      dependencies: ['Team buy-in', '4 hours workshop time'],
      successCriteria: `3 consecutive quarters above 80% OKR completion`,
      estimatedEffort: '12 hours (training + workshop + system setup)',
    });
  }

  // Team Structure Optimization
  if (context.executives / context.apprentices < 0.25 && context.apprentices > 8) {
    const additionalExecs = Math.ceil(context.apprentices / 5) - context.executives;
    const monthlyCost = additionalExecs * 800 * 20; // £800/day * 20 days

    recommendations.push({
      id: 'improve-exec-coverage',
      priority: 3,
      priorityLabel: '🟢 NICE TO HAVE',
      title: `Improve executive coverage ratio (currently 1:${(context.apprentices / context.executives).toFixed(1)})`,
      rationale: `${context.executives} executives managing ${context.apprentices} apprentices = thin coverage. Target: 1:5 ratio for optimal mentorship`,
      expectedImpact: `Better apprentice guidance, faster skill development, higher quality output, reduced executive burnout`,
      resourcesRequired: `Hire ${additionalExecs} fractional executive(s) at £${monthlyCost.toFixed(0)}/mo`,
      owner: 'Founder',
      timeline: '60 days',
      dependencies: ['Hiring budget approval', 'Role definitions', 'Candidate sourcing'],
      successCriteria: `Executive-to-apprentice ratio of 1:5 or better`,
      estimatedEffort: '30 hours (recruiting + onboarding)',
    });
  }

  // Process Automation
  if (context.completionRate >= 75) {
    recommendations.push({
      id: 'automate-processes',
      priority: 3,
      priorityLabel: '🟢 NICE TO HAVE',
      title: `Automate repetitive processes to free 20% capacity`,
      rationale: `Team executing well - now optimize for efficiency. Automation multiplies impact without headcount`,
      expectedImpact: `Frees ${(context.teamSize * 8).toFixed(0)} hours/week for higher-value work, improves consistency, reduces errors`,
      impactMetrics: {
        productivity: 20,
      },
      resourcesRequired: `Process audit + automation tools (Zapier, n8n, custom scripts) - £500/mo`,
      owner: 'Ops Executive',
      timeline: '45 days',
      dependencies: ['Process documentation', 'Tool selection', 'Training'],
      successCriteria: `5+ processes automated, 20% time savings measured`,
      estimatedEffort: '40 hours (audit + implementation + testing)',
    });
  }

  return recommendations;
}

// Helper to get recommendations by priority
export function getRecommendationsByPriority(recommendations: Recommendation[]): {
  critical: Recommendation[];
  important: Recommendation[];
  niceToHave: Recommendation[];
} {
  return {
    critical: recommendations.filter((r) => r.priority === 1),
    important: recommendations.filter((r) => r.priority === 2),
    niceToHave: recommendations.filter((r) => r.priority === 3),
  };
}

// Helper to get top N recommendations
export function getTopRecommendations(recommendations: Recommendation[], count: number = 3): Recommendation[] {
  return recommendations.slice(0, count);
}

// Helper to format recommendation for display
export function formatRecommendationForDisplay(rec: Recommendation): string {
  return `${rec.priorityLabel} ${rec.title}\n\n` +
    `WHY: ${rec.rationale}\n\n` +
    `IMPACT: ${rec.expectedImpact}\n\n` +
    `ACTION: ${rec.resourcesRequired}\n\n` +
    `OWNER: ${rec.owner} | TIMELINE: ${rec.timeline}`;
}
