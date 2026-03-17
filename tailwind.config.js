/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        primary: '#7c5dfa',
        'primary-light': '#9277ff',
        'dark-bg': '#141625',
        'dark-surface': '#1e2139',
        'status-paid': '#33d69f',
        'status-pending': '#ff8f00',
        'status-draft': '#373b53',
        'text-primary': '#0c0e16',
        'text-secondary': '#888eb0',
      },
      fontFamily: {
        sans: ['"League Spartan"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}