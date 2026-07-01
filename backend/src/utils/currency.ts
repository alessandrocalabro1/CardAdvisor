export const EXCHANGE_RATE_EUR_TO_USD = 1.08;

/**
 * Converts a price amount from one currency to another using a static rate.
 * Supported: USD <-> EUR
 */
export function convertPrice(amount: number, from: string, to: string): number {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return amount;
  
  if (f === 'EUR' && t === 'USD') {
    return amount * EXCHANGE_RATE_EUR_TO_USD;
  }
  if (f === 'USD' && t === 'EUR') {
    return amount / EXCHANGE_RATE_EUR_TO_USD;
  }
  return amount;
}
