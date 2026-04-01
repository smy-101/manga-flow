import { describe, it, expect, beforeEach } from "vitest";
import { useLibraryStore } from "../stores/libraryStore";
import type { Book } from "../db/types";

const mockBook: Book = {
  id: 1,
  title: "Test Manga",
  cover_path: "/covers/test.webp",
  source_type: "folder",
  book_uuid: "uuid-123",
  created_at: "2026-01-01",
};

describe("useLibraryStore", () => {
  beforeEach(() => {
    useLibraryStore.setState({
      books: [],
      loading: false,
      importState: { status: "idle" },
    });
  });

  it("has correct initial state", () => {
    const state = useLibraryStore.getState();
    expect(state.books).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.importState.status).toBe("idle");
  });

  it("sets books via setBooks", () => {
    useLibraryStore.getState().setBooks([mockBook]);
    expect(useLibraryStore.getState().books).toEqual([mockBook]);
  });

  it("removes a book via removeBook", () => {
    useLibraryStore.getState().setBooks([mockBook]);
    useLibraryStore.getState().removeBook(1);
    expect(useLibraryStore.getState().books).toEqual([]);
  });

  it("does not remove a non-existent book", () => {
    useLibraryStore.getState().setBooks([mockBook]);
    useLibraryStore.getState().removeBook(999);
    expect(useLibraryStore.getState().books).toEqual([mockBook]);
  });

  it("sets loading via setLoading", () => {
    useLibraryStore.getState().setLoading(true);
    expect(useLibraryStore.getState().loading).toBe(true);
  });

  it("sets importState via setImportState", () => {
    useLibraryStore.getState().setImportState({ status: "importing", message: "正在导入...", progress: 50 });
    const state = useLibraryStore.getState().importState;
    expect(state.status).toBe("importing");
    expect(state.message).toBe("正在导入...");
    expect(state.progress).toBe(50);
  });
});
