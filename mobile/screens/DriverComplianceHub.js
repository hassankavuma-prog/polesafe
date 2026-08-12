// PoleSafe Driver Compliance Hub v1
// Safety & Credential Vault — simplified for African market
// No auto-scanner, no background check APIs — just clean doc management
// From Home to School. And Beyond. 🚸

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import API_BASE from '../config';
import { BRAND, STATUS, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';
import HapticFeedback from '../utils/hapticFeedback';

// ─── Document Status ──────────────────────────────────
const STATUS_META = {
  verified: { label: 'Verified', emoji: '✅', color: STATUS.safe, bg: '#E8F5E9' },
  pending: { label: 'Pending Review', emoji: '⏳', color: STATUS.warning, bg: '#FFF8E1' },
  expired: { label: 'Expired', emoji: '⚠️', color: STATUS.danger, bg: '#FFEBEE' },
  missing: { label: 'Upload Required', emoji: '📄', color: '#6B7280', bg: '#F3F4F6' },
};

// ─── Document Card ────────────────────────────────────
function DocCard({ title, icon, status, expiresIn, onUpload, onView }) {
  const meta = STATUS_META[status] || STATUS_META.missing;
  const isExpiring = status === 'verified' && expiresIn && expiresIn <= 30;

  return (
    <TouchableOpacity
      onPress={() => status === 'missing' ? onUpload?.() : onView?.()}
      activeOpacity={0.7}
    >
      <GlassCard style={[docStyles.card, isExpiring && docStyles.expiringCard]}>
        <View style={docStyles.left}>
          <View style={[docStyles.iconBox, { backgroundColor: meta.bg }]}>
            <Text style={docStyles.icon}>{icon}</Text>
          </View>
          <View style={docStyles.info}>
            <Text style={docStyles.title}>{title}</Text>
            {status === 'missing' && (
              <TouchableOpacity onPress={onUpload}>
                <Text style={docStyles.uploadLink}>+ Upload Document</Text>
              </TouchableOpacity>
            )}
            {isExpiring && (
              <Text style={docStyles.expiringText}>
                ⏰ Expires in {expiresIn} days — Tap to renew
              </Text>
            )}
          </View>
        </View>
        <View style={[docStyles.status, { backgroundColor: meta.bg }]}>
          <Text style={[docStyles.statusText, { color: meta.color }]}>
            {meta.emoji} {meta.label}
          </Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const docStyles = StyleSheet.create({
  card: { padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  expiringCard: { borderLeftWidth: 4, borderLeftColor: STATUS.warning },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 18 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  uploadLink: { fontSize: 12, color: BRAND.secondary, fontWeight: '600', marginTop: 2 },
  expiringText: { fontSize: 11, color: STATUS.warning, fontWeight: '600', marginTop: 2 },
  status: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
});

// ─── Main Screen ─────────────────────────────────────
export default function DriverComplianceHub({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [documents, setDocuments] = useState({
    driversLicense: { status: 'verified', icon: '🪪', title: "Driver's License" },
    vehicleRegistration: { status: 'expired', icon: '📋', title: 'Vehicle Registration', expiresIn: 12 },
    insurance: { status: 'pending', icon: '🛡️', title: 'Insurance Certificate' },
    safetyInspection: { status: 'missing', icon: '🔧', title: 'Safety Inspection' },
  });

  const verifiedCount = Object.values(documents).filter(d => d.status === 'verified').length;
  const totalDocs = Object.keys(documents).length;
  const allVerified = verifiedCount === totalDocs;

  const handleUpload = async (docKey) => {
    HapticFeedback.medium();
    Alert.alert(
      'Upload Document',
      'Take a clear photo of your document. Make sure all details are visible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera access is needed to upload documents.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                allowsEditing: true,
              });
              if (!result.canceled) {
                setUploading(docKey);
                // Simulate upload
                setTimeout(() => {
                  setDocuments(prev => ({
                    ...prev,
                    [docKey]: { ...prev[docKey], status: 'pending' },
                  }));
                  submitDriverDocuments(docKey);
                  setUploading(null);
                  HapticFeedback.success();
                  Alert.alert('✅ Uploaded!', 'Your document has been submitted for review.');
                }, 1500);
              }
            } catch (err) {
              Alert.alert('Error', 'Could not open camera. Please try again.');
              setUploading(null);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
              });
              if (!result.canceled) {
                setUploading(docKey);
                setTimeout(() => {
                  setDocuments(prev => ({
                    ...prev,
                    [docKey]: { ...prev[docKey], status: 'pending' },
                  }));
                  submitDriverDocuments(docKey);
                  setUploading(null);
                  HapticFeedback.success();
                  Alert.alert('✅ Uploaded!', 'Your document has been submitted for review.');
                }, 1500);
              }
            } catch (err) {
              setUploading(null);
            }
          },
        },
      ]
    );
  };

  const submitDriverDocuments = async (docKey) => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      await fetch(`${API_BASE}/api/driver/submit-documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: { [docKey]: documents[docKey] } }),
      });
    } catch (err) {}
  };

  const getDocByKey = (key) => documents[key];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={BRAND.secondary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Safety & Credential Vault</Text>
        <Text style={styles.subtitle}>
          Verified drivers receive priority dispatch for family and school rides.
        </Text>
      </View>

      {/* Overall Status */}
      <GlassCard style={[styles.statusCard, allVerified && styles.statusCardComplete]}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusEmoji}>{allVerified ? '✅' : '📄'}</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {verifiedCount}/{totalDocs} Documents Verified
            </Text>
            <Text style={styles.statusSubtitle}>
              {allVerified
                ? '🎉 Tier 1 Verified Driver — You get priority dispatch!'
                : `Complete all ${totalDocs} documents to unlock Tier 1 priority dispatch`}
            </Text>
          </View>
        </View>
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(verifiedCount / totalDocs) * 100}%` }]} />
        </View>
      </GlassCard>

      {/* Personal Identity Section */}
      <Text style={styles.sectionTitle}>Personal Identity</Text>
      <DocCard
        {...getDocByKey('driversLicense')}
        onUpload={() => handleUpload('driversLicense')}
        onView={() => Alert.alert("Driver's License", 'Verified document. Expires: 2027-03-15')}
      />
      <DocCard
        title="Background Reference"
        icon="👤"
        status="verified"
        onView={() => Alert.alert('Reference Check', 'School character reference on file.')}
      />

      {/* Vehicle Section */}
      <Text style={styles.sectionTitle}>Vehicle & Safety</Text>
      <DocCard
        {...getDocByKey('vehicleRegistration')}
        onUpload={() => handleUpload('vehicleRegistration')}
        onView={() => Alert.alert('Vehicle Registration', 'Expired. Please renew and upload.')}
      />
      <DocCard
        {...getDocByKey('insurance')}
        onUpload={() => handleUpload('insurance')}
        onView={() => Alert.alert('Insurance', 'Pending review. We&apos;ll notify you within 24 hours.')}
      />
      <DocCard
        {...getDocByKey('safetyInspection')}
        onUpload={() => handleUpload('safetyInspection')}
        onView={() => Alert.alert('Safety Inspection', 'Upload your vehicle safety inspection certificate.')}
      />

      {uploading && (
        <GlassCard style={styles.uploadingBanner}>
          <ActivityIndicator color={BRAND.secondary} size="small" />
          <Text style={styles.uploadingText}>  Uploading document...</Text>
        </GlassCard>
      )}

      {/* Info Note */}
      <GlassCard style={styles.infoCard}>
        <Text style={styles.infoTitle}>📸 Photo Tips</Text>
        <Text style={styles.infoItem}>• Place document on a flat, well-lit surface</Text>
        <Text style={styles.infoItem}>• Make sure all 4 corners are visible</Text>
        <Text style={styles.infoItem}>• Avoid glare and shadows</Text>
        <Text style={styles.infoItem}>• Documents reviewed within 24 hours</Text>
      </GlassCard>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  content: { padding: SPACING.md },

  // Header
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

  // Status Card
  statusCard: { padding: 16, marginBottom: 20 },
  statusCardComplete: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusEmoji: { fontSize: 28, marginRight: 12 },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 16 },
  progressBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: BRAND.primary, borderRadius: 3 },

  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
  },

  // Uploading
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    justifyContent: 'center',
  },
  uploadingText: { fontSize: 14, color: '#6B7280' },

  // Info
  infoCard: { padding: 16, marginTop: 4, backgroundColor: '#FFF8E1', borderColor: '#FDE68A' },
  infoTitle: { fontSize: 14, fontWeight: '700', color: BRAND.accent, marginBottom: 8 },
  infoItem: { fontSize: 12, color: '#374151', lineHeight: 20 },
});
