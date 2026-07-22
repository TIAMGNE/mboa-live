import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B1210',
        surface: '#121B17',
        surface2: '#182420',
        line: '#233129',
        gold: { DEFAULT: '#E2453D', light: '#F16A62' },
        red: { DEFAULT: '#E2453D', light: '#F16A62' },
        amber: { DEFAULT: '#E8B33D', light: '#F4C862' },
        green: { DEFAULT: '#2E9E6D', light: '#4CC490' },
        ink: '#F5F3EE',
        dim: '#9CA6A0'
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)']
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        },
        tickerScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        heartBurst: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '15%': { transform: 'scale(1.3)', opacity: '1' },
          '30%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.1)', opacity: '0' }
        }
      },
      animation: {
        pulseRing: 'pulseRing 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite',
        ticker: 'tickerScroll 32s linear infinite',
        heartBurst: 'heartBurst 0.8s cubic-bezier(0.2,0.8,0.3,1) forwards'
      }
    }
  },
  plugins: []
};

export default config;
