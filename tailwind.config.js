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
          SSR: "#fbbf24",
          UR: "#ef4444",
        },
        elem: {
          fire: "#ff6b47",
          water: "#3aa8ff",
          wood: "#42d977",
          light: "#ffe066",
          dark: "#9c6cff",
        },
        ui: {
          bg: "#0a0518",
          bg2: "#15082b",
          panel: "#1f1538",
          panel2: "#2a1c4a",
          accent: "#ff6b9d",
          accent2: "#9d6bff",
          gold: "#ffce4d",
          text: "#f5f5f5",
          muted: "#a8a3b8",
        },
      },
      fontFamily: {
        game: ['"M PLUS Rounded 1c"', '"Noto Sans JP"', '"Yu Gothic"', "sans-serif"],
        title: ['"Cinzel"', '"M PLUS Rounded 1c"', "serif"],
        tech: ['"Orbitron"', '"M PLUS Rounded 1c"', "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(255,107,157,0.7), 0 0 40px rgba(255,107,157,0.3)",
        rarityN: "0 0 12px rgba(156,163,175,0.4)",
        rarityR: "0 0 16px rgba(59,130,246,0.6)",
        raritySR: "0 0 20px rgba(168,85,247,0.7), 0 0 36px rgba(168,85,247,0.3)",
        raritySSR: "0 0 22px rgba(251,191,36,0.8), 0 0 44px rgba(251,191,36,0.4)",
        rarityUR: "0 0 24px rgba(239,68,68,0.9), 0 0 56px rgba(239,68,68,0.5)",
        panel: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset",
      },
      backgroundImage: {
        "gradient-cosmic": "linear-gradient(135deg, #1a0a3a 0%, #3a1a5a 35%, #5a1a4a 70%, #2a0a3a 100%)",
        "gradient-fire": "linear-gradient(135deg, #4a1a0a 0%, #8a3a1a 100%)",
        "gradient-water": "linear-gradient(135deg, #0a1a4a 0%, #1a3a8a 100%)",
        "gradient-wood": "linear-gradient(135deg, #0a3a1a 0%, #1a6a3a 100%)",
        "gradient-light": "linear-gradient(135deg, #4a3a0a 0%, #8a6a1a 100%)",
        "gradient-dark": "linear-gradient(135deg, #2a0a4a 0%, #4a1a6a 100%)",
        "starfield": "radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.5), transparent), radial-gradient(2px 2px at 60px 70px, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 90px 40px, rgba(255,200,200,0.4), transparent)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { filter: "brightness(1) saturate(1)" },
          "50%": { filter: "brightness(1.25) saturate(1.3)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-10px)" },
          "40%, 80%": { transform: "translateX(10px)" },
        },
        "shake-hard": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "20%": { transform: "translate(-6px, -2px) rotate(-1deg)" },
          "40%": { transform: "translate(6px, 2px) rotate(1deg)" },
          "60%": { transform: "translate(-4px, 2px) rotate(0.5deg)" },
          "80%": { transform: "translate(4px, -2px) rotate(-0.5deg)" },
        },
        "flash": {
          "0%, 100%": { opacity: 0 },
          "50%": { opacity: 0.8 },
        },
        "float-up": {
          "0%": { transform: "translateY(0) scale(0.5)", opacity: 0 },
          "20%": { transform: "translateY(-10px) scale(1.2)", opacity: 1 },
          "100%": { transform: "translateY(-80px) scale(1)", opacity: 0 },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        "fade-in-up": {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "twinkle": {
          "0%, 100%": { opacity: 0.2, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.4)" },
        },
        "float-bg": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "33%": { transform: "translate(20px, -30px)" },
          "66%": { transform: "translate(-15px, 20px)" },
        },
        "skill-flash": {
          "0%": { transform: "scale(0)", opacity: 0 },
          "30%": { transform: "scale(1.5)", opacity: 1 },
          "100%": { transform: "scale(2.5)", opacity: 0 },
        },
        "ring-pulse": {
          "0%": { transform: "scale(0.8)", opacity: 0.8 },
          "100%": { transform: "scale(2)", opacity: 0 },
        },
        "bar-fill": {
          "0%": { width: "var(--from)" },
          "100%": { width: "var(--to)" },
        },
        "hover-3d": {
          "0%, 100%": { transform: "perspective(800px) rotateY(0deg)" },
          "100%": { transform: "perspective(800px) rotateY(8deg)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shake": "shake 0.4s ease-in-out",
        "shake-hard": "shake-hard 0.6s ease-in-out",
        "flash": "flash 0.3s ease-out",
        "float-up": "float-up 1.2s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "slide-in-left": "slide-in-left 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "shimmer": "shimmer 3s linear infinite",
        "twinkle": "twinkle 2.5s ease-in-out infinite",
        "float-bg": "float-bg 16s ease-in-out infinite",
        "skill-flash": "skill-flash 0.8s ease-out forwards",
        "ring-pulse": "ring-pulse 0.8s ease-out forwards",
      },
    },
  },
  plugins: [],
};
