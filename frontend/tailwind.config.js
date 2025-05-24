/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#4B7BEC", // Definisi eksplisit untuk primary color
          50: "#EEF2FD",
          100: "#DCE5FB",
          200: "#B9CBF7",
          300: "#96B1F3",
          400: "#7397EF",
          500: "#4B7BEC", // Main shade
          600: "#1F58E7",
          700: "#174AC4",
          800: "#123C9C",
          900: "#0D2E74",
        },
        secondary: {
          DEFAULT: "#45AAF2",
          foreground: "hsl(var(--secondary-foreground))",
          50: "#EDF7FE",
          100: "#DBEEFC",
          200: "#B7DEF9",
          300: "#93CDF6",
          400: "#6FBCF4",
          500: "#45AAF2",
          600: "#1B98EB",
          700: "#1179BD",
          800: "#0D5C8F",
          900: "#093F61",
        },
        accent: {
          DEFAULT: "#2ECC71", // Green
          50: "#E9F9F0",
          100: "#D3F3E2",
          200: "#A7E7C5",
          300: "#7BDBA8",
          400: "#4FCF8B",
          500: "#2ECC71", // Main shade
          600: "#25A25A",
          700: "#1C7943",
          800: "#154F2D",
          900: "#0D2617",
        },
        warning: {
          DEFAULT: "#FFA502", // Yellow/Orange
          50: "#FFF4E5",
          100: "#FFE9CC",
          200: "#FFD399",
          300: "#FFBD66",
          400: "#FFA733",
          500: "#FFA502", // Main shade
          600: "#CC8400",
          700: "#996300",
          800: "#664200",
          900: "#332100",
        },
        danger: {
          DEFAULT: "#FF6B6B", // Red
          50: "#FFF0F0",
          100: "#FFE0E0",
          200: "#FFC2C2",
          300: "#FFA3A3",
          400: "#FF8585",
          500: "#FF6B6B", // Main shade
          600: "#FF3D3D",
          700: "#FF0F0F",
          800: "#E00000",
          900: "#A30000",
        },
        dark: {
          DEFAULT: "#2F3542", // Dark background
          50: "#E9EAEC",
          100: "#D3D5D9",
          200: "#A7ABB4",
          300: "#7B818F",
          400: "#4F566A",
          500: "#2F3542", // Main shade
          600: "#262B35",
          700: "#1C2028",
          800: "#13161B",
          900: "#090B0E",
        },
        light: {
          DEFAULT: "#F1F2F6", // Light background
          50: "#FEFEFF",
          100: "#FDFEFF",
          200: "#FBFCFE",
          300: "#F9FAFD",
          400: "#F7F8FC",
          500: "#F1F2F6", // Main shade
          600: "#D1D5E8",
          700: "#B1B8DA",
          800: "#919BCC",
          900: "#717EBE",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "cursive"],
        pixelbody: ['"VT323"', "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        pixel: "4px 4px 0px rgba(0, 0, 0, 0.2)",
        "pixel-md": "2px 2px 0px rgba(0, 0, 0, 0.2)",
        "pixel-lg": "6px 6px 0px rgba(0, 0, 0, 0.2)",
        "pixel-xl": "8px 8px 0px rgba(0, 0, 0, 0.2)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "pixel-pattern": "url('/assets/ui/bg-pattern.png')",
      },
      animation: {
        "pixel-bounce": "pixel-bounce 0.5s ease-in-out infinite alternate",
        "pixel-float": "pixel-float 2s ease-in-out infinite alternate",
      },
      keyframes: {
        "pixel-bounce": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-5px)" },
        },
        "pixel-float": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
