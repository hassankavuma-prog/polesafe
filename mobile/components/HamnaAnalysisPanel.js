// PoleSafe — Hamna Analysis Panel
// Embedded component that shows Hamna's document analysis in AdminDriverReview
// Hamna flags issues — admin decides

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';

const STATUS_ICONS = {
  success: { icon: 'checkmark-circle', color: '#2e7d32', bg: '#E8F5E9' },
  warning: { icon: 'warning', color: '#f57f17', bg: '#FFF8E1' },
  error: { icon: 'close-circle', color: '#c62828', bg: '#FFEBEE' },
  critical: { icon: 'alert-circle', color: '#b71c1c', bg: '#FFCDD2' },
  info: { icon: 'information-circle', color: '#1565c0', bg: '#E3F2FD' },
};

function StatusRow({ status, icon, message, onPress }) {
  const meta = STATUS_ICONS[status] || STATUS_ICONS.info;
  return (
    <TouchableOpacity
      style={[styles.statusRow, { backgroundColor: meta.bg, borderLeftColor: meta.color }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon || meta.icon} size={18} color={meta.color} style={styles.rowIcon} />
      <Text style={[styles.rowText, { color: meta.color }]}>{message}</Text>
      {onPress && <Ionicons name="chevron-forward" size={16} color={meta.color} />}
    </TouchableOpacity>
  );
}

function RecommendationList({ recommendations }) {
  if (!recommendations?.length) return null;
  return (
    <View style={styles.recommendations}>
      {recommendations.map((rec, i) => (
        <Text key={i} style={styles.recText}>{rec}</Text>
      ))}
    </View>
  );
}

function AnalysisSection({ section, expanded: defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const meta = STATUS_ICONS[section.status] || STATUS_ICONS.info;

  return (
    <View style={[styles.section, { borderLeftColor: meta.color }]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name={section.icon || 'analytics'} size={18} color={meta.color} />
          <Text style={[styles.sectionTitle, { color: meta.color }]}>{section.title}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#666" />
      </TouchableOpacity>
      <Text style={styles.sectionSummary}>{section.summary}</Text>

      {expanded && (
        <View style={styles.sectionDetails}>
          {section.details?.map((d, i) => (
            <StatusRow key={i} status={d.severity || d.status} message={d.message || `${d.field}: ${d.status}`} />
          ))}
          {section.recommendations?.length > 0 && (
            <RecommendationList recommendations={section.recommendations} />
          )}
          {section.severity && (
            <Text style={[styles.severityTag, { color: meta.color }]}>
              Severity: {section.severity}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function HamnaAnalysisPanel({ driverId, driverData, visible = true, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalysis = async () => {
    if (!driverId && !driverData) return;
    setLoading(true);
    setError(null);

    try {
      // Try API first
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_BASE}/api/hamna/analyze-driver/${driverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
        return;
      }
    } catch (err) {
      // Fall through to local analysis
    }

    // Fallback: local analysis using driverData
    if (driverData?.docs) {
      setAnalysis(performLocalAnalysis(driverData));
    } else {
      setError('Could not reach Hamna and no local data available');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible && (driverId || driverData)) {
      fetchAnalysis();
    }
  }, [visible, driverId]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.hamnaAvatar}>
            <Text style={styles.hamnaAvatarText}>H</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Hamna Analysis</Text>
            <Text style={styles.headerSub}>AI Document Spotter</Text>
          </View>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#4361ee" />
            <Text style={styles.loadingText}>Hamna is analyzing documents...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#c62828" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {analysis && (
          <>
            {/* Hamna's Overall Verdict */}
            <View style={[styles.verdictBanner, {
              backgroundColor: analysis.overallStatus === 'reject' ? '#FFEBEE' :
                analysis.overallStatus === 'flag' ? '#FFF8E1' : '#E8F5E9',
              borderColor: analysis.overallStatus === 'reject' ? '#c62828' :
                analysis.overallStatus === 'flag' ? '#f57f17' : '#2e7d32',
            }]}>
              <Ionicons
                name={analysis.overallStatus === 'reject' ? 'alert-circle' :
                  analysis.overallStatus === 'flag' ? 'warning' : 'checkmark-circle'}
                size={24}
                color={analysis.overallStatus === 'reject' ? '#c62828' :
                  analysis.overallStatus === 'flag' ? '#f57f17' : '#2e7d32'}
              />
              <Text style={[styles.verdictText, {
                color: analysis.overallStatus === 'reject' ? '#b71c1c' :
                  analysis.overallStatus === 'flag' ? '#e65100' : '#1b5e20',
              }]}>
                {analysis.hamnaVerdict}
              </Text>
            </View>

            {/* Analysis Sections */}
            {analysis.sections?.map((section, i) => (
              <AnalysisSection key={i} section={section} expanded={i < 2} />
            ))}
          </>
        )}

        {!loading && !analysis && !error && (
          <View style={styles.emptyBox}>
            <Ionicons name="search" size={40} color="#bbb" />
            <Text style={styles.emptyText}>Tap "Analyze with Hamna" to check this driver's documents</Text>
          </View>
        )}

        {/* Info footer */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={14} color="#999" />
          <Text style={styles.footerText}>Hamna flags — she doesn't decide. Always verify manually.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Local Analysis Fallback ──────────────────────────
function performLocalAnalysis(driverData) {
  const docs = driverData.docs || {};
  const sections = [];
  let criticals = 0, errors = 0, warnings = 0;

  // Completeness check
  const required = ['ninNumber', 'selfieUri', 'plateNumber', 'phoneNumber'];
  const present = required.filter(k => docs[k]);
  const missing = required.filter(k => !docs[k]);
  sections.push({
    title: '📋 Document Checklist',
    icon: 'checklist',
    status: missing.length === 0 ? 'success' : missing.length <= 2 ? 'warning' : 'error',
    summary: `${present.length}/${required.length} documents provided`,
    details: required.map(k => ({
      field: k,
      status: docs[k] ? 'present' : 'missing',
      severity: docs[k] ? 'success' : 'error',
      message: docs[k] ? `${k} provided` : `${k} is missing`,
    })),
  });
  if (missing.length > 0) errors++;

  // NIN check
  const ninClean = (docs.ninNumber || '').trim().toUpperCase();
  const ninValid = /^(CM|CF|CN|CP|CH)\d{13}[A-Z]{2}$/i.test(ninClean);
  sections.push({
    title: '🆔 NIN Verification',
    icon: 'id',
    status: ninValid ? 'success' : 'error',
    summary: ninValid ? `Valid NIN format` : `Invalid NIN format — Uganda NINs start with CM/CF/CN + 13 digits + 2 letters`,
  });
  if (!ninValid) errors++;

  // Plate check
  const plateClean = (docs.plateNumber || '').trim().toUpperCase();
  const plateValid = /^U[A-Z]{2,3}\s?\d{3}[A-Z]$/i.test(plateClean);
  sections.push({
    title: '🚗 Plate Number',
    icon: 'car',
    status: plateValid ? 'success' : 'warning',
    summary: plateValid ? `Valid plate format` : `"${plateClean}" — unusual format, verify manually`,
  });
  if (!plateValid) warnings++;

  // Phone check
  const phoneClean = (docs.phoneNumber || '').replace(/\s/g, '');
  const phoneValid = /^(0|\+256)[7-9]\d{8}$/.test(phoneClean);
  sections.push({
    title: '📱 Phone Number',
    icon: 'phone',
    status: phoneValid ? 'success' : 'error',
    summary: phoneValid ? `Valid Uganda mobile number` : `"${docs.phoneNumber}" — invalid format`,
  });
  if (!phoneValid) errors++;

  // Face comparison guidance
  sections.push({
    title: '🤳 Face Comparison',
    icon: 'face',
    status: 'warning',
    summary: 'Manual review required — zoom into selfie and NIN photo to compare',
    recommendations: [
      '🔍 Compare: nose shape, jawline, eye spacing, skin tone',
      '⚠️ Look for AI artifacts: smooth skin, inconsistent lighting, unnatural reflections',
      '📏 Check if both photos have similar resolution/quality',
    ],
  });

  // AI forgery warnings
  sections.push({
    title: '🤖 AI Forgery Check',
    icon: 'shield',
    status: 'info',
    summary: 'AI-generated documents are increasingly common. Look for:',
    recommendations: [
      '✨ Unnaturally smooth skin with no pores/texture',
      '👁️ Identical reflections in both eyes (AI artifact)',
      '🔲 Hard aliased edges around hair or ears',
      '📷 Missing or inconsistent EXIF metadata',
      '🎨 Color/lighting mismatch between face and background',
    ],
  });

  // Overall verdict
  let hamnaVerdict, overallStatus;
  if (criticals > 0) {
    hamnaVerdict = '🔴 Hamna recommends rejection — critical issues detected';
    overallStatus = 'reject';
  } else if (errors > 0) {
    hamnaVerdict = '🟡 Hamna flags issues — fix before approving';
    overallStatus = 'flag';
  } else if (warnings > 2) {
    hamnaVerdict = '🟡 Multiple warnings — review carefully';
    overallStatus = 'caution';
  } else {
    hamnaVerdict = '🟢 No major issues detected — admin should still visually verify';
    overallStatus = 'review';
  }

  return {
    driverName: driverData.name,
    overallStatus,
    hamnaVerdict,
    sections,
    analyzedAt: new Date().toISOString(),
  };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f2ff',
    borderRadius: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d0d5f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#e8ebff',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d5f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamnaAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4361ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  hamnaAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  headerSub: {
    fontSize: 11,
    color: '#666',
  },
  body: {
    maxHeight: 400,
    padding: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#4361ee',
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  verdictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  verdictText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionSummary: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
    marginLeft: 24,
  },
  sectionDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderLeftWidth: 3,
  },
  rowIcon: {
    marginRight: 6,
  },
  rowText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  recommendations: {
    backgroundColor: '#f8f9ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  recText: {
    fontSize: 11,
    color: '#555',
    lineHeight: 18,
    marginBottom: 2,
  },
  severityTag: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
});

export default HamnaAnalysisPanel;
