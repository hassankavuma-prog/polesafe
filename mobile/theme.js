// PoleSafe Theme v3 — Ultra Premium Design System
// Safety-first, African-market optimized, modern glassmorphism
// From Home to School. And Beyond. 🚸

// ── Brand Colors ──
export const BRAND = {
  primary: '#2E7D32',      // Safety Green — trust, growth
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  primaryGlow: 'rgba(46, 125, 50, 0.2)',
  
  secondary: '#1565C0',    // Trust Blue — driver, tracking
  secondaryLight: '#42A5F5',
  secondaryDark: '#0D47A1',
  secondaryGlow: 'rgba(21, 101, 192, 0.2)',

  accent: '#FF8F00',       // Warm Amber — alerts, urgency
  accentLight: '#FFB300',
  accentDark: '#E65100',
  accentGlow: 'rgba(255, 143, 0, 0.2)',

  danger: '#D32F2F',       // Red — SOS, critical
  dangerLight: '#EF5350',
  dangerGlow: 'rgba(211, 47, 47, 0.2)',

  purple: '#7B1FA2',       // Rider mode
  purpleLight: '#AB47BC',
  teal: '#00897B',         // School admin
  tealLight: '#26A69A',
  
  gold: '#FFB300',         // Premium / credits
  goldLight: '#FFD54F',
};

// ── Status Semantic Colors ──
export const STATUS = {
  safe: '#2E7D32',
  warning: '#FF8F00',
  danger: '#D32F2F',
  info: '#1565C0',
  neutral: '#757575',
  
  present: '#2E7D32',
  absent: '#D32F2F',
  late: '#FF8F00',
  sick: '#7B1FA2',
  excused: '#00897B',
  inTransit: '#1565C0',
  arrived: '#2E7D32',
};

// ── Theme Definitions ──
export const LIGHT = {
  id: 'light',
  name: 'Safe Light',
  
  canvas: '#F0F2F5',
  canvasSecondary: '#FFFFFF',
  
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFA',
  surfaceGhost: 'rgba(255,255,255,0.7)',
  
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  divider: '#EEEEEE',
  
  glass: 'rgba(255, 255, 255, 0.82)',
  glassBorder: 'rgba(224, 224, 224, 0.5)',
  glassBlur: 12,
  
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#1565C0',
    brand: '#2E7D32',
  },
  
  glow: {
    green: 'rgba(46, 125, 50, 0.12)',
    blue: 'rgba(21, 101, 192, 0.12)',
    amber: 'rgba(255, 143, 0, 0.12)',
    red: 'rgba(211, 47, 47, 0.12)',
    purple: 'rgba(123, 31, 162, 0.12)',
  },
  
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 10 },
    xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16, shadowRadius: 40, elevation: 15 },
  },
  
  statusBadge: {
    safe: { bg: '#E8F5E9', text: '#2E7D32', icon: '🟢' },
    inTransit: { bg: '#E3F2FD', text: '#1565C0', icon: '🔵' },
    warning: { bg: '#FFF8E1', text: '#FF8F00', icon: '🟡' },
    danger: { bg: '#FFEBEE', text: '#D32F2F', icon: '🔴' },
    arrived: { bg: '#E8F5E9', text: '#2E7D32', icon: '✅' },
    late: { bg: '#FFF3E0', text: '#E65100', icon: '⏰' },
  },
};

export const DARK = {
  id: 'dark',
  name: 'Night Safe',
  
  canvas: '#0A0F1E',
  canvasSecondary: '#111827',
  
  surface: 'rgba(30, 41, 59, 0.85)',
  surfaceElevated: 'rgba(30, 41, 59, 0.95)',
  surfaceGhost: 'rgba(30, 41, 59, 0.5)',
  
  border: 'rgba(51, 65, 85, 0.5)',
  borderLight: 'rgba(51, 65, 85, 0.25)',
  divider: 'rgba(51, 65, 85, 0.3)',
  
  glass: 'rgba(15, 23, 42, 0.78)',
  glassBorder: 'rgba(255, 255, 255, 0.06)',
  glassBlur: 16,
  
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    muted: '#64748B',
    inverse: '#0A0F1E',
    link: '#60A5FA',
    brand: '#4CAF50',
  },
  
  glow: {
    green: 'rgba(76, 175, 80, 0.15)',
    blue: 'rgba(66, 165, 245, 0.15)',
    amber: 'rgba(255, 179, 0, 0.15)',
    red: 'rgba(239, 68, 68, 0.15)',
    purple: 'rgba(171, 71, 188, 0.15)',
  },
  
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 7 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 28, elevation: 12 },
    xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.6, shadowRadius: 44, elevation: 18 },
  },
  
  statusBadge: {
    safe: { bg: 'rgba(46, 125, 50, 0.2)', text: '#66BB6A', icon: '🟢' },
    inTransit: { bg: 'rgba(21, 101, 192, 0.2)', text: '#42A5F5', icon: '🔵' },
    warning: { bg: 'rgba(255, 143, 0, 0.2)', text: '#FFB300', icon: '🟡' },
    danger: { bg: 'rgba(211, 47, 47, 0.2)', text: '#EF5350', icon: '🔴' },
    arrived: { bg: 'rgba(46, 125, 50, 0.2)', text: '#66BB6A', icon: '✅' },
    late: { bg: 'rgba(230, 81, 0, 0.2)', text: '#FFA726', icon: '⏰' },
  },
};

// ── Get Active Theme ──
export function getTheme(hour = new Date().getHours()) {
  return (hour >= 6 && hour < 18) ? LIGHT : DARK;
}

// ── Typography ──
export const TYPOGRAPHY = {
  hero: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  h1: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  h2: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  subtitle: { fontSize: 16, fontWeight: '500', lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  micro: { fontSize: 11, fontWeight: '400', lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '700', lineHeight: 16, letterSpacing: 0.5 },
};

// ── Spacing ──
export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ── Border Radius ──
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
};

// ── Legacy Support (for components not yet migrated) ──
export const COLORS = {
  green: BRAND.primary,
  greenLight: BRAND.primaryLight,
  greenBg: LIGHT.glow.green,
  blue: BRAND.secondary,
  blueLight: BRAND.secondaryLight,
  blueBg: LIGHT.glow.blue,
  orange: BRAND.accent,
  orangeLight: BRAND.accentLight,
  orangeBg: LIGHT.glow.amber,
  red: BRAND.danger,
  redLight: BRAND.dangerLight,
  redBg: LIGHT.glow.red,
  purple: BRAND.purple,
  purpleBg: LIGHT.glow.purple,
  teal: BRAND.teal,
  tealBg: 'rgba(0, 137, 123, 0.12)',

  statusPresent: STATUS.present,
  statusAbsent: STATUS.absent,
  statusLate: STATUS.late,
  statusSick: STATUS.sick,
  statusExcused: STATUS.excused,

  canvas: LIGHT.canvas,
  canvasSecondary: LIGHT.canvasSecondary,
  surface: LIGHT.surface,
  border: LIGHT.border,
  glass: LIGHT.glass,
  glassBorder: LIGHT.glassBorder,
  textPrimary: LIGHT.text.primary,
  textSecondary: LIGHT.text.secondary,
  textMuted: LIGHT.text.muted,
  textInverse: LIGHT.text.inverse,
  shadow: '#000',
  shadowStrong: '#000',
};

export const SHADOWS = {
  sm: LIGHT.shadow.sm,
  md: LIGHT.shadow.md,
  lg: LIGHT.shadow.lg,
  xl: LIGHT.shadow.xl,
};
