import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './types/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#050816',
        foreground: '#f8fafc',
        panel: {
          DEFAULT: '#0b1120',
          elevated: '#111a30',
          subtle: '#172036',
        },
        border: '#22304d',
        accent: {
          DEFAULT: '#f97316',
          soft: '#fb923c',
          danger: '#ef4444',
          safe: '#22c55e',
          info: '#38bdf8',
        },
        muted: '#94a3b8',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(249,115,22,0.25), 0 20px 50px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        'radial-grid': 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.12) 1px, transparent 0)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [],
};

export default config;
