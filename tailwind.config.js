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
          100: '#88dbb4',
          200: '#bbf7d6',
          300: '#86efb8',
          400: '#4ade92',
          500: '#00806f', // main color
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'danger': {
          50: '#fef2f1',
          100: '#fde3e1',
          200: '#fccbc8',
          300: '#f9a7a1',
          400: '#f4746b',
          500: '#ab3b2e', // main color
          600: '#9a352a',
          700: '#812d24',
          800: '#6b2720',
          900: '#5a231e',
        },
      },
      animation: {
        'slideInRight': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
