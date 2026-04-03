/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nsg-primary': '#1e40af',
        'nsg-secondary': '#3b82f6',
        'nsg-accent': '#60a5fa',
      },
    },
  },
  plugins: [],
}
