// PoleSafe Mobile — Onboarding Screen
// Guided registration for new parents and schools

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { COLORS } from '../theme';

const STEPS = ['Welcome', 'Your Details', 'Add Child', 'Pickup Word', 'Done'];

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [childName, setChildName] = useState('');
  const [childClass, setChildClass] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');

  const register = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, pin, role: 'parent' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToken(data.token);
      setUserId(data.user._id);
      await AsyncStorage.setItem('polesafe_token', data.token);
      return data;
    } catch (err) {
      Alert.alert('Error', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addChild = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/parents/kids`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: childName, class: childClass, schoolId: schoolName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    } catch (err) {
      Alert.alert('Error', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setPickupWord = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/safety/set-pickup-word`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: userId, word }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch {
      // Optional step — skip silently
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    switch (step) {
      case 0: setStep(1); break;
      case 1:
        if (!name || !phone || !pin) return Alert.alert('Fill all fields');
        if (pin.length < 4) return Alert.alert('PIN must be 4 digits');
        try {
          await register();
          setStep(2);
        } catch { /* handled in register */ }
        break;
      case 2:
        if (!childName) return Alert.alert('Enter your child\'s name');
        try {
          await addChild();
          setStep(3);
        } catch { /* handled */ }
        break;
      case 3:
        if (word) await setPickupWord();
        setStep(4);
        break;
      case 4:
        navigation.reset({ index: 0, routes: [{ name: 'ParentDashboard' }] });
        break;
    }
  };

  const skip = () => {
    if (step === 2) { setStep(4); return; }
    next();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.welcome}>
            <Text style={styles.welcomeEmoji}>🚸</Text>
            <Text style={styles.welcomeTitle}>Welcome to PoleSafe!</Text>
            <Text style={styles.welcomeText}>
              We help you safely transport your kids to and from school.
              {'\n\n'}Let's set you up in under a minute.
            </Text>
          </View>
        );

      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>📝 Your Details</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full Name" placeholderTextColor="#999" />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone (+256...)" placeholderTextColor="#999" keyboardType="phone-pad" />
            <TextInput style={styles.input} value={pin} onChangeText={setPin} placeholder="4-digit PIN" placeholderTextColor="#999" secureTextEntry maxLength={4} keyboardType="number-pad" />
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>👦 Add Your Child</Text>
            <TextInput style={styles.input} value={childName} onChangeText={setChildName} placeholder="Child's Full Name" placeholderTextColor="#999" />
            <TextInput style={styles.input} value={childClass} onChangeText={setChildClass} placeholder="Class (e.g. P.3)" placeholderTextColor="#999" />
            <TextInput style={styles.input} value={schoolName} onChangeText={setSchoolName} placeholder="School Name" placeholderTextColor="#999" />
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>🔐 Pickup Word</Text>
            <Text style={styles.hint}>
              Choose a word your child will know. The driver says this word at every pickup.{'\n\n'}
              If the driver doesn't say the word, your child should NOT get in the vehicle.
            </Text>
            <TextInput style={styles.input} value={word} onChangeText={setWord} placeholder="e.g. Mango, Lion, Blue" placeholderTextColor="#999" maxLength={16} />
          </>
        );

      case 4:
        return (
          <View style={styles.welcome}>
            <Text style={styles.welcomeEmoji}>🎉</Text>
            <Text style={styles.welcomeTitle}>You're All Set!</Text>
            <Text style={styles.welcomeText}>
              Your account is ready.{'\n\n'}
              📱 Book rides for your kids{'\n'}
              📍 Track them in real-time{'\n'}
              💬 Chat with Hamna for help{'\n'}
              📟 Or text Hamna via SMS
            </Text>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progress}>
          {STEPS.map((s, i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <View style={styles.nav}>
          {step > 0 && step < 4 && (
            <TouchableOpacity style={styles.skipBtn} onPress={skip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.nextBtn, loading && { opacity: 0.6 }]} onPress={next} disabled={loading}>
            <Text style={styles.nextText}>
              {loading ? 'Loading...' : step === 4 ? '🚀 Start Using PoleSafe' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  scroll: { flex: 1, justifyContent: 'center', padding: 24 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 40 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd' },
  dotActive: { backgroundColor: '#4361ee', width: 30, borderRadius: 5 },
  welcome: { alignItems: 'center', paddingVertical: 20 },
  welcomeEmoji: { fontSize: 64, marginBottom: 16 },
  welcomeTitle: { fontSize: 28, fontWeight: '700', color: '#4361ee', marginBottom: 12, textAlign: 'center' },
  welcomeText: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 20 },
  hint: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16, backgroundColor: '#fff8e1', padding: 16, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#ff9800' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 16, fontSize: 16, borderWidth: 2, borderColor: '#e0e0eb', marginBottom: 12, color: '#333' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 },
  skipBtn: { padding: 12 },
  skipText: { fontSize: 16, color: '#999' },
  nextBtn: { flex: 1, backgroundColor: '#4361ee', padding: 16, borderRadius: 12, alignItems: 'center', marginLeft: 12 },
  nextText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
