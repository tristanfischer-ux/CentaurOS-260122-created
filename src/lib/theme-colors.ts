// Theme-aware color utilities
// Provides color classes that respect the off-white theme mode

/**
 * Get background color class based on theme mode
 * @param isOffWhite - Whether off-white mode is active
 * @param isDark - Whether dark mode is active
 * @returns Tailwind className for background
 */
export function getBackgroundColor(isOffWhite: boolean, isDark: boolean): string {
  if (isDark) return 'bg-slate-950';
  if (isOffWhite) return 'bg-stone-50';
  return 'bg-white';
}

/**
 * Get card/surface background color
 */
export function getSurfaceColor(isOffWhite: boolean, isDark: boolean): string {
  if (isDark) return 'bg-slate-900';
  if (isOffWhite) return 'bg-stone-100';
  return 'bg-gray-100';
}

/**
 * Get border color
 */
export function getBorderColor(isOffWhite: boolean, isDark: boolean): string {
  if (isDark) return 'border-slate-800';
  if (isOffWhite) return 'border-stone-200';
  return 'border-gray-300';
}

/**
 * Get text color (primary)
 */
export function getTextColor(isOffWhite: boolean, isDark: boolean): string {
  if (isDark) return 'text-white';
  if (isOffWhite) return 'text-stone-900';
  return 'text-gray-900';
}

/**
 * Get text color (secondary/muted)
 */
export function getTextSecondaryColor(isOffWhite: boolean, isDark: boolean): string {
  if (isDark) return 'text-slate-400';
  if (isOffWhite) return 'text-stone-600';
  return 'text-gray-600';
}

/**
 * Get combined background classes for a container
 * Usage: <View className={getThemeClasses(isOffWhite, theme === 'dark')}>
 */
export function getThemeClasses(isOffWhite: boolean, isDark: boolean): string {
  const bg = getBackgroundColor(isOffWhite, isDark);
  return bg;
}

/**
 * Get combined classes for a card/surface element
 */
export function getCardClasses(isOffWhite: boolean, isDark: boolean): string {
  const surface = getSurfaceColor(isOffWhite, isDark);
  const border = getBorderColor(isOffWhite, isDark);
  return `${surface} ${border}`;
}
