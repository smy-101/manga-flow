import type Database from "@tauri-apps/plugin-sql";

const migrations: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
CREATE TABLE IF NOT EXISTS book_preferences (
  book_id INTEGER PRIMARY KEY,
  reading_mode TEXT,
  reading_direction TEXT,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);`,
  },
  {
    version: 2,
    sql: `ALTER TABLE book_preferences ADD COLUMN fit_mode TEXT DEFAULT NULL;`,
  },
];

export async function runMigrations(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY
    );
  `);

  const applied = await db.select<{ version: number }[]>(
    "SELECT version FROM _migrations",
  );
  const appliedSet = new Set(applied.map((r) => r.version));

  for (const m of migrations) {
    if (appliedSet.has(m.version)) continue;
    try {
      await db.execute(m.sql);
    } catch (e) {
      // Ignore "duplicate column name" — migration already applied by old system
      if (!String(e).includes("duplicate column name")) throw e;
    }
    await db.execute("INSERT INTO _migrations (version) VALUES ($1)", [
      m.version,
    ]);
  }
}
