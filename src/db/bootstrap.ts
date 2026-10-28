/**
 * Runs schema creation once at app start and exposes a `ready`/`error` pair
 * so the root layout can show a splash state instead of a blank screen while
 * SQLite initializes.
 */
import { useEffect, useState } from 'react';

import { db } from './client';
import { COLUMN_MIGRATIONS, SCHEMA_STATEMENTS } from './schema';

interface TableInfoRow {
  name: string;
}

/** Adds `column` to `table` only if it doesn't already exist — safe to call every launch. */
async function ensureColumn(table: string, column: string, definition: string): Promise<void> {
  const existing = await db.getAllAsync<TableInfoRow>(`PRAGMA table_info(${table});`);
  const hasColumn = existing.some((row) => row.name === column);
  if (hasColumn) return;
  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
}

export function useLocalDbBootstrap(): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        for (const statement of SCHEMA_STATEMENTS) {
          await db.execAsync(statement);
        }
        for (const migration of COLUMN_MIGRATIONS) {
          await ensureColumn(migration.table, migration.column, migration.definition);
        }
        if (!cancelled) setReady(true);
      } catch (cause: unknown) {
        if (!cancelled) {
          const message = cause instanceof Error ? cause.message : 'Unknown database error';
          setError(message);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}
