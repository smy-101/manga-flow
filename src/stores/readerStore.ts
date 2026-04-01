import { create } from "zustand";
import type { Page } from "../db/types";

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

export type ReadingMode = "single" | "continuous";

interface ReaderState {
  bookId: number | null;
  pages: Page[];
  currentIndex: number;
  readingMode: ReadingMode;
  setBookId: (id: number) => void;
  setPages: (pages: Page[]) => void;
  setCurrentIndex: (index: number) => void;
  setReadingMode: (mode: ReadingMode) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export const useReaderStore = create<ReaderState>()((set) => ({
  bookId: null,
  pages: [],
  currentIndex: 0,
  readingMode: "single",
  setBookId: (id) => set({ bookId: id, currentIndex: 0 }),
  setPages: (pages) => set({ pages }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setReadingMode: (mode) => set({ readingMode: mode }),
  nextPage: () =>
    set((s) => ({
      currentIndex: Math.min(s.currentIndex + 1, s.pages.length - 1),
    })),
  prevPage: () =>
    set((s) => ({
      currentIndex: Math.max(s.currentIndex - 1, 0),
    })),
}));
