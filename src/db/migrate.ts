import type Database from "@tauri-apps/plugin-sql";

export async function runMigrations(db: Database): Promise<void> {
  const migrations = [MIGRATION_001_BOOK_PREFERENCES];

  for (const sql of migrations) {
    await db.execute(sql);
  }
}

const MIGRATION_001_BOOK_PREFERENCES = `
CREATE TABLE IF NOT EXISTS book_preferences (
  book_id INTEGER PRIMARY KEY,
  reading_mode TEXT,
  reading_direction TEXT,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
`;
