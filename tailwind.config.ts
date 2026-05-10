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
        cream: "#F7F4EF",
        paper: "#FFFFFF",
        charcoal: "#1C1917",
        muted: "#78716C",
        border: "#E7E3DC",
        lavender: "#C4B5D0",
        rose: "#D4A5A5",
        sage: "#A8C4B0",
        amber: "#D4C08A",
        "lavender-light": "#EDE8F3",
        "rose-light": "#F5EAEA",
        "sage-light": "#EAF2EC",
        "amber-light": "#F5EDD8",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotateX(15deg) rotateY(-20deg)" },
          "50%": { transform: "translateY(-18px) rotateX(22deg) rotateY(-12deg)" },
        },
        floatB: {
          "0%, 100%": { transform: "translateY(0px) rotateX(-8deg) rotateY(28deg)" },
          "50%": { transform: "translateY(-12px) rotateX(2deg) rotateY(20deg)" },
        },
        floatC: {
          "0%, 100%": { transform: "translateY(0px) rotateX(10deg) rotateZ(5deg)" },
          "50%": { transform: "translateY(-22px) rotateX(18deg) rotateZ(2deg)" },
        },
        spinSlow: {
          "0%": { transform: "rotateX(15deg) rotateY(0deg)" },
          "100%": { transform: "rotateX(15deg) rotateY(360deg)" },
        },
      },
      animation: {
        float: "float 10s ease-in-out infinite",
        floatB: "floatB 13s ease-in-out infinite",
        floatC: "floatC 8s ease-in-out infinite",
        spinSlow: "spinSlow 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
