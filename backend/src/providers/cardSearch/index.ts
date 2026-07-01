import {
  CardSearchInput,
  CardSearchProvider,
  CardSearchResponse,
  GameKey,
} from './types';
import { pokemonProvider } from './pokemonProvider';
import { yugiohProvider } from './yugiohProvider';
import { onePieceProvider } from './onePieceProvider';
import { magicProvider } from './magicProvider';

export * from './types';

/** Game → provider registry. OTHER intentionally has no provider (manual only). */
const providersByGame: Partial<Record<GameKey, CardSearchProvider>> = {
  ONE_PIECE: onePieceProvider,
  POKEMON: pokemonProvider,
  YUGIOH: yugiohProvider,
  MAGIC: magicProvider,
};

// ------------------------------------------------------------------
// Simple in-memory cache (no external infrastructure).
// ------------------------------------------------------------------
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_MAX_ENTRIES = 200;

interface CacheEntry {
  expiresAt: number;
  response: CardSearchResponse;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(input: CardSearchInput): string {
  return `${input.game}:${input.limit}:${input.query.toLowerCase()}`;
}

function getCached(input: CardSearchInput): CardSearchResponse | null {
  const key = cacheKey(input);
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.response;
}

function setCached(input: CardSearchInput, response: CardSearchResponse): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Evict the oldest entry (Map preserves insertion order).
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(cacheKey(input), { expiresAt: Date.now() + CACHE_TTL_MS, response });
}

// ------------------------------------------------------------------
// Orchestration
// ------------------------------------------------------------------

/**
 * Runs a provider-aware card search.
 * Always resolves with a safe, user-presentable response:
 * - live results from the right provider for the game;
 * - empty results + "unavailable" status when no provider is configured;
 * - empty results + "error" status when the upstream provider fails
 *   (details are logged server-side only).
 */
export async function performCardSearch(input: CardSearchInput): Promise<CardSearchResponse> {
  const provider = providersByGame[input.game];

  if (!provider) {
    return {
      results: [],
      providerStatus: {
        provider: 'none',
        mode: 'unavailable',
        message: 'Nessuna ricerca automatica per questa categoria. Inserimento manuale disponibile.',
      },
    };
  }

  if (!provider.isConfigured()) {
    return {
      results: [],
      providerStatus: {
        provider: provider.id,
        mode: 'unavailable',
        message: provider.unavailableMessage(),
      },
    };
  }

  const cached = getCached(input);
  if (cached) {
    return cached;
  }

  try {
    const results = await provider.searchCards(input);
    const response: CardSearchResponse = {
      results,
      providerStatus: {
        provider: provider.id,
        mode: 'live',
        message: `Risultati da ${provider.label}.`,
      },
    };
    setCached(input, response);
    return response;
  } catch (err: any) {
    // Log details server-side; never expose upstream errors or tokens.
    console.error(`[cardSearch] Provider ${provider.id} failed for "${input.query}" (${input.game}):`, err?.message || err);
    return {
      results: [],
      providerStatus: {
        provider: provider.id,
        mode: 'error',
        message: 'Il provider di ricerca non ha risposto. Riprova più tardi o inserisci la carta manualmente.',
      },
    };
  }
}
