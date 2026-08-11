// PoleSafe Mobile — Multi-Kid Dashboard
// Shows ALL kids' rides for today in one view

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import API_BASE from '../config';

const STATUS_COLORS = {
  pending: { bg: '#FFF3E0', text: '#E65100', icon: '⏳' },
  confirmed: { bg: '#E3F2FD', text: '#1565C0', icon: '✅' },
  picked_up: { bg: '#E8F5E9', text: '#2E7D32', icon: '🚗' },
  at_school: { bg: '#F3E5F5', text: '#7B1FA2', icon: '🏫' },
  returning: { bg: '#E8F5E9', text: '#2E7D32', icon: '🏠' },
  delivered: { bg: '#E8F5E9', text: '#1B5E20', icon: '✅' },
  cancelled: { bg: '#FFEBEE', text: '#C62828', icon: '❌' },
};

export default function MultiKidDashboard({ navigation }) {
  const [rides, setRides] = useState([]);
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      
      // Fetch kids
      const kidsRes = await fetch(`${API_BASE}/api/parents/kids`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const kidsData = await kidsRes.json();
      setKids(kidsData.kids || []);
      
      // Fetch rides (today + upcoming)
      const ridesRes = await fetch(`${API_BASE}/api/parents/rides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ridesData = await ridesRes.json();
      
      // Only show today's active rides
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const activeRides = (ridesData.rides || ridesData || []).filter(r => {
        const rideDate = r.scheduledDate || (r.createdAt ? r.createdAt.split('T')[0] : '');
        return rideDate === todayStr || !rideDate;
      });
      
      setRides(activeRides);
    } catch (e) {
      console.error('Failed to fetch dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchAll();
  }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const getKidName = (childId) => {
    const kid = kids.find(k => k._id === childId || k.id === childId);
    return kid?.name || 'Unknown';
  };

  const getStatusStyle = (status) => {
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    // Handle both HH:MM and "7:00 AM" formats
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  // Group rides by kid
  const ridesByKid = {};
  rides.forEach(ride => {
    const kidName = getKidName(ride.childId || ride.child);
    if (!ridesByKid[kidName]) ridesByKid[kidName] = [];
    ridesByKid[kidName].push(ride);
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const totalKids = kids.length;
  const activeCount = rides.filter(r => !['cancelled', 'delivered'].includes(r.status)).length;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />}
    >
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.summaryNumber}>{totalKids}</Text>
          <Text style={styles.summaryLabel}>Kids</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.summaryNumber}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active Rides</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={styles.summaryNumber}>{rides.length}</Text>
          <Text style={styles.summaryLabel}>Today's Rides</Text>
        </View>
      </View>

      {/* Each Kid's Rides */}
      {Object.keys(ridesByKid).length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚸</Text>
          <Text style={styles.emptyTitle}>No rides today</Text>
          <Text style={styles.emptySubtitle}>Book a ride or register a child to get started</Text>
          <TouchableOpacity 
            style={styles.bookBtn}
            onPress={() => navigation.navigate('Booking')}
          >
            <Text style={styles.bookBtnText}>📅 Book a Ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        Object.entries(ridesByKid).map(([kidName, kidRides]) => (
          <View key={kidName} style={styles.kidSection}>
            <View style={styles.kidHeader}>
              <Text style={styles.kidName}>👦 {kidName}</Text>
              <Text style={styles.kidRideCount}>{kidRides.length} ride{kidRides.length > 1 ? 's' : ''}</Text>
            </View>
            
            {kidRides.map((ride) => {
              const statusStyle = getStatusStyle(ride.status);
              return (
                <View key={ride._id} style={styles.rideCard}>
                  <View style={styles.rideTop}>
                    <Text style={[styles.rideStatus, { backgroundColor: statusStyle.bg, color: statusStyle.text }]}>
                      {statusStyle.icon} {ride.status?.replace('_', ' ')}
                    </Text>
                    <Text style={styles.rideTime}>{formatTime(ride.scheduledPickupTime || ride.time)}</Text>
                  </View>
                  
                  <View style={styles.rideDetails}>
                    <Text style={styles.rideType}>
                      {ride.type === 'school_morning' ? '🚸 Morning' :
                       ride.type === 'school_afternoon' ? '🚸 Afternoon' : '🚗 Ride'}
                    </Text>
                    <Text style={styles.rideLocation}>
                      📍 {ride.pickupLocation || 'Home'}
                      {ride.dropoffLocation ? ` → ${ride.dropoffLocation}` : ' → School'}
                    </Text>
                    {ride.driverName && (
                      <Text style={styles.rideDriver}>🚗 Driver: {ride.driverName}</Text>
                    )}
                  </View>

                  <View style={styles.rideActions}>
                    <TouchableOpacity 
                      style={styles.trackBtn}
                      onPress={() => navigation.navigate('TrackRide', { rideId: ride._id })}
                    >
                      <Text style={styles.trackBtnText}>📍 Track</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.cancelBtn}
                      onPress={() => {
                        Alert.alert('Cancel Ride?', `Cancel ride for ${kidName} at ${formatTime(ride.scheduledPickupTime || ride.time)}?`, [
                          { text: 'No', style: 'cancel' },
                          { text: 'Yes, Cancel', style: 'destructive', onPress: () => handleCancel(ride._id, kidName) },
                        ]);
                      }}
                    >
                      <Text style={styles.cancelBtnText}>✕ Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ))
      )}
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  async function handleCancel(rideId, kidName) {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/rides/${rideId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'parent_requested' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('✅ Cancelled', `Ride for ${kidName} has been cancelled.`);
      fetchAll();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 8, color: '#666', fontSize: 14 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  summaryNumber: { fontSize: 28, fontWeight: '700', color: '#333' },
  summaryLabel: { fontSize: 11, color: '#666', marginTop: 2, fontWeight: '500' },
  kidSection: { marginBottom: 16 },
  kidHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, paddingHorizontal: 4,
  },
  kidName: { fontSize: 17, fontWeight: '700', color: '#333' },
  kidRideCount: { fontSize: 12, color: '#888' },
  rideCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  rideTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rideStatus: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  rideTime: { fontSize: 14, fontWeight: '600', color: '#333' },
  rideDetails: { marginBottom: 10 },
  rideType: { fontSize: 13, color: '#555', marginBottom: 2 },
  rideLocation: { fontSize: 12, color: '#888', marginBottom: 2 },
  rideDriver: { fontSize: 12, color: '#1565C0' },
  rideActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  trackBtn: { flex: 1, backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8, alignItems: 'center' },
  trackBtnText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  cancelBtn: { flex: 1, backgroundColor: '#FFEBEE', padding: 10, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#C62828' },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  bookBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
