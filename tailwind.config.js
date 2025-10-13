// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",   // <- all React source
  ],
  theme: {
    extend: {
      colors: {
        'vine-green': {
          50: '#f0fdf7',
          100: '#dcfce9',
          200: '#bbf7d6',
          300: '#86efb8',
          400: '#4ade92',
          500: '#00806b', // Your main color
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
    },
  },
  plugins: [],
}
