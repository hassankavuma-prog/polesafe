// PoleSafe Mobile — KidAvatar Component
// Circular avatar showing the initial letter with a random background color

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Deterministic color palette based on the name's first character
 * to maintain consistent color per child.
 */
const AVATAR_COLORS = [
  '#2E7D32', '#1565C0', '#E65100', '#6A1B9A', '#C62828',
  '#FF8F00', '#00838F', '#4E342E', '#37474F', '#AD1457',
  '#00695C', '#283593', '#B71C1C', '#4A148C', '#0D47A1',
  '#33691E', '#880E4F', '#3E2723', '#01579B', '#1B5E20',
];

/**
 * Derive a consistent color index from a string.
 */
function getColorIndex(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

/**
 * KidAvatar — displays a circle with the first letter of the kid's name
 *
 * Props:
 *   name  (string)  — kid's full name
 *   size  (number)  — avatar diameter (default 40)
 *   style (object)  — additional container styles
 */
export default function KidAvatar({ name, size = 40, style }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const backgroundColor = AVATAR_COLORS[getColorIndex(name)];
  const fontSize = size * 0.42;

  return (
    <View style={style}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
          },
        ]}
      >
        <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
      </View>
      {name ? <Text style={[styles.name, { maxWidth: size + 20 }]}>{name}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
  },
  name: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
});
