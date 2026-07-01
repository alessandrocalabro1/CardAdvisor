import { describe, it, expect } from 'vitest';
import { calculateFairPriceRange } from '../fairPrice';

describe('calculateFairPriceRange', () => {
  const defaultCard = {
    name: 'Shanks (Parallel)',
    cardNumber: 'OP01-120'
  };

  it('should calculate fair range around reference price for PriceCharting provider', () => {
    const prices = [
      { source: 'PRICECHARTING', rawPrice: 400, trendPrice: null, averagePrice: null, currency: 'EUR', dataQuality: 'AGGREGATED_PROVIDER', isMock: false, isSeedData: false }
    ];
    const res = calculateFairPriceRange(defaultCard, prices, [], []);
    expect(res.referencePrice).toBe(400);
    expect(res.fairLow).toBeLessThan(400);
    expect(res.fairHigh).toBeGreaterThan(400);
    expect(res.explanation).not.toContain('raw eBay sold logs');
  });

  it('should restrict confidence to MEDIUM for Cardmarket public export data', () => {
    const prices = [
      { source: 'CARDMARKET_EXPORT', rawPrice: null, trendPrice: 420, averagePrice: 410, currency: 'EUR', dataQuality: 'PUBLIC_EXPORT', isMock: false, isSeedData: false }
    ];
    const res = calculateFairPriceRange(defaultCard, prices, [], []);
    expect(res.confidence).toBe('MEDIUM');
  });

  it('should restrict confidence to LOW or MEDIUM for manual data', () => {
    const prices = [
      { source: 'MANUAL', rawPrice: 400, trendPrice: null, averagePrice: null, currency: 'EUR', dataQuality: 'MANUAL', isMock: false, isSeedData: false }
    ];
    const res = calculateFairPriceRange(defaultCard, prices, [], []);
    expect(res.confidence).not.toBe('HIGH');
  });

  it('should restrict confidence to LOW for seed data', () => {
    const prices = [
      { source: 'PRICECHARTING', rawPrice: 420, trendPrice: null, averagePrice: null, currency: 'EUR', dataQuality: 'SEED_SAMPLE', isMock: true, isSeedData: true }
    ];
    const res = calculateFairPriceRange(defaultCard, prices, [], []);
    expect(res.confidence).toBe('LOW');
  });

  it('should restrict confidence to LOW for mock connection tests', () => {
    const prices = [
      { source: 'PRICECHARTING', rawPrice: 450, trendPrice: null, averagePrice: null, currency: 'EUR', dataQuality: 'MOCK_TEST', isMock: true, isSeedData: false }
    ];
    const res = calculateFairPriceRange(defaultCard, prices, [], []);
    expect(res.confidence).toBe('LOW');
  });

  it('should downgrade confidence to MEDIUM if seed/mock data is mixed in', () => {
    const prices = [
      { source: 'PRICECHARTING', rawPrice: 420, trendPrice: null, averagePrice: null, currency: 'EUR', dataQuality: 'SEED_SAMPLE', isMock: true, isSeedData: true },
      { source: 'PRICECHARTING', rawPrice: 430, trendPrice: null, averagePrice: null, currency: 'EUR', dataQuality: 'AGGREGATED_PROVIDER', isMock: false, isSeedData: false }
    ];
    // Normally multiple sources might give high confidence, but mixing mock/seed downgrades it
    const res = calculateFairPriceRange(defaultCard, prices, [], []);
    expect(res.confidence).not.toBe('HIGH');
  });

  it('should handle empty market prices gracefully', () => {
    const res = calculateFairPriceRange(defaultCard, [], [], []);
    expect(res.referencePrice).toBe(0);
    expect(res.confidence).toBe('LOW');
    expect(res.fairLow).toBe(0);
    expect(res.fairHigh).toBe(0);
  });
});
