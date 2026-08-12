// PoleSafe Mobile — Post-Trip Safety Review & Rating Modal
// Phase 12: Parent rates the driver, verifies safety, adds tip, saves favorite
// Shows automatically when a ride reaches 'completed' status
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HapticFeedback from '../utils/hapticFeedback';
import API_BASE from '../config';
import { BRAND, getTheme, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';

// ─── Rating Labels ──────────────────────────────────
const RATING_LABELS = {
  5: { label: 'Excellent & Safe', emoji: '🌟', color: '#15803D', bg: '#F0FDF4' },
  4: { label: 'Good & Reliable', emoji: '👍', color: '#166534', bg: '#F0FDF4' },
  3: { label: 'Okay / Minor Issues', emoji: '🤷', color: '#92400E', bg: '#FFFBEB' },
  2: { label: 'Needs Improvement', emoji: '⚠️', color: '#9A3412', bg: '#FFF7ED' },
  1: { label: 'Unsafe — Flagged for Review', emoji: '🚨', color: '#991B1B', bg: '#FEF2F2' },
};

// ─── Safety Check Items ─────────────────────────────
const SAFETY_CHIPS = [
  { key: 'helmetProvided', label: '⛑️ Helmet Provided', positive: true },
  { key: 'pinVerified', label: '🔒 PIN Handshake Followed', positive: true },
  { key: 'safeSpeed', label: '🚗 Safe Driving Speed', positive: true },
  { key: 'politeRide', label: '💬 Polite & Respectful', positive: true },
  { key: 'onTimePickup', label: '⏰ On-Time Pickup', positive: true },
];

// ─── Tip Presets ────────────────────────────────────
const TIP_OPTIONS = [
  { label: 'UGX 2,000', value: 2000 },
  { label: 'UGX 5,000', value: 5000 },
  { label: 'UGX 10,000', value: 10000 },
  { label: 'No Tip', value: 0 },
];

// ════════════════════════════════════════════════════
// Star Rating Component
// ════════════════════════════════════════════════════
function StarBar({ rating, onRate, disabled }) {
  return (
    <View style={styles.starBar}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= rating;
        return (
          <TouchableOpacity
            key={star}
            onPress={() => {
              if (disabled) return;
              HapticFeedback.light();
              onRate(star);
            }}
            disabled={disabled}
            activeOpacity={0.6}
            style={styles.starBtn}
          >
            <Text style={[styles.star, filled && styles.starFilled]}>
              {filled ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ════════════════════════════════════════════════════
// Safety Chip Component
// ════════════════════════════════════════════════════
function SafetyChip({ label, selected, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={() => { HapticFeedback.light(); onToggle(); }}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {selected ? `✅ ${label}` : label}
      </Text>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════
// Main Modal Component
// ════════════════════════════════════════════════════
export default function PostTripReviewModal({ visible, onClose, ride }) {
  const theme = getTheme();

  // State
  const [rating, setRating] = useState(0);
  const [safetySelections, setSafetySelections] = useState({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setRating(0);
      setSafetySelections({});
      setIsFavorite(false);
      setTipAmount(0);
      setCustomTip('');
      setSubmitting(false);
    }
  }, [visible]);

  // ── Data extraction ──
  const child = ride?.childId || {};
  const driver = ride?.driverId || {};
  const pickupLabel = ride?.pickupLocation?.address || ride?.pickupLocation?.label || 'Pickup';
  const dropoffLabel = ride?.dropoffLocation?.address || ride?.dropoffLocation?.label || 'Drop-off';
  const ratingMeta = RATING_LABELS[rating] || {};

  // ── Toggle safety chip ──
  const toggleSafety = (key) => {
    setSafetySelections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ── Select tip ──
  const selectTip = (val) => {
    HapticFeedback.light();
    setTipAmount(val);
    setCustomTip('');
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (rating === 0) {
      HapticFeedback.warning();
      Alert.alert('Rate your ride', 'Please select a star rating before submitting.');
      return;
    }

    setSubmitting(true);
    HapticFeedback.medium();

    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 1) Submit rating
      if (ride?._id) {
        await fetch(`${API_BASE}/api/rides/${ride._id}/rate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ rating }),
        });

        // 2) Submit safety checks
        const activeChecks = {};
        SAFETY_CHIPS.forEach(chip => {
          if (safetySelections[chip.key] !== undefined) {
            activeChecks[chip.key] = safetySelections[chip.key];
          }
        });
        if (Object.keys(activeChecks).length > 0) {
          await fetch(`${API_BASE}/api/rides/${ride._id}/safety-checks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ checks: activeChecks }),
          });
        }

        // 3) Process tip
        const finalTip = customTip ? parseInt(customTip) || 0 : tipAmount;
        if (finalTip > 0) {
          await fetch(`${API_BASE}/api/rides/${ride._id}/tip`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ amount: finalTip, method: 'mobile_money' }),
          });
        }

        // 4) Toggle favorite
        if (isFavorite && driver?._id) {
          await fetch(`${API_BASE}/api/rides/favorite-driver`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ driverId: driver._id, favorite: true }),
          });
        }
      }

      HapticFeedback.success();
      Alert.alert(
        '✅ Review Submitted!',
        rating <= 2
          ? 'Thank you. This ride has been flagged for our safety team to review.'
          : 'Thank you for your feedback! Your review helps make PoleSafe better for everyone.',
      );

      onClose && onClose({ submitted: true, rating, tip: finalTip > 0 ? finalTip : null });

    } catch (err) {
      HapticFeedback.error();
      Alert.alert('Error', err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <ScrollView
          style={[styles.modalContainer, { backgroundColor: theme.canvas }]}
          contentContainerStyle={styles.modalContent}
        >
          {/* ═══ Header ═══ */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerEmoji}>🎉</Text>
            </View>
            <Text style={styles.headerTitle}>Safe Drop-off Completed</Text>
            <Text style={styles.headerSub}>{child.name || 'Your child'} is safely home!</Text>
          </View>

          {/* ═══ Ride Summary ═══ */}
          <GlassCard style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.driverPhotoPlaceholder}>
                <Text style={styles.driverPhotoText}>
                  {driver.name ? driver.name.charAt(0) : '👤'}
                </Text>
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.driverName}>{driver.name || 'Driver'}</Text>
                <Text style={styles.vehiclePlate}>{driver.vehiclePlate || ride?.vehiclePlate || ''}</Text>
                <Text style={styles.routeText}>
                  {pickupLabel}  →  {dropoffLabel}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* ═══ Star Rating ═══ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Your Ride</Text>
            <StarBar rating={rating} onRate={setRating} disabled={submitting} />
            {rating > 0 && (
              <View style={[styles.ratingBadge, { backgroundColor: ratingMeta.bg }]}>
                <Text style={styles.ratingEmoji}>{ratingMeta.emoji}</Text>
                <Text style={[styles.ratingLabel, { color: ratingMeta.color }]}>
                  {ratingMeta.label}
                </Text>
                {rating <= 2 && (
                  <Text style={styles.flagNotice}>
                    🚨 This ride will be reviewed by our safety team
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* ═══ Safety Checks ═══ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Checks</Text>
            <Text style={styles.sectionHint}>Tap to confirm what went well (optional)</Text>
            <View style={styles.chipGrid}>
              {SAFETY_CHIPS.map(chip => (
                <SafetyChip
                  key={chip.key}
                  label={chip.label}
                  selected={!!safetySelections[chip.key]}
                  onToggle={() => toggleSafety(chip.key)}
                />
              ))}
            </View>
          </View>

          {/* ═══ Favorite Driver ═══ */}
          <TouchableOpacity
            style={[styles.favoriteRow, isFavorite && styles.favoriteRowActive]}
            onPress={() => { HapticFeedback.light(); setIsFavorite(!isFavorite); }}
            disabled={submitting}
          >
            <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
            <View style={styles.favoriteInfo}>
              <Text style={styles.favoriteTitle}>
                {isFavorite ? 'Added to Preferred Drivers' : 'Add to Preferred Drivers'}
              </Text>
              <Text style={styles.favoriteSub}>
                {isFavorite
                  ? `${driver.name || 'This driver'} gets priority for future rides`
                  : 'Save this driver for quicker booking next time'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* ═══ Tip Section ═══ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💝 Tip Your Driver</Text>
            <Text style={styles.sectionHint}>Optional — 100% goes to the driver via Mobile Money</Text>
            <View style={styles.tipRow}>
              {TIP_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.tipBtn, tipAmount === opt.value && styles.tipBtnActive]}
                  onPress={() => selectTip(opt.value)}
                  disabled={submitting}
                >
                  <Text style={[styles.tipBtnText, tipAmount === opt.value && styles.tipBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.customTipInput}
              placeholder="Custom amount (UGX)"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={customTip}
              onChangeText={(t) => {
                setCustomTip(t);
                if (t) setTipAmount(0);
              }}
              editable={!submitting}
            />
          </View>

          {/* ═══ Submit Button ═══ */}
          <PrimaryButton
            title={submitting ? 'Submitting...' : '✅ Submit Feedback & Close'}
            onPress={handleSubmit}
            disabled={submitting}
            loading={submitting}
            style={styles.submitBtn}
          />

          {/* ═══ Skip / Close ═══ */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => {
              HapticFeedback.light();
              onClose && onClose({ submitted: false });
            }}
            disabled={submitting}
          >
            <Text style={styles.skipBtnText}>Skip — I'll review later</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════
// Styles
// ════════════════════════════════════════════════════
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalContent: {
    padding: 20,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 20, paddingTop: 8 },
  headerBadge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  headerEmoji: { fontSize: 36 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#15803D', textAlign: 'center' },
  headerSub: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },

  // Ride Summary
  summaryCard: { padding: 14, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  driverPhotoPlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  driverPhotoText: { fontSize: 22, fontWeight: '700', color: '#6B7280' },
  summaryInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  vehiclePlate: { fontSize: 13, color: '#6B7280', marginTop: 1 },
  routeText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  // Stars
  starBar: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 10 },
  starBtn: { padding: 4 },
  star: { fontSize: 40, color: '#D1D5DB' },
  starFilled: { color: '#F59E0B' },

  // Rating badge
  ratingBadge: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 12, marginVertical: 8,
  },
  ratingEmoji: { fontSize: 28 },
  ratingLabel: { fontSize: 15, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  flagNotice: { fontSize: 12, color: '#991B1B', marginTop: 6, fontWeight: '600', textAlign: 'center' },

  // Sections
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionHint: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },

  // Safety chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#F0FDF4', borderColor: '#15803D' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#15803D' },

  // Favorite driver
  favoriteRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
    marginBottom: 20, backgroundColor: '#fff',
  },
  favoriteRowActive: { backgroundColor: '#FFF1F2', borderColor: '#E11D48' },
  favoriteIcon: { fontSize: 28, marginRight: 12 },
  favoriteInfo: { flex: 1 },
  favoriteTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  favoriteSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Tips
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tipBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center',
    backgroundColor: '#fff',
  },
  tipBtnActive: { backgroundColor: '#F0FDF4', borderColor: '#15803D' },
  tipBtnText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  tipBtnTextActive: { color: '#15803D' },
  customTipInput: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#fff',
  },

  // Submit
  submitBtn: { marginTop: 4, marginBottom: 12 },

  // Skip
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipBtnText: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
});
