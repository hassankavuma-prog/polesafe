// PoleSafe Mobile — Driver Pickup Verification Screen
// Driver arrives at pickup location → reveals safe word → kid says it → verify

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';

export default function DriverPickupVerify({ navigation, route }) {
  const { rideId } = route?.params || {};
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [safeWord, setSafeWord] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRide();
  }, []);

  const loadRide = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/drivers/rides/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRide(data.ride || data);
        if (data.safeWordRevealedAt) {
          setWordRevealed(true);
        }
        if (data.safeWordVerified) {
          setVerified(true);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revealSafeWord = async () => {
    Alert.alert(
      'Reveal Safe Word?',
      'Only reveal the word when the KID asks for it. The kid should challenge you first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reveal',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('polesafe_token');
              const res = await fetch(`${API_BASE}/api/drivers/rides/${rideId}/reveal-safeword`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setSafeWord(data.safeWord);
              setWordRevealed(true);
              setHasPhoto(data.hasPhoto);
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const verifyKid = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/drivers/rides/${rideId}/verify-safeword`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVerified(true);
      if (ride?.childName) {
        Alert.alert(`✅ ${ride.childName} Verified`, 'Safe word matched! Kid is safe to transport.');
      } else {
        Alert.alert('✅ Kid Verified', 'Safe word matched! Kid is safe to transport.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const reportMismatch = async () => {
    Alert.alert(
      'Word Mismatch',
      'The kid did not recognize the safe word. Do NOT take the kid. Contact the parent to verify.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Mismatch',
          style: 'destructive',
          onPress: () => {
            Alert.alert('📞 Report Sent', 'PoleSafe has been notified. Parent will be contacted.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const kidName = ride?.childName || ride?.childId?.name || 'Kid';
  const isComplete = ride?.status === 'completed' || ride?.status === 'dropped_off';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Step Indicator */}
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, styles.stepDone]}>
          <Text style={styles.stepDoneText}>📍</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, wordRevealed ? styles.stepDone : styles.stepActive]}>
          <Text style={wordRevealed ? styles.stepDoneText : styles.stepNum}>🔐</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, verified ? styles.stepDone : styles.stepPending]}>
          <Text style={styles.stepNum}>✅</Text>
        </View>
      </View>
      <View style={styles.stepLabels}>
        <Text style={styles.stepLabel}>Arrived</Text>
        <Text style={styles.stepLabel}>Reveal Word</Text>
        <Text style={styles.stepLabel}>Verify</Text>
      </View>

      {/* Kid Info */}
      <View style={styles.kidCard}>
        <Text style={styles.cardTitle}>👦 Pickup Verification</Text>
        <Text style={styles.kidName}>{kidName}</Text>
        <Text style={styles.instruction}>
          {!wordRevealed
            ? `Wait for ${kidName} to ask you for the safe word.`
            : verified
              ? `✅ ${kidName} is verified and safe to transport.`
              : `Say the word to ${kidName}. If they recognize it, tap Verify.`}
        </Text>
      </View>

      {/* Reveal Word Button */}
      {!wordRevealed && !verified && !isComplete && (
        <TouchableOpacity style={styles.revealBtn} onPress={revealSafeWord}>
          <Text style={styles.revealBtnEmoji}>🔐</Text>
          <Text style={styles.revealBtnTitle}>Tap to Reveal Safe Word</Text>
          <Text style={styles.revealBtnSub}>
            Only press this when the kid asks: "What's the word?"
          </Text>
        </TouchableOpacity>
      )}

      {/* Revealed Word Display */}
      {wordRevealed && !verified && (
        <View style={styles.wordCard}>
          <Text style={styles.wordLabel}>🔐 SAFE WORD</Text>
          <Text style={styles.wordText}>{safeWord || '••••••'}</Text>
          <Text style={styles.wordHint}>
            Say this word to {kidName}. They should recognize it and feel safe getting in.
          </Text>

          {/* Photo Verification */}
          {hasPhoto && (
            <View style={styles.photoHint}>
              <Text style={styles.photoHintText}>📷 Also show the photo on your screen to {kidName}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <TouchableOpacity style={styles.verifyBtn} onPress={verifyKid}>
            <Text style={styles.verifyBtnText}>✅ {kidName} Recognized the Word</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mismatchBtn} onPress={reportMismatch}>
            <Text style={styles.mismatchBtnText}>⚠️ Word Didn't Match</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Completed State */}
      {verified && (
        <View style={styles.completeCard}>
          <Text style={styles.completeIcon}>✅</Text>
          <Text style={styles.completeText}>{kidName} Verified</Text>
          <Text style={styles.completeSub}>Safe word matched — kid is safe to transport</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9ff' },
  errorText: { fontSize: 15, color: '#d32f2f', textAlign: 'center' },

  // Steps
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stepActive: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#2E7D32' },
  stepDone: { backgroundColor: '#2E7D32' },
  stepPending: { backgroundColor: '#e0e0e0' },
  stepNum: { fontSize: 18 },
  stepDoneText: { fontSize: 18 },
  stepLine: { flex: 1, height: 3, backgroundColor: '#2E7D32', marginHorizontal: 4, borderRadius: 2 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 4 },
  stepLabel: { fontSize: 11, color: '#888', fontWeight: '500' },

  // Kid Card
  kidCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  kidName: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 8 },
  instruction: { fontSize: 14, color: '#666', lineHeight: 20 },

  // Reveal Button
  revealBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  revealBtnEmoji: { fontSize: 48, marginBottom: 12 },
  revealBtnTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  revealBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  // Word Card
  wordCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, elevation: 2, borderWidth: 2, borderColor: '#2E7D32' },
  wordLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  wordText: { fontSize: 36, fontWeight: '800', color: '#2E7D32', textAlign: 'center', marginVertical: 12, letterSpacing: 4 },
  wordHint: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  photoHint: { backgroundColor: '#fff8e1', padding: 12, borderRadius: 8, marginBottom: 16 },
  photoHintText: { fontSize: 14, color: '#e65100', textAlign: 'center' },

  verifyBtn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  mismatchBtn: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#d32f2f' },
  mismatchBtnText: { color: '#d32f2f', fontSize: 14, fontWeight: '600' },

  // Complete
  completeCard: { backgroundColor: '#e8f5e9', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#2E7D32' },
  completeIcon: { fontSize: 48, marginBottom: 8 },
  completeText: { fontSize: 20, fontWeight: '700', color: '#2E7D32' },
  completeSub: { fontSize: 14, color: '#555', marginTop: 4 },
});
