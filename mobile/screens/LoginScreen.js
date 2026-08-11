import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3001' // Android emulator → host machine
  : 'http://localhost:3001';

const ROLE_BADGES = {
  parent: { label: 'Parent', color: '#4CAF50', icon: '👨‍👧‍👦' },
  driver: { label: 'Driver', color: '#FF9800', icon: '🚗' },
  school: { label: 'School', color: '#2196F3', icon: '🏫' },
  rider: { label: 'Rider', color: '#7B1FA2', icon: '🛵' },
};

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [step, setStep] = useState('role'); // role → phone → otp → done
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState(null);
  const [maskedPhone, setMaskedPhone] = useState('');
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const formatPhone = (text) => {
    // Only digits, max 10 (Ugandan: 07XXXXXXXX)
    const digits = text.replace(/\D/g, '').slice(0, 10);
    if (digits.length > 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    } else if (digits.length > 3) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    }
    return digits;
  };

  const handleSendOTP = async () => {
    const rawPhone = phone.replace(/\s/g, '');
    if (rawPhone.length < 10) {
      Alert.alert('Error', 'Enter a valid Ugandan phone number (07XXXXXXXX)');
      return;
    }
    if (!selectedRole) {
      Alert.alert('Error', 'Select who you are first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone, role: selectedRole }),
      });
      const data = await res.json();

      if (res.ok) {
        setDevCode(data.devCode);
        setMaskedPhone(data.phone);
        setStep('otp');
        Alert.alert(
          'OTP Sent',
          `Code sent to ${data.phone}\n\nDev code: ${data.devCode}`
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to send code');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const rawPhone = phone.replace(/\s/g, '');
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone, code, role: selectedRole }),
      });
      const data = await res.json();

      if (res.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('userRole', data.user.role);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        setStep('done');
      } else {
        Alert.alert('Error', data.error || 'Invalid code');
        setOtp(['', '', '', '', '', '']);
        otpRefs[0].current?.focus();
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, '');
    setOtp(newOtp);

    // Auto-advance to next field
    if (text && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleDevMode = async (role) => {
    const mockToken = `dev-token-${role}-${Date.now()}`;
    await AsyncStorage.setItem('token', mockToken);
    await AsyncStorage.setItem('userRole', role);
    await AsyncStorage.setItem('userData', JSON.stringify({
      id: `dev-${role}`,
      phone: '0000000000',
      role,
      name: `Dev ${ROLE_BADGES[role]?.label || role} User`,
      isRider: role === 'rider',
      kids: [],
    }));
    setStep('done');
  };

  if (step === 'done') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successText}>Logged in!</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>🚸</Text>
          <Text style={styles.title}>PoleSafe</Text>
          <Text style={styles.subtitle}>School Transport Safety</Text>
        </View>

        {/* Role Selection */}
        {step === 'role' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who are you?</Text>
            {Object.entries(ROLE_BADGES).map(([key, badge]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.roleCard,
                  selectedRole === key && { borderColor: badge.color, backgroundColor: badge.color + '15' },
                ]}
                onPress={() => { setSelectedRole(key); setStep('phone'); }}
              >
                <Text style={styles.roleIcon}>{badge.icon}</Text>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleLabel}>{badge.label}</Text>
                  <Text style={styles.roleDesc}>
                    {key === 'parent' ? 'Track your kids and book rides' :
                     key === 'driver' ? 'Drive for PoleSafe' :
                     key === 'school' ? 'Manage school transport' :
                     'Book rides and join the community'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Phone Input */}
        {step === 'phone' && (
          <View style={styles.section}>
            <View style={styles.selectedRoleBadge}>
              <Text style={styles.badgeText}>
                {ROLE_BADGES[selectedRole]?.icon} {ROLE_BADGES[selectedRole]?.label}
              </Text>
              <TouchableOpacity onPress={() => setStep('role')}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Enter your phone number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(t) => setPhone(formatPhone(t))}
              placeholder="07XX XXX XXX"
              keyboardType="phone-pad"
              maxLength={12}
              autoFocus
            />
            <Text style={styles.hint}>
              We'll send a verification code via SMS
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* OTP Entry */}
        {step === 'otp' && (
          <View style={styles.section}>
            <View style={styles.selectedRoleBadge}>
              <Text style={styles.badgeText}>
                {ROLE_BADGES[selectedRole]?.icon} {ROLE_BADGES[selectedRole]?.label}
              </Text>
              <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}>
                <Text style={styles.changeLink}>Back</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Enter verification code</Text>
            <Text style={styles.phoneDisplay}>
              Code sent to {maskedPhone}
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={otpRefs[i]}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                  ]}
                  value={digit}
                  onChangeText={(t) => handleOtpChange(t, i)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {devCode && (
              <Text style={styles.devHint}>
                DEV: {devCode}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendButton} onPress={handleSendOTP} disabled={loading}>
              <Text style={styles.resendText}>Resend code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dev Mode (always at bottom) */}
        {step !== 'otp' && (
          <View style={styles.devSection}>
            <Text style={styles.devTitle}>⚡ Dev Mode</Text>
            <Text style={styles.devSubtitle}>Skip phone auth for testing</Text>
            <View style={styles.devButtons}>
              {Object.entries(ROLE_BADGES).map(([key, badge]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.devButton, { backgroundColor: badge.color }]}
                  onPress={() => handleDevMode(key)}
                >
                  <Text style={styles.devButtonText}>
                    {badge.icon} {badge.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  // Logo
  logoSection: { alignItems: 'center', marginTop: 60, marginBottom: 30 },
  logo: { fontSize: 64 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  // Sections
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
  // Role cards
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  roleIcon: { fontSize: 28, marginRight: 16 },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  roleDesc: { fontSize: 12, color: '#666' },
  // Phone input
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 20 },
  // OTP
  otpContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 8 },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  otpInputFilled: { borderColor: '#4CAF50' },
  phoneDisplay: { textAlign: 'center', fontSize: 14, color: '#666', marginBottom: 24 },
  devHint: { textAlign: 'center', fontSize: 12, color: '#999', marginBottom: 12 },
  // Buttons
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  resendButton: { alignItems: 'center', padding: 8 },
  resendText: { color: '#4CAF50', fontSize: 14 },
  // Selected role badge
  selectedRoleBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  badgeText: { fontSize: 14, fontWeight: '600', color: '#333' },
  changeLink: { fontSize: 14, color: '#4CAF50' },
  // Dev mode
  devSection: { paddingHorizontal: 24, marginTop: 32 },
  devTitle: { fontSize: 14, fontWeight: '600', color: '#999', textAlign: 'center' },
  devSubtitle: { fontSize: 12, color: '#bbb', textAlign: 'center', marginBottom: 12 },
  devButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  devButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  devButtonText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  // Success
  successIcon: { fontSize: 64, marginBottom: 16 },
  successText: { fontSize: 20, color: '#4CAF50', fontWeight: '600' },
});
