// PoleSafe Mobile — Ride Hailing Screen
// On-demand ride booking (PoleSafe Ride)

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';

const VEHICLE_TYPES = [
  { id: 'car', emoji: '🚗', label: 'Car', desc: '4 seats, A/C', pricePerKm: 2500 },
  { id: 'boda', emoji: '🏍️', label: 'Boda', desc: '1 passenger, fast', pricePerKm: 1500 },
  { id: 'tuk-tuk', emoji: '🛺', label: 'Tuk-Tuk', desc: '3 seats, open', pricePerKm: 2000 },
];

const SAVED_PLACES = [
  { id: '1', name: 'Home', address: 'Plot 42, Acacia Avenue, Kampala', emoji: '🏠' },
  { id: '2', name: 'St Mary\'s School', address: 'Entebbe Road, Kampala', emoji: '🏫' },
  { id: '3', name: 'Work', address: '5th Street, Industrial Area, Kampala', emoji: '🏢' },
  { id: '4', name: 'Shoprite', address: 'Oasis Mall, Kampala', emoji: '🛒' },
];

export default function RideHailing({ navigation }) {
  const theme = getTheme();
  const [searchText, setSearchText] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [pickupPlace, setPickupPlace] = useState(null);
  const [dropoffPlace, setDropoffPlace] = useState(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/rides/drivers?vehicleType=${selectedVehicle}`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setAvailableDrivers(data.drivers || []);
      } else {
        // Demo data
        setAvailableDrivers([
          { _id: 'd1', name: 'John Mugisha', rating: 4.9, vehicle: 'Toyota Corolla', plate: 'UBA 123K', distance: '0.8 km', price: 5000, eta: 4, available: true },
          { _id: 'd2', name: 'Sarah Nakato', rating: 4.8, vehicle: 'Honda Fit', plate: 'UBB 456L', distance: '1.2 km', price: 6500, eta: 6, available: true },
          { _id: 'd3', name: 'Peter Okello', rating: 4.7, vehicle: 'Suzuki Swift', plate: 'UBC 789M', distance: '2.5 km', price: 8000, eta: 10, available: true },
          { _id: 'd4', name: 'Grace Achieng', rating: 4.6, vehicle: 'Boda Boda', plate: 'UBD 012N', distance: '0.5 km', price: 3500, eta: 3, available: true },
        ]);
      }
    } catch (err) {
      console.log('Error loading drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDrivers();
    setRefreshing(false);
  };

  const handleRequestRide = () => {
    const driver = selectedDriver
      ? availableDrivers.find(d => d._id === selectedDriver)
      : availableDrivers[0];

    if (!driver) {
      Alert.alert('No Driver', 'No available drivers. Please try again.');
      return;
    }

    if (!pickupPlace && !dropoffPlace && !searchText.trim()) {
      Alert.alert('Where To?', 'Please enter a destination.');
      return;
    }

    const destination = dropoffPlace?.address || searchText || 'Kampala';
    const pickup = pickupPlace?.address || 'Current Location';

    Alert.alert(
      'Confirm Ride',
      `From: ${pickup}\nTo: ${destination}\nVehicle: ${VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.emoji} ${selectedVehicle}\nDriver: ${driver.name}\nEst. Fare: ${formatCurrency(driver.price || 5000)} UGX`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Ride 🚗',
          onPress: async () => {
            setRequesting(true);
            try {
              const token = await AsyncStorage.getItem('polesafe_token');
              const res = await fetch(`${API_BASE}/api/rides/request`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  driverId: driver._id,
                  vehicleType: selectedVehicle,
                  pickupLocation: pickup,
                  dropoffLocation: destination,
                  estimatedFare: driver.price || 5000,
                }),
              });

              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Request failed');
              }

              Alert.alert(
                'Ride Requested 🚗',
                `${driver.name} is on the way! ETA: ~${driver.eta || 5} min`,
                [
                  { text: 'Track Ride', onPress: () => navigation.navigate('TrackRide', { rideId: 'new_ride' }) },
                  { text: 'OK' },
                ]
              );

              // Reset
              setSearchText('');
              setPickupPlace(null);
              setDropoffPlace(null);
              setSelectedDriver(null);
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

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('en-UG');
  };

  const filteredDrivers = availableDrivers.filter(d =>
    d.available !== false && d.vehicleType !== 'boda' || selectedVehicle === 'boda'
  );

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.canvas}]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Where to?"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
      </View>

      {/* Saved Places */}
      {!searchText && (
        <View style={styles.savedPlaces}>
          <Text style={styles.savedTitle}>Saved Places</Text>
          {SAVED_PLACES.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.placeRow}
              onPress={() => {
                setDropoffPlace(place);
                setSearchText(place.name);
              }}
            >
              <View style={styles.placeIcon}>
                <Text style={styles.placeEmoji}>{place.emoji}</Text>
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeAddress}>{place.address}</Text>
              </View>
              <Text style={styles.placeArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Vehicle Type Selector */}
      <Text style={styles.sectionTitle}>🚗 Select Vehicle</Text>
      <View style={styles.vehicleRow}>
        {VEHICLE_TYPES.map((v) => (
          <TouchableOpacity
            key={v.id}
            style={[
              styles.vehicleBtn,
              selectedVehicle === v.id && styles.vehicleBtnSelected,
            ]}
            onPress={() => {
              setSelectedVehicle(v.id);
              setSelectedDriver(null);
            }}
          >
            <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
            <Text style={[
              styles.vehicleLabel,
              selectedVehicle === v.id && styles.vehicleLabelSelected,
            ]}>
              {v.label}
            </Text>
            <Text style={styles.vehicleDesc}>{v.desc}</Text>
            <Text style={styles.vehiclePrice}>
              ~{formatCurrency(v.pricePerKm)}/km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Available Drivers */}
      <Text style={styles.sectionTitle}>
        👤 Available Drivers {filteredDrivers.length > 0 ? `(${filteredDrivers.length})` : ''}
      </Text>

      {loading ? (
        <ActivityIndicator color="#2E7D32" style={{ marginVertical: 20 }} />
      ) : filteredDrivers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🚗</Text>
          <Text style={styles.emptyText}>No drivers available nearby</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadDrivers}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        filteredDrivers.map((driver) => (
          <TouchableOpacity
            key={driver._id}
            style={[
              styles.driverCard,
              selectedDriver === driver._id && styles.driverCardSelected,
            ]}
            onPress={() => setSelectedDriver(driver._id)}
          >
            <View style={styles.driverRow}>
              {/* Avatar */}
              <View style={[styles.driverAvatar, { backgroundColor: selectedDriver === driver._id ? COLORS.green : COLORS.blue }]}>
                <Text style={styles.driverAvatarText}>
                  {(driver.name || 'D').charAt(0)}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <View style={styles.driverMeta}>
                  <Text style={styles.driverRating}>⭐ {driver.rating || '4.5'}</Text>
                  <Text style={styles.driverDistance}>📍 {driver.distance || '~1 km'}</Text>
                </View>
                <Text style={styles.driverVehicle}>
                  {driver.vehicle || driver.vehicleType || 'Vehicle'} • {driver.plate || ''}
                </Text>
              </View>

              {/* Price */}
              <View style={styles.driverPriceBox}>
                <Text style={styles.driverPrice}>
                  {formatCurrency(driver.price || 5000)}
                </Text>
                <Text style={styles.driverPriceLabel}>UGX</Text>
                {driver.eta && (
                  <Text style={styles.driverEta}>{driver.eta} min</Text>
                )}
              </View>
            </View>

            {selectedDriver === driver._id && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>✅ Selected</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}

      {/* Request Ride */}
      <TouchableOpacity
        style={[styles.requestBtn, requesting && styles.btnDisabled]}
        onPress={handleRequestRide}
        disabled={requesting || filteredDrivers.length === 0}
      >
        {requesting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.requestBtnText}>
            🚗 Request Ride
            {selectedDriver
              ? ` with ${availableDrivers.find(d => d._id === selectedDriver)?.name || ''}`
              : ''}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas, padding: 16 },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, elevation: 2,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 16, fontSize: 16, color: COLORS.textPrimary },

  // Saved Places
  savedPlaces: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 14, elevation: 1 },
  savedTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, padding: 14, paddingBottom: 8, textTransform: 'uppercase' },
  placeRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  placeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.greenBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  placeEmoji: { fontSize: 18 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  placeAddress: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  placeArrow: { fontSize: 24, color: '#ccc' },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10, marginTop: 4 },

  // Vehicles
  vehicleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  vehicleBtn: {
    flex: 1, padding: 12, borderRadius: 12, backgroundColor: COLORS.surface,
    alignItems: 'center', borderWidth: 2, borderColor: '#eee', elevation: 1,
  },
  vehicleBtnSelected: { borderColor: COLORS.green, backgroundColor: COLORS.greenBg },
  vehicleEmoji: { fontSize: 28, marginBottom: 4 },
  vehicleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  vehicleLabelSelected: { color: COLORS.green },
  vehicleDesc: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  vehiclePrice: { fontSize: 11, color: COLORS.green, fontWeight: '600', marginTop: 4 },

  // Empty
  emptyCard: { alignItems: 'center', padding: 24, backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 16 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
  retryBtn: { backgroundColor: COLORS.green, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },

  // Driver Card
  driverCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  driverCardSelected: { borderWidth: 2, borderColor: COLORS.green },
  driverRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  driverAvatarText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  driverMeta: { flexDirection: 'row', gap: 12, marginTop: 2 },
  driverRating: { fontSize: 12, color: '#F57C00', fontWeight: '500' },
  driverDistance: { fontSize: 12, color: COLORS.textSecondary },
  driverVehicle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  driverPriceBox: { alignItems: 'center', marginLeft: 8 },
  driverPrice: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  driverPriceLabel: { fontSize: 10, color: COLORS.textMuted },
  driverEta: { fontSize: 11, color: COLORS.green, fontWeight: '600', marginTop: 2 },
  selectedBadge: { marginTop: 8, alignItems: 'center' },
  selectedBadgeText: { fontSize: 12, color: COLORS.green, fontWeight: '600' },

  // Request
  requestBtn: { backgroundColor: COLORS.green, padding: 18, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnDisabled: { opacity: 0.5 },
  requestBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
