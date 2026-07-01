import * as fs from 'fs';
import * as path from 'path';
import { BaseProvider, ProviderCardSearch, ProviderPriceResult, ProviderStatusInfo } from './baseProvider';

export class CardmarketExportProvider implements BaseProvider {
  providerName = 'CARDMARKET_EXPORT';

  private getCsvPath(): string {
    // If a custom env path is defined, use it. Otherwise, look for sample file in workspace.
    if (process.env.CARDMARKET_EXPORT_PATH) {
      return path.resolve(process.env.CARDMARKET_EXPORT_PATH);
    }
    return path.join(__dirname, '../../../sample-data/cardmarket-prices-sample.csv');
  }

  async searchCard(query: string): Promise<ProviderCardSearch[]> {
    const prices = this.parseCsv();
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const matches = prices.filter(
      p => p.cardName.toLowerCase().includes(q) || p.cardNumber.toLowerCase().includes(q)
    );

    // Remove duplicates
    const unique = new Map<string, ProviderCardSearch>();
    for (const m of matches) {
      const key = m.cardNumber.toUpperCase();
      if (!unique.has(key)) {
        unique.set(key, {
          game: m.game,
          name: m.cardName,
          setName: m.setName,
          cardNumber: m.cardNumber,
          rarity: m.rarity,
        });
      }
    }

    return Array.from(unique.values());
  }

  async getPriceByCard(card: { name: string; cardNumber: string; setName: string }): Promise<ProviderPriceResult | null> {
    const prices = this.parseCsv();
    const found = prices.find(p => p.cardNumber.toUpperCase() === card.cardNumber.toUpperCase());
    if (!found) return null;

    return {
      source: this.providerName,
      rawPrice: found.avgPrice ?? found.trendPrice ?? found.minPrice ?? undefined,
      lowPrice: found.minPrice ?? undefined,
      trendPrice: found.trendPrice ?? undefined,
      averagePrice: found.avgPrice ?? undefined,
      currency: 'EUR',
      sourceProductId: found.productId,
      confidenceScore: 0.9,
      rawPayload: found,
      dataQuality: 'PUBLIC_EXPORT',
      providerMode: 'EXPORT',
      explanation: 'Parsed from Cardmarket public export sheet.',
    };
  }

  async getStatus(): Promise<ProviderStatusInfo> {
    const csvPath = this.getCsvPath();
    if (!fs.existsSync(csvPath)) {
      return {
        providerName: this.providerName,
        status: 'NOT_CONFIGURED',
        message: `Cardmarket export file not found at path: ${csvPath}`,
      };
    }
    return {
      providerName: this.providerName,
      status: 'AVAILABLE',
      message: `Cardmarket export parser active. Processing: ${path.basename(csvPath)}`,
    };
  }

  private parseCsv() {
    const csvPath = this.getCsvPath();
    if (!fs.existsSync(csvPath)) return [];

    try {
      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split(/\r?\n/);
      if (lines.length <= 1) return [];

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const records = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells: string[] = [];
        let inQuotes = false;
        let cellBuffer = '';
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(cellBuffer.trim());
            cellBuffer = '';
          } else {
            cellBuffer += char;
          }
        }
        cells.push(cellBuffer.trim());

        if (cells.length < headers.length) continue;

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = cells[index]?.replace(/^"|"$/g, '') || '';
        });

        records.push({
          productId: row['Cardmarket Product ID'] || '',
          game: row['Game'] || 'One Piece',
          cardName: row['Card Name'] || '',
          setName: row['Set Name'] || '',
          cardNumber: row['Card Number'] || '',
          rarity: row['Rarity'] || '',
          language: row['Language'] || 'English',
          condition: row['Condition'] || 'Near Mint',
          minPrice: row['Min Price'] ? parseFloat(row['Min Price']) : null,
          trendPrice: row['TrendPrice'] ? parseFloat(row['TrendPrice']) : null,
          avgPrice: row['Avg Price'] ? parseFloat(row['Avg Price']) : null,
          lastUpdated: row['Last Updated'] || '',
        });
      }

      return records;
    } catch (err) {
      console.error('Error parsing Cardmarket export CSV:', err);
      return [];
    }
  }
}
