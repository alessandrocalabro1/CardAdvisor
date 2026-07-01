import { PrismaClient } from '@prisma/client';
import { calculateFairPriceRange } from '../utils/fairPrice';
import { calculateMedian } from '../utils/median';

const prisma = new PrismaClient();

/**
 * Lists price snapshots for a card, sorted chronologically.
 */
export async function getSnapshotsForCard(cardId: string) {
  return prisma.priceSnapshot.findMany({
    where: { cardId },
    orderBy: { date: 'asc' },
  });
}

/**
 * Creates a new historical snapshot entry by calculating current statistical pricing metrics.
 */
export async function createSnapshotForCard(cardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      marketPrices: true,
      snapshots: true,
      offers: true,
    },
  });

  if (!card) throw new Error('Card not found');

  const fairRange = calculateFairPriceRange(card, card.marketPrices, card.snapshots, card.offers, 'EUR');

  // Compile active price references
  const pricePoints = card.marketPrices
    .map(p => p.rawPrice ?? p.averagePrice ?? p.trendPrice ?? null)
    .filter((v): v is number => v !== null);

  const minPrice = pricePoints.length > 0 ? Math.min(...pricePoints) : null;
  const maxPrice = pricePoints.length > 0 ? Math.max(...pricePoints) : null;
  const averagePrice = pricePoints.length > 0 ? pricePoints.reduce((a, b) => a + b, 0) / pricePoints.length : null;
  const medianPrice = pricePoints.length > 0 ? calculateMedian(pricePoints) : null;

  const confidenceScore = fairRange.confidence === 'HIGH' ? 0.9 : fairRange.confidence === 'MEDIUM' ? 0.7 : 0.4;

  return prisma.priceSnapshot.create({
    data: {
      cardId,
      date: new Date(),
      source: 'AGGREGATED',
      minPrice,
      maxPrice,
      averagePrice,
      medianPrice,
      fairLow: fairRange.fairLow,
      fairHigh: fairRange.fairHigh,
      listingOrSampleCount: card.marketPrices.length,
      confidenceAvg: confidenceScore,
    },
  });
}
