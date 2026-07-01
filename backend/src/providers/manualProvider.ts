import { BaseProvider, ProviderCardSearch, ProviderPriceResult, ProviderStatusInfo } from './baseProvider';

export class ManualProvider implements BaseProvider {
  providerName = 'MANUAL';

  async searchCard(query: string): Promise<ProviderCardSearch[]> {
    // Manual provider does not maintain an external searchable directory
    return [];
  }

  async getPriceByCard(card: { name: string; cardNumber: string; setName: string }): Promise<ProviderPriceResult | null> {
    // Manual prices are created directly via user forms rather than external REST scraping
    return null;
  }

  async getStatus(): Promise<ProviderStatusInfo> {
    return {
      providerName: this.providerName,
      status: 'AVAILABLE',
      message: 'Manual price feed service active. Users can manually log reference price metrics.',
    };
  }
}
