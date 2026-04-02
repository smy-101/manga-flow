import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ReadingMode } from "./readerStore";

interface SettingsState {
  libraryPath: string;
  defaultReadingMode: ReadingMode;
  setLibraryPath: (path: string) => void;
  setDefaultReadingMode: (mode: ReadingMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      libraryPath: "",
      defaultReadingMode: "single" as ReadingMode,
      setLibraryPath: (path: string) => set({ libraryPath: path }),
      setDefaultReadingMode: (mode: ReadingMode) => set({ defaultReadingMode: mode }),
    }),
    {
      name: "manga-flow-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
