// Only calculate a USD estimate for a single, unambiguous per-person amount.
// Ranges, group prices and other currencies stay as written quotations.
export function tourPriceAmount(price: string): number | null {
  const match = price.trim().match(/^(?:from\s+)?(?:\$\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*USD)(?:\s*(?:\/\s*person|per person))?$/i);
  if (!match) return null;
  const raw = match[1] || match[2];
  if (raw.includes(',') && !/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(raw)) return null;
  const value = Number(raw.replace(/,/g, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
}
