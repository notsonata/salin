import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-instrument)", "serif"],
      },
      colors: {
        vantage: {
          bg: "#FAFAF9",
          dark: "#1C1917",
          primary: "#EA580C",
        },
        canvas: "#FAFAF9",
        panel: "#FFFFFF",
        ink: "#1C1917",
        muted: "#78716C",
        line: "#E7E5E4",
        field: "#F5F5F4",
        hover: "#F5F5F4",
        brandDeep: "#1C1917",
        brandPanel: "#292524",
        brandLine: "#44403C",
        brandMuted: "#A8A29E",
        accent: "#1A3C2B",
        accentSoft: "#D1EAE0",
        accentFaint: "#F0F8F5",
        review: "oklch(0.48 0.086 253)",
        reviewSoft: "oklch(0.932 0.022 253)",
        reviewFaint: "oklch(0.972 0.01 253)",
        notes: "oklch(0.34 0.028 243)",
        notesSoft: "oklch(0.944 0.012 243)",
        notesFaint: "oklch(0.981 0.005 243)",
        attention: "oklch(0.67 0.125 74)",
        attentionSoft: "oklch(0.949 0.028 74)",
        attentionFaint: "oklch(0.981 0.014 74)",
        danger: "oklch(0.57 0.142 35)",
        dangerSoft: "oklch(0.95 0.028 35)",
        dangerFaint: "oklch(0.982 0.012 35)",
        success: "oklch(0.57 0.09 161)",
        successSoft: "oklch(0.949 0.025 161)",
      },
      borderRadius: {
        md: "0.75rem",
        lg: "1rem",
        xl: "1.35rem",
      },
      boxShadow: {
        panel: "0 1px 1px rgba(12, 22, 40, 0.06), 0 16px 42px rgba(12, 22, 40, 0.04)",
        lift: "0 24px 56px rgba(12, 22, 40, 0.09)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
