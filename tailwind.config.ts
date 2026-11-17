import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FBF8F1",
        cream: "#F4EEDD",
        sage: { 100: "#E6EDE3", 300: "#B5C7AF", 500: "#8FA98A", 700: "#566F58", 900: "#2F4636" },
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
