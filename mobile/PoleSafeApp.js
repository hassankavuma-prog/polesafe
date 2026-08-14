// PoleSafe Mobile App v3 — Diagnostic startup isolation build
// Temporary only: minimal startup surface to identify launch-crash source.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './screens/LoginScreen';

const Stack = createStackNavigator();

function DiagnosticStubScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>PoleSafe Diagnostic</Text>
      <Text style={styles.subtitle}>Startup isolation build</Text>
      <Text style={styles.body}>If this screen opens, the launch crash is in a deferred import tree.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F2F5', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#2E7D32', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 14, color: '#6B7280', textAlign: 'center', maxWidth: 320, lineHeight: 20 },
});

export default function PoleSafeApp() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
          <Stack.Screen name="Diagnostic" component={DiagnosticStubScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
