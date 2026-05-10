"use client";

import { motion } from "framer-motion";

export default function Background3D() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Top-right: large tilted lavender plane */}
      <motion.div
        className="absolute"
        style={{
          top: "-8%",
          right: "-6%",
          width: 420,
          height: 420,
          background:
            "linear-gradient(135deg, rgba(196,181,208,0.28) 0%, rgba(212,165,165,0.14) 100%)",
          borderRadius: 40,
          border: "1px solid rgba(196,181,208,0.35)",
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateX: [16, 24, 16],
          rotateY: [-22, -12, -22],
          rotateZ: [4, 8, 4],
          y: [0, -14, 0],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bottom-left: sage/amber floating block */}
      <motion.div
        className="absolute"
        style={{
          bottom: "12%",
          left: "-4%",
          width: 240,
          height: 240,
          background:
            "linear-gradient(135deg, rgba(168,196,176,0.22) 0%, rgba(212,192,138,0.16) 100%)",
          borderRadius: 24,
          border: "1px solid rgba(168,196,176,0.3)",
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateX: [-8, 6, -8],
          rotateY: [28, 18, 28],
          rotateZ: [-4, 2, -4],
          y: [0, -10, 0],
        }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* Center-left: small rose diamond */}
      <motion.div
        className="absolute"
        style={{
          top: "38%",
          left: "5%",
          width: 120,
          height: 120,
          background: "rgba(212,165,165,0.18)",
          border: "1px solid rgba(212,165,165,0.28)",
          transformStyle: "preserve-3d",
          rotate: 45,
        }}
        animate={{
          rotateX: [10, 20, 10],
          rotateZ: [45, 52, 45],
          y: [0, -18, 0],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />

      {/* Top-left: tiny lavender square */}
      <motion.div
        className="absolute"
        style={{
          top: "18%",
          left: "8%",
          width: 56,
          height: 56,
          background: "rgba(196,181,208,0.22)",
          border: "1px solid rgba(196,181,208,0.3)",
          borderRadius: 6,
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateY: [0, 360],
          y: [0, -12, 0],
        }}
        transition={{
          rotateY: { duration: 14, repeat: Infinity, ease: "linear" },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* CSS 3D rotating cube — bottom right */}
      <div
        className="perspective-container absolute"
        style={{ bottom: "22%", right: "6%", width: 80, height: 80 }}
      >
        <motion.div
          className="cube"
          animate={{ rotateY: [0, 360], rotateX: [15, 15] }}
          transition={{ rotateY: { duration: 28, repeat: Infinity, ease: "linear" } }}
        >
          <div className="cube-face cube-front" />
          <div className="cube-face cube-back" />
          <div className="cube-face cube-left" />
          <div className="cube-face cube-right" />
          <div className="cube-face cube-top" />
          <div className="cube-face cube-bottom" />
        </motion.div>
      </div>

      {/* Soft bloom — center */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(196,181,208,0.10) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Top bloom */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "20%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,165,165,0.10) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
