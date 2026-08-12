// PoleSafe Translation Dictionary v1
// Luganda, English (Uganda), Swahili, Runyankole/Rukiga
// Key safety phrases for hands-free voice guidance
// From Home to School. And Beyond. 🚸

const LANGUAGES = {
  en: { label: '🇬🇧 English', tag: 'en-UG' },
  lg: { label: '🇺🇬 Luganda', tag: 'lg-UG' },
  sw: { label: '🇹🇿 Swahili', tag: 'sw-TZ' },
  ny: { label: '🇺🇬 Runyankole', tag: 'ny-UG' },
};

// ─── Translation Map ─────────────────────────────────
const TRANSLATIONS = {
  // Ride Request
  'ride_requested': {
    en: 'New family ride request',
    lg: 'Mufunye okusaba kw\'entambula',
    sw: 'Ombi mpya ya usafiri',
    ny: 'Nimukwenda okugyenda',
  },
  'ride_requested_near': {
    en: 'New ride request near {location}',
    lg: 'Okusaba kw\'entambula okupya okuli okumpi ne {location}',
    sw: 'Ombi mpya ya usafiri karibu na {location}',
    ny: 'Okukwenda okugyenda okuli hafi ya {location}',
  },

  // Pickup & PIN
  'arrived_at_pickup': {
    en: 'You have arrived at the pickup location. Please enter the student\'s 4-digit PIN.',
    lg: 'Otuuse awo okwetikka omwana. Ssinga PIN y\'omwana ey\'eddiga 4.',
    sw: 'Umefika mahali pa kuchukua mwanafunzi. Tafadhali weka PIN yenye tarakimu 4.',
    ny: 'Nimuhika aha kugyenda omwana. Nimusinge PIN y\'omwana eshoma 4.',
  },
  'enter_child_pin': {
    en: 'Enter child PIN',
    lg: 'Ssinga PIN y\'omwana',
    sw: 'Weka PIN ya mtoto',
    ny: 'Singa PIN y\'omwana',
  },

  // PIN Verification
  'pin_verified': {
    en: 'PIN correct. Safe to proceed.',
    lg: 'PIN ekakasiddwa. Tekuli kabi.',
    sw: 'PIN ni sahihi. Salama kuendelea.',
    ny: 'PIN nirukukira. Kihire kugyenda.',
  },
  'pin_verified_child': {
    en: 'PIN verified. {childName} is safely on board.',
    lg: 'PIN ekakasiddwa. {childName} ali mu mmotoka bulungi.',
    sw: 'PIN imethibitishwa. {childName} yuko salama ndani ya gari.',
    ny: 'PIN niremeswa. {childName} ari omunda omumotoka.',
  },
  'pin_incorrect': {
    en: 'Incorrect PIN. Please try again.',
    lg: 'PIN tekituufu. Gezaako omulundi omulala.',
    sw: 'PIN si sahihi. Tafadhali jaribu tena.',
    ny: 'PIN ti ya kuhikire. Nimusinge kandi.',
  },

  // Trip Status
  'trip_started': {
    en: 'Trip started. Driving safely.',
    lg: 'Entambula etandise. Okugenda bulungi.',
    sw: 'Safari imeanza. Kuendesha salama.',
    ny: 'Okugyenda nikwatandika. Kutwara kihire.',
  },
  'trip_completed': {
    en: 'Trip completed. Thank you.',
    lg: 'Entambula ewedde. Webale.',
    sw: 'Safari imekamilika. Asante.',
    ny: 'Okugyenda nikwahweraho. Webare.',
  },

  // Emergency
  'emergency_sos': {
    en: 'Emergency! Help!',
    lg: 'Yamba! Embeera y\'obwegagadde!',
    sw: 'Dharura! Msaada!',
    ny: 'Okutandara! Mberabire!',
  },
  'sos_alert_sent': {
    en: 'SOS alert sent to emergency contacts.',
    lg: 'Obubaka bw\'okwewoolera buweebwa abo be\'yeesiga.',
    sw: 'Tahadharisha imetumwa kwa watu wa dharura.',
    ny: 'Okutandara nikutumwa omu barakurinda.',
  },

  // Payment
  'payment_success': {
    en: 'Payment successful. Transferred via MoMo.',
    lg: 'Okusasula kukolebwa. Kutuumiddwa nga MoMo.',
    sw: 'Malipo yamefanikiwa. Imetumwa kwa MoMo.',
    ny: 'Okushashura nikwahikira. Nikuherereza omu MoMo.',
  },
  'payment_failed': {
    en: 'Payment failed. Please try again.',
    lg: 'Okusasula kuweddeko. Gezaako omulundi omulala.',
    sw: 'Malipo yameshindwa. Tafadhali jaribu tena.',
    ny: 'Okushashura nikugwa. Nimusinge kandi.',
  },

  // Driver Guidance
  'driver_accept_ride': {
    en: 'New ride request. Swipe to accept.',
    lg: 'Okusaba kw\'entambula okupya. Swipe okukkiriza.',
    sw: 'Ombi mpya. Telezesha kukubali.',
    ny: 'Okukwenda okugyenda okuhyaka. Swipe kugyenda.',
  },
  'voice_alerts_on': {
    en: 'Voice safety alerts are ON',
    lg: 'Obubaka bw\'amazina bukola',
    sw: 'Tahadharisha za sauti zimewashwa',
    ny: 'Okurinda kw\'amazina nikukora',
  },
  'voice_alerts_off': {
    en: 'Voice safety alerts are OFF',
    lg: 'Obubaka bw\'amazina bukoseddwa',
    sw: 'Tahadharisha za sauti zimezimwa',
    ny: 'Okurinda kw\'amazina nikukozibwe',
  },

  // PIN Storage (Offline)
  'pin_stored_offline': {
    en: 'Child PIN stored for offline verification.',
    lg: 'PIN y\'omwana eteebeddwa okukakasa nga tegali ntetwoli.',
    sw: 'PIN ya mtoto imehifadhiwa kwa uthibitishaji wa mtandaoni.',
    ny: 'PIN y\'omwana nirebwa kurema okugumya.',
  },

  // Roster / School
  'student_roster': {
    en: 'Student Roster',
    lg: 'Olukalala lw\'abaana',
    sw: 'Orodha ya wanafunzi',
    ny: 'Orutooro rw\'abana',
  },

  // General
  'welcome': {
    en: 'Welcome to PoleSafe. Your child\'s safety is our priority.',
    lg: 'Onyamwanyi mu PoleSafe. Obulambike bw\'omwanawo bwe tukola enkola.',
    sw: 'Karibu kwa PoleSafe. Usalama wa mtoto wako ni kipaumbele chetu.',
    ny: 'Muhiriirwe omu PoleSafe. Obusingye bw\'omwana waawe nibwo tukora.',
  },
  'app_name': {
    en: 'PoleSafe',
    lg: 'PoleSafe',
    sw: 'PoleSafe',
    ny: 'PoleSafe',
  },
};

// ─── Helper ──────────────────────────────────────────
export function t(key, lang = 'en', params = {}) {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;

  let text = entry[lang] || entry.en;
  if (!text) return entry.en || key;

  // Replace params like {name} or {location}
  Object.keys(params).forEach(k => {
    text = text.replace(`{${k}}`, params[k]);
  });

  return text;
}

export function getAvailableLanguages() {
  return Object.entries(LANGUAGES).map(([code, info]) => ({
    code,
    ...info,
  }));
}

export function getLanguageLabel(code) {
  return LANGUAGES[code]?.label || '🇬🇧 English';
}

export function getLanguageTag(code) {
  return LANGUAGES[code]?.tag || 'en-UG';
}

export function getTranslationKeys() {
  return Object.keys(TRANSLATIONS);
}

export { LANGUAGES, TRANSLATIONS };
export default { t, getAvailableLanguages, getLanguageLabel, getLanguageTag, LANGUAGES };
