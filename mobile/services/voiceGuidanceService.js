// PoleSafe Voice Guidance Service v1
// Hands-free audio safety prompts using expo-speech
// Speaks ride events aloud in selected language
// From Home to School. And Beyond. 🚸

import * as Speech from 'expo-speech';
import { t, getLanguageTag } from '../constants/translations';

// ─── Voice State ─────────────────────────────────────
let isEnabled = true;
let currentLanguage = 'en';

// ─── TTS Options Cache ───────────────────────────────
function getSpeechOptions(lang) {
  return {
    language: getLanguageTag(lang),
    rate: 0.85,          // Slightly slower for clarity
    pitch: 1.0,
    volume: 1.0,
  };
}

// ─── Speak text in current language ──────────────────
export function speak(key, params = {}) {
  if (!isEnabled) return;
  const text = t(key, currentLanguage, params);
  if (!text || text === key) return;

  try {
    Speech.speak(text, getSpeechOptions(currentLanguage));
  } catch (err) {
    console.warn('[VoiceGuidance] Speech error:', err);
  }
}

// ─── Speak raw text (non-translated) ─────────────────
export function speakRaw(text, lang) {
  if (!isEnabled || !text) return;
  try {
    Speech.speak(text, getSpeechOptions(lang || currentLanguage));
  } catch (err) {
    console.warn('[VoiceGuidance] Raw speech error:', err);
  }
}

// ─── Ride Event Prompts ──────────────────────────────

/** New ride request arrived */
export function announceRideRequested(location) {
  if (location) {
    speak('ride_requested_near', { location });
  } else {
    speak('ride_requested');
  }
}

/** Driver arrived at pickup — prompt PIN entry */
export function announceArrivedAtPickup() {
  speak('arrived_at_pickup');
}

/** PIN verified successfully */
export function announcePinVerified(childName) {
  if (childName) {
    speak('pin_verified_child', { childName });
  } else {
    speak('pin_verified');
  }
}

/** PIN incorrect — try again */
export function announcePinIncorrect() {
  speak('pin_incorrect');
}

/** Trip started */
export function announceTripStarted() {
  speak('trip_started');
}

/** Trip completed */
export function announceTripCompleted() {
  speak('trip_completed');
}

/** Emergency SOS triggered */
export function announceSOS() {
  speak('emergency_sos');
}

/** Payment successful */
export function announcePaymentSuccess() {
  speak('payment_success');
}

/** Payment failed */
export function announcePaymentFailed() {
  speak('payment_failed');
}

/** Driver should accept ride */
export function announceNewRide() {
  speak('driver_accept_ride');
}

/** Welcome message */
export function announceWelcome() {
  speak('welcome');
}

/** PIN stored offline */
export function announcePinStoredOffline() {
  speak('pin_stored_offline');
}

// ─── Voice Toggle ────────────────────────────────────
export function setVoiceEnabled(enabled) {
  isEnabled = enabled;
  if (enabled) {
    speak('voice_alerts_on');
  }
}

export function isVoiceEnabled() {
  return isEnabled;
}

// ─── Language ────────────────────────────────────────
export function setVoiceLanguage(lang) {
  currentLanguage = lang;
  if (isEnabled) {
    // Briefly announce language change
    const label = {
      en: 'Language set to English',
      lg: 'Olulimi lusettiddwa ku Luganda',
      sw: 'Lugha imewekwa Kiswahili',
      ny: 'Orurimi nirutebwaho Runyankole',
    }[lang] || 'Language changed';

    speakRaw(label, lang);
  }
}

export function getVoiceLanguage() {
  return currentLanguage;
}

// ─── Stop all speech ─────────────────────────────────
export function stopSpeaking() {
  Speech.stop();
}

// ─── Check if speaking ───────────────────────────────
export async function isSpeaking() {
  return await Speech.isSpeakingAsync();
}

export default {
  speak,
  speakRaw,
  announceRideRequested,
  announceArrivedAtPickup,
  announcePinVerified,
  announcePinIncorrect,
  announceTripStarted,
  announceTripCompleted,
  announceSOS,
  announcePaymentSuccess,
  announcePaymentFailed,
  announceNewRide,
  announceWelcome,
  announcePinStoredOffline,
  setVoiceEnabled,
  isVoiceEnabled,
  setVoiceLanguage,
  getVoiceLanguage,
  stopSpeaking,
  isSpeaking,
};
