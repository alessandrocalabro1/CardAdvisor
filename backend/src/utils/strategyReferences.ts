/**
 * Utility for parsing and matching card ID references in Weekly Strategy records.
 */

/**
 * Safely parses related card IDs from a JSON string under strict validation:
 * 1. null/undefined/empty returns []
 * 2. Malformed JSON or non-array JSON returns []
 * 3. Trims string entry IDs and filters out non-string or whitespace-only elements
 * 4. Deduplicates card IDs
 */
export function parseRelatedCardIdsJson(input: string | null | undefined): string[] {
  if (input === null || input === undefined) return [];
  const trimmed = input.trim();
  if (trimmed === '') return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [];

    const ids: string[] = [];
    for (const item of parsed) {
      if (typeof item === 'string') {
        const val = item.trim();
        if (val !== '') {
          ids.push(val);
        }
      }
    }

    // Deduplicate array
    return Array.from(new Set(ids));
  } catch (e) {
    return [];
  }
}

/**
 * Checks if a specific card ID is linked to a strategy record.
 */
export function isCardReferencedByStrategy(cardId: string, relatedCardIdsJson: string | null | undefined): boolean {
  if (!cardId) return false;
  const ids = parseRelatedCardIdsJson(relatedCardIdsJson);
  return ids.includes(cardId.trim());
}
