import { BaseProvider, ProviderCardSearch, ProviderPriceResult, ProviderStatusInfo } from './baseProvider';

export class OptcgProvider implements BaseProvider {
  providerName = 'OPTCG';

  async searchCard(query: string): Promise<ProviderCardSearch[]> {
    const baseUrl = process.env.OPTCG_API_BASE_URL;
    if (!baseUrl) {
      return this.getMockSearch(query);
    }

    try {
      // In a real environment, we'd call the public base URL
      const res = await fetch(`${baseUrl}/cards?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP error: status ${res.status}`);
      const data = (await res.json()) as any;
      
      if (Array.isArray(data)) {
        return data.map((c: any) => ({
          game: 'One Piece',
          name: c.name || '',
          setName: c.setName || c.set || '',
          cardNumber: c.cardNumber || c.id || '',
          rarity: c.rarity || '',
          imageUrl: c.imageUrl || c.image || undefined,
        }));
      }
      return this.getMockSearch(query);
    } catch (err: any) {
      console.warn('OPTCG Provider failed, falling back to mocks:', err.message);
      return this.getMockSearch(query);
    }
  }

  async getPriceByCard(card: { name: string; cardNumber: string; setName: string }): Promise<ProviderPriceResult | null> {
    // OPTCG is purely a metadata provider
    return null;
  }

  async getStatus(): Promise<ProviderStatusInfo> {
    const baseUrl = process.env.OPTCG_API_BASE_URL;
    if (!baseUrl) {
      return {
        providerName: this.providerName,
        status: 'MOCKED',
        message: 'OPTCG_API_BASE_URL not configured. Running with local mock search indexes.',
      };
    }
    return {
      providerName: this.providerName,
      status: 'AVAILABLE',
      message: `OPTCG API provider active at ${baseUrl}`,
    };
  }

  private getMockSearch(query: string): ProviderCardSearch[] {
    const q = query.toLowerCase().trim();
    const mockCards: ProviderCardSearch[] = [
      {
        game: 'One Piece',
        name: 'Shanks (Parallel)',
        setName: 'Romance Dawn',
        cardNumber: 'OP01-120',
        rarity: 'SEC',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/OP01-120.jpg',
      },
      {
        game: 'One Piece',
        name: 'Nami (Parallel)',
        setName: 'Romance Dawn',
        cardNumber: 'OP01-016',
        rarity: 'R',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/OP01-016_A1.jpg',
      },
      {
        game: 'One Piece',
        name: 'Monkey.D.Luffy',
        setName: 'Awakening of the New Era',
        cardNumber: 'OP05-119',
        rarity: 'SEC',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/OP05-119.jpg',
      },
      {
        game: 'One Piece',
        name: 'Roronoa Zoro',
        setName: 'Romance Dawn',
        cardNumber: 'OP01-025',
        rarity: 'SR',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/OP01-025.jpg',
      },
      {
        game: 'One Piece',
        name: 'Portgas.D.Ace',
        setName: 'Paramount War',
        cardNumber: 'OP02-120',
        rarity: 'SEC',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/OP02-120.jpg',
      },
      {
        game: 'One Piece',
        name: 'Uta',
        setName: 'Memorial Collection',
        cardNumber: 'EB01-003',
        rarity: 'SR',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/EB01-003.jpg',
      }
    ];

    if (!q) return mockCards;

    return mockCards.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.cardNumber.toLowerCase().includes(q) ||
        c.setName.toLowerCase().includes(q)
    );
  }
}
