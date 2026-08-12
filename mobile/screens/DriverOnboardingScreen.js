// PoleSafe — Driver Onboarding & Identity Verification v1
// 3-step document submission wizard with admin review
// Step 1: NIN + Full Name | Step 2: Live Selfie + Phone | Step 3: Plate + Vehicle
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Animated,
  SafeAreaView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BRAND, STATUS, getTheme, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';
import HapticFeedback from '../utils/hapticFeedback';
import API_BASE from '../config';

import {
  ONBOARDING_STEPS,
  VERIFICATION_STATUS,
  saveOnboardingProgress,
  getOnboardingProgress,
  clearOnboardingProgress,
  submitForReview,
  getVerificationStatus,
} from '../services/driverVerificationService';

// ─── Step Metadata ─────────────────────────────────────
const STEP_META = {
  1: { title: 'Personal Details & NIN', emoji: '🪪', description: 'Your full name as it appears on your National ID' },
  2: { title: 'Live Selfie & Phone', emoji: '📸', description: 'Take a live selfie so we can verify your identity' },
  3: { title: 'Vehicle & Plate Number', emoji: '🚗', description: 'Tell us what you ride and your plate number' },
};

// ─── Status Badge ──────────────────────────────────────
function StatusBadge({ status, notes }) {
  const meta = {
    not_submitted: { label: 'Not Submitted', emoji: '📄', color: '#6B7280', bg: '#F3F4F6' },
    pending: { label: 'Under Review', emoji: '🟡', color: STATUS.warning, bg: '#FFF8E1' },
    approved: { label: 'Verified & Approved', emoji: '✅', color: STATUS.safe, bg: '#E8F5E9' },
    rejected: { label: 'Action Needed', emoji: '🔴', color: STATUS.danger, bg: '#FFEBEE' },
  };
  const m = meta[status] || meta.not_submitted;

  return (
    <View style={[badgeStyles.container, { backgroundColor: m.bg }]}>
      <Text style={[badgeStyles.text, { color: m.color }]}>{m.emoji} {m.label}</Text>
      {status === 'rejected' && notes ? (
        <Text style={badgeStyles.note}>📝 {notes}</Text>
      ) : null}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: { borderRadius: 12, padding: 14, marginBottom: 16 },
  text: { fontSize: 15, fontWeight: '700' },
  note: { fontSize: 13, color: '#6B7280', marginTop: 6, lineHeight: 18 },
});

// ─── Step Progress Bar ─────────────────────────────────
function StepProgress({ currentStep, totalSteps }) {
  return (
    <View style={progressStyles.container}>
      <Text style={progressStyles.label}>Step {currentStep} of {totalSteps}: {STEP_META[currentStep]?.title}</Text>
      <View style={progressStyles.bar}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <View key={stepNum} style={progressStyles.stepWrap}>
              <View style={[
                progressStyles.dot,
                isDone && progressStyles.dotDone,
                isActive && progressStyles.dotActive,
              ]}>
                <Text style={[
                  progressStyles.dotText,
                  (isDone || isActive) && progressStyles.dotTextActive,
                ]}>
                  {isDone ? '✓' : stepNum}
                </Text>
              </View>
              {stepNum < totalSteps && (
                <View style={[progressStyles.line, isDone && progressStyles.lineDone]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10 },
  bar: { flexDirection: 'row', alignItems: 'center' },
  stepWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#D1D5DB',
  },
  dotDone: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  dotActive: { backgroundColor: BRAND.secondary, borderColor: BRAND.secondary },
  dotText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  dotTextActive: { color: '#fff' },
  line: { flex: 1, height: 2, backgroundColor: '#D1D5DB', marginHorizontal: 4 },
  lineDone: { backgroundColor: BRAND.primary },
});

// ─── Photo Upload Card ─────────────────────────────────
function PhotoUploadCard({ label, icon, uri, onPress, uploading }) {
  return (
    <TouchableOpacity
      style={photoStyles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={uploading}
    >
      {uri ? (
        <Image source={{ uri }} style={photoStyles.preview} />
      ) : (
        <View style={photoStyles.placeholder}>
          <Text style={photoStyles.placeholderIcon}>{icon || '📷'}</Text>
          <Text style={photoStyles.placeholderLabel}>{uploading ? 'Uploading...' : label}</Text>
        </View>
      )}
      {uri && (
        <View style={photoStyles.uploadedTag}>
          <Text style={photoStyles.uploadedText}>📷 Uploaded</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const photoStyles = StyleSheet.create({
  card: {
    width: '100%', height: 160, borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E7EB',
    borderStyle: 'dashed', overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  placeholder: { alignItems: 'center' },
  placeholderIcon: { fontSize: 36, marginBottom: 8 },
  placeholderLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', textAlign: 'center' },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadedTag: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  uploadedText: { fontSize: 11, color: '#fff', fontWeight: '700' },
});

// ─── Main Screen ───────────────────────────────────────
export default function DriverOnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  // Step 1: Personal Details
  const [fullName, setFullName] = useState('');
  const [ninNumber, setNinNumber] = useState('');

  // Step 2: Selfie + Phone
  const [selfieUri, setSelfieUri] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selfieUploading, setSelfieUploading] = useState(false);

  // Step 3: Vehicle
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('boda');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = 3;

  // ─── Load saved progress on mount ─────────────────
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      // Check current verification status first
      const vStatus = await getVerificationStatus();
      if (vStatus.status === VERIFICATION_STATUS.APPROVED) {
        setStatus('approved');
        setLoading(false);
        return;
      }
      if (vStatus.status === VERIFICATION_STATUS.PENDING) {
        setStatus('pending');
        setLoading(false);
        return;
      }
      if (vStatus.status === VERIFICATION_STATUS.REJECTED) {
        setStatus('rejected');
        setStatus(vStatus);
        setLoading(false);
        return;
      }

      // Restore saved onboarding progress
      const saved = await getOnboardingProgress();
      if (saved.fullName) setFullName(saved.fullName);
      if (saved.ninNumber) setNinNumber(saved.ninNumber);
      if (saved.selfieUri) setSelfieUri(saved.selfieUri);
      if (saved.phoneNumber) setPhoneNumber(saved.phoneNumber);
      if (saved.plateNumber) setPlateNumber(saved.plateNumber);
      if (saved.vehicleType) setVehicleType(saved.vehicleType);
      if (saved.vehicleMake) setVehicleMake(saved.vehicleMake);
      if (saved.vehicleModel) setVehicleModel(saved.vehicleModel);

      // Resume from last saved step
      if (saved.currentStep) {
        setCurrentStep(Math.min(saved.currentStep, totalSteps));
      }
    } catch {}
    setLoading(false);
  };

  // ─── Animate step transitions ────────────────────
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  }, [currentStep]);

  // ─── Save current step to AsyncStorage ───────────
  const saveCurrentProgress = async () => {
    await saveOnboardingProgress({
      fullName,
      ninNumber,
      selfieUri,
      phoneNumber,
      plateNumber,
      vehicleType,
      vehicleMake,
      vehicleModel,
      currentStep,
    });
  };

  // ─── Take Photo (Camera or Gallery) ──────────────
  const handleTakePhoto = async (type, setter, setUploading) => {
    HapticFeedback.medium();
    Alert.alert(
      'Take Photo',
      'Make sure the photo is clear and well-lit.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                return Alert.alert('Permission Required', 'Camera access is needed.');
              }
              setUploading?.(true);
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                allowsEditing: true,
                aspect: [4, 3],
              });
              if (!result.canceled) {
                setter(result.assets[0].uri);
                await saveCurrentProgress();
                HapticFeedback.success();
              }
            } catch {
              Alert.alert('Error', 'Could not open camera.');
            } finally {
              setUploading?.(false);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.7,
              });
              if (!result.canceled) {
                setter(result.assets[0].uri);
                await saveCurrentProgress();
                HapticFeedback.success();
              }
            } catch {}
          },
        },
      ]
    );
  };

  // ─── Validate Current Step ───────────────────────
  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!fullName.trim()) { Alert.alert('Required', 'Please enter your full legal name.'); return false; }
        if (!ninNumber.trim() || ninNumber.trim().length < 5) { Alert.alert('Required', 'Please enter a valid NIN number.'); return false; }
        return true;
      case 2:
        if (!selfieUri) { Alert.alert('Required', 'Please take a live selfie.'); return false; }
        if (!phoneNumber.trim() || phoneNumber.trim().length < 8) { Alert.alert('Required', 'Please enter a valid phone number.'); return false; }
        return true;
      case 3:
        if (!plateNumber.trim()) { Alert.alert('Required', 'Please enter your vehicle plate number.'); return false; }
        if (!vehicleType) { Alert.alert('Required', 'Please select vehicle type.'); return false; }
        return true;
      default:
        return true;
    }
  };

  // ─── Next Step ───────────────────────────────────
  const handleNext = async () => {
    if (!validateStep()) return;
    HapticFeedback.light();
    await saveCurrentProgress();
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // ─── Previous Step ───────────────────────────────
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ─── Submit for Admin Review ─────────────────────
  const handleSubmit = async () => {
    if (!validateStep()) return;

    HapticFeedback.medium();
    Alert.alert(
      'Submit for Review',
      'Your documents will be reviewed by a PoleSafe admin. You will be notified once approved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const driverId = await AsyncStorage.getItem('polesafe_user_id');
              await submitForReview(driverId || 'demo_driver', {
                fullName,
                ninNumber,
                selfieUri,
                phoneNumber,
                plateNumber,
                vehicleType,
                vehicleMake,
                vehicleModel,
              });
              HapticFeedback.success();
              setStatus({ status: VERIFICATION_STATUS.PENDING });
            } catch (err) {
              Alert.alert('Error', err.message || 'Submission failed. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // ─── Resubmit (after rejection) ─────────────────
  const handleResubmit = () => {
    HapticFeedback.medium();
    setStatus(null);
    setCurrentStep(1);
  };

  // ─── Render Approved State ──────────────────────
  if (status === 'approved') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.bigEmoji}>✅</Text>
          <Text style={styles.approvedTitle}>Verified & Approved</Text>
          <Text style={styles.approvedSub}>
            You are fully verified. You can now go online and start accepting rides.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render Pending State ───────────────────────
  if (status?.status === VERIFICATION_STATUS.PENDING) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.bigEmoji}>🟡</Text>
          <Text style={styles.approvedTitle}>Under Review</Text>
          <Text style={styles.approvedSub}>
            Your documents are being reviewed by a PoleSafe admin. You'll be notified once approved. This usually takes less than 24 hours.
          </Text>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.outlineBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render Rejected State ──────────────────────
  if (status?.status === VERIFICATION_STATUS.REJECTED) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.centerContent}>
            <StatusBadge status="rejected" notes={status?.notes} />
            <Text style={styles.rejectedHint}>
              Tap the button below to resubmit with corrected documents.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleResubmit}
            >
              <Text style={styles.primaryBtnText}>🔄 Resubmit Documents</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.outlineBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Loading State ──────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════
  //  MAIN ONBOARDING WIZARD
  // ════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🚸 Driver Verification</Text>
          <Text style={styles.subtitle}>
            Complete these 3 steps to start earning with PoleSafe
          </Text>
        </View>

        {/* Progress Bar */}
        <StepProgress currentStep={currentStep} totalSteps={totalSteps} />

        {/* Status Badge (if rejected and resubmitting) */}
        {status?.status === 'rejected' && (
          <StatusBadge status="rejected" notes={status?.notes} />
        )}

        {/* Step Content */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {currentStep === 1 && (
            <GlassCard style={styles.stepCard}>
              <Text style={styles.stepEmoji}>🪪</Text>
              <Text style={styles.stepTitle}>Step 1: Personal Details & NIN</Text>
              <Text style={styles.stepHint}>
                Enter your details as they appear on your National ID.
              </Text>

              <Text style={styles.inputLabel}>Full Legal Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ssali Moses"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>National ID Number (NIN)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. CM1234567890AB"
                placeholderTextColor="#9CA3AF"
                value={ninNumber}
                onChangeText={setNinNumber}
                autoCapitalize="characters"
                maxLength={20}
              />
              <Text style={styles.helperText}>
                Your NIN is on your National ID card. It starts with letters followed by numbers.
              </Text>
            </GlassCard>
          )}

          {currentStep === 2 && (
            <GlassCard style={styles.stepCard}>
              <Text style={styles.stepEmoji}>📸</Text>
              <Text style={styles.stepTitle}>Step 2: Live Selfie & Phone</Text>
              <Text style={styles.stepHint}>
                Take a live selfie so we can verify your identity against your NIN.
              </Text>

              <Text style={styles.inputLabel}>Live Selfie</Text>
              <PhotoUploadCard
                label="Take Live Selfie"
                icon="🤳"
                uri={selfieUri}
                onPress={() => handleTakePhoto('selfie', setSelfieUri, setSelfieUploading)}
                uploading={selfieUploading}
              />
              {!selfieUri && (
                <Text style={styles.helperText}>
                  Make sure your face is clearly visible with good lighting.
                </Text>
              )}

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 0771234567"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </GlassCard>
          )}

          {currentStep === 3 && (
            <GlassCard style={styles.stepCard}>
              <Text style={styles.stepEmoji}>🚗</Text>
              <Text style={styles.stepTitle}>Step 3: Vehicle & Plate Number</Text>
              <Text style={styles.stepHint}>
                Tell us about your vehicle. No logbook or registration document needed.
              </Text>

              <Text style={styles.inputLabel}>Vehicle Type</Text>
              <View style={styles.vehicleToggle}>
                {['boda', 'car', 'taxi', 'bus'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.vehicleOption,
                      vehicleType === type && styles.vehicleOptionActive,
                    ]}
                    onPress={() => setVehicleType(type)}
                  >
                    <Text style={[
                      styles.vehicleOptionText,
                      vehicleType === type && styles.vehicleOptionTextActive,
                    ]}>
                      {type === 'boda' ? '🛵' : type === 'car' ? '🚗' : type === 'taxi' ? '🚕' : '🚐'} {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Plate Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. UFK 234X"
                placeholderTextColor="#9CA3AF"
                value={plateNumber}
                onChangeText={setPlateNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Vehicle Make</Text>
              <TextInput
                style={styles.input}
                placeholder={vehicleType === 'boda' ? "e.g. Bajaj, TVS, Honda" : "e.g. Toyota, Nissan, Suzuki"}
                placeholderTextColor="#9CA3AF"
                value={vehicleMake}
                onChangeText={setVehicleMake}
              />

              <Text style={styles.inputLabel}>Vehicle Model</Text>
              <TextInput
                style={styles.input}
                placeholder={vehicleType === 'boda' ? "e.g. Boxer, Star" : "e.g. Hiace, Premio, Swift"}
                placeholderTextColor="#9CA3AF"
                value={vehicleModel}
                onChangeText={setVehicleModel}
              />
            </GlassCard>
          )}
        </Animated.View>

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          {currentStep > 1 ? (
            <TouchableOpacity style={styles.backBtn} onPress={handlePrev}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}

          {currentStep < totalSteps ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.nextBtnText}>📤 Submit for Review</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  bigEmoji: { fontSize: 48, marginBottom: 16 },
  approvedTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  approvedSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 320 },
  rejectedHint: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },

  // Step Card
  stepCard: { padding: 20, marginBottom: 20 },
  stepEmoji: { fontSize: 36, marginBottom: 8 },
  stepTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  stepHint: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 16 },

  // Inputs
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#0F172A',
  },
  helperText: { fontSize: 11, color: '#9CA3AF', marginTop: 6, lineHeight: 16 },

  // Vehicle Type Toggle
  vehicleToggle: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vehicleOption: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: BORDER_RADIUS.sm, backgroundColor: '#F3F4F6',
    borderWidth: 2, borderColor: '#E5E7EB',
  },
  vehicleOptionActive: { backgroundColor: BRAND.primary + '15', borderColor: BRAND.primary },
  vehicleOptionText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  vehicleOptionTextActive: { color: BRAND.primary },

  // Navigation
  navButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  backBtn: { minWidth: 90, paddingVertical: 14, alignItems: 'center' },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  nextBtn: {
    flex: 1, backgroundColor: BRAND.primary, paddingVertical: 14, borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center', marginLeft: 12,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Buttons
  primaryBtn: {
    backgroundColor: BRAND.primary, paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: BORDER_RADIUS.sm, alignItems: 'center', marginBottom: 12,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  outlineBtn: {
    borderWidth: 2, borderColor: BRAND.primary, paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: BORDER_RADIUS.sm, alignItems: 'center', backgroundColor: '#fff',
  },
  outlineBtnText: { fontSize: 15, fontWeight: '600', color: BRAND.primary },
});
