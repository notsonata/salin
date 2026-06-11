import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f3ee",
        panel: "#fffcf7",
        ink: "#15120f",
        muted: "#6b635a",
        line: "#d9d1c5",
        accent: "#2d5b52",
        accentSoft: "#d9ebe7",
        danger: "#8d3d2c",
      },
      borderRadius: {
        md: "10px",
        lg: "12px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(21, 18, 15, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
