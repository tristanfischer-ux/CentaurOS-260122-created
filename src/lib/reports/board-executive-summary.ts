// Executive Summary Generator - McKinsey Pyramid Principle
// Generates board-ready executive summary with overall status and key insights

import type { TrendData } from './trend-analysis';

export interface ExecutiveSummary {
  overallStatus: 'green' | 'yellow' | 'red';
  statusLabel: string; // "🟢 STRONG", "🟡 ATTENTION NEEDED", "🔴 CRITICAL"
  headline: string; // One-sentence answer
  keyInsights: KeyInsight[]; // Exactly 3 insights
  boardDecisionRequired: string | null;
  trendIndicators: {
    financial: TrendIndicator;
    execution: TrendIndicator;
    team: TrendIndicator;
  };
  generatedAt: Date;
}

export interface KeyInsight {
  title: string;
  status: 'green' | 'yellow' | 'red';
  metric: string; // Primary metric value
  trend: string; // "↑ +15%", "↓ -8%"
  soWhat: string; // Implication and why it matters
  context: string; // Benchmark or comparison
}

export interface TrendIndicator {
  status: 'up' | 'down' | 'flat';
  label: string; // "accelerating", "steady", "slowing"
  severity: 'positive' | 'negative' | 'neutral';
}

export interface ReportDataForSummary {
  // Financial
  revenue: number;
  previousRevenue: number | null;
  burn: number;
  previousBurn: number | null;
  runway: number;
  previousRunway: number | null;

  // Execution
  okrProgress: number; // average % across all OKRs
  previousOKRProgress: number | null;
  completionRate: number;
  previousCompletionRate: number | null;
  tasksCompleted: number;
  previousTasksCompleted: number | null;

  // Team
  teamSize: number;
  utilization: number; // average %
  previousUtilization: number | null;
  overutilizedCount: number; // > 90%
  underutilizedCount: number; // < 60%

  // Context
  atRiskOKRs: number;
  criticalTasks: number;
  period: string; // "Q1 2026", "January 2026"
}

export function generateExecutiveSummary(data: ReportDataForSummary): ExecutiveSummary {
  // Calculate overall status using weighted scoring
  const financialScore = calculateFinancialScore(data);
  const executionScore = calculateExecutionScore(data);
  const teamScore = calculateTeamScore(data);

  // Weighted average: Financial 40%, Execution 35%, Team 25%
  const overallScore = financialScore * 0.4 + executionScore * 0.35 + teamScore * 0.25;

  const overallStatus = overallScore >= 75 ? 'green' : overallScore >= 55 ? 'yellow' : 'red';
  const statusLabel =
    overallStatus === 'green' ? '🟢 STRONG' : overallStatus === 'yellow' ? '🟡 ATTENTION NEEDED' : '🔴 CRITICAL';

  // Generate headline
  const headline = generateHeadline(overallStatus, data);

  // Generate key insights (exactly 3)
  const keyInsights = generateKeyInsights(data, financialScore, executionScore, teamScore);

  // Determine if board decision required
  const boardDecisionRequired = determineBoardDecision(data, overallStatus);

  // Calculate trend indicators
  const trendIndicators = {
    financial: calculateFinancialTrend(data),
    execution: calculateExecutionTrend(data),
    team: calculateTeamTrend(data),
  };

  return {
    overallStatus,
    statusLabel,
    headline,
    keyInsights,
    boardDecisionRequired,
    trendIndicators,
    generatedAt: new Date(),
  };
}

function calculateFinancialScore(data: ReportDataForSummary): number {
  let score = 0;

  // Runway scoring (40 points)
  if (data.runway >= 12) score += 40;
  else if (data.runway >= 9) score += 30;
  else if (data.runway >= 6) score += 20;
  else score += 10;

  // Revenue trend (30 points)
  if (data.previousRevenue) {
    const revenueGrowth = ((data.revenue - data.previousRevenue) / data.previousRevenue) * 100;
    if (revenueGrowth >= 15) score += 30;
    else if (revenueGrowth >= 5) score += 20;
    else if (revenueGrowth >= 0) score += 10;
  } else {
    score += 15; // neutral if no previous data
  }

  // Burn efficiency (30 points)
  const burnToRevenue = data.burn / data.revenue;
  if (burnToRevenue <= 1.2) score += 30; // Near profitability
  else if (burnToRevenue <= 1.5) score += 20;
  else if (burnToRevenue <= 2.0) score += 10;

  return score;
}

function calculateExecutionScore(data: ReportDataForSummary): number {
  let score = 0;

  // OKR progress (50 points)
  if (data.okrProgress >= 80) score += 50;
  else if (data.okrProgress >= 70) score += 40;
  else if (data.okrProgress >= 60) score += 30;
  else if (data.okrProgress >= 50) score += 20;
  else score += 10;

  // Completion rate (30 points)
  if (data.completionRate >= 80) score += 30;
  else if (data.completionRate >= 70) score += 25;
  else if (data.completionRate >= 60) score += 20;
  else score += 10;

  // Velocity trend (20 points)
  if (data.previousTasksCompleted) {
    const velocityChange = ((data.tasksCompleted - data.previousTasksCompleted) / data.previousTasksCompleted) * 100;
    if (velocityChange >= 10) score += 20;
    else if (velocityChange >= 0) score += 15;
    else if (velocityChange >= -10) score += 10;
    else score += 5;
  } else {
    score += 15;
  }

  return score;
}

function calculateTeamScore(data: ReportDataForSummary): number {
  let score = 0;

  // Average utilization (60 points)
  if (data.utilization >= 70 && data.utilization <= 85) score += 60; // Optimal range
  else if (data.utilization >= 60 && data.utilization <= 90) score += 50;
  else if (data.utilization >= 50 && data.utilization <= 95) score += 40;
  else score += 20;

  // Capacity balance (40 points)
  const imbalanceCount = data.overutilizedCount + data.underutilizedCount;
  if (imbalanceCount === 0) score += 40;
  else if (imbalanceCount <= 2) score += 30;
  else if (imbalanceCount <= 4) score += 20;
  else score += 10;

  return score;
}

function generateHeadline(status: 'green' | 'yellow' | 'red', data: ReportDataForSummary): string {
  if (status === 'green') {
    return `Strong execution momentum with ${data.runway.toFixed(1)}-month runway - on track for ${data.period} goals`;
  } else if (status === 'yellow') {
    // Identify primary concern
    if (data.runway < 9) {
      return `Solid progress with attention needed on runway extension (${data.runway.toFixed(1)} months)`;
    } else if (data.okrProgress < 65) {
      return `Financial position stable, but OKR progress needs acceleration (${data.okrProgress.toFixed(0)}%)`;
    } else if (data.overutilizedCount + data.underutilizedCount > 3) {
      return `Good execution pace, but team capacity requires rebalancing`;
    } else {
      return `Solid progress with attention needed on execution efficiency`;
    }
  } else {
    // Red status - identify critical issue
    if (data.runway < 6) {
      return `⚠️ CRITICAL: Runway below 6 months (${data.runway.toFixed(1)}) - immediate action required`;
    } else if (data.okrProgress < 50) {
      return `⚠️ CRITICAL: Strategic objectives at risk - ${data.atRiskOKRs} OKRs need intervention`;
    } else {
      return `⚠️ CRITICAL: Multiple areas require immediate attention - intervention needed`;
    }
  }
}

function generateKeyInsights(
  data: ReportDataForSummary,
  financialScore: number,
  executionScore: number,
  teamScore: number
): KeyInsight[] {
  const insights: KeyInsight[] = [];

  // Financial Insight
  const revenueChange = data.previousRevenue
    ? ((data.revenue - data.previousRevenue) / data.previousRevenue) * 100
    : 0;
  const runwayChange = data.previousRunway ? data.runway - data.previousRunway : 0;

  const financialStatus = financialScore >= 75 ? 'green' : financialScore >= 55 ? 'yellow' : 'red';
  let financialTrend = '→ Stable';
  if (data.previousRevenue) {
    financialTrend = revenueChange >= 5 ? `↑ +${revenueChange.toFixed(0)}%` : revenueChange <= -5 ? `↓ ${revenueChange.toFixed(0)}%` : '→ Flat';
  }

  insights.push({
    title: financialScore >= 75 ? 'Financial Health Strong' : financialScore >= 55 ? 'Financial Health Stable' : 'Financial Health Critical',
    status: financialStatus,
    metric: `£${data.revenue}k revenue, ${data.runway.toFixed(1)}mo runway`,
    trend: financialTrend,
    soWhat:
      financialScore >= 75
        ? `Healthy cash position provides runway for product-market fit. ${runwayChange >= 0 ? `Runway extended by ${runwayChange.toFixed(1)}mo.` : ''}`
        : financialScore >= 55
        ? `Runway adequate but requires monitoring. ${data.runway < 9 ? 'Recommend extending to 12+ months.' : ''}`
        : `Runway critical - immediate action required to extend cash reserves through cost reduction or fundraising.`,
    context: data.runway >= 12 ? 'Above 12-month safety threshold' : data.runway >= 6 ? 'Within acceptable 6-12 month range' : 'Below 6-month minimum threshold',
  });

  // Execution Insight
  const okrChange = data.previousOKRProgress
    ? data.okrProgress - data.previousOKRProgress
    : 0;
  const velocityChange = data.previousTasksCompleted
    ? ((data.tasksCompleted - data.previousTasksCompleted) / data.previousTasksCompleted) * 100
    : 0;

  const executionStatus = executionScore >= 75 ? 'green' : executionScore >= 55 ? 'yellow' : 'red';
  const executionTrend =
    okrChange >= 5 ? `↑ +${okrChange.toFixed(0)}%` : okrChange <= -5 ? `↓ ${okrChange.toFixed(0)}%` : '→ Flat';

  insights.push({
    title: executionScore >= 75 ? 'Execution Accelerating' : executionScore >= 55 ? 'Execution Steady' : 'Execution At Risk',
    status: executionStatus,
    metric: `${data.okrProgress.toFixed(0)}% OKR progress, ${data.tasksCompleted} tasks completed`,
    trend: executionTrend,
    soWhat:
      executionScore >= 75
        ? `Building sustainable delivery cadence. ${velocityChange > 10 ? `Team velocity up ${velocityChange.toFixed(0)}%.` : ''} On track for quarterly goals.`
        : executionScore >= 55
        ? `Reasonable progress but ${data.atRiskOKRs} OKR(s) need attention. Consider resource reallocation.`
        : `${data.atRiskOKRs} objectives at risk. Immediate intervention required to get back on track.`,
    context: data.okrProgress >= 70 ? 'Above 70% target for mid-quarter' : data.okrProgress >= 50 ? 'At or below target - acceleration needed' : 'Significantly below target',
  });

  // Team Insight
  const utilizationChange = data.previousUtilization
    ? data.utilization - data.previousUtilization
    : 0;

  const teamStatus = teamScore >= 75 ? 'green' : teamScore >= 55 ? 'yellow' : 'red';
  const utilizationTrend =
    utilizationChange >= 5 ? `↑ +${utilizationChange.toFixed(0)}%` : utilizationChange <= -5 ? `↓ ${utilizationChange.toFixed(0)}%` : '→ Flat';

  const capacityIssues = [];
  if (data.overutilizedCount > 0) capacityIssues.push(`${data.overutilizedCount} over-capacity (>90%)`);
  if (data.underutilizedCount > 0) capacityIssues.push(`${data.underutilizedCount} under-utilized (<60%)`);

  insights.push({
    title: teamScore >= 75 ? 'Team Well-Balanced' : teamScore >= 55 ? 'Team Capacity Adequate' : 'Team Capacity Critical',
    status: teamStatus,
    metric: `${data.utilization.toFixed(0)}% avg utilization, ${data.teamSize} team members`,
    trend: utilizationTrend,
    soWhat:
      teamStatus === 'green'
        ? `Healthy workload balance across team. ${capacityIssues.length === 0 ? 'No capacity concerns.' : 'Minor rebalancing recommended.'}`
        : teamStatus === 'yellow'
        ? `Capacity imbalances detected: ${capacityIssues.join(', ')}. Workload redistribution recommended.`
        : `Critical capacity issues: ${capacityIssues.join(', ')}. Immediate rebalancing required to prevent burnout or waste.`,
    context: data.utilization >= 70 && data.utilization <= 85 ? 'Optimal 70-85% range' : 'Outside optimal range',
  });

  return insights;
}

function determineBoardDecision(data: ReportDataForSummary, status: 'green' | 'yellow' | 'red'): string | null {
  // Critical decisions that require board input
  if (status === 'red') {
    if (data.runway < 6) {
      return `URGENT: Approve emergency cost reduction plan OR authorize bridge financing to extend runway to 12+ months`;
    }
    if (data.atRiskOKRs > data.okrProgress / 20) {
      // More than half OKRs at risk
      return `DECISION NEEDED: Approve revised OKR targets OR authorize additional resources to recover`;
    }
  }

  if (status === 'yellow') {
    if (data.runway < 9) {
      return `ADVISORY: Review cash management strategy - consider fundraising timeline acceleration`;
    }
  }

  // Green status
  return null; // No board decision required - continue current strategy
}

function calculateFinancialTrend(data: ReportDataForSummary): TrendIndicator {
  if (!data.previousRevenue || !data.previousRunway) {
    return { status: 'flat', label: 'Baseline', severity: 'neutral' };
  }

  const revenueGrowth = ((data.revenue - data.previousRevenue) / data.previousRevenue) * 100;
  const runwayChange = data.runway - data.previousRunway;

  // Financial improving if revenue up OR runway up
  if (revenueGrowth > 10 || runwayChange > 1) {
    return { status: 'up', label: 'Improving', severity: 'positive' };
  } else if (revenueGrowth < -5 || runwayChange < -1) {
    return { status: 'down', label: 'Declining', severity: 'negative' };
  }

  return { status: 'flat', label: 'Stable', severity: 'neutral' };
}

function calculateExecutionTrend(data: ReportDataForSummary): TrendIndicator {
  if (!data.previousOKRProgress || !data.previousTasksCompleted) {
    return { status: 'flat', label: 'Baseline', severity: 'neutral' };
  }

  const okrChange = data.okrProgress - data.previousOKRProgress;
  const velocityChange = ((data.tasksCompleted - data.previousTasksCompleted) / data.previousTasksCompleted) * 100;

  if (okrChange > 5 || velocityChange > 15) {
    return { status: 'up', label: 'Accelerating', severity: 'positive' };
  } else if (okrChange < -5 || velocityChange < -10) {
    return { status: 'down', label: 'Slowing', severity: 'negative' };
  }

  return { status: 'flat', label: 'Steady', severity: 'neutral' };
}

function calculateTeamTrend(data: ReportDataForSummary): TrendIndicator {
  if (!data.previousUtilization) {
    return { status: 'flat', label: 'Baseline', severity: 'neutral' };
  }

  const utilizationChange = data.utilization - data.previousUtilization;

  // Team health improving if moving toward optimal range (70-85%)
  const currentDistance = Math.min(Math.abs(data.utilization - 77.5), Math.abs(data.utilization - 70), Math.abs(data.utilization - 85));
  const previousDistance = Math.min(Math.abs(data.previousUtilization - 77.5), Math.abs(data.previousUtilization - 70), Math.abs(data.previousUtilization - 85));

  if (currentDistance < previousDistance - 3) {
    return { status: 'up', label: 'Improving', severity: 'positive' };
  } else if (currentDistance > previousDistance + 3) {
    return { status: 'down', label: 'Declining', severity: 'negative' };
  }

  return { status: 'flat', label: 'Stable', severity: 'neutral' };
}
