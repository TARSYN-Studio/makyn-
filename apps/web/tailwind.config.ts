import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "var(--paper)",
          low: "var(--paper-low)",
          deep: "var(--paper-deep)"
        },
        stone: {
          DEFAULT: "var(--stone)",
          light: "var(--stone-light)"
        },
        ink: {
          DEFAULT: "var(--ink)",
          80: "var(--ink-80)",
          60: "var(--ink-60)",
          40: "var(--ink-40)",
          20: "var(--ink-20)"
        },
        signal: {
          DEFAULT: "var(--signal)",
          deep: "var(--signal-deep)",
          tint: "var(--signal-tint)"
        },
        state: {
          overdue: "var(--state-overdue)",
          resolved: "var(--state-resolved)",
          pending: "var(--state-pending)"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono-stack)"],
        ar: ["var(--font-arabic)"]
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)"
      },
      boxShadow: {
        card: "0 1px 2px rgba(14, 22, 40, 0.04), 0 1px 3px rgba(14, 22, 40, 0.04)",
        modal: "0 2px 8px rgba(14, 22, 40, 0.08), 0 20px 40px rgba(14, 22, 40, 0.08)",
        popover: "0 4px 16px rgba(14, 22, 40, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
