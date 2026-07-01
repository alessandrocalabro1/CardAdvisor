import { PrismaClient } from '@prisma/client';
import { getAllProviders } from './providerStatusService';

const prisma = new PrismaClient();

/**
 * Retrieves all market price data recorded for a specific card.
 */
export async function getMarketPricesForCard(cardId: string) {
  return prisma.marketPrice.findMany({
    where: { cardId },
    orderBy: { lastUpdated: 'desc' },
  });
}

/**
 * Manually logs a custom pricing reference point for a card.
 */
export async function createManualMarketPrice(
  cardId: string,
  data: {
    rawPrice?: number;
    gradedPrice?: number;
    lowPrice?: number;
    trendPrice?: number;
    averagePrice?: number;
    currency: string;
    condition?: string;
    language?: string;
  }
) {
  return prisma.marketPrice.create({
    data: {
      cardId,
      source: 'MANUAL',
      rawPrice: data.rawPrice ?? null,
      gradedPrice: data.gradedPrice ?? null,
      lowPrice: data.lowPrice ?? null,
      trendPrice: data.trendPrice ?? null,
      averagePrice: data.averagePrice ?? null,
      currency: data.currency,
      condition: data.condition || null,
      language: data.language || null,
      confidenceScore: 0.7, // Manual data has a lower default confidence weight
      lastUpdated: new Date(),
      dataQuality: 'MANUAL',
      providerMode: 'MANUAL',
      isMock: false,
      isSeedData: false,
      explanation: 'Manually logged reference price.',
    },
  });
}

/**
 * Triggers on-demand price refresh across all active/mocked/configured pricing providers,
 * adding new pricing record entries to the database.
 */
export async function refreshPricesForCard(cardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
  });

  if (!card) throw new Error('Card not found');

  const providers = getAllProviders();
  const newPrices = [];

  for (const provider of providers) {
    if (provider.providerName === 'MANUAL') continue;

    try {
      const status = await provider.getStatus();
      // Skip if provider is not configured
      if (status.status === 'NOT_CONFIGURED') {
        continue;
      }

      const result = await provider.getPriceByCard({
        name: card.name,
        cardNumber: card.cardNumber,
        setName: card.setName,
      });

      if (result) {
        const created = await prisma.marketPrice.create({
          data: {
            cardId,
            source: provider.providerName,
            rawPrice: result.rawPrice ?? null,
            gradedPrice: result.gradedPrice ?? null,
            lowPrice: result.lowPrice ?? null,
            trendPrice: result.trendPrice ?? null,
            averagePrice: result.averagePrice ?? null,
            currency: result.currency,
            sourceProductId: result.sourceProductId || null,
            productUrl: result.productUrl || null,
            confidenceScore: result.confidenceScore,
            rawPayloadJson: result.rawPayload ? JSON.stringify(result.rawPayload) : null,
            lastUpdated: new Date(),
            dataQuality: result.dataQuality || 'REAL_PROVIDER',
            providerMode: result.providerMode || 'LIVE',
            isMock: result.isMock || false,
            isSeedData: result.isSeedData || false,
            explanation: result.explanation || null,
          },
        });
        newPrices.push(created);
      }
    } catch (err: any) {
      console.warn(`Price refresh fail for provider [${provider.providerName}] on card [${card.name}]:`, err.message);
    }
  }

  return newPrices;
}
