/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dub-dark': '#252525',
        'dub-yellow': '#FFD700',
        'dub-yellow-light': '#FFED4E',
      },
      fontFamily: {
        'play': ['Play', 'sans-serif'],
        'bungee': ['Bungee Tint', 'cursive'],
      },
    },
  },
  plugins: [],
}
