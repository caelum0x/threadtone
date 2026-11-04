/**
 * Wearday Plus — the one premium tier (see PAYWALL.md for the owner setup
 * steps this depends on). Values are read from EXPO_PUBLIC_* env vars so the
 * real RevenueCat project/product ids never have to be hardcoded here; a
 * missing key simply means "subscriptions unavailable" (see
 * src/billing/revenueCatService.ts: isRevenueCatAvailable), never a crash —
 * the rest of the app stays fully usable in free mode.
 */
import { Platform } from 'react-native';

export const PREMIUM_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'wearday_plus';

export type PremiumProductKey = 'plus_monthly' | 'plus_yearly';

export const PREMIUM_PRODUCT_IDS: Record<PremiumProductKey, string> = {
  plus_monthly: process.env.EXPO_PUBLIC_REVENUECAT_PLUS_MONTHLY_PRODUCT_ID || 'wearday_plus_monthly',
  plus_yearly: process.env.EXPO_PUBLIC_REVENUECAT_PLUS_YEARLY_PRODUCT_ID || 'wearday_plus_yearly',
};

/**
 * A RevenueCat "test store" key (test_…) only works against RevenueCat's
 * sandbox Test Store, never real App Store/Play products. Treat it as "not
 * configured" outside dev, so a store build degrades to free mode instead of
 * every offerings/purchase call throwing a raw SDK error.
 */
function isUsableApiKey(key: string | undefined): key is string {
  return typeof key === 'string' && key.length > 0 && (__DEV__ || !key.startsWith('test_'));
}

export function getRevenueCatApiKey(): string | null {
  const key =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : Platform.OS === 'android'
        ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
        : undefined;

  return isUsableApiKey(key) ? key : null;
}
