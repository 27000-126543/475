/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          50: '#f5f0e8',
          100: '#ede5d5',
          200: '#d4c9b0',
          300: '#b8a888',
          400: '#9c8660',
          500: '#8a7550',
          600: '#726040',
          700: '#5a4d30',
          800: '#3d3520',
          900: '#1a1a2e',
          950: '#0d0d1a',
        },
        cinnabar: {
          50: '#fef2f2',
          100: '#fde3e3',
          200: '#fbc5c5',
          300: '#f8a0a0',
          400: '#e74c4c',
          500: '#c0392b',
          600: '#a93226',
          700: '#922b21',
          800: '#7b241c',
          900: '#641e16',
        },
        amber: {
          50: '#fdf8f0',
          100: '#faf0dc',
          200: '#f5e0b8',
          300: '#e8c98a',
          400: '#d4a574',
          500: '#c0905e',
          600: '#a87848',
          700: '#906030',
          800: '#784820',
          900: '#603810',
        },
        indigo: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#2c3e50',
          600: '#243442',
          700: '#1c2a36',
          800: '#15202b',
          900: '#0d1520',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"Source Han Mono"', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bell-ring': 'bell-ring 0.5s ease-in-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'count-up': 'count-up 0.6s ease-out',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(192, 57, 43, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(192, 57, 43, 0)' },
        },
        'bell-ring': {
          '0%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(14deg)' },
          '30%': { transform: 'rotate(-8deg)' },
          '45%': { transform: 'rotate(6deg)' },
          '60%': { transform: 'rotate(-4deg)' },
          '75%': { transform: 'rotate(2deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
