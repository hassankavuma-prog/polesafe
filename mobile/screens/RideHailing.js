// PoleSafe Ride v3 — Premium Ride-Hailing
// WCAG AA compliant — large tap targets, readable pricing
// Better than Uber + Lyft: transparent pricing, driver details, safety-first
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl, Platform, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { BRAND, STATUS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS, WCAG } from '../theme';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';

// ─── Constants ────────────────────────────────────────
const VEHICLES = {
  car:   { id: 'car',   emoji: '🚗', label: 'Car',    desc: '4 seats · A/C',  baseFare: 3500, perKm: 1500, iconColor: '#1565C0' },
  boda:  { id: 'boda',  emoji: '🏍️', label: 'Boda',   desc: '1 passenger · fast', baseFare: 2500, perKm: 1000, iconColor: '#E65100' },
};

const SAVED_PLACES = [
  { id: '1', name: 'Home',          address: 'Current Location',                   emoji: '🏠' },
  { id: '2', name: 'St Mary\'s School', address: 'Entebbe Road, Kampala',           emoji: '🏫' },
  { id: '3', name: 'Work',           address: '5th Street, Industrial Area',        emoji: '🏢' },
  { id: '4', name: 'Shoprite',       address: 'Oasis Mall, Kampala',               emoji: '🛒' },
  { id: '5', name: 'Acacia Mall',    address: 'Kira Road, Kampala',                emoji: '🛍️' },
  { id: '6', name: 'Garden City',    address: 'Kampala Road',                      emoji: '🏬' },
];

const DEMO_DRIVERS = [
  { _id: 'd1', name: 'John Mugisha',   rating: 4.9, rides: 1247, vehicle: 'Toyota Corolla',  plate: 'UBA 123K', color: '#1565C0', distance: '0.8 km', price: 5000, eta: 4, available: true },
  { _id: 'd2', name: 'Sarah Nakato',   rating: 4.8, rides: 892,  vehicle: 'Honda Fit',       plate: 'UBB 456L', color: '#C62828', distance: '1.2 km', price: 6500, eta: 6, available: true },
  { _id: 'd3', name: 'Peter Okello',   rating: 4.7, rides: 563,  vehicle: 'Suzuki Swift',     plate: 'UBC 789M', color: '#2E7D32', distance: '2.5 km', price: 8000, eta: 10, available: true },
  { _id: 'd4', name: 'Grace Achieng',  rating: 4.9, rides: 2104, vehicle: 'Boda Boda',        plate: 'UBD 012N', color: '#E65100', distance: '0.5 km', price: 3500, eta: 3, available: true },
  { _id: 'd5', name: 'Robert Ssempijja', rating: 4.6, rides: 341, vehicle: 'Toyota Wish',     plate: 'UBE 345P', color: '#6A1B9A', distance: '1.8 km', price: 7000, eta: 8, available: true },
  { _id: 'd6', name: 'Esther Nabatanzi', rating: 4.7, rides: 887, vehicle: 'Boda Boda',        plate: 'UBF 678Q', color: '#E65100', distance: '0.3 km', price: 3000, eta: 2, available: true },
];

// ─── Helpers ──────────────────────────────────────────
const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-UG');

function PricingBreakdown({ vehicle, distance }) {
  const v = VEHICLES[vehicle];
  if (!v) return null;
  const dist = distance || 3;
  const base = v.baseFare;
  const distCost = dist * v.perKm;
  const total = (base + distCost);
  const rounded = Math.round(total / 500) * 500;

  return (
    <View style={pricing.wrap}>
      <Text style={pricing.title}>💰 Fare Estimate</Text>
      <View style={pricing.row}>
        <Text style={pricing.label}>Base fare</Text>
        <Text style={pricing.value}>{formatCurrency(base)} UGX</Text>
      </View>
      <View style={pricing.row}>
        <Text style={pricing.label}>Distance ({dist} km × {formatCurrency(v.perKm)}/km)</Text>
        <Text style={pricing.value}>{formatCurrency(distCost)} UGX</Text>
      </View>
      <View style={pricing.divider} />
      <View style={pricing.row}>
        <Text style={pricing.totalLabel}>Estimated total</Text>
        <Text style={pricing.totalValue}>{formatCurrency(rounded)} UGX</Text>
      </View>
      <Text style={pricing.note}>Rounded to nearest 500 UGX · No surge pricing</Text>
    </View>
  );
}

const pricing = StyleSheet.create({
  wrap: {
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 13, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 6 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 14, fontWeight: '800', color: BRAND.primary },
  note: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
});

// ─── Driver Card ──────────────────────────────────────
function DriverCard({ driver, selected, onSelect, vehicleType }) {
  return (
    <TouchableOpacity
      style={[driverStyles.card, selected && driverStyles.selected]}
      onPress={() => onSelect(driver._id)}
      activeOpacity={0.8}
    >
      <View style={driverStyles.row}>
        {/* Avatar */}
        <View style={[driverStyles.avatar, { backgroundColor: driver.color || BRAND.secondary }]}>
          <Text style={driverStyles.avatarText}>{driver.name?.charAt(0)}</Text>
        </View>

        {/* Info */}
        <View style={driverStyles.info}>
          <View style={driverStyles.nameRow}>
            <Text style={driverStyles.name}>{driver.name}</Text>
            <Text style={driverStyles.rating}>⭐ {driver.rating}</Text>
          </View>
          <Text style={driverStyles.vehicle}>
            {driver.vehicle} · {driver.plate}
          </Text>
          <Text style={driverStyles.meta}>
            📍 {driver.distance} · 🏆 {driver.rides.toLocaleString()} rides
          </Text>
        </View>

        {/* Price */}
        <View style={driverStyles.priceBox}>
          <Text style={driverStyles.price}>{formatCurrency(driver.price)}</Text>
          <Text style={driverStyles.priceLabel}>UGX</Text>
          <View style={driverStyles.etaBadge}>
            <Text style={driverStyles.etaText}>{driver.eta} min</Text>
          </View>
        </View>
      </View>

      {selected && (
        <View style={driverStyles.checkmark}>
          <Text style={driverStyles.checkText}>✓ Selected</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const driverStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  selected: {
    borderColor: BRAND.primary,
    backgroundColor: '#F0FDF4',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  rating: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
  vehicle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  meta: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  priceBox: { alignItems: 'center', marginLeft: 8 },
  price: { fontSize: 18, fontWeight: '800', color: '#111827' },
  priceLabel: { fontSize: 10, color: '#9CA3AF' },
  etaBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  etaText: { fontSize: 11, fontWeight: '700', color: BRAND.primary },
  checkmark: {
    marginTop: 10,
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkText: { fontSize: 12, fontWeight: '700', color: BRAND.primary },
});

// ─── Main Screen ──────────────────────────────────────
export default function RideHailing({ navigation }) {
  const theme = getTheme();
  const [searchText, setSearchText] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [pickupPlace, setPickupPlace] = useState(null);
  const [dropoffPlace, setDropoffPlace] = useState(null);
  const [showPricing, setShowPricing] = useState(false);

  const selectedDriver = drivers.find(d => d._id === selectedDriverId);
  const isBoda = selectedVehicle === 'boda';

  const filteredDrivers = drivers.filter(d => {
    if (isBoda) return d.vehicle?.toLowerCase().includes('boda') || true;
    return !d.vehicle?.toLowerCase().includes('boda');
  });

  useEffect(() => {
    loadDrivers();
  }, [selectedVehicle]);

  const loadDrivers = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/rides/drivers?vehicleType=${selectedVehicle}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      } else {
        // Demo data — sorted by distance
        const bus = DEMO_DRIVERS.filter(d => !d.vehicle?.toLowerCase().includes('boda'));
        const bodas = DEMO_DRIVERS.filter(d => d.vehicle?.toLowerCase().includes('boda'));
        setDrivers(isBoda ? bodas : bus);
      }
    } catch (err) {
      const bus = DEMO_DRIVERS.filter(d => !d.vehicle?.toLowerCase().includes('boda'));
      const bodas = DEMO_DRIVERS.filter(d => d.vehicle?.toLowerCase().includes('boda'));
      setDrivers(isBoda ? bodas : bus);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDrivers();
    setRefreshing(false);
  };

  const handleRequestRide = async () => {
    const driver = selectedDriver || filteredDrivers[0];
    if (!driver) { Alert.alert('No Drivers', 'No available drivers near you.'); return; }
    if (!searchText.trim() && !dropoffPlace) {
      Alert.alert('Where to?', 'Enter a destination first.');
      return;
    }

    const dest = dropoffPlace?.address || searchText || 'Kampala';
    const pickup = pickupPlace?.address || 'Current Location';
    const v = VEHICLES[selectedVehicle];
    const estTotal = Math.round(((v.baseFare + 3 * v.perKm)) / 500) * 500;

    Alert.alert(
      'Confirm Ride',
      [
        `From: ${pickup}`,
        `To: ${dest}`,
        `${v.emoji} ${v.label} with ${driver.name}`,
        `Est. fare: ${formatCurrency(estTotal)} UGX`,
        driver.eta ? `ETA: ~${driver.eta} min` : '',
      ].filter(Boolean).join('\n'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `🚗 Request Ride`,
          onPress: async () => {
            setRequesting(true);
            try {
              const token = await AsyncStorage.getItem('polesafe_token');
              const res = await fetch(`${API_BASE}/api/rides/request`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  driverId: driver._id,
                  vehicleType: selectedVehicle,
                  pickupLocation: pickup,
                  dropoffLocation: dest,
                  estimatedFare: estTotal,
                }),
              });
              if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
              Alert.alert(
                '🚗 Ride Confirmed!',
                `${driver.name} is on the way! ETA: ~${driver.eta || 5} minutes`,
                [
                  { text: 'Track Ride', onPress: () => navigation.navigate('TrackRide', { rideId: 'new_ride' }) },
                  { text: 'OK' },
                ]
              );
              setSearchText('');
              setDropoffPlace(null);
              setSelectedDriverId(null);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setRequesting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.canvas }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.canvas }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.secondary} />}
      contentContainerStyle={styles.content}
    >
      {/* Where to? Search */}
      <View style={styles.searchBox}>
        <View style={styles.searchIconWrap}>
          <Text style={styles.searchDot}>🔍</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder={dropoffPlace ? dropoffPlace.name : "Where to?"}
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={(t) => { setSearchText(t); setDropoffPlace(null); }}
          returnKeyType="search"
        />
        {(searchText || dropoffPlace) && (
          <TouchableOpacity onPress={() => { setSearchText(''); setDropoffPlace(null); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pickup Location */}
      <View style={styles.pickupBar}>
        <View style={styles.pickupDot} />
        <Text style={styles.pickupText}>{pickupPlace?.address || 'Current Location'}</Text>
        <TouchableOpacity onPress={() => Alert.alert('Change Pickup', 'Drop pin on map coming soon')}>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Saved Places */}
      {!searchText && !dropoffPlace && (
        <GlassCard style={styles.placesCard}>
          <Text style={styles.placesTitle}>SAVED PLACES</Text>
          {SAVED_PLACES.map(place => (
            <TouchableOpacity
              key={place.id}
              style={styles.placeRow}
              onPress={() => { setDropoffPlace(place); setSearchText(place.name); }}
              activeOpacity={0.6}
            >
              <View style={styles.placeIcon}>
                <Text style={styles.placeEmoji}>{place.emoji}</Text>
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeAddr}>{place.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </GlassCard>
      )}

      {/* Vehicle Selector */}
      <Text style={styles.sectionLabel}>VEHICLE TYPE</Text>
      <View style={styles.vehicleRow}>
        {Object.values(VEHICLES).map(v => (
          <TouchableOpacity
            key={v.id}
            style={[styles.vehicleCard, selectedVehicle === v.id && styles.vehicleActive]}
            onPress={() => { setSelectedVehicle(v.id); setSelectedDriverId(null); }}
            activeOpacity={0.7}
          >
            <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
            <Text style={[styles.vehicleLabel, selectedVehicle === v.id && styles.vehicleLabelActive]}>
              {v.label}
            </Text>
            <Text style={[styles.vehicleDesc, selectedVehicle === v.id && { color: '#fff', opacity: 0.8 }]}>
              {v.desc}
            </Text>
            <Text style={styles.vehiclePrice}>
              From {formatCurrency(v.baseFare)} UGX
            </Text>
            {selectedVehicle === v.id && (
              <View style={styles.vehicleSelectedBadge}>
                <Text style={styles.vehicleSelectedText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Pricing Toggle */}
      <TouchableOpacity style={styles.pricingToggle} onPress={() => setShowPricing(!showPricing)}>
        <Text style={styles.pricingToggleText}>
          {showPricing ? '▼ Hide pricing details' : '▶ Show pricing details'}
        </Text>
      </TouchableOpacity>
      {showPricing && <PricingBreakdown vehicle={selectedVehicle} distance={3} />}

      {/* Safety Notice */}
      <GlassCard style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>🛡️ PoleSafe Safety</Text>
        <Text style={styles.safetyText}>
          All drivers are vetted. Share your trip with family.{'\n'}
          SOS button available during ride. No surge pricing — ever.
        </Text>
      </GlassCard>

      {/* Drivers Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>
          {filteredDrivers.length > 0
            ? `AVAILABLE DRIVERS (${filteredDrivers.length})`
            : 'AVAILABLE DRIVERS'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={BRAND.secondary} />
          <Text style={styles.loadingText}>Finding nearby drivers...</Text>
        </View>
      ) : filteredDrivers.length === 0 ? (
        <GlassCard style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🚗</Text>
          <Text style={styles.emptyTitle}>No drivers nearby</Text>
          <Text style={styles.emptyDesc}>Try switching to Boda or check back shortly</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadDrivers}>
            <Text style={styles.refreshText}>↻ Refresh</Text>
          </TouchableOpacity>
        </GlassCard>
      ) : (
        filteredDrivers.map(driver => (
          <DriverCard
            key={driver._id}
            driver={driver}
            selected={selectedDriverId === driver._id}
            onSelect={setSelectedDriverId}
            vehicleType={selectedVehicle}
          />
        ))
      )}

      {/* Request Button */}
      <TouchableOpacity
        style={[
          styles.requestBtn,
          requesting && { opacity: 0.6 },
          (filteredDrivers.length === 0) && styles.requestBtnDisabled,
        ]}
        onPress={handleRequestRide}
        disabled={requesting || filteredDrivers.length === 0}
        activeOpacity={0.8}
      >
        {requesting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.requestBtnContent}>
            <Text style={styles.requestBtnText}>
              🚗 Request
            </Text>
            {selectedDriver && (
              <Text style={styles.requestSubText}>
                {selectedDriver.name} · {formatCurrency(selectedDriver.price)} UGX
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

    <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIconWrap: { marginRight: 10 },
  searchDot: { fontSize: 16 },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  clearBtn: {
    fontSize: 18,
    color: '#9CA3AF',
    padding: 4,
  },

  // Pickup
  pickupBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND.primary,
    marginRight: 10,
  },
  pickupText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },

  // Saved Places
  placesCard: { padding: 0, marginBottom: 16 },
  placesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    padding: 14,
    paddingBottom: 8,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  placeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeEmoji: { fontSize: 16 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  placeAddr: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  // Vehicle Selector
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  vehicleCard: {
    flex: 1,
    padding: 16,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  vehicleActive: {
    borderColor: BRAND.secondary,
    backgroundColor: BRAND.secondary,
  },
  vehicleEmoji: { fontSize: 28, marginBottom: 6 },
  vehicleLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  vehicleLabelActive: { color: '#fff' },
  vehicleDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  vehiclePrice: { fontSize: 12, color: BRAND.primary, fontWeight: '600', marginTop: 6 },
  vehicleSelectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleSelectedText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  // Pricing Toggle
  pricingToggle: { paddingVertical: 6, marginBottom: 4 },
  pricingToggleText: { fontSize: 12, fontWeight: '600', color: BRAND.secondary },

  // Safety Notice
  safetyCard: {
    padding: 14,
    marginVertical: 12,
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  safetyTitle: { fontSize: 14, fontWeight: '700', color: BRAND.primary, marginBottom: 4 },
  safetyText: { fontSize: 13, color: '#374151', lineHeight: 18 },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },

  // Loading
  loadingBox: { alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },

  // Empty
  emptyBox: { padding: 24, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  refreshBtn: { marginTop: 12, backgroundColor: BRAND.secondary, paddingHorizontal: 24, paddingVertical: 8, borderRadius: BORDER_RADIUS.sm },
  refreshText: { color: '#fff', fontWeight: '600' },

  // Request
  requestBtn: {
    backgroundColor: BRAND.secondary,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  requestBtnDisabled: { backgroundColor: '#9CA3AF' },
  requestBtnContent: { alignItems: 'center' },
  requestBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  requestSubText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
});
