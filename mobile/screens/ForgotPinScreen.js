// PoleSafe Mobile — Forgot PIN Screen
// 3-step flow: enter phone → verify SMS code → set new PIN

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';

const STEPS = ['Phone', 'Code', 'New PIN'];

export default function ForgotPinScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const codeRef = useRef(null);

  const sendResetCode = async () => {
    if (!phone.match(/^\+?256\d{9}$/)) {
      return Alert.alert('Invalid Number', 'Enter a valid Ugandan phone (+256...)');
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep(1);
      setTimeout(() => codeRef.current?.focus(), 500);
      Alert.alert('✅ Code Sent', `A 6-digit reset code has been sent to ${phone}. Check your SMS.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length < 4) {
      return Alert.alert('Enter Code', 'Enter the 6-digit code from SMS');
    }
    setLoading(true);
    setError('');
    try {
      // We'll verify + reset on the final step
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPin = async () => {
    if (newPin.length < 4) {
      return Alert.alert('Weak PIN', 'PIN must be at least 4 characters');
    }
    if (newPin !== confirmPin) {
      return Alert.alert('PIN Mismatch', 'PINs do not match');
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, newPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Save token and navigate to dashboard
      await AsyncStorage.setItem('polesafe_token', data.token);
      await AsyncStorage.setItem('polesafe_user', JSON.stringify(data.user));

      Alert.alert('✅ PIN Reset Successful', 'You are now logged in.', [
        { text: 'Go to Dashboard', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'ParentDashboard' }] }) },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/auth/forgot-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      Alert.alert('✅ Code Resent', 'Check your SMS for a new 6-digit code.');
    } catch {
      Alert.alert('Error', 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <TouchableOpacity style={styles.backBtn} onPress={goBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🔑 Reset PIN</Text>
      <Text style={styles.subtitle}>{STEPS[step]} — Step {step + 1} of 3</Text>

      {/* Step Indicator */}
      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.stepDot, i <= step && styles.stepActive]}>
            <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>{i + 1}</Text>
          </View>
        ))}
      </View>

      {/* Error */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Step 0: Enter Phone */}
      {step === 0 && (
        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+256700000000"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            autoFocus
          />
          <Text style={styles.hint}>We'll send a 6-digit reset code via SMS</Text>
          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={sendResetCode} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 1: Enter Code */}
      {step === 1 && (
        <View style={styles.form}>
          <Text style={styles.label}>Enter 6-Digit Code</Text>
          <Text style={styles.sentTo}>Sent to {phone}</Text>
          <TextInput
            ref={codeRef}
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(t) => { const cleaned = t.replace(/[^0-9]/g, '').slice(0, 6); setCode(cleaned); if (cleaned.length === 6) verifyCode(); }}
            placeholder="000000"
            placeholderTextColor="#ccc"
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity style={styles.resend} onPress={resendCode} disabled={loading}>
            <Text style={styles.resendText}>Resend Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={verifyCode} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify Code'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Set New PIN */}
      {step === 2 && (
        <View style={styles.form}>
          <Text style={styles.label}>Create New PIN</Text>
          <TextInput
            style={styles.input}
            value={newPin}
            onChangeText={setNewPin}
            placeholder="New PIN (4+ characters)"
            placeholderTextColor="#999"
            secureTextEntry
            autoFocus
          />
          <TextInput
            style={styles.input}
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Confirm PIN"
            placeholderTextColor="#999"
            secureTextEntry
          />
          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={resetPin} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Resetting...' : 'Reset PIN & Login'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff', padding: 24 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: '#4361ee', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#333', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  stepsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 28 },
  stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8e8f0', justifyContent: 'center', alignItems: 'center' },
  stepActive: { backgroundColor: '#4361ee' },
  stepNum: { fontSize: 14, fontWeight: '600', color: '#999' },
  stepNumActive: { color: '#fff' },
  error: { backgroundColor: '#fff0f0', color: '#d32f2f', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center', fontSize: 14 },
  form: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  sentTo: { fontSize: 13, color: '#888', marginBottom: 16 },
  hint: { fontSize: 12, color: '#999', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 16, fontSize: 16, borderWidth: 2, borderColor: '#e0e0eb', marginBottom: 16, color: '#333' },
  codeInput: { fontSize: 28, letterSpacing: 12, textAlign: 'center', fontWeight: '700' },
  resend: { alignSelf: 'center', marginBottom: 20 },
  resendText: { fontSize: 14, color: '#4361ee', fontWeight: '500' },
  btn: { backgroundColor: '#4361ee', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
