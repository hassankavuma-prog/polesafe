// PoleSafe Mobile — School Detention / Late Pickup Screen
// Manage late pickups, detention, sports, and extra lessons

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
const ORANGE = COLORS.orange;

const PICKUP_REASONS = [
  { key: 'detention', emoji: '⏰', label: 'Detention', desc: 'Student in detention' },
  { key: 'sports', emoji: '⚽', label: 'Sports Practice', desc: 'After-school sports' },
  { key: 'extra_lesson', emoji: '📚', label: 'Extra Lesson', desc: 'Tutoring / extra class' },
  { key: 'other', emoji: '📝', label: 'Other', desc: 'Specify reason' },
];

export default function SchoolDetention({ navigation }) {
  const theme = getTheme();
  const [kids, setKids] = useState([]);
  const [selectedKid, setSelectedKid] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [pickupHour, setPickupHour] = useState(17);
  const [pickupMinute, setPickupMinute] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadKids();
  }, []);

  const loadKids = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/kids`, { headers });
      if (res.ok) {
        const data = await res.json();
        setKids(data.kids || []);
      }
    } catch (err) {
      console.log('Error loading kids:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedKid) {
      Alert.alert('Select a Kid', 'Please select a student first.');
      return;
    }
    if (!selectedReason) {
      Alert.alert('Select Reason', 'Please choose a reason for the late pickup.');
      return;
    }

    const pickupTime = `${String(pickupHour).padStart(2, '0')}:${String(pickupMinute).padStart(2, '0')}`;
    const kidName = kids.find(k => k._id === selectedKid)?.name || 'Student';

    Alert.alert(
      'Confirm Late Pickup',
      `${kidName} — ${pickupTime}\nReason: ${selectedReason.replace('_', ' ')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setSubmitting(true);
            try {
              const token = await AsyncStorage.getItem('polesafe_token');
              const schoolId = await AsyncStorage.getItem('polesafe_school_id');

              const res = await fetch(`${API_BASE}/api/schools/${schoolId}/detention`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  schoolId,
                  childId: selectedKid,
                  newPickupTime: `${pickupTime}:00`,
                  reason: selectedReason,
                }),
              });

              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Update failed');
              }

              Alert.alert('Updated ✅', `Pickup time updated to ${pickupTime}. Driver and parent have been notified.`);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const incrementHour = () => setPickupHour(h => Math.min(19, h + 1));
  const decrementHour = () => setPickupHour(h => Math.max(13, h - 1));
  const incrementMinute = () => setPickupMinute(m => m >= 45 ? 0 : m + 15);
  const decrementMinute = () => setPickupMinute(m => m <= 0 ? 45 : m - 15);

  if (loading) {
    return (
      <View style={[styles.centerContainer, {backgroundColor: theme.canvas}]}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  const pickupTimeStr = `${String(pickupHour).padStart(2, '0')}:${String(pickupMinute).padStart(2, '0')}`;
  const isPM = pickupHour >= 12;

  return (
    <ScrollView style={[styles.container, {backgroundColor: theme.canvas}]}>
      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoEmoji}>⏰</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Late Pickup Management</Text>
          <Text style={styles.infoText}>
            Update pickup times for detention, sports, or extra lessons.
            Driver and parent will be notified automatically.
          </Text>
        </View>
      </View>

      {/* Kid Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👦 Select Student</Text>
        {kids.length === 0 ? (
          <Text style={styles.emptyText}>No students registered</Text>
        ) : (
          kids.map((kid) => (
            <TouchableOpacity
              key={kid._id}
              style={[
                styles.kidRow,
                selectedKid === kid._id && styles.kidRowSelected,
              ]}
              onPress={() => setSelectedKid(kid._id)}
            >
              <View style={[
                styles.kidAvatar,
                { backgroundColor: selectedKid === kid._id ? ORANGE : '#ccc' },
              ]}>
                <Text style={styles.kidAvatarText}>
                  {(kid.name || '?').charAt(0)}
                </Text>
              </View>
              <View style={styles.kidInfo}>
                <Text style={styles.kidName}>{kid.name}</Text>
                <Text style={styles.kidClass}>{kid.class || kid.grade || ''}</Text>
              </View>
              {selectedKid === kid._id && (
                <Text style={styles.kidCheck}>✅</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Reason Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Reason for Late Pickup</Text>
        <View style={styles.reasonGrid}>
          {PICKUP_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.key}
              style={[
                styles.reasonBtn,
                selectedReason === reason.key && styles.reasonBtnSelected,
              ]}
              onPress={() => setSelectedReason(reason.key)}
            >
              <Text style={styles.reasonEmoji}>{reason.emoji}</Text>
              <Text style={[
                styles.reasonLabel,
                selectedReason === reason.key && styles.reasonLabelSelected,
              ]}>
                {reason.label}
              </Text>
              <Text style={styles.reasonDesc}>{reason.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pickup Time Override */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🕐 New Pickup Time</Text>
        <View style={styles.timeContainer}>
          {/* Hours */}
          <View style={styles.timeColumn}>
            <TouchableOpacity style={styles.timeArrowBtn} onPress={incrementHour}>
              <Text style={styles.timeArrowText}>▲</Text>
            </TouchableOpacity>
            <View style={styles.timeValueBox}>
              <Text style={styles.timeValue}>
                {String(pickupHour).padStart(2, '0')}
              </Text>
            </View>
            <TouchableOpacity style={styles.timeArrowBtn} onPress={decrementHour}>
              <Text style={styles.timeArrowText}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Separator */}
          <Text style={styles.timeSeparator}>:</Text>

          {/* Minutes */}
          <View style={styles.timeColumn}>
            <TouchableOpacity style={styles.timeArrowBtn} onPress={incrementMinute}>
              <Text style={styles.timeArrowText}>▲</Text>
            </TouchableOpacity>
            <View style={styles.timeValueBox}>
              <Text style={styles.timeValue}>
                {String(pickupMinute).padStart(2, '0')}
              </Text>
            </View>
            <TouchableOpacity style={styles.timeArrowBtn} onPress={decrementMinute}>
              <Text style={styles.timeArrowText}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* AM/PM */}
          <View style={styles.ampmBox}>
            <Text style={styles.ampmText}>{isPM ? 'PM' : 'AM'}</Text>
          </View>
        </View>
      </View>

      {/* Summary */}
      {selectedKid && selectedReason && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Student</Text>
            <Text style={styles.summaryValue}>
              {kids.find(k => k._id === selectedKid)?.name || '—'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Reason</Text>
            <Text style={styles.summaryValue}>{selectedReason.replace('_', ' ')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>New Pickup</Text>
            <Text style={[styles.summaryValue, { color: ORANGE, fontWeight: '700' }]}>
              {pickupTimeStr}
            </Text>
          </View>
          <Text style={styles.summaryNote}>
            🚗 Driver & 📱 Parent will be notified automatically
          </Text>
        </View>
      )}

      {/* Update Button */}
      <TouchableOpacity
        style={[
          styles.updateBtn,
          (!selectedKid || !selectedReason || submitting) && styles.btnDisabled,
        ]}
        onPress={handleUpdate}
        disabled={!selectedKid || !selectedReason || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.updateBtnText}>⏰ Update Pickup Time</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas, padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.canvas },

  // Info
  infoBanner: { flexDirection: 'row', backgroundColor: COLORS.orangeBg, borderRadius: 12, padding: 14, marginBottom: 14 },
  infoEmoji: { fontSize: 28, marginRight: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '600', color: ORANGE, marginBottom: 4 },
  infoText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  // Sections
  section: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },

  // Kid selector
  kidRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 6, backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: '#eee' },
  kidRowSelected: { borderColor: ORANGE, backgroundColor: COLORS.orangeBg },
  kidAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  kidAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  kidInfo: { flex: 1 },
  kidName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  kidClass: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  kidCheck: { fontSize: 18 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

  // Reasons
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonBtn: {
    flex: 1, minWidth: '45%', padding: 14, borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: '#eee',
    alignItems: 'center',
  },
  reasonBtnSelected: { borderColor: ORANGE, backgroundColor: COLORS.orangeBg },
  reasonEmoji: { fontSize: 24, marginBottom: 6 },
  reasonLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  reasonLabelSelected: { color: ORANGE },
  reasonDesc: { fontSize: 11, color: COLORS.textMuted },

  // Time Picker
  timeContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  timeColumn: { alignItems: 'center' },
  timeArrowBtn: { padding: 8 },
  timeArrowText: { fontSize: 16, color: ORANGE, fontWeight: '600' },
  timeValueBox: { backgroundColor: COLORS.orangeBg, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: ORANGE },
  timeValue: { fontSize: 32, fontWeight: '700', color: ORANGE },
  timeSeparator: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 40 },
  ampmBox: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 40 },
  ampmText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },

  // Summary
  summaryCard: { backgroundColor: COLORS.orangeBg, borderRadius: 12, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: ORANGE },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: ORANGE, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  summaryNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, fontStyle: 'italic' },

  // Update
  updateBtn: { backgroundColor: ORANGE, padding: 18, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnDisabled: { opacity: 0.5 },
  updateBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
