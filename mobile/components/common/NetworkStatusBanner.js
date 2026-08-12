// PoleSafe Network Status Banner v1
// Shows connectivity state at the top of all screens
// Auto-fades when online, stays visible when offline
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Platform,
} from 'react-native';

// ─── State enum ──────────────────────────────────────
const STATUS = {
  ONLINE: 'online',
  LOW: 'low',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown',
};

// ─── Status config ───────────────────────────────────
const STATUS_CONFIG = {
  online: {
    icon: '📶',
    label: 'Online — Live Data Active',
    bg: '#E8F5E9',
    border: '#4CAF50',
    textColor: '#2E7D32',
    autoFade: true,
  },
  low: {
    icon: '⚡',
    label: 'Low Connectivity — Operating in Offline Safety Mode',
    bg: '#FFF8E1',
    border: '#FFA000',
    textColor: '#E65100',
    autoFade: false,
  },
  offline: {
    icon: '🔴',
    label: 'Data Connection Lost — SMS Fallback Ready',
    bg: '#FFEBEE',
    border: '#E53935',
    textColor: '#C62828',
    autoFade: false,
  },
};

// ─── NetInfo shim (pure React, no extra deps) ────────
// Uses fetch with timeout to detect connectivity
// Falls back gracefully if fetch is unavailable
function useNetworkStatus() {
  const [status, setStatus] = useState(STATUS.UNKNOWN);
  const intervalRef = useRef(null);

  const checkConnectivity = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('https://polesafe-api.onrender.com/api/health', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setStatus(STATUS.ONLINE);
      } else {
        setStatus(STATUS.LOW);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus(STATUS.LOW);
      } else {
        setStatus(STATUS.OFFLINE);
      }
    }
  };

  useEffect(() => {
    checkConnectivity();
    intervalRef.current = setInterval(checkConnectivity, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return status;
}

// ─── NetworkStatusBanner Component ───────────────────
export default function NetworkStatusBanner() {
  const status = useNetworkStatus();
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(STATUS.ONLINE);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const config = STATUS_CONFIG[status];
    if (!config) return;

    setCurrentStatus(status);

    if (status === STATUS.ONLINE && config.autoFade) {
      // Show briefly then fade out
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 3000);
    } else {
      // Stay visible for low/offline
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status]);

  if (!visible) return null;

  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.online;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: config.bg,
          borderBottomColor: config.border,
          opacity,
        },
      ]}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.label, { color: config.textColor }]}>{config.label}</Text>
    </Animated.View>
  );
}

// ─── Hook variant for per-screen usage ───────────────

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
  },
  icon: { fontSize: 14, marginRight: 8 },
  label: { fontSize: 12, fontWeight: '600', flex: 1 },
});

export { useNetworkStatus, STATUS };
