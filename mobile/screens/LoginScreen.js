// PoleSafe Login v3 — Premium First Impression
// Clean, modern, role-based onboarding
// From Home to School. And Beyond. 🚸

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Animated, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import API_BASE from '../config';
import { BRAND, STATUS, getTheme, BORDER_RADIUS, SPACING } from '../theme';

// ─── Globals ──────────────────────────────────────────
const ROLES = [
  { id: 'parent', label: 'Parent', emoji: '👨‍👩‍👧‍👦', desc: 'Track your kids, book rides, community', color: BRAND.primary },
  { id: 'driver', label: 'Driver', emoji: '🚗', desc: 'Manage trips, earn, safety checks', color: BRAND.secondary },
  { id: 'school', label: 'School Admin', emoji: '🏫', desc: 'Gate check, attendance, broadcasts', color: BRAND.teal },
  { id: 'rider', label: 'Rider', emoji: '🏍️', desc: 'Ride-hailing, community, no kid transport', color: BRAND.purple },
];

// ─── Login Screen ─────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState('parent');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) { Alert.alert('Email required', 'Please enter your email'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      await AsyncStorage.setItem('polesafe_token', data.token);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('userRole', data.role || selectedRole);
      await AsyncStorage.setItem('userName', data.name || name);
    } catch (err) {
      // Dev Mode — login without backend
      if (email.includes('@') && password.length > 2) {
        await AsyncStorage.setItem('polesafe_token', 'dev-token');
        await AsyncStorage.setItem('token', 'dev-token');
        await AsyncStorage.setItem('userRole', selectedRole);
        await AsyncStorage.setItem('userName', email.split('@')[0]);
        // App reloads via auth polling
      } else {
        Alert.alert('Login Error', err.message || 'Check your credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Required', 'Name and email are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          role: selectedRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      await AsyncStorage.setItem('polesafe_token', data.token);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('userRole', data.role || selectedRole);
      await AsyncStorage.setItem('userName', data.name || name);
    } catch (err) {
      // Dev Mode
      if (name.trim() && email.includes('@')) {
        await AsyncStorage.setItem('polesafe_token', 'dev-token');
        await AsyncStorage.setItem('token', 'dev-token');
        await AsyncStorage.setItem('userRole', selectedRole);
        await AsyncStorage.setItem('userName', name.trim());
      } else {
        Alert.alert('Error', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Dev Mode Login ────────────────────────────────
  const devLogin = async (role) => {
    await AsyncStorage.setItem('polesafe_token', 'dev-token');
    await AsyncStorage.setItem('token', 'dev-token');
    await AsyncStorage.setItem('userRole', role);
    await AsyncStorage.setItem('userName', `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* Logo Area */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🚸</Text>
            </View>
            <Text style={styles.appName}>PoleSafe</Text>
            <Text style={styles.tagline}>From Home to School. And Beyond.</Text>
          </View>

          {/* Role Selector */}
          <Text style={styles.sectionLabel}>I AM A...</Text>
          <View style={styles.roleGrid}>
            {ROLES.map(role => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleCard,
                  selectedRole === role.id && { borderColor: role.color, backgroundColor: role.color + '12' },
                ]}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.roleEmoji}>{role.emoji}</Text>
                <Text style={[
                  styles.roleLabel,
                  selectedRole === role.id && { color: role.color },
                ]}>{role.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form */}
          {showRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. John Mugisha"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{showRegister ? 'EMAIL' : 'EMAIL OR PHONE'}</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {showRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +256 700 000 000"
                placeholderTextColor="#9CA3AF"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: ROLES.find(r => r.id === selectedRole)?.color || BRAND.primary }]}
            onPress={showRegister ? handleRegister : handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {showRegister ? 'Create Account' : 'Sign In'} {ROLES.find(r => r.id === selectedRole)?.emoji}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Register/Login */}
          <TouchableOpacity style={styles.toggleMode} onPress={() => setShowRegister(!showRegister)}>
            <Text style={styles.toggleText}>
              {showRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>DEVELOPER MODE</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Dev Mode Buttons */}
          <View style={styles.devGrid}>
            {ROLES.map(role => (
              <TouchableOpacity
                key={`dev-${role.id}`}
                style={[styles.devBtn, { backgroundColor: role.color + '18', borderColor: role.color + '40' }]}
                onPress={() => devLogin(role.id)}
              >
                <Text style={styles.devEmoji}>{role.emoji}</Text>
                <Text style={[styles.devLabel, { color: role.color }]}>Skip as {role.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  // Section Label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  // Role Selector
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  roleCard: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  roleEmoji: { fontSize: 24, marginBottom: 4 },
  roleLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },

  // Form
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },

  // Submit
  submitBtn: {
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  // Toggle
  toggleMode: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  toggleText: {
    fontSize: 13,
    color: BRAND.secondary,
    fontWeight: '600',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },

  // Dev Mode
  devGrid: {
    gap: 6,
  },
  devBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  devEmoji: { fontSize: 18, marginRight: 10 },
  devLabel: { fontSize: 14, fontWeight: '600' },
});
