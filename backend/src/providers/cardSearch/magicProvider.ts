import { CardSearchInput, CardSearchProvider, CardSearchResult, safeImageUrl } from './types';

const API_BASE = 'https://api.scryfall.com';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Magic: The Gathering search via the public Scryfall API (no token needed).
 * Used ONLY for the MAGIC game key.
 */
export const magicProvider: CardSearchProvider = {
  id: 'scryfall',
  label: 'Scryfall',
  supportedGames: ['MAGIC'],

  isConfigured: () => true,

  unavailableMessage: () =>
    'Ricerca automatica Magic non disponibile al momento. Inserimento manuale disponibile.',

  async searchCards(input: CardSearchInput): Promise<CardSearchResult[]> {
    const url = `${API_BASE}/cards/search?q=${encodeURIComponent(input.query)}&unique=cards&order=name`;

    // Scryfall API guidelines require an identifying User-Agent and Accept header.
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CardAdvisor/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    // Scryfall returns HTTP 404 when the search matches nothing.
    if (res.status === 404) {
      return [];
    }
    if (!res.ok) {
      throw new Error(`Scryfall API responded with HTTP ${res.status}`);
    }

    const body = (await res.json()) as { data?: any[] };
    const cards = Array.isArray(body.data) ? body.data : [];

    return cards.slice(0, input.limit).map((c: any): CardSearchResult => {
      // Double-faced cards keep their images on card_faces.
      const images = c.image_uris
        || (Array.isArray(c.card_faces) && c.card_faces.length > 0 ? c.card_faces[0].image_uris : null);

      return {
        provider: 'scryfall',
        game: 'MAGIC',
        externalId: String(c.id ?? ''),
        name: String(c.name ?? ''),
        setName: c.set_name || undefined,
        setCode: c.set || undefined,
        cardNumber: c.collector_number != null ? String(c.collector_number) : undefined,
        rarity: c.rarity || undefined,
        imageUrl: safeImageUrl(images?.small) || safeImageUrl(images?.normal),
        imageSmallUrl: safeImageUrl(images?.small),
        imageLargeUrl: safeImageUrl(images?.large) || safeImageUrl(images?.normal),
        sourceUrl: safeImageUrl(c.scryfall_uri),
        marketUrl: safeImageUrl(c.purchase_uris?.tcgplayer) || safeImageUrl(c.purchase_uris?.cardmarket),
      };
    }).filter(r => r.externalId && r.name);
  },
};
