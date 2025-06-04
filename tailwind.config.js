/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#ffe4ef',
          100: '#ffd6e7',
          200: '#fbb6ce',
          300: '#ec4899',
          400: '#db2777',
          500: '#be185d',
        },
        yellow: {
          50: '#fffbe9',
          100: '#fef9c3',
          200: '#fde68a',
          300: '#facc15',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 
