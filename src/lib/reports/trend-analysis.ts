// Trend Analysis Engine - McKinsey-grade insights
// Provides period-over-period comparison with context and interpretation

export interface TrendData {
  current: number;
  previous: number | null;
  change: number; // percentage change
  changeDirection: 'up' | 'down' | 'flat';
  changeLabel: string; // "↑ +15%", "↓ -8%", "→ 0%"
  interpretation: string; // "This is good/bad because..."
  context: string; // "Typical range is X-Y"
  isSignificant: boolean; // > 15% change
  severity: 'positive' | 'negative' | 'neutral';
}

export interface BenchmarkRange {
  min: number;
  target: number;
  max: number;
  unit: string;
}

// Industry benchmarks for hardware startups
export const BENCHMARKS: Record<string, BenchmarkRange> = {
  completionRate: { min: 60, target: 75, max: 90, unit: '%' },
  utilization: { min: 65, target: 78, max: 90, unit: '%' },
  okrProgress: { min: 60, target: 80, max: 100, unit: '%' },
  runway: { min: 6, target: 12, max: 24, unit: 'months' },
  burnRate: { min: 30, target: 50, max: 80, unit: 'k/mo' },
  grossMargin: { min: 40, target: 60, max: 80, unit: '%' },
  teamGrowth: { min: 0, target: 15, max: 30, unit: '%' },
  revenueGrowth: { min: 10, target: 25, max: 50, unit: '% MoM' },
};

export function analyzeTrend(
  metric: string,
  current: number,
  previous: number | null,
  higherIsBetter: boolean = true
): TrendData {
  // Handle no previous data
  if (previous === null || previous === 0) {
    return {
      current,
      previous: null,
      change: 0,
      changeDirection: 'flat',
      changeLabel: '→ New',
      interpretation: 'First measurement - no trend available',
      context: getBenchmarkContext(metric, current),
      isSignificant: false,
      severity: 'neutral',
    };
  }

  // Calculate change
  const change = ((current - previous) / previous) * 100;
  const changeRounded = Math.round(change * 10) / 10; // 1 decimal place

  // Determine direction
  let changeDirection: 'up' | 'down' | 'flat' = 'flat';
  if (Math.abs(change) < 2) {
    changeDirection = 'flat';
  } else if (change > 0) {
    changeDirection = 'up';
  } else {
    changeDirection = 'down';
  }

  // Format label
  const arrow = changeDirection === 'up' ? '↑' : changeDirection === 'down' ? '↓' : '→';
  const sign = change > 0 ? '+' : '';
  const changeLabel = `${arrow} ${sign}${changeRounded}%`;

  // Determine if significant (> 15% change)
  const isSignificant = Math.abs(change) > 15;

  // Determine severity based on direction and whether higher is better
  let severity: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (changeDirection !== 'flat') {
    const isImproving = (changeDirection === 'up' && higherIsBetter) || (changeDirection === 'down' && !higherIsBetter);
    severity = isImproving ? 'positive' : 'negative';
  }

  // Generate interpretation
  const interpretation = generateInterpretation(metric, change, severity, higherIsBetter);

  // Get benchmark context
  const context = getBenchmarkContext(metric, current);

  return {
    current,
    previous,
    change: changeRounded,
    changeDirection,
    changeLabel,
    interpretation,
    context,
    isSignificant,
    severity,
  };
}

function generateInterpretation(
  metric: string,
  change: number,
  severity: 'positive' | 'negative' | 'neutral',
  higherIsBetter: boolean
): string {
  const absChange = Math.abs(change);
  const magnitude = absChange > 30 ? 'significantly' : absChange > 15 ? 'notably' : 'slightly';

  if (severity === 'neutral') {
    return 'Stable performance - maintaining consistency';
  }

  // Metric-specific interpretations
  const interpretations: Record<string, { positive: string; negative: string }> = {
    completionRate: {
      positive: `Team execution ${magnitude} improved - building momentum`,
      negative: `Completion rate declining - may indicate capacity issues or scope creep`,
    },
    utilization: {
      positive: `Team capacity ${magnitude} better utilized - good workload balance`,
      negative: `Utilization dropping - could indicate insufficient work pipeline or blockers`,
    },
    okrProgress: {
      positive: `Strategic objectives accelerating - on track for quarterly goals`,
      negative: `OKR progress slowing - may need resource reallocation or target adjustment`,
    },
    runway: {
      positive: `Cash position strengthening - provides more runway for product-market fit`,
      negative: `Runway decreasing - action required to extend cash reserves`,
    },
    burnRate: {
      positive: higherIsBetter
        ? `Spending increasing to fuel growth - monitor efficiency`
        : `Burn rate decreasing - improving capital efficiency`,
      negative: higherIsBetter
        ? `Burn reduction may slow growth`
        : `Burn increasing faster than plan - cost control needed`,
    },
    revenue: {
      positive: `Revenue growth accelerating - strong market traction`,
      negative: `Revenue growth slowing - review sales strategy and pipeline`,
    },
    teamSize: {
      positive: `Team expanding to meet demand - ensure quality of hires`,
      negative: `Team contracting - may limit execution capacity`,
    },
  };

  const metricKey = metric as keyof typeof interpretations;
  if (interpretations[metricKey]) {
    return interpretations[metricKey][severity];
  }

  // Generic interpretation
  if (severity === 'positive') {
    return `Performance ${magnitude} improving - positive trend`;
  } else {
    return `Performance ${magnitude} declining - attention needed`;
  }
}

function getBenchmarkContext(metric: string, current: number): string {
  const benchmark = BENCHMARKS[metric];
  if (!benchmark) {
    return 'No industry benchmark available';
  }

  // Determine where current falls in range
  if (current >= benchmark.target) {
    if (current >= benchmark.max) {
      return `Excellent (above ${benchmark.max}${benchmark.unit} target)`;
    }
    return `Strong (target: ${benchmark.target}${benchmark.unit})`;
  } else if (current >= benchmark.min) {
    return `Acceptable (range: ${benchmark.min}-${benchmark.target}${benchmark.unit})`;
  } else {
    return `Below target (minimum: ${benchmark.min}${benchmark.unit})`;
  }
}

// Helper to analyze multiple trends at once
export function analyzeTrends(
  metrics: Array<{
    key: string;
    label: string;
    current: number;
    previous: number | null;
    higherIsBetter?: boolean;
  }>
): Record<string, TrendData> {
  const results: Record<string, TrendData> = {};

  for (const metric of metrics) {
    results[metric.key] = analyzeTrend(
      metric.key,
      metric.current,
      metric.previous,
      metric.higherIsBetter ?? true
    );
  }

  return results;
}

// Helper to identify significant changes requiring attention
export function getSignificantChanges(trends: Record<string, TrendData>): Array<{
  metric: string;
  trend: TrendData;
}> {
  return Object.entries(trends)
    .filter(([_, trend]) => trend.isSignificant)
    .map(([metric, trend]) => ({ metric, trend }))
    .sort((a, b) => Math.abs(b.trend.change) - Math.abs(a.trend.change));
}

// Helper to format trend for display
export function formatTrendDisplay(trend: TrendData, metricLabel: string): string {
  const arrow = trend.changeDirection === 'up' ? '↑' : trend.changeDirection === 'down' ? '↓' : '→';
  const color = trend.severity === 'positive' ? '🟢' : trend.severity === 'negative' ? '🔴' : '⚪';

  return `${color} ${metricLabel}: ${trend.current} ${arrow} ${Math.abs(trend.change)}% | ${trend.interpretation}`;
}
