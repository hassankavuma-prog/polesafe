// PoleSafe PrimaryButton — Dual Theme (light/dark)
// Electric accent green in light mode, cyan glow in dark mode

import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, View, ActivityIndicator,
} from 'react-native';
import { COLORS, getTheme, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../theme';

export default function PrimaryButton({
  title,
  icon,
  onPress,
  style,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  theme: forcedTheme,
}) {
  const theme = forcedTheme || getTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: COLORS.green,
          borderColor: COLORS.green,
          shadowColor: COLORS.green,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.border,
          shadowColor: 'transparent',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          shadowColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: COLORS.red,
          borderColor: COLORS.red,
          shadowColor: COLORS.red,
        };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'danger') return '#FFFFFF';
    if (variant === 'ghost') return theme.textSecondary;
    return theme.textPrimary;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        {
          opacity: disabled ? 0.5 : 1,
          shadowOpacity: variant === 'primary' ? 0.3 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.text, { color: getTextColor() }]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrap: { marginRight: 8 },
  text: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
});
