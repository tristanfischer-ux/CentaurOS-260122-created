/**
 * Time Unit (TU) Analytics Engine
 *
 * Elite consulting-grade TU tracking and analysis
 * Frameworks: McKinsey Operational Excellence, BCG Performance Analytics,
 * Bain Operational Improvement, Deloitte Cost Management
 *
 * KEY METRICS:
 * - TU Variance: Estimated vs Actual TUs spent
 * - TU Efficiency: Output per TU invested
 * - Cost Variance: Budget vs Actual spend
 * - Team Productivity: TUs completed per week
 * - AI ROI: Cost savings from AI multipliers
 * - Skill Match Impact: Efficiency loss from misalignment
 */

import type { WorkPlan, TUAllocation, AppliedAITool } from '../state/work-plan-store';
import type { OrganizationMember } from '../organization-seed';

// ============================================
// CORE TU METRICS
// ============================================

export interface TUMetrics {
  // Allocation Metrics
  totalTUsEstimated: number;
  totalTUsAllocated: number;
  totalTUsExpended: number;
  totalTUsRemaining: number;

  // Variance Analysis
  tuVariance: number;              // Actual - Estimated (negative = under budget)
  tuVariancePercent: number;       // % deviation from estimate
  costVariance: number;            // Actual cost - Budget cost
  costVariancePercent: number;     // % deviation from budget

  // Efficiency Metrics
  tuEfficiency: number;            // 1.0 = on target, >1 = over budget
  costEfficiency: number;          // Cost per TU vs baseline
  tasksPerTU: number;              // Tasks completed per TU

  // Productivity Metrics
  tuPerWeek: number;               // Average TUs completed weekly
  velocityTrend: 'improving' | 'stable' | 'declining';

  // Financial Metrics
  totalBudgeted: number;           // £ estimated cost
  totalActual: number;             // £ actual cost
  totalSavings: number;            // £ saved (negative if over)

  // AI Impact
  aiMultiplierSavings: number;     // £ saved from AI tools
  aiCostSpend: number;             // £ spent on AI tools
  aiROI: number;                   // Return on AI investment
}

export interface TaskTUAnalysis {
  taskId: string;
  taskTitle: string;
  function: string;
  status: string;

  // TU Breakdown
  estimatedTUs: number;
  allocatedTUs: number;
  expendedTUs: number;
  remainingTUs: number;

  // Timeline
  weeksToCompletion: number;
  daysToCompletion: number;

  // Cost Analysis
  budgetedCost: number;
  actualCost: number;
  projectedCost: number;
  variance: number;
  variancePercent: number;

  // Team
  teamSize: number;
  teamMembers: string[];

  // AI Impact
  aiMultiplier: number;
  aiCost: number;
  originalTUs: number;            // Without AI
  tuSavings: number;              // TUs saved by AI

  // Efficiency
  efficiencyRating: 'excellent' | 'good' | 'fair' | 'poor';
  skillMatchScore: number;        // 0-100 (% team members with matching function)
}

export interface MemberTUPerformance {
  memberId: string;
  memberName: string;
  role: string;
  function: string;

  // Capacity
  totalCapacity: number;           // TUs per week
  allocatedTUs: number;            // Currently allocated
  availableTUs: number;            // Remaining capacity
  utilizationPercent: number;      // % of capacity used

  // Performance
  tasksWorking: number;            // Active task count
  tusExpended: number;             // TUs completed to date
  weeklyCost: number;              // £ weekly cost
  costPerTU: number;               // £ per TU

  // Efficiency
  avgTaskCompletion: number;       // Days to complete tasks
  skillMatchRate: number;          // % tasks matching function
  efficiencyScore: number;         // Composite score (0-100)

  // Trend
  trend: 'improving' | 'stable' | 'declining';
}

export interface TUForecast {
  nextWeek: {
    tusPlanned: number;
    tusExpected: number;
    cost: number;
    tasksToComplete: number;
  };
  nextMonth: {
    tusPlanned: number;
    tusExpected: number;
    cost: number;
    tasksToComplete: number;
  };
  nextQuarter: {
    tusPlanned: number;
    tusExpected: number;
    cost: number;
    tasksToComplete: number;
  };
  capacityBottlenecks: {
    function: string;
    shortfall: number;
    impactedTasks: string[];
  }[];
}

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate comprehensive TU metrics across all work plans
 */
export function calculateTUMetrics(
  workPlans: WorkPlan[],
  members: OrganizationMember[],
  timeframe?: 'week' | 'month' | 'quarter' | 'all'
): TUMetrics {
  // Filter to active/completed tasks only (exclude abandoned)
  const activePlans = workPlans.filter(wp =>
    wp.status !== 'abandoned'
  );

  // Apply timeframe filter if specified
  // (In production, would filter by date ranges)
  const plans = activePlans;

  // Total TUs
  const totalTUsEstimated = plans.reduce((sum, wp) => sum + wp.estimatedTimeUnits, 0);
  const totalTUsAllocated = plans.reduce((sum, wp) =>
    sum + (wp.allocations?.reduce((s, a) => s + a.squaresPerWeek, 0) || 0), 0
  );
  const totalTUsExpended = plans.reduce((sum, wp) => sum + (wp.tusExpended || 0), 0);
  const totalTUsRemaining = totalTUsEstimated - totalTUsExpended;

  // Variance calculations
  const tuVariance = totalTUsExpended - totalTUsEstimated;
  const tuVariancePercent = totalTUsEstimated > 0
    ? (tuVariance / totalTUsEstimated) * 100
    : 0;

  // Cost calculations
  const totalBudgeted = plans.reduce((sum, wp) => {
    const taskCost = wp.allocations?.reduce((s, alloc) =>
      s + (alloc.squaresPerWeek * alloc.costPerSquare), 0
    ) || 0;
    // Estimate total cost: (estimatedTUs / allocatedTUsPerWeek) * weeklyCost
    const weeksEstimated = wp.estimatedTimeUnits / Math.max(1, wp.allocations?.reduce((s, a) => s + a.squaresPerWeek, 0) || 1);
    return sum + (taskCost * weeksEstimated);
  }, 0);

  const totalActual = plans.reduce((sum, wp) => {
    const weeklyCost = wp.allocations?.reduce((s, alloc) =>
      s + (alloc.squaresPerWeek * alloc.costPerSquare), 0
    ) || 0;
    // Actual cost based on TUs expended
    const weeksSpent = wp.tusExpended / Math.max(1, wp.allocations?.reduce((s, a) => s + a.squaresPerWeek, 0) || 1);
    return sum + (weeklyCost * weeksSpent);
  }, 0);

  const costVariance = totalActual - totalBudgeted;
  const costVariancePercent = totalBudgeted > 0
    ? (costVariance / totalBudgeted) * 100
    : 0;

  // Efficiency metrics
  const tuEfficiency = totalTUsEstimated > 0
    ? totalTUsExpended / totalTUsEstimated
    : 1.0;

  const costEfficiency = totalBudgeted > 0 && totalActual > 0
    ? totalActual / totalBudgeted
    : 1.0;

  const completedTasks = plans.filter(wp => wp.status === 'completed').length;
  const tasksPerTU = totalTUsExpended > 0
    ? completedTasks / totalTUsExpended
    : 0;

  // Productivity metrics (weekly average)
  const tuPerWeek = totalTUsAllocated; // Current weekly burn rate

  // Velocity trend (simplified - in production would analyze historical data)
  const velocityTrend: 'improving' | 'stable' | 'declining' =
    tuEfficiency < 1.0 ? 'improving' :
    tuEfficiency > 1.2 ? 'declining' : 'stable';

  // AI Impact calculations
  const aiMetrics = calculateAIImpact(plans);

  return {
    totalTUsEstimated,
    totalTUsAllocated,
    totalTUsExpended,
    totalTUsRemaining,
    tuVariance,
    tuVariancePercent,
    costVariance,
    costVariancePercent,
    tuEfficiency,
    costEfficiency,
    tasksPerTU,
    tuPerWeek,
    velocityTrend,
    totalBudgeted: Math.round(totalBudgeted),
    totalActual: Math.round(totalActual),
    totalSavings: Math.round(totalBudgeted - totalActual),
    aiMultiplierSavings: Math.round(aiMetrics.savings),
    aiCostSpend: Math.round(aiMetrics.cost),
    aiROI: aiMetrics.roi,
  };
}

/**
 * Analyze individual task TU performance
 */
export function analyzeTaskTU(
  task: WorkPlan,
  members: OrganizationMember[]
): TaskTUAnalysis {
  const allocatedTUs = task.allocations?.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 0;
  const remainingTUs = task.estimatedTimeUnits - task.tusExpended;

  // Timeline calculations
  const weeksToCompletion = allocatedTUs > 0
    ? Math.ceil(remainingTUs / allocatedTUs)
    : 999;
  const daysToCompletion = weeksToCompletion * 5; // 5 working days per week

  // Cost analysis
  const weeklyCost = task.allocations?.reduce((sum, alloc) =>
    sum + (alloc.squaresPerWeek * alloc.costPerSquare), 0
  ) || 0;

  const weeksEstimated = allocatedTUs > 0 ? task.estimatedTimeUnits / allocatedTUs : 0;
  const budgetedCost = weeklyCost * weeksEstimated;

  const weeksActual = allocatedTUs > 0 ? task.tusExpended / allocatedTUs : 0;
  const actualCost = weeklyCost * weeksActual;

  const projectedCost = weeklyCost * (weeksActual + weeksToCompletion);
  const variance = actualCost - budgetedCost;
  const variancePercent = budgetedCost > 0 ? (variance / budgetedCost) * 100 : 0;

  // Team analysis
  const teamMembers = task.allocations?.map(a => a.memberName) || [];
  const teamSize = teamMembers.length;

  // Skill match score
  const matchingMembers = task.allocations?.filter(alloc => {
    const member = members.find(m => m.id === alloc.memberId);
    return member?.function === task.function;
  }).length || 0;
  const skillMatchScore = teamSize > 0 ? (matchingMembers / teamSize) * 100 : 100;

  // AI impact
  const aiMultiplier = task.appliedAITools?.reduce((max, tool) =>
    Math.max(max, tool.multiplier), 1
  ) || 1;
  const originalTUs = task.estimatedTimeUnits * aiMultiplier;
  const tuSavings = originalTUs - task.estimatedTimeUnits;
  const aiCost = task.appliedAITools?.reduce((sum, tool) =>
    sum + (tool.costPerSquare * task.estimatedTimeUnits), 0
  ) || 0;

  // Efficiency rating
  const efficiencyScore = variancePercent;
  const efficiencyRating: 'excellent' | 'good' | 'fair' | 'poor' =
    efficiencyScore < -10 ? 'excellent' :  // Under budget
    efficiencyScore < 10 ? 'good' :        // On budget
    efficiencyScore < 25 ? 'fair' :        // Slightly over
    'poor';                                 // Significantly over

  return {
    taskId: task.id,
    taskTitle: task.title,
    function: task.function,
    status: task.status,
    estimatedTUs: task.estimatedTimeUnits,
    allocatedTUs,
    expendedTUs: task.tusExpended,
    remainingTUs,
    weeksToCompletion,
    daysToCompletion,
    budgetedCost: Math.round(budgetedCost),
    actualCost: Math.round(actualCost),
    projectedCost: Math.round(projectedCost),
    variance: Math.round(variance),
    variancePercent: Math.round(variancePercent * 10) / 10,
    teamSize,
    teamMembers,
    aiMultiplier,
    aiCost: Math.round(aiCost),
    originalTUs: Math.round(originalTUs),
    tuSavings: Math.round(tuSavings),
    efficiencyRating,
    skillMatchScore: Math.round(skillMatchScore),
  };
}

/**
 * Calculate member TU performance metrics
 */
export function analyzeMemberTU(
  member: OrganizationMember,
  workPlans: WorkPlan[]
): MemberTUPerformance {
  // Capacity calculation
  const totalCapacity = member.role === 'Founder' || member.role === 'Apprentice'
    ? 10
    : (member.daysPerWeek || 2) * 2;

  // Find all tasks this member is allocated to
  const memberTasks = workPlans.filter(wp =>
    wp.status !== 'completed' &&
    wp.status !== 'abandoned' &&
    wp.allocations?.some(a => a.memberId === member.id)
  );

  // Calculate allocated TUs
  const allocatedTUs = memberTasks.reduce((sum, wp) => {
    const allocation = wp.allocations?.find(a => a.memberId === member.id);
    return sum + (allocation?.squaresPerWeek || 0);
  }, 0);

  const availableTUs = totalCapacity - allocatedTUs;
  const utilizationPercent = totalCapacity > 0 ? (allocatedTUs / totalCapacity) * 100 : 0;

  // Calculate TUs expended (simplified - would need historical tracking)
  const tusExpended = memberTasks.reduce((sum, wp) => {
    const allocation = wp.allocations?.find(a => a.memberId === member.id);
    if (!allocation) return sum;
    // Proportional share of TUs expended
    const totalAllocated = wp.allocations?.reduce((s, a) => s + a.squaresPerWeek, 0) || 1;
    const memberShare = allocation.squaresPerWeek / totalAllocated;
    return sum + (wp.tusExpended * memberShare);
  }, 0);

  // Cost calculations
  const costPerTU = member.role === 'Founder'
    ? 960
    : member.role === 'FractionalExec'
      ? Math.round((member.costPerDay || 800) / 2)
      : 70;

  const weeklyCost = allocatedTUs * costPerTU;

  // Performance metrics
  const avgTaskCompletion = 30; // Placeholder - would calculate from completed tasks

  // Skill match rate
  const matchingTasks = memberTasks.filter(wp => wp.function === member.function).length;
  const skillMatchRate = memberTasks.length > 0 ? (matchingTasks / memberTasks.length) * 100 : 100;

  // Efficiency score (composite)
  const efficiencyScore = Math.round(
    (skillMatchRate * 0.4) +
    (Math.min(utilizationPercent, 100) * 0.3) +
    (50 * 0.3) // Placeholder for completion rate
  );

  // Trend (simplified)
  const trend: 'improving' | 'stable' | 'declining' =
    efficiencyScore > 75 ? 'improving' :
    efficiencyScore > 50 ? 'stable' : 'declining';

  return {
    memberId: member.id,
    memberName: member.name,
    role: member.role,
    function: member.function,
    totalCapacity,
    allocatedTUs,
    availableTUs,
    utilizationPercent: Math.round(utilizationPercent),
    tasksWorking: memberTasks.length,
    tusExpended: Math.round(tusExpended * 10) / 10,
    weeklyCost: Math.round(weeklyCost),
    costPerTU,
    avgTaskCompletion,
    skillMatchRate: Math.round(skillMatchRate),
    efficiencyScore,
    trend,
  };
}

/**
 * Generate TU forecast for planning
 */
export function forecastTUs(
  workPlans: WorkPlan[],
  members: OrganizationMember[]
): TUForecast {
  const activePlans = workPlans.filter(wp =>
    wp.status === 'in-progress' || wp.status === 'not-started'
  );

  // Calculate weekly TU burn rate
  const weeklyTUs = activePlans.reduce((sum, wp) =>
    sum + (wp.allocations?.reduce((s, a) => s + a.squaresPerWeek, 0) || 0), 0
  );

  // Calculate weekly cost
  const weeklyCost = activePlans.reduce((sum, wp) =>
    sum + (wp.allocations?.reduce((s, a) => s + (a.squaresPerWeek * a.costPerSquare), 0) || 0), 0
  );

  // Tasks near completion (for next week)
  const tasksNextWeek = activePlans.filter(wp => {
    const remaining = wp.estimatedTimeUnits - wp.tusExpended;
    const allocated = wp.allocations?.reduce((s, a) => s + a.squaresPerWeek, 0) || 0;
    const weeksLeft = allocated > 0 ? remaining / allocated : 999;
    return weeksLeft <= 1;
  }).length;

  // Capacity bottlenecks
  const functionCapacity = new Map<string, { available: number; needed: number; tasks: string[] }>();

  activePlans.forEach(wp => {
    const needed = wp.allocations?.reduce((sum, a) => sum + a.squaresPerWeek, 0) || wp.estimatedTimeUnits / 4;
    const current = functionCapacity.get(wp.function) || { available: 0, needed: 0, tasks: [] };
    functionCapacity.set(wp.function, {
      available: current.available,
      needed: current.needed + needed,
      tasks: [...current.tasks, wp.title],
    });
  });

  // Calculate available capacity per function
  members.filter(m => m.status === 'active').forEach(m => {
    const capacity = m.role === 'Founder' || m.role === 'Apprentice' ? 10 : (m.daysPerWeek || 2) * 2;
    const allocated = activePlans.reduce((sum, wp) => {
      const alloc = wp.allocations?.find(a => a.memberId === m.id);
      return sum + (alloc?.squaresPerWeek || 0);
    }, 0);
    const available = capacity - allocated;

    const current = functionCapacity.get(m.function) || { available: 0, needed: 0, tasks: [] };
    functionCapacity.set(m.function, {
      ...current,
      available: current.available + available,
    });
  });

  const capacityBottlenecks = Array.from(functionCapacity.entries())
    .filter(([_, data]) => data.needed > data.available)
    .map(([func, data]) => ({
      function: func,
      shortfall: Math.round(data.needed - data.available),
      impactedTasks: data.tasks,
    }));

  return {
    nextWeek: {
      tusPlanned: Math.round(weeklyTUs),
      tusExpected: Math.round(weeklyTUs * 1.0), // Assume 100% efficiency
      cost: Math.round(weeklyCost),
      tasksToComplete: tasksNextWeek,
    },
    nextMonth: {
      tusPlanned: Math.round(weeklyTUs * 4),
      tusExpected: Math.round(weeklyTUs * 4 * 0.95), // Slight efficiency drop
      cost: Math.round(weeklyCost * 4),
      tasksToComplete: activePlans.filter(wp => {
        const remaining = wp.estimatedTimeUnits - wp.tusExpended;
        const allocated = wp.allocations?.reduce((s, a) => s + a.squaresPerWeek, 0) || 0;
        return allocated > 0 && (remaining / allocated) <= 4;
      }).length,
    },
    nextQuarter: {
      tusPlanned: Math.round(weeklyTUs * 12),
      tusExpected: Math.round(weeklyTUs * 12 * 0.9), // Account for variability
      cost: Math.round(weeklyCost * 12),
      tasksToComplete: activePlans.length,
    },
    capacityBottlenecks,
  };
}

/**
 * Calculate AI impact and ROI
 */
function calculateAIImpact(workPlans: WorkPlan[]): { savings: number; cost: number; roi: number } {
  let totalSavings = 0;
  let totalAICost = 0;

  workPlans.forEach(wp => {
    if (!wp.appliedAITools || wp.appliedAITools.length === 0) return;

    const maxMultiplier = Math.max(...wp.appliedAITools.map(t => t.multiplier));
    if (maxMultiplier <= 1) return;

    // TUs saved
    const originalTUs = wp.estimatedTimeUnits * maxMultiplier;
    const tusSaved = originalTUs - wp.estimatedTimeUnits;

    // Cost savings (average human cost per TU)
    const avgCostPerTU = wp.allocations && wp.allocations.length > 0
      ? wp.allocations.reduce((sum, a) => sum + a.costPerSquare, 0) / wp.allocations.length
      : 500; // Default average

    const costSaved = tusSaved * avgCostPerTU;
    totalSavings += costSaved;

    // AI cost
    const aiCost = wp.appliedAITools.reduce((sum, tool) =>
      sum + (tool.costPerSquare * wp.estimatedTimeUnits), 0
    );
    totalAICost += aiCost;
  });

  const roi = totalAICost > 0 ? (totalSavings - totalAICost) / totalAICost : 0;

  return {
    savings: totalSavings,
    cost: totalAICost,
    roi,
  };
}

/**
 * Generate TU efficiency leaderboard
 */
export function generateTULeaderboard(
  workPlans: WorkPlan[],
  members: OrganizationMember[]
): MemberTUPerformance[] {
  const performances = members
    .filter(m => m.status === 'active')
    .map(m => analyzeMemberTU(m, workPlans))
    .sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  return performances;
}

/**
 * Identify TU efficiency opportunities
 */
export interface TUOpportunity {
  type: 'skill_mismatch' | 'underutilization' | 'ai_adoption' | 'team_size';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  savings: number;
  affectedTasks: string[];
}

export function identifyTUOpportunities(
  workPlans: WorkPlan[],
  members: OrganizationMember[]
): TUOpportunity[] {
  const opportunities: TUOpportunity[] = [];

  // 1. Skill mismatches
  workPlans.forEach(wp => {
    if (wp.status === 'completed' || wp.status === 'abandoned') return;

    const mismatchedMembers = wp.allocations?.filter(alloc => {
      const member = members.find(m => m.id === alloc.memberId);
      return member && member.function !== wp.function;
    }) || [];

    if (mismatchedMembers.length > 0) {
      const penalty = mismatchedMembers.reduce((sum, alloc) =>
        sum + (alloc.squaresPerWeek * 0.5 * alloc.costPerSquare), 0 // 50% efficiency penalty
      );

      opportunities.push({
        type: 'skill_mismatch',
        priority: penalty > 1000 ? 'high' : 'medium',
        title: `Skill mismatch on "${wp.title}"`,
        description: `${mismatchedMembers.length} team member(s) working outside their function`,
        impact: `50% efficiency penalty = ${Math.round(mismatchedMembers.reduce((s, a) => s + a.squaresPerWeek, 0) * 0.5)} extra TUs`,
        savings: Math.round(penalty),
        affectedTasks: [wp.title],
      });
    }
  });

  // 2. Underutilization
  members.filter(m => m.status === 'active').forEach(member => {
    const perf = analyzeMemberTU(member, workPlans);
    if (perf.utilizationPercent < 50 && perf.utilizationPercent > 0) {
      opportunities.push({
        type: 'underutilization',
        priority: 'medium',
        title: `${member.name} underutilized`,
        description: `Only ${perf.utilizationPercent}% capacity used (${perf.availableTUs}□ available)`,
        impact: `Could absorb ${perf.availableTUs}□/week from other tasks`,
        savings: Math.round(perf.availableTUs * perf.costPerTU),
        affectedTasks: [],
      });
    }
  });

  // 3. AI adoption opportunities
  const tasksWithoutAI = workPlans.filter(wp =>
    (wp.status === 'in-progress' || wp.status === 'not-started') &&
    (!wp.appliedAITools || wp.appliedAITools.length === 0) &&
    wp.estimatedTimeUnits > 5
  );

  if (tasksWithoutAI.length > 0) {
    const totalTUs = tasksWithoutAI.reduce((sum, wp) => sum + wp.estimatedTimeUnits, 0);
    const potentialSavings = totalTUs * 0.5 * 500; // 50% reduction at £500/TU average

    opportunities.push({
      type: 'ai_adoption',
      priority: 'high',
      title: `${tasksWithoutAI.length} tasks without AI assistance`,
      description: `${totalTUs}□ could be reduced with AI tools (2x-20x multipliers)`,
      impact: `Potential to save ${Math.round(totalTUs * 0.5)}□ (50% with basic AI)`,
      savings: Math.round(potentialSavings),
      affectedTasks: tasksWithoutAI.map(wp => wp.title),
    });
  }

  return opportunities.sort((a, b) => {
    const priorityScore = { high: 3, medium: 2, low: 1 };
    return priorityScore[b.priority] - priorityScore[a.priority];
  });
}
