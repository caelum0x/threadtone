This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo run:ios            # real local iOS build (no EAS cloud build)
```

Run lint and typecheck before declaring any task done.

## Architecture

- **Local-first, zero backend.** Everything lives in on-device SQLite (`expo-sqlite`, see `src/db/`). There is no server and no account system — this mirrors ecomoney's proven pattern for this portfolio.
- **Color-theory engine is pure logic.** `src/lib/colorTheory.ts` and `src/lib/outfitGenerator.ts` have zero native imports on purpose, so the matching rules can be reasoned about (and in the future unit-tested) without booting a simulator.
- Routes live in `src/app/` (Expo Router) — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (`src/lib`, `src/db`, `src/repo`, `src/ui`) outside `src/app/`.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation) by `expo run:ios`/`expo run:android` or `expo prebuild`. Never hand-edit them; configure native behavior in `app.json`.
- No EAS cloud builds for routine verification — use `expo run:ios` locally.
