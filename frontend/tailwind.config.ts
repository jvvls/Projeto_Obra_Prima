import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#27ae60",
          hover: "#219150",
          dark: "#1e8b4a",
          darker: "#1b7742",
          light: "#2ecc71",
        },
        neutral: {
          900: "#333333",
          700: "#555555",
          600: "#666666",
          400: "#999999",
        },
        surface: {
          DEFAULT: "#ffffff",
          soft: "#f7faf8",
          muted: "#f5f5f5",
          border: "#e0e0e0",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
