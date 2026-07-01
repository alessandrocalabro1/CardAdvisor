import { BaseProvider, ProviderCardSearch, ProviderPriceResult, ProviderStatusInfo } from './baseProvider';

export class JustTcgProvider implements BaseProvider {
  providerName = 'JUSTTCG';

  async searchCard(query: string): Promise<ProviderCardSearch[]> {
    const apiKey = process.env.JUSTTCG_API_KEY;
    if (!apiKey) return [];

    try {
      const url = `https://api.justtcg.com/v1/cards?search=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`JustTCG API returned status ${res.status}`);
      const data = (await res.json()) as any;

      if (Array.isArray(data)) {
        return data.map((c: any) => ({
          game: 'One Piece',
          name: c.name || '',
          setName: c.setName || '',
          cardNumber: c.cardNumber || '',
          rarity: c.rarity || '',
        }));
      }
      return [];
    } catch (err: any) {
      console.error('JustTCG card search failed:', err.message);
      return [];
    }
  }

  async getPriceByCard(card: { name: string; cardNumber: string; setName: string }): Promise<ProviderPriceResult | null> {
    const apiKey = process.env.JUSTTCG_API_KEY;
    if (!apiKey) return null;

    try {
      const url = `https://api.justtcg.com/v1/prices/${encodeURIComponent(card.cardNumber)}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`JustTCG API price lookup failed: status ${res.status}`);
      const data = (await res.json()) as any;

      if (data) {
        return {
          source: this.providerName,
          rawPrice: data.marketPrice || data.price || undefined,
          lowPrice: data.lowPrice || undefined,
          trendPrice: data.trendPrice || undefined,
          currency: data.currency || 'USD',
          confidenceScore: 0.8,
          rawPayload: data,
        };
      }
      return null;
    } catch (err: any) {
      console.error('JustTCG price retrieval failed:', err.message);
      return null;
    }
  }

  async getStatus(): Promise<ProviderStatusInfo> {
    const apiKey = process.env.JUSTTCG_API_KEY;
    if (!apiKey) {
      return {
        providerName: this.providerName,
        status: 'NOT_CONFIGURED',
        message: 'JUSTTCG_API_KEY is not defined in environment variables.',
      };
    }
    return {
      providerName: this.providerName,
      status: 'AVAILABLE',
      message: 'JustTCG pricing API configured and active.',
    };
  }
}
