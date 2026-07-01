import { BaseProvider, ProviderCardSearch, ProviderPriceResult, ProviderStatusInfo } from './baseProvider';

/**
 * Legacy OPTCG metadata provider (kept for compatibility with the
 * /api/providers/optcg/search endpoint and provider status checks).
 *
 * IMPORTANT: this provider no longer returns mock cards and no longer
 * invents image URLs. YGOPRODeck images must never be used for One Piece.
 * New code should use the unified card search layer in providers/cardSearch.
 */
export class OptcgProvider implements BaseProvider {
  providerName = 'OPTCG';

  async searchCard(query: string): Promise<ProviderCardSearch[]> {
    const baseUrl = process.env.OPTCG_API_BASE_URL;
    if (!baseUrl) {
      // Not configured: return no results instead of fake data.
      return [];
    }

    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/cards?search=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP error: status ${res.status}`);
      const data = (await res.json()) as unknown;

      if (Array.isArray(data)) {
        return data.map((c: any) => ({
          game: 'One Piece',
          name: c.name || '',
          setName: c.setName || c.set || '',
          cardNumber: c.cardNumber || c.id || '',
          rarity: c.rarity || '',
          // Only image URLs actually returned by the provider.
          imageUrl: typeof c.imageUrl === 'string' && /^https?:\/\//i.test(c.imageUrl)
            ? c.imageUrl
            : typeof c.image === 'string' && /^https?:\/\//i.test(c.image)
              ? c.image
              : undefined,
        }));
      }
      return [];
    } catch (err: any) {
      console.warn('[OPTCG] Provider search failed:', err?.message || err);
      return [];
    }
  }

  async getPriceByCard(_card: { name: string; cardNumber: string; setName: string }): Promise<ProviderPriceResult | null> {
    // OPTCG is purely a metadata provider
    return null;
  }

  async getStatus(): Promise<ProviderStatusInfo> {
    const baseUrl = process.env.OPTCG_API_BASE_URL;
    if (!baseUrl) {
      return {
        providerName: this.providerName,
        status: 'NOT_CONFIGURED',
        message: 'OPTCG_API_BASE_URL non configurato: ricerca automatica One Piece non disponibile. Inserimento manuale attivo.',
      };
    }
    return {
      providerName: this.providerName,
      status: 'AVAILABLE',
      message: `OPTCG API provider attivo su ${baseUrl}`,
    };
  }
}
