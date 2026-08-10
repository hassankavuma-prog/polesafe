// PoleSafe Mobile — QuickActions Component
// Horizontal scrollable row of quick action buttons

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

/**
 * QuickActions — renders a horizontal row of action buttons
 *
 * Props:
 *   actions  (array) — array of action objects:
 *     .label    (string)  — button label
 *     .emoji    (string)  — emoji icon
 *     .onPress  (function) — callback when tapped
 *     .color    (string)  — optional background color override (default #2E7D32)
 *   style    (object) — additional container styles
 */
export default function QuickActions({ actions = [], style }) {
  if (!actions || actions.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.button,
              { backgroundColor: action.color || '#2E7D32' },
            ]}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{action.emoji}</Text>
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  emoji: {
    fontSize: 18,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
