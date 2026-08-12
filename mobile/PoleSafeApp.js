// PoleSafe Mobile App v3 — Redesigned with Uber-Level UX
// Better than Uber + Lyft combined.
// Safety-first, African-market optimized, super-app experience.
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ActivityIndicator, StyleSheet, Animated, Platform, TouchableOpacity,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Theme
import { BRAND, STATUS, LIGHT, DARK, getTheme, TYPOGRAPHY } from './theme';

// ─── Screens ──────────────────────────────────────────
import LoginScreen from './screens/LoginScreen';
import ParentDashboard from './screens/ParentDashboard';
import ParentBooking from './screens/ParentBooking';
import ParentTrack from './screens/ParentTrack';
import ParentSickDay from './screens/ParentSickDay';
import ParentEarlyPickup from './screens/ParentEarlyPickup';
import ParentCredits from './screens/ParentCredits';
import ParentPayment from './screens/ParentPayment';
import ParentProfile from './screens/ParentProfile';
import DriverDashboard from './screens/DriverDashboard';
import DriverRoute from './screens/DriverRoute';
import DriverEarnings from './screens/DriverEarnings';
import DriverPickupVerify from './screens/DriverPickupVerify';
import SchoolDashboard from './screens/SchoolDashboard';
import SchoolBroadcast from './screens/SchoolBroadcast';
import SchoolGateCheck from './screens/SchoolGateCheck';
import SchoolDetention from './screens/SchoolDetention';
import RideHailing from './screens/RideHailing';
import AddChild from './screens/AddChild';
import Settings from './screens/Settings';
import PendingChildren from './screens/PendingChildren';
import AttendanceReport from './screens/AttendanceReport';
import TeacherPickupVerify from './screens/TeacherPickupVerify';
import CommunityBoard from './screens/CommunityBoard';
import CommunityBlog from './screens/CommunityBlog';
import FeatureVoting from './screens/FeatureVoting';
import NewPost from './screens/NewPost';
import MultiKidDashboard from './screens/MultiKidDashboard';
import FamilySharing from './screens/FamilySharing';
import DriverComplianceHub from './screens/DriverComplianceHub';
import UgandaRideRequest from './screens/UgandaRideRequest';
import HamnaChatScreen from './screens/HamnaChatScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab Icon Component ───────────────────────────────
function TabIcon({ emoji, focused, color }) {
  return (
    <View style={[tabIcon.wrapper, focused && tabIcon.focused]}>
      <Text style={[tabIcon.emoji, { fontSize: focused ? 22 : 20 }]}>{emoji}</Text>
    </View>
  );
}

const tabIcon = StyleSheet.create({
  wrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focused: {
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
  },
  emoji: {
    textAlign: 'center',
  },
});

// ─── Shared Tab Bar Style ─────────────────────────────
const tabBarOptions = (accentColor) => ({
  tabBarActiveTintColor: accentColor,
  tabBarInactiveTintColor: '#9CA3AF',
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
  tabBarStyle: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});

// ─── Header Styles ────────────────────────────────────
const defaultHeaderStyles = (bg, tint = '#fff') => ({
  headerStyle: {
    backgroundColor: bg,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTintColor: tint,
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 18,
  },
  headerBackTitleVisible: false,
});

// ─── Parent Tab Navigator ─────────────────────────────
function ParentTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions(BRAND.primary)}>
      <Tab.Screen
        name="Home"
        component={ParentDashboard}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          ...defaultHeaderStyles(BRAND.primary),
          title: 'PoleSafe',
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 12 }} onPress={() => {}}>
              <Text style={{ fontSize: 20 }}>🚸</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Booking"
        component={ParentBooking}
        options={{
          tabBarLabel: 'School',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
          ...defaultHeaderStyles(BRAND.primary),
          title: 'School Rides',
        }}
      />
      <Tab.Screen
        name="RideHailing"
        component={RideHailing}
        options={{
          tabBarLabel: 'Ride',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚗" focused={focused} />,
          ...defaultHeaderStyles(BRAND.secondary),
          title: 'PoleSafe Ride',
        }}
      />
      <Tab.Screen
        name="Credits"
        component={ParentCredits}
        options={{
          tabBarLabel: 'Credits',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />,
          ...defaultHeaderStyles(BRAND.primary),
          title: 'My Credits',
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityBoard}
        options={{
          tabBarLabel: 'Safety',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" focused={focused} />,
          ...defaultHeaderStyles(BRAND.primary),
          title: 'Safety Board',
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Rider Tab Navigator ──────────────────────────────
// Rider = ride-hailing only (no school/parent stuff)
function RiderTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions(BRAND.purple)}>
      <Tab.Screen
        name="RideHome"
        component={RideHailing}
        options={{
          tabBarLabel: 'Ride',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚗" focused={focused} color={BRAND.purple} />,
          ...defaultHeaderStyles(BRAND.purple),
          title: 'PoleSafe Ride',
        }}
      />
      <Tab.Screen
        name="RiderCommunity"
        component={CommunityBoard}
        options={{
          tabBarLabel: 'Safety',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" focused={focused} color={BRAND.purple} />,
          ...defaultHeaderStyles(BRAND.purple),
          title: 'Safety Board',
        }}
      />
      <Tab.Screen
        name="RiderSettings"
        component={Settings}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} color={BRAND.purple} />,
          ...defaultHeaderStyles(BRAND.purple),
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Driver Tab Navigator ─────────────────────────────
function DriverTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions(BRAND.secondary)}>
      <Tab.Screen
        name="DriverHome"
        component={DriverDashboard}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
          ...defaultHeaderStyles(BRAND.secondary),
          title: 'PoleSafe Driver',
        }}
      />
      <Tab.Screen
        name="Route"
        component={DriverRoute}
        options={{
          tabBarLabel: 'Route',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
          ...defaultHeaderStyles(BRAND.secondary),
          title: "Today's Route",
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={DriverEarnings}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />,
          ...defaultHeaderStyles(BRAND.secondary),
          title: 'My Earnings',
        }}
      />
    </Tab.Navigator>
  );
}

// ─── School Tab Navigator ─────────────────────────────
function SchoolTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions(BRAND.teal)}>
      <Tab.Screen
        name="SchoolHome"
        component={SchoolDashboard}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏫" focused={focused} />,
          ...defaultHeaderStyles(BRAND.teal),
          title: 'School Dashboard',
        }}
      />
      <Tab.Screen
        name="GateCheck"
        component={SchoolGateCheck}
        options={{
          tabBarLabel: 'Gate',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚪" focused={focused} />,
          ...defaultHeaderStyles(BRAND.teal),
          title: 'Gate Check-In',
        }}
      />
      <Tab.Screen
        name="Broadcast"
        component={SchoolBroadcast}
        options={{
          tabBarLabel: 'Notify',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📢" focused={focused} />,
          ...defaultHeaderStyles(BRAND.teal),
          title: 'Announcements',
        }}
      />
      <Tab.Screen
        name="SchoolCommunity"
        component={CommunityBoard}
        options={{
          tabBarLabel: 'Safety',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" focused={focused} />,
          ...defaultHeaderStyles(BRAND.teal),
          title: 'Safety Board',
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Splash Screen ────────────────────────────────────
function SplashScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={splash.container}>
      <StatusBar style="dark" />
      <Animated.View style={[splash.logoWrap, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={splash.icon}>🚸</Text>
      </Animated.View>
      <Text style={splash.logo}>PoleSafe</Text>
      <Text style={splash.slogan}>From Home to School. And Beyond.</Text>
      <View style={splash.loaderRow}>
        <View style={splash.dot} />
        <View style={[splash.dot, splash.dotDelay1]} />
        <View style={[splash.dot, splash.dotDelay2]} />
      </View>
    </View>
  );
}

const splash = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' },
  logoWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(46, 125, 50, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 40 },
  logo: { fontSize: 36, fontWeight: '800', color: BRAND.primary, letterSpacing: -0.5 },
  slogan: { fontSize: 14, color: '#6B7280', marginTop: 6, marginBottom: 24 },
  loaderRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.primary, opacity: 0.3 },
  dotDelay1: { opacity: 0.6 },
  dotDelay2: { opacity: 0.9 },
});

// ─── Shared Screens Helper ────────────────────────────
const SHARED_SCREENS = [
  ['TrackRide', ParentTrack, { title: 'Live Tracking', color: BRAND.primary }],
  ['SickDay', ParentSickDay, { title: 'Report Sick Day', color: BRAND.primary }],
  ['EarlyPickup', ParentEarlyPickup, { title: 'Early Pickup', color: BRAND.primary }],
  ['AddChild', AddChild, { title: 'Register Child', color: BRAND.primary }],
  ['Payment', ParentPayment, { title: 'Payment', color: BRAND.primary }],
  ['Profile', ParentProfile, { title: 'Profile', color: BRAND.primary }],
  ['Settings', Settings, { title: 'Settings', color: BRAND.primary }],
  ['PendingChildren', PendingChildren, { title: 'Pending Children', color: BRAND.teal }],
  ['AttendanceReport', AttendanceReport, { title: 'Attendance Report', color: BRAND.teal }],
  ['TeacherPickupVerify', TeacherPickupVerify, { title: 'Pickup Verification', color: BRAND.teal }],
  ['SchoolDetention', SchoolDetention, { title: 'Late Pickup', color: BRAND.teal }],
  ['CommunityBoard', CommunityBoard, { title: 'Safety Board', color: BRAND.primary }],
  ['CommunityBlog', CommunityBlog, { title: 'Community Blog', color: BRAND.primary }],
  ['FeatureVoting', FeatureVoting, { title: 'Feature Voting', color: BRAND.primary }],
  ['NewPost', NewPost, { title: 'New Post', color: BRAND.primary }],
  ['MultiKidDashboard', MultiKidDashboard, { title: 'All Kids', color: BRAND.primary }],
  ['FamilySharing', FamilySharing, { title: 'Family Sharing', color: BRAND.primary }],
  ['DriverPickupVerify', DriverPickupVerify, { title: 'Verify Pickup', color: BRAND.secondary }],
  ['DriverComplianceHub', DriverComplianceHub, { title: 'Safety & Credentials', color: BRAND.secondary }],
  ['UgandaRideRequest', UgandaRideRequest, { title: 'Book Transport', color: BRAND.primary }],
  ['HamnaChat', HamnaChatScreen, { title: 'Hamna AI', color: BRAND.primary }],
];

// ─── Shared Back Button ───────────────────────────────
function BackButton({ navigation }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4, paddingHorizontal: 8, paddingVertical: 8 }}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 24, color: '#fff', marginRight: 2 }}>‹</Text>
      <Text style={{ fontSize: 16, color: '#fff', fontWeight: '600' }}>Back</Text>
    </TouchableOpacity>
  );
}

// ─── Root App ─────────────────────────────────────────
export default function PoleSafeApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const tokenRef = useRef(userToken);
  tokenRef.current = userToken;

  const checkAuth = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token') || await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('userRole');
      if (token !== tokenRef.current) {
        setUserToken(token);
        setUserRole(role);
        setIsLoading(false);
      } else if (isLoading) {
        setIsLoading(false);
      }
    } catch (e) {
      console.log('Auth check error:', e);
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    checkAuth();
    const interval = setInterval(checkAuth, 800);
    return () => clearInterval(interval);
  }, [checkAuth]);

  if (isLoading) return <SplashScreen />;

  // ─── Get main screen based on role ───────────────
  const getMainStack = () => {
    if (!userToken) {
      return (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      );
    }
    const role = (userRole || '').toLowerCase();
    let Component, label;
    switch (role) {
      case 'parent':
        Component = ParentTabs;
        label = 'Main';
        break;
      case 'driver':
        Component = DriverTabs;
        label = 'Main';
        break;
      case 'rider':
        Component = RiderTabs;
        label = 'Main';
        break;
      case 'school':
      case 'admin':
        Component = SchoolTabs;
        label = 'Main';
        break;
      default:
        Component = ParentTabs;
        label = 'Main';
    }
    return <Stack.Screen name={label} component={Component} options={{ headerShown: false }} />;
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
          {getMainStack()}
          {SHARED_SCREENS.map(([name, component, options]) => (
            <Stack.Screen
              key={name}
              name={name}
              component={component}
              options={({ navigation }) => ({
                headerShown: true,
                headerStyle: {
                  backgroundColor: options.color || BRAND.primary,
                  elevation: 0,
                  shadowOpacity: 0,
                  borderBottomWidth: 0,
                },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                headerTitle: options.title || name,
                headerBackTitleVisible: false,
                // Explicit back button that actually works
                headerLeft: (props) => (
                  <BackButton navigation={navigation} />
                ),
                // Allow right header option from screen
                ...(options.headerRight ? { headerRight: options.headerRight } : {}),
              })}
            />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
