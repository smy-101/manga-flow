import { create } from "zustand";
import type { Page } from "../db/types";

interface ReaderState {
  bookId: number | null;
  pages: Page[];
  currentIndex: number;
  setBookId: (id: number) => void;
  setPages: (pages: Page[]) => void;
  setCurrentIndex: (index: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export const useReaderStore = create<ReaderState>()((set) => ({
  bookId: null,
  pages: [],
  currentIndex: 0,
  setBookId: (id) => set({ bookId: id, currentIndex: 0 }),
  setPages: (pages) => set({ pages }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  nextPage: () =>
    set((s) => ({
      currentIndex: Math.min(s.currentIndex + 1, s.pages.length - 1),
    })),
  prevPage: () =>
    set((s) => ({
      currentIndex: Math.max(s.currentIndex - 1, 0),
    })),
}));
