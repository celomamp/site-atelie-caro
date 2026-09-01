// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cobalt: "#1B4FD8",
        magenta: "#E8197B",
        terracotta: "#C66A46",
        clay: "#A8573C",
        cream: "#FAF6F0",
        blush: "#F6E7EF",
        ink: "#2B2430",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        body: ["var(--font-montserrat)", "sans-serif"],
        cursive: ["var(--font-pacifico)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
