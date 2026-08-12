import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { isApproved as checkDriverVerified, getVerificationStatus, VERIFICATION_STATUS } from '../services/driverVerificationService';

const ROLES = [
  { key: 'parent', label: 'Parent / Family', icon: '🏠', desc: 'Book, track, credits, schedules' },
  { key: 'driver', label: 'Driver', icon: '🚗', desc: 'Trips, route, earnings, safety checks' },
  { key: 'rider', label: 'Rider', icon: '🧍', desc: 'Request rides and ride hailing' },
  { key: 'school_admin', label: 'School Admin', icon: '🏫', desc: 'Roster, gate checks, broadcast' },
  { key: 'dispatcher', label: 'Dispatcher', icon: '🛡️', desc: 'Safety ops and incident triage' },
  { key: 'ops_dispatcher', label: 'Ops Dispatcher', icon: '🛡️', desc: 'Safety operations and incident response' },
];

export default function RoleSwitcherScreen({ navigation, route }) {
  const [currentRole, setCurrentRole] = useState('parent');
  const [availableRoles, setAvailableRoles] = useState(['parent']);
  const [pendingRoles, setPendingRoles] = useState([]);
  const [driverVerified, setDriverVerified] = useState(false);

  useEffect(() => {
    (async () => {
      const role = (await AsyncStorage.getItem('userRole')) || 'parent';
      try {
        const v = await getVerificationStatus();
        setDriverVerified(v?.status === VERIFICATION_STATUS.APPROVED);
      } catch {}
      const rolesRaw = await AsyncStorage.getItem('userRoles');
      const roles = rolesRaw ? JSON.parse(rolesRaw) : [role];
      const pendingRaw = await AsyncStorage.getItem('pendingRoles');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
      setCurrentRole(role);
      setAvailableRoles(Array.isArray(roles) ? Array.from(new Set([role, ...roles])) : [role]);
      setPendingRoles(Array.isArray(pending) ? pending : []);
    })();
  }, []);

  const requestDriverAccess = async () => {
    const pending = Array.from(new Set([...(pendingRoles || []), 'driver']));
    setPendingRoles(pending);
    await AsyncStorage.setItem('pendingRoles', JSON.stringify(pending));
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      await fetch(`${API_BASE}/api/driver/submit-documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: { requestType: 'role-switch', from: currentRole } }),
      });
    } catch {}
    Alert.alert('Driver access requested', 'Your account stays the same. Driver mode will open after documents are submitted and approved.');
  };

  const activate = async (role) => {
    if (role === 'driver' && !driverVerified) {
      navigation.navigate('DriverComplianceHub');
      return;
    }
    await AsyncStorage.setItem('userRole', role);
    await AsyncStorage.setItem('roleScope', role);
    const existing = JSON.parse((await AsyncStorage.getItem('userRoles')) || '[]');
    const merged = Array.from(new Set([...(Array.isArray(existing) ? existing : []), role]));
    await AsyncStorage.setItem('userRoles', JSON.stringify(merged));
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>Switch Mode</Text>
      <Text style={styles.subtitle}>Use the same account. Pick how you want to work right now.</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Current role</Text>
        <Text style={styles.summaryValue}>{currentRole}</Text>
        <Text style={styles.summaryNote}>Roles attached to this account: {availableRoles.join(', ')}</Text>
      </View>
      {availableRoles.map((role) => {
        const meta = ROLES.find((r) => r.key === role) || { icon: '👤', label: role, desc: '' };
        const active = role === currentRole;
        return (
          <TouchableOpacity key={role} style={[styles.card, active && styles.activeCard]} onPress={() => activate(role)}>
            <Text style={styles.icon}>{meta.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{meta.label}</Text>
              <Text style={styles.desc}>{meta.desc}</Text>
            </View>
            <Text style={styles.activeText}>{active ? 'Current' : (role === 'driver' && !driverVerified ? 'Verify' : 'Use')}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('DriverComplianceHub')}>
        <Text style={styles.linkText}>Open Driver Compliance Hub</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => Alert.alert('Parent can drive too', 'If you already have a parent or rider account, you can request driver onboarding. The account stays the same, but driver mode stays locked until documents are reviewed and approved.')}>
        <Text style={styles.linkText}>Parent wants to drive? Add driver mode</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={requestDriverAccess}>
        <Text style={styles.linkText}>Request Driver Access</Text>
      </TouchableOpacity>
      {pendingRoles.includes('driver') && (
        <Text style={styles.pendingNote}>Driver mode pending: submit documents, then wait for approval.</Text>
      )}
      {!driverVerified && (
        <Text style={styles.pendingNote}>Driver mode is locked until documents are reviewed and approved.</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 6, color: '#475569' },
  summaryCard: { marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: '#EEF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  summaryLabel: { fontSize: 12, fontWeight: '800', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 18, fontWeight: '900', color: '#111827', marginTop: 4 },
  summaryNote: { fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 18 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginTop: 12 },
  activeCard: { borderColor: '#2E7D32', backgroundColor: '#F0FDF4' },
  icon: { fontSize: 26 },
  label: { fontSize: 16, fontWeight: '800', color: '#111827' },
  desc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  activeText: { fontSize: 12, fontWeight: '800', color: '#2E7D32' },
  link: { marginTop: 18, alignItems: 'center' },
  linkText: { color: '#2E7D32', fontWeight: '800' },
  pendingNote: { marginTop: 10, textAlign: 'center', color: '#B45309', fontWeight: '700' },
});
