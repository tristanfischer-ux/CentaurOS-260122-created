/**
 * Time Periods - Canonical Time Semantics
 *
 * Single source of truth for all time period calculations.
 * - Timezone: Europe/London (GMT/BST with DST)
 * - Week definition: ISO week (Monday 00:00 local time)
 * - All DST-safe using date-fns
 *
 * CRITICAL: Always use these functions instead of raw Date arithmetic.
 */

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  parseISO,
  formatISO,
  getISOWeek,
  getYear,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  isAfter,
  isBefore,
  isSameDay,
  isSameWeek,
  isSameMonth,
  format,
} from 'date-fns';

/**
 * Canonical timezone for the application
 * Note: date-fns v4 works in local timezone, but we document our intent
 */
export const CANONICAL_TIMEZONE = 'Europe/London';

/**
 * Week starts on Monday (ISO 8601)
 */
export const WEEK_STARTS_ON = 1 as const; // 0 = Sunday, 1 = Monday

/**
 * Average weeks per month (for conversion)
 * 365.25 days/year ÷ 12 months ÷ 7 days/week = 4.345 weeks/month
 */
export const WEEKS_PER_MONTH = 4.345;

/**
 * Get current date/time in canonical timezone
 * Note: date-fns v4 uses local timezone; ensure server runs in Europe/London
 */
export function nowInTz(): Date {
  return new Date();
}

/**
 * Parse ISO string to Date
 */
export function parseISOSafe(isoString: string): Date {
  return parseISO(isoString);
}

/**
 * Format Date to ISO string
 */
export function toISOString(date: Date): string {
  return formatISO(date);
}

/**
 * Format Date to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return formatISO(date, { representation: 'date' });
}

// ============================================================================
// DAY BOUNDARIES
// ============================================================================

/**
 * Get start of day (00:00:00.000)
 */
export function getStartOfDay(date: Date): Date {
  return startOfDay(date);
}

/**
 * Get end of day (23:59:59.999)
 */
export function getEndOfDay(date: Date): Date {
  return endOfDay(date);
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, nowInTz());
}

// ============================================================================
// WEEK BOUNDARIES (ISO Week - Monday start)
// ============================================================================

/**
 * Get start of ISO week (Monday 00:00:00.000)
 * This is the canonical week boundary function.
 */
export function getStartOfWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
}

/**
 * Get end of ISO week (Sunday 23:59:59.999)
 */
export function getEndOfWeek(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
}

/**
 * Get ISO week number (1-53)
 * Week 1 is the week with the first Thursday of the year
 */
export function getWeekNumber(date: Date): number {
  return getISOWeek(date);
}

/**
 * Get year for ISO week
 * (December can be week 1 of next year, January can be week 52/53 of previous year)
 */
export function getWeekYear(date: Date): number {
  const week = getISOWeek(date);
  const year = getYear(date);
  const month = date.getMonth();

  // If December and week 1, it's next year
  if (month === 11 && week === 1) return year + 1;
  // If January and week 52/53, it's previous year
  if (month === 0 && week >= 52) return year - 1;

  return year;
}

/**
 * Check if date is in current week
 */
export function isThisWeek(date: Date): boolean {
  return isSameWeek(date, nowInTz(), { weekStartsOn: WEEK_STARTS_ON });
}

// ============================================================================
// MONTH BOUNDARIES
// ============================================================================

/**
 * Get start of month (1st, 00:00:00.000)
 */
export function getStartOfMonth(date: Date): Date {
  return startOfMonth(date);
}

/**
 * Get end of month (last day, 23:59:59.999)
 */
export function getEndOfMonth(date: Date): Date {
  return endOfMonth(date);
}

/**
 * Check if date is in current month
 */
export function isThisMonth(date: Date): boolean {
  return isSameMonth(date, nowInTz());
}

// ============================================================================
// YEAR BOUNDARIES
// ============================================================================

/**
 * Get start of year (Jan 1, 00:00:00.000)
 */
export function getStartOfYear(date: Date): Date {
  return startOfYear(date);
}

/**
 * Get end of year (Dec 31, 23:59:59.999)
 */
export function getEndOfYear(date: Date): Date {
  return endOfYear(date);
}

// ============================================================================
// DATE ARITHMETIC (DST-safe)
// ============================================================================

export function addDaysSafe(date: Date, amount: number): Date {
  return addDays(date, amount);
}

export function addWeeksSafe(date: Date, amount: number): Date {
  return addWeeks(date, amount);
}

export function addMonthsSafe(date: Date, amount: number): Date {
  return addMonths(date, amount);
}

export function addYearsSafe(date: Date, amount: number): Date {
  return addYears(date, amount);
}

export function subDaysSafe(date: Date, amount: number): Date {
  return subDays(date, amount);
}

export function subWeeksSafe(date: Date, amount: number): Date {
  return subWeeks(date, amount);
}

export function subMonthsSafe(date: Date, amount: number): Date {
  return subMonths(date, amount);
}

// ============================================================================
// TIME DIFFERENCES (DST-safe)
// ============================================================================

export function getDaysBetween(start: Date, end: Date): number {
  return differenceInDays(end, start);
}

export function getWeeksBetween(start: Date, end: Date): number {
  return differenceInWeeks(end, start);
}

export function getMonthsBetween(start: Date, end: Date): number {
  return differenceInMonths(end, start);
}

export function getYearsBetween(start: Date, end: Date): number {
  return differenceInYears(end, start);
}

// ============================================================================
// COMPARISONS
// ============================================================================

export function isAfterDate(date: Date, dateToCompare: Date): boolean {
  return isAfter(date, dateToCompare);
}

export function isBeforeDate(date: Date, dateToCompare: Date): boolean {
  return isBefore(date, dateToCompare);
}

export function isSameDayAs(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

// ============================================================================
// COMMON PERIODS
// ============================================================================

/**
 * Get "today" period (start and end of current day)
 */
export function getToday(): { start: Date; end: Date } {
  const now = nowInTz();
  return {
    start: getStartOfDay(now),
    end: getEndOfDay(now),
  };
}

/**
 * Get "this week" period (Monday to Sunday)
 */
export function getThisWeek(): { start: Date; end: Date } {
  const now = nowInTz();
  return {
    start: getStartOfWeek(now),
    end: getEndOfWeek(now),
  };
}

/**
 * Get "this month" period
 */
export function getThisMonth(): { start: Date; end: Date } {
  const now = nowInTz();
  return {
    start: getStartOfMonth(now),
    end: getEndOfMonth(now),
  };
}

/**
 * Get "this year" period
 */
export function getThisYear(): { start: Date; end: Date } {
  const now = nowInTz();
  return {
    start: getStartOfYear(now),
    end: getEndOfYear(now),
  };
}

/**
 * Get "last N days" period (inclusive of today)
 */
export function getLastNDays(n: number): { start: Date; end: Date } {
  const now = nowInTz();
  return {
    start: getStartOfDay(subDaysSafe(now, n - 1)),
    end: getEndOfDay(now),
  };
}

/**
 * Get "last N weeks" period (inclusive of current week)
 */
export function getLastNWeeks(n: number): { start: Date; end: Date } {
  const now = nowInTz();
  return {
    start: getStartOfWeek(subWeeksSafe(now, n - 1)),
    end: getEndOfWeek(now),
  };
}

/**
 * Get "last N months" period (inclusive of current month)
 */
export function getLastNMonths(n: number): { start: Date; end: Date } {
  const now = nowInTz();
  return {
    start: getStartOfMonth(subMonthsSafe(now, n - 1)),
    end: getEndOfMonth(now),
  };
}

/**
 * Get "next N weeks" period (exclusive of current week)
 */
export function getNextNWeeks(n: number): { start: Date; end: Date } {
  const now = nowInTz();
  return {
    start: getStartOfWeek(addWeeksSafe(now, 1)),
    end: getEndOfWeek(addWeeksSafe(now, n)),
  };
}

// ============================================================================
// FORMATTING
// ============================================================================

export function formatDate(date: Date, formatString: string = 'yyyy-MM-dd'): string {
  return format(date, formatString);
}

export function formatWeekLabel(date: Date): string {
  const week = getWeekNumber(date);
  const year = getWeekYear(date);
  return `Week ${week}, ${year}`;
}

export function formatMonthLabel(date: Date): string {
  return format(date, 'MMMM yyyy');
}

// ============================================================================
// NATURAL LANGUAGE PARSING (Limited)
// ============================================================================

/**
 * Parse simple natural date tokens
 * Only handles common, unambiguous cases
 */
export function parseNaturalDate(token: string): Date | null {
  const now = nowInTz();
  const lower = token.toLowerCase().trim();

  switch (lower) {
    case 'today':
      return now;
    case 'tomorrow':
      return addDaysSafe(now, 1);
    case 'yesterday':
      return subDaysSafe(now, 1);
    case 'this week':
    case 'this monday':
      return getStartOfWeek(now);
    case 'next week':
    case 'next monday':
      return getStartOfWeek(addWeeksSafe(now, 1));
    case 'this month':
      return getStartOfMonth(now);
    case 'next month':
      return getStartOfMonth(addMonthsSafe(now, 1));
    default:
      return null;
  }
}

/**
 * Parse "next {weekday}" (e.g., "next Friday")
 * Returns the next occurrence of that weekday
 */
export function parseNextWeekday(weekday: string): Date | null {
  const now = nowInTz();
  const lower = weekday.toLowerCase();

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = weekdays.indexOf(lower);

  if (targetDay === -1) return null;

  const currentDay = now.getDay();
  let daysToAdd = targetDay - currentDay;

  // If target day has passed this week, go to next week
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  return addDaysSafe(now, daysToAdd);
}
