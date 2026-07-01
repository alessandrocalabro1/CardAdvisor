import { BaseProvider, ProviderCardSearch, ProviderPriceResult, ProviderStatusInfo } from './baseProvider';

export class PriceChartingProvider implements BaseProvider {
  providerName = 'PRICECHARTING';

  async searchCard(query: string): Promise<ProviderCardSearch[]> {
    const token = process.env.PRICECHARTING_API_TOKEN;
    if (!token) return [];

    try {
      // Real endpoint querying using token
      const url = `https://www.pricecharting.com/api/products?t=${token}&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`PriceCharting API error: HTTP ${res.status}`);
      const data = (await res.json()) as any;

      if (data && Array.isArray(data.products)) {
        return data.products.map((p: any) => ({
          game: 'One Piece',
          name: p['product-name'] || p.name || '',
          setName: p['console-name'] || p.setName || '',
          cardNumber: p['card-number'] || '',
          rarity: p.rarity || '',
        }));
      }
      return [];
    } catch (err: any) {
      console.error('PriceCharting search execution failed:', err.message);
      return [];
    }
  }

  async getPriceByCard(card: { name: string; cardNumber: string; setName: string }): Promise<ProviderPriceResult | null> {
    const token = process.env.PRICECHARTING_API_TOKEN;
    if (!token) return null;

    try {
      const queryStr = `${card.setName} ${card.name} ${card.cardNumber}`;
      const url = `https://www.pricecharting.com/api/product?t=${token}&q=${encodeURIComponent(queryStr)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`PriceCharting API price check error: HTTP ${res.status}`);
      const data = (await res.json()) as any;

      if (data) {
        // PriceCharting values are typically stored as integers in cents
        const rawPriceCents = data['price-raw'] || data['loose-price'];
        const gradedPriceCents = data['price-graded-10'] || data['graded-price'];
        
        const rawPrice = rawPriceCents ? parseFloat(rawPriceCents) / 100 : null;
        const gradedPrice = gradedPriceCents ? parseFloat(gradedPriceCents) / 100 : null;

        return {
          source: this.providerName,
          rawPrice: rawPrice ?? undefined,
          gradedPrice: gradedPrice ?? undefined,
          averagePrice: rawPrice ?? undefined,
          currency: 'USD',
          sourceProductId: String(data.id || ''),
          confidenceScore: 0.85,
          rawPayload: data,
          dataQuality: 'AGGREGATED_PROVIDER',
          providerMode: 'LIVE',
          explanation: 'Aggregated PriceCharting market price. This is not a raw eBay sold transaction log.',
        };
      }
      return null;
    } catch (err: any) {
      console.error('PriceCharting price lookup failed:', err.message);
      return null;
    }
  }

  async getStatus(): Promise<ProviderStatusInfo> {
    const token = process.env.PRICECHARTING_API_TOKEN;
    if (!token) {
      return {
        providerName: this.providerName,
        status: 'NOT_CONFIGURED',
        message: 'PRICECHARTING_API_TOKEN is missing in environment files.',
      };
    }
    return {
      providerName: this.providerName,
      status: 'AVAILABLE',
      message: 'PriceCharting API provider configured with token.',
    };
  }
}
