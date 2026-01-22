/**
 * Time Utilities
 * Game-like time tracking for company building
 */

/**
 * Get the current week number of the year (1-52)
 */
export const getCurrentWeekOfYear = (): number => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
};

/**
 * Calculate weeks since a given date
 */
export const getWeeksSince = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
};

/**
 * Get formatted week counter info
 */
export const getWeekCounterInfo = (foundedAt?: string) => {
  const currentWeekOfYear = getCurrentWeekOfYear();
  const weeksSinceFounding = foundedAt ? getWeeksSince(foundedAt) : 0;
  const currentYear = new Date().getFullYear();

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
