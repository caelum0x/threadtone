# Wearday Plus — paywall setup (owner action required)

The app's paywall code is fully built and wired (see "What's built" below), but it
cannot charge real money until a RevenueCat project + store products exist. This
is the same shape of owner-only blocker as the rest of the portfolio's paid
features (App Store Connect/Play Console access, 2FA, payment setup) — see
`~/products/mobile/ecomoney/PAYWALL.md` for the identical pattern used there.

## What's gated

| Feature | Free | Wearday Plus |
|---|---|---|
| Digitize closet, Today's outfit suggestion, shuffle, build/log outfits, saved looks, packing list, seasonal archive, closet browse-by-color (120 screens), backup import | ✅ | ✅ |
| Insights — most/least worn, cost-per-wear, closet gaps (`/insights`) | ❌ (paywall) | ✅ |
| Shopping-gaps advisor — hardest pieces to match, outfit-count math (`/shopping-gaps`) | ❌ (paywall) | ✅ |
| Backup export — full JSON backup with embedded photos (`/settings` → Export backup) | ❌ (paywall) | ✅ |

The core daily loop stays free forever. The paywall is shown to **every**
new user once, right after the first real outfit suggestion renders on the
Today tab — not onboarding completion, since a brand-new wardrobe has
nothing to suggest yet; the first real suggestion is this app's actual
value moment (see `src/app/(tabs)/index.tsx`). Per the owner's App Store
packaging rule ("put the paywall right after the value moment and show it
to all of them," not just the fraction who happen to tap a gated feature
later), this fires automatically once per device, is dismissable ("Not
now"), and never blocks free use. It's also shown on-demand at the moment
a user taps a gated feature, and there's a direct "Wearday Plus" row at the
top of Settings (and in the More tab, until purchased).

## Owner steps to go live

1. **Create a RevenueCat project** at app.revenuecat.com for Wearday
   (bundle id `app.threadtone.mobile` for both iOS and Android).
2. **Add an entitlement** named `wearday_plus` (or set
   `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` to whatever you name it).
3. **Create the subscription products** in App Store Connect and Play Console:
   - `wearday_plus_monthly`
   - `wearday_plus_yearly`
   (any ids work — just update `EXPO_PUBLIC_REVENUECAT_PLUS_MONTHLY_PRODUCT_ID` /
   `..._YEARLY_PRODUCT_ID` in `.env` to match if you pick different ones).
4. **Attach both products to RevenueCat's "default" offering** as packages
   (Offerings tab → add package → map to the monthly/yearly product), and
   attach both to the `wearday_plus` entitlement.
5. **Copy the public SDK keys** (RevenueCat → Project settings → API keys →
   Apple / Google public keys, start with `appl_…` / `goog_…`) into a local
   `.env` (see `.env.example`):
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
   EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
   ```
6. **Build a dev client / EAS build.** `react-native-purchases` has native
   code, so it will not work inside Expo Go — run
   `npx expo run:ios` / `npx expo run:android` locally (`npx expo prebuild`
   first regenerates `ios`/`android` with the new native dependency linked),
   after the env vars above are set.

Until step 5 is done, `isRevenueCatAvailable()` returns `false` and the app
runs entirely in free mode: the paywall still appears on schedule and gated
screens still show the "Wearday Plus" card, but the sheet shows
"Subscriptions aren't available on this build yet" instead of a broken
purchase flow — no dead-ends, no raw SDK errors (same pattern used across
the portfolio's other RevenueCat apps).

## What's built (code, not owner-blocked)

- `src/repo/appMeta.ts` — `getCachedPremiumActive`/`setCachedPremiumActive`
  (on-device entitlement cache, stored in the existing `app_meta` key/value
  table — no schema migration needed) and `isPlusPaywallShown`/
  `setPlusPaywallShown` (the automatic-prompt-once flag).
- `src/billing/config.ts` — env-driven RevenueCat keys/product ids, with a
  `test_`-key guard so a sandbox key never ships in a production build.
- `src/billing/entitlement.ts` — pure gating rules: `canViewInsights`,
  `canViewShoppingGaps`, `canExportBackup`.
- `src/billing/revenueCatService.ts` — configure/offerings/purchase/restore,
  never throws out of a read path, 15s timeout on non-interactive calls so a
  stalled network can't hang the paywall.
- `src/billing/usePremiumStatus.ts` — cache-first premium status hook used by
  every gated screen; syncs with RevenueCat in the background and on
  customer-info updates (e.g. a renewal or cancellation).
- `src/app/paywall.tsx` — the paywall screen (GlassCard/Button/icons, matches
  the rest of the app's black/white glass design), accepts `?feature=` to
  customize the headline per gate, lists live packages/prices, purchase +
  restore flows.
- Automatic trigger: `src/app/(tabs)/index.tsx` pushes to `/paywall` once,
  the first time `generateOutfits` actually returns a suggestion.
- Gates: `src/app/insights.tsx`, `src/app/shopping-gaps.tsx`,
  `src/app/settings.tsx` (Export backup row), plus a "Wearday Plus" row in
  `src/app/settings.tsx` and `src/app/(tabs)/more.tsx`.

No stubs — once the owner steps above are done, purchases/restores work
immediately with no further code changes.
