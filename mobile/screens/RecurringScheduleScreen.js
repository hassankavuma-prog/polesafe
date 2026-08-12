// PoleSafe — Recurring Schedule Screen
// Weekly / Monthly / Termly subscription builder for school rides
// Parents set automated schedules with auto-dispatch + auto-billing

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, SafeAreaView, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { BRAND, STATUS, getTheme, TYPOGRAPHY } from '../theme';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { fetchSchedules, pauseSchedule, resumeSchedule, cancelSchedule, createSchedule } from '../services/recurringRideService';

const API_URL = API_BASE;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABELS = { Mon: 'M', Tue: 'T', Wed: 'W', Thu: 'T', Fri: 'F' };
const PLANS = [
  { key: 'weekly', label: 'Weekly', discount: '10% off', icon: '🗓️', desc: 'Billed every Sunday 6PM' },
  { key: 'monthly', label: 'Monthly', discount: '15% off', icon: '📅', desc: 'Billed 1st of month' },
  { key: 'termly', label: 'Termly', discount: '20% off', icon: '📚', desc: 'Billed term start' },
];
const VEHICLES = [
  { key: 'car', label: 'Car 🚗', desc: 'Private car / taxi' },
  { key: 'boda', label: 'Boda 🏍️', desc: 'Motorcycle (faster, cheaper)' },
];

// ─── Plan Summary ─────────────────────────────────────
function PlanSummary({ plan }) {
  const meta = PLANS.find(p => p.key === plan);
  if (!meta) return null;
  return (
    <View style={styles.planBadge}>
      <Text style={styles.planBadgeIcon}>{meta.icon}</Text>
      <View style={styles.planBadgeText}>
        <Text style={styles.planBadgeLabel}>{meta.label}</Text>
        <Text style={styles.planBadgeDesc}>{meta.discount} · {meta.desc}</Text>
      </View>
    </View>
  );
}

// ─── Schedule Card ─────────────────────────────────────
function ScheduleCard({ schedule, onRefresh }) {
  const statusColor = schedule.status === 'active' ? STATUS.safe :
    schedule.status === 'paused' ? '#F59E0B' : '#6B7280';

  const [actionLoading, setActionLoading] = useState(null);

  const handleAction = async (action, bookingId) => {
    setActionLoading(action);
    try {
      let result;
      switch (action) {
        case 'pause': result = await pauseSchedule(bookingId); break;
        case 'resume': result = await resumeSchedule(bookingId); break;
        case 'cancel': {
          Alert.alert('Cancel Schedule', 'All future rides will be cancelled. Continue?',
            [{ text: 'No' }, { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
              result = await cancelSchedule(bookingId);
              if (result.error) Alert.alert('Error', result.error);
              else onRefresh?.();
            }}]);
          setActionLoading(null);
          return;
        }
      }
      if (result?.error) Alert.alert('Error', result.error);
      else onRefresh?.();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setActionLoading(null);
  };

  return (
    <GlassCard style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <View>
          <Text style={styles.scheduleKid}>{schedule.childId?.name || 'Child'}</Text>
          <Text style={styles.scheduleSchool}>{schedule.childId?.schoolName || 'School'}</Text>
        </View>
        <View style={[styles.scheduleStatus, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.scheduleStatusText, { color: statusColor }]}>
            {schedule.status === 'active' ? '🟢 Active' : schedule.status === 'paused' ? '🟡 Paused' : '⚪ Cancelled'}
          </Text>
        </View>
      </View>

      <PlanSummary plan={schedule.type} />

      <View style={styles.scheduleDetailRow}>
        <Text style={styles.scheduleDetailText}>
          🕐 {schedule.pickupTime || '7:00 AM'} → {schedule.dropoffTime || '4:30 PM'}
        </Text>
        <Text style={styles.scheduleDetailText}>
          🚗 {schedule.vehicleType === 'boda' ? 'Boda' : 'Car'}
        </Text>
      </View>

      <View style={styles.scheduleDays}>
        {DAYS.map(day => (
          <View key={day} style={[
            styles.dayChipSmall,
            (schedule.daysOfWeek || []).includes(day) && styles.dayChipSmallActive,
          ]}>
            <Text style={[
              styles.dayChipSmallText,
              (schedule.daysOfWeek || []).includes(day) && styles.dayChipSmallTextActive,
            ]}>{DAY_LABELS[day]}</Text>
          </View>
        ))}
      </View>

      {schedule.driverId && (
        <Text style={styles.scheduleDriver}>
          👤 Preferred driver: {schedule.driverId.name}
        </Text>
      )}

      {/* Actions */}
      <View style={styles.scheduleActions}>
        {schedule.status === 'active' && (
          <TouchableOpacity
            style={[styles.scheduleActionBtn, { backgroundColor: '#FFF8E1' }]}
            onPress={() => handleAction('pause', schedule._id)}
            disabled={actionLoading === 'pause'}
          >
            <Text style={[styles.scheduleActionText, { color: '#92400E' }]}>
              {actionLoading === 'pause' ? '⏳' : '⏸️ Pause'}
            </Text>
          </TouchableOpacity>
        )}
        {schedule.status === 'paused' && (
          <TouchableOpacity
            style={[styles.scheduleActionBtn, { backgroundColor: '#E8F5E9' }]}
            onPress={() => handleAction('resume', schedule._id)}
            disabled={actionLoading === 'resume'}
          >
            <Text style={[styles.scheduleActionText, { color: '#15803D' }]}>
              {actionLoading === 'resume' ? '⏳' : '▶️ Resume'}
            </Text>
          </TouchableOpacity>
        )}
        {schedule.status !== 'cancelled' && (
          <TouchableOpacity
            style={[styles.scheduleActionBtn, { backgroundColor: '#FFEBEE' }]}
            onPress={() => handleAction('cancel', schedule._id)}
            disabled={actionLoading === 'cancel'}
          >
            <Text style={[styles.scheduleActionText, { color: '#B91C1C' }]}>
              {actionLoading === 'cancel' ? '⏳' : '🗑️ Cancel'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

// ─── Main Screen ──────────────────────────────────────
export default function RecurringScheduleScreen({ navigation }) {
  const theme = getTheme();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('view'); // 'view' | 'create'

  // ─── Schedule Builder State ───────────────────────
  const [kids, setKids] = useState([]);
  const [selectedKid, setSelectedKid] = useState(null);
  const [planType, setPlanType] = useState('weekly');
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [pickupTime, setPickupTime] = useState('07:00');
  const [dropoffTime, setDropoffTime] = useState('16:30');
  const [vehicleType, setVehicleType] = useState('car');
  const [favoriteDrivers, setFavoriteDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [autoBill, setAutoBill] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      setLoadingSchedules(true);
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [kidsRes, schedRes, favRes] = await Promise.all([
        fetch(`${API_URL}/api/parents/kids`, { headers }),
        fetch(`${API_URL}/api/parents/schedules`, { headers }),
        fetch(`${API_URL}/api/ratings/favorites`, { headers }).catch(() => ({ json: () => ({}) })),
      ]);

      const kidsData = await kidsRes.json();
      const schedData = await schedRes.json();
      const favData = await favRes.json().catch(() => ({}));

      setKids(kidsData.kids || []);
      setSchedules(schedData.schedules || []);
      setFavoriteDrivers(favData.drivers || []);
    } catch (err) {
      console.log('Load schedule screen error:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  // ─── Create schedule ──────────────────────────────
  const handleCreate = async () => {
    if (!selectedKid) {
      Alert.alert('Select Child', 'Please select a child first');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Select Days', 'Please select at least one day');
      return;
    }

    setCreating(true);
    try {
      const baseFare = 5000;
      const totalTrips = selectedDays.length * 2; // morning + afternoon

      const result = await createSchedule({
        childId: selectedKid._id,
        schoolId: selectedKid.schoolId?._id,
        driverId: selectedDriver?._id,
        type: planType,
        daysOfWeek: selectedDays,
        pickupTime,
        dropoffTime,
        vehicleType,
        amountPerTrip: baseFare,
        totalTrips,
        staggeredPickups: [],
      });

      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert('✅ Schedule Created!', result.message || `Your ${planType} schedule is active.`);
        setMode('view');
        loadData();
        // Reset form
        setSelectedKid(null);
        setPlanType('weekly');
        setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
        setSelectedDriver(null);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setCreating(false);
  };

  // ─── Toggle day ────────────────────────────────────
  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // ─── Estimated fare ────────────────────────────────
  const discounts = { weekly: 0.10, monthly: 0.15, termly: 0.20 };
  const basePerTrip = 5000;
  const discRate = discounts[planType] || 0;
  const perTripDiscounted = Math.round(basePerTrip * (1 - discRate));
  const estWeekly = perTripDiscounted * selectedDays.length * 2;
  const estMonthly = estWeekly * 4;
  const estTermly = estWeekly * 12;

  // ─── Loading ───────────────────────────────────────
  if (loading || loadingSchedules) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: theme.canvas }]}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.loadingText}>Loading schedules...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.canvas }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {mode === 'view' ? '📅 My Schedules' : '🔧 New Schedule'}
        </Text>
        <TouchableOpacity
          onPress={() => setMode(mode === 'view' ? 'create' : 'view')}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>
            {mode === 'view' ? '+ New' : '✕ Close'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {mode === 'view' ? (
          <>
            {/* My Schedules */}
            {schedules.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>No schedules yet</Text>
                <Text style={styles.emptyDesc}>
                  Set up a recurring schedule and we'll auto-dispatch rides for you.
                  {'\n'}No more booking every morning and afternoon!
                </Text>
                <PrimaryButton title="+ Create Schedule" onPress={() => setMode('create')} />
              </View>
            ) : (
              <>
                <Text style={styles.sectionSubtitle}>
                  {schedules.length} active schedule{schedules.length !== 1 ? 's' : ''}
                </Text>
                {schedules.map(s => (
                  <ScheduleCard key={s._id} schedule={s} onRefresh={loadData} />
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {/* ── Schedule Builder ─────────────────────── */}
            <Text style={styles.sectionSubtitle}>Let's set up your recurring rides</Text>

            {/* Step 1: Select Child */}
            <Text style={styles.stepTitle}>1. Select Child 👶</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kidScroll}>
              {kids.map(kid => (
                <TouchableOpacity
                  key={kid._id}
                  style={[styles.kidChip, selectedKid?._id === kid._id && styles.kidChipActive]}
                  onPress={() => setSelectedKid(kid)}
                >
                  <Text style={styles.kidChipAvatar}>
                    {kid.name?.charAt(0) || '👶'}
                  </Text>
                  <Text style={[styles.kidChipName, selectedKid?._id === kid._id && styles.kidChipNameActive]}>
                    {kid.name}
                  </Text>
                  <Text style={styles.kidChipClass}>{kid.class || ''}</Text>
                </TouchableOpacity>
              ))}
              {kids.length === 0 && (
                <Text style={styles.noKidsText}>Add a child first in the dashboard</Text>
              )}
            </ScrollView>

            {/* Step 2: Choose Plan */}
            <Text style={styles.stepTitle}>2. Choose Plan 📊</Text>
            <View style={styles.planGrid}>
              {PLANS.map(plan => (
                <TouchableOpacity
                  key={plan.key}
                  style={[styles.planCard, planType === plan.key && styles.planCardActive]}
                  onPress={() => setPlanType(plan.key)}
                >
                  <Text style={styles.planIcon}>{plan.icon}</Text>
                  <Text style={[styles.planLabel, planType === plan.key && styles.planLabelActive]}>
                    {plan.label}
                  </Text>
                  <Text style={[styles.planDiscount, planType === plan.key && styles.planDiscountActive]}>
                    {plan.discount}
                  </Text>
                  <Text style={styles.planDesc}>{plan.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Step 3: Select Days */}
            <Text style={styles.stepTitle}>3. School Days 📆</Text>
            <View style={styles.daysRow}>
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, selectedDays.includes(day) && styles.dayChipActive]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[styles.dayChipText, selectedDays.includes(day) && styles.dayChipTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Step 4: Times */}
            <Text style={styles.stepTitle}>4. Pick Times 🕐</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>Morning pickup</Text>
                <TextInput
                  style={styles.timeInput}
                  value={pickupTime}
                  onChangeText={setPickupTime}
                  placeholder="07:00"
                  placeholderTextColor="#9CA3AF"
                  maxLength={5}
                />
              </View>
              <Text style={styles.timeArrow}>→</Text>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>Afternoon drop-off</Text>
                <TextInput
                  style={styles.timeInput}
                  value={dropoffTime}
                  onChangeText={setDropoffTime}
                  placeholder="16:30"
                  placeholderTextColor="#9CA3AF"
                  maxLength={5}
                />
              </View>
            </View>

            {/* Step 5: Vehicle */}
            <Text style={styles.stepTitle}>5. Vehicle 🚗</Text>
            <View style={styles.vehicleRow}>
              {VEHICLES.map(v => (
                <TouchableOpacity
                  key={v.key}
                  style={[styles.vehicleCard, vehicleType === v.key && styles.vehicleCardActive]}
                  onPress={() => setVehicleType(v.key)}
                >
                  <Text style={styles.vehicleIcon}>{v.key === 'car' ? '🚗' : '🏍️'}</Text>
                  <Text style={[styles.vehicleLabel, vehicleType === v.key && styles.vehicleLabelActive]}>
                    {v.label}
                  </Text>
                  <Text style={styles.vehicleDesc}>{v.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Step 6: Preferred Driver */}
            <Text style={styles.stepTitle}>6. Preferred Driver (optional) 👤</Text>
            {favoriteDrivers.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.driverScroll}>
                <TouchableOpacity
                  style={[styles.driverChip, !selectedDriver && styles.driverChipActive]}
                  onPress={() => setSelectedDriver(null)}
                >
                  <Text style={[styles.driverChipText, !selectedDriver && styles.driverChipTextActive]}>Any</Text>
                </TouchableOpacity>
                {favoriteDrivers.map(d => (
                  <TouchableOpacity
                    key={d._id}
                    style={[styles.driverChip, selectedDriver?._id === d._id && styles.driverChipActive]}
                    onPress={() => setSelectedDriver(d)}
                  >
                    <Text style={styles.driverChipEmoji}>⭐</Text>
                    <Text style={[styles.driverChipText, selectedDriver?._id === d._id && styles.driverChipTextActive]}>
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noDriverText}>Rate a driver to save as preferred</Text>
            )}

            {/* Step 7: Auto-billing */}
            <Text style={styles.stepTitle}>7. Auto-Billing 💰</Text>
            <TouchableOpacity
              style={[styles.toggleCard, autoBill && styles.toggleCardActive]}
              onPress={() => setAutoBill(!autoBill)}
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Auto-bill every period</Text>
                <Text style={styles.toggleDesc}>
                  {planType === 'weekly' ? 'Sunday 6PM' :
                   planType === 'monthly' ? '1st of month' : 'Term start'}
                </Text>
              </View>
              <Switch value={autoBill} onValueChange={setAutoBill} />
            </TouchableOpacity>

            {/* Fare Estimate */}
            <GlassCard style={styles.fareCard}>
              <Text style={styles.fareTitle}>💰 Fare Estimate ({planType})</Text>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Per trip</Text>
                <Text style={styles.fareValue}>
                  {basePerTrip.toLocaleString()} UGX
                  <Text style={styles.fareStrike}> {basePerTrip.toLocaleString()}</Text>
                  <Text style={styles.fareDisc}> -{(discRate * 100).toFixed(0)}%</Text>
                </Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Discounted price</Text>
                <Text style={[styles.fareValue, { color: STATUS.safe }]}>
                  {perTripDiscounted.toLocaleString()} UGX
                </Text>
              </View>
              <View style={styles.fareDivider} />
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Weekly estimate</Text>
                <Text style={styles.fareValueBold}>{estWeekly.toLocaleString()} UGX</Text>
              </View>
              {planType !== 'weekly' && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>
                    {planType === 'monthly' ? 'Monthly' : 'Termly'} estimate
                  </Text>
                  <Text style={styles.fareValueBold}>
                    {(planType === 'monthly' ? estMonthly : estTermly).toLocaleString()} UGX
                  </Text>
                </View>
              )}
            </GlassCard>

            {/* Create Button */}
            <PrimaryButton
              title={creating ? '⏳ Creating...' : '✅ Create Schedule'}
              onPress={handleCreate}
              disabled={creating || kids.length === 0}
              style={styles.createBtn}
            />
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  headerBtn: { backgroundColor: BRAND.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  headerBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  sectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  // Step title
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 10 },

  // Kid selection
  kidScroll: { marginBottom: 4 },
  kidChip: {
    backgroundColor: '#F3F4F6', borderRadius: 14, padding: 12, marginRight: 10,
    alignItems: 'center', minWidth: 80, borderWidth: 2, borderColor: 'transparent',
  },
  kidChipActive: { borderColor: BRAND.primary, backgroundColor: '#E8F5E9' },
  kidChipAvatar: { fontSize: 28, marginBottom: 4 },
  kidChipName: { fontSize: 14, fontWeight: '700', color: '#374151' },
  kidChipNameActive: { color: BRAND.primary },
  kidChipClass: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  noKidsText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },

  // Plan selection
  planGrid: { flexDirection: 'row', gap: 8 },
  planCard: {
    flex: 1, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB',
  },
  planCardActive: { borderColor: BRAND.primary, backgroundColor: '#E8F5E9' },
  planIcon: { fontSize: 28, marginBottom: 4 },
  planLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  planLabelActive: { color: BRAND.primary },
  planDiscount: { fontSize: 12, fontWeight: '700', color: STATUS.safe, marginTop: 2 },
  planDiscountActive: { color: '#15803D' },
  planDesc: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },

  // Plan badge (in schedule card)
  planBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10, marginVertical: 8,
  },
  planBadgeIcon: { fontSize: 20, marginRight: 10 },
  planBadgeText: {},
  planBadgeLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  planBadgeDesc: { fontSize: 11, color: '#6B7280', marginTop: 1 },

  // Days
  daysRow: { flexDirection: 'row', gap: 8 },
  dayChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#F3F4F6', alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  dayChipActive: { backgroundColor: BRAND.primary, borderColor: '#15803D' },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  dayChipTextActive: { color: '#fff', fontWeight: '700' },

  // Day chips (small, in schedule card)
  scheduleDays: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dayChipSmall: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  dayChipSmallActive: { backgroundColor: BRAND.primary },
  dayChipSmallText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  dayChipSmallTextActive: { color: '#fff' },

  // Time inputs
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  timeInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 10, padding: 12, fontSize: 16, fontWeight: '700',
    textAlign: 'center',
  },
  timeArrow: { fontSize: 20, color: '#9CA3AF', marginTop: 16 },

  // Vehicle
  vehicleRow: { flexDirection: 'row', gap: 8 },
  vehicleCard: {
    flex: 1, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB',
  },
  vehicleCardActive: { borderColor: BRAND.secondary, backgroundColor: '#E3F2FD' },
  vehicleIcon: { fontSize: 32, marginBottom: 6 },
  vehicleLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  vehicleLabelActive: { color: BRAND.secondary },
  vehicleDesc: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },

  // Driver
  driverScroll: { marginBottom: 4 },
  driverChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 20, padding: 10, marginRight: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  driverChipActive: { borderColor: BRAND.gold, backgroundColor: '#FFF8E1' },
  driverChipEmoji: { fontSize: 14, marginRight: 4 },
  driverChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  driverChipTextActive: { color: '#92400E' },
  noDriverText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },

  // Auto-billing toggle
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16,
    borderWidth: 2, borderColor: '#E5E7EB',
  },
  toggleCardActive: { borderColor: STATUS.safe, backgroundColor: '#E8F5E9' },
  toggleInfo: {},
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  toggleDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  toggleSwitch: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: '#D1D5DB',
    justifyContent: 'center', padding: 3,
  },
  toggleSwitchOn: { backgroundColor: STATUS.safe },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  toggleKnobOn: { alignSelf: 'flex-end' },

  // Fare estimate
  fareCard: { padding: 16, marginTop: 20 },
  fareTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  fareLabel: { fontSize: 13, color: '#6B7280' },
  fareValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
  fareValueBold: { fontSize: 15, fontWeight: '800', color: '#111827' },
  fareStrike: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' },
  fareDisc: { fontSize: 12, color: STATUS.safe },
  fareDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },

  // Create button
  createBtn: { marginTop: 20 },

  // Schedule cards
  scheduleCard: { padding: 16, marginBottom: 12 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  scheduleKid: { fontSize: 16, fontWeight: '700', color: '#111827' },
  scheduleSchool: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  scheduleStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  scheduleStatusText: { fontSize: 12, fontWeight: '700' },
  scheduleDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  scheduleDetailText: { fontSize: 13, color: '#6B7280' },
  scheduleDriver: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginTop: 4 },
  scheduleActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  scheduleActionBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  scheduleActionText: { fontSize: 13, fontWeight: '700' },
});
