export interface ProviderCardSearch {
  game: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  imageUrl?: string;
}

export interface ProviderPriceResult {
  source: string;
  rawPrice?: number;
  gradedPrice?: number;
  lowPrice?: number;
  trendPrice?: number;
  averagePrice?: number;
  medianPrice?: number;
  currency: string;
  productUrl?: string;
  sourceProductId?: string;
  confidenceScore: number;
  rawPayload?: any;
  
  // Data transparency fields
  dataQuality?: string;
  isMock?: boolean;
  isSeedData?: boolean;
  providerMode?: string;
  explanation?: string;
}

export interface ProviderStatusInfo {
  providerName: string;
  status: 'AVAILABLE' | 'NOT_CONFIGURED' | 'ERROR' | 'MOCKED';
  message: string;
}

export interface BaseProvider {
  providerName: string;
  searchCard(query: string): Promise<ProviderCardSearch[]>;
  getPriceByCard(card: { name: string; cardNumber: string; setName: string }): Promise<ProviderPriceResult | null>;
  getStatus(): Promise<ProviderStatusInfo>;
}
