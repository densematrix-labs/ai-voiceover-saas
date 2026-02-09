/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'studio': {
          'bg': '#0a0a0f',
          'panel': '#14141f',
          'border': '#2a2a3f',
          'neon-cyan': '#00f5ff',
          'neon-pink': '#ff00aa',
          'neon-green': '#00ff88',
          'neon-orange': '#ff8800',
          'warm': '#ffcc66',
          'muted': '#6b6b8a',
        },
      },
      fontFamily: {
        'display': ['"VT323"', 'monospace'],
        'body': ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        'mono': ['"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(0, 245, 255, 0.5)',
            opacity: '1',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(0, 245, 255, 0.8)',
            opacity: '0.9',
          },
        },
        'wave': {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
