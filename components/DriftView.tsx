"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { loadDriftSessions, analyzeDrift } from "@/lib/drift";
import type { DriftAnalysis } from "@/lib/drift";

interface DriftViewProps {
  onClose: () => void;
}

export default function DriftView({ onClose }: DriftViewProps) {
  const [analysis, setAnalysis] = useState<DriftAnalysis | null>(null);

  useEffect(() => {
    const sessions = loadDriftSessions();
    setAnalysis(analyzeDrift(sessions));
  }, []);

  if (!analysis) return null;

  const { sessions, persistentNodes, droppedNodes, recurringRefusals, positionRefusal } = analysis;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-cream/95 backdrop-blur-sm z-50 overflow-y-auto"
    >
      <div className="max-w-lg mx-auto px-6 py-16 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-sans uppercase tracking-widest text-muted">Your drift</p>
            <p className="font-serif text-2xl text-charcoal">{sessions.length} readings</p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-sans uppercase tracking-widest text-muted hover:text-charcoal transition-colors duration-300 mt-1"
          >
            Close
          </button>
        </div>

        {sessions.length < 3 ? (
          <p className="font-serif text-charcoal/50 text-base">
            Come back after three readings. The pattern isn't visible yet.
          </p>
        ) : (
          <div className="space-y-8">

            {/* Your aesthetic position */}
            {positionRefusal && (
              <div className="bg-paper border border-border rounded-2xl p-6 space-y-3">
                <p className="text-xs font-sans uppercase tracking-widest text-muted">Your aesthetic position</p>
                <p className="font-serif text-lg text-charcoal leading-snug">{positionRefusal}</p>
                <p className="font-sans text-xs text-muted leading-relaxed">
                  This refusal has appeared in {recurringRefusals.length > 1 ? "multiple" : "every"} reading. It is not a choice you are making — it is how you see.
                </p>
              </div>
            )}

            {/* What keeps showing up */}
            {persistentNodes.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-sans uppercase tracking-widest text-muted">What keeps showing up</p>
                <div className="space-y-2">
                  {persistentNodes.map((node) => (
                    <div key={node} className="bg-lavender-light border border-lavender rounded-xl px-4 py-3">
                      <p className="font-serif text-sm text-charcoal">{node}</p>
                    </div>
                  ))}
                </div>
                <p className="font-sans text-xs text-muted">These nodes appear across multiple readings. They are not influences — they are the water you swim in.</p>
              </div>
            )}

            {/* What you are leaving behind */}
            {droppedNodes.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-sans uppercase tracking-widest text-muted">What you are leaving behind</p>
                <div className="space-y-2">
                  {droppedNodes.map((node) => (
                    <div key={node} className="bg-paper border border-border rounded-xl px-4 py-3">
                      <p className="font-serif text-sm text-charcoal/60">{node}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring refusals */}
            {recurringRefusals.length > 1 && (
              <div className="space-y-3">
                <p className="text-xs font-sans uppercase tracking-widest text-muted">Recurring refusals</p>
                <div className="space-y-2">
                  {recurringRefusals.map((r) => (
                    <div key={r} className="bg-rose-light border border-rose rounded-xl px-4 py-3">
                      <p className="font-serif text-sm text-charcoal">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session log */}
            <div className="space-y-3">
              <p className="text-xs font-sans uppercase tracking-widest text-muted">Reading log</p>
              <div className="space-y-3">
                {[...sessions].reverse().map((s) => (
                  <div key={s.id} className="border-b border-border pb-3 space-y-1">
                    <p className="font-sans text-xs text-muted">
                      {new Date(s.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="font-serif text-sm text-charcoal leading-snug">{s.mandate}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </motion.div>
  );
}
