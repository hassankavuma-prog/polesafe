// PoleSafe Voice Guidance Service v1

import * as Speech from 'expo-speech';
import { t, getLanguageTag } from '../constants/translations';

let isEnabled = true;
let currentLanguage = 'en';

function getSpeechOptions(lang) { return { language: getLanguageTag(lang), rate: 0.85, pitch: 1.0, volume: 1.0 }; }
export function speak(key, params = {}) { if (!isEnabled) return; const text = t(key, currentLanguage, params); if (!text || text === key) return; try { Speech.speak(text, getSpeechOptions(currentLanguage)); } catch (err) { console.warn('[VoiceGuidance] Speech error:', err); } }
export function speakRaw(text, lang) { if (!isEnabled || !text) return; try { Speech.speak(text, getSpeechOptions(lang || currentLanguage)); } catch (err) { console.warn('[VoiceGuidance] Raw speech error:', err); } }
export function announceRideRequested(location) { if (location) speak('ride_requested_near', { location }); else speak('ride_requested'); }
export function announceArrivedAtPickup() { speak('arrived_at_pickup'); }
export function announcePinVerified(childName) { if (childName) speak('pin_verified_child', { childName }); else speak('pin_verified'); }
export function announcePinIncorrect() { speak('pin_incorrect'); }
export function announceTripStarted() { speak('trip_started'); }
export function announceTripCompleted() { speak('trip_completed'); }
export function announceSOS() { speak('emergency_sos'); }
export function announcePaymentSuccess() { speak('payment_success'); }
export function announcePaymentFailed() { speak('payment_failed'); }
export function announceNewRide() { speak('driver_accept_ride'); }
export function announceWelcome() { speak('welcome'); }
export function announcePinStoredOffline() { speak('pin_stored_offline'); }
export function announcePreJourneySafetyReminder(kind = 'ordinary') { speak(kind === 'school' ? 'school_child_reminder' : 'ordinary_passenger_reminder'); }
export function setVoiceEnabled(enabled) { isEnabled = enabled; if (enabled) speak('voice_alerts_on'); }
export function isVoiceEnabled() { return isEnabled; }
export function setVoiceLanguage(lang) { currentLanguage = lang; if (isEnabled) speakRaw({ en: 'Language set to English', lg: 'Olulimi lusettiddwa ku Luganda', sw: 'Lugha imewekwa Kiswahili', ny: 'Orurimi nirutebwaho Runyankole' }[lang] || 'Language changed', lang); }
export function getVoiceLanguage() { return currentLanguage; }
export function stopSpeaking() { Speech.stop(); }
export async function isSpeaking() { return await Speech.isSpeakingAsync(); }
export default { speak, speakRaw, announceRideRequested, announceArrivedAtPickup, announcePinVerified, announcePinIncorrect, announceTripStarted, announceTripCompleted, announceSOS, announcePaymentSuccess, announcePaymentFailed, announceNewRide, announceWelcome, announcePinStoredOffline, announcePreJourneySafetyReminder, setVoiceEnabled, isVoiceEnabled, setVoiceLanguage, getVoiceLanguage, stopSpeaking, isSpeaking };
