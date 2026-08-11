// PoleSafe Mobile — Feature Voting Screen
// Suggest and vote on new features for PoleSafe

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3001/api/community';

const FEATURE_CATEGORIES = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'safety', label: 'Safety', icon: '🛡️' },
  { id: 'tracking', label: 'Tracking', icon: '📍' },
  { id: 'payments', label: 'Payments', icon: '💰' },
  { id: 'communication', label: 'Chat', icon: '📞' },
  { id: 'rides', label: 'Rides', icon: '🚗' },
];

export default function FeatureVoting({ navigation }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchFeatures = useCallback(async (cat = selectedCategory) => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const url = `${API_URL}/features?category=${cat}&status=${filterStatus}&limit=50`;
      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      setFeatures(data.features || []);
    } catch (e) {
      console.error('Failed to fetch features:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, filterStatus]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchFeatures(selectedCategory);
  }, [selectedCategory, filterStatus]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeatures(selectedCategory);
  };

  const handleVote = async (featureId) => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      if (!token) {
        Alert.alert('Login Required', 'Sign in to vote on features');
        return;
      }
      const res = await fetch(`${API_URL}/features/${featureId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote: 'up' }),
      });
      const data = await res.json();
      if (data.upvoteCount !== undefined) {
        setFeatures(prev => prev.map(f =>
          f._id === featureId ? { ...f, upvoteCount: data.upvoteCount, userVoted: !f.userVoted } : f
        ));
      }
    } catch (e) {
      console.error('Vote failed:', e);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      suggested: { label: '💡 Suggested', color: '#757575', bg: '#f5f5f5' },
      under_review: { label: '🔍 Under Review', color: '#F57C00', bg: '#FFF3E0' },
      planned: { label: '📋 Planned', color: '#1565C0', bg: '#E3F2FD' },
      in_development: { label: '⚙️ Building', color: '#2E7D32', bg: '#E8F5E9' },
      launched: { label: '🚀 Launched!', color: '#1B5E20', bg: '#C8E6C9' },
      declined: { label: '❌ Declined', color: '#C62828', bg: '#FFEBEE' },
    };
    return badges[status] || badges.suggested;
  };

  const renderFeature = ({ item }) => (
    <View style={styles.featureCard}>
      <View style={styles.featureHeader}>
        <Text style={styles.featureCategory}>
          {item.category === 'safety' ? '🛡️' :
           item.category === 'tracking' ? '📍' :
           item.category === 'payments' ? '💰' :
           item.category === 'communication' ? '📞' :
           item.category === 'rides' ? '🚗' : '📌'} {item.category || 'Other'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBadge(item.status).bg }]}>
          <Text style={[styles.statusText, { color: getStatusBadge(item.status).color }]}>
            {getStatusBadge(item.status).label}
          </Text>
        </View>
      </View>

      <Text style={styles.featureTitle}>{item.title}</Text>
      {item.description ? (
        <Text style={styles.featureDesc} numberOfLines={3}>{item.description}</Text>
      ) : null}

      {item.hamnaAnalysis ? (
        <View style={styles.hamnaBox}>
          <Text style={styles.hamnaLabel}>🤖 Hamna says:</Text>
          <Text style={styles.hamnaText}>{item.hamnaAnalysis}</Text>
        </View>
      ) : null}

      <View style={styles.featureFooter}>
        <TouchableOpacity
          style={[styles.voteBtn, item.userVoted && styles.voteBtnActive]}
          onPress={() => handleVote(item._id)}
        >
          <Ionicons
            name={item.userVoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
            size={22}
            color={item.userVoted ? '#fff' : '#2E7D32'}
          />
          <Text style={[styles.voteCount, item.userVoted && styles.voteCountActive]}>
            {item.upvoteCount || 0} votes
          </Text>
        </TouchableOpacity>

        <Text style={styles.voteWeight}>
          ⚡ Weight: x{item.voteWeight || 1}
        </Text>

        <Text style={styles.featureDate}>
          {new Date(item.createdAt).toLocaleDateString('en-UG', {
            day: 'numeric', month: 'short'
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FEATURE_CATEGORIES}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => {
                setSelectedCategory(item.id);
                setLoading(true);
                fetchFeatures(item.id);
              }}
            >
              <Text style={styles.chipIcon}>{item.icon}</Text>
              <Text style={[
                styles.chipLabel,
                selectedCategory === item.id && styles.chipLabelActive,
              ]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Features List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading feature suggestions...</Text>
        </View>
      ) : (
        <FlatList
          data={features}
          keyExtractor={item => item._id}
          renderItem={renderFeature}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />
          }
          contentContainerStyle={features.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💡</Text>
              <Text style={styles.emptyTitle}>No feature suggestions yet</Text>
              <Text style={styles.emptySubtitle}>
                Have an idea to make PoleSafe better? Suggest a feature!
              </Text>
            </View>
          }
        />
      )}

      {/* Suggest Feature FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewPost', { type: 'feature' })}
      >
        <Text style={styles.fabIcon}>💡</Text>
        <Text style={styles.fabLabel}>Suggest Feature</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#666', fontSize: 14 },
  categoryRow: {
    paddingVertical: 8, paddingLeft: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
  },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#2E7D32' },
  chipIcon: { fontSize: 14, marginRight: 4 },
  chipLabel: { fontSize: 13, color: '#555' },
  chipLabelActive: { color: '#fff', fontWeight: '600' },
  listContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 100 },
  featureCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  featureHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  featureCategory: { fontSize: 11, color: '#555' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '600' },
  featureTitle: { fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 4 },
  featureDesc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
  hamnaBox: {
    backgroundColor: '#F3E5F5', borderRadius: 8, padding: 8, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: '#7B1FA2',
  },
  hamnaLabel: { fontSize: 11, color: '#7B1FA2', fontWeight: '600', marginBottom: 2 },
  hamnaText: { fontSize: 12, color: '#555', fontStyle: 'italic', lineHeight: 16 },
  featureFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8,
  },
  voteBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 16,
  },
  voteBtnActive: { backgroundColor: '#2E7D32' },
  voteCount: { fontSize: 12, color: '#2E7D32', fontWeight: '600', marginLeft: 4 },
  voteCountActive: { color: '#fff' },
  voteWeight: { fontSize: 11, color: '#999' },
  featureDate: { fontSize: 11, color: '#aaa' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    backgroundColor: '#7B1FA2', borderRadius: 28,
    paddingHorizontal: 20, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  fabIcon: { fontSize: 18, marginRight: 8 },
  fabLabel: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
