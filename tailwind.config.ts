// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cobalt: "#374492",
        magenta: "#E4007C",
        clay: "#A8573C",
        cream: "#F8F8F8",
        blush: "#F6DEEA",
        mist: "#E3E5ED",
        ink: "#1A1A1A",
      },
      fontFamily: {
        display: ["var(--font-caprasimo)", "serif"],
        body: ["var(--font-poppins)", "sans-serif"],
        cursive: ["var(--font-marker)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
