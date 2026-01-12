/**
 * Team Performance Analytics Library
 *
 * Provides comprehensive metrics for evaluating team effectiveness:
 * - Productivity metrics (output, completion rates)
 * - Quality metrics (review scores, task quality)
 * - Efficiency metrics (velocity, time management)
 * - Engagement metrics (participation, consistency)
 *
 * Research-based from:
 * - Desklog Employee Performance KPIs Guide 2026
 * - Time Doctor Employee Performance Metrics
 * - ActivTrak Productivity KPIs
 */

import type { Task, Review, Role } from '@/types';

export interface TeamMemberPerformance {
  userId: string;
  name: string;
  role: Role;
  function: string;

  // Productivity Metrics
  tasksCompleted: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  taskCompletionRate: number; // % of assigned tasks completed
  avgTasksPerWeek: number;

  // Quality Metrics
  reviewApprovalRate: number; // % of reviews approved first time
  tasksRequiringRework: number;
  avgReviewScore: number; // 1-5 scale

  // Efficiency Metrics
  avgTimeToComplete: number; // hours
  onTimeDeliveryRate: number; // % delivered by due date
  velocity: number; // tasks per week trend

  // Engagement Metrics
  daysActive: number; // days with at least one task update
  consistencyScore: number; // how regularly they work (0-100)
  responsiveness: number; // avg hours to respond to assignments

  // Advanced Metrics
  urgentTaskCompletion: number; // count of urgent tasks completed
  highPriorityCompletion: number; // count of high priority tasks
  contributionScore: number; // weighted score (0-100)
  trend: 'improving' | 'steady' | 'declining';

  // Timestamps
  periodStart: string;
  periodEnd: string;
  lastActive: string;
}

export interface TeamPerformanceSummary {
  totalMembers: number;
  totalTasksCompleted: number;
  avgCompletionRate: number;
  avgQualityScore: number;
  topPerformers: TeamMemberPerformance[];
  needsAttention: TeamMemberPerformance[];
  trends: {
    productivityTrend: 'up' | 'stable' | 'down';
    qualityTrend: 'up' | 'stable' | 'down';
    engagementTrend: 'up' | 'stable' | 'down';
  };
}

export interface PerformanceComparison {
  metric: string;
  label: string;
  executives: number;
  apprentices: number;
  target: number;
  insight: string;
}

/**
 * Calculate comprehensive performance metrics for a team member
 */
export function calculateMemberPerformance(
  userId: string,
  name: string,
  role: Role,
  memberFunction: string,
  tasks: Task[],
  reviews: Review[],
  periodDays: number = 30
): TeamMemberPerformance {
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // Filter tasks for this user in period
  const userTasks = tasks.filter(t =>
    (t.assigneeId === userId || t.createdBy === userId) &&
    new Date(t.createdAt) >= periodStart
  );

  const completedTasks = userTasks.filter(t => t.status === 'done');
  const assignedTasks = tasks.filter(t => t.assigneeId === userId);

  // Productivity Metrics
  const tasksCompleted = completedTasks.length;
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const tasksCompletedThisWeek = completedTasks.filter(t =>
    t.completedAt && new Date(t.completedAt) >= oneWeekAgo
  ).length;

  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const tasksCompletedThisMonth = completedTasks.filter(t =>
    t.completedAt && new Date(t.completedAt) >= oneMonthAgo
  ).length;

  const taskCompletionRate = assignedTasks.length > 0
    ? (completedTasks.length / assignedTasks.length) * 100
    : 0;

  const avgTasksPerWeek = (periodDays / 7) > 0
    ? tasksCompleted / (periodDays / 7)
    : 0;

  // Quality Metrics
  const userReviews = reviews.filter(r => r.taskId && userTasks.find(t => t.id === r.taskId));
  const approvedReviews = userReviews.filter(r => r.status === 'approved');
  const reviewApprovalRate = userReviews.length > 0
    ? (approvedReviews.length / userReviews.length) * 100
    : 0;

  const tasksRequiringRework = userReviews.filter(r => r.status === 'changes_requested').length;

  // Simulate review scores (in real app, would come from review data)
  const avgReviewScore = reviewApprovalRate >= 90 ? 5 :
                        reviewApprovalRate >= 75 ? 4 :
                        reviewApprovalRate >= 60 ? 3 :
                        reviewApprovalRate >= 40 ? 2 : 1;

  // Efficiency Metrics
  const completedWithTime = completedTasks.filter(t => t.completedAt && t.createdAt);
  const avgTimeToComplete = completedWithTime.length > 0
    ? completedWithTime.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const completed = new Date(t.completedAt!).getTime();
        const hours = (completed - created) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) / completedWithTime.length
    : 0;

  const tasksWithDueDate = completedTasks.filter(t => t.dueDate);
  const onTimeDeliveries = tasksWithDueDate.filter(t =>
    t.completedAt && t.dueDate && new Date(t.completedAt) <= new Date(t.dueDate)
  );
  const onTimeDeliveryRate = tasksWithDueDate.length > 0
    ? (onTimeDeliveries.length / tasksWithDueDate.length) * 100
    : 0;

  const velocity = avgTasksPerWeek;

  // Engagement Metrics
  const uniqueDays = new Set(
    userTasks.map(t => new Date(t.updatedAt).toDateString())
  );
  const daysActive = uniqueDays.size;

  const consistencyScore = (daysActive / periodDays) * 100;

  // Responsiveness (avg hours from task creation to first update)
  const responsiveness = userTasks.length > 0
    ? userTasks.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.updatedAt).getTime();
        const hours = (updated - created) / (1000 * 60 * 60);
        return sum + Math.min(hours, 24); // Cap at 24 hours
      }, 0) / userTasks.length
    : 0;

  // Advanced Metrics
  const urgentTaskCompletion = completedTasks.filter(t => t.priority === 'urgent').length;
  const highPriorityCompletion = completedTasks.filter(t => t.priority === 'high').length;

  // Contribution Score (weighted formula)
  const contributionScore = Math.min(100, Math.round(
    (taskCompletionRate * 0.3) +
    (reviewApprovalRate * 0.2) +
    (onTimeDeliveryRate * 0.2) +
    (consistencyScore * 0.15) +
    ((urgentTaskCompletion + highPriorityCompletion) * 2 * 0.15)
  ));

  // Trend calculation (compare last 2 weeks vs previous 2 weeks)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const recentCompleted = completedTasks.filter(t =>
    t.completedAt && new Date(t.completedAt) >= twoWeeksAgo
  ).length;

  const previousCompleted = completedTasks.filter(t =>
    t.completedAt && new Date(t.completedAt) >= fourWeeksAgo && new Date(t.completedAt) < twoWeeksAgo
  ).length;

  const trend = recentCompleted > previousCompleted * 1.1 ? 'improving' :
                recentCompleted < previousCompleted * 0.9 ? 'declining' : 'steady';

  const lastActive = userTasks.length > 0
    ? new Date(Math.max(...userTasks.map(t => new Date(t.updatedAt).getTime()))).toISOString()
    : now.toISOString();

  return {
    userId,
    name,
    role,
    function: memberFunction,
    tasksCompleted,
    tasksCompletedThisWeek,
    tasksCompletedThisMonth,
    taskCompletionRate,
    avgTasksPerWeek,
    reviewApprovalRate,
    tasksRequiringRework,
    avgReviewScore,
    avgTimeToComplete,
    onTimeDeliveryRate,
    velocity,
    daysActive,
    consistencyScore,
    responsiveness,
    urgentTaskCompletion,
    highPriorityCompletion,
    contributionScore,
    trend,
    periodStart: periodStart.toISOString(),
    periodEnd: now.toISOString(),
    lastActive,
  };
}

/**
 * Generate team performance summary
 */
export function generateTeamSummary(
  performances: TeamMemberPerformance[]
): TeamPerformanceSummary {
  const totalMembers = performances.length;
  const totalTasksCompleted = performances.reduce((sum, p) => sum + p.tasksCompleted, 0);
  const avgCompletionRate = performances.length > 0
    ? performances.reduce((sum, p) => sum + p.taskCompletionRate, 0) / performances.length
    : 0;
  const avgQualityScore = performances.length > 0
    ? performances.reduce((sum, p) => sum + p.avgReviewScore, 0) / performances.length
    : 0;

  // Top performers (contribution score >= 80)
  const topPerformers = performances
    .filter(p => p.contributionScore >= 80)
    .sort((a, b) => b.contributionScore - a.contributionScore)
    .slice(0, 5);

  // Needs attention (contribution score < 50 OR declining trend)
  const needsAttention = performances
    .filter(p => p.contributionScore < 50 || p.trend === 'declining')
    .sort((a, b) => a.contributionScore - b.contributionScore);

  // Calculate trends
  const improvingCount = performances.filter(p => p.trend === 'improving').length;
  const decliningCount = performances.filter(p => p.trend === 'declining').length;

  const productivityTrend = improvingCount > decliningCount * 1.5 ? 'up' :
                           decliningCount > improvingCount * 1.5 ? 'down' : 'stable';

  const highQuality = performances.filter(p => p.avgReviewScore >= 4).length;
  const lowQuality = performances.filter(p => p.avgReviewScore < 3).length;

  const qualityTrend = highQuality > lowQuality * 1.5 ? 'up' :
                      lowQuality > highQuality * 1.5 ? 'down' : 'stable';

  const highEngagement = performances.filter(p => p.consistencyScore >= 70).length;
  const lowEngagement = performances.filter(p => p.consistencyScore < 50).length;

  const engagementTrend = highEngagement > lowEngagement * 1.5 ? 'up' :
                         lowEngagement > highEngagement * 1.5 ? 'down' : 'stable';

  return {
    totalMembers,
    totalTasksCompleted,
    avgCompletionRate,
    avgQualityScore,
    topPerformers,
    needsAttention,
    trends: {
      productivityTrend,
      qualityTrend,
      engagementTrend,
    },
  };
}

/**
 * Compare executives vs apprentices performance
 */
export function compareRolePerformance(
  performances: TeamMemberPerformance[]
): PerformanceComparison[] {
  const executives = performances.filter(p => p.role === 'FractionalExec');
  const apprentices = performances.filter(p => p.role === 'Apprentice');

  const avgExecCompletion = executives.length > 0
    ? executives.reduce((sum, p) => sum + p.taskCompletionRate, 0) / executives.length
    : 0;

  const avgApprenticeCompletion = apprentices.length > 0
    ? apprentices.reduce((sum, p) => sum + p.taskCompletionRate, 0) / apprentices.length
    : 0;

  const avgExecQuality = executives.length > 0
    ? executives.reduce((sum, p) => sum + p.avgReviewScore, 0) / executives.length
    : 0;

  const avgApprenticeQuality = apprentices.length > 0
    ? apprentices.reduce((sum, p) => sum + p.avgReviewScore, 0) / apprentices.length
    : 0;

  const avgExecVelocity = executives.length > 0
    ? executives.reduce((sum, p) => sum + p.velocity, 0) / executives.length
    : 0;

  const avgApprenticeVelocity = apprentices.length > 0
    ? apprentices.reduce((sum, p) => sum + p.velocity, 0) / apprentices.length
    : 0;

  const avgExecConsistency = executives.length > 0
    ? executives.reduce((sum, p) => sum + p.consistencyScore, 0) / executives.length
    : 0;

  const avgApprenticeConsistency = apprentices.length > 0
    ? apprentices.reduce((sum, p) => sum + p.consistencyScore, 0) / apprentices.length
    : 0;

  return [
    {
      metric: 'completion_rate',
      label: 'Task Completion Rate',
      executives: avgExecCompletion,
      apprentices: avgApprenticeCompletion,
      target: 85,
      insight: avgExecCompletion >= 85 && avgApprenticeCompletion >= 85
        ? 'Both groups meeting targets'
        : avgExecCompletion < 85 && avgApprenticeCompletion < 85
        ? 'Both groups need support with task completion'
        : avgExecCompletion < avgApprenticeCompletion
        ? 'Apprentices outperforming executives on completion'
        : 'Executives showing stronger completion rates',
    },
    {
      metric: 'quality_score',
      label: 'Quality Score',
      executives: avgExecQuality,
      apprentices: avgApprenticeQuality,
      target: 4.0,
      insight: avgExecQuality >= 4 && avgApprenticeQuality >= 4
        ? 'High quality work across the board'
        : avgExecQuality < 4 && avgApprenticeQuality < 4
        ? 'Quality standards need attention'
        : avgExecQuality > avgApprenticeQuality
        ? 'Executives delivering higher quality'
        : 'Apprentices showing strong quality',
    },
    {
      metric: 'velocity',
      label: 'Velocity (Tasks/Week)',
      executives: avgExecVelocity,
      apprentices: avgApprenticeVelocity,
      target: 5.0,
      insight: avgExecVelocity > avgApprenticeVelocity
        ? 'Executives working at higher velocity'
        : avgApprenticeVelocity > avgExecVelocity * 1.2
        ? 'Apprentices showing impressive output'
        : 'Similar velocity across roles',
    },
    {
      metric: 'consistency',
      label: 'Consistency Score',
      executives: avgExecConsistency,
      apprentices: avgApprenticeConsistency,
      target: 70,
      insight: avgExecConsistency >= 70 && avgApprenticeConsistency >= 70
        ? 'Strong engagement from both groups'
        : avgExecConsistency < 70 || avgApprenticeConsistency < 70
        ? 'Consistency below target - check for blockers'
        : 'One group showing inconsistent engagement',
    },
  ];
}

/**
 * Generate performance insights and recommendations
 */
export function generateInsights(performance: TeamMemberPerformance): string[] {
  const insights: string[] = [];

  // Productivity insights
  if (performance.taskCompletionRate >= 90) {
    insights.push(`✅ Excellent completion rate (${performance.taskCompletionRate.toFixed(0)}%)`);
  } else if (performance.taskCompletionRate < 60) {
    insights.push(`⚠️ Low completion rate (${performance.taskCompletionRate.toFixed(0)}%) - may be over-assigned`);
  }

  // Quality insights
  if (performance.reviewApprovalRate >= 90) {
    insights.push('🌟 Consistently high-quality work');
  } else if (performance.reviewApprovalRate < 70) {
    insights.push('📚 Multiple revisions needed - consider more support');
  }

  // Efficiency insights
  if (performance.onTimeDeliveryRate >= 85) {
    insights.push('⏰ Reliable delivery timelines');
  } else if (performance.onTimeDeliveryRate < 60) {
    insights.push('🚩 Missing deadlines - check workload or blockers');
  }

  // Engagement insights
  if (performance.consistencyScore >= 80) {
    insights.push('🔥 Highly engaged and consistent');
  } else if (performance.consistencyScore < 50) {
    insights.push('💤 Irregular activity - check engagement');
  }

  // Trend insights
  if (performance.trend === 'improving') {
    insights.push('📈 Performance trending upward');
  } else if (performance.trend === 'declining') {
    insights.push('📉 Performance declining - needs attention');
  }

  // Priority task insights
  if (performance.urgentTaskCompletion + performance.highPriorityCompletion > 10) {
    insights.push('🎯 Strong track record on priority work');
  }

  return insights;
}
