// PoleSafe Mobile — Community Blog Screen
// View and read blog posts from the PoleSafe community

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://localhost:3001/api/community';

const BLOG_CATEGORIES = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'parenting', label: 'Parenting', icon: '👨‍👩‍👧' },
  { id: 'safety_tips', label: 'Safety', icon: '🛡️' },
  { id: 'teaching', label: 'Teaching', icon: '📚' },
  { id: 'polesafe_updates', label: 'Updates', icon: '📢' },
  { id: 'community_voices', label: 'Voices', icon: '🗣️' },
];

export default function CommunityBlog({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchPosts = useCallback(async (cat = selectedCategory) => {
    try {
      const url = `${API_URL}/blog?category=${cat}&limit=20`;
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error('Failed to fetch blog posts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchPosts(selectedCategory);
  }, [selectedCategory]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(selectedCategory);
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      parenting: '👨‍👩‍👧', safety_tips: '🛡️', teaching: '📚',
      polesafe_updates: '📢', community_voices: '🗣️', other: '📌',
    };
    return icons[cat] || '📝';
  };

  const renderPost = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.blogCard, index === 0 && styles.featuredCard]}
      onPress={() => navigation.navigate('BlogDetail', { postId: item._id })}
      activeOpacity={0.7}
    >
      {index === 0 && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
        </View>
      )}
      
      <View style={styles.blogHeader}>
        <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
        <View style={styles.categoryLabelBox}>
          <Text style={styles.categoryLabel}>
            {item.category?.replace('_', ' ') || 'General'}
          </Text>
        </View>
        <Text style={styles.blogDate}>
          {new Date(item.createdAt).toLocaleDateString('en-UG', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </Text>
      </View>

      <Text style={[styles.blogTitle, index === 0 && styles.featuredTitle]} numberOfLines={2}>
        {item.title}
      </Text>

      {item.excerpt ? (
        <Text style={styles.blogExcerpt} numberOfLines={index === 0 ? 4 : 2}>
          {item.excerpt}
        </Text>
      ) : null}

      <View style={styles.blogFooter}>
        <Text style={styles.authorText}>✍️ {item.authorName || 'Anonymous'}</Text>
        <Text style={styles.statsText}>
          👁️ {item.viewCount || 0} · ❤️ {item.likeCount || 0}
        </Text>
      </View>

      {item.originalLanguage && item.originalLanguage !== 'en' && (
        <View style={styles.langBadge}>
          <Text style={styles.langBadgeText}>
            🌐 {item.originalLanguage === 'lg' ? 'Luganda' :
                item.originalLanguage === 'sw' ? 'Swahili' : 'Other'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={BLOG_CATEGORIES}
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
                fetchPosts(item.id);
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

      {/* Blog Posts */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading articles...</Text>
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
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No articles yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to share your story or tips with the community!
              </Text>
            </View>
          }
        />
      )}

      {/* Write Article FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewPost', { type: 'blog' })}
      >
        <Text style={styles.fabIcon}>✍️</Text>
        <Text style={styles.fabLabel}>Write Article</Text>
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
  blogCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  featuredCard: {
    borderWidth: 1, borderColor: '#FFD700',
    backgroundColor: '#FFFEF0',
  },
  featuredBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10, paddingVertical: 3,
    borderTopRightRadius: 12, borderBottomLeftRadius: 8,
  },
  featuredBadgeText: { fontSize: 11, fontWeight: '700', color: '#333' },
  blogHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  categoryIcon: { fontSize: 16 },
  categoryLabelBox: {
    backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10,
  },
  categoryLabel: { fontSize: 11, color: '#555', textTransform: 'capitalize' },
  blogDate: { fontSize: 11, color: '#aaa', marginLeft: 'auto' },
  blogTitle: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 6 },
  featuredTitle: { fontSize: 19 },
  blogExcerpt: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
  blogFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8,
  },
  authorText: { fontSize: 12, color: '#2E7D32', fontWeight: '500' },
  statsText: { fontSize: 11, color: '#999' },
  langBadge: {
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8,
  },
  langBadgeText: { fontSize: 10, color: '#1565C0' },
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
  fabIcon: { fontSize: 18, marginRight: 8 },
  fabLabel: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
