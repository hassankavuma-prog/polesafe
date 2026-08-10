// PoleSafe Mobile — Parent Booking Screen
// Clean, simple booking flow for parents

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { COLORS } from '../theme';

const DAYS = ['Mon','Tue','Wed','Thu','Fri'];
const TIMES = ['6:30 AM','7:00 AM','7:30 AM','8:00 AM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM'];

export default function ParentBooking({ navigation, route }) {
  const prefill = route?.params?.prefill || {};
  const [kids, setKids] = useState([]);
  const [selectedKid, setSelectedKid] = useState(null);
  const [mode, setMode] = useState('school');
  const [days, setDays] = useState([]);
  const [time, setTime] = useState(prefill.time || '7:00 AM');
  const [pickup, setPickup] = useState(prefill.pickupLocation || '');
  const [dropoff, setDropoff] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('polesafe_token');
        const res = await fetch(`${API_BASE}/api/parents/kids`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setKids(data.kids || []);

        // Pre-select kid if Hamna suggested one
        if (prefill.childName) {
          const match = (data.kids || []).find(k =>
            k.name.toLowerCase().includes(prefill.childName.toLowerCase())
          );
          if (match) setSelectedKid(match._id);
        }
      } catch (err) {
        console.error('Failed to load kids:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleDay = (day) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const submit = async () => {
    if (!selectedKid) return Alert.alert('Select a child');
    if (mode === 'school' && days.length === 0) return Alert.alert('Select at least one day');
    if (!time) return Alert.alert('Select a time');

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const body = {
        childId: selectedKid,
        type: mode === 'school' ? (time.includes('AM') ? 'school_morning' : 'school_afternoon') : 'pole_safe_ride',
        days: mode === 'school' ? days : [],
        scheduledPickupTime: time,
        pickupLocation: pickup || 'Home',
        dropoffLocation: dropoff || undefined,
      };

      const res = await fetch(`${API_BASE}/api/parents/book`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Alert.alert('✅ Booked!', data.message || 'Ride booked successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Book a Ride</Text>

      {/* Select Kid */}
      <Text style={styles.label}>👦 Child</Text>
      <View style={styles.chipRow}>
        {kids.map(k => (
          <TouchableOpacity
            key={k._id}
            style={[styles.chip, selectedKid === k._id && styles.chipActive]}
            onPress={() => setSelectedKid(k._id)}
          >
            <Text style={[styles.chipText, selectedKid === k._id && styles.chipTextActive]}>{k.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mode */}
      <Text style={styles.label}>📋 Type</Text>
      <View style={styles.chipRow}>
        <TouchableOpacity style={[styles.chip, mode === 'school' && styles.chipActive]} onPress={() => setMode('school')}>
          <Text style={[styles.chipText, mode === 'school' && styles.chipTextActive]}>🚸 School</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chip, mode === 'ride' && styles.chipActive]} onPress={() => setMode('ride')}>
          <Text style={[styles.chipText, mode === 'ride' && styles.chipTextActive]}>🚗 Ride</Text>
        </TouchableOpacity>
      </View>

      {/* Days (school mode only) */}
      {mode === 'school' && (
        <>
          <Text style={styles.label}>📅 Days</Text>
          <View style={styles.chipRow}>
            {DAYS.map(d => (
              <TouchableOpacity key={d} style={[styles.dayChip, days.includes(d) && styles.chipActive]} onPress={() => toggleDay(d)}>
                <Text style={[styles.dayChipText, days.includes(d) && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Time */}
      <Text style={styles.label}>⏰ Time</Text>
      <View style={styles.chipRow}>
        {TIMES.map(t => (
          <TouchableOpacity key={t} style={[styles.chip, time === t && styles.chipActive]} onPress={() => setTime(t)}>
            <Text style={[styles.chipText, time === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pickup / Dropoff */}
      <Text style={styles.label}>📍 Pickup Location</Text>
      <TextInput style={styles.input} value={pickup} onChangeText={setPickup} placeholder="e.g. Home, 123 Main St" placeholderTextColor="#999" />

      {mode === 'ride' && (
        <>
          <Text style={styles.label}>📍 Dropoff</Text>
          <TextInput style={styles.input} value={dropoff} onChangeText={setDropoff} placeholder="e.g. St. Mary's School" placeholderTextColor="#999" />
        </>
      )}

      {/* Submit */}
      <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Booking...' : 'Confirm Booking'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9ff' },
  title: { fontSize: 24, fontWeight: '700', color: '#4361ee', marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: '#555', marginBottom: 10, marginTop: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 10, borderWidth: 2, borderColor: '#e0e0eb' },
  chipActive: { borderColor: '#4361ee', backgroundColor: '#eef0ff' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextActive: { color: '#4361ee', fontWeight: '600' },
  dayChip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 10, borderWidth: 2, borderColor: '#e0e0eb' },
  dayChipText: { fontSize: 13, color: '#666' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 15, borderWidth: 2, borderColor: '#e0e0eb', color: '#333' },
  submitBtn: { backgroundColor: '#4361ee', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
