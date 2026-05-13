/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rarity: {
          N: "#9ca3af",
          R: "#3b82f6",
          SR: "#a855f7",
          SSR: "#f59e0b",
          UR: "#ef4444",
        },
        ui: {
          bg: "#0f0a1e",
          panel: "#1a1230",
          accent: "#ff6b9d",
          text: "#f5f5f5",
        },
      },
      fontFamily: {
        game: ['"Yu Gothic"', '"YuGothic"', '"Hiragino Sans"', "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 16px rgba(255,107,157,0.6)",
        rarity: "0 0 24px currentColor",
      },
    },
  },
  plugins: [],
};
