// PoleSafe Mobile — Live Tracking Map Component
// Replaces the map placeholder with a real interactive map
// Falls back gracefully if react-native-maps isn't linked

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  Dimensions, ActivityIndicator,
} from 'react-native';

// Try loading react-native-maps — fallback if not installed
let MapView, Marker, AnimatedRegion;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  AnimatedRegion = Maps.AnimatedRegion;
} catch {
  MapView = null;
  Marker = null;
  AnimatedRegion = null;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_HEIGHT = 280;

const DEFAULT_LOCATION = { latitude: 0.3136, longitude: 32.5811 }; // Kampala center

export default function LiveTrackingMap({
  driverLocation,       // { latitude, longitude, heading?, speed?, eta? }
  pickupLocation,       // { latitude, longitude, label? }
  dropoffLocation,      // { latitude, longitude, label? }
  status,               // ride status — determines map state
  onMapPress,           // optional callback
}) {
  const [mapReady, setMapReady] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const hasDriverLoc = driverLocation?.latitude != null && driverLocation?.longitude != null;
  const driverPos = hasDriverLoc
    ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude }
    : null;
  const pickupPos = pickupLocation?.latitude != null ? pickupLocation : null;
  const dropoffPos = dropoffLocation?.latitude != null ? dropoffLocation : null;

  // Build region — center on driver if available, else pickup, else Kampala
  const region = {
    latitude: driverPos?.latitude || pickupPos?.latitude || DEFAULT_LOCATION.latitude,
    longitude: driverPos?.longitude || pickupPos?.longitude || DEFAULT_LOCATION.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const toggleFollow = useCallback(() => {
    setFollowMode(prev => !prev);
  }, []);

  const onRegionChange = useCallback((newRegion, details) => {
    // If user drags the map, disable auto-follow
    if (details?.isGesture) {
      setFollowMode(false);
    }
  }, []);

  // Re-enable follow and animate to driver position
  const centerOnDriver = useCallback(() => {
    if (mapRef.current && driverPos) {
      mapRef.current.animateToRegion(
        { ...driverPos, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500
      );
      setFollowMode(true);
    }
  }, [driverPos]);

  // Auto-follow driver when location updates
  React.useEffect(() => {
    if (followMode && mapRef.current && driverPos) {
      mapRef.current.animateToRegion(
        { ...driverPos, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        800
      );
    }
  }, [driverPos?.latitude, driverPos?.longitude, followMode]);

  // Map is NOT available (react-native-maps not installed)
  if (!MapView) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackEmoji}>🗺️</Text>
        <Text style={styles.fallbackTitle}>Live Map</Text>
        <Text style={styles.fallbackSub}>Driver location tracking</Text>
        {hasDriverLoc && (
          <>
            <Text style={styles.fallbackCoords}>
              📍 {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
            </Text>
            {driverLocation.eta && (
              <Text style={styles.fallbackEta}>
                ~{driverLocation.eta} min away
              </Text>
            )}
          </>
        )}
        <Text style={styles.fallbackWarning}>
          ⚠️ Install react-native-maps to see the visual map
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* The Map */}
      <View style={styles.mapWrapper}>
        {!mapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#2E7D32" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onMapReady={() => setMapReady(true)}
          onRegionChangeComplete={onRegionChange}
          showsUserLocation={false}
          showsCompass
          showsTraffic={false}
          rotateEnabled={false}
          toolbarEnabled={false}
        >
          {/* Driver Marker */}
          {driverPos && (
            <Marker
              ref={markerRef}
              coordinate={driverPos}
              title="Driver"
              description={
                driverLocation?.speed
                  ? `${(driverLocation.speed * 3.6).toFixed(0)} km/h`
                  : status === 'en_route' ? 'En route' : 'On location'
              }
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.driverMarker}>
                <Text style={styles.driverMarkerEmoji}>
                  {status === 'picked_up' ? '🚐' : '🚗'}
                </Text>
              </View>
            </Marker>
          )}

          {/* Pickup Marker */}
          {pickupPos && (
            <Marker
              coordinate={pickupPos}
              title={pickupPos.label || 'Pickup Location'}
              pinColor="#4361ee"
              anchor={{ x: 0.5, y: 1 }}
            />
          )}

          {/* Dropoff Marker */}
          {dropoffPos && (
            <Marker
              coordinate={dropoffPos}
              title={dropoffPos.label || 'School / Dropoff'}
              pinColor="#2E7D32"
              anchor={{ x: 0.5, y: 1 }}
            />
          )}
        </MapView>

        {/* GPS Follow Controls */}
        <View style={styles.mapOverlay}>
          <TouchableOpacity
            style={[styles.followBtn, followMode && styles.followBtnActive]}
            onPress={centerOnDriver}
          >
            <Text style={styles.followBtnText}>
              {followMode ? '📍 Following' : '🎯 Center'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ETA Badge */}
        {driverLocation?.eta != null && (
          <View style={styles.etaBadge}>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaValue}>~{driverLocation.eta} min</Text>
          </View>
        )}
      </View>

      {/* Bottom Info Bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoEmoji}>🚗</Text>
          <Text style={styles.infoText}>
            {driverPos
              ? `${driverPos.latitude.toFixed(4)}, ${driverPos.longitude.toFixed(4)}`
              : 'Waiting for GPS...'}
          </Text>
        </View>
        {driverLocation?.speed != null && (
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>💨</Text>
            <Text style={styles.infoText}>
              {(driverLocation.speed * 3.6).toFixed(0)} km/h
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mapWrapper: {
    height: MAP_HEIGHT,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7f0',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
  },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  followBtn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  followBtnActive: {
    backgroundColor: '#e8f5e9',
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  etaBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(46,125,50,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 2,
  },
  etaLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  etaValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoEmoji: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Fallback when react-native-maps is not installed
  fallbackContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#c8e6c9',
    borderStyle: 'dashed',
  },
  fallbackEmoji: { fontSize: 48, marginBottom: 8 },
  fallbackTitle: { fontSize: 18, fontWeight: '700', color: '#2E7D32' },
  fallbackSub: { fontSize: 12, color: '#666', marginBottom: 12 },
  fallbackCoords: { fontSize: 12, color: '#555', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 4 },
  fallbackEta: { fontSize: 16, fontWeight: '800', color: '#2E7D32', marginBottom: 12 },
  fallbackWarning: { fontSize: 11, color: '#999', textAlign: 'center' },
  driverMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: '#fff',
  },
  driverMarkerEmoji: { fontSize: 22 },
});
