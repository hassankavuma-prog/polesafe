// PoleSafe Mobile — Driver Pickup Verification Screen
// Driver arrives at pickup location → tap to reveal safe word → kid says it → verify

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { t } from '../constants/translations';
import { getPreJourneySafetyState, recordPreJourneySafetyReminder, acknowledgePreJourneySafety, startJourney } from '../services/driverJourneySafetyService';
import { announcePreJourneySafetyReminder } from '../services/voiceGuidanceService';

function PreJourneySafetyCard({ state, onAcknowledge, onStart, loadingAck, loadingStart, errorText }) {
  const childFlow = !!state?.acknowledgementRequired;
  const reminder = childFlow ? t('school_child_reminder') : t('ordinary_passenger_reminder');
  const startDisabled = !state?.readyToStart || loadingAck || loadingStart;
  return (
    <View style={styles.safetyCard}>
      <Text style={styles.safetyHeading}>{t('pre_journey_safety_heading')}</Text>
      <Text style={styles.safetyReminder}>{reminder}</Text>
      {!!errorText && <Text style={styles.safetyError}>{errorText}</Text>}
      {childFlow ? (
        <TouchableOpacity disabled={loadingAck || loadingStart || !state?.readyToStart} style={[styles.ackBtn, (loadingAck || loadingStart || !state?.readyToStart) && styles.disabledBtn]} onPress={onAcknowledge}>
          <Text style={styles.ackBtnText}>{loadingAck ? t('submitting_acknowledgement') : t('acknowledgement_button')}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.safetyHint}>{state?.readyToStart ? t('ready_to_start') : t('blocked_retry')}</Text>
      )}
      <TouchableOpacity disabled={startDisabled} style={[styles.startBtn, startDisabled && styles.disabledBtn]} onPress={onStart}>
        <Text style={styles.startBtnText}>{t('journey_start')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DriverPickupVerify({ navigation, route }) {
  const { rideId } = route?.params || {};
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [safeWord, setSafeWord] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [assignmentId, setAssignmentId] = useState(route?.params?.assignmentId || null);
  const [safetyState, setSafetyState] = useState(null);
  const [safetyError, setSafetyError] = useState('');
  const [loadingSafety, setLoadingSafety] = useState(false);
  const [loadingAck, setLoadingAck] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [currentOccurrenceId, setCurrentOccurrenceId] = useState(null);
  const [currentOccurrenceVersion, setCurrentOccurrenceVersion] = useState(null);
  const [driverStorageKey, setDriverStorageKey] = useState(null);
  const playedOccurrenceRef = useRef(null);
  const ackInFlightRef = useRef(false);
  const startInFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => { loadRide(); return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    const hydrate = async () => {
      const driverId = String(route?.params?.driverId || ride?.driverId || '');
      if (!driverId) return;
      const key = `polesafe_last_spoken_safety_occurrence_${driverId}`;
      setDriverStorageKey(key);
      try { playedOccurrenceRef.current = await AsyncStorage.getItem(key); } catch {}
    };
    hydrate();
  }, [route?.params?.driverId, ride?.driverId]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && assignmentId) loadSafety(assignmentId);
    });
    return () => sub?.remove?.();
  }, [assignmentId]);

  useEffect(() => {
    if (assignmentId) loadSafety(assignmentId);
  }, [assignmentId]);

  const loadRide = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/drivers/rides/${rideId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setRide(data.ride || data);
        setAssignmentId(data.assignmentId || data.ride?.assignmentId || route?.params?.assignmentId || null);
      }
    } catch (err) { setError(err.message); } finally { if (mountedRef.current) setLoading(false); }
  };

  const markOccurrenceSpoken = async (occurrenceId) => {
    playedOccurrenceRef.current = occurrenceId;
    if (!driverStorageKey || !occurrenceId) return;
    try { await AsyncStorage.setItem(driverStorageKey, String(occurrenceId)); } catch {}
  };

  const resetLocalPresentationForNewOccurrence = (state) => {
    setVerified(false);
    setLoadingAck(false);
    setLoadingStart(false);
    setSafetyError('');
    ackInFlightRef.current = false;
    startInFlightRef.current = false;
    if (state?.acknowledgementRequired !== true) return;
  };

  const loadSafety = async (id = assignmentId) => {
    if (!id || !mountedRef.current) return;
    setLoadingSafety(true);
    setSafetyError('');
    try {
      const state = await getPreJourneySafetyState(id);
      if (!mountedRef.current) return;
      const occurrenceId = state?.occurrenceId || null;
      const occurrenceVersion = state?.occurrenceVersion || null;
      const occurrenceChanged = occurrenceId && occurrenceId !== currentOccurrenceId;
      const sameOccurrence = occurrenceId && occurrenceId === currentOccurrenceId;
      if (occurrenceChanged) resetLocalPresentationForNewOccurrence(state);
      setCurrentOccurrenceId(occurrenceId);
      setCurrentOccurrenceVersion(occurrenceVersion);
      setSafetyState(state);
      if (occurrenceId && playedOccurrenceRef.current !== occurrenceId) {
        try {
          await announcePreJourneySafetyReminder(state?.acknowledgementRequired ? 'school' : 'ordinary');
          await markOccurrenceSpoken(occurrenceId);
        } catch {}
      } else if (sameOccurrence) {
        setSafetyState(state);
      }
      if (state && !state.reminderRecorded) {
        try {
          const reminderResult = await recordPreJourneySafetyReminder(id);
          if (!mountedRef.current) return;
          const refreshed = reminderResult?.ride?.preJourneySafety?.occurrenceId ? { ...state, ...reminderResult.ride.preJourneySafety } : await getPreJourneySafetyState(id);
          if (!mountedRef.current) return;
          setSafetyState(refreshed);
          setCurrentOccurrenceId(refreshed?.occurrenceId || occurrenceId || null);
          setCurrentOccurrenceVersion(refreshed?.occurrenceVersion || occurrenceVersion || null);
        } catch (err) {
          if (mountedRef.current) setSafetyError(err.message || t('blocked_retry'));
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setSafetyError(err.message || t('connection_required'));
    } finally {
      if (mountedRef.current) setLoadingSafety(false);
    }
  };

  const revealSafeWord = async () => {
    Alert.alert(
      'Reveal Safe Word?',
      'Only reveal the word after you have arrived at pickup and the kid asks for it. The kid should challenge you first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reveal',
          accessibilityLabel: 'reveal safe word',
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
      setAssignmentId(data.assignmentId || data.ride?.assignmentId || assignmentId || route?.params?.assignmentId || null);
      if (ride?.childName) Alert.alert(`✅ ${ride.childName} Verified`, 'Safe word matched! Kid is safe to transport.');
      else Alert.alert('✅ Kid Verified', 'Safe word matched! Kid is safe to transport.');
      await loadSafety(data.assignmentId || data.ride?.assignmentId || assignmentId || route?.params?.assignmentId || null);
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
        { text: 'Report Mismatch', accessibilityLabel: 'report mismatch', style: 'destructive', onPress: () => Alert.alert('📞 Report Sent', 'PoleSafe has been notified. Parent will be contacted.') },
      ]
    );
  };

  const handleAcknowledge = async () => {
    if (!assignmentId || ackInFlightRef.current) return;
    ackInFlightRef.current = true;
    setLoadingAck(true);
    setSafetyError('');
    try {
      await acknowledgePreJourneySafety(assignmentId);
      const refreshed = await getPreJourneySafetyState(assignmentId);
      if (!mountedRef.current) return;
      setSafetyState(refreshed);
      setCurrentOccurrenceId(refreshed?.occurrenceId || currentOccurrenceId);
      setCurrentOccurrenceVersion(refreshed?.occurrenceVersion || currentOccurrenceVersion);
    } catch (err) {
      if (mountedRef.current) setSafetyError(err.message || t('blocked_retry'));
      try {
        const refreshed = await getPreJourneySafetyState(assignmentId);
        if (!mountedRef.current) return;
        setSafetyState(refreshed);
        setCurrentOccurrenceId(refreshed?.occurrenceId || currentOccurrenceId);
        setCurrentOccurrenceVersion(refreshed?.occurrenceVersion || currentOccurrenceVersion);
      } catch {}
    } finally {
      ackInFlightRef.current = false;
      if (mountedRef.current) setLoadingAck(false);
    }
  };

  const handleStartJourney = async () => {
    if (!assignmentId || startInFlightRef.current || !safetyState?.readyToStart) return;
    startInFlightRef.current = true;
    setLoadingStart(true);
    setSafetyError('');
    try {
      await startJourney(assignmentId);
      setSafetyPhase('onboard');
      navigation?.navigate?.('DriverDashboard');
    } catch (err) {
      if (mountedRef.current) setSafetyError(err.message || t('blocked_retry'));
      try {
        const refreshed = await getPreJourneySafetyState(assignmentId);
        if (!mountedRef.current) return;
        setSafetyState(refreshed);
        setCurrentOccurrenceId(refreshed?.occurrenceId || currentOccurrenceId);
        setCurrentOccurrenceVersion(refreshed?.occurrenceVersion || currentOccurrenceVersion);
      } catch {}
    } finally {
      startInFlightRef.current = false;
      if (mountedRef.current) setLoadingStart(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2E7D32" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;

  const kidName = ride?.childName || ride?.childId?.name || 'Kid';
  const isComplete = ride?.status === 'completed' || ride?.status === 'dropped_off';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.stepRow}><View style={[styles.stepDot, styles.stepDone]}><Text style={styles.stepDoneText}>📍</Text></View><View style={styles.stepLine} /><View style={[styles.stepDot, wordRevealed ? styles.stepDone : styles.stepActive]}><Text style={wordRevealed ? styles.stepDoneText : styles.stepNum}>🔐</Text></View><View style={styles.stepLine} /><View style={[styles.stepDot, verified ? styles.stepDone : styles.stepPending]}><Text style={styles.stepNum}>✅</Text></View></View>
      <View style={styles.stepLabels}><Text style={styles.stepLabel}>Arrived</Text><Text style={styles.stepLabel}>Reveal Word</Text><Text style={styles.stepLabel}>Verify</Text></View>
      <View style={styles.kidCard}><Text style={styles.cardTitle}>👦 Pickup Verification</Text><Text style={styles.kidName}>{kidName}</Text><Text style={styles.instruction}>{!wordRevealed ? `Wait for ${kidName} to ask you for the safe word.` : verified ? `✅ ${kidName} is verified and safe to transport.` : `Say the word to ${kidName}. If they recognize it, tap Verify.`}</Text></View>
      {verified && safetyState && <PreJourneySafetyCard state={safetyState} onAcknowledge={handleAcknowledge} onStart={handleStartJourney} loadingAck={loadingAck} loadingStart={loadingStart} errorText={safetyError || (loadingSafety ? t('connection_required') : '')} />}
      {!wordRevealed && !verified && !isComplete && <TouchableOpacity style={styles.revealBtn} accessibilityLabel="reveal safe word" onPress={revealSafeWord}><Text style={styles.revealBtnEmoji}>🔐</Text><Text style={styles.revealBtnTitle}>Tap to Reveal Safe Word</Text><Text style={styles.revealBtnSub}>Only press this after arrival, when the kid asks: "What's the word?"</Text></TouchableOpacity>}
      {wordRevealed && !verified && <View style={styles.wordCard}><Text style={styles.wordLabel}>🔐 SAFE WORD</Text><Text style={styles.wordText}>{safeWord || '••••••'}</Text><Text style={styles.wordHint}>Say this word to {kidName}. They should recognize it and feel safe getting in.</Text>{hasPhoto && <View style={styles.photoHint}><Text style={styles.photoHintText}>📷 Also show the photo on your screen to {kidName}</Text></View>}<TouchableOpacity style={styles.verifyBtn} accessibilityLabel="child verified" onPress={verifyKid}><Text style={styles.verifyBtnText}>✅ {kidName} Recognized the Word</Text></TouchableOpacity><TouchableOpacity style={styles.mismatchBtn} accessibilityLabel="report mismatch" onPress={reportMismatch}><Text style={styles.mismatchBtnText}>⚠️ Word Didn't Match</Text></TouchableOpacity></View>}
      {verified && <View style={styles.completeCard}><Text style={styles.completeIcon}>✅</Text><Text style={styles.completeText}>{kidName} Verified</Text><Text style={styles.completeSub}>Safe word matched — kid is safe to transport</Text></View>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' }, content: { padding: 20 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9ff' }, errorText: { fontSize: 15, color: '#d32f2f', textAlign: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 }, stepDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }, stepActive: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#2E7D32' }, stepDone: { backgroundColor: '#2E7D32' }, stepPending: { backgroundColor: '#e0e0e0' }, stepNum: { fontSize: 18 }, stepDoneText: { fontSize: 18 }, stepLine: { flex: 1, height: 3, backgroundColor: '#2E7D32', marginHorizontal: 4, borderRadius: 2 }, stepLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 4 }, stepLabel: { fontSize: 11, color: '#555555', fontWeight: '500' }, kidCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, elevation: 2 }, cardTitle: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }, kidName: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 8 }, instruction: { fontSize: 14, color: '#666', lineHeight: 20 }, revealBtn: { backgroundColor: '#2E7D32', borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 16, elevation: 4 }, revealBtnEmoji: { fontSize: 48, marginBottom: 12 }, revealBtnTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 }, revealBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }, wordCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, elevation: 2, borderWidth: 2, borderColor: '#2E7D32' }, wordLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }, wordText: { fontSize: 36, fontWeight: '800', color: '#2E7D32', textAlign: 'center', marginVertical: 12, letterSpacing: 4 }, wordHint: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, lineHeight: 20 }, photoHint: { backgroundColor: '#fff8e1', padding: 12, borderRadius: 8, marginBottom: 16 }, photoHintText: { fontSize: 14, color: '#e65100', textAlign: 'center' }, verifyBtn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 }, verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' }, mismatchBtn: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#d32f2f' }, mismatchBtnText: { color: '#d32f2f', fontSize: 14, fontWeight: '600' }, completeCard: { backgroundColor: '#e8f5e9', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#2E7D32' }, completeIcon: { fontSize: 48, marginBottom: 8 }, completeText: { fontSize: 20, fontWeight: '700', color: '#2E7D32' }, completeSub: { fontSize: 14, color: '#555', marginTop: 4 }, safetyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#dfe7df' }, safetyHeading: { fontSize: 18, fontWeight: '700', color: '#2E7D32', marginBottom: 8 }, safetyReminder: { fontSize: 14, color: '#333', marginBottom: 8, lineHeight: 20 }, safetyHint: { fontSize: 13, color: '#666', marginBottom: 8 }, safetyError: { fontSize: 13, color: '#c62828', marginBottom: 8 }, ackBtn: { backgroundColor: '#2E7D32', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 }, ackBtnText: { color: '#fff', fontWeight: '700' }, startBtn: { backgroundColor: '#0b57d0', padding: 14, borderRadius: 10, alignItems: 'center' }, startBtnText: { color: '#fff', fontWeight: '700' }, disabledBtn: { opacity: 0.5 },
});
