// PoleSafe Mobile — Parent Booking Screen
// Weekly booking calendar with day, time, kid, vehicle, and school selectors

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const VEHICLE_TYPES = [
  { id: 'car', label: '🚗 Car', desc: 'Private car' },
  { id: 'boda', label: '🏍️ Boda', desc: 'Motorcycle taxi' },
];

export default function ParentBooking({ navigation }) {
  const theme = getTheme();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kids, setKids] = useState([]);
  const [schools, setSchools] = useState([]);

  // Form state
  const [selectedDays, setSelectedDays] = useState([]);
  const [pickupTime, setPickupTime] = useState('07:00');
  const [dropoffTime, setDropoffTime] = useState('16:00');
  const [selectedKid, setSelectedKid] = useState(null);
  const [vehicleType, setVehicleType] = useState('car');
  const [selectedSchool, setSelectedSchool] = useState(null);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [kidsRes, schoolsRes] = await Promise.all([
        fetch(`${API_BASE}/api/parents/kids`, { headers }),
        fetch(`${API_BASE}/api/schools`, { headers }),
      ]);

      const kidsData = await kidsRes.json();
      const schoolsData = await schoolsRes.json();

      setKids(kidsData.kids || []);
      setSchools(schoolsData.schools || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load booking options');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const isFormValid = () => {
    if (selectedDays.length === 0) return false;
    if (!selectedKid) return false;
    if (!selectedSchool) return false;
    return true;
  };

  const handleBook = async () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete', 'Please select days, a kid, and a school.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/parents/book`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: selectedKid,
          daysOfWeek: selectedDays,
          pickupTime: `${pickupTime}:00`,
          dropoffTime: `${dropoffTime}:00`,
          vehicleType,
          schoolId: selectedSchool,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Booking failed');
      }

      Alert.alert(
        'Booking Confirmed! 🎉',
        `Ride booked for ${selectedDays.join(', ')} at ${pickupTime}.`,
        [
          { text: 'View Rides', onPress: () => navigation.navigate('Home') },
          { text: 'OK' },
        ]
      );

      // Reset form
      setSelectedDays([]);
      setSelectedKid(null);
      setSelectedSchool(null);
    } catch (err) {
      Alert.alert('Error', err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Time helpers
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 6).padStart(2, '0'));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading booking options...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Day Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Select Days</Text>
        <Text style={styles.sectionSub}>Choose which days this ride repeats</Text>
        <View style={styles.dayGrid}>
          {WEEKDAYS.map((day) => {
            const isSelected = selectedDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedDays.length > 0 && (
          <Text style={styles.dayCount}>
            {selectedDays.length} day{selectedDays.length > 1 ? 's' : ''} selected
          </Text>
        )}
      </View>

      {/* Pickup Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌅 Pickup Time (Morning)</Text>
        <View style={styles.timeRow}>
          <TouchableOpacity
            style={styles.timeArrow}
            onPress={() => setPickupTime((p) => {
              const h = parseInt(p.split(':')[0]);
              return `${String(Math.max(5, h - 1)).padStart(2, '0')}:00`;
            })}
          >
            <Text style={styles.timeArrowText}>−</Text>
          </TouchableOpacity>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{pickupTime}</Text>
          </View>
          <TouchableOpacity
            style={styles.timeArrow}
            onPress={() => setPickupTime((p) => {
              const h = parseInt(p.split(':')[0]);
              return `${String(Math.min(10, h + 1)).padStart(2, '0')}:00`;
            })}
          >
            <Text style={styles.timeArrowText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropoff Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌇 Dropoff Time (Afternoon)</Text>
        <View style={styles.timeRow}>
          <TouchableOpacity
            style={styles.timeArrow}
            onPress={() => setDropoffTime((p) => {
              const h = parseInt(p.split(':')[0]);
              return `${String(Math.max(12, h - 1)).padStart(2, '0')}:00`;
            })}
          >
            <Text style={styles.timeArrowText}>−</Text>
          </TouchableOpacity>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{dropoffTime}</Text>
          </View>
          <TouchableOpacity
            style={styles.timeArrow}
            onPress={() => setDropoffTime((p) => {
              const h = parseInt(p.split(':')[0]);
              return `${String(Math.min(18, h + 1)).padStart(2, '0')}:00`;
            })}
          >
            <Text style={styles.timeArrowText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Kid Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👦 Select Kid</Text>
        {kids.length === 0 ? (
          <View>
            <Text style={styles.emptyText}>No kids registered yet</Text>
            <TouchableOpacity
              style={styles.addKidBtn}
              onPress={() => {
                Alert.alert(
                  'Add Child',
                  'To add a child, please navigate to the Add Child screen or contact your school admin.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.addKidBtnText}>➕ Add Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          kids.map((kid) => (
            <TouchableOpacity
              key={kid._id}
              style={[
                styles.optionRow,
                selectedKid === kid._id && styles.optionRowSelected,
              ]}
              onPress={() => setSelectedKid(kid._id)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionName}>{kid.name}</Text>
                <Text style={styles.optionSub}>{kid.class || 'Class not set'}</Text>
              </View>
              {selectedKid === kid._id && (
                <Text style={styles.checkMark}>✅</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Vehicle Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚗 Vehicle Type</Text>
        <View style={styles.vehicleRow}>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[
                styles.vehicleBtn,
                vehicleType === v.id && styles.vehicleBtnSelected,
              ]}
              onPress={() => setVehicleType(v.id)}
            >
              <Text style={[
                styles.vehicleLabel,
                vehicleType === v.id && styles.vehicleLabelSelected,
              ]}>
                {v.label}
              </Text>
              <Text style={[
                styles.vehicleDesc,
                vehicleType === v.id && styles.vehicleDescSelected,
              ]}>
                {v.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* School Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏫 School</Text>
        {schools.length === 0 ? (
          <Text style={styles.emptyText}>No schools available</Text>
        ) : (
          schools.map((school) => (
            <TouchableOpacity
              key={school._id}
              style={[
                styles.optionRow,
                selectedSchool === school._id && styles.optionRowSelected,
              ]}
              onPress={() => setSelectedSchool(school._id)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionName}>{school.name}</Text>
                <Text style={styles.optionSub}>{school.location || ''}</Text>
              </View>
              {selectedSchool === school._id && (
                <Text style={styles.checkMark}>✅</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Price Estimate */}
      {isFormValid() && selectedDays.length > 0 && (
        <View style={styles.priceCard}>
          <Text style={styles.priceTitle}>💰 Estimated Cost</Text>
          <Text style={styles.pricePerTrip}>~5,000 UGX per trip</Text>
          <Text style={styles.priceTotal}>
            Total: {(selectedDays.length * 5000).toLocaleString('en-UG')} UGX per week
          </Text>
          <Text style={styles.priceNote}>
            Final price will be confirmed after booking
          </Text>
        </View>
      )}

      {/* Review & Book */}
      <TouchableOpacity
        style={[styles.bookBtn, !isFormValid() && styles.btnDisabled]}
        onPress={handleBook}
        disabled={submitting || !isFormValid()}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.bookBtnText}>📋 Review & Book</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.canvas },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14 },
  section: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  dayGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayBtn: {
    flex: 1, marginHorizontal: 3, paddingVertical: 14, borderRadius: 10,
    backgroundColor: '#f0f0f0', alignItems: 'center',
  },
  dayBtnSelected: { backgroundColor: COLORS.green },
  dayText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  dayTextSelected: { color: '#fff' },
  dayCount: { fontSize: 12, color: COLORS.green, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 8 },
  timeArrow: { backgroundColor: '#f0f0f0', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  timeArrowText: { fontSize: 24, fontWeight: '600', color: COLORS.green },
  timeDisplay: { backgroundColor: COLORS.greenBg, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  timeText: { fontSize: 28, fontWeight: '700', color: COLORS.green },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, marginBottom: 6, backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: '#eee' },
  optionRowSelected: { borderColor: COLORS.green, backgroundColor: COLORS.greenBg },
  optionInfo: { flex: 1 },
  optionName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  optionSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  checkMark: { fontSize: 18 },
  vehicleRow: { flexDirection: 'row', gap: 12 },
  vehicleBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  vehicleBtnSelected: { borderColor: COLORS.green, backgroundColor: COLORS.greenBg },
  vehicleLabel: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  vehicleLabelSelected: { color: COLORS.green },
  vehicleDesc: { fontSize: 11, color: COLORS.textMuted },
  vehicleDescSelected: { color: COLORS.textSecondary },
  emptyText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', paddingVertical: 8, textAlign: 'center' },
  addKidBtn: { backgroundColor: COLORS.green, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  addKidBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  priceCard: { backgroundColor: COLORS.orangeBg, borderRadius: 12, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  priceTitle: { fontSize: 14, fontWeight: '600', color: COLORS.orange, marginBottom: 8 },
  pricePerTrip: { fontSize: 15, color: COLORS.textPrimary, marginBottom: 4 },
  priceTotal: { fontSize: 18, fontWeight: '700', color: COLORS.green, marginBottom: 6 },
  priceNote: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },
  bookBtn: { backgroundColor: COLORS.green, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  bookBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
