import { getDb } from "../db/database";
import type { Page } from "../db/types";

export const pageRepo = {
  async getByChapterId(chapterId: number): Promise<Page[]> {
    const db = await getDb();
    return db.select<Page[]>(
      "SELECT * FROM pages WHERE chapter_id = $1 ORDER BY page_index",
      [chapterId],
    );
  },

  async getByBookId(bookId: number): Promise<Page[]> {
    const db = await getDb();
    return db.select<Page[]>(
      `SELECT p.* FROM pages p
       JOIN chapters c ON p.chapter_id = c.id
       WHERE c.book_id = $1
       ORDER BY c.chapter_order, p.page_index`,
      [bookId],
    );
  },

  async createBatch(chapterId: number, pages: { pageIndex: number; fileName: string; filePath: string }[]): Promise<void> {
    const db = await getDb();
    await db.execute("BEGIN");
    try {
      for (const page of pages) {
        await db.execute(
          "INSERT INTO pages (chapter_id, page_index, file_name, file_path) VALUES ($1, $2, $3, $4)",
          [chapterId, page.pageIndex, page.fileName, page.filePath],
        );
      }
      await db.execute("COMMIT");
    } catch (e) {
      await db.execute("ROLLBACK");
      throw e;
    }
  },
};
