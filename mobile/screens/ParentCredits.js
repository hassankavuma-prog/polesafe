// PoleSafe Mobile — Parent Credits Screen
// View credit balance, history, and redemption options

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';

export default function ParentCredits({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/credits`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || 0);
        setHistory(data.history || data.transactions || []);
      }
    } catch (err) {
      console.log('Error loading credits:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCredits();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('en-UG');
  };

  const handleRedeem = (type) => {
    const labels = {
      next_term: '💰 Apply to Next Term Fees',
      ride: '🚗 Use for PoleSafe Ride',
      cashback: '💵 Cashback to Mobile Money',
    };

    Alert.alert(
      'Redeem Credits',
      `Apply ${formatCurrency(balance)} UGX to "${labels[type]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('polesafe_token');
              const res = await fetch(`${API_BASE}/api/credits/redeem`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ purpose: type }),
              });
              if (res.ok) {
                Alert.alert('Redeemed ✅', `Credits applied successfully.`);
                loadCredits();
              } else {
                throw new Error('Redemption failed');
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const getHistoryIcon = (item) => {
    switch (item.type) {
      case 'credit': return '➕';
      case 'debit': return '➖';
      case 'refund': return '🔄';
      case 'referral': return '🎉';
      case 'redemption': return '💳';
      default: return '📝';
    }
  };

  const getHistoryStatus = (item) => {
    if (!item.status) return '✅';
    const icons = { pending: '⏳', completed: '✅', failed: '❌', cancelled: '🚫' };
    return icons[item.status] || '✅';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const renderHistoryItem = ({ item, index }) => (
    <View key={item._id || index} style={styles.historyRow}>
      <Text style={styles.historyIcon}>{getHistoryIcon(item)}</Text>
      <View style={styles.historyInfo}>
        <Text style={styles.historyReason}>{item.reason || item.description || 'Transaction'}</Text>
        <Text style={styles.historyDate}>
          {item.date ? new Date(item.date).toLocaleDateString('en-UG') : ''}
          {item.status ? ` • ${getHistoryStatus(item)} ${item.status}` : ''}
        </Text>
      </View>
      <Text style={[
        styles.historyAmount,
        { color: (item.type === 'credit' || item.type === 'refund') ? '#2E7D32' : '#C62828' },
      ]}>
        {(item.type === 'credit' || item.type === 'refund') ? '+' : '-'}{formatCurrency(item.amount)} UGX
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>💰 Credit Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
        <Text style={styles.balanceCurrency}>UGX</Text>

        {balance > 0 && (
          <View style={styles.redeemSection}>
            <Text style={styles.redeemLabel}>Redeem for:</Text>
            <View style={styles.redeemRow}>
              <TouchableOpacity
                style={styles.redeemBtn}
                onPress={() => handleRedeem('next_term')}
              >
                <Text style={styles.redeemBtnIcon}>💰</Text>
                <Text style={styles.redeemBtnText}>Next Term</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.redeemBtn}
                onPress={() => handleRedeem('ride')}
              >
                <Text style={styles.redeemBtnIcon}>🚗</Text>
                <Text style={styles.redeemBtnText}>PoleSafe Ride</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.redeemBtn}
                onPress={() => handleRedeem('cashback')}
              >
                <Text style={styles.redeemBtnIcon}>💵</Text>
                <Text style={styles.redeemBtnText}>Cashback</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {balance === 0 && (
          <View style={styles.noBalance}>
            <Text style={styles.noBalanceText}>
              No credits available. Credits are earned through referrals, promotions, and ride adjustments.
            </Text>
          </View>
        )}
      </View>

      {/* How Credits Work */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How Credits Work</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoBullet}>🎉</Text>
          <Text style={styles.infoText}>Earn 10,000 UGX per referral when they sign up</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoBullet}>🔄</Text>
          <Text style={styles.infoText}>Automatic refunds for cancelled rides go to credits</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoBullet}>📅</Text>
          <Text style={styles.infoText}>Credits roll over each term</Text>
        </View>
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>Transaction History</Text>

      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <View style={styles.historyCard}>
          {history.map((item, index) => renderHistoryItem({ item, index }))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },

  // Balance
  balanceCard: { backgroundColor: '#2E7D32', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 4 },
  balanceLabel: { fontSize: 14, color: '#E8F5E9', fontWeight: '500', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { fontSize: 48, fontWeight: '800', color: '#fff' },
  balanceCurrency: { fontSize: 14, color: '#A5D6A7', fontWeight: '600', marginBottom: 20 },

  // Redeem
  redeemSection: { width: '100%', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 16 },
  redeemLabel: { fontSize: 13, color: '#A5D6A7', marginBottom: 10, textAlign: 'center' },
  redeemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  redeemBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 10, alignItems: 'center' },
  redeemBtnIcon: { fontSize: 22, marginBottom: 4 },
  redeemBtnText: { fontSize: 11, fontWeight: '600', color: '#fff', textAlign: 'center' },

  // No balance
  noBalance: { paddingTop: 8 },
  noBalanceText: { fontSize: 12, color: '#A5D6A7', textAlign: 'center', lineHeight: 18 },

  // Info
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  infoTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  infoBullet: { fontSize: 14, marginRight: 8 },
  infoText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },

  // Section
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#333' },

  // History
  historyCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 1 },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  historyIcon: { fontSize: 18, marginRight: 10 },
  historyInfo: { flex: 1 },
  historyReason: { fontSize: 14, fontWeight: '500', color: '#333' },
  historyDate: { fontSize: 11, color: '#999', marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: '700', marginLeft: 8 },

  // Empty
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', elevation: 1 },
  emptyText: { fontSize: 14, color: '#999' },
});
