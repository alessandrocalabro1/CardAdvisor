import { convertPrice } from './currency';

export interface ScoredOpportunityResult {
  score: number;
  label: 'avoid' | 'watch' | 'interesting' | 'strong opportunity to verify';
  explanation: string[];
}

/**
 * Calculates the opportunity score (0-100) for a manual or parsed offer.
 */
export function calculateOpportunityScore(
  card: { demandLevel: string; supplyLevel: string; reprintRisk: string },
  offer: { price: number; shipping: number; currency: string; condition: string; sellerReliability: string; isSuspicious: boolean },
  fairRange: { fairLow: number; fairHigh: number; referencePrice: number; currency: string; confidence: 'LOW' | 'MEDIUM' | 'HIGH' }
): ScoredOpportunityResult {
  let score = 50;
  const explanation: string[] = [];

  const offerTotal = offer.price + offer.shipping;
  const offerTotalInFairCurrency = convertPrice(offerTotal, offer.currency, fairRange.currency);

  // 1. Price comparison
  if (fairRange.referencePrice > 0) {
    if (offerTotalInFairCurrency < fairRange.fairLow) {
      score += 20;
      explanation.push('Price is below the estimated fair range (+20)');
    } else if (offerTotalInFairCurrency >= fairRange.fairLow && offerTotalInFairCurrency <= fairRange.fairHigh) {
      // Near low end (lower 40% of the range)
      const rangeWidth = fairRange.fairHigh - fairRange.fairLow;
      const lowEndCutoff = fairRange.fairLow + rangeWidth * 0.40;
      if (offerTotalInFairCurrency <= lowEndCutoff) {
        score += 10;
        explanation.push('Price is within the fair range, close to the lower boundary (+10)');
      } else {
        explanation.push('Price is within the fair range (Neutral)');
      }
    } else {
      score -= 20;
      explanation.push('Price is above the estimated fair range (-20)');
    }
  }

  // 2. Seller Reliability
  if (offer.sellerReliability === 'HIGH') {
    score += 10;
    explanation.push('Seller reliability is highly rated (+10)');
  } else if (offer.sellerReliability === 'LOW') {
    score -= 15;
    explanation.push('Seller reliability is low or unverified (-15)');
  }

  // 3. Card Condition
  const cond = offer.condition.toLowerCase();
  const isNMorMint = cond.includes('near mint') || cond.includes('mint') || cond === 'nm' || cond === 'm';
  if (isNMorMint) {
    score += 10;
    explanation.push('Card is in Near Mint / Mint condition (+10)');
  } else if (cond.includes('poor') || cond.includes('played') || cond.includes('damaged') || cond === 'pl' || cond === 'hp' || cond === 'lp') {
    score -= 10;
    explanation.push('Card is in played or poor condition (-10)');
  }

  // 4. Market Demand and Supply
  if (card.demandLevel === 'HIGH') {
    score += 10;
    explanation.push('Card has high market demand (+10)');
  }
  if (card.supplyLevel === 'LOW') {
    score += 8;
    explanation.push('Card has low market supply (+8)');
  }
  if (card.reprintRisk === 'LOW') {
    score += 8;
    explanation.push('Card has low reprint risk (+8)');
  } else if (card.reprintRisk === 'HIGH') {
    score -= 15;
    explanation.push('Card carries high reprint risk (-15)');
  }

  // 5. Data confidence
  if (fairRange.confidence === 'HIGH') {
    score += 5;
    explanation.push('Calculated from high-confidence pricing references (+5)');
  } else if (fairRange.confidence === 'LOW') {
    score -= 15;
    explanation.push('Calculated from low-confidence or sparse pricing references (-15)');
  }

  // 6. Suspicious Listings
  if (offer.isSuspicious) {
    score -= 20;
    explanation.push('Suspicious listing patterns detected (-20)');
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine Label
  let label: 'avoid' | 'watch' | 'interesting' | 'strong opportunity to verify';
  if (score <= 39) {
    label = 'avoid';
  } else if (score <= 59) {
    label = 'watch';
  } else if (score <= 79) {
    label = 'interesting';
  } else {
    label = 'strong opportunity to verify';
  }

  return {
    score,
    label,
    explanation,
  };
}
