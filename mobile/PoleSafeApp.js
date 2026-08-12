// PoleSafe Mobile App v3 — Redesigned
// Better than Uber + Lyft combined.
// Safety-first, African-market optimized, super-app experience.
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ActivityIndicator, StyleSheet, Animated, Platform,
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
const headerStyles = (bg, tint = '#fff') => ({
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
          ...headerStyles(BRAND.primary),
          title: 'PoleSafe',
          headerRight: () => (
            <View style={{ flexDirection: 'row', marginRight: 12 }}>
              <Text style={{ fontSize: 20 }}>🚸</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Booking"
        component={ParentBooking}
        options={{
          tabBarLabel: 'School',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
          ...headerStyles(BRAND.primary),
          title: 'School Rides',
        }}
      />
      <Tab.Screen
        name="RideHailing"
        component={RideHailing}
        options={{
          tabBarLabel: 'Ride',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚗" focused={focused} />,
          ...headerStyles(BRAND.secondary),
          title: 'PoleSafe Ride',
          tabBarBadgeStyle: { backgroundColor: BRAND.secondary },
        }}
      />
      <Tab.Screen
        name="Credits"
        component={ParentCredits}
        options={{
          tabBarLabel: 'Credits',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />,
          ...headerStyles(BRAND.primary),
          title: 'My Credits',
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityBoard}
        options={{
          tabBarLabel: 'Safety',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" focused={focused} />,
          ...headerStyles(BRAND.primary),
          title: 'Safety Board',
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
          ...headerStyles(BRAND.secondary),
          title: 'PoleSafe Driver',
        }}
      />
      <Tab.Screen
        name="Route"
        component={DriverRoute}
        options={{
          tabBarLabel: 'Route',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
          ...headerStyles(BRAND.secondary),
          title: "Today's Route",
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={DriverEarnings}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />,
          ...headerStyles(BRAND.secondary),
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
          ...headerStyles(BRAND.teal),
          title: 'School Dashboard',
        }}
      />
      <Tab.Screen
        name="GateCheck"
        component={SchoolGateCheck}
        options={{
          tabBarLabel: 'Gate',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚪" focused={focused} />,
          ...headerStyles(BRAND.teal),
          title: 'Gate Check-In',
        }}
      />
      <Tab.Screen
        name="Broadcast"
        component={SchoolBroadcast}
        options={{
          tabBarLabel: 'Notify',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📢" focused={focused} />,
          ...headerStyles(BRAND.teal),
          title: 'Announcements',
        }}
      />
      <Tab.Screen
        name="SchoolCommunity"
        component={CommunityBoard}
        options={{
          tabBarLabel: 'Safety',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" focused={focused} />,
          ...headerStyles(BRAND.teal),
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 40 },
  logo: { fontSize: 36, fontWeight: '800', color: BRAND.primary, letterSpacing: -0.5 },
  slogan: { fontSize: 14, color: '#6B7280', marginTop: 6, marginBottom: 24 },
  loaderRow: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.primary,
    opacity: 0.3,
  },
  dotDelay1: { opacity: 0.6 },
  dotDelay2: { opacity: 0.9 },
});

// ─── Stack Screen Helper ──────────────────────────────
function StackScreen(name, component, options = {}) {
  return (
    <Stack.Screen
      key={name}
      name={name}
      component={component}
      options={{
        headerShown: true,
        headerStyle: { backgroundColor: options.color || BRAND.primary, elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        title: options.title || name,
        ...options,
      }}
    />
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
      }
    } catch (e) {
      console.log('Auth check error:', e);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, [checkAuth]);

  if (isLoading) return <SplashScreen />;

  const sharedScreens = [
    // Tracking & Safety
    ['TrackRide', ParentTrack, { title: 'Live Tracking', color: BRAND.primary }],
    ['SickDay', ParentSickDay, { title: 'Report Sick Day', color: BRAND.primary }],
    ['EarlyPickup', ParentEarlyPickup, { title: 'Early Pickup', color: BRAND.primary }],
    
    // Parent screens
    ['AddChild', AddChild, { title: 'Register Child', color: BRAND.primary }],
    ['Payment', ParentPayment, { title: 'Payment', color: BRAND.primary }],
    ['Profile', ParentProfile, { title: 'Profile', color: BRAND.primary }],
    ['Settings', Settings, { title: 'Settings', color: BRAND.primary }],
    
    // School screens
    ['PendingChildren', PendingChildren, { title: 'Pending Children', color: BRAND.teal }],
    ['AttendanceReport', AttendanceReport, { title: 'Attendance Report', color: BRAND.teal }],
    ['TeacherPickupVerify', TeacherPickupVerify, { title: 'Pickup Verification', color: BRAND.teal }],
    ['SchoolDetention', SchoolDetention, { title: 'Late Pickup', color: BRAND.teal }],
    
    // Community
    ['CommunityBoard', CommunityBoard, { title: 'Safety Board', color: BRAND.primary }],
    ['CommunityBlog', CommunityBlog, { title: 'Community Blog', color: BRAND.primary }],
    ['FeatureVoting', FeatureVoting, { title: 'Feature Voting', color: BRAND.primary }],
    ['NewPost', NewPost, { title: 'New Post', color: BRAND.primary }],
    
    // Features
    ['MultiKidDashboard', MultiKidDashboard, { title: 'All Kids', color: BRAND.primary }],
    ['FamilySharing', FamilySharing, { title: 'Family Sharing', color: BRAND.primary }],
    
    // Driver
    ['DriverPickupVerify', DriverPickupVerify, { title: 'Verify Pickup', color: BRAND.secondary }],
    
    // Hamna AI
    ['HamnaChat', HamnaChatScreen, { title: 'Hamna AI', color: BRAND.primary }],
  ];

  const getMainStack = () => {
    if (!userToken) return (
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    );
    switch (userRole) {
      case 'parent': return <Stack.Screen name="Main" component={ParentTabs} options={{ headerShown: false }} />;
      case 'driver': return <Stack.Screen name="Main" component={DriverTabs} options={{ headerShown: false }} />;
      case 'rider': return <Stack.Screen name="Main" component={ParentTabs} options={{ headerShown: false }} />;
      default: return <Stack.Screen name="Main" component={SchoolTabs} options={{ headerShown: false }} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
          {getMainStack()}
          {sharedScreens.map(([name, component, options]) => (
            <Stack.Screen key={name} name={name} component={component} options={{
              headerShown: true,
              ...headerStyles(options.color || BRAND.primary),
              title: options.title || name,
              ...options,
            }} />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
