"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";

// ─── SplashLoader ───────────────────────────────────────────────────
// Uses the actual flower-logo.png.
// Animation: clip-path circle expands from center (0px → full) = true bloom from middle.
// The logo's own shape handles the petal geometry — sides are wide and droop naturally.
// A slight scaleX lag makes the side petals appear to "flop" open as they're revealed.

export function SplashLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#080808] flex flex-col items-center justify-center">

      {/* Static CIC flower — no animation */}
      <img
        src="/flower-logo.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          width: 52,
          height: 52,
          objectFit: "contain",
          filter: "invert(1)",
          display: "block",
          userSelect: "none",
          marginBottom: 40,
        }}
      />

      {/* Determinate load bar — fills with page, no loop */}
      <div
        style={{
          position: "relative",
          width: 140,
          height: 1.5,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        {/* Phase 1: fast fill to 80% */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "80%" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: 999,
            background: "rgba(255,255,255,0.85)",
          }}
        />
        {/* Phase 2: slow creep to 95% — simulates waiting for server */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "95%" }}
          transition={{ duration: 12, ease: "linear", delay: 1.2 }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: 999,
            background: "rgba(255,255,255,0.85)",
          }}
        />
      </div>
    </div>
  );
}


// ─── InlineLoader ───────────────────────────────────────────────────
// Bold in-app refresh indicator. Theme-aware, full opacity.

export function InlineLoader({ visible }: { visible: boolean }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9990,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* Bold flower — full opacity, theme-adaptive */}
      <motion.img
        src="/flower-logo.png"
        alt=""
        aria-hidden="true"
        animate={{ rotate: [0, 8, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 24,
          height: 24,
          objectFit: "contain",
          filter: isDark ? "invert(1)" : "invert(0)",
          display: "block",
        }}
      />

      {/* Sweep bar */}
      <div
        style={{
          position: "relative",
          width: 56,
          height: 1.5,
          background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ x: ["-100%", "400%"] }}
          transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.05 }}
          style={{
            position: "absolute",
            inset: 0,
            width: "45%",
            borderRadius: 999,
            background: isDark
              ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)"
              : "linear-gradient(90deg, transparent, rgba(0,0,0,0.7), transparent)",
          }}
        />
      </div>
    </motion.div>
  );
}
