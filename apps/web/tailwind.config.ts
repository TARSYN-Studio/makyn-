import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        card: "var(--card)",
        border: "var(--border)",
        "border-s": "var(--border-s)",
        text: "var(--text)",
        "text-mid": "var(--text-mid)",
        "text-dim": "var(--text-dim)",
        accent: "var(--accent)",
        "accent-mid": "var(--accent-mid)",
        "accent-l": "var(--accent-l)",
        "accent-xl": "var(--accent-xl)",
        red: "var(--red)",
        "red-l": "var(--red-l)",
        green: "var(--green)",
        "green-l": "var(--green-l)",
        amber: "var(--amber)",
        "amber-l": "var(--amber-l)",
        teal: "var(--teal)",
        "teal-l": "var(--teal-l)"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono-stack)"],
        ar: ["var(--font-arabic)"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,26,20,0.03), 0 1px 4px rgba(26,26,20,0.03)",
        modal: "0 2px 8px rgba(26,26,20,0.08), 0 20px 40px rgba(26,26,20,0.08)",
        popover: "0 4px 16px rgba(26,26,20,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
