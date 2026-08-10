// PoleSafe Theme v2.0 — Dual Theme (Light + Dark)
// Auto-switches based on time of day
// Light: Modern green-branded school transport
// Dark: Pyrax-inspired ride-hailing mode

export const COLORS = {
  // ── Brand (shared across both themes) ──
  green: '#2E7D32',
  greenLight: '#4CAF50',
  greenBg: '#E8F5E9',
  blue: '#1565C0',
  blueLight: '#42A5F5',
  blueBg: '#E3F2FD',
  orange: '#E65100',
  orangeLight: '#FFA726',
  orangeBg: '#FFF3E0',
  red: '#C62828',
  redLight: '#EF5350',
  redBg: '#FFEBEE',
  purple: '#6A1B9A',
  purpleBg: '#F3E5F5',
  teal: '#0277BD',
  tealBg: '#E0F7FA',

  // ── Status (preserved, unchanged) ──
  statusPresent: '#2E7D32',
  statusAbsent: '#C62828',
  statusLate: '#E65100',
  statusSick: '#6A1B9A',
  statusExcused: '#0277BD',

  // ── Theme defaults (light theme values) ──
  canvas: '#F5F5F5',
  canvasSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFA',
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  glass: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(224, 224, 224, 0.6)',
  textPrimary: '#1A1A2E',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowStrong: 'rgba(0, 0, 0, 0.12)',
};

export const LIGHT = {
  canvas: '#F5F5F5',
  canvasSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFA',
  border: '#E0E0E0',
  borderLight: '#F0F0F0',

  // Glass (light mode — subtle frosted white)
  glass: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(224, 224, 224, 0.6)',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#FFFFFF',

  // Accent glow (subtle in light mode)
  accentGlow: 'rgba(46, 125, 50, 0.15)',
  accentGlowStrong: 'rgba(46, 125, 50, 0.25)',

  // Shadow
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowStrong: 'rgba(0, 0, 0, 0.12)',
};

export const DARK = {
  canvas: '#0B0F17',
  canvasSecondary: '#121824',
  surface: 'rgba(30, 41, 59, 0.85)',
  surfaceElevated: 'rgba(30, 41, 59, 0.95)',
  border: 'rgba(51, 65, 85, 0.5)',
  borderLight: 'rgba(51, 65, 85, 0.3)',

  // Glass (dark mode — frosted dark glassmorphism)
  glass: 'rgba(30, 41, 59, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.06)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B0F17',

  // Accent glow (cyberpunk in dark mode)
  accentGlow: 'rgba(0, 240, 255, 0.15)',
  accentGlowStrong: 'rgba(0, 240, 255, 0.3)',

  // Shadow
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowStrong: 'rgba(0, 0, 0, 0.6)',
};

// ── Select theme based on hour (6AM-6PM = light, else dark) ──
export function getTheme(hour = new Date().getHours()) {
  return (hour >= 6 && hour < 18) ? LIGHT : DARK;
}

// ── Typography (shared) ──
export const TYPOGRAPHY = {
  hero: { fontSize: 32, fontWeight: '700', lineHeight: 35.2 },
  h1: { fontSize: 24, fontWeight: '600', lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: '600', lineHeight: 25 },
  h3: { fontSize: 18, fontWeight: '500', lineHeight: 22.5 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 19.6 },
  captionBold: { fontSize: 14, fontWeight: '600', lineHeight: 19.6 },
  micro: { fontSize: 12, fontWeight: '400', lineHeight: 16.8 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 16,
  pill: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
  },
};
