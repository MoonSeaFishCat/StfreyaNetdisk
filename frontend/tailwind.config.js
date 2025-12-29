/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stfreya: {
          pink: "#ffafcc",
          blue: "#a2d2ff",
          green: "#b9fbc0",
          purple: "#cdb4db",
          dark: "#1a1b26",
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
