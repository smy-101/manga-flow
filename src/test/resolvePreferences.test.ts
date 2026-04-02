import { describe, it, expect } from "vitest";
import { resolvePreferences } from "../utils/resolvePreferences";

describe("resolvePreferences", () => {
  const globalDefaults = {
    defaultReadingMode: "single" as const,
    defaultReadingDirection: "ltr" as const,
  };

  it("uses global defaults when no book prefs", () => {
    expect(resolvePreferences(globalDefaults)).toEqual({
      readingMode: "single",
      readingDirection: "ltr",
    });
  });

  it("uses global defaults when book prefs is undefined", () => {
    expect(resolvePreferences(globalDefaults, undefined)).toEqual({
      readingMode: "single",
      readingDirection: "ltr",
    });
  });

  it("overrides with book prefs when present", () => {
    const bookPrefs = { book_id: 1, reading_mode: "continuous", reading_direction: "rtl" };
    expect(resolvePreferences(globalDefaults, bookPrefs)).toEqual({
      readingMode: "continuous",
      readingDirection: "rtl",
    });
  });

  it("falls back to global when book pref fields are null", () => {
    const bookPrefs = { book_id: 1, reading_mode: null, reading_direction: null };
    expect(resolvePreferences(globalDefaults, bookPrefs)).toEqual({
      readingMode: "single",
      readingDirection: "ltr",
    });
  });

  it("mixes null and non-null book pref fields", () => {
    const bookPrefs = { book_id: 1, reading_mode: null, reading_direction: "rtl" };
    expect(resolvePreferences(globalDefaults, bookPrefs)).toEqual({
      readingMode: "single",
      readingDirection: "rtl",
    });
  });
});
