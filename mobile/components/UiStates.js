import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

// ============================================================
// Reusable Loading State
// ============================================================
function LoadingState({ message = 'Loading...' }) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#2E7D32" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// ============================================================
// Reusable Error State
// ============================================================
function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================
// Reusable Empty State
// ============================================================
function EmptyState({ icon = '📭', title = 'Nothing here yet', message = '', action }) {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {action && (
        <TouchableOpacity style={styles.retryButton} onPress={action.onPress}>
          <Text style={styles.retryText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================
// Safe Network Fetcher with error handling
// ============================================================
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || `Request failed (${res.status})`, data: null };
    }
    return { error: null, data };
  } catch (err) {
    if (err.message?.includes('Network request failed')) {
      return { error: 'Network error. Please check your connection.', data: null };
    }
    return { error: err.message || 'An unexpected error occurred', data: null };
  }
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export { LoadingState, ErrorState, EmptyState, safeFetch };
