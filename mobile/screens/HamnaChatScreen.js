// Hamna Chat Screen — AI Assistant for PoleSafe
// Floating chat interface that works on both app and web

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = Platform.OS === 'web'
  ? '/api/hamna/chat'
  : 'https://polesafe.ug/api/hamna/chat';

export default function HamnaChatScreen({ navigation, route }) {
  const [messages, setMessages] = useState([
    { id: '0', text: 'Hey! I\'m Hamna 👋 Your PoleSafe assistant. Ask me anything about your kids\' transport!', sender: 'hamna' },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || loading) return;

    const userMsg = { id: Date.now().toString(), text: trimmed, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const token = await getAuthToken(); // From your auth context
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();

      const hamnaMsg = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, Hamna is having trouble right now.',
        sender: 'hamna',
        action: data.action,
      };
      setMessages(prev => [...prev, hamnaMsg]);

      // If Hamna suggests an action (booking, support), handle it
      if (data.action === 'book' && data.data) {
        // Navigate to booking screen with pre-filled data
        setTimeout(() => {
          navigation?.navigate('BookRide', { prefill: data.data });
        }, 1500);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I couldn\'t reach Hamna right now. Please try again.',
        sender: 'hamna',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'user' ? styles.userBubble : styles.hamnaBubble,
    ]}>
      {item.sender === 'hamna' && (
        <Text style={styles.botName}>Hamna</Text>
      )}
      <Text style={[
        styles.messageText,
        item.sender === 'user' ? styles.userText : styles.hamnaText,
      ]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>H</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Hamna</Text>
            <Text style={styles.headerStatus}>Online • AI Assistant</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListFooterComponent={loading ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#4361ee" />
              <Text style={styles.typingText}>Hamna is typing...</Text>
            </View>
          ) : null}
        />
      </Animated.View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickChip} onPress={() => setInputText('Where is my child?')}>
          <Text style={styles.quickChipText}>📍 Where?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickChip} onPress={() => setInputText('Book a ride')}>
          <Text style={styles.quickChipText}>🚐 Book</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickChip} onPress={() => setInputText('My child is sick')}>
          <Text style={styles.quickChipText}>🤒 Sick</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickChip} onPress={() => setInputText('I need help')}>
          <Text style={styles.quickChipText}>🆘 Help</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask Hamna anything..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons
              name={loading ? 'hourglass-outline' : 'send'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4361ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4caf50',
  },
  messageContainer: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: '#4361ee',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  hamnaBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e8e8f0',
  },
  botName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4361ee',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  hamnaText: {
    color: '#333',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e0e0eb',
  },
  quickChipText: {
    fontSize: 13,
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4361ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#b0b0c0',
  },
});

// Placeholder for your auth token getter
async function getAuthToken() {
  // Get token from your auth context/storage
  try {
    const { getToken } = require('../services/auth');
    return await getToken();
  } catch {
    return '';
  }
}
