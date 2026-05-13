"use client";

import { motion } from "framer-motion";
import type { MirrorNode } from "@/app/api/diagnose/route";

interface MirrorActProps {
  nodes: MirrorNode[];
}

const NODE_ACCENTS = [
  { bg: "bg-lavender-light", border: "border-lavender", dot: "bg-lavender" },
  { bg: "bg-rose-light", border: "border-rose", dot: "bg-rose" },
  { bg: "bg-sage-light", border: "border-sage", dot: "bg-sage" },
  { bg: "bg-amber-light", border: "border-amber", dot: "bg-amber" },
  { bg: "bg-lavender-light", border: "border-lavender", dot: "bg-lavender" },
];

export default function MirrorAct({ nodes }: MirrorActProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="space-y-8"
    >
      <div className="space-y-1">
        <p className="text-xs font-sans uppercase tracking-widest text-muted">
          The Mirror
        </p>
        <p className="text-charcoal/50 font-serif text-base">
          The cultural currents underneath your work.
        </p>
      </div>

      {/* Nodes */}
      <div className="space-y-5">
        {nodes.map((node, i) => {
          const accent = NODE_ACCENTS[i % NODE_ACCENTS.length];
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={`${accent.bg} border ${accent.border} rounded-2xl overflow-hidden`}
            >
              <div className="flex gap-0">
                {/* Archival image strip */}
                {node.imageUrl && (
                  <div className="w-28 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={node.imageUrl}
                      alt={node.name}
                      className="w-full h-full object-cover opacity-80"
                      style={{ minHeight: "140px" }}
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                    />
                  </div>
                )}
                {/* Content */}
                <div className="flex-1 p-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${accent.dot}`} />
                    <div>
                      <p className="font-serif text-base font-medium text-charcoal leading-tight">
                        {node.name}
                      </p>
                      <p className="text-xs font-sans text-muted mt-0.5">{node.era}</p>
                    </div>
                  </div>
                  <p className="font-serif text-sm leading-relaxed text-charcoal/80">
                    {node.paragraph}
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
