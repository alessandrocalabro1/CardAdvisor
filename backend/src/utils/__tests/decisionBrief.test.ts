import { describe, it, expect } from 'vitest';
import { generateDecisionBrief } from '../decisionBrief';

describe('generateDecisionBrief', () => {
  const defaultCard = {
    name: 'Shanks (Parallel)',
    cardNumber: 'OP01-120',
    demandLevel: 'MEDIUM',
    supplyLevel: 'MEDIUM',
    reprintRisk: 'LOW'
  };

  const defaultFairRange = {
    fairLow: 380,
    fairHigh: 450,
    referencePrice: 410,
    currency: 'EUR',
    confidence: 'HIGH' as const,
    explanation: 'Calculated fair range'
  };

  it('should handle card with no offers', () => {
    const res = generateDecisionBrief(defaultCard, [], [], defaultFairRange);
    expect(res.bestOfferSummary).toContain('No active offers');
    expect(res.suggestedActionLabel).toBe('Watch');
  });

  it('should state insufficient data when no market prices exist', () => {
    const res = generateDecisionBrief(
      defaultCard,
      [],
      [],
      { fairLow: 0, fairHigh: 0, referencePrice: 0, currency: 'EUR', confidence: 'LOW', explanation: '' }
    );
    expect(res.fairRangeSummary).toContain('No estimated fair price range');
    expect(res.confidenceExplanation).toContain('Confidence is evaluated as LOW');
  });

  it('should state manual data disclaimer when only manual prices exist', () => {
    const manualPrices = [
      { source: 'MANUAL', rawPrice: 400, trendPrice: null, averagePrice: null, currency: 'EUR', dataQuality: 'MANUAL', isMock: false, isSeedData: false }
    ];
    const res = generateDecisionBrief(
      defaultCard,
      manualPrices,
      [],
      { fairLow: 380, fairHigh: 420, referencePrice: 400, currency: 'EUR', confidence: 'LOW', explanation: 'Manual average' }
    );
    expect(res.confidenceExplanation).toContain('based on manual data');
  });

  it('should override label if best offer is suspicious', () => {
    const res = generateDecisionBrief(
      defaultCard,
      [],
      [{ price: 300, shipping: 10, totalPrice: 310, currency: 'EUR', sellerReliability: 'HIGH', marketplace: 'VINTED', title: 'Shanks proxy', isSuspicious: true }],
      defaultFairRange
    );
    expect(res.suggestedActionLabel).toBe('Avoid');
    expect(res.suggestedActionLabel).not.toBe('Strong opportunity to verify');
  });

  it('should override label if market data is seed/mock-only', () => {
    const prices = [
      { source: 'PRICECHARTING', rawPrice: 410, trendPrice: null, averagePrice: null, currency: 'EUR', dataQuality: 'SEED_SAMPLE', isMock: true, isSeedData: true }
    ];
    const res = generateDecisionBrief(
      defaultCard,
      prices,
      [{ price: 300, shipping: 10, totalPrice: 310, currency: 'EUR', sellerReliability: 'HIGH', marketplace: 'VINTED', title: 'Shanks OP01-120', isSuspicious: false }],
      { ...defaultFairRange, confidence: 'LOW' } // Seed data clamps confidence to LOW
    );
    expect(res.suggestedActionLabel).toBe('Verify carefully');
    expect(res.suggestedActionLabel).not.toBe('Strong opportunity to verify');
  });

  it('should flag Avoid or Watch if offer is above range', () => {
    const res = generateDecisionBrief(
      defaultCard,
      [],
      [{ price: 460, shipping: 10, totalPrice: 470, currency: 'EUR', sellerReliability: 'HIGH', marketplace: 'VINTED', title: 'Shanks OP01-120', isSuspicious: false }],
      defaultFairRange
    );
    expect(res.suggestedActionLabel).toBe('Avoid');
  });

  it('should add authenticity warning signal if offer is far below range', () => {
    const res = generateDecisionBrief(
      defaultCard,
      [],
      [{ price: 100, shipping: 10, totalPrice: 110, currency: 'EUR', sellerReliability: 'HIGH', marketplace: 'VINTED', title: 'Shanks OP01-120', isSuspicious: false }],
      defaultFairRange
    );
    expect(res.riskSignals.some(s => s.toLowerCase().includes('authenticity'))).toBe(true);
  });

  it('should trigger positive demand/supply signal under low supply meta', () => {
    const highDemandCard = { ...defaultCard, demandLevel: 'HIGH', supplyLevel: 'LOW' };
    const res = generateDecisionBrief(highDemandCard, [], [], defaultFairRange);
    expect(res.positiveSignals.some(s => s.includes('demand') && s.includes('supply'))).toBe(true);
  });

  it('should add reprint risk signal when card reprint risk is HIGH', () => {
    const reprintCard = { ...defaultCard, reprintRisk: 'HIGH' };
    const res = generateDecisionBrief(reprintCard, [], [], defaultFairRange);
    expect(res.riskSignals.some(s => s.toLowerCase().includes('reprint'))).toBe(true);
  });

  it('should add reliability warning when seller reliability is LOW', () => {
    const res = generateDecisionBrief(
      defaultCard,
      [],
      [{ price: 390, shipping: 10, totalPrice: 400, currency: 'EUR', sellerReliability: 'LOW', marketplace: 'VINTED', title: 'Shanks', isSuspicious: false }],
      defaultFairRange
    );
    expect(res.riskSignals.some(s => s.toLowerCase().includes('seller reliability'))).toBe(true);
  });

  it('should always include disclaimer warning and cautious wording guidelines', () => {
    const res = generateDecisionBrief(defaultCard, [], [], defaultFairRange);
    
    // Check disclaimer
    expect(res.disclaimer).toBeDefined();
    expect(res.disclaimer.length).toBeGreaterThan(20);

    // Cautious language check: verify lack of forbidden words
    const forbiddenWords = ['guaranteed profit', 'safe investment', 'must buy', 'certain gain'];
    const textBlock = JSON.stringify(res).toLowerCase();
    for (const word of forbiddenWords) {
      expect(textBlock).not.toContain(word);
    }
  });
});
