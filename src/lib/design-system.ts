/**
 * Centaur OS Design System
 * Apple Human Interface Guidelines compliant design tokens
 */

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  // Screen padding
  screen: {
    horizontal: 'px-6',
    vertical: 'py-6',
    top: 'pt-6',
    bottom: 'pb-6',
  },

  // Card spacing
  card: {
    padding: 'p-4',
    paddingLarge: 'p-6',
    gap: 'gap-3',
  },

  // Section spacing
  section: {
    marginBottom: 'mb-6',
    gap: 'gap-6',
  },

  // Element spacing
  element: {
    tightGap: 'gap-2',
    normalGap: 'gap-3',
    looseGap: 'gap-4',
  },
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const radius = {
  small: 'rounded-lg',      // 8px - chips, tags
  medium: 'rounded-xl',     // 12px - buttons, inputs
  large: 'rounded-2xl',     // 16px - cards
  xlarge: 'rounded-3xl',    // 24px - modals, major containers
  full: 'rounded-full',     // badges, avatars
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Headers
  display: 'text-4xl font-bold',           // Hero sections
  h1: 'text-2xl font-bold',                // Screen titles
  h2: 'text-xl font-bold',                 // Section titles
  h3: 'text-lg font-semibold',             // Subsection titles
  h4: 'text-base font-semibold',           // Card titles

  // Body
  body: 'text-sm',                         // Regular text
  bodyMedium: 'text-sm font-medium',       // Emphasized text
  bodySemibold: 'text-sm font-semibold',   // Strong emphasis

  // Small text
  caption: 'text-xs',                      // Metadata, timestamps
  captionMedium: 'text-xs font-medium',    // Emphasized metadata
  captionSemibold: 'text-xs font-semibold', // Labels

  // Buttons
  button: 'text-base font-semibold',       // Button text
  buttonSmall: 'text-sm font-semibold',    // Small button text
};

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Primary actions
  primary: 'bg-blue-500',
  primaryHover: 'bg-blue-600',
  primaryText: 'text-blue-500',
  primaryLight: 'bg-blue-500/10',
  primaryBorder: 'border-blue-500',

  // Secondary actions
  secondary: 'bg-slate-800',
  secondaryBorder: 'border-slate-700',
  secondaryText: 'text-slate-400',

  // Success
  success: 'bg-emerald-500',
  successText: 'text-emerald-400',
  successLight: 'bg-emerald-500/10',
  successBorder: 'border-emerald-500/30',

  // Warning
  warning: 'bg-amber-500',
  warningText: 'text-amber-400',
  warningLight: 'bg-amber-500/10',
  warningBorder: 'border-amber-500/30',

  // Error/Destructive
  error: 'bg-red-500',
  errorText: 'text-red-400',
  errorLight: 'bg-red-500/10',
  errorBorder: 'border-red-500/30',

  // Background
  background: 'bg-slate-950',
  backgroundSecondary: 'bg-slate-900',
  backgroundTertiary: 'bg-slate-800',

  // Text
  text: 'text-white',
  textSecondary: 'text-slate-400',
  textTertiary: 'text-slate-500',
  textQuaternary: 'text-slate-600',

  // Borders
  border: 'border-slate-800',
  borderLight: 'border-slate-700',
  borderStrong: 'border-slate-600',
};

// ============================================================================
// STATUS COLORS
// ============================================================================

export const statusColors = {
  // Task status
  todo: {
    bg: 'bg-slate-500',
    text: 'text-slate-400',
    light: 'bg-slate-500/10',
    border: 'border-slate-500/30',
  },
  in_progress: {
    bg: 'bg-blue-500',
    text: 'text-blue-400',
    light: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  in_review: {
    bg: 'bg-amber-500',
    text: 'text-amber-400',
    light: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  done: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-400',
    light: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },

  // Priority
  urgent: {
    bg: 'bg-red-500',
    text: 'text-red-400',
    light: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  high: {
    bg: 'bg-orange-500',
    text: 'text-orange-400',
    light: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  medium: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-400',
    light: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  low: {
    bg: 'bg-blue-500',
    text: 'text-blue-400',
    light: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },

  // Health status
  on_track: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-400',
    light: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  at_risk: {
    bg: 'bg-amber-500',
    text: 'text-amber-400',
    light: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  off_track: {
    bg: 'bg-red-500',
    text: 'text-red-400',
    light: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
};

// ============================================================================
// BUTTON STYLES
// ============================================================================

export const buttons = {
  // Primary button (main actions)
  primary: `bg-blue-500 ${radius.medium} py-4 px-6 active:opacity-70`,
  primarySmall: `bg-blue-500 ${radius.medium} py-3 px-4 active:opacity-70`,

  // Secondary button (alternative actions)
  secondary: `bg-slate-800 ${radius.medium} py-3 px-6 border border-slate-700 active:opacity-70`,
  secondarySmall: `bg-slate-800 ${radius.medium} py-2 px-4 border border-slate-700 active:opacity-70`,

  // Destructive button (dangerous actions)
  destructive: `bg-red-500/10 border border-red-500/30 ${radius.medium} py-3 px-6 active:opacity-70`,
  destructiveSmall: `bg-red-500/10 border border-red-500/30 ${radius.medium} py-2 px-4 active:opacity-70`,

  // Success button
  success: `bg-emerald-500 ${radius.medium} py-4 px-6 active:opacity-70`,
  successSmall: `bg-emerald-500 ${radius.medium} py-3 px-4 active:opacity-70`,

  // Ghost button (text only)
  ghost: `${radius.medium} py-2 px-4 active:opacity-70`,

  // Icon button
  icon: `${radius.medium} p-2 active:opacity-70`,
  iconLarge: `${radius.medium} p-3 active:opacity-70`,
};

// ============================================================================
// CARD STYLES
// ============================================================================

export const cards = {
  // Standard card
  base: `bg-slate-900 ${radius.large} p-4 border border-slate-800`,
  interactive: `bg-slate-900 ${radius.large} p-4 border border-slate-800 active:opacity-70`,

  // Card variants
  elevated: `bg-slate-900 ${radius.large} p-4 border border-slate-700`,
  flat: `bg-slate-900 ${radius.large} p-4`,

  // Card sizes
  compact: `bg-slate-900 ${radius.large} p-3 border border-slate-800`,
  comfortable: `bg-slate-900 ${radius.large} p-5 border border-slate-800`,
  spacious: `bg-slate-900 ${radius.large} p-6 border border-slate-800`,
};

// ============================================================================
// MODAL STYLES
// ============================================================================

export const modals = {
  // Modal containers
  overlay: 'flex-1 bg-black/70',
  overlayLight: 'flex-1 bg-black/50',
  overlayDark: 'flex-1 bg-black/90',

  // Modal content
  container: `bg-slate-900 ${radius.xlarge}`,
  containerBottom: `bg-slate-900 rounded-t-3xl`,

  // Modal sizes
  maxHeightSmall: { maxHeight: '70%' },
  maxHeightMedium: { maxHeight: '80%' },
  maxHeightLarge: { maxHeight: '90%' },
  maxHeightFull: { maxHeight: '95%' },

  // Animation types
  animationSlide: 'slide' as const,
  animationFade: 'fade' as const,
};

// ============================================================================
// INTERACTIVE FEEDBACK
// ============================================================================

export const interactive = {
  // Opacity states
  activeOpacity: 'active:opacity-70',
  hoverOpacity: 'hover:opacity-80',
  disabledOpacity: 'opacity-50',

  // Transition classes
  transition: 'transition-all duration-200',
  transitionFast: 'transition-all duration-150',
  transitionSlow: 'transition-all duration-300',
};

// ============================================================================
// EMPTY STATES
// ============================================================================

export const emptyState = {
  container: `bg-slate-900 ${radius.large} p-8 border border-slate-800 items-center`,
  icon: {
    size: 64,
    color: '#64748b',
  },
  title: `${typography.h2} mt-4 mb-2 text-center`,
  description: `${typography.body} text-slate-400 text-center`,
  action: `mt-6`,
};

// ============================================================================
// LOADING STATES
// ============================================================================

export const loading = {
  container: 'flex-1 bg-slate-950 items-center justify-center',
  spinnerColor: '#3b82f6',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Combine design system classes with custom classes
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get status color set
 */
export function getStatusColors(status: keyof typeof statusColors) {
  return statusColors[status] || statusColors.todo;
}

/**
 * Get button style
 */
export function getButtonStyle(variant: keyof typeof buttons, size: 'default' | 'small' = 'default') {
  if (size === 'small' && `${variant}Small` in buttons) {
    return buttons[`${variant}Small` as keyof typeof buttons];
  }
  return buttons[variant];
}

/**
 * Get card style
 */
export function getCardStyle(variant: keyof typeof cards = 'base') {
  return cards[variant];
}
