import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../stores/settingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({ libraryPath: "" });
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
});
