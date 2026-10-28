/**
 * Small key/value store for app-level flags that aren't a clothing item or
 * an outfit — currently just the first-run onboarding flag. Deliberately a
 * generic `app_meta` table (key/value) rather than a one-off boolean column
 * so future flags don't need another schema migration.
 */
import { db } from '../db/client';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

async function getMeta(key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?;', [key]);
  return row?.value ?? null;
}

async function setMeta(key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [key, value],
  );
}

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await getMeta(ONBOARDING_COMPLETE_KEY);
  return value === '1';
}

export async function setOnboardingComplete(): Promise<void> {
  await setMeta(ONBOARDING_COMPLETE_KEY, '1');
}
