/**
 * Time Utilities
 * Game-like time tracking for company building
 *
 * MIGRATED to use canonical time periods (src/lib/time/periods.ts)
 */

import { getWeekNumber, getWeekYear, getWeeksBetween, parseISOSafe, nowInTz } from '@/lib/time/periods';

/**
 * Get the current ISO week number of the year (1-53)
 * Uses ISO 8601 definition (week 1 = first week with Thursday)
 */
export const getCurrentWeekOfYear = (): number => {
  return getWeekNumber(nowInTz());
};

/**
 * Calculate weeks since a given date (DST-safe)
 */
export const getWeeksSince = (startDate: string): number => {
  const start = parseISOSafe(startDate);
  const now = nowInTz();
  return getWeeksBetween(start, now);
};

/**
 * Get formatted week counter info
 */
export const getWeekCounterInfo = (foundedAt?: string) => {
  const now = nowInTz();
  const currentWeekOfYear = getWeekNumber(now);
  const weeksSinceFounding = foundedAt ? getWeeksSince(foundedAt) : 0;
  const currentYear = getWeekYear(now);

  return {
    currentWeekOfYear,
    weeksSinceFounding,
    currentYear,
    displayText: `Week ${currentWeekOfYear} of ${currentYear}`,
    foundingText: weeksSinceFounding > 0
      ? `Week ${weeksSinceFounding} since founding`
      : 'Just founded',
  };
};
