import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ReadingMode, ReadingDirection, FitMode } from "./readerStore";

interface SettingsState {
  libraryPath: string;
  defaultReadingMode: ReadingMode;
  defaultReadingDirection: ReadingDirection;
  defaultFitMode: FitMode;
  setLibraryPath: (path: string) => void;
  setDefaultReadingMode: (mode: ReadingMode) => void;
  setDefaultReadingDirection: (direction: ReadingDirection) => void;
  setDefaultFitMode: (mode: FitMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      libraryPath: "",
      defaultReadingMode: "single" as ReadingMode,
      defaultReadingDirection: "ltr" as ReadingDirection,
      defaultFitMode: "best-fit" as FitMode,
      setLibraryPath: (path: string) => set({ libraryPath: path }),
      setDefaultReadingMode: (mode: ReadingMode) => set({ defaultReadingMode: mode }),
      setDefaultReadingDirection: (direction: ReadingDirection) => set({ defaultReadingDirection: direction }),
      setDefaultFitMode: (mode: FitMode) => set({ defaultFitMode: mode }),
    }),
    {
      name: "manga-flow-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
