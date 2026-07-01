import { describe, it, expect } from 'vitest';
import { convertPrice, EXCHANGE_RATE_EUR_TO_USD } from '../currency';

describe('convertPrice', () => {
  it('should return same amount for identity conversions', () => {
    expect(convertPrice(100, 'EUR', 'EUR')).toBe(100);
    expect(convertPrice(100, 'USD', 'USD')).toBe(100);
    expect(convertPrice(100, 'usd', 'usd')).toBe(100);
  });

  it('should convert EUR to USD correctly', () => {
    expect(convertPrice(100, 'EUR', 'USD')).toBe(100 * EXCHANGE_RATE_EUR_TO_USD);
    expect(convertPrice(100, 'eur', 'usd')).toBe(100 * EXCHANGE_RATE_EUR_TO_USD);
  });

  it('should convert USD to EUR correctly', () => {
    expect(convertPrice(108, 'USD', 'EUR')).toBe(108 / EXCHANGE_RATE_EUR_TO_USD);
    expect(convertPrice(108, 'usd', 'eur')).toBe(108 / EXCHANGE_RATE_EUR_TO_USD);
  });

  it('should fall back to original amount for unknown source currency', () => {
    expect(convertPrice(100, 'GBP', 'EUR')).toBe(100);
  });

  it('should fall back to original amount for unknown target currency', () => {
    expect(convertPrice(100, 'EUR', 'JPY')).toBe(100);
  });

  it('should handle negative values correctly', () => {
    expect(convertPrice(-100, 'EUR', 'USD')).toBe(-100 * EXCHANGE_RATE_EUR_TO_USD);
  });

  it('should handle zero value correctly', () => {
    expect(convertPrice(0, 'EUR', 'USD')).toBe(0);
  });

  it('should handle NaN and Infinity inputs gracefully by passing them through', () => {
    expect(convertPrice(NaN, 'EUR', 'USD')).toBeNaN();
    expect(convertPrice(Infinity, 'EUR', 'USD')).toBe(Infinity);
  });
});
