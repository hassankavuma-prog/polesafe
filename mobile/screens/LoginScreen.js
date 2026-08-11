// PoleSafe Mobile — Login Screen
// Phone number login with SMS PIN verification

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
const UG_PHONE_REGEX = /^\+256\d{9}$/;

export default function LoginScreen({ navigation }) {
  const theme = getTheme();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('parent');
  const [step, setStep] = useState('phone'); // 'phone' | 'pin' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (text) => {
    // Auto-prepend +256 if user types a 0 or 7xxxx
    let cleaned = text.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('0') && cleaned.length <= 10) {
      cleaned = '+256' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') && cleaned.length <= 9) {
      cleaned = '+256' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const handleSendPin = async () => {
    setError('');

    if (!UG_PHONE_REGEX.test(phone)) {
      setError('Enter a valid Ugandan number (+2567XXXXXXXX)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) {
        const errData = await res.json();
        // Check if user doesn't exist
        if (res.status === 404 || errData.message?.includes('not found')) {
          setStep('register');
          return;
        }
        throw new Error(errData.message || 'Failed to send PIN');
      }

      setStep('pin');
    } catch (err) {
      setError(err.message || 'Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    setError('');

    if (!pin || pin.length < 4) {
      setError('Enter the PIN you received via SMS');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Invalid PIN');
      }

      const data = await res.json();

      // Store auth data
      if (data.token) {
        await AsyncStorage.setItem('polesafe_token', data.token);
        if (data.role) await AsyncStorage.setItem('polesafe_role', data.role);
        if (data.schoolId) await AsyncStorage.setItem('polesafe_school_id', String(data.schoolId));
      }

      // Navigation will be handled by PoleSafeApp's auth state change
      // The app re-renders and moves to the correct tab navigator
      Alert.alert('Welcome!', `Logged in as ${data.role || 'user'}`);

    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendPin = () => {
    setPin('');
    handleSendPin();
  };

  // Dev Mode — Skip Login (for testing)
  const devRoles = [
    { key: 'parent', label: '👨‍👩‍👧 Parent', color: '#2E7D32' },
    { key: 'driver', label: '🚗 Driver', color: '#1565C0' },
    { key: 'school', label: '🏫 School', color: '#E65100' },
  ];

  const handleDevLogin = async (mockRole) => {
    setLoading(true);
    try {
      await AsyncStorage.setItem('polesafe_token', 'dev-mock-token-' + mockRole);
      await AsyncStorage.setItem('polesafe_role', mockRole);
      if (mockRole === 'school') {
        await AsyncStorage.setItem('polesafe_school_id', '1');
      }
      if (mockRole === 'driver') {
        await AsyncStorage.setItem('polesafe_driver_id', '1');
      }
      Alert.alert('🔧 Dev Mode', `Skipping login as mock ${mockRole}...`);
    } catch (e) {
      console.log('Dev login error:', e);
      Alert.alert('Error', 'Failed to start dev mode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.canvas}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.logo}>🚸</Text>
        <Text style={styles.title}>PoleSafe</Text>
        <Text style={styles.subtitle}>From Home to School. And Beyond.</Text>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Step 1: Phone Input */}
        {step === 'phone' && (
          <View style={styles.form}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇺🇬 +256</Text>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="7XXXXXXXX"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
                value={phone.replace('+256', '')}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 9);
                  setPhone('+256' + cleaned);
                  setError('');
                }}
                maxLength={9}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSendPin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Send PIN</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => setStep('register')}
            >
              <Text style={styles.linkText}>New here? Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>Forgot PIN?</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Register */}
        {step === 'register' && (
          <View style={styles.form}>
            <Text style={styles.verifiedPhone}>📱 {phone}</Text>
            <Text style={styles.label}>Create Your Account</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={(text) => { setName(text); setError(''); }}
              editable={!loading}
            />

            <View style={styles.roleSelector}>
              <Text style={styles.roleLabel}>I am a:</Text>
              <View style={styles.roleRow}>
                {['parent', 'driver', 'school'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleBtn,
                      role === r && styles.roleBtnSelected,
                    ]}
                    onPress={() => setRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        role === r && styles.roleTextSelected,
                      ]}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={async () => {
                if (!name.trim()) {
                  setError('Please enter your name');
                  return;
                }
                setLoading(true);
                try {
                  const res = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, name, role }),
                  });
                  if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.message || 'Registration failed');
                  }
                  setStep('pin');
                } catch (err) {
                  setError(err.message || 'Registration failed');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => { setStep('phone'); setName(''); setError(''); }}
            >
              <Text style={styles.linkText}>← Back to login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: PIN Verification */}
        {step === 'pin' && (
          <View style={styles.form}>
            <Text style={styles.verifiedPhone}>
              📱 {phone}
            </Text>
            <Text style={styles.label}>Enter PIN</Text>
            <Text style={styles.hint}>
              We sent a verification code to your phone
            </Text>

            <TextInput
              style={[styles.input, styles.pinInput]}
              placeholder="_ _ _ _ _ _"
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
              value={pin}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                setPin(cleaned);
                setError('');
              }}
              maxLength={6}
              editable={!loading}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleVerifyPin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Verify PIN</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={handleResendPin}
              disabled={loading}
            >
              <Text style={styles.linkText}>Resend PIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => { setStep('phone'); setPin(''); setError(''); }}
            >
              <Text style={styles.linkText}>← Change phone number</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        {/* Dev Mode — Skip Login */}
        <View style={styles.devModeSection}>
          <View style={styles.devModeDivider} />
          <Text style={styles.devModeTitle}>🔧 Dev Mode</Text>
          <Text style={styles.devModeDesc}>Skip login and test as:</Text>
          <View style={styles.devRow}>
            {devRoles.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.devBtn, { borderColor: r.color }]}
                onPress={() => handleDevLogin(r.key)}
                disabled={loading}
              >
                <Text style={[styles.devBtnText, { color: r.color }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>PoleSafe © {new Date().getFullYear()}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 72,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.green,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: COLORS.redBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  hint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
    textAlign: 'center',
  },
  verifiedPhone: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.green,
    marginBottom: 20,
    backgroundColor: COLORS.greenBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  countryCode: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRightWidth: 0,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceElevated,
  },
  phoneInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  pinInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 12,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  linkBtn: {
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    color: '#bbb',
  },
  // Dev Mode styles
  devModeSection: {
    width: '100%',
    marginTop: 20,
    marginBottom: 60,
    alignItems: 'center',
  },
  devModeDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 16,
  },
  devModeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#888',
    marginBottom: 4,
  },
  devModeDesc: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 12,
  },
  devRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  devBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  devBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roleSelector: {
    width: '100%',
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  roleBtnSelected: {
    backgroundColor: COLORS.greenBg,
    borderColor: COLORS.green,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleTextSelected: {
    color: COLORS.green,
  },
});
