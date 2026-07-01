import { convertPrice } from './currency';

export interface FairPriceRangeResult {
  fairLow: number;
  fairHigh: number;
  referencePrice: number;
  currency: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

/**
 * Calculates the estimated fair price range for a collectible card.
 * 
 * Rules:
 * - Prefer sold-based/processed sold-market references (PriceCharting).
 * - Use Cardmarket export as a strong EU reference.
 * - Use JustTCG as fallback/cross-check.
 * - Use manual offers as weaker signals (unless seller reliability is HIGH).
 * - Avoid using active asking prices as the sole source of value.
 */
export function calculateFairPriceRange(
  card: { name: string; cardNumber: string },
  marketPrices: { source: string; rawPrice: number | null; trendPrice: number | null; averagePrice: number | null; currency: string; dataQuality?: string; isMock?: boolean; isSeedData?: boolean }[],
  snapshots: { averagePrice: number | null; fairLow: number | null; fairHigh: number | null }[],
  offers: { price: number; shipping: number; currency: string; sellerReliability: string }[],
  targetCurrency: string = 'EUR'
): FairPriceRangeResult {
  targetCurrency = targetCurrency.toUpperCase();

  // Extract sources
  const pcPrices = marketPrices
    .filter(p => p.source === 'PRICECHARTING' && p.rawPrice !== null)
    .map(p => convertPrice(p.rawPrice!, p.currency, targetCurrency));

  const cmPrices = marketPrices
    .filter(p => p.source === 'CARDMARKET_EXPORT')
    .map(p => {
      // Prefer trendPrice, then averagePrice, then rawPrice
      const val = p.trendPrice ?? p.averagePrice ?? p.rawPrice;
      return val !== null ? convertPrice(val, p.currency, targetCurrency) : null;
    })
    .filter((v): v is number => v !== null);

  const jPrices = marketPrices
    .filter(p => p.source === 'JUSTTCG' && p.rawPrice !== null)
    .map(p => convertPrice(p.rawPrice!, p.currency, targetCurrency));

  const manualPrices = marketPrices
    .filter(p => p.source === 'MANUAL' && p.rawPrice !== null)
    .map(p => convertPrice(p.rawPrice!, p.currency, targetCurrency));

  // Also extract active offers if marked as HIGH reliability
  const reliableOfferPrices = offers
    .filter(o => o.sellerReliability === 'HIGH')
    .map(o => convertPrice(o.price + o.shipping, o.currency, targetCurrency));

  // Determine reference price
  let referencePrice = 0;
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let explanation = '';

  if (pcPrices.length > 0 && cmPrices.length > 0) {
    // Both PriceCharting and Cardmarket exist
    const pcAvg = pcPrices.reduce((a, b) => a + b, 0) / pcPrices.length;
    const cmAvg = cmPrices.reduce((a, b) => a + b, 0) / cmPrices.length;
    referencePrice = (pcAvg + cmAvg) / 2;
    confidence = 'HIGH';
    explanation = `Estimated using aggregated PriceCharting market prices (${targetCurrency} ${pcAvg.toFixed(2)}) and Cardmarket export prices (${targetCurrency} ${cmAvg.toFixed(2)}).`;
  } else if (pcPrices.length > 0) {
    // Only PriceCharting exists
    referencePrice = pcPrices.reduce((a, b) => a + b, 0) / pcPrices.length;
    confidence = 'MEDIUM';
    explanation = `Estimated using aggregated PriceCharting market prices (${targetCurrency} ${referencePrice.toFixed(2)}).`;
  } else if (cmPrices.length > 0) {
    // Only Cardmarket export exists
    referencePrice = cmPrices.reduce((a, b) => a + b, 0) / cmPrices.length;
    confidence = 'MEDIUM';
    explanation = `Estimated using Cardmarket public export trend prices (${targetCurrency} ${referencePrice.toFixed(2)}).`;
  } else if (jPrices.length > 0) {
    // Fallback to JustTCG
    referencePrice = jPrices.reduce((a, b) => a + b, 0) / jPrices.length;
    confidence = 'MEDIUM';
    explanation = `Estimated using fallback JustTCG pricing feed (${targetCurrency} ${referencePrice.toFixed(2)}).`;
  } else if (reliableOfferPrices.length > 0) {
    // Rely on highly rated user offers
    referencePrice = reliableOfferPrices.reduce((a, b) => a + b, 0) / reliableOfferPrices.length;
    confidence = 'LOW';
    explanation = `Estimated using user-verified high-reliability manual offers (${targetCurrency} ${referencePrice.toFixed(2)}).`;
  } else if (manualPrices.length > 0) {
    // Standard manual pricing
    referencePrice = manualPrices.reduce((a, b) => a + b, 0) / manualPrices.length;
    confidence = 'LOW';
    explanation = `Estimated using manually observed pricing references (${targetCurrency} ${referencePrice.toFixed(2)}).`;
  } else {
    // Look at snapshots if any historical fair ranges are saved
    const snapshotPrice = snapshots
      .map(s => s.averagePrice)
      .filter((v): v is number => v !== null);

    if (snapshotPrice.length > 0) {
      referencePrice = snapshotPrice[snapshotPrice.length - 1];
      confidence = 'LOW';
      explanation = `No active price feeds. Utilizing last recorded historical average price (${targetCurrency} ${referencePrice.toFixed(2)}).`;
    } else {
      // Absolutely no pricing signal
      return {
        fairLow: 0,
        fairHigh: 0,
        referencePrice: 0,
        currency: targetCurrency,
        confidence: 'LOW',
        explanation: 'No pricing signals or manual references found. Record a manual offer or import data to calculate a range.',
      };
    }
  }

  // Apply Data Transparency overrides
  const activePrices = marketPrices.filter(p => p.rawPrice !== null || p.averagePrice !== null || p.trendPrice !== null);
  const onlyMockOrSeed = activePrices.length > 0 && activePrices.every(p => p.isMock || p.isSeedData || p.dataQuality === 'SEED_SAMPLE' || p.dataQuality === 'MOCK_TEST');
  const onlyManual = activePrices.length > 0 && activePrices.every(p => p.source === 'MANUAL' || p.dataQuality === 'MANUAL');

  if (onlyMockOrSeed) {
    confidence = 'LOW';
    explanation += ' Confidence is LOW because references consist solely of mock or sample seed data.';
  } else if (onlyManual) {
    confidence = 'LOW';
    explanation += ' Confidence is LOW because references consist solely of manual price inputs.';
  } else if (confidence === 'HIGH') {
    const hasSeedOrMock = activePrices.some(p => p.isMock || p.isSeedData || p.dataQuality === 'SEED_SAMPLE' || p.dataQuality === 'MOCK_TEST');
    if (hasSeedOrMock) {
      confidence = 'MEDIUM';
      explanation += ' Confidence downgraded to MEDIUM due to mixed inclusion of mock or seed data.';
    }
  }

  // Calculate pricing width based on confidence
  let fairLow = 0;
  let fairHigh = 0;

  if (confidence === 'HIGH' || confidence === 'MEDIUM') {
    // standard range: +/- 8% (fairLow = ref * 0.92, fairHigh = ref * 1.08)
    fairLow = referencePrice * 0.92;
    fairHigh = referencePrice * 1.08;
  } else {
    // low confidence: widen to +/- 15% (fairLow = ref * 0.85, fairHigh = ref * 1.15)
    fairLow = referencePrice * 0.85;
    fairHigh = referencePrice * 1.15;
    explanation += ' Range widened to ±15% due to lower data availability.';
  }

  return {
    fairLow,
    fairHigh,
    referencePrice,
    currency: targetCurrency,
    confidence,
    explanation,
  };
}
