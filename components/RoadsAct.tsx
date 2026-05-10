"use client";

import { motion } from "framer-motion";
import type { RoadEntry } from "@/app/api/diagnose/route";

interface RoadsActProps {
  roads: RoadEntry[];
}

const MEDIUM_STYLES: Record<RoadEntry["medium"], { label: string; bg: string; text: string }> = {
  "visual art": { label: "Visual Art", bg: "bg-rose-light", text: "text-rose-700" },
  music: { label: "Music", bg: "bg-lavender-light", text: "text-purple-700" },
  film: { label: "Film", bg: "bg-sage-light", text: "text-green-700" },
  fashion: { label: "Fashion", bg: "bg-amber-light", text: "text-amber-700" },
  "writing/zine": { label: "Writing / Zine", bg: "bg-rose-light", text: "text-rose-700" },
};

export default function RoadsAct({ roads }: RoadsActProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="space-y-8"
    >
      <div className="space-y-1">
        <p className="text-xs font-sans uppercase tracking-widest text-muted">
          The Roads Taken
        </p>
        <p className="text-charcoal/50 font-serif text-base">
          Works across mediums that operated in the same aesthetic tension and resolved it differently.
          Each one made a choice you haven&apos;t made yet.
        </p>
      </div>

      <div className="space-y-4">
        {roads.map((road, i) => {
          const style = MEDIUM_STYLES[road.medium] ?? MEDIUM_STYLES["visual art"];
          return (
            <motion.div
              key={road.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: i * 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="bg-paper border border-border rounded-2xl overflow-hidden flex gap-0"
            >
              {/* Image */}
              {road.imageUrl && (
                <div className="w-24 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={road.imageUrl}
                    alt={road.title}
                    className="w-full h-full object-cover"
                    style={{ minHeight: "120px" }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-base font-medium text-charcoal leading-tight">
                      {road.title}
                    </p>
                    <p className="text-xs font-sans text-muted mt-0.5">
                      {road.creator}, {road.year}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-sans uppercase tracking-widest px-2 py-1 rounded-full flex-shrink-0 ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                </div>

                <p className="text-sm font-serif text-charcoal/70 leading-relaxed">
                  {road.whatTheyMade}
                </p>

                {/* The key line */}
                <div className="border-t border-border pt-3">
                  <p className="text-sm font-serif text-charcoal leading-relaxed">
                    <span className="text-muted">→ </span>
                    {road.theyChose}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
