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

  if (lastDot !== -1) {
    // Only dots: the mirror image of the comma-only case above, for the
    // European convention where '.' is the thousands separator and ','
    // is the decimal mark (so a price typed without any comma, e.g.
    // "2.500" for a real EUR2,500 item, uses '.' purely as a thousands
    // group). Falling straight through to `Number.parseFloat(text)` here
    // used to read "2.500" as 2.5 and "1.000" as 1 — the exact same
    // 1/1000th corruption already fixed above for the comma case, just
    // via the other separator. Exactly 3 trailing digits is a thousands
    // group; 1-2 trailing digits is a real US-style decimal ("19.99",
    // "1200.50"), left untouched.
    const trailingDigits = text.length - lastDot - 1;
    const normalized = trailingDigits === 3 ? text.replace(/\./g, '') : text;
    return Number.parseFloat(normalized);
  }

  return Number.parseFloat(text);
}
