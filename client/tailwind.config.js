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
        dark: {
          bg: '#0A0E1A',
          surface: '#111827',
          card: '#161F30',
          hover: '#1E293B',
          border: '#2A374A',
          muted: '#94A3B8'
        },
        navy: {
          800: '#0F172A',
          850: '#0c1322',
          900: '#080d19',
          950: '#04070d'
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        }
      }
    },
  },
  plugins: [],
}
