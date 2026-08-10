// PoleSafe Mobile — Parent Sick Day Screen
// Report a child as sick and manage sick days

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
const MAX_SICK_DAYS = 3;

export default function ParentSickDay({ navigation, route }) {
  const theme = getTheme();
  const childId = route?.params?.childId;
  const childName = route?.params?.childName || 'your child';

  const [kid, setKid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [sickDays, setSickDays] = useState(1);
  const [sickDaysUsed, setSickDaysUsed] = useState(0);
  const [sickDaysTotal] = useState(3); // Term limit
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadKidData();
  }, []);

  const loadKidData = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (childId) {
        const res = await fetch(`${API_BASE}/api/parents/kids/${childId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setKid(data.kid || data);
          setSickDaysUsed(data.sickDaysUsed || data.sickDaysThisTerm || 0);
        }
      }
    } catch (err) {
      console.log('Error loading kid:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const handleDateChange = (delta) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + delta);
    const minDate = new Date(getMinDate());
    const maxDate = new Date(getMaxDate());
    if (d >= minDate && d <= maxDate) {
      setStartDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!reason.trim()) {
      setError('Please describe the reason for the sick day');
      return;
    }

    if (sickDays > MAX_SICK_DAYS) {
      setError(`Maximum ${MAX_SICK_DAYS} consecutive sick days allowed`);
      return;
    }

    if (sickDaysUsed + sickDays > sickDaysTotal) {
      setError(`You've used ${sickDaysUsed} of ${sickDaysTotal} sick days. ${sickDays} more would exceed your limit.`);
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/parents/sick-day`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: childId || kid?._id,
          startDate,
          days: sickDays,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to report sick day');
      }

      Alert.alert(
        'Reported ✅',
        `${childName} is marked sick from ${startDate} for ${sickDays} day${sickDays > 1 ? 's' : ''}. The school and driver have been notified.`,
        [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-UG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, {backgroundColor: theme.canvas}]}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const daysRemaining = sickDaysTotal - sickDaysUsed;
  const dateLabel = formatDate(startDate);

  return (
    <ScrollView style={[styles.container, {backgroundColor: theme.canvas}]}>
      {/* Kid Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(childName || kid?.name || '?').charAt(0)}
          </Text>
        </View>
        <Text style={styles.profileName}>{childName || kid?.name || 'Unknown'}</Text>
        <Text style={styles.profileClass}>{kid?.class || kid?.grade || ''}</Text>
      </View>

      {/* Sick Days Counter */}
      <View style={styles.counterCard}>
        <Text style={styles.counterTitle}>🩺 Sick Days This Term</Text>
        <View style={styles.counterRow}>
          <View style={styles.counterItem}>
            <Text style={styles.counterNum}>{sickDaysUsed}</Text>
            <Text style={styles.counterLabel}>Used</Text>
          </View>
          <View style={styles.counterItem}>
            <Text style={[styles.counterNum, { color: COLORS.green }]}>{daysRemaining}</Text>
            <Text style={styles.counterLabel}>Remaining</Text>
          </View>
          <View style={styles.counterItem}>
            <Text style={[styles.counterNum, { color: COLORS.textMuted }]}>{sickDaysTotal}</Text>
            <Text style={styles.counterLabel}>Total</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min((sickDaysUsed / 3) * 100, 100)}%` },
              daysRemaining < 1 && { backgroundColor: COLORS.red },
            ]}
          />
        </View>
      </View>

      {/* Date Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Start Date</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateArrow} onPress={() => handleDateChange(-1)}>
            <Text style={styles.dateArrowText}>←</Text>
          </TouchableOpacity>
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>{dateLabel}</Text>
          </View>
          <TouchableOpacity style={styles.dateArrow} onPress={() => handleDateChange(1)}>
            <Text style={styles.dateArrowText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Days Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📆 How Many Days?</Text>
        <View style={styles.daysGrid}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={[
                styles.dayNumBtn,
                sickDays === n && styles.dayNumBtnSelected,
              ]}
              onPress={() => setSickDays(n)}
            >
              <Text
                style={[
                  styles.dayNumText,
                  sickDays === n && styles.dayNumTextSelected,
                ]}
              >
                {n}
              </Text>
              <Text
                style={[
                  styles.dayNumUnit,
                  sickDays === n && styles.dayNumUnitSelected,
                ]}
              >
                day{n > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reason */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Reason (required)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g., Fever, headache, doctor's appointment..."
          placeholderTextColor="#aaa"
          value={reason}
          onChangeText={(text) => { setReason(text); setError(''); }}
          multiline
          numberOfLines={3}
          editable={!submitting}
        />
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <Text style={styles.summaryText}>
          {childName || 'Your child'} will be marked sick from {dateLabel}
        </Text>
        <Text style={styles.summaryText}>
          Lasting {sickDays} day{sickDays > 1 ? 's' : ''}
        </Text>
        <Text style={styles.summaryText}>
          School and driver will be notified
        </Text>
        {sickDaysUsed + sickDays > sickDaysTotal && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ This will exceed your term limit by {sickDaysUsed + sickDays - sickDaysTotal} day(s)
            </Text>
          </View>
        )}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>🩺 Report Sick Day</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas, padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.canvas },

  // Profile
  profileCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 14, elevation: 2 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 28, color: '#fff', fontWeight: '700' },
  profileName: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  profileClass: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  // Counter
  counterCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },
  counterTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  counterItem: { alignItems: 'center' },
  counterNum: { fontSize: 28, fontWeight: '700', color: COLORS.red },
  counterLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  progressBar: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 4 },

  // Section
  section: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },

  // Date
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  dateArrow: { backgroundColor: '#f0f0f0', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  dateArrowText: { fontSize: 20, fontWeight: '600', color: COLORS.green },
  dateDisplay: { backgroundColor: COLORS.greenBg, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  dateText: { fontSize: 18, fontWeight: '700', color: COLORS.green },

  // Days
  daysGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayNumBtn: {
    flex: 1, marginHorizontal: 4, paddingVertical: 16, borderRadius: 12,
    backgroundColor: '#f0f0f0', alignItems: 'center',
  },
  dayNumBtnSelected: { backgroundColor: COLORS.green },
  dayNumText: { fontSize: 24, fontWeight: '700', color: COLORS.textSecondary },
  dayNumTextSelected: { color: '#fff' },
  dayNumUnit: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  dayNumUnitSelected: { color: COLORS.greenBg },

  // Summary
  summaryCard: { backgroundColor: COLORS.greenBg, borderRadius: 12, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: COLORS.green },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.green, marginBottom: 8 },
  summaryText: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 4 },
  warningBox: { backgroundColor: COLORS.redBg, padding: 10, borderRadius: 8, marginTop: 8 },
  warningText: { fontSize: 12, color: COLORS.red, fontWeight: '500' },

  // Submit
  submitBtn: { backgroundColor: COLORS.green, padding: 18, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorBox: { backgroundColor: COLORS.redBg, borderRadius: 10, padding: 12, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: COLORS.red },
  errorText: { fontSize: 13, color: COLORS.red, fontWeight: '500' },
});
