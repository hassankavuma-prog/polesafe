// PoleSafe Mobile — New Post / Blog / Feature Suggestion
// Create a Safety Board post, blog article, or feature suggestion

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';

const API_URL = `${API_BASE}/api/community`;

const REVIEW_GUIDANCE = {
  approved: 'Hamna can publish this if it is clear and safe.',
  pending: 'Hamna will review this before it appears publicly.',
  rejected: 'This was rejected before; please revise the safety and clarity.',
};

const SAFETY_CATEGORIES = [
  { id: 'route_safety', label: '🚸 Route Safety' },
  { id: 'driver_behavior', label: '🚗 Driver Behavior' },
  { id: 'school_policy', label: '🏫 School Policy' },
  { id: 'pickup_delay', label: '⏰ Pickup Delays' },
  { id: 'general', label: '💬 General' },
  { id: 'other', label: '📌 Other' },
];

const BLOG_CATEGORIES = [
  { id: 'parenting', label: '👨‍👩‍👧 Parenting Tips' },
  { id: 'safety_tips', label: '🛡️ Safety Tips' },
  { id: 'teaching', label: '📚 Teaching' },
  { id: 'community_voices', label: '🗣️ Community Voice' },
  { id: 'other', label: '📌 Other' },
];

const FEATURE_CATEGORIES = [
  { id: 'safety', label: '🛡️ Safety' },
  { id: 'tracking', label: '📍 Tracking' },
  { id: 'payments', label: '💰 Payments' },
  { id: 'communication', label: '📞 Communication' },
  { id: 'rides', label: '🚗 Rides' },
  { id: 'other', label: '📌 Other' },
];

export default function NewPost({ route, navigation }) {
  const postType = route.params?.type || 'safety_post';
  const isBlog = postType === 'blog';
  const isFeature = postType === 'feature';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('general');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [guidance, setGuidance] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadTemplates = async () => {
      if (!isBlog) return;
      setLoadingTemplates(true);
      try {
        const res = await fetch(`${API_URL}/blog/templates`);
        const data = await res.json();
        if (!mounted) return;
        setTemplates(data.templates || []);
        setGuidance(data.defaultGuidance || []);
      } catch (e) {
        console.error('Failed to load blog templates:', e);
      } finally {
        if (mounted) setLoadingTemplates(false);
      }
    };
    loadTemplates();
    return () => { mounted = false; };
  }, [isBlog]);

  const selectedTemplate = useMemo(() => templates.find(t => t.category === category) || templates[0] || null, [templates, category]);

  const getCategories = () => {
    if (isBlog) return BLOG_CATEGORIES;
    if (isFeature) return FEATURE_CATEGORIES;
    return SAFETY_CATEGORIES;
  };

  const getTitlePlaceholder = () => {
    if (isBlog) return 'Article title...';
    if (isFeature) return 'What feature would you like?';
    return 'What safety concern or topic?';
  };

  const getBodyPlaceholder = () => {
    if (isBlog) return 'Write your article here... (Luganda, Swahili, or English)';
    if (isFeature) return 'Describe your feature idea in detail...';
    return 'Describe your concern or start a discussion... (Luganda, Swahili, or English)';
  };

  const getEndpoints = () => {
    if (isBlog) return { url: `${API_URL}/blog`, redirect: 'BlogHome' };
    if (isFeature) return { url: `${API_URL}/features`, redirect: 'FeatureVoting' };
    return { url: `${API_URL}/posts`, redirect: 'CommunityBoard' };
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Required', 'Please enter your content');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      if (!token) {
        Alert.alert('Login Required', 'Please sign in first');
        setSubmitting(false);
        return;
      }

      const endpoints = getEndpoints();
      const payload = {
        title: title.trim(),
        body: body.trim(),
        category,
      };

      if (isBlog) {
        payload.excerpt = excerpt.trim() || body.trim().substring(0, 250);
        payload.authorName = authorName.trim() || undefined;
        if (selectedTemplate) payload.category = selectedTemplate.category || category;
      }

      const res = await fetch(endpoints.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.error || 'Failed to submit');
        setSubmitting(false);
        return;
      }

      let message;
      if (isFeature) {
        message = 'Feature suggested! The community can now vote on it.';
      } else if (data.moderationNote) {
        message = data.moderationNote;
      } else {
        message = 'Posted successfully!';
      }

      Alert.alert('✅ Done', message, [
        { text: 'OK', onPress: () => navigation.navigate(endpoints.redirect) }
      ]);
    } catch (e) {
      Alert.alert('Network Error', 'Could not connect. Check your internet.');
      console.error('Submit failed:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Type Header */}
        <View style={styles.typeHeader}>
          <Text style={styles.typeIcon}>
            {isBlog ? '✍️' : isFeature ? '💡' : '🛡️'}
          </Text>
          <Text style={styles.typeLabel}>
            {isBlog ? 'New Blog Article' : isFeature ? 'Feature Suggestion' : 'New Discussion'}
          </Text>
        </View>

        {isBlog && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📝 Your article will be reviewed by Hamna before publishing.
              You can write in Luganda, Swahili, or English.
            </Text>
            <Text style={[styles.infoText, styles.infoTextSpacing]}>
              {REVIEW_GUIDANCE.pending}
            </Text>
          </View>
        )}

        {!isFeature && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🛡️ Your name will be masked as "{isBlog ? 'your chosen name' : 'Role · Location'}" for privacy.
            </Text>
          </View>
        )}

        {/* Author Name (Blog only) */}
        {isBlog && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={authorName}
              onChangeText={setAuthorName}
              placeholder="How should readers see your name?"
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={getTitlePlaceholder()}
            placeholderTextColor="#999"
            maxLength={isFeature ? 150 : 200}
          />
        </View>

        {isBlog && selectedTemplate ? (
          <View style={styles.templateBox}>
            <Text style={styles.templateTitle}>{selectedTemplate.title}</Text>
            <Text style={styles.templatePrompt}>{selectedTemplate.prompt}</Text>
          </View>
        ) : null}

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {getCategories().map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  category === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={[
                  styles.chipText,
                  category === cat.id && styles.chipTextActive,
                ]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Excerpt (Blog only) */}
        {isBlog && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Short Excerpt</Text>
            <TextInput
              style={styles.input}
              value={excerpt}
              onChangeText={setExcerpt}
              placeholder="A brief summary of your article (optional)"
              placeholderTextColor="#999"
              maxLength={300}
            />
          </View>
        )}

        {/* Body */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {isBlog ? 'Article *' : isFeature ? 'Description *' : 'Details *'}
          </Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={body}
            onChangeText={setBody}
            placeholder={getBodyPlaceholder()}
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            maxLength={isBlog ? 50000 : isFeature ? 5000 : 10000}
          />
          <Text style={styles.charCount}>
            {body.length}/{isBlog ? 50000 : isFeature ? 5000 : 10000}
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {isBlog ? '✍️ Submit for Review' : isFeature ? '💡 Suggest Feature' : '📢 Post to Board'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  typeHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  typeIcon: { fontSize: 24, marginRight: 8 },
  typeLabel: { fontSize: 20, fontWeight: '700', color: '#222' },
  infoBox: {
    backgroundColor: '#E3F2FD', borderRadius: 8, padding: 10,
    marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#1565C0',
  },
  infoText: { fontSize: 12, color: '#333', lineHeight: 16 },
  infoTextSpacing: { marginTop: 6 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 8, borderWidth: 1,
    borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#333',
  },
  bodyInput: { minHeight: 180, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#999', textAlign: 'right', marginTop: 4 },
  templateBox: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#2E7D32', marginBottom: 16 },
  templateTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  templatePrompt: { fontSize: 12, color: '#555', marginTop: 4, lineHeight: 18 },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ddd',
  },
  categoryChipActive: {
    backgroundColor: '#2E7D32', borderColor: '#2E7D32',
  },
  chipText: { fontSize: 12, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#2E7D32', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
    marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  submitBtnDisabled: { backgroundColor: '#A5D6A7' },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
