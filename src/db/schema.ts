/**
 * SQLite schema, applied with CREATE TABLE IF NOT EXISTS at startup (see
 * bootstrap.ts). No external migration tool: table creation is a single,
 * safe-to-rerun statement list; adding a column to an existing table needs
 * its own idempotent path since SQLite has no `ADD COLUMN IF NOT EXISTS` —
 * see COLUMN_MIGRATIONS + bootstrap.ts's `ensureColumn`.
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
  `CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );`,
];

export interface ColumnMigration {
  table: string;
  column: string;
  /** Raw column definition, e.g. "INTEGER NOT NULL DEFAULT 0". */
  definition: string;
}

/**
 * Columns added after the original 2026-10-26 schema. Each is applied via
 * `ALTER TABLE ... ADD COLUMN` only when missing (see bootstrap.ts), so
 * re-running on an already-migrated device is a no-op.
 */
export const COLUMN_MIGRATIONS: ColumnMigration[] = [
  {
    table: 'items',
    column: 'archived',
    definition: "INTEGER NOT NULL DEFAULT 0",
  },
  {
    table: 'items',
    column: 'purchase_price',
    definition: 'REAL',
  },
];
