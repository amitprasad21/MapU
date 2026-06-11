/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#adc2ff',
          400: '#7fa3ff',
          500: '#4a75fc',
          600: '#3452f5',
          700: '#273ce0',
          800: '#2030b8',
          900: '#1e2d94',
        }
      }
    },
  },
  plugins: [],
}
