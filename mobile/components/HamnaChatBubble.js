// Hamna Chat Bubble — Floating button to open Hamna on any screen
// Add this to your app's navigation to give users quick access to Hamna

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HamnaChatScreen from '../screens/HamnaChatScreen';

export default function HamnaChatBubble({ navigation }) {
  const [visible, setVisible] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Subtle pulse animation on the bubble
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <>
      {/* Floating Chat Button */}
      <Animated.View style={[styles.bubbleContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={styles.bubble}
          onPress={() => setVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Badge for unread count (optional) */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AI</Text>
      </View>

      {/* Chat Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <HamnaChatScreen
          navigation={{
            ...navigation,
            goBack: () => setVisible(false),
          }}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubbleContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 9999,
  },
  bubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4361ee',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  badge: {
    position: 'absolute',
    bottom: 72,
    right: 20,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 9999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
