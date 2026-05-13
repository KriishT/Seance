"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InputForm from "@/components/InputForm";
import DiagnosisReveal from "@/components/DiagnosisReveal";
import Background3D from "@/components/Background3D";
import DriftView from "@/components/DriftView";
import type { DiagnosisResult, ForkOption } from "./api/diagnose/route";
import { saveDriftSession } from "@/lib/drift";

type AppState =
  | { phase: "input" }
  | { phase: "loading" }
  | { phase: "vague"; question: string; formData: FormData }
  | { phase: "fork"; options: ForkOption[]; formData: FormData }
  | { phase: "result"; result: DiagnosisResult }
  | { phase: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<AppState>({ phase: "input" });
  const [showDrift, setShowDrift] = useState(false);
  const [lastDescription, setLastDescription] = useState("");

  async function runDiagnosis(formData: FormData) {
    const desc = formData.get("description") as string;
    if (desc) setLastDescription(desc);
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/diagnose", { method: "POST", body: formData });
      const data: DiagnosisResult & { error?: string } = await res.json();

      if (!res.ok || data.error) {
        setState({ phase: "error", message: data.error ?? "Something went wrong." });
        return;
      }

      if (data.isVague && data.vaguenessQuestion) {
        setState({ phase: "vague", question: data.vaguenessQuestion, formData });
        return;
      }

      if (data.isFork && data.forkOptions?.length) {
        setState({ phase: "fork", options: data.forkOptions, formData });
        return;
      }

      // Fetch images while still showing loading screen
      const queries = [
        ...data.mirror.nodes.map((n) => ({ id: n.id, query: n.imageQuery, kind: "mirror" as const })),
        ...data.roadsTaken.map((r) => ({ id: r.id, query: r.imageQuery, kind: "road" as const })),
      ];
      try {
        const imgRes = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queries }),
        });
        const { images } = await imgRes.json();
        const imgMap: Record<string, string | null> = {};
        images.forEach(({ id, imageUrl }: { id: string; imageUrl: string | null }) => { imgMap[id] = imageUrl; });
        data.mirror.nodes = data.mirror.nodes.map((n) => ({ ...n, imageUrl: imgMap[n.id] ?? null }));
        data.roadsTaken = data.roadsTaken.map((r) => ({ ...r, imageUrl: imgMap[r.id] ?? null }));
      } catch { /* images fail silently */ }

      saveDriftSession(data);
      setState({ phase: "result", result: data });
    } catch {
      setState({ phase: "error", message: "Could not reach the server. Please try again." });
    }
  }

  function handleReset() {
    setState({ phase: "input" });
  }

  const isResult = state.phase === "result";

  return (
    <>
      <Background3D />
      <main className="min-h-screen bg-transparent relative" style={{ zIndex: 1 }}>
        <div
          className={`mx-auto px-6 py-20 transition-all duration-700 ${
            isResult ? "max-w-5xl" : "max-w-lg"
          }`}
        >
          <AnimatePresence mode="wait">
            {/* INPUT */}
            {state.phase === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <InputForm onSubmit={runDiagnosis} loading={false} onOpenDrift={() => setShowDrift(true)} />
              </motion.div>
            )}

            {/* LOADING */}
            {state.phase === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="min-h-[80vh] flex flex-col items-center justify-center gap-3"
              >
                <motion.p
                  animate={{ opacity: [0.25, 0.9, 0.25] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-6xl font-serif italic text-charcoal/70 tracking-tight"
                >
                  Reading
                </motion.p>
                <motion.p
                  animate={{ opacity: [0.15, 0.5, 0.15] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  className="text-[9px] font-sans uppercase tracking-[0.3em] text-muted"
                >
                  decoding what&apos;s underneath
                </motion.p>
              </motion.div>
            )}

            {/* FORK */}
            {state.phase === "fork" && (
              <motion.div
                key="fork"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="min-h-[60vh] flex flex-col justify-center space-y-8"
              >
                <div className="space-y-2">
                  <p className="text-xs font-sans uppercase tracking-widest text-muted">Two directions</p>
                  <p className="text-xl font-serif text-charcoal leading-relaxed">
                    Your work points in two different directions. Which one do you want to follow?
                  </p>
                </div>
                <ForkScreen
                  options={state.options}
                  onChoose={(option) => {
                    const newFd = new FormData();
                    const existing = state.formData.get("description") as string;
                    newFd.append("description", `${existing}. Commit to this direction: ${option.name}. ${option.description}`);
                    for (let i = 0; i < 4; i++) {
                      const img = state.formData.get(`image_${i}`) as File | null;
                      if (img) newFd.append(`image_${i}`, img);
                    }
                    const friction = state.formData.get("friction") as string | null;
                    if (friction) newFd.append("friction", friction);
                    runDiagnosis(newFd);
                  }}
                  onReset={handleReset}
                />
              </motion.div>
            )}

            {/* VAGUE */}
            {state.phase === "vague" && (
              <motion.div
                key="vague"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="min-h-[60vh] flex flex-col justify-center space-y-8"
              >
                <div className="space-y-2">
                  <p className="text-xs font-sans uppercase tracking-widest text-muted">
                    Not enough to read
                  </p>
                  <p className="text-xl font-serif text-charcoal leading-relaxed">
                    {state.question}
                  </p>
                </div>
                <VaguenessForm
                  formData={state.formData}
                  onSubmit={(answer) => {
                    const newFd = new FormData();
                    const existing = state.formData.get("description") as string;
                    newFd.append("description", `${existing}. ${answer}`);
                    for (let i = 0; i < 4; i++) {
                      const img = state.formData.get(`image_${i}`) as File | null;
                      if (img) newFd.append(`image_${i}`, img);
                    }
                    runDiagnosis(newFd);
                  }}
                  onReset={handleReset}
                />
              </motion.div>
            )}

            {/* RESULT */}
            {state.phase === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DiagnosisReveal result={state.result} description={lastDescription} onReset={handleReset} />
              </motion.div>
            )}

            {/* ERROR */}
            {state.phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[60vh] flex flex-col justify-center space-y-5"
              >
                <p className="text-xs font-sans uppercase tracking-widest text-muted">
                  Something went wrong
                </p>
                <p className="font-serif text-charcoal/60 text-base leading-relaxed">
                  {state.message}
                </p>
                <button
                  onClick={handleReset}
                  className="text-xs font-sans uppercase tracking-widest text-muted hover:text-charcoal transition-colors duration-300 self-start"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {showDrift && (
        <DriftView onClose={() => setShowDrift(false)} />
      )}
    </>
  );
}

function ForkScreen({
  options,
  onChoose,
  onReset,
}: {
  options: ForkOption[];
  onChoose: (option: ForkOption) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChoose(option)}
            className="text-left bg-paper border border-border hover:border-charcoal/30 rounded-2xl p-6 space-y-2 transition-all duration-300 group"
          >
            <p className="font-serif text-lg text-charcoal group-hover:text-charcoal leading-snug">
              {option.name}
            </p>
            <p className="font-sans text-sm text-muted leading-relaxed">
              {option.description}
            </p>
            <p className="font-sans text-xs text-muted/60 italic leading-relaxed pt-1">
              Signal: {option.signal}
            </p>
          </button>
        ))}
      </div>
      <button
        onClick={onReset}
        className="text-xs font-sans uppercase tracking-widest text-muted hover:text-charcoal/50 transition-colors duration-300"
      >
        Start over
      </button>
    </div>
  );
}

function VaguenessForm({
  onSubmit,
  onReset,
}: {
  formData: FormData;
  onSubmit: (answer: string) => void;
  onReset: () => void;
}) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="space-y-5">
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Answer here..."
        rows={2}
        className="w-full bg-transparent border-0 border-b border-wire text-charcoal font-serif text-base leading-relaxed resize-none placeholder:text-muted/60 focus:border-muted/40 transition-colors duration-300 pb-3"
        autoFocus
      />
      <div className="flex gap-5">
        <button
          onClick={() => answer.trim() && onSubmit(answer.trim())}
          disabled={!answer.trim()}
          className={`text-xs font-sans uppercase tracking-widest transition-colors duration-300 ${
            answer.trim() ? "text-charcoal hover:text-charcoal/70" : "text-muted cursor-not-allowed"
          }`}
        >
          Continue
        </button>
        <button
          onClick={onReset}
          className="text-xs font-sans uppercase tracking-widest text-muted hover:text-charcoal/50 transition-colors duration-300"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
