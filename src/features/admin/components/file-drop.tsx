"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  onFile: (file: File | null) => void;
};

function sizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}

export function FileDrop({ id, label, hint, accept, file, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick(next: FileList | null) {
    onFile(next && next.length > 0 ? next[0] : null);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-muted">
        {label}
      </label>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pick(event.dataTransfer.files);
        }}
        className={cn(
          "border border-dashed border-line p-4 transition-colors duration-150",
          dragging && "border-accent bg-accent/5",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => pick(event.target.files)}
        />

        {file ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm">{file.name}</p>
              <p className="text-[11px] text-muted">{sizeLabel(file.size)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs text-muted underline underline-offset-4 hover:text-fg"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={() => onFile(null)}
                className="text-xs text-muted underline underline-offset-4 hover:text-red-700"
              >
                Remover
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Arraste o arquivo aqui</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="border border-line px-3 py-2 text-xs transition-colors duration-150 hover:border-fg"
            >
              Escolher arquivo
            </button>
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}
