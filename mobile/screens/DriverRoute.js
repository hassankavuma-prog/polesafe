// PoleSafe Mobile — Driver Route Screen
// Vertical timeline view of the driver's daily route with stop management

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
const BLUE = '#1565C0';

export default function DriverRoute({ navigation }) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);

  const loadRoute = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const userId = await AsyncStorage.getItem('polesafe_user_id');
      
      const [routeRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/drivers/route`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      if (routeRes.ok) {
        const data = await routeRes.json();
        setRoute(data);
      }
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setDriverInfo(userData);
      }
    } catch (err) {
      console.log('Error loading route:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoute(); }, [loadRoute]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoute();
    setRefreshing(false);
  };

  // Get all stops in order (morning then afternoon)
  const allStops = [
    ...(route?.morningStops || []).map(s => ({ ...s, group: '🌅 Morning Drop-off' })),
    ...(route?.afternoonStops || []).map(s => ({ ...s, group: '🌇 Afternoon Pickup' })),
  ];

  const pendingStops = allStops.filter(s =>
    ['scheduled', 'en_route'].includes(s.status)
  );

  const completedStops = allStops.filter(s =>
    ['picked_up', 'dropped_off', 'gate_confirmed', 'completed'].includes(s.status)
  );

  const handleStartRoute = () => {
    if (allStops.length === 0) {
      Alert.alert('No Stops', 'No route assigned for today.');
      return;
    }
    setIsRouteActive(true);
    setCurrentStopIndex(0);
    Alert.alert('Route Started 🚗', `${allStops.length} stops today. Drive safe!`);
  };

  const handleNextStop = async () => {
    if (!isRouteActive) {
      Alert.alert('Start Route', 'Tap "Start Route" first.');
      return;
    }

    const stop = allStops[currentStopIndex];
    if (!stop) {
      Alert.alert('Route Complete 🎉', 'All stops done for today!');
      setIsRouteActive(false);
      return;
    }

    // Determine next status based on current
    let nextStatus;
    let actionLabel;
    switch (stop.status) {
      case 'scheduled':
        nextStatus = 'en_route';
        actionLabel = 'En Route';
        break;
      case 'en_route':
        nextStatus = stop.group.includes('Morning') ? 'dropped_off' : 'picked_up';
        actionLabel = stop.group.includes('Morning') ? 'Dropped Off' : 'Picked Up';
        break;
      case 'picked_up':
        nextStatus = 'dropped_off';
        actionLabel = 'Dropped Off';
        break;
      case 'dropped_off':
        nextStatus = 'gate_confirmed';
        actionLabel = 'Gate Confirmed';
        break;
      default:
        nextStatus = 'completed';
        actionLabel = 'Complete';
    }

    const stopLabel = `${stop.childId?.name || 'Kid'} — ${actionLabel}`;

    Alert.alert(
      `Update Stop: ${stopLabel}`,
      `Mark this stop as "${actionLabel}"?`,
      [
        { text: 'Skip', style: 'cancel' },
        {
          text: actionLabel,
          onPress: async () => {
            setActionLoading(stop._id);
            try {
              const token = await AsyncStorage.getItem('polesafe_token');
              const res = await fetch(`${API_BASE}/api/drivers/stop/${stop._id}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus }),
              });
              if (!res.ok) throw new Error('Failed to update stop');
              setCurrentStopIndex(prev => prev + 1);
              await loadRoute();
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status) => {
    const config = {
      scheduled: { emoji: '⏳', color: '#9E9E9E', bg: '#F5F5F5' },
      en_route: { emoji: '🚗', color: BLUE, bg: '#E3F2FD' },
      picked_up: { emoji: '👧', color: '#E65100', bg: '#FFF3E0' },
      dropped_off: { emoji: '📍', color: '#7B1FA2', bg: '#F3E5F5' },
      gate_confirmed: { emoji: '✅', color: '#2E7D32', bg: '#E8F5E9' },
      completed: { emoji: '✅', color: '#2E7D32', bg: '#E8F5E9' },
    };
    return config[status] || config.scheduled;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loadingText}>Loading route...</Text>
      </View>
    );
  }

  const isComplete = allStops.length > 0 && completedStops.length === allStops.length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Driver Badge */}
      {driverInfo && (
        <View style={styles.badgeCard}>
          <Text style={styles.badgeTitle}>🪪 My PoleSafe Driver ID</Text>
          <Text style={styles.badgeId}>{driverInfo.driverIdNumber || 'Not assigned'}</Text>
          <Text style={styles.badgeHint}>Show this to teachers for classroom pickups</Text>
          {driverInfo.isDriverIdVerified && (
            <Text style={styles.badgeVerified}>✅ Verified Driver</Text>
          )}
        </View>
      )}

      {/* Route Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>🗺️ Today's Route</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>{completedStops.length}</Text>
            <Text style={styles.headerStatLabel}>Done</Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatNum, { color: BLUE }]}>{pendingStops.length}</Text>
            <Text style={styles.headerStatLabel}>Pending</Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>{allStops.length}</Text>
            <Text style={styles.headerStatLabel}>Total</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: allStops.length > 0 ? `${(completedStops.length / allStops.length) * 100}%` : '0%' },
            ]}
          />
        </View>
      </View>

      {/* Action Buttons */}
      {!isRouteActive && !isComplete && (
        <TouchableOpacity style={styles.startBtn} onPress={handleStartRoute}>
          <Text style={styles.startBtnText}>▶️ Start Route</Text>
        </TouchableOpacity>
      )}

      {isRouteActive && !isComplete && (
        <TouchableOpacity
          style={[styles.nextBtn, actionLoading && styles.btnDisabled]}
          onPress={handleNextStop}
          disabled={actionLoading !== null}
        >
          {actionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>
              🏁 Next Stop
              {allStops[currentStopIndex] && `: ${allStops[currentStopIndex].childId?.name || ''}`}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {isComplete && (
        <View style={styles.completeBanner}>
          <Text style={styles.completeText}>🎉 All Stops Complete!</Text>
        </View>
      )}

      {/* Current Stop Highlight */}
      {isRouteActive && allStops[currentStopIndex] && (
        <View style={styles.currentStopCard}>
          <Text style={styles.currentLabel}>⏱️ CURRENT STOP</Text>
          <Text style={styles.currentName}>
            {allStops[currentStopIndex].childId?.name || 'Unknown'}
          </Text>
          <Text style={styles.currentTime}>
            {new Date(allStops[currentStopIndex].scheduledPickupTime).toLocaleTimeString('en-UG', {
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
          <StatusBadgeInline status={allStops[currentStopIndex].status} />
        </View>
      )}

      {/* Vertical Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>📋 Route Stops</Text>

        {allStops.length === 0 ? (
          <Text style={styles.emptyText}>No stops assigned for today</Text>
        ) : (
          <>
            {/* Morning group header */}
            {route?.morningStops?.length > 0 && (
              <Text style={styles.groupHeader}>🌅 Morning Drop-offs</Text>
            )}
            {route?.morningStops?.map((stop, idx) => (
              <StopRow
                key={stop._id}
                stop={stop}
                index={idx}
                isNext={isRouteActive && allStops.indexOf(stop) === currentStopIndex}
                isCompleted={['picked_up', 'dropped_off', 'gate_confirmed', 'completed'].includes(stop.status)}
                getStatusBadge={getStatusBadge}
              />
            ))}

            {/* Afternoon group header */}
            {route?.afternoonStops?.length > 0 && (
              <Text style={[styles.groupHeader, { marginTop: 16 }]}>
                🌇 Afternoon Pickups
              </Text>
            )}
            {route?.afternoonStops?.map((stop, idx) => (
              <StopRow
                key={stop._id}
                stop={stop}
                index={route?.morningStops?.length || 0 + idx}
                isNext={isRouteActive && allStops.indexOf(stop) === currentStopIndex}
                isCompleted={['picked_up', 'dropped_off', 'gate_confirmed', 'completed'].includes(stop.status)}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Individual stop row in the timeline
function StopRow({ stop, index, isNext, isCompleted, getStatusBadge }) {
  const badge = getStatusBadge(stop.status);
  const time = stop.scheduledPickupTime
    ? new Date(stop.scheduledPickupTime).toLocaleTimeString('en-UG', {
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  const pickupCode = stop.pickupCode || stop.childId?.pickupCode;

  return (
    <View style={[styles.stopRow, isNext && styles.stopRowNext]}>
      {/* Timeline left */}
      <View style={styles.timelineCol}>
        <View style={[styles.timelineDot, isCompleted && styles.dotCompleted, isNext && styles.dotNext]} />
        {index < 0 && <View style={[styles.timelineLine, isCompleted && styles.lineCompleted]} />}
      </View>
      {/* Content */}
      <View style={styles.stopContent}>
        <Text style={styles.stopTime}>{time}</Text>
        <Text style={styles.stopName}>{stop.childId?.name || 'Unknown'}</Text>
        <Text style={styles.stopSchool}>{stop.schoolId?.name || stop.childId?.school?.name || 'School'}</Text>
        
        {/* Pickup Word */}
        {pickupCode && (
          <View style={styles.pickupCodeBox}>
            <Text style={styles.pickupCodeLabel}>🔐 Word: <Text style={styles.pickupCodeValue}>{pickupCode}</Text></Text>
            <Text style={styles.pickupCodeHint}>Say this word to the child. They won't get in without it!</Text>
          </View>
        )}
        
        <View style={[styles.statusTag, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusTagText, { color: badge.color }]}>
            {badge.emoji} {stop.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Inline status badge (used in current stop card)
function StatusBadgeInline({ status }) {
  const config = {
    scheduled: { emoji: '⏳', color: '#9E9E9E', bg: '#F5F5F5' },
    en_route: { emoji: '🚗', color: BLUE, bg: '#E3F2FD' },
    picked_up: { emoji: '👧', color: '#E65100', bg: '#FFF3E0' },
    dropped_off: { emoji: '📍', color: '#7B1FA2', bg: '#F3E5F5' },
    gate_confirmed: { emoji: '✅', color: '#2E7D32', bg: '#E8F5E9' },
    completed: { emoji: '✅', color: '#2E7D32', bg: '#E8F5E9' },
  };
  const c = config[status] || config.scheduled;
  return (
    <View style={[styles.currentBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.currentBadgeText, { color: c.color }]}>
        {c.emoji} {status.replace('_', ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },

  // Header
  headerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  headerStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  headerStat: { alignItems: 'center' },
  headerStatNum: { fontSize: 28, fontWeight: '700', color: '#2E7D32' },
  headerStatLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  progressBar: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: BLUE, borderRadius: 3 },

  // Buttons
  startBtn: { backgroundColor: BLUE, padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 14, elevation: 2 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  nextBtn: { backgroundColor: BLUE, padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 14, elevation: 2 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  completeBanner: { backgroundColor: '#E8F5E9', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 14, borderWidth: 2, borderColor: '#2E7D32' },
  completeText: { fontSize: 18, fontWeight: '700', color: '#2E7D32' },

  // Current Stop
  currentStopCard: {
    backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: BLUE,
  },
  currentLabel: { fontSize: 11, fontWeight: '700', color: BLUE, letterSpacing: 1, marginBottom: 4 },
  currentName: { fontSize: 20, fontWeight: '700', color: '#333' },
  currentTime: { fontSize: 14, color: '#666', marginTop: 2 },
  currentBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  currentBadgeText: { fontSize: 12, fontWeight: '600' },

  // Timeline
  timelineCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#999', fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  groupHeader: { fontSize: 14, fontWeight: '600', color: BLUE, marginBottom: 8, paddingTop: 4 },

  // Stop Row
  stopRow: { flexDirection: 'row', marginBottom: 8, paddingLeft: 4 },
  stopRowNext: { backgroundColor: '#E3F2FD', borderRadius: 8, padding: 8, marginHorizontal: -8 },
  timelineCol: { alignItems: 'center', width: 20, marginRight: 10 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e0e0e0', marginTop: 6 },
  dotCompleted: { backgroundColor: '#2E7D32' },
  dotNext: { backgroundColor: BLUE, width: 16, height: 16, borderRadius: 8, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#e0e0e0', marginTop: 2 },
  lineCompleted: { backgroundColor: '#2E7D32' },
  stopContent: { flex: 1 },
  stopTime: { fontSize: 12, color: '#999', fontWeight: '500' },
  stopName: { fontSize: 16, fontWeight: '600', color: '#333' },
  stopSchool: { fontSize: 12, color: '#666', marginTop: 1 },
  statusTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  statusTagText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  
  // Driver Badge
  badgeCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: BLUE },
  badgeTitle: { fontSize: 13, fontWeight: '700', color: BLUE, marginBottom: 6 },
  badgeId: { fontSize: 22, fontWeight: '800', color: '#1565C0', marginBottom: 4 },
  badgeHint: { fontSize: 11, color: '#666', marginBottom: 4 },
  badgeVerified: { fontSize: 11, fontWeight: '600', color: '#2E7D32', marginTop: 2 },
  
  // Pickup Code in Stop
  pickupCodeBox: { backgroundColor: '#FFF3E0', borderRadius: 6, padding: 8, marginTop: 6, borderLeftWidth: 2, borderLeftColor: '#FF9800' },
  pickupCodeLabel: { fontSize: 12, fontWeight: '600', color: '#E65100' },
  pickupCodeValue: { fontSize: 14, fontWeight: '800', color: '#E65100' },
  pickupCodeHint: { fontSize: 10, color: '#666', marginTop: 2, fontStyle: 'italic' },
});
