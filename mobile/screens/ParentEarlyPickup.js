// PoleSafe Mobile — Parent Early Pickup Screen
// Options for early pickup: self-pickup, send driver, or keep at school

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';

export default function ParentEarlyPickup({ navigation, route }) {
  const childId = route?.params?.childId;
  const childName = route?.params?.childName || 'your child';
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadTodayRide();
  }, []);

  const loadTodayRide = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      if (!childId) { setLoading(false); return; }

      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/parents/rides?limit=5`, { headers });

      if (res.ok) {
        const data = await res.json();
        const rides = data.rides || [];
        // Find today's afternoon ride (pickup)
        const today = new Date().toISOString().split('T')[0];
        const todayRide = rides.find(r => {
          const childMatch = r.childId?._id === childId || r.childId === childId;
          const rideDate = r.scheduledPickupTime?.startsWith(today);
          const isAfternoon = r.type === 'afternoon' || r.type === 'school_afternoon';
          return childMatch && rideDate && isAfternoon;
        });
        setRide(todayRide);
      }
    } catch (err) {
      console.log('Error loading ride:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickUpNow = async () => {
    Alert.alert(
      'Pick Up Now',
      `This will cancel ${childName}'s afternoon ride. The driver will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Pickup',
          style: 'destructive',
          onPress: async () => {
            if (!ride?._id) {
              Alert.alert('No Ride', 'No active afternoon ride found for today.');
              return;
            }
            setActionLoading('pickup');
            try {
              const token = await AsyncStorage.getItem('polesafe_token');
              const res = await fetch(`${API_BASE}/api/rides/${ride._id}/cancel`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'early_pickup_parent' }),
              });
              if (!res.ok) throw new Error('Failed to cancel ride');
              Alert.alert('Done ✅', `Afternoon ride cancelled. You'll pick up ${childName} yourself.`);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleSendDriver = async () => {
    Alert.alert(
      '🚗 Send PoleSafe Driver',
      'An available driver will be dispatched for an emergency pickup of your child. Extra charges may apply.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Driver',
          onPress: async () => {
            setActionLoading('driver');
            try {
              const token = await AsyncStorage.getItem('polesafe_token');
              const res = await fetch(`${API_BASE}/api/parents/emergency-pickup`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ childId }),
              });
              if (!res.ok) throw new Error('Failed to request pickup');
              Alert.alert('Driver Dispatched 🚗', 'A driver is on their way to the school for emergency pickup.');
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleKeepAtSchool = () => {
    Alert.alert(
      'Keep at School',
      `${childName} will continue with the normal afternoon pickup. No changes made.`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {(childName || '?').charAt(0)}
          </Text>
        </View>
        <Text style={styles.headerTitle}>{childName}</Text>
        <Text style={styles.headerSub}>Early Pickup Options</Text>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Choose an option for {childName}'s afternoon pickup.
          {ride
            ? ` A ride is scheduled for today.`
            : ` No afternoon ride found for today.`}
        </Text>
      </View>

      {/* Option 1: Pick Up Now */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={handlePickUpNow}
        disabled={actionLoading !== null}
      >
        <View style={styles.optionIconWrap}>
          <Text style={styles.optionIcon}>🏃</Text>
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>I'll Pick Up Now</Text>
          <Text style={styles.optionDesc}>
            Cancel afternoon ride — you'll collect your child
          </Text>
          {ride && (
            <Text style={styles.optionEffect}>
              ⚠️ Current afternoon ride will be cancelled
            </Text>
          )}
        </View>
        {actionLoading === 'pickup' ? (
          <ActivityIndicator color="#2E7D32" />
        ) : (
          <Text style={styles.optionArrow}>→</Text>
        )}
      </TouchableOpacity>

      {/* Option 2: Send Driver */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={handleSendDriver}
        disabled={actionLoading !== null}
      >
        <View style={[styles.optionIconWrap, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.optionIcon}>🚗</Text>
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Send PoleSafe Driver</Text>
          <Text style={styles.optionDesc}>
            Emergency dispatch — driver picks up instead
          </Text>
          <Text style={styles.optionEffect}>
            💰 Extra charges may apply
          </Text>
        </View>
        {actionLoading === 'driver' ? (
          <ActivityIndicator color="#1565C0" />
        ) : (
          <Text style={styles.optionArrow}>→</Text>
        )}
      </TouchableOpacity>

      {/* Option 3: Keep at School */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={handleKeepAtSchool}
        disabled={actionLoading !== null}
      >
        <View style={[styles.optionIconWrap, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.optionIcon}>🏫</Text>
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Keep at School</Text>
          <Text style={styles.optionDesc}>
            No changes — normal afternoon pickup continues
          </Text>
        </View>
        <Text style={styles.optionArrow}>→</Text>
      </TouchableOpacity>

      {/* Ride Details */}
      {ride && (
        <View style={styles.rideCard}>
          <Text style={styles.rideCardTitle}>Current Afternoon Ride</Text>
          <Text style={styles.rideDetail}>
            🕐 {new Date(ride.scheduledPickupTime).toLocaleTimeString('en-UG', {
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
          {ride.driverId?.name && (
            <Text style={styles.rideDetail}>👤 Driver: {ride.driverId.name}</Text>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },

  // Header
  header: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  headerAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  headerAvatarText: { fontSize: 32, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
  headerSub: { fontSize: 14, color: '#999', marginTop: 2 },

  // Info
  infoCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoIcon: { fontSize: 20, marginRight: 10 },
  infoText: { flex: 1, fontSize: 13, color: '#333', lineHeight: 18 },

  // Options
  optionCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', elevation: 2,
  },
  optionIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  optionIcon: { fontSize: 24 },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  optionDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  optionEffect: { fontSize: 11, color: '#C62828', marginTop: 4, fontWeight: '500' },
  optionArrow: { fontSize: 20, color: '#ccc' },

  // Ride Details
  rideCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  rideCardTitle: { fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 8, textTransform: 'uppercase' },
  rideDetail: { fontSize: 14, color: '#333', marginBottom: 4 },
});
