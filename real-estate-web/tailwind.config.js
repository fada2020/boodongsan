/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af'
        }
      }
    },
  },
  plugins: [],
}

