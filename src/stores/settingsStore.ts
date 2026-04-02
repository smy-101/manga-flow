import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ReadingMode, ReadingDirection } from "./readerStore";

interface SettingsState {
  libraryPath: string;
  defaultReadingMode: ReadingMode;
  defaultReadingDirection: ReadingDirection;
  setLibraryPath: (path: string) => void;
  setDefaultReadingMode: (mode: ReadingMode) => void;
  setDefaultReadingDirection: (direction: ReadingDirection) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      libraryPath: "",
      defaultReadingMode: "single" as ReadingMode,
      defaultReadingDirection: "ltr" as ReadingDirection,
      setLibraryPath: (path: string) => set({ libraryPath: path }),
      setDefaultReadingMode: (mode: ReadingMode) => set({ defaultReadingMode: mode }),
      setDefaultReadingDirection: (direction: ReadingDirection) => set({ defaultReadingDirection: direction }),
    }),
    {
      name: "manga-flow-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
