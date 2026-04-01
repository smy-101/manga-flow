import { describe, it, expect, beforeEach } from "vitest";
import { useReaderStore } from "../stores/readerStore";
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
});
