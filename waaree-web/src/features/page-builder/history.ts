"use client";

import { useEffect, useRef, useState } from "react";

const MERGE_MS = 800; // typing changes closer together than this are one undo step
const LIMIT = 100;

/**
 * Undo and redo for a whole page (or custom block). `set` records a change (pass `typing` for text
 * edits: a burst of typing is merged into one step; adding, moving or removing a section never is).
 * `onJump` gets the value undo/redo moved to, so the caller can save it. Ctrl/⌘ Z and Ctrl/⌘ Shift Z (or Ctrl Y) work while
 * you’re not typing in a field (a text field keeps its own undo while you type in it).
 */
export function useUndoable<T>(initial: T, onJump: (value: T) => void) {
  const [h, setH] = useState({ past: [] as T[], present: initial, future: [] as T[] });
  const lastAt = useRef(0);

  const set = (next: T, typing = false) => {
    const now = Date.now();
    const merge = typing && now - lastAt.current < MERGE_MS && h.past.length > 0;
    lastAt.current = typing ? now : 0;
    setH(merge ? { past: h.past, present: next, future: [] } : { past: [...h.past.slice(-LIMIT), h.present], present: next, future: [] });
  };
  const undo = () => {
    const prev = h.past.at(-1);
    if (prev === undefined) return;
    lastAt.current = 0;
    setH({ past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future] });
    onJump(prev);
  };
  const redo = () => {
    const next = h.future[0];
    if (next === undefined) return;
    lastAt.current = 0;
    setH({ past: [...h.past, h.present], present: next, future: h.future.slice(1) });
    onJump(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable='true'], [contenteditable='plaintext-only']")) return; // the field’s own undo
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return { value: h.present, set, undo, redo, canUndo: h.past.length > 0, canRedo: h.future.length > 0 };
}
