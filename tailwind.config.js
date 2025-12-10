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
          DEFAULT: '#db5d1eff', // Your custom pink
          foreground: '#000000', // Text color
        },
        original: {
          DEFAULT: '#fc017d', // Your custom pink
          foreground: '#000000', // Text color
        }
      },
    },
  },
  plugins: [heroui()]
};
