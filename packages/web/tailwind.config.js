/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'pulse-green': {
          '0%, 100%': { backgroundColor: 'rgb(220 252 231)' },
          '50%': { backgroundColor: 'rgb(134 239 172)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        'count-up': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'progress-fill': {
          '0%': { width: '0%' },
        },
      },
      animation: {
        'pulse-green': 'pulse-green 0.6s ease-in-out',
        shake: 'shake 0.4s ease-in-out',
        'count-up': 'count-up 0.4s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'progress-fill': 'progress-fill 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}
