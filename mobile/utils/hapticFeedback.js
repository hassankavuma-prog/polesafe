// Haptic Feedback Utility for PoleSafe
// Provides consistent haptic feedback across the app
// Using expo-haptics for instant touch response (Uber-level feel)

import * as Haptics from 'expo-haptics';

export const HapticFeedback = {
  // Light tap — buttons, cards, toggles
  light: () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
  },

  // Medium tap — important actions, submit buttons
  medium: () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
  },

  // Heavy tap — destructive/irreversible actions
  heavy: () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
  },

  // Success — ride booked, form submitted
  success: () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
  },

  // Warning — something needs attention
  warning: () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (e) {}
  },

  // Error — operation failed
  error: () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (e) {}
  },

  // Selection — picker, scroll item selection
  selection: () => {
    try { Haptics.selectionAsync(); } catch (e) {}
  },
};

export default HapticFeedback;
