import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../stores/settingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({ libraryPath: "", defaultReadingMode: "single", defaultReadingDirection: "ltr" });
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
});
