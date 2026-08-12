// PoleSafe MoMo Prompt Simulator v1
// Mock USSD overlay for __DEV__ mode
// Simulates the real MTN/Airtel Money phone PIN prompt
// From Home to School. And Beyond. 🚸

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Animated,
  ActivityIndicator, Platform,
} from 'react-native';

import { requestMtnPayment, requestAirtelPayment } from '../services/mobileMoneyService';

// Only render in __DEV__ mode
if (!__DEV__) return () => null;

// ─── Number Keypad ───────────────────────────────────
function NumberKey({ label, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[keyStyles.key, disabled && keyStyles.keyDisabled]}
      onPress={() => !disabled && onPress(label)}
      activeOpacity={0.6}
    >
      <Text style={[keyStyles.keyText, disabled && keyStyles.keyTextDisabled]}>{label}</Text>
    </TouchableOpacity>
  );
}

const keyStyles = StyleSheet.create({
  key: {
    width: 72,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  keyDisabled: { opacity: 0.4 },
  keyText: { fontSize: 22, fontWeight: '700', color: '#111827' },
  keyTextDisabled: { color: '#9CA3AF' },
});

// ─── MoMo Prompt Simulator ───────────────────────────
export default function MoMoPromptModal({ visible, onClose, paymentData }) {
  const [pin, setPin] = useState([]);
  const [state, setState] = useState('input'); // input | processing | success | failed
  const [message, setMessage] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPin([]);
      setState('input');
      setMessage('');
    }
  }, [visible]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = (key) => {
    if (state !== 'input') return;
    if (key === '⌫') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(prev => [...prev, key]);
    }
  };

  const handleSubmit = async () => {
    if (pin.length !== 4 || state !== 'input') return;

    setState('processing');
    setMessage('Processing payment...');

    try {
      const provider = paymentData?.provider || 'mtn';
      const phone = paymentData?.phone || '+256 77 123 4567';
      const amountUGX = paymentData?.amountUGX || 15000;
      const reference = paymentData?.reference || `PS-${Date.now()}`;

      let result;
      if (provider === 'airtel') {
        result = await requestAirtelPayment(phone, amountUGX, reference);
      } else {
        result = await requestMtnPayment(phone, amountUGX, reference);
      }

      if (result.success) {
        setState('success');
        setMessage(result.message || 'Payment successful! ✅');
      } else {
        setState('failed');
        setMessage(result.error || 'Transaction declined');
        shake();
      }
    } catch (err) {
      setState('failed');
      setMessage('Network error. Please try again.');
      shake();
    }
  };

  const handleCancel = () => {
    setState('failed');
    setMessage('Payment cancelled');
    onClose && onClose({ success: false, cancelled: true });
  };

  const handleDone = () => {
    onClose && onClose({
      success: state === 'success',
      state,
      pin: pin.join(''),
    });
  };

  const providerName = paymentData?.provider === 'airtel' ? 'Airtel Money' : 'MTN MoMo';
  const providerColor = paymentData?.provider === 'airtel' ? '#E53935' : '#FFB300';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            state === 'input' && { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {/* Provider Header */}
          <View style={[styles.providerBar, { backgroundColor: providerColor }]}>
            <Text style={styles.providerIcon}>
              {paymentData?.provider === 'airtel' ? '🔴' : '🟡'}
            </Text>
            <Text style={styles.providerName}>{providerName}</Text>
          </View>

          {/* Amount */}
          <Text style={styles.amountLabel}>Authorize Payment</Text>
          <Text style={styles.amountValue}>
            UGX {(paymentData?.amountUGX || 15000).toLocaleString()}
          </Text>
          <Text style={styles.merchantName}>to PoleSafe Uganda</Text>

          {/* Phone */}
          <Text style={styles.phoneLabel}>From</Text>
          <Text style={styles.phoneValue}>
            {paymentData?.phone || '+256 77 123 4567'}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* State: Processing */}
          {state === 'processing' && (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={providerColor} />
              <Text style={styles.processingText}>Processing...{'\n'}Check your phone</Text>
            </View>
          )}

          {/* State: Success */}
          {state === 'success' && (
            <View style={styles.stateContainer}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successText}>{message}</Text>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: '#059669' }]} onPress={handleDone}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* State: Failed */}
          {state === 'failed' && (
            <View style={styles.stateContainer}>
              <Text style={styles.failedIcon}>❌</Text>
              <Text style={styles.failedText}>{message}</Text>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: '#DC2626' }]} onPress={handleDone}>
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* State: Input (PIN Entry) */}
          {state === 'input' && (
            <>
              {/* PIN Dots */}
              <Text style={styles.pinLabel}>Enter Mobile Money PIN</Text>
              <View style={styles.pinDots}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
                ))}
              </View>

              {/* Keypad */}
              <View style={styles.keypad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) => (
                  key === '' ? <View key={i} style={{ width: 72 }} /> :
                  <NumberKey key={key} label={key} onPress={handleKeyPress} disabled={state !== 'input'} />
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, pin.length !== 4 && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={pin.length !== 4}
                >
                  <Text style={[styles.submitBtnText, pin.length !== 4 && styles.submitBtnTextDisabled]}>
                    Pay UGX {(paymentData?.amountUGX || 15000).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Function to trigger MoMo prompt from anywhere ──
let _setPromptVisible = null;
let _setPaymentData = null;

export function triggerMoMoPrompt(paymentInfo) {
  if (_setPaymentData) _setPaymentData(paymentInfo);
  if (_setPromptVisible) _setPromptVisible(true);
}

// Hook for parent component to register the trigger
export function useMoMoPrompt() {
  const [visible, setVisible] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    _setPromptVisible = setVisible;
    _setPaymentData = setPaymentData;
    return () => {
      _setPromptVisible = null;
      _setPaymentData = null;
    };
  }, []);

  const modal = (
    <MoMoPromptModal
      visible={visible}
      onClose={(result) => setVisible(false)}
      paymentData={paymentData}
    />
  );

  return { visible, setVisible: setVisibleProp => { setVisible(setVisibleProp); }, paymentData, setPaymentData, modal };
}

export default MoMoPromptModal;
