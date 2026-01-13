/**
 * Haptics Service
 * Provides haptic feedback across the app for enhanced UX
 * Following iOS Human Interface Guidelines for haptic patterns
 */

import * as Haptics from 'expo-haptics';

/**
 * Light impact - for button taps, selections
 * Use for: Toggle switches, radio buttons, checkboxes, tab selection
 */
export const lightImpact = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Haptics might not be available on all devices
    console.error('Haptic feedback error:', error);
  }
};

/**
 * Medium impact - for confirmations, state changes
 * Use for: Completing tasks, submitting forms, saving changes
 */
export const mediumImpact = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
};

/**
 * Heavy impact - for critical actions, dramatic moments
 * Use for: Deleting items, errors, major confirmations
 */
export const heavyImpact = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
};

/**
 * Success notification - for positive outcomes
 * Use for: Task completion, successful submission, achievement unlocked
 */
export const successNotification = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
};

/**
 * Warning notification - for caution states
 * Use for: Warning dialogs, undo actions, reversible mistakes
 */
export const warningNotification = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
};

/**
 * Error notification - for failures and errors
 * Use for: Form validation errors, network failures, operation failures
 */
export const errorNotification = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
};

/**
 * Selection change - for picker/selector changes
 * Use for: Scrolling through pickers, changing selections in lists
 */
export const selectionChange = async () => {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
};

/**
 * Haptic patterns for specific interactions
 */
export const HapticPatterns = {
  // UI Interactions
  buttonPress: lightImpact,
  tabSwitch: lightImpact,
  toggle: mediumImpact,
  modalOpen: lightImpact,
  modalClose: lightImpact,

  // Actions
  taskComplete: successNotification,
  formSubmit: mediumImpact,
  save: mediumImpact,
  delete: heavyImpact,

  // Feedback
  success: successNotification,
  warning: warningNotification,
  error: errorNotification,

  // Selections
  listItemSelect: lightImpact,
  pickerChange: selectionChange,
  cardSelect: lightImpact,

  // Gestures
  pullToRefresh: mediumImpact,
  swipeAction: lightImpact,
  longPress: mediumImpact,
};

export default HapticPatterns;
