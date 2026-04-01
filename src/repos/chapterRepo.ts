import { getDb } from "../db/database";
import type { Chapter } from "../db/types";

export const chapterRepo = {
  async getByBookId(bookId: number): Promise<Chapter[]> {
    const db = await getDb();
    return db.select<Chapter[]>(
      "SELECT * FROM chapters WHERE book_id = $1 ORDER BY chapter_order",
      [bookId],
    );
  },

  async create(bookId: number, title: string, chapterOrder: number, pageCount: number): Promise<number> {
    const db = await getDb();
    const result = await db.execute(
      "INSERT INTO chapters (book_id, title, chapter_order, page_count) VALUES ($1, $2, $3, $4)",
      [bookId, title, chapterOrder, pageCount],
    );
    return result.lastInsertId ?? 0;
  },

  async createBatch(bookId: number, chapters: { title: string; chapterOrder: number; pageCount: number }[]): Promise<number[]> {
    const db = await getDb();
    const ids: number[] = [];
    for (const ch of chapters) {
      const result = await db.execute(
        "INSERT INTO chapters (book_id, title, chapter_order, page_count) VALUES ($1, $2, $3, $4)",
        [bookId, ch.title, ch.chapterOrder, ch.pageCount],
      );
      ids.push(result.lastInsertId ?? 0);
    }
    return ids;
  },
};
