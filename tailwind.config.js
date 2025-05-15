/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        linkedin: {
          blue: "#0a66c2",
          "blue-hover": "#004182",
          "blue-active": "#09223b",
          black: "#000000",
          white: "#ffffff",
          "gray-10": "#f3f2f0",
          "gray-20": "#eef3f8",
          "gray-30": "#dce6f1",
          "gray-50": "#86888a",
          "gray-60": "#767676",
          "gray-70": "#666666",
          "gray-80": "#414141",
          "gray-90": "#191919",
          success: "#057642",
          "success-bg": "#f1f8f5",
          "success-border": "#c2e0cc",
          "success-text": "#057642",
          error: "#b74700",
          "error-bg": "#fdf5f2",
          "error-border": "#f7cfbc",
          "error-text": "#b74700",
          bg: "#f3f2f0",
          text: "#191919"
        },
      },
      fontFamily: {
        linkedin: [
          '-apple-system',
          'system-ui',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Fira Sans',
          'Ubuntu',
          'Oxygen',
          'Oxygen Sans',
          'Cantarell',
          'Droid Sans',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Lucida Grande',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'linkedin-sm': '0 1px 2px rgba(0, 0, 0, 0.15)',
        'linkedin-md': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'linkedin-lg': '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'linkedin-sm': '0.25rem',  // 4px
        'linkedin-md': '0.5rem',   // 8px
        'linkedin-lg': '1.5rem',   // 24px - for pills
      },
    },
  },
  plugins: [],
};