// PoleSafe Mobile — Parent Profile Screen
// Account settings, PIN change, school info, ride history

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { COLORS } from '../theme';

export default function ParentProfile({ navigation }) {
  const [user, setUser] = useState(null);
  const [kids, setKids] = useState([]);
  const [rides, setRides] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [me, kidsRes, ridesRes, paysRes] = await Promise.all([
        fetch(`${API_BASE}/api/auth/me`, { headers }),
        fetch(`${API_BASE}/api/parents/kids`, { headers }),
        fetch(`${API_BASE}/api/parents/rides?limit=50`, { headers }),
        fetch(`${API_BASE}/api/payments`, { headers }).catch(() => ({ ok: false })),
      ]);

      const meData = await me.json();
      setUser(meData.user);

      const kData = await kidsRes.json();
      setKids(kData.kids || []);

      const rData = await ridesRes.json();
      setRides(rData.rides || []);

      if (paysRes.ok) {
        const pData = await paysRes.json();
        setPayments(pData.payments || []);
      }
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const changePin = async () => {
    Alert.prompt ? Alert.prompt('Change PIN', 'Enter new 4-digit PIN:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Change', onPress: async (newPin) => {
        if (!newPin || newPin.length < 4) return Alert.alert('PIN must be 4 digits');
        try {
          const token = await AsyncStorage.getItem('polesafe_token');
          const res = await fetch(`${API_BASE}/api/auth/change-pin`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPin }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          Alert.alert('✅ PIN changed successfully');
        } catch (err) {
          Alert.alert('Error', err.message);
        }
      }},
    ]) : Alert.alert('Change PIN', 'Use the settings screen to change your PIN');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  const pastRides = rides.filter(r => ['completed','cancelled','missed'].includes(r.status));
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Parent'}</Text>
        <Text style={styles.phone}>{user?.phone || ''}</Text>
        <TouchableOpacity style={styles.pinBtn} onPress={changePin}>
          <Text style={styles.pinBtnText}>🔑 Change PIN</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{rides.length}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{kids.length}</Text>
          <Text style={styles.statLabel}>Kids</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalPaid.toLocaleString()}</Text>
          <Text style={styles.statLabel}>UGX Paid</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['profile','kids','history','school'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'profile' ? '👤' : t === 'kids' ? '👦' : t === 'history' ? '📋' : '🏫'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <View style={styles.section}>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Name</Text><Text style={styles.infoValue}>{user?.name}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Phone</Text><Text style={styles.infoValue}>{user?.phone}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Role</Text><Text style={styles.infoValue}>{user?.role}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Member since</Text><Text style={styles.infoValue}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</Text></View>
        </View>
      )}

      {/* Kids Tab */}
      {tab === 'kids' && (
        <View style={styles.section}>
          {kids.length === 0 ? (
            <Text style={styles.empty}>No kids added yet</Text>
          ) : kids.map(k => (
            <View key={k._id} style={styles.kidRow}>
              <View>
                <Text style={styles.kidName}>{k.name}</Text>
                <Text style={styles.kidDetail}>{k.class} • {k.schoolName || k.schoolId || 'School'}</Text>
              </View>
              {k.pickupCode && <Text style={styles.kidCode}>🔐 {k.pickupCode}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <View style={styles.section}>
          {pastRides.length === 0 ? (
            <Text style={styles.empty}>No past rides yet</Text>
          ) : pastRides.slice(0, 20).map(r => (
            <View key={r._id} style={styles.rideRow}>
              <View style={styles.rideInfo}>
                <Text style={styles.rideChild}>{r.childId?.name || r.childName || 'Ride'}</Text>
                <Text style={styles.rideDate}>{r.scheduledPickupTime ? new Date(r.scheduledPickupTime).toLocaleString() : '-'}</Text>
              </View>
              <Text style={[styles.rideStatus, r.status === 'completed' && { color: '#2e7d32' }]}>
                {r.status === 'completed' ? '✅' : r.status === 'cancelled' ? '❌' : '😤'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* School Tab */}
      {tab === 'school' && (
        <View style={styles.section}>
          <Text style={styles.empty}>
            🏫 School info from your child's school will appear here.{'\n\n'}
            Contact times, gate location, head teacher details.
          </Text>
        </View>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Recent Payments</Text>
          {payments.slice(0, 5).map(p => (
            <View key={p._id} style={styles.payRow}>
              <Text style={styles.payRef}>{p.reference || p.transactionRef || 'Payment'}</Text>
              <Text style={[styles.payAmt, p.status === 'completed' && { color: '#2e7d32' }]}>
                {p.amount?.toLocaleString()} UGX {p.status === 'completed' ? '✅' : p.status === 'pending' ? '⏳' : '❌'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9ff' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#4361ee', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#333' },
  phone: { fontSize: 15, color: '#666', marginTop: 4 },
  pinBtn: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#f0f0f5', borderRadius: 8 },
  pinBtnText: { fontSize: 14, color: '#4361ee', fontWeight: '500' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 10, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: '#4361ee' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  tabs: { flexDirection: 'row', padding: 12, gap: 6 },
  tab: { flex: 1, paddingVertical: 8, backgroundColor: '#e8e8f0', borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#4361ee' },
  tabText: { fontSize: 12, fontWeight: '500', color: '#666' },
  tabTextActive: { color: '#fff' },
  section: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#333' },
  empty: { textAlign: 'center', padding: 32, color: '#999', fontSize: 14, lineHeight: 20 },
  kidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  kidName: { fontSize: 16, fontWeight: '500' },
  kidDetail: { fontSize: 13, color: '#888', marginTop: 2 },
  kidCode: { fontSize: 16, fontWeight: '700', color: '#ff9800' },
  rideRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rideInfo: { flex: 1 },
  rideChild: { fontSize: 14, fontWeight: '500' },
  rideDate: { fontSize: 12, color: '#999', marginTop: 2 },
  rideStatus: { fontSize: 18 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  payRef: { fontSize: 13, color: '#555', flex: 1 },
  payAmt: { fontSize: 13, fontWeight: '600' },
});
