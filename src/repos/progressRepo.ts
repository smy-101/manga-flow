import { getDb } from "../db/database";
import type { ReadingProgress, Book } from "../db/types";

export interface ProgressWithBook extends ReadingProgress, Pick<Book, "title" | "cover_path"> {
  total_pages: number;
}

export const progressRepo = {
  async getByBookId(bookId: number): Promise<ReadingProgress | undefined> {
    const db = await getDb();
    const rows = await db.select<ReadingProgress[]>(
      "SELECT * FROM reading_progress WHERE book_id = $1",
      [bookId],
    );
    return rows[0];
  },

  async getRecent(limit = 10): Promise<ProgressWithBook[]> {
    const db = await getDb();
    return db.select<ProgressWithBook[]>(
      `SELECT rp.*, b.title, b.cover_path, COALESCE(pc.total_pages, 0) AS total_pages
       FROM reading_progress rp
       JOIN books b ON rp.book_id = b.id
       LEFT JOIN (
         SELECT book_id, SUM(page_count) AS total_pages
         FROM chapters
         GROUP BY book_id
       ) pc ON pc.book_id = rp.book_id
       WHERE rp.is_finished = 0
       ORDER BY rp.updated_at DESC
       LIMIT $1`,
      [limit],
    );
  },

  async upsert(bookId: number, chapterId: number, pageIndex: number): Promise<void> {
    const db = await getDb();
    await db.execute(
      `INSERT INTO reading_progress (book_id, chapter_id, page_index, is_finished, updated_at)
       VALUES ($1, $2, $3, 0, datetime('now'))
       ON CONFLICT(book_id) DO UPDATE SET
         chapter_id = $2,
         page_index = $3,
         is_finished = 0,
         updated_at = datetime('now')`,
      [bookId, chapterId, pageIndex],
    );
  },

  async markFinished(bookId: number): Promise<void> {
    const db = await getDb();
    await db.execute(
      `UPDATE reading_progress SET is_finished = 1, updated_at = datetime('now') WHERE book_id = $1`,
      [bookId],
    );
  },
};
