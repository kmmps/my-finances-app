/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0f',
        },
      },
      keyframes: {
        slideup: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
      animation: {
        slideup: 'slideup 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
