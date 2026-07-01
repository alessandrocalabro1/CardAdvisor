import { describe, it, expect } from 'vitest';
import { calculateOpportunityScore } from '../scoring';

describe('calculateOpportunityScore', () => {
  const defaultCard = {
    demandLevel: 'HIGH',
    supplyLevel: 'LOW',
    reprintRisk: 'LOW'
  };

  const neutralCard = {
    demandLevel: 'MEDIUM',
    supplyLevel: 'MEDIUM',
    reprintRisk: 'MEDIUM'
  };

  const defaultFairRange = {
    fairLow: 380,
    fairHigh: 450,
    referencePrice: 410,
    currency: 'EUR',
    confidence: 'HIGH' as const
  };

  it('should increase score for cheap offers from reliable sellers', () => {
    const res = calculateOpportunityScore(
      defaultCard,
      { price: 300, shipping: 10, currency: 'EUR', condition: 'Near Mint', sellerReliability: 'HIGH', isSuspicious: false },
      defaultFairRange
    );
    // Score should be high due to below range, NM, and high seller reliability
    expect(res.score).toBeGreaterThan(70);
  });

  it('should decrease score for offers above fairHigh', () => {
    const res = calculateOpportunityScore(
      neutralCard,
      { price: 460, shipping: 10, currency: 'EUR', condition: 'Near Mint', sellerReliability: 'HIGH', isSuspicious: false },
      defaultFairRange
    );
    expect(res.score).toBeLessThan(60);
  });

  it('should penalize low seller reliability', () => {
    const resBase = calculateOpportunityScore(
      defaultCard,
      { price: 400, shipping: 10, currency: 'EUR', condition: 'Near Mint', sellerReliability: 'MEDIUM', isSuspicious: false },
      defaultFairRange
    );
    const resLow = calculateOpportunityScore(
      defaultCard,
      { price: 400, shipping: 10, currency: 'EUR', condition: 'Near Mint', sellerReliability: 'LOW', isSuspicious: false },
      defaultFairRange
    );
    expect(resLow.score).toBeLessThan(resBase.score);
  });

  it('should penalize high reprint risk', () => {
    const cardHighReprint = { ...defaultCard, reprintRisk: 'HIGH' };
    const res = calculateOpportunityScore(
      cardHighReprint,
      { price: 400, shipping: 10, currency: 'EUR', condition: 'Near Mint', sellerReliability: 'HIGH', isSuspicious: false },
      defaultFairRange
    );
    // base high reprint starts lower
    expect(res.explanation.some(e => e.includes('reprint risk'))).toBe(true);
  });

  it('should heavily penalize suspicious offers', () => {
    const res = calculateOpportunityScore(
      neutralCard,
      { price: 400, shipping: 10, currency: 'EUR', condition: 'Played', sellerReliability: 'LOW', isSuspicious: true },
      defaultFairRange
    );
    expect(res.score).toBeLessThan(50);
    expect(res.label).toBe('avoid'); // Suspicious offers should NEVER be strong opportunity
  });

  it('should clamp scores between 0 and 100', () => {
    const resMin = calculateOpportunityScore(
      { ...defaultCard, demandLevel: 'LOW', supplyLevel: 'HIGH', reprintRisk: 'HIGH' },
      { price: 1000, shipping: 50, currency: 'EUR', condition: 'Poor', sellerReliability: 'LOW', isSuspicious: true },
      { ...defaultFairRange, confidence: 'LOW' }
    );
    expect(resMin.score).toBe(0);

    const resMax = calculateOpportunityScore(
      { ...defaultCard, demandLevel: 'HIGH', supplyLevel: 'LOW', reprintRisk: 'LOW' },
      { price: 10, shipping: 1, currency: 'EUR', condition: 'Near Mint', sellerReliability: 'HIGH', isSuspicious: false },
      defaultFairRange
    );
    expect(resMax.score).toBe(100);
  });

  it('should downgrade label to watch if confidence is LOW', () => {
    const lowConfidenceRange = { ...defaultFairRange, confidence: 'LOW' as const };
    const res = calculateOpportunityScore(
      neutralCard,
      { price: 300, shipping: 10, currency: 'EUR', condition: 'Near Mint', sellerReliability: 'HIGH', isSuspicious: false },
      lowConfidenceRange
    );
    // Since confidence is low, opportunity score is penalized and prevents a "strong opportunity" result
    expect(res.label).not.toBe('strong opportunity to verify');
  });
});
