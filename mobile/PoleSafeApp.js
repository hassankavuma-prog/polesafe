// PoleSafe Mobile App — React Native Entry Point
// From Home to School. And Beyond. 🚸🚗

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Color palette (used across the app - must be defined before SplashScreen)
const COLORS = {
  green: '#2E7D32',
  blue: '#1565C0',
  orange: '#E65100',
  textSecondary: '#666',
};

// Screens
import LoginScreen from './screens/LoginScreen';
import ParentDashboard from './screens/ParentDashboard';
import ParentBooking from './screens/ParentBooking';
import ParentTrack from './screens/ParentTrack';
import ParentSickDay from './screens/ParentSickDay';
import ParentEarlyPickup from './screens/ParentEarlyPickup';
import ParentCredits from './screens/ParentCredits';
import DriverDashboard from './screens/DriverDashboard';
import DriverRoute from './screens/DriverRoute';
import DriverEarnings from './screens/DriverEarnings';
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

// Community screens
import CommunityBoard from './screens/CommunityBoard';
import CommunityBlog from './screens/CommunityBlog';
import FeatureVoting from './screens/FeatureVoting';
import NewPost from './screens/NewPost';
import MultiKidDashboard from './screens/MultiKidDashboard';
import FamilySharing from './screens/FamilySharing';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================================
// Parent Tab Navigator
// ============================================================
function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.green },
        headerTintColor: '#fff',
        tabBarActiveTintColor: COLORS.green,
        tabBarStyle: { paddingBottom: 5, height: 60 },
      })}
    >
      <Tab.Screen
        name="Home"
        component={ParentDashboard}
        options={{ tabBarLabel: '🏫 Kids', title: '🚸 PoleSafe Kids' }}
      />
      <Tab.Screen
        name="Booking"
        component={ParentBooking}
        options={{ tabBarLabel: '📅 School', title: '📅 School Rides' }}
      />
      <Tab.Screen
        name="RideHailing"
        component={RideHailing}
        options={{
          tabBarLabel: '🚗 Ride',
          title: '🚗 PoleSafe Ride',
          headerStyle: { backgroundColor: COLORS.blue },  // Blue — different from school green
        }}
      />
      <Tab.Screen
        name="Credits"
        component={ParentCredits}
        options={{ tabBarLabel: '💰 Credits', title: '💰 My Credits' }}
      />
      {/* Community Tab */}
      <Tab.Screen
        name="CommunityBoard"
        component={CommunityBoard}
        options={{ tabBarLabel: '👥 Safety', title: '🛡️ Safety Board' }}
      />
      <Tab.Screen
        name="Blog"
        component={CommunityBlog}
        options={{ tabBarLabel: '📝 Blog', title: '📝 Community Blog' }}
      />
      <Tab.Screen
        name="Features"
        component={FeatureVoting}
        options={{ tabBarLabel: '💡 Ideas', title: '💡 Feature Voting' }}
      />
    </Tab.Navigator>
  );
}

// ============================================================
// Driver Tab Navigator
// ============================================================
function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.blue },
        headerTintColor: '#fff',
        tabBarActiveTintColor: COLORS.blue,
      }}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverDashboard}
        options={{ tabBarLabel: '📊 Home', title: 'PoleSafe 🚗' }}
      />
      <Tab.Screen
        name="Route"
        component={DriverRoute}
        options={{ tabBarLabel: '🗺️ Route', title: 'Today\'s Route' }}
      />
      <Tab.Screen
        name="Earnings"
        component={DriverEarnings}
        options={{ tabBarLabel: '💰 Earnings', title: 'My Earnings' }}
      />
    </Tab.Navigator>
  );
}

// ============================================================
// School Tab Navigator
// ============================================================
function SchoolTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.orange },
        headerTintColor: '#fff',
        tabBarActiveTintColor: COLORS.orange,
      }}
    >
      <Tab.Screen
        name="SchoolHome"
        component={SchoolDashboard}
        options={{ tabBarLabel: '🏫 Dashboard', title: 'PoleSafe School' }}
      />
      <Tab.Screen
        name="Broadcast"
        component={SchoolBroadcast}
        options={{ tabBarLabel: '📢 Broadcast', title: 'Announcements' }}
      />
      <Tab.Screen
        name="GateCheck"
        component={SchoolGateCheck}
        options={{ tabBarLabel: '🚪 Gate', title: 'Gate Check-In' }}
      />
      <Tab.Screen
        name="Detention"
        component={SchoolDetention}
        options={{ tabBarLabel: '⏰ Late', title: 'Late Pickup' }}
      />
      {/* Community Tab */}
      <Tab.Screen
        name="SchoolCommunity"
        component={CommunityBoard}
        options={{ tabBarLabel: '👥 Safety', title: '🛡️ Safety Board' }}
      />
    </Tab.Navigator>
  );
}

// ============================================================
// Root App
// ============================================================
export default function PoleSafeApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const tokenRef = useRef(userToken);

  // Keep ref in sync with state
  tokenRef.current = userToken;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('userRole');
        if (token !== tokenRef.current) {
          setUserToken(token);
          setUserRole(role);
        }
      } catch (e) {
        console.log('Auth check error:', e);
      }
      setIsLoading(false);
    };

    checkAuth();
    // Poll every 1s to detect auth changes from Dev Mode / real login
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userToken == null ? (
            // Auth stack
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            // Main app stack based on role
            userRole === 'parent' ? (
              <Stack.Screen name="Parent" component={ParentTabs} />
            ) : userRole === 'driver' ? (
              <Stack.Screen name="Driver" component={DriverTabs} />
            ) : (
              <Stack.Screen name="School" component={SchoolTabs} />
            )
          )}
          {/* Shared screens that can be accessed from any role */}
          <Stack.Screen name="TrackRide" component={ParentTrack} options={{ headerShown: true, title: '🚗 Live Tracking', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: '#fff' }} />
          <Stack.Screen name="SickDay" component={ParentSickDay} options={{ headerShown: true, title: '🤒 Report Sick Day', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: '#fff' }} />
          <Stack.Screen name="EarlyPickup" component={ParentEarlyPickup} options={{ headerShown: true, title: '⏰ Early Pickup', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: '#fff' }} />
          {/* Parent-only screens */}
          <Stack.Screen name="AddChild" component={AddChild} options={{ headerShown: true, title: '👶 Register Child', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: '#fff' }} />
          <Stack.Screen name="Settings" component={Settings} options={{ headerShown: true, title: '⚙️ Settings', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: '#fff' }} />
          {/* School-only screens */}
          <Stack.Screen name="PendingChildren" component={PendingChildren} options={{ headerShown: true, title: '⏳ Pending Children', headerStyle: { backgroundColor: COLORS.orange }, headerTintColor: '#fff' }} />
          <Stack.Screen name="AttendanceReport" component={AttendanceReport} options={{ headerShown: true, title: '📊 Attendance', headerStyle: { backgroundColor: COLORS.orange }, headerTintColor: '#fff' }} />
          <Stack.Screen name="TeacherPickupVerify" component={TeacherPickupVerify} options={{ headerShown: true, title: 'Pickup Verification', headerStyle: { backgroundColor: COLORS.orange }, headerTintColor: '#fff' }} />
          {/* Community screens */}
          <Stack.Screen name="PostDetail" component={CommunityBoard} options={{ headerShown: true, title: 'Discussion', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: '#fff' }} />
          <Stack.Screen name="BlogDetail" component={CommunityBlog} options={{ headerShown: true, title: 'Article', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: '#fff' }} />
          <Stack.Screen name="MultiKidDashboard" component={MultiKidDashboard} options={{ headerShown: true, title: '👦 All Kids Rides', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: '#fff' }} />
          <Stack.Screen name="FamilySharing" component={FamilySharing} options={{ headerShown: true, title: '👨‍👩‍👧‍👦 Family Sharing', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: '#fff' }} />
          <Stack.Screen name="NewPost" component={NewPost} options={{ headerShown: true, title: 'New Post', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: '#fff' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Simple splash/loading screen
function SplashScreen() {
  return (
    <View style={splash.container}>
      <Text style={splash.logo}>🚸 PoleSafe</Text>
      <Text style={splash.slogan}>From Home to School. And Beyond.</Text>
      <ActivityIndicator size="large" color="#2E7D32" />
    </View>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: { fontSize: 36, fontWeight: 'bold', color: COLORS.green },
  slogan: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, marginBottom: 20 },
});
