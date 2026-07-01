import { describe, it, expect } from 'vitest';
import { detectSuspiciousOffer } from '../suspiciousDetection';

describe('detectSuspiciousOffer', () => {
  const defaultCard = {
    name: 'Shanks (Parallel)',
    cardNumber: 'OP01-120',
    language: 'English',
    version: 'Parallel Alt Art'
  };

  it('should flag titles containing proxy', () => {
    const res = detectSuspiciousOffer(
      { title: 'OP01-120 Shanks proxy card', price: 400, shipping: 5, currency: 'EUR', language: 'English' },
      defaultCard
    );
    expect(res.isSuspicious).toBe(true);
    expect(res.reasons.some(r => r.includes('proxy'))).toBe(true);
  });

  it('should flag titles containing fake', () => {
    const res = detectSuspiciousOffer(
      { title: 'Fake Shanks OP01-120 SEC', price: 10, shipping: 2, currency: 'EUR', language: 'English' },
      defaultCard
    );
    expect(res.isSuspicious).toBe(true);
    expect(res.reasons.some(r => r.includes('fake'))).toBe(true);
  });

  it('should flag titles containing custom', () => {
    const res = detectSuspiciousOffer(
      { title: 'Custom Shanks parallel replica art', price: 30, shipping: 1, currency: 'EUR', language: 'English' },
      defaultCard
    );
    expect(res.isSuspicious).toBe(true);
    expect(res.reasons.some(r => r.includes('custom') || r.includes('replica'))).toBe(true);
  });

  it('should flag titles suggesting a lot or bundle', () => {
    const res = detectSuspiciousOffer(
      { title: 'Romance Dawn cards bundle lot', price: 50, shipping: 5, currency: 'EUR', language: 'English' },
      defaultCard
    );
    expect(res.isSuspicious).toBe(true);
    expect(res.reasons.some(r => r.includes('lot') || r.includes('bundle'))).toBe(true);
  });

  it('should pass normal titles with matching name/number', () => {
    const res = detectSuspiciousOffer(
      { title: 'Romance Dawn OP01-120 Shanks Near Mint', price: 420, shipping: 10, currency: 'EUR', language: 'English' },
      defaultCard
    );
    expect(res.isSuspicious).toBe(false);
    expect(res.reasons.length).toBe(0);
  });

  it('should flag exceptionally low prices compared to fair range', () => {
    const res = detectSuspiciousOffer(
      { title: 'OP01-120 Shanks raw', price: 50, shipping: 2, currency: 'EUR', language: 'English' },
      defaultCard,
      400,
      'EUR'
    );
    expect(res.isSuspicious).toBe(true);
    expect(res.reasons.some(r => r.includes('low') || r.includes('35%'))).toBe(true);
  });

  it('should flag language mismatches', () => {
    const res = detectSuspiciousOffer(
      { title: 'Shanks OP01-120 Japanese', price: 200, shipping: 10, currency: 'EUR', language: 'Japanese' },
      defaultCard
    );
    expect(res.isSuspicious).toBe(true);
    expect(res.reasons.some(r => r.includes('Language mismatch'))).toBe(true);
  });

  it('should flag graded keyword listings when card expected is raw', () => {
    const res = detectSuspiciousOffer(
      { title: 'PSA 10 Shanks Parallel Romance Dawn', price: 800, shipping: 15, currency: 'EUR', language: 'English' },
      defaultCard
    );
    expect(res.isSuspicious).toBe(true);
    expect(res.reasons.some(r => r.includes('graded card slab'))).toBe(true);
  });
});
