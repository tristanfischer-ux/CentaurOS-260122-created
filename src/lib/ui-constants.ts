/**
 * Shared UI Constants for Centaur OS
 * Quick reference for consistent styling across the app
 */

// Card styles - Use everywhere for consistency
export const CARD_STYLES = "bg-slate-900 rounded-2xl p-4 border border-slate-800";
export const CARD_INTERACTIVE = "bg-slate-900 rounded-2xl p-4 border border-slate-800 active:opacity-70";

// Button styles
export const BUTTON_PRIMARY = "bg-blue-500 rounded-xl py-4 px-6 active:opacity-70";
export const BUTTON_SECONDARY = "bg-slate-800 rounded-xl py-3 px-6 border border-slate-700 active:opacity-70";
export const BUTTON_DESTRUCTIVE = "bg-red-500/10 border border-red-500/30 rounded-xl py-3 px-6 active:opacity-70";

// Modal styles
export const MODAL_OVERLAY = "flex-1 bg-black/70";
export const MODAL_CONTAINER = "bg-slate-900 rounded-t-3xl";
export const MODAL_MAX_HEIGHT = { maxHeight: '90%' };
export const MODAL_ANIMATION = 'slide' as const;

// Interactive feedback
export const ACTIVE_OPACITY = "active:opacity-70";

// Empty state
export const EMPTY_STATE_CONTAINER = "bg-slate-900 rounded-2xl p-8 border border-slate-800 items-center";
export const EMPTY_STATE_ICON_SIZE = 64;
export const EMPTY_STATE_ICON_COLOR = "#64748b";

// Gap between cards
export const CARD_GAP = "gap-3";
