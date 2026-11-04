/**
 * Thin wrapper around react-native-purchases for Wearday Plus. Wearday has
 * no accounts/auth — everything is on-device SQLite (see AGENTS.md) — so
 * RevenueCat is configured with its default anonymous app-user id (no
 * `appUserID` passed); the local device purchase/restore is the entire
 * identity model, which is exactly what the App Store/Play Store already do.
 *
 * Mirrors the portfolio's established RevenueCat + Expo pattern (see
 * ~/products/mobile/ecomoney/src/billing/revenueCatService.ts): never throw
 * out of a read path, treat a missing/sandbox key as "subscriptions
 * unavailable" rather than a hard error, and time-box non-interactive SDK
 * calls so a stalled native call can't leave the paywall spinning forever.
 */
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  LOG_LEVEL,
  type PurchasesPackage,
} from 'react-native-purchases';

import { getRevenueCatApiKey, PREMIUM_ENTITLEMENT_ID } from './config';

const REVENUECAT_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, label: string, ms: number = REVENUECAT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out. Please try again in a moment.`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const isSupportedPlatform = () => Platform.OS === 'ios' || Platform.OS === 'android';

/** True only when the platform supports RevenueCat AND a real production key is present. */
export function isRevenueCatAvailable(): boolean {
  return isSupportedPlatform() && getRevenueCatApiKey() != null;
}

export interface PlusPackage {
  readonly identifier: string;
  readonly productId: string;
  readonly priceString: string;
  readonly billingPeriod: 'monthly' | 'yearly' | 'other';
  readonly rcPackage: PurchasesPackage;
}

function billingPeriodOf(revenueCatPackage: PurchasesPackage): PlusPackage['billingPeriod'] {
  const identifier = revenueCatPackage.identifier.replace(/^\$rc_/, '');
  if (identifier === 'monthly') return 'monthly';
  if (identifier === 'annual' || identifier === 'yearly') return 'yearly';
  return 'other';
}

let configured = false;

/** Idempotent — safe to call from every screen that needs premium status. */
async function configure(): Promise<boolean> {
  if (!isRevenueCatAvailable()) return false;
  if (configured) return true;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) return false;

  const alreadyConfigured = await withTimeout(Purchases.isConfigured(), 'RevenueCat isConfigured').catch(
    () => false,
  );

  if (!alreadyConfigured) {
    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
    Purchases.configure({ apiKey });
  }

  configured = true;
  return true;
}

function hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.isActive);
}

function activeProductId(customerInfo: CustomerInfo): string | null {
  return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.productIdentifier ?? null;
}

export interface PremiumSnapshot {
  readonly isPremium: boolean;
  readonly productId: string | null;
  readonly managementUrl: string | null;
}

function snapshotOf(customerInfo: CustomerInfo): PremiumSnapshot {
  return {
    isPremium: hasPremiumEntitlement(customerInfo),
    productId: activeProductId(customerInfo),
    managementUrl: customerInfo.managementURL,
  };
}

/** Never throws — a lookup failure resolves to "not premium" so gated screens degrade to the paywall, not a crash. */
export async function getPremiumSnapshot(): Promise<PremiumSnapshot> {
  const available = await configure();
  if (!available) {
    return { isPremium: false, productId: null, managementUrl: null };
  }
  try {
    const customerInfo = await withTimeout(Purchases.getCustomerInfo(), 'RevenueCat getCustomerInfo');
    return snapshotOf(customerInfo);
  } catch {
    return { isPremium: false, productId: null, managementUrl: null };
  }
}

/** Available Wearday Plus packages from the current RevenueCat offering. Empty when unavailable or unconfigured. */
export async function getPlusPackages(): Promise<PlusPackage[]> {
  const available = await configure();
  if (!available) return [];

  try {
    const offerings = await withTimeout(Purchases.getOfferings(), 'RevenueCat getOfferings');
    const packages = offerings.current?.availablePackages ?? [];
    return packages.map((rcPackage) => ({
      identifier: rcPackage.identifier,
      productId: rcPackage.product.identifier,
      priceString: rcPackage.product.priceString,
      billingPeriod: billingPeriodOf(rcPackage),
      rcPackage,
    }));
  } catch {
    return [];
  }
}

export async function purchasePlusPackage(plusPackage: PlusPackage): Promise<PremiumSnapshot> {
  const { customerInfo } = await Purchases.purchasePackage(plusPackage.rcPackage);
  return snapshotOf(customerInfo);
}

export async function restorePurchases(): Promise<PremiumSnapshot> {
  await configure();
  const customerInfo = await withTimeout(Purchases.restorePurchases(), 'RevenueCat restorePurchases', 30_000);
  return snapshotOf(customerInfo);
}

export function isPurchaseCancelled(error: unknown): boolean {
  const code = (error as { code?: unknown; userCancelled?: unknown } | null)?.code;
  const userCancelled = (error as { userCancelled?: unknown } | null)?.userCancelled;
  return Boolean(userCancelled) || code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export function addCustomerInfoUpdateListener(listener: CustomerInfoUpdateListener): () => void {
  if (!isSupportedPlatform()) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
