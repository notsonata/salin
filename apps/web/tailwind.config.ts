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
      colors: {
        canvas: "oklch(0.978 0.006 244)",
        panel: "oklch(0.995 0.002 248)",
        ink: "oklch(0.228 0.018 248)",
        muted: "oklch(0.505 0.017 246)",
        line: "oklch(0.902 0.01 246)",
        field: "oklch(0.986 0.004 244)",
        hover: "oklch(0.965 0.007 243)",
        brandDeep: "oklch(0.244 0.038 218)",
        brandPanel: "oklch(0.308 0.03 221)",
        brandLine: "oklch(0.425 0.03 224)",
        brandMuted: "oklch(0.83 0.018 229)",
        accent: "oklch(0.53 0.092 195)",
        accentSoft: "oklch(0.931 0.022 195)",
        accentFaint: "oklch(0.968 0.01 195)",
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
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
