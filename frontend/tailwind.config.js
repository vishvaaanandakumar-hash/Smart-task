/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#14213D',
        indigo: { DEFAULT: '#3B4C9B' },
        offwhite: '#F8F6F1',
        charcoal: '#22242A',
        black: 'rgb(var(--ink) / <alpha-value>)',
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'], display: ['"Space Grotesk"', 'ui-sans-serif'] }
    },
  },
  plugins: [],
}
