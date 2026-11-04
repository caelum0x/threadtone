/**
 * Pure feature-gating rules for Wearday Plus. No native/network imports here
 * (deliberately — not even transitively) so the gate decisions themselves
 * stay plain, reasoned-about logic, the same discipline AGENTS.md already
 * holds src/lib/colorTheory.ts and src/lib/outfitGenerator.ts to. The actual
 * entitlement state comes from src/billing/usePremiumStatus.ts.
 *
 * The core daily loop — digitizing the closet, today's outfit suggestion,
 * shuffle, building/logging an outfit — stays free forever; these three
 * gate the deeper analysis and data-portability features.
 */

/** The wear-history analytics screen (most/least worn, cost-per-wear, closet gaps) is Plus-only. */
export function canViewInsights(isPremium: boolean): boolean {
  return isPremium;
}

/** The shopping-gaps advisor (hardest pieces to match, outfit-count math) is Plus-only. */
export function canViewShoppingGaps(isPremium: boolean): boolean {
  return isPremium;
}

/** Exporting a full backup file (src/lib/backup.ts) is Plus-only; importing one back in stays free. */
export function canExportBackup(isPremium: boolean): boolean {
  return isPremium;
}
