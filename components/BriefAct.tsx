"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { DiagnosisResult } from "@/app/api/diagnose/route";

type GenerateType = "statement" | "collaborator" | "scaledown";

interface BriefActProps {
  brief: DiagnosisResult["brief"];
  result: DiagnosisResult;
  shareId?: string;
}

export default function BriefAct({ brief, result, shareId }: BriefActProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [generating, setGenerating] = useState<GenerateType | null>(null);
  const [generated, setGenerated] = useState<Partial<Record<GenerateType, string>>>({});

  const generate = async (type: GenerateType) => {
    if (generating || generated[type]) return;
    setGenerating(type);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, result }),
      });
      const data = await res.json();
      if (data.text) setGenerated((prev) => ({ ...prev, [type]: data.text }));
    } finally {
      setGenerating(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!shareId) return;
    const url = `${window.location.origin}/share/${shareId}`;
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const handleCopy = async () => {
    const text = [
      `MY NEXT WORK`,
      ``,
      brief.thingThatDoesntExist,
      ``,
      `IT INCLUDES`,
      ...brief.includes.map((s) => `· ${s}`),
      ``,
      `IT REFUSES`,
      ...brief.refusals.map((r) => `· ${r.what}\n  Because: ${r.because}`),
      ``,
      `WHY ME`,
      brief.whyYou,
      ``,
      `LINEAGE`,
      brief.provenanceNote,
    ].join("\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="space-y-8"
    >
      <div className="space-y-1">
        <p className="text-xs font-sans uppercase tracking-widest text-muted">
          The Brief
        </p>
        <p className="text-charcoal/50 font-serif text-base">
          One specific thing that doesn&apos;t exist yet. Written as a mandate you can act on today.
        </p>
      </div>

      {/* THE CARD */}
      <div
        id="brief-card"
        ref={cardRef}
        className="bg-paper border border-border rounded-2xl overflow-hidden"
      >
        {/* Header band */}
        <div className="bg-lavender-light border-b border-lavender px-8 py-6">
          <p className="text-[10px] font-sans uppercase tracking-widest text-muted mb-2">
            My next work
          </p>
          <p className="font-serif text-xl text-charcoal leading-snug">
            {brief.thingThatDoesntExist}
          </p>
        </div>

        <div className="px-8 py-6 space-y-7">
          {/* Includes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <p className="text-[10px] font-sans uppercase tracking-widest text-muted">
              It includes
            </p>
            <ul className="space-y-1.5">
              {brief.includes.map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                  <p className="font-serif text-sm text-charcoal leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Refusals — the centrepiece */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="space-y-3"
          >
            <p className="text-[10px] font-sans uppercase tracking-widest text-muted">
              It refuses
            </p>
            <div className="space-y-3">
              {brief.refusals.map((refusal, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.12 }}
                  className="bg-rose-light border border-rose rounded-xl px-4 py-3 space-y-1"
                >
                  <p className="font-serif text-sm font-medium text-charcoal leading-snug">
                    {refusal.what}
                  </p>
                  <p className="font-sans text-xs text-muted leading-relaxed">
                    Because: {refusal.because}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Why you */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="space-y-3"
          >
            <p className="text-[10px] font-sans uppercase tracking-widest text-muted">
              Why you
            </p>
            <p className="font-serif text-sm text-charcoal leading-relaxed">
              {brief.whyYou}
            </p>
          </motion.div>

          {/* Provenance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="border-t border-border pt-5 space-y-2"
          >
            <p className="text-[10px] font-sans uppercase tracking-widest text-muted">
              Lineage
            </p>
            <p className="font-sans text-xs text-charcoal/60 leading-relaxed italic">
              {brief.provenanceNote}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Generate actions — surfaced early, most immediately useful */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="space-y-3"
      >
        <GenerateBlock
          type="statement"
          label="Generate artist statement"
          description="150 words, first person, grant and portfolio ready."
          output={generated.statement}
          loading={generating === "statement"}
          onGenerate={() => generate("statement")}
        />
        <GenerateBlock
          type="collaborator"
          label="Export for collaborator"
          description="Third-person brief for a printer, gallerist, or creative director."
          output={generated.collaborator}
          loading={generating === "collaborator"}
          onGenerate={() => generate("collaborator")}
        />
        <GenerateBlock
          type="scaledown"
          label="This is too big"
          description="A weekend-sized gateway into the same project."
          output={generated.scaledown}
          loading={generating === "scaledown"}
          onGenerate={() => generate("scaledown")}
        />
      </motion.div>

      {/* Secondary actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="flex gap-4"
      >
        <button
          onClick={handleCopy}
          className="flex-1 py-3 border border-border rounded-xl text-xs font-sans uppercase tracking-widest text-muted hover:text-charcoal hover:border-charcoal/30 transition-all duration-300"
        >
          Copy as text
        </button>
        {shareId && (
          <button
            onClick={handleShare}
            className="flex-1 py-3 border border-lavender bg-lavender-light rounded-xl text-xs font-sans uppercase tracking-widest text-charcoal/70 hover:text-charcoal hover:border-lavender transition-all duration-300"
          >
            {shareCopied ? "Link copied" : "Share"}
          </button>
        )}
        <button
          onClick={handlePrint}
          className="flex-1 py-3 bg-charcoal text-paper rounded-xl text-xs font-sans uppercase tracking-widest hover:bg-charcoal/90 transition-all duration-300"
        >
          Save / Print
        </button>
      </motion.div>
    </motion.div>
  );
}

function GenerateBlock({
  label,
  description,
  output,
  loading,
  onGenerate,
}: {
  type: GenerateType;
  label: string;
  description: string;
  output?: string;
  loading: boolean;
  onGenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={onGenerate}
        disabled={loading || !!output}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-paper/60 transition-colors duration-200 disabled:cursor-default"
      >
        <div>
          <p className="text-xs font-sans uppercase tracking-widest text-charcoal/70">{label}</p>
          <p className="text-xs font-sans text-muted mt-0.5">{description}</p>
        </div>
        {loading ? (
          <span className="text-xs font-sans text-muted animate-pulse">Writing...</span>
        ) : output ? (
          <span className="text-xs font-sans text-sage">Done</span>
        ) : (
          <span className="text-xs font-sans text-muted">Generate</span>
        )}
      </button>
      {output && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border px-6 py-5 space-y-3"
        >
          <p className="font-serif text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{output}</p>
          <button
            onClick={handleCopy}
            className="text-xs font-sans uppercase tracking-widest text-muted hover:text-charcoal transition-colors duration-200"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
