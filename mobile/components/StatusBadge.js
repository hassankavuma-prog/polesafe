// PoleSafe Mobile — StatusBadge Component
// WCAG AA compliant — high-contrast color pairs for sunlight readability

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Status configuration map — WCAG AA compliant
 * Light bg + dark text pairs with minimum 4.5:1 contrast ratio
 */
const STATUS_CONFIG = {
  scheduled:    { emoji: '⏳', color: '#374151', bg: '#F3F4F6', label: 'Scheduled' },
  en_route:     { emoji: '🚗', color: '#1E40AF', bg: '#DBEAFE', label: 'En Route' },
  picked_up:    { emoji: '👧', color: '#92400E', bg: '#FFF3CD', label: 'Picked Up' },
  dropped_off:  { emoji: '📍', color: '#6D28D9', bg: '#EDE9FE', label: 'Dropped Off' },
  gate_confirmed: { emoji: '✅', color: '#15803D', bg: '#DCFCE7', label: 'Gate Confirmed' },
  cancelled:    { emoji: '❌', color: '#B91C1C', bg: '#FEE2E2', label: 'Cancelled' },
  completed:    { emoji: '✅', color: '#15803D', bg: '#DCFCE7', label: 'Completed' },
  sick_day:     { emoji: '🩺', color: '#7C3AED', bg: '#F3E8FF', label: 'Sick Day' },
  morning:      { emoji: '🌅', color: '#1E40AF', bg: '#DBEAFE', label: 'Morning' },
  afternoon:    { emoji: '🌇', color: '#92400E', bg: '#FFF3CD', label: 'Afternoon' },
  missing:      { emoji: '❓', color: '#BE123C', bg: '#FFE4E6', label: 'Missing' },
  received:     { emoji: '✅', color: '#15803D', bg: '#DCFCE7', label: 'Received' },
  available:    { emoji: '🟢', color: '#15803D', bg: '#DCFCE7', label: 'Available' },
  unavailable:  { emoji: '🔴', color: '#B91C1C', bg: '#FEE2E2', label: 'Unavailable' },
  arrived:      { emoji: '🏫', color: '#15803D', bg: '#DCFCE7', label: 'Arrived' },
};

/**
 * StatusBadge — WCAG AA compliant status display
 * All color pairs verified for minimum 4.5:1 contrast ratio
 *
 * Props:
 *   status (string)  — key into STATUS_CONFIG
 *   size  ('sm'|'md'|'lg') — controls font size and padding (default 'sm')
 *   style (object)   — additional container styles
 */
export default function StatusBadge({ status, size = 'sm', style }) {
  const config = STATUS_CONFIG[status] || {
    emoji: '⏳',
    color: '#374151',
    bg: '#F3F4F6',
    label: status?.replace('_', ' ') || 'Unknown',
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const fontSize = isSmall ? 12 : isLarge ? 15 : 14;
  const paddingH = isSmall ? 8 : isLarge ? 16 : 12;
  const paddingV = isSmall ? 4 : isLarge ? 8 : 6;
  const emojiSize = isSmall ? 12 : isLarge ? 18 : 14;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, paddingHorizontal: paddingH, paddingVertical: paddingV },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
    >
      <Text style={[styles.emoji, { fontSize: emojiSize }]}>
        {config.emoji}
      </Text>
      <Text
        style={[
          styles.label,
          { color: config.color, fontSize },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  emoji: {
    marginRight: 4,
  },
  label: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
