import { convertPrice } from './currency';

export interface SuspiciousDetectionResult {
  isSuspicious: boolean;
  reasons: string[];
}

/**
 * Detects whether an offer appears suspicious.
 * Checks for replicas/proxies, damaged listings, lot/bundle keywords,
 * graded vs raw mismatch, language/card number mismatch, and major price anomalies.
 */
export function detectSuspiciousOffer(
  offer: { title: string; price: number; shipping: number; currency: string; language: string; notes?: string | null },
  card: { name: string; cardNumber: string; language: string; version: string },
  fairLow?: number, // in the target currency
  fairCurrency?: string
): SuspiciousDetectionResult {
  const reasons: string[] = [];
  const titleLower = offer.title.toLowerCase();
  const notesLower = (offer.notes || '').toLowerCase();
  const textToScan = `${titleLower} ${notesLower}`;

  // 1. Check for fake / proxy / copy
  const replicaKeywords = ['proxy', 'fake', 'custom', 'replica', 'reproduction', 'fan art', 'fan-art', 'counterfeit', 'orica'];
  for (const kw of replicaKeywords) {
    if (textToScan.includes(kw)) {
      reasons.push(`Contains potential copy/replica keyword: "${kw}"`);
    }
  }

  // 2. Check for damage / heavily played (if not expected)
  const damageKeywords = ['damaged', 'dmg', 'poor condition', 'heavy played', 'hp', 'crease', 'scratched', 'damaged corner'];
  for (const kw of damageKeywords) {
    if (textToScan.includes(kw)) {
      reasons.push(`Listing indicates damage/poor condition: "${kw}"`);
    }
  }

  // 3. Check for lots or bundles (when expecting a single card)
  const lotKeywords = ['lot', 'bundle', 'playset', 'collection of', 'pack opening'];
  for (const kw of lotKeywords) {
    if (titleLower.includes(kw)) {
      reasons.push(`Listing suggests a lot or bundle instead of a single card: "${kw}"`);
    }
  }

  // 4. Sealed product indicators
  const sealedKeywords = ['booster box', 'booster pack', 'sealed case', 'booster display', 'booster deck', 'starter deck'];
  for (const kw of sealedKeywords) {
    if (titleLower.includes(kw)) {
      reasons.push(`Listing suggests a sealed deck or pack: "${kw}"`);
    }
  }

  // 5. Graded card when raw expected (PSA, BGS, CGC, SGC, GRAAD)
  const gradedKeywords = ['psa', 'bgs', 'cgc', 'sgc', 'beckett', 'graded', 'slab', 'gem mint 10', 'pristine 10'];
  const cardIsGraded = card.version.toLowerCase().includes('graded') || card.version.toLowerCase().includes('psa') || card.version.toLowerCase().includes('bgs');
  if (!cardIsGraded) {
    for (const kw of gradedKeywords) {
      // match as separate word or token
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(titleLower)) {
        reasons.push(`Listing suggests a graded card slab, but target card is raw: "${kw}"`);
        break;
      }
    }
  }

  // 6. Language mismatch
  if (offer.language && card.language && offer.language.toLowerCase() !== card.language.toLowerCase()) {
    reasons.push(`Language mismatch: offer says "${offer.language}", but card is "${card.language}"`);
  }

  // 7. Card number mismatch (e.g. OP01-121 instead of OP01-120)
  const cardNoPattern = /[a-zA-Z0-9]+-\d+/g;
  const matchInTitle = titleLower.match(cardNoPattern);
  if (matchInTitle && card.cardNumber) {
    const cardNoInTitle = matchInTitle[0].toUpperCase();
    const expectedCardNo = card.cardNumber.toUpperCase();
    if (cardNoInTitle !== expectedCardNo) {
      reasons.push(`Card number mismatch in title: found "${cardNoInTitle}", expected "${expectedCardNo}"`);
    }
  }

  // 8. Price too cheap compared to estimated fair range
  if (fairLow !== undefined && fairLow > 0 && fairCurrency) {
    const offerTotal = offer.price + offer.shipping;
    const offerPriceInFairCurrency = convertPrice(offerTotal, offer.currency, fairCurrency);
    
    // If it's less than 35% of the fair low, it's highly suspicious
    if (offerPriceInFairCurrency < fairLow * 0.35) {
      reasons.push(`Price is exceptionally low: ${offer.currency} ${offerTotal.toFixed(2)} is less than 35% of the estimated fair range low (${fairCurrency} ${fairLow.toFixed(2)}).`);
    }
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}
export function calculateTotalOfferPrice(offer: { price: number; shipping: number }): number {
  return offer.price + offer.shipping;
}
