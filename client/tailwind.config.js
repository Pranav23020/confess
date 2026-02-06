/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#3617cf",
        "background-light": "#f6f6f8",
        "background-dark": "#141121",
        "surface-dark": "#1e1b2e",
        "danger-soft": "#ff5252",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px"
      },
      boxShadow: {
        "glow": "0 0 20px rgba(54, 23, 207, 0.5)",
        "card": "0 4px 20px rgba(0, 0, 0, 0.2)",
        "premium": "0 10px 40px -10px rgba(0, 0, 0, 0.5)",
        "logo": "0 0 15px rgba(54, 23, 207, 0.4)",
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
      }
    },
  },
  plugins: [],
}
