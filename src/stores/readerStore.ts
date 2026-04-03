import { create } from "zustand";
import type { Page } from "../db/types";
import { normalizeToSpreadStart } from "../utils/spreadUtils";

/**
 * Returns page indices to preload around the current page.
 * Excludes the current page itself.
 */
export function getPreloadRange(
  currentIndex: number,
  totalPages: number,
  windowSize = 2,
): number[] {
  const start = Math.max(0, currentIndex - windowSize);
  const end = Math.min(totalPages - 1, currentIndex + windowSize);
  const indices: number[] = [];
  for (let i = start; i <= end; i++) {
    if (i !== currentIndex) indices.push(i);
  }
  return indices;
}

export type ReadingMode = "single" | "continuous" | "spread";
export type ReadingDirection = "ltr" | "rtl";
export type FitMode = "best-fit" | "fit-width" | "fit-height" | "original";

interface ReaderState {
  bookId: number | null;
  pages: Page[];
  currentIndex: number;
  readingMode: ReadingMode;
  readingDirection: ReadingDirection;
  fitMode: FitMode;
  setBookId: (id: number) => void;
  setPages: (pages: Page[]) => void;
  setCurrentIndex: (index: number) => void;
  setReadingMode: (mode: ReadingMode) => void;
  setReadingDirection: (direction: ReadingDirection) => void;
  setFitMode: (mode: FitMode) => void;
  nextPage: () => void;
  prevPage: () => void;
  nextSpread: () => void;
  prevSpread: () => void;
}

export const useReaderStore = create<ReaderState>()((set) => ({
  bookId: null,
  pages: [],
  currentIndex: 0,
  readingMode: "single",
  readingDirection: "ltr",
  fitMode: "best-fit",
  setBookId: (id) => set({ bookId: id, currentIndex: 0, pages: [] }),
  setPages: (pages) => set({ pages }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setReadingMode: (mode) => set({ readingMode: mode }),
  setReadingDirection: (direction) => set({ readingDirection: direction }),
  setFitMode: (mode) => set({ fitMode: mode }),
  nextPage: () =>
    set((s) => ({
      currentIndex: Math.min(s.currentIndex + 1, s.pages.length - 1),
    })),
  prevPage: () =>
    set((s) => ({
      currentIndex: Math.max(s.currentIndex - 1, 0),
    })),
  nextSpread: () =>
    set((s) => {
      const { currentIndex, pages } = s;
      const total = pages.length;
      if (total <= 1) return s;
      if (currentIndex === 0) return { currentIndex: 1 };
      const next = normalizeToSpreadStart(currentIndex) + 2;
      if (next >= total) return s;
      return { currentIndex: next };
    }),
  prevSpread: () =>
    set((s) => {
      const { currentIndex, pages } = s;
      const total = pages.length;
      if (total <= 1 || currentIndex === 0) return s;
      if (currentIndex <= 2) return { currentIndex: 0 };
      const prev = normalizeToSpreadStart(currentIndex) - 2;
      return { currentIndex: Math.max(prev, 0) };
    }),
}));
