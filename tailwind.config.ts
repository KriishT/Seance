import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'EB Garamond'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        // Core — dark palette
        cream:   "#0A0908",   // page background — deep black
        paper:   "#161412",   // card / elevated surface
        charcoal:"#F0EDE8",   // primary text — warm ivory
        muted:   "#8A8580",   // secondary text
        border:  "#252220",   // borders

        // Accents (mid-tones — readable on both old light and new dark)
        lavender:        "#8A7FA0",
        rose:            "#9A7575",
        sage:            "#6A8A72",
        amber:           "#9A8050",
        "lavender-light":"#1A1620",
        "rose-light":    "#1E1515",
        "sage-light":    "#151E17",
        "amber-light":   "#1E1A10",

        // Gold — the restrained luxury accent
        gold:     "#C9A96E",
        "gold-dim":"#8A6A3A",

        // Explicit aliases for readability in new components
        void:   "#0A0908",
        surface:"#161412",
        ivory:  "#F0EDE8",
        wire:   "#252220",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-18px)" },
        },
        floatB: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-12px)" },
        },
        floatC: {
          "0%, 100%": { transform: "translateY(0px) rotateX(10deg) rotateZ(5deg)" },
          "50%":       { transform: "translateY(-22px) rotateX(18deg) rotateZ(2deg)" },
        },
        spinSlow: {
          "0%":   { transform: "rotateX(15deg) rotateY(0deg)" },
          "100%": { transform: "rotateX(15deg) rotateY(360deg)" },
        },
      },
      animation: {
        float:     "float 10s ease-in-out infinite",
        floatB:    "floatB 13s ease-in-out infinite",
        floatC:    "floatC 8s ease-in-out infinite",
        spinSlow:  "spinSlow 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
