import { CardSearchInput, CardSearchProvider, CardSearchResult, safeImageUrl } from './types';

const API_BASE = 'https://db.ygoprodeck.com/api/v7';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Yu-Gi-Oh! search via the public YGOPRODeck API.
 * IMPORTANT: YGOPRODeck is used ONLY for the YUGIOH game key, and image
 * URLs come exclusively from the API response (never constructed manually).
 */
export const yugiohProvider: CardSearchProvider = {
  id: 'ygoprodeck',
  label: 'YGOPRODeck',
  supportedGames: ['YUGIOH'],

  // Public API, no token required.
  isConfigured: () => true,

  unavailableMessage: () =>
    'Ricerca automatica Yu-Gi-Oh non disponibile al momento. Inserimento manuale disponibile.',

  async searchCards(input: CardSearchInput): Promise<CardSearchResult[]> {
    const url = `${API_BASE}/cardinfo.php?fname=${encodeURIComponent(input.query)}&num=${input.limit}&offset=0`;

    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

    // YGOPRODeck returns HTTP 400 with an error body when no card matches.
    if (res.status === 400) {
      return [];
    }
    if (!res.ok) {
      throw new Error(`YGOPRODeck API responded with HTTP ${res.status}`);
    }

    const body = (await res.json()) as { data?: any[] };
    const cards = Array.isArray(body.data) ? body.data : [];

    return cards.slice(0, input.limit).map((c: any): CardSearchResult => {
      const firstSet = Array.isArray(c.card_sets) && c.card_sets.length > 0 ? c.card_sets[0] : null;
      const firstImage = Array.isArray(c.card_images) && c.card_images.length > 0 ? c.card_images[0] : null;

      return {
        provider: 'ygoprodeck',
        game: 'YUGIOH',
        externalId: String(c.id ?? ''),
        name: String(c.name ?? ''),
        setName: firstSet?.set_name || undefined,
        setCode: firstSet?.set_code || undefined,
        cardNumber: firstSet?.set_code || undefined,
        rarity: firstSet?.set_rarity || undefined,
        imageUrl: safeImageUrl(firstImage?.image_url_small),
        imageSmallUrl: safeImageUrl(firstImage?.image_url_small),
        imageLargeUrl: safeImageUrl(firstImage?.image_url),
        sourceUrl: safeImageUrl(c.ygoprodeck_url),
      };
    }).filter(r => r.externalId && r.name);
  },
};
