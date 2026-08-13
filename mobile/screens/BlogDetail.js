// PoleSafe Mobile — Blog Detail Screen
// Full article view for the community blog with Hamna review metadata

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

const API_URL = 'http://localhost:3001/api/community';

const categoryMap = {
  parenting: 'Parenting Tips',
  safety_tips: 'Safety Tips',
  teaching: 'Teaching',
  polesafe_updates: 'PoleSafe Updates',
  community_voices: 'Community Voices',
  other: 'Other',
};

const reviewTone = {
  approved: { label: 'Hamna approved', color: '#16a34a', bg: '#dcfce7' },
  pending: { label: 'Under Hamna review', color: '#d97706', bg: '#fef3c7' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2' },
  flagged: { label: 'Flagged', color: '#b91c1c', bg: '#fecaca' },
};

export default function BlogDetail({ route, navigation }) {
  const postId = route.params?.postId;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/blog/${postId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load article');
        if (mounted) setPost(data.post);
      } catch (e) {
        if (mounted) setError(e.message || 'Could not load article');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (postId) load();
    return () => { mounted = false; };
  }, [postId]);

  const review = useMemo(() => reviewTone[post?.reviewStatus] || reviewTone.pending, [post?.reviewStatus]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>📝</Text>
        <Text style={styles.errorTitle}>Article unavailable</Text>
        <Text style={styles.errorText}>{error || 'This article could not be loaded.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{post.categoryLabel || categoryMap[post.category] || 'Community Voices'}</Text>
          </View>
          {post.isFeatured ? (
            <View style={styles.featuredPill}>
              <Text style={styles.featuredPillText}>Featured</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title}>{post.title}</Text>
        <View style={styles.metaWrap}>
          <Text style={styles.author}>✍️ {post.authorName || 'Anonymous'}</Text>
          <Text style={styles.authorBadge}>{post.authorBadge || 'Community Member'}</Text>
        </View>
        <View style={[styles.reviewPill, { backgroundColor: review.bg }]}>
          <Text style={[styles.reviewPillText, { color: review.color }]}>{review.label}</Text>
        </View>
        <Text style={styles.date}>
          {new Date(post.createdAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.body}>{post.body}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{post.viewCount || 0}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{post.likeCount || 0}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{post.commentCount || 0}</Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>
      </View>

      {post.originalLanguage && post.originalLanguage !== 'en' && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            🌐 Original language: {post.originalLanguage === 'lg' ? 'Luganda' : post.originalLanguage === 'sw' ? 'Swahili' : 'Other'}
          </Text>
        </View>
      )}

      {post.moderationReason ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>Hamna note: {post.moderationReason}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>Back to blog</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 8, color: '#666' },
  errorIcon: { fontSize: 46, marginBottom: 8 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  errorText: { marginTop: 6, color: '#666', textAlign: 'center' },
  hero: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  heroTopRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  categoryPill: { backgroundColor: '#f0f0f0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  categoryPillText: { fontSize: 11, color: '#555', fontWeight: '600' },
  featuredPill: { backgroundColor: '#f59e0b', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  featuredPillText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: '#111827' },
  metaWrap: { marginTop: 10, gap: 4 },
  author: { color: '#166534', fontWeight: '700' },
  authorBadge: { color: '#6b7280', fontSize: 12 },
  reviewPill: { alignSelf: 'flex-start', marginTop: 12, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  reviewPillText: { fontSize: 11, fontWeight: '700' },
  date: { marginTop: 10, fontSize: 12, color: '#9ca3af' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  body: { fontSize: 15, lineHeight: 24, color: '#1f2937' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  noticeBox: { backgroundColor: '#ecfeff', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#a5f3fc' },
  noticeText: { color: '#155e75', fontSize: 12, lineHeight: 18 },
  backBtn: { alignSelf: 'flex-start', backgroundColor: '#2E7D32', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtnText: { color: '#fff', fontWeight: '700' },
});
