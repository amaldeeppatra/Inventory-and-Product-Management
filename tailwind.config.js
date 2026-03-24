/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          800: '#6A422A', // Button background
          700: '#6A422A', // Back icon
          600: '#8B6F5A', // Secondary text
        },
        primary: "var(--primary-color)",
        secondary: "var(--secondary-color)",
        accent: "var(--accent-color)",
        background: "var(--background-color)",
        text: "var(--text-color)",
        tertiary: "var(--tertiary-color)",
      },
    },
  },
  plugins: [],
}

