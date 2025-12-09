import {heroui} from "@heroui/react";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#fc017d', // Your custom pink
          foreground: '#000000', // Text color
        },
        danger: {
          DEFAULT: '#e61531ff', // Your custom pink
          foreground: '#f8f4f4ff', // Text color
        },
      },
    },
  },
  plugins: [heroui()]
};
