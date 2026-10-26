/**
 * Runs schema creation once at app start and exposes a `ready`/`error` pair
 * so the root layout can show a splash state instead of a blank screen while
 * SQLite initializes.
 */
import { useEffect, useState } from 'react';

import { db } from './client';
import { SCHEMA_STATEMENTS } from './schema';

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
