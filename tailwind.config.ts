import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#d4001a", dark: "#a30014", soft: "#fde8ea" },
        ink: { DEFAULT: "#0e0e10", 2: "#1b1b1f", 3: "#2a2a30" },
      },
      fontFamily: {
        sans: ["Heebo", "Arial", "sans-serif"],
        display: ['"Barlow Condensed"', "Heebo", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
