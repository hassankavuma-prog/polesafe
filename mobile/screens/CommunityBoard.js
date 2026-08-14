// PoleSafe Mobile — Community Board (Safety Board)
// Displays Safety Board posts with categories, voting, and masked names

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';

const API_URL = `${API_BASE}/api/community`;

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'route_safety', label: 'Route Safety', icon: '🚸' },
  { id: 'driver_behavior', label: 'Driver', icon: '🚗' },
  { id: 'school_policy', label: 'School', icon: '🏫' },
  { id: 'pickup_delay', label: 'Pickups', icon: '⏰' },
  { id: 'general', label: 'General', icon: '💬' },
];

export default function CommunityBoard({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (cat = selectedCategory, pg = 1, refresh = false) => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const url = `${API_URL}/posts?category=${cat}&page=${pg}&limit=20`;
      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      
      if (pg === 1) {
        setPosts(data.posts || []);
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])]);
      }
      setHasMore(pg < (data.totalPages || 1));
      setPage(pg);
    } catch (e) {
      console.error('Failed to fetch posts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchPosts(selectedCategory, 1, true);
  }, [selectedCategory]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(selectedCategory, 1, true);
  };

  const handleVote = async (postId, vote) => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      if (!token) {
        Alert.alert('Login Required', 'Sign in to vote on posts');
        return;
      }
      const res = await fetch(`${API_URL}/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (data.upvoteCount !== undefined) {
        setPosts(prev => prev.map(p => 
          p._id === postId ? { ...p, ...data } : p
        ));
      }
    } catch (e) {
      console.error('Vote failed:', e);
    }
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      route_safety: '🚸', driver_behavior: '🚗', school_policy: '🏫',
      pickup_delay: '⏰', general: '💬', other: '📌',
      parenting: '👨‍👩‍👧', safety_tips: '🛡️', teaching: '📚',
      polesafe_updates: '📢', community_voices: '🗣️',
    };
    return icons[cat] || '💬';
  };

  const getVoteCount = (post) => {
    const up = post.upvoteCount || (post.upvotes?.length || 0);
    const down = post.downvoteCount || (post.downvotes?.length || 0);
    return up - down;
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.postHeader}>
        <Text style={styles.categoryBadge}>
          {getCategoryIcon(item.category)} {item.category?.replace('_', ' ') || 'General'}
        </Text>
        <Text style={styles.postType}>
          {item.type === 'safety_concern' ? '🚨 Safety' : '💬 Discussion'}
        </Text>
      </View>
      
      <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
      
      {item.body ? (
        <Text style={styles.postBody} numberOfLines={3}>{item.body}</Text>
      ) : null}
      
      <View style={styles.postFooter}>
        <View style={styles.voteRow}>
          <TouchableOpacity onPress={() => handleVote(item._id, 'up')} style={styles.voteBtn}>
            <Ionicons
              name={item.userVoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
              size={20}
              color={item.userVoted ? '#2E7D32' : '#666'}
            />
            <Text style={[styles.voteCount, item.userVoted && styles.votedText]}>
              {getVoteCount(item)}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.metaRow}>
          <Text style={styles.commentCount}>
            💬 {item.commentCount || 0}
          </Text>
          <Text style={styles.authorName}>{item.displayName || 'Anonymous'}</Text>
          <Text style={styles.postDate}>
            {new Date(item.createdAt).toLocaleDateString('en-UG', {
              day: 'numeric', month: 'short'
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => {
                setSelectedCategory(item.id);
                setLoading(true);
                setPage(1);
                fetchPosts(item.id, 1, true);
              }}
            >
              <Text style={styles.chipIcon}>{item.icon}</Text>
              <Text style={[
                styles.chipLabel,
                selectedCategory === item.id && styles.chipLabelActive,
              ]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Posts List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading discussions...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item._id}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />
          }
          contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>No discussions yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to start a safety conversation!
              </Text>
            </View>
          }
          onEndReached={() => {
            if (hasMore && !loading) {
              fetchPosts(selectedCategory, page + 1, false);
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* New Post FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewPost', { type: 'safety_post' })}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabLabel}>New Post</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#666', fontSize: 14 },
  categoryRow: {
    paddingVertical: 8, paddingLeft: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
  },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#2E7D32' },
  chipIcon: { fontSize: 14, marginRight: 4 },
  chipLabel: { fontSize: 13, color: '#555' },
  chipLabelActive: { color: '#fff', fontWeight: '600' },
  listContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 100 },
  postCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  categoryBadge: { fontSize: 11, color: '#555', backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  postType: { fontSize: 11, color: '#E65100', fontWeight: '600' },
  postTitle: { fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 4 },
  postBody: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  voteRow: { flexDirection: 'row', alignItems: 'center' },
  voteBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 4 },
  voteCount: { fontSize: 13, color: '#666', marginLeft: 2, fontWeight: '600' },
  votedText: { color: '#2E7D32' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentCount: { fontSize: 12, color: '#888' },
  authorName: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  postDate: { fontSize: 11, color: '#aaa' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    backgroundColor: '#2E7D32', borderRadius: 28,
    paddingHorizontal: 20, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  fabIcon: { fontSize: 22, color: '#fff', fontWeight: '700', marginRight: 6 },
  fabLabel: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
