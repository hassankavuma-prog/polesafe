// PoleSafe Mobile — StatusBadge Component
// Reusable status badge showing emoji + label with contextual colors

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Status configuration map
 */
const STATUS_CONFIG = {
  scheduled:    { emoji: '⏳', color: '#9E9E9E', bg: '#F5F5F5', label: 'Scheduled' },
  en_route:     { emoji: '🚗', color: '#1565C0', bg: '#E3F2FD', label: 'En Route' },
  picked_up:    { emoji: '👧', color: '#E65100', bg: '#FFF3E0', label: 'Picked Up' },
  dropped_off:  { emoji: '📍', color: '#7B1FA2', bg: '#F3E5F5', label: 'Dropped Off' },
  gate_confirmed: { emoji: '✅', color: '#2E7D32', bg: '#E8F5E9', label: 'Gate Confirmed' },
  cancelled:    { emoji: '❌', color: '#C62828', bg: '#FFEBEE', label: 'Cancelled' },
  completed:    { emoji: '✅', color: '#2E7D32', bg: '#E8F5E9', label: 'Completed' },
  sick_day:     { emoji: '🩺', color: '#F9A825', bg: '#FFFDE7', label: 'Sick Day' },
  morning:      { emoji: '🌅', color: '#1565C0', bg: '#E3F2FD', label: 'Morning' },
  afternoon:    { emoji: '🌇', color: '#E65100', bg: '#FFF3E0', label: 'Afternoon' },
  missing:      { emoji: '❓', color: '#C62828', bg: '#FFEBEE', label: 'Missing' },
  received:     { emoji: '✅', color: '#2E7D32', bg: '#E8F5E9', label: 'Received' },
  available:    { emoji: '🟢', color: '#2E7D32', bg: '#E8F5E9', label: 'Available' },
  unavailable:  { emoji: '🔴', color: '#C62828', bg: '#FFEBEE', label: 'Unavailable' },
  arrived:      { emoji: '🏫', color: '#2E7D32', bg: '#E8F5E9', label: 'Arrived' },
};

/**
 * StatusBadge — displays a status with an emoji and label
 *
 * Props:
 *   status (string)  — key into STATUS_CONFIG
 *   size  ('sm'|'md'|'lg') — controls font size and padding (default 'sm')
 *   style (object)   — additional container styles
 */
export default function StatusBadge({ status, size = 'sm', style }) {
  const config = STATUS_CONFIG[status] || {
    emoji: '⏳',
    color: '#9E9E9E',
    bg: '#F5F5F5',
    label: status?.replace('_', ' ') || 'Unknown',
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingHorizontal: isSmall ? 8 : isLarge ? 16 : 12,
          paddingVertical: isSmall ? 4 : isLarge ? 8 : 6,
        },
        style,
      ]}
    >
      <Text style={[styles.emoji, { fontSize: isSmall ? 12 : isLarge ? 18 : 14 }]}>
        {config.emoji}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: isSmall ? 11 : isLarge ? 15 : 13,
          },
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
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
