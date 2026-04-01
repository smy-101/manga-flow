import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsState {
  libraryPath: string;
  setLibraryPath: (path: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      libraryPath: "",
      setLibraryPath: (path: string) => set({ libraryPath: path }),
    }),
    {
      name: "manga-flow-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
