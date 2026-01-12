// Supplier Delay Prediction System
// Analyzes supplier performance and predicts potential delays

import type { Supplier } from '@/types';

export interface DelayPrediction {
  supplierId: string;
  supplierName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  delayProbability: number; // 0-100%
  estimatedDelayDays: number;
  factors: {
    historicalPerformance: number; // Rating-based score
    leadTime: number; // Lead time in weeks
    region: string;
    certifications: number;
  };
  recommendations: string[];
}

/**
 * Predict potential delays for a supplier based on multiple factors
 */
export function predictSupplierDelay(supplier: Supplier): DelayPrediction {
  let riskScore = 0;
  const recommendations: string[] = [];

  // Factor 1: Historical Performance (40% weight)
  // Lower rating = higher risk
  const rating = supplier.rating ?? 3;
  const performanceScore = ((5 - rating) / 5) * 40;
  riskScore += performanceScore;

  if (rating < 3.5) {
    recommendations.push('Low historical rating - consider backup supplier');
  } else if (rating < 4.0) {
    recommendations.push('Average rating - monitor delivery closely');
  }

  // Factor 2: Lead Time (30% weight)
  // Longer lead time = higher risk of delays
  const leadTime = supplier.leadTimeWeeks ?? 4;
  const leadTimeRisk = Math.min((leadTime / 12) * 30, 30);
  riskScore += leadTimeRisk;

  if (leadTime > 8) {
    recommendations.push(`Long lead time (${leadTime}w) - order early`);
  }

  // Factor 3: Certifications (15% weight)
  // Fewer certifications = higher risk
  const certCount = supplier.certifications?.length || 0;
  const certRisk = certCount < 2 ? 15 : certCount < 3 ? 10 : 0;
  riskScore += certRisk;

  if (certCount < 2) {
    recommendations.push('Limited certifications - verify quality processes');
  }

  // Factor 4: Status (15% weight)
  if (supplier.status === 'pending_approval') {
    riskScore += 15;
    recommendations.push('Unverified supplier - conduct due diligence');
  } else if (supplier.status === 'suspended' || supplier.status === 'rejected') {
    riskScore += 25;
    recommendations.push('Flagged supplier - investigate issues before ordering');
  }

  // Determine risk level
  let riskLevel: DelayPrediction['riskLevel'];
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'medium';
  else riskLevel = 'low';

  // Estimate delay probability and days
  const delayProbability = Math.min(riskScore, 100);
  const estimatedDelayDays = Math.round((riskScore / 100) * leadTime * 7 * 0.3);

  // Positive recommendations for low-risk suppliers
  if (riskLevel === 'low') {
    recommendations.push('Excellent track record - reliable supplier');
  }

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    riskLevel,
    delayProbability,
    estimatedDelayDays,
    factors: {
      historicalPerformance: rating,
      leadTime: leadTime,
      region: supplier.region,
      certifications: certCount,
    },
    recommendations,
  };
}

/**
 * Analyze all suppliers and return those at risk
 */
export function analyzeSupplierRisks(suppliers: Supplier[]): {
  highRisk: DelayPrediction[];
  mediumRisk: DelayPrediction[];
  lowRisk: DelayPrediction[];
  totalAtRisk: number;
} {
  const predictions = suppliers.map(predictSupplierDelay);

  const highRisk = predictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
  const mediumRisk = predictions.filter(p => p.riskLevel === 'medium');
  const lowRisk = predictions.filter(p => p.riskLevel === 'low');

  return {
    highRisk: highRisk.sort((a, b) => b.delayProbability - a.delayProbability),
    mediumRisk: mediumRisk.sort((a, b) => b.delayProbability - a.delayProbability),
    lowRisk,
    totalAtRisk: highRisk.length + mediumRisk.length,
  };
}

/**
 * Get color for risk level
 */
export function getDelayRiskColor(level: DelayPrediction['riskLevel']): {
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
export function getDelayRiskLabel(level: DelayPrediction['riskLevel']): string {
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

/**
 * Get executive summary of supplier risks
 */
export function getSupplierRiskSummary(analysis: ReturnType<typeof analyzeSupplierRisks>): string {
  if (analysis.highRisk.length > 0) {
    return `${analysis.highRisk.length} high-risk supplier${analysis.highRisk.length !== 1 ? 's' : ''} detected. Review immediately.`;
  } else if (analysis.mediumRisk.length > 0) {
    return `${analysis.mediumRisk.length} supplier${analysis.mediumRisk.length !== 1 ? 's' : ''} showing medium risk. Monitor closely.`;
  } else {
    return 'All suppliers showing low risk. Supply chain healthy.';
  }
}
