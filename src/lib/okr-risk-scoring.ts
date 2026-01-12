// OKR Risk Scoring System
// Analyzes objectives and calculates risk scores based on multiple factors

import type { Objective } from '@/types';

export interface RiskScore {
  score: number; // 0-100, where 100 is highest risk
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    timeProgress: number; // % of time elapsed
    taskProgress: number; // % of tasks completed
    daysRemaining: number;
    progressGap: number; // Gap between expected and actual progress
  };
  recommendations: string[];
}

/**
 * Calculate risk score for an objective based on multiple factors
 */
export function calculateObjectiveRisk(
  objective: Objective,
  linkedTasksTotal: number,
  linkedTasksCompleted: number
): RiskScore {
  const now = Date.now();
  const start = new Date(objective.startDate).getTime();
  const end = new Date(objective.endDate).getTime();

  // Calculate time progress (% of time elapsed)
  const totalDuration = end - start;
  const elapsed = now - start;
  const timeProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

  // Calculate days remaining
  const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  // Calculate task progress
  const taskProgress = linkedTasksTotal > 0
    ? (linkedTasksCompleted / linkedTasksTotal) * 100
    : (objective.calculatedProgress || 0);

  // Calculate expected progress (should match time progress for linear trajectory)
  const expectedProgress = timeProgress;
  const progressGap = expectedProgress - taskProgress;

  // Risk calculation
  let riskScore = 0;
  const recommendations: string[] = [];

  // Factor 1: Progress gap (40% weight)
  if (progressGap > 30) {
    riskScore += 40;
    recommendations.push('Significantly behind schedule - consider replanning or adding resources');
  } else if (progressGap > 15) {
    riskScore += 25;
    recommendations.push('Falling behind pace - review blockers and adjust tasks');
  } else if (progressGap > 5) {
    riskScore += 10;
    recommendations.push('Slightly behind - maintain focus on critical tasks');
  }

  // Factor 2: Time remaining (30% weight)
  if (daysRemaining < 7 && taskProgress < 80) {
    riskScore += 30;
    recommendations.push('Less than 1 week left with low completion - escalate now');
  } else if (daysRemaining < 14 && taskProgress < 60) {
    riskScore += 20;
    recommendations.push('2 weeks left - sprint to finish critical tasks');
  } else if (daysRemaining < 30 && taskProgress < 40) {
    riskScore += 15;
    recommendations.push('1 month left - accelerate execution');
  }

  // Factor 3: Absolute progress (20% weight)
  if (taskProgress < 20 && timeProgress > 50) {
    riskScore += 20;
    recommendations.push('Over halfway through timeline with minimal progress');
  } else if (taskProgress < 40 && timeProgress > 75) {
    riskScore += 15;
    recommendations.push('Final quarter with low progress - urgent action needed');
  }

  // Factor 4: Completion trajectory (10% weight)
  const requiredWeeklyProgress = daysRemaining > 0
    ? (100 - taskProgress) / (daysRemaining / 7)
    : 100;

  if (requiredWeeklyProgress > 30) {
    riskScore += 10;
    recommendations.push(`Need ${requiredWeeklyProgress.toFixed(0)}%/week to complete - may be unrealistic`);
  }

  // Positive reinforcement for on-track objectives
  if (taskProgress >= expectedProgress && taskProgress > 70) {
    recommendations.push('Excellent progress - maintain momentum');
  } else if (taskProgress >= expectedProgress) {
    recommendations.push('On track - keep up the good work');
  }

  // Determine risk level
  let level: RiskScore['level'];
  if (riskScore >= 75) level = 'critical';
  else if (riskScore >= 50) level = 'high';
  else if (riskScore >= 25) level = 'medium';
  else level = 'low';

  return {
    score: Math.min(100, riskScore),
    level,
    factors: {
      timeProgress,
      taskProgress,
      daysRemaining,
      progressGap,
    },
    recommendations: recommendations.length > 0
      ? recommendations
      : ['All indicators healthy - continue current approach'],
  };
}

/**
 * Get color for risk level
 */
export function getRiskColor(level: RiskScore['level']): {
  bg: string;
  text: string;
  hex: string;
} {
  switch (level) {
    case 'low':
      return { bg: 'bg-green-500/20', text: 'text-green-400', hex: '#10b981' };
    case 'medium':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', hex: '#eab308' };
    case 'high':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', hex: '#f97316' };
    case 'critical':
      return { bg: 'bg-red-500/20', text: 'text-red-400', hex: '#ef4444' };
  }
}

/**
 * Get risk level label
 */
export function getRiskLabel(level: RiskScore['level']): string {
  switch (level) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    case 'critical':
      return 'Critical Risk';
  }
}
