import { CardSearchInput, CardSearchProvider, CardSearchResult, safeImageUrl } from './types';

const API_BASE = 'https://api.pokemontcg.io/v2';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Pokémon TCG search via the official Pokémon TCG API (pokemontcg.io).
 * Works unauthenticated with lower rate limits; uses POKEMON_TCG_API_KEY
 * as X-Api-Key when configured. Only provider-returned image URLs are used.
 */
export const pokemonProvider: CardSearchProvider = {
  id: 'pokemon-tcg',
  label: 'Pokémon TCG API',
  supportedGames: ['POKEMON'],

  // The API allows unauthenticated requests, so it is always usable.
  isConfigured: () => true,

  unavailableMessage: () =>
    'Ricerca automatica Pokémon non disponibile al momento. Inserimento manuale disponibile.',

  async searchCards(input: CardSearchInput): Promise<CardSearchResult[]> {
    // Wildcard prefix search; quote multi-word queries per API syntax.
    const q = input.query.includes(' ')
      ? `name:"${input.query}*"`
      : `name:${input.query}*`;

    const url = `${API_BASE}/cards?q=${encodeURIComponent(q)}&pageSize=${input.limit}&orderBy=name`;

    const headers: Record<string, string> = {};
    const apiKey = process.env.POKEMON_TCG_API_KEY;
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) {
      throw new Error(`Pokemon TCG API responded with HTTP ${res.status}`);
    }

    const body = (await res.json()) as { data?: any[] };
    const cards = Array.isArray(body.data) ? body.data : [];

    return cards.slice(0, input.limit).map((c: any): CardSearchResult => ({
      provider: 'pokemon-tcg',
      game: 'POKEMON',
      externalId: String(c.id ?? ''),
      name: String(c.name ?? ''),
      setName: c.set?.name || undefined,
      setCode: c.set?.ptcgoCode || c.set?.id || undefined,
      cardNumber: c.number != null ? String(c.number) : undefined,
      rarity: c.rarity || undefined,
      imageUrl: safeImageUrl(c.images?.small),
      imageSmallUrl: safeImageUrl(c.images?.small),
      imageLargeUrl: safeImageUrl(c.images?.large),
      sourceUrl: undefined,
      marketUrl: safeImageUrl(c.tcgplayer?.url),
    })).filter(r => r.externalId && r.name);
  },
};
