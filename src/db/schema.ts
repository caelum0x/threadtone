/**
 * SQLite schema, applied with CREATE TABLE IF NOT EXISTS at startup (see
 * bootstrap.ts). No external migration tool: this app has one schema
 * version so far, and the IF NOT EXISTS guards make re-running safe.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    color_name TEXT NOT NULL,
    pattern TEXT NOT NULL DEFAULT 'solid',
    formality TEXT NOT NULL DEFAULT 'casual',
    photo_uri TEXT,
    favorite INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);`,
  `CREATE TABLE IF NOT EXISTS outfits (
    id TEXT PRIMARY KEY NOT NULL,
    item_ids TEXT NOT NULL,
    note TEXT,
    favorite INTEGER NOT NULL DEFAULT 0,
    worn_at TEXT,
    created_at TEXT NOT NULL
  );`,
];
