import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FBF8F1",
        cream: "#F4EEDD",
        sage: { 100: "#E9EDF8", 300: "#C3CCE6", 500: "#6F7FAE", 700: "#2A3F7A", 900: "#0A1A3F" },
        navy: { 950: "#060F2B", 900: "#0A1A3F", 800: "#12275C", 700: "#1B3677", 300: "#9FB2E0" },
        gold: { 200: "#EBDDAE", 400: "#CFAE57", 600: "#A78532" },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Noto Sans Bengali", "Noto Sans", "sans-serif"],
        arabic: ["Amiri", "Noto Naskh Arabic", "Traditional Arabic", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
