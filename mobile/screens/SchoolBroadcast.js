// PoleSafe Mobile — School Broadcast Screen
// Compose and send announcements to parents

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
const ORANGE = COLORS.orange;

const QUICK_TYPES = [
  { key: 'half_day', emoji: '🚩', label: 'HALF DAY', color: '#FF9800' },
  { key: 'school_closed', emoji: '❄️', label: 'CLOSED', color: COLORS.red },
  { key: 'emergency', emoji: '🚨', label: 'EMERGENCY', color: '#D32F2F' },
  { key: 'meeting', emoji: '📅', label: 'MEETING', color: '#7B1FA2' },
  { key: 'reminder', emoji: '📢', label: 'REMINDER', color: '#1976D2' },
  { key: 'event', emoji: '🎉', label: 'EVENT', color: '#00897B' },
];

const RECIPIENT_OPTIONS = [
  { key: 'all', label: 'All Parents & Teachers', icon: '👥' },
  { key: 'parents', label: 'Parents Only', icon: '👨‍👩‍👧' },
  { key: 'teachers', label: 'Teachers Only', icon: '👩‍🏫' },
  { key: 'specific', label: 'Specific Classes', icon: '🏫' },
  { key: 'morning_only', label: 'Morning Only', icon: '🌅' },
  { key: 'afternoon_only', label: 'Afternoon Only', icon: '🌇' },
];

export default function SchoolBroadcast({ navigation }) {
  const theme = getTheme();
  const [selectedType, setSelectedType] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [recipients, setRecipients] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const getTypeMessage = (key) => {
    const messages = {
      half_day: 'School will close at 12:00 PM today. Please arrange early pickup for your child.',
      school_closed: 'School is closed today due to unforeseen circumstances. All PoleSafe rides are cancelled. We apologize for the inconvenience.',
      emergency: 'URGENT: Please contact the school immediately regarding your child. Reach us at the school office.',
      meeting: '📅 Parent-Teacher Meeting: You are invited to a school meeting. Please check the date and time. More details to follow.',
      reminder: 'This is a friendly reminder for all parents. Thank you for your continued partnership.',
      event: '🎉 School Event: We have an exciting event coming up. Save the date and stay tuned for more information!',
    };
    return messages[key] || '';
  };

  const handleQuickType = (type) => {
    setSelectedType(type.key);
    setCustomMessage(getTypeMessage(type.key));
  };

  const handleSend = async () => {
    if (!customMessage.trim()) {
      Alert.alert('Empty Message', 'Please enter a message to send.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');

      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/broadcast`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId,
          type: selectedType || 'custom',
          message: customMessage.trim(),
          recipients,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to send broadcast');
      }

      Alert.alert(
        'Broadcast Sent 📢',
        'Your announcement has been sent to all selected recipients.',
        [
          { text: 'OK', onPress: () => {
            setSelectedType(null);
            setCustomMessage('');
            setRecipients('all');
          }},
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Quick Announcement Buttons */}
      <Text style={styles.sectionTitle}>📢 Quick Announcements</Text>
      <View style={styles.quickGrid}>
        {QUICK_TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.quickBtn,
              { backgroundColor: type.color },
              selectedType === type.key && styles.quickBtnSelected,
            ]}
            onPress={() => handleQuickType(type)}
          >
            <Text style={styles.quickEmoji}>{type.emoji}</Text>
            <Text style={styles.quickLabel}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Message */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✏️ Custom Message</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Type your announcement here..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          value={customMessage}
          onChangeText={setCustomMessage}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {customMessage.length} / 500
        </Text>
      </View>

      {/* Recipient Selectors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Recipients</Text>
        <View style={styles.recipientGrid}>
          {RECIPIENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.recipientBtn,
                recipients === opt.key && styles.recipientBtnSelected,
              ]}
              onPress={() => setRecipients(opt.key)}
            >
              <Text style={styles.recipientIcon}>{opt.icon}</Text>
              <Text style={[
                styles.recipientLabel,
                recipients === opt.key && styles.recipientLabelSelected,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {recipients === 'specific' && (
          <TextInput
            style={styles.classInput}
            placeholder="Enter class names (comma-separated)"
            placeholderTextColor="#aaa"
          />
        )}
      </View>

      {/* Preview */}
      {customMessage.trim() && (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewType}>
            {selectedType ? `Type: ${selectedType.toUpperCase()}` : 'Type: Custom'}
          </Text>
          <Text style={styles.previewMessage}>{customMessage}</Text>
          <Text style={styles.previewRecipients}>
            → Sent to: {RECIPIENT_OPTIONS.find(o => o.key === recipients)?.label}
          </Text>
        </View>
      )}

      {/* Send */}
      <TouchableOpacity
        style={[styles.sendBtn, (!customMessage.trim() || submitting) && styles.btnDisabled]}
        onPress={handleSend}
        disabled={!customMessage.trim() || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendBtnText}>📢 Send Broadcast</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },

  // Quick Buttons
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickBtn: {
    flex: 1, minWidth: '45%', paddingVertical: 18, paddingHorizontal: 12,
    borderRadius: 12, alignItems: 'center', elevation: 2,
  },
  quickBtnSelected: {
    borderWidth: 3, borderColor: '#333',
  },
  quickEmoji: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  // Section
  section: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },

  // Message Input
  messageInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, fontSize: 15, color: COLORS.textPrimary, minHeight: 100,
    backgroundColor: COLORS.surfaceElevated,
  },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 },

  // Recipients
  recipientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recipientBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, backgroundColor: '#f0f0f0',
  },
  recipientBtnSelected: { backgroundColor: COLORS.orangeBg, borderWidth: 1, borderColor: ORANGE },
  recipientIcon: { fontSize: 16, marginRight: 6 },
  recipientLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  recipientLabelSelected: { color: ORANGE, fontWeight: '600' },
  classInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 14, marginTop: 10, backgroundColor: COLORS.surfaceElevated,
  },

  // Preview
  previewCard: {
    backgroundColor: COLORS.orangeBg, borderRadius: 12, padding: 16,
    marginBottom: 14, borderLeftWidth: 4, borderLeftColor: ORANGE,
  },
  previewTitle: { fontSize: 12, fontWeight: '600', color: ORANGE, textTransform: 'uppercase', marginBottom: 4 },
  previewType: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  previewMessage: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22, marginBottom: 8 },
  previewRecipients: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },

  // Send
  sendBtn: { backgroundColor: ORANGE, padding: 18, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
