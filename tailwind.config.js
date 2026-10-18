/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tkgate: {
          bg: '#1e222b',
          surface: '#282c37',
          panel: '#20242f',
          border: '#3d4455',
          accent: '#3b82f6',
          wire0: '#64748b',
          wire1: '#10b981',
          wireZ: '#eab308',
          wireX: '#ef4444',
          canvas: '#161922',
          grid: '#232838',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
