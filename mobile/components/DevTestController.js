// PoleSafe Dev Test Controller v1
// Floating overlay to simulate ride lifecycle on a single device
// Only visible in __DEV__ mode
// From Home to School. And Beyond. 🚸

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  PanResponder, Dimensions, Modal, ScrollView, Platform,
} from 'react-native';

import {
  RIDE_EVENTS,
  onRideEvent,
  simulateParentRequest,
  simulateDriverAccept,
  simulateGPSMovement,
  simulatePinVerification,
  simulateTripCompletion,
  stopSimulation,
} from '../services/rideSocketService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Only render in __DEV__ mode
if (!__DEV__) return () => null;

// ─── Log Entry ───────────────────────────────────────
function LogEntry({ log }) {
  const colors = {
    RIDE_REQUESTED: '#E67E22',
    RIDE_ACCEPTED: '#2E7D32',
    LOCATION_UPDATE: '#1D4ED8',
    PIN_VERIFIED: '#059669',
    RIDE_COMPLETED: '#7C3AED',
  };
  const color = colors[log.event] || '#6B7280';

  return (
    <View style={[logStyles.entry, { borderLeftColor: color }]}>
      <Text style={[logStyles.event, { color }]}>{log.event}</Text>
      <Text style={logStyles.data}>{JSON.stringify(log.data).substring(0, 60)}</Text>
      <Text style={logStyles.time}>{log.time}</Text>
    </View>
  );
}

const logStyles = StyleSheet.create({
  entry: { borderLeftWidth: 3, paddingLeft: 8, paddingVertical: 4, marginBottom: 4, backgroundColor: '#F9FAFB', borderRadius: 4 },
  event: { fontSize: 11, fontWeight: '700' },
  data: { fontSize: 9, color: '#6B7280', marginTop: 1, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  time: { fontSize: 9, color: '#9CA3AF', marginTop: 1 },
});

// ─── Main Dev Controller ────────────────────────────
export default function DevTestController() {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: SCREEN_HEIGHT - 180 });
  const floatingAnim = useRef(new Animated.ValueXY({ x: 16, y: SCREEN_HEIGHT - 180 })).current;
  const logScrollRef = useRef(null);

  // Listen for events and log them
  useEffect(() => {
    if (!visible) return;

    const unsubs = Object.values(RIDE_EVENTS).map(event =>
      onRideEvent(event, (data) => {
        const log = {
          event,
          data,
          time: new Date().toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setLogs(prev => [log, ...prev].slice(0, 50));
      })
    );

    return () => unsubs.forEach(u => u());
  }, [visible]);

  // Floating drag handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const x = Math.max(0, Math.min(SCREEN_WIDTH - 50, gesture.moveX - 25));
        const y = Math.max(0, Math.min(SCREEN_HEIGHT - 50, gesture.moveY - 25));
        floatingAnim.setValue({ x, y });
      },
      onPanResponderRelease: (_, gesture) => {
        setPosition({
          x: Math.max(0, Math.min(SCREEN_WIDTH - 50, gesture.moveX - 25)),
          y: Math.max(0, Math.min(SCREEN_HEIGHT - 50, gesture.moveY - 25)),
        });
      },
    })
  ).current;

  const addLog = (event, data) => {
    setLogs(prev => [{
      event,
      data,
      time: new Date().toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }, ...prev].slice(0, 50));
  };

  // --- Mock Actions ---

  const handleSendParentRequest = () => {
    const data = simulateParentRequest();
    addLog('USER_ACTION', 'Sent mock parent ride request');
  };

  const handleSimulateDriverAccept = () => {
    const data = simulateDriverAccept();
    addLog('USER_ACTION', 'Simulated driver accepting');
  };

  const handleStartGPS = () => {
    if (gpsActive) {
      stopSimulation();
      setGpsActive(false);
      addLog('USER_ACTION', 'Stopped GPS simulation');
      return;
    }
    setGpsActive(true);
    addLog('USER_ACTION', 'Starting GPS movement simulation');
    simulateGPSMovement((point, index) => {
      addLog('GPS_TICK', point.label);
    });
  };

  const handleAutoFillPin = () => {
    const pin = '4821';
    simulatePinVerification(pin);
    addLog('USER_ACTION', `Auto-filled PIN: ${pin}`);
  };

  const handleSimulateComplete = () => {
    simulateTripCompletion();
    addLog('USER_ACTION', 'Simulated trip completion');
    setSimulating(false);
    setGpsActive(false);
  };

  const handleFullDemo = () => {
    setSimulating(true);
    addLog('USER_ACTION', 'Starting full demo flow...');

    // Step 1: Parent requests ride
    setTimeout(() => {
      handleSendParentRequest();
      // Step 2: Driver accepts (after 2s)
      setTimeout(() => {
        handleSimulateDriverAccept();
        // Step 3: Auto-fill PIN (after 1.5s)
        setTimeout(() => {
          handleAutoFillPin();
          // Step 4: Start GPS movement (after 1.5s)
          setTimeout(() => {
            handleStartGPS();
            // Step 5: Complete after GPS finishes (auto-handled by service)
          }, 1500);
        }, 1500);
      }, 2000);
    }, 1000);
  };

  // Don't render if not visible AND not showing the floating button
  // Always show the floating button

  return (
    <>
      {/* Floating Trigger Button */}
      <Animated.View
        style={[
          styles.floatingBtn,
          { transform: [{ translateX: floatingAnim.x }, { translateY: floatingAnim.y }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() => {
            setVisible(true);
            stopSimulation();
            setGpsActive(false);
          }}
          activeOpacity={0.8}
          style={styles.floatingTouchArea}
        >
          <Text style={styles.floatingBtnText}>🧪</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Dev Panel Modal */}
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🧪 Dev Test Controller</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollArea}>
              {/* Quick Actions */}
              <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
              <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleSendParentRequest}>
                  <Text style={styles.actionEmoji}>🚀</Text>
                  <Text style={styles.actionLabel}>Send Mock{'\n'}Parent Request</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleSimulateDriverAccept}>
                  <Text style={styles.actionEmoji}>🚗</Text>
                  <Text style={styles.actionLabel}>Simulate{'\n'}Driver Accepting</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, gpsActive && styles.actionBtnActive]} onPress={handleStartGPS}>
                  <Text style={styles.actionEmoji}>📍</Text>
                  <Text style={styles.actionLabel}>{gpsActive ? 'Stop GPS' : 'Start Mock{'}GPS Movement'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleAutoFillPin}>
                  <Text style={styles.actionEmoji}>🔑</Text>
                  <Text style={styles.actionLabel}>Auto-Fill{'\n'}Child PIN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleSimulateComplete}>
                  <Text style={styles.actionEmoji}>🏁</Text>
                  <Text style={styles.actionLabel}>Simulate Trip{'\n'}Completion</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1D4ED8' }]} onPress={handleFullDemo}>
                  <Text style={styles.actionEmoji}>🎬</Text>
                  <Text style={[styles.actionLabel, { color: '#fff' }]}>Full Auto{'\n'}Demo</Text>
                </TouchableOpacity>
              </View>

              {/* Event Log */}
              <Text style={styles.sectionLabel}>EVENT LOG ({logs.length})</Text>
              {logs.length === 0 ? (
                <Text style={styles.emptyLog}>No events yet. Tap a button to simulate a ride lifecycle event.</Text>
              ) : (
                logs.slice(0, 20).map((log, i) => <LogEntry key={`${log.event}-${i}`} log={log} />)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    zIndex: 9999,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  floatingTouchArea: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBtnText: { fontSize: 22 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  closeBtn: { fontSize: 18, color: '#6B7280', fontWeight: '700', padding: 4 },

  scrollArea: { paddingHorizontal: 16 },

  // Actions
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 10,
  },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    width: (SCREEN_WIDTH - 56) / 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtnActive: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  actionEmoji: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 10, fontWeight: '600', color: '#374151', textAlign: 'center', lineHeight: 14 },

  // Log
  emptyLog: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
});
