import { FairPriceRangeResult } from './fairPrice';

export interface DecisionBriefResult {
  fairRangeSummary: string;
  bestOfferSummary: string;
  pricePosition: 'BELOW_RANGE' | 'INSIDE_RANGE' | 'ABOVE_RANGE' | 'UNKNOWN';
  positiveSignals: string[];
  riskSignals: string[];
  suggestedActionLabel: 'Avoid' | 'Watch' | 'Verify carefully' | 'Interesting to monitor' | 'Strong opportunity to verify';
  confidenceExplanation: string;
  dataQualitySummary: string;
  disclaimer: string;
}

/**
 * Generates a dynamic decision-support brief for a given card based on its valuation stats and active offers.
 */
export function generateDecisionBrief(
  card: { name: string; cardNumber: string; demandLevel: string; supplyLevel: string; reprintRisk: string },
  marketPrices: { source: string; rawPrice: number | null; trendPrice: number | null; averagePrice: number | null; currency: string; dataQuality: string; isMock: boolean; isSeedData: boolean }[],
  offers: { price: number; shipping: number; totalPrice: number; currency: string; sellerReliability: string; marketplace: string; title: string; isSuspicious: boolean }[],
  fairRange: FairPriceRangeResult
): DecisionBriefResult {
  
  // 1. Choose best offer
  // Sort rules: non-suspicious first, then lowest totalPrice, then highest sellerReliability
  const sortedOffers = [...offers].sort((a, b) => {
    if (a.isSuspicious && !b.isSuspicious) return 1;
    if (!a.isSuspicious && b.isSuspicious) return -1;
    if (a.totalPrice !== b.totalPrice) return a.totalPrice - b.totalPrice;
    
    const relA = a.sellerReliability === 'HIGH' ? 3 : a.sellerReliability === 'MEDIUM' ? 2 : 1;
    const relB = b.sellerReliability === 'HIGH' ? 3 : b.sellerReliability === 'MEDIUM' ? 2 : 1;
    return relB - relA;
  });
  const bestOffer = sortedOffers[0] || null;

  // 2. Summary details
  let fairRangeSummary = '';
  if (fairRange.referencePrice > 0) {
    fairRangeSummary = `Estimated fair range is €${fairRange.fairLow.toFixed(2)} - €${fairRange.fairHigh.toFixed(2)} based on active market indicators.`;
  } else {
    fairRangeSummary = 'No estimated fair price range could be calculated due to insufficient market pricing logs.';
  }

  let bestOfferSummary = '';
  if (!bestOffer) {
    bestOfferSummary = 'No active offers are currently logged for this card.';
  } else {
    const marketLabel = bestOffer.marketplace ? bestOffer.marketplace.toUpperCase() : 'PRIVATE';
    bestOfferSummary = `Best offer found: €${bestOffer.totalPrice.toFixed(2)} (${marketLabel}) - "${bestOffer.title || 'Untitled'}"`;
  }

  // 3. Price Position Check
  // Rule 1: If confidence is LOW, pricePosition is UNKNOWN unless offer is clearly suspicious.
  let pricePosition: 'BELOW_RANGE' | 'INSIDE_RANGE' | 'ABOVE_RANGE' | 'UNKNOWN' = 'UNKNOWN';
  if (bestOffer) {
    const isSuspiciousOffer = bestOffer.isSuspicious;
    const isConfidenceLow = fairRange.confidence === 'LOW';
    
    if (!isConfidenceLow || isSuspiciousOffer) {
      if (bestOffer.totalPrice < fairRange.fairLow) {
        pricePosition = 'BELOW_RANGE';
      } else if (bestOffer.totalPrice > fairRange.fairHigh) {
        pricePosition = 'ABOVE_RANGE';
      } else {
        pricePosition = 'INSIDE_RANGE';
      }
    }
  }

  // 4. Positive and Risk Signals Compile
  const positiveSignals: string[] = [];
  const riskSignals: string[] = [];

  if (bestOffer) {
    // Rule 3: If best offer price is below fairLow and confidence is MEDIUM or HIGH
    if (bestOffer.totalPrice < fairRange.fairLow && fairRange.confidence !== 'LOW') {
      positiveSignals.push('Best offer is below the estimated fair range.');
    }

    // Rule 4: If best offer price is far below fairLow
    if (bestOffer.totalPrice < fairRange.fairLow * 0.7) {
      riskSignals.push('Price is unusually low. Verify authenticity and listing details.');
    }

    // Rule 10: If sellerReliability is LOW
    if (bestOffer.sellerReliability === 'LOW') {
      riskSignals.push('Seller reliability is low. Proceed with caution.');
    }

    // Add general suspicious offer warning signal
    if (bestOffer.isSuspicious) {
      riskSignals.push('Active offer has suspicious flags. Double-check condition and description.');
    }
  }

  // Rule 9: If reprintRisk is HIGH
  if (card.reprintRisk === 'HIGH') {
    riskSignals.push('High reprint risk observed. Future supply increases may impact valuation.');
  }

  // Rule 11: If demandLevel is HIGH and supplyLevel is LOW
  if (card.demandLevel === 'HIGH' && card.supplyLevel === 'LOW') {
    positiveSignals.push("High market demand paired with low supply provides strong support for this card's value.");
  }

  if (fairRange.confidence === 'LOW') {
    riskSignals.push('Low estimation confidence. Active references are sparse or outdated.');
  }

  // 5. Suggested Action Label logic
  let suggestedActionLabel: 'Avoid' | 'Watch' | 'Verify carefully' | 'Interesting to monitor' | 'Strong opportunity to verify' = 'Watch';

  if (bestOffer) {
    if (bestOffer.isSuspicious) {
      suggestedActionLabel = 'Avoid';
    } else if (pricePosition === 'BELOW_RANGE') {
      suggestedActionLabel = 'Strong opportunity to verify';
    } else if (pricePosition === 'INSIDE_RANGE') {
      suggestedActionLabel = 'Interesting to monitor';
    } else if (pricePosition === 'ABOVE_RANGE') {
      suggestedActionLabel = 'Avoid';
    } else {
      // UNKNOWN pricePosition due to LOW confidence
      suggestedActionLabel = 'Verify carefully';
    }
  } else {
    // No active offer
    suggestedActionLabel = 'Watch';
  }

  // Apply signal modifiers to Suggested Action Label
  if (suggestedActionLabel === 'Interesting to monitor') {
    // If there are risk signals, elevate warning level
    if (riskSignals.length > 0) {
      suggestedActionLabel = 'Verify carefully';
    }
  }

  // Rule 7 & 8 strict constraints
  const hasOnlyMockOrSeed = marketPrices.length > 0 && marketPrices.every(p => p.dataQuality === 'SEED_SAMPLE' || p.dataQuality === 'MOCK_TEST');
  const hasAnySuspiciousOffer = offers.some(o => o.isSuspicious);

  if (suggestedActionLabel === 'Strong opportunity to verify') {
    if (hasAnySuspiciousOffer || hasOnlyMockOrSeed) {
      suggestedActionLabel = 'Verify carefully';
    }
  }

  // 6. Confidence Explanation
  // Rule 12: If data quality is only MANUAL
  const isOnlyManual = marketPrices.length > 0 && marketPrices.every(p => p.dataQuality === 'MANUAL');
  let confidenceExplanation = '';
  if (isOnlyManual) {
    confidenceExplanation = 'Estimate is based on manual data. Verify live prices on official platforms before transacting.';
  } else if (hasOnlyMockOrSeed) {
    confidenceExplanation = 'Estimate is based solely on sample mock/seed data. Verify live prices on official platforms before transacting.';
  } else {
    confidenceExplanation = `Confidence is evaluated as ${fairRange.confidence} based on available provider sources.`;
  }

  // 7. Data Quality Summary
  const qualities = marketPrices.map(p => p.dataQuality).filter((v, i, a) => a.indexOf(v) === i);
  let dataQualitySummary = '';
  if (qualities.length > 0) {
    dataQualitySummary = `Market references data quality: ${qualities.join(', ')}.`;
  } else {
    dataQualitySummary = 'No market references logged to evaluate.';
  }

  // Rule 13: Disclaimer text
  const disclaimer = 'Verify authenticity, condition, language, seller reliability, photos, fees and marketplace rules before making any purchase decision.';

  return {
    fairRangeSummary,
    bestOfferSummary,
    pricePosition,
    positiveSignals,
    riskSignals,
    suggestedActionLabel,
    confidenceExplanation,
    dataQualitySummary,
    disclaimer
  };
}
