import { getDb } from "../db/database";
import type { Book } from "../db/types";
import { invoke } from "@tauri-apps/api/core";

export const bookRepo = {
  async getAll(): Promise<Book[]> {
    const db = await getDb();
    return db.select<Book[]>("SELECT * FROM books ORDER BY created_at DESC");
  },

  async getById(id: number): Promise<Book | undefined> {
    const db = await getDb();
    const rows = await db.select<Book[]>("SELECT * FROM books WHERE id = $1", [id]);
    return rows[0];
  },

  async create(book: { title: string; cover_path: string; source_type: string; book_uuid: string }): Promise<number> {
    const db = await getDb();
    const result = await db.execute(
      "INSERT INTO books (title, cover_path, source_type, book_uuid) VALUES ($1, $2, $3, $4)",
      [book.title, book.cover_path, book.source_type, book.book_uuid],
    );
    return result.lastInsertId ?? 0;
  },

  async delete(id: number, libraryDir?: string): Promise<void> {
    const db = await getDb();

    // Get book_uuid for file cleanup
    const rows = await db.select<Book[]>("SELECT * FROM books WHERE id = $1", [id]);
    const book = rows[0];

    // Delete files from disk first (before DB record is gone)
    if (book?.book_uuid && libraryDir) {
      await invoke("delete_book_files", {
        libraryDir,
        bookUuid: book.book_uuid,
      });
    }

    // Delete database records (CASCADE handles chapters, pages, reading_progress)
    await db.execute("DELETE FROM books WHERE id = $1", [id]);
  },
};
