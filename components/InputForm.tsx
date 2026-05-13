"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InputFormProps {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
  onOpenDrift?: () => void;
}

const MAX_WORDS = 30;
const MAX_IMAGES = 4;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function InputForm({ onSubmit, loading, onOpenDrift }: InputFormProps) {
  const [description, setDescription] = useState("");
  const [friction, setFriction] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = countWords(description);
  const isOver = wordCount > MAX_WORDS;
  const isEmpty = description.trim().length === 0;

  const addImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFiles((prev) => {
      if (prev.length >= MAX_IMAGES) return prev;
      const reader = new FileReader();
      reader.onload = (e) =>
        setImagePreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(file);
      return [...prev, file];
    });
  }, []);

  const removeImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      Array.from(e.dataTransfer.files).forEach((f) => addImage(f));
    },
    [addImage]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOver || isEmpty || imageFiles.length === 0 || loading) return;
    const fd = new FormData();
    fd.append("description", description.trim());
    if (friction.trim()) fd.append("friction", friction.trim());
    imageFiles.forEach((file, i) => fd.append(`image_${i}`, file));
    onSubmit(fd);
  };

  const canSubmit = !isOver && !isEmpty && imageFiles.length > 0 && !loading;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Corner metadata */}
      <div className="flex justify-between items-start mb-16">
        <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/50">
          Creative diagnosis
        </p>
        <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/50">
          2026
        </p>
      </div>

      {/* Hero headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mb-3"
      >
        <h1 className="text-[88px] leading-none font-serif tracking-tight text-charcoal text-center">
          Séance
        </h1>
      </motion.div>

      {/* Thin rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-px bg-border mb-10 origin-left"
      />

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="text-center text-muted text-sm font-sans font-light leading-relaxed tracking-wide mb-12"
      >
        Upload your work. Describe it in thirty words.
        <br />
        It reads what&apos;s underneath.
      </motion.p>

      <div className="space-y-10">
        {/* Description */}
        <div className="space-y-3">
          <label className="block text-[9px] font-sans uppercase tracking-[0.2em] text-muted/70">
            Describe it
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A fit, collection, shoot, film. Whatever it is."
            rows={3}
            className="w-full bg-transparent border-0 border-b border-border text-charcoal font-serif text-lg leading-relaxed resize-none placeholder:text-muted/60 focus:border-gold/50 transition-colors duration-500 pb-3"
          />
          <div className="flex justify-end">
            <span
              className={`text-[10px] font-sans tracking-wide transition-colors duration-200 ${
                isOver ? "text-rose" : wordCount > 24 ? "text-amber" : "text-muted/70"
              }`}
            >
              {wordCount > 0 && (isOver ? `${wordCount - MAX_WORDS} over` : `${MAX_WORDS - wordCount} remaining`)}
            </span>
          </div>
        </div>

        {/* Friction */}
        <div className="space-y-3">
          <label className="block text-[9px] font-sans uppercase tracking-[0.2em] text-muted/70">
            What bothers you about it{" "}
            <span className="text-muted/40 normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            value={friction}
            onChange={(e) => setFriction(e.target.value)}
            placeholder="The thing that isn't working yet."
            rows={2}
            className="w-full bg-transparent border-0 border-b border-border text-charcoal font-serif text-base leading-relaxed resize-none placeholder:text-muted/60 focus:border-gold/50 transition-colors duration-500 pb-3"
          />
        </div>

        {/* Image upload */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <label className="block text-[9px] font-sans uppercase tracking-[0.2em] text-muted/70">
              Show it
            </label>
            <span className="text-[9px] font-sans text-muted/40 tracking-wide">
              {imageFiles.length} / {MAX_IMAGES}
            </span>
          </div>

          <AnimatePresence>
            {imagePreviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-2"
              >
                {imagePreviews.map((src, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="relative group aspect-square overflow-hidden border border-wire"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 w-5 h-5 bg-void/80 text-charcoal text-[10px] font-sans flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-wire"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
                {imageFiles.length < MAX_IMAGES && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border border-dashed border-wire/50 hover:border-muted/50 flex items-center justify-center text-muted/40 hover:text-muted transition-colors duration-300"
                  >
                    <span className="text-2xl font-light">+</span>
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {imagePreviews.length === 0 && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed transition-colors duration-300 cursor-pointer py-12 flex flex-col items-center justify-center gap-3 ${
                dragOver ? "border-gold/40 bg-gold/5" : "border-wire/50 hover:border-muted/30"
              }`}
            >
              <span className="text-muted/50 text-[9px] font-sans uppercase tracking-[0.2em]">
                Drop images or click to upload
              </span>
              <span className="text-muted/50 text-[9px] font-sans tracking-wide">jpg · png · webp · up to 4</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => {
              Array.from(e.target.files ?? []).forEach((f) => addImage(f));
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>

        {/* Drift history */}
        {onOpenDrift && <DriftButton onOpen={onOpenDrift} />}

        {/* CTA */}
        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileTap={canSubmit ? { scale: 0.99 } : {}}
          className={`w-full py-4 font-sans text-[10px] uppercase tracking-[0.25em] transition-all duration-500 border ${
            canSubmit
              ? "border-charcoal/40 text-charcoal hover:border-gold hover:text-gold cursor-pointer"
              : "border-wire/40 text-muted/40 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="inline-flex items-center gap-3">
              <LoadingDots />
              Reading
            </span>
          ) : (
            "Begin the reading"
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}

function DriftButton({ onOpen }: { onOpen: () => void }) {
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("seance_sessions");
      const sessions = raw ? JSON.parse(raw) : [];
      setHasHistory(sessions.length >= 3);
    } catch {
      setHasHistory(false);
    }
  }, []);

  if (!hasHistory) return null;

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onOpen}
        className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/40 hover:text-muted transition-colors duration-300"
      >
        Your drift
      </button>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 bg-current rounded-full inline-block"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}
