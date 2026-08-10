// PoleSafe Mobile — Add Child Screen
// Register a new child for the parent account

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';

export default function AddChild({ navigation }) {
  const theme = getTheme();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [schoolId, setSchoolId] = useState(null);
  const [age, setAge] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/schools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.log('Error loading schools:', err);
    } finally {
      setLoadingSchools(false);
    }
  };

  const isFormValid = () => {
    return name.trim() && className.trim() && schoolId;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Missing Info', 'Please fill in name, class, and school.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/parents/kids`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          class: className.trim(),
          schoolId,
          age: age ? parseInt(age) : undefined,
          medicalConditions: medicalNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to add child');
      }

      Alert.alert(
        'Child Added! 🎉',
        `${name} has been registered successfully.`,
        [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.canvas}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>👶</Text>
          <Text style={styles.headerTitle}>Add Child</Text>
          <Text style={styles.headerSub}>Register a new kid for PoleSafe rides</Text>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Child's Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Sarah Nakato"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        {/* Class */}
        <View style={styles.section}>
          <Text style={styles.label}>Class / Grade *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., P5, S3, Year 7"
            placeholderTextColor="#aaa"
            value={className}
            onChangeText={setClassName}
            editable={!loading}
          />
        </View>

        {/* School Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>School *</Text>
          {loadingSchools ? (
            <ActivityIndicator color="#2E7D32" style={{ marginVertical: 16 }} />
          ) : schools.length === 0 ? (
            <Text style={styles.emptyText}>No schools available</Text>
          ) : (
            schools.map((school) => (
              <TouchableOpacity
                key={school._id}
                style={[
                  styles.schoolOption,
                  schoolId === school._id && styles.schoolOptionSelected,
                ]}
                onPress={() => setSchoolId(school._id)}
              >
                <View style={styles.schoolInfo}>
                  <Text style={styles.schoolName}>{school.name}</Text>
                  {school.location && (
                    <Text style={styles.schoolLocation}>📍 {school.location}</Text>
                  )}
                </View>
                {schoolId === school._id && (
                  <Text style={styles.checkMark}>✅</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Age (optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>Age (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 10"
            placeholderTextColor="#aaa"
            keyboardType="number-pad"
            value={age}
            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
            editable={!loading}
            maxLength={2}
          />
        </View>

        {/* Medical Notes (optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>Medical Conditions (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any allergies, conditions, or notes for the driver"
            placeholderTextColor="#aaa"
            value={medicalNotes}
            onChangeText={setMedicalNotes}
            editable={!loading}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, !isFormValid() && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>➕ Add Child</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  scrollView: { flex: 1, padding: 16 },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  headerEmoji: { fontSize: 56, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },

  section: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceElevated,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  schoolOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: '#eee',
  },
  schoolOptionSelected: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenBg,
  },
  schoolInfo: { flex: 1 },
  schoolName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  schoolLocation: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  checkMark: { fontSize: 18 },

  emptyText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },

  submitBtn: {
    backgroundColor: COLORS.green,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
