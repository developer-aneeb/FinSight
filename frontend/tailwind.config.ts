import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        ring: "hsl(var(--ring))",
        brand: {
          50: "#eef9ff",
          100: "#d8f1ff",
          200: "#b9e7ff",
          300: "#89d9ff",
          400: "#52c2ff",
          500: "#2aa3ff",
          600: "#1484f5",
          700: "#0d6de1",
          800: "#1158b6",
          900: "#144b8f",
          950: "#112f57",
        },
        finance: {
          income: "#22c55e",
          expense: "#ef4444",
          savings: "#3b82f6",
          warning: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
