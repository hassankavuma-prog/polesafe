// PoleSafe Mobile — Parent Payment Screen
// Flutterwave MoMo payment for ride bookings

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { COLORS } from '../theme';

const NETWORKS = ['MTN', 'Airtel', 'Africell'];

export default function ParentPayment({ navigation, route }) {
  const { rideId, amount, kidName } = route?.params || {};
  const [method, setMethod] = useState('mobile_money');
  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    loadPayments();
    loadSavedPaymentMethod();
  }, []);

  const loadSavedPaymentMethod = async () => {
    try {
      const saved = await AsyncStorage.getItem('polesafe_payment');
      if (saved) {
        const p = JSON.parse(saved);
        setNetwork(p.network || 'MTN');
        setPhone(p.phone || '');
      }
    } catch {}
  };

  const savePaymentMethod = async () => {
    try {
      await AsyncStorage.setItem('polesafe_payment', JSON.stringify({ network, phone }));
    } catch {}

  const loadPayments = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const [payRes, creditRes] = await Promise.all([
        fetch(`${API_BASE}/api/payments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/credits`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (payRes.ok) {
        const d = await payRes.json();
        setPayments(d.payments || []);
      }
      if (creditRes.ok) {
        const d = await creditRes.json();
        setBalance(d.balance || 0);
      }
    } catch {}
  };

  const payWithMoMo = async () => {
    if (!phone) return Alert.alert('Enter your MoMo number');
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/payments/momo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId,
          amount,
          provider: network.toLowerCase(),
          phone,
          kidName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert(
        '✅ Payment Initiated',
        `Please check your phone (${phone}) and enter your MoMo PIN to complete payment.\n\nReference: ${data.reference || data.transactionRef || ''}`
      );
      loadPayments();
    } catch (err) {
      Alert.alert('Payment Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const payWithCredits = async () => {
    Alert.alert('Pay with Credits', `Use ${amount} UGX from your credit balance of ${balance} UGX?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pay with Credits',
        onPress: async () => {
          setLoading(true);
          try {
            const token = await AsyncStorage.getItem('polesafe_token');
            const res = await fetch(`${API_BASE}/api/credits/use`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ rideId, amount }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            Alert.alert('✅ Paid!', `Payment of ${amount} UGX completed using credits.`);
            loadPayments();
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>💳 Payment</Text>

      {rideId && (
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Amount Due</Text>
          <Text style={styles.summaryAmount}>{amount?.toLocaleString() || 0} UGX</Text>
          {kidName && <Text style={styles.summaryKid}>For: {kidName}</Text>}
        </View>
      )}

      {balance > 0 && (
        <TouchableOpacity style={styles.creditBanner} onPress={payWithCredits}>
          <Text style={styles.creditText}>💰 You have {balance.toLocaleString()} UGX in credits</Text>
          <Text style={styles.creditSub}>Tap to pay with credits</Text>
        </TouchableOpacity>
      )}

      {/* Payment Methods */}
      <Text style={styles.sectionTitle}>Payment Method</Text>
      <View style={styles.methodRow}>
        <TouchableOpacity
          style={[styles.methodCard, method === 'mobile_money' && styles.methodActive]}
          onPress={() => setMethod('mobile_money')}
        >
          <Text style={styles.methodEmoji}>📱</Text>
          <Text style={styles.methodLabel}>Mobile Money</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodCard, method === 'card' && styles.methodActive]}
          onPress={() => setMethod('card')}
        >
          <Text style={styles.methodEmoji}>💳</Text>
          <Text style={styles.methodLabel}>Card</Text>
        </TouchableOpacity>
      </View>

      {method === 'mobile_money' && (
        <>
          <Text style={styles.label}>Network</Text>
          <View style={styles.chipRow}>
            {NETWORKS.map(n => (
              <TouchableOpacity key={n} style={[styles.chip, network === n && styles.chipActive]} onPress={() => setNetwork(n)}>
                <Text style={[styles.chipText, network === n && styles.chipTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>MoMo Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+256700000000"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={[styles.payBtn, loading && { opacity: 0.6 }]} onPress={payWithMoMo} disabled={loading}>
            <Text style={styles.payBtnText}>{loading ? 'Processing...' : `Pay ${amount?.toLocaleString() || 0} UGX via ${network} MoMo`}</Text>
          </TouchableOpacity>
        </>
      )}

      {method === 'card' && (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonIcon}>💳</Text>
          <Text style={styles.comingSoonText}>Card payments coming soon</Text>
          <Text style={styles.comingSoonSub}>Use Mobile Money for now</Text>
        </View>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {payments.slice(0, 10).map(p => (
            <View key={p._id} style={styles.paymentRow}>
              <View>
                <Text style={styles.paymentRef}>{p.reference || p.transactionRef || 'Payment'}</Text>
                <Text style={styles.paymentDate}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</Text>
              </View>
              <View style={styles.paymentRight}>
                <Text style={styles.paymentAmount}>{p.amount?.toLocaleString()} UGX</Text>
                <Text style={[styles.paymentStatus, p.status === 'completed' && styles.statusCompleted]}>
                  {p.status === 'completed' ? '✅' : p.status === 'pending' ? '⏳' : '❌'}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#4361ee', marginBottom: 20 },
  summary: { backgroundColor: '#eef0ff', padding: 20, borderRadius: 12, marginBottom: 16, alignItems: 'center', borderWidth: 2, borderColor: '#4361ee' },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryAmount: { fontSize: 32, fontWeight: '800', color: '#4361ee', marginVertical: 4 },
  summaryKid: { fontSize: 14, color: '#888' },
  creditBanner: { backgroundColor: '#fff8e1', padding: 14, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#ffb300' },
  creditText: { fontSize: 15, fontWeight: '600', color: '#333' },
  creditSub: { fontSize: 12, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#333', marginBottom: 12, marginTop: 8 },
  methodRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  methodCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e0e0eb' },
  methodActive: { borderColor: '#4361ee', backgroundColor: '#eef0ff' },
  methodEmoji: { fontSize: 28, marginBottom: 6 },
  methodLabel: { fontSize: 13, fontWeight: '500', color: '#555' },
  label: { fontSize: 14, fontWeight: '500', color: '#555', marginBottom: 8, marginTop: 12 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 2, borderColor: '#e0e0eb' },
  chipActive: { borderColor: '#4361ee', backgroundColor: '#eef0ff' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextActive: { color: '#4361ee', fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 2, borderColor: '#e0e0eb', marginBottom: 20, color: '#333' },
  payBtn: { backgroundColor: '#4361ee', padding: 16, borderRadius: 12, alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  comingSoon: { alignItems: 'center', padding: 32, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#e0e0eb', borderStyle: 'dashed' },
  comingSoonIcon: { fontSize: 48, marginBottom: 8 },
  comingSoonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  comingSoonSub: { fontSize: 13, color: '#999', marginTop: 4 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  paymentRef: { fontSize: 14, fontWeight: '500' },
  paymentDate: { fontSize: 12, color: '#999', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 14, fontWeight: '600' },
  paymentStatus: { fontSize: 16, marginTop: 2 },
  statusCompleted: { color: '#2e7d32' },
});
