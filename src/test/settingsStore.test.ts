import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../stores/settingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({ libraryPath: "", defaultReadingMode: "single", defaultReadingDirection: "ltr", defaultFitMode: "best-fit" });
  });

  it("has empty string as default libraryPath", () => {
    expect(useSettingsStore.getState().libraryPath).toBe("");
  });

  it("updates libraryPath via setLibraryPath", () => {
    useSettingsStore.getState().setLibraryPath("/test/path");
    expect(useSettingsStore.getState().libraryPath).toBe("/test/path");
  });

  it("can clear libraryPath", () => {
    useSettingsStore.getState().setLibraryPath("/test/path");
    useSettingsStore.getState().setLibraryPath("");
    expect(useSettingsStore.getState().libraryPath).toBe("");
  });

  describe("defaultReadingMode", () => {
    it('defaults to "single"', () => {
      expect(useSettingsStore.getState().defaultReadingMode).toBe("single");
    });

    it("updates via setDefaultReadingMode", () => {
      useSettingsStore.getState().setDefaultReadingMode("continuous");
      expect(useSettingsStore.getState().defaultReadingMode).toBe("continuous");
    });

    it("can switch back to single mode", () => {
      useSettingsStore.getState().setDefaultReadingMode("continuous");
      useSettingsStore.getState().setDefaultReadingMode("single");
      expect(useSettingsStore.getState().defaultReadingMode).toBe("single");
    });

    it('accepts "spread" as a valid mode', () => {
      useSettingsStore.getState().setDefaultReadingMode("spread");
      expect(useSettingsStore.getState().defaultReadingMode).toBe("spread");
    });
  });

  describe("defaultReadingDirection", () => {
    it('defaults to "ltr"', () => {
      expect(useSettingsStore.getState().defaultReadingDirection).toBe("ltr");
    });

    it("updates via setDefaultReadingDirection", () => {
      useSettingsStore.getState().setDefaultReadingDirection("rtl");
      expect(useSettingsStore.getState().defaultReadingDirection).toBe("rtl");
    });

    it("can switch back to ltr", () => {
      useSettingsStore.getState().setDefaultReadingDirection("rtl");
      useSettingsStore.getState().setDefaultReadingDirection("ltr");
      expect(useSettingsStore.getState().defaultReadingDirection).toBe("ltr");
    });
  });

  describe("defaultFitMode", () => {
    it('defaults to "best-fit"', () => {
      expect(useSettingsStore.getState().defaultFitMode).toBe("best-fit");
    });

    it("updates via setDefaultFitMode", () => {
      useSettingsStore.getState().setDefaultFitMode("fit-width");
      expect(useSettingsStore.getState().defaultFitMode).toBe("fit-width");
    });

    it("accepts all valid fit modes", () => {
      for (const mode of ["best-fit", "fit-width", "fit-height", "original"] as const) {
        useSettingsStore.getState().setDefaultFitMode(mode);
        expect(useSettingsStore.getState().defaultFitMode).toBe(mode);
      }
    });
  });
});
