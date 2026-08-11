// PoleSafe — Expo Entry Point
// Wraps the existing PoleSafeApp for Expo compatibility

import PoleSafeApp from './PoleSafeApp';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Text style={{ padding: 8, fontSize: 10, color: '#888' }}>
        PoleSafe Loaded
      </Text>
      <PoleSafeApp />
      <StatusBar style="auto" />
    </View>
  );
}
