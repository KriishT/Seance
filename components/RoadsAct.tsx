"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RoadEntry } from "@/app/api/diagnose/route";

interface RoadsActProps {
  roads: RoadEntry[];
  imageMap?: Record<string, string | null>;
}

const MEDIUM_STYLES: Record<RoadEntry["medium"], { label: string; color: string }> = {
  "visual art":   { label: "Visual Art",    color: "#9A7575" },
  music:          { label: "Music",          color: "#8A7FA0" },
  film:           { label: "Film",           color: "#6A8A72" },
  fashion:        { label: "Fashion",        color: "#9A8050" },
  "writing/zine": { label: "Writing / Zine", color: "#9A7575" },
};

export default function RoadsAct({ roads, imageMap = {} }: RoadsActProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = roads.find((r) => r.id === selectedId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="space-y-8"
    >
      <div className="space-y-1">
        <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/60">
          The Roads Taken
        </p>
        <p className="text-charcoal/60 font-serif text-base">
          Works across mediums that resolved the same aesthetic tension differently.
          Each one made a specific choice you have not made yet. Click one to commit to that direction.
        </p>
      </div>

      {/* Road grid — 2 columns on wide screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {roads.map((road, i) => {
          const style = MEDIUM_STYLES[road.medium] ?? MEDIUM_STYLES["visual art"];
          const isSelected = selectedId === road.id;
          return (
            <motion.div
              key={road.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setSelectedId(isSelected ? null : road.id)}
              className={`border cursor-pointer overflow-hidden transition-all duration-300 group ${
                isSelected
                  ? "border-gold/40 bg-surface"
                  : "border-wire hover:border-wire/80 bg-surface/40"
              }`}
            >
              <div className="flex gap-0">
                {/* Image */}
                {(imageMap[road.id] ?? road.imageUrl) && (
                  <div className="w-20 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(imageMap[road.id] ?? road.imageUrl)!}
                      alt={road.title}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${isSelected ? "opacity-80" : "opacity-50 group-hover:opacity-65"}`}
                      style={{ minHeight: "110px" }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif text-sm text-charcoal leading-tight">
                        {road.title}
                      </p>
                      <p className="text-[10px] font-sans text-muted mt-0.5">
                        {road.creator}, {road.year}
                      </p>
                    </div>
                    <span
                      className="text-[8px] font-sans uppercase tracking-[0.12em] px-1.5 py-0.5 flex-shrink-0 border"
                      style={{ color: style.color, borderColor: style.color, opacity: 0.7 }}
                    >
                      {style.label}
                    </span>
                  </div>

                  <p className="text-xs font-serif text-charcoal/50 leading-relaxed line-clamp-2">
                    {road.whatTheyMade}
                  </p>

                  <div className="border-t border-wire/50 pt-2">
                    <p className="text-xs font-serif text-charcoal/80 leading-relaxed">
                      <span className="text-muted/50">→ </span>
                      {road.theyChose}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected: "Take this direction" expand */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t border-gold/20 px-4 py-3 bg-gold/5"
                >
                  <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-gold/70 mb-1">
                    If you take this road
                  </p>
                  <p className="font-serif text-xs text-charcoal/70 leading-relaxed">
                    Commit to the specific choice {road.creator} made: focus your next work on what that decision
                    opens up rather than what it closes down. Your brief already points in this direction — this road
                    is the precedent that proves it can be done.
                  </p>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Direction summary panel when a road is selected */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5 }}
            className="border border-gold/30 bg-surface p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-gold/60">
                  Chosen direction
                </p>
                <p className="font-serif text-lg text-charcoal leading-snug">
                  {selected.title}
                </p>
                <p className="font-sans text-xs text-muted">
                  {selected.creator} · {selected.year} · {selected.medium}
                </p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/40 hover:text-muted transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-[9px] font-sans uppercase tracking-[0.15em] text-muted/60">
                  The decision they made
                </p>
                <p className="font-serif text-sm text-charcoal/80 leading-relaxed italic border-l-2 border-gold/30 pl-4">
                  {selected.theyChose}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-sans uppercase tracking-[0.15em] text-muted/60">
                  What this direction asks of you
                </p>
                <p className="font-serif text-sm text-charcoal/70 leading-relaxed">
                  Study what {selected.creator} refused — not just what they made. The refusals in your Brief should be read through this lens. Everything this work excluded is the space you are now building in.
                </p>
              </div>
            </div>

            {/* Other roads in the same medium */}
            {(() => {
              const peers = roads.filter((r) => r.medium === selected.medium && r.id !== selected.id);
              if (!peers.length) return null;
              return (
                <div className="space-y-2 pt-2 border-t border-wire">
                  <p className="text-[9px] font-sans uppercase tracking-[0.15em] text-muted/50">
                    Others in {selected.medium} working in the same territory
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {peers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedId(p.id)}
                        className="text-[9px] font-sans border border-wire px-2 py-1 text-muted/60 hover:text-charcoal hover:border-muted/30 transition-colors tracking-wide"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
