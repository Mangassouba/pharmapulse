/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  plugins: [import('daisyui')],
  daisyui: { themes: ['light'] }
}
