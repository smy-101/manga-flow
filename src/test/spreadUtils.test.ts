import { describe, it, expect } from "vitest";
import {
  getSpreadPages,
  normalizeToSpreadStart,
  getPreloadRangeForSpread,
} from "../utils/spreadUtils";

describe("getSpreadPages", () => {
  it("returns [0] for cover (index 0)", () => {
    expect(getSpreadPages(0, 10)).toEqual([0]);
  });

  it("returns [1, 2] for first spread (index 1)", () => {
    expect(getSpreadPages(1, 10)).toEqual([1, 2]);
  });

  it("returns [3, 4] for second spread (index 3)", () => {
    expect(getSpreadPages(3, 10)).toEqual([3, 4]);
  });

  it("returns [9] for odd-total last page (single)", () => {
    expect(getSpreadPages(9, 10)).toEqual([9]);
  });

  it("returns [7] for even-total last page (solo)", () => {
    // 8 pages: [0] [1,2] [3,4] [5,6] [7] — last is solo
    expect(getSpreadPages(7, 8)).toEqual([7]);
  });

  it("handles 1-page book", () => {
    expect(getSpreadPages(0, 1)).toEqual([0]);
  });

  it("handles 2-page book: cover [0], then [1]", () => {
    expect(getSpreadPages(0, 2)).toEqual([0]);
    expect(getSpreadPages(1, 2)).toEqual([1]);
  });

  it("handles 3-page book: cover [0], then [1, 2]", () => {
    expect(getSpreadPages(1, 3)).toEqual([1, 2]);
  });
});

describe("normalizeToSpreadStart", () => {
  it("keeps 0 (cover)", () => {
    expect(normalizeToSpreadStart(0)).toBe(0);
  });

  it("keeps 1 (spread start)", () => {
    expect(normalizeToSpreadStart(1)).toBe(1);
  });

  it("rounds 2 down to 1 (spread right → spread start)", () => {
    expect(normalizeToSpreadStart(2)).toBe(1);
  });

  it("keeps 3 (spread start)", () => {
    expect(normalizeToSpreadStart(3)).toBe(3);
  });

  it("rounds 4 down to 3", () => {
    expect(normalizeToSpreadStart(4)).toBe(3);
  });

  it("keeps odd numbers as-is", () => {
    expect(normalizeToSpreadStart(5)).toBe(5);
    expect(normalizeToSpreadStart(7)).toBe(7);
  });
});

describe("getPreloadRangeForSpread", () => {
  it("from cover preloads first spread pages", () => {
    const result = getPreloadRangeForSpread(0, 10);
    expect(result).toContain(1);
    expect(result).toContain(2);
    expect(result).toContain(3);
    expect(result).toContain(4);
  });

  it("from middle spread preloads adjacent spreads", () => {
    const result = getPreloadRangeForSpread(3, 10);
    // Should include pages from spread before (1,2) and spreads after (5,6,7,8)
    expect(result).toContain(1);
    expect(result).toContain(2);
    expect(result).toContain(5);
    expect(result).toContain(6);
    // Does not include current spread pages (3,4) or far pages
    expect(result).not.toContain(3);
    expect(result).not.toContain(4);
  });

  it("from last spread does not exceed bounds", () => {
    const result = getPreloadRangeForSpread(9, 10);
    // Preload spreads before: [5,6] and [7,8]
    expect(result).toContain(5);
    expect(result).toContain(6);
    expect(result).toContain(7);
    expect(result).toContain(8);
    expect(result).not.toContain(9);
    expect(result).not.toContain(10);
  });

  it("excludes pages within current spread", () => {
    const result = getPreloadRangeForSpread(1, 10);
    expect(result).not.toContain(1);
    expect(result).not.toContain(2);
  });
});
