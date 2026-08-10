// PoleSafe Mobile — Parent Dashboard
// Main home screen for parents showing weekly schedule, quick actions, and credits

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.polesafe.ug';

export default function ParentDashboard({ navigation }) {
  const [kids, setKids] = useState([]);
  const [rides, setRides] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState('school'); // 'school' | 'ride'
  const [customCodes, setCustomCodes] = useState({}); // Store custom code inputs per child

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [kidsRes, ridesRes, creditsRes] = await Promise.all([
        fetch(`${API_URL}/api/parents/kids`, { headers }),
        fetch(`${API_URL}/api/parents/rides?limit=10`, { headers }),
        fetch(`${API_URL}/api/credits`, { headers }),
      ]);

      const kidsData = await kidsRes.json();
      const ridesData = await ridesRes.json();
      const creditsData = await creditsRes.json();

      setKids(kidsData.kids || []);
      setRides(ridesData.rides || []);
      setCreditBalance(creditsData.balance || 0);
    } catch (err) {
      console.log('Error loading dashboard:', err);
    }
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  // Today's rides
  const today = new Date().toLocaleDateString('en-UG', { weekday: 'short' });
  const todayRides = rides.filter(r => {
    if (!r.scheduledPickupTime) return false;
    const rideDay = new Date(r.scheduledPickupTime).toLocaleDateString('en-UG', { weekday: 'short' });
    return rideDay === today;
  });

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'school' && styles.modeActive]}
          onPress={() => setMode('school')}
        >
          <Text style={[styles.modeText, mode === 'school' && styles.modeTextActive]}>🚸 School Mode</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'ride' && styles.modeActive]}
          onPress={() => {
            setMode('ride');
            navigation.navigate('RideHailing');
          }}
        >
          <Text style={[styles.modeText, mode === 'ride' && styles.modeTextActive]}>🚗 Ride Mode</Text>
        </TouchableOpacity>
      </View>

      {/* Credit Balance */}
      {creditBalance > 0 && (
        <TouchableOpacity style={styles.creditBanner} onPress={() => navigation.navigate('Credits')}>
          <Text style={styles.creditText}>💰 You have {creditBalance.toLocaleString()} UGX in credits</Text>
          <Text style={styles.creditSub}>Tap to use for next term or PoleSafe Ride</Text>
        </TouchableOpacity>
      )}

      {/* Kids Cards */}
      <Text style={styles.sectionTitle}>Your Kids</Text>
      {kids.map(kid => (
        <View key={kid._id} style={styles.kidCard}>
          <View style={styles.kidHeader}>
            <Text style={styles.kidName}>{kid.name}</Text>
            <Text style={styles.kidClass}>{kid.class}</Text>
          </View>

          {/* Pickup Word Section — Permanent word like "Mango", set once, kid remembers */}
          <View style={styles.codeSection}>
            <Text style={styles.codeTitle}>🔐 Pickup Word <Text style={styles.wordPermanent}>(Permanent)</Text></Text>
            <Text style={styles.codeHint}>
              One word your child will remember all term. The driver says this word at EVERY pickup. If they don't, your child doesn't get in.
            </Text>
            
            {kid.pickupCode ? (
              <View style={styles.currentCodeCard}>
                <Text style={styles.currentCodeLabel}>Pickup Word:</Text>
                <Text style={styles.currentCode}>{kid.pickupCode}</Text>
                <Text style={styles.codeInstruction}>
                  Tell your child: "The driver will say "{kid.pickupCode}" at pickup. If they don't say {kid.pickupCode}, don't get in." It's the same word every day so you won't forget!
                </Text>
              </View>
            ) : (
              <Text style={styles.noCode}>⚠️ No pickup word set yet</Text>
            )}

            <View style={styles.codeActions}>
              <TouchableOpacity 
                style={styles.randomCodeBtn} 
                onPress={async () => {
                  try {
                    const token = await AsyncStorage.getItem('polesafe_token');
                    const res = await fetch(`${API_URL}/api/safety/generate-pickup-word`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ childId: kid._id }),
                    });
                    const data = await res.json();
                    Alert.alert('🎲 Pickup Word Generated', `Your child's word is: ${data.word}\n\nTell ${kid.name}: \"The driver will say ${data.word}. If they don't, don't get in!\" This word stays the same every day.`);
                    loadData();
                  } catch (err) {
                    Alert.alert('Error', err.message);
                  }
                }}
              >
                <Text style={styles.btnText}>🎲 Random Word</Text>
              </TouchableOpacity>
              
              <View style={styles.customCodeRow}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="Custom word (e.g. Mango)"
                  placeholderTextColor="#aaa"
                  maxLength={16}
                  value={customCodes[kid._id] || ''}
                  onChangeText={(text) => setCustomCodes({...customCodes, [kid._id]: text})}
                />
                <TouchableOpacity 
                  style={styles.setCodeBtn} 
                  onPress={async () => {
                    const word = customCodes[kid._id];
                    if (!word || word.trim() === '') {
                      Alert.alert('Error', 'Please enter a word');
                      return;
                    }
                    try {
                      const token = await AsyncStorage.getItem('polesafe_token');
                      const res = await fetch(`${API_URL}/api/safety/set-pickup-word`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ childId: kid._id, word: word.trim() }),
                      });
                      const data = await res.json();
                      Alert.alert('✅ Word Set', `From now on, the driver will say "${word.trim()}" at every pickup. Tell ${kid.name} so they know!`);
                      setCustomCodes({...customCodes, [kid._id]: ''});
                      loadData();
                    } catch (err) {
                      Alert.alert('Error', err.message);
                    }
                  }}
                >
                  <Text style={styles.btnText}>Set Word</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Today's ride status */}
          {todayRides.filter(r => r.childId?._id === kid._id).length === 0 ? (
            <Text style={styles.noRide}>No rides scheduled today</Text>
          ) : todayRides.filter(r => r.childId?._id === kid._id).map(ride => (
            <View key={ride._id} style={styles.rideRow}>
              <Text style={styles.rideType}>
                {ride.type === 'school_morning' ? '🌅 Morning drop-off' : '🌇 Afternoon pickup'}
              </Text>
              <Text style={styles.rideStatus}>{getStatusEmoji(ride.status)} {ride.status.replace('_', ' ')}</Text>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('TrackRide', { rideId: ride._id })}
                >
                  <Text style={styles.actionText}>📍 Track</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('SickDay', { childId: kid._id, childName: kid.name })}
                >
                  <Text style={styles.actionText}>🩺 Sick</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('EarlyPickup', { childId: kid._id, childName: kid.name })}
                >
                  <Text style={styles.actionText}>🏃 Pick Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* Weekly Schedule */}
      <Text style={styles.sectionTitle}>This Week</Text>
      <View style={styles.weekGrid}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => {
          const dayRides = rides.filter(r => {
            if (!r.scheduledPickupTime) return false;
            return new Date(r.scheduledPickupTime).toLocaleDateString('en-UG', { weekday: 'short' }) === day;
          });
          const hasRide = dayRides.length > 0;
          const isToday = new Date().toLocaleDateString('en-UG', { weekday: 'short' }) === day;
          return (
            <View key={day} style={[styles.dayBox, isToday && styles.todayBox]}>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{day}</Text>
              <Text style={styles.dayStatus}>
                {hasRide ? '✅' : '—'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Book New Ride */}
      <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('Booking')}>
        <Text style={styles.bookBtnText}>+ Book New Ride</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getStatusEmoji(status) {
  const emojis = {
    scheduled: '⏳', en_route: '🚗', picked_up: '👧', dropped_off: '📍',
    gate_confirmed: '✅', cancelled: '❌', missed: '😤', completed: '✅',
    sick_day: '🩺',
  };
  return emojis[status] || '⏳';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderRadius: 12, marginBottom: 16, padding: 4 },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modeActive: { backgroundColor: '#2E7D32' },
  modeText: { fontSize: 14, fontWeight: '600', color: '#666' },
  modeTextActive: { color: '#fff' },
  creditBanner: { backgroundColor: '#FFF8E1', padding: 14, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FFB300' },
  creditText: { fontSize: 15, fontWeight: '600', color: '#333' },
  creditSub: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8, color: '#333' },
  kidCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  kidHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  kidName: { fontSize: 17, fontWeight: '600' },
  kidClass: { fontSize: 13, color: '#666', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  noRide: { color: '#999', fontSize: 13, fontStyle: 'italic' },
  rideRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  rideType: { fontSize: 14, fontWeight: '500' },
  rideStatus: { fontSize: 13, color: '#666', marginVertical: 4 },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionText: { fontSize: 13, fontWeight: '500' },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dayBox: { flex: 1, backgroundColor: '#fff', padding: 12, marginHorizontal: 2, borderRadius: 8, alignItems: 'center', elevation: 1 },
  todayBox: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#2E7D32' },
  dayLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  todayLabel: { color: '#2E7D32' },
  dayStatus: { fontSize: 18, marginTop: 6 },
  bookBtn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Pickup Code Section
  codeSection: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#FF9800' },
  codeTitle: { fontSize: 14, fontWeight: '700', color: '#E65100', marginBottom: 4 },
  codeHint: { fontSize: 11, color: '#666', marginBottom: 8, lineHeight: 16 },
  currentCodeCard: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#FFB300' },
  currentCodeLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  currentCode: { fontSize: 24, fontWeight: '800', color: '#E65100', marginBottom: 6 },
  codeInstruction: { fontSize: 11, color: '#555', lineHeight: 15, fontStyle: 'italic' },
  noCode: { fontSize: 12, color: '#999', marginBottom: 8, fontStyle: 'italic' },
  codeActions: { gap: 6 },
  randomCodeBtn: { backgroundColor: '#FF9800', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  customCodeRow: { flexDirection: 'row', gap: 6 },
  codeInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  setCodeBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
