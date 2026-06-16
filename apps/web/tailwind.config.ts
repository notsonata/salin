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
        canvas: "#f7f3ed",
        panel: "#fffdf8",
        ink: "#15120f",
        muted: "#6b635a",
        line: "#ddd3c4",
        field: "#fbf8f2",
        hover: "#f2ece2",
        brandDeep: "#132724",
        brandPanel: "#203d38",
        brandLine: "#45635e",
        brandMuted: "#cbded8",
        accent: "#28665d",
        accentSoft: "#d9eee8",
        accentFaint: "#eff8f5",
        review: "#2f5f98",
        reviewSoft: "#e4eefb",
        reviewFaint: "#f3f7fd",
        notes: "#6a4a8d",
        notesSoft: "#eee6f7",
        notesFaint: "#faf6fd",
        attention: "#a76516",
        attentionSoft: "#f8ead2",
        attentionFaint: "#fff8ec",
        danger: "#963f2c",
        dangerSoft: "#f8e6df",
        dangerFaint: "#fff3ef",
        success: "#2f7158",
        successSoft: "#dff1e8",
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
