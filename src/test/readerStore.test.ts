import { describe, it, expect, beforeEach } from "vitest";
import { useReaderStore, getPreloadRange } from "../stores/readerStore";
import type { Page } from "../db/types";

const mockPages: Page[] = [
  { id: 1, chapter_id: 1, page_index: 1, file_name: "001.jpg", file_path: "/books/uuid/pages/001.jpg" },
  { id: 2, chapter_id: 1, page_index: 2, file_name: "002.jpg", file_path: "/books/uuid/pages/002.jpg" },
  { id: 3, chapter_id: 1, page_index: 3, file_name: "003.jpg", file_path: "/books/uuid/pages/003.jpg" },
];

describe("useReaderStore", () => {
  beforeEach(() => {
    useReaderStore.setState({
      bookId: null,
      pages: [],
      currentIndex: 0,
      readingMode: "single",
      readingDirection: "ltr",
    });
  });

  it("has correct initial state", () => {
    const state = useReaderStore.getState();
    expect(state.bookId).toBeNull();
    expect(state.pages).toEqual([]);
    expect(state.currentIndex).toBe(0);
  });

  it("sets bookId and resets currentIndex", () => {
    useReaderStore.getState().setPages(mockPages);
    useReaderStore.getState().setCurrentIndex(2);

    useReaderStore.getState().setBookId(42);
    expect(useReaderStore.getState().bookId).toBe(42);
    expect(useReaderStore.getState().currentIndex).toBe(0);
  });

  it("navigates to next page via nextPage", () => {
    useReaderStore.getState().setPages(mockPages);
    useReaderStore.getState().nextPage();
    expect(useReaderStore.getState().currentIndex).toBe(1);
  });

  it("clamps nextPage at last page", () => {
    useReaderStore.getState().setPages(mockPages);
    useReaderStore.getState().setCurrentIndex(2);
    useReaderStore.getState().nextPage();
    expect(useReaderStore.getState().currentIndex).toBe(2);
  });

  it("navigates to previous page via prevPage", () => {
    useReaderStore.getState().setPages(mockPages);
    useReaderStore.getState().setCurrentIndex(2);
    useReaderStore.getState().prevPage();
    expect(useReaderStore.getState().currentIndex).toBe(1);
  });

  it("clamps prevPage at first page", () => {
    useReaderStore.getState().setPages(mockPages);
    useReaderStore.getState().prevPage();
    expect(useReaderStore.getState().currentIndex).toBe(0);
  });

  it("sets pages directly", () => {
    useReaderStore.getState().setPages(mockPages);
    expect(useReaderStore.getState().pages).toEqual(mockPages);
  });

  it("defaults readingMode to single", () => {
    expect(useReaderStore.getState().readingMode).toBe("single");
  });

  it("switches readingMode via setReadingMode", () => {
    useReaderStore.getState().setReadingMode("continuous");
    expect(useReaderStore.getState().readingMode).toBe("continuous");
    useReaderStore.getState().setReadingMode("single");
    expect(useReaderStore.getState().readingMode).toBe("single");
  });

  it('defaults readingDirection to "ltr"', () => {
    expect(useReaderStore.getState().readingDirection).toBe("ltr");
  });

  it("switches readingDirection via setReadingDirection", () => {
    useReaderStore.getState().setReadingDirection("rtl");
    expect(useReaderStore.getState().readingDirection).toBe("rtl");
    useReaderStore.getState().setReadingDirection("ltr");
    expect(useReaderStore.getState().readingDirection).toBe("ltr");
  });
});

describe("getPreloadRange", () => {
  it("returns surrounding pages with default window 2", () => {
    expect(getPreloadRange(5, 10)).toEqual([3, 4, 6, 7]);
  });

  it("clamps to lower bound at start of book", () => {
    expect(getPreloadRange(0, 10)).toEqual([1, 2]);
  });

  it("clamps to upper bound at end of book", () => {
    expect(getPreloadRange(9, 10)).toEqual([7, 8]);
  });

  it("returns empty when only one page", () => {
    expect(getPreloadRange(0, 1)).toEqual([]);
  });

  it("handles page 1 of small book", () => {
    expect(getPreloadRange(1, 3)).toEqual([0, 2]);
  });

  it("respects custom window size", () => {
    expect(getPreloadRange(5, 10, 1)).toEqual([4, 6]);
  });

  it("handles window larger than available pages", () => {
    expect(getPreloadRange(2, 4, 5)).toEqual([0, 1, 3]);
  });

  it("returns symmetric range regardless of reading direction (RTL does not affect preload)", () => {
    // Preload range is symmetric ±windowSize and does not change with RTL
    expect(getPreloadRange(5, 10)).toEqual([3, 4, 6, 7]);
    expect(getPreloadRange(0, 10)).toEqual([1, 2]);
    expect(getPreloadRange(9, 10)).toEqual([7, 8]);
  });
});
