import { describe, it, expect } from 'vitest';
import { parseRelatedCardIdsJson, isCardReferencedByStrategy } from '../strategyReferences';

describe('strategyReferences parser', () => {
  describe('parseRelatedCardIdsJson', () => {
    it('should return empty array for null', () => {
      expect(parseRelatedCardIdsJson(null)).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      expect(parseRelatedCardIdsJson(undefined)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(parseRelatedCardIdsJson('')).toEqual([]);
      expect(parseRelatedCardIdsJson('   ')).toEqual([]);
    });

    it('should return empty array for malformed JSON string', () => {
      expect(parseRelatedCardIdsJson('[invalid-json')).toEqual([]);
    });

    it('should return empty array for JSON object instead of array', () => {
      expect(parseRelatedCardIdsJson('{"id": "some-card"}')).toEqual([]);
    });

    it('should parse valid JSON array of string IDs', () => {
      expect(parseRelatedCardIdsJson('["shanks-op01-120", "nami-op01-016"]')).toEqual([
        'shanks-op01-120',
        'nami-op01-016'
      ]);
    });

    it('should deduplicate duplicate string IDs', () => {
      expect(parseRelatedCardIdsJson('["shanks", "shanks", "nami"]')).toEqual(['shanks', 'nami']);
    });

    it('should ignore non-string array entries', () => {
      expect(parseRelatedCardIdsJson('["shanks", 123, null, true, {"id":"nami"}]')).toEqual(['shanks']);
    });

    it('should ignore whitespace-only IDs', () => {
      expect(parseRelatedCardIdsJson('["shanks", "  ", "nami", ""]')).toEqual(['shanks', 'nami']);
    });

    it('should trim valid IDs', () => {
      expect(parseRelatedCardIdsJson('[" shanks-op01-120 ", "nami-op01-016   "]')).toEqual([
        'shanks-op01-120',
        'nami-op01-016'
      ]);
    });
  });

  describe('isCardReferencedByStrategy', () => {
    it('should return true when card ID is included', () => {
      const json = '["shanks-op01-120", "nami-op01-016"]';
      expect(isCardReferencedByStrategy('shanks-op01-120', json)).toBe(true);
      expect(isCardReferencedByStrategy('  shanks-op01-120  ', json)).toBe(true); // handles spaces in check ID too
    });

    it('should return false when card ID is not included', () => {
      const json = '["shanks-op01-120", "nami-op01-016"]';
      expect(isCardReferencedByStrategy('luffy-op01-001', json)).toBe(false);
    });

    it('should return false for malformed JSON input', () => {
      expect(isCardReferencedByStrategy('shanks-op01-120', '[invalid')).toBe(false);
    });

    it('should return false for null, undefined, or empty input', () => {
      expect(isCardReferencedByStrategy('shanks-op01-120', null)).toBe(false);
      expect(isCardReferencedByStrategy('shanks-op01-120', undefined)).toBe(false);
      expect(isCardReferencedByStrategy('shanks-op01-120', '')).toBe(false);
    });
  });
});
