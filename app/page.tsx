"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InputForm from "@/components/InputForm";
import DiagnosisReveal from "@/components/DiagnosisReveal";
import Background3D from "@/components/Background3D";
import type { DiagnosisResult } from "./api/diagnose/route";

type AppState =
  | { phase: "input" }
  | { phase: "loading" }
  | { phase: "vague"; question: string; formData: FormData }
  | { phase: "result"; result: DiagnosisResult }
  | { phase: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<AppState>({ phase: "input" });

  async function runDiagnosis(formData: FormData) {
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
            isResult ? "max-w-2xl" : "max-w-lg"
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
                <InputForm onSubmit={runDiagnosis} loading={false} />
              </motion.div>
            )}

            {/* LOADING */}
            {state.phase === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[60vh] flex flex-col items-center justify-center gap-6"
              >
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-2xl font-serif italic text-charcoal/60"
                >
                  Reading
                </motion.p>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 bg-lavender rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>
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
                <DiagnosisReveal result={state.result} onReset={handleReset} />
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
    </>
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
        className="w-full bg-paper border border-border rounded-xl p-4 text-charcoal font-serif text-base leading-relaxed resize-none placeholder:text-charcoal/20 focus:border-charcoal/20 transition-colors duration-300"
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
