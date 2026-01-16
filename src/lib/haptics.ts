import * as Haptics from 'expo-haptics';

export const lightImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const mediumImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export const heavyImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

export const successNotification = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const warningNotification = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

export const errorNotification = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

export const selectionAsync = () => {
  Haptics.selectionAsync();
};

export const haptics = {
  light: lightImpact,
  medium: mediumImpact,
  heavy: heavyImpact,
  success: successNotification,
  warning: warningNotification,
  error: errorNotification,
  selection: selectionAsync,
};

export function useHaptics() {
  return haptics;
}
