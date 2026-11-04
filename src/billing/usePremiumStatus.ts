/**
 * Wearday Plus status for gated screens. Reads the on-device cache first
 * (src/repo/appMeta.ts) so gates render instantly and still work offline,
 * then refreshes from RevenueCat in the background — the real source of
 * truth — and keeps the cache in sync for next launch.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { getCachedPremiumActive, setCachedPremiumActive } from '../repo/appMeta';
import { PREMIUM_ENTITLEMENT_ID } from './config';
import { addCustomerInfoUpdateListener, getPremiumSnapshot, isRevenueCatAvailable } from './revenueCatService';

export interface PremiumStatus {
  /** Best-known answer right now (cache-first, then live). Never blocks the UI. */
  readonly isPremium: boolean;
  /** True only until the very first cache read resolves. */
  readonly loading: boolean;
  /** Re-pull the live entitlement from RevenueCat and refresh the cache (call after purchase/restore). */
  readonly refresh: () => Promise<boolean>;
}

export function usePremiumStatus(): PremiumStatus {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async (): Promise<boolean> => {
    const snapshot = await getPremiumSnapshot();
    await setCachedPremiumActive(snapshot.isPremium, snapshot.productId);
    if (mounted.current) setIsPremium(snapshot.isPremium);
    return snapshot.isPremium;
  }, []);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const cached = await getCachedPremiumActive();
      if (mounted.current) {
        setIsPremium(cached);
        setLoading(false);
      }
      if (isRevenueCatAvailable()) {
        await refresh();
      }
    })();

    const removeListener = addCustomerInfoUpdateListener((customerInfo) => {
      const active = Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.isActive);
      setCachedPremiumActive(active, null).catch(() => {});
      if (mounted.current) setIsPremium(active);
    });

    return () => {
      mounted.current = false;
      removeListener();
    };
  }, [refresh]);

  return { isPremium, loading, refresh };
}
