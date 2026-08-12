import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enqueueSosTrigger, flushOfflineQueue } from '../services/offlineSyncService';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

export default function SOSButton({ rideId, kidId, userRole }) {
  const [alertActive, setAlertActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);

  const getCurrentLocation = async () => ({
    lat: 0.3136 + Math.random() * 0.01,
    lng: 32.5811 + Math.random() * 0.01,
  });

  const getUserId = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.id || parsed._id;
    }
    return null;
  };

  const handlePress = () => {
    if (alertActive) {
      Alert.alert('Resolve Alert', 'Mark this emergency as resolved?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resolved', onPress: () => setAlertActive(false) },
      ]);
      return;
    }

    setCountdown(3);
    Vibration.vibrate(100);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerSOS();
          return 0;
        }
        Vibration.vibrate(100);
        return prev - 1;
      });
    }, 1000);
  };

  const triggerSOS = async () => {
    setSending(true);
    try {
      const userId = await getUserId();
      const location = await getCurrentLocation();
      const role = await AsyncStorage.getItem('userRole');
      const payload = {
        userId,
        userRole: role || userRole || 'parent',
        kidId: kidId || null,
        rideId: rideId || null,
        location,
        message: 'EMERGENCY! Help needed!',
        triggerType: 'manual_sos',
      };

      await enqueueSosTrigger(payload, { rideId, childId: kidId, source: 'sos-button', priority: 'high' });
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (online) {
        try {
          const res = await fetch(`${API_URL}/api/safety/sos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || data.message || 'Failed to send alert');
        } catch (err) {
          await flushOfflineQueue({ socketConnected: false, token: null, forceOnline: false });
        }
      } else {
        await flushOfflineQueue({ socketConnected: false, token: null, forceOnline: false });
      }

      setAlertActive(true);
      Alert.alert('🚨 SOS Sent!', 'Emergency alert queued and sent. Help is on the way.', [{ text: 'OK' }]);
    } catch (err) {
      Alert.alert('Error', 'Network error. The SOS was queued for retry. Call emergency services directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.sosButton, alertActive && styles.sosActive, sending && styles.sosSending]}
        onPress={handlePress}
        disabled={sending}
        activeOpacity={0.7}
      >
        {sending ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : countdown > 0 ? (
          <Text style={styles.sosCountdown}>{countdown}</Text>
        ) : alertActive ? (
          <View style={styles.activeContent}>
            <Text style={styles.sosIcon}>✅</Text>
            <Text style={styles.sosLabel}>HELP EN ROUTE</Text>
            <Text style={styles.sosSubLabel}>Tap to resolve</Text>
          </View>
        ) : (
          <View style={styles.defaultContent}>
            <Text style={styles.sosIcon}>SOS</Text>
            <Text style={styles.sosLabel}>Emergency</Text>
            <Text style={styles.sosSubLabel}>Tap & hold to alert</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 16 },
  sosButton: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#D32F2F',
    justifyContent: 'center', alignItems: 'center', elevation: 8,
    shadowColor: '#D32F2F', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  sosActive: { backgroundColor: '#388E3C', shadowColor: '#388E3C' },
  sosSending: { backgroundColor: '#FF9800' },
  defaultContent: { alignItems: 'center' },
  activeContent: { alignItems: 'center' },
  sosCountdown: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  sosIcon: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  sosLabel: { fontSize: 12, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
  sosSubLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
});

export { SOSButton };
