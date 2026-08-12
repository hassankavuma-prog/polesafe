// PoleSafe — Admin Driver Document Review Dashboard v1
// Lets support admins review driver documents, zoom into photos, approve/reject
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, RefreshControl,
  SafeAreaView, Modal, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BRAND, STATUS, getTheme, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';
import HapticFeedback from '../utils/hapticFeedback';
import API_BASE from '../config';

// ─── Status Meta ──────────────────────────────────────
const STATUS_META = {
  pending: { label: 'Pending Review', emoji: '🟡', color: STATUS.warning, bg: '#FFF8E1' },
  rejected: { label: 'Needs Resubmission', emoji: '🔴', color: STATUS.danger, bg: '#FFEBEE' },
  approved: { label: 'Approved', emoji: '✅', color: STATUS.safe, bg: '#E8F5E9' },
};

// ─── Driver Card ──────────────────────────────────────
function DriverCard({ driver, onReview }) {
  const meta = STATUS_META[driver.status] || STATUS_META.pending;
  const docSummary = [];
  if (driver.docs?.ninNumber) docSummary.push('NIN');
  if (driver.docs?.selfieUri) docSummary.push('Selfie');
  if (driver.docs?.plateNumber) docSummary.push('Plate');
  if (driver.docs?.vehicleMake) docSummary.push('Vehicle');

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onReview(driver)}>
      <GlassCard style={cardStyles.card}>
        <View style={cardStyles.header}>
          <View style={cardStyles.avatar}>
            <Text style={cardStyles.avatarText}>
              {(driver.name || 'D').charAt(0)}
            </Text>
          </View>
          <View style={cardStyles.info}>
            <Text style={cardStyles.name}>{driver.name || 'Unknown'}</Text>
            <Text style={cardStyles.phone}>{driver.phone || 'No phone'}</Text>
          </View>
          <View style={[cardStyles.badge, { backgroundColor: meta.bg }]}>
            <Text style={[cardStyles.badgeText, { color: meta.color }]}>
              {meta.emoji} {meta.label}
            </Text>
          </View>
        </View>

        <View style={cardStyles.docsRow}>
          {docSummary.map((doc, i) => (
            <View key={i} style={cardStyles.docTag}>
              <Text style={cardStyles.docTagText}>{doc}</Text>
            </View>
          ))}
        </View>

        <View style={cardStyles.footer}>
          <Text style={cardStyles.date}>
            Submitted: {driver.submittedAt ? new Date(driver.submittedAt).toLocaleDateString('en-UG') : 'N/A'}
          </Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: { padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: BRAND.secondary, justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  phone: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  docsRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  docTag: {
    backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  docTagText: { fontSize: 11, color: '#374151', fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 11, color: '#9CA3AF' },
});

// ─── Photo Preview Modal ──────────────────────────────
function PhotoPreview({ visible, uri, title, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={previewStyles.overlay}>
        <View style={previewStyles.container}>
          <View style={previewStyles.header}>
            <Text style={previewStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={previewStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          {uri ? (
            <Image
              source={{ uri }}
              style={previewStyles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={previewStyles.noImage}>
              <Text style={previewStyles.noImageText}>No photo uploaded</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const previewStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center' },
  container: { backgroundColor: '#1F2937', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', maxHeight: '80%' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  closeText: { fontSize: 20, color: '#9CA3AF', paddingLeft: 16 },
  image: { width: '100%', height: 400 },
  noImage: { height: 200, justifyContent: 'center', alignItems: 'center' },
  noImageText: { fontSize: 14, color: '#6B7280' },
});

// ─── Review Modal ─────────────────────────────────────
function ReviewModal({ driver, visible, onClose, onApprove, onReject }) {
  const [rejectReason, setRejectReason] = useState('');
  const [preview, setPreview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewing, setViewing] = useState(null);

  if (!driver) return null;

  const docs = driver.docs || {};

  const photoFields = [
    { key: 'selfieUri', label: 'Live Selfie', icon: '🤳' },
  ];

  const infoFields = [
    { key: 'fullName', label: 'Full Name', value: docs.fullName },
    { key: 'ninNumber', label: 'NIN Number', value: docs.ninNumber },
    { key: 'phoneNumber', label: 'Phone Number', value: docs.phoneNumber },
    { key: 'plateNumber', label: 'Plate Number', value: docs.plateNumber },
    { key: 'vehicleType', label: 'Vehicle Type', value: docs.vehicleType ? docs.vehicleType.charAt(0).toUpperCase() + docs.vehicleType.slice(1) : '' },
    { key: 'vehicleMake', label: 'Vehicle Make', value: docs.vehicleMake },
    { key: 'vehicleModel', label: 'Vehicle Model', value: docs.vehicleModel },
  ];

  const handleApprove = () => {
    HapticFeedback.medium();
    Alert.alert(
      'Approve Driver',
      `Approve ${driver.name || 'this driver'}? They will be able to go online immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✅ Approve',
          onPress: async () => {
            setActionLoading(true);
            await onApprove(driver._id);
            setActionLoading(false);
          },
        },
      ]
    );
  };

  const handleReject = () => {
    HapticFeedback.warning();
    if (!rejectReason.trim()) {
      return Alert.alert('Required', 'Please enter a rejection reason so the driver knows what to fix.');
    }
    Alert.alert(
      'Reject Driver',
      `Reject ${driver.name || 'this driver'} with reason: "${rejectReason}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🔴 Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            await onReject(driver._id, rejectReason.trim());
            setRejectReason('');
            setActionLoading(false);
          },
        },
      ]
    );
  };

  return (
    <>
      <PhotoPreview
        visible={!!viewing}
        uri={viewing?.uri}
        title={viewing?.label || ''}
        onClose={() => setViewing(null)}
      />

      <Modal visible={visible} transparent animationType="slide">
        <View style={reviewStyles.overlay}>
          <ScrollView style={reviewStyles.container} contentContainerStyle={reviewStyles.content}>
            {/* Header */}
            <View style={reviewStyles.modalHeader}>
              <View>
                <Text style={reviewStyles.modalTitle}>{driver.name || 'Unknown Driver'}</Text>
                <Text style={reviewStyles.modalPhone}>{driver.phone || 'No phone'}</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Text style={reviewStyles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Status */}
            <View style={[reviewStyles.statusBar, {
              backgroundColor: STATUS_META[driver.status]?.bg || '#F3F4F6',
            }]}>
              <Text style={[reviewStyles.statusText, {
                color: STATUS_META[driver.status]?.color || '#6B7280',
              }]}>
                {STATUS_META[driver.status]?.emoji || '📄'} {STATUS_META[driver.status]?.label || 'Unknown'}
              </Text>
              {driver.notes ? (
                <Text style={reviewStyles.notes}>Admin notes: {driver.notes}</Text>
              ) : null}
            </View>

            {/* Photos Section */}
            <Text style={reviewStyles.sectionTitle}>📸 Photos</Text>
            <View style={reviewStyles.photoGrid}>
              {photoFields.map(field => (
                <TouchableOpacity
                  key={field.key}
                  style={reviewStyles.photoCard}
                  onPress={() => docs[field.key] ? setViewing({ uri: docs[field.key], label: field.label }) : null}
                  activeOpacity={0.7}
                >
                  {docs[field.key] ? (
                    <Image source={{ uri: docs[field.key] }} style={reviewStyles.thumbnail} />
                  ) : (
                    <View style={reviewStyles.thumbnailPlaceholder}>
                      <Text style={reviewStyles.thumbnailIcon}>{field.icon}</Text>
                      <Text style={reviewStyles.thumbnailLabel}>No photo</Text>
                    </View>
                  )}
                  <Text style={reviewStyles.photoLabel}>{field.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Info Section */}
            <Text style={reviewStyles.sectionTitle}>📋 Details</Text>
            <GlassCard style={reviewStyles.infoCard}>
              {infoFields.map(field => (
                field.value ? (
                  <View key={field.key} style={reviewStyles.infoRow}>
                    <Text style={reviewStyles.infoLabel}>{field.label}</Text>
                    <Text style={reviewStyles.infoValue}>{field.value}</Text>
                  </View>
                ) : null
              ))}
              {infoFields.every(f => !f.value) && (
                <Text style={reviewStyles.emptyText}>No details submitted</Text>
              )}
            </GlassCard>

            {/* Submitted Date */}
            <Text style={reviewStyles.dateText}>
              Submitted: {driver.submittedAt ? new Date(driver.submittedAt).toLocaleString('en-UG') : 'N/A'}
            </Text>

            {/* Actions (only for pending/rejected) */}
            {driver.status !== 'approved' && (
              <View style={reviewStyles.actions}>
                {/* Reject */}
                <Text style={reviewStyles.rejectLabel}>Rejection reason (if rejecting):</Text>
                <TextInput
                  style={reviewStyles.rejectInput}
                  placeholder="e.g. Blurry selfie — retake with better lighting"
                  placeholderTextColor="#6B7280"
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  multiline
                  numberOfLines={3}
                />

                <View style={reviewStyles.actionButtons}>
                  <TouchableOpacity
                    style={reviewStyles.rejectBtn}
                    onPress={handleReject}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={reviewStyles.rejectBtnText}>🔴 Reject</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={reviewStyles.approveBtn}
                    onPress={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={reviewStyles.approveBtnText}>✅ Approve</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Already approved */}
            {driver.status === 'approved' && (
              <View style={reviewStyles.approvedBanner}>
                <Text style={reviewStyles.approvedBannerText}>
                  ✅ This driver has been approved and can accept rides.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const reviewStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { flex: 1, backgroundColor: '#F5F7FA', marginTop: 60, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  content: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  closeText: { fontSize: 22, color: '#6B7280', padding: 4 },
  statusBar: { borderRadius: 12, padding: 14, marginBottom: 16 },
  statusText: { fontSize: 14, fontWeight: '700' },
  notes: { fontSize: 12, color: '#6B7280', marginTop: 6, lineHeight: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12, marginTop: 8 },
  photoGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoCard: { flex: 1, alignItems: 'center' },
  thumbnail: { width: '100%', height: 140, borderRadius: 12, backgroundColor: '#E5E7EB' },
  thumbnailPlaceholder: {
    width: '100%', height: 140, borderRadius: 12, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },
  thumbnailIcon: { fontSize: 32 },
  thumbnailLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  photoLabel: { fontSize: 11, fontWeight: '600', color: '#374151', marginTop: 6 },
  infoCard: { padding: 16, marginBottom: 12 },
  infoRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 13, color: '#6B7280', width: 110 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#0F172A', flex: 1 },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },
  dateText: { fontSize: 12, color: '#9CA3AF', marginBottom: 16, textAlign: 'center' },
  actions: { marginTop: 8 },
  rejectLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  rejectInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    padding: 12, fontSize: 13, color: '#0F172A', minHeight: 70, textAlignVertical: 'top',
    marginBottom: 12,
  },
  actionButtons: { flexDirection: 'row', gap: 12 },
  rejectBtn: { flex: 1, backgroundColor: STATUS.danger, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  approveBtn: { flex: 1, backgroundColor: BRAND.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  approvedBanner: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16,
  },
  approvedBannerText: { fontSize: 14, color: STATUS.safe, fontWeight: '600' },
});

// ─── Tab Bar ──────────────────────────────────────────
function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <View style={tabStyles.container}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[tabStyles.tab, activeTab === tab.key && tabStyles.tabActive]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text style={[tabStyles.tabText, activeTab === tab.key && tabStyles.tabTextActive]}>
            {tab.emoji} {tab.label}
          </Text>
          {tab.count > 0 && (
            <View style={[tabStyles.countBadge, activeTab === tab.key && tabStyles.countBadgeActive]}>
              <Text style={[tabStyles.countText, activeTab === tab.key && tabStyles.countTextActive]}>
                {tab.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: { flexDirection: 'row', marginBottom: 16, borderRadius: 12, backgroundColor: '#F3F4F6', padding: 4 },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: BRAND.secondary },
  countBadge: {
    backgroundColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6,
  },
  countBadgeActive: { backgroundColor: BRAND.secondary + '20' },
  countText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  countTextActive: { color: BRAND.secondary },
});

// ─── Main Screen ──────────────────────────────────────
export default function AdminDriverReview({ navigation }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const tabs = [
    { key: 'pending', emoji: '🟡', label: 'Pending', getCount: () => drivers.filter(d => d.status === 'pending').length },
    { key: 'approved', emoji: '✅', label: 'Approved', getCount: () => drivers.filter(d => d.status === 'approved').length },
    { key: 'rejected', emoji: '🔴', label: 'Rejected', getCount: () => drivers.filter(d => d.status === 'rejected').length },
  ];

  const fetchDrivers = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/admin/pending-drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      } else {
        // Demo/fallback data
        setDrivers([
          { _id: '1', name: 'Moses Ssali', phone: '0771234567', docs: { fullName: 'Moses Ssali', ninNumber: 'CM1234567890AB', selfieUri: 'demo', phoneNumber: '0771234567', plateNumber: 'UFK 234X', vehicleType: 'boda', vehicleMake: 'Bajaj', vehicleModel: 'Boxer' }, status: 'pending', submittedAt: new Date(Date.now() - 3600000).toISOString() },
          { _id: '2', name: 'Peter Wasswa', phone: '0789876543', docs: { fullName: 'Peter Wasswa', ninNumber: 'CM0987654321XY', selfieUri: 'demo', phoneNumber: '0789876543', plateNumber: 'UBD 891Z', vehicleType: 'car', vehicleMake: 'Toyota', vehicleModel: 'Hiace' }, status: 'pending', submittedAt: new Date(Date.now() - 7200000).toISOString() },
          { _id: '3', name: 'Sarah Nakato', phone: '0700112233', docs: { fullName: 'Sarah Nakato', ninNumber: 'CM5566778899CD', selfieUri: 'demo', phoneNumber: '0700112233', plateNumber: 'UAD 567Y', vehicleType: 'boda', vehicleMake: 'TVS', vehicleModel: 'Star' }, status: 'rejected', submittedAt: new Date(Date.now() - 86400000).toISOString(), notes: 'Blurry selfie — retake with better lighting' },
        ]);
      }
    } catch {
      setDrivers([
        { _id: '1', name: 'Moses Ssali', phone: '0771234567', docs: { fullName: 'Moses Ssali', ninNumber: 'CM1234567890AB', selfieUri: 'demo', phoneNumber: '0771234567', plateNumber: 'UFK 234X', vehicleType: 'boda', vehicleMake: 'Bajaj', vehicleModel: 'Boxer' }, status: 'pending', submittedAt: new Date(Date.now() - 3600000).toISOString() },
        { _id: '2', name: 'Peter Wasswa', phone: '0789876543', docs: { fullName: 'Peter Wasswa', ninNumber: 'CM0987654321XY', selfieUri: 'demo', phoneNumber: '0789876543', plateNumber: 'UBD 891Z', vehicleType: 'car', vehicleMake: 'Toyota', vehicleModel: 'Hiace' }, status: 'pending', submittedAt: new Date(Date.now() - 7200000).toISOString() },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  const handleReview = (driver) => {
    setSelectedDriver(driver);
    setShowReview(true);
  };

  const handleApprove = async (driverId) => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/admin/driver/${driverId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed');
      HapticFeedback.success();
      setShowReview(false);
      setSelectedDriver(null);
      fetchDrivers();
    } catch {
      // Demo mode — update locally
      setDrivers(prev => prev.map(d =>
        d._id === driverId ? { ...d, status: 'approved', notes: '' } : d
      ));
      HapticFeedback.success();
      setShowReview(false);
      setSelectedDriver(null);
    }
  };

  const handleReject = async (driverId, reason) => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/admin/driver/${driverId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed');
      HapticFeedback.success();
      setShowReview(false);
      setSelectedDriver(null);
      fetchDrivers();
    } catch {
      // Demo mode
      setDrivers(prev => prev.map(d =>
        d._id === driverId ? { ...d, status: 'rejected', notes: reason } : d
      ));
      HapticFeedback.success();
      setShowReview(false);
      setSelectedDriver(null);
    }
  };

  const filteredDrivers = drivers.filter(d => d.status === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Driver Verification</Text>
        <Text style={styles.subtitle}>
          Review driver documents and approve or reject submissions.
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabBar
          tabs={tabs.map(t => ({ ...t, count: t.getCount() }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      {/* Driver List */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
      ) : filteredDrivers.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyEmoji}>
            {activeTab === 'pending' ? '🎉' : activeTab === 'approved' ? '📋' : '✅'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'pending'
              ? 'No pending verifications!'
              : activeTab === 'approved'
                ? 'No approved drivers yet'
                : 'No rejected drivers'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BRAND.secondary} />
          }
        >
          {filteredDrivers.map(driver => (
            <DriverCard
              key={driver._id}
              driver={driver}
              onReview={handleReview}
            />
          ))}
        </ScrollView>
      )}

      {/* Review Modal */}
      <ReviewModal
        driver={selectedDriver}
        visible={showReview}
        onClose={() => { setShowReview(false); setSelectedDriver(null); }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  tabContainer: { paddingHorizontal: 20, marginBottom: 4 },
  list: { flex: 1 },
  listContent: { padding: 20, paddingTop: 8 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
