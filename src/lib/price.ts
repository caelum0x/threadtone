/**
 * Parses a free-typed price string into a number, handling both US
 * ("1,234.56") and European ("1.234,56" / "19,99") decimal conventions.
 *
 * The naive `Number.parseFloat(text.replace(',', '.'))` approach used to
 * live inline in item/new.tsx and item/[id].tsx assumed every comma is a
 * European decimal separator. That silently corrupts any US-style price
 * that already has a thousands comma: "1,234.56" (a real $1,234.56 coat)
 * becomes "1.234.56", which `parseFloat` reads only up to the second dot —
 * 1.234 — stored and shown as roughly 1/1000th of the real price, with no
 * validation error, because 1.234 is still a finite, non-negative number.
 * Same corruption for a plain thousands-only price like "2,500" -> 2.5.
 */
export function parsePriceInput(rawText: string): number {
  const text = rawText.trim();
  if (text.length === 0) return Number.NaN;

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    // Both separators present: whichever comes last is the real decimal
    // separator ("1,234.56" -> '.', "1.234,56" -> ','); every earlier
    // occurrence of either character is a thousands separator and is
    // stripped before parsing.
    const decimalIsComma = lastComma > lastDot;
    const thousandsChar = decimalIsComma ? '.' : ',';
    const withoutThousands = text.split(thousandsChar).join('');
    const normalized = decimalIsComma ? withoutThousands.replace(',', '.') : withoutThousands;
    return Number.parseFloat(normalized);
  }

  if (lastComma !== -1) {
    // Only commas: exactly 3 trailing digits reads as a thousands group
    // ("1,234" means 1234 — a price can't have 3 decimal places), 1-2
    // trailing digits reads as a European decimal separator ("19,99").
    const trailingDigits = text.length - lastComma - 1;
    const normalized = trailingDigits === 3 ? text.replace(/,/g, '') : text.replace(',', '.');
    return Number.parseFloat(normalized);
  }

  return Number.parseFloat(text);
}
