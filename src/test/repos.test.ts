import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Tauri invoke for bookRepo.delete
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
  convertFileSrc: (path: string) => `http://asset.localhost/${path}`,
}));

// Mock database module — each test gets a fresh mock via getDb
const mockSelect = vi.fn();
const mockExecute = vi.fn();

vi.mock("../db/database", () => ({
  getDb: vi.fn(() =>
    Promise.resolve({
      select: mockSelect,
      execute: mockExecute,
    }),
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockResolvedValue([]);
  mockExecute.mockResolvedValue({ lastInsertId: 1 });
});

describe("bookRepo", () => {
  it("getAll queries books ordered by created_at DESC", async () => {
    const books = [
      { id: 1, title: "A", cover_path: "", source_type: "folder", book_uuid: "u1", created_at: "2026-01-01" },
      { id: 2, title: "B", cover_path: "", source_type: "zip", book_uuid: "u2", created_at: "2026-01-02" },
    ];
    mockSelect.mockResolvedValue(books);

    const { bookRepo } = await import("../repos/bookRepo");
    const result = await bookRepo.getAll();

    expect(result).toEqual(books);
    expect(mockSelect).toHaveBeenCalledWith("SELECT * FROM books ORDER BY created_at DESC");
  });

  it("getById returns first matching book", async () => {
    const book = { id: 5, title: "Found", cover_path: "/c.jpg", source_type: "folder", book_uuid: "u5", created_at: "2026-01-01" };
    mockSelect.mockResolvedValue([book]);

    const { bookRepo } = await import("../repos/bookRepo");
    const result = await bookRepo.getById(5);

    expect(result).toEqual(book);
    expect(mockSelect).toHaveBeenCalledWith("SELECT * FROM books WHERE id = $1", [5]);
  });

  it("getById returns undefined when not found", async () => {
    mockSelect.mockResolvedValue([]);

    const { bookRepo } = await import("../repos/bookRepo");
    const result = await bookRepo.getById(999);

    expect(result).toBeUndefined();
  });

  it("create inserts and returns lastInsertId", async () => {
    mockExecute.mockResolvedValue({ lastInsertId: 42 });

    const { bookRepo } = await import("../repos/bookRepo");
    const id = await bookRepo.create({ title: "New", cover_path: "/c.jpg", source_type: "folder", book_uuid: "uuid-new" });

    expect(id).toBe(42);
    expect(mockExecute).toHaveBeenCalledWith(
      "INSERT INTO books (title, cover_path, source_type, book_uuid) VALUES ($1, $2, $3, $4)",
      ["New", "/c.jpg", "folder", "uuid-new"],
    );
  });

  it("create returns 0 when lastInsertId is null", async () => {
    mockExecute.mockResolvedValue({});

    const { bookRepo } = await import("../repos/bookRepo");
    const id = await bookRepo.create({ title: "X", cover_path: "", source_type: "folder", book_uuid: "u" });

    expect(id).toBe(0);
  });

  it("delete invokes Rust file cleanup then removes from DB", async () => {
    mockSelect.mockResolvedValue([{ id: 1, book_uuid: "del-uuid" }]);

    const { bookRepo } = await import("../repos/bookRepo");
    await bookRepo.delete(1, "/lib");

    const { invoke } = await import("@tauri-apps/api/core");
    expect(invoke).toHaveBeenCalledWith("delete_book_files", { libraryDir: "/lib", bookUuid: "del-uuid" });
    expect(mockExecute).toHaveBeenCalledWith("DELETE FROM books WHERE id = $1", [1]);
  });

  it("delete without libraryDir only removes DB record", async () => {
    mockSelect.mockResolvedValue([{ id: 1, book_uuid: "u" }]);

    const { bookRepo } = await import("../repos/bookRepo");
    await bookRepo.delete(1);

    const { invoke } = await import("@tauri-apps/api/core");
    expect(invoke).not.toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith("DELETE FROM books WHERE id = $1", [1]);
  });

  it("delete skips file cleanup when book has no uuid", async () => {
    mockSelect.mockResolvedValue([{ id: 1, book_uuid: "" }]);

    const { bookRepo } = await import("../repos/bookRepo");
    await bookRepo.delete(1, "/lib");

    const { invoke } = await import("@tauri-apps/api/core");
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("chapterRepo", () => {
  it("create inserts a chapter and returns its id", async () => {
    mockExecute.mockResolvedValue({ lastInsertId: 10 });

    const { chapterRepo } = await import("../repos/chapterRepo");
    const id = await chapterRepo.create(1, "第1章", 1, 10);

    expect(id).toBe(10);
    expect(mockExecute).toHaveBeenCalledWith(
      "INSERT INTO chapters (book_id, title, chapter_order, page_count) VALUES ($1, $2, $3, $4)",
      [1, "第1章", 1, 10],
    );
  });

  it("createBatch inserts multiple chapters sequentially", async () => {
    mockExecute
      .mockResolvedValueOnce({ lastInsertId: 1 })
      .mockResolvedValueOnce({ lastInsertId: 2 });

    const { chapterRepo } = await import("../repos/chapterRepo");
    const ids = await chapterRepo.createBatch(5, [
      { title: "Ch1", chapterOrder: 1, pageCount: 5 },
      { title: "Ch2", chapterOrder: 2, pageCount: 8 },
    ]);

    expect(ids).toEqual([1, 2]);
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  it("getByBookId queries chapters ordered by chapter_order", async () => {
    const chapters = [
      { id: 1, book_id: 5, title: "Ch1", chapter_order: 1, page_count: 5 },
      { id: 2, book_id: 5, title: "Ch2", chapter_order: 2, page_count: 8 },
    ];
    mockSelect.mockResolvedValue(chapters);

    const { chapterRepo } = await import("../repos/chapterRepo");
    const result = await chapterRepo.getByBookId(5);

    expect(result).toEqual(chapters);
    expect(mockSelect).toHaveBeenCalledWith(
      "SELECT * FROM chapters WHERE book_id = $1 ORDER BY chapter_order",
      [5],
    );
  });
});

describe("pageRepo", () => {
  it("createBatch inserts each page individually", async () => {
    mockExecute.mockResolvedValue({ lastInsertId: 1 });

    const { pageRepo } = await import("../repos/pageRepo");
    await pageRepo.createBatch(10, [
      { pageIndex: 1, fileName: "001.jpg", filePath: "/a/001.jpg" },
      { pageIndex: 2, fileName: "002.jpg", filePath: "/a/002.jpg" },
    ]);

    expect(mockExecute).toHaveBeenCalledWith(
      "INSERT INTO pages (chapter_id, page_index, file_name, file_path) VALUES ($1, $2, $3, $4)",
      [10, 1, "001.jpg", "/a/001.jpg"],
    );
    expect(mockExecute).toHaveBeenCalledWith(
      "INSERT INTO pages (chapter_id, page_index, file_name, file_path) VALUES ($1, $2, $3, $4)",
      [10, 2, "002.jpg", "/a/002.jpg"],
    );
  });

  it("createBatch propagates insert errors", async () => {
    mockExecute
      .mockResolvedValueOnce({ lastInsertId: 1 }) // first insert succeeds
      .mockRejectedValueOnce(new Error("DB error")); // second insert fails

    const { pageRepo } = await import("../repos/pageRepo");
    await expect(
      pageRepo.createBatch(10, [
        { pageIndex: 1, fileName: "001.jpg", filePath: "/a" },
        { pageIndex: 2, fileName: "002.jpg", filePath: "/b" },
      ]),
    ).rejects.toThrow("DB error");
  });

  it("getByChapterId queries pages ordered by page_index", async () => {
    const pages = [
      { id: 1, chapter_id: 5, page_index: 1, file_name: "001.jpg", file_path: "/a" },
      { id: 2, chapter_id: 5, page_index: 2, file_name: "002.jpg", file_path: "/b" },
    ];
    mockSelect.mockResolvedValue(pages);

    const { pageRepo } = await import("../repos/pageRepo");
    const result = await pageRepo.getByChapterId(5);

    expect(result).toEqual(pages);
    expect(mockSelect).toHaveBeenCalledWith(
      "SELECT * FROM pages WHERE chapter_id = $1 ORDER BY page_index",
      [5],
    );
  });

  it("getByBookId queries pages via JOIN across chapters", async () => {
    mockSelect.mockResolvedValue([{ id: 1 }]);

    const { pageRepo } = await import("../repos/pageRepo");
    await pageRepo.getByBookId(3);

    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("JOIN chapters c"),
      [3],
    );
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("c.book_id = $1"),
      [3],
    );
  });
});

describe("progressRepo", () => {
  it("upsert calls INSERT ON CONFLICT", async () => {
    const { progressRepo } = await import("../repos/progressRepo");
    await progressRepo.upsert(1, 10, 5);

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO reading_progress"),
      [1, 10, 5],
    );
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("ON CONFLICT(book_id)"),
      [1, 10, 5],
    );
  });

  it("getByBookId returns first matching progress", async () => {
    const progress = { book_id: 1, chapter_id: 10, page_index: 5, is_finished: 0, updated_at: "2026-01-01" };
    mockSelect.mockResolvedValue([progress]);

    const { progressRepo } = await import("../repos/progressRepo");
    const result = await progressRepo.getByBookId(1);

    expect(result).toEqual(progress);
  });

  it("getByBookId returns undefined when no progress", async () => {
    mockSelect.mockResolvedValue([]);

    const { progressRepo } = await import("../repos/progressRepo");
    const result = await progressRepo.getByBookId(999);

    expect(result).toBeUndefined();
  });

  it("markFinished calls UPDATE with is_finished = 1", async () => {
    const { progressRepo } = await import("../repos/progressRepo");
    await progressRepo.markFinished(1);

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("is_finished = 1"),
      [1],
    );
  });

  it("getRecent joins books and subqueries total pages", async () => {
    const recentData = [
      { book_id: 1, chapter_id: 10, page_index: 5, is_finished: 0, updated_at: "2026-01-01", title: "Test", cover_path: "/c.jpg", total_pages: 24 },
    ];
    mockSelect.mockResolvedValue(recentData);

    const { progressRepo } = await import("../repos/progressRepo");
    const result = await progressRepo.getRecent(10);

    expect(result).toEqual(recentData);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("JOIN books b"),
      [10],
    );
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("ORDER BY rp.updated_at DESC"),
      [10],
    );
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("is_finished = 0"),
      [10],
    );
  });
});
