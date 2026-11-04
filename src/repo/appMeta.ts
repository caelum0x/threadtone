/**
 * Small key/value store for app-level flags that aren't a clothing item or
 * an outfit — currently just the first-run onboarding flag. Deliberately a
 * generic `app_meta` table (key/value) rather than a one-off boolean column
 * so future flags don't need another schema migration.
 */
import { db } from '../db/client';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';
const CURRENCY_SYMBOL_KEY = 'currency_symbol';
const DEFAULT_CURRENCY_SYMBOL = '$';
const PREMIUM_ACTIVE_KEY = 'premium_active';
const PREMIUM_PRODUCT_ID_KEY = 'premium_product_id';
const PLUS_PAYWALL_SHOWN_KEY = 'plus_paywall_shown';

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

/** Currency symbol used for cost-per-wear in Insights and the "price paid" field. */
export async function getCurrencySymbol(): Promise<string> {
  const value = await getMeta(CURRENCY_SYMBOL_KEY);
  return value ?? DEFAULT_CURRENCY_SYMBOL;
}

export async function setCurrencySymbol(symbol: string): Promise<void> {
  await setMeta(CURRENCY_SYMBOL_KEY, symbol);
}

/**
 * On-device cache of the Wearday Plus entitlement (see src/billing/). Read
 * first so gated screens render instantly offline; src/billing/usePremiumStatus.ts
 * refreshes it from RevenueCat in the background and keeps it in sync.
 */
export async function getCachedPremiumActive(): Promise<boolean> {
  const value = await getMeta(PREMIUM_ACTIVE_KEY);
  return value === '1';
}

export async function setCachedPremiumActive(active: boolean, productId: string | null): Promise<void> {
  await setMeta(PREMIUM_ACTIVE_KEY, active ? '1' : '0');
  await setMeta(PREMIUM_PRODUCT_ID_KEY, productId ?? '');
}

/**
 * Whether the automatic Wearday Plus paywall has already been shown once,
 * right after the first real outfit suggestion (the app's actual value
 * moment — see (tabs)/index.tsx). Shown to every user exactly once; after
 * that, Plus is only offered on-demand from a gated screen or the More tab.
 */
export async function isPlusPaywallShown(): Promise<boolean> {
  const value = await getMeta(PLUS_PAYWALL_SHOWN_KEY);
  return value === '1';
}

export async function setPlusPaywallShown(): Promise<void> {
  await setMeta(PLUS_PAYWALL_SHOWN_KEY, '1');
}
