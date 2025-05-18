/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "cursive", "monospace"],
        mono: ["VT323", "monospace"],
      },
      colors: {
        "pixel-black": "var(--pixel-black)",
        "pixel-dark": "var(--pixel-dark)",
        "pixel-gray": "var(--pixel-gray)",
        "pixel-light-gray": "var(--pixel-light-gray)",
        "pixel-red": "var(--pixel-red)",
        "pixel-orange": "var(--pixel-orange)",
        "pixel-blue": "var(--pixel-blue)",
        "pixel-green": "var(--pixel-green)",
        "pixel-yellow": "var(--pixel-yellow)",
        "pixel-purple": "var(--pixel-purple)",
        "pixel-white": "var(--pixel-white)",
        "cyber-purple": "var(--cyber-purple)",
        "cyber-blue": "var(--cyber-blue)",
        "cyber-pink": "var(--cyber-pink)",
        "cyber-indigo": "var(--cyber-indigo)",
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
