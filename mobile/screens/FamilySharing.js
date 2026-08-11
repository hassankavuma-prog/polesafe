// PoleSafe Mobile — Family Sharing Screen
// Link accounts so both parents can monitor kids

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { COLORS } from '../theme';

export default function FamilySharing({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadFamily();
  }, []);

  const loadFamily = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/family/my-family`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFamilyData(data.links?.[0] || null);
      }
    } catch (err) {
      console.error('Load family error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    setCreating(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/family/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      Alert.alert('Family Link Created!', 
        `Share this code with your partner:\n\n${data.joinCode}\n\nThey enter it in their app to link.`);
      loadFamily();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return Alert.alert('Enter a code');
    setJoining(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/family/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      Alert.alert('✅ Linked!', data.message);
      loadFamily();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove Family Link?', 
      'You will lose shared kid tracking. They will not be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('polesafe_token');
            const res = await fetch(`${API_BASE}/api/family/${familyData._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to remove');
            setFamilyData(null);
            Alert.alert('Removed', 'Family link has been removed.');
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        }},
      ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
        <Text style={styles.title}>Family Sharing</Text>
        <Text style={styles.subtitle}>
          Link with your partner to share kid tracking. Both parents can book rides and monitor kids — without calling each other.
        </Text>
      </View>

      {/* Already linked */}
      {familyData ? (
        <View style={styles.linkedCard}>
          <Text style={styles.linkedIcon}>✅</Text>
          <Text style={styles.linkedTitle}>Family Linked</Text>
          {familyData.partner ? (
            <Text style={styles.linkedDetail}>
              Linked with {familyData.partner.name || 'your partner'}
            </Text>
          ) : null}
          <View style={styles.permissionList}>
            <Text style={styles.permissionItem}>👦 See all kids' rides</Text>
            <Text style={styles.permissionItem}>📍 Track in real-time</Text>
            <Text style={styles.permissionItem}>
              {familyData.permissions?.coParentCanBook ? '✅ Both can book' : '📋 Primary books'}
            </Text>
            <Text style={styles.permissionItem}>🚗 Personal rides stay private</Text>
          </View>
          <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
            <Text style={styles.removeBtnText}>Remove Link</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Create Link */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👑 I'm the Primary Parent</Text>
            <Text style={styles.cardText}>
              Create a join code. Your partner enters this code in their app to link accounts.
            </Text>
            <TouchableOpacity 
              style={[styles.primaryBtn, creating && { opacity: 0.6 }]} 
              onPress={handleCreateLink}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>🔗 Create Join Code</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Join Link */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🤝 I'm the Partner</Text>
            <Text style={styles.cardText}>
              Enter the join code your partner shared with you. You'll see all kids and can book rides.
            </Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter 6-character code"
              placeholderTextColor="#999"
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase().slice(0, 6))}
              maxLength={6}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={[styles.primaryBtn, joining && { opacity: 0.6 }]} 
              onPress={handleJoin}
              disabled={joining || !joinCode.trim()}
            >
              {joining ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>🔗 Join Family</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🔒 Privacy</Text>
            <Text style={styles.infoText}>
              Only kid tracking is shared. Personal rides and account settings stay private to each parent.
            </Text>
            <Text style={styles.infoTitle}>📅 Bookings</Text>
            <Text style={styles.infoText}>
              Both parents can book. The system prevents double-booking the same kid at the same time.
            </Text>
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#333' },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 4, paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 6 },
  cardText: { fontSize: 13, color: '#666', marginBottom: 14, lineHeight: 18 },
  primaryBtn: {
    backgroundColor: '#2E7D32', padding: 14, borderRadius: 10, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  codeInput: {
    borderWidth: 2, borderColor: '#e0e0eb', borderRadius: 10, padding: 14,
    fontSize: 22, textAlign: 'center', letterSpacing: 8, fontWeight: '700',
    marginBottom: 12, backgroundColor: '#f8f9ff',
  },
  linkedCard: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 20, marginBottom: 12,
    borderWidth: 2, borderColor: '#2E7D32',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  linkedIcon: { fontSize: 32, textAlign: 'center', marginBottom: 8 },
  linkedTitle: { fontSize: 20, fontWeight: '700', color: '#2E7D32', textAlign: 'center', marginBottom: 4 },
  linkedDetail: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 12 },
  permissionList: { marginTop: 8 },
  permissionItem: { fontSize: 13, color: '#555', marginBottom: 4, paddingLeft: 8 },
  removeBtn: {
    marginTop: 16, backgroundColor: '#fff', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#C62828', alignItems: 'center',
  },
  removeBtnText: { color: '#C62828', fontWeight: '600', fontSize: 14 },
  infoCard: {
    backgroundColor: '#FFF8E1', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#FFE082',
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#E65100', marginTop: 8, marginBottom: 4 },
  infoText: { fontSize: 12, color: '#555', lineHeight: 18 },
});
