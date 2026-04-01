import { create } from "zustand";
import type { Book, ImportState } from "../db/types";

interface LibraryState {
  books: Book[];
  loading: boolean;
  importState: ImportState;
  setBooks: (books: Book[]) => void;
  setLoading: (loading: boolean) => void;
  setImportState: (state: ImportState) => void;
  removeBook: (id: number) => void;
}

export const useLibraryStore = create<LibraryState>()((set) => ({
  books: [],
  loading: false,
  importState: { status: "idle" },
  setBooks: (books) => set({ books }),
  setLoading: (loading) => set({ loading }),
  setImportState: (importState) => set({ importState }),
  removeBook: (id) => set((s) => ({ books: s.books.filter((b) => b.id !== id) })),
}));
