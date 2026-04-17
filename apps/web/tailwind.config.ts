import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef2f7",
          100: "#d2dbe8",
          200: "#9bafc6",
          300: "#6a85a6",
          400: "#476585",
          500: "#1F3A5F",
          600: "#16304e",
          700: "#102540",
          800: "#0a1a2f",
          900: "#050e1d"
        },
        gold: {
          400: "#d7bf82",
          500: "#C9A961",
          600: "#a88a46"
        }
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans Arabic",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
