// PoleSafe Mobile — Seat Belt Safety Service
// Handles voice reminders and checkpoint verification for seat belts
// Two modes: Ride (10s voice nudge) and School (checkpoint gate)

import * as Speech from 'expo-speech';

let TtsModule = null;
try {
  // expo-speech is available via managed workflow
  TtsModule = true;
} catch {
  // Voice fallback silently
}

class SeatBeltService {
  constructor() {
    this.initialized = false;
    this.timer = null;
  }

  /**
   * Initialize TTS engine
   */
  async init() {
    if (this.initialized) return;
    if (!TtsModule) {
      console.warn('[SeatBelt] expo-speech not available');
      return;
    }
    try {
      this.initialized = true;
    } catch (err) {
      console.warn('[SeatBelt] TTS init failed:', err.message);
    }
  }

  /**
   * Speak a voice line
   */
  async speak(text) {
    if (!this.initialized) await this.init();
    if (!TtsModule || !this.initialized) {
      console.log(`[SeatBelt] Voice: "${text}"`);
      return;
    }
    try {
      await Speech.speak(text, { rate: 0.45, pitch: 1.0, language: 'en-US' });
    } catch (err) {
      console.warn('[SeatBelt] Speak failed:', err.message);
    }
  }

  /**
   * Stop any ongoing speech
   */
  async stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (TtsModule && this.initialized) {
      try { await Speech.stop(); } catch {}
    }
  }

  /**
   * Ride Mode: Play seat belt reminder 10 seconds after driving starts
   * @param {function} onPlayed - Called when voice is played
   * @returns {function} cancel function
   */
  scheduleRideReminder(onPlayed) {
    this.timer = setTimeout(async () => {
      await this.speak('Please fasten your seat belt for safety');
      if (onPlayed) onPlayed();
      this.timer = null;
    }, 10000);
    return () => this.stop();
  }

  /**
   * School Mode: Play the buckle-up prompt immediately (checkpoint)
   */
  async playSchoolCheckpoint() {
    await this.speak('Please help the children buckle up before we go');
  }

  /**
   * Clean up
   */
  destroy() {
    this.stop();
    if (TtsModule && this.initialized) {
      try { TtsModule.removeAllListeners('finish'); } catch {}
    }
  }
}

// Singleton
const seatBeltService = new SeatBeltService();
export default seatBeltService;
