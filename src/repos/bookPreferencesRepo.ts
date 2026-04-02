import { getDb } from "../db/database";

export const bookPreferencesRepo = {
  async get(bookId: number) {
    const db = await getDb();
    const rows = await db.select<{
      book_id: number;
      reading_mode: string | null;
      reading_direction: string | null;
    }[]>("SELECT * FROM book_preferences WHERE book_id = $1", [bookId]);
    return rows[0];
  },

  async upsert(
    bookId: number,
    prefs: { reading_mode?: string | null; reading_direction?: string | null },
  ) {
    const db = await getDb();
    await db.execute(
      `INSERT INTO book_preferences (book_id, reading_mode, reading_direction)
       VALUES ($1, $2, $3)
       ON CONFLICT(book_id) DO UPDATE SET reading_mode = COALESCE($2, reading_mode), reading_direction = COALESCE($3, reading_direction)`,
      [bookId, prefs.reading_mode ?? null, prefs.reading_direction ?? null],
    );
  },
};
