/**
 * Math Utilities - Safe Math Helpers
 *
 * Single source of truth for all mathematical operations.
 * Guards against division by zero, NaN, and common errors.
 */

/**
 * Safely sum an array of numbers
 * Returns 0 for empty array
 */
export function sum(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  return numbers.reduce((acc, n) => acc + (n || 0), 0);
}

/**
 * Safely divide with fallback
 * Guards against division by zero and returns fallback value
 *
 * @param numerator - Number to divide
 * @param denominator - Number to divide by
 * @param fallback - Value to return if denominator is 0 (default: 0)
 * @returns numerator / denominator, or fallback if denominator is 0
 */
export function safeDiv(numerator: number, denominator: number, fallback: number = 0): number {
  if (!denominator || denominator === 0 || !isFinite(denominator)) {
    return fallback;
  }
  if (!isFinite(numerator)) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

/**
 * Calculate percentage with zero-guard
 * Returns 0 if whole is 0
 *
 * @param part - The part value
 * @param whole - The whole value
 * @returns (part / whole) * 100, or 0 if whole is 0
 */
export function percent(part: number, whole: number): number {
  return safeDiv(part, whole, 0) * 100;
}

/**
 * Calculate percentage and format as string with decimals
 */
export function percentFormatted(part: number, whole: number, decimals: number = 1): string {
  const pct = percent(part, whole);
  return `${pct.toFixed(decimals)}%`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round to specified decimal places
 * For display only - store raw values
 */
export function roundTo(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculate average (mean)
 * Returns 0 for empty array
 */
export function average(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  return safeDiv(sum(numbers), numbers.length, 0);
}

/**
 * Calculate median
 * Returns 0 for empty array
 */
export function median(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

/**
 * Calculate rolling average over a window
 * Returns array of same length as input, with NaN for insufficient data points
 *
 * @param values - Array of numbers
 * @param window - Window size for rolling average
 * @returns Array of rolling averages
 */
export function rollingAverage(values: number[], window: number): number[] {
  if (!values || values.length === 0) return [];
  if (window <= 0) return values.map(() => NaN);

  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      // Not enough data points yet
      result.push(NaN);
    } else {
      // Calculate average of last `window` values
      const slice = values.slice(i - window + 1, i + 1);
      result.push(average(slice));
    }
  }

  return result;
}

/**
 * Calculate percentage change
 * Returns 0 if previous is 0
 *
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change (e.g., 0.15 for 15% increase)
 */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return safeDiv(current - previous, previous, 0);
}

/**
 * Calculate percentage change and format as string
 */
export function percentChangeFormatted(current: number, previous: number, decimals: number = 1): string {
  const change = percentChange(current, previous) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}%`;
}

/**
 * Check if number is within tolerance of another
 */
export function isCloseTo(a: number, b: number, tolerance: number = 0.001): boolean {
  return Math.abs(a - b) < tolerance;
}

/**
 * Safe floor division (always returns integer)
 */
export function floorDiv(numerator: number, denominator: number): number {
  return Math.floor(safeDiv(numerator, denominator, 0));
}

/**
 * Safe ceil division (always returns integer)
 */
export function ceilDiv(numerator: number, denominator: number): number {
  return Math.ceil(safeDiv(numerator, denominator, 0));
}

/**
 * Calculate weighted average
 * Returns 0 if weights sum to 0
 *
 * @param values - Array of values
 * @param weights - Array of weights (same length as values)
 * @returns Weighted average
 */
export function weightedAverage(values: number[], weights: number[]): number {
  if (!values || !weights || values.length === 0 || values.length !== weights.length) {
    return 0;
  }

  const weightedSum = values.reduce((acc, val, i) => acc + val * weights[i], 0);
  const totalWeight = sum(weights);

  return safeDiv(weightedSum, totalWeight, 0);
}

/**
 * Calculate compound growth rate
 * Returns 0 if periods is 0
 *
 * @param initial - Initial value
 * @param final - Final value
 * @param periods - Number of periods
 * @returns Compound annual growth rate (CAGR)
 */
export function cagr(initial: number, final: number, periods: number): number {
  if (initial <= 0 || periods <= 0) return 0;
  return Math.pow(final / initial, 1 / periods) - 1;
}

/**
 * Calculate moving sum over a window
 */
export function movingSum(values: number[], window: number): number[] {
  if (!values || values.length === 0) return [];
  if (window <= 0) return values.map(() => 0);

  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      // Not enough data points yet
      result.push(sum(values.slice(0, i + 1)));
    } else {
      // Sum of last `window` values
      const slice = values.slice(i - window + 1, i + 1);
      result.push(sum(slice));
    }
  }

  return result;
}

/**
 * Calculate standard deviation
 * Returns 0 for empty array or single value
 */
export function standardDeviation(numbers: number[]): number {
  if (!numbers || numbers.length <= 1) return 0;

  const avg = average(numbers);
  const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2));
  const variance = average(squaredDiffs);

  return Math.sqrt(variance);
}

/**
 * Calculate min value in array
 * Returns 0 for empty array
 */
export function min(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  return Math.min(...numbers);
}

/**
 * Calculate max value in array
 * Returns 0 for empty array
 */
export function max(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  return Math.max(...numbers);
}

/**
 * Calculate range (max - min)
 */
export function range(numbers: number[]): number {
  return max(numbers) - min(numbers);
}
