import { describe, it, expect } from "vitest";
import { resolvePreferences } from "../utils/resolvePreferences";

describe("resolvePreferences", () => {
  const globalDefaults = {
    defaultReadingMode: "single" as const,
    defaultReadingDirection: "ltr" as const,
    defaultFitMode: "best-fit" as const,
  };

  it("uses global defaults when no book prefs", () => {
    expect(resolvePreferences(globalDefaults)).toEqual({
      readingMode: "single",
      readingDirection: "ltr",
      fitMode: "best-fit",
    });
  });

  it("uses global defaults when book prefs is undefined", () => {
    expect(resolvePreferences(globalDefaults, undefined)).toEqual({
      readingMode: "single",
      readingDirection: "ltr",
      fitMode: "best-fit",
    });
  });

  it("overrides with book prefs when present", () => {
    const bookPrefs = { book_id: 1, reading_mode: "continuous", reading_direction: "rtl", fit_mode: "fit-width" };
    expect(resolvePreferences(globalDefaults, bookPrefs)).toEqual({
      readingMode: "continuous",
      readingDirection: "rtl",
      fitMode: "fit-width",
    });
  });

  it("falls back to global when book pref fields are null", () => {
    const bookPrefs = { book_id: 1, reading_mode: null, reading_direction: null, fit_mode: null };
    expect(resolvePreferences(globalDefaults, bookPrefs)).toEqual({
      readingMode: "single",
      readingDirection: "ltr",
      fitMode: "best-fit",
    });
  });

  it("mixes null and non-null book pref fields", () => {
    const bookPrefs = { book_id: 1, reading_mode: null, reading_direction: "rtl", fit_mode: null };
    expect(resolvePreferences(globalDefaults, bookPrefs)).toEqual({
      readingMode: "single",
      readingDirection: "rtl",
      fitMode: "best-fit",
    });
  });

  it("overrides fitMode with book pref while keeping other defaults", () => {
    const bookPrefs = { book_id: 1, reading_mode: null, reading_direction: null, fit_mode: "original" };
    expect(resolvePreferences(globalDefaults, bookPrefs)).toEqual({
      readingMode: "single",
      readingDirection: "ltr",
      fitMode: "original",
    });
  });

  it("uses global defaultFitMode when book fit_mode is null", () => {
    const defaults = { ...globalDefaults, defaultFitMode: "fit-height" as const };
    const bookPrefs = { book_id: 1, reading_mode: null, reading_direction: null, fit_mode: null };
    expect(resolvePreferences(defaults, bookPrefs)).toEqual({
      readingMode: "single",
      readingDirection: "ltr",
      fitMode: "fit-height",
    });
  });
});
