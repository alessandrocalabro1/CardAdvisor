import { CardSearchInput, CardSearchProvider, CardSearchResult, safeImageUrl } from './types';

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * One Piece TCG search.
 *
 * There is no official free One Piece card API. This adapter only works when
 * OPTCG_API_BASE_URL points to a compatible endpoint (expected shape:
 * GET {base}/cards?search=<query> returning an array of card objects).
 *
 * When the base URL is not configured, the provider reports itself as
 * unavailable: NO mock results, NO invented image URLs, and NEVER
 * YGOPRODeck images (that CDN is Yu-Gi-Oh only).
 */
export const onePieceProvider: CardSearchProvider = {
  id: 'op-tcg',
  label: 'One Piece TCG',
  supportedGames: ['ONE_PIECE'],

  isConfigured: () => Boolean(process.env.OPTCG_API_BASE_URL),

  unavailableMessage: () =>
    'Ricerca automatica One Piece non configurata. Puoi compilare manualmente la carta.',

  async searchCards(input: CardSearchInput): Promise<CardSearchResult[]> {
    const baseUrl = process.env.OPTCG_API_BASE_URL;
    if (!baseUrl) {
      // Defensive: the registry should not call this when unconfigured.
      return [];
    }

    const url = `${baseUrl.replace(/\/$/, '')}/cards?search=${encodeURIComponent(input.query)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) {
      throw new Error(`OPTCG API responded with HTTP ${res.status}`);
    }

    const body = (await res.json()) as unknown;
    const cards = Array.isArray(body) ? body : [];

    return cards.slice(0, input.limit).map((c: any): CardSearchResult => ({
      provider: 'op-tcg',
      game: 'ONE_PIECE',
      externalId: String(c.id ?? c.cardNumber ?? c.code ?? ''),
      name: String(c.name ?? ''),
      setName: c.setName || c.set || undefined,
      setCode: c.setCode || undefined,
      cardNumber: c.cardNumber || c.code || undefined,
      rarity: c.rarity || undefined,
      // Only URLs actually present in the provider response.
      imageUrl: safeImageUrl(c.imageUrl) || safeImageUrl(c.image),
      imageSmallUrl: safeImageUrl(c.imageSmallUrl) || safeImageUrl(c.imageUrl) || safeImageUrl(c.image),
      imageLargeUrl: safeImageUrl(c.imageLargeUrl),
      sourceUrl: safeImageUrl(c.sourceUrl),
    })).filter(r => r.externalId && r.name);
  },
};
