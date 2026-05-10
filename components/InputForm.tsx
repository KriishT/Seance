"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InputFormProps {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
}

const MAX_WORDS = 30;
const MAX_IMAGES = 4;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function InputForm({ onSubmit, loading }: InputFormProps) {
  const [description, setDescription] = useState("");
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
    imageFiles.forEach((file, i) => fd.append(`image_${i}`, file));
    onSubmit(fd);
  };

  const canSubmit = !isOver && !isEmpty && imageFiles.length > 0 && !loading;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-lg mx-auto space-y-10"
    >
      {/* Header */}
      <div className="space-y-3 text-center">
        <h1 className="text-5xl font-serif tracking-tight text-charcoal">Séance</h1>
        <p className="text-muted text-sm font-sans leading-relaxed">
          Describe your work. Upload up to 4 images.
          <br />It reads what&apos;s underneath and gives you language to own it.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-xs font-sans uppercase tracking-widest text-muted">
          Describe it — 30 words
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A fit, collection, shoot, film — whatever it is."
          rows={3}
          className="w-full bg-paper border border-border rounded-xl p-4 text-charcoal font-serif text-lg leading-relaxed resize-none placeholder:text-charcoal/20 focus:border-charcoal/20 transition-colors duration-300"
        />
        <div className="flex justify-end">
          <span
            className={`text-xs font-sans transition-colors duration-200 ${
              isOver ? "text-red-500" : wordCount > 24 ? "text-amber-600" : "text-muted"
            }`}
          >
            {wordCount > 0 && (isOver ? `${wordCount - MAX_WORDS} over` : `${MAX_WORDS - wordCount} left`)}
          </span>
        </div>
      </div>

      {/* Image upload */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label className="block text-xs font-sans uppercase tracking-widest text-muted">
            Show it
          </label>
          <span className="text-xs font-sans text-muted/50">
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 w-6 h-6 bg-paper/90 text-charcoal text-xs font-sans rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                  className="aspect-square rounded-xl border border-dashed border-border hover:border-charcoal/20 flex items-center justify-center text-muted hover:text-charcoal transition-colors duration-200"
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
            className={`border border-dashed rounded-xl transition-colors duration-300 cursor-pointer p-14 flex flex-col items-center justify-center gap-3 ${
              dragOver ? "border-lavender bg-lavender-light" : "border-border hover:border-charcoal/20"
            }`}
          >
            <span className="text-muted text-xs font-sans uppercase tracking-widest">
              Drop images or click to upload
            </span>
            <span className="text-muted/40 text-xs font-sans">jpg · png · webp · up to 4</span>
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

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={!canSubmit}
        whileTap={canSubmit ? { scale: 0.98 } : {}}
        className={`w-full py-4 rounded-xl font-sans text-sm uppercase tracking-widest transition-all duration-500 ${
          canSubmit
            ? "bg-charcoal text-paper hover:bg-charcoal/90 cursor-pointer shadow-sm"
            : "bg-border text-muted cursor-not-allowed"
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
    </motion.form>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
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
