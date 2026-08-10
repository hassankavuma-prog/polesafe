// PoleSafe GlassCard — Dual Theme (light/dark)
// Frosted glass effect with theme-aware background and border

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, getTheme, BORDER_RADIUS, SPACING } from '../theme';

export default function GlassCard({
  style,
  children,
  elevated = false,
  blur = true,
  theme: forcedTheme,
  padding = SPACING.md,
}) {
  const theme = forcedTheme || getTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          shadowOpacity: elevated ? 0.5 : 0.3,
          padding,
        },
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  elevated: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 32,
    elevation: 12,
  },
});
