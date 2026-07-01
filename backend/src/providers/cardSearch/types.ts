/**
 * Shared types for the unified card-search provider layer.
 * Each TCG has its own adapter; the registry in index.ts picks the
 * right one based on the requested game key.
 */

export type GameKey = 'ONE_PIECE' | 'POKEMON' | 'YUGIOH' | 'MAGIC' | 'OTHER';

export const GAME_KEYS: GameKey[] = ['ONE_PIECE', 'POKEMON', 'YUGIOH', 'MAGIC', 'OTHER'];

export function isGameKey(value: unknown): value is GameKey {
  return typeof value === 'string' && (GAME_KEYS as string[]).includes(value);
}

export interface CardSearchInput {
  query: string;
  game: GameKey;
  limit: number;
}

export interface CardSearchResult {
  provider: string;
  game: GameKey;
  externalId: string;
  name: string;
  setName?: string;
  setCode?: string;
  cardNumber?: string;
  rarity?: string;
  imageUrl?: string;
  imageSmallUrl?: string;
  imageLargeUrl?: string;
  sourceUrl?: string;
  marketUrl?: string;
  raw?: unknown;
}

export type ProviderSearchMode = 'live' | 'unavailable' | 'error';

export interface ProviderSearchStatus {
  provider: string;
  mode: ProviderSearchMode;
  message: string;
}

export interface CardSearchProvider {
  id: string;
  label: string;
  supportedGames: GameKey[];
  /** False when required configuration (e.g. base URL) is missing. */
  isConfigured(): boolean;
  /** Message shown to the user when the provider is not configured. */
  unavailableMessage(): string;
  searchCards(input: CardSearchInput): Promise<CardSearchResult[]>;
}

export interface CardSearchResponse {
  results: CardSearchResult[];
  providerStatus: ProviderSearchStatus;
}

/** Accept only well-formed http(s) image URLs coming from provider payloads. */
export function safeImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  return trimmed;
}
