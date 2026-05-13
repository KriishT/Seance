"use client";

import { motion } from "framer-motion";

const orbs = [
  { r: "138,110,80",  size: 900, x: "75%", y: "5%",  dur: 42, delay: 0,  op: 0.14 },
  { r: "100,90,140",  size: 700, x: "10%", y: "60%", dur: 50, delay: 8,  op: 0.11 },
  { r: "80,120,100",  size: 580, x: "50%", y: "85%", dur: 36, delay: 16, op: 0.09 },
  { r: "130,100,80",  size: 440, x: "88%", y: "55%", dur: 58, delay: 24, op: 0.08 },
  { r: "100,80,120",  size: 380, x: "22%", y: "10%", dur: 30, delay: 6,  op: 0.10 },
];

export default function Background3D() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>

      {/* Film grain — the most important texture layer */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.09, mixBlendMode: "screen" }}
        aria-hidden="true"
      >
        <filter id="grain-dark">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.68"
            numOctaves="4"
            seed="14"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-dark)" />
      </svg>

      {/* Deep gradient orbs — barely visible, just break the flat black */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width:  orb.size,
            height: orb.size,
            left:   orb.x,
            top:    orb.y,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle at 38% 38%, rgba(${orb.r},${orb.op}) 0%, transparent 65%)`,
            filter: "blur(2px)",
          }}
          animate={{
            x:     [0, 20, -14, 16, 0],
            y:     [0, -16, 22, -10, 0],
            scale: [1, 1.03, 0.98, 1.02, 1],
          }}
          transition={{
            duration: orb.dur,
            delay:    orb.delay,
            repeat:   Infinity,
            ease:     "easeInOut",
          }}
        />
      ))}

      {/* Vignette — pulls edges to pure black */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(10,9,8,0.85) 100%)",
        }}
      />
    </div>
  );
}
