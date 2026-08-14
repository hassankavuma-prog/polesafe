// PoleSafe Mobile App v3 — Diagnostic core login/auth restore
// Temporary only: Group A restoration for startup isolation.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './screens/LoginScreen';

const Stack = createStackNavigator();

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2F5', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#2E7D32', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 14, color: '#6B7280', textAlign: 'center', maxWidth: 320, lineHeight: 20 },
});

function LoadingScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>PoleSafe</Text>
      <Text style={styles.subtitle}>Loading…</Text>
    </View>
  );
}

export default function PoleSafeApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roleScope, setRoleScope] = useState('main');

  const checkAuth = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token') || await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('userRole');
      const scope = await AsyncStorage.getItem('roleScope');
      setUserToken(token);
      setUserRole(role);
      setRoleScope(scope || 'main');
    } catch (e) {
      console.log('Auth check error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
