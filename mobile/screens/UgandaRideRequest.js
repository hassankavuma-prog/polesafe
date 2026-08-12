// PoleSafe Uganda Ride Request v1
// Localized for Ugandan market: Boda-Bodas, Landmarks, Mobile Money
// From Home to School. And Beyond. 🚸 🇺🇬

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { BRAND, STATUS, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';
import HapticFeedback from '../utils/hapticFeedback';

// ─── Localized Tier Definitions ──────────────────────
const TIERS = [
  {
    id: 'boda_shield',
    label: 'PoleSafe Boda Shield',
    emoji: '🏍️',
    subtitle: 'Verified rider, helmet, kid hairnet, live PIN & speed tracking',
    badge: '🛡️ Safe Boda',
    color: '#E67E22',
    priceBase: 3000,
    pricePerKm: 1000,
  },
  {
    id: 'express_car',
    label: 'PoleSafe Express Car',
    emoji: '🚗',
    subtitle: 'Enclosed vehicle with verified driver & seatbelts',
    badge: '🚗 Family Car',
    color: BRAND.secondary,
    priceBase: 5000,
    pricePerKm: 2000,
  },
];

// ─── Payment Methods ─────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'momo', label: 'MTN MoMo', emoji: '🟡', color: '#FFC107', bg: '#FFF8E1' },
  { id: 'airtel', label: 'Airtel Money', emoji: '🔴', color: '#E53935', bg: '#FFEBEE' },
  { id: 'cash', label: 'Cash', emoji: '💵', color: '#2E7D32', bg: '#E8F5E9' },
];

// ─── Mock Kids Data (from AsyncStorage) ──────────────
async function loadKids() {
  try {
    const token = await AsyncStorage.getItem('polesafe_token');
    const res = await fetch(`${API_BASE}/api/parents/kids`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.kids || [];
    }
  } catch (err) {
    console.log('Load kids error:', err);
  }
  // Fallback mock data
  return [
    { _id: '1', name: 'Sarah Nakato', className: 'P5', pickupPin: '4821', school: { name: 'St. Mary\'s School' } },
    { _id: '2', name: 'James Okello', className: 'S2', pickupPin: '1092', school: { name: 'Greenhill Academy' } },
  ];
}

// ─── Landmark Suggestions ────────────────────────────
const LANDMARK_SUGGESTIONS = {
  pickup: [
    '🏠 Home',
    '🏫 School Gate',
    '📍 Near Quality Supermarket, Naalya',
    '📍 Opposite Rubaga Cathedral',
    '📍 Shell Kalerwe',
  ],
  dropoff: [
    '🏫 School Gate',
    '🏠 Home',
    '📍 Near St. Mary\'s, Ntinda',
    '📍 Opposite KCCA Grounds',
    '📍 Acacia Mall',
  ],
};

// ─── Main Component ──────────────────────────────────
export default function UgandaRideRequest({ visible, onClose, onConfirm }) {
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['30%', '65%', '92%'], []);
  
  const [kids, setKids] = useState([]);
  const [selectedKidId, setSelectedKidId] = useState(null);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedTier, setSelectedTier] = useState('boda_shield');
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Load kids on mount
  useEffect(() => {
    if (visible) {
      setLoading(true);
      loadKids().then(k => {
        setKids(k);
        if (k.length > 0 && !selectedKidId) setSelectedKidId(k[0]._id);
        setLoading(false);
      });
    }
  }, [visible]);

  const selectedKid = kids.find(k => k._id === selectedKidId);
  const tier = TIERS.find(t => t.id === selectedTier) || TIERS[0];
  const payment = PAYMENT_METHODS.find(p => p.id === paymentMethod) || PAYMENT_METHODS[0];

  // Estimate price (simple: base + per km)
  const estimatedPrice = tier ? tier.priceBase + tier.pricePerKm * 3 : 5000;

  const handleRequest = () => {
    if (!selectedKidId) {
      Alert.alert('Select Child', 'Please select which child needs transport.');
      return;
    }
    if (!pickup.trim()) {
      Alert.alert('Pickup Location', 'Enter a pickup point or landmark.');
      return;
    }
    if (!dropoff.trim()) {
      Alert.alert('Destination', 'Enter a drop-off location or landmark.');
      return;
    }
    HapticFeedback.medium();
    setRequesting(true);

    // Simulate finding a driver
    setTimeout(() => {
      setRequesting(false);
      onConfirm({
        childId: selectedKidId,
        childName: selectedKid?.name,
        pickup,
        dropoff,
        tier: selectedTier,
        paymentMethod,
        estimatedPrice,
      });
    }, 2000);
  };

  if (!visible) return null;

  const selectedKidLocal = selectedKid;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
      backgroundStyle={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
    >
      <BottomSheetView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Text style={styles.backBtnText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Book Family Transport</Text>
            <View style={styles.backBtn} />
          </View>

          {/* Child Selector */}
          <Text style={styles.sectionLabel}>WHO IS RIDING?</Text>
          {loading ? (
            <ActivityIndicator color={BRAND.secondary} style={{ marginVertical: 12 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childRow}>
              {kids.map(kid => {
                const active = kid._id === selectedKidId;
                return (
                  <TouchableOpacity
                    key={kid._id}
                    style={[styles.childChip, active && { backgroundColor: BRAND.primary + '15', borderColor: BRAND.primary }]}
                    onPress={() => { setSelectedKidId(kid._id); HapticFeedback.light(); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.childAvatar, active && { backgroundColor: BRAND.primary }]}>
                      <Text style={styles.childAvatarText}>{kid.name?.charAt(0) || '👶'}</Text>
                    </View>
                    <Text style={[styles.childName, active && { color: BRAND.primary }]}>{kid.name?.split(' ')[0] || 'Child'}</Text>
                    <Text style={styles.childPin}>🔑 PIN: {kid.pickupPin || '0000'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Pickup / Drop-off */}
          <Text style={styles.sectionLabel}>PICKUP & DROP-OFF</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <TextInput
              style={styles.locationInput}
              placeholder="Pickup (e.g., Home / School Gate)"
              placeholderTextColor="#9CA3AF"
              value={pickup}
              onChangeText={setPickup}
            />
          </View>
          {pickup.length === 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.landmarkRow}>
              {LANDMARK_SUGGESTIONS.pickup.slice(0, 3).map((l, i) => (
                <TouchableOpacity key={i} style={styles.landmarkChip} onPress={() => setPickup(l)}>
                  <Text style={styles.landmarkText}>{l}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>🏁</Text>
            <TextInput
              style={styles.locationInput}
              placeholder="Destination / Landmark"
              placeholderTextColor="#9CA3AF"
              value={dropoff}
              onChangeText={setDropoff}
            />
          </View>
          {dropoff.length === 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.landmarkRow}>
              {LANDMARK_SUGGESTIONS.dropoff.slice(0, 3).map((l, i) => (
                <TouchableOpacity key={i} style={styles.landmarkChip} onPress={() => setDropoff(l)}>
                  <Text style={styles.landmarkText}>{l}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Uganda Service Tiers */}
          <Text style={styles.sectionLabel}>SERVICE TYPE</Text>
          <View style={styles.tierRow}>
            {TIERS.map(t => {
              const active = selectedTier === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tierCard, active && { borderColor: t.color, backgroundColor: t.color + '10' }]}
                  onPress={() => { setSelectedTier(t.id); HapticFeedback.light(); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tierEmoji}>{t.emoji}</Text>
                  <Text style={[styles.tierLabel, active && { color: t.color }]}>{t.label}</Text>
                  <Text style={styles.tierSubtitle}>{t.subtitle}</Text>
                  <View style={[styles.tierBadge, { backgroundColor: t.color + '20' }]}>
                    <Text style={[styles.tierBadgeText, { color: t.color }]}>{t.badge}</Text>
                  </View>
                  {active && <View style={[styles.tierCheck, { backgroundColor: t.color }]}><Text style={styles.tierCheckText}>✓</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Payment Method */}
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map(p => {
              const active = paymentMethod === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.paymentCard, active && { borderColor: p.color, backgroundColor: p.bg }]}
                  onPress={() => { setPaymentMethod(p.id); HapticFeedback.light(); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.paymentEmoji}>{p.emoji}</Text>
                  <Text style={[styles.paymentLabel, active && { color: p.color }]}>{p.label}</Text>
                  {active && <Text style={styles.paymentCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Price Estimate */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Estimated fare</Text>
            <Text style={styles.priceValue}>UGX {estimatedPrice.toLocaleString()}</Text>
          </View>

          {/* Request Button */}
          <TouchableOpacity
            style={[styles.requestBtn, { backgroundColor: tier.color }, requesting && { opacity: 0.7 }]}
            onPress={handleRequest}
            disabled={requesting}
            activeOpacity={0.8}
          >
            {requesting ? (
              <View style={styles.requestingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.requestBtnText}>  Finding a {tier.emoji} {tier.label.split(' ')[1]}...</Text>
              </View>
            ) : (
              <Text style={styles.requestBtnText}>
                Request Driver for {selectedKidLocal?.name?.split(' ')[0] || 'Child'}  •  UGX {estimatedPrice.toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>

          {/* Payment Note */}
          <Text style={styles.paymentNote}>
            {paymentMethod === 'cash'
              ? '💵 Pay the driver directly in cash upon arrival.'
              : `📲 ${payment.label} payment will be processed when the ride starts.`}
          </Text>

          <View style={{ height: 30 }} />
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 },
  backBtn: { width: 60 },
  backBtnText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', flex: 1 },

  // Section Label
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },

  // Child Selector
  childRow: { marginBottom: 16 },
  childChip: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minWidth: 100,
  },
  childAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  childAvatarText: { fontSize: 16, color: '#fff', fontWeight: '700' },
  childName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  childPin: { fontSize: 10, color: '#6B7280', marginTop: 2 },

  // Location Inputs
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationIcon: { fontSize: 16, marginRight: 10 },
  locationInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#111827' },

  // Landmark Suggestions
  landmarkRow: { marginBottom: 12 },
  landmarkChip: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  landmarkText: { fontSize: 12, color: '#374151', fontWeight: '500' },

  // Service Tiers
  tierRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tierCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  tierEmoji: { fontSize: 28, marginBottom: 6 },
  tierLabel: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 4 },
  tierSubtitle: { fontSize: 10, color: '#6B7280', lineHeight: 14, marginBottom: 8 },
  tierBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  tierBadgeText: { fontSize: 9, fontWeight: '700' },
  tierCheck: { position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tierCheckText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Payment
  paymentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  paymentCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.sm,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  paymentEmoji: { fontSize: 16, marginRight: 6 },
  paymentLabel: { fontSize: 11, fontWeight: '700', color: '#374151', flex: 1 },
  paymentCheck: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },

  // Price
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  priceLabel: { fontSize: 14, color: '#6B7280' },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

  // Request Button
  requestBtn: { paddingVertical: 16, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  requestBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  requestingRow: { flexDirection: 'row', alignItems: 'center' },

  // Payment Note
  paymentNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 10, lineHeight: 16 },
});
