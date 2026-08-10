// PoleSafe Mobile — RideCard Component
// Reusable card for displaying ride information in lists and dashboards

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import StatusBadge from './StatusBadge';

/**
 * RideCard — shows a ride summary with status, timing, and driver info
 *
 * Props:
 *   ride      (object)  — ride data object
 *     .childName        — kid's name
 *     .type             — 'morning' | 'afternoon'
 *     .time             — scheduled pickup time (string)
 *     .status           — ride status string
 *     .driverName       — driver's name (optional)
 *     .driverPhone      — driver's phone (optional)
 *     .vehicleType      — vehicle type (optional)
 *     .schoolName       — school name (optional)
 *     .pickupLocation   — pickup address (optional)
 *     .dropoffLocation  — dropoff address (optional)
 *   onPress   (function) — callback when card is tapped
 *   style     (object)   — additional container styles
 */
export default function RideCard({ ride, onPress, style }) {
  if (!ride) return null;

  const {
    childName,
    type,
    time,
    status,
    driverName,
    driverPhone,
    vehicleType,
    schoolName,
    pickupLocation,
    dropoffLocation,
  } = ride;

  const timeLabel = time
    ? new Date(time).toLocaleTimeString('en-UG', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const typeEmoji = type === 'morning' ? '🌅' : '🌇';
  const typeLabel = type === 'morning' ? 'Morning Drop-off' : 'Afternoon Pickup';

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top row: type badge + time */}
      <View style={styles.topRow}>
        <View style={styles.typeTag}>
          <Text style={styles.typeEmoji}>{typeEmoji}</Text>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
        </View>
        <Text style={styles.time}>{timeLabel}</Text>
      </View>

      {/* Kid name */}
      <Text style={styles.kidName}>{childName || 'Unknown Kid'}</Text>

      {/* Details */}
      {schoolName && (
        <Text style={styles.detail}>🏫 {schoolName}</Text>
      )}
      {driverName && (
        <Text style={styles.detail}>👤 {driverName}</Text>
      )}
      {vehicleType && (
        <Text style={styles.detail}>🚗 {vehicleType}</Text>
      )}

      {/* Pickup / Dropoff */}
      {pickupLocation && (
        <Text style={styles.locationText}>📍 Pickup: {pickupLocation}</Text>
      )}
      {dropoffLocation && (
        <Text style={styles.locationText}>🏁 Dropoff: {dropoffLocation}</Text>
      )}

      {/* Driver contact */}
      {driverPhone && (
        <Text style={styles.phoneText}>📞 {driverPhone}</Text>
      )}

      {/* Status badge */}
      <View style={styles.statusRow}>
        <StatusBadge status={status} size="sm" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  typeLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  kidName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    color: '#1565C0',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
});
