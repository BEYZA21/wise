/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7BC47F',
        'primary-dark': '#6AB36E',
      },
    },
  },
  plugins: [],
};