import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf8f6",
          100: "#f2e8e5",
          200: "#e4d0ca",
          300: "#d2b2a8",
          400: "#be8f81",
          500: "#a96f5f",
          600: "#985c4d",
          700: "#7e4a3d",
          800: "#693f34",
          900: "#57372d",
          950: "#2f1b17",
        },
        cozy: {
          light: "#faf6f0",
          dark: "#1e1e24",
        }
      },
    },
  },
  plugins: [],
};

export default config;
