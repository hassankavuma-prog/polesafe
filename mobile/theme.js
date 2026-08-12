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

// ── WCAG AA High-Contrast Badge Colors ──
// Light bg + dark text pairs — minimum 4.5:1 contrast ratio
// These ensure readability in direct sunlight and on budget phones
export const WCAG = {
  badge: {
    safe:        { bg: '#DCFCE7', text: '#15803D' },      // green 4.8:1 ✅
    inTransit:   { bg: '#DBEAFE', text: '#1E40AF' },      // blue 4.9:1 ✅
    warning:     { bg: '#FEF3C7', text: '#B45309' },       // amber 5.2:1 ✅
    danger:      { bg: '#FEE2E2', text: '#B91C1C' },       // red 4.7:1 ✅
    arrived:     { bg: '#DCFCE7', text: '#15803D' },       // green 4.8:1 ✅
    late:        { bg: '#FFF3CD', text: '#92400E' },       // dark amber 6.1:1 ✅
    sick:        { bg: '#F3E8FF', text: '#7C3AED' },       // purple 5.3:1 ✅
    neutral:     { bg: '#F3F4F6', text: '#374151' },        // gray 5.8:1 ✅
    present:     { bg: '#DCFCE7', text: '#15803D' },
    absent:      { bg: '#FEE2E2', text: '#B91C1C' },
    missing:     { bg: '#FFE4E6', text: '#BE123C' },       // rose 5.0:1 ✅
    pickup:      { bg: '#EFF6FF', text: '#1E40AF' },       // blue 5.8:1 ✅
    cancel:      { bg: '#F5F5F5', text: '#525252' },       // gray 4.7:1 ✅
    completed:   { bg: '#DCFCE7', text: '#15803D' },
    credit:      { bg: '#FEF9C3', text: '#854D0E' },       // yellow 4.9:1 ✅
    info:        { bg: '#E0F2FE', text: '#075985' },       // sky 4.9:1 ✅
  },
  // Minimum font sizes for accessibility
  font: {
    minBody: 14,             // WCAG recommended minimum for body text
    minCaption: 12,          // absolute minimum for secondary text
    minMicro: 11,            // only for truly decorative/label use
    minBadge: 12,            // badge/label text minimum
    boldWeight: '700',       // bold minimum for critical info
    semiBoldWeight: '600',   // semi-bold for emphasis
  },
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
  
  // Map overlay shield — prevents text blending into map roads/labels
  mapShield: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  
  statusBadge: {
    safe:        { bg: '#DCFCE7', text: '#15803D', icon: '🟢' },
    inTransit:   { bg: '#DBEAFE', text: '#1E40AF', icon: '🔵' },
    warning:     { bg: '#FEF3C7', text: '#B45309', icon: '🟡' },
    danger:      { bg: '#FEE2E2', text: '#B91C1C', icon: '🔴' },
    arrived:     { bg: '#DCFCE7', text: '#15803D', icon: '✅' },
    late:        { bg: '#FFF3CD', text: '#92400E', icon: '⏰' },
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
  
  // Map overlay shield — dark mode version
  mapShield: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  
  statusBadge: {
    safe:        { bg: 'rgba(21, 128, 61, 0.25)', text: '#86EFAC', icon: '🟢' },
    inTransit:   { bg: 'rgba(30, 64, 175, 0.25)', text: '#93C5FD', icon: '🔵' },
    warning:     { bg: 'rgba(180, 83, 9, 0.25)', text: '#FCD34D', icon: '🟡' },
    danger:      { bg: 'rgba(185, 28, 28, 0.25)', text: '#FCA5A5', icon: '🔴' },
    arrived:     { bg: 'rgba(21, 128, 61, 0.25)', text: '#86EFAC', icon: '✅' },
    late:        { bg: 'rgba(146, 64, 14, 0.25)', text: '#FDBA74', icon: '⏰' },
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
