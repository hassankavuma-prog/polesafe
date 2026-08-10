// PoleSafe Mobile — School Broadcasts Screen
// Parents see announcements from their child's school

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { COLORS } from '../theme';

const TYPE_ICONS = {
  general: '📢',
  emergency: '🚨',
  schedule: '📅',
  fee: '💰',
  event: '🎉',
  holiday: '🏖️',
};

const PRIORITY_COLORS = {
  urgent: '#d32f2f',
  high: '#e65100',
  normal: '#4361ee',
  low: '#888',
};

export default function SchoolBroadcasts({ navigation }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const loadBroadcasts = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/broadcasts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcasts(data.broadcasts || []);
      }
    } catch (err) {
      console.error('Broadcasts load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBroadcasts(); }, [loadBroadcasts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBroadcasts();
    setRefreshing(false);
  };

  const unreadCount = broadcasts.filter(b => !b.readBy?.includes?.('parent')).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📢 School Messages</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount} new</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4361ee" />
        </View>
      ) : broadcasts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptySub}>School announcements will appear here</Text>
        </View>
      ) : (
        broadcasts.map(b => {
          const isExpanded = expanded === b._id;
          const icon = TYPE_ICONS[b.type] || '📢';
          const priorityColor = PRIORITY_COLORS[b.priority] || PRIORITY_COLORS.normal;
          const date = b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-UG', {
            weekday: 'short', day: 'numeric', month: 'short',
          }) : '';

          return (
            <TouchableOpacity
              key={b._id}
              style={styles.card}
              onPress={() => setExpanded(isExpanded ? null : b._id)}
              activeOpacity={0.7}
            >
              {/* Priority Indicator */}
              <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

              <View style={styles.cardContent}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>{icon}</Text>
                  <View style={styles.cardTitleArea}>
                    <Text style={styles.cardTitle} numberOfLines={isExpanded ? undefined : 1}>
                      {b.title}
                    </Text>
                    <Text style={styles.cardDate}>{date}</Text>
                  </View>
                  {b.priority === 'urgent' && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                  )}
                </View>

                {/* Message */}
                <Text style={[styles.cardBody, !isExpanded && styles.cardBodyCollapsed]} numberOfLines={isExpanded ? undefined : 2}>
                  {b.message}
                </Text>

                {/* Read More / Less */}
                {b.message?.length > 100 && (
                  <Text style={styles.readMore}>{isExpanded ? 'Show less' : 'Read more'}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#333', flex: 1 },
  badge: { backgroundColor: '#d32f2f', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  center: { padding: 60, alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#666' },
  emptySub: { fontSize: 14, color: '#999', marginTop: 4 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  priorityBar: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardIcon: { fontSize: 22, marginRight: 10, marginTop: 2 },
  cardTitleArea: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  cardDate: { fontSize: 11, color: '#999', marginTop: 2 },
  urgentBadge: { backgroundColor: '#ffebee', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  urgentText: { fontSize: 10, fontWeight: '700', color: '#d32f2f' },
  cardBody: { fontSize: 14, color: '#555', lineHeight: 20 },
  cardBodyCollapsed: { maxHeight: 0, overflow: 'hidden', marginTop: 0 },
  readMore: { color: '#4361ee', fontSize: 13, fontWeight: '500', marginTop: 8 },
});
