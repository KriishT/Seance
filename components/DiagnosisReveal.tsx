"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MirrorAct from "./MirrorAct";
import RoadsAct from "./RoadsAct";
import BriefAct from "./BriefAct";
import AestheticMap from "./AestheticMap";
import type { DiagnosisResult } from "@/app/api/diagnose/route";

interface DiagnosisRevealProps {
  result: DiagnosisResult;
  description: string;
  onReset: () => void;
}

type Act = "mirror" | "roads" | "brief" | "map";

const ACT_META: Record<Act, { label: string; sublabel: string }> = {
  mirror: { label: "The Mirror", sublabel: "Who you're quoting" },
  roads: { label: "The Roads", sublabel: "What's been done" },
  brief: { label: "The Brief", sublabel: "What to make next" },
  map:   { label: "The Map",   sublabel: "Where you are" },
};

export default function DiagnosisReveal({ result, description, onReset }: DiagnosisRevealProps) {
  const [currentAct, setCurrentAct] = useState<Act>("mirror");
  const [roadsUnlocked, setRoadsUnlocked] = useState(false);
  const [briefUnlocked, setBriefUnlocked] = useState(false);
  const [mapUnlocked, setMapUnlocked] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setRoadsUnlocked(true), 4500);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!roadsUnlocked) return;
    const t2 = setTimeout(() => setBriefUnlocked(true), 4000);
    return () => clearTimeout(t2);
  }, [roadsUnlocked]);

  useEffect(() => {
    if (!briefUnlocked) return;
    const t3 = setTimeout(() => setMapUnlocked(true), 2000);
    return () => clearTimeout(t3);
  }, [briefUnlocked]);

  const isUnlocked = (act: Act) => {
    if (act === "mirror") return true;
    if (act === "roads") return roadsUnlocked;
    if (act === "brief") return briefUnlocked;
    if (act === "map") return mapUnlocked;
    return false;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="w-full"
    >
      {/* Act tabs */}
      <div className="flex gap-1 mb-10 bg-paper border border-border rounded-2xl p-1.5">
        {(["mirror", "roads", "brief", "map"] as Act[]).map((act) => {
          const unlocked = isUnlocked(act);
          const active = currentAct === act;
          return (
            <button
              key={act}
              onClick={() => unlocked && setCurrentAct(act)}
              disabled={!unlocked}
              className={`flex-1 py-2.5 px-2 rounded-xl text-left transition-all duration-400 ${
                active
                  ? "bg-cream shadow-sm"
                  : unlocked
                  ? "hover:bg-cream/60 cursor-pointer"
                  : "cursor-not-allowed opacity-30"
              }`}
            >
              <p className={`text-[10px] font-sans uppercase tracking-widest truncate ${active ? "text-charcoal" : "text-muted"}`}>
                {ACT_META[act].label}
              </p>
              <p className={`text-[9px] font-sans mt-0.5 truncate ${active ? "text-charcoal/60" : "text-muted/60"}`}>
                {ACT_META[act].sublabel}
              </p>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {currentAct === "mirror" && (
          <motion.div
            key="mirror"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <MirrorAct nodes={result.mirror.nodes} />
            {roadsUnlocked && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                onClick={() => setCurrentAct("roads")}
                className="mt-10 text-xs font-sans uppercase tracking-widest text-muted hover:text-charcoal transition-colors duration-300"
              >
                Continue to The Roads →
              </motion.button>
            )}
          </motion.div>
        )}

        {currentAct === "roads" && (
          <motion.div
            key="roads"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <RoadsAct roads={result.roadsTaken} />
            {briefUnlocked && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                onClick={() => setCurrentAct("brief")}
                className="mt-10 text-xs font-sans uppercase tracking-widest text-muted hover:text-charcoal transition-colors duration-300"
              >
                Continue to The Brief →
              </motion.button>
            )}
          </motion.div>
        )}

        {currentAct === "brief" && (
          <motion.div
            key="brief"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <BriefAct brief={result.brief} result={result} shareId={result.shareId} />
            {mapUnlocked && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                onClick={() => setCurrentAct("map")}
                className="mt-6 text-xs font-sans uppercase tracking-widest text-muted hover:text-charcoal transition-colors duration-300"
              >
                See your aesthetic map →
              </motion.button>
            )}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              onClick={onReset}
              className="mt-4 block text-xs font-sans uppercase tracking-widest text-muted/50 hover:text-muted transition-colors duration-300"
            >
              Read something else
            </motion.button>
          </motion.div>
        )}

        {currentAct === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <AestheticMap result={result} description={description} />
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              onClick={onReset}
              className="mt-10 text-xs font-sans uppercase tracking-widest text-muted hover:text-charcoal transition-colors duration-300"
            >
              Read something else
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
