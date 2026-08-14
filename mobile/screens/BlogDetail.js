// PoleSafe Mobile — Blog Detail Screen
// Full article view for the community blog with Hamna review metadata

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';

const API_URL = `${API_BASE}/api/community`;

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
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`${API_URL}/blog/${postId}`),
          fetch(`${API_URL}/posts/${postId}/comments`),
        ]);
        const postData = await postRes.json();
        const commentData = await commentsRes.json();
        if (!postRes.ok) throw new Error(postData.error || 'Could not load article');
        if (mounted) {
          setPost(postData.post);
          setComments(commentData.comments || []);
        }
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
  const commentCount = comments.length || post?.commentCount || 0;

  const submitComment = async () => {
    const value = commentText.trim();
    if (!value) return;
    const token = await AsyncStorage.getItem('polesafe_token');
    if (!token) {
      Alert.alert('Login Required', 'Sign in to comment on blog posts.');
      return;
    }
    setSubmittingComment(true);
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post comment');
      setComments((prev) => [{ ...data.comment, upvoteCount: 0 }, ...prev]);
      setCommentText('');
      Alert.alert('Posted', 'Your reply has been submitted.');
    } catch (e) {
      Alert.alert('Could not post', e.message || 'Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReaction = async (mode) => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      if (!token) {
        Alert.alert('Login Required', 'Sign in to react to posts.');
        return;
      }
      setReaction(mode);
      await fetch(`${API_URL}/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote: 'up' }),
      });
      Alert.alert('Thanks', 'Reaction saved.');
    } catch (e) {
      Alert.alert('Reaction failed', e.message || 'Please try again.');
    }
  };

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
          <Text style={styles.statValue}>{commentCount}</Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>
      </View>

      <View style={styles.interactionCard}>
        <View style={styles.interactionHeader}>
          <Text style={styles.interactionTitle}>Reactions & replies</Text>
          <View style={styles.reactionRow}>
            <TouchableOpacity style={[styles.reactionBtn, reaction === 'like' && styles.reactionActive]} onPress={() => handleReaction('like')}>
              <Text style={styles.reactionEmoji}>{reaction === 'like' ? '❤️' : '🤍'}</Text>
              <Text style={styles.reactionText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.reactionBtn, reaction === 'clap' && styles.reactionActive]} onPress={() => handleReaction('clap')}>
              <Text style={styles.reactionEmoji}>{reaction === 'clap' ? '👏' : '🙌'}</Text>
              <Text style={styles.reactionText}>Clap</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.commentHint}>Post a reply below. Comments are moderated by Hamna before wider visibility when needed.</Text>
        <View style={styles.commentComposer}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a short comment or response..."
            placeholderTextColor="#9ca3af"
            style={styles.commentInput}
            multiline
          />
          <TouchableOpacity style={styles.commentBtn} onPress={submitComment} disabled={submittingComment}>
            <Text style={styles.commentBtnText}>{submittingComment ? 'Posting…' : 'Post reply'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {comments.length ? (
        <View style={styles.commentsCard}>
          <Text style={styles.commentsTitle}>Community replies</Text>
          {comments.slice(0, 5).map((c) => (
            <View key={c._id} style={styles.commentItem}>
              <Text style={styles.commentAuthor}>{c.displayName || 'Anonymous'}</Text>
              <Text style={styles.commentBody}>{c.body}</Text>
            </View>
          ))}
        </View>
      ) : null}

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
  interactionCard: { backgroundColor: '#0f172a', borderRadius: 18, padding: 16, marginBottom: 14 },
  interactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  interactionTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  reactionRow: { flexDirection: 'row', gap: 8 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  reactionActive: { backgroundColor: 'rgba(34,197,94,0.22)' },
  reactionEmoji: { fontSize: 14, marginRight: 6 },
  reactionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  commentHint: { color: '#cbd5e1', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  commentComposer: { gap: 10 },
  commentInput: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, minHeight: 80, textAlignVertical: 'top' },
  commentBtn: { backgroundColor: '#22c55e', borderRadius: 12, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10 },
  commentBtnText: { color: '#052e16', fontWeight: '800' },
  commentsCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14 },
  commentsTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 10 },
  commentItem: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: '#166534', marginBottom: 4 },
  commentBody: { fontSize: 13, lineHeight: 18, color: '#374151' },
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
