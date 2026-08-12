// PoleSafe Family-First Bottom Sheet v1
// Multi-service booking with Shield (family safety) + Go (standard ride)
// From Home to School. And Beyond. 🚸

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { BRAND, STATUS, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';
import HapticFeedback from '../utils/hapticFeedback';

// ─── Ride Tiers ──────────────────────────────────────
const TIERS = [
  {
    id: 'shield',
    label: 'PoleSafe Shield',
    emoji: '🛡️',
    subtitle: 'Verified drivers, live PIN check, real-time family sharing, route deviation alerts',
    badge: 'Most Secure for Kids',
    color: BRAND.primary,
    priceMultiplier: 1.0,
  },
  {
    id: 'go',
    label: 'PoleSafe Go',
    emoji: '🚗',
    subtitle: 'Fast, direct, on-demand local rides',
    badge: 'Fastest Arrival',
    color: BRAND.secondary,
    priceMultiplier: 0.85,
  },
  {
    id: 'xl',
    label: 'PoleSafe XL',
    emoji: '🚐',
    subtitle: '6+ seats, heavy luggage, or full school team gear',
    badge: 'Group Ready',
    color: BRAND.purple,
    priceMultiplier: 1.4,
  },
];

// ─── Booking Bottom Sheet ────────────────────────────
export default function BookingBottomSheet({ 
  visible, 
  onClose, 
  basePrice = 5000,
  pickupLocation,
  onConfirm,
}) {
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['25%', '55%', '85%'], []);
  const [selectedTier, setSelectedTier] = useState('shield');
  const [destination, setDestination] = useState('');
  const [enableTracking, setEnableTracking] = useState(true);
  const [searching, setSearching] = useState(false);

  const tier = TIERS.find(t => t.id === selectedTier) || TIERS[0];
  const estimatedPrice = Math.round(basePrice * tier.priceMultiplier);
  const estimatedMinutes = selectedTier === 'go' ? '5-8' : selectedTier === 'xl' ? '8-12' : '6-10';

  const handleConfirm = () => {
    if (!destination.trim()) {
      Alert.alert('Where to?', 'Please enter your destination');
      return;
    }
    HapticFeedback.medium();
    setSearching(true);
    
    // Simulate searching
    setTimeout(() => {
      setSearching(false);
      onConfirm({
        tier: selectedTier,
        destination: destination.trim(),
        price: estimatedPrice,
        trackingEnabled: enableTracking,
      });
    }, 2000);
  };

  if (!visible) return null;

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Where are we heading today?</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Destination Search */}
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>📍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination..."
            placeholderTextColor="#9CA3AF"
            value={destination}
            onChangeText={setDestination}
            autoCapitalize="words"
          />
          {destination.length > 0 && (
            <TouchableOpacity onPress={() => setDestination('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Saved Places */}
        <View style={styles.savedRow}>
          {['🏠 Home', '🏫 School', '💼 Work'].map((place, i) => (
            <TouchableOpacity
              key={i}
              style={styles.savedChip}
              onPress={() => setDestination(place.replace(/^[^\s]+\s/, ''))}
            >
              <Text style={styles.savedChipText}>{place}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ride Tiers */}
        <Text style={styles.sectionLabel}>SELECT RIDE TYPE</Text>
        <View style={styles.tierList}>
          {TIERS.map(t => {
            const active = selectedTier === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tierCard, active && { borderColor: t.color, backgroundColor: t.color + '10' }]}
                onPress={() => { setSelectedTier(t.id); HapticFeedback.light(); }}
                activeOpacity={0.7}
              >
                <View style={styles.tierLeft}>
                  <View style={[styles.tierIcon, { backgroundColor: t.color + '20' }]}>
                    <Text style={styles.tierEmoji}>{t.emoji}</Text>
                  </View>
                  <View style={styles.tierInfo}>
                    <View style={styles.tierNameRow}>
                      <Text style={[styles.tierLabel, active && { color: t.color }]}>{t.label}</Text>
                      <View style={[styles.tierBadge, { backgroundColor: t.color + '20' }]}>
                        <Text style={[styles.tierBadgeText, { color: t.color }]}>{t.badge}</Text>
                      </View>
                    </View>
                    <Text style={styles.tierSubtitle}>{t.subtitle}</Text>
                  </View>
                </View>
                <View style={styles.tierRight}>
                  <Text style={[styles.tierPrice, { color: t.color }]}>~{estimatedPrice.toLocaleString()}</Text>
                  <Text style={styles.tierUnit}>UGX</Text>
                  <Text style={styles.tierEta}>{estimatedMinutes} min</Text>
                </View>
                {active && <View style={[styles.tierCheck, { backgroundColor: t.color }]}><Text style={styles.tierCheckText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Safety Toggle */}
        <TouchableOpacity
          style={[styles.safetyToggle, enableTracking && styles.safetyToggleActive]}
          onPress={() => { setEnableTracking(!enableTracking); HapticFeedback.light(); }}
          activeOpacity={0.7}
        >
          <Text style={styles.safetyEmoji}>🔒</Text>
          <View style={styles.safetyInfo}>
            <Text style={[styles.safetyLabel, enableTracking && { color: BRAND.primary }]}>
              Let my family see this trip live
            </Text>
            <Text style={styles.safetySub}>
              Live GPS tracking shared with saved family members
            </Text>
          </View>
          <View style={[styles.safetySwitch, enableTracking && styles.safetySwitchOn]}>
            <View style={[styles.safetyKnob, enableTracking && styles.safetyKnobOn]} />
          </View>
        </TouchableOpacity>

        {/* Search / Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: tier.color }, searching && { opacity: 0.7 }]}
          onPress={handleConfirm}
          disabled={searching}
          activeOpacity={0.8}
        >
          {searching ? (
            <View style={styles.searchingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.confirmText}>  Searching for nearby drivers...</Text>
            </View>
          ) : (
            <Text style={styles.confirmText}>
              Confirm Pickup  •  {estimatedPrice.toLocaleString()} UGX
            </Text>
          )}
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '700' },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#111827' },
  clearBtn: { padding: 4 },
  clearBtnText: { fontSize: 14, color: '#9CA3AF', fontWeight: '700' },

  // Saved
  savedRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  savedChip: { backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  savedChipText: { fontSize: 13, color: '#374151', fontWeight: '600' },

  // Tiers
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 10 },
  tierList: { gap: 8, marginBottom: 14 },
  tierCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: BORDER_RADIUS.md, padding: 14, borderWidth: 1.5, borderColor: '#E5E7EB', position: 'relative' },
  tierLeft: { flexDirection: 'row', flex: 1 },
  tierIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  tierEmoji: { fontSize: 20 },
  tierInfo: { flex: 1 },
  tierNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  tierLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  tierBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tierBadgeText: { fontSize: 10, fontWeight: '700' },
  tierSubtitle: { fontSize: 11, color: '#6B7280', lineHeight: 15 },
  tierRight: { alignItems: 'flex-end', marginLeft: 8 },
  tierPrice: { fontSize: 18, fontWeight: '800' },
  tierUnit: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  tierEta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  tierCheck: { position: 'absolute', top: -1, right: -1, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  tierCheckText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Safety
  safetyToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: BORDER_RADIUS.sm, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  safetyToggleActive: { borderColor: BRAND.primary + '40', backgroundColor: BRAND.primary + '08' },
  safetyEmoji: { fontSize: 20, marginRight: 10 },
  safetyInfo: { flex: 1 },
  safetyLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  safetySub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  safetySwitch: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#D1D5DB', padding: 2, justifyContent: 'center' },
  safetySwitchOn: { backgroundColor: BRAND.primary },
  safetyKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  safetyKnobOn: { alignSelf: 'flex-end' },

  // Confirm
  confirmBtn: { paddingVertical: 16, borderRadius: BORDER_RADIUS.md, alignItems: 'center', marginTop: 4 },
  confirmText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  searchingRow: { flexDirection: 'row', alignItems: 'center' },
});
